import { describe, it, expect } from 'vitest'
import { buildProofGraph } from '@/lib/unsorry/graph'
import { buildShowcase, buildProofDetail } from '@/lib/unsorry/showcase'
import type { GoalEffort, GoalSolver } from '@/lib/unsorry/types'

const goalEffort: GoalEffort[] = [
  { goal: 'g1', status: 'proved', difficulty: 3 },
  { goal: 'g2', status: 'archived', difficulty: 1 },
  { goal: 'g3', status: 'open', difficulty: 5 },
]
const solver = (goal: string, s: string, name?: string): [string, GoalSolver] => [
  goal,
  { goal, solver: s, name },
]
const goalSolver = new Map<string, GoalSolver>([
  solver('g1', 'alice', 'lemma_one'),
  solver('g2', 'bob', 'lemma_two'),
  solver('g3', 'carol', 'lemma_three'), // open → excluded
])

describe('buildProofGraph', () => {
  it('links proved+attributed goals to their solver and excludes open goals', () => {
    const { nodes, links } = buildProofGraph(goalEffort, goalSolver)
    expect(links).toHaveLength(2) // g1→alice, g2→bob (g3 open excluded)
    const ids = nodes.map((n) => n.id)
    expect(ids).toContain('c:alice')
    expect(ids).toContain('g:g1')
    expect(ids).not.toContain('g:g3')
    expect(nodes.find((n) => n.id === 'g:g1')?.label).toBe('lemma_one')
    expect(nodes.find((n) => n.id === 'c:alice')?.kind).toBe('contributor')
  })
})

describe('buildShowcase', () => {
  const goalMeta = new Map([
    ['g1', { difficulty: 5, status: 'proved' }],
    ['g2', { difficulty: 4, status: 'archived' }],
    ['g3', { difficulty: 1, status: 'proved' }], // below the floor
  ])

  it('ranks proved+attributed goals by difficulty and applies the floor', () => {
    const items = buildShowcase(goalSolver, goalMeta, { minDifficulty: 4 })
    // g3 (difficulty 1) excluded by the floor; g1(5) before g2(4).
    expect(items.map((i) => i.goal)).toEqual(['g1', 'g2'])
    expect(items[0]).toMatchObject({ goal: 'g1', name: 'lemma_one', solver: 'alice', difficulty: 5 })
  })

  it('excludes goals with no difficulty record', () => {
    const items = buildShowcase(goalSolver, new Map(), { minDifficulty: 1 })
    expect(items).toEqual([])
  })

  it('defaults to an elite difficulty-4 floor', () => {
    const items = buildShowcase(goalSolver, goalMeta)
    expect(items.every((i) => i.difficulty >= 4)).toBe(true)
    expect(items.map((i) => i.goal)).not.toContain('g3')
  })

  it('respects topN', () => {
    expect(buildShowcase(goalSolver, goalMeta, { minDifficulty: 4, topN: 1 })).toHaveLength(1)
  })
})

describe('buildProofDetail', () => {
  const goalMeta = new Map([['g1', { difficulty: 5, status: 'proved' }]])
  const effort: GoalEffort[] = [
    { goal: 'g1', status: 'proved', difficulty: 5, runs: 4, successes: 1, attempts: 9 },
  ]

  it('assembles name, solver, difficulty/status and telemetry for a proved goal', () => {
    const detail = buildProofDetail('g1', goalSolver, goalMeta, effort)
    expect(detail).toMatchObject({
      goal: 'g1',
      name: 'lemma_one',
      solver: 'alice',
      difficulty: 5,
      status: 'proved',
      runs: 4,
      successes: 1,
      attempts: 9,
    })
  })

  it('returns null for a goal with no credited proof (→ 404)', () => {
    expect(buildProofDetail('nope', goalSolver, goalMeta, effort)).toBeNull()
  })

  it('omits telemetry when the goal has no run records', () => {
    const detail = buildProofDetail('g2', goalSolver, new Map([['g2', { difficulty: 4, status: 'archived' }]]), [])
    expect(detail).toMatchObject({ goal: 'g2', difficulty: 4, status: 'archived' })
    expect(detail?.runs).toBeUndefined()
    expect(detail?.attempts).toBeUndefined()
  })
})
