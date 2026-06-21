# ADR-023: Chart.js for Interactive Data Visualisations

| Field | Value |
|-------|-------|
| **Decision ID** | ADR-023 |
| **Initiative** | unsorry-guild v2.0.0 (issue #1) |
| **Proposed By** | Development Team |
| **Date** | 2026-06-21 |
| **Status** | Accepted |

---

## WH(Y) Decision Statement

**In the context of** the leaderboard surfaces needing interactive charts — proofs-over-time with data points, gridlines, and a hover tooltip beside the cursor (#4), a horizontal contributor bar chart "like the original" (#3), and a sourcing bar (#5),

**facing** a hand-rolled static SVG (`buildAreaChart`) with no data points, gridlines, or interactivity,

**we decided for** adopting **Chart.js v4 + `react-chartjs-2` v5** (canvas, `index`-mode tooltips, point markers, gridlines, responsive) — the same stack as the reference dynamic graph the owner pointed to — wrapped in two reusable components (`LineChart`, `HorizontalBarChart`) over pure, unit-tested data mappers,

**and neglected** Recharts (heavier React-SVG reconciliation for many points) and continuing to hand-build SVG interactivity (tooltip/hit-testing/gridlines all bespoke),

**to achieve** interactive charts that match the intended feel with minimal bespoke code,

**accepting that** Chart.js renders to `<canvas>` (so charts are mocked in jsdom tests — the chart *data* is unit-tested instead), and that `buildAreaChart` is **retained** for server-side image generation (`next/og` cannot run a canvas — see Phase 5 / ADR-025).

---

## Decision

- Dependencies: `chart.js@4.5.1`, `react-chartjs-2@5.3.1` (latest stable, verified 2026-06-21; React 18 compatible).
- Registration centralised in `src/components/charts/register.ts`; shared styling in `theme.ts` (brand-orange palette).
- Reusable wrappers: `LineChart`, `HorizontalBarChart`. Data mappers in `src/lib/unsorry/chart-data.ts` (pure, tested).
- Applied to: proofs-over-time (line), top-contributors (bar, #3), sourcing (bar, sourced-only, #5). Model distribution keeps its existing detailed bars.
- Tests mock `react-chartjs-2` (test-only external double, allowed by protocol #8).

See [SPEC-023-A](../specs/SPEC-023-A-Charts.md), [ADR-021](./ADR-021-Page-Ports.md).

## Consequences

- Charts are interactive and consistent; `+chart.js` adds ~70 kB to the leaderboard/landing bundles.
- `buildAreaChart` lives on purely for image generation, not on-screen charts.
