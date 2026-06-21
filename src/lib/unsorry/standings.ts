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
 * unavailable. Every getter is total — it returns a safe empty value rather than
 * throwing, so a transient upstream failure degrades a surface gracefully instead
 * of crashing the render/prerender (the public Pages JSON has no rate limit; the
 * GitHub-API attribution fallback can 403, hence the guard). `loadSnapshot` is
 * memoised, so co-rendered getters share a single tarball fetch+parse.
 */

export async function getGlobalLeaderboard(): Promise<GuildLeaderboardEntry[]> {
  try {
    const snap = await loadSnapshot()
    if (snap) return deriveGlobalLeaderboard(snap)
    return toGuildLeaderboard(await fetchGlobalLeaderboard())
  } catch {
    return []
  }
}

export async function getGoalEffort(): Promise<GoalEffort[]> {
  try {
    const snap = await loadSnapshot()
    if (snap) return deriveGoalEffort(snap)
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
    const snap = await loadSnapshot()
    if (snap) {
      return {
        models: deriveModels(snap),
        timelines: deriveTimelines(snap),
        summary: deriveSummary(snap),
      }
    }
    const ui = await fetchLeaderboardUi()
    return { models: ui.models ?? [], timelines: ui.timelines ?? null, summary: ui.summary }
  } catch {
    return { models: [], timelines: null }
  }
}
