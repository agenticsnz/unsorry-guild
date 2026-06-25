'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

/** Copy a `./swarm/run.sh --goal <id>` line for pasting into a terminal. */
export function CopyRun({ snippet, label = 'Copy run' }: { snippet: string; label?: string }) {
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
      aria-label={`Copy command: ${snippet}`}
      title={copied ? 'Copied!' : snippet}
      className="inline-flex items-center gap-1 rounded border border-border px-2 py-0.5 font-mono text-xs hover:bg-muted"
    >
      {copied ? <Check className="h-3 w-3 text-brand" /> : <Copy className="h-3 w-3" />}
      {copied ? 'Copied' : label}
    </button>
  )
}
