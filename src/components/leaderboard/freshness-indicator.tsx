/**
 * Shows how long ago unsorry generated the leaderboard artifact (`generated_at`).
 *
 * The board reads a pre-computed `leaderboard-ui.json` that upstream refreshes
 * push-on-merge (constants.ts / ADR-031). When the upstream regen is starved —
 * the regen has grown slower than the merge firehose and loses the push race
 * (agenticsnz/unsorry#426) — the artifact freezes and the guild silently serves
 * hours-old standings. This surfaces that age so a stall is visible rather than
 * invisible. Rendered server-side (the page is `force-dynamic`), so it reflects
 * the freshness at request time.
 */

/** Past this age the board is likely lagging upstream rather than merely quiet —
 *  the cron backstop ticks every 15 min, so an hour-old artifact is degraded. */
export const STALE_AFTER_MS = 60 * 60 * 1000

export interface Freshness {
  /** Human-readable age, e.g. "just now", "12 min ago", "3 h ago", "2 days ago". */
  label: string
  /** The source timestamp, verbatim — used for the hover title. */
  iso: string
  /** True once the artifact is old enough to likely indicate an upstream stall. */
  isStale: boolean
}

function relativeAge(diffMs: number): string {
  const seconds = Math.floor(diffMs / 1000)
  if (seconds < 45) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 1) return '1 min ago'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

/** Pure: describe an ISO timestamp's age relative to `now`. Returns null for a
 *  missing/unparseable timestamp so the caller can render nothing. */
export function describeFreshness(generatedAt?: string, now: Date = new Date()): Freshness | null {
  if (!generatedAt) return null
  const then = Date.parse(generatedAt)
  if (Number.isNaN(then)) return null
  const diffMs = Math.max(0, now.getTime() - then)
  return { label: relativeAge(diffMs), iso: generatedAt, isStale: diffMs >= STALE_AFTER_MS }
}

export function FreshnessIndicator({
  generatedAt,
  now,
  noun = 'Leaderboard',
}: {
  generatedAt?: string
  now?: Date
  /** What the timestamp describes, for the hover title — e.g. "Queue". */
  noun?: string
}) {
  const freshness = describeFreshness(generatedAt, now)
  if (!freshness) return null
  const { label, iso, isStale } = freshness
  return (
    <span
      title={`${noun} data generated ${iso}`}
      className={`inline-flex items-center gap-1.5 text-xs ${
        isStale ? 'text-amber-600 dark:text-amber-500' : 'text-foreground/60'
      }`}
    >
      <span
        aria-hidden
        className={`inline-block h-1.5 w-1.5 rounded-full ${isStale ? 'bg-amber-500' : 'bg-emerald-500'}`}
      />
      Updated {label}
      {isStale && ' · may be lagging upstream'}
    </span>
  )
}
