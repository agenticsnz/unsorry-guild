import { describe, it, expect } from 'vitest'
import { parseGoalForm, goalSchema } from '@/lib/schemas/goal.schema'

const form = (entries: Record<string, string>): FormData => {
  const fd = new FormData()
  for (const [k, v] of Object.entries(entries)) fd.set(k, v)
  return fd
}

describe('goalSchema', () => {
  it('accepts a minimal valid goal and trims', () => {
    const r = goalSchema.safeParse({ headlineGoalId: '  g-foo ', title: ' My goal ' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data).toEqual({ headlineGoalId: 'g-foo', title: 'My goal' })
  })

  it('rejects an empty title or goal id', () => {
    expect(goalSchema.safeParse({ headlineGoalId: '', title: 'x' }).success).toBe(false)
    expect(goalSchema.safeParse({ headlineGoalId: 'g', title: '' }).success).toBe(false)
  })

  it('rejects an over-length title', () => {
    expect(goalSchema.safeParse({ headlineGoalId: 'g', title: 'x'.repeat(121) }).success).toBe(false)
  })
})

describe('parseGoalForm', () => {
  it('parses a full form', () => {
    const r = parseGoalForm(
      form({ headlineGoalId: 'g-foo', title: 'Foo', description: 'desc', badgeEmoji: '🟦' }),
    )
    expect(r).toEqual({
      ok: true,
      data: { headlineGoalId: 'g-foo', title: 'Foo', description: 'desc', badgeEmoji: '🟦' },
    })
  })

  it('maps empty optional fields to undefined', () => {
    const r = parseGoalForm(form({ headlineGoalId: 'g', title: 'T', description: '', badgeEmoji: '' }))
    expect(r).toEqual({ ok: true, data: { headlineGoalId: 'g', title: 'T' } })
  })

  it('returns an error message on invalid input', () => {
    const r = parseGoalForm(form({ headlineGoalId: '', title: '' }))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/required/i)
  })
})
