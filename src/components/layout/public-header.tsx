'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ThemeToggleCompact } from '@/components/settings/theme-toggle'
import { DomainSwitcher } from './domain-switcher'

const nav = [
  { href: '/math/leaderboard', label: 'Leaderboard' },
  { href: '/math/goals', label: 'Goals' },
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
        <div className="flex items-center gap-3">
          <a
            href="https://agentics.org.nz"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0"
            aria-label="Agentics"
          >
            <Image
              src="/logo.png"
              alt="Agentics"
              width={32}
              height={32}
              priority
              className="h-8 w-8 object-contain"
            />
          </a>
          <Link href="/" className="text-xl">
            <span className="font-bold">unsorry</span>{' '}
            <span className="font-normal text-brand">swarm</span>
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
