'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { GMEmailPreferences } from '@/lib/types/engagement'

/**
 * Fetch GM email preferences
 */
async function fetchGMEmailPreferences(userId: string): Promise<GMEmailPreferences | null> {
  const supabase = createClient()

  // Cast to any because gm_email_preferences table isn't in generated types yet
  const { data, error } = await (supabase as any)
    .from('gm_email_preferences')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data as GMEmailPreferences | null
}

/**
 * Hook to fetch GM email preferences
 */
export function useGMEmailPreferences(userId: string | undefined) {
  return useQuery({
    queryKey: ['gm-email-preferences', userId],
    queryFn: () => fetchGMEmailPreferences(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Update GM email preferences
 */
async function updateGMEmailPreferences(
  data: Partial<GMEmailPreferences> & { user_id: string }
): Promise<GMEmailPreferences> {
  const supabase = createClient()

  const { user_id, ...updateData } = data

  // Cast to any because gm_email_preferences table isn't in generated types yet
  const { data: updated, error } = await (supabase as any)
    .from('gm_email_preferences')
    .upsert({
      user_id,
      ...updateData,
    })
    .select()
    .single()

  if (error) throw error
  return updated as GMEmailPreferences
}

export function useUpdateGMEmailPreferences() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateGMEmailPreferences,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['gm-email-preferences', variables.user_id] })
    },
  })
}
