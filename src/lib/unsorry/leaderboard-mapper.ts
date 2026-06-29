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
    // A handle-less contributor (github: null) gets a display_name fallback and no
    // GitHub-derived avatar/profile URL — never an interpolated `…/null`. (#43)
    displayName: r.display_name ?? (r.github ? `@${r.github}` : 'Anonymous contributor'),
    avatarUrl: r.avatar_url ?? (r.github ? `https://github.com/${r.github}.png?size=96` : ''),
    profileUrl: r.profile_url ?? (r.github ? `https://github.com/${r.github}` : ''),
    score: r.score,
    difficultyPoints: r.difficulty_points,
    creditedProofs: r.credited_proofs,
    verifiedProofs: r.verified_proofs ?? r.credited_proofs,
    dispatchProofs: r.dispatch_proofs ?? 0,
    dispatchPoints: r.dispatch_points ?? 0,
    successRate: r.run_success_rate ?? 0,
    badges: r.badges ?? {
      proofs: r.credited_proofs,
      difficulty: r.difficulty_points,
      success_rate_percent: Math.round((r.run_success_rate ?? 0) * 100),
    },
  }))
  // Null-safe tie-break: at equal score, handled contributors rank ahead of
  // handle-less ones, then alphabetically by handle. Never deref a null handle.
  mapped.sort(
    (a, b) =>
      b.score - a.score ||
      Number(b.github != null) - Number(a.github != null) ||
      (a.github ?? '').localeCompare(b.github ?? ''),
  )
  return assignRanks(mapped, (e) => e.score)
}
