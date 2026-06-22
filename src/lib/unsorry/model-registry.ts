import { fetchModelRegistry } from './fetchers'
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
export async function getModelProfile(
  slug: string,
): Promise<{ entry: ModelRegistryEntry; stat: ModelStat | null } | null> {
  const [reg, extras] = await Promise.all([getModelRegistry(), getLeaderboardExtras()])
  const entry = reg.models.find((e) => e.slug === slug)
  if (!entry) return null
  const stat = extras.models.find((m) => m.provider_model === entry.provider_model) ?? null
  return { entry, stat }
}
