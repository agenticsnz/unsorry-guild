'use client'

import { useState } from 'react'
import { Check, Copy, FileCode } from 'lucide-react'

/** A benchmark goal's Lean source rendered as an editor-style panel — the exact
 *  statement the swarm must prove. The trailing `sorry` is the open obligation. */
export function LeanStatement({
  goalId,
  source,
  path,
}: {
  goalId: string
  source: string
  /** Repo path the source was found at; labels the panel. Defaults to the active
   *  `goals/<id>.lean` (archived goals pass their package path). */
  path?: string
}) {
  const [copied, setCopied] = useState(false)
  const code = source.trimEnd()
  const filename = path ?? `goals/${goalId}.lean`

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard unavailable — silently no-op
    }
  }

  if (!code.trim()) {
    return (
      <p className="text-sm text-foreground/70">
        Statement source unavailable (it lands on the next publish).
      </p>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="flex items-center justify-between border-b border-border bg-muted/60 px-3 py-1.5">
        <span className="flex items-center gap-1.5 font-mono text-xs text-foreground/70">
          <FileCode className="h-3.5 w-3.5" />
          {filename}
        </span>
        <button
          type="button"
          onClick={copy}
          aria-label="Copy Lean statement"
          className="inline-flex items-center gap-1 rounded border border-border px-2 py-0.5 font-mono text-xs hover:bg-background"
        >
          {copied ? <Check className="h-3 w-3 text-brand" /> : <Copy className="h-3 w-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto bg-muted/20 p-4 text-xs leading-relaxed">
        <code className="whitespace-pre font-mono">{code}</code>
      </pre>
    </div>
  )
}
