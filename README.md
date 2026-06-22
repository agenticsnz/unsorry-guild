# unsorry-guild

> An engagement layer for the [unsorry](https://github.com/agenticsnz/unsorry) theorem-proving swarm.

unsorry-guild presents unsorry's proof **goals** and ranks the contributors who discharge them, to
pull swarm effort toward specified targets. It is a public, read-only site: **git is the source of
truth** — the guild reads unsorry's raw git records and recomputes standings on read. The only
authenticated role is a single **admin** who curates goals.

It is a fork of [cgbarlow/guild-hall](https://github.com/cgbarlow/guild-hall), re-scoped for unsorry
(see [ADR-014](docs/adrs/ADR-014-Fork-Rescope.md)). Design + decision log:
[agenticsnz/unsorry-guild#1](https://github.com/agenticsnz/unsorry-guild/issues/1).

## What's here

| Surface | Route | Source |
|---------|-------|--------|
| **Landing** | `/` | hero + live summary + proofs-over-time chart |
| **Global leaderboard** | `/math/leaderboard` | recomputed from the git snapshot — ranked table, top-contributor bar chart, interactive proofs-over-time, model breakdown (each model with its swarm-assigned Pokémon), sourcing |
| **Goals** (flagship targets) | `/math/goals`, `/math/goals/[targetId]` | progress + per-target leaderboard + podium, attributed live from `library/index/*.aisp`; hover a card to copy its goal id |
| **Contributor profiles** | `/math/contributors/[handle]` | global standing + git-derived goal badges |
| **Model pages** | `/math/models/[slug]` | each model's Pokémon identity, research profile (open/closed source, publisher, country, parameters, licence, canonical link) and proof performance, from the upstream `model-registry.json` ([ADR-027](docs/adrs/ADR-027-Model-Pages-And-Pokemon.md)) |
| **Showcase** | `/math/showcase` | native difficulty-ranked proof cards |
| **Proof graph** | `/math/proof-graph` | native interactive force-directed contributors↔goals graph |
| **Queue** | `/math/queue` | live proving queue (per-goal work, models, state) from `queue.json` |
| **Admin console** | `/gm/prizes` | create goals, open seasons, confirm podiums (Supabase overlay) |

A **goal target** is a headline goal id plus its decomposition subtree (suffix convention
`<headline>-sN`). Contributors are ranked by difficulty-weighted discharge of that subtree
(`difficulty_points*100 + credited_proofs*25`), with equal scores tied; the season closes when the
headline goal is proved, and an admin confirms the 1st/2nd/3rd podium plus contributor badges.
(The route renamed Prizes → Goals in 2.0.0; `/math/prizes` redirects. Supabase/admin code keeps the
internal `prize` naming — see [ADR-022](docs/adrs/ADR-022-Goals-Rename.md).)

## Architecture

- **git = source of truth, recomputed on read.** A single authenticated ~3 MB tarball snapshot of
  the unsorry repo (cached ~90 s) is parsed into the raw AISP records (`library/index`, `goals`,
  `proof-runs`), from which the leaderboard, attribution, models, and timelines are derived
  ([`src/lib/unsorry/`](src/lib/unsorry/), [ADR-024](docs/adrs/ADR-024-Recompute-From-Git.md)). When
  `GITHUB_TOKEN` is absent it falls back to unsorry's baked `docs/metrics/*.json`
  ([ADR-015](docs/adrs/ADR-015-Unsorry-Data-Source.md)).
- **Interactive charts** with Chart.js ([ADR-023](docs/adrs/ADR-023-Charting-Library.md)); the
  proof graph uses `react-force-graph-2d` ([ADR-025](docs/adrs/ADR-025-Native-Pages.md)).
- **Generated images**: the social preview and the upstream README images are rendered from the live
  proofs-over-time / leaderboard via `next/og` ([ADR-026](docs/adrs/ADR-026-Generated-Images.md)).
- **Slim Supabase overlay** holds only guild-authored config (prizes, seasons, awards). The app runs
  read-only **without** Supabase via a typed config fallback (`src/lib/prizes/config.ts`).
- **Admin-only auth** ([ADR-016](docs/adrs/ADR-016-Admin-Only-Auth.md)); everything else is public.
  The admin nav is scoped to goal curation (SPEC-016-B).
- **Dark theme** by default, toggle retained ([ADR-020](docs/adrs/ADR-020-Default-Theme-Dark.md));
  mobile hamburger nav.

## Getting started

### Prerequisites
- Node.js 20+ and npm
- (Optional) a read-only `GITHUB_TOKEN` for the live snapshot, and a
  [Supabase](https://supabase.com) project for the admin console — the public site runs without
  either (it falls back to baked artifacts and a config-only goal list).

### Setup
```bash
git clone https://github.com/agenticsnz/unsorry-guild.git
cd unsorry-guild
npm install
cp .env.example .env.local   # all vars optional for the public, read-only site
npm run dev                  # http://localhost:3000
```

Environment variables (all optional):
- `GITHUB_TOKEN` — read-only token (fine-grained: Contents:Read on `agenticsnz/unsorry`) enabling the
  fresh git-snapshot data layer. Server-side only. Without it, the app uses the baked artifacts.
- `NEXT_PUBLIC_UNSORRY_BASE_URL` — override the unsorry data base (default `https://unsorry.agentics.org.nz/docs`).
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` — enable the admin overlay; `npx supabase db push` applies the `domains`/`prizes`/`prize_seasons`/`prize_awards` migrations.

### Checks
```bash
npm test            # vitest
npm run type-check   # tsc --noEmit
npm run lint         # eslint
npm run build        # next build
```

## Engineering protocols

This project follows [`protocols.md`](protocols.md): TDD, ADRs (`docs/adrs/`) + SPECs
(`docs/specs/`), feature branches, [CHANGELOG](CHANGELOG.md) + SemVer, production-ready code only,
and DRY.

## Tech stack

Next.js 15 (App Router) · React 18 · TypeScript · Chart.js + react-chartjs-2 · react-force-graph-2d ·
`next/og` · Supabase (overlay) · Tailwind CSS · shadcn/ui + Radix · TanStack Query · Vitest. Deploys
to Netlify (`swarm.unsorry.agentics.org.nz`).

## Acknowledgments

Forked from [Guild Hall](https://github.com/cgbarlow/guild-hall) by Chris Barlow.
