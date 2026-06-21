import { proofsOverTimeImage } from '@/lib/og/og-images'

// Stable PNG endpoint for embedding (e.g. the unsorry README, #14).
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  return proofsOverTimeImage()
}
