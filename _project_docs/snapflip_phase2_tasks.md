# Snapflip — Phase 2 Tasks (Data Foundation)

Status: scaffolded in code and DB (local). This document tracks scope and acceptance.

## Scope
- Tables with RLS: `inventory_items`, `listings`, `sales`, `expenses`
- Basic CRUD UIs (create + list)
- Header navigation to new routes
- Types regenerated from DB

## DB & Security
- Migrations
  - [x] Create tables with owner `user_id`
  - [x] RLS policies (select/insert/update/delete) with `auth.uid()`
  - [x] `updated_at` triggers via `public.touch_updated_at()`
- Types
  - [x] `pnpm run db:types` generates `src/types/database.ts`

## UI Routes
- Inventory
  - [x] `/inventory` list
  - [x] `/inventory/new` create
  - [x] `/inventory/[id]/edit` edit
  - [x] Delete inline action
- Listings
  - [x] `/listings` list
  - [x] `/listings/new` create
  - [x] Edit/Delete
- Sales
  - [x] `/sales` list
  - [x] `/sales/new` create
  - [x] Edit/Delete
- Expenses
  - [x] `/expenses` list
  - [x] `/expenses/new` create
  - [x] Edit/Delete

## Acceptance Criteria
- Auth required for create/list (RLS enforces; lists will be empty for unauth users)
- Create forms insert rows with `user_id = auth.uid()`
- Lists show items ordered by recency with pagination and basic filters (where applicable)

## Follow-ups (next iterations)
- Expand filters (date range for Sales/Expenses; marketplace/status for Listings)
- Convert tables/forms fully to shadcn/ui components and add toasts
- Add zod validation to all create forms
- Monetary formatting and locales
- Unit/integration tests for RLS and basic UI flows

## Scripts
- Seed: `export $(grep -v '^#' .env.local | xargs) && pnpm run seed`
  - Env: `SEED_EMAIL`, `SEED_PASSWORD`
- Cleanup: `export $(grep -v '^#' .env.local | xargs) && node scripts/cleanup.mjs`
- Bulk inventory: `export $(grep -v '^#' .env.local | xargs) && COUNT=100 node scripts/bulk_inventory.mjs`
- RLS test: `export $(grep -v '^#' .env.local | xargs) && node scripts/test_rls.mjs`


