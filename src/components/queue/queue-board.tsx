import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { QueueData } from '@/lib/unsorry/types'

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="text-2xl font-bold tabular-nums">{value.toLocaleString()}</div>
      <div className="text-xs text-foreground/70">{label}</div>
    </div>
  )
}

export function QueueBoard({ queue }: { queue: QueueData }) {
  const solvers = [...queue.solvers].sort((a, b) => b.submissions - a.submissions)
  return (
    <div className="space-y-6">
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        <Stat label="Queued submissions" value={queue.summary.queued_submissions} />
        <Stat label="Waiting" value={queue.summary.waiting} />
        <Stat label="In flight" value={queue.summary.in_flight} />
        <Stat label="Distinct goals" value={queue.summary.distinct_goals} />
      </div>

      {solvers.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Solver</TableHead>
              <TableHead className="text-right">Submissions</TableHead>
              <TableHead className="text-right">Waiting</TableHead>
              <TableHead className="text-right">In flight</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {solvers.map((s) => (
              <TableRow key={s.github}>
                <TableCell>
                  <Link href={`/math/contributors/${s.github}`} className="font-medium hover:underline">
                    {s.display_name ?? `@${s.github}`}
                  </Link>
                </TableCell>
                <TableCell className="text-right tabular-nums">{s.submissions.toLocaleString()}</TableCell>
                <TableCell className="text-right tabular-nums">{s.waiting.toLocaleString()}</TableCell>
                <TableCell className="text-right tabular-nums">{s.in_flight.toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
