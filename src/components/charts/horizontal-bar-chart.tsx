'use client'

import './register'
import { useRouter } from 'next/navigation'
import { Bar } from 'react-chartjs-2'
import type { ChartOptions } from 'chart.js'
import { BRAND, TOOLTIP, axisTick, gridLines, gridHidden } from './theme'

/**
 * Horizontal bar chart (ADR-023) — leaderboard "like the original" (#3) and the
 * sourcing tab (#5). When `hrefs` are supplied, bars/labels are clickable and
 * navigate to the matching contributor profile.
 */
export function HorizontalBarChart({
  labels,
  values,
  label,
  hrefs,
  height,
}: {
  labels: string[]
  values: number[]
  label: string
  hrefs?: string[]
  height?: number
}) {
  const router = useRouter()

  const data = {
    labels,
    datasets: [
      {
        label,
        data: values,
        backgroundColor: BRAND,
        borderRadius: 4,
        maxBarThickness: 22,
      },
    ],
  }

  const options: ChartOptions<'bar'> = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { ...TOOLTIP },
    },
    scales: {
      x: { beginAtZero: true, grid: gridLines, ticks: axisTick },
      y: { grid: gridHidden, ticks: axisTick },
    },
    ...(hrefs
      ? {
          onClick: (_e, elements) => {
            const i = elements[0]?.index
            if (i != null && hrefs[i]) router.push(hrefs[i])
          },
          onHover: (event, elements) => {
            const target = event.native?.target as HTMLElement | undefined
            if (target) target.style.cursor = elements.length ? 'pointer' : 'default'
          },
        }
      : {}),
  }

  const h = height ?? Math.max(160, labels.length * 30 + 40)

  return (
    <div className="rounded-lg border bg-card p-3" style={{ height: h }}>
      <Bar data={data} options={options} aria-label={label} role="img" />
    </div>
  )
}
