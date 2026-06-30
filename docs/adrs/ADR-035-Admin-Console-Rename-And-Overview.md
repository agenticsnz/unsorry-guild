# ADR-035: Admin Console — Rename & Goals-Centric Overview

| Field | Value |
|-------|-------|
| **Decision ID** | ADR-035 |
| **Initiative** | unsorry-guild admin revamp |
| **Proposed By** | Development Team |
| **Date** | 2026-06-30 |
| **Status** | Accepted |

---

## WH(Y) Decision Statement

**In the context of** unsorry-guild being a read-only engagement layer over the proof swarm whose only admin task is curating Goals/prizes (ADR-016),

**facing** an admin console still wearing its inherited Guild Hall skin — branded "GM" / "Guild Hall" throughout, and an overview (`/gm`) built entirely from quest-platform widgets (Pending Reviews, Quest Stats, Active Adventurers, Extension Requests, Draft Quests) that surface nothing an unsorry admin acts on,

**we decided for** renaming the console's **presentation** to **"Admin"** and rebuilding the overview around the swarm: live Goals status, recent proof activity, and quick actions,

**and neglected** (a) a full rename through the route group, the `gm` role value, component/hook identifiers, and Supabase — a large blast radius for no user-visible gain (the same trade-off ADR-022 made for the public rename), and (b) deleting the now-unlinked quest-platform admin routes, deferred as hide-don't-delete since they are already unreachable from the nav,

**to achieve** an admin surface that reads as what it is — a Goals console for a proof swarm — without churning the route, role, or data model,

**accepting that** the user-facing "Admin" label and the internal `gm` route/role now diverge (as the public "Goals" label already diverges from the internal `prize` tables), and that the dead quest-platform admin routes remain on disk until a later prune.

---

## Decision

- **Rename presentation only.** Every user-facing "GM" / "Game Master" / "Guild Hall" string in the
  admin surface becomes "Admin" (header logo + badge, "Exit GM", the dashboard heading, metadata
  titles, the user-facing "GM Feedback" labels, and the role labels). The `/gm` URL, the `gm` role
  value, the `GMHeader`/`GMAuthGuard` component names, and the React-Query keys are **unchanged** —
  route/role-move is deferred for the ADR-022 reason (large blast radius, no user-visible gain).
- **Rebuild the overview** (`/gm` → `(gm)/gm/page.tsx`) as a server component rendering three
  widgets: **Goals status** (each active Goal's live headline progress + season state), **Recent
  proof activity** (most-recently-proved goals + a 24 h / 7 d proof-velocity line), and **Quick
  actions** (new goal, open/close season, view the public Goals page). The quest hooks
  (`useGMQuests`, `usePendingSubmissions`, `useExtensionRequests`, …) are dropped from the overview.
- **Recent-proof data** is read from the snapshot's per-record day-stamp (the `@YYYY-MM-DD` in each
  `library/index/*.aisp` header line), captured into `SnapshotProof.provedOn` and surfaced by a pure
  `deriveRecentProofs`; the velocity line reuses `leaderboard-ui.json`'s `timelines.merge`.
- **Hide-don't-delete:** the unlinked quest-platform admin routes and the never-rendered `GMSidebar`
  are left in place.

This builds on [ADR-016](./ADR-016-Admin-Only-Auth.md) (admin-only console) and follows the
presentation-rename precedent of [ADR-022](./ADR-022-Goals-Rename.md). See
[SPEC-035-A](../specs/SPEC-035-A-Admin-Console-Rename-And-Overview.md). Goals CRUD is
[ADR-036](./ADR-036-Admin-Goals-Management.md).

## Consequences

- The admin console reads as "Admin" and its overview reflects swarm activity, not quests.
- The route (`/gm`) and role (`gm`) keep their internal names; a future ADR may move them.
- A new `SnapshotProof.provedOn` (day resolution) is available to any future recency feature.
- Dead quest-platform admin routes remain until a later prune ADR.
