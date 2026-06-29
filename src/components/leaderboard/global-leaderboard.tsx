import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { GuildLeaderboardEntry } from '@/lib/unsorry/types'

function rankLabel(rank: number): string {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return `#${rank}`
}

/**
 * Presentational global leaderboard over guild-normalised rows (ADR-015).
 * No hooks / no Supabase — safe to render in a Server Component.
 */
export function GlobalLeaderboard({ entries }: { entries: GuildLeaderboardEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-foreground/70">No contributors yet.</p>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">Rank</TableHead>
          <TableHead>Contributor</TableHead>
          <TableHead className="text-right">Score</TableHead>
          <TableHead className="text-right hidden sm:table-cell">Difficulty</TableHead>
          <TableHead className="text-right hidden sm:table-cell">Proofs</TableHead>
          <TableHead className="text-right hidden sm:table-cell">Dispatch</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((e) => {
          // A handle-less contributor (github: null — provenance optional upstream)
          // has no profile to link to: render the same row, unlinked, with initials
          // from the display name. Never dereference a null handle. (#43)
          const initials = (e.github ?? e.displayName).slice(0, 2).toUpperCase()
          const who = (
            <>
              <Avatar className="h-8 w-8">
                <AvatarImage src={e.avatarUrl} alt={e.displayName} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <span className="font-medium">{e.displayName}</span>
            </>
          )
          return (
            <TableRow key={e.github ?? e.displayName}>
              <TableCell className="font-medium">{rankLabel(e.rank)}</TableCell>
              <TableCell>
                {e.github ? (
                  <Link
                    href={`/math/contributors/${e.github}`}
                    className="flex items-center gap-3 hover:underline"
                  >
                    {who}
                  </Link>
                ) : (
                  <span className="flex items-center gap-3">{who}</span>
                )}
              </TableCell>
            <TableCell className="text-right tabular-nums">{e.score.toLocaleString()}</TableCell>
            <TableCell className="text-right tabular-nums hidden sm:table-cell">
              {e.difficultyPoints.toLocaleString()}
            </TableCell>
            <TableCell className="text-right tabular-nums hidden sm:table-cell">
              {e.creditedProofs.toLocaleString()}
            </TableCell>
            <TableCell className="text-right tabular-nums hidden sm:table-cell">
              {e.dispatchProofs > 0 ? e.dispatchProofs.toLocaleString() : '—'}
            </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
