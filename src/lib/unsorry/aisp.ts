/**
 * Minimal parser for unsorry AISP records (library/index/*.aisp, proof-runs/*.aisp).
 *
 * A record is a set of `key≜value` pairs grouped in `⟦Label⟧{ ... }` blocks,
 * pairs separated by `;`. We only need to pluck named fields, so we scan for
 * `key≜value` tokens, stopping a value at `;`, `}`, newline, or a block delimiter.
 */
const FIELD_RE = /([A-Za-z_][A-Za-z0-9_]*)≜([^;}\n⟦⟧]*)/g

/** Returns the first value seen for each field key. */
export function parseAispFields(text: string): Record<string, string> {
  const out: Record<string, string> = {}
  FIELD_RE.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = FIELD_RE.exec(text)) !== null) {
    const key = match[1]
    const value = match[2].trim()
    if (value && !(key in out)) out[key] = value
  }
  return out
}

export interface LibraryIndexRecord {
  goal?: string
  solver?: string
  name?: string
}

/** Parse a library/index/*.aisp record into its goal → credited-solver mapping. */
export function parseLibraryIndexRecord(text: string): LibraryIndexRecord {
  const f = parseAispFields(text)
  return { goal: f.goal, solver: f.solver, name: f.name }
}
