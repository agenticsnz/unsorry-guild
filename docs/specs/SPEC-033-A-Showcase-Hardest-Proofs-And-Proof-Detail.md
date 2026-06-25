# SPEC-033-A: Showcase Hardest Proofs + Proof-Detail Page

Implements: [ADR-033](../adrs/ADR-033-Showcase-Hardest-Proofs-And-Proof-Detail.md) · Status: Living · Updated: 2026-06-25

## Problem

`/math/showcase` ranked by difficulty but sourced difficulty from `community-stats.json` `goal_effort`, which upstream is built **only from goals with proof-run telemetry**. That slice is ~all difficulty-1 template proofs, so the top-24 showed a few hard proofs then padded with difficulty 1; the 500+ hard proved proofs (mostly archived, no telemetry) were invisible. Cards also linked nowhere per-proof.

## Data layer

### Snapshot — three record types in one tarball pass (`snapshot.ts`, `snapshot-parse.ts`)

```
UnsorrySnapshot {
  proofs:         SnapshotProof[]   // library/index/*.aisp                       (active)
  archivedProofs: SnapshotProof[]   // packages/unsorry-archive-<n>/library/index/*.aisp
  goals:          SnapshotGoal[]    // goals/*.aisp  → { goal, difficulty, status }
}
```

- `parseGoal(text)` reads `⟦Ω:Goal⟧{id, status, difficulty}` → `{goal: id, difficulty: int|0, status|'unknown'}`; `null` when no `id`.
- The entry handler classifies each `.aisp` path: active proof / archived proof (regex `^packages/unsorry-archive-[^/]+/library/index/[^/]+\.aisp$`) / goal (`goals/`).

### Derivations (`derive.ts`)

- `parseProof` requires only `goal`; `solver` is optional (`∅`/absent → undefined), so older inferred-attribution proofs are captured.
- `deriveGoalSolverMap(snap)` — active proofs **with an explicit solver** only (proof graph, podiums, target boards keep their behaviour; solverless skipped exactly as before, when such records returned `null`).
- `deriveShowcaseSolverMap(snap)` — active + archived merged, **including solverless proofs** (`solver: ''`); active wins on the rare shared goal.
- `deriveGoalMetaMap(snap)` — `goal → { difficulty, status }` for every goal.

### Facade (`standings.ts`)

- `getShowcaseSolverMap()` — snapshot (active+archived); GitHub-API scan fallback.
- `getGoalMetaMap()` — snapshot goals; falls back to a map built from `goal_effort` when the snapshot is unavailable (no `GITHUB_TOKEN`).

## Showcase (`showcase.ts`)

```ts
buildShowcase(
  goalSolver: Map<string, GoalSolver>,
  goalMeta:   Map<string, GoalMeta>,
  { minDifficulty = DEFAULT_MIN_DIFFICULTY /* = 4 */, topN = 24 } = {},
): ShowcaseItem[]
```

For each credited proof, look up its goal difficulty; keep only `difficulty >= minDifficulty`; sort by difficulty desc then name; slice to `topN`. A goal in `goalSolver` already has a verified proof, so only difficulty gates it.

```ts
buildProofDetail(goal, goalSolver, goalMeta, goalEffort): ProofDetail | null
```

Returns `{ goal, name, solver, difficulty, status, runs?, successes?, attempts? }`, or `null` when the goal has no credited proof (caller → `notFound()`). Difficulty/status come from `goalMeta`, falling back to `goalEffort`; telemetry counts come from the matching `goalEffort` row when present.

## Routes

- `/math/showcase` — fetches `getShowcaseSolverMap()` + `getGoalMetaMap()`, builds with `minDifficulty = 4`; each card is a `Link` to `/math/proofs/[goal]`.
- `/math/proofs/[goal]` (+ `loading.tsx`) — server component (`force-dynamic`). Builds the detail; `notFound()` on `null`. Sections: header (name + status/difficulty badges + solver link), **Original target** (goal id + `repoBlobUrl('goals/<id>.aisp')` GitHub link), **Effort & telemetry** (difficulty + runs/successes/attempts, or a no-telemetry note), **Statement** (`LeanStatement` — best-effort `getGoalSource`, empty for non-benchmark goals).

## Tests (vitest)

- `snapshot-parse.test.ts` — `parseGoal` (real fixture, defaults, null).
- `derive.test.ts` — active-only solver map excludes archive; showcase map merges with active-wins; meta map.
- `graph-showcase.test.ts` — `buildShowcase` floor + ranking + topN + missing-difficulty exclusion; `buildProofDetail` assembly, null, telemetry-absent.

## Out of scope (follow-ups)

Per-proof provider/model and lemma dependencies; rendering the proof source for non-benchmark goals; making the difficulty floor configurable from the UI.
