# ADR-018: Prize / Flagship-Target Model

| Field | Value |
|-------|-------|
| **Decision ID** | ADR-018 |
| **Initiative** | unsorry-guild adaptation |
| **Proposed By** | Development Team |
| **Date** | 2026-06-21 |
| **Status** | Accepted |

---

## WH(Y) Decision Statement

**In the context of** driving swarm contributors toward specified goals via engagement,

**facing** the need to model a "prize" that is meaningful against unsorry's git data,

**we decided for** a prize = a **flagship target** (a headline goal id + its suffix-encoded subtree), with a per-prize leaderboard ranked by difficulty-weighted discharge, a season that closes when the headline goal is proved (admin-confirmed podium 1/2/3 + contributor badges), and a live progress indicator,

**and neglected** modelling a prize as an ADR-078 sponsor-registered target now (that registry does not exist yet — ADR-019) and ranking by raw proof count or first-to-solve (Decision #3),

**to achieve** a competitive, git-truthful prize mechanic on existing data,

**accepting that** computed standings are derived from git on read (ADR-015/019) and only authored config + frozen results live in the Supabase overlay.

---

## Decision

- **Overlay schema** (migrations 200–204): `domains`, `prizes` (`headline_goal_id` unique = git join key), `prize_seasons`, `prize_awards`. Public `SELECT`; writes `is_gm()` (admin/gm).
- **Config fallback** (`src/lib/prizes/config.ts`): the app builds and demos without Supabase; prize definitions have a typed in-repo default mirroring the seed.
- **Ranking**: `difficulty_points*100 + credited_proofs*25` scoped to the subtree (`target-leaderboard.ts`).
- **Progress**: proved/total over the subtree (`subtree.ts`); `isClosed` when the headline is proved.
- **Awards**: admin confirms the podium at season close, writing frozen `prize_awards`.

See [SPEC-018-A](../specs/SPEC-018-A-Prize-Model.md), [ADR-015](./ADR-015-Unsorry-Data-Source.md), [ADR-019](./ADR-019-Per-Target-Attribution.md).

## Consequences

- Prizes are git-truthful and need no per-goal data duplication.
- Multiple flagship targets can run concurrently; each is one `prizes` row keyed on its headline goal id.
