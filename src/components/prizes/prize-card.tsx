'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, Copy } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import type { Prize } from '@/lib/prizes/prizes'
import type { TargetProgress } from '@/lib/unsorry/types'

export function PrizeCard({ prize, progress }: { prize: Prize; progress: TargetProgress }) {
  const [copied, setCopied] = useState(false)

  // Copy the goal id for pasting into run.sh — must not navigate the wrapping Link.
  const copyId = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(prize.headlineGoalId)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard unavailable (e.g. insecure context) — silently no-op
    }
  }

  return (
    <Link href={`/math/goals/${prize.headlineGoalId}`} className="group relative block">
      <Card className="hover:border-primary transition-colors h-full">
        <button
          type="button"
          onClick={copyId}
          aria-label="Copy goal id"
          title={copied ? 'Copied!' : 'Copy goal id'}
          className={cn(
            'absolute right-2 top-2 z-10 grid h-7 w-7 place-items-center rounded-md border bg-background/80',
            'opacity-0 transition-opacity hover:bg-accent focus:opacity-100 group-hover:opacity-100',
          )}
        >
          {copied ? <Check className="h-4 w-4 text-brand" /> : <Copy className="h-4 w-4" />}
        </button>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 pr-8">
            <span aria-hidden>{prize.badgeEmoji}</span>
            {prize.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-foreground/70 line-clamp-2">{prize.description}</p>
          <div className="flex items-center justify-between text-xs">
            <span>
              {progress.proved}/{progress.total} proved
            </span>
            <span>{progress.percentProved}%</span>
          </div>
          <Progress value={progress.percentProved} />
        </CardContent>
      </Card>
    </Link>
  )
}
