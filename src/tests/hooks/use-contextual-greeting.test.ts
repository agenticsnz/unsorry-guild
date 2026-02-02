import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useContextualGreeting } from '@/lib/hooks/use-contextual-greeting'
import { createWrapper } from '@/tests/utils/test-utils'
import {
  mockTierConfigs,
  mockGreetingData,
  mockGreetingDataWithCelebration,
  mockGreetingDataWithAction,
  mockGreetingDataWithDeadline,
  mockCelebrationGreeting,
  mockActionGreeting,
  mockProgressionGreeting,
  mockTimeGreetingMorning,
  mockTimeGreetingAfternoon,
  mockTimeGreetingEvening,
  mockUserStreak,
} from '@/tests/mocks/engagement-fixtures'

// Mock sessionStorage
const mockSessionStorage: Record<string, string> = {}
const mockGetItem = vi.fn((key: string) => mockSessionStorage[key] || null)
const mockSetItem = vi.fn((key: string, value: string) => {
  mockSessionStorage[key] = value
})
const mockRemoveItem = vi.fn((key: string) => {
  delete mockSessionStorage[key]
})

Object.defineProperty(global, 'sessionStorage', {
  value: {
    getItem: mockGetItem,
    setItem: mockSetItem,
    removeItem: mockRemoveItem,
    clear: () => {
      Object.keys(mockSessionStorage).forEach((key) => delete mockSessionStorage[key])
    },
  },
  writable: true,
})

// Mock Supabase client
const mockSingle = vi.fn()
const mockLimit = vi.fn()
const mockOrder = vi.fn()
const mockGte = vi.fn()
const mockLte = vi.fn()
const mockNot = vi.fn()
const mockIn = vi.fn()
const mockEq = vi.fn()
const mockSelect = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: mockFrom,
  }),
}))

describe('useContextualGreeting', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()

    // Clear sessionStorage mock
    Object.keys(mockSessionStorage).forEach((key) => delete mockSessionStorage[key])

    // Setup default mock chain
    setupDefaultMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
    Object.keys(mockSessionStorage).forEach((key) => delete mockSessionStorage[key])
  })

  function setupDefaultMocks() {
    // Mock for greeting data fetch - completed quests
    const mockCompletedQuestsQuery = {
      data: [],
      error: null,
    }

    // Mock for approved objectives count
    const mockApprovedCount = {
      count: 0,
      error: null,
    }

    // Mock for upcoming deadlines
    const mockDeadlines = {
      data: [],
      error: null,
    }

    // Mock for tier config
    const mockTierOrder = vi.fn().mockResolvedValue({ data: mockTierConfigs, error: null })
    const mockTierSelect = vi.fn().mockReturnValue({ order: mockTierOrder })

    // Mock for user streak
    const mockStreakSingle = vi.fn().mockResolvedValue({ data: mockUserStreak, error: null })
    const mockStreakEq = vi.fn().mockReturnValue({ single: mockStreakSingle })
    const mockStreakSelect = vi.fn().mockReturnValue({ eq: mockStreakEq })

    // Setup from mock to return different chains based on table
    mockFrom.mockImplementation((table: string) => {
      if (table === 'skill_tier_config') {
        return { select: mockTierSelect }
      }
      if (table === 'user_streaks') {
        return { select: mockStreakSelect }
      }
      if (table === 'user_quests') {
        // Return mock chain for user_quests
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gte: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue(mockCompletedQuestsQuery),
                  }),
                }),
              }),
              in: vi.fn().mockReturnValue({
                not: vi.fn().mockReturnValue({
                  lte: vi.fn().mockReturnValue({
                    gte: vi.fn().mockReturnValue({
                      order: vi.fn().mockReturnValue({
                        limit: vi.fn().mockResolvedValue(mockDeadlines),
                      }),
                    }),
                  }),
                }),
              }),
            }),
          }),
        }
      }
      if (table === 'user_objectives') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue(mockApprovedCount),
            }),
          }),
        }
      }
      return { select: mockSelect }
    })
  }

  describe('priority ordering', () => {
    it('should prioritize celebration over all others', async () => {
      // Setup mock for recently completed quest
      mockFrom.mockImplementation((table: string) => {
        if (table === 'skill_tier_config') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockTierConfigs, error: null }),
            }),
          }
        }
        if (table === 'user_streaks') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockUserStreak, error: null }),
              }),
            }),
          }
        }
        if (table === 'user_quests') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  gte: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                      limit: vi.fn().mockResolvedValue({
                        data: [
                          {
                            quest_id: 'quest-001',
                            completed_at: new Date().toISOString(),
                            quests: { title: 'Test Quest' },
                          },
                        ],
                        error: null,
                      }),
                    }),
                  }),
                }),
                in: vi.fn().mockReturnValue({
                  not: vi.fn().mockReturnValue({
                    lte: vi.fn().mockReturnValue({
                      gte: vi.fn().mockReturnValue({
                        order: vi.fn().mockReturnValue({
                          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
                        }),
                      }),
                    }),
                  }),
                }),
              }),
            }),
          }
        }
        if (table === 'user_objectives') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({ count: 5, error: null }),
              }),
            }),
          }
        }
        return { select: mockSelect }
      })

      const { result } = renderHook(
        () => useContextualGreeting('user-123', 'Test User', 450),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should show celebration even though there are approved objectives
      expect(result.current.greeting.priority).toBe('celebration')
      expect(result.current.greeting.message).toContain('Congratulations')
    })

    it('should prioritize action over progression and time', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'skill_tier_config') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockTierConfigs, error: null }),
            }),
          }
        }
        if (table === 'user_streaks') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockUserStreak, error: null }),
              }),
            }),
          }
        }
        if (table === 'user_quests') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  gte: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
                    }),
                  }),
                }),
                in: vi.fn().mockReturnValue({
                  not: vi.fn().mockReturnValue({
                    lte: vi.fn().mockReturnValue({
                      gte: vi.fn().mockReturnValue({
                        order: vi.fn().mockReturnValue({
                          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
                        }),
                      }),
                    }),
                  }),
                }),
              }),
            }),
          }
        }
        if (table === 'user_objectives') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({ count: 3, error: null }),
              }),
            }),
          }
        }
        return { select: mockSelect }
      })

      const { result } = renderHook(
        () => useContextualGreeting('user-123', 'Test User', 580), // Near tier threshold
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should show action (approved objectives) over progression
      expect(result.current.greeting.priority).toBe('action')
      expect(result.current.greeting.message).toContain('objective')
    })

    it('should prioritize progression when near tier milestone', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'skill_tier_config') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockTierConfigs, error: null }),
            }),
          }
        }
        if (table === 'user_streaks') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { ...mockUserStreak, current_streak: 5 },
                  error: null,
                }),
              }),
            }),
          }
        }
        if (table === 'user_quests') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  gte: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
                    }),
                  }),
                }),
                in: vi.fn().mockReturnValue({
                  not: vi.fn().mockReturnValue({
                    lte: vi.fn().mockReturnValue({
                      gte: vi.fn().mockReturnValue({
                        order: vi.fn().mockReturnValue({
                          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
                        }),
                      }),
                    }),
                  }),
                }),
              }),
            }),
          }
        }
        if (table === 'user_objectives') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({ count: 0, error: null }),
              }),
            }),
          }
        }
        return { select: mockSelect }
      })

      // 570 points = 30 points from Expert (600 threshold)
      const { result } = renderHook(
        () => useContextualGreeting('user-123', 'Test User', 570),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should show progression (near tier)
      expect(result.current.greeting.priority).toBe('progression')
      expect(result.current.greeting.message).toContain('points from')
    })

    it('should fallback to time-based greeting when no special conditions', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'skill_tier_config') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockTierConfigs, error: null }),
            }),
          }
        }
        if (table === 'user_streaks') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { ...mockUserStreak, current_streak: 3 },
                  error: null,
                }),
              }),
            }),
          }
        }
        if (table === 'user_quests') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  gte: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
                    }),
                  }),
                }),
                in: vi.fn().mockReturnValue({
                  not: vi.fn().mockReturnValue({
                    lte: vi.fn().mockReturnValue({
                      gte: vi.fn().mockReturnValue({
                        order: vi.fn().mockReturnValue({
                          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
                        }),
                      }),
                    }),
                  }),
                }),
              }),
            }),
          }
        }
        if (table === 'user_objectives') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({ count: 0, error: null }),
              }),
            }),
          }
        }
        return { select: mockSelect }
      })

      const { result } = renderHook(
        () => useContextualGreeting('user-123', 'Test User', 100), // Far from tier threshold
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.greeting.priority).toBe('time')
      expect(result.current.greeting.message).toContain('Test User')
    })
  })

  describe('time-based greetings', () => {
    it('should return time-based greeting with user name when no special conditions', async () => {
      // Setup mocks with no special conditions - streak not at milestone
      mockFrom.mockImplementation((table: string) => {
        if (table === 'skill_tier_config') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockTierConfigs, error: null }),
            }),
          }
        }
        if (table === 'user_streaks') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { ...mockUserStreak, current_streak: 3 }, // Not a milestone
                  error: null,
                }),
              }),
            }),
          }
        }
        if (table === 'user_quests') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  gte: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
                    }),
                  }),
                }),
                in: vi.fn().mockReturnValue({
                  not: vi.fn().mockReturnValue({
                    lte: vi.fn().mockReturnValue({
                      gte: vi.fn().mockReturnValue({
                        order: vi.fn().mockReturnValue({
                          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
                        }),
                      }),
                    }),
                  }),
                }),
              }),
            }),
          }
        }
        if (table === 'user_objectives') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({ count: 0, error: null }),
              }),
            }),
          }
        }
        return { select: mockSelect }
      })

      const { result } = renderHook(
        () => useContextualGreeting('user-123', 'Test User', 100), // Far from tier threshold
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should include user's name in time-based greeting
      expect(result.current.greeting.message).toContain('Test User')
      expect(result.current.greeting.priority).toBe('time')
    })
  })

  describe('session caching', () => {
    it('should cache greeting in session storage', async () => {
      setupDefaultMocks()

      const { result } = renderHook(
        () => useContextualGreeting('user-123', 'Test User', 100),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(mockSetItem).toHaveBeenCalled()
    })

    it('should use cached greeting when available', async () => {
      const today = new Date().toISOString().split('T')[0]
      const cachedGreeting = {
        greeting: 'Cached greeting message',
        priority: 'celebration' as const,
        subMessage: 'Cached sub message',
        timestamp: Date.now(),
        date: today,
      }

      mockGetItem.mockReturnValue(JSON.stringify(cachedGreeting))

      const { result } = renderHook(
        () => useContextualGreeting('user-123', 'Test User', 100),
        { wrapper: createWrapper() }
      )

      // Should immediately return cached greeting
      expect(result.current.greeting.message).toBe('Cached greeting message')
      expect(result.current.greeting.priority).toBe('celebration')
      expect(result.current.isLoading).toBe(false)
    })

    it('should invalidate cache from different day', async () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const cachedGreeting = {
        greeting: 'Old cached greeting',
        priority: 'celebration' as const,
        timestamp: yesterday.getTime(),
        date: yesterday.toISOString().split('T')[0],
      }

      mockGetItem.mockReturnValue(JSON.stringify(cachedGreeting))

      setupDefaultMocks()

      const { result } = renderHook(
        () => useContextualGreeting('user-123', 'Test User', 100),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should not use old cached greeting
      expect(result.current.greeting.message).not.toBe('Old cached greeting')
    })

    it('should handle corrupted cache gracefully', async () => {
      mockGetItem.mockReturnValue('invalid json{{{')

      setupDefaultMocks()

      const { result } = renderHook(
        () => useContextualGreeting('user-123', 'Test User', 100),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should fetch fresh greeting
      expect(result.current.greeting).toBeDefined()
    })
  })

  describe('streak milestone greetings', () => {
    it.each([7, 14, 30, 100])('should show progression for %d day streak', async (days) => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'skill_tier_config') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockTierConfigs, error: null }),
            }),
          }
        }
        if (table === 'user_streaks') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { ...mockUserStreak, current_streak: days },
                  error: null,
                }),
              }),
            }),
          }
        }
        if (table === 'user_quests') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  gte: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
                    }),
                  }),
                }),
                in: vi.fn().mockReturnValue({
                  not: vi.fn().mockReturnValue({
                    lte: vi.fn().mockReturnValue({
                      gte: vi.fn().mockReturnValue({
                        order: vi.fn().mockReturnValue({
                          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
                        }),
                      }),
                    }),
                  }),
                }),
              }),
            }),
          }
        }
        if (table === 'user_objectives') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({ count: 0, error: null }),
              }),
            }),
          }
        }
        return { select: mockSelect }
      })

      // Clear cache to ensure fresh fetch
      mockGetItem.mockReturnValue(null)

      const { result } = renderHook(
        () => useContextualGreeting('user-123', 'Test User', 100), // Far from tier
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.greeting.priority).toBe('progression')
      expect(result.current.greeting.message).toContain(`${days} day streak`)
    })
  })

  describe('edge cases', () => {
    it('should handle undefined userId', async () => {
      const { result } = renderHook(
        () => useContextualGreeting(undefined, 'Test User', 100),
        { wrapper: createWrapper() }
      )

      // Should return time-based greeting without fetching
      expect(result.current.greeting.priority).toBe('time')
      expect(result.current.greeting.message).toContain('Test User')
    })

    it('should handle undefined userPoints', async () => {
      setupDefaultMocks()

      const { result } = renderHook(
        () => useContextualGreeting('user-123', 'Test User', undefined),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should still work, just without tier info
      expect(result.current.greeting).toBeDefined()
    })
  })
})
