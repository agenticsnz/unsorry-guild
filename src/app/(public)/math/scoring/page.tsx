import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export const metadata = { title: 'How scores are calculated · Math · unsorry-guild' }

/** Static methodology page for the leaderboard score. Mirrors unsorry's
 *  leaderboard score_policy (docs/metrics/leaderboard-ui.json → score_policy,
 *  generate.py `_score`). Plain content — no data fetch. */
export default function ScoringPage() {
  const terms = [
    {
      term: 'Difficulty points',
      weight: '× 100',
      meaning:
        'The summed difficulty of every proof you are credited for. The single biggest lever for most contributors.',
    },
    {
      term: 'Credited proofs',
      weight: '× 25',
      meaning: 'A flat bonus for each proof credited to you, regardless of its difficulty.',
    },
    {
      term: 'Dispatch points',
      weight: '× 100',
      meaning:
        'A flat 0.9 points for each proof PR you opened or landed for another contributor. Self-dispatch is excluded — you cannot farm it on your own PRs.',
    },
  ]

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">How scores are calculated</h1>
        <p className="text-foreground/70 max-w-2xl">
          Leaderboard rank is by <strong>score</strong>, descending — not by proof count or
          difficulty alone. Score adds three weighted components, so the ranking rewards hard
          proofs, sustained output, <em>and</em> the dispatch work that keeps the swarm merging.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">The formula</h2>
        <pre className="overflow-x-auto rounded-lg border bg-muted/40 p-4 text-sm">
          {`score = difficulty_points × 100
      + credited_proofs   × 25
      + dispatch_points   × 100`}
        </pre>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Component</TableHead>
              <TableHead className="w-20 text-right">Weight</TableHead>
              <TableHead>What it measures</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {terms.map((t) => (
              <TableRow key={t.term}>
                <TableCell className="font-medium whitespace-nowrap">{t.term}</TableCell>
                <TableCell className="text-right tabular-nums">{t.weight}</TableCell>
                <TableCell className="text-foreground/80">{t.meaning}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">What is dispatch credit?</h2>
        <p className="text-foreground/80 max-w-2xl">
          The swarm does not merge anything without a dispatcher: someone has to open the proof
          PR and land it on the branch. That plumbing is load-bearing, so each proof PR you land
          for <em>another</em> contributor earns a flat <strong>0.9 points</strong> (worth nearly
          a full proof) — independent of that proof&rsquo;s difficulty. Opening your own PR
          (self-dispatch) earns nothing extra, so a high-volume prover cannot also farm dispatch
          points.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Worked example</h2>
        <p className="text-foreground/80 max-w-2xl">
          This is why a contributor can rank highly without topping the proof count. Take a
          dispatcher with 191 credited proofs, 297 difficulty points, and 1,306 PRs landed for
          others:
        </p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Component</TableHead>
              <TableHead>Calculation</TableHead>
              <TableHead className="text-right">Points</TableHead>
              <TableHead className="text-right">Share</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Difficulty points</TableCell>
              <TableCell className="tabular-nums text-foreground/70">297 × 100</TableCell>
              <TableCell className="text-right tabular-nums">29,700</TableCell>
              <TableCell className="text-right tabular-nums text-foreground/70">20%</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Credited proofs</TableCell>
              <TableCell className="tabular-nums text-foreground/70">191 × 25</TableCell>
              <TableCell className="text-right tabular-nums">4,775</TableCell>
              <TableCell className="text-right tabular-nums text-foreground/70">3%</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Dispatch points</TableCell>
              <TableCell className="tabular-nums text-foreground/70">1,306 × 0.9 × 100</TableCell>
              <TableCell className="text-right tabular-nums">117,540</TableCell>
              <TableCell className="text-right tabular-nums text-foreground/70">77%</TableCell>
            </TableRow>
            <TableRow className="font-semibold">
              <TableCell>Total score</TableCell>
              <TableCell />
              <TableCell className="text-right tabular-nums">152,015</TableCell>
              <TableCell className="text-right tabular-nums">100%</TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <p className="text-sm text-foreground/60 max-w-2xl">
          Over three quarters of that score is dispatch credit — the operator role — which is why
          the rank is far higher than the proof and difficulty columns alone would suggest.
        </p>
      </section>

      <p className="text-sm text-foreground/60">
        <Link href="/math/leaderboard" className="underline hover:text-foreground">
          ← Back to the leaderboard
        </Link>
      </p>
    </div>
  )
}
