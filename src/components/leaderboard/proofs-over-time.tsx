'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { proofsOverTimeCombo } from '@/lib/unsorry/chart-data'
import { ProofsComboChart } from '@/components/charts/proofs-combo-chart'
import type { Timelines } from '@/lib/unsorry/types'

export function ProofsOverTime({ timelines }: { timelines: Timelines }) {
  const [mode, setMode] = useState<'merge' | 'solve'>(
    timelines.default === 'solve' ? 'solve' : 'merge',
  )
  const series = (mode === 'solve' ? timelines.solve : timelines.merge) ?? []
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
