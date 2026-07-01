import { parseAispFields } from './aisp'
import type { Decomposition } from './types'

/**
 * Pure parser for unsorry's verified-proof index records (library/index/*.aisp),
 * which the proof-merge PRs commit to `main` in real time (ADR-024). Only the
 * goal→solver attribution is needed from the snapshot; the global leaderboard
 * score comes from canonical `leaderboard-ui.json` (see standings.ts).
 */

/** One verified proof — library/index/*.aisp. The `solver` is the *explicit*
 *  `solver≜` credit; it is absent on older proofs whose attribution is inferred
 *  from git add-author history, so it is optional. The proof is verified either
 *  way — `goal` (a record in the index ⇒ proved) is what's load-bearing.
 *
 *  `provider`/`model` are the engine that discharged this goal (e.g. `python` /
 *  `sympy`). They join to the model registry via the `${provider} / ${model}`
 *  key (mirrors generate.py), powering the per-contributor "favourite models"
 *  breakdown. Both are optional — a handful of older records omit them.
 *
 *  `provedOn` is the record's day-stamp (`@YYYY-MM-DD` in the header line) — the
 *  only timestamp a record carries (the provenance block has no finer one), so
 *  recency is day-resolution. Optional: records with no parseable header date
 *  (e.g. hand-authored fixtures) omit it. */
export interface SnapshotProof {
  goal: string
  solver?: string
  name?: string
  provider?: string
  model?: string
  provedOn?: string
}

/** The `@YYYY-MM-DD` day-stamp in a record's header line (`𝔸<v>.lemma.<sha>@DATE`). */
const HEADER_DATE_RE = /@(\d{4}-\d{2}-\d{2})\b/

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
  /**
   * goal id → archive package (`unsorry-archive-<n>`) for archived proofs, so the
   * Showcase proof-detail page can resolve a goal's Lean statement from
   * `packages/<pkg>/goals/<id>.lean` once it has been retired out of active
   * `goals/` (where only its `.aisp` record remains). Active goals are absent here
   * and keep using `goals/<id>.lean`.
   */
  archivePackageByGoal: Record<string, string>
  /**
   * Authoritative parent→subs decomposition records — `decompositions/*.aisp`
   * (unsorry ADR-009). One record per decomposed parent; the goal views join each
   * sub's status/attribution from `proofs`/`goals` by goal id.
   */
  decompositions: Decomposition[]
}

/** `⟦Ω:Lemma⟧{goal,name}` + optional `⟦Π:Provenance⟧{solver,…}`. Requires only
 *  `goal` (a record here ⇒ proved); `solver≜∅` or an absent solver → undefined,
 *  so older inferred-attribution proofs are still captured (e.g. for the
 *  Showcase, which ranks the hardest proved goals regardless of explicit credit). */
export function parseProof(text: string): SnapshotProof | null {
  const f = parseAispFields(text)
  if (!f.goal) return null
  const solver = f.solver && f.solver !== '∅' ? f.solver : undefined
  const provider = f.provider && f.provider !== '∅' ? f.provider : undefined
  const model = f.model && f.model !== '∅' ? f.model : undefined
  // The day-stamp lives in the header line, not a fenced field — scan it directly.
  const provedOn = HEADER_DATE_RE.exec(text.split('\n', 1)[0] ?? '')?.[1]
  return { goal: f.goal, solver, name: f.name, provider, model, provedOn }
}

const ARCHIVE_PKG_RE = /^packages\/(unsorry-archive-[^/]+)\//

/** The archive package (`unsorry-archive-<n>`) a snapshot-relative path lives in,
 *  or null when it is not under an archive package. Pure. */
export function archivePackageOf(relPath: string): string | null {
  return ARCHIVE_PKG_RE.exec(relPath)?.[1] ?? null
}

/** A `key≜value` scalar in a decomposition record, stopped at the first field/block
 *  delimiter. Used for `parent`/`agent` — single tokens, not the `⟨…⟩` sub tuples. */
function decompScalar(text: string, key: 'parent' | 'agent'): string | undefined {
  const m = new RegExp(`${key}≜\\s*([^;,}\\s⟦⟧]+)`).exec(text)
  return m?.[1]
}

/** The `⟦Σ:Subs⟧{ … }` block body, or '' when absent. Sub tuples use `⟨…⟩`, never
 *  braces, so the block ends at the first `}` (single- or multi-line records). */
const SUBS_BLOCK_RE = /⟦Σ:Subs⟧\{([^}]*)\}/
/** Each helper sub's goal id, from its `⟨id≜<id>,…⟩` tuple. */
const SUB_ID_RE = /id≜\s*([^,⟩\s]+)/g

/**
 * `⟦Ω:Decomp⟧{parent≜…; agent≜…}` + `⟦Σ:Subs⟧{sub₁≜⟨id≜…⟩ …}` — the authoritative
 * parent→subs record (`decompositions/*.aisp`, unsorry ADR-009). The subs are read
 * from the `⟨id≜…⟩` tuples IN ORDER; the `<parent>-sN` id suffix is never consulted
 * (curated and suite-pinned subs have no such suffix). Returns null unless the record
 * has a parent and at least one sub.
 */
export function parseDecomposition(text: string): Decomposition | null {
  const parent = decompScalar(text, 'parent')
  if (!parent) return null

  const body = SUBS_BLOCK_RE.exec(text)?.[1] ?? ''
  const subs: string[] = []
  SUB_ID_RE.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = SUB_ID_RE.exec(body)) !== null) subs.push(m[1])
  if (subs.length === 0) return null

  const agent = decompScalar(text, 'agent')
  return agent ? { parent, subs, agent } : { parent, subs }
}

/** Parent goal id → its decomposition, for O(1) lookup from a goal view (first
 *  record wins on the rare duplicate). */
export function decompositionMap(decompositions: Decomposition[]): Map<string, Decomposition> {
  const map = new Map<string, Decomposition>()
  for (const d of decompositions) if (!map.has(d.parent)) map.set(d.parent, d)
  return map
}

/** The decomposition a goal is the parent of, or undefined when it is not a
 *  decomposition parent (the common case — the section then renders nothing). */
export function decompositionFor(
  decompositions: Decomposition[],
  parentId: string,
): Decomposition | undefined {
  return decompositions.find((d) => d.parent === parentId)
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
