-- Extend the projection editor without rewriting existing models or cells.
alter table public.projection_models
  add column monthly_years integer not null default 1 check (monthly_years between 1 and 2);

alter table public.projection_models
  drop constraint if exists projection_models_horizon_years_check,
  add constraint projection_models_horizon_years_check check (horizon_years between 1 and 10);

alter table public.projection_rows
  add column format_bold boolean not null default false,
  add column format_fill text check (format_fill in ('muted', 'accent') or format_fill is null);
