'use client'

import { useState } from 'react'
import { updatePrizeAction, deletePrizeAction, openSeasonAction, closeAndAwardAction } from '@/lib/prizes/admin-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { GOAL_CANDIDATES_LIST_ID } from './goal-candidates-datalist'
import type { Prize } from '@/lib/prizes/prizes'

/** Per-Goal admin controls: edit (dialog), delete (confirm), and the season
 *  lifecycle (open / close & award). All call the gated server actions. */
export function GoalRowActions({ prize }: { prize: Prize }) {
  const [editOpen, setEditOpen] = useState(false)

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Open season */}
      <form action={openSeasonAction}>
        <input type="hidden" name="prizeId" value={prize.id} />
        <Button type="submit" variant="outline" size="sm">
          Open season
        </Button>
      </form>

      {/* Close & award */}
      <form action={closeAndAwardAction}>
        <input type="hidden" name="prizeId" value={prize.id} />
        <input type="hidden" name="headlineGoalId" value={prize.headlineGoalId} />
        <Button type="submit" size="sm">
          Close &amp; award
        </Button>
      </form>

      {/* Edit */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm">
            Edit
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit goal</DialogTitle>
            <DialogDescription>Update the curated presentation for this target.</DialogDescription>
          </DialogHeader>
          <form
            action={async (fd) => {
              await updatePrizeAction(fd)
              setEditOpen(false)
            }}
            className="space-y-3"
          >
            <input type="hidden" name="id" value={prize.id} />
            <div className="space-y-1">
              <Label htmlFor={`edit-goal-${prize.id}`}>Headline target</Label>
              <Input
                id={`edit-goal-${prize.id}`}
                name="headlineGoalId"
                list={GOAL_CANDIDATES_LIST_ID}
                defaultValue={prize.headlineGoalId}
                autoComplete="off"
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`edit-title-${prize.id}`}>Title</Label>
              <Input id={`edit-title-${prize.id}`} name="title" defaultValue={prize.title} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`edit-desc-${prize.id}`}>Description</Label>
              <Textarea
                id={`edit-desc-${prize.id}`}
                name="description"
                rows={2}
                defaultValue={prize.description}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`edit-badge-${prize.id}`}>Badge</Label>
              <Input
                id={`edit-badge-${prize.id}`}
                name="badgeEmoji"
                defaultValue={prize.badgeEmoji}
                className="w-24"
              />
            </div>
            <DialogFooter>
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
            Delete
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{prize.title}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the goal and all its seasons and awards. The underlying unsorry proof goal
              is unaffected. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <form action={deletePrizeAction}>
              <input type="hidden" name="id" value={prize.id} />
              <AlertDialogAction type="submit">Delete</AlertDialogAction>
            </form>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
