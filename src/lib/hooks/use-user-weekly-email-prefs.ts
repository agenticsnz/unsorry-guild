'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { UserWeeklyEmailPrefs } from '@/lib/types/engagement'

/**
 * Fetch user weekly email preferences
 */
async function fetchUserWeeklyEmailPrefs(userId: string): Promise<UserWeeklyEmailPrefs | null> {
  const supabase = createClient()

  // Cast to any because user_weekly_email_prefs table isn't in generated types yet
  const { data, error } = await (supabase as any)
    .from('user_weekly_email_prefs')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data as UserWeeklyEmailPrefs | null
}

/**
 * Hook to fetch user weekly email preferences
 */
export function useUserWeeklyEmailPrefs(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-weekly-email-prefs', userId],
    queryFn: () => fetchUserWeeklyEmailPrefs(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Update user weekly email preferences
 */
async function updateUserWeeklyEmailPrefs(
  data: Partial<UserWeeklyEmailPrefs> & { user_id: string }
): Promise<UserWeeklyEmailPrefs> {
  const supabase = createClient()

  const { user_id, ...updateData } = data

  // Cast to any because user_weekly_email_prefs table isn't in generated types yet
  const { data: updated, error } = await (supabase as any)
    .from('user_weekly_email_prefs')
    .upsert({
      user_id,
      ...updateData,
    })
    .select()
    .single()

  if (error) throw error
  return updated as UserWeeklyEmailPrefs
}

export function useUpdateUserWeeklyEmailPrefs() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateUserWeeklyEmailPrefs,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-weekly-email-prefs', variables.user_id] })
    },
  })
}
