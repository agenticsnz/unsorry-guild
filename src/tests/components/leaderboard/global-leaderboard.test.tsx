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

  it('shows an empty state with no entries', () => {
    render(<GlobalLeaderboard entries={[]} />)
    expect(screen.getByText(/no contributors/i)).toBeInTheDocument()
  })
})
