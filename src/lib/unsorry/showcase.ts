import type { GoalEffort, GoalSolver } from './types'
import type { GoalMeta } from './derive'

export interface ShowcaseItem {
  goal: string
  name: string
  solver: string
  difficulty: number
}

/** Default minimum difficulty for the Showcase — an "elite" board of the hardest
 *  proved goals. The corpus is ~85% difficulty-1 template proofs, so without a
 *  floor the board fills with trivia; difficulty ≥4 keeps only the genuinely hard
 *  results. Tunable per call. */
export const DEFAULT_MIN_DIFFICULTY = 4

export interface ShowcaseOptions {
  minDifficulty?: number
  topN?: number
}

/**
 * Highlighted proofs for the Showcase: the highest-difficulty proved goals that
 * carry a credited solver, ranked over the WHOLE proved corpus (active +
 * archived) by each goal's recorded difficulty.
 *
 * The difficulty comes from the goal records (`goalMeta`, every goal), not the
 * telemetry-only `goal_effort` slice — so the hardest proofs, which are mostly
 * older/archived and have no proof-run telemetry, are actually visible instead of
 * the board padding to `topN` with difficulty-1 templates. Pure + tested.
 */
export function buildShowcase(
  goalSolver: Map<string, GoalSolver>,
  goalMeta: Map<string, GoalMeta>,
  { minDifficulty = DEFAULT_MIN_DIFFICULTY, topN = 24 }: ShowcaseOptions = {},
): ShowcaseItem[] {
  const items: ShowcaseItem[] = []
  for (const [goal, attribution] of goalSolver) {
    const meta = goalMeta.get(goal)
    // A goal in goalSolver has a verified proof, so it is proved/archived; we only
    // gate on difficulty. Goals with no difficulty record, or below the floor, are
    // excluded — the Showcase is the hardest results, not every result.
    if (!meta || meta.difficulty < minDifficulty) continue
    items.push({
      goal,
      name: attribution.name ?? goal,
      solver: attribution.solver,
      difficulty: meta.difficulty,
    })
  }

  return items
    .sort((a, b) => b.difficulty - a.difficulty || a.name.localeCompare(b.name))
    .slice(0, topN)
}

/** Everything the proof-detail page shows for a single proved goal. */
export interface ProofDetail {
  goal: string
  name: string
  solver: string
  difficulty: number
  status: string
  /** Run telemetry — present only for goals that carry proof-run records. */
  runs?: number
  successes?: number
  attempts?: number
}

/**
 * Assemble the detail view for one goal: its credited solver + lemma name (from
 * the proof index), its difficulty + status (the original target record), and run
 * telemetry where it exists. Returns `null` when the goal has no credited proof —
 * the detail page is for proved goals, so the caller renders a 404. Pure + tested.
 */
export function buildProofDetail(
  goal: string,
  goalSolver: Map<string, GoalSolver>,
  goalMeta: Map<string, GoalMeta>,
  goalEffort: GoalEffort[],
): ProofDetail | null {
  const attribution = goalSolver.get(goal)
  if (!attribution) return null
  const meta = goalMeta.get(goal)
  const effort = goalEffort.find((e) => e.goal === goal)
  return {
    goal,
    name: attribution.name ?? goal,
    solver: attribution.solver,
    difficulty: meta?.difficulty ?? effort?.difficulty ?? 0,
    status: meta?.status ?? effort?.status ?? 'proved',
    runs: effort?.runs,
    successes: effort?.successes,
    attempts: effort?.attempts,
  }
}
