# ADR-021: Porting unsorry's Public Pages

| Field | Value |
|-------|-------|
| **Decision ID** | ADR-021 |
| **Initiative** | unsorry-guild adaptation |
| **Proposed By** | Development Team |
| **Date** | 2026-06-21 |
| **Status** | Accepted |

---

## WH(Y) Decision Statement

**In the context of** unsorry-guild rehoming unsorry's public pages (leaderboard, showcase, proof graph, queue) under `/math`,

**facing** a mix of machine-readable artifacts (queue.json, leaderboard-ui.json) and hand-authored / generated HTML+SVG (showcase, proof graph),

**we decided for** reimplementing the data-backed pages (leaderboard, queue) as Next pages over the JSON, and integrating the generated artifacts (proof-graph SVG, showcase HTML) by embedding them within the guild chrome,

**and neglected** copying the generated HTML/SVG into this repo (would duplicate + drift from unsorry's generators),

**to achieve** native-feeling pages that always reflect unsorry's latest output,

**accepting that** the embedded showcase/proof-graph depend on unsorry's Pages staying reachable, and that a later phase may re-render them fully natively.

---

## Decision

- `/math/leaderboard` (global) and `/math/queue` (from `queue.json`) are native Next Server Components over the data layer.
- `/math/proof-graph` embeds `proof-graph.svg` (+ link to the full interactive view); `/math/showcase` embeds `showcase.html` (+ open-in-new-tab link).
- All linked from the public header + landing.

## Consequences

- The four unsorry pages now live under `/math` with the guild's dark theme + nav.
- `[domain]` dynamic-segment migration + a fully-native showcase/proof-graph remain a later refinement.
