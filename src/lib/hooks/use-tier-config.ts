'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { TierConfig } from '@/lib/types/engagement'

/**
 * Update a tier's configuration
 */
async function updateTierConfig(
  data: { tier_level: number; name?: string; min_points?: number; icon?: string; color?: string }
): Promise<TierConfig> {
  const supabase = createClient()

  // Cast to any because skill_tier_config table isn't in generated types yet
  const { data: updated, error } = await (supabase as any)
    .from('skill_tier_config')
    .update({
      ...(data.name !== undefined && { name: data.name }),
      ...(data.min_points !== undefined && { min_points: data.min_points }),
      ...(data.icon !== undefined && { icon: data.icon }),
      ...(data.color !== undefined && { color: data.color }),
    })
    .eq('tier_level', data.tier_level)
    .select()
    .single()

  if (error) throw error
  return updated as TierConfig
}

export function useUpdateTierConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateTierConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skill-tiers'] })
    },
  })
}

/**
 * Batch update all tier configurations
 */
async function updateAllTiers(tiers: TierConfig[]): Promise<void> {
  const supabase = createClient()

  for (const tier of tiers) {
    // Cast to any because skill_tier_config table isn't in generated types yet
    const { error } = await (supabase as any)
      .from('skill_tier_config')
      .update({
        name: tier.name,
        min_points: tier.min_points,
        icon: tier.icon,
        color: tier.color,
      })
      .eq('tier_level', tier.tier_level)

    if (error) throw error
  }
}

export function useUpdateAllTiers() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateAllTiers,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skill-tiers'] })
    },
  })
}
