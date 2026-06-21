import Link from 'next/link'
import type { PrizeBadge } from '@/lib/profiles/contributor'

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

export function TargetBadges({ badges }: { badges: PrizeBadge[] }) {
  if (badges.length === 0) {
    return <p className="text-sm text-foreground/70">No goal contributions yet.</p>
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {badges.map((b) => (
        <Link
          key={b.headlineGoalId}
          href={`/math/goals/${b.headlineGoalId}`}
          className="rounded-lg border p-4 flex items-center gap-3 hover:border-primary transition-colors"
        >
          <span className="text-2xl" aria-hidden>
            {b.place ? MEDAL[b.place] : b.badgeEmoji}
          </span>
          <div>
            <div className="font-medium">{b.prizeTitle}</div>
            <div className="text-xs text-foreground/70">
              {b.place ? `Podium #${b.place}` : 'Contributor'} · {b.creditedProofs}{' '}
              {b.creditedProofs === 1 ? 'proof' : 'proofs'}
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
