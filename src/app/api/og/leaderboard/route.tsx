import { leaderboardImage } from '@/lib/og/og-images'

// Stable PNG endpoint for embedding (e.g. the unsorry README, #14).
export const runtime = 'nodejs'
export const revalidate = 300

export async function GET() {
  return leaderboardImage()
}
