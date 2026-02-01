'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { UserQuestAnswer } from '@/lib/types/quest'

/**
 * Fetch question status for a user's quest
 */
export function useQuestQuestionStatus(userQuestId: string | undefined) {
  return useQuery({
    queryKey: ['quest-question-status', userQuestId],
    queryFn: async (): Promise<UserQuestAnswer[]> => {
      if (!userQuestId) return []
      const supabase = createClient()

      try {
        const { data, error } = await (supabase.rpc as CallableFunction)(
          'get_quest_question_status',
          { p_user_quest_id: userQuestId }
        )

        if (error) {
          // Function might not exist yet
          console.warn('Question status fetch failed:', error.message)
          return []
        }

        return (data || []) as UserQuestAnswer[]
      } catch {
        // Function doesn't exist yet
        return []
      }
    },
    enabled: !!userQuestId,
  })
}

/**
 * Check if all questions are answered correctly for a user quest
 */
export function useAllQuestionsAnswered(userQuestId: string | undefined) {
  return useQuery({
    queryKey: ['all-questions-answered', userQuestId],
    queryFn: async (): Promise<boolean> => {
      if (!userQuestId) return true
      const supabase = createClient()

      try {
        const { data, error } = await (supabase.rpc as CallableFunction)(
          'all_questions_answered_correctly',
          { p_user_quest_id: userQuestId }
        )

        if (error) {
          // Function might not exist yet, assume no questions
          console.warn('Question check failed:', error.message)
          return true
        }

        return data as boolean
      } catch {
        // Function doesn't exist yet
        return true
      }
    },
    enabled: !!userQuestId,
  })
}

export interface SubmitAnswerResult {
  is_correct: boolean
  all_questions_complete: boolean
}

/**
 * Submit an answer to a quest question
 */
export function useSubmitQuestAnswer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      userQuestId,
      questionId,
      answer,
    }: {
      userQuestId: string
      questionId: string
      answer: string
    }): Promise<SubmitAnswerResult> => {
      const supabase = createClient()

      const { data, error } = await (supabase.rpc as CallableFunction)(
        'submit_quest_answer',
        {
          p_user_quest_id: userQuestId,
          p_question_id: questionId,
          p_answer: answer,
        }
      )

      if (error) {
        throw new Error(error.message)
      }

      // The function returns a single row with is_correct and all_questions_complete
      const result = data?.[0] || data
      return result as SubmitAnswerResult
    },
    onSuccess: (data, variables) => {
      // Invalidate question status queries
      queryClient.invalidateQueries({
        queryKey: ['quest-question-status', variables.userQuestId],
      })
      queryClient.invalidateQueries({
        queryKey: ['all-questions-answered', variables.userQuestId],
      })
    },
  })
}
