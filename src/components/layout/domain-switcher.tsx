'use client'

import Link from 'next/link'
import { Check, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

/**
 * Site-wide domain selector. Only "Math" exists today; this is the UI seam for
 * ADR-030's domain-agnostic engine (ADR-017). Additional domains will register
 * via unsorry's git domain registry (Phase 3).
 */
const DOMAINS = [{ id: 'math', label: 'Math', href: '/math' }] as const

export function DomainSwitcher({ active = 'math' }: { active?: string }) {
  const current = DOMAINS.find((d) => d.id === active) ?? DOMAINS[0]
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          {current.label}
          <ChevronDown className="h-4 w-4 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {DOMAINS.map((d) => (
          <DropdownMenuItem key={d.id} asChild>
            <Link href={d.href} className="flex items-center justify-between gap-6">
              <span>{d.label}</span>
              {d.id === current.id && <Check className="h-4 w-4" />}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
