import { buildAreaChart } from '@/lib/unsorry/chart'
import type { TimelinePoint } from '@/lib/unsorry/types'

/**
 * Server-side SVG renderers for generated images (ADR-026). `next/og` (Satori)
 * cannot run a `<canvas>`, so the on-screen Chart.js charts are re-expressed as
 * static SVG here — reusing `buildAreaChart` for the path geometry. Embedded into
 * the OG/README images as a data-URI `<img>`. Pure + unit-tested.
 */
const BRAND = '#d97757'
const GRID = 'rgba(148,163,184,0.25)'
const INK = 'rgba(226,232,240,0.85)'

export function proofsOverTimeSvg(series: TimelinePoint[], width = 1040, height = 420): string {
  const chart = buildAreaChart(series, width, height, 16)
  const rows = 4
  const gridlines = Array.from({ length: rows + 1 }, (_, i) => {
    const y = (chart.height / rows) * i
    return `<line x1="0" y1="${y.toFixed(1)}" x2="${width}" y2="${y.toFixed(1)}" stroke="${GRID}" stroke-width="1" />`
  }).join('')

  const body =
    series.length === 0
      ? `<text x="${width / 2}" y="${height / 2}" fill="${INK}" font-size="20" text-anchor="middle">No timeline data</text>`
      : `${gridlines}` +
        `<path d="${chart.areaPath}" fill="${BRAND}" fill-opacity="0.18" />` +
        `<path d="${chart.linePath}" fill="none" stroke="${BRAND}" stroke-width="3" />`

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${body}</svg>`
}

export interface BarDatum {
  label: string
  value: number
}

export function leaderboardBarSvg(data: BarDatum[], width = 1040, height = 460): string {
  if (data.length === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"><text x="${width / 2}" y="${height / 2}" fill="${INK}" font-size="20" text-anchor="middle">No data</text></svg>`
  }
  const max = Math.max(...data.map((d) => d.value), 1)
  const rowH = height / data.length
  const barH = Math.min(34, rowH * 0.62)
  const labelW = 260
  const barMaxW = width - labelW - 120

  const rows = data
    .map((d, i) => {
      const y = i * rowH + (rowH - barH) / 2
      const w = Math.max(2, (d.value / max) * barMaxW)
      return (
        `<text x="${labelW - 12}" y="${(y + barH / 2 + 6).toFixed(1)}" fill="${INK}" font-size="20" text-anchor="end">${escapeXml(d.label)}</text>` +
        `<rect x="${labelW}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${barH}" rx="6" fill="${BRAND}" />` +
        `<text x="${(labelW + w + 10).toFixed(1)}" y="${(y + barH / 2 + 6).toFixed(1)}" fill="${INK}" font-size="18">${d.value.toLocaleString()}</text>`
      )
    })
    .join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${rows}</svg>`
}

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) =>
    c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '&' ? '&amp;' : c === "'" ? '&apos;' : '&quot;',
  )
}
