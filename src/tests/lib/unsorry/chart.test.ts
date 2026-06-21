import { describe, it, expect } from 'vitest'
import { buildAreaChart } from '@/lib/unsorry/chart'
import { TIMELINES_FIXTURE } from '@/tests/mocks/unsorry-fixtures'

describe('buildAreaChart', () => {
  it('builds line + closed area paths scaled to the max cumulative', () => {
    const c = buildAreaChart(TIMELINES_FIXTURE.merge, 720, 200)
    expect(c.max).toBe(2027)
    expect(c.points).toHaveLength(3)
    expect(c.linePath.startsWith('M')).toBe(true)
    expect(c.areaPath.trimEnd().endsWith('Z')).toBe(true)
    // first point is at the left edge; last near the right edge
    expect(c.points[0].x).toBeLessThan(c.points[2].x)
    // larger cumulative => higher on screen => smaller y
    expect(c.points[2].y).toBeLessThan(c.points[0].y)
  })

  it('handles an empty series', () => {
    const c = buildAreaChart([], 720, 200)
    expect(c.linePath).toBe('')
    expect(c.points).toHaveLength(0)
  })
})
