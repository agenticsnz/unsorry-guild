import {
  metricsUrl,
  rawMetricsUrl,
  queueUrl,
  rawQueueUrl,
  REVALIDATE_SECONDS,
} from './constants'
import type {
  CommunityStats,
  GoalEffort,
  LeaderboardUi,
  QueueData,
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

/** Fetch JSON from the canonical Pages URL, falling back to raw.githubusercontent. */
export async function fetchJson<T>(primary: string, fallback: string): Promise<T> {
  for (const url of [primary, fallback]) {
    try {
      const res = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } })
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
    metricsUrl('leaderboard-ui.json'),
    rawMetricsUrl('leaderboard-ui.json'),
  )
}

export async function fetchGlobalLeaderboard(): Promise<UnsorryLeaderboardRecord[]> {
  const data = await fetchLeaderboardUi()
  return data.contributors ?? []
}

export async function fetchSourcing(): Promise<SourcingEntry[]> {
  const data = await fetchJson<SourcingLeaderboard>(
    metricsUrl('sourcing-leaderboard.json'),
    rawMetricsUrl('sourcing-leaderboard.json'),
  )
  return data.sourcers ?? []
}

export async function fetchCommunityStats(): Promise<CommunityStats> {
  return fetchJson<CommunityStats>(
    metricsUrl('community-stats.json'),
    rawMetricsUrl('community-stats.json'),
  )
}

export async function fetchGoalEffort(): Promise<GoalEffort[]> {
  const stats = await fetchCommunityStats()
  return stats.goal_effort ?? []
}

export async function fetchQueue<T = unknown>(): Promise<T> {
  return fetchJson<T>(queueUrl(), rawQueueUrl())
}

export async function fetchQueueData(): Promise<QueueData> {
  return fetchJson<QueueData>(queueUrl(), rawQueueUrl())
}
