'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import {
  Menu,
  Settings,
  X,
  LogOut,
  Home
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase/client'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { cn } from '@/lib/utils'

const gmNavItems = [
  { href: '/gm', label: 'Overview' },
  { href: '/gm/quests', label: 'Quests' },
  { href: '/gm/review', label: 'Review' },
  { href: '/gm/extensions', label: 'Extensions' },
  { href: '/gm/users', label: 'Users' },
  { href: '/gm/banners', label: 'Banners' },
  { href: '/gm/templates', label: 'Templates' },
  { href: '/gm/emails', label: 'Emails' },
  { href: '/gm/quotes', label: 'Quotes' },
  { href: '/gm/tiers', label: 'Tiers' },
]

export function GMHeader() {
  const { user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const logoUrl = process.env.NEXT_PUBLIC_GUILD_LOGO_URL
  const guildName = process.env.NEXT_PUBLIC_GUILD_NAME
  const guildLink = process.env.NEXT_PUBLIC_GUILD_LINK

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const isActive = (href: string) => {
    if (href === '/gm') return pathname === '/gm'
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <header className="border-b bg-primary/5">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          {/* Logo and Guild Name */}
          <div className="flex items-center gap-3 text-xl">
            <Link href="/gm">
              <span className="font-bold">Guild Hall</span>
            </Link>
            {guildName && (
              <>
                {guildLink ? (
                  <a
                    href={guildLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 hover:opacity-80"
                  >
                    {logoUrl && (
                      <Image
                        src={logoUrl}
                        alt="Guild Logo"
                        width={32}
                        height={32}
                        className="h-8 w-8 object-contain"
                      />
                    )}
                    <span className="font-normal text-lg hidden sm:inline">{guildName}</span>
                  </a>
                ) : (
                  <>
                    {logoUrl && (
                      <Image
                        src={logoUrl}
                        alt="Guild Logo"
                        width={32}
                        height={32}
                        className="h-8 w-8 object-contain"
                      />
                    )}
                    <span className="font-normal text-lg hidden sm:inline">{guildName}</span>
                  </>
                )}
              </>
            )}
            <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
              GM
            </span>
          </div>

          {/* Desktop horizontal navigation */}
          <nav className="hidden xl:flex items-center gap-1">
            {gmNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive(item.href)
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Desktop right-side actions - visible when horizontal nav is visible */}
        <nav className="hidden xl:flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Exit GM
          </Link>
          {user && <NotificationBell />}
          {user && (
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Sign out
            </Button>
          )}
        </nav>

        {/* Mobile/tablet navigation - visible when horizontal nav is hidden */}
        <div className="flex xl:hidden items-center gap-2">
          {/* Gear menu for Exit GM/Notifications/Sign out */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                  <Settings className="h-5 w-5" />
                  <span className="sr-only">Settings menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="cursor-pointer flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Exit GM
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer flex items-center gap-2">
                  <LogOut className="h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Hamburger menu for GM navigation */}
          <DropdownMenu open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
                <span className="sr-only">GM menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {gmNavItems.map((item) => (
                <DropdownMenuItem key={item.href} asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      'cursor-pointer',
                      isActive(item.href) && 'bg-accent'
                    )}
                  >
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
