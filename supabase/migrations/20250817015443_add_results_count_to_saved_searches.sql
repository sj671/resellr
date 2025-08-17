-- Add results_count column to cached the total count of items in results_json
-- This improves performance by avoiding JSON parsing on every dashboard load

alter table public.saved_searches
  add column if not exists results_count integer default 0;

-- Create an index on results_count for faster aggregations
create index if not exists idx_saved_searches_results_count on public.saved_searches(results_count);

-- Update existing records to populate results_count
-- This will run once to populate existing data
update public.saved_searches 
set results_count = (
  case 
    when results_json is null then 0
    when jsonb_typeof(results_json) = 'array' then jsonb_array_length(results_json)
    when jsonb_typeof(results_json) = 'object' and results_json ? 'results' then 
      case 
        when jsonb_typeof(results_json->'results') = 'array' then jsonb_array_length(results_json->'results')
        else 0
      end
    else 0
  end
)
where results_count = 0;
