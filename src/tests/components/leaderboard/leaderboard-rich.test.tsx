import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SummaryStats } from '@/components/leaderboard/summary-stats'
import { ModelDistribution } from '@/components/leaderboard/model-distribution'
import { SourcingTable } from '@/components/leaderboard/sourcing-table'
import { ProofsOverTime } from '@/components/leaderboard/proofs-over-time'
import {
  SUMMARY_FIXTURE,
  MODELS_FIXTURE,
  SOURCING_FIXTURE,
  TIMELINES_FIXTURE,
} from '@/tests/mocks/unsorry-fixtures'

describe('SummaryStats', () => {
  it('shows the four headline numbers', () => {
    render(<SummaryStats summary={SUMMARY_FIXTURE} />)
    expect(screen.getByText('1,791')).toBeInTheDocument()
    expect(screen.getByText('Verified proofs')).toBeInTheDocument()
  })
})

describe('ModelDistribution', () => {
  it('lists models with verified>0, sorted, excluding zero-proof models', () => {
    render(<ModelDistribution models={MODELS_FIXTURE} />)
    expect(screen.getByText('python / sympy')).toBeInTheDocument()
    expect(screen.getByText('lean / decide')).toBeInTheDocument()
    expect(screen.queryByText('zero / proofs')).not.toBeInTheDocument()
  })
})

describe('SourcingTable', () => {
  it('renders sourcers ranked by sourced goals, linked to profiles', () => {
    render(<SourcingTable entries={SOURCING_FIXTURE} />)
    const link = screen.getByRole('link', { name: /Chris Barlow/ })
    expect(link).toHaveAttribute('href', '/math/contributors/cgbarlow')
  })
})

describe('ProofsOverTime', () => {
  it('renders a chart and toggles merge/solve', () => {
    render(<ProofsOverTime timelines={TIMELINES_FIXTURE} />)
    // merge default: 2,027 cumulative
    expect(screen.getByText(/2,027 cumulative/)).toBeInTheDocument()
    fireEvent.click(screen.getByText('By solve'))
    expect(screen.getByText(/500 cumulative/)).toBeInTheDocument()
  })
})
