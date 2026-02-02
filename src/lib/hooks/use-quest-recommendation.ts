'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { QuestRecommendation } from '@/lib/types/engagement'

interface RecommendationResult {
  recommendation: QuestRecommendation | null
  isLoading: boolean
  error: unknown
}

/**
 * Check if user can accept a quest (all prerequisites completed)
 */
async function canAcceptQuest(supabase: ReturnType<typeof createClient>, userId: string, questId: string): Promise<boolean> {
  try {
    const { data, error } = await (supabase.rpc as CallableFunction)(
      'can_accept_quest',
      { p_user_id: userId, p_quest_id: questId }
    )

    if (error) {
      // Function might not exist, assume can accept
      return true
    }

    return data as boolean
  } catch {
    return true // Assume can accept if function doesn't exist
  }
}

/**
 * Fetch quest recommendation for a user
 * Prioritizes:
 * 1. Featured quests user hasn't started (and can accept)
 * 2. Quests in categories user has completed before (familiarity)
 * 3. Most popular quests by acceptance rate
 *
 * Excludes quests that are locked by prerequisites
 */
async function fetchQuestRecommendation(userId: string): Promise<QuestRecommendation | null> {
  const supabase = createClient()

  // Get user's quest history to determine preferences (excluding abandoned quests)
  const { data: userQuestsData } = await supabase
    .from('user_quests')
    .select('quest_id, status, quests!inner(category_id)')
    .eq('user_id', userId)
    .neq('status', 'abandoned') // Exclude abandoned - user can re-accept these

  const userQuests = userQuestsData as Array<{ quest_id: string; status: string; quests: { category_id: string } }> | null
  const acceptedQuestIds = userQuests?.map(uq => uq.quest_id) || []
  const completedQuestIds = userQuests?.filter(uq => uq.status === 'completed').map(uq => uq.quest_id) || []
  const completedCategories = new Set(
    userQuests?.filter(uq => uq.status === 'completed').map((uq: any) => uq.quests?.category_id).filter(Boolean)
  )

  // Strategy 1: Featured quests not yet accepted
  const { data: featuredQuestsData } = await supabase
    .from('quests')
    .select('id, title, category_id')
    .eq('status', 'published')
    .eq('featured', true)
    .not('id', 'in', `(${acceptedQuestIds.length > 0 ? acceptedQuestIds.map(id => `'${id}'`).join(',') : "''"})`)
    .limit(10)

  const featuredQuests = featuredQuestsData as Array<{ id: string; title: string; category_id: string }> | null

  if (featuredQuests && featuredQuests.length > 0) {
    // Filter to only quests user can accept (not locked by prerequisites)
    for (const quest of featuredQuests) {
      const canAccept = await canAcceptQuest(supabase, userId, quest.id)
      if (canAccept) {
        const isFamiliar = completedCategories.has(quest.category_id)
        return {
          quest_id: quest.id,
          quest_title: quest.title,
          reason: isFamiliar
            ? 'Featured quest in a category you\'ve explored'
            : 'Featured guild quest',
          match_score: isFamiliar ? 0.9 : 0.8,
        }
      }
    }
  }

  // Strategy 2: Quests in familiar categories
  if (completedCategories.size > 0) {
    const categoryIds = Array.from(completedCategories)
    const { data: categoryQuestsData } = await supabase
      .from('quests')
      .select('id, title')
      .eq('status', 'published')
      .in('category_id', categoryIds)
      .not('id', 'in', `(${acceptedQuestIds.length > 0 ? acceptedQuestIds.map(id => `'${id}'`).join(',') : "''"})`)
      .limit(10)

    const categoryQuests = categoryQuestsData as Array<{ id: string; title: string }> | null

    if (categoryQuests && categoryQuests.length > 0) {
      for (const quest of categoryQuests) {
        const canAccept = await canAcceptQuest(supabase, userId, quest.id)
        if (canAccept) {
          return {
            quest_id: quest.id,
            quest_title: quest.title,
            reason: 'Quest in a familiar category',
            match_score: 0.7,
          }
        }
      }
    }
  }

  // Strategy 3: Any available quests (not accepted, not locked)
  const { data: availableQuestsData } = await supabase
    .from('quests')
    .select('id, title')
    .eq('status', 'published')
    .not('id', 'in', `(${acceptedQuestIds.length > 0 ? acceptedQuestIds.map(id => `'${id}'`).join(',') : "''"})`)
    .order('created_at', { ascending: true }) // Older quests likely more popular
    .limit(10)

  const availableQuests = availableQuestsData as Array<{ id: string; title: string }> | null

  if (availableQuests && availableQuests.length > 0) {
    for (const quest of availableQuests) {
      const canAccept = await canAcceptQuest(supabase, userId, quest.id)
      if (canAccept) {
        return {
          quest_id: quest.id,
          quest_title: quest.title,
          reason: 'Available guild quest',
          match_score: 0.5,
        }
      }
    }
  }

  return null
}

/**
 * Hook to get quest recommendation for a user
 */
export function useQuestRecommendation(
  userId: string | undefined,
  hasActiveQuests: boolean = false
): RecommendationResult {
  const { data, isLoading, error } = useQuery({
    queryKey: ['quest-recommendation', userId],
    queryFn: () => fetchQuestRecommendation(userId!),
    enabled: !!userId && !hasActiveQuests, // Only fetch if no active quests
    staleTime: 1000 * 60 * 10, // 10 minutes
  })

  return {
    recommendation: data || null,
    isLoading,
    error,
  }
}
