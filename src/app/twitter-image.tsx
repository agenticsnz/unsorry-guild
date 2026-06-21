import { proofsOverTimeImage, OG_SIZE } from '@/lib/og/og-images'

// Twitter card mirrors the Open Graph image (proofs-over-time, #13).
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const alt = 'unsorry swarm — proofs over time'
export const size = OG_SIZE
export const contentType = 'image/png'

export default async function TwitterImage() {
  return proofsOverTimeImage()
}
