-- Saved searches for research

create table if not exists public.saved_searches (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  query text,
  ai_query text,
  reference_image_url text,
  results_json jsonb,
  created_at timestamptz not null default now()
);

alter table public.saved_searches enable row level security;

drop policy if exists "read own saved_searches" on public.saved_searches;
create policy "read own saved_searches" on public.saved_searches for select using (user_id = auth.uid());

drop policy if exists "insert own saved_searches" on public.saved_searches;
create policy "insert own saved_searches" on public.saved_searches for insert with check (user_id = auth.uid());

create index if not exists idx_saved_searches_user_id on public.saved_searches(user_id);


