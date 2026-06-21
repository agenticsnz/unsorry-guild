# ADR-017: Domain Context as URL Prefix

| Field | Value |
|-------|-------|
| **Decision ID** | ADR-017 |
| **Initiative** | unsorry-guild adaptation |
| **Proposed By** | Development Team |
| **Date** | 2026-06-21 |
| **Status** | Accepted |

---

## WH(Y) Decision Statement

**In the context of** unsorry's roadmap toward a domain-agnostic workload engine (ADR-030), where the guild must eventually scope all content by domain,

**facing** the need for a site-wide domain context today while only one domain (Math) exists,

**we decided for** a URL-prefixed domain segment (`/math/...`) as a new top-level axis, exposed via a header `DomainSwitcher`, served from a public route group `(public)`,

**and neglected** a dynamic `[domain]` segment now (premature while there is one domain and no registry) and a cookie/global context (not shareable by link),

**to achieve** shareable, bookmarkable per-domain URLs and a clean seam for adding domains later,

**accepting that** the slice ships a static `/math` folder; migration to a dynamic `[domain]` segment + a git domain registry is a Phase-2/3 refactor.

---

## Decision

- New public route group `src/app/(public)/` with `layout.tsx` (public header) and `math/` pages; root `/` redirects to `/math`.
- `DomainSwitcher` (header) currently lists only Math; it is the ADR-030 multi-domain seam.
- Inherited member routes are not moved under the prefix (pruned in Phase 4).

## Consequences

- Public pages live under `/math/*`; the global leaderboard is the first.
- A later ADR migrates `/math` → `[domain]` and wires unsorry's git domain registry.
