# ADR-029: Aggregate the Proofs-Over-Time Chart to Daily Bars

| Field | Value |
|-------|-------|
| **Decision ID** | ADR-029 |
| **Initiative** | unsorry-guild — leaderboard chart correctness |
| **Proposed By** | Development Team |
| **Date** | 2026-06-22 |
| **Status** | Accepted |

---

## WH(Y) Decision Statement

**In the context of** the **Proofs over time** chart (`ProofsOverTime` → `proofsOverTimeCombo`), whose `merge` basis reads `leaderboard-ui.json.timelines.merge` — a series **bucketed hourly** upstream (e.g. `2026-06-22T03:00:00Z`), while the `solve` basis is daily,

**facing** `proofsOverTimeCombo` mapping each point to a **date-only** label (`p.t.slice(0, 10)`) with no aggregation, so a single day surfaced as up to **24 separate bars all labelled the same date**, and the most recent bar is the **current, still-filling hour** — which made the chart read as "only ~5 proofs on 2026-06-22" when ~62 had actually merged that day (the day's hourly bars summed to ~62; the cumulative line corroborated it, but the per-period bar a viewer reads showed one hour),

**we decided for** collapsing the series to **one bar per calendar day** inside `proofsOverTimeCombo`: group points by `t.slice(0, 10)`, set each day's per-period value to the **sum** of its points' `proofs` and its cumulative to the day's **end (max) `cumulative_proofs`** (cumulative is monotonic), emitting labels in chronological (sorted ISO-date) order,

**and neglected** keeping hourly points but putting the **hour in the label** for the merge basis (a denser, busier axis that still shows a tiny trailing partial-hour bar — it relabels the confusion rather than removing it), and pushing daily aggregation **upstream** into `tools.leaderboard` (changes the published artifact and the HTML surface that also consumes it; the guild should present its own chart granularity),

**to achieve** a merge view where each "2026-06-22" bar is the **whole day's** proof count, so the recent slope reflects the real merge cadence and the latest day is not understated by a partial hour,

**accepting that** intra-day detail is no longer plotted on the merge basis (acceptable — the chart's purpose is the day-over-day trend; the current day's bar grows through the day as expected), and that the `solve` basis, already daily, is unaffected (the aggregation is a no-op when there is one point per date).

---

## Decision

- `src/lib/unsorry/chart-data.ts` `proofsOverTimeCombo(series)` aggregates by `t.slice(0, 10)`: summed `proofs`, max `cumulative_proofs`, chronologically-sorted day labels. Pure; both bases flow through it unchanged structurally.
- No change to `ProofsOverTime`'s header `total`/`span` (still read from the raw series) or to `ProofsComboChart`.

See [SPEC-029-A](../specs/SPEC-029-A-Proofs-Over-Time-Daily-Aggregation.md), [ADR-023](./ADR-023-Charting-Library.md), [ADR-024](./ADR-024-Recompute-From-Git.md). Upstream context: `agenticsnz/unsorry` ADR-082 fixed the *refresh latency* of `leaderboard-ui.json`; this fixes the guild-side *display* of its hourly merge series.

## Consequences

- The merge view's per-day bars now equal the day's real proof count; the recent days no longer look near-empty.
- Hourly granularity is intentionally dropped on the merge basis; the daily trend and the cumulative line carry the signal.
