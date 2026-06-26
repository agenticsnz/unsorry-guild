import type { SnapshotProof, UnsorrySnapshot } from './snapshot-parse'
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
    // Only proofs with an EXPLICIT solver credit — preserves the existing proof
    // graph / podium / board behaviour, which attribute to a named solver.
    if (!p.solver) continue
    map.set(p.goal, { goal: p.goal, solver: p.solver, name: p.name })
  }
  return map
}

/**
 * goal → proof (credited solver where known) across BOTH active and archived
 * proofs, for the Showcase. Differs from `deriveGoalSolverMap` in two ways the
 * Showcase needs and the proof graph must NOT have:
 *   1. includes archived proofs — the hardest proved goals are mostly archived;
 *   2. includes proofs with no explicit `solver≜` (inferred git attribution) —
 *      otherwise the hardest such proofs (e.g. the lone difficulty-5) vanish.
 * `solver` is `''` when there is no explicit credit. Active wins on conflict.
 */
export function deriveShowcaseSolverMap(s: UnsorrySnapshot): Map<string, GoalSolver> {
  const map = new Map<string, GoalSolver>()
  for (const p of [...s.archivedProofs, ...s.proofs]) {
    map.set(p.goal, { goal: p.goal, solver: p.solver ?? '', name: p.name })
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

/** One engine a contributor's verified proofs were discharged by. */
export interface ContributorModelUsage {
  /** `${provider} / ${model}` — the join key to the model registry. */
  providerModel: string
  /** Distinct proved goals this contributor earned with this engine. */
  proofs: number
}

/**
 * The engines behind ONE contributor's verified proofs — their "favourite
 * models", ranked by how many of their proofs each discharged. Built from the
 * proof records' `solver` + `provider`/`model` provenance across BOTH active and
 * archived proofs (a contributor's score credits archived proofs too), deduped
 * per goal so a re-proved goal is counted once (active provenance wins).
 *
 * The `${provider} / ${model || 'unknown'}` key mirrors generate.py's model
 * distribution exactly, so each row joins cleanly to the model→Pokémon registry.
 * Proofs whose record carries no `provider` (a handful of legacy records) are
 * skipped — they cannot be attributed to an engine.
 */
export function deriveContributorModels(
  s: UnsorrySnapshot,
  handle: string,
): ContributorModelUsage[] {
  const h = handle.toLowerCase()
  // Dedupe per goal, active provenance winning over an archived re-proof.
  const byGoal = new Map<string, SnapshotProof>()
  for (const p of [...s.archivedProofs, ...s.proofs]) {
    if ((p.solver ?? '').toLowerCase() === h) byGoal.set(p.goal, p)
  }

  const counts = new Map<string, number>()
  for (const p of byGoal.values()) {
    if (!p.provider) continue
    const key = `${p.provider} / ${p.model || 'unknown'}`
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  return [...counts.entries()]
    .map(([providerModel, proofs]) => ({ providerModel, proofs }))
    .sort((a, b) => b.proofs - a.proofs || a.providerModel.localeCompare(b.providerModel))
}
