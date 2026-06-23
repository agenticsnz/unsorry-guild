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
        {entries.map((e) => (
          <TableRow key={e.github}>
            <TableCell className="font-medium">{rankLabel(e.rank)}</TableCell>
            <TableCell>
              <Link
                href={`/math/contributors/${e.github}`}
                className="flex items-center gap-3 hover:underline"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={e.avatarUrl} alt={e.displayName} />
                  <AvatarFallback>{e.github.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="font-medium">{e.displayName}</span>
              </Link>
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
        ))}
      </TableBody>
    </Table>
  )
}
