-- Phase 3: Extend sales for marketplace idempotency and debugging

alter table public.sales
  add column if not exists marketplace text,
  add column if not exists marketplace_sale_id text,
  add column if not exists external_json jsonb;

-- Unique upsert key to avoid duplicates from provider
create unique index if not exists ux_sales_user_marketplace_sale
  on public.sales(user_id, marketplace, marketplace_sale_id);


