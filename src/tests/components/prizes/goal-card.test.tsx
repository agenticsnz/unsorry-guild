import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PrizeCard } from '@/components/prizes/prize-card'
import type { Prize } from '@/lib/prizes/prizes'
import type { TargetProgress } from '@/lib/unsorry/types'

const PRIZE: Prize = {
  id: 'sq-add-sq-eq-three-mul-sq',
  domainId: 'math',
  headlineGoalId: 'sq-add-sq-eq-three-mul-sq',
  title: 'Sum of Two Squares = 3·Square',
  description: 'Prove the headline goal with its full decomposition tree.',
  badgeEmoji: '🟦',
  status: 'active',
}

const PROGRESS: TargetProgress = {
  headlineId: 'sq-add-sq-eq-three-mul-sq',
  total: 12,
  proved: 8,
  blocked: 1,
  open: 3,
  archived: 0,
  percentProved: 67,
  headlineStatus: 'blocked',
  isClosed: false,
}

describe('PrizeCard copy-id control (SPEC-022-A)', () => {
  const writeText = vi.fn().mockResolvedValue(undefined)

  beforeEach(() => {
    writeText.mockClear()
    Object.assign(navigator, { clipboard: { writeText } })
  })

  it('links to the /math/goals detail route', () => {
    render(<PrizeCard prize={PRIZE} progress={PROGRESS} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/math/goals/sq-add-sq-eq-three-mul-sq')
  })

  it('copies the goal id to the clipboard without navigating', async () => {
    render(<PrizeCard prize={PRIZE} progress={PROGRESS} />)
    const button = screen.getByRole('button', { name: /copy goal id/i })

    // fireEvent.click returns false when the default (navigation) was prevented.
    const notPrevented = fireEvent.click(button)
    expect(notPrevented).toBe(false)

    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith('sq-add-sq-eq-three-mul-sq'),
    )
  })
})
