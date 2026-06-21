import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { QueueData, QueueItem } from '@/lib/unsorry/types'

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="text-2xl font-bold tabular-nums">{value.toLocaleString()}</div>
      <div className="text-xs text-foreground/70">{label}</div>
    </div>
  )
}

function StateBadge({ state }: { state?: string }) {
  const inFlight = state === 'in-flight'
  return (
    <span
      className={cn(
        'inline-block rounded-full px-2 py-0.5 text-xs font-medium',
        inFlight ? 'bg-brand/15 text-brand' : 'bg-muted text-foreground/70',
      )}
    >
      {state ?? 'waiting'}
    </span>
  )
}

interface FlatItem extends QueueItem {
  solver: string
}

export function QueueBoard({ queue }: { queue: QueueData }) {
  const solvers = [...queue.solvers].sort((a, b) => b.submissions - a.submissions)

  // Flatten every solver's queued work; in-flight first, then most recent.
  const items: FlatItem[] = solvers
    .flatMap((s) => (s.queued ?? []).map((q) => ({ ...q, solver: s.github })))
    .sort((a, b) => {
      const af = a.state === 'in-flight' ? 0 : 1
      const bf = b.state === 'in-flight' ? 0 : 1
      if (af !== bf) return af - bf
      return (b.date ?? '').localeCompare(a.date ?? '')
    })
    .slice(0, 50)

  return (
    <div className="space-y-8">
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        <Stat label="Queued submissions" value={queue.summary.queued_submissions} />
        <Stat label="Waiting" value={queue.summary.waiting} />
        <Stat label="In flight" value={queue.summary.in_flight} />
        <Stat label="Distinct goals" value={queue.summary.distinct_goals} />
      </div>

      {solvers.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">By solver</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Solver</TableHead>
                <TableHead className="text-right">Submissions</TableHead>
                <TableHead className="text-right">Waiting</TableHead>
                <TableHead className="text-right">In flight</TableHead>
                <TableHead className="text-right hidden sm:table-cell">Distinct goals</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {solvers.map((s) => (
                <TableRow key={s.github}>
                  <TableCell>
                    <Link
                      href={`/math/contributors/${s.github}`}
                      className="font-medium hover:underline"
                    >
                      {s.display_name ?? `@${s.github}`}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {s.submissions.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{s.waiting.toLocaleString()}</TableCell>
                  <TableCell className="text-right tabular-nums">{s.in_flight.toLocaleString()}</TableCell>
                  <TableCell className="text-right tabular-nums hidden sm:table-cell">
                    {s.distinct_goals.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      )}

      {items.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Queued work</h2>
          <p className="text-xs text-foreground/60">
            The next {items.length} goals in the proving queue (in-flight first).
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Goal</TableHead>
                <TableHead>Solver</TableHead>
                <TableHead className="hidden sm:table-cell">Model</TableHead>
                <TableHead>State</TableHead>
                <TableHead className="text-right hidden sm:table-cell">Queued</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((q) => (
                <TableRow key={`${q.solver}:${q.goal}:${q.branch ?? q.sha ?? ''}`}>
                  <TableCell className="font-mono text-xs">{q.goal}</TableCell>
                  <TableCell>
                    <Link
                      href={`/math/contributors/${q.solver}`}
                      className="hover:underline"
                    >
                      @{q.solver}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-xs text-foreground/70">
                    {q.model ?? '—'}
                  </TableCell>
                  <TableCell>
                    <StateBadge state={q.state} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums hidden sm:table-cell text-xs text-foreground/70">
                    {q.date ?? '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      )}
    </div>
  )
}
