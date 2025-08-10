Resellr — Phase 0

Tech: Next.js 15 (App Router, TS), Tailwind, shadcn/ui, Supabase (Data API), next-pwa.

Setup

```bash
pnpm i
# Supabase CLI must be installed: https://supabase.com/docs/guides/cli
supabase init
supabase start   # spins up local Supabase (db, auth, studio)
```

Migrations

```bash
supabase migration up
```

Generate types

```bash
pnpm run db:types
```

Env

- Copy `.env.local.example` to `.env.local` and set:
  - `NEXT_PUBLIC_SUPABASE_URL` (from `supabase status` or local Studio)
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Run app

```bash
pnpm dev
```

PWA local test

```bash
pnpm build && pnpm start
# Open http://localhost:3000, use Chrome "Install app"
```

Notes

- All DB access uses Supabase Data API (PostgREST + RPC) via `@supabase/supabase-js`.
- Use RLS for security. For multi-step writes later, create SQL functions and call with `supabase.rpc()`.
