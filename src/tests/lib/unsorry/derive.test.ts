import { describe, it, expect } from 'vitest'
import {
  deriveGoalSolverMap,
  deriveShowcaseSolverMap,
  deriveGoalMetaMap,
  deriveContributorModels,
  deriveRecentProofs,
} from '@/lib/unsorry/derive'
import type { UnsorrySnapshot } from '@/lib/unsorry/snapshot-parse'

const SNAP: UnsorrySnapshot = {
  proofs: [
    { goal: 'g1', solver: 'alice', name: 'lemma_one' },
    { goal: 'g2', solver: 'bob' },
    { goal: 'g4', name: 'inferred_lemma' }, // proved, no explicit solver
  ],
  archivedProofs: [
    { goal: 'g0', solver: 'carol', name: 'old_lemma' },
    { goal: 'g1', solver: 'stale', name: 'superseded' }, // active wins on conflict
    { goal: 'g5', name: 'old_inferred' }, // archived, no explicit solver
  ],
  goals: [
    { goal: 'g1', difficulty: 4, status: 'proved' },
    { goal: 'g2', difficulty: 1, status: 'proved' },
    { goal: 'g0', difficulty: 5, status: 'archived' },
  ],
  archivePackageByGoal: {},
}

const EMPTY: UnsorrySnapshot = {
  proofs: [],
  archivedProofs: [],
  goals: [],
  archivePackageByGoal: {},
}

describe('deriveGoalSolverMap', () => {
  it('maps ACTIVE proofs WITH an explicit solver (archive + solverless excluded)', () => {
    const m = deriveGoalSolverMap(SNAP)
    expect(m.get('g1')).toEqual({ goal: 'g1', solver: 'alice', name: 'lemma_one' })
    expect(m.get('g2')?.solver).toBe('bob')
    expect(m.has('g0')).toBe(false) // archived not in the active map
    expect(m.has('g4')).toBe(false) // no explicit solver → excluded (unchanged behaviour)
    expect(m.size).toBe(2)
  })

  it('handles an empty snapshot', () => {
    expect(deriveGoalSolverMap(EMPTY).size).toBe(0)
  })
})

describe('deriveShowcaseSolverMap', () => {
  it('merges active + archived, includes solverless proofs, active wins on conflict', () => {
    const m = deriveShowcaseSolverMap(SNAP)
    expect(m.get('g0')?.solver).toBe('carol') // archived-only goal included
    expect(m.get('g1')?.solver).toBe('alice') // active wins over the archived dup
    expect(m.get('g4')?.solver).toBe('') // solverless active proof included (inferred)
    expect(m.get('g5')?.solver).toBe('') // solverless archived proof included
    expect(m.size).toBe(5) // g0, g1, g2, g4, g5
  })
})

describe('deriveGoalMetaMap', () => {
  it('maps every goal to its difficulty and status', () => {
    const m = deriveGoalMetaMap(SNAP)
    expect(m.get('g1')).toEqual({ difficulty: 4, status: 'proved' })
    expect(m.get('g0')).toEqual({ difficulty: 5, status: 'archived' })
    expect(m.size).toBe(3)
  })
})

describe('deriveContributorModels', () => {
  const MODELS: UnsorrySnapshot = {
    proofs: [
      { goal: 'a', solver: 'alice', provider: 'python', model: 'sympy' },
      { goal: 'b', solver: 'alice', provider: 'python', model: 'sympy' },
      { goal: 'c', solver: 'alice', provider: 'openai', model: 'gpt' },
      { goal: 'd', solver: 'bob', provider: 'python', model: 'sympy' }, // other solver
      { goal: 'e', solver: 'alice', provider: 'lean' }, // model absent → 'unknown'
      { goal: 'f', solver: 'alice' }, // no engine at all → skipped
    ],
    archivedProofs: [
      { goal: 'g', solver: 'alice', provider: 'anthropic', model: 'opus' }, // archived counts
      { goal: 'a', solver: 'alice', provider: 'openai', model: 'gpt' }, // active 'a' wins
    ],
    goals: [],
    archivePackageByGoal: {},
  }

  it('ranks a contributor’s engines by proof count, deduping per goal (active wins)', () => {
    const rows = deriveContributorModels(MODELS, 'alice')
    expect(rows).toEqual([
      { providerModel: 'python / sympy', proofs: 2 }, // a (active), b
      { providerModel: 'anthropic / opus', proofs: 1 }, // archived g
      { providerModel: 'lean / unknown', proofs: 1 }, // model absent
      { providerModel: 'openai / gpt', proofs: 1 }, // c only — 'a' counted as python/sympy
    ])
    // engine-less proof 'f' and bob's proof are excluded
    expect(rows.reduce((s, r) => s + r.proofs, 0)).toBe(5)
  })

  it('matches the handle case-insensitively', () => {
    expect(deriveContributorModels(MODELS, 'ALICE')).toHaveLength(4)
  })

  it('returns [] for a contributor with no proofs', () => {
    expect(deriveContributorModels(MODELS, 'nobody')).toEqual([])
  })
})

describe('deriveRecentProofs', () => {
  const RECENT: UnsorrySnapshot = {
    proofs: [
      { goal: 'g-b', name: 'b', solver: 'alice', provedOn: '2026-06-20' },
      { goal: 'g-a', name: 'a', solver: 'bob', provedOn: '2026-06-22' },
      { goal: 'g-c', name: 'c', provedOn: '2026-06-20' }, // same date as g-b → goal asc
      { goal: 'g-undated', name: 'u' }, // no day-stamp → excluded
    ],
    archivedProofs: [{ goal: 'g-arch', provedOn: '2026-06-30' }], // archived ignored
    goals: [],
    archivePackageByGoal: {},
  }

  it('orders by date desc then goal asc, excludes undated and archived', () => {
    expect(deriveRecentProofs(RECENT, 8).map((p) => p.goal)).toEqual(['g-a', 'g-b', 'g-c'])
  })

  it('respects the limit', () => {
    expect(deriveRecentProofs(RECENT, 1).map((p) => p.goal)).toEqual(['g-a'])
  })

  it('carries through the row fields', () => {
    expect(deriveRecentProofs(RECENT, 1)[0]).toEqual({
      goal: 'g-a',
      name: 'a',
      solver: 'bob',
      provider: undefined,
      model: undefined,
      provedOn: '2026-06-22',
    })
  })

  it('returns [] when no proof carries a day-stamp', () => {
    expect(deriveRecentProofs(EMPTY, 8)).toEqual([])
    expect(deriveRecentProofs({ ...EMPTY, proofs: [{ goal: 'x' }] }, 8)).toEqual([])
  })
})
