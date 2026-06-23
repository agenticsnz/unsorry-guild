import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchGlobalLeaderboard, fetchCommunityStats, UnsorryFetchError } from '@/lib/unsorry/fetchers'
import { LEADERBOARD_FIXTURE } from '@/tests/mocks/unsorry-fixtures'

const ok = (body: unknown) => ({ ok: true, json: async () => body }) as unknown as Response
const fail = () => ({ ok: false, status: 500, json: async () => ({}) }) as unknown as Response

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('fetchers', () => {
  it('fetchGlobalLeaderboard reads raw-git first (tracks main; Pages can lag)', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(ok({ contributors: LEADERBOARD_FIXTURE }))
    vi.stubGlobal('fetch', fetchMock)
    const rows = await fetchGlobalLeaderboard()
    expect(rows).toHaveLength(3)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(String(fetchMock.mock.calls[0][0])).toContain(
      'raw.githubusercontent.com/agenticsnz/unsorry/main/docs/metrics/leaderboard-ui.json',
    )
  })

  it('falls back to the Pages URL when raw-git is not ok', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(fail())
      .mockResolvedValueOnce(ok({ contributors: LEADERBOARD_FIXTURE }))
    vi.stubGlobal('fetch', fetchMock)
    const rows = await fetchGlobalLeaderboard()
    expect(rows).toHaveLength(3)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(String(fetchMock.mock.calls[1][0])).toContain('unsorry.agentics.org.nz')
  })

  it('throws UnsorryFetchError when both sources fail', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(fail()))
    await expect(fetchCommunityStats()).rejects.toBeInstanceOf(UnsorryFetchError)
  })

  it('passes a short Next revalidate (push-on-merge freshness)', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(ok({ contributors: [] }))
    vi.stubGlobal('fetch', fetchMock)
    await fetchGlobalLeaderboard()
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ next: { revalidate: 60 } })
  })
})
