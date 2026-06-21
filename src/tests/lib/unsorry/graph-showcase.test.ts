import { describe, it, expect } from 'vitest'
import { buildProofGraph } from '@/lib/unsorry/graph'
import { buildShowcase } from '@/lib/unsorry/showcase'
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
  it('returns proved/attributed goals sorted by difficulty', () => {
    const items = buildShowcase(goalEffort, goalSolver)
    expect(items.map((i) => i.goal)).toEqual(['g1', 'g2']) // g3 open excluded; g1(3) before g2(1)
    expect(items[0]).toMatchObject({ goal: 'g1', name: 'lemma_one', solver: 'alice', difficulty: 3 })
  })

  it('respects topN', () => {
    expect(buildShowcase(goalEffort, goalSolver, 1)).toHaveLength(1)
  })
})
