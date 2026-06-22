# SPEC-030-A: Proofs-Over-Time Hourly Bars with Hour Labels

Implements [ADR-030](../adrs/ADR-030-Proofs-Over-Time-Hourly-Hour-Labels.md). Supersedes [SPEC-029-A](SPEC-029-A-Proofs-Over-Time-Daily-Aggregation.md).

## Change

`src/lib/unsorry/chart-data.ts` — `proofsOverTimeCombo` no longer aggregates by day. It maps each timeline point one-to-one, labelling via a new `pointLabel(t)`:

- `t` contains `T` (hourly merge bucket, e.g. `2026-06-22T03:00:00Z`) → `"2026-06-22 03:00"` (date + `HH:MM` from `t.split('T')[1].slice(0,5)`).
- `t` is date-only (solve bucket, e.g. `2026-06-20`) → `"2026-06-20"` (`t.slice(0,10)`).

`proofs` and `cumulative` pass straight through from each point. Pure; empty series → `{ labels: [], proofs: [], cumulative: [] }`.

## Why this resolves the original misread without ADR-029's cost

The original bug (a partial current-hour bar read as the whole day) was a **labelling** problem, not a data-granularity problem. Labelling the hour makes the latest bar read as an hour; the header `{total} cumulative` (unchanged, from the raw series) gives the running total. So hourly cadence is kept (the maintainer's ask) and nothing is mislabelled.

## Rendering note

`ProofsComboChart` uses a **category** x-axis with `ticks.maxTicksLimit: 8`, so the dense hourly label set is thinned on the axis automatically while tooltips remain per-hour. No chart-component change.

## Unaffected

- `ProofsOverTime` header `total`/`span` (raw series) and the merge/solve toggle — unchanged.

## Tests (`src/tests/lib/unsorry/chart-data.test.ts`)

- "keeps hourly (merge-basis) points and labels each with date + hour" — `…T00:00:00Z/…T03:00:00Z/…T04:00:00Z` → labels `2026-06-22 00:00 / 03:00 / 04:00`, proofs/cumulative passed through (the trailing `04:00 · 1` is clearly the current hour).
- "labels date-only (solve-basis) points with just the date" — `2026-06-19 / 2026-06-20` → bare-date labels.
- empty series → empty arrays.

## Out of scope

Upstream hourly bucketing of `timelines.merge` and the leaderboard-ui.json refresh cadence (unsorry ADR-082) are unchanged.
