/**
 * Standard competition ranking ("1224"): items with an equal score share the
 * same rank and the next distinct score skips ahead accordingly. The single
 * source of truth for rank assignment across every standings surface (DRY,
 * SPEC-018-B / issue #1 #11).
 *
 * Input MUST be pre-sorted descending by score (callers sort with a deterministic
 * tiebreak, e.g. the GitHub handle, so ordering within a tie is stable).
 */
export function assignRanks<T>(
  items: T[],
  score: (item: T) => number,
): (T & { rank: number })[] {
  let prevScore: number | null = null
  let prevRank = 0
  return items.map((item, i) => {
    const s = score(item)
    const rank = prevScore !== null && s === prevScore ? prevRank : i + 1
    prevScore = s
    prevRank = rank
    return { ...item, rank }
  })
}
