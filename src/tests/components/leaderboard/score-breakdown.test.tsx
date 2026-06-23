import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { ScoreBreakdown } from '@/components/leaderboard/score-breakdown'
import { toGuildLeaderboard } from '@/lib/unsorry/leaderboard-mapper'
import { LEADERBOARD_FIXTURE } from '@/tests/mocks/unsorry-fixtures'

const cgbarlow = () =>
  toGuildLeaderboard(LEADERBOARD_FIXTURE).find((r) => r.github === 'cgbarlow')!

describe('ScoreBreakdown', () => {
  it('reconstructs the score from its three weighted terms', () => {
    render(<ScoreBreakdown entry={cgbarlow()} />)
    // difficulty 450×100 = 45,000 · proofs 200×25 = 5,000 · dispatch 300×0.9×100 = 27,000
    expect(screen.getByText('45,000')).toBeInTheDocument()
    expect(screen.getByText('5,000')).toBeInTheDocument()
    expect(screen.getByText('27,000')).toBeInTheDocument()
    // total equals the authoritative score
    expect(screen.getByText('77,000')).toBeInTheDocument()
  })

  it('explains dispatch credit and links to the methodology page', () => {
    render(<ScoreBreakdown entry={cgbarlow()} />)
    const link = screen.getByRole('link', { name: /how scores are calculated/i })
    expect(link).toHaveAttribute('href', '/math/scoring')
  })

  it('shows the dispatch term as a meaningful share of the score', () => {
    render(<ScoreBreakdown entry={cgbarlow()} />)
    const dispatchRow = screen.getByText('Dispatch (PRs landed for others)').closest('tr')!
    // 27,000 / 77,000 ≈ 35%
    expect(within(dispatchRow).getByText('35%')).toBeInTheDocument()
  })
})
