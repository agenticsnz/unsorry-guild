import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { parseGoal, parseProof } from '@/lib/unsorry/snapshot-parse'

const here = dirname(fileURLToPath(import.meta.url))
const fixture = (n: string) => readFileSync(join(here, '../../mocks/aisp', n), 'utf8')

describe('parseProof (library/index/*.aisp)', () => {
  it('extracts goal, solver and name from a real record', () => {
    expect(parseProof(fixture('library-index.sample.aisp'))).toEqual({
      goal: 'gpow-sum-two-pow-nineteen',
      solver: 'ohdearquant',
      name: 'gpow_sum_two_pow_nineteen',
    })
  })

  it('captures a proof with no explicit solver (inferred attribution)', () => {
    const rec = '⟦Ω:Lemma⟧{sha≜abc; goal≜g-inferred; name≜g_inferred}'
    expect(parseProof(rec)).toEqual({ goal: 'g-inferred', solver: undefined, name: 'g_inferred' })
  })

  it('treats the ∅ none-sentinel solver as no solver', () => {
    expect(parseProof('⟦Ω:Lemma⟧{goal≜g; name≜g}\n⟦Π⟧{solver≜∅}')?.solver).toBeUndefined()
  })

  it('returns null when there is no goal', () => {
    expect(parseProof('garbage')).toBeNull()
  })
})

describe('parseGoal (goals/*.aisp)', () => {
  it('extracts id, difficulty and status from a real goal record', () => {
    expect(parseGoal(fixture('goal.sample.aisp'))).toEqual({
      goal: 'abc-nine-le-sum-times-pairsum',
      difficulty: 3,
      status: 'archived',
    })
  })

  it('defaults a missing/non-numeric difficulty to 0 and status to unknown', () => {
    expect(parseGoal('⟦Ω:Goal⟧{id≜g7}')).toEqual({ goal: 'g7', difficulty: 0, status: 'unknown' })
  })

  it('returns null when there is no goal id', () => {
    expect(parseGoal('garbage')).toBeNull()
  })
})
