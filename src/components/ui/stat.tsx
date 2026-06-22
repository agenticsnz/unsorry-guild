import type { ReactNode } from 'react'

/** A bordered stat box: a large value over a small label. Shared by the
 *  contributor and model pages. */
export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-xs text-foreground/70">{label}</div>
    </div>
  )
}
