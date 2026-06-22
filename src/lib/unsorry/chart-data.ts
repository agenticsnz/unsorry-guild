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

/** Label a timeline point. The merge basis is bucketed hourly (`…THH:MM:SSZ`),
 * so we keep the hour — `2026-06-22 03:00` — and the latest still-filling hour
 * reads as an hour, not the whole day. The solve basis is date-only (`2026-06-20`),
 * so it stays a bare date (ADR-030). */
function pointLabel(t: string): string {
  if (t.includes('T')) {
    const [date, time] = t.split('T')
    return `${date} ${time.slice(0, 5)}`
  }
  return t.slice(0, 10)
}

export function proofsOverTimeCombo(series: TimelinePoint[]): ComboSeries {
  // One bar per upstream bucket (hourly on the merge basis, daily on solve), with
  // hour-aware labels (ADR-030, superseding the daily aggregation of ADR-029).
  return {
    labels: series.map((p) => pointLabel(p.t)),
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
