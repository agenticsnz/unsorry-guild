import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getModelProfile } from '@/lib/unsorry/model-registry'
import { Stat } from '@/components/ui/stat'

// Joins the swarm-maintained registry with the live model distribution on read.
export const dynamic = 'force-dynamic'

const CLASSIFICATION_LABEL: Record<string, string> = {
  open: 'Open source',
  closed: 'Closed source',
  'n/a': '—',
}

/** Show just the host for a canonical URL, falling back to the raw string. */
function displayUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function Fact({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border p-3">
      <dt className="text-xs text-foreground/60">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const data = await getModelProfile(slug)
  if (!data) return { title: 'Model · Math · unsorry-guild' }
  return {
    title: `${data.entry.pokemon.name} · ${data.entry.provider_model} · unsorry-guild`,
  }
}

export default async function ModelPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const data = await getModelProfile(slug)
  if (!data) notFound()
  const { entry, stat, namedBy } = data
  const { pokemon, research, provenance } = entry

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-5">
        <Image
          src={pokemon.sprite_url}
          alt={pokemon.name}
          width={96}
          height={96}
          unoptimized
          className="h-24 w-24 shrink-0 [image-rendering:pixelated]"
        />
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-foreground/50">
            {entry.provider_model}
          </p>
          <h1 className="text-3xl font-bold">{pokemon.name}</h1>
          <a
            href={research.canonical_url}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-brand hover:underline"
          >
            {displayUrl(research.canonical_url)} ↗
          </a>
        </div>
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Why {pokemon.name}?</h2>
        <p className="text-sm leading-relaxed text-foreground/80">{entry.profile}</p>
        <blockquote className="border-l-2 border-muted pl-3 text-sm italic text-foreground/60">
          {pokemon.name} · №{pokemon.dex_id}. {pokemon.description}
        </blockquote>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Model</h2>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Fact
            label="Source"
            value={CLASSIFICATION_LABEL[research.classification] ?? research.classification}
          />
          <Fact label="Publisher" value={research.publisher} />
          <Fact label="Country" value={research.country} />
          <Fact label="Parameters" value={research.parameter_size} />
          <Fact label="Licence" value={research.license} />
        </dl>
      </section>

      {stat && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Performance</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat label="Verified proofs" value={stat.verified_proofs.toLocaleString()} />
            <Stat label="Runs" value={stat.runs.toLocaleString()} />
            <Stat
              label="Success rate"
              value={
                stat.run_success_rate != null && stat.runs > 0
                  ? `${Math.round(stat.run_success_rate * 100)}%`
                  : '—'
              }
            />
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Provenance</h2>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Fact
            label="Named by"
            value={
              namedBy ? (
                <Link
                  href={`/math/models/${namedBy.slug}`}
                  className="inline-flex items-center gap-1.5 hover:underline"
                >
                  <Image
                    src={namedBy.pokemon.sprite_url}
                    alt={namedBy.pokemon.name}
                    width={20}
                    height={20}
                    unoptimized
                    className="h-5 w-5 [image-rendering:pixelated]"
                  />
                  {namedBy.pokemon.name}
                  <span className="font-normal text-foreground/50">
                    ({provenance.assigned_with})
                  </span>
                </Link>
              ) : (
                provenance.assigned_with
              )
            }
          />
          <Fact
            label="Swarm contributor"
            value={
              <Link
                href={`/math/contributors/${provenance.contributor}`}
                className="text-brand hover:underline"
              >
                @{provenance.contributor}
              </Link>
            }
          />
        </dl>
      </section>
    </div>
  )
}
