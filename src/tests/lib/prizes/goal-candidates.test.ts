import { describe, it, expect } from 'vitest'
import { buildGoalCandidates, candidateLabel } from '@/lib/prizes/goal-candidates'
import type { BenchmarkSuite, GoalEffort } from '@/lib/unsorry/types'

const effort = (goal: string, difficulty: number, status: GoalEffort['status']): GoalEffort => ({
  goal,
  difficulty,
  status,
})

const suite = (id: string, goals: { id: string; difficulty: number }[]): BenchmarkSuite =>
  ({
    id,
    domain: 'lean-math',
    supplier: 's',
    mathlib_pin: 'r',
    license: 'MIT',
    cohort: 'benchmark',
    credited: 0,
    glue: 0,
    proved: 0,
    pass_at: {},
    goals: goals.map((g) => ({ ...g, status: 'open', credit: 'credited', run_snippet: '' })),
  }) as BenchmarkSuite

describe('buildGoalCandidates', () => {
  it('merges goal_effort + suite goals and dedupes by id (effort wins, suite tag kept)', () => {
    const out = buildGoalCandidates(
      [effort('g-shared', 5, 'proved')],
      [suite('putnam', [{ id: 'g-shared', difficulty: 2 }, { id: 'g-suite-only', difficulty: 3 }])],
    )
    const shared = out.find((c) => c.id === 'g-shared')!
    expect(shared).toMatchObject({ id: 'g-shared', difficulty: 5, status: 'proved', suite: 'putnam' })
    expect(out.find((c) => c.id === 'g-suite-only')).toMatchObject({ id: 'g-suite-only', suite: 'putnam' })
  })

  it('sorts actionable-first, then hardest, then by id', () => {
    const out = buildGoalCandidates(
      [
        effort('z-open-1', 1, 'open'),
        effort('a-open-4', 4, 'open'),
        effort('m-proved-9', 9, 'proved'),
      ],
      [],
    )
    expect(out.map((c) => c.id)).toEqual(['a-open-4', 'z-open-1', 'm-proved-9'])
  })

  it('returns [] for empty inputs', () => {
    expect(buildGoalCandidates([], [])).toEqual([])
  })
})

describe('candidateLabel', () => {
  it('joins the present fields with a middot', () => {
    expect(candidateLabel({ id: 'g-foo', difficulty: 4, status: 'open', suite: 'putnam' })).toBe(
      'g-foo · d4 · open · putnam',
    )
    expect(candidateLabel({ id: 'g-bare' })).toBe('g-bare')
    expect(candidateLabel({ id: 'g', difficulty: 0, status: 'proved' })).toBe('g · d0 · proved')
  })
})
