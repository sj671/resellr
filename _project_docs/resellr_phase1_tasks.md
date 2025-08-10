Resellr — Phase 1 Tasks (Auth Baseline)

Status: complete (with email/password auth instead of magic link).

Scope
- Supabase wiring (Auth, Data API) with SSR-safe helpers
- Basic auth flows and protected routes
- Profiles table auto-create on first sign-in

Implementation
- Helpers
  - [x] src/lib/supabase/client.ts (browser client)
  - [x] src/lib/supabase/server.ts (server/RSC clients with cookie handling)
- Env
  - [x] .env.local uses NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
- Auth flows (email/password)
  - [x] /signup create account (upserts profile when session created immediately)
  - [x] /login sign in with password (upserts profile after first sign-in)
  - [x] /auth/signout route (POST) logs out and redirects home
  - [x] /auth/callback handler maintained for email confirmation flows if enabled later
- Protected routes
  - [x] /dashboard requires session (redirects to /login when unauthenticated)
  - [x] Header user menu with sign out
- Profiles
  - [x] public.profiles migration (Phase 0) with RLS
  - [x] Profile upsert on first session (email and id)

Acceptance Criteria
- [x] Users can sign up/sign in (email/password) and reach /dashboard
- [x] Unauthenticated users are redirected to /login
- [x] A profile row is created/upserted for a new user on first session
- [x] Sign out works reliably via form POST
- [x] SSR and RSC clients safely read/set cookies

Notes
- We opted for email/password authentication (more conventional) instead of magic links.
- Email confirmations are disabled in local supabase/config.toml by default. If enabling confirmations, the /auth/callback route will exchange the code and proceed to /dashboard.

How to Test
1) Local Supabase
  npx supabase start
  npx supabase migration up
2) App
  pnpm dev
  # or production PWA check
  pnpm build && pnpm start
3) Auth
- Visit /signup to create an account
- Visit /login to sign in; verify redirect to /dashboard
- Use the header menu to sign out; verify you return to / and cannot access /dashboard

Follow-ups (later phases)
- Add password reset flow
- Optional: re-introduce magic link as an alternative provider
- Third-party OAuth providers in Phase 3+

