import { GMHeader } from '@/components/layout/gm-header'
import { GMAuthGuard } from '@/components/gm/gm-auth-guard'

export default function GMLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <GMAuthGuard>
      <div className="min-h-screen bg-background flex flex-col">
        <GMHeader />
        <main className="flex-1 container mx-auto px-4 py-8 lg:px-8">
          {children}
        </main>
      </div>
    </GMAuthGuard>
  )
}
