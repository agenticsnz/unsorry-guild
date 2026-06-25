import { notFound } from 'next/navigation'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { LeanStatement } from '@/components/math/lean-statement'
import { proofModule } from '@/lib/unsorry/fetchers'
import {
  getGoalEffort,
  getGoalSolverMap,
  getGoalSource,
  getProofSource,
} from '@/lib/unsorry/standings'

export const dynamic = 'force-dynamic'

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

export default async function ShowcaseProofPage({
  params,
}: {
  params: Promise<{ goal: string }>
}) {
  const { goal } = await params
  const [goalEffort, solverMap, statement, proof] = await Promise.all([
    getGoalEffort(),
    getGoalSolverMap(),
    getGoalSource(goal),
    getProofSource(goal),
  ])
  const effort = goalEffort.find((g) => g.goal === goal)
  if (!effort || (effort.status !== 'proved' && effort.status !== 'archived')) notFound()
  const attribution = solverMap.get(goal)
  const successRate =
    effort.attempts && effort.attempts > 0
      ? Math.round((100 * (effort.successes ?? 0)) / effort.attempts)
      : null

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-sm text-foreground/50">
          <Link href="/math/showcase" className="hover:underline">
            Showcase
          </Link>{' '}
          / {goal}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-mono text-2xl font-bold">{attribution?.name ?? goal}</h1>
          <Badge>{effort.status}</Badge>
          <Badge variant="outline">difficulty {effort.difficulty}</Badge>
        </div>
        {attribution && (
          <p className="text-sm text-foreground/70">
            Proved by{' '}
            <Link
              href={`/math/contributors/${attribution.solver}`}
              className="font-medium text-foreground hover:underline"
            >
              @{attribution.solver}
            </Link>
          </p>
        )}
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Stats</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Difficulty" value={effort.difficulty} />
          <Stat label="Attempts" value={effort.attempts ?? '—'} />
          <Stat label="Successes" value={effort.successes ?? '—'} />
          <Stat label="Runs" value={effort.runs ?? '—'} />
        </div>
        {successRate != null && (
          <p className="text-xs text-foreground/50">
            Success rate {successRate}% across recorded attempts.
          </p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Target</h2>
        <p className="text-sm text-foreground/60">
          The statement the swarm proved — kernel-verified at Gate A.
        </p>
        <LeanStatement path={`goals/${goal}.lean`} source={statement} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Proof</h2>
        {proof ? (
          <LeanStatement path={`library/Unsorry/${proofModule(goal)}.lean`} source={proof} />
        ) : (
          <p className="text-sm text-foreground/70">
            Proof source unavailable (archived, or a non-standard module path).
          </p>
        )}
      </section>
    </div>
  )
}
