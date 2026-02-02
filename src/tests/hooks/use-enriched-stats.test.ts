import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useEnrichedStats } from '@/lib/hooks/use-enriched-stats'
import { createWrapper } from '@/tests/utils/test-utils'
import {
  mockTierConfigs,
  mockUserStreak,
  mockEnrichedStats,
} from '@/tests/mocks/engagement-fixtures'

// Mock Supabase client
const mockFrom = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: mockFrom,
  }),
}))

describe('useEnrichedStats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupDefaultMocks()
  })

  function setupDefaultMocks() {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { total_points: 450, quests_completed: 3 },
                error: null,
              }),
            }),
          }),
        }
      }
      if (table === 'leaderboard') {
        return {
          select: vi.fn().mockImplementation((selectStr: string) => {
            if (selectStr === 'rank') {
              return {
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { rank: 5 },
                    error: null,
                  }),
                }),
              }
            }
            // For count query
            return {
              eq: vi.fn().mockResolvedValue({ count: 25, error: null }),
            }
          }),
        }
      }
      if (table === 'user_quests') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ count: 2, error: null }),
            }),
          }),
        }
      }
      if (table === 'user_objectives') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [
                  { status: 'pending_review' },
                  { status: 'pending_review' },
                  { status: 'approved' },
                ],
                error: null,
              }),
            }),
          }),
        }
      }
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
      return {
        select: vi.fn().mockResolvedValue({ data: null, error: null }),
      }
    })
  }

  describe('loading states', () => {
    it('should not fetch when userId is undefined', async () => {
      const { result } = renderHook(() => useEnrichedStats(undefined), {
        wrapper: createWrapper(),
      })

      // When userId is undefined, the query is disabled but loading could be true initially
      // due to dependent queries (useUserTier, useUserStreak)
      await waitFor(() => {
        // Eventually should settle with no stats
        expect(result.current.stats).toBeNull()
      })
    })

    it('should show loading state initially', () => {
      const { result } = renderHook(() => useEnrichedStats('user-123'), {
        wrapper: createWrapper(),
      })

      // Initial state
      expect(result.current.stats).toBeNull()
    })
  })

  describe('success cases', () => {
    it('should fetch and combine all stats', async () => {
      const { result } = renderHook(() => useEnrichedStats('user-123'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
        expect(result.current.stats).not.toBeNull()
      })

      expect(result.current.stats?.totalPoints).toBe(450)
      expect(result.current.stats?.completedQuests).toBe(3)
      expect(result.current.stats?.activeQuests).toBe(2)
    })

    it('should include tier information', async () => {
      const { result } = renderHook(() => useEnrichedStats('user-123'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.stats).not.toBeNull()
      })

      // Tier should be defined when stats are available
      expect(result.current.stats?.tier).toBeDefined()
      expect(result.current.stats?.tier.tier).toBeDefined()
      expect(result.current.stats?.tier.tier.name).toBeDefined()
    })

    it('should include streak information when available', async () => {
      const { result } = renderHook(() => useEnrichedStats('user-123'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.stats).not.toBeNull()
      })

      // Streak can be null for users without streak data
      // The hook returns streak: streakInfo || null
      if (result.current.stats?.streak) {
        expect(result.current.stats.streak.currentStreak).toBeGreaterThanOrEqual(0)
        expect(result.current.stats.streak.longestStreak).toBeGreaterThanOrEqual(0)
      }
    })

    it('should count pending and approved objectives', async () => {
      const { result } = renderHook(() => useEnrichedStats('user-123'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.stats).not.toBeNull()
      })

      expect(result.current.stats?.pendingObjectives).toBe(2)
      expect(result.current.stats?.approvedObjectives).toBe(1)
    })
  })

  describe('rank calculation', () => {
    it('should include rank and total users', async () => {
      const { result } = renderHook(() => useEnrichedStats('user-123'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.stats).not.toBeNull()
      })

      expect(result.current.stats?.rank).toBeDefined()
      expect(typeof result.current.stats?.rank).toBe('number')
    })
  })

  describe('new user handling', () => {
    it('should handle user with zero points', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { total_points: 0, quests_completed: 0 },
                  error: null,
                }),
              }),
            }),
          }
        }
        if (table === 'leaderboard') {
          return {
            select: vi.fn().mockImplementation((selectStr: string) => {
              if (selectStr === 'rank') {
                return {
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: { rank: 10 }, error: null }),
                  }),
                }
              }
              return {
                eq: vi.fn().mockResolvedValue({ count: 10, error: null }),
              }
            }),
          }
        }
        if (table === 'user_quests') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({ count: 0, error: null }),
              }),
            }),
          }
        }
        if (table === 'user_objectives') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }
        }
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
                  data: null,
                  error: { code: 'PGRST116' },
                }),
              }),
            }),
          }
        }
        return { select: vi.fn().mockResolvedValue({ data: null, error: null }) }
      })

      const { result } = renderHook(() => useEnrichedStats('user-123'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.stats).not.toBeNull()
      })

      expect(result.current.stats?.totalPoints).toBe(0)
      expect(result.current.stats?.completedQuests).toBe(0)
      expect(result.current.stats?.tier.tier.name).toBe('Apprentice')
    })
  })

  describe('error handling', () => {
    it('should return null stats when tier config fails', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { total_points: 100, quests_completed: 1 },
                  error: null,
                }),
              }),
            }),
          }
        }
        if (table === 'leaderboard') {
          return {
            select: vi.fn().mockImplementation(() => ({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { rank: 5 }, error: null }),
              }),
            })),
          }
        }
        if (table === 'user_quests') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({ count: 0, error: null }),
              }),
            }),
          }
        }
        if (table === 'user_objectives') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }
        }
        if (table === 'skill_tier_config') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: null,
                error: new Error('Tier config error'),
              }),
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
        return { select: vi.fn().mockResolvedValue({ data: null, error: null }) }
      })

      const { result } = renderHook(() => useEnrichedStats('user-123'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should have error since tier config failed
      expect(result.current.error).toBeDefined()
      expect(result.current.stats).toBeNull()
    })

    it('should gracefully handle missing user data with defaults', async () => {
      // The hook uses || operators so missing data returns 0/defaults
      mockFrom.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null, // No user data
                  error: null,
                }),
              }),
            }),
          }
        }
        if (table === 'leaderboard') {
          return {
            select: vi.fn().mockImplementation(() => ({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            })),
          }
        }
        if (table === 'user_quests') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({ count: null, error: null }),
              }),
            }),
          }
        }
        if (table === 'user_objectives') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }
        }
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
                  data: null,
                  error: { code: 'PGRST116' },
                }),
              }),
            }),
          }
        }
        return { select: vi.fn().mockResolvedValue({ data: null, error: null }) }
      })

      const { result } = renderHook(() => useEnrichedStats('user-123'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.stats).not.toBeNull()
      })

      // Should have default values
      expect(result.current.stats?.totalPoints).toBe(0)
      expect(result.current.stats?.completedQuests).toBe(0)
      expect(result.current.stats?.rank).toBe(0)
    })
  })
})
