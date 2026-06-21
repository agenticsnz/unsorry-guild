# SPEC-018-B: Standard-Competition Tie Handling

Implements a refinement of the ranking in [ADR-018](../adrs/ADR-018-Prize-Flagship-Target-Model.md) and applies across all standings sourced per [ADR-015](../adrs/ADR-015-Unsorry-Data-Source.md). Issue #1 item #11.

## Rule
Equal scores are a **tie**: contributors with the same score share the same rank, and the next rank skips accordingly (standard competition ranking — "1224"). Example: scores `[100, 90, 90, 80]` → ranks `[1, 2, 2, 4]`.

## Shared utility (`src/lib/unsorry/ranking.ts`)
- `assignRanks<T>(items: T[], score: (t: T) => number): (T & { rank: number })[]`
  - Input is assumed pre-sorted descending by score (callers already sort, with a stable tiebreak e.g. github handle for deterministic ordering).
  - First item rank 1; each subsequent item keeps the previous rank iff its score equals the previous item's score, else rank = index + 1.
- Single source of truth — DRY: replaces the inline `(entry, i) => rank: i + 1` logic.

## Call sites (refactor to use `assignRanks`)
- `src/lib/unsorry/target-leaderboard.ts` (`computeTargetLeaderboard`).
- Global leaderboard ranks (`leaderboard-mapper.ts` / derive layer) where ranks are computed guild-side.
- Sourcing standings (`sourcing-table` ordering) and contributor standing where a rank is shown.

## UI
- Tied rows render a shared rank indicator (e.g. `T-2`, or the same medal for tied top-3). Presentational only; ordering within a tie stays deterministic.

## Tests
- `src/tests/lib/unsorry/ranking.test.ts` — `1224` behaviour, all-equal, all-distinct, single, empty.
- Extend `src/tests/lib/unsorry/target-leaderboard.test.ts` to assert tied scores share a rank.
