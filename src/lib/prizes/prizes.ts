import { createClient } from '@/lib/supabase/server'
import {
  FALLBACK_PRIZES,
  getFallbackPrize,
  isSupabaseConfigured,
  listFallbackPrizes,
  type PrizeConfig,
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

export { FALLBACK_PRIZES }
