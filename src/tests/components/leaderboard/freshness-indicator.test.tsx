import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  FreshnessIndicator,
  describeFreshness,
  STALE_AFTER_MS,
} from '@/components/leaderboard/freshness-indicator'

const NOW = new Date('2026-06-25T06:13:00Z')
const ago = (ms: number) => new Date(NOW.getTime() - ms).toISOString()

describe('describeFreshness', () => {
  it('returns null for a missing or unparseable timestamp', () => {
    expect(describeFreshness(undefined, NOW)).toBeNull()
    expect(describeFreshness('not-a-date', NOW)).toBeNull()
  })

  it('reports "just now" for a fresh artifact', () => {
    expect(describeFreshness(ago(5_000), NOW)?.label).toBe('just now')
  })

  it('reports whole minutes and hours', () => {
    expect(describeFreshness(ago(12 * 60_000), NOW)?.label).toBe('12 min ago')
    // 90 minutes floors to 1 h, not 2 h
    expect(describeFreshness(ago(90 * 60_000), NOW)?.label).toBe('1 h ago')
    expect(describeFreshness(ago(3 * 60 * 60_000), NOW)?.label).toBe('3 h ago')
  })

  it('reports days with correct pluralisation', () => {
    expect(describeFreshness(ago(24 * 60 * 60_000), NOW)?.label).toBe('1 day ago')
    expect(describeFreshness(ago(50 * 60 * 60_000), NOW)?.label).toBe('2 days ago')
  })

  it('flags isStale only at/after the threshold', () => {
    expect(describeFreshness(ago(STALE_AFTER_MS - 60_000), NOW)?.isStale).toBe(false)
    expect(describeFreshness(ago(STALE_AFTER_MS), NOW)?.isStale).toBe(true)
  })

  it('clamps future timestamps to "just now" rather than negative ages', () => {
    expect(describeFreshness(ago(-30_000), NOW)?.label).toBe('just now')
  })
})

describe('FreshnessIndicator', () => {
  it('renders nothing without a timestamp', () => {
    const { container } = render(<FreshnessIndicator generatedAt={undefined} now={NOW} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows the fresh age without a lag warning', () => {
    render(<FreshnessIndicator generatedAt={ago(3 * 60_000)} now={NOW} />)
    expect(screen.getByText(/Updated 3 min ago/)).toBeInTheDocument()
    expect(screen.queryByText(/lagging upstream/)).not.toBeInTheDocument()
  })

  it('warns when the artifact is stale', () => {
    render(<FreshnessIndicator generatedAt={ago(3 * 60 * 60_000)} now={NOW} />)
    expect(screen.getByText(/Updated 3 h ago/)).toBeInTheDocument()
    expect(screen.getByText(/lagging upstream/)).toBeInTheDocument()
  })

  it('uses the noun in the hover title (default Leaderboard; overridable)', () => {
    const { rerender } = render(<FreshnessIndicator generatedAt={ago(60_000)} now={NOW} />)
    expect(screen.getByTitle(/^Leaderboard data generated/)).toBeInTheDocument()
    rerender(<FreshnessIndicator generatedAt={ago(60_000)} now={NOW} noun="Queue" />)
    expect(screen.getByTitle(/^Queue data generated/)).toBeInTheDocument()
  })
})
