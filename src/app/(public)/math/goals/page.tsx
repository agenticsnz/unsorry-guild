import { getPrizes } from '@/lib/prizes/prizes'
import { getGoalEffort, getRegisteredTargets } from '@/lib/unsorry/standings'
import { computeTargetProgress } from '@/lib/unsorry/subtree'
import { PrizeCard } from '@/components/prizes/prize-card'
import { BenchmarkSuites } from '@/components/math/benchmark-suites'
import type { GoalEffort } from '@/lib/unsorry/types'

export const metadata = { title: 'Goals · Math · unsorry-guild' }
export const dynamic = 'force-dynamic'

export default async function GoalsPage() {
  const prizes = await getPrizes('math')

  let goalEffort: GoalEffort[] = []
  try {
    goalEffort = await getGoalEffort()
  } catch {
    goalEffort = []
  }

  const items = prizes.map((prize) => ({
    prize,
    progress: computeTargetProgress(prize.headlineGoalId, goalEffort),
  }))

  const suites = await getRegisteredTargets()

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Goals</h1>
          <p className="text-sm text-foreground/70">
            Flagship targets the swarm is racing to complete. Open a goal for its leaderboard, or
            copy its id straight into your <code>run.sh</code>.
          </p>
        </div>
        {items.length === 0 ? (
          <p className="text-sm text-foreground/70">No goals yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map(({ prize, progress }) => (
              <PrizeCard key={prize.id} prize={prize} progress={progress} />
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">Benchmark suites</h2>
          <p className="text-sm text-foreground/70">
            Curated, kernel-verified benchmark targets (ADR-092). Copy a goal’s
            <code> run.sh --goal &lt;id&gt;</code> and the swarm proves it — scored as verified
            pass@k, separate from the leaderboard.
          </p>
        </div>
        <BenchmarkSuites suites={suites} />
      </div>
    </div>
  )
}
