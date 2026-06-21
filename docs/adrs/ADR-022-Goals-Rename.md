# ADR-022: "Goals" Naming & `/math/goals` Route

| Field | Value |
|-------|-------|
| **Decision ID** | ADR-022 |
| **Initiative** | unsorry-guild v2.0.0 (issue #1) |
| **Proposed By** | Development Team |
| **Date** | 2026-06-21 |
| **Status** | Accepted |

---

## WH(Y) Decision Statement

**In the context of** unsorry-guild surfacing proof goals as the unit of work contributors actually act on (they copy a goal id into their `run.sh`),

**facing** the term "Prizes" and the `/math/prizes` route reading as a reward/marketing concept rather than the goal the swarm proves,

**we decided for** renaming the public surface to **"Goals"** and moving the route to `/math/goals` with a permanent redirect from `/math/prizes`, while keeping the internal `prize`/`season`/`award` overlay naming (Supabase tables + `src/lib/prizes`) unchanged,

**and neglected** a full rename through the admin console, lib modules, and Supabase tables (large blast radius incl. a DB migration for no user-visible gain), and a label-only change that would leave the route mismatched,

**to achieve** vocabulary that matches how contributors use the page and a clean, shareable URL, without churning the data model,

**accepting that** the public "Goals" vocabulary and the internal "prize" vocabulary now diverge (documented in SPEC-022-A), and old `/math/prizes` links depend on a redirect.

---

## Decision

- Public route is `/math/goals` (and `/math/goals/[targetId]`); `/math/prizes/*` permanently redirects via `next.config.js`.
- User-facing labels/headings ("Prizes" → "Goals") change in the public header, domain switcher, page headings, and metadata.
- Each goal card carries a hover **copy-id** control so contributors can copy the goal id straight into `run.sh`.
- Internal naming (`prizes` tables, `src/lib/prizes/*`, `PrizeCard` type wiring) is **unchanged**; only the presentation layer renames.

See [SPEC-022-A](../specs/SPEC-022-A-Goals-Rename.md), [ADR-017](./ADR-017-Domain-URL-Prefix.md), [ADR-018](./ADR-018-Prize-Flagship-Target-Model.md).

## Consequences

- Contributors see consistent "Goals" vocabulary that matches the run.sh workflow.
- The admin console keeps its existing "Prize" vocabulary (internal), a documented, intentional divergence.
