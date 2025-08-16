-- Create a public bucket for research uploads where users can manage their own files
do $$
begin
  insert into storage.buckets (id, name, public)
  values ('research-public', 'research-public', true);
exception when unique_violation then
  null;
end $$;

-- Public read for objects in this bucket
create policy "public read research-public" on storage.objects
  for select using (
    bucket_id = 'research-public'
  );

-- Authenticated users can upload to their own folder: {user_id}/...
create policy "users can upload own images research-public" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'research-public'
    and (
      -- Path must begin with their user id followed by a slash
      name like auth.uid()::text || '/%'
    )
  );

-- Authenticated users can update objects only in their own folder
create policy "users can update own images research-public" on storage.objects
  for update to authenticated using (
    bucket_id = 'research-public' and name like auth.uid()::text || '/%'
  );

-- Authenticated users can delete objects only in their own folder
create policy "users can delete own images research-public" on storage.objects
  for delete to authenticated using (
    bucket_id = 'research-public' and name like auth.uid()::text || '/%'
  );


