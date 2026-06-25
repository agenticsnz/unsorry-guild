import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import type { BenchmarkRun } from '@/lib/unsorry/types'

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const r = seconds % 60
  return r ? `${m}m ${r}s` : `${m}m`
}

/** ISO-8601 → "YYYY-MM-DD HH:MM" (UTC, locale-stable for SSR). */
function formatEnded(iso: string): string {
  const m = iso.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/)
  return m ? `${m[1]} ${m[2]}` : iso
}

/** Every benchmark run for a suite — contributor, model, time, performance,
 *  pass/fail, verification (#4). Newest first. */
export function BenchmarkRunsTable({ runs }: { runs: BenchmarkRun[] }) {
  if (runs.length === 0) {
    return (
      <p className="text-sm text-foreground/70">
        No runs recorded for this suite yet — they appear here as the swarm attempts the
        benchmarks.
      </p>
    )
  }
  const rows = [...runs].sort((a, b) => (a.ended < b.ended ? 1 : -1))
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-foreground/60">
            <th className="py-2 pr-3 font-medium">Goal</th>
            <th className="py-2 pr-3 font-medium">Contributor</th>
            <th className="py-2 pr-3 font-medium">Model</th>
            <th className="py-2 pr-3 font-medium">Date (UTC)</th>
            <th className="py-2 pr-3 font-medium">Time</th>
            <th className="py-2 pr-3 font-medium">Result</th>
            <th className="py-2 pr-3 font-medium">Verification</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((run) => (
            <tr key={run.run_id} className="border-b border-border/50">
              <td className="py-1.5 pr-3 font-mono text-xs">{run.goal}</td>
              <td className="py-1.5 pr-3">
                <Link
                  href={`/math/contributors/${run.contributor}`}
                  className="hover:underline"
                >
                  {run.contributor}
                </Link>
              </td>
              <td className="py-1.5 pr-3 font-mono text-xs">{run.model || '—'}</td>
              <td className="whitespace-nowrap py-1.5 pr-3 text-xs text-foreground/70">
                {formatEnded(run.ended)}
              </td>
              <td className="py-1.5 pr-3 tabular-nums">{formatDuration(run.solve_s)}</td>
              <td className="py-1.5 pr-3">
                <Badge variant={run.passed ? 'default' : 'outline'}>
                  {run.passed ? 'pass' : run.outcome}
                </Badge>
              </td>
              <td className="py-1.5 pr-3 text-xs text-foreground/70">{run.verification}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
