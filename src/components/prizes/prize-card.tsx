import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { Prize } from '@/lib/prizes/prizes'
import type { TargetProgress } from '@/lib/unsorry/types'

export function PrizeCard({ prize, progress }: { prize: Prize; progress: TargetProgress }) {
  return (
    <Link href={`/math/prizes/${prize.headlineGoalId}`}>
      <Card className="hover:border-primary transition-colors h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
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
