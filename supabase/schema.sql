create extension if not exists pgcrypto;

create table if not exists public.saved_concepts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  session_id text not null,
  company_slug text,
  lead_destination jsonb not null default '{}'::jsonb,
  provider text,
  mode text not null default 'live',
  quality text,
  style_id text not null,
  style_label text,
  modifiers jsonb not null default '[]'::jsonb,
  preserve_layout text not null,
  optional_note text,
  prompt_summary text,
  prompt_cache_key text,
  result_image_url text,
  result_image_inline boolean not null default false,
  meta jsonb not null default '{}'::jsonb
);

create table if not exists public.usage_records (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  session_id text not null,
  concept_id uuid references public.saved_concepts(id) on delete set null,
  company_slug text,
  event_type text not null default 'generation',
  status text not null,
  provider text,
  style_id text,
  modifiers jsonb not null default '[]'::jsonb,
  preserve_layout text,
  optional_note text,
  completed_generations integer,
  remaining_generations integer,
  max_free_generations integer,
  cooldown_remaining_seconds integer,
  error_code text
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  session_id text,
  concept_id uuid references public.saved_concepts(id) on delete set null,
  company_slug text,
  lead_destination jsonb not null default '{}'::jsonb,
  name text not null,
  email text not null,
  postcode text,
  phone text,
  notes text,
  source text,
  concept_metadata jsonb not null default '{}'::jsonb
);

create index if not exists saved_concepts_created_at_idx
  on public.saved_concepts (created_at desc);

create index if not exists saved_concepts_session_id_idx
  on public.saved_concepts (session_id);

create index if not exists usage_records_created_at_idx
  on public.usage_records (created_at desc);

create index if not exists usage_records_session_id_idx
  on public.usage_records (session_id);

create index if not exists leads_created_at_idx
  on public.leads (created_at desc);

create index if not exists leads_email_idx
  on public.leads (email);

alter table public.saved_concepts enable row level security;
alter table public.usage_records enable row level security;
alter table public.leads enable row level security;

comment on table public.saved_concepts is
  'MVP concept records saved server-side from generation requests. Uses service-role writes only.';

comment on table public.usage_records is
  'Lightweight generation and limit event records for MVP operational visibility.';

comment on table public.leads is
  'Lead enquiries enriched with concept metadata for follow-up and quoting.';
