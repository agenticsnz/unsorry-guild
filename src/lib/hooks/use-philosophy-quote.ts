'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { PhilosophyQuote } from '@/lib/types/engagement'

/**
 * Get the current day as YYYY-MM-DD string
 */
function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * Simple hash function for daily quote rotation
 */
function hashDateString(dateString: string): number {
  let hash = 0
  for (let i = 0; i < dateString.length; i++) {
    hash = ((hash << 5) - hash) + dateString.charCodeAt(i)
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}

/**
 * Fetch today's quote from the database
 */
async function fetchTodaysQuote(): Promise<PhilosophyQuote | null> {
  const supabase = createClient()

  // First, check for fixed-order quotes
  // Cast to any because philosophy_quotes table isn't in generated types yet
  const { data: orderedQuotes } = await (supabase as any)
    .from('philosophy_quotes')
    .select('*')
    .eq('is_active', true)
    .not('display_order', 'is', null)
    .order('display_order', { ascending: true })

  if (orderedQuotes && orderedQuotes.length > 0) {
    // Cycle through ordered quotes by day of year
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24))
    const index = dayOfYear % orderedQuotes.length
    return orderedQuotes[index] as PhilosophyQuote
  }

  // Otherwise, use random rotation based on date hash
  const { data: randomQuotes, error } = await (supabase as any)
    .from('philosophy_quotes')
    .select('*')
    .eq('is_active', true)
    .is('display_order', null)

  if (error) {
    throw error
  }

  if (!randomQuotes || randomQuotes.length === 0) {
    return null
  }

  const today = getTodayString()
  const hash = hashDateString(today)
  const index = hash % randomQuotes.length

  return randomQuotes[index] as PhilosophyQuote
}

/**
 * Hook to fetch today's philosophy quote
 * Quote changes daily, so we cache based on today's date
 */
export function usePhilosophyQuote() {
  const today = getTodayString()

  return useQuery({
    queryKey: ['philosophy-quote', today],
    queryFn: fetchTodaysQuote,
    staleTime: 1000 * 60 * 60, // 1 hour
    refetchOnWindowFocus: false,
  })
}

/**
 * Fetch all active quotes (for GM management)
 */
async function fetchAllQuotes(): Promise<PhilosophyQuote[]> {
  const supabase = createClient()

  const { data, error } = await (supabase as any)
    .from('philosophy_quotes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data || []) as PhilosophyQuote[]
}

/**
 * Hook to fetch all quotes (for GM management)
 */
export function useAllQuotes() {
  return useQuery({
    queryKey: ['philosophy-quotes', 'all'],
    queryFn: fetchAllQuotes,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
