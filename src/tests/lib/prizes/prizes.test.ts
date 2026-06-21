import { describe, it, expect, vi, afterEach } from 'vitest'
import { getPrize, getPrizes } from '@/lib/prizes/prizes'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('prize data access (no Supabase configured)', () => {
  it('lists fallback prizes for a domain', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')
    const prizes = await getPrizes('math')
    expect(prizes.map((p) => p.headlineGoalId)).toContain('sq-add-sq-eq-three-mul-sq')
  })

  it('gets a single fallback prize by headline goal id', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://placeholder.supabase.co')
    const prize = await getPrize('sq-add-sq-eq-three-mul-sq')
    expect(prize?.title).toMatch(/Sum of Two Squares/)
    expect(await getPrize('does-not-exist')).toBeNull()
  })
})
