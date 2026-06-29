import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GlobalLeaderboard } from '@/components/leaderboard/global-leaderboard'
import { toGuildLeaderboard } from '@/lib/unsorry/leaderboard-mapper'
import { LEADERBOARD_FIXTURE } from '@/tests/mocks/unsorry-fixtures'

describe('GlobalLeaderboard', () => {
  it('renders a ranked row per contributor linking to the profile', () => {
    render(<GlobalLeaderboard entries={toGuildLeaderboard(LEADERBOARD_FIXTURE)} />)
    expect(screen.getByText('🥇')).toBeInTheDocument()
    expect(screen.getByText('@ohdearquant')).toBeInTheDocument()
    const link = screen.getByRole('link', { name: /ohdearquant/ })
    expect(link).toHaveAttribute('href', '/math/contributors/ohdearquant')
  })

  it('shows a Dispatch column with the dispatched-PR count', () => {
    render(<GlobalLeaderboard entries={toGuildLeaderboard(LEADERBOARD_FIXTURE)} />)
    expect(screen.getByRole('columnheader', { name: 'Dispatch' })).toBeInTheDocument()
    // cgbarlow dispatched 300 PRs in the fixture; non-dispatchers show an em dash.
    expect(screen.getByText('300')).toBeInTheDocument()
  })

  it('shows an empty state with no entries', () => {
    render(<GlobalLeaderboard entries={[]} />)
    expect(screen.getByText(/no contributors/i)).toBeInTheDocument()
  })

  it('renders a handle-less (github: null) contributor without crashing or linking (#43)', () => {
    // A contributor inferred from a handle-less git author (provenance is optional
    // upstream) has github: null — the page must render 200, not throw on slice/key,
    // and must not emit a broken /math/contributors/null profile link.
    const entries = toGuildLeaderboard([
      {
        rank: 1,
        github: null,
        display_name: 'unsorry-batch',
        score: 2395,
        difficulty_points: 23,
        credited_proofs: 1,
      },
    ])
    render(<GlobalLeaderboard entries={entries} />)
    expect(screen.getByText('unsorry-batch')).toBeInTheDocument()
    // No profile link for a handle-less row.
    expect(screen.queryByRole('link', { name: /unsorry-batch/ })).toBeNull()
    // Avatar fallback uses display-name initials, not a null deref.
    expect(screen.getByText('UN')).toBeInTheDocument()
  })

  it('sorts a handle-less row after handled rows at equal score (null-safe tie-break)', () => {
    const entries = toGuildLeaderboard([
      { rank: 2, github: null, display_name: 'unsorry-batch', score: 100, difficulty_points: 1, credited_proofs: 1 },
      { rank: 1, github: 'zeta', score: 100, difficulty_points: 1, credited_proofs: 1 },
    ])
    // No throw from localeCompare; the handled 'zeta' ranks first at the score tie.
    expect(entries[0].github).toBe('zeta')
    expect(entries[1].github).toBeNull()
  })
})
