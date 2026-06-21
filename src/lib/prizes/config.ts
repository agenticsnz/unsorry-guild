export type PrizeStatus = 'active' | 'closed'

export interface PrizeConfig {
  id: string
  domainId: string
  headlineGoalId: string
  title: string
  description: string
  badgeEmoji: string
  status: PrizeStatus
}

/**
 * In-repo prize config, used when Supabase is not configured. The app must build
 * and demo without a database (ADR-015 / ADR-018), so prize definitions have a
 * typed in-repo default that mirrors migration 204. This is real config — not a
 * stub — and is the source of prizes until the Supabase overlay is provisioned.
 */
export const FALLBACK_PRIZES: PrizeConfig[] = [
  {
    id: 'sq-add-sq-eq-three-mul-sq',
    domainId: 'math',
    headlineGoalId: 'sq-add-sq-eq-three-mul-sq',
    title: 'Sum of Two Squares = 3·Square',
    description: 'Prove sq-add-sq-eq-three-mul-sq together with its full decomposition tree.',
    badgeEmoji: '🟦',
    status: 'active',
  },
]

export function listFallbackPrizes(domainId: string): PrizeConfig[] {
  return FALLBACK_PRIZES.filter((p) => p.domainId === domainId)
}

export function getFallbackPrize(headlineGoalId: string): PrizeConfig | null {
  return FALLBACK_PRIZES.find((p) => p.headlineGoalId === headlineGoalId) ?? null
}

/** True when a real Supabase project is wired (not the build-time placeholder). */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  return !!url && !url.includes('placeholder') && url.startsWith('http')
}
