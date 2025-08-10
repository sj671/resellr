# Resellr — Project Requirements Document (PRD)
**Version:** 0.1 (Phase 0 baseline)  
**Owner:** Shaun (Product/Tech Lead)  
**Date:** 2025-08-09  
**Status:** Draft

---

## 1. Overview
Resellr is a modern PWA for resellers to track inventory, sales, expenses, and profitability across marketplaces (eBay first). The product prioritizes a clean, mobile‑first UI and a phased delivery plan: establish a robust environment and design system, then add features incrementally.

### Goals
- Deliver a fast, installable PWA with a consistent design system (Tailwind + shadcn/ui).
- Use Supabase (Auth, PostgREST, RPC, RLS) as the single source of truth. No ORM.
- Build features in small, testable increments with clear acceptance criteria per phase.

### Non‑Goals (for now)
- Advanced analytics (cohort, forecasting, ML).
- Multi‑tenant organizations/roles beyond a single user session.
- Full eBay listing management (we start with read/ingest, not create/edit listings).

---

## 2. Phasing
### Phase 0 — Environment & PWA Shell (this document’s scope)
- Next.js 15+ (App Router, TS), Tailwind, shadcn/ui
- Supabase wiring (Data API), SQL migrations via Supabase CLI
- RLS‑ready DB with `profiles` table
- PWA manifest, service worker (next-pwa)
- Minimal pages and layout, dark/light theme, header/footer

**Success Criteria**
- Installable app (`pnpm build && pnpm start`) with manifest+SW.
- Supabase local environment runs with initial migration and generated TS types.
- No TypeScript errors; mobile‑first responsive layout.

### Phase 1 — Auth Baseline
- Supabase Email (magic link) auth
- Session on SSR, protected routes (`/dashboard`) with simple avatar/menu
- Profiles row auto‑create on first sign‑in (Edge‑safe)

### Phase 2 — Data Foundation
- Tables: `inventory_items`, `listings`, `sales`, `expenses`
- RLS policies for each table (owner‑only access by `auth.uid()`)
- Basic CRUD UIs with shadcn tables, pagination, filters

### Phase 3 — eBay Sync (Read‑Only)
- OAuth connection, background pulls for Orders & active Listings
- Mapping to local tables; idempotent upserts
- Manual sale entry for non‑eBay marketplaces

### Phase 4 — Insights & Exports
- KPIs (Revenue, Fees, COGS, Net, ROI, Sell‑Through)
- Date/marketplace filters, CSV export

---

## 3. Users & Use Cases
**Primary user:** Solo reseller who wants clear cost/profit tracking with minimal manual work.  
**Initial scenarios:**
1. Install Resellr as a mobile app and browse core sections.
2. Sign in and see a personalized dashboard (Phase 1).
3. Add inventory items; record sales (Phase 2).
4. Connect eBay and see imported sales (Phase 3).

---

## 4. Functional Requirements (Phase 0)
1. **Shell & Navigation**
   - Header with brand, responsive nav (Sheet on mobile), theme toggle.
   - Footer with placeholder Privacy/Terms.
2. **Landing Page**
   - Hero section, CTAs, 3 informational cards.
3. **PWA**
   - `manifest.webmanifest` with icons; `next-pwa` registered on prod build.
4. **Supabase Wiring**
   - `client.ts` and `server.ts` helpers.
   - SQL migration: `public.profiles` with RLS (read/update/insert self).
5. **Types**
   - `pnpm run db:types` generates `src/types/database.ts`.

---

## 5. Non‑Functional Requirements
### Performance
- Lighthouse PWA score ≥ 90 on production build.
- First load JS budget (Phase 0) ≤ 180KB gzipped (excluding fonts/icons).

### Security & Privacy
- **Row Level Security (RLS)** on all tables; default‑deny posture.
- Use `supabase-js` with PostgREST/RPC (no ORM). Service role keys are never used in client code.
- HTTP security headers: X‑Frame‑Options (SAMEORIGIN), Referrer‑Policy (strict‑origin‑when‑cross‑origin), Permissions‑Policy (camera/mic/geo disabled by default). 
- Secrets stored only in server runtime or `.env.local` (never committed). 
- Access logs via Supabase Studio; consider Sentry for client/server error reporting.
- Data retention defaults: user‑generated data retained until deletion; log retention follows Supabase defaults (configurable later).

### Accessibility (A11y)
- Meet WCAG 2.1 AA for color contrast and keyboard navigation on primary flows.
- Use semantic HTML; aria‑labels on icon‑only controls; focus states visible.

### Reliability
- Local dev supported via `supabase start`.
- Idempotent SQL migrations; never destructive without back‑up plan (future phases).

### Observability
- Basic client error boundaries; Sentry integration planned in Phase 2+.

---

## 6. Architecture
**Frontend:** Next.js 15 (App Router, Server Components, Server Actions), Tailwind, shadcn/ui.  
**Backend:** Supabase (Auth, PostgREST, RPC, RLS).  
**Storage:** Supabase Storage (Phase 2+ for photos/receipts).  
**Jobs/Sync:** Supabase Scheduled Functions or external worker (Phase 3).

**Data Access Pattern**
- Reads/Writes: `supabase.from("<table>")` queries with RLS enforcement.
- Multi‑step transactions: `supabase.rpc("<function_name>", args)`.
- TS types generated from DB; no duplicate schema in code.

---

## 7. Data Model (Phase 0)
- `public.profiles`  
  - `id uuid PK` (FK to `auth.users`), `email text`, `display_name text`, `avatar_url text`, `created_at`, `updated_at`  
  - RLS: user can select/insert/update only their row.

(Phase 2 will add: `inventory_items`, `listings`, `sales`, `expenses` with owner scoping.)

---

## 8. UI / UX
- Visual Language: clean, spacious, subtle elevation, rounded radius (`--radius: 0.75rem`), prefers-dark compatible.
- Components: shadcn base set (Button, Card, Input, Table, Dialog, DropdownMenu, Form, Toast, Sheet, Badge, Tooltip, Tabs, Textarea, Select, Avatar, Progress).
- Navigation: top nav with responsive Sheet; clear empty states and placeholders (“Coming soon”).

---

## 9. Telemetry & Metrics
- Phase 0: Lighthouse score, bundle size, error counts (console baseline).
- Future: Sentry events, route latency, API error rates, ingestion lag.

---

## 10. Rollout & Environments
- **Local:** `supabase start`, `pnpm dev`.
- **Staging:** Vercel preview + Supabase project (locked with service role only for server routes). 
- **Production:** Vercel + Supabase; rotate keys; strict CORS; domain with HTTPS. 
- **Feature flags:** config‑driven; hide unfinished routes from nav.

---

## 11. Risks & Mitigations
- **Risk:** RLS misconfiguration leaking rows.  
  **Mitigation:** default‑deny, unit tests for policies (Phase 2).
- **Risk:** PWA caching stale API responses.  
  **Mitigation:** network‑first strategies for data routes; SW limited to static assets initially.
- **Risk:** eBay API quota/changes.  
  **Mitigation:** idempotent upserts, backoff, narrow scopes (Phase 3).

---

## 12. Acceptance Criteria (Phase 0 Recap)
- Build produces installable PWA; Lighthouse PWA ≥ 90.
- Supabase init + migration succeeds; `profiles` RLS enforced.
- Type generation works; no TS errors.
- Responsive header/footer, theme toggle, landing cards render on mobile/desktop.

---

## 13. Appendices
### A. Commands
```bash
pnpm i
supabase init
supabase start
supabase migration up
pnpm run db:types
pnpm dev
# PWA test
pnpm build && pnpm start
```

### B. Future Tables (Preview)
- `inventory_items(id, owner_id, title, sku, cost, acquired_at, source, photos[])`
- `listings(id, owner_id, item_id, marketplace, listing_id, status, price)`
- `sales(id, owner_id, item_id, listing_id, sale_id, price, fees, shipping_in, shipping_out, tax, sold_at)`
- `expenses(id, owner_id, category, amount, date, item_id?)`
(Each table RLS: `owner_id = auth.uid()`.)

---

*End of PRD v0.1*
