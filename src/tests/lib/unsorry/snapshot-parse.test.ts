import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { parseProof } from '@/lib/unsorry/snapshot-parse'

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

  it('returns null when there is no solver/goal', () => {
    expect(parseProof('garbage')).toBeNull()
  })
})
