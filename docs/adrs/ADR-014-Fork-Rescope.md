# ADR-014: Fork Re-scope — Engagement Layer for unsorry

| Field | Value |
|-------|-------|
| **Decision ID** | ADR-014 |
| **Initiative** | unsorry-guild adaptation |
| **Proposed By** | Development Team |
| **Date** | 2026-06-21 |
| **Status** | Accepted |

---

## WH(Y) Decision Statement

**In the context of** forking Guild Hall (a generic quest platform) into `unsorry-guild`,

**facing** the need to drive contributors in the unsorry theorem-proving swarm toward specified goals,

**we decided for** re-scoping the product into a public, read-only **engagement layer** over unsorry's git data — global leaderboard, prizes (flagship targets) with per-target leaderboards + podiums, contributor profiles, and the ported unsorry pages — with a single admin and a slim Supabase overlay,

**and neglected** keeping Guild Hall's quest-lifecycle product (GM-authored quests, member sign-up, accept→evidence→review), which assumes site accounts and authored content the new model does not have,

**to achieve** a git-truthful engagement surface that needs no data duplication and minimal trusted surface,

**accepting that** large parts of the inherited surface (quests/objectives/evidence/banners/email, member auth) are superseded and pruned in a later phase.

---

## Decision

This ADR re-scopes the product and **supersedes, for unsorry-guild, the member-facing scope of**:
- ADR-008 (Role-Based Access Control → admin-only, see [ADR-016](./ADR-016-Admin-Only-Auth.md))
- ADR-009/010/011 (Smart Quest Creator, Quest Dependencies, Banner System — out of scope)
- the member portions of ADR-013 (Mixed-Access Authentication)

It introduces the unsorry-guild decision set: [ADR-015](./ADR-015-Unsorry-Data-Source.md) (git data source), [ADR-016](./ADR-016-Admin-Only-Auth.md) (admin-only auth), [ADR-017](./ADR-017-Domain-URL-Prefix.md) (domain URL prefix), [ADR-018](./ADR-018-Prize-Flagship-Target-Model.md)/[ADR-019](./ADR-019-Per-Target-Attribution.md) (prize/target model + attribution), [ADR-020](./ADR-020-Default-Theme-Dark.md) (dark default), [ADR-021](./ADR-021-Page-Ports.md) (page ports).

Canonical design + decision log: [agenticsnz/unsorry-guild#1](https://github.com/agenticsnz/unsorry-guild/issues/1).

## Notes

- **Spec directory:** `protocols.md` specifies `docs/adrs/specs/`; this repo keeps the inherited `docs/adrs/` + `docs/specs/` layout for consistency. Divergence noted; reconcile if/when specs are reorganised.
- Superseded code (quests, evidence, banners, email, member auth routes) is removed in the Phase-4 prune.
