import { describe, it, expect } from 'vitest'
import {
  proofsOverTimeSeries,
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

describe('proofsOverTimeSeries', () => {
  it('maps cumulative proofs to labels (date) + values', () => {
    const series: TimelinePoint[] = [
      { t: '2026-06-01T00:00:00Z', proofs: 2, cumulative_proofs: 2 },
      { t: '2026-06-02T00:00:00Z', proofs: 3, cumulative_proofs: 5 },
    ]
    expect(proofsOverTimeSeries(series)).toEqual({
      labels: ['2026-06-01', '2026-06-02'],
      values: [2, 5],
    })
  })

  it('handles an empty series', () => {
    expect(proofsOverTimeSeries([])).toEqual({ labels: [], values: [] })
  })
})

describe('leaderboardBarSeries', () => {
  const entry = (displayName: string, score: number): GuildLeaderboardEntry => ({
    github: displayName,
    displayName,
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

  it('takes the top-N entries by their existing order', () => {
    const entries = [entry('a', 30), entry('b', 20), entry('c', 10)]
    expect(leaderboardBarSeries(entries, 2)).toEqual({
      labels: ['a', 'b'],
      values: [30, 20],
    })
  })
})

describe('sourcingBarSeries', () => {
  it('sorts by sourced goals and exposes only the sourced value', () => {
    const entries: SourcingEntry[] = [
      { sourcer: 'b', github: 'b', display_name: 'B', sourced_goals: 5, proved: 1, open: 1, difficulty_points: 9 },
      { sourcer: 'a', github: 'a', sourced_goals: 12, proved: 4, open: 0, difficulty_points: 30 },
    ]
    expect(sourcingBarSeries(entries)).toEqual({
      labels: ['@a', 'B'],
      values: [12, 5],
    })
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
