# SPEC-026-A: Generated Social & README Images

Implements [ADR-026](../adrs/ADR-026-Generated-Images.md). Issue #1 items #13, #14.

## Pure SVG (`src/lib/og/chart-svg.ts`)
- `proofsOverTimeSvg(series, w, h)` — gridlines + area + line (geometry from `buildAreaChart`); empty-state label.
- `leaderboardBarSvg(data, w, h)` — one rounded bar per datum, value labels, XML-escaped names.

## Composition (`src/lib/og/og-images.tsx`)
- `next/og` `ImageResponse`, 1200×630, dark brand frame ("unsorry **swarm**" + subtitle + footer); chart embedded as a base64 `data:image/svg+xml` `<img>`.
- `proofsOverTimeImage()` (timelines via `getLeaderboardExtras`), `leaderboardImage()` (top-10 via `getGlobalLeaderboard`).

## Routes
- `app/opengraph-image.tsx` + `app/twitter-image.tsx` — proofs-over-time social preview (#13); `runtime='nodejs'`, `revalidate=300`. `layout.tsx` drops its static `images` so these win.
- `app/api/og/proofs-over-time/route.tsx` + `app/api/og/leaderboard/route.tsx` — stable PNG endpoints for the unsorry README (#14).

## Cross-repo (#14)
- PR on `agenticsnz/unsorry`: README lines 28–29 repoint from `docs/leaderboard.svg` / `docs/proofs-over-time.svg` to
  `https://swarm.unsorry.agentics.org.nz/api/og/leaderboard` and `…/api/og/proofs-over-time`. Merge after the guild 2.0.0 deploy so the URLs resolve.

## Tests / verification
- `src/tests/lib/og/chart-svg.test.ts` — both SVG builders (paths, bars, escaping, empty).
- Endpoints verified locally: all three routes return valid `image/png` (PNG magic bytes) with live data.
