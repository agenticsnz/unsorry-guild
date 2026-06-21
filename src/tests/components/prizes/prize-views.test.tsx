import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TargetProgressView } from '@/components/prizes/target-progress'
import { TargetLeaderboardTable } from '@/components/prizes/target-leaderboard-table'
import { Podium } from '@/components/prizes/podium'
import { computeTargetProgress } from '@/lib/unsorry/subtree'
import { computeTargetLeaderboard } from '@/lib/unsorry/target-leaderboard'
import { SQ_TARGET, SQ_GOAL_EFFORT } from '@/tests/mocks/unsorry-fixtures'
import type { GoalSolver, TargetLeaderboardEntry } from '@/lib/unsorry/types'

const goalSolver = new Map<string, GoalSolver>([
  ['sq-add-sq-eq-three-mul-sq-s1', { goal: 'sq-add-sq-eq-three-mul-sq-s1', solver: 'cgbarlow' }],
  ['sq-add-sq-eq-three-mul-sq-s4-s1', { goal: 'sq-add-sq-eq-three-mul-sq-s4-s1', solver: 'Rauxon' }],
  ['sq-add-sq-eq-three-mul-sq-s4-s3-s3', { goal: 'sq-add-sq-eq-three-mul-sq-s4-s3-s3', solver: 'Rauxon' }],
])

describe('TargetProgressView', () => {
  it('shows proved/total and the headline status', () => {
    const progress = computeTargetProgress(SQ_TARGET, SQ_GOAL_EFFORT)
    render(<TargetProgressView progress={progress} />)
    expect(screen.getByText('8 / 12 goals proved')).toBeInTheDocument()
    expect(screen.getByText(/Headline: Blocked/)).toBeInTheDocument()
  })
})

describe('TargetLeaderboardTable', () => {
  it('renders ranked contributors', () => {
    const board = computeTargetLeaderboard(SQ_TARGET, SQ_GOAL_EFFORT, goalSolver)
    render(<TargetLeaderboardTable entries={board} />)
    expect(screen.getByText('@Rauxon')).toBeInTheDocument()
    expect(screen.getByText('@cgbarlow')).toBeInTheDocument()
    expect(screen.getByText('🥇')).toBeInTheDocument()
  })

  it('shows an empty state', () => {
    render(<TargetLeaderboardTable entries={[]} />)
    expect(screen.getByText(/no attributed contributions/i)).toBeInTheDocument()
  })
})

describe('Podium', () => {
  it('labels a provisional podium when not closed', () => {
    const board: TargetLeaderboardEntry[] = [
      { github: 'Rauxon', difficultyPoints: 2, creditedProofs: 2, score: 250, rank: 1 },
    ]
    render(<Podium entries={board} closed={false} />)
    expect(screen.getByText(/provisional podium/i)).toBeInTheDocument()
  })
})
