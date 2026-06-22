import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MODELS_FIXTURE, MODEL_REGISTRY_FIXTURE } from '@/tests/mocks/unsorry-fixtures'

const fetchModelRegistry = vi.fn()
const getLeaderboardExtras = vi.fn()

vi.mock('@/lib/unsorry/fetchers', () => ({
  fetchModelRegistry: () => fetchModelRegistry(),
}))
vi.mock('@/lib/unsorry/standings', () => ({
  getLeaderboardExtras: () => getLeaderboardExtras(),
}))

import {
  joinModels,
  getModelRegistryMap,
  getModelProfile,
  getModelRegistry,
} from '@/lib/unsorry/model-registry'

beforeEach(() => {
  fetchModelRegistry.mockReset()
  getLeaderboardExtras.mockReset()
  fetchModelRegistry.mockResolvedValue(MODEL_REGISTRY_FIXTURE)
  getLeaderboardExtras.mockResolvedValue({
    models: MODELS_FIXTURE,
    timelines: null,
  })
})

describe('joinModels', () => {
  it('attaches the registry entry to matching models, in order', async () => {
    const map = await getModelRegistryMap()
    const joined = joinModels(MODELS_FIXTURE, map)
    expect(joined.map((m) => m.provider_model)).toEqual(
      MODELS_FIXTURE.map((m) => m.provider_model),
    )
    const opus = joined.find((m) => m.provider_model === 'claude / opus')
    expect(opus?.registry?.pokemon.name).toBe('Alakazam')
    expect(opus?.registry?.slug).toBe('claude-opus')
  })

  it('leaves unmatched models without a registry entry', () => {
    const joined = joinModels(MODELS_FIXTURE, new Map())
    expect(joined.every((m) => m.registry === undefined)).toBe(true)
    // preserves the ModelStat fields
    expect(joined[0].verified_proofs).toBe(MODELS_FIXTURE[0].verified_proofs)
  })
})

describe('getModelRegistry', () => {
  it('degrades to an empty registry when the fetch throws', async () => {
    fetchModelRegistry.mockRejectedValue(new Error('404'))
    expect(await getModelRegistry()).toEqual({ models: [] })
  })
})

describe('getModelProfile', () => {
  it('resolves a slug to its entry plus distribution stats', async () => {
    const profile = await getModelProfile('claude-opus')
    expect(profile?.entry.pokemon.name).toBe('Alakazam')
    expect(profile?.stat?.verified_proofs).toBe(59)
  })

  it('returns null for an unknown slug', async () => {
    expect(await getModelProfile('missingno')).toBeNull()
  })

  it('returns a null stat when the model has no distribution row', async () => {
    getLeaderboardExtras.mockResolvedValue({ models: [], timelines: null })
    const profile = await getModelProfile('python-sympy')
    expect(profile?.entry.pokemon.name).toBe('Metagross')
    expect(profile?.stat).toBeNull()
  })
})
