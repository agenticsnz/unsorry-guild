# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

This project is being re-scoped from **Guild Hall** (a generic quest platform) into
**unsorry-guild**, an engagement layer for the [unsorry](https://github.com/agenticsnz/unsorry)
theorem-proving swarm. See `agenticsnz/unsorry-guild#1` for the design and `protocols.md` for
the engineering protocols this project follows.

## [Unreleased]

## [2.0.2] - 2026-06-21

### Fixed
- **Global leaderboard ranking was wrong** (e.g. ohdearquant showed 2nd instead of 1st). The recompute-from-raw-git derivation could not reproduce unsorry's canonical score: `score = difficulty_points*100 + credited_proofs*25 + dispatch_points*100`, where `dispatch_points` come from PR provenance and `credited_proofs` include archived proofs — neither is present in the raw lemma/goal records. The global **leaderboard, model breakdown, proofs-over-time series, and summary** now read the canonical `leaderboard-ui.json` (correct, and fresh via agenticsnz/unsorry#3735). The git snapshot is retained only for **goal→solver attribution** (per-target boards, podiums, proof graph, showcase) — the one thing it computes correctly and the source of the slow-goal-page fix (#10). Unused snapshot derivations removed.
- `NODE_VERSION` → 22 (`netlify.toml` + `.nvmrc`), clearing the Netlify Node-version plugin warning.

### Added
- **Proofs-over-time combo chart**: per-period proof bars overlaid under the cumulative line, like the original.
- **Clickable contributor bars**: the leaderboard and sourcing bar charts link each bar to the contributor's profile.

## [2.0.1] - 2026-06-21

### Fixed
- **Netlify build failure** (prerender → GitHub `403`). The snapshot-backed pages (landing, leaderboard, goals, goal detail, showcase, proof-graph, contributor) and the `next/og` image routes are now rendered **dynamically** (`force-dynamic`) instead of being statically prerendered at build. The build no longer makes any GitHub API calls, so it cannot fail on rate-limit/403; the snapshot (and its baked-JSON fallback) run at request time. Also:
  - The standings facade getters are now **total** — they return safe empty values instead of throwing, so a transient upstream failure degrades a surface gracefully rather than crashing the render.
  - The GitHub-API attribution fallback (`buildGoalSolverMap`) is now **authenticated** with `GITHUB_TOKEN` and sends a `User-Agent` (it was unauthenticated → 403 on shared CI/build IPs).
  - Added snapshot fetch-failure logging so an invalid/missing token is visible in the runtime logs (the app still falls back to baked artifacts).
  - Removed `generateStaticParams` from the goal detail route (it forced build-time data fetches).

## [2.0.0] - 2026-06-21

The v2.0.0 release delivers the issue #1 punch-list: branding, the Prizes→Goals rename, interactive
charts, the recompute-from-raw-git data layer, native showcase/proof-graph/queue, generated social &
README images, mobile nav, admin scope reduction, and the standing tie rule — on top of the prior
port of unsorry's public pages.

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
- **Recompute-from-raw-git data layer** (#10, #17): standings are now recomputed on read from a single authenticated ~3 MB tarball snapshot of the unsorry repo (cached ~90 s), instead of the 1–2 h-stale baked `leaderboard-ui.json` and the slow unauthenticated per-file `library/index` scan. Derives the global + per-target leaderboards, attribution, models, and proofs-over-time timelines from the raw AISP records; falls back gracefully to the baked artifacts when `GITHUB_TOKEN` is absent. Goal pages gain `generateStaticParams` + a loading skeleton and drop to a 60 s revalidate. `tar-stream` added (handles GitHub's GNU/PAX long filenames). ADR-024 / SPEC-024-A.
- **Native showcase, proof-graph & queue** (#8, #9): the proof-graph page is now an interactive force-directed node graph (contributors↔goals, drag/zoom/hover) via `react-force-graph-2d` instead of an iframe; the showcase is native difficulty-ranked cards; and the queue surfaces per-goal queued work (goal, model, state, date) and distinct-goal counts, not just totals. All read the same fresh git snapshot. ADR-025 / SPEC-025-A.
- **Generated social & README images** (#13, #14): the social preview (Open Graph + Twitter) is now the live proofs-over-time graph, generated with `next/og`; stable `/api/og/proofs-over-time` and `/api/og/leaderboard` PNG endpoints back the upstream unsorry README (a cross-repo PR repoints its images at them). Static `og-image.jpg` reference removed. ADR-026 / SPEC-026-A.
- **Mobile navigation** (#15): the public header gains a hamburger dropdown menu below `md`, so the full nav is reachable on phones. SPEC-016-B.
- Docs: ADR-022 (Goals rename), ADR-023 (charts), ADR-024 (recompute-from-git), ADR-025 (native pages), ADR-026 (generated images), SPEC-022-A, SPEC-021-B, SPEC-018-B, SPEC-023-A, SPEC-024-A, SPEC-025-A, SPEC-026-A, SPEC-016-B.

### Fixed
- Prize admin write actions used strict Supabase write types unsupported by the repo's hand-maintained `Database` types; now use the established builder+payload cast pattern (restores green type-check/build).

### Changed
- Default theme is now **dark** (was `warm`); the light/warm/system toggle is retained (ADR-020, SPEC-008).
- **Auth stripped to admin-only**: only `/gm` is gated (admin/gm role); everything else is public read-only. `signIn`→`/gm`, `signOut`→`/math`; the login form is now admin email/password only (ADR-016, SPEC-016-A).
- **Public "Prizes" surface renamed to "Goals"** (#6): route moved to `/math/goals` (permanent redirect from `/math/prizes`); nav, headings, and metadata relabelled. Internal `prize`/Supabase naming is unchanged by design (ADR-022).
- Global leaderboard ranks are now computed guild-side by score (so ties are honoured) rather than echoing upstream rank numbers (SPEC-018-B).
- **Admin trimmed to the engagement-layer scope** (#16): the GM nav now shows only Overview + Goals (the prize console); quest-platform sections (quests, review, extensions, users, banners, templates, emails, quotes, tiers) are hidden as not relevant to this fork. ADR-016 / SPEC-016-B.

### Removed
- Public sign-up (`/register`) and password-reset (`/reset-password`) routes.
