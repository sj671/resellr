-- Phase 3: eBay Connections & Sync State

create extension if not exists "uuid-ossp";

-- ebay_connections: one row per user
create table if not exists public.ebay_connections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  ebay_user_id text,
  refresh_token_enc text,
  access_token text,
  access_token_expires_at timestamptz,
  scopes text[] default '{}',
  status text not null default 'connected',
  failure_count int not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ebay_connections enable row level security;

drop policy if exists "read own ebay_connections" on public.ebay_connections;
create policy "read own ebay_connections" on public.ebay_connections for select using (user_id = auth.uid());

drop policy if exists "upsert own ebay_connections" on public.ebay_connections;
create policy "upsert own ebay_connections" on public.ebay_connections for insert with check (user_id = auth.uid());
create policy "update own ebay_connections" on public.ebay_connections for update using (user_id = auth.uid());

-- sync_state: track cursors/last sync time per provider/resource
create table if not exists public.sync_state (
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  resource text not null,
  cursor text,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, provider, resource)
);

alter table public.sync_state enable row level security;

drop policy if exists "read own sync_state" on public.sync_state;
create policy "read own sync_state" on public.sync_state for select using (user_id = auth.uid());
drop policy if exists "upsert own sync_state" on public.sync_state;
create policy "upsert own sync_state" on public.sync_state for insert with check (user_id = auth.uid());
create policy "update own sync_state" on public.sync_state for update using (user_id = auth.uid());

-- touch triggers
create or replace function public.touch_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end; $$ language plpgsql;

drop trigger if exists trg_ebay_connections_touch on public.ebay_connections;
create trigger trg_ebay_connections_touch before update on public.ebay_connections
for each row execute procedure public.touch_updated_at();

drop trigger if exists trg_sync_state_touch on public.sync_state;
create trigger trg_sync_state_touch before update on public.sync_state
for each row execute procedure public.touch_updated_at();


