-- CSC Practice Reviewer Supabase setup
-- Run this in the Supabase SQL Editor for project nifkdqhlwrztigitttfh.
-- The app keeps the question bank in static JS and stores user progress online.

create extension if not exists "pgcrypto";

create table if not exists public.invite_codes (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null unique,
  label text not null default 'Study group invite',
  active boolean not null default true,
  max_uses integer,
  used_count integer not null default 0,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

insert into public.invite_codes (code_hash, label, active)
values (
  '7e38bba1e812c851cd73feb3fc7917f19e688cd3d76e6b46438f55e4c9ee7b00',
  'Initial shared friend-group invite',
  true
)
on conflict (code_hash) do nothing;

create or replace function public.hook_validate_invite_code(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  submitted_code text;
  submitted_hash text;
  invite public.invite_codes%rowtype;
begin
  submitted_code := coalesce(
    event->'user'->'raw_user_meta_data'->>'invite_code',
    event->'user'->'user_metadata'->>'invite_code',
    event->'user'->'user_metadata'->>'inviteCode'
  );

  if submitted_code is null or length(trim(submitted_code)) = 0 then
    return jsonb_build_object(
      'error',
      jsonb_build_object('http_code', 400, 'message', 'Invite code is required.')
    );
  end if;

  submitted_hash := encode(digest(trim(submitted_code), 'sha256'), 'hex');

  select *
    into invite
    from public.invite_codes
   where code_hash = submitted_hash
     and active = true
     and (expires_at is null or expires_at > now())
     and (max_uses is null or used_count < max_uses)
   limit 1;

  if invite.id is null then
    return jsonb_build_object(
      'error',
      jsonb_build_object('http_code', 403, 'message', 'Invite code is invalid or expired.')
    );
  end if;

  update public.invite_codes
     set used_count = used_count + 1
   where id = invite.id;

  return '{}'::jsonb;
end;
$$;

grant usage on schema public to supabase_auth_admin;
grant execute on function public.hook_validate_invite_code(jsonb) to supabase_auth_admin;
grant select, update on public.invite_codes to supabase_auth_admin;
revoke all on public.invite_codes from anon, authenticated, public;
revoke execute on function public.hook_validate_invite_code(jsonb) from anon, authenticated, public;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  avatar_preset integer not null default 0,
  level text not null default 'Professional',
  birth_date date,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_active_at timestamptz not null default now()
);

create table if not exists public.setup_drafts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  options jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null check (mode in ('full', 'practice')),
  title text not null,
  practice_category text,
  exam_version_id text not null,
  status text not null check (status in ('in_progress', 'paused', 'submitted', 'timed_out')),
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  paused_at timestamptz,
  elapsed_seconds integer not null default 0,
  current_question_index integer not null default 0,
  total_questions integer not null,
  total_time_seconds integer,
  score integer,
  percent numeric,
  timed_out boolean not null default false,
  options jsonb not null default '{}'::jsonb,
  question_order jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.attempt_answers (
  attempt_id uuid not null references public.attempts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null,
  position integer not null,
  display_number integer not null,
  original_item_number integer,
  section text not null,
  subtopic text not null,
  csc_skill text,
  prompt text not null,
  choices jsonb not null default '[]'::jsonb,
  correct_choice text not null check (correct_choice in ('A', 'B', 'C', 'D')),
  original_correct_choice text check (original_correct_choice in ('A', 'B', 'C', 'D')),
  explanation text not null default '',
  stimulus jsonb,
  difficulty text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  selected_choice text check (selected_choice in ('A', 'B', 'C', 'D')),
  skipped boolean not null default false,
  flagged boolean not null default false,
  time_spent_seconds integer not null default 0,
  visit_count integer not null default 0,
  first_seen_at timestamptz,
  last_seen_at timestamptz,
  first_answered_at timestamptz,
  last_answered_at timestamptz,
  answer_changes integer not null default 0,
  changed_wrong_to_correct integer not null default 0,
  changed_correct_to_wrong integer not null default 0,
  answer_history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (attempt_id, question_id),
  unique (attempt_id, position)
);

create table if not exists public.pause_events (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.attempts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  paused_at timestamptz not null default now(),
  resumed_at timestamptz
);

create table if not exists public.app_updates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null default '',
  active boolean not null default true,
  published_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

drop trigger if exists setup_drafts_touch_updated_at on public.setup_drafts;
create trigger setup_drafts_touch_updated_at
before update on public.setup_drafts
for each row execute function public.touch_updated_at();

drop trigger if exists attempts_touch_updated_at on public.attempts;
create trigger attempts_touch_updated_at
before update on public.attempts
for each row execute function public.touch_updated_at();

drop trigger if exists attempt_answers_touch_updated_at on public.attempt_answers;
create trigger attempt_answers_touch_updated_at
before update on public.attempt_answers
for each row execute function public.touch_updated_at();

alter table public.profiles enable row level security;
alter table public.setup_drafts enable row level security;
alter table public.attempts enable row level security;
alter table public.attempt_answers enable row level security;
alter table public.pause_events enable row level security;
alter table public.app_updates enable row level security;

drop policy if exists "profiles are owned by the signed in user" on public.profiles;
create policy "profiles are owned by the signed in user"
on public.profiles
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "setup drafts are owned by the signed in user" on public.setup_drafts;
create policy "setup drafts are owned by the signed in user"
on public.setup_drafts
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "attempts are owned by the signed in user" on public.attempts;
create policy "attempts are owned by the signed in user"
on public.attempts
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "attempt answers are owned by the signed in user" on public.attempt_answers;
create policy "attempt answers are owned by the signed in user"
on public.attempt_answers
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "pause events are owned by the signed in user" on public.pause_events;
create policy "pause events are owned by the signed in user"
on public.pause_events
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "authenticated users can read active app updates" on public.app_updates;
create policy "authenticated users can read active app updates"
on public.app_updates
for select
to authenticated
using (active = true);

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.setup_drafts to authenticated;
grant select, insert, update, delete on public.attempts to authenticated;
grant select, insert, update, delete on public.attempt_answers to authenticated;
grant select, insert, update, delete on public.pause_events to authenticated;
grant select on public.app_updates to authenticated;

create index if not exists attempts_user_started_idx on public.attempts(user_id, started_at desc);
create index if not exists attempt_answers_user_attempt_idx on public.attempt_answers(user_id, attempt_id, position);
create index if not exists attempt_answers_user_flagged_idx on public.attempt_answers(user_id, flagged) where flagged = true;
create index if not exists pause_events_attempt_idx on public.pause_events(attempt_id);

-- Dashboard step after running this SQL:
-- Authentication > Hooks > Before User Created
-- Type: Postgres function
-- Function: public.hook_validate_invite_code
