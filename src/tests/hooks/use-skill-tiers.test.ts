import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useSkillTiers, useUserTier, calculateUserTier } from '@/lib/hooks/use-skill-tiers'
import { createWrapper } from '@/tests/utils/test-utils'
import { mockTierConfigs } from '@/tests/mocks/engagement-fixtures'

// Mock Supabase client
const mockOrder = vi.fn()
const mockSelect = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: mockFrom,
  }),
}))

describe('useSkillTiers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Setup default successful mock chain
    mockOrder.mockResolvedValue({ data: mockTierConfigs, error: null })
    mockSelect.mockReturnValue({ order: mockOrder })
    mockFrom.mockReturnValue({ select: mockSelect })
  })

  it('should fetch tier configuration from database', async () => {
    const { result } = renderHook(() => useSkillTiers(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockFrom).toHaveBeenCalledWith('skill_tier_config')
    expect(result.current.data).toHaveLength(5)
  })

  it('should order tiers by tier_level ascending', async () => {
    const { result } = renderHook(() => useSkillTiers(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockOrder).toHaveBeenCalledWith('tier_level', { ascending: true })
  })

  it('should handle empty results gracefully', async () => {
    mockOrder.mockResolvedValue({ data: [], error: null })

    const { result } = renderHook(() => useSkillTiers(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual([])
  })

  it('should handle database errors', async () => {
    mockOrder.mockResolvedValue({ data: null, error: new Error('DB error') })

    const { result } = renderHook(() => useSkillTiers(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })

  it('should have valid tier structure', async () => {
    const { result } = renderHook(() => useSkillTiers(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    const firstTier = result.current.data?.[0]
    expect(firstTier).toHaveProperty('tier_level')
    expect(firstTier).toHaveProperty('name')
    expect(firstTier).toHaveProperty('min_points')
    expect(firstTier).toHaveProperty('icon')
    expect(firstTier).toHaveProperty('color')
  })
})

describe('calculateUserTier', () => {
  it('should return Apprentice tier for 0 points', () => {
    const result = calculateUserTier(0, mockTierConfigs)

    expect(result.tier.name).toBe('Apprentice')
    expect(result.tier.tier_level).toBe(1)
    expect(result.points).toBe(0)
    expect(result.nextTier?.name).toBe('Journeyman')
    expect(result.pointsToNext).toBe(300)
    expect(result.progressPercent).toBe(0)
  })

  it('should return correct tier for mid-range points', () => {
    const result = calculateUserTier(450, mockTierConfigs)

    expect(result.tier.name).toBe('Journeyman')
    expect(result.tier.tier_level).toBe(2)
    expect(result.nextTier?.name).toBe('Expert')
    expect(result.pointsToNext).toBe(150)
    expect(result.progressPercent).toBe(50) // 150/300 = 50%
  })

  it('should return Legend tier for max points', () => {
    const result = calculateUserTier(3000, mockTierConfigs)

    expect(result.tier.name).toBe('Legend')
    expect(result.tier.tier_level).toBe(5)
    expect(result.nextTier).toBeNull()
    expect(result.pointsToNext).toBe(0)
    expect(result.progressPercent).toBe(100)
  })

  it('should return tier at exact threshold', () => {
    const result = calculateUserTier(600, mockTierConfigs)

    expect(result.tier.name).toBe('Expert')
    expect(result.progressPercent).toBe(0)
  })

  it('should calculate correct progress percentage', () => {
    // Apprentice: 0-299, Journeyman: 300-599
    const result = calculateUserTier(150, mockTierConfigs)

    expect(result.tier.name).toBe('Apprentice')
    expect(result.progressPercent).toBe(50) // 150/300 = 50%
  })

  it('should throw error if no tiers provided', () => {
    expect(() => calculateUserTier(100, [])).toThrow('Tier configuration is required')
  })

  it('should handle points between tiers correctly', () => {
    // Expert: 600-1199, Master: 1200-2399
    const result = calculateUserTier(900, mockTierConfigs)

    expect(result.tier.name).toBe('Expert')
    expect(result.nextTier?.name).toBe('Master')
    expect(result.pointsToNext).toBe(300) // 1200 - 900
    expect(result.progressPercent).toBe(50) // (900-600)/(1200-600) = 300/600 = 50%
  })
})

describe('useUserTier', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockOrder.mockResolvedValue({ data: mockTierConfigs, error: null })
    mockSelect.mockReturnValue({ order: mockOrder })
    mockFrom.mockReturnValue({ select: mockSelect })
  })

  it('should return null when userPoints is undefined', async () => {
    const { result } = renderHook(() => useUserTier(undefined), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.tierInfo).toBeNull()
  })

  it('should return tier info when userPoints is provided', async () => {
    const { result } = renderHook(() => useUserTier(450), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.tierInfo).not.toBeNull()
    })

    expect(result.current.tierInfo?.tier.name).toBe('Journeyman')
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
})
