'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { UserEngagementPreferences } from '@/lib/types/engagement'

// Type for the raw database response
interface UserPrefsRow {
  show_activity_in_feed: boolean
  show_streak_publicly: boolean
  enable_nudge_banners: boolean
}

/**
 * Fetch user engagement preferences from the users table
 */
async function fetchEngagementPreferences(userId: string): Promise<UserEngagementPreferences | null> {
  const supabase = createClient()

  const { data: rawData, error } = await supabase
    .from('users')
    .select('show_activity_in_feed, show_streak_publicly, enable_nudge_banners')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching engagement preferences:', error)
    throw error
  }

  if (!rawData) return null

  const data = rawData as unknown as UserPrefsRow

  return {
    show_activity_in_feed: data.show_activity_in_feed ?? true,
    show_streak_publicly: data.show_streak_publicly ?? true,
    enable_nudge_banners: data.enable_nudge_banners ?? true,
  }
}

/**
 * Hook to fetch user engagement preferences
 */
export function useEngagementPreferences(userId: string | undefined) {
  return useQuery({
    queryKey: ['engagement-preferences', userId],
    queryFn: () => fetchEngagementPreferences(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

interface UpdateEngagementPreferencesParams {
  userId: string
  preferences: Partial<UserEngagementPreferences>
}

/**
 * Hook to update user engagement preferences
 */
export function useUpdateEngagementPreferences() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, preferences }: UpdateEngagementPreferencesParams) => {
      const supabase = createClient()

      const updatePayload = {
        ...preferences,
        updated_at: new Date().toISOString(),
      } as Record<string, unknown>

      const { data: rawData, error } = await (supabase
        .from('users') as ReturnType<typeof supabase.from>)
        .update(updatePayload)
        .eq('id', userId)
        .select('show_activity_in_feed, show_streak_publicly, enable_nudge_banners')
        .single()

      if (error) {
        console.error('Error updating engagement preferences:', error)
        throw error
      }

      const data = rawData as unknown as UserPrefsRow

      return {
        show_activity_in_feed: data.show_activity_in_feed ?? true,
        show_streak_publicly: data.show_streak_publicly ?? true,
        enable_nudge_banners: data.enable_nudge_banners ?? true,
      } as UserEngagementPreferences
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['engagement-preferences', variables.userId],
      })
    },
  })
}
