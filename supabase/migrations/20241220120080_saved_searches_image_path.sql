alter table public.saved_searches
  add column if not exists reference_image_path text;
