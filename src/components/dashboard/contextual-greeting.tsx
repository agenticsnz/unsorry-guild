'use client'

import { PartyPopper, ArrowRight, TrendingUp, Sun, Moon, Clock, Flame } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GreetingContext, GreetingPriority } from '@/lib/types/engagement'

const GREETING_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  PartyPopper,
  ArrowRight,
  TrendingUp,
  Sun,
  Moon,
  Clock,
  Flame,
}

const PRIORITY_STYLES: Record<GreetingPriority, {
  text: string
  subtext: string
  accent: string
}> = {
  celebration: {
    text: 'text-amber-900 dark:text-amber-100',
    subtext: 'text-amber-700 dark:text-amber-300',
    accent: 'text-amber-500',
  },
  action: {
    text: 'text-blue-900 dark:text-blue-100',
    subtext: 'text-blue-700 dark:text-blue-300',
    accent: 'text-blue-500',
  },
  progression: {
    text: 'text-green-900 dark:text-green-100',
    subtext: 'text-green-700 dark:text-green-300',
    accent: 'text-green-500',
  },
  time: {
    text: 'text-foreground',
    subtext: 'text-muted-foreground',
    accent: 'text-muted-foreground',
  },
}

interface ContextualGreetingProps {
  greeting: GreetingContext
  className?: string
}

export function ContextualGreeting({ greeting, className }: ContextualGreetingProps) {
  const Icon = greeting.icon ? GREETING_ICONS[greeting.icon] : Sun
  const styles = PRIORITY_STYLES[greeting.priority]

  return (
    <div className={cn('flex items-start gap-3', className)}>
      {Icon && (
        <Icon className={cn('h-6 w-6 mt-1 flex-shrink-0', styles.accent)} />
      )}
      <div>
        <h2 className={cn('text-2xl font-semibold', styles.text)}>
          {greeting.message}
        </h2>
        {greeting.subMessage && (
          <p className={cn('text-sm mt-1', styles.subtext)}>
            {greeting.subMessage}
          </p>
        )}
      </div>
    </div>
  )
}
