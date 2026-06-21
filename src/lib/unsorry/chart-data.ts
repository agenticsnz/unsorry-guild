import type { GuildLeaderboardEntry, ModelStat, SourcingEntry, TimelinePoint } from './types'

/** Labels + values (+ optional per-bar links) consumed by the Chart.js wrappers. */
export interface SeriesData {
  labels: string[]
  values: number[]
  hrefs?: string[]
}

/** Combo series for proofs-over-time: per-period bars + cumulative line (#4). */
export interface ComboSeries {
  labels: string[]
  proofs: number[]
  cumulative: number[]
}

export function proofsOverTimeCombo(series: TimelinePoint[]): ComboSeries {
  return {
    labels: series.map((p) => p.t.slice(0, 10)),
    proofs: series.map((p) => p.proofs),
    cumulative: series.map((p) => p.cumulative_proofs),
  }
}

/** Top-N contributors by score for the leaderboard bar; bars link to profiles (#3). */
export function leaderboardBarSeries(
  entries: GuildLeaderboardEntry[],
  topN = 15,
): SeriesData {
  const top = entries.slice(0, topN)
  return {
    labels: top.map((e) => e.displayName),
    values: top.map((e) => e.score),
    hrefs: top.map((e) => `/math/contributors/${e.github}`),
  }
}

/** Top-N sourcers by *sourced goals only*; bars link to profiles (#5). */
export function sourcingBarSeries(entries: SourcingEntry[], topN = 15): SeriesData {
  const top = [...entries]
    .sort((a, b) => b.sourced_goals - a.sourced_goals)
    .slice(0, topN)
  return {
    labels: top.map((s) => s.display_name ?? `@${s.github}`),
    values: top.map((s) => s.sourced_goals),
    hrefs: top.map((s) => `/math/contributors/${s.github}`),
  }
}

/** Verified proofs by provider/model for an optional model bar. */
export function modelBarSeries(models: ModelStat[], topN = 15): SeriesData {
  const top = models
    .filter((m) => m.verified_proofs > 0)
    .sort((a, b) => b.verified_proofs - a.verified_proofs)
    .slice(0, topN)
  return {
    labels: top.map((m) => m.provider_model),
    values: top.map((m) => m.verified_proofs),
  }
}
