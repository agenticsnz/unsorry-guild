import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TargetBadges } from '@/components/profile/target-badges'

describe('TargetBadges', () => {
  it('renders podium and contributor badges', () => {
    render(
      <TargetBadges
        badges={[
          { prizeTitle: 'Sum of Two Squares', badgeEmoji: '🟦', headlineGoalId: 'sq', place: 1, creditedProofs: 3 },
          { prizeTitle: 'Other Prize', badgeEmoji: '🏅', headlineGoalId: 'oth', place: null, creditedProofs: 1 },
        ]}
      />,
    )
    expect(screen.getByText('Sum of Two Squares')).toBeInTheDocument()
    expect(screen.getByText(/Podium #1/)).toBeInTheDocument()
    expect(screen.getByText(/Contributor/)).toBeInTheDocument()
    expect(screen.getByText(/1 proof$/)).toBeInTheDocument()
  })

  it('shows an empty state', () => {
    render(<TargetBadges badges={[]} />)
    expect(screen.getByText(/no goal contributions/i)).toBeInTheDocument()
  })
})
