import { subtreeGoals } from './subtree'
import type { GoalEffort, GoalSolver, TargetLeaderboardEntry } from './types'

/** unsorry's board score, scoped to a target. Mirrors leaderboard-ui score_policy. */
export function targetScore(difficultyPoints: number, creditedProofs: number): number {
  return difficultyPoints * 100 + creditedProofs * 25
}

/**
 * Per-target leaderboard: for each proved goal in the target's subtree, credit
 * its difficulty + a proof to the goal's solver. Goals with no attribution count
 * toward progress but not toward any contributor (graceful degradation, ADR-019).
 */
export function computeTargetLeaderboard(
  headlineId: string,
  goalEffort: GoalEffort[],
  goalSolver: Map<string, GoalSolver>,
): TargetLeaderboardEntry[] {
  const provedSubtree = subtreeGoals(headlineId, goalEffort).filter(
    (g) => g.status === 'proved' || g.status === 'archived',
  )

  const byContributor = new Map<string, { difficultyPoints: number; creditedProofs: number }>()
  for (const goal of provedSubtree) {
    const attribution = goalSolver.get(goal.goal)
    if (!attribution) continue
    const current = byContributor.get(attribution.solver) ?? { difficultyPoints: 0, creditedProofs: 0 }
    current.difficultyPoints += goal.difficulty
    current.creditedProofs += 1
    byContributor.set(attribution.solver, current)
  }

  return [...byContributor.entries()]
    .map(([github, v]) => ({
      github,
      difficultyPoints: v.difficultyPoints,
      creditedProofs: v.creditedProofs,
      score: targetScore(v.difficultyPoints, v.creditedProofs),
      rank: 0,
    }))
    .sort((a, b) => b.score - a.score || a.github.localeCompare(b.github))
    .map((entry, i) => ({ ...entry, rank: i + 1 }))
}
