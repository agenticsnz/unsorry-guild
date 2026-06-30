import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { repoBlobUrl, UNSORRY_REPO } from '@/lib/unsorry/constants'

const repoTreeUrl = (path: string) => `https://github.com/${UNSORRY_REPO}/tree/main/${path}`

/**
 * Static guidance: a guild Goal only *curates* an existing unsorry target — new
 * proof goals are authored upstream in the swarm (ADR-015 read-only boundary).
 * This points the admin at the two upstream authoring paths.
 */
export function GoalAuthoringGuide() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Don&rsquo;t see your target?</CardTitle>
        <CardDescription>
          Goals here <em>curate</em> targets the swarm already knows. A brand-new proof goal is
          authored upstream in the{' '}
          <a
            href={`https://github.com/${UNSORRY_REPO}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand hover:underline"
          >
            unsorry
          </a>{' '}
          repo, then appears in the picker once published.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-foreground/80">
        <div>
          <div className="font-medium text-foreground">1 · Propose a theorem (backlog sourcing)</div>
          <p>
            Add a natural-language description as a{' '}
            <a
              href={repoTreeUrl('backlog')}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              <code>backlog/*.md</code>
            </a>{' '}
            file. The pipeline translates it to Lean, type-checks it against pinned mathlib, runs the
            triviality probe, and emits <code>goals/&lt;id&gt;.&#123;aisp,lean&#125;</code>. See{' '}
            <a
              href={repoBlobUrl('docs/adrs/ADR-012-Backlog-Sourcing.md')}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              ADR-012
            </a>
            .
          </p>
        </div>
        <div>
          <div className="font-medium text-foreground">2 · Import a suite (skeleton intake)</div>
          <p>
            For a benchmark suite, a supplier-curated skeleton (a decomposition into{' '}
            <code>sorry</code> obligations) is admitted by{' '}
            <a
              href={repoTreeUrl('tools/intake')}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              <code>tools/intake</code>
            </a>{' '}
            into <code>targets/&lt;suite&gt;/</code>. See{' '}
            <a
              href={repoBlobUrl('docs/adrs/ADR-081-Problem-Admission-And-Intake-Pipeline.md')}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              ADR-081
            </a>
            .
          </p>
        </div>
        <p className="text-xs text-foreground/55">
          Once a goal or suite is published, type or pick its id above to curate it as a Goal.
        </p>
      </CardContent>
    </Card>
  )
}
