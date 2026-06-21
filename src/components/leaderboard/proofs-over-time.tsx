'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { buildAreaChart } from '@/lib/unsorry/chart'
import type { Timelines } from '@/lib/unsorry/types'

export function ProofsOverTime({ timelines }: { timelines: Timelines }) {
  const [mode, setMode] = useState<'merge' | 'solve'>(
    timelines.default === 'solve' ? 'solve' : 'merge',
  )
  const series = (mode === 'solve' ? timelines.solve : timelines.merge) ?? []
  const chart = buildAreaChart(series, 720, 200)
  const total = series.length ? series[series.length - 1].cumulative_proofs : 0
  const span = series.length ? `${series[0].t.slice(0, 10)} → ${series[series.length - 1].t.slice(0, 10)}` : ''

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
        <span className="ml-auto text-sm text-foreground/70 tabular-nums">
          {total.toLocaleString()} cumulative{span ? ` · ${span}` : ''}
        </span>
      </div>
      {series.length === 0 ? (
        <p className="text-sm text-foreground/70">No timeline data.</p>
      ) : (
        <svg
          viewBox={`0 0 ${chart.width} ${chart.height}`}
          className="w-full h-auto rounded-lg border bg-card"
          preserveAspectRatio="none"
          role="img"
          aria-label={`Cumulative proofs over time, by ${mode}`}
        >
          <path d={chart.areaPath} className="text-primary/15" fill="currentColor" />
          <path d={chart.linePath} className="text-primary" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      )}
    </div>
  )
}
