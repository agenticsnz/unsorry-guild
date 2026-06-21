import { describe, it, expect } from 'vitest'
import { derivePodiumAwards } from '@/lib/prizes/awards'
import type { TargetLeaderboardEntry } from '@/lib/unsorry/types'

const entry = (github: string, rank: number): TargetLeaderboardEntry => ({
  github,
  rank,
  difficultyPoints: 0,
  creditedProofs: 1,
  score: 0,
})

describe('derivePodiumAwards', () => {
  it('assigns places 1-3 and marks everyone a contributor', () => {
    const awards = derivePodiumAwards([entry('a', 1), entry('b', 2), entry('c', 3), entry('d', 4)])
    expect(awards).toEqual([
      { github: 'a', place: 1, isContributor: true },
      { github: 'b', place: 2, isContributor: true },
      { github: 'c', place: 3, isContributor: true },
      { github: 'd', place: null, isContributor: true },
    ])
  })

  it('handles an empty board', () => {
    expect(derivePodiumAwards([])).toEqual([])
  })
})
