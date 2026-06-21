import { describe, it, expect, vi, afterEach } from 'vitest'
import { buildGoalSolverMap } from '@/lib/unsorry/attribution'
import {
  LIBRARY_INDEX_S1,
  LIBRARY_INDEX_S4S3S3,
  LIBRARY_INDEX_NO_SOLVER,
} from '@/tests/mocks/unsorry-fixtures'

const okJson = (body: unknown) => ({ ok: true, json: async () => body }) as unknown as Response
const okText = (text: string) => ({ ok: true, text: async () => text }) as unknown as Response

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('buildGoalSolverMap', () => {
  it('lists library/index paths and maps goal→solver, skipping non-index and solverless records', async () => {
    const tree = {
      tree: [
        { type: 'blob', path: 'library/index/a.aisp' },
        { type: 'blob', path: 'library/index/b.aisp' },
        { type: 'blob', path: 'library/index/c.aisp' },
        { type: 'blob', path: 'goals/x.aisp' }, // not library/index → ignored
        { type: 'blob', path: 'library/index/readme.md' }, // not .aisp → ignored
      ],
    }
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes('api.github.com')) return Promise.resolve(okJson(tree))
      if (url.endsWith('library/index/a.aisp')) return Promise.resolve(okText(LIBRARY_INDEX_S1))
      if (url.endsWith('library/index/b.aisp')) return Promise.resolve(okText(LIBRARY_INDEX_S4S3S3))
      if (url.endsWith('library/index/c.aisp')) return Promise.resolve(okText(LIBRARY_INDEX_NO_SOLVER))
      return Promise.resolve(okText(''))
    })
    vi.stubGlobal('fetch', fetchMock)

    const map = await buildGoalSolverMap()

    expect(map.get('sq-add-sq-eq-three-mul-sq-s1')?.solver).toBe('cgbarlow')
    expect(map.get('sq-add-sq-eq-three-mul-sq-s4-s3-s3')?.solver).toBe('Rauxon')
    expect(map.has('some-other-goal')).toBe(false)
    expect(map.size).toBe(2)

    const contentFetches = fetchMock.mock.calls.filter((c) =>
      String(c[0]).includes('raw.githubusercontent.com'),
    )
    expect(contentFetches).toHaveLength(3)
  })
})
