import { PublicHeader } from '@/components/layout/public-header'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <main className="container mx-auto px-4 py-8 flex-1">{children}</main>
    </div>
  )
}
