'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/auth-context'
import type { BannerMessage, BannerWithStatus, CreateBannerInput } from '@/lib/types/banner'

/**
 * Fetch active banners for the current user
 * - Global banners not dismissed and not expired
 * - Private banners targeted to this user
 * - System banners for this user
 */
async function fetchActiveBanners(userId: string): Promise<BannerWithStatus[]> {
  const supabase = createClient()

  // Get all banners relevant to this user
  // Note: Tables may not exist yet if migrations haven't been run
  try {
    const { data: banners, error: bannersError } = await (supabase
      .from('banner_messages') as ReturnType<typeof supabase.from>)
      .select('*')
      .or(`target_type.eq.global,and(target_type.eq.user,target_user_id.eq.${userId}),and(target_type.eq.system,target_user_id.eq.${userId})`)
      .or('expires_at.is.null,expires_at.gt.now()')
      .order('created_at', { ascending: false })

    if (bannersError) {
      console.warn('Banner fetch error:', bannersError.message)
      return []
    }

    // Get user's dismissals
    const { data: dismissals, error: dismissalsError } = await (supabase
      .from('banner_dismissals') as ReturnType<typeof supabase.from>)
      .select('banner_id')
      .eq('user_id', userId)

    if (dismissalsError) {
      console.warn('Dismissals fetch error:', dismissalsError.message)
    }

    const dismissalList = (dismissals || []) as Array<{ banner_id: string }>
    const dismissedIds = new Set(dismissalList.map(d => d.banner_id))

    // Combine and filter
    return ((banners || []) as BannerMessage[]).map(banner => ({
      ...banner,
      is_dismissed: dismissedIds.has(banner.id),
    }))
  } catch (err) {
    // Table doesn't exist yet
    console.warn('Banner table not available:', err)
    return []
  }
}

/**
 * Hook to fetch active banners for the current user
 */
export function useBanners() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['banners', user?.id],
    queryFn: () => {
      if (!user?.id) throw new Error('User not authenticated')
      return fetchActiveBanners(user.id)
    },
    enabled: !!user?.id,
    // Refetch periodically to pick up new banners
    refetchInterval: 60000, // 1 minute
  })
}

/**
 * Hook to get only non-dismissed banners
 */
export function useActiveBanners() {
  const query = useBanners()

  return {
    ...query,
    data: query.data?.filter(b => !b.is_dismissed) || [],
  }
}

/**
 * Hook to dismiss a banner
 */
export function useDismissBanner() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (bannerId: string) => {
      if (!user?.id) throw new Error('User not authenticated')
      const supabase = createClient()

      const { error } = await (supabase
        .from('banner_dismissals') as ReturnType<typeof supabase.from>)
        .insert({
          banner_id: bannerId,
          user_id: user.id,
        } as Record<string, unknown>)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banners'] })
    },
  })
}

/**
 * Hook to create a new banner (GM only)
 */
export function useCreateBanner() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (input: CreateBannerInput) => {
      if (!user?.id) throw new Error('User not authenticated')
      const supabase = createClient()

      const { data, error } = await (supabase
        .from('banner_messages') as ReturnType<typeof supabase.from>)
        .insert({
          ...input,
          created_by: user.id,
        } as Record<string, unknown>)
        .select()
        .single()

      if (error) throw error
      return data as BannerMessage
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banners'] })
    },
  })
}

/**
 * Hook to fetch all banners (GM only, for management)
 */
export function useAllBanners() {
  return useQuery({
    queryKey: ['banners', 'all'],
    queryFn: async () => {
      const supabase = createClient()

      try {
        const { data, error } = await (supabase
          .from('banner_messages') as ReturnType<typeof supabase.from>)
          .select('*')
          .order('created_at', { ascending: false })

        if (error) {
          console.warn('All banners fetch error:', error.message)
          return []
        }
        return (data || []) as BannerMessage[]
      } catch {
        return []
      }
    },
  })
}

/**
 * Hook to delete a banner (GM only)
 */
export function useDeleteBanner() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (bannerId: string) => {
      const supabase = createClient()

      const { error } = await (supabase
        .from('banner_messages') as ReturnType<typeof supabase.from>)
        .delete()
        .eq('id', bannerId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banners'] })
    },
  })
}
