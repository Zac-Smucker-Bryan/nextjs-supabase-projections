-- Phase 1: collections, projects, and activity log

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections (id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  description text,
  project_type text not null default 'general'
    check (project_type in ('general', 'sales_forecast', 'income_statement', 'balance_sheet', 'cash_flow')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.activity_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  event_type text not null,
  description text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index collections_owner_id_idx on public.collections (owner_id);
create index projects_collection_id_idx on public.projects (collection_id);
create index activity_events_project_id_idx on public.activity_events (project_id, created_at desc);

create trigger collections_set_updated_at
  before update on public.collections
  for each row execute function public.set_updated_at();

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

alter table public.collections enable row level security;
alter table public.projects enable row level security;
alter table public.activity_events enable row level security;

create policy "Users manage own collections"
  on public.collections
  for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "Users manage projects in own collections"
  on public.projects
  for all
  using (
    exists (
      select 1
      from public.collections c
      where c.id = projects.collection_id
        and c.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.collections c
      where c.id = projects.collection_id
        and c.owner_id = auth.uid()
    )
  );

create policy "Users read activity for own projects"
  on public.activity_events
  for select
  using (
    exists (
      select 1
      from public.projects p
      join public.collections c on c.id = p.collection_id
      where p.id = activity_events.project_id
        and c.owner_id = auth.uid()
    )
  );

create policy "Users insert activity for own projects"
  on public.activity_events
  for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.projects p
      join public.collections c on c.id = p.collection_id
      where p.id = activity_events.project_id
        and c.owner_id = auth.uid()
    )
  );
