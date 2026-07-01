import { notFound } from 'next/navigation'
import { getPrize } from '@/lib/prizes/prizes'
import {
  getDecompositions,
  getGoalEffort,
  getGoalMetaMap,
  getGoalSolverMap,
  getShowcaseSolverMap,
} from '@/lib/unsorry/standings'
import { computeTargetProgress } from '@/lib/unsorry/subtree'
import { computeTargetLeaderboard } from '@/lib/unsorry/target-leaderboard'
import { decompositionFor } from '@/lib/unsorry/snapshot-parse'
import { resolveDecomposition } from '@/lib/unsorry/decomposition'
import { TargetProgressView } from '@/components/prizes/target-progress'
import { TargetLeaderboardTable } from '@/components/prizes/target-leaderboard-table'
import { Podium } from '@/components/prizes/podium'
import { GoalDecomposition } from '@/components/math/goal-decomposition'
import type { GoalEffort, TargetLeaderboardEntry, TargetProgress } from '@/lib/unsorry/types'

// Recompute-on-read; render per request (the loading.tsx skeleton covers the
// fetch). Rendered dynamically rather than prerendered to keep GitHub calls out
// of the build (ADR-024, perf #10).
export const dynamic = 'force-dynamic'

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

  // ADR-037: if the headline goal is a decomposition parent, resolve its helper
  // sub-lemmas + composed proof from the ingested records. Empty/absent → no section.
  const decomposition = await (async () => {
    try {
      const decompositions = await getDecompositions()
      const record = decompositionFor(decompositions, prize.headlineGoalId)
      if (!record) return null
      const [goalMeta, solverMap] = await Promise.all([getGoalMetaMap(), getShowcaseSolverMap()])
      return resolveDecomposition(record, goalMeta, solverMap)
    } catch {
      return null
    }
  })()

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

      <GoalDecomposition decomposition={decomposition} />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Leaderboard</h2>
        <TargetLeaderboardTable entries={board} />
      </section>
    </div>
  )
}
