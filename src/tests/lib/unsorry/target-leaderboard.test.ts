import { describe, it, expect } from 'vitest'
import { computeTargetLeaderboard, targetScore } from '@/lib/unsorry/target-leaderboard'
import { SQ_TARGET, SQ_GOAL_EFFORT } from '@/tests/mocks/unsorry-fixtures'
import type { GoalSolver } from '@/lib/unsorry/types'

const solver = (goal: string, s: string): [string, GoalSolver] => [goal, { goal, solver: s }]

describe('targetScore', () => {
  it('matches unsorry score policy (difficulty*100 + proofs*25)', () => {
    expect(targetScore(3, 3)).toBe(375)
    expect(targetScore(2, 2)).toBe(250)
  })
})

describe('computeTargetLeaderboard', () => {
  const goalSolver = new Map<string, GoalSolver>([
    solver('sq-add-sq-eq-three-mul-sq-s1', 'cgbarlow'),
    solver('sq-add-sq-eq-three-mul-sq-s2', 'cgbarlow'),
    solver('sq-add-sq-eq-three-mul-sq-s4-s1', 'Rauxon'),
    solver('sq-add-sq-eq-three-mul-sq-s4-s3-s1', 'Rauxon'),
    solver('sq-add-sq-eq-three-mul-sq-s4-s3-s3', 'Rauxon'),
    // a non-subtree attribution that must never appear
    solver('euclid-perfect-numbers', 'mallory'),
  ])

  it('ranks contributors by difficulty-weighted discharge of the subtree', () => {
    const board = computeTargetLeaderboard(SQ_TARGET, SQ_GOAL_EFFORT, goalSolver)
    expect(board).toHaveLength(2)
    expect(board[0]).toMatchObject({ github: 'Rauxon', creditedProofs: 3, difficultyPoints: 3, score: 375, rank: 1 })
    expect(board[1]).toMatchObject({ github: 'cgbarlow', creditedProofs: 2, difficultyPoints: 2, score: 250, rank: 2 })
    expect(board.some((e) => e.github === 'mallory')).toBe(false)
  })

  it('excludes unattributed proved goals from contributors (counted only in progress)', () => {
    // s3, s4-s2, s4-s4 are proved but have no attribution → no phantom contributor
    const board = computeTargetLeaderboard(SQ_TARGET, SQ_GOAL_EFFORT, goalSolver)
    const totalCredited = board.reduce((n, e) => n + e.creditedProofs, 0)
    expect(totalCredited).toBe(5)
  })

  it('returns an empty board when nothing is attributed', () => {
    expect(computeTargetLeaderboard(SQ_TARGET, SQ_GOAL_EFFORT, new Map())).toEqual([])
  })

  it('gives contributors with equal scores the same rank (tie, SPEC-018-B)', () => {
    // cgbarlow (s1, s2) and Rauxon (s4-s1, s4-s3-s1) each discharge two diff-1
    // subtree goals → identical score → both rank 1, next contributor rank 3.
    const tied = new Map<string, GoalSolver>([
      solver('sq-add-sq-eq-three-mul-sq-s1', 'cgbarlow'),
      solver('sq-add-sq-eq-three-mul-sq-s2', 'cgbarlow'),
      solver('sq-add-sq-eq-three-mul-sq-s4-s1', 'Rauxon'),
      solver('sq-add-sq-eq-three-mul-sq-s4-s3-s1', 'Rauxon'),
    ])
    const board = computeTargetLeaderboard(SQ_TARGET, SQ_GOAL_EFFORT, tied)
    expect(board).toHaveLength(2)
    expect(board[0].score).toBe(board[1].score)
    expect(board.map((e) => e.rank)).toEqual([1, 1])
  })
})
