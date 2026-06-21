import { UNSORRY_BASE_URL } from '@/lib/unsorry/constants'

export const metadata = { title: 'Proof graph · Math · unsorry-guild' }
export const revalidate = 600

export default function ProofGraphPage() {
  const viz = `${UNSORRY_BASE_URL}/proofs-contributors-visualisation.html`
  const svg = `${UNSORRY_BASE_URL}/proof-graph.svg`
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">Proof graph</h1>
        <p className="text-sm text-foreground/70">
          Proofs and contributors across the Math corpus — filter and zoom in the interactive view.{' '}
          <a href={viz} className="underline" target="_blank" rel="noreferrer">
            Open full ↗
          </a>{' '}
          ·{' '}
          <a href={svg} className="underline" target="_blank" rel="noreferrer">
            SVG
          </a>
        </p>
      </div>
      <iframe
        src={viz}
        title="unsorry proof graph (interactive)"
        className="w-full rounded-lg border bg-white"
        style={{ height: '80vh' }}
      />
    </div>
  )
}
