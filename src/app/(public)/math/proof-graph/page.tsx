import { fetchTerritoryData } from '@/lib/unsorry/fetchers'
import { ProofTerritoryCanvas } from '@/components/graph/proof-territory-canvas'
import type { TerritoryData } from '@/lib/unsorry/territory'

export const metadata = { title: 'Proof graph · Math · unsorry-guild' }
export const dynamic = 'force-dynamic'

export default async function ProofGraphPage() {
  let territory: TerritoryData | null = null
  try {
    territory = await fetchTerritoryData()
  } catch {
    territory = null
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">Proof graph</h1>
        <p className="text-sm text-foreground/70">
          Every credited proof, positioned by its{' '}
          <span className="text-brand">mathlib territory</span> — an SVD of the typeclass machinery it
          touches, so distance ≈ shared territory. Colour is redundancy class, size is machinery;
          hover a proof to see its real dependency edges. Drag to pan, scroll to zoom.
        </p>
      </div>
      {territory && territory.proofs.length > 0 ? (
        <ProofTerritoryCanvas data={territory} />
      ) : (
        <p className="text-sm text-foreground/70">
          The proof-territory map isn&rsquo;t available right now.
        </p>
      )}
    </div>
  )
}
