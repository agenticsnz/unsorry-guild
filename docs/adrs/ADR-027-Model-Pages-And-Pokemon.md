# ADR-027: Model Pages & Pokémon Identities

| Field | Value |
|-------|-------|
| **Decision ID** | ADR-027 |
| **Initiative** | unsorry-guild — gamifying the model distribution (issue #20) |
| **Proposed By** | Development Team |
| **Date** | 2026-06-22 |
| **Status** | Accepted |

---

## WH(Y) Decision Statement

**In the context of** a Leaderboard whose "Model distribution" section lists each
`provider/model` as an anonymous bar with no identity and nowhere to click through to,

**facing** the ask (issue #20) to give every model a memorable Pokémon identity (sprite +
description + profile) shown beside it, linking to an individual model page modelled on the
contributor page,

**we decided for** consuming the swarm-maintained registry artifact
`docs/metrics/model-registry.json` (produced upstream by agenticsnz/unsorry ADR-083) **read-only**
through the existing fetch contract — joining it onto the `models[]` distribution by exact
`provider_model`, rendering the front-default PokéAPI sprite + name in `ModelDistribution`, and
adding a `/math/models/[slug]` route that reuses the contributor-page layout (profile · research ·
performance),

**and neglected** (a) hard-coding Pokémon identities in the guild (they belong with the swarm that
researches them, and would go stale); (b) calling PokéAPI live at render time (couples the page to a
third-party API per request and cannot carry the researched profile — the registry already carries
the resolved `sprite_url` + `description`); (c) building a guild-side pokedex dataset (the registry
entry is self-contained),

**to achieve** a gamified, clickable model distribution and per-model pages that always reflect what
the swarm has researched, with the guild staying a pure read-only consumer,

**accepting that** a model with no registry entry yet renders without a sprite/link until the swarm
names it (graceful), and that the registry artifact must be published upstream before the data
appears (it degrades to "no Pokémon yet" until then).

---

## Decision

- `src/lib/unsorry/types.ts` — `ModelRegistry`, `ModelRegistryEntry`, `ModelWithRegistry` types.
- `src/lib/unsorry/fetchers.ts` — `fetchModelRegistry()` (reuses `fetchJson` + `metricsUrl`/
  `rawMetricsUrl` fallback).
- `src/lib/unsorry/model-registry.ts` — total facade: `getModelRegistryMap`, `joinModels`,
  `getModelProfile` (degrade to empty/null, never throw).
- `src/components/leaderboard/model-distribution.tsx` — sprite + name beside each model, linking to
  `/math/models/[slug]`; unnamed models render as plain text.
- `src/app/(public)/math/models/[slug]/page.tsx` — model page (profile · research · performance),
  reusing the shared `Stat` box (`src/components/ui/stat.tsx`, extracted from the contributor page).

See [SPEC-027-A](../specs/SPEC-027-A-Model-Pages-And-Pokemon.md), upstream
[agenticsnz/unsorry ADR-083](https://github.com/agenticsnz/unsorry/blob/main/docs/adrs/ADR-083-Model-Pokemon-Registry-And-Operational-Tasks.md),
[ADR-024](./ADR-024-Recompute-From-Git.md).

## Consequences

- The Leaderboard model distribution is clickable, with Pokémon identities; new `/math/models/[slug]`
  pages render per request (`force-dynamic`).
- One new published artifact is consumed; no change to the leaderboard pipeline.
- The `Stat` box is now shared by the contributor and model pages (DRY).
