import { notFound } from 'next/navigation'
import { getPrize, getPrizes } from '@/lib/prizes/prizes'
import { getGoalEffort, getGoalSolverMap } from '@/lib/unsorry/standings'
import { computeTargetProgress } from '@/lib/unsorry/subtree'
import { computeTargetLeaderboard } from '@/lib/unsorry/target-leaderboard'
import { TargetProgressView } from '@/components/prizes/target-progress'
import { TargetLeaderboardTable } from '@/components/prizes/target-leaderboard-table'
import { Podium } from '@/components/prizes/podium'
import type { GoalEffort, TargetLeaderboardEntry, TargetProgress } from '@/lib/unsorry/types'

export const revalidate = 60

// Pre-render the known goal pages so navigation is instant (perf, #10).
export async function generateStaticParams() {
  const prizes = await getPrizes('math')
  return prizes.map((p) => ({ targetId: p.headlineGoalId }))
}

export default async function PrizeDetailPage({
  params,
}: {
  params: Promise<{ targetId: string }>
}) {
  const { targetId } = await params
  const prize = await getPrize(targetId)
  if (!prize) notFound()

  let goalEffort: GoalEffort[] = []
  let board: TargetLeaderboardEntry[] = []
  try {
    goalEffort = await getGoalEffort()
    const solverMap = await getGoalSolverMap()
    board = computeTargetLeaderboard(prize.headlineGoalId, goalEffort, solverMap)
  } catch {
    // progress still renders from goalEffort (possibly empty); board stays empty
  }
  const progress: TargetProgress = computeTargetProgress(prize.headlineGoalId, goalEffort)

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <span aria-hidden>{prize.badgeEmoji}</span>
          {prize.title}
        </h1>
        <p className="text-foreground/70 max-w-2xl">{prize.description}</p>
        <p className="text-xs text-foreground/50">
          Target goal: <code>{prize.headlineGoalId}</code>
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Progress</h2>
        <TargetProgressView progress={progress} />
      </section>

      {board.length > 0 && (
        <section>
          <Podium entries={board} closed={progress.isClosed} />
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Leaderboard</h2>
        <TargetLeaderboardTable entries={board} />
      </section>
    </div>
  )
}
