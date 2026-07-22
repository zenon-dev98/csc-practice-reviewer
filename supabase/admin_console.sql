-- Read-only administration for the CSC Practice Reviewer.
-- Run after supabase/schema.sql, then bootstrap one authenticated user at the end.

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create table if not exists public.app_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  label text not null default 'Reviewer administrator',
  created_at timestamptz not null default now()
);

alter table public.app_admins enable row level security;
revoke all on public.app_admins from public, anon, authenticated;
grant select on public.app_admins to authenticated;

drop policy if exists "administrators can read their own access record" on public.app_admins;
create policy "administrators can read their own access record"
on public.app_admins
for select
to authenticated
using (auth.uid() = user_id);

create or replace function private.is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.app_admins
    where user_id = auth.uid()
  );
$$;

revoke all on function private.is_app_admin() from public, anon;
grant execute on function private.is_app_admin() to authenticated;

drop policy if exists "administrators can read all profiles" on public.profiles;
create policy "administrators can read all profiles"
on public.profiles
for select
to authenticated
using ((select private.is_app_admin()));

drop policy if exists "administrators can read all attempts" on public.attempts;
create policy "administrators can read all attempts"
on public.attempts
for select
to authenticated
using ((select private.is_app_admin()));

drop policy if exists "administrators can read all attempt answers" on public.attempt_answers;
create policy "administrators can read all attempt answers"
on public.attempt_answers
for select
to authenticated
using ((select private.is_app_admin()));

drop policy if exists "administrators can read all pause events" on public.pause_events;
create policy "administrators can read all pause events"
on public.pause_events
for select
to authenticated
using ((select private.is_app_admin()));

-- Bootstrap after creating the dedicated Auth user in Supabase Authentication:
--
-- insert into public.app_admins (user_id, label)
-- select id, 'Primary administrator'
-- from auth.users
-- where lower(email) = lower('admin@csc-practice-reviewer.local')
-- on conflict (user_id) do update set label = excluded.label;

