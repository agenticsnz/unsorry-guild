// @vitest-environment node
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const getSession = vi.fn()
const rpc = vi.fn()

vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({ auth: { getSession }, rpc }),
}))

import { middleware } from '@/middleware'

const req = (path: string) => new NextRequest(new URL(`http://localhost${path}`))

describe('middleware (admin-only)', () => {
  beforeEach(() => {
    getSession.mockReset()
    rpc.mockReset()
  })

  it('redirects unauthenticated /gm access to /login with a returnUrl', async () => {
    getSession.mockResolvedValue({ data: { session: null } })
    const res = await middleware(req('/gm/prizes'))
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/login')
    expect(res.headers.get('location')).toContain('returnUrl')
  })

  it('redirects a non-admin session away from /gm to /math', async () => {
    getSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } } })
    rpc.mockResolvedValue({ data: false })
    const res = await middleware(req('/gm'))
    expect(res.headers.get('location')).toContain('/math')
  })

  it('lets an admin into /gm', async () => {
    getSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } } })
    rpc.mockResolvedValue({ data: true })
    const res = await middleware(req('/gm'))
    expect(res.headers.get('location')).toBeNull()
  })

  it('sends an authenticated admin away from /login to /gm', async () => {
    getSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } } })
    const res = await middleware(req('/login'))
    expect(res.headers.get('location')).toContain('/gm')
  })

  it('does not gate public routes', async () => {
    getSession.mockResolvedValue({ data: { session: null } })
    const res = await middleware(req('/math/leaderboard'))
    expect(res.headers.get('location')).toBeNull()
  })
})
