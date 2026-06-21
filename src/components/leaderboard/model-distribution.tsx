import type { ModelStat } from '@/lib/unsorry/types'

export function ModelDistribution({ models }: { models: ModelStat[] }) {
  const sorted = models
    .filter((m) => m.verified_proofs > 0)
    .sort((a, b) => b.verified_proofs - a.verified_proofs)
  if (sorted.length === 0) {
    return <p className="text-sm text-foreground/70">No model data.</p>
  }
  const max = Math.max(...sorted.map((m) => m.verified_proofs), 1)

  return (
    <div className="space-y-2">
      {sorted.map((m) => (
        <div key={m.provider_model} className="space-y-1">
          <div className="flex items-baseline justify-between gap-3 text-xs">
            <span className="font-medium">{m.provider_model}</span>
            <span className="text-foreground/60 tabular-nums whitespace-nowrap">
              {m.verified_proofs.toLocaleString()} proofs
              {m.run_success_rate != null && m.runs > 0
                ? ` · ${Math.round(m.run_success_rate * 100)}% of ${m.runs.toLocaleString()} runs`
                : ''}
            </span>
          </div>
          <div className="h-2 rounded bg-muted overflow-hidden">
            <div
              className="h-full bg-primary"
              style={{ width: `${(m.verified_proofs / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
