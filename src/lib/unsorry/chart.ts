import type { TimelinePoint } from './types'

export interface AreaChart {
  linePath: string
  areaPath: string
  width: number
  height: number
  max: number
  points: { x: number; y: number; point: TimelinePoint }[]
}

/**
 * Build SVG path strings for a cumulative-proofs area chart from timeline points.
 * Pure (no DOM) — unit-tested; rendered as inline SVG (no chart dependency).
 */
export function buildAreaChart(
  series: TimelinePoint[],
  width = 720,
  height = 200,
  pad = 6,
): AreaChart {
  const n = series.length
  if (n === 0) {
    return { linePath: '', areaPath: '', width, height, max: 0, points: [] }
  }
  const max = Math.max(...series.map((p) => p.cumulative_proofs), 1)
  const innerW = width - pad * 2
  const innerH = height - pad * 2

  const points = series.map((point, i) => {
    const x = pad + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW)
    const y = pad + innerH - (point.cumulative_proofs / max) * innerH
    return { x, y, point }
  })

  const linePath = points
    .map((q, i) => `${i === 0 ? 'M' : 'L'}${q.x.toFixed(1)},${q.y.toFixed(1)}`)
    .join(' ')
  const baseY = (height - pad).toFixed(1)
  const areaPath = `${linePath} L${points[n - 1].x.toFixed(1)},${baseY} L${points[0].x.toFixed(1)},${baseY} Z`

  return { linePath, areaPath, width, height, max, points }
}
