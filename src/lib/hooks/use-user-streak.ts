'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { StreakInfo, UserStreak, WeekendBehavior } from '@/lib/types/engagement'

/**
 * Calculate if streak is at risk (no activity yesterday on a weekday)
 */
function calculateStreakRisk(streak: UserStreak | null): boolean {
  if (!streak || !streak.last_activity_date) {
    return false
  }

  const today = new Date()
  const lastActivity = new Date(streak.last_activity_date)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  // Format dates for comparison (YYYY-MM-DD)
  const lastActivityStr = lastActivity.toISOString().split('T')[0]
  const yesterdayStr = yesterday.toISOString().split('T')[0]
  const todayStr = today.toISOString().split('T')[0]

  // Activity today - not at risk
  if (lastActivityStr === todayStr) {
    return false
  }

  // Activity yesterday - not at risk
  if (lastActivityStr === yesterdayStr) {
    return false
  }

  // Check weekend behavior
  if (streak.weekend_behavior === 'weekends_freeze') {
    // If all missed days were weekends, not at risk
    let d = new Date(lastActivity)
    d.setDate(d.getDate() + 1)
    while (d < today) {
      const dow = d.getDay()
      if (dow !== 0 && dow !== 6) {
        // Missed a weekday
        return true
      }
      d.setDate(d.getDate() + 1)
    }
    return false
  }

  if (streak.weekend_behavior === 'weekends_optional') {
    // If only weekends were missed, not at risk
    let d = new Date(lastActivity)
    d.setDate(d.getDate() + 1)
    while (d < today) {
      const dow = d.getDay()
      if (dow !== 0 && dow !== 6) {
        // Missed a weekday
        return true
      }
      d.setDate(d.getDate() + 1)
    }
    return false
  }

  // weekends_count - any gap is a risk
  return true
}

/**
 * Fetch user's streak data from the database
 */
async function fetchUserStreak(userId: string): Promise<StreakInfo | null> {
  const supabase = createClient()

  // Cast to any because user_streaks table isn't in generated types yet
  const { data, error } = await (supabase as any)
    .from('user_streaks')
    .select('*')
    .eq('user_id', userId)
    .single()

  // PGRST116 = not found, which is okay for new users
  if (error && error.code !== 'PGRST116') {
    throw error
  }

  if (!data) {
    // Return default for new users
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: null,
      weekendBehavior: 'weekends_count',
      isStreakAtRisk: false,
    }
  }

  const streak = data as UserStreak

  return {
    currentStreak: streak.current_streak,
    longestStreak: streak.longest_streak,
    lastActivityDate: streak.last_activity_date,
    weekendBehavior: streak.weekend_behavior,
    isStreakAtRisk: calculateStreakRisk(streak),
  }
}

/**
 * Hook to fetch user's streak information
 */
export function useUserStreak(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-streak', userId],
    queryFn: () => fetchUserStreak(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Update user's weekend behavior preference
 */
async function updateWeekendBehavior(
  userId: string,
  behavior: WeekendBehavior
): Promise<void> {
  const supabase = createClient()

  const { error } = await (supabase as any)
    .from('user_streaks')
    .update({ weekend_behavior: behavior })
    .eq('user_id', userId)

  if (error) {
    throw error
  }
}

/**
 * Hook to update weekend behavior preference
 */
export function useUpdateWeekendBehavior() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, behavior }: { userId: string; behavior: WeekendBehavior }) =>
      updateWeekendBehavior(userId, behavior),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['user-streak', userId] })
    },
  })
}
