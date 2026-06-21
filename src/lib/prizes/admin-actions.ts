'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { fetchGoalEffort } from '@/lib/unsorry/fetchers'
import { buildGoalSolverMap } from '@/lib/unsorry/attribution'
import { computeTargetLeaderboard } from '@/lib/unsorry/target-leaderboard'
import { computeTargetProgress } from '@/lib/unsorry/subtree'
import { derivePodiumAwards } from './awards'

/**
 * Admin prize actions. RLS (is_gm) + middleware gate writes to admin/gm; these
 * run as the authenticated admin's session via the SSR Supabase client.
 */

export async function createPrizeAction(formData: FormData) {
  const headlineGoalId = String(formData.get('headlineGoalId') ?? '').trim()
  const title = String(formData.get('title') ?? '').trim()
  if (!headlineGoalId || !title) return

  const supabase = await createClient()
  await supabase.from('prizes').insert({
    domain_id: 'math',
    headline_goal_id: headlineGoalId,
    title,
    description: String(formData.get('description') ?? '').trim() || null,
    badge_emoji: String(formData.get('badgeEmoji') ?? '').trim() || '🏅',
    status: 'active',
  })
  revalidatePath('/gm/prizes')
  revalidatePath('/math/prizes')
}

export async function openSeasonAction(formData: FormData) {
  const prizeId = String(formData.get('prizeId') ?? '')
  if (!prizeId) return
  const supabase = await createClient()
  await supabase.from('prize_seasons').insert({ prize_id: prizeId })
  revalidatePath('/gm/prizes')
}

export async function closeAndAwardAction(formData: FormData) {
  const prizeId = String(formData.get('prizeId') ?? '')
  const headlineGoalId = String(formData.get('headlineGoalId') ?? '')
  if (!prizeId || !headlineGoalId) return

  const supabase = await createClient()
  const { data: season } = await supabase
    .from('prize_seasons')
    .select('id')
    .eq('prize_id', prizeId)
    .is('closed_at', null)
    .order('opened_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!season) return

  const [goalEffort, solverMap] = await Promise.all([fetchGoalEffort(), buildGoalSolverMap()])
  const board = computeTargetLeaderboard(headlineGoalId, goalEffort, solverMap)
  const progress = computeTargetProgress(headlineGoalId, goalEffort)
  const awards = derivePodiumAwards(board).map((a) => ({
    season_id: season.id,
    github: a.github,
    place: a.place,
    is_contributor: a.isContributor,
  }))

  if (awards.length > 0) {
    await supabase.from('prize_awards').upsert(awards, { onConflict: 'season_id,github' })
  }
  await supabase
    .from('prize_seasons')
    .update({ closed_at: new Date().toISOString(), headline_status_at_close: progress.headlineStatus })
    .eq('id', season.id)
  await supabase.from('prizes').update({ status: 'closed' }).eq('id', prizeId)

  revalidatePath('/gm/prizes')
  revalidatePath('/math/prizes')
}
