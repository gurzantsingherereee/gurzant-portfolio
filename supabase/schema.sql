-- GURZANT portfolio CMS. Run ONLY in the Supabase project owned by
-- gurzantsinghere@gmail.com. Non-destructive: creates new tables.
-- Public readers see published content only. Writes restricted to owner login.

create table if not exists public.gurzant_site_content (
  key text primary key,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft','published')),
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.gurzant_content_revisions (
  id bigint generated always as identity primary key,
  snapshot jsonb not null,
  action text not null default 'publish',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.gurzant_site_content enable row level security;
alter table public.gurzant_content_revisions enable row level security;

-- Remove broad defaults, then grant the smallest useful set.
revoke all on public.gurzant_site_content from anon, authenticated;
revoke all on public.gurzant_content_revisions from anon, authenticated;
grant select on public.gurzant_site_content to anon;
grant select, insert, update, delete on public.gurzant_site_content to authenticated;
grant select, insert on public.gurzant_content_revisions to authenticated;
grant usage, select on sequence public.gurzant_content_revisions_id_seq to authenticated;

drop policy if exists "Published site content is public" on public.gurzant_site_content;
create policy "Published site content is public"
  on public.gurzant_site_content for select to anon, authenticated
  using (status = 'published');

drop policy if exists "Sole admin can read content" on public.gurzant_site_content;
create policy "Sole admin can read content"
  on public.gurzant_site_content for select to authenticated
  using (auth.uid() is not null and lower(coalesce(auth.jwt()->>'email','')) = 'gurzantsinghere@gmail.com');

drop policy if exists "Sole admin can insert content" on public.gurzant_site_content;
create policy "Sole admin can insert content"
  on public.gurzant_site_content for insert to authenticated
  with check (auth.uid() is not null and lower(coalesce(auth.jwt()->>'email','')) = 'gurzantsinghere@gmail.com' and updated_by=auth.uid());

drop policy if exists "Sole admin can update content" on public.gurzant_site_content;
create policy "Sole admin can update content"
  on public.gurzant_site_content for update to authenticated
  using (auth.uid() is not null and lower(coalesce(auth.jwt()->>'email','')) = 'gurzantsinghere@gmail.com')
  with check (auth.uid() is not null and lower(coalesce(auth.jwt()->>'email','')) = 'gurzantsinghere@gmail.com' and updated_by=auth.uid());

drop policy if exists "Sole admin can delete content" on public.gurzant_site_content;
create policy "Sole admin can delete content"
  on public.gurzant_site_content for delete to authenticated
  using (auth.uid() is not null and lower(coalesce(auth.jwt()->>'email','')) = 'gurzantsinghere@gmail.com');

drop policy if exists "Sole admin can view revisions" on public.gurzant_content_revisions;
create policy "Sole admin can view revisions"
  on public.gurzant_content_revisions for select to authenticated
  using (auth.uid() is not null and lower(coalesce(auth.jwt()->>'email','')) = 'gurzantsinghere@gmail.com');

drop policy if exists "Sole admin can record revisions" on public.gurzant_content_revisions;
create policy "Sole admin can record revisions"
  on public.gurzant_content_revisions for insert to authenticated
  with check (auth.uid() is not null and lower(coalesce(auth.jwt()->>'email','')) = 'gurzantsinghere@gmail.com' and created_by=auth.uid());