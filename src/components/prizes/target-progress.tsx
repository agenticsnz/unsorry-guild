import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import type { TargetProgress, TargetStatus } from '@/lib/unsorry/types'

const STATUS_LABEL: Record<TargetStatus, string> = {
  proved: 'Proved',
  blocked: 'Blocked',
  open: 'Open',
  archived: 'Archived',
  translated: 'Translated',
}

export function TargetProgressView({ progress }: { progress: TargetProgress }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">
          {progress.proved} / {progress.total} goals proved
        </span>
        <span className="text-foreground/70">{progress.percentProved}%</span>
      </div>
      <Progress value={progress.percentProved} />
      <div className="flex flex-wrap gap-2">
        <Badge variant="default">Proved {progress.proved}</Badge>
        {progress.blocked > 0 && <Badge variant="secondary">Blocked {progress.blocked}</Badge>}
        {progress.open > 0 && <Badge variant="secondary">Open {progress.open}</Badge>}
        <Badge variant={progress.isClosed ? 'default' : 'secondary'}>
          Headline: {STATUS_LABEL[progress.headlineStatus]}
        </Badge>
      </div>
    </div>
  )
}
