Snapflip — App (Phases 0–2)

Modern reseller PWA scaffold built with Next.js + Supabase. Phase 0–2 provide the shell, auth baseline, and data foundation with CRUD screens.

Stack
- Next.js 15 (App Router, TS, Server Components)
- Tailwind CSS (with light/dark theme)
- Supabase (Auth, PostgREST Data API, RLS)
- next-pwa (SW in production only)

Features (current)
- Auth (email/password): `/signup`, `/login`, POST `/auth/signout`; protected `/dashboard`
- Tables with RLS: `inventory_items`, `listings`, `sales`, `expenses`
  - CRUD for all entities (create, edit, delete)
  - Lists with shared server-side table, pagination, and filters
  - Listings link to Inventory items
- Dashboard KPIs (inventory count, listing count, 30d revenue, 30d net) + recent sales
- PWA manifest + SW (prod build); security headers (X-Frame-Options, Referrer-Policy, Permissions-Policy)

Prerequisites
- Node 18+ and pnpm
- Supabase CLI: https://supabase.com/docs/guides/cli

Setup
```bash
pnpm i
supabase init            # once per machine
supabase start           # local DB, Auth, Studio
```

Migrations & Types
```bash
supabase migration up    # apply migrations
pnpm run db:types        # generate src/types/database.ts from local DB
```

Environment
- Create `.env.local` with:
  - `NEXT_PUBLIC_SUPABASE_URL` (see `npx supabase status` → API_URL)
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (see `npx supabase status` → ANON_KEY)

Run
```bash
pnpm dev                 # dev mode, http://localhost:3000

# production/PWA test
pnpm build && pnpm start
```

Scripts
```bash
# load env and run
export $(grep -v '^#' .env.local | xargs)

pnpm run seed                              # create demo user + sample rows
node scripts/cleanup.mjs                   # delete demo user rows
COUNT=100 node scripts/bulk_inventory.mjs  # insert N inventory rows
node scripts/test_rls.mjs                  # verify RLS isolation
```

Project Structure (selected)
- `src/app/**` routes (App Router)
- `src/lib/supabase/*` SSR/browser clients
- `src/components/ui/data-table.tsx` shared server-side table
- `supabase/migrations/*` SQL schema and RLS
- `_project_docs/*` phase tasks and architecture (Mermaid diagrams)

Security
- RLS on all user-owned tables (`user_id = auth.uid()`).
- Server-side Supabase client reads cookies; anon key only in client.
- SW enabled in production build only.

SEO/PWA/Tooling
- ISR on home page; next-sitemap for `sitemap.xml` and `robots.txt`.
- Optional bundle analyzer: `ANALYZE=true pnpm build`.

Roadmap (Phase 3)
- eBay OAuth (read-only), background sync to local tables, cursors for incremental fetch.
- Dashboard sync status and marketplace health.
