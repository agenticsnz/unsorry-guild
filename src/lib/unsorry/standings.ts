import { loadSnapshot } from './snapshot'
import { deriveGoalSolverMap } from './derive'
import { fetchGlobalLeaderboard, fetchGoalEffort, fetchLeaderboardUi } from './fetchers'
import { toGuildLeaderboard } from './leaderboard-mapper'
import { buildGoalSolverMap } from './attribution'
import type {
  GoalEffort,
  GoalSolver,
  GuildLeaderboardEntry,
  LeaderboardSummary,
  ModelStat,
  Timelines,
} from './types'

/**
 * Single data facade for all standings.
 *
 * The **global leaderboard, models, timelines, and summary** come from unsorry's
 * canonical `leaderboard-ui.json` — its score policy includes `dispatch_points`
 * (PR-provenance) and credits archived proofs, neither of which is derivable from
 * the raw lemma/goal records, so recomputing them would mis-rank contributors.
 * That artifact is now refreshed push-on-merge upstream (agenticsnz/unsorry#3735),
 * so it is both correct and current.
 *
 * The **goal→solver attribution** map (per-target boards, podiums, proof graph,
 * showcase) is read from the cached git snapshot — one tarball request instead of
 * hundreds of per-file fetches (fixes the slow goal pages, #10) — with the
 * GitHub-API scan as a fallback. `loadSnapshot` is memoised.
 *
 * Every getter is total: it returns a safe empty value rather than throwing.
 */

export async function getGlobalLeaderboard(): Promise<GuildLeaderboardEntry[]> {
  try {
    return toGuildLeaderboard(await fetchGlobalLeaderboard())
  } catch {
    return []
  }
}

export async function getGoalEffort(): Promise<GoalEffort[]> {
  try {
    return await fetchGoalEffort()
  } catch {
    return []
  }
}

export async function getGoalSolverMap(): Promise<Map<string, GoalSolver>> {
  try {
    const snap = await loadSnapshot()
    if (snap) return deriveGoalSolverMap(snap)
    return await buildGoalSolverMap()
  } catch {
    return new Map()
  }
}

export interface LeaderboardExtras {
  models: ModelStat[]
  timelines: Timelines | null
  summary?: LeaderboardSummary
}

export async function getLeaderboardExtras(): Promise<LeaderboardExtras> {
  try {
    const ui = await fetchLeaderboardUi()
    return { models: ui.models ?? [], timelines: ui.timelines ?? null, summary: ui.summary }
  } catch {
    return { models: [], timelines: null }
  }
}
