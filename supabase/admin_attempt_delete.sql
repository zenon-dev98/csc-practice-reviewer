-- Controlled administrator attempt deletion.
-- Run after supabase/admin_attempt_reset.sql when that older migration exists.
-- The attempt is archived before its live row is deleted; no replacement is created.

grant usage on schema private to authenticated;

create table if not exists public.admin_attempt_deletions (
  id uuid primary key default gen_random_uuid(),
  original_attempt_id uuid not null,
  attempt_user_id uuid not null,
  admin_user_id uuid not null,
  previous_status text not null check (previous_status in ('in_progress', 'paused', 'submitted', 'timed_out')),
  reason text not null check (char_length(btrim(reason)) between 8 and 500),
  attempt_snapshot jsonb not null,
  answer_snapshots jsonb not null default '[]'::jsonb,
  pause_snapshots jsonb not null default '[]'::jsonb,
  deleted_at timestamptz not null default now()
);

alter table public.admin_attempt_deletions enable row level security;
revoke all on public.admin_attempt_deletions from public, anon, authenticated;
grant select on public.admin_attempt_deletions to authenticated;

create index if not exists admin_attempt_deletions_user_deleted_idx
on public.admin_attempt_deletions(attempt_user_id, deleted_at desc);

drop policy if exists "administrators can read deletion audit" on public.admin_attempt_deletions;
create policy "administrators can read deletion audit"
on public.admin_attempt_deletions
for select
to authenticated
using ((select private.is_app_admin()));

create or replace function private.delete_attempt_for_admin(
  p_attempt_id uuid,
  p_reason text,
  p_confirmation text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  attempt_row public.attempts%rowtype;
  deletion_id uuid;
  answer_snapshot jsonb;
  pause_snapshot jsonb;
  normalized_reason text := btrim(coalesce(p_reason, ''));
begin
  if not private.is_app_admin() then
    raise exception 'Administrator access is required.' using errcode = '42501';
  end if;

  if upper(btrim(coalesce(p_confirmation, ''))) <> 'DELETE ATTEMPT' then
    raise exception 'Confirmation text did not match.' using errcode = '22023';
  end if;

  if char_length(normalized_reason) < 8 or char_length(normalized_reason) > 500 then
    raise exception 'A deletion reason between 8 and 500 characters is required.' using errcode = '22023';
  end if;

  select * into attempt_row
  from public.attempts
  where id = p_attempt_id
  for update;

  if not found then
    raise exception 'The attempt no longer exists.' using errcode = 'P0002';
  end if;

  select coalesce(jsonb_agg(to_jsonb(answer_row) order by answer_row.position), '[]'::jsonb)
  into answer_snapshot
  from public.attempt_answers as answer_row
  where answer_row.attempt_id = attempt_row.id;

  select coalesce(jsonb_agg(to_jsonb(pause_row) order by pause_row.paused_at), '[]'::jsonb)
  into pause_snapshot
  from public.pause_events as pause_row
  where pause_row.attempt_id = attempt_row.id;

  insert into public.admin_attempt_deletions (
    original_attempt_id, attempt_user_id, admin_user_id, previous_status,
    reason, attempt_snapshot, answer_snapshots, pause_snapshots
  ) values (
    attempt_row.id, attempt_row.user_id, auth.uid(), attempt_row.status,
    normalized_reason, to_jsonb(attempt_row), answer_snapshot, pause_snapshot
  )
  returning id into deletion_id;

  -- attempt_answers and pause_events cascade from this row after the archive exists.
  delete from public.attempts where id = attempt_row.id;

  return jsonb_build_object(
    'deletion_id', deletion_id,
    'original_attempt_id', attempt_row.id,
    'previous_status', attempt_row.status
  );
end;
$$;

revoke all on function private.delete_attempt_for_admin(uuid, text, text) from public, anon;
grant execute on function private.delete_attempt_for_admin(uuid, text, text) to authenticated;

create or replace function public.admin_delete_attempt(
  p_attempt_id uuid,
  p_reason text,
  p_confirmation text
)
returns jsonb
language sql
security invoker
set search_path = public
as $$
  select private.delete_attempt_for_admin($1, $2, $3);
$$;

revoke all on function public.admin_delete_attempt(uuid, text, text) from public, anon;
grant execute on function public.admin_delete_attempt(uuid, text, text) to authenticated;

-- Retire the earlier reset-and-replace capability. Existing reset audit rows remain intact.
drop function if exists public.admin_reset_attempt(uuid, text, text);
drop function if exists private.reset_attempt_for_admin(uuid, text, text);
