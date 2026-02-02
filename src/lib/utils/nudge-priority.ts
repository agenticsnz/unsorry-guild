// Nudge Priority Logic
// Shared between useNudgeBanner hook and user weekly email Edge Function
// ADR: ADR-012-Engagement-Improvements

import type { NudgeBannerData, NudgePriority } from '@/lib/types/engagement'

export interface NudgeContext {
  approvedObjectivesCount: number
  upcomingDeadlines: Array<{
    quest_id: string
    quest_title: string
    days_remaining: number
  }>
  activeQuestsCount: number
  recommendedQuest: { id: string; title: string } | null
  recentMilestone: {
    type: 'tier' | 'quest' | 'streak'
    message: string
  } | null
}

/**
 * Get recommended action based on user context
 * This function is shared between:
 * 1. useNudgeBanner hook (dashboard)
 * 2. User weekly email (recommended action section)
 *
 * Priority order:
 * 1. Approved submissions ready to progress (highest - user action needed)
 * 2. Approaching deadline (< 3 days)
 * 3. Recent celebration milestone
 * 4. Quest recommendation (if no active quests)
 */
export function getRecommendedAction(context: NudgeContext): NudgeBannerData | null {
  // Priority 1: Approved submissions ready to progress
  if (context.approvedObjectivesCount > 0) {
    const count = context.approvedObjectivesCount
    return {
      priority: 'approved_ready',
      message: `You have ${count} objective${count > 1 ? 's' : ''} approved and ready to continue!`,
      actionUrl: '/my-quests',
      actionLabel: 'Continue Quest',
      variant: 'info',
    }
  }

  // Priority 2: Approaching deadline (< 3 days)
  const urgentDeadline = context.upcomingDeadlines.find(d => d.days_remaining <= 3)
  if (urgentDeadline) {
    const days = urgentDeadline.days_remaining
    return {
      priority: 'deadline_soon',
      message: `"${urgentDeadline.quest_title}" is due in ${days} day${days > 1 ? 's' : ''}!`,
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
 * Get all nudges that apply to the user context (for email digest)
 * Returns an array of nudges in priority order
 */
export function getAllApplicableNudges(context: NudgeContext): NudgeBannerData[] {
  const nudges: NudgeBannerData[] = []

  // Add approved objectives nudge
  if (context.approvedObjectivesCount > 0) {
    const count = context.approvedObjectivesCount
    nudges.push({
      priority: 'approved_ready',
      message: `You have ${count} objective${count > 1 ? 's' : ''} approved and ready to continue!`,
      actionUrl: '/my-quests',
      actionLabel: 'Continue Quest',
      variant: 'info',
    })
  }

  // Add deadline nudges
  for (const deadline of context.upcomingDeadlines) {
    if (deadline.days_remaining <= 3) {
      nudges.push({
        priority: 'deadline_soon',
        message: `"${deadline.quest_title}" is due in ${deadline.days_remaining} day${deadline.days_remaining > 1 ? 's' : ''}!`,
        actionUrl: `/quests/${deadline.quest_id}`,
        actionLabel: 'View Quest',
        variant: 'warning',
      })
    }
  }

  // Add milestone nudge
  if (context.recentMilestone) {
    nudges.push({
      priority: 'celebration',
      message: context.recentMilestone.message,
      actionUrl: '/profile',
      actionLabel: 'View Progress',
      variant: 'celebration',
    })
  }

  // Add quest recommendation
  if (context.activeQuestsCount === 0 && context.recommendedQuest) {
    nudges.push({
      priority: 'quest_recommendation',
      message: `Ready for a new challenge? "${context.recommendedQuest.title}" might be perfect for you.`,
      actionUrl: `/quests/${context.recommendedQuest.id}`,
      actionLabel: 'View Quest',
      variant: 'info',
    })
  }

  return nudges
}

export type { NudgeBannerData, NudgePriority }
