'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/auth-context'
import type { QuestPrerequisite } from '@/lib/types/quest'

interface QuestLockStatus {
  isLocked: boolean
  incompletePrerequisites: QuestPrerequisite[]
}

/**
 * Fetch all quest prerequisites with user completion status
 * Returns a map of questId -> { isLocked, incompletePrerequisites }
 */
export function useAllQuestPrerequisites(questIds: string[]) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['all-quest-prerequisites', questIds, user?.id],
    queryFn: async (): Promise<Map<string, QuestLockStatus>> => {
      if (questIds.length === 0) return new Map()

      const supabase = createClient()
      const result = new Map<string, QuestLockStatus>()

      // Initialize all quests as unlocked
      for (const questId of questIds) {
        result.set(questId, { isLocked: false, incompletePrerequisites: [] })
      }

      // Fetch all prerequisites for the given quests
      const { data: allPrereqsData, error: prereqsError } = await supabase
        .from('quest_prerequisites')
        .select(`
          quest_id,
          prerequisite_quest_id,
          quests:prerequisite_quest_id (title)
        `)
        .in('quest_id', questIds)

      // Type assertion for the query result
      const allPrereqs = allPrereqsData as Array<{
        quest_id: string
        prerequisite_quest_id: string
        quests: { title: string } | null
      }> | null

      if (prereqsError || !allPrereqs || allPrereqs.length === 0) {
        // No prerequisites defined or table doesn't exist
        return result
      }

      // If no user, mark all quests with prerequisites as locked
      if (!user?.id) {
        for (const prereq of allPrereqs) {
          const questId = prereq.quest_id
          const current = result.get(questId) || { isLocked: false, incompletePrerequisites: [] }
          current.isLocked = true
          current.incompletePrerequisites.push({
            prerequisite_quest_id: prereq.prerequisite_quest_id,
            prerequisite_title: prereq.quests?.title || 'Unknown Quest',
            is_completed: false,
          })
          result.set(questId, current)
        }
        return result
      }

      // Fetch user's completed quests
      const prerequisiteQuestIds = [...new Set(allPrereqs.map(p => p.prerequisite_quest_id))]

      const { data: completedQuests } = await supabase
        .from('user_quests')
        .select('quest_id')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .in('quest_id', prerequisiteQuestIds)

      const completedQuestIds = new Set(
        (completedQuests || []).map((cq: { quest_id: string }) => cq.quest_id)
      )

      // Build the lock status for each quest
      for (const prereq of allPrereqs) {
        const questId = prereq.quest_id
        const prereqQuestId = prereq.prerequisite_quest_id
        const isCompleted = completedQuestIds.has(prereqQuestId)

        const current = result.get(questId) || { isLocked: false, incompletePrerequisites: [] }

        if (!isCompleted) {
          current.isLocked = true
          current.incompletePrerequisites.push({
            prerequisite_quest_id: prereqQuestId,
            prerequisite_title: prereq.quests?.title || 'Unknown Quest',
            is_completed: false,
          })
        }

        result.set(questId, current)
      }

      return result
    },
    enabled: questIds.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
