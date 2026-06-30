# ADR-036: Admin Goals Management

| Field | Value |
|-------|-------|
| **Decision ID** | ADR-036 |
| **Initiative** | unsorry-guild admin revamp |
| **Proposed By** | Development Team |
| **Date** | 2026-06-30 |
| **Status** | Accepted |

---

## WH(Y) Decision Statement

**In the context of** the admin console's Goals screen (`/gm/prizes`) being a bare placeholder — a raw `headlineGoalId` text box plus "open season" / "close & award", with no way to pick a real target, edit, delete, or see how a Goal is tracking,

**facing** an admin who needs to manage Goals end-to-end (create → edit → delete → track → award) but **cannot author proof goals here** — git is the source of truth and the guild is read-only to unsorry (ADR-015); a guild "Goal" is only the curation overlay (`prizes`/`prize_seasons`/`prize_awards`) wrapping a read-only unsorry headline goal,

**we decided for** a full CRUD Goals admin over that overlay: a **target picker** sourced from the read-only unsorry goal corpus + benchmark suites, edit and delete actions, live per-Goal tracking (progress + podium preview), the existing season/award flow, and an **upstream-authoring guidance** panel that tells the admin how a brand-new proof goal is actually created (in the swarm repo, not here),

**and neglected** (a) writing new goals back to unsorry (rejected — breaks ADR-015's read-only invariant; authoring stays upstream, the guild only links to it), and (b) renaming the `prize`/`season`/`award` lib + tables to "goal" (ADR-022 already chose to keep internal prize naming and rename only the presentation),

**to achieve** a Goals console an admin can actually run, without crossing the read-only boundary or churning the data model,

**accepting that** "create a Goal" means *curate an existing target*, not author a proof obligation, and that the picker can only offer targets unsorry already publishes (the guidance panel covers the rest).

---

## Decision

- **Create** picks a headline target from a **read-only candidate list** — the unsorry goal corpus
  (`goal_effort`) plus benchmark-suite goals (`registered-targets.json`) — instead of a free-text id,
  plus title / description / badge. Validated by a shared zod `goalSchema`.
- **Edit** and **Delete** are added (`updatePrizeAction`, `deletePrizeAction`); delete relies on the
  existing `ON DELETE CASCADE` from `prizes` → `prize_seasons` → `prize_awards`.
- **Track**: each Goal card shows live `computeTargetProgress` + a top-of-podium preview from
  `computeTargetLeaderboard`, and the existing season state.
- **Award**: the existing `openSeasonAction` / `closeAndAwardAction` (deterministic
  `derivePodiumAwards`) are retained and surfaced.
- **Guidance**: a panel (and picker empty-state) explains that new proof goals are authored upstream
  — the natural-language backlog sourcing pipeline (unsorry ADR-012) and skeleton intake for
  benchmark suites (unsorry ADR-081) — with links into the unsorry repo. Informational only; no
  write path.
- Internal `prize`/`season`/`award` naming and the `/gm/prizes` route are unchanged (presentation
  reads "Goals").

Builds on [ADR-015](./ADR-015-Unsorry-Data-Source.md) (read-only), [ADR-016](./ADR-016-Admin-Only-Auth.md),
[ADR-018](./ADR-018-Prize-Flagship-Target-Model.md), [ADR-022](./ADR-022-Goals-Rename.md), and
[ADR-035](./ADR-035-Admin-Console-Rename-And-Overview.md). See
[SPEC-036-A](../specs/SPEC-036-A-Admin-Goals-Management.md).

## Consequences

- The admin can fully manage Goals (curation objects) from the console.
- The read-only boundary to unsorry holds; brand-new goals are still authored upstream, now
  discoverable via the guidance panel.
- The picker is bounded by what unsorry publishes; targets not yet in `goal_effort`/suites can still
  be entered by id (the field accepts a free value), preserving the old escape hatch.
