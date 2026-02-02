'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { TierConfig, TierInfo } from '@/lib/types/engagement'

/**
 * Fetch skill tier configuration from the database
 */
async function fetchSkillTiers(): Promise<TierConfig[]> {
  const supabase = createClient()

  // Cast to any because skill_tier_config table isn't in generated types yet
  const { data, error } = await (supabase as any)
    .from('skill_tier_config')
    .select('*')
    .order('tier_level', { ascending: true })

  if (error) {
    throw error
  }

  return (data || []) as TierConfig[]
}

/**
 * Hook to fetch skill tier configuration
 * Tiers rarely change, so we cache for 1 hour
 */
export function useSkillTiers() {
  return useQuery({
    queryKey: ['skill-tiers'],
    queryFn: fetchSkillTiers,
    staleTime: 1000 * 60 * 60, // 1 hour
    refetchOnWindowFocus: false,
  })
}

/**
 * Calculate user's tier information from their points
 */
export function calculateUserTier(userPoints: number, tiers: TierConfig[]): TierInfo {
  if (!tiers || tiers.length === 0) {
    throw new Error('Tier configuration is required')
  }

  // Sort tiers by min_points descending to find highest achieved
  const sortedDesc = [...tiers].sort((a, b) => b.min_points - a.min_points)

  // Find current tier (highest tier where user has enough points)
  const currentTier = sortedDesc.find(t => userPoints >= t.min_points) ?? sortedDesc[sortedDesc.length - 1]

  // Sort ascending to find next tier
  const sortedAsc = [...tiers].sort((a, b) => a.min_points - b.min_points)
  const currentIndex = sortedAsc.findIndex(t => t.tier_level === currentTier.tier_level)
  const nextTier = currentIndex < sortedAsc.length - 1 ? sortedAsc[currentIndex + 1] : null

  // Calculate progress to next tier
  const pointsToNext = nextTier ? Math.max(0, nextTier.min_points - userPoints) : 0

  let progressPercent = 100
  if (nextTier) {
    const tierRange = nextTier.min_points - currentTier.min_points
    const pointsInTier = userPoints - currentTier.min_points
    progressPercent = tierRange > 0 ? (pointsInTier / tierRange) * 100 : 0
  }

  return {
    tier: currentTier,
    points: userPoints,
    nextTier,
    pointsToNext,
    progressPercent: Math.min(100, Math.max(0, progressPercent)),
  }
}

/**
 * Hook to get user's current tier information
 * @param userPoints - User's total points
 */
export function useUserTier(userPoints: number | undefined) {
  const { data: tiers, isLoading, error } = useSkillTiers()

  if (isLoading || error || !tiers || userPoints === undefined) {
    return {
      tierInfo: null,
      isLoading,
      error,
    }
  }

  return {
    tierInfo: calculateUserTier(userPoints, tiers),
    isLoading: false,
    error: null,
  }
}
