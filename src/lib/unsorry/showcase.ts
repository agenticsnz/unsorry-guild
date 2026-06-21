import type { GoalEffort, GoalSolver } from './types'

export interface ShowcaseItem {
  goal: string
  name: string
  solver: string
  difficulty: number
}

/**
 * Highlighted proofs for the Showcase (#8): the highest-difficulty proved goals
 * that carry a credited solver, derived from the git snapshot. Pure + tested.
 */
export function buildShowcase(
  goalEffort: GoalEffort[],
  goalSolver: Map<string, GoalSolver>,
  topN = 24,
): ShowcaseItem[] {
  const difficulty = new Map(goalEffort.map((g) => [g.goal, g]))

  const items: ShowcaseItem[] = []
  for (const [goal, attribution] of goalSolver) {
    const effort = difficulty.get(goal)
    if (!effort || (effort.status !== 'proved' && effort.status !== 'archived')) continue
    items.push({
      goal,
      name: attribution.name ?? goal,
      solver: attribution.solver,
      difficulty: effort.difficulty,
    })
  }

  return items
    .sort((a, b) => b.difficulty - a.difficulty || a.name.localeCompare(b.name))
    .slice(0, topN)
}
