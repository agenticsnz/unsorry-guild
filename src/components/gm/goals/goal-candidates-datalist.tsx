import { candidateLabel, type GoalCandidate } from '@/lib/prizes/goal-candidates'

/** Shared `<datalist>` of pickable unsorry targets, referenced by `list` from the
 *  create and edit inputs (rendered once — DRY). Plain HTML, server-safe. */
export const GOAL_CANDIDATES_LIST_ID = 'goal-candidates'

export function GoalCandidatesDatalist({ candidates }: { candidates: GoalCandidate[] }) {
  return (
    <datalist id={GOAL_CANDIDATES_LIST_ID}>
      {candidates.map((c) => (
        <option key={c.id} value={c.id}>
          {candidateLabel(c)}
        </option>
      ))}
    </datalist>
  )
}
