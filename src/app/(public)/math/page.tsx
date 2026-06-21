import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata = { title: 'Math · unsorry-guild' }

export default function MathHome() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Math</h1>
        <p className="text-foreground/70 max-w-2xl">
          The unsorry swarm proves theorems. Climb the leaderboard by contributing
          verified proofs to the Math corpus.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/math/leaderboard">
          <Card className="hover:border-primary transition-colors h-full">
            <CardHeader>
              <CardTitle>Leaderboard</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-foreground/70">
              Top contributors ranked by difficulty-weighted verified proofs.
            </CardContent>
          </Card>
        </Link>
        <Link href="/math/prizes">
          <Card className="hover:border-primary transition-colors h-full">
            <CardHeader>
              <CardTitle>Prizes</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-foreground/70">
              Flagship targets with per-prize leaderboards, podiums, and badges.
            </CardContent>
          </Card>
        </Link>
        <Link href="/math/showcase">
          <Card className="hover:border-primary transition-colors h-full">
            <CardHeader>
              <CardTitle>Showcase</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-foreground/70">
              Highlighted proofs from the Math corpus.
            </CardContent>
          </Card>
        </Link>
        <Link href="/math/proof-graph">
          <Card className="hover:border-primary transition-colors h-full">
            <CardHeader>
              <CardTitle>Proof graph</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-foreground/70">
              Proofs and contributors, visualised.
            </CardContent>
          </Card>
        </Link>
        <Link href="/math/queue">
          <Card className="hover:border-primary transition-colors h-full">
            <CardHeader>
              <CardTitle>Queue</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-foreground/70">
              In-flight proving work waiting to merge.
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
