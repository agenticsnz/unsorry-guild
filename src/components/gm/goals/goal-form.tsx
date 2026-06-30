'use client'

import { useRef } from 'react'
import { createPrizeAction } from '@/lib/prizes/admin-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { GOAL_CANDIDATES_LIST_ID } from './goal-candidates-datalist'

/** Create-Goal form: a headline-target picker (datalist of read-only unsorry
 *  targets, still accepts a free id) + title / description / badge. */
export function GoalForm() {
  const formRef = useRef<HTMLFormElement>(null)
  return (
    <form
      ref={formRef}
      action={async (fd) => {
        await createPrizeAction(fd)
        formRef.current?.reset()
      }}
      className="space-y-3"
    >
      <div className="space-y-1">
        <Label htmlFor="headlineGoalId">Headline target</Label>
        <Input
          id="headlineGoalId"
          name="headlineGoalId"
          list={GOAL_CANDIDATES_LIST_ID}
          placeholder="Pick a goal or suite target — or type any goal id"
          autoComplete="off"
          required
        />
        <p className="text-xs text-foreground/50">
          Sourced from unsorry&rsquo;s goals + benchmark suites. Not listed? See the authoring guide
          below.
        </p>
      </div>
      <div className="space-y-1">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" placeholder="Sum of Two Squares = 3·Square" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={2} placeholder="What this target proves" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="badgeEmoji">Badge</Label>
        <Input id="badgeEmoji" name="badgeEmoji" defaultValue="🟦" className="w-24" />
      </div>
      <Button type="submit">Create goal</Button>
    </form>
  )
}
