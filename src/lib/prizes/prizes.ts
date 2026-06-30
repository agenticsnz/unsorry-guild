import { createClient } from '@/lib/supabase/server'
import {
  FALLBACK_PRIZES,
  getFallbackPrize,
  isSeasonOpen,
  isSupabaseConfigured,
  listFallbackPrizes,
  type PrizeConfig,
  type SeasonState,
} from './config'

export type Prize = PrizeConfig

interface PrizeRow {
  id: string
  domain_id: string
  headline_goal_id: string
  title: string
  description: string | null
  badge_emoji: string | null
  status: 'active' | 'closed'
}

function fromRow(r: PrizeRow): Prize {
  return {
    id: r.id,
    domainId: r.domain_id,
    headlineGoalId: r.headline_goal_id,
    title: r.title,
    description: r.description ?? '',
    badgeEmoji: r.badge_emoji ?? '🏅',
    status: r.status,
  }
}

/** Prizes for a domain — from Supabase when configured, else the in-repo config. */
export async function getPrizes(domainId: string): Promise<Prize[]> {
  if (!isSupabaseConfigured()) return listFallbackPrizes(domainId)
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('prizes').select('*').eq('domain_id', domainId)
    if (error || !data || data.length === 0) return listFallbackPrizes(domainId)
    return (data as PrizeRow[]).map(fromRow)
  } catch {
    return listFallbackPrizes(domainId)
  }
}

/** A single prize by its headline goal id (the git join key). */
export async function getPrize(headlineGoalId: string): Promise<Prize | null> {
  if (!isSupabaseConfigured()) return getFallbackPrize(headlineGoalId)
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('prizes')
      .select('*')
      .eq('headline_goal_id', headlineGoalId)
      .maybeSingle()
    if (error || !data) return getFallbackPrize(headlineGoalId)
    return fromRow(data as PrizeRow)
  } catch {
    return getFallbackPrize(headlineGoalId)
  }
}

/**
 * Latest season per prize, in one query, for the admin to see season state and
 * branch the open-vs-close action. Empty map when Supabase is unconfigured (the
 * admin then can't write — the page warns about that separately).
 */
export async function getLatestSeasons(prizeIds: string[]): Promise<Map<string, SeasonState>> {
  const map = new Map<string, SeasonState>()
  if (!isSupabaseConfigured() || prizeIds.length === 0) return map
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('prize_seasons')
      .select('prize_id, opened_at, closed_at')
      .in('prize_id', prizeIds)
      .order('opened_at', { ascending: false })
    if (error || !data) return map
    for (const r of data as { prize_id: string; opened_at: string | null; closed_at: string | null }[]) {
      // rows are newest-first, so the first seen per prize is the latest season.
      if (!map.has(r.prize_id)) map.set(r.prize_id, { openedAt: r.opened_at, closedAt: r.closed_at })
    }
    return map
  } catch {
    return map
  }
}

export { FALLBACK_PRIZES, isSupabaseConfigured, isSeasonOpen, type SeasonState }
