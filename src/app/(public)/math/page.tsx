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
      </div>
    </div>
  )
}
