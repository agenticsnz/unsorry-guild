import type { GuildLeaderboardEntry, UnsorryLeaderboardRecord } from './types'

/**
 * Normalise unsorry's leaderboard-ui.json rows into the guild's UI shape,
 * keyed on the GitHub handle (identity per ADR-016/Decision #1). Sorted by rank.
 */
export function toGuildLeaderboard(records: UnsorryLeaderboardRecord[]): GuildLeaderboardEntry[] {
  return records
    .map((r) => ({
      github: r.github,
      displayName: r.display_name ?? `@${r.github}`,
      avatarUrl: r.avatar_url ?? `https://github.com/${r.github}.png?size=96`,
      profileUrl: r.profile_url ?? `https://github.com/${r.github}`,
      rank: r.rank,
      score: r.score,
      difficultyPoints: r.difficulty_points,
      creditedProofs: r.credited_proofs,
      verifiedProofs: r.verified_proofs ?? r.credited_proofs,
      successRate: r.run_success_rate ?? 0,
      badges: r.badges ?? {
        proofs: r.credited_proofs,
        difficulty: r.difficulty_points,
        success_rate_percent: Math.round((r.run_success_rate ?? 0) * 100),
      },
    }))
    .sort((a, b) => a.rank - b.rank)
}
