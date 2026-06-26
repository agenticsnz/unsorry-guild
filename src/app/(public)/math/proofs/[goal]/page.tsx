import { notFound } from 'next/navigation'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { LeanStatement } from '@/components/math/lean-statement'
import {
  getGoalEffort,
  getGoalMetaMap,
  getGoalSource,
  getShowcaseSolverMap,
} from '@/lib/unsorry/standings'
import { buildProofDetail } from '@/lib/unsorry/showcase'
import { repoBlobUrl } from '@/lib/unsorry/constants'

export const dynamic = 'force-dynamic'

export default async function ProofDetailPage({
  params,
}: {
  params: Promise<{ goal: string }>
}) {
  const { goal: goalId } = await params

  const [solverMap, goalMeta, goalEffort] = await Promise.all([
    getShowcaseSolverMap(),
    getGoalMetaMap(),
    getGoalEffort(),
  ])
  const detail = buildProofDetail(goalId, solverMap, goalMeta, goalEffort)
  if (!detail) notFound()

  // Best-effort Lean statement (only benchmark goals publish goals/<id>.lean);
  // LeanStatement renders an "unavailable" note when the source is empty.
  const source = await getGoalSource(goalId)

  const statusVariant =
    detail.status === 'proved' ? 'default' : detail.status === 'archived' ? 'secondary' : 'outline'
  const hasTelemetry =
    detail.runs !== undefined || detail.successes !== undefined || detail.attempts !== undefined

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-sm text-foreground/50">
          <Link href="/math/showcase" className="hover:underline">
            Showcase
          </Link>{' '}
          / {goalId}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-mono text-2xl font-bold">{detail.name}</h1>
          <Badge variant={statusVariant}>{detail.status}</Badge>
          <Badge variant="outline">difficulty {detail.difficulty}</Badge>
        </div>
        <p className="text-sm text-foreground/70">
          {detail.solver ? (
            <>
              Proved by{' '}
              <Link
                href={`/math/contributors/${detail.solver}`}
                className="font-medium text-foreground hover:underline"
              >
                @{detail.solver}
              </Link>
              .{' '}
            </>
          ) : (
            <>Attribution inferred from git history (no explicit solver credit).{' '}</>
          )}
          Kernel-verified at Gate A; no human in the correctness path.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Original target</h2>
        <p className="text-sm text-foreground/60">
          The goal record the swarm was asked to discharge — the source of truth for this proof&apos;s
          identity and difficulty.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <code className="font-mono text-sm">{goalId}</code>
          <a
            href={repoBlobUrl(`goals/${goalId}.aisp`)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-brand hover:underline"
          >
            AISP goal record →
          </a>
          {source && (
            <a
              href={repoBlobUrl(`goals/${goalId}.lean`)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-brand hover:underline"
            >
              Lean statement (goals/{goalId}.lean) →
            </a>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Effort &amp; telemetry</h2>
        {hasTelemetry ? (
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Difficulty" value={detail.difficulty} />
            <Stat label="Runs" value={detail.runs} />
            <Stat label="Successes" value={detail.successes} />
            <Stat label="Provider attempts" value={detail.attempts} />
          </dl>
        ) : (
          <p className="text-sm text-foreground/70">
            No proof-run telemetry recorded for this goal — its proof predates run logging or was
            landed without a run record. Difficulty {detail.difficulty}.
          </p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Statement</h2>
        <p className="text-sm text-foreground/60">
          The Lean statement the swarm proved, kernel-verified at Gate A.
        </p>
        <LeanStatement goalId={goalId} source={source} />
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value?: number }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <dt className="text-xs uppercase tracking-wide text-foreground/50">{label}</dt>
      <dd className="mt-1 text-lg font-semibold">{value ?? '—'}</dd>
    </div>
  )
}
