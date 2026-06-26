import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { FavouriteModels } from '@/components/profile/favourite-models'
import type { ContributorModels } from '@/lib/unsorry/model-registry'
import type { ModelRegistryEntry } from '@/lib/unsorry/types'

const porygon = {
  provider_model: 'python / sympy',
  slug: 'python-sympy',
  pokemon: {
    name: 'Porygon',
    dex_id: 137,
    sprite_url: 'https://example.test/137.png',
    description: 'code',
  },
} as unknown as ModelRegistryEntry

const MODELS: ContributorModels = {
  rows: [
    { providerModel: 'python / sympy', proofs: 3, registry: porygon },
    { providerModel: 'openai / gpt', proofs: 1 }, // no registry entry → no sprite, no link
  ],
  total: 4,
}

describe('FavouriteModels', () => {
  it('lists each engine with its proof count and share of the total', () => {
    render(<FavouriteModels models={MODELS} />)
    const top = screen.getByText('python / sympy').closest('tr')!
    expect(within(top).getByText('3')).toBeInTheDocument()
    expect(within(top).getByText('75%')).toBeInTheDocument() // 3 / 4
    // total row
    const totalRow = screen.getByText('Attributed proofs').closest('tr')!
    expect(within(totalRow).getByText('4')).toBeInTheDocument()
  })

  it('links a named engine to its Pokémon page and shows the sprite', () => {
    render(<FavouriteModels models={MODELS} />)
    const link = screen.getByRole('link', { name: /python \/ sympy/i })
    expect(link).toHaveAttribute('href', '/math/models/python-sympy')
    expect(screen.getByAltText('Porygon')).toBeInTheDocument()
  })

  it('renders an unnamed engine without a link', () => {
    render(<FavouriteModels models={MODELS} />)
    expect(screen.queryByRole('link', { name: /openai \/ gpt/i })).toBeNull()
    expect(screen.getByText('openai / gpt')).toBeInTheDocument()
  })

  it('shows a friendly note when there is no model provenance', () => {
    render(<FavouriteModels models={{ rows: [], total: 0 }} />)
    expect(screen.getByText(/no per-proof model provenance/i)).toBeInTheDocument()
  })
})
