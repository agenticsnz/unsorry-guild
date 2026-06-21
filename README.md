# unsorry-guild

> An engagement layer for the [unsorry](https://github.com/agenticsnz/unsorry) theorem-proving swarm.

unsorry-guild presents unsorry's proof goals as **prizes** and ranks the contributors who
discharge them, to pull swarm effort toward specified targets. It is a public, read-only site:
**git is the source of truth** — the guild reads unsorry's git-published artifacts and computes
standings on the fly. The only authenticated role is a single **admin** who curates prizes.

It is a fork of [cgbarlow/guild-hall](https://github.com/cgbarlow/guild-hall), re-scoped for unsorry
(see [ADR-014](docs/adrs/ADR-014-Fork-Rescope.md)). Design + decision log:
[agenticsnz/unsorry-guild#1](https://github.com/agenticsnz/unsorry-guild/issues/1).

## What's here

| Surface | Route | Source |
|---------|-------|--------|
| **Global leaderboard** | `/math/leaderboard` | unsorry `leaderboard-ui.json`, keyed on GitHub handle |
| **Prizes** (flagship targets) | `/math/prizes`, `/math/prizes/[targetId]` | progress + per-target leaderboard + podium, attributed live from `library/index/*.aisp` |
| **Contributor profiles** | `/math/contributors/[handle]` | global standing + git-derived prize badges |
| **Showcase / Proof graph / Queue** | `/math/showcase`, `/math/proof-graph`, `/math/queue` | unsorry `showcase.html` / `proof-graph.svg` / `queue.json` |
| **Admin console** | `/gm/prizes` | create prizes, open seasons, confirm podiums (Supabase overlay) |

A **prize** is a flagship target — a headline goal id plus its decomposition subtree (suffix
convention `<headline>-sN`). Contributors are ranked by difficulty-weighted discharge of that
subtree (`difficulty_points*100 + credited_proofs*25`); the season closes when the headline goal is
proved, and an admin confirms the 1st/2nd/3rd podium plus contributor badges.

## Architecture

- **git = source of truth.** Proof/contributor data is read from unsorry's artifacts
  (`docs/metrics/*.json`, `library/index/*.aisp`, `goals/*.aisp`) — see
  [`src/lib/unsorry/`](src/lib/unsorry/) and [ADR-015](docs/adrs/ADR-015-Unsorry-Data-Source.md).
- **Slim Supabase overlay** holds only guild-authored config (prizes, seasons, awards). The app
  runs read-only **without** Supabase via a typed config fallback (`src/lib/prizes/config.ts`).
- **Admin-only auth** ([ADR-016](docs/adrs/ADR-016-Admin-Only-Auth.md)); everything else is public.
- **Dark theme** by default, toggle retained ([ADR-020](docs/adrs/ADR-020-Default-Theme-Dark.md)).

## Getting started

### Prerequisites
- Node.js 20+ and npm
- (Optional) a [Supabase](https://supabase.com) project — only needed for the admin prize console;
  the public site runs without it.

### Setup
```bash
git clone https://github.com/agenticsnz/unsorry-guild.git
cd unsorry-guild
npm install
cp .env.example .env.local   # all vars optional for the public, read-only site
npm run dev                  # http://localhost:3000  → redirects to /math
```

Environment variables (all optional):
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

Next.js 15 (App Router) · React 18 · TypeScript · Supabase (overlay) · Tailwind CSS · shadcn/ui +
Radix · TanStack Query · Vitest. Deploys to Netlify (`swarm.unsorry.agentics.org.nz`).

## Acknowledgments

Forked from [Guild Hall](https://github.com/cgbarlow/guild-hall) by Chris Barlow.
