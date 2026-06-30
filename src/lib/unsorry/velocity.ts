import type { TimelinePoint } from './types'

/** Proofs merged within recent windows, for the admin overview's activity pulse. */
export interface ProofVelocity {
  last24h: number
  last7d: number
}

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Sum the proofs merged in the last 24 h and 7 d from the hourly merge timeline
 * (`leaderboard-ui.json` `timelines.merge`, buckets `…THH:00:00Z`). Pure: `now`
 * is injected so it is deterministic and testable. Future-dated and unparseable
 * buckets are ignored.
 */
export function proofVelocity(merge: TimelinePoint[], now: Date): ProofVelocity {
  const nowMs = now.getTime()
  let last24h = 0
  let last7d = 0
  for (const p of merge) {
    const ms = Date.parse(p.t)
    if (!Number.isFinite(ms)) continue
    const age = nowMs - ms
    if (age < 0) continue
    if (age <= 7 * DAY_MS) last7d += p.proofs
    if (age <= DAY_MS) last24h += p.proofs
  }
  return { last24h, last7d }
}
