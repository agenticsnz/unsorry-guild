# SPEC-022-A: "Goals" Naming & `/math/goals` Route

Implements [ADR-022](../adrs/ADR-022-Goals-Rename.md).

## Route move
- Move `src/app/(public)/math/prizes/` → `src/app/(public)/math/goals/` (incl. `page.tsx`, `[targetId]/page.tsx`, any `loading.tsx`).
- Internal links updated to `/math/goals/${headlineGoalId}` (e.g. `prize-card.tsx`, landing CTAs).
- `next.config.js` permanent redirect: `/math/prizes/:path*` → `/math/goals/:path*` and `/math/prizes` → `/math/goals`.

## Labels
- `src/components/layout/public-header.tsx` nav: `Prizes` → `Goals`, `href: '/math/goals'`.
- `src/components/layout/domain-switcher.tsx` and any page `metadata.title` / `<h1>` strings: "Prizes" → "Goals".
- Goal-detail page heading + breadcrumbs use "Goals".

## Copy-id control (`prize-card.tsx`)
- Card becomes a client component. On hover, a square icon button appears top-right.
- Click: `e.preventDefault()` + `e.stopPropagation()` (must NOT navigate the wrapping `Link`), then `navigator.clipboard.writeText(prize.headlineGoalId)`.
- Shows a transient check state (`lucide-react` `Copy` → `Check`) on success; `aria-label="Copy goal id"`.

## Internal naming (unchanged)
- Supabase `prizes`/`prize_seasons`/`prize_awards`, `src/lib/prizes/*`, and the `Prize` type keep "prize" naming. Only presentation renames.

## Tests
- `src/tests/components/prizes/goal-card.test.tsx` — copy button appears, writes `headlineGoalId` to clipboard (mock `navigator.clipboard`), and does not trigger navigation.
- `src/tests/middleware` or a route test asserting `/math/prizes` redirects to `/math/goals` (or covered by the e2e/manual verification step).
