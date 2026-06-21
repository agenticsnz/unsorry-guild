import type { GoalEffort, GoalSolver } from './types'

export interface GraphNode {
  id: string
  label: string
  kind: 'contributor' | 'goal'
  val: number
}
export interface GraphLink {
  source: string
  target: string
}
export interface ProofGraph {
  nodes: GraphNode[]
  links: GraphLink[]
}

/**
 * Bipartite proof↔contributor graph (ADR-024-derived, #8): each proved+attributed
 * goal links to its credited solver. Contributor node size scales with proof count.
 * Pure — feeds the interactive force-directed view and is unit-tested.
 */
export function buildProofGraph(
  goalEffort: GoalEffort[],
  goalSolver: Map<string, GoalSolver>,
): ProofGraph {
  const proved = new Set(
    goalEffort.filter((g) => g.status === 'proved' || g.status === 'archived').map((g) => g.goal),
  )

  const links: GraphLink[] = []
  const goalNodes = new Map<string, GraphNode>()
  const proofCount = new Map<string, number>()

  for (const [goal, attribution] of goalSolver) {
    if (!proved.has(goal)) continue
    const solver = attribution.solver
    const contributorId = `c:${solver}`
    const goalId = `g:${goal}`
    goalNodes.set(goalId, {
      id: goalId,
      label: attribution.name ?? goal,
      kind: 'goal',
      val: 1,
    })
    proofCount.set(solver, (proofCount.get(solver) ?? 0) + 1)
    links.push({ source: contributorId, target: goalId })
  }

  const contributorNodes: GraphNode[] = [...proofCount.entries()].map(([solver, count]) => ({
    id: `c:${solver}`,
    label: `@${solver}`,
    kind: 'contributor',
    val: Math.max(2, Math.min(20, count)),
  }))

  return { nodes: [...contributorNodes, ...goalNodes.values()], links }
}
