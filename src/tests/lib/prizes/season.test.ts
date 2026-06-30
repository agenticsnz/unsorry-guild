import { describe, it, expect } from 'vitest'
import { isSeasonOpen } from '@/lib/prizes/prizes'

describe('isSeasonOpen', () => {
  it('is false when there is no season', () => {
    expect(isSeasonOpen(null)).toBe(false)
    expect(isSeasonOpen(undefined)).toBe(false)
  })

  it('is true for an opened, not-yet-closed season', () => {
    expect(isSeasonOpen({ openedAt: '2026-06-30T00:00:00Z', closedAt: null })).toBe(true)
  })

  it('is false once the season is closed', () => {
    expect(
      isSeasonOpen({ openedAt: '2026-06-29T00:00:00Z', closedAt: '2026-06-30T00:00:00Z' }),
    ).toBe(false)
  })
})
