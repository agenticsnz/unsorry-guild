import type { GoalMeta } from './derive'
import type { Decomposition, GoalSolver } from './types'

/**
 * Joins an authoritative `decompositions/*.aisp` record (ADR-037) to the ingested
 * goal + proof data so a goal view can render *how* a hard goal was solved: the
 * helper sub-lemmas (id, status, solver attribution, link) and the parent's
 * composed proof. Pure — the view supplies the already-loaded lookups (the same
 * `goalMeta`/`solverMap` the proof pages use), keyed on GOAL ID so a sub resolves
 * whether its proof lives in the repo library today or the suite pin (unsorry
 * ADR-116) tomorrow.
 */

/** Statuses that mean a goal has a verified proof. */
const PROVED_STATUSES = new Set(['proved', 'archived'])

/** A goal referenced by a decomposition (a helper sub, or the composed parent),
 *  resolved against the snapshot for display. */
export interface ResolvedGoalRef {
  id: string
  /** Goal status from the goal records (`proved` / `open` / `blocked` / …). */
  status: string
  /** True when the goal has a verified proof (proved or archived). */
  proved: boolean
  /** Credited solver handle, when the proof carries explicit `solver≜` credit. */
  solver?: string
  /** Lemma name from the proof record, when proved. */
  name?: string
  /** Link to the goal's own detail page. */
  href: string
}

export interface ResolvedDecomposition {
  parent: string
  agent?: string
  /** The helper sub-lemmas, in the record's order. */
  subs: ResolvedGoalRef[]
  /** The parent goal as the assembled/composed result the helpers feed into. */
  composed: ResolvedGoalRef
}

/** The detail page for a goal id. Keyed on goal id (not library path), so it works
 *  for repo-library and suite-pinned subs alike. */
export function goalHref(goalId: string): string {
  return `/math/proofs/${goalId}`
}

function resolveRef(
  id: string,
  goalMeta: Map<string, GoalMeta>,
  solverMap: Map<string, GoalSolver>,
): ResolvedGoalRef {
  // A sub with no goal record yet (not sourced/blocked upstream) reads as open —
  // never crash the view over a missing join.
  const status = goalMeta.get(id)?.status ?? 'open'
  const attribution = solverMap.get(id)
  const solver = attribution?.solver ? attribution.solver : undefined
  return {
    id,
    status,
    proved: PROVED_STATUSES.has(status) || solver !== undefined,
    solver,
    name: attribution?.name,
    href: goalHref(id),
  }
}

/** Resolve a decomposition's parent + ordered subs against the snapshot lookups. */
export function resolveDecomposition(
  decomposition: Decomposition,
  goalMeta: Map<string, GoalMeta>,
  solverMap: Map<string, GoalSolver>,
): ResolvedDecomposition {
  return {
    parent: decomposition.parent,
    agent: decomposition.agent,
    subs: decomposition.subs.map((id) => resolveRef(id, goalMeta, solverMap)),
    composed: resolveRef(decomposition.parent, goalMeta, solverMap),
  }
}
