import { describe, it, expect } from 'vitest'
import { goalHref, resolveDecomposition } from '@/lib/unsorry/decomposition'
import type { GoalMeta } from '@/lib/unsorry/derive'
import type { Decomposition, GoalSolver } from '@/lib/unsorry/types'

const DECOMP: Decomposition = {
  parent: 'sq-add-sq-eq-three-mul-sq',
  agent: 'oma-2-c50d',
  subs: ['sq-add-sq-eq-three-mul-sq-s1', 'three-not-sum-of-two-squares'],
}

const goalMeta = new Map<string, GoalMeta>([
  ['sq-add-sq-eq-three-mul-sq', { difficulty: 6, status: 'proved' }],
  ['sq-add-sq-eq-three-mul-sq-s1', { difficulty: 3, status: 'proved' }],
  ['three-not-sum-of-two-squares', { difficulty: 2, status: 'open' }],
])

const solverMap = new Map<string, GoalSolver>([
  ['sq-add-sq-eq-three-mul-sq', { goal: 'sq-add-sq-eq-three-mul-sq', solver: 'ohdearquant', name: 'composed' }],
  [
    'sq-add-sq-eq-three-mul-sq-s1',
    { goal: 'sq-add-sq-eq-three-mul-sq-s1', solver: 'beast', name: 'sub_one' },
  ],
])

describe('goalHref', () => {
  it('links to the goal detail page', () => {
    expect(goalHref('foo-bar')).toBe('/math/proofs/foo-bar')
  })
})

describe('resolveDecomposition', () => {
  const resolved = resolveDecomposition(DECOMP, goalMeta, solverMap)

  it('preserves the parent, agent and sub order', () => {
    expect(resolved.parent).toBe('sq-add-sq-eq-three-mul-sq')
    expect(resolved.agent).toBe('oma-2-c50d')
    expect(resolved.subs.map((s) => s.id)).toEqual([
      'sq-add-sq-eq-three-mul-sq-s1',
      'three-not-sum-of-two-squares',
    ])
  })

  it('resolves a proved sub with its solver attribution and link', () => {
    const s1 = resolved.subs[0]
    expect(s1.status).toBe('proved')
    expect(s1.proved).toBe(true)
    expect(s1.solver).toBe('beast')
    expect(s1.href).toBe('/math/proofs/sq-add-sq-eq-three-mul-sq-s1')
  })

  it('resolves an open sub with no solver and the open status', () => {
    const s2 = resolved.subs[1]
    expect(s2.status).toBe('open')
    expect(s2.proved).toBe(false)
    expect(s2.solver).toBeUndefined()
  })

  it('resolves the parent composed proof (status + attribution)', () => {
    expect(resolved.composed.id).toBe('sq-add-sq-eq-three-mul-sq')
    expect(resolved.composed.status).toBe('proved')
    expect(resolved.composed.solver).toBe('ohdearquant')
    expect(resolved.composed.href).toBe('/math/proofs/sq-add-sq-eq-three-mul-sq')
  })

  it('defaults a sub with no goal record to the open state', () => {
    const r = resolveDecomposition({ parent: 'p', subs: ['unknown-sub'] }, new Map(), new Map())
    expect(r.subs[0].status).toBe('open')
    expect(r.subs[0].proved).toBe(false)
  })
})
