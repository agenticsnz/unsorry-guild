import { fetchQueueData } from '@/lib/unsorry/fetchers'
import { QueueBoard } from '@/components/queue/queue-board'
import { FreshnessIndicator } from '@/components/leaderboard/freshness-indicator'
import type { QueueData } from '@/lib/unsorry/types'

export const metadata = { title: 'Queue · Math · unsorry-guild' }
export const revalidate = 60

export default async function QueuePage() {
  let queue: QueueData | null = null
  try {
    queue = await fetchQueueData()
  } catch {
    queue = null
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h1 className="text-3xl font-bold">Queue</h1>
          {queue?.generated_at && <FreshnessIndicator generatedAt={queue.generated_at} noun="Queue" />}
        </div>
        <p className="text-sm text-foreground/70">
          In-flight proving work waiting to merge. Source: unsorry git (refreshed on each proof
          merge, with a ~15 min backstop).
        </p>
      </div>
      {queue ? (
        <QueueBoard queue={queue} />
      ) : (
        <p className="text-sm text-foreground/70">Couldn&rsquo;t load the queue right now.</p>
      )}
    </div>
  )
}
