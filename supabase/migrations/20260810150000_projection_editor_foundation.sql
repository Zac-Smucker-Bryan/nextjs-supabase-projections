-- Phase 4: the minimal, auditable financial projection grid.

create table public.projection_models (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.projects (id) on delete cascade,
  start_date date not null,
  horizon_years integer not null check (horizon_years between 1 and 20),
  currency_code text not null default 'USD' check (char_length(currency_code) = 3),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.projection_periods (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references public.projection_models (id) on delete cascade,
  period_start date not null,
  period_end date not null check (period_end >= period_start),
  label text not null,
  granularity text not null check (granularity in ('month', 'year')),
  position integer not null check (position >= 0),
  unique (model_id, position),
  unique (model_id, period_start)
);

create table public.projection_rows (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references public.projection_models (id) on delete cascade,
  parent_row_id uuid references public.projection_rows (id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  row_kind text not null default 'input'
    check (row_kind in ('section', 'input', 'calculated', 'summary')),
  position integer not null check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (model_id, parent_row_id, position)
);

create table public.projection_cells (
  id uuid primary key default gen_random_uuid(),
  row_id uuid not null references public.projection_rows (id) on delete cascade,
  period_id uuid not null references public.projection_periods (id) on delete cascade,
  input_value numeric(18, 4),
  formula_text text,
  calculated_value numeric(18, 4),
  updated_at timestamptz not null default now(),
  check (input_value is not null or formula_text is not null),
  unique (row_id, period_id)
);

create table public.assumption_applications (
  id uuid primary key default gen_random_uuid(),
  assumption_id uuid not null references public.assumptions (id) on delete cascade,
  model_id uuid not null references public.projection_models (id) on delete cascade,
  row_id uuid references public.projection_rows (id) on delete cascade,
  start_period_id uuid references public.projection_periods (id) on delete set null,
  end_period_id uuid references public.projection_periods (id) on delete set null,
  created_at timestamptz not null default now(),
  check (
    (start_period_id is null and end_period_id is null)
    or (start_period_id is not null and end_period_id is not null)
  )
);

create index projection_periods_model_position_idx on public.projection_periods (model_id, position);
create index projection_rows_model_parent_position_idx on public.projection_rows (model_id, parent_row_id, position);
create index projection_cells_row_period_idx on public.projection_cells (row_id, period_id);
create index assumption_applications_model_row_idx on public.assumption_applications (model_id, row_id);

create trigger projection_models_set_updated_at
  before update on public.projection_models
  for each row execute function public.set_updated_at();

create trigger projection_rows_set_updated_at
  before update on public.projection_rows
  for each row execute function public.set_updated_at();

create trigger projection_cells_set_updated_at
  before update on public.projection_cells
  for each row execute function public.set_updated_at();

alter table public.projection_models enable row level security;
alter table public.projection_periods enable row level security;
alter table public.projection_rows enable row level security;
alter table public.projection_cells enable row level security;
alter table public.assumption_applications enable row level security;

create policy "Users manage projection models in own projects" on public.projection_models for all to authenticated
  using (exists (select 1 from public.projects p where p.id = projection_models.project_id and p.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.projects p where p.id = projection_models.project_id and p.owner_id = (select auth.uid())));

create policy "Users manage projection periods in own projects" on public.projection_periods for all to authenticated
  using (exists (select 1 from public.projection_models m join public.projects p on p.id = m.project_id where m.id = projection_periods.model_id and p.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.projection_models m join public.projects p on p.id = m.project_id where m.id = projection_periods.model_id and p.owner_id = (select auth.uid())));

create policy "Users manage projection rows in own projects" on public.projection_rows for all to authenticated
  using (exists (select 1 from public.projection_models m join public.projects p on p.id = m.project_id where m.id = projection_rows.model_id and p.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.projection_models m join public.projects p on p.id = m.project_id where m.id = projection_rows.model_id and p.owner_id = (select auth.uid())));

create policy "Users manage projection cells in own projects" on public.projection_cells for all to authenticated
  using (exists (select 1 from public.projection_rows r join public.projection_models m on m.id = r.model_id join public.projects p on p.id = m.project_id where r.id = projection_cells.row_id and p.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.projection_rows r join public.projection_models m on m.id = r.model_id join public.projects p on p.id = m.project_id where r.id = projection_cells.row_id and p.owner_id = (select auth.uid())));

create policy "Users manage assumption applications in own projects" on public.assumption_applications for all to authenticated
  using (exists (select 1 from public.projection_models m join public.projects p on p.id = m.project_id where m.id = assumption_applications.model_id and p.owner_id = (select auth.uid())))
  with check (
    exists (select 1 from public.projection_models m join public.projects p on p.id = m.project_id where m.id = assumption_applications.model_id and p.owner_id = (select auth.uid()))
    and exists (select 1 from public.assumptions a where a.id = assumption_applications.assumption_id and a.project_id = (select m.project_id from public.projection_models m where m.id = assumption_applications.model_id))
  );
