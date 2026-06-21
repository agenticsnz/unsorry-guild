import { UNSORRY_BASE_URL } from '@/lib/unsorry/constants'

export const metadata = { title: 'Proof graph · Math · unsorry-guild' }
export const revalidate = 600

export default function ProofGraphPage() {
  const svg = `${UNSORRY_BASE_URL}/proof-graph.svg`
  const full = `${UNSORRY_BASE_URL}/proofs-contributors-visualisation.html`
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">Proof graph</h1>
        <p className="text-sm text-foreground/70">
          Proofs and contributors across the Math corpus.{' '}
          <a href={full} className="underline" target="_blank" rel="noreferrer">
            Open the full interactive view ↗
          </a>
        </p>
      </div>
      <div className="rounded-lg border p-4 overflow-auto bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={svg} alt="unsorry proof graph" className="max-w-full" />
      </div>
    </div>
  )
}
