# ADR-015: unsorry Data Source & Caching

| Field | Value |
|-------|-------|
| **Decision ID** | ADR-015 |
| **Initiative** | unsorry-guild adaptation |
| **Proposed By** | Development Team |
| **Date** | 2026-06-21 |
| **Status** | Accepted |

---

## WH(Y) Decision Statement

**In the context of** unsorry-guild needing leaderboard, contributor, target-progress and queue data,

**facing** the fact that unsorry already publishes all of this in git (as CORS-enabled JSON artifacts + AISP records) and has no API,

**we decided for** reading those git-published artifacts directly, server-side, with Next fetch caching (`revalidate: 600`), and keeping a slim Supabase overlay only for guild-authored config,

**and neglected** mirroring unsorry data into our own database (drift, sync burden) and client-side fetching (no shared cache, CORS reliance),

**to achieve** a single source of truth (git), no data duplication, and cheap reads behind a 10-minute cache that matches the upstream refresh cadence,

**accepting that** per-goal solver attribution must currently be assembled by scanning `library/index/*.aisp` (ADR-019) until unsorry publishes an aggregated artifact.

---

## Decision

- Canonical base `https://unsorry.agentics.org.nz/docs`, raw fallback `raw.githubusercontent.com/agenticsnz/unsorry/main/docs`.
- Consumed: `metrics/leaderboard-ui.json` (`contributors[]`), `metrics/community-stats.json` (`goal_effort[]`), `queue.json`, and `library/index/*.aisp` (attribution).
- All fetches server-side with `{ next: { revalidate: 600 } }`; canonical-then-raw fallback; typed `UnsorryFetchError`.
- Pure transforms (`subtree`, `leaderboard-mapper`, `target-leaderboard`, `aisp`) are I/O-free and unit-tested against real captured samples.

See [SPEC-015-A](../specs/SPEC-015-A-Unsorry-Data-Source.md) and [ADR-019](./ADR-019-Per-Target-Attribution.md).

## Consequences

- No DB needed for unsorry-derived data; the overlay (ADR-018) is config-only.
- A goal→solver scan is relatively expensive; cached, and superseded later by a `goals-with-solvers.json` artifact (Phase 3).
