# ADR-033: Showcase the Hardest Proofs, with a Proof-Detail Page

| Field | Value |
|-------|-------|
| **Decision ID** | ADR-033 |
| **Initiative** | unsorry-guild |
| **Proposed By** | Development Team |
| **Date** | 2026-06-25 |
| **Status** | Accepted |

---

## WH(Y) Decision Statement

**In the context of** the Math **Showcase** page (`/math/showcase`), billed as "the hardest proofs the swarm has discharged, by difficulty", which `buildShowcase` ranks by difficulty descending and takes the top 24,

**facing** a board that visibly fills with **difficulty-1** cards: it sourced difficulty from `getGoalEffort()` → `community-stats.json` `goal_effort`, which upstream is built **only from goals that carry proof-run telemetry** (`goal_runs`) — a recent, telemetry-biased slice that is almost entirely difficulty-1 template proofs. The 500+ genuinely-hard proved proofs (difficulty ≥2), which are mostly older/archived and have no run telemetry, were **invisible** to the showcase, so after a handful of hard results the top-24 padded with difficulty-1 trivia; and cards linked nowhere useful (only the solver name went to a contributor page) — there was no per-proof view of the target or its stats,

**we decided for** (a) ranking the showcase over the **whole proved corpus** by sourcing per-goal difficulty from the git **snapshot's goal records** (every goal, via a new `goals` parse pass and `getGoalMetaMap`) and the credited solver from **active + archived** proof index records (a new `archivedProofs` parse pass + `getShowcaseSolverMap`), with an explicit **minimum-difficulty floor** (default 4 — an elite board); and (b) adding a **proof-detail route** `/math/proofs/[goal]` showing the original target (goal id + GitHub link to the goal record), credited solver, difficulty/status, and run telemetry when present — with the showcase cards now linking to it,

**and neglected** keeping `goal_effort` as the difficulty source (status quo — the board stays dominated by difficulty-1 and the hardest proofs never appear); expanding the active-only `deriveGoalSolverMap` to include archived proofs globally (rejected — it would change the proof graph / podiums / target boards, a broader behaviour change out of scope, so archived proofs are kept in a separate snapshot field consumed only by the showcase); and a lower floor such as ≥2 or ≥3 (rejected for now — the maintainer chose an elite ≥4 board; the floor is a single tunable constant),

**to achieve** a showcase that actually shows the hardest proved theorems rather than padding with trivia, and a clickable card that opens a real per-proof page,

**accepting that** the elite ≥4 floor yields a deliberately **small** board (~39 proofs corpus-wide today) that grows slowly; that per-proof **provider/model and lemma dependencies** are not surfaced yet (not cleanly available guild-side — deferred); and that the Lean **statement** renders only for benchmark goals that publish `goals/<id>.lean` (regular goals show an "unavailable" note and link to their goal record) — the snapshot now also carries a third record type (goals), so a tarball parse does marginally more work, which is negligible against the one-request-per-TTL model.

---

## Decision

- **Snapshot (`snapshot.ts` / `snapshot-parse.ts`):** one tarball pass now parses three record types — active `library/index/*.aisp` → `proofs`, archived `packages/unsorry-archive-<n>/library/index/*.aisp` → `archivedProofs`, and `goals/*.aisp` → `goals` (`{goal, difficulty, status}` via new `parseGoal`).
- **Derivations (`derive.ts`):** `deriveGoalSolverMap` stays **active-only** (proof graph / boards unchanged). New `deriveShowcaseSolverMap` (active + archived, active wins) and `deriveGoalMetaMap` (goal → `{difficulty, status}`).
- **Facade (`standings.ts`):** `getShowcaseSolverMap()` and `getGoalMetaMap()` (snapshot-preferred, `goal_effort` fallback when the snapshot is unavailable). All total (safe empty on error).
- **Showcase (`showcase.ts`):** `buildShowcase(goalSolver, goalMeta, {minDifficulty = 4, topN = 24})` ranks the whole corpus and applies the floor. New `buildProofDetail(goal, goalSolver, goalMeta, goalEffort)` assembles the detail view (`null` → 404).
- **Routes:** `/math/showcase` cards link to the new `/math/proofs/[goal]` (+ `loading.tsx`). New `repoBlobUrl` constant for the goal-record GitHub link.

## Consequences

- The showcase reflects genuine difficulty across the full proved corpus; difficulty-1 padding is gone.
- Pure functions (`parseGoal`, `deriveShowcaseSolverMap`, `deriveGoalMetaMap`, `buildShowcase`, `buildProofDetail`) are unit-tested; existing active-only consumers are untouched.
- The difficulty floor is one constant (`DEFAULT_MIN_DIFFICULTY`); provider/model + dependency enrichment and broader archived-proof coverage are documented follow-ups.
