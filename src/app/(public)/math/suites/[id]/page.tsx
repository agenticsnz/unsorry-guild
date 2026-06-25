import { notFound } from 'next/navigation'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { CopyRun } from '@/components/math/copy-run'
import { BenchmarkRunsTable } from '@/components/math/benchmark-runs-table'
import { getBenchmarkRuns, getRegisteredTargets } from '@/lib/unsorry/standings'
import type { BenchmarkRun } from '@/lib/unsorry/types'

// Recompute-on-read; render per request (ADR-024 — keep GitHub calls out of build).
export const dynamic = 'force-dynamic'

function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null) return '—'
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const r = seconds % 60
  return r ? `${m}m ${r}s` : `${m}m`
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="text-xs text-foreground/60">{label}</div>
        <div className="text-lg font-semibold tabular-nums">{value}</div>
      </CardContent>
    </Card>
  )
}

export default async function SuiteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const suites = await getRegisteredTargets()
  const suite = suites.find((s) => s.id === id)
  if (!suite) notFound()

  const runsBySuite = await getBenchmarkRuns()
  const runs = runsBySuite[id] ?? []
  const total = suite.credited + suite.glue
  const stats = suite.stats

  // per-goal run rollup for the row stats (#3)
  const goalRuns = new Map<string, BenchmarkRun[]>()
  for (const r of runs) {
    const arr = goalRuns.get(r.goal)
    if (arr) arr.push(r)
    else goalRuns.set(r.goal, [r])
  }

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-3xl font-bold">{suite.id}</h1>
          <Badge variant="secondary">{suite.license}</Badge>
          <Badge variant="outline">{suite.domain}</Badge>
        </div>
        <p className="text-sm text-foreground/60">
          {suite.supplier && <>supplier <code>{suite.supplier}</code> · </>}
          mathlib <code>{suite.mathlib_pin || '—'}</code> · cohort{' '}
          <code>{suite.cohort}</code>
        </p>
        {suite.run_snippet && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-foreground/70">Run the whole suite:</span>
            <code className="font-mono text-xs">{suite.run_snippet}</code>
            <CopyRun snippet={suite.run_snippet} label="Copy suite run" />
          </div>
        )}
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Summary</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Benchmarks" value={total} />
          <Stat label="Proved" value={`${suite.proved}/${total}`} />
          <Stat label="Credited / glue" value={`${suite.credited} / ${suite.glue}`} />
          <Stat label="Runs" value={stats?.total_runs ?? 0} />
          <Stat
            label="Pass rate"
            value={stats && stats.total_runs > 0 ? `${Math.round(stats.success_rate * 100)}%` : '—'}
          />
          <Stat label="Best solve" value={formatDuration(stats?.best_solve_s)} />
          <Stat label="Median solve" value={formatDuration(stats?.median_solve_s)} />
          <Stat label="Worst solve" value={formatDuration(stats?.worst_solve_s)} />
        </div>
        <p className="text-xs text-foreground/50">
          Accuracy is the per-run success rate; every proved run is kernel-verified (Gate A).
          pass@k arrives with per-attempt telemetry (SPEC-092-A).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Benchmarks ({total})</h2>
        <ul className="divide-y divide-border">
          {suite.goals.map((goal) => {
            const gr = goalRuns.get(goal.id) ?? []
            const passed = gr.filter((r) => r.passed)
            const best = passed.length ? Math.min(...passed.map((r) => r.solve_s)) : null
            const bestRun = best != null ? passed.find((r) => r.solve_s === best) : undefined
            return (
              <li key={goal.id} className="flex flex-wrap items-center gap-2 py-1.5 text-sm">
                <Link
                  href={`/math/suites/${id}/${goal.id}`}
                  className="font-mono hover:underline"
                >
                  {goal.id}
                </Link>
                <Badge variant={goal.status === 'proved' ? 'default' : 'outline'}>
                  {goal.status}
                </Badge>
                <span className="text-xs text-foreground/60">d{goal.difficulty}</span>
                {goal.credit === 'glue' && (
                  <span className="text-xs text-foreground/50">glue</span>
                )}
                {gr.length > 0 && (
                  <span className="text-xs text-foreground/50">
                    {gr.length} run{gr.length > 1 ? 's' : ''}
                  </span>
                )}
                {bestRun && (
                  <span className="text-xs text-foreground/50">
                    ✓ {bestRun.contributor} · {formatDuration(best)}
                  </span>
                )}
                <span className="ml-auto">
                  <CopyRun snippet={goal.run_snippet} />
                </span>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Runs ({runs.length})</h2>
        <BenchmarkRunsTable runs={runs} />
      </section>
    </div>
  )
}
