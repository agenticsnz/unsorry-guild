# SPEC-018-A: Prize / Flagship-Target Model

Implements [ADR-018](../adrs/ADR-018-Prize-Flagship-Target-Model.md).

## Overlay schema (`supabase/migrations/`)
- `200_create_domains` — `domains(id, name, url_slug, sort_order)`; seed `math`.
- `201_create_prizes` — `prizes(id, domain_id→domains, headline_goal_id UNIQUE, title, description, badge_emoji, status active|closed, created_by→users, …)`.
- `202_create_prize_seasons` — `prize_seasons(id, prize_id→prizes, opened_at, closed_at, headline_status_at_close)`.
- `203_create_prize_awards` — `prize_awards(id, season_id→prize_seasons, github, place 1..3 NULL, is_contributor, confirmed_by→users, confirmed_at, UNIQUE(season_id, github))`.
- `204_seed_prize_sq_add_sq` — seed the `sq-add-sq-eq-three-mul-sq` prize.
- RLS on all four: `SELECT USING (true)`; write `USING (is_gm()) WITH CHECK (is_gm())`.

## Config fallback (`src/lib/prizes/config.ts`)
- `FALLBACK_PRIZES` (mirrors the seed), `listFallbackPrizes(domainId)`, `getFallbackPrize(headlineGoalId)`, `isSupabaseConfigured()`.
- Used when Supabase is not provisioned, so prize pages render from git + config alone.

## Computation (data layer, ADR-015/019)
- Progress: `computeTargetProgress(headlineGoalId, goalEffort)` — proved/total over the subtree; `isClosed` when headline proved.
- Per-target leaderboard: `computeTargetLeaderboard(headlineGoalId, goalEffort, goalSolverMap)` — `difficulty_points*100 + credited_proofs*25`.

## Lifecycle
- Admin (gm/admin) creates a prize + opens a season; on headline-proved the admin confirms the podium (top-3 by target score) + contributor badges (≥1 proved subtree goal), writing frozen `prize_awards`.

## Tests
- `src/tests/lib/prizes/config.test.ts` — fallback listing/lookup + join-key invariant.
- Progress/leaderboard computation covered by `src/tests/lib/unsorry/*` (SPEC-015-A).
