'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useUserTier } from './use-skill-tiers'
import { useUserStreak } from './use-user-streak'
import type { EnrichedStats } from '@/lib/types/engagement'

interface UserStatsData {
  totalPoints: number
  rank: number
  totalUsers: number
  activeQuests: number
  completedQuests: number
  pendingObjectives: number
  approvedObjectives: number
}

/**
 * Fetch enriched stats from the database
 */
async function fetchEnrichedStats(userId: string): Promise<UserStatsData> {
  const supabase = createClient()

  // Fetch user data
  const { data: userData } = await supabase
    .from('users')
    .select('total_points, quests_completed')
    .eq('id', userId)
    .single()

  const user = userData as { total_points: number; quests_completed: number } | null

  // Fetch user rank from leaderboard view
  const { data: rankResult } = await supabase
    .from('leaderboard')
    .select('rank')
    .eq('id', userId)
    .single()

  const rankData = rankResult as { rank: number } | null

  // Fetch total users on leaderboard
  const { count: totalUsers } = await supabase
    .from('leaderboard')
    .select('*', { count: 'exact', head: true })

  // Fetch active quests count
  const { count: activeQuests } = await supabase
    .from('user_quests')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .in('status', ['accepted', 'in_progress'])

  // Fetch objective stats
  const { data: objectivesData } = await supabase
    .from('user_objectives')
    .select('status, user_quests!inner(user_id)')
    .eq('user_quests.user_id', userId)
    .in('status', ['pending_review', 'approved'])

  const objectives = objectivesData as Array<{ status: string }> | null
  const pendingObjectives = objectives?.filter(o => o.status === 'pending_review').length || 0
  const approvedObjectives = objectives?.filter(o => o.status === 'approved').length || 0

  return {
    totalPoints: user?.total_points || 0,
    rank: Number(rankData?.rank) || 0,
    totalUsers: totalUsers || 0,
    activeQuests: activeQuests || 0,
    completedQuests: user?.quests_completed || 0,
    pendingObjectives,
    approvedObjectives,
  }
}

/**
 * Hook to fetch enriched user statistics
 * Combines basic stats with tier and streak information
 */
export function useEnrichedStats(userId: string | undefined) {
  // Fetch basic stats
  const { data: stats, isLoading: isLoadingStats, error: statsError } = useQuery({
    queryKey: ['enriched-stats', userId],
    queryFn: () => fetchEnrichedStats(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })

  // Get tier info based on points
  const { tierInfo, isLoading: isLoadingTier, error: tierError } = useUserTier(stats?.totalPoints)

  // Get streak info
  const { data: streakInfo, isLoading: isLoadingStreak, error: streakError } = useUserStreak(userId)

  const isLoading = isLoadingStats || isLoadingTier || isLoadingStreak
  const error = statsError || tierError || streakError

  if (isLoading || error || !stats || !tierInfo) {
    return {
      stats: null,
      isLoading,
      error,
    }
  }

  const enrichedStats: EnrichedStats = {
    ...stats,
    tier: tierInfo,
    streak: streakInfo || null,
  }

  return {
    stats: enrichedStats,
    isLoading: false,
    error: null,
  }
}
