import { describe, it, expect } from 'vitest'
import { proofsOverTimeSvg, leaderboardBarSvg } from '@/lib/og/chart-svg'
import type { TimelinePoint } from '@/lib/unsorry/types'

describe('proofsOverTimeSvg', () => {
  const series: TimelinePoint[] = [
    { t: '2026-06-01', proofs: 2, cumulative_proofs: 2 },
    { t: '2026-06-02', proofs: 3, cumulative_proofs: 5 },
  ]
  it('emits an svg with area + line paths', () => {
    const svg = proofsOverTimeSvg(series, 800, 300)
    expect(svg.startsWith('<svg')).toBe(true)
    expect(svg).toContain('viewBox="0 0 800 300"')
    expect((svg.match(/<path/g) || []).length).toBe(2)
  })
  it('renders an empty-state label with no series', () => {
    expect(proofsOverTimeSvg([])).toContain('No timeline data')
  })
})

describe('leaderboardBarSvg', () => {
  it('renders one bar per datum and escapes labels', () => {
    const svg = leaderboardBarSvg([
      { label: 'alice & co', value: 100 },
      { label: 'bob', value: 50 },
    ])
    expect((svg.match(/<rect/g) || []).length).toBe(2)
    expect(svg).toContain('alice &amp; co')
  })
  it('handles empty input', () => {
    expect(leaderboardBarSvg([])).toContain('No data')
  })
})
