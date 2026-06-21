'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { fetchGoalEffort } from '@/lib/unsorry/fetchers'
import { buildGoalSolverMap } from '@/lib/unsorry/attribution'
import { computeTargetLeaderboard } from '@/lib/unsorry/target-leaderboard'
import { computeTargetProgress } from '@/lib/unsorry/subtree'
import { derivePodiumAwards } from './awards'

/**
 * Admin prize actions. RLS (is_gm) + middleware gate these to admin/gm; they run
 * as the authenticated admin via the SSR Supabase client.
 *
 * The repo's hand-maintained Database types predate supabase-js's stricter write
 * typing, so (as elsewhere in src/lib/actions/*) we cast the builder + payload.
 */
type ServerClient = Awaited<ReturnType<typeof createClient>>
function table(supabase: ServerClient, name: string) {
  return (supabase.from as (t: string) => ReturnType<ServerClient['from']>)(name)
}

export async function createPrizeAction(formData: FormData) {
  const headlineGoalId = String(formData.get('headlineGoalId') ?? '').trim()
  const title = String(formData.get('title') ?? '').trim()
  if (!headlineGoalId || !title) return

  const supabase = await createClient()
  await table(supabase, 'prizes').insert({
    domain_id: 'math',
    headline_goal_id: headlineGoalId,
    title,
    description: String(formData.get('description') ?? '').trim() || null,
    badge_emoji: String(formData.get('badgeEmoji') ?? '').trim() || '🏅',
    status: 'active',
  } as Record<string, unknown>)

  revalidatePath('/gm/prizes')
  revalidatePath('/math/prizes')
}

export async function openSeasonAction(formData: FormData) {
  const prizeId = String(formData.get('prizeId') ?? '')
  if (!prizeId) return

  const supabase = await createClient()
  await table(supabase, 'prize_seasons').insert({ prize_id: prizeId } as Record<string, unknown>)
  revalidatePath('/gm/prizes')
}

export async function closeAndAwardAction(formData: FormData) {
  const prizeId = String(formData.get('prizeId') ?? '')
  const headlineGoalId = String(formData.get('headlineGoalId') ?? '')
  if (!prizeId || !headlineGoalId) return

  const supabase = await createClient()
  const { data: seasonRow } = await table(supabase, 'prize_seasons')
    .select('id')
    .eq('prize_id', prizeId)
    .is('closed_at', null)
    .order('opened_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  const seasonId = (seasonRow as { id: string } | null)?.id
  if (!seasonId) return

  const [goalEffort, solverMap] = await Promise.all([fetchGoalEffort(), buildGoalSolverMap()])
  const board = computeTargetLeaderboard(headlineGoalId, goalEffort, solverMap)
  const progress = computeTargetProgress(headlineGoalId, goalEffort)
  const awards = derivePodiumAwards(board).map((a) => ({
    season_id: seasonId,
    github: a.github,
    place: a.place,
    is_contributor: a.isContributor,
  }))

  if (awards.length > 0) {
    await table(supabase, 'prize_awards').upsert(awards as Record<string, unknown>[], {
      onConflict: 'season_id,github',
    })
  }
  await table(supabase, 'prize_seasons')
    .update({
      closed_at: new Date().toISOString(),
      headline_status_at_close: progress.headlineStatus,
    } as Record<string, unknown>)
    .eq('id', seasonId)
  await table(supabase, 'prizes')
    .update({ status: 'closed' } as Record<string, unknown>)
    .eq('id', prizeId)

  revalidatePath('/gm/prizes')
  revalidatePath('/math/prizes')
}
