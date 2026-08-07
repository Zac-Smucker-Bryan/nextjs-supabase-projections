-- Phase 2: reusable drivers and named checkpoints for a projection.

create table public.assumptions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  value text not null check (char_length(trim(value)) > 0),
  assumption_type text not null default 'number'
    check (assumption_type in ('number', 'percentage', 'currency', 'text')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.projection_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  version_name text not null check (char_length(trim(version_name)) > 0),
  notes text,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index assumptions_project_id_idx on public.assumptions (project_id, created_at);
create index projection_versions_project_id_idx on public.projection_versions (project_id, created_at desc);

create trigger assumptions_set_updated_at
  before update on public.assumptions
  for each row execute function public.set_updated_at();

alter table public.assumptions enable row level security;
alter table public.projection_versions enable row level security;

create policy "Users manage assumptions in own projects"
  on public.assumptions for all
  using (exists (select 1 from public.projects p join public.collections c on c.id = p.collection_id where p.id = assumptions.project_id and c.owner_id = auth.uid()))
  with check (exists (select 1 from public.projects p join public.collections c on c.id = p.collection_id where p.id = assumptions.project_id and c.owner_id = auth.uid()));

create policy "Users manage versions in own projects"
  on public.projection_versions for all
  using (exists (select 1 from public.projects p join public.collections c on c.id = p.collection_id where p.id = projection_versions.project_id and c.owner_id = auth.uid()))
  with check (created_by = auth.uid() and exists (select 1 from public.projects p join public.collections c on c.id = p.collection_id where p.id = projection_versions.project_id and c.owner_id = auth.uid()));
