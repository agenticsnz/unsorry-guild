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
 * Fetch quest recommendation for a user
 * Prioritizes:
 * 1. Featured quests user hasn't started
 * 2. Quests in categories user has completed before (familiarity)
 * 3. Most popular quests by acceptance rate
 */
async function fetchQuestRecommendation(userId: string): Promise<QuestRecommendation | null> {
  const supabase = createClient()

  // Get user's quest history to determine preferences
  const { data: userQuestsData } = await supabase
    .from('user_quests')
    .select('quest_id, quests!inner(category_id)')
    .eq('user_id', userId)

  const userQuests = userQuestsData as Array<{ quest_id: string; quests: { category_id: string } }> | null
  const acceptedQuestIds = userQuests?.map(uq => uq.quest_id) || []
  const completedCategories = new Set(
    userQuests?.map((uq: any) => uq.quests?.category_id).filter(Boolean)
  )

  // Strategy 1: Featured quests not yet accepted
  const { data: featuredQuests } = await supabase
    .from('quests')
    .select('id, title, category_id')
    .eq('status', 'published')
    .eq('featured', true)
    .not('id', 'in', `(${acceptedQuestIds.length > 0 ? acceptedQuestIds.map(id => `'${id}'`).join(',') : "''"})`)
    .limit(5)

  if (featuredQuests && featuredQuests.length > 0) {
    // Prefer featured quests in familiar categories
    const familiarFeatured = featuredQuests.find(q => completedCategories.has(q.category_id))

    if (familiarFeatured) {
      return {
        quest_id: familiarFeatured.id,
        quest_title: familiarFeatured.title,
        reason: 'Featured quest in a category you\'ve explored',
        match_score: 0.9,
      }
    }

    // Otherwise, return first featured quest
    return {
      quest_id: featuredQuests[0].id,
      quest_title: featuredQuests[0].title,
      reason: 'Featured guild quest',
      match_score: 0.8,
    }
  }

  // Strategy 2: Quests in familiar categories
  if (completedCategories.size > 0) {
    const categoryIds = Array.from(completedCategories)
    const { data: categoryQuests } = await supabase
      .from('quests')
      .select('id, title')
      .eq('status', 'published')
      .in('category_id', categoryIds)
      .not('id', 'in', `(${acceptedQuestIds.length > 0 ? acceptedQuestIds.map(id => `'${id}'`).join(',') : "''"})`)
      .limit(3)

    if (categoryQuests && categoryQuests.length > 0) {
      return {
        quest_id: categoryQuests[0].id,
        quest_title: categoryQuests[0].title,
        reason: 'Quest in a familiar category',
        match_score: 0.7,
      }
    }
  }

  // Strategy 3: Popular quests (most accepted)
  const { data: popularQuests } = await supabase
    .from('quests')
    .select('id, title')
    .eq('status', 'published')
    .not('id', 'in', `(${acceptedQuestIds.length > 0 ? acceptedQuestIds.map(id => `'${id}'`).join(',') : "''"})`)
    .order('created_at', { ascending: true }) // Older quests likely more popular
    .limit(3)

  if (popularQuests && popularQuests.length > 0) {
    return {
      quest_id: popularQuests[0].id,
      quest_title: popularQuests[0].title,
      reason: 'Popular guild quest',
      match_score: 0.5,
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
