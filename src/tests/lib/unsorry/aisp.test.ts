import { describe, it, expect } from 'vitest'
import { parseAispFields, parseLibraryIndexRecord } from '@/lib/unsorry/aisp'
import { LIBRARY_INDEX_S1, LIBRARY_INDEX_S4S3S3, LIBRARY_INDEX_NO_SOLVER } from '@/tests/mocks/unsorry-fixtures'

describe('parseAispFields', () => {
  it('extracts key≜value pairs across blocks, stopping values at ; and }', () => {
    const f = parseAispFields(LIBRARY_INDEX_S1)
    expect(f.goal).toBe('sq-add-sq-eq-three-mul-sq-s1')
    expect(f.solver).toBe('cgbarlow')
    expect(f.name).toBe('int_sq_mod_three_eq_zero_or_one')
    expect(f.provider).toBe('claude')
    expect(f.effort).toBe('high')
  })

  it('returns the first value when a key repeats', () => {
    const f = parseAispFields('⟦A⟧{goal≜x}\n⟦B⟧{goal≜y}')
    expect(f.goal).toBe('x')
  })
})

describe('parseLibraryIndexRecord', () => {
  it('maps a verified proof to goal + solver', () => {
    expect(parseLibraryIndexRecord(LIBRARY_INDEX_S4S3S3)).toEqual({
      goal: 'sq-add-sq-eq-three-mul-sq-s4-s3-s3',
      solver: 'Rauxon',
      name: 'minimal_natAbs_sum_contradicts_strict_smaller',
    })
  })

  it('leaves solver undefined when absent', () => {
    const rec = parseLibraryIndexRecord(LIBRARY_INDEX_NO_SOLVER)
    expect(rec.goal).toBe('some-other-goal')
    expect(rec.solver).toBeUndefined()
  })
})
