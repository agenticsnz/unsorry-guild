import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { notFound } from 'next/navigation'
import ModelPage from '@/app/(public)/math/models/[slug]/page'
import { MODELS_FIXTURE, MODEL_REGISTRY_FIXTURE } from '@/tests/mocks/unsorry-fixtures'

const getModelProfile = vi.fn()
vi.mock('@/lib/unsorry/model-registry', () => ({
  getModelProfile: (slug: string) => getModelProfile(slug),
}))

beforeEach(() => getModelProfile.mockReset())

describe('ModelPage', () => {
  it('renders the Pokémon, the rationale, research facts and performance', async () => {
    getModelProfile.mockResolvedValue({
      entry: MODEL_REGISTRY_FIXTURE.models[0], // claude / opus → Alakazam, named by python / sympy
      stat: MODELS_FIXTURE.find((m) => m.provider_model === 'claude / opus') ?? null,
      namedBy: MODEL_REGISTRY_FIXTURE.models[1], // python / sympy → Metagross
    })
    render(await ModelPage({ params: Promise.resolve({ slug: 'claude-opus' }) }))

    expect(screen.getByRole('heading', { name: 'Alakazam' })).toBeInTheDocument()
    expect(screen.getByText(/supercomputer-grade intellect/)).toBeInTheDocument()
    expect(screen.getByText('Anthropic')).toBeInTheDocument()
    expect(screen.getByText('Closed source')).toBeInTheDocument()
    expect(screen.getByText('59')).toBeInTheDocument() // verified proofs
    const link = screen.getByRole('link', { name: /anthropic\.com/ })
    expect(link).toHaveAttribute('href', 'https://www.anthropic.com/claude')

    // Provenance: named by Metagross (python / sympy), contributor cgbarlow
    const namedByLink = screen.getByRole('link', { name: /Metagross/ })
    expect(namedByLink).toHaveAttribute('href', '/math/models/python-sympy')
    const contributorLink = screen.getByRole('link', { name: '@cgbarlow' })
    expect(contributorLink).toHaveAttribute('href', '/math/contributors/cgbarlow')
  })

  it('omits the performance section when the model has no distribution row', async () => {
    getModelProfile.mockResolvedValue({
      entry: MODEL_REGISTRY_FIXTURE.models[1],
      stat: null,
      namedBy: MODEL_REGISTRY_FIXTURE.models[0],
    })
    render(await ModelPage({ params: Promise.resolve({ slug: 'python-sympy' }) }))
    expect(screen.queryByText('Performance')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Metagross' })).toBeInTheDocument()
  })

  it('calls notFound() for an unknown slug', async () => {
    getModelProfile.mockResolvedValue(null)
    vi.mocked(notFound).mockImplementation(() => {
      throw new Error('NEXT_NOT_FOUND')
    })
    await expect(
      ModelPage({ params: Promise.resolve({ slug: 'missingno' }) }),
    ).rejects.toThrow('NEXT_NOT_FOUND')
  })
})
