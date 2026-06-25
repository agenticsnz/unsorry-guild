import {
  metricsUrl,
  rawMetricsUrl,
  queueUrl,
  rawQueueUrl,
  REVALIDATE_SECONDS,
  MODEL_REGISTRY_REVALIDATE_SECONDS,
} from './constants'
import type {
  BenchmarkRuns,
  CommunityStats,
  GoalEffort,
  LeaderboardUi,
  ModelRegistry,
  QueueData,
  RegisteredTargets,
  SourcingEntry,
  SourcingLeaderboard,
  UnsorryLeaderboardRecord,
} from './types'

export class UnsorryFetchError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UnsorryFetchError'
  }
}

/** Fetch JSON, trying raw-git first (tracks `main` within minutes) and falling
 * back to the Pages URL (which can lag hours behind during merge-commit floods). */
export async function fetchJson<T>(
  primary: string,
  fallback: string,
  revalidate: number = REVALIDATE_SECONDS,
): Promise<T> {
  for (const url of [primary, fallback]) {
    try {
      const res = await fetch(url, { next: { revalidate } })
      if (res.ok) return (await res.json()) as T
    } catch {
      // try the fallback
    }
  }
  throw new UnsorryFetchError(`Unable to fetch unsorry artifact: ${primary}`)
}

/** The full leaderboard-ui.json (contributors + models + timelines + summary). */
export async function fetchLeaderboardUi(): Promise<LeaderboardUi> {
  return fetchJson<LeaderboardUi>(
    rawMetricsUrl('leaderboard-ui.json'),
    metricsUrl('leaderboard-ui.json'),
  )
}

/** The registered benchmark suites (ADR-092 / SPEC-092-A). */
export async function fetchRegisteredTargets(): Promise<RegisteredTargets> {
  return fetchJson<RegisteredTargets>(
    rawMetricsUrl('registered-targets.json'),
    metricsUrl('registered-targets.json'),
  )
}

/** Per-run benchmark telemetry, keyed by suite id (ADR-092). */
export async function fetchBenchmarkRuns(): Promise<BenchmarkRuns> {
  return fetchJson<BenchmarkRuns>(
    rawMetricsUrl('benchmark-runs.json'),
    metricsUrl('benchmark-runs.json'),
  )
}

export async function fetchGlobalLeaderboard(): Promise<UnsorryLeaderboardRecord[]> {
  const data = await fetchLeaderboardUi()
  return data.contributors ?? []
}

/** The swarm-maintained model → Pokémon registry (ADR-083 upstream). */
export async function fetchModelRegistry(): Promise<ModelRegistry> {
  return fetchJson<ModelRegistry>(
    rawMetricsUrl('model-registry.json'),
    metricsUrl('model-registry.json'),
    MODEL_REGISTRY_REVALIDATE_SECONDS,
  )
}

export async function fetchSourcing(): Promise<SourcingEntry[]> {
  const data = await fetchJson<SourcingLeaderboard>(
    rawMetricsUrl('sourcing-leaderboard.json'),
    metricsUrl('sourcing-leaderboard.json'),
  )
  return data.sourcers ?? []
}

export async function fetchCommunityStats(): Promise<CommunityStats> {
  return fetchJson<CommunityStats>(
    rawMetricsUrl('community-stats.json'),
    metricsUrl('community-stats.json'),
  )
}

export async function fetchGoalEffort(): Promise<GoalEffort[]> {
  const stats = await fetchCommunityStats()
  return stats.goal_effort ?? []
}

export async function fetchQueue<T = unknown>(): Promise<T> {
  return fetchJson<T>(rawQueueUrl(), queueUrl())
}

export async function fetchQueueData(): Promise<QueueData> {
  return fetchJson<QueueData>(rawQueueUrl(), queueUrl())
}
