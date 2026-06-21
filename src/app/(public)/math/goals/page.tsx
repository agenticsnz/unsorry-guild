import { getPrizes } from '@/lib/prizes/prizes'
import { getGoalEffort } from '@/lib/unsorry/standings'
import { computeTargetProgress } from '@/lib/unsorry/subtree'
import { PrizeCard } from '@/components/prizes/prize-card'
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

  return (
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
  )
}
