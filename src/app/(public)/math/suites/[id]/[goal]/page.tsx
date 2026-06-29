import { notFound } from 'next/navigation'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { CopyRun } from '@/components/math/copy-run'
import { LeanStatement } from '@/components/math/lean-statement'
import { BenchmarkRunsTable } from '@/components/math/benchmark-runs-table'
import { getBenchmarkRuns, getGoalSource, getRegisteredTargets } from '@/lib/unsorry/standings'

export const dynamic = 'force-dynamic'

export default async function BenchmarkGoalPage({
  params,
}: {
  params: Promise<{ id: string; goal: string }>
}) {
  const { id, goal: goalId } = await params
  const suites = await getRegisteredTargets()
  const suite = suites.find((s) => s.id === id)
  const goal = suite?.goals.find((g) => g.id === goalId)
  if (!suite || !goal) notFound()

  const [goalSource, runsBySuite] = await Promise.all([getGoalSource(goalId), getBenchmarkRuns()])
  const { source, path: sourcePath } = goalSource
  const runs = (runsBySuite[id] ?? []).filter((r) => r.goal === goalId)

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-sm text-foreground/50">
          <Link href={`/math/suites/${id}`} className="hover:underline">
            {id}
          </Link>{' '}
          / {goalId}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-mono text-2xl font-bold">{goalId}</h1>
          <Badge variant={goal.status === 'proved' ? 'default' : 'outline'}>{goal.status}</Badge>
          <Badge variant="outline">difficulty {goal.difficulty}</Badge>
          <Badge variant="secondary">{goal.credit}</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-foreground/70">Run this goal:</span>
          <code className="font-mono text-xs">{goal.run_snippet}</code>
          <CopyRun snippet={goal.run_snippet} />
        </div>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">What it runs</h2>
        <p className="text-sm text-foreground/60">
          The Lean statement the swarm must prove — kernel-verified at Gate A. The trailing{' '}
          <code>sorry</code> is the open obligation a proof replaces.
        </p>
        <LeanStatement goalId={goalId} source={source} path={sourcePath ?? undefined} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Runs ({runs.length})</h2>
        <BenchmarkRunsTable runs={runs} />
      </section>
    </div>
  )
}
