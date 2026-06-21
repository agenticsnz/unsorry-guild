import { describe, it, expect } from 'vitest'
import { isInTarget, subtreeGoals, computeTargetProgress } from '@/lib/unsorry/subtree'
import { SQ_TARGET, SQ_GOAL_EFFORT } from '@/tests/mocks/unsorry-fixtures'

describe('isInTarget', () => {
  it('matches the headline and suffix descendants', () => {
    expect(isInTarget(SQ_TARGET, SQ_TARGET)).toBe(true)
    expect(isInTarget(SQ_TARGET, `${SQ_TARGET}-s4`)).toBe(true)
    expect(isInTarget(SQ_TARGET, `${SQ_TARGET}-s4-s3-s2`)).toBe(true)
  })

  it('rejects unrelated goals and prefix lookalikes', () => {
    expect(isInTarget(SQ_TARGET, 'euclid-perfect-numbers')).toBe(false)
    expect(isInTarget(SQ_TARGET, `${SQ_TARGET}x`)).toBe(false)
    expect(isInTarget(SQ_TARGET, `other-${SQ_TARGET}`)).toBe(false)
  })
})

describe('subtreeGoals', () => {
  it('keeps only goals in the target, excluding outsiders', () => {
    const sub = subtreeGoals(SQ_TARGET, SQ_GOAL_EFFORT)
    expect(sub).toHaveLength(12)
    expect(sub.some((g) => g.goal === 'euclid-perfect-numbers')).toBe(false)
  })
})

describe('computeTargetProgress', () => {
  it('counts statuses over the subtree and detects an unfinished headline', () => {
    const p = computeTargetProgress(SQ_TARGET, SQ_GOAL_EFFORT)
    expect(p.total).toBe(12)
    expect(p.proved).toBe(8)
    expect(p.blocked).toBe(3)
    expect(p.open).toBe(1)
    expect(p.percentProved).toBe(67)
    expect(p.headlineStatus).toBe('blocked')
    expect(p.isClosed).toBe(false)
  })

  it('marks the target closed when the headline is proved', () => {
    const effort = SQ_GOAL_EFFORT.map((g) =>
      g.goal === SQ_TARGET ? { ...g, status: 'proved' as const } : g,
    )
    expect(computeTargetProgress(SQ_TARGET, effort).isClosed).toBe(true)
  })
})
