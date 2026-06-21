import { parseAispFields } from './aisp'
import type { TargetStatus } from './types'

/**
 * Pure parsers for the three raw AISP record families that unsorry's proof-merge
 * PRs commit to `main` in real time (ADR-024). Parsing the current records (not
 * commit history) keeps the on-read recompute cheap. Fields are plucked with the
 * shared `parseAispFields` scanner.
 */

/** One verified proof — library/index/*.aisp. */
export interface SnapshotProof {
  goal: string
  solver: string
  name?: string
  providerModel: string
  date?: string
}

/** One goal's live status + difficulty — goals/*.aisp. */
export interface SnapshotGoal {
  goal: string
  status: TargetStatus
  difficulty: number
}

/** One proving run outcome — proof-runs/*.aisp. */
export interface SnapshotRun {
  goal: string
  solver?: string
  outcome: string
  success: boolean
  providerModel: string
  ended?: string
}

/** The parsed corpus powering all on-read standings. */
export interface UnsorrySnapshot {
  proofs: SnapshotProof[]
  goals: SnapshotGoal[]
  runs: SnapshotRun[]
}

const DATE_RE = /@(\d{4}-\d{2}-\d{2})/

function providerModel(f: Record<string, string>): string {
  const provider = f.provider?.trim() || 'unknown'
  const model = f.model?.trim() || 'unknown'
  return `${provider} / ${model}`
}

/** `⟦Ω:Lemma⟧{goal,name}` + `⟦Π:Provenance⟧{solver,provider,model}` + `@date` header. */
export function parseProof(text: string): SnapshotProof | null {
  const f = parseAispFields(text)
  if (!f.goal || !f.solver) return null
  return {
    goal: f.goal,
    solver: f.solver,
    name: f.name,
    providerModel: providerModel(f),
    date: DATE_RE.exec(text)?.[1],
  }
}

/** `⟦Ω:Goal⟧{id,status,difficulty}`. */
export function parseGoal(text: string): SnapshotGoal | null {
  const f = parseAispFields(text)
  if (!f.id) return null
  return {
    goal: f.id,
    status: (f.status as TargetStatus) || 'open',
    difficulty: Number.parseFloat(f.difficulty ?? '') || 0,
  }
}

/** `⟦Ω:Run⟧{goal,outcome}` + `⟦Π:Provenance⟧{solver,provider,model}` + `⟦Λ:Metrics⟧{ended}`. */
export function parseRun(text: string): SnapshotRun | null {
  const f = parseAispFields(text)
  if (!f.goal) return null
  const outcome = f.outcome ?? 'unknown'
  return {
    goal: f.goal,
    solver: f.solver,
    outcome,
    success: outcome === 'proved',
    providerModel: providerModel(f),
    ended: f.ended,
  }
}
