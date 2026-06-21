import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { SourcingEntry } from '@/lib/unsorry/types'

export function SourcingTable({ entries }: { entries: SourcingEntry[] }) {
  const sorted = [...entries].sort((a, b) => b.sourced_goals - a.sourced_goals)
  if (sorted.length === 0) {
    return <p className="text-sm text-foreground/70">No sourcing data.</p>
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Sourcer</TableHead>
          <TableHead className="text-right">Sourced</TableHead>
          <TableHead className="text-right">Proved</TableHead>
          <TableHead className="text-right hidden sm:table-cell">Open</TableHead>
          <TableHead className="text-right hidden sm:table-cell">Difficulty</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((s) => (
          <TableRow key={s.github}>
            <TableCell>
              <Link href={`/math/contributors/${s.github}`} className="font-medium hover:underline">
                {s.display_name ?? `@${s.github}`}
              </Link>
            </TableCell>
            <TableCell className="text-right tabular-nums">{s.sourced_goals.toLocaleString()}</TableCell>
            <TableCell className="text-right tabular-nums">{s.proved.toLocaleString()}</TableCell>
            <TableCell className="text-right tabular-nums hidden sm:table-cell">{s.open.toLocaleString()}</TableCell>
            <TableCell className="text-right tabular-nums hidden sm:table-cell">{s.difficulty_points.toLocaleString()}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
