import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ModelDistribution } from '@/components/leaderboard/model-distribution'
import { joinModels } from '@/lib/unsorry/model-registry'
import { MODELS_FIXTURE, MODEL_REGISTRY_FIXTURE } from '@/tests/mocks/unsorry-fixtures'

function joined() {
  const map = new Map(MODEL_REGISTRY_FIXTURE.models.map((e) => [e.provider_model, e]))
  return joinModels(MODELS_FIXTURE, map)
}

describe('ModelDistribution', () => {
  it('shows a Pokémon sprite and name linking to the model page', () => {
    render(<ModelDistribution models={joined()} />)

    // claude / opus → Alakazam, linked to /math/models/claude-opus
    const link = screen.getByRole('link', { name: /claude \/ opus/ })
    expect(link).toHaveAttribute('href', '/math/models/claude-opus')
    expect(screen.getByAltText('Alakazam')).toBeInTheDocument()
    expect(screen.getByText('Alakazam')).toBeInTheDocument()

    // python / sympy → Metagross
    expect(screen.getByRole('link', { name: /python \/ sympy/ })).toHaveAttribute(
      'href',
      '/math/models/python-sympy',
    )
    expect(screen.getByAltText('Metagross')).toBeInTheDocument()
  })

  it('renders unnamed models as plain text (no link, no sprite)', () => {
    render(<ModelDistribution models={joined()} />)
    // lean / decide is in the distribution (283 proofs) but unnamed in the fixture
    const leanLabel = screen.getByText('lean / decide')
    expect(leanLabel.closest('a')).toBeNull()
  })

  it('filters out models with zero verified proofs', () => {
    render(<ModelDistribution models={joined()} />)
    expect(screen.queryByText('zero / proofs')).not.toBeInTheDocument()
  })

  it('shows an empty state with no models', () => {
    render(<ModelDistribution models={[]} />)
    expect(screen.getByText(/no model data/i)).toBeInTheDocument()
  })
})
