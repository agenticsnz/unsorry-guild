'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { ActivityFeedItem, ACTIVITY_STREAK_MILESTONES } from '@/lib/types/engagement'

interface RawActivity {
  id: string
  user_id: string
  type: string
  title: string
  description: string | null
  reference_type: string | null
  reference_id: string | null
  points_earned: number
  is_public: boolean
  created_at: string
  users: {
    id: string
    display_name: string | null
    avatar_url: string | null
    show_activity_in_feed: boolean
  } | null
}

/**
 * Fetch activity feed items from users who have sharing enabled
 */
async function fetchActivityFeed(limit: number = 20): Promise<ActivityFeedItem[]> {
  const supabase = createClient()

  const { data: rawData, error } = await supabase
    .from('activities')
    .select(`
      *,
      users!activities_user_id_fkey (
        id,
        display_name,
        avatar_url,
        show_activity_in_feed
      )
    `)
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(limit * 2) // Fetch more to account for filtering

  if (error) {
    console.error('Error fetching activity feed:', error)
    throw error
  }

  const activities = (rawData || []) as unknown as RawActivity[]

  // Filter to only users who have sharing enabled
  const sharedActivities = activities.filter(
    (a) => a.users?.show_activity_in_feed !== false
  )

  // Transform to ActivityFeedItem format
  return sharedActivities.slice(0, limit).map((activity) => {
    const baseItem = {
      id: activity.id,
      user: {
        id: activity.user_id,
        display_name: activity.users?.display_name || 'Anonymous',
        avatar_url: activity.users?.avatar_url || null,
      },
      timestamp: activity.created_at,
    }

    // Map activity types to feed item types
    switch (activity.type) {
      case 'quest_completed':
        return {
          ...baseItem,
          type: 'quest_completion' as const,
          data: {
            quest_id: activity.reference_id || '',
            quest_title: activity.title.replace('Completed quest: ', ''),
            points_earned: activity.points_earned,
          },
        }

      case 'objective_completed':
        return {
          ...baseItem,
          type: 'objective_completion' as const,
          data: {
            objective_id: activity.reference_id || '',
            objective_title: activity.title.replace('Completed objective: ', ''),
            quest_title: '', // Not available from activity record
            points_earned: activity.points_earned,
          },
        }

      case 'badge_earned':
        return {
          ...baseItem,
          type: 'badge_earned' as const,
          data: {
            badge_id: activity.reference_id || '',
            badge_name: activity.title.replace('Earned badge: ', ''),
            badge_description: activity.description || '',
          },
        }

      case 'level_up':
        return {
          ...baseItem,
          type: 'tier_advancement' as const,
          data: {
            previous_tier: '',
            new_tier: activity.title.replace('Leveled up to: ', ''),
            new_tier_icon: '',
            new_tier_color: '',
          },
        }

      default:
        // Default to quest completion for unknown types
        return {
          ...baseItem,
          type: 'quest_completion' as const,
          data: {
            quest_id: activity.reference_id || '',
            quest_title: activity.title,
            points_earned: activity.points_earned,
          },
        }
    }
  })
}

interface UseActivityFeedOptions {
  limit?: number
  enabled?: boolean
}

/**
 * Hook to fetch the activity feed from users with sharing enabled
 */
export function useActivityFeed(options: UseActivityFeedOptions = {}) {
  const { limit = 20, enabled = true } = options

  return useQuery({
    queryKey: ['activity-feed', limit],
    queryFn: async () => {
      try {
        return await fetchActivityFeed(limit)
      } catch (error) {
        console.error('Error fetching activity feed:', error)
        return []
      }
    },
    enabled,
    staleTime: 1000 * 60, // 1 minute
    refetchInterval: 1000 * 60 * 2, // Refetch every 2 minutes
  })
}
