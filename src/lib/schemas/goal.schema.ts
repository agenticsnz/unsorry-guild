import { z } from 'zod'

/**
 * A guild Goal (the `prizes` curation overlay, ADR-018/036): a read-only unsorry
 * headline target wrapped with admin-authored presentation. Shared by the create
 * and edit admin actions so the validation rule lives once (DRY).
 */
export const goalSchema = z.object({
  headlineGoalId: z
    .string()
    .trim()
    .min(1, 'A headline goal id is required')
    .max(200, 'Goal id is too long'),
  title: z.string().trim().min(1, 'A title is required').max(120, 'Title must be 120 chars or less'),
  description: z.string().trim().max(500, 'Description must be 500 chars or less').optional(),
  badgeEmoji: z.string().trim().max(8, 'Badge must be 8 chars or less').optional(),
})

export type GoalFormData = z.infer<typeof goalSchema>

export type GoalFormResult =
  | { ok: true; data: GoalFormData }
  | { ok: false; error: string }

/**
 * Validate a Goal admin form submission. Pure — the server actions call this and
 * branch on the result rather than throwing. Empty optional fields become
 * `undefined` so the action can map them to a column default / null.
 */
export function parseGoalForm(fd: FormData): GoalFormResult {
  const raw = {
    headlineGoalId: String(fd.get('headlineGoalId') ?? ''),
    title: String(fd.get('title') ?? ''),
    description: String(fd.get('description') ?? '') || undefined,
    badgeEmoji: String(fd.get('badgeEmoji') ?? '') || undefined,
  }
  const parsed = goalSchema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid goal' }
  }
  return { ok: true, data: parsed.data }
}
