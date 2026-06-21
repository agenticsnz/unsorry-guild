# ADR-016: Admin-Only Authentication

| Field | Value |
|-------|-------|
| **Decision ID** | ADR-016 |
| **Initiative** | unsorry-guild adaptation |
| **Proposed By** | Development Team |
| **Date** | 2026-06-21 |
| **Status** | Accepted |

---

## WH(Y) Decision Statement

**In the context of** re-scoping Guild Hall into `unsorry-guild`, where contributors are GitHub identities sourced from unsorry's git provenance rather than site accounts,

**facing** an inherited auth surface (email/password + Google/Apple OAuth sign-up, password reset, role-gated dashboard) that no longer fits a public, read-only engagement site,

**we decided for** stripping authentication to a single **admin** role (Supabase auth) that gates only the `/gm` console, with everything else public and read-only,

**and neglected** keeping the full RBAC + self-service sign-up (ADR-008) and the mixed-access action prompts (ADR-013), which assume member accounts the new model does not have,

**to achieve** a minimal trusted surface (only an admin can author prizes/seasons/awards) while the rest of the site is open and identity-free,

**accepting that** the inherited sign-up / reset / OAuth components remain in the tree until the Phase-4 prune, and that "admin" is the only authenticated principal.

---

## Decision

- `middleware.ts` gates only `/gm/:path*` (session + `has_role('admin'|'gm')`), and bounces an authenticated admin off `/login`. Matcher reduced to `['/gm/:path*', '/login']`; all previously protected member routes (`/dashboard`, `/my-quests`, `/profile`, `/settings`, `/notifications`) are no longer gated.
- `signIn` redirects to `/gm`; `signOut` redirects to `/math`.
- Public sign-up and password-reset **routes** are removed; the login form is reduced to admin email/password (no OAuth, no sign-up/reset links).
- Non-admin authenticated users hitting `/gm` are redirected to the public app (`/math`).

This supersedes ADR-008 (RBAC member roles) and the member-facing portions of ADR-013 for the unsorry-guild scope. See [SPEC-016-A](../specs/SPEC-016-A-Admin-Only-Auth.md).

## Consequences

- The trusted write surface is just the admin console; public pages never gate.
- Identity for contributors is the GitHub handle (read-only), not a site account.
- Dead auth components (register/reset/OAuth forms, member routes) are pruned in Phase 4.
