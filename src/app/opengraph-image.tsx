import { proofsOverTimeImage, OG_SIZE } from '@/lib/og/og-images'

// Site-wide social preview = the proofs-over-time graph (issue #1 #13).
export const runtime = 'nodejs'
export const revalidate = 300
export const alt = 'unsorry swarm — proofs over time'
export const size = OG_SIZE
export const contentType = 'image/png'

export default async function OpengraphImage() {
  return proofsOverTimeImage()
}
