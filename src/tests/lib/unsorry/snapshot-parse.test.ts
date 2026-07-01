import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import {
  archivePackageOf,
  parseGoal,
  parseProof,
  parseDecomposition,
  decompositionMap,
  decompositionFor,
} from '@/lib/unsorry/snapshot-parse'
import type { Decomposition } from '@/lib/unsorry/types'

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

describe('parseDecomposition (decompositions/*.aisp)', () => {
  it('extracts parent, agent and the ordered subs from a real record', () => {
    expect(parseDecomposition(fixture('decomposition.sample.aisp'))).toEqual({
      parent: 'sq-add-sq-eq-three-mul-sq',
      agent: 'oma-2-c50d',
      subs: [
        'sq-add-sq-eq-three-mul-sq-s1',
        'three-not-sum-of-two-squares',
        'sq-add-sq-eq-three-mul-sq-s3',
      ],
    })
  })

  it('extracts sub ids from the ⟨id≜…⟩ values, independent of the -sN suffix', () => {
    // The middle sub is a curated name with no `-sN` suffix; it must still be
    // captured (the source is the authoritative record, not the id scheme).
    const subs = parseDecomposition(fixture('decomposition.sample.aisp'))?.subs
    expect(subs).toContain('three-not-sum-of-two-squares')
    expect(subs?.every((s) => /-s\d+$/.test(s))).toBe(false)
  })

  it('parses a single-line record and preserves sub order', () => {
    const rec =
      '⟦Ω:Decomp⟧{parent≜putnam-v1-suite;agent≜trishullab}\n' +
      '⟦Σ:Subs⟧{sub₁≜⟨id≜putnam-1962-a1,sha≜aa⟩;sub₂≜⟨id≜putnam-1962-a2,sha≜bb⟩}'
    expect(parseDecomposition(rec)).toEqual({
      parent: 'putnam-v1-suite',
      agent: 'trishullab',
      subs: ['putnam-1962-a1', 'putnam-1962-a2'],
    })
  })

  it('leaves agent undefined when the record omits it', () => {
    const rec = '⟦Ω:Decomp⟧{parent≜p}\n⟦Σ:Subs⟧{sub₁≜⟨id≜c1,sha≜aa⟩}'
    expect(parseDecomposition(rec)).toEqual({ parent: 'p', subs: ['c1'] })
  })

  it('returns null when there is no parent', () => {
    expect(parseDecomposition('⟦Σ:Subs⟧{sub₁≜⟨id≜c1⟩}')).toBeNull()
  })

  it('returns null when there are no subs', () => {
    expect(parseDecomposition('⟦Ω:Decomp⟧{parent≜p}')).toBeNull()
  })
})

describe('decompositionMap / decompositionFor', () => {
  const decompositions: Decomposition[] = [
    { parent: 'p1', subs: ['p1-s1', 'curated-a'], agent: 'agent-x' },
    { parent: 'p2', subs: ['p2-s1'] },
  ]

  it('builds an O(1) parent→decomposition lookup', () => {
    const map = decompositionMap(decompositions)
    expect(map.get('p1')?.subs).toEqual(['p1-s1', 'curated-a'])
    expect(map.get('p2')?.subs).toEqual(['p2-s1'])
    expect(map.get('nope')).toBeUndefined()
  })

  it('decompositionFor returns the decomposition for a parent and undefined otherwise', () => {
    expect(decompositionFor(decompositions, 'p1')?.subs).toEqual(['p1-s1', 'curated-a'])
    expect(decompositionFor(decompositions, 'p1-s1')).toBeUndefined()
    expect(decompositionFor([], 'p1')).toBeUndefined()
  })

  it('an empty (goals-only) snapshot yields an empty decomposition map', () => {
    expect(decompositionMap([]).size).toBe(0)
  })
})
