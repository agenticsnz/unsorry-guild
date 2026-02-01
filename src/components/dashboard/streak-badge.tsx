'use client'

import { Flame, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { STREAK_MILESTONES } from '@/lib/types/engagement'

interface StreakBadgeProps {
  streak: number
  isAtRisk?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function StreakBadge({
  streak,
  isAtRisk = false,
  size = 'md',
  className,
}: StreakBadgeProps) {
  if (streak === 0) return null

  // Find milestone
  const milestone = [...STREAK_MILESTONES]
    .reverse()
    .find(m => streak >= m.days)

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant={isAtRisk ? 'outline' : 'default'}
            className={cn(
              'gap-1',
              sizeClasses[size],
              isAtRisk
                ? 'border-amber-300 text-amber-600 dark:border-amber-700 dark:text-amber-400'
                : 'bg-orange-500 hover:bg-orange-600',
              className
            )}
          >
            {isAtRisk ? (
              <AlertTriangle className={iconSizes[size]} />
            ) : (
              <Flame className={iconSizes[size]} />
            )}
            {streak}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">
            {streak} day streak
            {milestone && ` - ${milestone.label}!`}
          </p>
          {isAtRisk && (
            <p className="text-amber-600 text-xs">
              Complete an activity today to keep your streak!
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
