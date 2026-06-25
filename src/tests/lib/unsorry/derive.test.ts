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
  ],
  archivedProofs: [
    { goal: 'g0', solver: 'carol', name: 'old_lemma' },
    { goal: 'g1', solver: 'stale', name: 'superseded' }, // active wins on conflict
  ],
  goals: [
    { goal: 'g1', difficulty: 4, status: 'proved' },
    { goal: 'g2', difficulty: 1, status: 'proved' },
    { goal: 'g0', difficulty: 5, status: 'archived' },
  ],
}

const EMPTY: UnsorrySnapshot = { proofs: [], archivedProofs: [], goals: [] }

describe('deriveGoalSolverMap', () => {
  it('maps each ACTIVE proved goal to its credited solver (archive excluded)', () => {
    const m = deriveGoalSolverMap(SNAP)
    expect(m.get('g1')).toEqual({ goal: 'g1', solver: 'alice', name: 'lemma_one' })
    expect(m.get('g2')?.solver).toBe('bob')
    expect(m.has('g0')).toBe(false) // archived not in the active map
    expect(m.size).toBe(2)
  })

  it('handles an empty snapshot', () => {
    expect(deriveGoalSolverMap(EMPTY).size).toBe(0)
  })
})

describe('deriveShowcaseSolverMap', () => {
  it('merges active + archived proofs, with active winning on conflict', () => {
    const m = deriveShowcaseSolverMap(SNAP)
    expect(m.get('g0')?.solver).toBe('carol') // archived-only goal included
    expect(m.get('g1')?.solver).toBe('alice') // active wins over the archived dup
    expect(m.size).toBe(3) // g0, g1, g2
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
