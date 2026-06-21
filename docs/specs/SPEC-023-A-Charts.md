# SPEC-023-A: Interactive Charts (Chart.js)

Implements [ADR-023](../adrs/ADR-023-Charting-Library.md). Issue #1 items #3, #4, #5.

## Building blocks (`src/components/charts/`)
- `register.ts` — registers the Chart.js scales/elements/controllers/plugins once (idempotent).
- `theme.ts` — shared palette: `BRAND`/`BRAND_FILL` (claude orange), grid/tick colours, `TOOLTIP` style. DRY for every chart.
- `line-chart.tsx` — `<LineChart labels values label height? />`: filled smooth line, point markers (`pointHoverRadius` 5), `interaction.mode: 'index'` + matching tooltip (tip beside cursor), y-axis gridlines, x gridlines hidden. Responsive, fixed-height container.
- `horizontal-bar-chart.tsx` — `<HorizontalBarChart labels values label height? />`: `indexAxis: 'y'`, height scales with bar count.

## Data mappers (`src/lib/unsorry/chart-data.ts`, pure + tested)
- `proofsOverTimeSeries(series)` → date labels + cumulative values (#4).
- `leaderboardBarSeries(entries, topN=15)` → top contributors by score (#3).
- `sourcingBarSeries(entries, topN=15)` → top sourcers, **value = `sourced_goals` only** (#5).
- `modelBarSeries(models, topN=15)` → verified proofs per provider/model (optional).

## Wiring
- `leaderboard-tabs.tsx`: Leaderboard tab gains a "Top contributors" `LeaderboardBar` above the table; Sourcing tab gains a `SourcingBar` (sourced-only) above the table, mirroring the leaderboard layout.
- `proofs-over-time.tsx`: re-implemented over `LineChart`, keeping the merge/solve toggle and the cumulative-total caption.
- Landing page (`/`): renders `ProofsOverTime` when timelines are available.

## Tests
- `src/tests/lib/unsorry/chart-data.test.ts` — every mapper (incl. empty input, sort, sourced-only, zero-proof model exclusion).
- `react-chartjs-2` is mocked in `src/tests/setup.ts` (jsdom has no canvas); component tests assert the surrounding chrome (toggle, captions, headings).
