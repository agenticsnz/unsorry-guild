'use client'

import { useMemo } from 'react'
import dynamic from 'next/dynamic'
import type { ProofGraph } from '@/lib/unsorry/graph'

// react-force-graph-2d touches window/canvas — load it client-only.
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false })

const CONTRIBUTOR = 'hsl(14, 70%, 60%)' // brand orange
const GOAL = 'hsl(215, 20%, 55%)'

export function ProofGraphCanvas({ graph }: { graph: ProofGraph }) {
  // Clone so the force simulation can mutate node objects without touching props.
  const data = useMemo(
    () => ({
      nodes: graph.nodes.map((n) => ({ ...n })),
      links: graph.links.map((l) => ({ ...l })),
    }),
    [graph],
  )

  return (
    <div className="rounded-lg border bg-card overflow-hidden" style={{ height: '75vh' }}>
      <ForceGraph2D
        graphData={data}
        nodeRelSize={4}
        nodeVal={(n) => (n as { val?: number }).val ?? 1}
        nodeColor={(n) => ((n as { kind?: string }).kind === 'contributor' ? CONTRIBUTOR : GOAL)}
        nodeLabel={(n) => (n as { label?: string }).label ?? String((n as { id: string }).id)}
        linkColor={() => 'rgba(148,163,184,0.25)'}
        linkWidth={1}
        backgroundColor="transparent"
        cooldownTicks={120}
        enableNodeDrag
      />
    </div>
  )
}
