import { describe, it, expect } from 'vitest'
import { toGuildLeaderboard } from '@/lib/unsorry/leaderboard-mapper'
import { LEADERBOARD_FIXTURE } from '@/tests/mocks/unsorry-fixtures'

describe('toGuildLeaderboard', () => {
  it('normalises rows keyed on github, sorted by rank', () => {
    const rows = toGuildLeaderboard(LEADERBOARD_FIXTURE)
    expect(rows).toHaveLength(3)
    expect(rows.map((r) => r.github)).toEqual(['ohdearquant', 'cgbarlow', 'Rauxon'])
    expect(rows[0]).toMatchObject({
      github: 'ohdearquant',
      displayName: '@ohdearquant',
      rank: 1,
      score: 199700,
      difficultyPoints: 1773,
      creditedProofs: 896,
    })
    expect(rows[0].badges.success_rate_percent).toBe(100)
  })

  it('derives avatar/profile/display defaults from the handle when missing', () => {
    const [row] = toGuildLeaderboard([
      { rank: 1, github: 'someone', score: 10, credited_proofs: 1, difficulty_points: 0 },
    ])
    expect(row.displayName).toBe('@someone')
    expect(row.avatarUrl).toContain('github.com/someone.png')
    expect(row.profileUrl).toBe('https://github.com/someone')
    expect(row.badges.proofs).toBe(1)
  })
})
