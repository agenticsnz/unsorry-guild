'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, Copy } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import type { BenchmarkSuite } from '@/lib/unsorry/types'

/** A benchmark suite card — same interaction as the PrizeCard above: the whole card
 *  links to the suite detail page (hover highlight), with a top-right button that
 *  copies the suite goal id (run the WHOLE suite with `run.sh --goal <id>`). */
function SuiteCard({ suite }: { suite: BenchmarkSuite }) {
  const [copied, setCopied] = useState(false)
  const total = suite.credited + suite.glue
  const stats = suite.stats
  const runId = suite.top || suite.id
  const percent = total > 0 ? Math.round((100 * suite.proved) / total) : 0

  // Copy the suite goal id — must not navigate the wrapping Link.
  const copyId = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(runId)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard unavailable (e.g. insecure context) — silently no-op
    }
  }

  return (
    <Link href={`/math/suites/${suite.id}`} className="group relative block">
      <Card className="h-full transition-colors hover:border-primary">
        <button
          type="button"
          onClick={copyId}
          aria-label="Copy suite goal id"
          title={copied ? 'Copied!' : `Copy ${runId}`}
          className={cn(
            'absolute right-2 top-2 z-10 grid h-7 w-7 place-items-center rounded-md border bg-background/80',
            'opacity-0 transition-opacity hover:bg-accent focus:opacity-100 group-hover:opacity-100',
          )}
        >
          {copied ? <Check className="h-4 w-4 text-brand" /> : <Copy className="h-4 w-4" />}
        </button>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2 pr-8 text-lg">
            {suite.id}
            <Badge variant="secondary">{suite.license}</Badge>
            <Badge variant="outline">{suite.domain}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span>
              {suite.proved}/{total} proved
            </span>
            <span>{percent}%</span>
          </div>
          <Progress value={percent} />
          <p className="text-xs text-foreground/60">
            {suite.credited} credited · {suite.glue} glue
            {stats && stats.total_runs > 0 && (
              <>
                {' '}· {stats.total_runs} runs · {Math.round(stats.success_rate * 100)}% pass
                {stats.best_solve_s != null && <> · best {stats.best_solve_s}s</>}
              </>
            )}
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}

/** The registered benchmark suites (ADR-092 / SPEC-092-A), as cards matching the
 *  prize grid above. Clicking a card opens the suite detail (per-goal list + runs). */
export function BenchmarkSuites({ suites }: { suites: BenchmarkSuite[] }) {
  if (suites.length === 0) {
    return <p className="text-sm text-foreground/70">No benchmark suites registered yet.</p>
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {suites.map((suite) => (
        <SuiteCard key={suite.id} suite={suite} />
      ))}
    </div>
  )
}
