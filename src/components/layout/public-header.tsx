'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  const [mobileOpen, setMobileOpen] = useState(false)
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

          {/* Mobile nav — hamburger dropdown (#15) */}
          <DropdownMenu open={mobileOpen} onOpenChange={setMobileOpen}>
            <DropdownMenuTrigger asChild className="md:hidden">
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                <span className="sr-only">Menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {nav.map((item) => (
                <DropdownMenuItem key={item.href} asChild>
                  <Link href={item.href} className={cn('cursor-pointer', isActive(item.href) && 'bg-accent')}>
                    {item.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
