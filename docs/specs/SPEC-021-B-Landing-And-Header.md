# SPEC-021-B: Root Landing Page & Header Branding

Implements [ADR-021](../adrs/ADR-021-Page-Ports.md) (public surface) and references [ADR-020](../adrs/ADR-020-Default-Theme-Dark.md) (theme). Issue #1 items #1, #2, #12.

## Brand colour token ("claude orange")
- Add a `brand` colour to `tailwind.config.ts` mapped to a CSS var `--brand` in `src/app/globals.css` (all theme blocks), ≈ `#D97757` → `hsl(14 63% 60%)`. Exact hex tunable.
- Usable as `text-brand` / `bg-brand`.

## Header (`src/components/layout/public-header.tsx`)
- Far-left: `next/image` logo (`/public/logo.png`, the Agentics infinity mark) wrapped in an `<a href="https://agentics.org.nz">` (external, `rel="noopener noreferrer"`), before the title.
- Title: **unsorry** (`font-bold`, `Link href="/"`) immediately followed by **swarm** (`font-normal`, `text-brand`) — e.g. `<span>unsorry</span> <span class="font-normal text-brand">swarm</span>`.
- Existing nav + theme toggle + Admin button retained (mobile hamburger added in Phase 6 / SPEC-021-D).

## Root landing page (`src/app/page.tsx`) — #12
- Replace `redirect('/math')` with a rendered landing (Server Component):
  - Hero: logo + "unsorry **swarm**", one-line tagline (engagement layer over the unsorry theorem-proving swarm).
  - Primary CTAs (buttons/links) to `/math/leaderboard`, `/math/goals`, `/math/showcase`, `/math/proof-graph`, `/math/queue`.
  - Live summary stats (verified proofs / contributors) from the data layer, and a compact proofs-over-time chart (Chart.js once Phase 2 lands; until then the existing area chart). Graceful empty-state if data unavailable.
- `/math` continues to function as the domain home.

## Tests
- Update the existing root-redirect test to assert the landing renders (hero text + CTA links) instead of redirecting.
- Header test: logo links to agentics.org.nz; "unsorry" links to `/`; "swarm" present with `text-brand`.
