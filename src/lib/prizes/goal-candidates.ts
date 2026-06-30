import type { BenchmarkSuite, GoalEffort } from '@/lib/unsorry/types'

/**
 * A pickable headline target for a Goal — sourced read-only from unsorry's goal
 * corpus + benchmark suites (ADR-015/036). The admin curates one of these into a
 * guild Goal; it is never authored here.
 */
export interface GoalCandidate {
  id: string
  difficulty?: number
  status?: string
  /** The benchmark suite this goal belongs to, when it came from a suite. */
  suite?: string
}

// Actionable (still-being-worked) statuses sort ahead of finished ones.
const ACTIONABLE = new Set(['open', 'blocked', 'translated'])
const rank = (status?: string) => (status && ACTIONABLE.has(status) ? 0 : 1)

/**
 * The candidate headline targets an admin can curate into a Goal: every
 * `goal_effort` row merged with every benchmark-suite goal, deduped by id
 * (`goal_effort` wins for status/difficulty, but a suite tag is preserved).
 * Sorted actionable-first, then hardest, then by id. Pure + unit-tested.
 */
export function buildGoalCandidates(
  goalEffort: GoalEffort[],
  suites: BenchmarkSuite[],
): GoalCandidate[] {
  const byId = new Map<string, GoalCandidate>()

  for (const s of suites) {
    for (const g of s.goals ?? []) {
      if (!byId.has(g.id)) {
        byId.set(g.id, { id: g.id, difficulty: g.difficulty, status: g.status, suite: s.id })
      }
    }
  }
  for (const e of goalEffort) {
    const existing = byId.get(e.goal)
    // goal_effort is the richer source — let it win difficulty/status, keep any suite tag.
    byId.set(e.goal, {
      id: e.goal,
      difficulty: e.difficulty,
      status: e.status,
      suite: existing?.suite,
    })
  }

  return [...byId.values()].sort(
    (a, b) =>
      rank(a.status) - rank(b.status) ||
      (b.difficulty ?? -1) - (a.difficulty ?? -1) ||
      a.id.localeCompare(b.id),
  )
}

/** Datalist option text for a candidate, e.g. `g-foo · d4 · open · putnam`. */
export function candidateLabel(c: GoalCandidate): string {
  return [
    c.id,
    c.difficulty != null ? `d${c.difficulty}` : null,
    c.status,
    c.suite,
  ]
    .filter(Boolean)
    .join(' · ')
}
