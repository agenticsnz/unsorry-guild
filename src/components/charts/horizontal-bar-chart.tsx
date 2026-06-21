'use client'

import './register'
import { Bar } from 'react-chartjs-2'
import type { ChartOptions } from 'chart.js'
import { BRAND, TOOLTIP, axisTick, gridLines, gridHidden } from './theme'

/**
 * Horizontal bar chart (ADR-023) — used for the leaderboard "like the original"
 * (#3) and the sourcing tab (#5). Height scales with the number of bars.
 */
export function HorizontalBarChart({
  labels,
  values,
  label,
  height,
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
  }

  const h = height ?? Math.max(160, labels.length * 30 + 40)

  return (
    <div className="rounded-lg border bg-card p-3" style={{ height: h }}>
      <Bar data={data} options={options} aria-label={label} role="img" />
    </div>
  )
}
