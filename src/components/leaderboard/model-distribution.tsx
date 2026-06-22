import Image from 'next/image'
import Link from 'next/link'
import type { ModelWithRegistry } from '@/lib/unsorry/types'

export function ModelDistribution({ models }: { models: ModelWithRegistry[] }) {
  const sorted = models
    .filter((m) => m.verified_proofs > 0)
    .sort((a, b) => b.verified_proofs - a.verified_proofs)
  if (sorted.length === 0) {
    return <p className="text-sm text-foreground/70">No model data.</p>
  }
  const max = Math.max(...sorted.map((m) => m.verified_proofs), 1)

  return (
    <div className="space-y-2">
      {sorted.map((m) => {
        const poke = m.registry?.pokemon
        const label = (
          <span className="flex min-w-0 items-center gap-2">
            {poke && (
              <Image
                src={poke.sprite_url}
                alt={poke.name}
                width={28}
                height={28}
                unoptimized
                className="h-7 w-7 shrink-0 [image-rendering:pixelated]"
              />
            )}
            <span className="truncate font-medium">{m.provider_model}</span>
            {poke && <span className="shrink-0 text-foreground/50">{poke.name}</span>}
          </span>
        )
        return (
          <div key={m.provider_model} className="space-y-1">
            <div className="flex items-center justify-between gap-3 text-xs">
              {m.registry ? (
                <Link
                  href={`/math/models/${m.registry.slug}`}
                  className="min-w-0 rounded hover:underline focus:outline-none focus:ring-2 focus:ring-brand"
                >
                  {label}
                </Link>
              ) : (
                label
              )}
              <span className="whitespace-nowrap tabular-nums text-foreground/60">
                {m.verified_proofs.toLocaleString()} proofs
                {m.run_success_rate != null && m.runs > 0
                  ? ` · ${Math.round(m.run_success_rate * 100)}% of ${m.runs.toLocaleString()} runs`
                  : ''}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded bg-muted">
              <div
                className="h-full bg-primary"
                style={{ width: `${(m.verified_proofs / max) * 100}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
