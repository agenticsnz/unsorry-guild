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
  // Aggregate to one bar per calendar day (ADR-029). The merge basis is bucketed
  // hourly upstream, so a single day arrives as up to 24 points; mapping each to
  // its date label rendered 24 same-labeled bars, and the latest (partial-hour)
  // bar read as the whole day's total. Collapse by date: per-period = the day's
  // summed proofs, cumulative = the day's end (max, since cumulative is monotonic)
  // value. The solve basis is already daily, so this is a no-op for it.
  const byDay = new Map<string, { proofs: number; cumulative: number }>()
  for (const p of series) {
    const day = p.t.slice(0, 10)
    const acc = byDay.get(day)
    if (acc) {
      acc.proofs += p.proofs
      acc.cumulative = Math.max(acc.cumulative, p.cumulative_proofs)
    } else {
      byDay.set(day, { proofs: p.proofs, cumulative: p.cumulative_proofs })
    }
  }
  const labels = [...byDay.keys()].sort() // ISO dates sort chronologically
  return {
    labels,
    proofs: labels.map((d) => byDay.get(d)!.proofs),
    cumulative: labels.map((d) => byDay.get(d)!.cumulative),
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
