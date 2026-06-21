import { describe, it, expect } from 'vitest'
import {
  deriveGoalEffort,
  deriveGoalSolverMap,
  deriveGlobalLeaderboard,
  deriveModels,
  deriveTimelines,
  deriveSummary,
} from '@/lib/unsorry/derive'
import type { UnsorrySnapshot } from '@/lib/unsorry/snapshot-parse'

const SNAP: UnsorrySnapshot = {
  goals: [
    { goal: 'g1', status: 'proved', difficulty: 2 },
    { goal: 'g2', status: 'proved', difficulty: 1 },
    { goal: 'g3', status: 'open', difficulty: 3 },
  ],
  proofs: [
    { goal: 'g1', solver: 'alice', providerModel: 'python / sympy', date: '2026-06-01' },
    { goal: 'g2', solver: 'bob', providerModel: 'lean / decide', date: '2026-06-02' },
  ],
  runs: [
    { goal: 'g1', solver: 'alice', outcome: 'proved', success: true, providerModel: 'python / sympy', ended: '2026-06-01T10:00:00Z' },
    { goal: 'g2', solver: 'bob', outcome: 'failed', success: false, providerModel: 'lean / decide', ended: '2026-06-02T10:00:00Z' },
    { goal: 'g2', solver: 'bob', outcome: 'proved', success: true, providerModel: 'lean / decide', ended: '2026-06-02T12:00:00Z' },
  ],
}

describe('deriveGoalEffort', () => {
  it('maps each goal to status + difficulty', () => {
    expect(deriveGoalEffort(SNAP)).toEqual([
      { goal: 'g1', status: 'proved', difficulty: 2 },
      { goal: 'g2', status: 'proved', difficulty: 1 },
      { goal: 'g3', status: 'open', difficulty: 3 },
    ])
  })
})

describe('deriveGoalSolverMap', () => {
  it('maps proved goals to their credited solver', () => {
    const m = deriveGoalSolverMap(SNAP)
    expect(m.get('g1')?.solver).toBe('alice')
    expect(m.get('g2')?.solver).toBe('bob')
    expect(m.has('g3')).toBe(false)
  })
})

describe('deriveGlobalLeaderboard', () => {
  it('credits difficulty-weighted proofs and ranks by score', () => {
    const board = deriveGlobalLeaderboard(SNAP)
    expect(board.map((e) => e.github)).toEqual(['alice', 'bob'])
    // alice: difficulty 2*100 + 1*25 = 225; bob: 1*100 + 1*25 = 125
    expect(board[0]).toMatchObject({ github: 'alice', score: 225, rank: 1, creditedProofs: 1 })
    expect(board[1]).toMatchObject({ github: 'bob', score: 125, rank: 2 })
    // bob: 1 success of 2 runs → 50%
    expect(board[1].successRate).toBeCloseTo(0.5)
  })
})

describe('deriveModels', () => {
  it('counts verified proofs per provider/model with run success rates', () => {
    const models = deriveModels(SNAP)
    expect(models).toEqual([
      { provider_model: 'python / sympy', verified_proofs: 1, runs: 1, run_success_rate: 1 },
      { provider_model: 'lean / decide', verified_proofs: 1, runs: 2, run_success_rate: 0.5 },
    ])
  })
})

describe('deriveTimelines', () => {
  it('builds cumulative merge + solve series', () => {
    const t = deriveTimelines(SNAP)
    expect(t.merge.map((p) => p.cumulative_proofs)).toEqual([1, 2])
    expect(t.solve.at(-1)?.cumulative_proofs).toBe(2)
  })
})

describe('deriveSummary', () => {
  it('recomputes headline counts coherently', () => {
    expect(deriveSummary(SNAP)).toMatchObject({
      verified_proofs: 2,
      attributed_proofs: 2,
      inferred_git_proofs: 0,
      terminal_runs: 3,
      credited_contributors: 2,
    })
  })
})
