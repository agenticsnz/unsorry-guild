import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GoalDecomposition } from '@/components/math/goal-decomposition'
import type { ResolvedDecomposition } from '@/lib/unsorry/decomposition'

const RESOLVED: ResolvedDecomposition = {
  parent: 'sq-add-sq-eq-three-mul-sq',
  agent: 'oma-2-c50d',
  composed: {
    id: 'sq-add-sq-eq-three-mul-sq',
    status: 'proved',
    proved: true,
    solver: 'ohdearquant',
    name: 'sq_add_sq_eq_three_mul_sq',
    href: '/math/proofs/sq-add-sq-eq-three-mul-sq',
  },
  subs: [
    {
      id: 'sq-add-sq-eq-three-mul-sq-s1',
      status: 'proved',
      proved: true,
      solver: 'beast',
      name: 'sub_one',
      href: '/math/proofs/sq-add-sq-eq-three-mul-sq-s1',
    },
    {
      id: 'three-not-sum-of-two-squares',
      status: 'open',
      proved: false,
      href: '/math/proofs/three-not-sum-of-two-squares',
    },
  ],
}

describe('GoalDecomposition', () => {
  it('renders nothing when there is no decomposition', () => {
    const { container } = render(<GoalDecomposition decomposition={null} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the helper list and the composed-proof row when a decomposition is present', () => {
    render(<GoalDecomposition decomposition={RESOLVED} />)
    expect(screen.getByRole('heading', { name: /decomposition/i })).toBeInTheDocument()
    expect(screen.getByText('sq-add-sq-eq-three-mul-sq-s1')).toBeInTheDocument()
    expect(screen.getByText('three-not-sum-of-two-squares')).toBeInTheDocument()
    // The composed-proof row references the parent as the assembled result.
    expect(screen.getByText(/composed proof/i)).toBeInTheDocument()
  })

  it('shows attribution and a link for a proved sub', () => {
    render(<GoalDecomposition decomposition={RESOLVED} />)
    const subLink = screen.getByRole('link', { name: /sq-add-sq-eq-three-mul-sq-s1/ })
    expect(subLink).toHaveAttribute('href', '/math/proofs/sq-add-sq-eq-three-mul-sq-s1')
    const attribution = screen.getByRole('link', { name: '@beast' })
    expect(attribution).toHaveAttribute('href', '/math/contributors/beast')
  })

  it('shows the open state for an unproved sub', () => {
    render(<GoalDecomposition decomposition={RESOLVED} />)
    const openRow = screen.getByText('three-not-sum-of-two-squares').closest('li')
    expect(openRow).not.toBeNull()
    expect(openRow).toHaveTextContent(/open/i)
    // An open sub has no solver-attribution link.
    expect(screen.queryByRole('link', { name: '@' })).toBeNull()
  })
})
