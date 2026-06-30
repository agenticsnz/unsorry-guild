'use client'

import { useEffect, useRef, useState } from 'react'
import {
  type TerritoryData,
  type TerritoryProof,
  territoryBounds,
  classLabel,
  redundantPercent,
} from '@/lib/unsorry/territory'

// Redundancy-class palette (genuine / restatement / shallow), matching the
// upstream static viewer (agenticsnz/unsorry docs/proof-territory.html).
const COL: Record<string, string> = { g: '#2ecc71', r: '#e8a33d', s: '#9aa0a6' }

/**
 * Interactive proof-territory map: each credited proof is positioned by an SVD of
 * the mathlib machinery it touches (distance ≈ shared territory), coloured by
 * redundancy class, sized by machinery; hovering a proof reveals its real
 * dependency edges into the typeclass landmarks. Drag to pan, scroll to zoom.
 *
 * A faithful React port of the upstream vanilla-canvas viewer (#7078/#7079) — the
 * draw math is identical, but pointer coordinates are taken relative to the canvas
 * (it lives in a card here, not fullscreen) and the HUD/legend/tooltip are React
 * overlays so they inherit the guild chrome.
 */
export function ProofTerritoryCanvas({ data }: { data: TerritoryData }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // View transform + interaction state kept in refs: mutated every frame by
  // pan/zoom/hover without forcing React re-renders (draw is imperative).
  const view = useRef({ sc: 1, ox: 0, oy: 0 })
  const hoverRef = useRef<TerritoryProof | null>(null)
  const showFarmsRef = useRef(true)
  const drawRef = useRef<() => void>(() => {})

  const [showFarms, setShowFarms] = useState(true)
  // Hover tooltip is a React overlay; null when nothing is under the cursor.
  const [tip, setTip] = useState<{ p: TerritoryProof; x: number; y: number } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return
    const cx = canvas.getContext('2d')
    if (!cx) return

    const b = territoryBounds(data.proofs)
    const tx = (x: number) => x * view.current.sc + view.current.ox
    const ty = (y: number) => y * view.current.sc + view.current.oy

    function fit() {
      const W = (canvas!.width = wrap!.clientWidth)
      const H = (canvas!.height = wrap!.clientHeight)
      const sc = Math.min(W / (b.x1 - b.x0 + 160), H / (b.y1 - b.y0 + 160))
      view.current = {
        sc,
        ox: W / 2 - ((b.x0 + b.x1) / 2) * sc,
        oy: H / 2 - ((b.y0 + b.y1) / 2) * sc,
      }
    }

    function draw() {
      const W = canvas!.width
      const H = canvas!.height
      const sc = view.current.sc
      cx!.clearRect(0, 0, W, H)
      cx!.fillStyle = '#0d0f12'
      cx!.fillRect(0, 0, W, H)

      const hov = hoverRef.current
      // Hovered proof's real dependency edges → mathlib abstraction landmarks.
      if (hov && hov.e.length) {
        cx!.strokeStyle = 'rgba(46,204,113,0.55)'
        cx!.lineWidth = 1
        for (const li of hov.e) {
          const L = data.land[li]
          if (!L) continue
          cx!.beginPath()
          cx!.moveTo(tx(hov.x), ty(hov.y))
          cx!.lineTo(tx(L.x), ty(L.y))
          cx!.stroke()
        }
      }

      for (const p of data.proofs) {
        if (!showFarmsRef.current && p.c !== 'g') continue
        cx!.fillStyle = COL[p.c] ?? COL.s
        cx!.globalAlpha = p.c === 'g' ? 0.95 : 0.45
        const r = Math.max(1.2, Math.min(8, 1 + p.m * 0.17)) * Math.sqrt(sc)
        cx!.beginPath()
        cx!.arc(tx(p.x), ty(p.y), r, 0, 7)
        cx!.fill()
      }
      cx!.globalAlpha = 1

      const hovset = hov ? new Set(hov.e) : null
      cx!.font = 11 * Math.max(0.7, Math.min(1.5, sc)) + 'px monospace'
      cx!.lineWidth = 3
      for (let i = 0; i < data.land.length; i++) {
        const L = data.land[i]
        const X = tx(L.x)
        const Y = ty(L.y)
        const on = !!hovset && hovset.has(i)
        cx!.fillStyle = on ? '#7fe3a8' : '#5b7fb0'
        cx!.beginPath()
        cx!.arc(X, Y, on ? 3.5 : 2, 0, 7)
        cx!.fill()
        if (L.l || on) {
          cx!.strokeStyle = 'rgba(0,0,0,0.75)'
          cx!.fillStyle = on ? '#dfffe9' : '#cfe0f5'
          cx!.strokeText(L.n, X + 4, Y)
          cx!.fillText(L.n, X + 4, Y)
        }
      }

      if (hov) {
        cx!.fillStyle = COL[hov.c] ?? COL.s
        cx!.globalAlpha = 1
        cx!.beginPath()
        cx!.arc(tx(hov.x), ty(hov.y), Math.max(3, 1 + hov.m * 0.17) * Math.sqrt(sc) + 1.5, 0, 7)
        cx!.strokeStyle = '#fff'
        cx!.lineWidth = 1.5
        cx!.stroke()
      }
    }
    drawRef.current = draw

    fit()
    draw()

    const ro = new ResizeObserver(() => {
      fit()
      draw()
    })
    ro.observe(wrap)

    let drag = false
    let px = 0
    let py = 0

    const onDown = (e: MouseEvent) => {
      drag = true
      px = e.clientX
      py = e.clientY
      canvas.style.cursor = 'grabbing'
    }
    const onUp = () => {
      drag = false
      canvas.style.cursor = 'grab'
    }
    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      if (drag) {
        view.current.ox += e.clientX - px
        view.current.oy += e.clientY - py
        px = e.clientX
        py = e.clientY
        draw()
        return
      }
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top
      let best: TerritoryProof | null = null
      let bd = 80
      for (const p of data.proofs) {
        if (!showFarmsRef.current && p.c !== 'g') continue
        const dx = tx(p.x) - mx
        const dy = ty(p.y) - my
        const d = dx * dx + dy * dy
        if (d < bd) {
          bd = d
          best = p
        }
      }
      if (best !== hoverRef.current) {
        hoverRef.current = best
        draw()
      }
      setTip(best ? { p: best, x: mx, y: my } : null)
    }
    const onLeave = () => {
      if (hoverRef.current) {
        hoverRef.current = null
        draw()
      }
      setTip(null)
    }
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = canvas.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top
      const f = e.deltaY < 0 ? 1.12 : 0.89
      view.current.ox = mx - (mx - view.current.ox) * f
      view.current.oy = my - (my - view.current.oy) * f
      view.current.sc *= f
      draw()
    }

    canvas.addEventListener('mousedown', onDown)
    canvas.addEventListener('mousemove', onMove)
    canvas.addEventListener('mouseleave', onLeave)
    canvas.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('mouseup', onUp)

    return () => {
      ro.disconnect()
      canvas.removeEventListener('mousedown', onDown)
      canvas.removeEventListener('mousemove', onMove)
      canvas.removeEventListener('mouseleave', onLeave)
      canvas.removeEventListener('wheel', onWheel)
      window.removeEventListener('mouseup', onUp)
    }
  }, [data])

  // Toggling the farms also affects hit-testing and the draw, so mirror to the ref
  // the imperative handlers read, then repaint.
  useEffect(() => {
    showFarmsRef.current = showFarms
    drawRef.current()
  }, [showFarms])

  const s = data.stats

  return (
    <div
      ref={wrapRef}
      className="relative rounded-lg border overflow-hidden"
      style={{ height: '75vh', background: '#0d0f12' }}
    >
      <canvas ref={canvasRef} className="block h-full w-full cursor-grab" />

      {/* HUD: corpus stats */}
      <div className="pointer-events-none absolute left-3 top-3 text-xs leading-relaxed text-[#cdd3da]">
        <div className="font-semibold text-white">proof-territory map</div>
        <div>
          {s.total.toLocaleString()} credited proofs · {s.regions} mathlib regions
        </div>
        <div>
          <span style={{ color: COL.g }}>{s.genuine} genuine</span> ·{' '}
          <span style={{ color: COL.r }}>{s.restatement} restatement</span> ·{' '}
          <span style={{ color: COL.s }}>{s.shallow} shallow</span>
        </div>
        <div className="font-semibold text-white">{redundantPercent(s)} redundant</div>
      </div>

      {/* Legend + farms toggle */}
      <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-2 text-xs text-[#cdd3da]">
        <button
          type="button"
          onClick={() => setShowFarms((v) => !v)}
          className="rounded border border-[#333] bg-[#1b1f24] px-2 py-1 text-[#cdd3da] hover:bg-[#23272e]"
        >
          {showFarms ? 'Hide restatement farms' : 'Show restatement farms'}
        </button>
        <span style={{ color: COL.g }}>● genuine</span>
        <span style={{ color: COL.r }}>● restatement</span>
        <span style={{ color: COL.s }}>● shallow</span>
        <span className="text-[#9aa0a6]">size ∝ machinery · position = mathlib territory</span>
      </div>

      {/* Hover tooltip */}
      {tip && (
        <div
          className="pointer-events-none absolute z-10 whitespace-nowrap rounded border border-[#333] bg-[#1b1f24] px-2 py-1 text-xs text-[#cdd3da]"
          style={{ left: tip.x + 12, top: tip.y + 12 }}
        >
          <div className="font-semibold text-white">{tip.p.n}</div>
          <div>
            machinery {tip.p.m} · {classLabel(tip.p.c)} · {tip.p.e.length} territory edges
          </div>
        </div>
      )}
    </div>
  )
}
