import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { archivePackageOf, parseGoal, parseProof } from '@/lib/unsorry/snapshot-parse'

const here = dirname(fileURLToPath(import.meta.url))
const fixture = (n: string) => readFileSync(join(here, '../../mocks/aisp', n), 'utf8')

describe('archivePackageOf', () => {
  it('extracts the archive package from an archived path', () => {
    expect(
      archivePackageOf('packages/unsorry-archive-0008/library/index/7112a44.aisp'),
    ).toBe('unsorry-archive-0008')
    expect(archivePackageOf('packages/unsorry-archive-0008/goals/realization-determines-counts.lean')).toBe(
      'unsorry-archive-0008',
    )
  })

  it('returns null for active (non-archive) paths', () => {
    expect(archivePackageOf('library/index/abc.aisp')).toBeNull()
    expect(archivePackageOf('goals/foo.lean')).toBeNull()
  })
})

describe('parseProof (library/index/*.aisp)', () => {
  it('extracts goal, solver, name, engine and the header day-stamp from a real record', () => {
    expect(parseProof(fixture('library-index.sample.aisp'))).toEqual({
      goal: 'gpow-sum-two-pow-nineteen',
      solver: 'ohdearquant',
      name: 'gpow_sum_two_pow_nineteen',
      provider: 'python',
      model: 'sympy',
      provedOn: '2026-06-19',
    })
  })

  it('leaves provedOn undefined when the record has no header day-stamp', () => {
    expect(parseProof('⟦Ω:Lemma⟧{goal≜g; name≜g}')?.provedOn).toBeUndefined()
  })

  it('captures a proof with no explicit solver (inferred attribution)', () => {
    const rec = '⟦Ω:Lemma⟧{sha≜abc; goal≜g-inferred; name≜g_inferred}'
    expect(parseProof(rec)).toEqual({
      goal: 'g-inferred',
      solver: undefined,
      name: 'g_inferred',
      provider: undefined,
      model: undefined,
    })
  })

  it('treats the ∅ none-sentinel solver as no solver', () => {
    expect(parseProof('⟦Ω:Lemma⟧{goal≜g; name≜g}\n⟦Π⟧{solver≜∅}')?.solver).toBeUndefined()
  })

  it('treats a ∅ provider/model sentinel as no engine', () => {
    const p = parseProof('⟦Ω:Lemma⟧{goal≜g; name≜g}\n⟦Π⟧{provider≜∅; model≜∅}')
    expect(p?.provider).toBeUndefined()
    expect(p?.model).toBeUndefined()
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
