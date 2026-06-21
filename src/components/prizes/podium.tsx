import Link from 'next/link'
import type { TargetLeaderboardEntry } from '@/lib/unsorry/types'

const PLACES = ['🥇', '🥈', '🥉']

export function Podium({
  entries,
  closed,
}: {
  entries: TargetLeaderboardEntry[]
  closed: boolean
}) {
  const top = entries.slice(0, 3)
  if (top.length === 0) return null

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">{closed ? 'Podium' : 'Provisional podium'}</h3>
      <div className="grid gap-3 sm:grid-cols-3">
        {top.map((e, i) => (
          <div key={e.github} className="rounded-lg border p-4 text-center">
            <div className="text-2xl" aria-hidden>
              {PLACES[i]}
            </div>
            <Link
              href={`/math/contributors/${e.github}`}
              className="font-medium hover:underline"
            >
              @{e.github}
            </Link>
            <div className="text-xs text-foreground/70">{e.score.toLocaleString()} pts</div>
          </div>
        ))}
      </div>
      {!closed && (
        <p className="text-xs text-foreground/60">
          Provisional — finalised by an admin when the target is proved.
        </p>
      )}
    </div>
  )
}
