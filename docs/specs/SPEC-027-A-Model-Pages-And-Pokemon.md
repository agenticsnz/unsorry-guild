# SPEC-027-A: Model Pages & Pokémon Identities

Implements **[ADR-027](../adrs/ADR-027-Model-Pages-And-Pokemon.md)**. Living document.

## 1. Source artifact

`docs/metrics/model-registry.json`, published by agenticsnz/unsorry (ADR-083) and served at
`${UNSORRY_BASE_URL}/metrics/model-registry.json` with the raw-GitHub fallback. Shape consumed:

```ts
interface ModelRegistryEntry {
  provider_model: string            // exact join key to ModelStat.provider_model
  slug: string                      // /math/models/[slug] route key
  pokemon: { name; dex_id; sprite_url; description }
  research: { classification: 'open'|'closed'|'n/a'; publisher; country;
              parameter_size; license; canonical_url }
  profile: string                   // why this Pokémon represents this model
  provenance: { assigned_by; assigned_with; sources: string[]; assigned_at }
}
interface ModelRegistry { schema_version?; generated_at?; models: ModelRegistryEntry[] }
```

## 2. Data layer (`src/lib/unsorry/`)

- `fetchers.ts → fetchModelRegistry()` — `fetchJson(metricsUrl('model-registry.json'),
  rawMetricsUrl('model-registry.json'))`.
- `model-registry.ts` — **total** facade (degrades, never throws):
  - `getModelRegistry()` → `{ models: [] }` on failure.
  - `getModelRegistryMap()` → `Map<provider_model, entry>`.
  - `joinModels(models, map)` → `ModelWithRegistry[]` (pure; preserves order; unmatched models keep
    no `registry`).
  - `getModelProfile(slug)` → `{ entry, stat, namedBy } | null` — joins the registry entry with its
    `ModelStat` and resolves `namedBy` (the registry entry for `provenance.assigned_with`, the model
    that named this one, if it too is named).
- `types.ts` — `ModelPokemon`, `ModelResearch`, `ModelProvenance`, `ModelRegistryEntry`,
  `ModelRegistry`, `ModelWithRegistry extends ModelStat`.

## 3. UI

- **Model distribution** (`model-distribution.tsx`): each row shows the front-default sprite
  (`next/image`, `unoptimized`, pixelated, 28px) + `provider_model` + Pokémon name, wrapped in a
  `next/link` to `/math/models/<slug>`. A model without a registry entry renders as plain text (no
  sprite, no link). The leaderboard page joins via `getModelRegistryMap` + `joinModels` and passes
  `ModelWithRegistry[]` down through `LeaderboardTabs`.
- **Model page** (`/math/models/[slug]/page.tsx`, `force-dynamic`): header (96px sprite · Pokémon
  name · `provider_model` · canonical link); **Why \<Pokémon\>?** (profile + Pokédex description);
  **Model** (research facts); **Performance** (verified proofs · runs · success rate from the joined
  `ModelStat`, omitted when the model has no distribution row); **Provenance** (*Named by* — the
  `namedBy` Pokémon + model, linking to that model's page when it too is named; and the *swarm
  contributor* `provenance.contributor`, linking to `/math/contributors/<handle>`).
  `generateMetadata` titles the page. Unknown slug → `notFound()`.
- `src/components/ui/stat.tsx` — shared `Stat` box, extracted from the contributor page (DRY).

## 4. Image config

`next.config.js` already allows `https://**`, so the PokéAPI sprites host
(`raw.githubusercontent.com`) is permitted. `unoptimized` keeps the original sprite URL (no loader).

## 5. Tests (vitest)

- `src/tests/lib/unsorry/model-registry.test.ts` — facade: join (matched/unmatched/order), graceful
  degradation, `getModelProfile` (entry+stat / unknown slug / null stat).
- `src/tests/components/leaderboard/model-distribution.test.tsx` — sprite + link present; unnamed
  model is plain text; zero-proof models filtered; empty state.
- `src/tests/app/model-page.test.tsx` — renders profile/research/performance; omits performance with
  no stat; `notFound()` on unknown slug.
- `MODEL_REGISTRY_FIXTURE` in `src/tests/mocks/unsorry-fixtures.ts`.
