'use client'

import { Quote } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PhilosophyQuote as QuoteType } from '@/lib/types/engagement'

interface PhilosophyQuoteProps {
  quote: QuoteType
  className?: string
}

export function PhilosophyQuote({ quote, className }: PhilosophyQuoteProps) {
  return (
    <figure className={cn('relative', className)}>
      <Quote className="absolute -top-2 -left-2 h-6 w-6 text-muted-foreground/30" />
      <blockquote className="pl-6 italic text-muted-foreground">
        &ldquo;{quote.quote}&rdquo;
      </blockquote>
      {quote.attribution && (
        <figcaption className="pl-6 mt-2 text-sm text-muted-foreground/70">
          — <cite>{quote.attribution}</cite>
        </figcaption>
      )}
    </figure>
  )
}

export function PhilosophyQuoteSkeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      <div className="h-4 bg-muted rounded w-3/4" />
      <div className="h-4 bg-muted rounded w-1/2" />
      <div className="h-3 bg-muted rounded w-24 mt-2" />
    </div>
  )
}
