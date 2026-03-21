alter table public.saved_concepts
  add column if not exists user_id uuid references auth.users(id) on delete set null;

alter table public.usage_records
  add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists saved_concepts_user_id_idx
  on public.saved_concepts (user_id);

create index if not exists usage_records_user_id_idx
  on public.usage_records (user_id);
