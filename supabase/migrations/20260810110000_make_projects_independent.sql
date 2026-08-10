-- Phase 3: projects can exist independently, then optionally be organized in a collection.

alter table public.projects
  add column owner_id uuid references auth.users (id) on delete cascade;

-- Existing projects inherit the owner of the collection they already belong to.
update public.projects p
set owner_id = c.owner_id
from public.collections c
where c.id = p.collection_id
  and p.owner_id is null;

alter table public.projects
  alter column owner_id set not null,
  alter column collection_id drop not null;

create index projects_owner_id_updated_at_idx
  on public.projects (owner_id, updated_at desc);

-- The previous policies found project ownership through a required collection.
-- Project ownership is now direct, and a collection is optional.
drop policy if exists "Users manage projects in own collections" on public.projects;
drop policy if exists "Users read activity for own projects" on public.activity_events;
drop policy if exists "Users insert activity for own projects" on public.activity_events;
drop policy if exists "Users manage assumptions in own projects" on public.assumptions;
drop policy if exists "Users manage versions in own projects" on public.projection_versions;

create policy "Users manage own projects"
  on public.projects
  for all
  to authenticated
  using ((select auth.uid()) = owner_id)
  with check (
    (select auth.uid()) = owner_id
    and (
      collection_id is null
      or exists (
        select 1
        from public.collections c
        where c.id = projects.collection_id
          and c.owner_id = (select auth.uid())
      )
    )
  );

create policy "Users read activity for own projects"
  on public.activity_events
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.projects p
      where p.id = activity_events.project_id
        and p.owner_id = (select auth.uid())
    )
  );

create policy "Users insert activity for own projects"
  on public.activity_events
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.projects p
      where p.id = activity_events.project_id
        and p.owner_id = (select auth.uid())
    )
  );

create policy "Users manage assumptions in own projects"
  on public.assumptions
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.projects p
      where p.id = assumptions.project_id
        and p.owner_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.projects p
      where p.id = assumptions.project_id
        and p.owner_id = (select auth.uid())
    )
  );

create policy "Users manage versions in own projects"
  on public.projection_versions
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.projects p
      where p.id = projection_versions.project_id
        and p.owner_id = (select auth.uid())
    )
  )
  with check (
    created_by = (select auth.uid())
    and exists (
      select 1
      from public.projects p
      where p.id = projection_versions.project_id
        and p.owner_id = (select auth.uid())
    )
  );
