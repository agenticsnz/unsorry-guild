# SPEC-025-A: Native Proof-Graph, Showcase & Queue

Implements [ADR-025](../adrs/ADR-025-Native-Pages.md). Issue #1 items #8, #9.

## Proof graph (#8)
- `src/lib/unsorry/graph.ts` `buildProofGraph(goalEffort, goalSolverMap)` → `{ nodes, links }`. Bipartite: contributor nodes (size = proof count) + proved/attributed goal nodes; one link per proof. Pure.
- `src/components/graph/proof-graph-canvas.tsx` — `react-force-graph-2d@1.29.1` via `next/dynamic({ ssr:false })`; node colour by `kind` (contributor=brand, goal=grey), `nodeLabel`, drag + scroll-zoom.
- `proof-graph/page.tsx` — server: `getGoalEffort()` + `getGoalSolverMap()` → `buildProofGraph` → `<ProofGraphCanvas>`; iframe removed.

## Showcase (#8)
- `src/lib/unsorry/showcase.ts` `buildShowcase(goalEffort, goalSolverMap, topN=24)` → proved/attributed goals sorted by difficulty. Pure.
- `showcase/page.tsx` — server: native cards (lemma name, difficulty badge, contributor link); iframe removed.

## Queue (#9)
- `types.ts`: add `QueueItem { goal, branch?, sha?, model?, date?, state? }` and `QueueSolver.queued?: QueueItem[]`.
- `QueueBoard`: summary cards (+ distinct goals), per-solver table (+ distinct-goals column), and a flattened **Queued work** table (in-flight first, then by date) showing goal, solver, model, state badge, date.
- `queue/page.tsx` revalidate → 60.

## Tests
- `src/tests/lib/unsorry/graph-showcase.test.ts` — graph linking/exclusion + showcase ordering/topN.
- Existing `queue-board.test.tsx` continues to pass.
