import { fetchGlobalLeaderboard, fetchGoalEffort } from '@/lib/unsorry/fetchers'
import { toGuildLeaderboard } from '@/lib/unsorry/leaderboard-mapper'
import { buildGoalSolverMap } from '@/lib/unsorry/attribution'
import { computeTargetLeaderboard } from '@/lib/unsorry/target-leaderboard'
import { getPrizes } from '@/lib/prizes/prizes'
import type { GuildLeaderboardEntry } from '@/lib/unsorry/types'

export interface PrizeBadge {
  prizeTitle: string
  badgeEmoji: string
  headlineGoalId: string
  place: number | null // 1/2/3 if on the (provisional) podium, else null
  creditedProofs: number
}

export interface ContributorProfile {
  github: string
  displayName: string
  avatarUrl: string
  profileUrl: string
  global: GuildLeaderboardEntry | null
  badges: PrizeBadge[]
}

/**
 * A contributor profile keyed on GitHub handle (ADR-016). Global standing comes
 * from the leaderboard artifact; prize badges are derived from each prize's
 * per-target leaderboard (git attribution) — no badge storage needed.
 */
export async function getContributor(handle: string): Promise<ContributorProfile> {
  const rows = toGuildLeaderboard(await fetchGlobalLeaderboard())
  const global = rows.find((r) => r.github.toLowerCase() === handle.toLowerCase()) ?? null

  const github = global?.github ?? handle
  const displayName = global?.displayName ?? `@${handle}`
  const avatarUrl = global?.avatarUrl ?? `https://github.com/${handle}.png?size=96`
  const profileUrl = global?.profileUrl ?? `https://github.com/${handle}`

  const badges: PrizeBadge[] = []
  try {
    const [prizes, goalEffort, solverMap] = await Promise.all([
      getPrizes('math'),
      fetchGoalEffort(),
      buildGoalSolverMap(),
    ])
    for (const prize of prizes) {
      const board = computeTargetLeaderboard(prize.headlineGoalId, goalEffort, solverMap)
      const entry = board.find((e) => e.github.toLowerCase() === github.toLowerCase())
      if (entry) {
        badges.push({
          prizeTitle: prize.title,
          badgeEmoji: prize.badgeEmoji,
          headlineGoalId: prize.headlineGoalId,
          place: entry.rank <= 3 ? entry.rank : null,
          creditedProofs: entry.creditedProofs,
        })
      }
    }
  } catch {
    // leave badges empty if upstream data is unavailable
  }

  return { github, displayName, avatarUrl, profileUrl, global, badges }
}
