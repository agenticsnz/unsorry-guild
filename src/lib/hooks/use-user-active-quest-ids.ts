'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

// Type for the query result
interface UserQuestResult {
  id: string
  quest_id: string
  status: string
}

/**
 * Fetch the quest IDs that the current user is actively taking
 */
async function fetchUserActiveQuestIds(userId: string): Promise<{ questId: string; userQuestId: string }[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('user_quests')
    .select('id, quest_id')
    .eq('user_id', userId)
    .in('status', ['accepted', 'in_progress'])

  if (error) {
    console.error('Error fetching active quest IDs:', error)
    return []
  }

  return ((data || []) as unknown as UserQuestResult[]).map((item) => ({
    questId: item.quest_id,
    userQuestId: item.id,
  }))
}

/**
 * Fetch all quest IDs the user has started (active + completed), excluding abandoned
 * Note: Abandoned quests are excluded so users can re-accept them
 */
async function fetchUserAllQuestIds(userId: string): Promise<Set<string>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('user_quests')
    .select('quest_id')
    .eq('user_id', userId)
    .neq('status', 'abandoned')

  if (error) {
    console.error('Error fetching all quest IDs:', error)
    return new Set()
  }

  return new Set(((data || []) as { quest_id: string }[]).map((item) => item.quest_id))
}

/**
 * Fetch user quest statuses (questId -> status mapping)
 * Note: Excludes abandoned quests so they appear as "available" on bounty board
 */
async function fetchUserQuestStatuses(userId: string): Promise<Map<string, { userQuestId: string; status: string }>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('user_quests')
    .select('id, quest_id, status')
    .eq('user_id', userId)
    .neq('status', 'abandoned') // Exclude abandoned - treat as not taken

  if (error) {
    console.error('Error fetching user quest statuses:', error)
    return new Map()
  }

  return new Map(
    ((data || []) as UserQuestResult[]).map((item) => [
      item.quest_id,
      { userQuestId: item.id, status: item.status }
    ])
  )
}

/**
 * Hook to get the quest IDs that the current user is actively taking
 * Returns a map of questId -> userQuestId for quick lookup
 */
export function useUserActiveQuestIds() {
  return useQuery({
    queryKey: ['userActiveQuestIds'],
    queryFn: async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        return new Map<string, string>()
      }

      const activeQuests = await fetchUserActiveQuestIds(user.id)
      return new Map(activeQuests.map((q) => [q.questId, q.userQuestId]))
    },
  })
}

/**
 * Hook to get all quest IDs the user has started (active + completed)
 * Used to filter out quests user has already taken from featured lists
 */
export function useUserAllQuestIds() {
  return useQuery({
    queryKey: ['userAllQuestIds'],
    queryFn: async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        return new Set<string>()
      }

      return fetchUserAllQuestIds(user.id)
    },
  })
}

/**
 * Hook to get user quest statuses (questId -> {userQuestId, status})
 * Used to show proper status badges on quest cards
 */
export function useUserQuestStatuses() {
  return useQuery({
    queryKey: ['userQuestStatuses'],
    queryFn: async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        return new Map<string, { userQuestId: string; status: string }>()
      }

      return fetchUserQuestStatuses(user.id)
    },
  })
}
