'use client'

import { sourcingBarSeries } from '@/lib/unsorry/chart-data'
import { HorizontalBarChart } from '@/components/charts/horizontal-bar-chart'
import type { SourcingEntry } from '@/lib/unsorry/types'

/** Sourcers by *sourced goals only* as a horizontal bar, modelling the leaderboard (#5). */
export function SourcingBar({
  entries,
  topN = 15,
}: {
  entries: SourcingEntry[]
  topN?: number
}) {
  const { labels, values, hrefs } = sourcingBarSeries(entries, topN)
  if (labels.length === 0) return null
  return <HorizontalBarChart labels={labels} values={values} hrefs={hrefs} label="Sourced goals" />
}
