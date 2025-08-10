-- Phase 2: Data Foundation
-- Tables: inventory_items, listings, sales, expenses
-- RLS: owner-only via user_id = auth.uid()

create extension if not exists "uuid-ossp";

-- inventory_items
create table if not exists public.inventory_items (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  sku text,
  quantity integer not null default 1,
  purchase_price numeric(10,2),
  acquired_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, sku)
);

-- listings
create table if not exists public.listings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  inventory_item_id uuid references public.inventory_items(id) on delete set null,
  marketplace text not null,
  marketplace_listing_id text,
  title text,
  price numeric(10,2),
  status text,
  listed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, marketplace, marketplace_listing_id)
);

-- sales
create table if not exists public.sales (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  inventory_item_id uuid references public.inventory_items(id) on delete set null,
  sale_date timestamptz not null default now(),
  quantity integer not null default 1,
  gross_amount numeric(10,2) not null,
  fees numeric(10,2) default 0,
  shipping_income numeric(10,2) default 0,
  shipping_cost numeric(10,2) default 0,
  tax numeric(10,2) default 0,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- expenses
create table if not exists public.expenses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  occurred_at date not null default now(),
  category text not null,
  amount numeric(10,2) not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS policies
alter table public.inventory_items enable row level security;
alter table public.listings enable row level security;
alter table public.sales enable row level security;
alter table public.expenses enable row level security;

-- SELECT policies
drop policy if exists "read own inventory_items" on public.inventory_items;
create policy "read own inventory_items" on public.inventory_items for select using (user_id = auth.uid());
drop policy if exists "read own listings" on public.listings;
create policy "read own listings" on public.listings for select using (user_id = auth.uid());
drop policy if exists "read own sales" on public.sales;
create policy "read own sales" on public.sales for select using (user_id = auth.uid());
drop policy if exists "read own expenses" on public.expenses;
create policy "read own expenses" on public.expenses for select using (user_id = auth.uid());

-- INSERT policies
drop policy if exists "insert own inventory_items" on public.inventory_items;
create policy "insert own inventory_items" on public.inventory_items for insert with check (user_id = auth.uid());
drop policy if exists "insert own listings" on public.listings;
create policy "insert own listings" on public.listings for insert with check (user_id = auth.uid());
drop policy if exists "insert own sales" on public.sales;
create policy "insert own sales" on public.sales for insert with check (user_id = auth.uid());
drop policy if exists "insert own expenses" on public.expenses;
create policy "insert own expenses" on public.expenses for insert with check (user_id = auth.uid());

-- UPDATE policies
drop policy if exists "update own inventory_items" on public.inventory_items;
create policy "update own inventory_items" on public.inventory_items for update using (user_id = auth.uid());
drop policy if exists "update own listings" on public.listings;
create policy "update own listings" on public.listings for update using (user_id = auth.uid());
drop policy if exists "update own sales" on public.sales;
create policy "update own sales" on public.sales for update using (user_id = auth.uid());
drop policy if exists "update own expenses" on public.expenses;
create policy "update own expenses" on public.expenses for update using (user_id = auth.uid());

-- DELETE policies
drop policy if exists "delete own inventory_items" on public.inventory_items;
create policy "delete own inventory_items" on public.inventory_items for delete using (user_id = auth.uid());
drop policy if exists "delete own listings" on public.listings;
create policy "delete own listings" on public.listings for delete using (user_id = auth.uid());
drop policy if exists "delete own sales" on public.sales;
create policy "delete own sales" on public.sales for delete using (user_id = auth.uid());
drop policy if exists "delete own expenses" on public.expenses;
create policy "delete own expenses" on public.expenses for delete using (user_id = auth.uid());

-- touch updated_at triggers
-- ensure helper exists
create or replace function public.touch_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end; $$ language plpgsql;

drop trigger if exists trg_inventory_items_touch on public.inventory_items;
create trigger trg_inventory_items_touch before update on public.inventory_items
for each row execute procedure public.touch_updated_at();

drop trigger if exists trg_listings_touch on public.listings;
create trigger trg_listings_touch before update on public.listings
for each row execute procedure public.touch_updated_at();

drop trigger if exists trg_sales_touch on public.sales;
create trigger trg_sales_touch before update on public.sales
for each row execute procedure public.touch_updated_at();

drop trigger if exists trg_expenses_touch on public.expenses;
create trigger trg_expenses_touch before update on public.expenses
for each row execute procedure public.touch_updated_at();

-- Indexes
create index if not exists idx_inventory_items_user_id on public.inventory_items(user_id);
create index if not exists idx_listings_user_id on public.listings(user_id);
create index if not exists idx_sales_user_id on public.sales(user_id);
create index if not exists idx_expenses_user_id on public.expenses(user_id);


