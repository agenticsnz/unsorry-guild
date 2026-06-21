import { fetchQueueData } from '@/lib/unsorry/fetchers'
import { QueueBoard } from '@/components/queue/queue-board'
import type { QueueData } from '@/lib/unsorry/types'

export const metadata = { title: 'Queue · Math · unsorry-guild' }
export const revalidate = 600

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
        <h1 className="text-3xl font-bold">Queue</h1>
        <p className="text-sm text-foreground/70">
          In-flight proving work waiting to merge. Source: unsorry git (refreshed ~15 min).
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
