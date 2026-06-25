import { describe, it, expect } from 'vitest'
import {
  deriveGoalSolverMap,
  deriveShowcaseSolverMap,
  deriveGoalMetaMap,
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
}

const EMPTY: UnsorrySnapshot = { proofs: [], archivedProofs: [], goals: [] }

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
