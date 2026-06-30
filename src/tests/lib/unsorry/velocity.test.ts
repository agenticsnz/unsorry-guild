import { describe, it, expect } from 'vitest'
import { proofVelocity } from '@/lib/unsorry/velocity'
import type { TimelinePoint } from '@/lib/unsorry/types'

const pt = (t: string, proofs: number): TimelinePoint => ({ t, proofs, cumulative_proofs: 0 })
const NOW = new Date('2026-06-30T12:00:00Z')

describe('proofVelocity', () => {
  it('sums proofs within the 24 h and 7 d windows', () => {
    const merge = [
      pt('2026-06-30T06:00:00Z', 5), // 6 h ago → both windows
      pt('2026-06-29T18:00:00Z', 3), // 18 h ago → both windows
      pt('2026-06-25T12:00:00Z', 7), // 5 d ago → 7 d only
      pt('2026-06-10T12:00:00Z', 99), // 20 d ago → neither
    ]
    expect(proofVelocity(merge, NOW)).toEqual({ last24h: 8, last7d: 15 })
  })

  it('ignores future-dated and unparseable buckets', () => {
    const merge = [
      pt('2026-06-30T06:00:00Z', 4),
      pt('2026-07-01T00:00:00Z', 100), // future
      pt('not-a-date', 100),
    ]
    expect(proofVelocity(merge, NOW)).toEqual({ last24h: 4, last7d: 4 })
  })

  it('returns zeros for an empty timeline', () => {
    expect(proofVelocity([], NOW)).toEqual({ last24h: 0, last7d: 0 })
  })

  it('counts a bucket exactly 24 h old as within the day window', () => {
    expect(proofVelocity([pt('2026-06-29T12:00:00Z', 2)], NOW)).toEqual({ last24h: 2, last7d: 2 })
  })
})
