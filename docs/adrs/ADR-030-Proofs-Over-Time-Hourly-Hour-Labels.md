# ADR-030: Keep Proofs-Over-Time Hourly, Label by Hour (supersedes ADR-029)

| Field | Value |
|-------|-------|
| **Decision ID** | ADR-030 |
| **Initiative** | unsorry-guild — leaderboard chart correctness |
| **Proposed By** | Development Team |
| **Date** | 2026-06-22 |
| **Status** | Accepted (supersedes ADR-029) |

---

## WH(Y) Decision Statement

**In the context of** the **Proofs over time** chart's `merge` basis, whose upstream series is bucketed **hourly**, and the original symptom that the latest bar read as the whole day (`2026-06-22` showing ~5 when ~62 had merged),

**facing** [ADR-029](./ADR-029-Proofs-Over-Time-Daily-Aggregation.md), which fixed that by **aggregating to one bar per calendar day** — but in doing so removed the **intra-day (hourly) cadence** that is the point of the chart for an audience watching a fast-moving swarm, which the maintainer flagged immediately on seeing it live,

**we decided for** **keeping one bar per hourly bucket** and instead fixing only what was actually broken — the **label**: a point with a time component (`2026-06-22T03:00:00Z`) is labelled `2026-06-22 03:00`, so the latest still-filling hour reads unambiguously as an hour, not the day; date-only `solve` points (`2026-06-20`) stay bare dates,

**and neglected** daily aggregation (ADR-029 — loses the cadence) and a separate hour/day granularity toggle (more surface + a control to maintain; the hour-labelled hourly view already removes the misread, and the header's `{total} cumulative` carries the at-a-glance total),

**to achieve** the recent-slope/cadence view the maintainer wants, with no bar mislabelled as a day,

**accepting that** the merge x-axis has many points (~one per hour); this is fine because the combo chart's x-axis is a **category axis with `maxTicksLimit: 8`**, which thins displayed ticks while the per-point tooltip stays exact.

---

## Decision

- `src/lib/unsorry/chart-data.ts`: `proofsOverTimeCombo` maps each point through `pointLabel(t)` (date + `HH:MM` when `t` has a time component, else the bare date) and passes `proofs`/`cumulative` straight through — no aggregation. Pure.
- No change to `ProofsOverTime` header (`total`/`span`) or `ProofsComboChart`.

See [SPEC-030-A](../specs/SPEC-030-A-Proofs-Over-Time-Hourly-Hour-Labels.md), [ADR-029](./ADR-029-Proofs-Over-Time-Daily-Aggregation.md) (superseded), [ADR-023](./ADR-023-Charting-Library.md).

## Consequences

- **Supersedes ADR-029.** The merge view is hourly again; each bar/tooltip is an hour, the current hour is labelled as such, and the cumulative line + header give the day/running totals.
- Intra-day cadence is preserved; the original "looks like 5 today" misread is resolved by labelling, not by collapsing data.
