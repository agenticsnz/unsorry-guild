import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { TargetLeaderboardEntry } from '@/lib/unsorry/types'

function rankLabel(rank: number): string {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return `#${rank}`
}

export function TargetLeaderboardTable({ entries }: { entries: TargetLeaderboardEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-foreground/70">
        No attributed contributions yet for this target.
      </p>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">Rank</TableHead>
          <TableHead>Contributor</TableHead>
          <TableHead className="text-right">Score</TableHead>
          <TableHead className="text-right hidden sm:table-cell">Proofs</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((e) => (
          <TableRow key={e.github}>
            <TableCell className="font-medium">{rankLabel(e.rank)}</TableCell>
            <TableCell>
              <Link href={`/math/contributors/${e.github}`} className="font-medium hover:underline">
                @{e.github}
              </Link>
            </TableCell>
            <TableCell className="text-right tabular-nums">{e.score.toLocaleString()}</TableCell>
            <TableCell className="text-right tabular-nums hidden sm:table-cell">
              {e.creditedProofs}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
