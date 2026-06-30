# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

This project is being re-scoped from **Guild Hall** (a generic quest platform) into
**unsorry-guild**, an engagement layer for the [unsorry](https://github.com/agenticsnz/unsorry)
theorem-proving swarm. See `agenticsnz/unsorry-guild#1` for the design and `protocols.md` for
the engineering protocols this project follows.

## [Unreleased]

<!-- Unreleased changes accumulate as one-file-per-change fragments under
`changelog.d/` (ADR-028) — do NOT edit this section by hand. Preview with
`npm run changelog:preview`; a release folds them in here with
`npm run changelog:release <version> <date>`. -->

## [2.6.1] - 2026-06-30

### Fixed

- Fixed the admin Goals **season lifecycle** appearing to do nothing. "Close & award" only acts on an **open** season, but a freshly-curated Goal has none, so the action silently returned. The Goals admin now reads each Goal's latest season and shows the correct button — **Open season** when none is open, **Close & award** only once a season is open — with a caption ("No season yet…", "Season open since…", "Last season closed…"). It also shows a **read-only** warning when Supabase isn't configured for the deployment, since the Goals then come from the in-repo fallback and no admin write would persist.

## [2.6.0] - 2026-06-30

### Changed

- The admin **Goals** screen (`/gm/prizes`) is now a full management surface instead of a bare form. **Create** picks a headline target from a searchable list of unsorry goals + benchmark suites (it still accepts any goal id by hand); **edit** and **delete** a Goal (delete cascades its seasons + awards); each Goal **tracks** live — headline progress over its subtree plus the current top-of-podium — alongside the existing open-season / close-&-award flow. A **"Don't see your target?"** guide explains that brand-new proof goals are authored upstream in the swarm (backlog sourcing, unsorry ADR-012; skeleton intake, unsorry ADR-081), with links — the guild stays read-only to unsorry (ADR-036). Internal `prize` naming and the `/gm/prizes` route are unchanged.

## [2.5.0] - 2026-06-30

### Changed

- The admin console is now branded **"Admin"** (was "GM" / "Guild Hall") and its overview is rebuilt around the swarm instead of the old quest platform: **Goals status** (each curated Goal's live headline progress over its subtree), **Recent proof activity** (the most-recently-proved goals plus a 24 h / 7 d proof-velocity line), and **Quick actions**. The rename is presentation-only — the `/gm` route and `gm` role are unchanged (ADR-035, mirroring the ADR-022 public Prizes→Goals rename). Recent-proof recency comes from a new day-stamp (`provedOn`) captured from each `library/index/*.aisp` header; with no snapshot or no dated records it falls back to the velocity line.

## [2.4.0] - 2026-06-30

### Added

- The Queue page now shows a **freshness indicator** ("Updated 3 min ago", amber + "may be lagging upstream" past an hour) next to the title, read from `queue.json`'s new `generated_at`. The queued-proofs board upstream is cron-refreshed and GitHub throttles that cron under load, so it could silently show a pre-drain count for hours (a solver appearing stuck at 141 waiting while their solves were already merged) — this surfaces the staleness instead of presenting an old board as live. Reuses the leaderboard's freshness component (now with an overridable noun).

### Changed

- The **Proof graph** page now renders the new **proof-territory map** (agenticsnz/unsorry#7078/#7079): every credited proof is positioned by an SVD of the mathlib typeclass machinery it touches, so 2-D distance ≈ shared territory — genuine high-machinery proofs separate out while redundant restatement farms collapse together. Colour is the redundancy class (genuine / restatement / shallow), size is machinery, and hovering a proof reveals its real dependency edges into the typeclass landmarks; a toggle hides the restatement farms. This replaces the old contributor↔goal force graph (and drops the `react-force-graph-2d` dependency), reading the push-on-merge `territory.json` raw-git-first with the Pages URL as fallback.

## [2.3.2] - 2026-06-29

### Fixed

- Fixed the proof-detail page's **"Lean statement" and "AISP goal record" links 404ing for archived goals** — they pointed at `goals/<id>.lean` / `.aisp` on `main`, but an archived goal's files live in its `packages/<pkg>/` package. `getGoalSource` now returns the resolved repo path alongside the source, and both links (and the code-panel filename) use it, so they open the real file. Follow-up to the archived-statement fix.

## [2.3.1] - 2026-06-29

### Fixed

- Fixed the proof-detail page (`/math/proofs/<goal>`) showing **"Statement source unavailable"** for archived goals. The Showcase ranks the whole proved corpus, most of which is **archived** — and an archived goal's Lean statement moves to `packages/<pkg>/goals/<id>.lean` while only its `.aisp` record stays in active `goals/`, so the old `goals/<id>.lean`-only lookup found nothing. The snapshot now records each archived goal's package, and `getGoalSource` falls back to `packages/<pkg>/goals/<id>.lean` when the active source is absent — so archived proofs (e.g. `realization-determines-counts`) show their statement again.

## [2.3.0] - 2026-06-29

### Added

- The Goals page (`/math/goals`) now lists **benchmark suites** — curated, kernel-verified targets (PutnamBench and friends) the swarm proves — read from unsorry's new `docs/metrics/registered-targets.json` (ADR-092). Each goal shows its difficulty, proved/open status, and a one-click **Copy run** button for `./swarm/run.sh --goal <id>`; suites are scored as verified pass@k and kept separate from the contributor leaderboard.
- Contributor profiles now show a **Favourite models** table below the score breakdown — the engines (provider/model) behind that contributor's verified proofs, each with its Pokémon sprite, proof count, and share, linking to the model page.
- The Leaderboard page now shows a **freshness indicator** ("Updated 3 h ago") next to the title, read from the `generated_at` of unsorry's `leaderboard-ui.json`. When the artifact is older than an hour it turns amber with a "may be lagging upstream" note, so a stalled upstream refresh (agenticsnz/unsorry#6317 — the regen step now outpaces the merge cadence) is visible instead of the board silently serving hours-old standings.
- The proof-detail page now links to the goal's **Lean statement** (`goals/<id>.lean`) on GitHub alongside the AISP goal record, shown when a Lean source is published for that goal.
- The proofs-over-time chart now **shows no-proof gaps** instead of collapsing them. The by-merge (hourly) and by-solve (daily) views zero-fill missing buckets so a stretch with no proofs — e.g. the 2026-06-26→06-29 drought — renders as a visible empty span rather than two adjacent bars with a jumping date label. A **"Hide empty hours/days"** toggle (default **off**, so gaps are visible) collapses back to the compact active-periods-only view. Cumulative holds flat across the filled buckets.
- The leaderboard now shows a **Dispatch** column (proof PRs landed for other contributors), contributor profiles gain a **Score breakdown** that reconstructs the rank from its difficulty, proof, and dispatch terms, and a new **How scores are calculated** page (`/math/scoring`) documents the formula — so a standing driven by dispatch credit no longer looks unexplained (ADR-032).

### Changed

- The Math **Showcase** now features the genuinely hardest proofs and its cards open a **proof-detail page**. It previously ranked difficulty from the telemetry-only `goal_effort` slice — almost all difficulty-1 template proofs — so the board padded with trivia while the 500+ hard proved proofs (mostly archived, no run telemetry) stayed invisible. It now ranks the whole proved corpus (active + archived) by each goal's recorded difficulty, read from the snapshot's goal records, with an elite difficulty-4 floor. Each card links to a new `/math/proofs/[goal]` page showing the original target (with a GitHub link to the goal record), the credited solver, difficulty/status, and run telemetry when available. See [ADR-033](docs/adrs/ADR-033-Showcase-Hardest-Proofs-And-Proof-Detail.md).

### Fixed

- Fixed a `/math/leaderboard` **500** (`Cannot read properties of null (reading 'slice')`) when a contributor in `leaderboard-ui.json` has a null GitHub handle. Provenance — and therefore a solver handle — is optional by design on the unsorry side, so a contributor inferred from a handle-less git author (e.g. a bot/placeholder identity) can legitimately have `github: null`. The board now treats `github` as nullable end-to-end: the mapper gives handle-less rows a display-name fallback and no GitHub-derived avatar/profile URL with a null-safe tie-break (handled contributors rank ahead at equal score); `global-leaderboard.tsx` renders such a row unlinked with display-name initials instead of dereferencing the handle; and the contributor-profile lookup + top-contributor chart hrefs are null-guarded. The durable fix is independent of the upstream data correction (agenticsnz/unsorry#6975/#6976). (#43)
- Fixed the proofs-over-time cumulative line to render as a **step** (`stepped: 'after'`) instead of a tensioned curve. A cumulative count is a step function, so a no-proof stretch now reads as *flat-then-jump* ("no growth, then resumed") rather than a smooth curve implying steady growth across periods where nothing was proved. Mirrors the unsorry-side SVG fix (ADR-111 follow-up).

## [2.2.1] - 2026-06-23

### Fixed

- The leaderboard, proofs-over-time, sourcing, summary, queue, and model registry now read **raw-git first** (`raw.githubusercontent.com/agenticsnz/unsorry/main`) instead of the GitHub Pages mirror, with the guild cache cut to 60s (ADR-031). During bursts of proof merges, GitHub Pages can fall **hours** behind `main` (its build queue backs up), which made the board look frozen even as solves landed — e.g. it sat at `2026-06-22 23:00` / 2881 proofs while `main` was already at 3016. Raw-git tracks `main` within minutes, so new proofs now show up in about a minute; Pages remains the fallback.

## [2.2.0] - 2026-06-22

### Added

- The model page's **Swarm contributor** now shows the contributor's GitHub avatar as a small icon beside the handle. (ADR-027)
- Model pages now show **provenance**: a "Named by" line linking to the Pokémon/model that named this one (the swarm research agent, e.g. *Alakazam — claude / opus*), and the **swarm contributor** who ran the naming task, linking to their contributor profile. Reads the enriched `provenance` (`assigned_with`, `contributor`) the swarm now records upstream ([ADR-083](https://github.com/agenticsnz/unsorry)). (ADR-027 / SPEC-027-A)

### Changed

- Adopted the **`changelog.d/` one-file-per-change fragment** workflow (ADR-028 / SPEC-028-A), aligning with the upstream unsorry repo (its ADR-040). User-facing changes now ship a `changelog.d/<category>-<slug>.md` fragment instead of editing `CHANGELOG.md`'s `[Unreleased]` section directly, so concurrent PRs no longer conflict on the changelog. A small Node tool (`scripts/changelog.mjs`, run via `npm run changelog:preview` / `npm run changelog:release`) folds the fragments into a dated version section at release time. Pure fold/render logic is unit-tested.
- Model pages now show a **larger hero Pokémon sprite** (160px), and the "Named by" line renders the naming model's Pokémon with a **leaderboard-sized icon** (28px) beside its name instead of a tiny one. (ADR-027)
- The model → Pokémon registry is now refetched every **60s** (was 600s), so a model the swarm just named shows up on the leaderboard and its model page within about a minute. The other upstream artifacts keep the 10-minute cadence. (ADR-027)

### Fixed

- The **Proofs over time** chart's *merge* basis now labels each (hourly) point with its **date and hour** (e.g. `2026-06-22 03:00`) instead of a bare date (ADR-030). Because the upstream series is bucketed hourly but every point was labelled with just its date, the latest still-filling hour read as the whole day — `2026-06-22` looked like ~5 proofs when ~62 had merged. The hourly cadence is preserved (one bar per hour) and the current hour now reads clearly as an hour; the header's cumulative total and the cumulative line give the running/day totals. The date-only *solve* basis is unchanged.

## [2.1.0] - 2026-06-22

### Added
- **Pokémon model identities & individual model pages.** Each model in the Leaderboard's *Model
  distribution* now shows its front-default Pokémon sprite and name (assigned by the unsorry swarm —
  upstream [ADR-083](https://github.com/agenticsnz/unsorry)) and links to a new `/math/models/[slug]`
  page, modelled on the contributor page: the rationale for the Pokémon, the model's research
  profile (open/closed source, publisher, country, parameters, licence, canonical Hugging Face /
  website link) and its proof performance. Read from the upstream `model-registry.json` artifact via
  the existing fetch contract; a model the swarm hasn't named yet renders normally (no sprite/link).
  The contributor page's `Stat` box was extracted into a shared component. (ADR-027 / SPEC-027-A)

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
