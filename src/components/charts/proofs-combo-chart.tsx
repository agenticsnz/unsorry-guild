'use client'

import './register'
import { Chart } from 'react-chartjs-2'
import type { ChartData, ChartOptions } from 'chart.js'
import { BRAND, BRAND_FILL, BRAND_BAR, TOOLTIP, axisTick, gridLines, gridHidden } from './theme'

/**
 * Proofs-over-time combo (ADR-023, #4): per-period proofs as bars overlaid under
 * the cumulative line (like the original), with a hover tooltip beside the cursor.
 */
export function ProofsComboChart({
  labels,
  proofs,
  cumulative,
  height = 300,
}: {
  labels: string[]
  proofs: number[]
  cumulative: number[]
  height?: number
}) {
  const data: ChartData<'bar' | 'line'> = {
    labels,
    datasets: [
      {
        type: 'line' as const,
        label: 'Cumulative',
        data: cumulative,
        borderColor: BRAND,
        backgroundColor: BRAND_FILL,
        fill: true,
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 2,
        pointHoverRadius: 5,
        pointBackgroundColor: BRAND,
        yAxisID: 'y',
        order: 1,
      },
      {
        type: 'bar' as const,
        label: 'Per period',
        data: proofs,
        backgroundColor: BRAND_BAR,
        yAxisID: 'y1',
        order: 2,
      },
    ],
  }

  const options: ChartOptions<'bar' | 'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: true, labels: { color: 'rgba(148,163,184,0.9)' } },
      tooltip: { ...TOOLTIP, mode: 'index', intersect: false },
    },
    scales: {
      x: { grid: gridHidden, ticks: { ...axisTick, maxTicksLimit: 8 } },
      y: { type: 'linear', position: 'left', beginAtZero: true, grid: gridLines, ticks: axisTick },
      y1: {
        type: 'linear',
        position: 'right',
        beginAtZero: true,
        grid: gridHidden,
        ticks: axisTick,
      },
    },
  }

  return (
    <div className="rounded-lg border bg-card p-3" style={{ height }}>
      <Chart type="bar" data={data} options={options} aria-label="Proofs over time" role="img" />
    </div>
  )
}
