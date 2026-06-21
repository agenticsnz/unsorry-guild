import type { TargetLeaderboardEntry } from '@/lib/unsorry/types'

export interface DerivedAward {
  github: string
  place: number | null // 1/2/3 for the podium, null for a plain contributor
  isContributor: boolean
}

/**
 * Derive the frozen awards for a season from its per-target leaderboard:
 * everyone on the board contributed (≥1 proof in the subtree); the top three
 * also take a podium place. Pure — unit-tested; written verbatim to prize_awards.
 */
export function derivePodiumAwards(board: TargetLeaderboardEntry[]): DerivedAward[] {
  return board.map((e) => ({
    github: e.github,
    place: e.rank <= 3 ? e.rank : null,
    isContributor: true,
  }))
}
