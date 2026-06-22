# SPEC-029-A: Proofs-Over-Time Daily Aggregation

Implements [ADR-029](../adrs/ADR-029-Proofs-Over-Time-Daily-Aggregation.md).

## Change

`src/lib/unsorry/chart-data.ts` — `proofsOverTimeCombo(series: TimelinePoint[]): ComboSeries` now aggregates the series to one entry per calendar day instead of mapping each point straight to a date label.

Algorithm:
1. Group points by `day = p.t.slice(0, 10)`.
2. `proofs[day]` = sum of the day's `p.proofs` (the day's per-period total).
3. `cumulative[day]` = max of the day's `p.cumulative_proofs` (end-of-day value; cumulative is monotonic non-decreasing).
4. `labels` = the day keys sorted ascending (ISO dates sort chronologically), with `proofs`/`cumulative` aligned to that order.

Pure function; no I/O. The empty series returns `{ labels: [], proofs: [], cumulative: [] }`.

## Why both bases are correct through it

- **merge** basis: hourly upstream (`…THH:00:00Z`) → collapses each day's ≤24 points into one bar = the day's total. Fixes the misread.
- **solve** basis: already daily (`YYYY-MM-DD`) → exactly one point per date, so grouping is the identity.

## Unaffected

- `ProofsOverTime` header `total` (last raw `cumulative_proofs`) and `span` (first/last raw `t`) still read the raw series — unchanged.
- `ProofsComboChart` and the merge/solve toggle — unchanged.

## Tests (`src/tests/lib/unsorry/chart-data.test.ts`)

- Existing "maps per-period proofs and cumulative with date labels" (already-daily input) still passes — aggregation is a no-op for it.
- Existing empty-series case still passes.
- **New** "aggregates an hourly (merge-basis) series into one bar per calendar day": a 5-point series spanning 2026-06-21→22 collapses to `labels: ['2026-06-21','2026-06-22']`, `proofs: [66, 48]` (day sums), `cumulative: [2531, 2593]` (end-of-day) — proving the latest day shows its full total, not the trailing partial hour.

## Out of scope

The upstream hourly bucketing of `timelines.merge` and the `leaderboard-ui.json` refresh cadence (the latter fixed by `agenticsnz/unsorry` ADR-082) are unchanged.
