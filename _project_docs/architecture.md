Resellr — Architecture (Phase 0–2)

This document describes the current architecture after Phases 0–2, along with key data flows and security boundaries.

## System Overview

```mermaid
flowchart LR
  subgraph Client["Browser / PWA (Client)"]
    UI["Next.js UI (hydrated islands)\nInputs, forms, links"]
    SW["Service Worker (next-pwa)\nprod build only"]
  end

  subgraph Next["Next.js App (App Router)"]
    RSC["Server Components (RSC)"]
    RH["Route Handlers\n(app/.../route.ts)"]
    SC["Supabase Server Client\n(@supabase/ssr)"]
    BC["Supabase Browser Client\n(@supabase/ssr)"]
  end

  subgraph Supabase["Supabase Local/Cloud"]
    AUTH["Auth"]
    API["PostgREST (Data API)"]
    DB[("Postgres\nRLS-enabled tables")]
    STG["Storage (future)"]
  end

  Studio["Supabase Studio\n(local admin)"]

  UI -- requests/HTML --> RSC
  RSC -- fetch (SSR) --> SC
  SC -- anon JWT --> API
  API -- RLS-enforced SQL --> DB
  RH -- POST/redirects --> AUTH
  UI -- auth (sign up/in) --> BC
  BC -- tokens/cookies --> AUTH
  AUTH -- session cookies/JWT --> UI
  SW -. offline shell .- UI
  Studio --- DB
```

- Client renders server-produced HTML from RSC. Minimal client JS is used (forms, actions).
- RSC and route handlers access Supabase via the SSR client with anon key and user session read from cookies.
- All data access is through PostgREST with Row Level Security (RLS) enforcing user ownership.
- The service worker is registered in production builds only.

## Auth (Phase 1) — Sequence

```mermaid
sequenceDiagram
  participant U as User (Browser)
  participant UI as Next.js /login (Client)
  participant SB as Supabase Auth
  participant APP as Next.js (RSC)

  U->>UI: Enter email/password, submit
  UI->>SB: supabase.auth.signInWithPassword()
  SB-->>UI: Session (access/refresh)
  UI->>APP: Navigate to /dashboard
  APP->>APP: Read cookies (SSR)
  APP->>SB: getUser() via SSR client
  APP->>SB: Upsert profile (first sign-in)
  SB-->>APP: OK
  APP-->>U: Render dashboard
```

Notes
- Profiles are upserted on the first session.
- Sign-out uses a server route handler (POST /auth/signout) that clears the session and redirects.

## Data Access (Phase 2) — Sequence

```mermaid
sequenceDiagram
  participant U as User (Browser)
  participant R as Next.js RSC (app/…/page.tsx)
  participant SB as Supabase PostgREST
  participant DB as Postgres (RLS)

  U->>R: Request /inventory?page=1&q=…
  R->>SB: select inventory_items with filters + range
  SB->>DB: Enforce RLS (user_id = auth.uid())
  DB-->>SB: Rows
  SB-->>R: Data + count
  R-->>U: HTML (table, pagination)
```

- RLS policies exist for: inventory_items, listings, sales, expenses.
- Pagination is handled by PostgREST range with count: exact.

## Domain Model (Phase 2)

```mermaid
flowchart TB
  USERS[(auth.users)]
  PROFILES[(public.profiles)]
  INV[(public.inventory_items)]
  LST[(public.listings)]
  SAL[(public.sales)]
  EXP[(public.expenses)]

  USERS -- id = profiles.id --> PROFILES
  USERS -- id = user_id --> INV
  USERS -- id = user_id --> LST
  USERS -- id = user_id --> SAL
  USERS -- id = user_id --> EXP

  INV -- optional --> LST
  LST -- inventory_item_id --> INV
  SAL -- optional --> INV
  SAL -- inventory_item_id --> INV
```

- All tables have user_id and RLS policies to scope to the owner.
- listings.inventory_item_id and sales.inventory_item_id are optional FKs to inventory_items.

## Security & Config

- Secrets: only anon key is used client-side; service role keys are never exposed.
- Cookies: httpOnly, sameSite=lax, secure in production; managed via @supabase/ssr.
- Headers: X-Frame-Options: SAMEORIGIN, Referrer-Policy: strict-origin-when-cross-origin, Permissions-Policy minimal.
- PWA: service worker enabled only in production builds (next-pwa).

## Build & Dev

- Local dev: supabase start, supabase migration up.
- Types: pnpm run db:types generates src/types/database.ts from local DB.
- Scripts: scripts/seed.mjs, scripts/cleanup.mjs, scripts/bulk_inventory.mjs, scripts/test_rls.mjs.

## Phase 3 (Preview)

- Add eBay OAuth connection (read-only sync), background sync (Edge Function or on-demand route), raw tables for audit, idempotent upserts to domain tables, and cursors for incremental fetches.
- Extend dashboard with marketplace status and last sync health.


