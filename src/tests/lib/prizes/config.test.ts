import { describe, it, expect } from 'vitest'
import { FALLBACK_PRIZES, getFallbackPrize, listFallbackPrizes } from '@/lib/prizes/config'

describe('prize config fallback', () => {
  it('exposes the seeded sq-add-sq prize under the math domain', () => {
    expect(listFallbackPrizes('math').map((p) => p.headlineGoalId)).toContain(
      'sq-add-sq-eq-three-mul-sq',
    )
    expect(listFallbackPrizes('nonexistent')).toEqual([])
  })

  it('looks up a prize by headline goal id', () => {
    expect(getFallbackPrize('sq-add-sq-eq-three-mul-sq')?.status).toBe('active')
    expect(getFallbackPrize('nope')).toBeNull()
  })

  it('uses the headline goal id as the prize id (git join key)', () => {
    for (const p of FALLBACK_PRIZES) expect(p.headlineGoalId).toBe(p.id)
  })
})
