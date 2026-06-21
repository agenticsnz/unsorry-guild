import { describe, it, expect } from 'vitest'
import { deriveGoalSolverMap } from '@/lib/unsorry/derive'
import type { UnsorrySnapshot } from '@/lib/unsorry/snapshot-parse'

const SNAP: UnsorrySnapshot = {
  proofs: [
    { goal: 'g1', solver: 'alice', name: 'lemma_one' },
    { goal: 'g2', solver: 'bob' },
  ],
}

describe('deriveGoalSolverMap', () => {
  it('maps each proved goal to its credited solver', () => {
    const m = deriveGoalSolverMap(SNAP)
    expect(m.get('g1')).toEqual({ goal: 'g1', solver: 'alice', name: 'lemma_one' })
    expect(m.get('g2')?.solver).toBe('bob')
    expect(m.size).toBe(2)
  })

  it('handles an empty snapshot', () => {
    expect(deriveGoalSolverMap({ proofs: [] }).size).toBe(0)
  })
})
