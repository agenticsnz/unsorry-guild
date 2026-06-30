'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { fillTimelineGaps, proofsOverTimeCombo } from '@/lib/unsorry/chart-data'
import { ProofsComboChart } from '@/components/charts/proofs-combo-chart'
import type { Timelines } from '@/lib/unsorry/types'

export function ProofsOverTime({ timelines }: { timelines: Timelines }) {
  const [mode, setMode] = useState<'merge' | 'solve'>(
    timelines.default === 'solve' ? 'solve' : 'merge',
  )
  // Default OFF → zero-proof periods are shown as empty bars, so a no-proof gap
  // (e.g. an outage) is visible rather than collapsed to adjacent bars. Toggle ON
  // to collapse to active periods only.
  const [hideEmpty, setHideEmpty] = useState(false)
  // `now` is set after mount so the empty-bar tail extends to the present without
  // the chart stalling at the last proof. Left undefined on the server / first
  // client render so the SSR markup matches and hydration stays clean.
  const [now, setNow] = useState<number | undefined>(undefined)
  useEffect(() => setNow(Date.now()), [])
  const rawSeries = (mode === 'solve' ? timelines.solve : timelines.merge) ?? []
  const series = hideEmpty ? rawSeries : fillTimelineGaps(rawSeries, now)
  const { labels, proofs, cumulative } = proofsOverTimeCombo(series)
  const total = series.length ? series[series.length - 1].cumulative_proofs : 0
  const span = series.length
    ? `${series[0].t.slice(0, 10)} → ${series[series.length - 1].t.slice(0, 10)}`
    : ''

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-md border overflow-hidden">
          {(['merge', 'solve'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                'px-3 py-1 text-sm',
                mode === m ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-accent',
              )}
            >
              By {m}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setHideEmpty((v) => !v)}
          aria-pressed={hideEmpty}
          className={cn(
            'rounded-md border px-3 py-1 text-sm',
            hideEmpty ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-accent',
          )}
          title="When off, no-proof periods show as empty bars so gaps are visible"
        >
          Hide empty {mode === 'solve' ? 'days' : 'hours'}
        </button>
        <span className="ml-auto text-sm text-foreground/70 tabular-nums">
          {total.toLocaleString()} cumulative{span ? ` · ${span}` : ''}
        </span>
      </div>
      {series.length === 0 ? (
        <p className="text-sm text-foreground/70">No timeline data.</p>
      ) : (
        <ProofsComboChart labels={labels} proofs={proofs} cumulative={cumulative} />
      )}
    </div>
  )
}
