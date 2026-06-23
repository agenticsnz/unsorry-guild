# ADR-031: Prefer Raw-Git Over Pages for Artifact Freshness

| Field | Value |
|-------|-------|
| **Decision ID** | ADR-031 |
| **Initiative** | unsorry-guild |
| **Proposed By** | Development Team |
| **Date** | 2026-06-23 |
| **Status** | Accepted |

---

## WH(Y) Decision Statement

**In the context of** the guild reading unsorry's git-published JSON artifacts (leaderboard-ui, sourcing, community-stats, queue, model-registry) to render the board,

**facing** GitHub **Pages** (`unsorry.agentics.org.nz`) falling **hours** behind `main` during proof-merge floods — each merge commit triggers a Pages rebuild and the build queue backs up — while the same artifacts on `main` stay current (observed 2026-06-23: Pages `generated_at` 2026-06-22T23:39Z / 2881 proofs vs raw-git 2026-06-23T04:03Z / 3016),

**we decided for** reading the **raw-git** URL (`raw.githubusercontent.com/agenticsnz/unsorry/main/...`) **first** — it tracks `main` within minutes — and keeping the Pages URL as the **fallback**, with the guild cache cut to **60 s**,

**and neglected** keeping Pages-primary (ADR-015's original choice — stale under load; the guild saw a 200 and never fell through), and reading the artifacts out of the authenticated tarball **snapshot** (always `main` HEAD, zero CDN lag — more work; a future option),

**to achieve** a board that reflects new proofs within ~1 minute even during high merge volume,

**accepting that** raw.githubusercontent has its own short (~minutes) CDN cache and per-IP rate limits — mitigated by the 60 s `revalidate` and the Pages fallback. This supersedes the Pages-primary aspect of [ADR-015](./ADR-015-Unsorry-Data-Source.md).

---

## Decision

- `fetchJson(primary, fallback)` calls now pass **raw URL first, Pages second** for every artifact (`fetchers.ts`).
- `REVALIDATE_SECONDS` 600 → **60** (`constants.ts`); the board updates within ~1 min of a merge.
- `fetchers.test.ts` asserts raw-first ordering and the 60 s revalidate.

## Consequences

- Leaderboard, sourcing, summary, proofs-over-time, queue, and model registry stay current during merge floods.
- If raw-git is unavailable, the guild still renders from the (possibly stale) Pages copy, then the empty-state fallback.
- A future enhancement could source these from the existing authenticated snapshot tarball for zero CDN lag.
