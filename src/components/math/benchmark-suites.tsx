import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CopyRun } from '@/components/math/copy-run'
import type { BenchmarkSuite } from '@/lib/unsorry/types'

/** The registered benchmark suites (ADR-092 / SPEC-092-A). Each card is a summary:
 *  the suite-level run command, high-level counts, and run stats. Clicking through
 *  opens the suite detail page (per-goal list + every benchmark run). */
export function BenchmarkSuites({ suites }: { suites: BenchmarkSuite[] }) {
  if (suites.length === 0) {
    return <p className="text-sm text-foreground/70">No benchmark suites registered yet.</p>
  }
  return (
    <div className="space-y-4">
      {suites.map((suite) => {
        const total = suite.credited + suite.glue
        const stats = suite.stats
        const href = `/math/suites/${suite.id}`
        return (
          <Card key={suite.id}>
            <CardHeader className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={href} className="hover:underline">
                  <CardTitle className="text-lg">{suite.id}</CardTitle>
                </Link>
                <Badge variant="secondary">{suite.license}</Badge>
                <Badge variant="outline">{suite.domain}</Badge>
              </div>
              <p className="text-xs text-foreground/60">
                {total} benchmarks · {suite.proved} proved · {suite.credited} credited ·{' '}
                {suite.glue} glue
                {stats && stats.total_runs > 0 && (
                  <>
                    {' '}· {stats.total_runs} runs · {Math.round(stats.success_rate * 100)}% pass
                    {stats.best_solve_s != null && <> · best {stats.best_solve_s}s</>}
                  </>
                )}
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center justify-between gap-2">
                {suite.run_snippet ? (
                  <CopyRun snippet={suite.run_snippet} label="Copy suite run" />
                ) : (
                  <span className="text-xs text-foreground/40">whole-suite run id pending</span>
                )}
                <Link href={href} className="text-sm text-brand hover:underline">
                  View {total} benchmarks →
                </Link>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
