'use client'

import { leaderboardBarSeries } from '@/lib/unsorry/chart-data'
import { HorizontalBarChart } from '@/components/charts/horizontal-bar-chart'
import type { GuildLeaderboardEntry } from '@/lib/unsorry/types'

/** Top contributors by score as a horizontal bar chart, like the original (#3). */
export function LeaderboardBar({
  entries,
  topN = 15,
}: {
  entries: GuildLeaderboardEntry[]
  topN?: number
}) {
  const { labels, values, hrefs } = leaderboardBarSeries(entries, topN)
  if (labels.length === 0) return null
  return <HorizontalBarChart labels={labels} values={values} hrefs={hrefs} label="Score" />
}
