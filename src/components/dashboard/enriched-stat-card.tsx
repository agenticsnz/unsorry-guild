'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface EnrichedStatCardProps {
  title: string
  description?: string
  value: number | string
  subValue?: ReactNode
  badge?: string
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline'
  href?: string
  className?: string
}

export function EnrichedStatCard({
  title,
  description,
  value,
  subValue,
  badge,
  badgeVariant = 'secondary',
  href,
  className,
}: EnrichedStatCardProps) {
  const cardContent = (
    <Card className={cn(href && 'cursor-pointer', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          {badge && (
            <Badge variant={badgeVariant} className="text-xs">
              {badge}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-bold">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {subValue && (
            <span className="text-sm text-muted-foreground">
              {subValue}
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  )

  if (href) {
    return (
      <Link href={href} className={cn('block transition-colors hover:bg-muted/50', className)}>
        {cardContent}
      </Link>
    )
  }

  return <div className={className}>{cardContent}</div>
}

export function EnrichedStatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="h-4 bg-muted rounded w-20 animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="h-9 bg-muted rounded w-16 animate-pulse" />
        <div className="h-3 bg-muted rounded w-24 mt-2 animate-pulse" />
      </CardContent>
    </Card>
  )
}
