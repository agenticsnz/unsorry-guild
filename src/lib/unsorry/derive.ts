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

/**
 * goal → credited solver across BOTH active and archived proofs, for the
 * Showcase. The hardest proved goals are mostly archived, so the active-only
 * `deriveGoalSolverMap` (kept as-is for the proof graph / boards) can't see them.
 * Active attribution wins on the rare goal present in both.
 */
export function deriveShowcaseSolverMap(s: UnsorrySnapshot): Map<string, GoalSolver> {
  const map = new Map<string, GoalSolver>()
  for (const p of s.archivedProofs) {
    map.set(p.goal, { goal: p.goal, solver: p.solver, name: p.name })
  }
  for (const p of s.proofs) {
    map.set(p.goal, { goal: p.goal, solver: p.solver, name: p.name })
  }
  return map
}

export interface GoalMeta {
  difficulty: number
  status: string
}

/**
 * goal → {difficulty, status} for EVERY goal in the snapshot. This is the
 * full-corpus difficulty source the Showcase ranks over, instead of the
 * telemetry-only `goal_effort` slice (which omits the older/archived hard proofs
 * that have no proof-run records — so the hardest proved goals were invisible).
 */
export function deriveGoalMetaMap(s: UnsorrySnapshot): Map<string, GoalMeta> {
  const map = new Map<string, GoalMeta>()
  for (const g of s.goals) {
    map.set(g.goal, { difficulty: g.difficulty, status: g.status })
  }
  return map
}
