'use client'

import './register'
import { Line } from 'react-chartjs-2'
import type { ChartOptions } from 'chart.js'
import { BRAND, BRAND_FILL, TOOLTIP, axisTick, gridLines, gridHidden } from './theme'

/**
 * Interactive cumulative line chart (ADR-023). `index`-mode hover shows a tooltip
 * beside the cursor with the value at that point; smooth line, point markers, and
 * horizontal gridlines — issue #1 #4.
 */
export function LineChart({
  labels,
  values,
  label,
  height = 280,
}: {
  labels: string[]
  values: number[]
  label: string
  height?: number
}) {
  const data = {
    labels,
    datasets: [
      {
        label,
        data: values,
        borderColor: BRAND,
        backgroundColor: BRAND_FILL,
        fill: true,
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 2,
        pointHoverRadius: 5,
        pointBackgroundColor: BRAND,
      },
    ],
  }

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: { ...TOOLTIP, mode: 'index', intersect: false },
    },
    scales: {
      x: { grid: gridHidden, ticks: { ...axisTick, maxTicksLimit: 8 } },
      y: { beginAtZero: true, grid: gridLines, ticks: axisTick },
    },
  }

  return (
    <div className="rounded-lg border bg-card p-3" style={{ height }}>
      <Line data={data} options={options} aria-label={label} role="img" />
    </div>
  )
}
