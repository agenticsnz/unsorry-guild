import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { usePhilosophyQuote, useAllQuotes } from '@/lib/hooks/use-philosophy-quote'
import { createWrapper } from '@/tests/utils/test-utils'
import {
  mockQuotes,
  mockInactiveQuote,
  createMockQuote,
} from '@/tests/mocks/engagement-fixtures'

// Mock Supabase client
const mockOrder = vi.fn()
const mockIs = vi.fn()
const mockNot = vi.fn()
const mockEq = vi.fn()
const mockSelect = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: mockFrom,
  }),
}))

describe('usePhilosophyQuote', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('fetching quotes', () => {
    beforeEach(() => {
      // Setup mock chain for ordered quotes query that returns results
      mockOrder.mockResolvedValue({ data: mockQuotes, error: null })
      mockNot.mockReturnValue({ order: mockOrder })
      mockEq.mockReturnValue({ not: mockNot })
      mockSelect.mockReturnValue({ eq: mockEq })
      mockFrom.mockReturnValue({ select: mockSelect })
    })

    it('should fetch quotes from database', async () => {
      const { result } = renderHook(() => usePhilosophyQuote(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(mockFrom).toHaveBeenCalledWith('philosophy_quotes')
      expect(mockEq).toHaveBeenCalledWith('is_active', true)
    })

    it('should return a quote when data exists', async () => {
      const { result } = renderHook(() => usePhilosophyQuote(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toBeDefined()
      expect(result.current.data?.quote).toBeDefined()
      expect(result.current.data?.is_active).toBe(true)
    })

    it('should include quote attribution when available', async () => {
      const { result } = renderHook(() => usePhilosophyQuote(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // First quote has attribution
      if (result.current.data?.id === mockQuotes[0].id) {
        expect(result.current.data?.attribution).toBe('Peter Drucker')
      }
    })
  })

  describe('ordered vs random quotes', () => {
    it('should return ordered quotes when display_order is set', async () => {
      const orderedQuotes = mockQuotes.map((q, i) => ({ ...q, display_order: i + 1 }))
      mockOrder.mockResolvedValue({ data: orderedQuotes, error: null })
      mockNot.mockReturnValue({ order: mockOrder })
      mockEq.mockReturnValue({ not: mockNot })
      mockSelect.mockReturnValue({ eq: mockEq })
      mockFrom.mockReturnValue({ select: mockSelect })

      const { result } = renderHook(() => usePhilosophyQuote(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toBeDefined()
    })
  })

  describe('loading states', () => {
    it('should show loading state initially', () => {
      mockOrder.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ data: mockQuotes, error: null }), 100))
      )
      mockNot.mockReturnValue({ order: mockOrder })
      mockEq.mockReturnValue({ not: mockNot })
      mockSelect.mockReturnValue({ eq: mockEq })
      mockFrom.mockReturnValue({ select: mockSelect })

      const { result } = renderHook(() => usePhilosophyQuote(), {
        wrapper: createWrapper(),
      })

      expect(result.current.isLoading).toBe(true)
      expect(result.current.data).toBeUndefined()
    })
  })

  describe('caching behavior', () => {
    it('should cache results', async () => {
      mockOrder.mockResolvedValue({ data: mockQuotes, error: null })
      mockNot.mockReturnValue({ order: mockOrder })
      mockEq.mockReturnValue({ not: mockNot })
      mockSelect.mockReturnValue({ eq: mockEq })
      mockFrom.mockReturnValue({ select: mockSelect })

      const { result } = renderHook(() => usePhilosophyQuote(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Verify data was returned
      expect(result.current.data).toBeDefined()
      expect(mockFrom).toHaveBeenCalledTimes(1)
    })
  })
})

describe('useAllQuotes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockOrder.mockResolvedValue({ data: mockQuotes, error: null })
    mockSelect.mockReturnValue({ order: mockOrder })
    mockFrom.mockReturnValue({ select: mockSelect })
  })

  it('should fetch all quotes', async () => {
    const { result } = renderHook(() => useAllQuotes(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockFrom).toHaveBeenCalledWith('philosophy_quotes')
    expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false })
  })

  it('should return all quotes including inactive', async () => {
    const allQuotes = [...mockQuotes, mockInactiveQuote]
    mockOrder.mockResolvedValue({ data: allQuotes, error: null })

    const { result } = renderHook(() => useAllQuotes(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toHaveLength(4)
    expect(result.current.data).toContainEqual(mockInactiveQuote)
  })

  it('should handle empty results', async () => {
    mockOrder.mockResolvedValue({ data: [], error: null })

    const { result } = renderHook(() => useAllQuotes(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual([])
  })

  it('should handle database errors', async () => {
    mockOrder.mockResolvedValue({ data: null, error: new Error('DB error') })

    const { result } = renderHook(() => useAllQuotes(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })
})
