import Link from 'next/link'
import { CheckCircle2, Circle, Lock, Layers } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ResolvedDecomposition, ResolvedGoalRef } from '@/lib/unsorry/decomposition'

/**
 * The "Decomposition — helper lemmas" section (ADR-037). When a goal is a
 * decomposition parent, it lists the helper sub-lemmas the swarm proved to
 * discharge it — each with its status, solver attribution and a link to its own
 * page — plus the parent's composed proof (the assembled result). Presentational:
 * the view resolves the join and passes it in; renders NOTHING when the goal has
 * no decomposition (the common case — no empty box).
 */

interface GoalDecompositionProps {
  decomposition: ResolvedDecomposition | null | undefined
  className?: string
}

/** Reuse the goal status badge styling already used on the proof/benchmark pages. */
function statusVariant(status: string): 'default' | 'secondary' | 'outline' {
  if (status === 'proved') return 'default'
  if (status === 'archived') return 'secondary'
  return 'outline'
}

function GoalRefRow({ goal, composed = false }: { goal: ResolvedGoalRef; composed?: boolean }) {
  const Icon = goal.proved ? CheckCircle2 : goal.status === 'blocked' ? Lock : Circle
  return (
    <li className={cn('flex items-start gap-3 text-sm', composed && 'pt-1')}>
      <Icon
        className={cn(
          'h-5 w-5 flex-shrink-0 mt-0.5',
          goal.proved ? 'text-green-500' : 'text-muted-foreground',
        )}
        aria-hidden
      />
      <div className="flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={goal.href} className="font-mono text-foreground hover:underline">
            {goal.id}
          </Link>
          <Badge variant={statusVariant(goal.status)}>{goal.status}</Badge>
          {composed && <span className="text-xs text-foreground/50">composed proof</span>}
        </div>
        {goal.solver ? (
          <p className="text-xs text-foreground/60">
            Proved by{' '}
            <Link
              href={`/math/contributors/${goal.solver}`}
              className="font-medium text-foreground hover:underline"
            >
              @{goal.solver}
            </Link>
          </p>
        ) : goal.proved ? (
          <p className="text-xs text-foreground/60">
            Attribution inferred from git history (no explicit solver credit).
          </p>
        ) : (
          <p className="text-xs text-foreground/50">Open — not yet proved.</p>
        )}
      </div>
    </li>
  )
}

export function GoalDecomposition({ decomposition, className }: GoalDecompositionProps) {
  if (!decomposition || decomposition.subs.length === 0) return null

  return (
    <section className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2">
        <Layers className="h-5 w-5 text-foreground/60" aria-hidden />
        <h2 className="text-lg font-semibold">Decomposition — helper lemmas</h2>
      </div>
      <p className="text-sm text-foreground/60">
        The swarm split this goal into helper sub-lemmas, proved them separately, and composed them
        back into the parent proof (unsorry ADR-009).
        {decomposition.agent && (
          <>
            {' '}
            Decomposed by <code className="font-mono text-xs">{decomposition.agent}</code>.
          </>
        )}
      </p>

      <ul className="space-y-3">
        {decomposition.subs.map((sub) => (
          <GoalRefRow key={sub.id} goal={sub} />
        ))}
      </ul>

      <div className="border-t border-border pt-3">
        <ul>
          <GoalRefRow goal={decomposition.composed} composed />
        </ul>
      </div>
    </section>
  )
}
