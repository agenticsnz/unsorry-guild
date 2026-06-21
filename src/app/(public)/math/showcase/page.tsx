import { UNSORRY_BASE_URL } from '@/lib/unsorry/constants'

export const metadata = { title: 'Showcase · Math · unsorry-guild' }
export const revalidate = 600

export default function ShowcasePage() {
  const url = `${UNSORRY_BASE_URL}/showcase.html`
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">Showcase</h1>
        <p className="text-sm text-foreground/70">
          Highlighted proofs from the Math corpus.{' '}
          <a href={url} className="underline" target="_blank" rel="noreferrer">
            Open in a new tab ↗
          </a>
        </p>
      </div>
      <iframe
        src={url}
        title="unsorry showcase"
        className="w-full rounded-lg border"
        style={{ height: '70vh' }}
      />
    </div>
  )
}
