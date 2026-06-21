import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * unsorry-guild is public, read-only for everyone. The only gated area is the
 * admin console at /gm, which requires an authenticated admin (or gm) session.
 * See ADR-016 / SPEC-016-A.
 */
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  const { pathname, search } = request.nextUrl

  // Admin console: require a session + admin/gm role.
  if (pathname.startsWith('/gm')) {
    if (!session) {
      const returnUrl = encodeURIComponent(pathname + search)
      return NextResponse.redirect(new URL(`/login?returnUrl=${returnUrl}`, request.url))
    }

    const { data: isGM } = await supabase.rpc('has_role', { check_role: 'gm' })
    const { data: isAdmin } = await supabase.rpc('has_role', { check_role: 'admin' })

    if (!isGM && !isAdmin) {
      // Authenticated but not privileged → back to the public app.
      return NextResponse.redirect(new URL('/math', request.url))
    }
  }

  // Authenticated admins don't need the login page.
  if (session && pathname === '/login') {
    return NextResponse.redirect(new URL('/gm', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/gm/:path*', '/login'],
}
