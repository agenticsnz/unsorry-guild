'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { Menu, Settings, X } from 'lucide-react'
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
import { useIsGm } from '@/lib/hooks/use-is-gm'
import { createClient } from '@/lib/supabase/client'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/my-quests', label: 'My Quests' },
  { href: '/quests', label: 'Bounty Board' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/profile', label: 'Profile' },
]

export function Header() {
  const { user } = useAuth()
  const { data: isGm } = useIsGm()
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
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          {/* Logo and Guild Name */}
          <div className="flex items-center gap-3 text-xl">
            <Link href="/dashboard">
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
          </div>

          {/* Desktop horizontal navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
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
        <nav className="hidden lg:flex items-center gap-4">
          {isGm && (
            <Link
              href="/gm"
              className="text-sm font-medium px-3 py-1 bg-primary/10 text-primary rounded hover:bg-primary/20"
            >
              GM
            </Link>
          )}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                  <Settings className="h-5 w-5" />
                  <span className="sr-only">Settings</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings/password" className="cursor-pointer">
                    Change Password
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {user && <NotificationBell />}
          {user && (
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Sign out
            </Button>
          )}
        </nav>

        {/* Mobile/tablet navigation - visible when horizontal nav is hidden */}
        <div className="flex lg:hidden items-center gap-2">
          {/* Gear menu for GM/Settings/Notifications */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                  <Settings className="h-5 w-5" />
                  <span className="sr-only">Settings menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {isGm && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/gm" className="cursor-pointer">
                        GM Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings/password" className="cursor-pointer">
                    Change Password
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/notifications" className="cursor-pointer">
                    Notifications
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Hamburger menu for main navigation */}
          <DropdownMenu open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
                <span className="sr-only">Main menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {navItems.map((item) => (
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
              {user && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    Sign out
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
