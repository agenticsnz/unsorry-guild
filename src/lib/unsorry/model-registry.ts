import { fetchModelRegistry } from './fetchers'
import { loadSnapshot } from './snapshot'
import { deriveContributorModels, type ContributorModelUsage } from './derive'
import { getLeaderboardExtras } from './standings'
import type {
  ModelRegistry,
  ModelRegistryEntry,
  ModelStat,
  ModelWithRegistry,
} from './types'

/**
 * Read-only consumption of the swarm-maintained model → Pokémon registry
 * (`docs/metrics/model-registry.json`, ADR-083 upstream / guild ADR-027).
 *
 * Every getter is total: it degrades to "no Pokémon yet" rather than throwing,
 * so the leaderboard renders even before the swarm has named a model.
 */

/** Fetch the registry, returning an empty one on any failure. */
export async function getModelRegistry(): Promise<ModelRegistry> {
  try {
    const reg = await fetchModelRegistry()
    return { ...reg, models: reg.models ?? [] }
  } catch {
    return { models: [] }
  }
}

/** Registry entries keyed by their exact `provider_model` join key. */
export async function getModelRegistryMap(): Promise<Map<string, ModelRegistryEntry>> {
  const reg = await getModelRegistry()
  return new Map(reg.models.map((entry) => [entry.provider_model, entry]))
}

/** Join distribution rows with their Pokémon identity, preserving order. */
export function joinModels(
  models: ModelStat[],
  registry: Map<string, ModelRegistryEntry>,
): ModelWithRegistry[] {
  return models.map((m) => {
    const entry = registry.get(m.provider_model)
    return entry ? { ...m, registry: entry } : { ...m }
  })
}

/**
 * Resolve a model page by slug: its registry entry plus the matching
 * distribution stats (or null stats if the model has no proofs recorded).
 * Returns null when no model carries that slug.
 */
export async function getModelProfile(slug: string): Promise<{
  entry: ModelRegistryEntry
  stat: ModelStat | null
  /** The registry entry for the model that named this one (if it too is named). */
  namedBy: ModelRegistryEntry | null
} | null> {
  const [reg, extras] = await Promise.all([getModelRegistry(), getLeaderboardExtras()])
  const entry = reg.models.find((e) => e.slug === slug)
  if (!entry) return null
  const stat = extras.models.find((m) => m.provider_model === entry.provider_model) ?? null
  const namedBy =
    reg.models.find((e) => e.provider_model === entry.provenance.assigned_with) ?? null
  return { entry, stat, namedBy }
}

/** A contributor's model-usage row joined with its Pokémon identity (if named). */
export interface ContributorModelRow extends ContributorModelUsage {
  registry?: ModelRegistryEntry
}

/** A contributor's "favourite models": the engines behind their verified proofs,
 *  joined to the Pokémon registry for sprites, plus the proof total they sum to. */
export interface ContributorModels {
  rows: ContributorModelRow[]
  /** Total attributed proofs across all rows — the share denominator. */
  total: number
}

/**
 * The engines a contributor's verified proofs were discharged by, ranked by proof
 * count and joined to the model→Pokémon registry. Total: degrades to an empty
 * breakdown (no snapshot ⇒ no per-proof provenance) rather than throwing, so the
 * profile renders even without a `GITHUB_TOKEN`.
 */
export async function getContributorModels(handle: string): Promise<ContributorModels> {
  try {
    const snap = await loadSnapshot()
    if (!snap) return { rows: [], total: 0 }
    const usage = deriveContributorModels(snap, handle)
    const registry = await getModelRegistryMap()
    const rows = usage.map((u) => ({ ...u, registry: registry.get(u.providerModel) }))
    const total = rows.reduce((sum, r) => sum + r.proofs, 0)
    return { rows, total }
  } catch {
    return { rows: [], total: 0 }
  }
}
