import { describe, it, expect } from 'vitest'
import {
  proofsOverTimeCombo,
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
  it('maps per-period proofs and cumulative with date labels', () => {
    const series: TimelinePoint[] = [
      { t: '2026-06-01T00:00:00Z', proofs: 2, cumulative_proofs: 2 },
      { t: '2026-06-02T00:00:00Z', proofs: 3, cumulative_proofs: 5 },
    ]
    expect(proofsOverTimeCombo(series)).toEqual({
      labels: ['2026-06-01', '2026-06-02'],
      proofs: [2, 3],
      cumulative: [2, 5],
    })
  })

  it('handles an empty series', () => {
    expect(proofsOverTimeCombo([])).toEqual({ labels: [], proofs: [], cumulative: [] })
  })

  it('aggregates an hourly (merge-basis) series into one bar per calendar day', () => {
    // The merge basis is bucketed hourly upstream; without daily aggregation each
    // of a day's ~24 points renders as its own bar sharing the same date label, so
    // the latest partial-hour bar (e.g. 14) reads as the whole day. ADR-029.
    const series: TimelinePoint[] = [
      { t: '2026-06-21T22:00:00Z', proofs: 36, cumulative_proofs: 2501 },
      { t: '2026-06-21T23:00:00Z', proofs: 30, cumulative_proofs: 2531 },
      { t: '2026-06-22T00:00:00Z', proofs: 24, cumulative_proofs: 2555 },
      { t: '2026-06-22T01:00:00Z', proofs: 10, cumulative_proofs: 2565 },
      { t: '2026-06-22T03:00:00Z', proofs: 14, cumulative_proofs: 2593 },
    ]
    expect(proofsOverTimeCombo(series)).toEqual({
      labels: ['2026-06-21', '2026-06-22'],
      proofs: [66, 48], // 36+30 ; 24+10+14 — the day total, not the last hour
      cumulative: [2531, 2593], // end-of-day (max) cumulative
    })
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
