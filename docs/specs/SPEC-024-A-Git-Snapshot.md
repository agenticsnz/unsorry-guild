# SPEC-024-A: Git-Snapshot Data Layer

Implements [ADR-024](../adrs/ADR-024-Recompute-From-Git.md). Issue #1 items #10, #17.

## Record schemas (real, captured in `src/tests/mocks/aisp/`)
- **library/index/*.aisp** — verified proof. `⟦Ω:Lemma⟧{goal,name}`, `⟦Π:Provenance⟧{solver,provider,model}`, header `@YYYY-MM-DD`.
- **goals/*.aisp** — `⟦Ω:Goal⟧{id,status,difficulty}` (status ∈ open|blocked|proved|archived|translated).
- **proof-runs/*.aisp** — `⟦Ω:Run⟧{goal,outcome}` (success = `outcome=proved`), `⟦Π:Provenance⟧{solver,provider,model}`, `⟦Λ:Metrics⟧{ended}`.

## Modules
- `snapshot-parse.ts` — `parseProof`/`parseGoal`/`parseRun` → `UnsorrySnapshot { proofs, goals, runs }`. Pure; reuse `parseAispFields`.
- `snapshot.ts` — `loadSnapshot()`: `GET api.github.com/repos/agenticsnz/unsorry/tarball/main` with `Authorization: Bearer $GITHUB_TOKEN`; stream `createGunzip()` → `tar-stream`; keep only top-level `library/index/`, `goals/`, `proof-runs/` `.aisp`. Module-memo `TTL_MS=90_000`. Returns null on no-token/failure/empty.
- `derive.ts` — `deriveGlobalLeaderboard` (group proofs by solver, difficulty from goals, `targetScore`, `assignRanks`), `deriveGoalEffort`, `deriveGoalSolverMap`, `deriveModels` (verified per provider/model + run rates from runs), `deriveTimelines` (cumulative by day: merge=index date, solve=successful-run date), `deriveSummary`.
- `standings.ts` — facade: `getGlobalLeaderboard` / `getGoalEffort` / `getGoalSolverMap` / `getLeaderboardExtras`. Snapshot-first, baked-fallback (`leaderboard-mapper`, `fetchGoalEffort`, `buildGoalSolverMap`, `fetchLeaderboardUi`).

## Page wiring
- `leaderboard`, `goals`, `goals/[targetId]`, contributor profile, and landing read the facade. `revalidate = 60`. Goal detail: `generateStaticParams` (known goals) + `loading.tsx`.
- Sourcing stays on `fetchSourcing` (baked).

## Dependency
- `tar-stream@3.2.0` (+ `@types/tar-stream`). nanotar rejected — corrupts GNU/PAX long names.

## Tests
- `snapshot-parse.test.ts` — parsers vs real captured records.
- `derive.test.ts` — every derivation (score, ranks, models, timelines, summary, effort) on a fixture snapshot.
- Live pipeline validated manually against the real repo with a transient token (592 proofs / 7 contributors at time of writing).
