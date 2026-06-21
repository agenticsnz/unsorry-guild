# SPEC-015-A: unsorry Data Source & Caching

Implements [ADR-015](../adrs/ADR-015-Unsorry-Data-Source.md). Module: `src/lib/unsorry/`.

## URLs (`constants.ts`)
- `UNSORRY_BASE_URL` = `NEXT_PUBLIC_UNSORRY_BASE_URL` ?? `https://unsorry.agentics.org.nz/docs`
- raw fallback `https://raw.githubusercontent.com/agenticsnz/unsorry/main/docs`
- `rawRepoUrl(path)`, `treesApiUrl()` for `library/index` scanning
- `REVALIDATE_SECONDS = 600`

## Fetchers (`fetchers.ts`)
- `fetchJson<T>(primary, fallback)` — tries canonical then raw; `{ next: { revalidate: 600 } }`; throws `UnsorryFetchError` if both fail.
- `fetchGlobalLeaderboard()` → `LeaderboardUi.contributors[]`
- `fetchCommunityStats()` / `fetchGoalEffort()` → `goal_effort[]`
- `fetchQueue()`

## Pure transforms (no I/O — unit-tested)
- `aisp.ts` — `parseAispFields`, `parseLibraryIndexRecord` (key≜value scan).
- `subtree.ts` — `isInTarget` (suffix convention), `subtreeGoals`, `computeTargetProgress`.
- `leaderboard-mapper.ts` — `toGuildLeaderboard` (keyed on github, sorted by rank).
- `target-leaderboard.ts` — `computeTargetLeaderboard` + `targetScore` (`difficulty*100 + proofs*25`).

## Attribution (`attribution.ts`)
- `listLibraryIndexPaths()` (Git Trees API) + `buildGoalSolverMap()` (batched concurrent raw fetch, parse `goal`+`solver`). Cached for the revalidate window. See ADR-019.

## Tests (`src/tests/lib/unsorry/`)
`aisp` (4), `subtree` (5), `leaderboard-mapper` (2), `target-leaderboard` (4), `fetchers` (4, mocked fetch), `attribution` (1, mocked tree+blobs). Fixtures in `src/tests/mocks/unsorry-fixtures.ts` are real captured samples (ohdearquant leaderboard row; `sq-add-sq-eq-three-mul-sq` subtree; cgbarlow/Rauxon library-index records).
