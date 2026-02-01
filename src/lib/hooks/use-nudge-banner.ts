'use client'

import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { NudgeBannerData, NudgePriority } from '@/lib/types/engagement'

// Session storage key for dismissed nudges
const NUDGE_DISMISSED_KEY = 'guild-hall-nudge-dismissed'

interface NudgeContext {
  approvedObjectivesCount: number
  upcomingDeadlines: Array<{ quest_id: string; quest_title: string; days_remaining: number }>
  activeQuestsCount: number
  recommendedQuest: { id: string; title: string } | null
  recentMilestone: { type: 'tier' | 'quest' | 'streak'; message: string } | null
}

/**
 * Check if nudge was dismissed this session
 */
function isNudgeDismissed(priority: NudgePriority): boolean {
  if (typeof window === 'undefined') return false

  const dismissed = sessionStorage.getItem(NUDGE_DISMISSED_KEY)
  if (!dismissed) return false

  try {
    const dismissedList = JSON.parse(dismissed) as string[]
    return dismissedList.includes(priority)
  } catch {
    return false
  }
}

/**
 * Mark nudge as dismissed for this session
 */
function dismissNudge(priority: NudgePriority): void {
  if (typeof window === 'undefined') return

  const dismissed = sessionStorage.getItem(NUDGE_DISMISSED_KEY)
  let dismissedList: string[] = []

  try {
    dismissedList = dismissed ? JSON.parse(dismissed) : []
  } catch {
    dismissedList = []
  }

  if (!dismissedList.includes(priority)) {
    dismissedList.push(priority)
  }

  sessionStorage.setItem(NUDGE_DISMISSED_KEY, JSON.stringify(dismissedList))
}

/**
 * Get recommended action based on context (shared logic for email too)
 * This function is exported for reuse in the weekly email Edge Function
 */
export function getRecommendedAction(context: NudgeContext): NudgeBannerData | null {
  // Priority 1: Approved submissions ready to progress
  if (context.approvedObjectivesCount > 0) {
    return {
      priority: 'approved_ready',
      message: `You have ${context.approvedObjectivesCount} objective${context.approvedObjectivesCount > 1 ? 's' : ''} approved and ready to continue!`,
      actionUrl: '/quests/active',
      actionLabel: 'Continue Quest',
      variant: 'info',
    }
  }

  // Priority 2: Approaching deadline (< 3 days)
  const urgentDeadline = context.upcomingDeadlines.find(d => d.days_remaining <= 3)
  if (urgentDeadline) {
    return {
      priority: 'deadline_soon',
      message: `"${urgentDeadline.quest_title}" is due in ${urgentDeadline.days_remaining} day${urgentDeadline.days_remaining > 1 ? 's' : ''}!`,
      actionUrl: `/quests/${urgentDeadline.quest_id}`,
      actionLabel: 'View Quest',
      variant: 'warning',
    }
  }

  // Priority 3: Recent celebration milestone
  if (context.recentMilestone) {
    return {
      priority: 'celebration',
      message: context.recentMilestone.message,
      actionUrl: '/profile',
      actionLabel: 'View Progress',
      variant: 'celebration',
    }
  }

  // Priority 4: Quest recommendation (if no active quests)
  if (context.activeQuestsCount === 0 && context.recommendedQuest) {
    return {
      priority: 'quest_recommendation',
      message: `Ready for a new challenge? "${context.recommendedQuest.title}" might be perfect for you.`,
      actionUrl: `/quests/${context.recommendedQuest.id}`,
      actionLabel: 'View Quest',
      variant: 'info',
    }
  }

  return null
}

/**
 * Fetch nudge context from database
 */
async function fetchNudgeContext(userId: string): Promise<NudgeContext> {
  const supabase = createClient()
  const now = new Date()
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

  // Fetch approved objectives count
  const { count: approvedCount } = await supabase
    .from('user_objectives')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'approved')
    .in('user_quest_id',
      supabase
        .from('user_quests')
        .select('id')
        .eq('user_id', userId)
        .in('status', ['accepted', 'in_progress'])
    )

  // Fetch upcoming deadlines
  const { data: deadlines } = await supabase
    .from('user_quests')
    .select('quest_id, deadline, quests!inner(title)')
    .eq('user_id', userId)
    .in('status', ['accepted', 'in_progress'])
    .not('deadline', 'is', null)
    .lte('deadline', threeDaysFromNow.toISOString())
    .gte('deadline', now.toISOString())
    .order('deadline', { ascending: true })
    .limit(3)

  // Fetch active quests count
  const { count: activeCount } = await supabase
    .from('user_quests')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .in('status', ['accepted', 'in_progress'])

  // Fetch recommended quest (featured quest user hasn't accepted)
  const { data: featuredQuests } = await supabase
    .from('quests')
    .select('id, title')
    .eq('status', 'published')
    .eq('featured', true)
    .not('id', 'in',
      supabase
        .from('user_quests')
        .select('quest_id')
        .eq('user_id', userId)
    )
    .limit(1)

  const upcomingDeadlines = (deadlines || []).map((d: any) => ({
    quest_id: d.quest_id,
    quest_title: d.quests?.title || 'Unknown Quest',
    days_remaining: Math.ceil((new Date(d.deadline).getTime() - now.getTime()) / (24 * 60 * 60 * 1000)),
  }))

  const recommendedQuest = featuredQuests && featuredQuests.length > 0
    ? { id: featuredQuests[0].id, title: featuredQuests[0].title }
    : null

  return {
    approvedObjectivesCount: approvedCount || 0,
    upcomingDeadlines,
    activeQuestsCount: activeCount || 0,
    recommendedQuest,
    recentMilestone: null, // Could be extended to check recent achievements
  }
}

/**
 * Hook to get the current nudge banner (if any)
 */
export function useNudgeBanner(userId: string | undefined, enableNudges: boolean = true) {
  const [dismissed, setDismissed] = useState<NudgePriority[]>([])

  // Load dismissed state on mount
  useEffect(() => {
    if (typeof window === 'undefined') return

    const dismissedStr = sessionStorage.getItem(NUDGE_DISMISSED_KEY)
    if (dismissedStr) {
      try {
        setDismissed(JSON.parse(dismissedStr))
      } catch {
        setDismissed([])
      }
    }
  }, [])

  // Fetch nudge context
  const { data: context, isLoading } = useQuery({
    queryKey: ['nudge-context', userId],
    queryFn: () => fetchNudgeContext(userId!),
    enabled: !!userId && enableNudges,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  // Calculate current nudge
  const nudge = useMemo(() => {
    if (!context || !enableNudges) return null

    const recommended = getRecommendedAction(context)
    if (!recommended) return null

    // Check if this nudge was dismissed
    if (dismissed.includes(recommended.priority)) return null

    return recommended
  }, [context, enableNudges, dismissed])

  // Dismiss handler
  const handleDismiss = () => {
    if (!nudge) return

    dismissNudge(nudge.priority)
    setDismissed(prev => [...prev, nudge.priority])
  }

  return {
    nudge,
    isLoading,
    dismiss: handleDismiss,
  }
}
