'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { PhilosophyQuote } from '@/lib/types/engagement'

/**
 * Fetch all quotes (for GM management)
 */
async function fetchAllQuotes(): Promise<PhilosophyQuote[]> {
  const supabase = createClient()

  // Cast to any because philosophy_quotes table isn't in generated types yet
  const { data, error } = await (supabase as any)
    .from('philosophy_quotes')
    .select('*')
    .order('display_order', { ascending: true, nullsLast: true })
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []) as PhilosophyQuote[]
}

/**
 * Hook to fetch all quotes for GM management
 */
export function useAllQuotes() {
  return useQuery({
    queryKey: ['philosophy-quotes', 'all'],
    queryFn: fetchAllQuotes,
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Create a new quote
 */
async function createQuote(
  data: { quote: string; attribution?: string | null }
): Promise<PhilosophyQuote> {
  const supabase = createClient()

  const { data: newQuote, error } = await (supabase as any)
    .from('philosophy_quotes')
    .insert({
      quote: data.quote,
      attribution: data.attribution || null,
      is_active: true,
    })
    .select()
    .single()

  if (error) throw error
  return newQuote as PhilosophyQuote
}

export function useCreateQuote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createQuote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['philosophy-quotes'] })
    },
  })
}

/**
 * Update a quote
 */
async function updateQuote(
  data: { id: string; quote?: string; attribution?: string | null; is_active?: boolean; display_order?: number | null }
): Promise<PhilosophyQuote> {
  const supabase = createClient()

  const { data: updated, error } = await (supabase as any)
    .from('philosophy_quotes')
    .update({
      ...(data.quote !== undefined && { quote: data.quote }),
      ...(data.attribution !== undefined && { attribution: data.attribution }),
      ...(data.is_active !== undefined && { is_active: data.is_active }),
      ...(data.display_order !== undefined && { display_order: data.display_order }),
    })
    .eq('id', data.id)
    .select()
    .single()

  if (error) throw error
  return updated as PhilosophyQuote
}

export function useUpdateQuote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateQuote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['philosophy-quotes'] })
    },
  })
}

/**
 * Delete a quote
 */
async function deleteQuote(id: string): Promise<void> {
  const supabase = createClient()

  const { error } = await (supabase as any)
    .from('philosophy_quotes')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export function useDeleteQuote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteQuote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['philosophy-quotes'] })
    },
  })
}
