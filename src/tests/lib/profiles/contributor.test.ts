import { describe, it, expect, vi, afterEach } from 'vitest'
import { getContributor } from '@/lib/profiles/contributor'
import { LEADERBOARD_FIXTURE, SQ_GOAL_EFFORT, LIBRARY_INDEX_S1 } from '@/tests/mocks/unsorry-fixtures'

const okJson = (b: unknown) => ({ ok: true, json: async () => b }) as unknown as Response
const okText = (t: string) => ({ ok: true, text: async () => t }) as unknown as Response

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('getContributor', () => {
  it('builds a profile with global standing and a derived prize badge', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '') // force config-fallback prizes
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        const u = String(url)
        if (u.includes('leaderboard-ui.json')) return Promise.resolve(okJson({ contributors: LEADERBOARD_FIXTURE }))
        if (u.includes('community-stats.json')) return Promise.resolve(okJson({ goal_effort: SQ_GOAL_EFFORT }))
        if (u.includes('api.github.com')) return Promise.resolve(okJson({ tree: [{ type: 'blob', path: 'library/index/a.aisp' }] }))
        if (u.includes('library/index/a.aisp')) return Promise.resolve(okText(LIBRARY_INDEX_S1))
        return Promise.resolve(okJson({}))
      }),
    )

    const p = await getContributor('cgbarlow')
    expect(p.global?.rank).toBe(2)
    expect(p.badges).toHaveLength(1)
    expect(p.badges[0]).toMatchObject({ place: 1, creditedProofs: 1, headlineGoalId: 'sq-add-sq-eq-three-mul-sq' })
  })

  it('returns a graceful profile for an unknown handle', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okJson({ contributors: LEADERBOARD_FIXTURE })))
    const p = await getContributor('nobody')
    expect(p.global).toBeNull()
    expect(p.displayName).toBe('@nobody')
    expect(p.badges).toEqual([])
  })
})
