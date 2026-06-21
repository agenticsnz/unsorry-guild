import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { parseProof, parseGoal, parseRun } from '@/lib/unsorry/snapshot-parse'

const here = dirname(fileURLToPath(import.meta.url))
const fixture = (n: string) => readFileSync(join(here, '../../mocks/aisp', n), 'utf8')

describe('parseProof (library/index/*.aisp)', () => {
  it('extracts goal, solver, name, provider/model and date from a real record', () => {
    expect(parseProof(fixture('library-index.sample.aisp'))).toEqual({
      goal: 'gpow-sum-two-pow-nineteen',
      solver: 'ohdearquant',
      name: 'gpow_sum_two_pow_nineteen',
      providerModel: 'python / sympy',
      date: '2026-06-19',
    })
  })

  it('returns null when there is no solver/goal', () => {
    expect(parseProof('garbage')).toBeNull()
  })
})

describe('parseGoal (goals/*.aisp)', () => {
  it('extracts goal id, status and integer difficulty from a real record', () => {
    expect(parseGoal(fixture('goal.sample.aisp'))).toEqual({
      goal: 'abc-nine-le-sum-times-pairsum',
      status: 'archived',
      difficulty: 3,
    })
  })
})

describe('parseRun (proof-runs/*.aisp)', () => {
  it('extracts goal, solver, outcome, provider/model and ended from a real record', () => {
    const run = parseRun(fixture('proof-run.sample.aisp'))
    expect(run).toMatchObject({
      goal: 'abc-nine-le-sum-times-pairsum',
      solver: 'cgbarlow',
      outcome: 'failed',
      success: false,
      providerModel: 'openai / jackcloudman/Leanstral-2603-GGUF',
      ended: '2026-06-15T11:03:26Z',
    })
  })

  it('marks proved outcomes as success', () => {
    const run = parseRun('⟦Ω:Run⟧{goal≜g1; outcome≜proved}⟦Π:Provenance⟧{provider≜python; model≜sympy}')
    expect(run?.success).toBe(true)
  })
})
