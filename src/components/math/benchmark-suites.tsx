'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { BenchmarkSuite } from '@/lib/unsorry/types'

/** Copy a goal's `./swarm/run.sh --goal <id>` line for pasting into a terminal. */
function CopyRun({ snippet }: { snippet: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard unavailable (e.g. insecure context) — silently no-op
    }
  }
  return (
    <button
      type="button"
      onClick={copy}
      aria-label="Copy run.sh command"
      title={copied ? 'Copied!' : snippet}
      className="inline-flex items-center gap-1 rounded border border-border px-2 py-0.5 font-mono text-xs hover:bg-muted"
    >
      {copied ? <Check className="h-3 w-3 text-brand" /> : <Copy className="h-3 w-3" />}
      {copied ? 'Copied' : 'Copy run'}
    </button>
  )
}

/** The registered benchmark suites (ADR-092 / SPEC-092-A). Each goal is a
 *  kernel-verified target a contributor can claim with `run.sh --goal <id>`. */
export function BenchmarkSuites({ suites }: { suites: BenchmarkSuite[] }) {
  if (suites.length === 0) {
    return <p className="text-sm text-foreground/70">No benchmark suites registered yet.</p>
  }
  return (
    <div className="space-y-4">
      {suites.map((suite) => {
        const total = suite.credited + suite.glue
        return (
          <Card key={suite.id}>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-lg">{suite.id}</CardTitle>
                <Badge variant="secondary">{suite.license}</Badge>
                <Badge variant="outline">{suite.domain}</Badge>
                <span className="text-xs text-foreground/60">
                  {suite.proved}/{total} proved · {suite.credited} credited · {suite.glue} glue
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-border">
                {suite.goals.map((goal) => (
                  <li
                    key={goal.id}
                    className="flex flex-wrap items-center gap-2 py-1.5 text-sm"
                  >
                    <code className="font-mono">{goal.id}</code>
                    <Badge variant={goal.status === 'proved' ? 'default' : 'outline'}>
                      {goal.status}
                    </Badge>
                    <span className="text-xs text-foreground/60">d{goal.difficulty}</span>
                    {goal.credit === 'glue' && (
                      <span className="text-xs text-foreground/50">glue</span>
                    )}
                    <span className="ml-auto">
                      <CopyRun snippet={goal.run_snippet} />
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
