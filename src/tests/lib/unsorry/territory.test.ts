import { describe, it, expect } from 'vitest'
import {
  territoryBounds,
  classLabel,
  redundantPercent,
  type TerritoryProof,
  type TerritoryStats,
} from '@/lib/unsorry/territory'

const p = (x: number, y: number): TerritoryProof => ({ n: 'p', x, y, m: 0, c: 's', r: 1, e: [] })

describe('territoryBounds', () => {
  it('returns a unit box for an empty cloud (no divide-by-zero in fit)', () => {
    expect(territoryBounds([])).toEqual({ x0: 0, y0: 0, x1: 1, y1: 1 })
  })

  it('spans the min/max of x and y independently', () => {
    expect(territoryBounds([p(-3, 10), p(5, 2), p(1, 8)])).toEqual({
      x0: -3,
      y0: 2,
      x1: 5,
      y1: 10,
    })
  })

  it('collapses to a point for a single proof', () => {
    expect(territoryBounds([p(4, 7)])).toEqual({ x0: 4, y0: 7, x1: 4, y1: 7 })
  })
})

describe('classLabel', () => {
  it('maps the redundancy codes', () => {
    expect(classLabel('g')).toBe('genuine')
    expect(classLabel('r')).toBe('restatement')
    expect(classLabel('s')).toBe('shallow')
  })

  it('falls back to shallow for an unknown code', () => {
    expect(classLabel('x')).toBe('shallow')
  })
})

describe('redundantPercent', () => {
  it('formats the fraction to one decimal place', () => {
    const stats = { redundant_fraction: 0.9509 } as TerritoryStats
    expect(redundantPercent(stats)).toBe('95.1%')
    expect(redundantPercent({ redundant_fraction: 0 } as TerritoryStats)).toBe('0.0%')
  })
})
