import Image from 'next/image'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { ContributorModels } from '@/lib/unsorry/model-registry'

function pct(part: number, whole: number): string {
  if (whole <= 0) return '0%'
  return `${Math.round((part / whole) * 100)}%`
}

/**
 * A contributor's "favourite models": the engines (provider/model) behind their
 * verified proofs, each with its Pokémon sprite, the number of proofs it
 * discharged for them, and that engine's share of their attributed proofs. The
 * proof term of the score (and most of the difficulty term) flows through these
 * engines, so this is the "how" behind the standing above. Presentational — safe
 * in a Server Component.
 */
export function FavouriteModels({ models }: { models: ContributorModels }) {
  const { rows, total } = models
  if (rows.length === 0) {
    return (
      <p className="text-sm text-foreground/70">
        No per-proof model provenance recorded yet for this contributor.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Model</TableHead>
            <TableHead className="text-right">Proofs</TableHead>
            <TableHead className="text-right">Share</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const poke = row.registry?.pokemon
            const identity = (
              <span className="flex min-w-0 items-center gap-2">
                {poke ? (
                  <Image
                    src={poke.sprite_url}
                    alt={poke.name}
                    width={28}
                    height={28}
                    unoptimized
                    className="h-7 w-7 shrink-0 [image-rendering:pixelated]"
                  />
                ) : (
                  <span className="h-7 w-7 shrink-0" aria-hidden />
                )}
                <span className="truncate font-mono text-xs">{row.providerModel}</span>
                {poke && <span className="shrink-0 text-foreground/50">{poke.name}</span>}
              </span>
            )
            return (
              <TableRow key={row.providerModel}>
                <TableCell className="font-medium">
                  {row.registry ? (
                    <Link
                      href={`/math/models/${row.registry.slug}`}
                      className="min-w-0 rounded hover:underline focus:outline-none focus:ring-2 focus:ring-brand"
                    >
                      {identity}
                    </Link>
                  ) : (
                    identity
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.proofs.toLocaleString()}
                </TableCell>
                <TableCell className="text-right tabular-nums text-foreground/70">
                  {pct(row.proofs, total)}
                </TableCell>
              </TableRow>
            )
          })}
          <TableRow className="font-semibold">
            <TableCell>Attributed proofs</TableCell>
            <TableCell className="text-right tabular-nums">{total.toLocaleString()}</TableCell>
            <TableCell className="text-right tabular-nums">100%</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <p className="text-xs text-foreground/60">
        Counts verified proofs by the engine that discharged them, from each proof&rsquo;s recorded
        provenance. Proofs landed before model logging (or with attribution inferred from git
        history) carry no engine and aren&rsquo;t counted here, so this may total fewer than the
        credited-proofs figure above.
      </p>
    </div>
  )
}
