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

/** The parsed corpus powering on-read attribution. */
export interface UnsorrySnapshot {
  proofs: SnapshotProof[]
}

/** `⟦Ω:Lemma⟧{goal,name}` + `⟦Π:Provenance⟧{solver,…}`. */
export function parseProof(text: string): SnapshotProof | null {
  const f = parseAispFields(text)
  if (!f.goal || !f.solver) return null
  return { goal: f.goal, solver: f.solver, name: f.name }
}
