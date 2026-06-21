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

### Changed
- Default theme is now **dark** (was `warm`); the light/warm/system toggle is retained (ADR-020, SPEC-008).
- **Auth stripped to admin-only**: only `/gm` is gated (admin/gm role); everything else is public read-only. `signIn`→`/gm`, `signOut`→`/math`; the login form is now admin email/password only (ADR-016, SPEC-016-A).

### Removed
- Public sign-up (`/register`) and password-reset (`/reset-password`) routes.
