# SPEC-034-A: Contributor "Favourite Models"

Implements: [ADR-034](../adrs/ADR-034-Contributor-Favourite-Models.md) · Status: Living · Updated: 2026-06-25

## Problem

The contributor profile explains *how many* points a standing is worth (ADR-032 score breakdown) but not *what produced the proofs*. Every `library/index/*.aisp` record already carries `⟦Π:Provenance⟧{provider, model}`, and the guild already maps `provider / model → Pokémon` (ADR-027); they were just never joined to the contributor who earned the score.

## Data layer

### Snapshot parse (`snapshot-parse.ts`)

`SnapshotProof` gains optional `provider`, `model`. `parseProof` extracts `f.provider` / `f.model`, mapping the `∅` none-sentinel (and absence) to `undefined` — identical handling to `solver`. The verified-proof tarball pass (`snapshot.ts`) is unchanged; the extra fields ride the records it already parses.

### Derivation (`derive.ts`)

```ts
interface ContributorModelUsage { providerModel: string; proofs: number }
deriveContributorModels(s: UnsorrySnapshot, handle: string): ContributorModelUsage[]
```

- Filter to proofs whose `solver` equals `handle` (case-insensitive).
- Dedupe per `goal` across `[...archivedProofs, ...proofs]` — **active provenance wins** a re-proved goal (last-write, mirroring `deriveShowcaseSolverMap`).
- Group survivors by `` `${provider} / ${model || 'unknown'}` `` — the exact key `generate.py` builds the model distribution with, so rows join to the registry. Records with **no `provider`** are skipped (cannot attribute an engine).
- Sort by `proofs` desc, then `providerModel` asc.

### Facade (`model-registry.ts`)

```ts
interface ContributorModelRow extends ContributorModelUsage { registry?: ModelRegistryEntry }
interface ContributorModels { rows: ContributorModelRow[]; total: number }
getContributorModels(handle: string): Promise<ContributorModels>
```

Total/degrading: loads the snapshot (null ⇒ `{ rows: [], total: 0 }`), derives usage, joins each row to `getModelRegistryMap()`, and sums `proofs` into `total`. Never throws.

## UI

### Component (`components/profile/favourite-models.tsx`)

Presentational table (Server-Component-safe). Columns: **Model** (Pokémon sprite via `next/image unoptimized` + `provider / model` mono + Pokémon name; whole label links to `/math/models/[slug]` when a registry entry exists, plain otherwise), **Proofs** (`toLocaleString`), **Share** (`proofs / total`, rounded). A bold **Attributed proofs** total row (100%). Empty `rows` ⇒ a "no per-proof model provenance recorded yet" note. Footnote discloses that engine-less (inferred/pre-logging) proofs aren't counted, so the total may be below credited proofs.

### Page (`/math/contributors/[handle]/page.tsx`)

When `global` exists, `await getContributorModels(global.github)`. Render a **Favourite models** `<section>` (intro line + `<FavouriteModels>`) immediately after **Score breakdown**, only when `models.rows.length > 0` (omit entirely when there's no snapshot/provenance).

## Tests (vitest)

- `snapshot-parse.test.ts` — `parseProof` now returns `provider`/`model`; `∅` sentinel → undefined.
- `derive.test.ts` — `deriveContributorModels`: ranking, per-goal dedup (active wins), `unknown` model, case-insensitive handle, engine-less + other-solver exclusion, empty.
- `components/profile/favourite-models.test.tsx` — counts + share, named-engine sprite/link, unnamed engine has no link, empty-state note.

## Out of scope (follow-ups)

Crediting engines on inferred-attribution proofs (would need per-proof git provenance, same gap as the Showcase); time-series of a contributor's engine mix; surfacing per-engine difficulty points (only proof counts today).
