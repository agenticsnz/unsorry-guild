/**
 * The proof-territory map's data contract (agenticsnz/unsorry `docs/territory.json`,
 * served push-on-merge). Each credited proof is positioned by an SVD of the mathlib
 * typeclass machinery it touches, so 2-D distance ≈ shared territory: genuine
 * high-machinery proofs separate out, redundant restatement farms collapse together.
 * Colour = redundancy class, size = machinery, edges = real dependencies into the
 * typeclass landmarks. The guild reads this read-only; the layout is computed
 * upstream (structure-only — never the proof names), so this module is just the
 * shape plus the pure view geometry the canvas needs.
 */

/** Redundancy class: genuine machinery / mere restatement / shallow. */
export type RedundancyClass = 'g' | 'r' | 's'

export interface TerritoryProof {
  /** Proof (declaration) name — display label only, never a layout signal. */
  n: string
  x: number
  y: number
  /** Machinery score (specialized typeclass incidence); drives node size. */
  m: number
  c: RedundancyClass
  /** Region size: how many proofs share this proof's territory region. */
  r: number
  /** Indices into `land` — this proof's real dependency edges. */
  e: number[]
}

export interface TerritoryLandmark {
  /** Mathlib typeclass / abstraction name. */
  n: string
  x: number
  y: number
  /** Label the landmark at rest (otherwise only on hover). */
  l?: boolean
}

export interface TerritoryStats {
  total: number
  genuine: number
  restatement: number
  shallow: number
  regions: number
  redundant_fraction: number
}

export interface TerritoryData {
  schema?: string
  generated_at?: string
  source?: string
  stats: TerritoryStats
  land: TerritoryLandmark[]
  proofs: TerritoryProof[]
}

export interface TerritoryBounds {
  x0: number
  y0: number
  x1: number
  y1: number
}

/** Axis-aligned bounds of the proof cloud, used to fit the view. Empty → a unit
 * box so the caller's fit math never divides by zero. */
export function territoryBounds(proofs: readonly TerritoryProof[]): TerritoryBounds {
  if (proofs.length === 0) return { x0: 0, y0: 0, x1: 1, y1: 1 }
  let x0 = Infinity,
    y0 = Infinity,
    x1 = -Infinity,
    y1 = -Infinity
  for (const p of proofs) {
    if (p.x < x0) x0 = p.x
    if (p.y < y0) y0 = p.y
    if (p.x > x1) x1 = p.x
    if (p.y > y1) y1 = p.y
  }
  return { x0, y0, x1, y1 }
}

const CLASS_LABEL: Record<RedundancyClass, string> = {
  g: 'genuine',
  r: 'restatement',
  s: 'shallow',
}

/** Human label for a redundancy class (unknown → 'shallow', the safe default). */
export function classLabel(c: string): string {
  return CLASS_LABEL[c as RedundancyClass] ?? 'shallow'
}

/** Redundant fraction as a one-decimal percentage string, e.g. '95.1%'. */
export function redundantPercent(stats: TerritoryStats): string {
  return `${(stats.redundant_fraction * 100).toFixed(1)}%`
}
