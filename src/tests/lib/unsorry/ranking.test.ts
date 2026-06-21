import { describe, it, expect } from 'vitest'
import { assignRanks } from '@/lib/unsorry/ranking'

const items = (scores: number[]) => scores.map((score, i) => ({ id: i, score }))

describe('assignRanks (standard competition ranking)', () => {
  it('shares a rank for tied scores and skips the next (1,2,2,4)', () => {
    const ranked = assignRanks(items([100, 90, 90, 80]), (x) => x.score)
    expect(ranked.map((r) => r.rank)).toEqual([1, 2, 2, 4])
  })

  it('assigns sequential ranks when all scores are distinct', () => {
    const ranked = assignRanks(items([5, 4, 3]), (x) => x.score)
    expect(ranked.map((r) => r.rank)).toEqual([1, 2, 3])
  })

  it('gives every item rank 1 when all scores are equal', () => {
    const ranked = assignRanks(items([7, 7, 7]), (x) => x.score)
    expect(ranked.map((r) => r.rank)).toEqual([1, 1, 1])
  })

  it('handles a leading tie then a drop (1,1,3)', () => {
    const ranked = assignRanks(items([7, 7, 5]), (x) => x.score)
    expect(ranked.map((r) => r.rank)).toEqual([1, 1, 3])
  })

  it('handles single and empty inputs', () => {
    expect(assignRanks(items([3]), (x) => x.score).map((r) => r.rank)).toEqual([1])
    expect(assignRanks([] as { score: number }[], (x) => x.score)).toEqual([])
  })

  it('preserves the original item fields and order', () => {
    const ranked = assignRanks(items([10, 10, 5]), (x) => x.score)
    expect(ranked[0]).toMatchObject({ id: 0, score: 10, rank: 1 })
    expect(ranked[2]).toMatchObject({ id: 2, score: 5, rank: 3 })
  })
})
