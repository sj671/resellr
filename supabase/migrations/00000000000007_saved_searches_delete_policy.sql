-- Allow owners to update/delete their own saved_searches

drop policy if exists "update own saved_searches" on public.saved_searches;
create policy "update own saved_searches" on public.saved_searches for update using (user_id = auth.uid());

drop policy if exists "delete own saved_searches" on public.saved_searches;
create policy "delete own saved_searches" on public.saved_searches for delete using (user_id = auth.uid());


