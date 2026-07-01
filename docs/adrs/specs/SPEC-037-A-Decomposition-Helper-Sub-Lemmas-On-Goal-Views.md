# SPEC-037-A: Decomposition Helper Sub-Lemmas on Goal Views

Implements: [ADR-037](../ADR-037-Decomposition-Helper-Sub-Lemmas-On-Goal-Views.md) · Status: Proposed · Updated: 2026-07-01

> **Design-only.** Describes the behaviour + acceptance criteria to build under TDD; no code ships
> with the ADR PR.

## Behaviour

When a goal participates in a swarm decomposition, both goal-detail views gain a **"Decomposition —
helper lemmas"** section:

- On the **single-goal view** (`/math/goals/[targetId]`) and the **benchmark goal view**
  (`/math/suites/[id]/[goal]`), if the goal is a **decomposition parent**, show:
  - the list of its **helper sub-lemmas** (direct subs), each with its id, status
    (proved / open / blocked), and — when proved — its solver/model attribution and link to that
    sub-goal's own detail page;
  - the parent's **composed proof** (the parent's own verified proof + attribution), labelled as the
    assembled result the helpers feed into.
- The section is **hidden** for a goal with no decomposition (the common case) — no empty box.
- Nested decompositions (a sub that is itself decomposed) link through to that sub's page, where its
  own helper section renders; the parent view shows direct children only (one level).

## Data pipeline (`src/lib/unsorry/`)

### `snapshot.ts` — ingest the records
The tarball walk currently keeps only `library/index/*.aisp` (proofs) and `goals/*.aisp` (goals).
Add `decompositions/*.aisp` to the kept set (same streaming parse; small, one file per decomposed
parent). No other fetch path changes; still read-only (ADR-015).

### `snapshot-parse.ts` — parse parent→subs
Add a parser for a decomposition record:
- `⟦Ω:Decomp⟧{parent≜<id>; …}` → the parent id.
- `⟦Σ:Subs⟧{sub₁≜⟨id≜<id>,…⟩ sub₂≜⟨id≜<id>,…⟩ …}` → the ordered sub ids (reuse the `⟨id≜…⟩`
  extraction; do NOT depend on the `-sN` suffix).
- Expose `decompositions: Decomposition[]` on the parsed snapshot and a derived
  `Map<parentId, subId[]>` for O(1) lookup.

### `types.ts`
```ts
export interface Decomposition {
  parent: string        // parent goal id
  subs: string[]        // ordered helper sub-lemma goal ids (authoritative, from the record)
  agent?: string        // decomposing agent, if present on the record
}
```
The view join reuses the existing goal/proof types (`SnapshotGoal`, the proof/index record) to
resolve each sub's status + attribution — no change to those types.

### Status/attribution join
For each sub id, look up its status from the ingested goal set and its proof/attribution from the
ingested proof index — the same lookups the goal views already use. This works regardless of whether
the sub's proof lives in the repo library (today) or the suite pin (after unsorry ADR-116), because
the guild keys on goal id, not on library path.

## UI (`src/components/…`)

A new presentational component, e.g. `GoalDecomposition`, following the existing `ObjectivesList`
pattern (vertical list, status icon/badge per row, link + metadata). Props: the parent goal id, its
resolved subs (id + status + attribution + href), and the parent's composed-proof summary. Rendered:
- single-goal view: after progress/podium, before the leaderboard;
- benchmark goal view: as a collapsible subsection near the statement/runs.
No new colour system or badges — reuse the status badges already used for goal status.

## Test Plan (TDD, vitest — write first)

1. **Parser** (`src/lib/unsorry/*.test.ts`): a `decompositions/<parent>.<agent>.aisp` fixture parses
   to `{ parent, subs: [...], agent }`; the `⟦Σ:Subs⟧` ids are extracted in order and independent of
   the `-sN` suffix (include a curated-name sub in the fixture); a goals-only snapshot yields an empty
   decomposition map.
2. **Lookup**: `decompositionFor(parentId)` returns the subs for a parent and `undefined` for a
   non-parent.
3. **Component** (`src/tests/components/…`): renders the helper list + composed-proof row when a
   decomposition is present; renders nothing when absent; a proved sub shows attribution + link, an
   open sub shows the open state.

## Acceptance Criteria

- [ ] `decompositions/*.aisp` is ingested read-only into the snapshot (ADR-015/ADR-024 preserved).
- [ ] Parser extracts `parent` + ordered `subs` from the authoritative record (no suffix dependency).
- [ ] Both goal views render the decomposition section iff the goal is a decomposition parent, showing
      helper sub-lemmas (id, status, attribution, link) and the parent's composed proof.
- [ ] The section is absent for non-decomposed goals.
- [ ] Sub status/attribution resolves correctly whether the sub's proof is in the repo library or the
      suite pin (goal-id keyed).
- [ ] New tests written first and passing; overall coverage does not decrease.
