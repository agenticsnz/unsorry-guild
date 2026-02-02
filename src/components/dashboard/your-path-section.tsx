'use client'

import Link from 'next/link'
import { Compass, ChevronRight, Sparkles } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { QuestRecommendation } from '@/lib/types/engagement'

interface YourPathSectionProps {
  recommendation: QuestRecommendation | null
  isLoading?: boolean
  hasActiveQuests?: boolean
}

export function YourPathSection({
  recommendation,
  isLoading,
  hasActiveQuests,
}: YourPathSectionProps) {
  if (hasActiveQuests) {
    return null // Don't show if user has active quests
  }

  if (isLoading) {
    return <YourPathSectionSkeleton />
  }

  if (!recommendation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-muted-foreground" />
            Your Path
          </CardTitle>
          <CardDescription>
            You&apos;ve completed all available quests! Check back soon for new adventures.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-br from-background to-muted/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Compass className="h-5 w-5 text-primary" />
          Your Path
        </CardTitle>
        <CardDescription>
          Based on your journey, we recommend:
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">
              {recommendation.quest_title}
            </h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              {recommendation.reason}
            </p>
          </div>
          <Button asChild>
            <Link href={`/quests/${recommendation.quest_id}`}>
              View Quest
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function YourPathSectionSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-24" />
        </div>
        <Skeleton className="h-4 w-48 mt-2" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-10 w-28" />
        </div>
      </CardContent>
    </Card>
  )
}
