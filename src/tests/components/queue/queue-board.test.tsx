import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueueBoard } from '@/components/queue/queue-board'
import { QUEUE_FIXTURE } from '@/tests/mocks/unsorry-fixtures'

describe('QueueBoard', () => {
  it('renders summary stats and a per-solver row, sorted by submissions', () => {
    render(<QueueBoard queue={QUEUE_FIXTURE} />)
    expect(screen.getAllByText('In flight').length).toBeGreaterThan(0)
    expect(screen.getByText('@cgbarlow')).toBeInTheDocument()
    const links = screen.getAllByRole('link')
    expect(links[0]).toHaveTextContent('@ohdearquant') // highest submissions first
    expect(links[0]).toHaveAttribute('href', '/math/contributors/ohdearquant')
  })
})
