import { describe, it, expect } from 'vitest'
import {
  proofsOverTimeCombo,
  fillTimelineGaps,
  leaderboardBarSeries,
  sourcingBarSeries,
  modelBarSeries,
} from '@/lib/unsorry/chart-data'
import type {
  GuildLeaderboardEntry,
  ModelStat,
  SourcingEntry,
  TimelinePoint,
} from '@/lib/unsorry/types'

describe('proofsOverTimeCombo', () => {
  it('keeps hourly (merge-basis) points and labels each with date + hour', () => {
    // The merge basis is bucketed hourly upstream. We keep one bar per hour (ADR-030)
    // but label with the hour, so the latest still-filling hour reads as an hour —
    // not the whole day (the original ADR-028/029 misread). Per-period/cumulative
    // pass straight through.
    const series: TimelinePoint[] = [
      { t: '2026-06-22T00:00:00Z', proofs: 24, cumulative_proofs: 2555 },
      { t: '2026-06-22T03:00:00Z', proofs: 14, cumulative_proofs: 2593 },
      { t: '2026-06-22T04:00:00Z', proofs: 1, cumulative_proofs: 2594 },
    ]
    expect(proofsOverTimeCombo(series)).toEqual({
      labels: ['2026-06-22 00:00', '2026-06-22 03:00', '2026-06-22 04:00'],
      proofs: [24, 14, 1],
      cumulative: [2555, 2593, 2594],
    })
  })

  it('labels date-only (solve-basis) points with just the date', () => {
    const series: TimelinePoint[] = [
      { t: '2026-06-19', proofs: 1436, cumulative_proofs: 2587 },
      { t: '2026-06-20', proofs: 7, cumulative_proofs: 2594 },
    ]
    expect(proofsOverTimeCombo(series)).toEqual({
      labels: ['2026-06-19', '2026-06-20'],
      proofs: [1436, 7],
      cumulative: [2587, 2594],
    })
  })

  it('handles an empty series', () => {
    expect(proofsOverTimeCombo([])).toEqual({ labels: [], proofs: [], cumulative: [] })
  })
})

describe('fillTimelineGaps', () => {
  it('inserts zero-proof hourly buckets across a gap, holding cumulative flat', () => {
    const series: TimelinePoint[] = [
      { t: '2026-06-26T15:00:00Z', proofs: 20, cumulative_proofs: 4620 },
      { t: '2026-06-26T18:00:00Z', proofs: 32, cumulative_proofs: 4652 },
    ]
    expect(fillTimelineGaps(series)).toEqual([
      { t: '2026-06-26T15:00:00Z', proofs: 20, cumulative_proofs: 4620 },
      { t: '2026-06-26T16:00:00Z', proofs: 0, cumulative_proofs: 4620 },
      { t: '2026-06-26T17:00:00Z', proofs: 0, cumulative_proofs: 4620 },
      { t: '2026-06-26T18:00:00Z', proofs: 32, cumulative_proofs: 4652 },
    ])
  })

  it('inserts zero-proof daily buckets on the solve basis', () => {
    const series: TimelinePoint[] = [
      { t: '2026-06-26', proofs: 5, cumulative_proofs: 100 },
      { t: '2026-06-29', proofs: 8, cumulative_proofs: 108 },
    ]
    expect(fillTimelineGaps(series).map((p) => [p.t, p.proofs])).toEqual([
      ['2026-06-26', 5],
      ['2026-06-27', 0],
      ['2026-06-28', 0],
      ['2026-06-29', 8],
    ])
  })

  it('is a no-op for contiguous buckets and for <2 points', () => {
    const contiguous: TimelinePoint[] = [
      { t: '2026-06-26T15:00:00Z', proofs: 1, cumulative_proofs: 1 },
      { t: '2026-06-26T16:00:00Z', proofs: 2, cumulative_proofs: 3 },
    ]
    expect(fillTimelineGaps(contiguous)).toEqual(contiguous)
    expect(fillTimelineGaps([])).toEqual([])
    const one: TimelinePoint[] = [{ t: '2026-06-26', proofs: 1, cumulative_proofs: 1 }]
    expect(fillTimelineGaps(one)).toEqual(one)
  })
})

describe('leaderboardBarSeries', () => {
  const entry = (github: string, score: number): GuildLeaderboardEntry => ({
    github,
    displayName: `@${github}`,
    avatarUrl: '',
    profileUrl: '',
    rank: 0,
    score,
    difficultyPoints: 0,
    creditedProofs: 0,
    verifiedProofs: 0,
    dispatchProofs: 0,
    dispatchPoints: 0,
    successRate: 0,
    badges: { proofs: 0, difficulty: 0, success_rate_percent: 0 },
  })

  it('takes the top-N and links each bar to the contributor profile', () => {
    const out = leaderboardBarSeries([entry('a', 30), entry('b', 20), entry('c', 10)], 2)
    expect(out.labels).toEqual(['@a', '@b'])
    expect(out.values).toEqual([30, 20])
    expect(out.hrefs).toEqual(['/math/contributors/a', '/math/contributors/b'])
  })
})

describe('sourcingBarSeries', () => {
  it('sorts by sourced goals, exposes only sourced, and links profiles', () => {
    const entries: SourcingEntry[] = [
      { sourcer: 'b', github: 'b', display_name: 'B', sourced_goals: 5, proved: 1, open: 1, difficulty_points: 9 },
      { sourcer: 'a', github: 'a', sourced_goals: 12, proved: 4, open: 0, difficulty_points: 30 },
    ]
    const out = sourcingBarSeries(entries)
    expect(out.labels).toEqual(['@a', 'B'])
    expect(out.values).toEqual([12, 5])
    expect(out.hrefs).toEqual(['/math/contributors/a', '/math/contributors/b'])
  })
})

describe('modelBarSeries', () => {
  it('drops zero-proof models and sorts by verified proofs', () => {
    const models: ModelStat[] = [
      { provider_model: 'zero / proofs', verified_proofs: 0, runs: 1, run_success_rate: 0 },
      { provider_model: 'lean / decide', verified_proofs: 4, runs: 4, run_success_rate: 1 },
      { provider_model: 'python / sympy', verified_proofs: 9, runs: 9, run_success_rate: 1 },
    ]
    expect(modelBarSeries(models)).toEqual({
      labels: ['python / sympy', 'lean / decide'],
      values: [9, 4],
    })
  })
})
