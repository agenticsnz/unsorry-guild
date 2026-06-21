# SPEC-016-B: Admin Scope Reduction & Mobile Nav

Extends [ADR-016](../adrs/ADR-016-Admin-Only-Auth.md) (admin-only auth) per the engagement-layer scope of [ADR-014](../adrs/ADR-014-Fork-Rescope.md). Issue #1 items #15, #16.

## Admin scope (#16)
- The only relevant admin surface for this fork is curating **Goals/prizes**. `gm-header.tsx` nav is trimmed to **Overview** + **Goals** (`/gm/prizes`).
- Hidden (quest-platform leftovers, not linked in nav): Quests, Review, Extensions, Users, Banners, Templates, Emails, Quotes, Tiers. The routes remain in the codebase but are unreachable from navigation (reversible).
- The GM nav previously omitted the prize console entirely; it is now surfaced as "Goals" (route stays `/gm/prizes`; internal naming unchanged per ADR-022).

## Mobile navigation (#15)
- `public-header.tsx` gains a hamburger `DropdownMenu` (visible `md:hidden`) listing the public nav (Leaderboard, Goals, Showcase, Proof graph, Queue) with active-state highlight — the desktop `md:flex` nav is unchanged. Reuses the `DropdownMenu` + `Menu`/`X` pattern already used by the GM header.

## Tests / verification
- `npm run build` + existing middleware/admin tests stay green; mobile menu verified by build + manual responsive check.
