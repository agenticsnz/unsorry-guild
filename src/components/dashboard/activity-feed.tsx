'use client'

import { formatDistanceToNow } from 'date-fns'
import { Trophy, CheckCircle, Flame, TrendingUp, Award, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { useActivityFeed } from '@/lib/hooks/use-activity-feed'
import type { ActivityFeedItem, ActivityFeedType } from '@/lib/types/engagement'
import { cn } from '@/lib/utils'

interface ActivityFeedProps {
  limit?: number
  className?: string
}

const activityConfig: Record<ActivityFeedType, {
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
  getLabel: (item: ActivityFeedItem) => string
}> = {
  quest_completion: {
    icon: Trophy,
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    getLabel: (item) => {
      if (item.type === 'quest_completion') {
        return `completed "${item.data.quest_title}"`
      }
      return 'completed a quest'
    },
  },
  objective_completion: {
    icon: CheckCircle,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    getLabel: (item) => {
      if (item.type === 'objective_completion') {
        return `completed objective "${item.data.objective_title}"`
      }
      return 'completed an objective'
    },
  },
  streak_milestone: {
    icon: Flame,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    getLabel: (item) => {
      if (item.type === 'streak_milestone') {
        return `reached ${item.data.streak_days} day streak ${item.data.milestone_emoji}`
      }
      return 'reached a streak milestone'
    },
  },
  tier_advancement: {
    icon: TrendingUp,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    getLabel: (item) => {
      if (item.type === 'tier_advancement') {
        return `advanced to ${item.data.new_tier} tier`
      }
      return 'advanced to a new tier'
    },
  },
  badge_earned: {
    icon: Award,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    getLabel: (item) => {
      if (item.type === 'badge_earned') {
        return `earned the "${item.data.badge_name}" badge`
      }
      return 'earned a badge'
    },
  },
}

function ActivityItemSkeleton() {
  return (
    <div className="flex items-start gap-3 py-3">
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/4" />
      </div>
    </div>
  )
}

function ActivityItem({ item }: { item: ActivityFeedItem }) {
  const config = activityConfig[item.type]
  const Icon = config?.icon || Activity
  const label = config?.getLabel(item) || 'performed an action'

  const displayName = item.user.display_name || 'Anonymous'
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const timeAgo = formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })

  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0">
      <Avatar className="h-8 w-8">
        <AvatarImage src={item.user.avatar_url || undefined} alt={displayName} />
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <div
            className={cn(
              'p-1 rounded-full shrink-0',
              config?.bgColor || 'bg-gray-100 dark:bg-gray-800'
            )}
          >
            <Icon className={cn('h-3 w-3', config?.color || 'text-gray-500')} />
          </div>
          <p className="text-sm leading-tight">
            <span className="font-medium">{displayName}</span>{' '}
            <span className="text-muted-foreground">{label}</span>
          </p>
        </div>
        <p className="text-xs text-muted-foreground mt-1 pl-6">{timeAgo}</p>
      </div>
    </div>
  )
}

export function ActivityFeed({ limit = 20, className }: ActivityFeedProps) {
  const { data: activities, isLoading } = useActivityFeed({ limit })

  return (
    <Card className={cn('flex flex-col overflow-hidden', className)}>
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5 text-muted-foreground" />
          Guild Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        {isLoading ? (
          <div className="divide-y divide-border/50">
            {Array.from({ length: 5 }).map((_, i) => (
              <ActivityItemSkeleton key={i} />
            ))}
          </div>
        ) : !activities || activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No recent activity to show.
          </p>
        ) : (
          <div className="h-full overflow-y-auto">
            {activities.map((item) => (
              <ActivityItem key={item.id} item={item} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function ActivityFeedSkeleton({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-border/50">
          {Array.from({ length: 5 }).map((_, i) => (
            <ActivityItemSkeleton key={i} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
