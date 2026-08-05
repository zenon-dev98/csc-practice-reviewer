-- Controlled administrator attempt reset.
-- Run after supabase/schema.sql and supabase/admin_console.sql.
-- The public wrapper is SECURITY INVOKER; privileged work stays in private.

grant usage on schema private to authenticated;

create table if not exists public.admin_attempt_resets (
  id uuid primary key default gen_random_uuid(),
  original_attempt_id uuid not null,
  replacement_attempt_id uuid not null,
  attempt_user_id uuid not null references auth.users(id) on delete cascade,
  admin_user_id uuid not null,
  previous_status text not null check (previous_status in ('in_progress', 'paused', 'submitted', 'timed_out')),
  reason text not null check (char_length(btrim(reason)) between 8 and 500),
  attempt_snapshot jsonb not null,
  answer_snapshots jsonb not null default '[]'::jsonb,
  pause_snapshots jsonb not null default '[]'::jsonb,
  reset_at timestamptz not null default now()
);

alter table public.admin_attempt_resets enable row level security;
revoke all on public.admin_attempt_resets from public, anon, authenticated;
grant select on public.admin_attempt_resets to authenticated;
create index if not exists admin_attempt_resets_user_reset_idx
on public.admin_attempt_resets(attempt_user_id, reset_at desc);

drop policy if exists "administrators can read reset audit" on public.admin_attempt_resets;
create policy "administrators can read reset audit"
on public.admin_attempt_resets
for select
to authenticated
using ((select private.is_app_admin()));

create or replace function private.reset_attempt_for_admin(
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
  replacement_id uuid;
  reset_id uuid;
  answer_snapshot jsonb;
  pause_snapshot jsonb;
  normalized_reason text := btrim(coalesce(p_reason, ''));
begin
  if not private.is_app_admin() then
    raise exception 'Administrator access is required.' using errcode = '42501';
  end if;

  if upper(btrim(coalesce(p_confirmation, ''))) <> 'RESET ATTEMPT' then
    raise exception 'Confirmation text did not match.' using errcode = '22023';
  end if;

  if char_length(normalized_reason) < 8 or char_length(normalized_reason) > 500 then
    raise exception 'A reset reason between 8 and 500 characters is required.' using errcode = '22023';
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

  insert into public.attempts (
    user_id, mode, title, practice_category, exam_version_id, status,
    total_questions, total_time_seconds, options, question_order
  ) values (
    attempt_row.user_id,
    attempt_row.mode,
    attempt_row.title,
    attempt_row.practice_category,
    attempt_row.exam_version_id,
    'in_progress',
    attempt_row.total_questions,
    attempt_row.total_time_seconds,
    coalesce(attempt_row.options, '{}'::jsonb)
      - 'timerClock'
      - 'telemetry'
      - 'paperPhase'
      - 'paperFrozenAt'
      - 'paperTimedOut'
      - 'paperSyncError'
      - 'paperImportedAt'
      - 'paperBlankCount',
    attempt_row.question_order
  )
  returning id into replacement_id;

  insert into public.attempt_answers (
    attempt_id, user_id, question_id, position, display_number, original_item_number,
    section, subtopic, csc_skill, prompt, choices, correct_choice, original_correct_choice,
    explanation, stimulus, difficulty, selected_choice, skipped, flagged,
    time_spent_seconds, visit_count, answer_changes, changed_wrong_to_correct,
    changed_correct_to_wrong, answer_history
  )
  select
    replacement_id, attempt_row.user_id, question_id, position, display_number, original_item_number,
    section, subtopic, csc_skill, prompt, choices, correct_choice, original_correct_choice,
    explanation, stimulus, difficulty, null, false, false,
    0, 0, 0, 0, 0, '[]'::jsonb
  from public.attempt_answers
  where attempt_id = attempt_row.id;

  insert into public.admin_attempt_resets (
    original_attempt_id, replacement_attempt_id, attempt_user_id, admin_user_id,
    previous_status, reason, attempt_snapshot, answer_snapshots, pause_snapshots
  ) values (
    attempt_row.id, replacement_id, attempt_row.user_id, auth.uid(),
    attempt_row.status, normalized_reason, to_jsonb(attempt_row), answer_snapshot, pause_snapshot
  )
  returning id into reset_id;

  delete from public.attempts where id = attempt_row.id;

  return jsonb_build_object(
    'reset_id', reset_id,
    'original_attempt_id', attempt_row.id,
    'replacement_attempt_id', replacement_id,
    'previous_status', attempt_row.status
  );
end;
$$;

revoke all on function private.reset_attempt_for_admin(uuid, text, text) from public, anon;
grant execute on function private.reset_attempt_for_admin(uuid, text, text) to authenticated;

create or replace function public.admin_reset_attempt(
  p_attempt_id uuid,
  p_reason text,
  p_confirmation text
)
returns jsonb
language sql
security invoker
set search_path = public
as $$
  select private.reset_attempt_for_admin($1, $2, $3);
$$;

revoke all on function public.admin_reset_attempt(uuid, text, text) from public, anon;
grant execute on function public.admin_reset_attempt(uuid, text, text) to authenticated;
