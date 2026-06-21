# SPEC-016-A: Admin-Only Authentication

Implements [ADR-016](../adrs/ADR-016-Admin-Only-Auth.md).

## Middleware (`src/middleware.ts`)

- Matcher: `['/gm/:path*', '/login']`.
- `/gm/*`:
  - no session → `307` redirect to `/login?returnUrl=<encoded path>`.
  - session present but `has_role('gm')` and `has_role('admin')` both falsey → redirect to `/math`.
  - admin/gm → pass through.
- `/login` with an active session → redirect to `/gm`.
- All other paths are unmatched (public, no auth work).

## Server actions (`src/lib/auth/actions.ts`)

- `signIn(email, password)` → on success `redirect('/gm')`.
- `signOut()` → `redirect('/math')`.
- `getUser` / `getSession` unchanged.
- `signUp` / `resetPassword` / `updatePassword` / `signInWithOAuth` are no longer reachable from the UI; their removal (and the matching form components) is deferred to the Phase-4 prune to keep this change focused.

## UI

- `src/app/(auth)/register/` and `src/app/(auth)/reset-password/` routes removed.
- `LoginForm` reduced to admin email/password (no OAuth buttons, no sign-up / forgot-password links); success → `/gm`.

## Acceptance tests (`src/tests/middleware/admin-only.test.ts`)

1. Unauthenticated `/gm/*` → redirect to `/login` carrying `returnUrl`.
2. Authenticated non-admin `/gm` → redirect to `/math`.
3. Authenticated admin `/gm` → pass through (no redirect).
4. Authenticated `/login` → redirect to `/gm`.
5. Public route (e.g. `/math/leaderboard`) → never redirected.
