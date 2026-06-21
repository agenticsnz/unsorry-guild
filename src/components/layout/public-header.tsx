'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ThemeToggleCompact } from '@/components/settings/theme-toggle'
import { DomainSwitcher } from './domain-switcher'

const nav = [
  { href: '/math/leaderboard', label: 'Leaderboard' },
  { href: '/math/prizes', label: 'Prizes' },
  { href: '/math/showcase', label: 'Showcase' },
  { href: '/math/proof-graph', label: 'Proof graph' },
  { href: '/math/queue', label: 'Queue' },
]

export function PublicHeader() {
  const pathname = usePathname()
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/math" className="text-xl font-bold">
            unsorry-guild
          </Link>
          <DomainSwitcher active="math" />
        </div>

        <nav className="hidden md:flex items-center gap-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'px-3 py-2 rounded-md text-sm font-medium hover:bg-accent',
                isActive(item.href) ? 'text-foreground' : 'text-foreground/70',
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggleCompact />
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Admin</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
