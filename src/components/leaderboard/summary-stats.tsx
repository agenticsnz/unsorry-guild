import type { LeaderboardSummary } from '@/lib/unsorry/types'

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="text-2xl font-bold tabular-nums">{value.toLocaleString()}</div>
      <div className="text-xs text-foreground/70">{label}</div>
    </div>
  )
}

export function SummaryStats({ summary }: { summary?: LeaderboardSummary }) {
  if (!summary) return null
  return (
    <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
      <Stat label="Verified proofs" value={summary.verified_proofs ?? 0} />
      <Stat label="Attributed (explicit)" value={summary.attributed_proofs ?? 0} />
      <Stat label="Inferred (git)" value={summary.inferred_git_proofs ?? 0} />
      <Stat label="Terminal runs" value={summary.terminal_runs ?? 0} />
    </div>
  )
}
