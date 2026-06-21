import type { GoalEffort, TargetProgress, TargetStatus } from './types'

/**
 * A flagship target's dependency tree is encoded in the goal-id suffix
 * convention (`<headline>-s4-s3-s2`), not in the AISP `deps` field. A goal is
 * in the target iff it is the headline or a suffix descendant.
 */
export function isInTarget(headlineId: string, goalId: string): boolean {
  return goalId === headlineId || goalId.startsWith(`${headlineId}-s`)
}

export function subtreeGoals<T extends { goal: string }>(headlineId: string, goals: T[]): T[] {
  return goals.filter((g) => isInTarget(headlineId, g.goal))
}

/** Live progress of a target over its subtree (proved / total + status breakdown). */
export function computeTargetProgress(headlineId: string, goalEffort: GoalEffort[]): TargetProgress {
  const sub = subtreeGoals(headlineId, goalEffort)
  const count = (status: TargetStatus) => sub.filter((g) => g.status === status).length

  const proved = count('proved')
  const blocked = count('blocked')
  const open = count('open')
  const archived = count('archived')
  const total = sub.length

  const headlineStatus = sub.find((g) => g.goal === headlineId)?.status ?? 'open'

  return {
    headlineId,
    total,
    proved,
    blocked,
    open,
    archived,
    percentProved: total ? Math.round((proved / total) * 100) : 0,
    headlineStatus,
    isClosed: headlineStatus === 'proved',
  }
}
