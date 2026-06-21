# ADR-019: Per-Target Attribution Strategy

| Field | Value |
|-------|-------|
| **Decision ID** | ADR-019 |
| **Initiative** | unsorry-guild adaptation |
| **Proposed By** | Development Team |
| **Date** | 2026-06-21 |
| **Status** | Accepted |

---

## WH(Y) Decision Statement

**In the context of** computing a per-prize (per-target) leaderboard that ranks contributors by their difficulty-weighted discharge of a target's subtree,

**facing** the absence of any aggregated goal→solver JSON in unsorry (the `attribution-gaps.json` artifact covers only 308 git-add-author-inferred goals and none of the real flagship subtrees),

**we decided for** building the goal→solver map guild-side by scanning the authoritative verified-proof index `library/index/*.aisp` (explicit `solver≜`), joined with `goal_effort` difficulty/status over the suffix-derived subtree,

**and neglected** (a) using `attribution-gaps.json` (insufficient coverage) and (b) depending on a new unsorry-side artifact now (the unsorry PRs are sequenced separately; the slice must not block on them),

**to achieve** a real per-target leaderboard on existing data with no upstream change,

**accepting that** the scan reads ~300 small files per refresh (cached 10 min), and that this is a temporary mechanism.

---

## Decision

- `buildGoalSolverMap()` lists `library/index/` via the Git Trees API and parses each record's `goal` + `solver`, cached for the revalidate window.
- `computeTargetLeaderboard()` credits each proved subtree goal's difficulty + a proof to its solver; unattributed proved goals count toward progress only.

## Post-slice (Phase 3)

unsorry will publish `docs/metrics/goals-with-solvers.json` (goal → solver → difficulty → status → subtree). When available, `buildGoalSolverMap` swaps its source to that single fetch with no change to `computeTargetLeaderboard` or the UI. Tracked as a held unsorry-side PR.
