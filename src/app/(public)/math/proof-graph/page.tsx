import { getGoalEffort, getGoalSolverMap } from '@/lib/unsorry/standings'
import { buildProofGraph } from '@/lib/unsorry/graph'
import { ProofGraphCanvas } from '@/components/graph/proof-graph-canvas'

export const metadata = { title: 'Proof graph · Math · unsorry-guild' }
export const revalidate = 60

export default async function ProofGraphPage() {
  const [goalEffort, solverMap] = await Promise.all([getGoalEffort(), getGoalSolverMap()])
  const graph = buildProofGraph(goalEffort, solverMap)

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">Proof graph</h1>
        <p className="text-sm text-foreground/70">
          Every verified proof links a goal to the contributor who discharged it. Drag nodes, scroll
          to zoom, hover for names. <span className="text-brand">Orange</span> = contributors,{' '}
          grey = goals.
        </p>
      </div>
      {graph.links.length > 0 ? (
        <ProofGraphCanvas graph={graph} />
      ) : (
        <p className="text-sm text-foreground/70">No proof attribution available right now.</p>
      )}
    </div>
  )
}
