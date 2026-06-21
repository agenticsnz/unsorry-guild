import { assignRanks } from './ranking'
import type { GuildLeaderboardEntry, UnsorryLeaderboardRecord } from './types'

/**
 * Normalise unsorry's leaderboard-ui.json rows into the guild's UI shape, keyed
 * on the GitHub handle (identity per ADR-016/Decision #1). Ranks are assigned
 * guild-side by score using standard competition ranking, so equal scores tie
 * regardless of upstream rank numbering (SPEC-018-B / issue #1 #11).
 */
export function toGuildLeaderboard(records: UnsorryLeaderboardRecord[]): GuildLeaderboardEntry[] {
  const mapped = records.map((r) => ({
    github: r.github,
    displayName: r.display_name ?? `@${r.github}`,
    avatarUrl: r.avatar_url ?? `https://github.com/${r.github}.png?size=96`,
    profileUrl: r.profile_url ?? `https://github.com/${r.github}`,
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
  mapped.sort((a, b) => b.score - a.score || a.github.localeCompare(b.github))
  return assignRanks(mapped, (e) => e.score)
}
