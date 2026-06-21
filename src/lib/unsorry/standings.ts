import { loadSnapshot } from './snapshot'
import {
  deriveGlobalLeaderboard,
  deriveGoalEffort,
  deriveGoalSolverMap,
  deriveModels,
  deriveTimelines,
  deriveSummary,
} from './derive'
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
 * Single data facade for all standings (ADR-024). Each getter prefers the fresh
 * git snapshot and falls back to the baked artifacts when the snapshot is
 * unavailable (no token / fetch failure). `loadSnapshot` is memoised, so multiple
 * getters in one render share a single tarball fetch+parse.
 */

export async function getGlobalLeaderboard(): Promise<GuildLeaderboardEntry[]> {
  const snap = await loadSnapshot()
  if (snap) return deriveGlobalLeaderboard(snap)
  return toGuildLeaderboard(await fetchGlobalLeaderboard())
}

export async function getGoalEffort(): Promise<GoalEffort[]> {
  const snap = await loadSnapshot()
  if (snap) return deriveGoalEffort(snap)
  return fetchGoalEffort()
}

export async function getGoalSolverMap(): Promise<Map<string, GoalSolver>> {
  const snap = await loadSnapshot()
  if (snap) return deriveGoalSolverMap(snap)
  return buildGoalSolverMap()
}

export interface LeaderboardExtras {
  models: ModelStat[]
  timelines: Timelines | null
  summary?: LeaderboardSummary
}

export async function getLeaderboardExtras(): Promise<LeaderboardExtras> {
  const snap = await loadSnapshot()
  if (snap) {
    return {
      models: deriveModels(snap),
      timelines: deriveTimelines(snap),
      summary: deriveSummary(snap),
    }
  }
  try {
    const ui = await fetchLeaderboardUi()
    return { models: ui.models ?? [], timelines: ui.timelines ?? null, summary: ui.summary }
  } catch {
    return { models: [], timelines: null }
  }
}
