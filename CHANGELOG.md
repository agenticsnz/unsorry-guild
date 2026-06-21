# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

This project is being re-scoped from **Guild Hall** (a generic quest platform) into
**unsorry-guild**, an engagement layer for the [unsorry](https://github.com/agenticsnz/unsorry)
theorem-proving swarm. See `agenticsnz/unsorry-guild#1` for the design and `protocols.md` for
the engineering protocols this project follows.

## [Unreleased]

### Added
- Engineering protocols (`protocols.md`) referenced from `CLAUDE.md` (#2).
- ADR-020 and a `ThemeProvider` test covering the default theme.
- ADR-016 + SPEC-016-A (admin-only auth) and a middleware test suite.
- **unsorry data layer** (`src/lib/unsorry/`): server-side fetchers for the git-published artifacts (leaderboard-ui, community-stats/goal_effort, queue) with canonical→raw fallback and `revalidate: 600`; an AISP parser; suffix-based target subtree + progress; global and per-target leaderboard computation; and a `library/index` goal→solver attribution scan. ADR-015 + SPEC-015-A, ADR-019. 20 unit tests against real captured samples.
- **`/math` domain context + global leaderboard**: public route group `(public)`, `PublicHeader` + `DomainSwitcher` (Math-only seam, ADR-017), and `/math/leaderboard` (Server Component) rendering live unsorry data via `GlobalLeaderboard`. Root `/` redirects to `/math`. Component test included.
- **Prize overlay schema + config fallback**: Supabase migrations for `domains`/`prizes`/`prize_seasons`/`prize_awards` (RLS: public read, admin write) seeded with the `sq-add-sq-eq-three-mul-sq` flagship prize; typed in-repo fallback (`src/lib/prizes/config.ts`) so prizes work without a DB. ADR-018 + SPEC-018-A.
- **Prize / flagship-target pages**: `/math/prizes` (index with live progress per target) and `/math/prizes/[targetId]` (progress + per-target leaderboard + provisional podium, attributed via the `library/index` scan). Prize data access (`src/lib/prizes/prizes.ts`, Supabase-or-config). Prizes added to nav + landing. Component + data-access tests.
- **Contributor profiles** (`/math/contributors/[handle]`): global standing from the leaderboard + prize badges derived from each prize's per-target attribution (podium/contributor), keyed on GitHub handle. Closes the leaderboard/podium → profile links. `src/lib/profiles/contributor.ts`; component + integration tests.
- **Admin prize console** (`/gm/prizes`): create prizes, open a season, and "close & award" (computes the podium from the per-target leaderboard and writes frozen `prize_awards`). Server-action driven; `src/lib/prizes/awards.ts` (`derivePodiumAwards`, tested) + `admin-actions.ts`; added to the GM nav.
- **Ported unsorry pages** under `/math` (ADR-021): `/math/queue` (native, from `queue.json`), `/math/proof-graph` (embeds `proof-graph.svg` + link), `/math/showcase` (embeds `showcase.html` + link). All in nav + landing. Queue types + `fetchQueueData`; `QueueBoard` component + test.
- **Rich leaderboard** (parity with unsorry's leaderboard.html): summary stat cards (verified/attributed/inferred/runs); 3 tabs — **Leaderboard** (ranked table + **model distribution** incl. `python / sympy`), **Proofs over time** (inline-SVG cumulative chart with merge/solve toggle), and **Sourcing** (goals-sourced table). New `fetchLeaderboardUi`/`fetchSourcing`, `models`/`timelines`/`summary`/`sourcing` types, and a dependency-free `buildAreaChart` helper. Proof-graph page now embeds the **interactive** `proofs-contributors-visualisation.html` (filter/zoom) instead of the bare SVG. Chart + component tests.

- **Re-scope docs**: ADR-014 (fork re-scope, supersedes the quest-lifecycle scope) and a rewritten README accurately describing unsorry-guild.
- **Deploy prep**: `.env.example` documents `NEXT_PUBLIC_UNSORRY_BASE_URL` and marks Supabase optional; site metadata/OG rebranded to unsorry-guild at `swarm.unsorry.agentics.org.nz`.

#### v2.0.0 — issue #1 fixes (in progress)
- **Header branding** (#1, #2): far-left Agentics logo linking to `https://agentics.org.nz`; title rendered as **unsorry** + **swarm** (in a new "claude orange" `brand` token defined across all themes). SPEC-021-B.
- **Root `/` landing page** (#12): the root now renders a hero + live swarm summary + surface cards instead of redirecting to `/math`. Shared `SurfaceCards` component (DRY, reused by the `/math` home). SPEC-021-B.
- **Copy-goal-id control** (#7): goal cards show a hover copy button that copies the goal id (for `run.sh`) without navigating. ADR-022 / SPEC-022-A.
- **Standard-competition tie handling** (#11): equal scores now share a rank ("1224") via a shared `assignRanks` utility applied to the global and per-target leaderboards. ADR-018 refinement / SPEC-018-B.
- **Interactive charts** (#3, #4, #5): adopted Chart.js v4 + react-chartjs-2 v5. Proofs-over-time is now a dynamic line chart with data points, horizontal gridlines, and an `index`-mode hover tooltip beside the cursor; the Leaderboard tab gains a top-contributors horizontal bar chart; the Sourcing tab mirrors the leaderboard with a bar chart of *sourced goals only*. Reusable `LineChart`/`HorizontalBarChart` wrappers over pure, unit-tested data mappers. The landing page renders the proofs-over-time chart. ADR-023 / SPEC-023-A.
- Docs: ADR-022 (Goals rename), ADR-023 (charts), SPEC-022-A, SPEC-021-B, SPEC-018-B, SPEC-023-A.

### Fixed
- Prize admin write actions used strict Supabase write types unsupported by the repo's hand-maintained `Database` types; now use the established builder+payload cast pattern (restores green type-check/build).

### Changed
- Default theme is now **dark** (was `warm`); the light/warm/system toggle is retained (ADR-020, SPEC-008).
- **Auth stripped to admin-only**: only `/gm` is gated (admin/gm role); everything else is public read-only. `signIn`→`/gm`, `signOut`→`/math`; the login form is now admin email/password only (ADR-016, SPEC-016-A).
- **Public "Prizes" surface renamed to "Goals"** (#6): route moved to `/math/goals` (permanent redirect from `/math/prizes`); nav, headings, and metadata relabelled. Internal `prize`/Supabase naming is unchanged by design (ADR-022).
- Global leaderboard ranks are now computed guild-side by score (so ties are honoured) rather than echoing upstream rank numbers (SPEC-018-B).

### Removed
- Public sign-up (`/register`) and password-reset (`/reset-password`) routes.
