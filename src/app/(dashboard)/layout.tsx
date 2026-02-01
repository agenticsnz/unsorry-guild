import { Header } from '@/components/layout/header'
import { BannerDisplay } from '@/components/banners'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 lg:px-8">
        <BannerDisplay />
        {children}
      </main>
    </div>
  )
}
