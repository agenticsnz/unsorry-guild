import { loadSnapshot } from './snapshot'
import {
  deriveGoalSolverMap,
  deriveShowcaseSolverMap,
  deriveGoalMetaMap,
  deriveRecentProofs,
  type GoalMeta,
  type RecentProof,
} from './derive'
import {
  fetchArchivedGoalSource,
  fetchBenchmarkRuns,
  fetchGlobalLeaderboard,
  fetchGoalEffort,
  fetchGoalSource,
  fetchLeaderboardUi,
  fetchRegisteredTargets,
} from './fetchers'
import { toGuildLeaderboard } from './leaderboard-mapper'
import { buildGoalSolverMap } from './attribution'
import type {
  BenchmarkRun,
  BenchmarkSuite,
  Decomposition,
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

/** The registered benchmark suites (ADR-092). Total: returns [] on any error. */
export async function getRegisteredTargets(): Promise<BenchmarkSuite[]> {
  try {
    return (await fetchRegisteredTargets()).suites ?? []
  } catch {
    return []
  }
}

/** Per-run benchmark telemetry keyed by suite id (ADR-092). Total: {} on error
 *  (incl. before benchmark-runs.json first publishes). */
export async function getBenchmarkRuns(): Promise<Record<string, BenchmarkRun[]>> {
  try {
    return (await fetchBenchmarkRuns()).suites ?? {}
  } catch {
    return {}
  }
}

/** A benchmark goal's Lean source. Total: '' on error. */
/** A goal's resolved Lean statement and the repo path it was found at (so links
 *  point to the real file — `goals/<id>.lean` for active goals, the archive copy
 *  for retired ones). `path` is null when no statement is available. */
export interface GoalSource {
  source: string
  path: string | null
}

export async function getGoalSource(goalId: string): Promise<GoalSource> {
  // Active goal: goals/<id>.lean. Many Showcase goals are archived, though — their
  // statement moves to packages/<pkg>/goals/<id>.lean while only the .aisp record
  // stays in active goals/. Fall back to the archive (package resolved from the
  // snapshot) so archived proofs still show their statement AND link to the real
  // file. (#realization-determines-counts)
  try {
    const active = await fetchGoalSource(goalId)
    if (active.trim()) return { source: active, path: `goals/${goalId}.lean` }
  } catch {
    // 404 / network — fall through to the archive lookup
  }
  try {
    const snap = await loadSnapshot()
    const pkg = snap?.archivePackageByGoal[goalId]
    if (pkg) {
      const archived = await fetchArchivedGoalSource(pkg, goalId)
      if (archived.trim()) {
        return { source: archived, path: `packages/${pkg}/goals/${goalId}.lean` }
      }
    }
  } catch {
    // ignore — fall through to empty (LeanStatement shows the unavailable note)
  }
  return { source: '', path: null }
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

/**
 * goal → credited solver across active AND archived proofs, for the Showcase
 * (the hardest proofs are mostly archived). Falls back to the active-only
 * GitHub-API scan when the snapshot is unavailable.
 */
export async function getShowcaseSolverMap(): Promise<Map<string, GoalSolver>> {
  try {
    const snap = await loadSnapshot()
    if (snap) return deriveShowcaseSolverMap(snap)
    return await buildGoalSolverMap()
  } catch {
    return new Map()
  }
}

/**
 * goal → {difficulty, status} for the whole corpus, preferred from the git
 * snapshot's goal records (covers EVERY goal). Falls back to the telemetry-only
 * `goal_effort` slice when the snapshot is unavailable (no GITHUB_TOKEN). The
 * Showcase ranks over this so the hardest proved goals are visible, not just the
 * recent ones that happen to carry proof-run telemetry.
 */
export async function getGoalMetaMap(): Promise<Map<string, GoalMeta>> {
  try {
    const snap = await loadSnapshot()
    if (snap && snap.goals.length > 0) return deriveGoalMetaMap(snap)
    const effort = await fetchGoalEffort()
    return new Map(effort.map((e) => [e.goal, { difficulty: e.difficulty, status: e.status }]))
  } catch {
    return new Map()
  }
}

/**
 * The most recently proved goals (day resolution), for the admin overview's
 * activity pulse. Empty when the snapshot is unavailable or no record carries a
 * day-stamp — the overview then shows only the timeline velocity line.
 */
export async function getRecentProofs(limit = 8): Promise<RecentProof[]> {
  try {
    const snap = await loadSnapshot()
    return snap ? deriveRecentProofs(snap, limit) : []
  } catch {
    return []
  }
}

/**
 * The authoritative parent→subs decomposition records (ADR-037, unsorry ADR-009),
 * read from the cached git snapshot. Total: [] when the snapshot is unavailable
 * (no GITHUB_TOKEN) or on any error — the goal views then simply render no
 * decomposition section.
 */
export async function getDecompositions(): Promise<Decomposition[]> {
  try {
    return (await loadSnapshot())?.decompositions ?? []
  } catch {
    return []
  }
}

export interface LeaderboardExtras {
  models: ModelStat[]
  timelines: Timelines | null
  summary?: LeaderboardSummary
  /** When unsorry generated the artifact (ISO-8601). Surfaced so the board can show
   *  freshness — the artifact stalls if upstream regen is starved (agenticsnz/unsorry#426). */
  generatedAt?: string
}

export async function getLeaderboardExtras(): Promise<LeaderboardExtras> {
  try {
    const ui = await fetchLeaderboardUi()
    return {
      models: ui.models ?? [],
      timelines: ui.timelines ?? null,
      summary: ui.summary,
      generatedAt: ui.generated_at,
    }
  } catch {
    return { models: [], timelines: null }
  }
}
