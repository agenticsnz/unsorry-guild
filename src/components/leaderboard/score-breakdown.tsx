import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { GuildLeaderboardEntry } from '@/lib/unsorry/types'

/** Score weights — mirror unsorry's leaderboard score_policy (generate.py `_score`).
 *  score = difficulty_points×100 + credited_proofs×25 + dispatch_points×100. */
const DIFFICULTY_WEIGHT = 100
const PROOF_WEIGHT = 25
const DISPATCH_WEIGHT = 100

function pct(part: number, whole: number): string {
  if (whole <= 0) return '0%'
  return `${Math.round((part / whole) * 100)}%`
}

/**
 * The arithmetic behind a contributor's rank, term by term — so a standing like
 * "191 proofs yet rank 3" is explained by the dispatch term rather than looking
 * broken. Presentational (no hooks): safe in a Server Component.
 */
export function ScoreBreakdown({ entry }: { entry: GuildLeaderboardEntry }) {
  const difficultyTerm = entry.difficultyPoints * DIFFICULTY_WEIGHT
  const proofTerm = entry.creditedProofs * PROOF_WEIGHT
  const dispatchTerm = Math.round(entry.dispatchPoints * DISPATCH_WEIGHT)
  // The leaderboard score is authoritative; the terms reconstruct it.
  const total = entry.score

  const rows = [
    {
      key: 'difficulty',
      label: 'Difficulty points',
      detail: `${entry.difficultyPoints.toLocaleString()} × ${DIFFICULTY_WEIGHT}`,
      points: difficultyTerm,
    },
    {
      key: 'proofs',
      label: 'Proofs (credited)',
      detail: `${entry.creditedProofs.toLocaleString()} × ${PROOF_WEIGHT}`,
      points: proofTerm,
    },
    {
      key: 'dispatch',
      label: 'Dispatch (PRs landed for others)',
      detail: `${entry.dispatchProofs.toLocaleString()} × 0.9 × ${DISPATCH_WEIGHT}`,
      points: dispatchTerm,
    },
  ]

  return (
    <div className="space-y-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Component</TableHead>
            <TableHead className="hidden sm:table-cell">How it&rsquo;s counted</TableHead>
            <TableHead className="text-right">Points</TableHead>
            <TableHead className="text-right">Share</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.key}>
              <TableCell className="font-medium">{row.label}</TableCell>
              <TableCell className="hidden sm:table-cell text-foreground/70 tabular-nums">
                {row.detail}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {row.points.toLocaleString()}
              </TableCell>
              <TableCell className="text-right tabular-nums text-foreground/70">
                {pct(row.points, total)}
              </TableCell>
            </TableRow>
          ))}
          <TableRow className="font-semibold">
            <TableCell>Total score</TableCell>
            <TableCell className="hidden sm:table-cell" />
            <TableCell className="text-right tabular-nums">{total.toLocaleString()}</TableCell>
            <TableCell className="text-right tabular-nums">100%</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <p className="text-xs text-foreground/60">
        Dispatch credit is a flat 0.9 points for each proof PR you opened or landed for{' '}
        <em>another</em> contributor (self-dispatch excluded).{' '}
        <Link href="/math/scoring" className="underline hover:text-foreground">
          How scores are calculated
        </Link>
      </p>
    </div>
  )
}
