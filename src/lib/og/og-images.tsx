import { ImageResponse } from 'next/og'
import { getGlobalLeaderboard, getLeaderboardExtras } from '@/lib/unsorry/standings'
import { proofsOverTimeSvg, leaderboardBarSvg } from './chart-svg'

/**
 * Generated images (ADR-026): the social preview (#13) and the auto-updating
 * README images (#14). Composed with next/og (Satori) — the chart bodies are
 * SVG (from chart-svg.ts) embedded as data-URI <img> since Satori has no canvas.
 */
export const OG_SIZE = { width: 1200, height: 630 }

function dataUri(svg: string): string {
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}

function Frame({ subtitle, footer, chart }: { subtitle: string; footer: string; chart: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        background: '#0b1220',
        color: '#e2e8f0',
        padding: '44px 56px',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <span style={{ fontSize: 46, fontWeight: 700 }}>unsorry</span>
        <span style={{ fontSize: 46, color: '#d97757' }}>swarm</span>
        <span style={{ fontSize: 26, color: '#94a3b8', marginLeft: 16 }}>{subtitle}</span>
      </div>
      <div style={{ display: 'flex', flex: 1, marginTop: 16, marginBottom: 8 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={chart} width={1088} height={446} alt="" />
      </div>
      <div style={{ display: 'flex', fontSize: 22, color: '#94a3b8' }}>{footer}</div>
    </div>
  )
}

export async function proofsOverTimeImage(): Promise<ImageResponse> {
  let merge: Awaited<ReturnType<typeof getLeaderboardExtras>>['timelines'] = null
  try {
    merge = (await getLeaderboardExtras()).timelines
  } catch {
    merge = null
  }
  const series = merge?.merge ?? []
  const total = series.length ? series[series.length - 1].cumulative_proofs : 0
  return new ImageResponse(
    (
      <Frame
        subtitle="Proofs over time"
        footer={`${total.toLocaleString()} cumulative verified proofs · swarm.unsorry.agentics.org.nz`}
        chart={dataUri(proofsOverTimeSvg(series, 1088, 446))}
      />
    ),
    OG_SIZE,
  )
}

export async function leaderboardImage(): Promise<ImageResponse> {
  let entries: Awaited<ReturnType<typeof getGlobalLeaderboard>> = []
  try {
    entries = await getGlobalLeaderboard()
  } catch {
    entries = []
  }
  const data = entries.slice(0, 10).map((e) => ({ label: e.displayName, value: e.score }))
  return new ImageResponse(
    (
      <Frame
        subtitle="Leaderboard"
        footer="Difficulty-weighted verified proofs · swarm.unsorry.agentics.org.nz"
        chart={dataUri(leaderboardBarSvg(data, 1088, 446))}
      />
    ),
    OG_SIZE,
  )
}
