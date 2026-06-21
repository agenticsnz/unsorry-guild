# ADR-026: Generated Social & README Images

| Field | Value |
|-------|-------|
| **Decision ID** | ADR-026 |
| **Initiative** | unsorry-guild v2.0.0 (issue #1) |
| **Proposed By** | Development Team |
| **Date** | 2026-06-21 |
| **Status** | Accepted |

---

## WH(Y) Decision Statement

**In the context of** social previews that showed a static `og-image.jpg` and an upstream unsorry README that embeds committed `leaderboard.svg` / `proofs-over-time.svg` images,

**facing** issue #1's ask that the social preview be the proofs-over-time graph (#13) and that the unsorry README images reflect the new site (#14),

**we decided for** generating the images on demand with `next/og` (Satori): file-based `opengraph-image`/`twitter-image` render the live proofs-over-time graph for every page's social card, and stable `/api/og/proofs-over-time` + `/api/og/leaderboard` PNG endpoints back the unsorry README — with the chart bodies drawn as **SVG** (reusing `buildAreaChart`) and embedded as data-URI `<img>` because Satori has no `<canvas>`,

**and neglected** a static hand-made OG image (goes stale, doesn't reflect the data) and committing regenerated SVGs into the unsorry repo on a schedule (re-introduces the cron-staleness this release set out to remove),

**to achieve** previews and README images that always reflect the live standings, owned and refreshed guild-side,

**accepting that** the image routes run on the Node runtime (they reach the snapshot facade) and that the unsorry README change is a cross-repo PR that should merge once the guild 2.0.0 is deployed (so the endpoint URLs resolve).

---

## Decision

- `src/lib/og/chart-svg.ts` — pure SVG builders (`proofsOverTimeSvg`, `leaderboardBarSvg`), tested.
- `src/lib/og/og-images.tsx` — shared `next/og` composition (`proofsOverTimeImage`, `leaderboardImage`) over the snapshot facade.
- `src/app/opengraph-image.tsx` + `twitter-image.tsx` — site social preview = proofs-over-time (#13). Static `images` removed from `layout.tsx` metadata so the generated ones win.
- `src/app/api/og/proofs-over-time` + `/api/og/leaderboard` — stable PNG endpoints for the unsorry README (#14).
- Cross-repo: a PR on `agenticsnz/unsorry` repoints README image `src`s to those endpoints.

See [SPEC-026-A](../specs/SPEC-026-A-Generated-Images.md), [ADR-023](./ADR-023-Charting-Library.md), [ADR-024](./ADR-024-Recompute-From-Git.md).

## Consequences

- Social/README images reflect live data; no static asset to maintain.
- Image routes are Node-runtime and revalidate every 5 min.
