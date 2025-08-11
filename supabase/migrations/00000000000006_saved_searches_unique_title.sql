-- Enforce per-user unique titles for saved searches

do $$
begin
  if not exists (
    select 1 from pg_indexes where schemaname = 'public' and indexname = 'ux_saved_searches_user_title'
  ) then
    create unique index ux_saved_searches_user_title
      on public.saved_searches(user_id, title);
  end if;
end$$;


