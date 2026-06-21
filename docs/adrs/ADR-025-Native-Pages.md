# ADR-025: Native Proof-Graph, Showcase & Queue Parity

| Field | Value |
|-------|-------|
| **Decision ID** | ADR-025 |
| **Initiative** | unsorry-guild v2.0.0 (issue #1) |
| **Proposed By** | Development Team |
| **Date** | 2026-06-21 |
| **Status** | Accepted |

---

## WH(Y) Decision Statement

**In the context of** the proof-graph and showcase pages being `<iframe>` embeds of unsorry's HTML (ADR-021's stopgap) and the queue page surfacing only summary + per-solver totals,

**facing** issue #1's ask to "actually recreate the showcase and proof-graph pages in the correct style and integrate them properly" (#8) and to "replicate the full functionality of the queue page" (#9),

**we decided for** rendering all three natively from the git snapshot (ADR-024): the proof-graph as an interactive **force-directed node graph** (`react-force-graph-2d`, client-only) of contributors↔goals with drag/zoom/hover; the showcase as native cards of the highest-difficulty proved goals; and the queue surfacing the per-goal `queued[]` work (goal, model, state, date) plus `distinct_goals`, not just totals,

**and neglected** keeping the iframes (off-theme, opaque, externally-coupled) and a 3D/WebGL graph (heavier, no benefit at this scale ~600 nodes),

**to achieve** on-theme, self-contained pages that read the same fresh snapshot as the rest of the site,

**accepting that** `react-force-graph-2d` is a client-only canvas dependency (dynamically imported, `ssr: false`) and that the showcase's "highlight" heuristic is difficulty-ranked (no curated showcase artifact exists upstream).

---

## Decision

- `src/lib/unsorry/graph.ts` `buildProofGraph(goalEffort, goalSolverMap)` and `src/lib/unsorry/showcase.ts` `buildShowcase(...)` — pure, tested, fed by the snapshot facade.
- `src/components/graph/proof-graph-canvas.tsx` — `react-force-graph-2d` via `next/dynamic` (`ssr: false`); brand-orange contributors, grey goals, hover labels.
- `proof-graph` + `showcase` pages drop their iframes; `queue` page + `QueueBoard` surface `queued[]` items + `distinct_goals` (types extended with `QueueItem`).

See [SPEC-025-A](../specs/SPEC-025-A-Native-Pages.md), [ADR-021](./ADR-021-Page-Ports.md), [ADR-024](./ADR-024-Recompute-From-Git.md).

## Consequences

- Showcase/proof-graph now match the site chrome and the live snapshot; no upstream-Pages dependency.
- `react-force-graph-2d` is lazy-loaded, so it does not weigh on initial loads of other pages.
