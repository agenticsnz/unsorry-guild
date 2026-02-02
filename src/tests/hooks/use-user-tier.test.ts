import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { calculateUserTier, useUserTier } from '@/lib/hooks/use-skill-tiers'
import { createWrapper } from '@/tests/utils/test-utils'
import {
  mockTierConfigs,
  mockApprenticeTierInfo,
  mockJourneymanTierInfo,
  mockExpertTierInfo,
  mockMasterTierInfo,
  mockLegendTierInfo,
} from '@/tests/mocks/engagement-fixtures'

// Mock Supabase client
const mockOrder = vi.fn()
const mockSelect = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: mockFrom,
  }),
}))

describe('calculateUserTier', () => {
  describe('edge cases', () => {
    it('should return Apprentice tier for 0 points', () => {
      const result = calculateUserTier(0, mockTierConfigs)

      expect(result.tier.name).toBe('Apprentice')
      expect(result.tier.tier_level).toBe(1)
      expect(result.points).toBe(0)
      expect(result.nextTier?.name).toBe('Journeyman')
      expect(result.pointsToNext).toBe(300)
      expect(result.progressPercent).toBe(0)
    })

    it('should return Apprentice tier for negative points', () => {
      const result = calculateUserTier(-50, mockTierConfigs)

      expect(result.tier.name).toBe('Apprentice')
      expect(result.tier.tier_level).toBe(1)
      expect(result.points).toBe(-50)
      // Progress should be clamped to 0
      expect(result.progressPercent).toBe(0)
    })

    it('should return Legend tier for max points (2400)', () => {
      const result = calculateUserTier(2400, mockTierConfigs)

      expect(result.tier.name).toBe('Legend')
      expect(result.tier.tier_level).toBe(5)
      expect(result.nextTier).toBeNull()
      expect(result.pointsToNext).toBe(0)
      expect(result.progressPercent).toBe(100)
    })

    it('should return Legend tier for points exceeding max (5000)', () => {
      const result = calculateUserTier(5000, mockTierConfigs)

      expect(result.tier.name).toBe('Legend')
      expect(result.tier.tier_level).toBe(5)
      expect(result.nextTier).toBeNull()
      expect(result.pointsToNext).toBe(0)
      expect(result.progressPercent).toBe(100)
    })

    it('should throw error if no tiers provided', () => {
      expect(() => calculateUserTier(100, [])).toThrow('Tier configuration is required')
    })

    it('should throw error if tiers is undefined', () => {
      expect(() => calculateUserTier(100, undefined as any)).toThrow('Tier configuration is required')
    })
  })

  describe('tier progression', () => {
    it('should return Apprentice at 1 point', () => {
      const result = calculateUserTier(1, mockTierConfigs)

      expect(result.tier.name).toBe('Apprentice')
      expect(result.progressPercent).toBeCloseTo(0.33, 1) // 1/300
    })

    it('should return Apprentice at 150 points (mid-tier)', () => {
      const result = calculateUserTier(150, mockTierConfigs)

      expect(result.tier.name).toBe('Apprentice')
      expect(result.pointsToNext).toBe(150)
      expect(result.progressPercent).toBe(50)
    })

    it('should return Apprentice at 299 points (just below threshold)', () => {
      const result = calculateUserTier(299, mockTierConfigs)

      expect(result.tier.name).toBe('Apprentice')
      expect(result.pointsToNext).toBe(1)
      expect(result.progressPercent).toBeCloseTo(99.67, 1)
    })

    it('should return Journeyman at exactly 300 points (threshold)', () => {
      const result = calculateUserTier(300, mockTierConfigs)

      expect(result.tier.name).toBe('Journeyman')
      expect(result.tier.tier_level).toBe(2)
      expect(result.nextTier?.name).toBe('Expert')
      expect(result.progressPercent).toBe(0)
    })

    it('should return Journeyman at 450 points (mid-tier)', () => {
      const result = calculateUserTier(450, mockTierConfigs)

      expect(result.tier.name).toBe('Journeyman')
      expect(result.pointsToNext).toBe(150)
      expect(result.progressPercent).toBe(50)
    })

    it('should return Expert at exactly 600 points', () => {
      const result = calculateUserTier(600, mockTierConfigs)

      expect(result.tier.name).toBe('Expert')
      expect(result.tier.tier_level).toBe(3)
      expect(result.progressPercent).toBe(0)
    })

    it('should return Expert at 900 points (mid-tier)', () => {
      const result = calculateUserTier(900, mockTierConfigs)

      expect(result.tier.name).toBe('Expert')
      expect(result.nextTier?.name).toBe('Master')
      expect(result.pointsToNext).toBe(300)
      expect(result.progressPercent).toBe(50)
    })

    it('should return Master at exactly 1200 points', () => {
      const result = calculateUserTier(1200, mockTierConfigs)

      expect(result.tier.name).toBe('Master')
      expect(result.tier.tier_level).toBe(4)
      expect(result.progressPercent).toBe(0)
    })

    it('should return Master at 1800 points', () => {
      const result = calculateUserTier(1800, mockTierConfigs)

      expect(result.tier.name).toBe('Master')
      expect(result.nextTier?.name).toBe('Legend')
      expect(result.pointsToNext).toBe(600)
      expect(result.progressPercent).toBe(50)
    })

    it('should return Legend at exactly 2400 points', () => {
      const result = calculateUserTier(2400, mockTierConfigs)

      expect(result.tier.name).toBe('Legend')
      expect(result.tier.tier_level).toBe(5)
      expect(result.nextTier).toBeNull()
      expect(result.progressPercent).toBe(100)
    })
  })

  describe('progress percentage calculation', () => {
    it('should calculate 25% progress correctly', () => {
      // Apprentice: 0-299, range = 300
      // 25% of 300 = 75
      const result = calculateUserTier(75, mockTierConfigs)

      expect(result.progressPercent).toBe(25)
    })

    it('should calculate 75% progress correctly', () => {
      // Apprentice: 0-299, range = 300
      // 75% of 300 = 225
      const result = calculateUserTier(225, mockTierConfigs)

      expect(result.progressPercent).toBe(75)
    })

    it('should clamp progress to 100% at max tier', () => {
      const result = calculateUserTier(10000, mockTierConfigs)

      expect(result.progressPercent).toBe(100)
    })

    it('should clamp progress to 0% for negative in-tier points', () => {
      const result = calculateUserTier(-100, mockTierConfigs)

      expect(result.progressPercent).toBe(0)
    })
  })

  describe('between tiers', () => {
    it('should correctly place user at Expert 800 points', () => {
      const result = calculateUserTier(800, mockTierConfigs)

      expect(result.tier.name).toBe('Expert')
      expect(result.nextTier?.name).toBe('Master')
      expect(result.pointsToNext).toBe(400) // 1200 - 800
      // Expert range: 600-1200 = 600 points
      // Progress: (800-600)/600 = 200/600 = 33.33%
      expect(result.progressPercent).toBeCloseTo(33.33, 1)
    })

    it('should match expected fixture for Expert tier', () => {
      const result = calculateUserTier(800, mockTierConfigs)

      expect(result.tier.name).toBe(mockExpertTierInfo.tier.name)
      expect(result.pointsToNext).toBe(mockExpertTierInfo.pointsToNext)
      expect(result.progressPercent).toBeCloseTo(mockExpertTierInfo.progressPercent, 1)
    })

    it('should match expected fixture for Journeyman tier', () => {
      const result = calculateUserTier(450, mockTierConfigs)

      expect(result.tier.name).toBe(mockJourneymanTierInfo.tier.name)
      expect(result.pointsToNext).toBe(mockJourneymanTierInfo.pointsToNext)
      expect(result.progressPercent).toBe(mockJourneymanTierInfo.progressPercent)
    })

    it('should match expected fixture for Master tier', () => {
      const result = calculateUserTier(1800, mockTierConfigs)

      expect(result.tier.name).toBe(mockMasterTierInfo.tier.name)
      expect(result.pointsToNext).toBe(mockMasterTierInfo.pointsToNext)
      expect(result.progressPercent).toBe(mockMasterTierInfo.progressPercent)
    })
  })

  describe('tier metadata', () => {
    it('should include correct icon for each tier', () => {
      expect(calculateUserTier(0, mockTierConfigs).tier.icon).toBe('Sprout')
      expect(calculateUserTier(300, mockTierConfigs).tier.icon).toBe('TreeDeciduous')
      expect(calculateUserTier(600, mockTierConfigs).tier.icon).toBe('Trees')
      expect(calculateUserTier(1200, mockTierConfigs).tier.icon).toBe('Mountain')
      expect(calculateUserTier(2400, mockTierConfigs).tier.icon).toBe('Crown')
    })

    it('should include correct color for each tier', () => {
      expect(calculateUserTier(0, mockTierConfigs).tier.color).toBe('green')
      expect(calculateUserTier(300, mockTierConfigs).tier.color).toBe('emerald')
      expect(calculateUserTier(600, mockTierConfigs).tier.color).toBe('teal')
      expect(calculateUserTier(1200, mockTierConfigs).tier.color).toBe('cyan')
      expect(calculateUserTier(2400, mockTierConfigs).tier.color).toBe('amber')
    })
  })
})

describe('useUserTier', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Setup default successful mock chain
    mockOrder.mockResolvedValue({ data: mockTierConfigs, error: null })
    mockSelect.mockReturnValue({ order: mockOrder })
    mockFrom.mockReturnValue({ select: mockSelect })
  })

  describe('loading states', () => {
    it('should return null tierInfo when userPoints is undefined', async () => {
      const { result } = renderHook(() => useUserTier(undefined), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.tierInfo).toBeNull()
    })

    it('should show loading state initially', () => {
      const { result } = renderHook(() => useUserTier(450), {
        wrapper: createWrapper(),
      })

      // Initial state should be loading
      expect(result.current.isLoading).toBe(true)
      expect(result.current.tierInfo).toBeNull()
    })
  })

  describe('success cases', () => {
    it('should return tier info when userPoints is provided', async () => {
      const { result } = renderHook(() => useUserTier(450), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.tierInfo).not.toBeNull()
      })

      expect(result.current.tierInfo?.tier.name).toBe('Journeyman')
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should handle 0 points', async () => {
      const { result } = renderHook(() => useUserTier(0), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.tierInfo).not.toBeNull()
      })

      expect(result.current.tierInfo?.tier.name).toBe('Apprentice')
    })

    it('should handle max points', async () => {
      const { result } = renderHook(() => useUserTier(3000), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.tierInfo).not.toBeNull()
      })

      expect(result.current.tierInfo?.tier.name).toBe('Legend')
      expect(result.current.tierInfo?.nextTier).toBeNull()
    })
  })

  describe('error states', () => {
    it('should handle database errors', async () => {
      mockOrder.mockResolvedValue({ data: null, error: new Error('DB error') })

      const { result } = renderHook(() => useUserTier(450), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.error).not.toBeNull()
      })

      expect(result.current.tierInfo).toBeNull()
      expect(result.current.isLoading).toBe(false)
    })

    // Note: Empty tier config case throws an error in calculateUserTier.
    // This is tested in the calculateUserTier tests above.
    // The hook will propagate the error through React Query's error boundary.
  })

  describe('reactivity', () => {
    it('should update tier when points change', async () => {
      let points = 100
      const { result, rerender } = renderHook(() => useUserTier(points), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.tierInfo?.tier.name).toBe('Apprentice')
      })

      // Update points to cross tier threshold
      points = 350
      rerender()

      await waitFor(() => {
        expect(result.current.tierInfo?.tier.name).toBe('Journeyman')
      })
    })
  })
})
