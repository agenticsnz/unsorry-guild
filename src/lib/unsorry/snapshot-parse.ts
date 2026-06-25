import { parseAispFields } from './aisp'

/**
 * Pure parser for unsorry's verified-proof index records (library/index/*.aisp),
 * which the proof-merge PRs commit to `main` in real time (ADR-024). Only the
 * goal→solver attribution is needed from the snapshot; the global leaderboard
 * score comes from canonical `leaderboard-ui.json` (see standings.ts).
 */

/** One verified proof — library/index/*.aisp. */
export interface SnapshotProof {
  goal: string
  solver: string
  name?: string
}

/**
 * One goal record — goals/*.aisp. Carries the per-goal `difficulty` (and status)
 * for EVERY goal, not just the telemetry-bearing subset that reaches
 * `community-stats.json`'s `goal_effort`. This is the difficulty source the
 * Showcase ranks over so the hardest proved goals are actually visible (#…).
 */
export interface SnapshotGoal {
  goal: string
  difficulty: number
  status: string
}

/** The parsed corpus powering on-read attribution. */
export interface UnsorrySnapshot {
  /** Active verified proofs — `library/index/*.aisp`. */
  proofs: SnapshotProof[]
  /**
   * Archived verified proofs — `packages/unsorry-archive-<n>/library/index/`.
   * Kept separate so existing active-only consumers (proof graph, podiums, target
   * boards) are unchanged; the Showcase merges both so the hardest proofs — which
   * are mostly older/archived — are visible.
   */
  archivedProofs: SnapshotProof[]
  goals: SnapshotGoal[]
}

/** `⟦Ω:Lemma⟧{goal,name}` + `⟦Π:Provenance⟧{solver,…}`. */
export function parseProof(text: string): SnapshotProof | null {
  const f = parseAispFields(text)
  if (!f.goal || !f.solver) return null
  return { goal: f.goal, solver: f.solver, name: f.name }
}

/** `⟦Ω:Goal⟧{id,status,difficulty}` — the original target record. */
export function parseGoal(text: string): SnapshotGoal | null {
  const f = parseAispFields(text)
  if (!f.id) return null
  const difficulty = Number.parseInt(f.difficulty ?? '', 10)
  return {
    goal: f.id,
    difficulty: Number.isFinite(difficulty) ? difficulty : 0,
    status: f.status ?? 'unknown',
  }
}
