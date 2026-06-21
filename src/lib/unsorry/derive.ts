import type { UnsorrySnapshot } from './snapshot-parse'
import type { GoalSolver } from './types'

/**
 * goal → credited solver, from the git snapshot's verified-proof index
 * (ADR-024). Replaces the per-file `library/index` scan for the per-target
 * boards, podiums, proof graph, and showcase. Pure + unit-tested.
 *
 * (The global leaderboard's score is sourced from canonical `leaderboard-ui.json`
 * — see `standings.ts` — because it includes dispatch points and archived credit
 * that the raw records don't carry.)
 */
export function deriveGoalSolverMap(s: UnsorrySnapshot): Map<string, GoalSolver> {
  const map = new Map<string, GoalSolver>()
  for (const p of s.proofs) {
    map.set(p.goal, { goal: p.goal, solver: p.solver, name: p.name })
  }
  return map
}
