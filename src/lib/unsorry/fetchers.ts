import {
  metricsUrl,
  rawMetricsUrl,
  queueUrl,
  rawQueueUrl,
  REVALIDATE_SECONDS,
} from './constants'
import type { CommunityStats, GoalEffort, LeaderboardUi, UnsorryLeaderboardRecord } from './types'

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

export async function fetchGlobalLeaderboard(): Promise<UnsorryLeaderboardRecord[]> {
  const data = await fetchJson<LeaderboardUi>(
    metricsUrl('leaderboard-ui.json'),
    rawMetricsUrl('leaderboard-ui.json'),
  )
  return data.contributors ?? []
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
