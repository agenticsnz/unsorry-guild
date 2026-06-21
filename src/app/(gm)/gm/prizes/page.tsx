import { getPrizes } from '@/lib/prizes/prizes'
import { createPrizeAction, openSeasonAction, closeAndAwardAction } from '@/lib/prizes/admin-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const metadata = { title: 'Prizes · Admin · unsorry-guild' }
export const dynamic = 'force-dynamic'

export default async function GmPrizesPage() {
  const prizes = await getPrizes('math')

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Prize admin</h1>
        <p className="text-sm text-foreground/70">
          Create flagship-target prizes, open a season, and confirm the podium when a target is proved.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New prize</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createPrizeAction} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="headlineGoalId">Headline goal id</Label>
              <Input id="headlineGoalId" name="headlineGoalId" placeholder="sq-add-sq-eq-three-mul-sq" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" placeholder="Sum of Two Squares = 3·Square" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="description">Description</Label>
              <Input id="description" name="description" placeholder="What this target proves" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="badgeEmoji">Badge emoji</Label>
              <Input id="badgeEmoji" name="badgeEmoji" defaultValue="🟦" />
            </div>
            <Button type="submit">Create prize</Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Prizes</h2>
        {prizes.length === 0 ? (
          <p className="text-sm text-foreground/70">No prizes yet.</p>
        ) : (
          prizes.map((p) => (
            <Card key={p.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
                <div>
                  <div className="font-medium">
                    {p.badgeEmoji} {p.title}
                  </div>
                  <div className="text-xs text-foreground/60">
                    <code>{p.headlineGoalId}</code>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={p.status === 'active' ? 'default' : 'secondary'}>{p.status}</Badge>
                  <form action={openSeasonAction}>
                    <input type="hidden" name="prizeId" value={p.id} />
                    <Button type="submit" variant="outline" size="sm">
                      Open season
                    </Button>
                  </form>
                  <form action={closeAndAwardAction}>
                    <input type="hidden" name="prizeId" value={p.id} />
                    <input type="hidden" name="headlineGoalId" value={p.headlineGoalId} />
                    <Button type="submit" size="sm">
                      Close &amp; award
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
