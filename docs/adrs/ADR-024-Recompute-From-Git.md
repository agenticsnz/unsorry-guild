# ADR-024: Recompute Standings From Raw Git (Decision #2)

| Field | Value |
|-------|-------|
| **Decision ID** | ADR-024 |
| **Initiative** | unsorry-guild v2.0.0 (issue #1) |
| **Proposed By** | Development Team |
| **Date** | 2026-06-21 |
| **Status** | Accepted |

---

## WH(Y) Decision Statement

**In the context of** standings that must be fresh (the baked `leaderboard-ui.json` ran 1–2 h stale on a throttled cron) and goal pages that were slow (an unauthenticated per-file scan of ~590 `library/index/*.aisp` records, rate-limited at 60 req/h),

**facing** the choice between consuming the baked, derived artifacts (Decision #5) and recomputing from the raw records the proof-merge PRs commit to `main` in real time (Decision #2),

**we decided for** **Decision #2**: a single authenticated **tarball snapshot** of the unsorry repo (~3 MB), fetched once per ~90 s window and parsed in-memory into the raw AISP records (`library/index`, `goals`, `proof-runs`), from which the leaderboard, per-target boards, attribution, models, timelines, and summary are derived on read,

**and neglected** the baked-JSON path as the long-term source (structurally gated on a GitHub-Actions commit landing) and a per-file blob scan (thousands of requests; rate-limit bound),

**to achieve** near-real-time standings whose freshness the guild controls (the ~90 s memo), one request instead of hundreds (fixing #10), and a single code path feeding every surface,

**accepting that** it needs a read-only `GITHUB_TOKEN` (Netlify env) and that when the token is absent or the fetch fails the app **gracefully falls back** to the baked artifacts (so it always renders). Sourcing stays on the baked `sourcing-leaderboard.json` (the sourcer→handle mapping is not in the raw goal records). This supersedes the data-source role of ADR-015 and the per-file scan of ADR-019.

---

## Decision

- `src/lib/unsorry/snapshot.ts`: authenticated tarball fetch + gunzip + `tar-stream` parse, memoised `TTL_MS = 90 s`. Returns `null` ⇒ fallback. `tar-stream` (not nanotar) because GitHub archives use GNU/PAX long-name headers for the 64-hex filenames.
- `src/lib/unsorry/snapshot-parse.ts`: pure parsers for the three record families (verified by tests against real captured records).
- `src/lib/unsorry/derive.ts`: pure derivations (leaderboard, goal-effort, goal→solver map, models, timelines, summary) — same score policy as the board (`difficulty*100 + proofs*25`), ties via `assignRanks`.
- `src/lib/unsorry/standings.ts`: the facade every page calls; snapshot-first, baked-fallback. `loadSnapshot` is memoised so co-rendered getters share one fetch.
- Pages drop `revalidate` 600 → **60**; goal detail gains `generateStaticParams` + `loading.tsx` (perf, #10).
- `GITHUB_TOKEN` documented in `.env.example` (read-only, server-only).

See [SPEC-024-A](../specs/SPEC-024-A-Git-Snapshot.md), [ADR-015](./ADR-015-Unsorry-Data-Source.md), [ADR-019](./ADR-019-Per-Target-Attribution.md), [SPEC-018-B](../specs/SPEC-018-B-Tie-Handling.md).

## Consequences

- Standings reflect merges within ~90 s; goal pages load from one cached request.
- Timelines/models are recomputed in-memory (cheap — the tarball is already in hand), satisfying #17's "also covers the model/timeline series".
- A new runtime dependency (`GITHUB_TOKEN`) with a safe fallback; sourcing remains baked.
