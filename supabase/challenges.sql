-- Friends' challenge (asynchronous, Kahoot-style). Approved by the project owner on 2026-11-23.
-- Run after supabase/schema.sql and supabase/admin_console.sql (which creates the private schema).
-- Purely additive: no existing table, policy or function is changed. Rollback is at the bottom of this file.
--
-- Rules enforced here, not in the browser:
-- * Signed-in members only; anon has no access to any challenge table or function.
-- * Challenges cannot be listed or searched. A player joins with the 6-character code through join_challenge().
-- * Players may only read: the challenge they are in, its player list (a copied display name and badge colour,
--   never profiles or emails), their own answers at any time, and other players' answers only after the reveal.
-- * The reveal happens when every player has finished, the deadline passes, or the host ends the challenge.
-- * Nobody writes the tables directly. Answers are saved through submit_challenge_answer(), once per question,
--   only while the challenge is open and before the player finishes; finish_challenge() locks them for good.
-- * Points are computed here from the answer time and the question's timer. Whether an answer was correct is
--   reported by the app, because the answer keys live in the static question bank (accepted between friends).

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-HJ-NP-Z2-9]{6}$'),
  host_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 60),
  question_ids text[] not null check (cardinality(question_ids) in (5, 10, 15)),
  question_timers integer[] not null,
  question_types text[] not null default '{}',
  choice_seed integer not null,
  created_at timestamptz not null default now(),
  deadline timestamptz not null,
  ended_at timestamptz,
  constraint challenges_timers_match check (cardinality(question_timers) = cardinality(question_ids)),
  constraint challenges_deadline_window check (deadline > created_at and deadline <= created_at + interval '72 hours')
);

create table if not exists public.challenge_players (
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 24),
  badge integer not null default 0 check (badge between 0 and 20),
  joined_at timestamptz not null default now(),
  finished_at timestamptz,
  primary key (challenge_id, user_id)
);

create table if not exists public.challenge_answers (
  challenge_id uuid not null,
  user_id uuid not null,
  question_index integer not null check (question_index between 0 and 14),
  choice text check (choice is null or choice in ('A', 'B', 'C', 'D', 'E')),
  answer_ms integer not null check (answer_ms between 0 and 600000),
  correct boolean not null,
  points integer not null check (points between 0 and 1000),
  answered_at timestamptz not null default now(),
  primary key (challenge_id, user_id, question_index),
  foreign key (challenge_id, user_id) references public.challenge_players(challenge_id, user_id) on delete cascade
);

create index if not exists challenge_players_user_idx on public.challenge_players(user_id);

alter table public.challenges enable row level security;
alter table public.challenge_players enable row level security;
alter table public.challenge_answers enable row level security;

-- Read-only to signed-in users (rows further limited by the policies below); every write goes through a function.
revoke all on public.challenges, public.challenge_players, public.challenge_answers from public, anon, authenticated;
grant select on public.challenges, public.challenge_players, public.challenge_answers to authenticated;

-- Helpers run as definer so policies can ask "is this user in that challenge?" without recursing through RLS.
create or replace function private.is_challenge_player(p_challenge uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.challenge_players
    where challenge_id = p_challenge and user_id = auth.uid()
  );
$$;

create or replace function private.challenge_revealed(p_challenge uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.challenges c
    where c.id = p_challenge
      and (c.ended_at is not null or c.deadline <= now())
  );
$$;

revoke all on function private.is_challenge_player(uuid) from public, anon;
revoke all on function private.challenge_revealed(uuid) from public, anon;
grant execute on function private.is_challenge_player(uuid) to authenticated;
grant execute on function private.challenge_revealed(uuid) to authenticated;

drop policy if exists "players can read their challenges" on public.challenges;
create policy "players can read their challenges"
on public.challenges
for select
to authenticated
using ((select private.is_challenge_player(id)));

drop policy if exists "players can read their challenge's player list" on public.challenge_players;
create policy "players can read their challenge's player list"
on public.challenge_players
for select
to authenticated
using ((select private.is_challenge_player(challenge_id)));

drop policy if exists "players read own answers, and others' after the reveal" on public.challenge_answers;
create policy "players read own answers, and others' after the reveal"
on public.challenge_answers
for select
to authenticated
using (
  user_id = auth.uid()
  or ((select private.is_challenge_player(challenge_id)) and (select private.challenge_revealed(challenge_id)))
);

-- The caller's display name and badge, copied into the challenge so other players never read profiles.
-- The nickname lives in the sign-in account's user_metadata (saved by the app), which the session token carries.
create or replace function private.challenge_identity()
returns table (display_name text, badge integer)
language sql
stable
security definer
set search_path = ''
as $$
  select
    left(coalesce(nullif(btrim(auth.jwt() -> 'user_metadata' ->> 'nickname'), ''), nullif(btrim(split_part(p.name, ' ', 1)), ''), 'Player'), 24),
    least(20, greatest(0, coalesce(p.avatar_preset, 0)))
  from public.profiles p
  where p.user_id = auth.uid()
  union all
  select left(coalesce(nullif(btrim(auth.jwt() -> 'user_metadata' ->> 'nickname'), ''), 'Player'), 24), 0
  where not exists (select 1 from public.profiles where user_id = auth.uid())
  limit 1;
$$;

create or replace function private.create_challenge(
  p_title text,
  p_question_ids text[],
  p_question_timers integer[],
  p_question_types text[],
  p_hours integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_id uuid;
  new_code text;
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  tries integer := 0;
  who record;
begin
  if auth.uid() is null then
    raise exception 'Sign in to create a challenge.' using errcode = '42501';
  end if;
  if cardinality(p_question_ids) not in (5, 10, 15) then
    raise exception 'A challenge has 5, 10 or 15 questions.' using errcode = '22023';
  end if;
  if cardinality(p_question_timers) <> cardinality(p_question_ids)
     or exists (select 1 from unnest(p_question_timers) t where t < 10 or t > 180) then
    raise exception 'Each question needs a timer between 10 and 180 seconds.' using errcode = '22023';
  end if;
  if (select count(distinct q) from unnest(p_question_ids) q) <> cardinality(p_question_ids) then
    raise exception 'Questions in a challenge must be different.' using errcode = '22023';
  end if;
  if p_hours is null or p_hours < 1 or p_hours > 72 then
    raise exception 'The deadline must be 1 to 72 hours away.' using errcode = '22023';
  end if;

  loop
    new_code := '';
    for i in 1..6 loop
      new_code := new_code || substr(alphabet, 1 + floor(random() * length(alphabet))::integer, 1);
    end loop;
    exit when not exists (select 1 from public.challenges where code = new_code);
    tries := tries + 1;
    if tries > 20 then
      raise exception 'Could not make a challenge code. Try again.' using errcode = '55000';
    end if;
  end loop;

  insert into public.challenges (code, host_id, title, question_ids, question_timers, question_types, choice_seed, deadline)
  values (new_code, auth.uid(), left(btrim(coalesce(nullif(p_title, ''), 'Speed round')), 60), p_question_ids, p_question_timers,
          coalesce(p_question_types, '{}'), floor(random() * 2147483647)::integer, now() + make_interval(hours => p_hours))
  returning id into new_id;

  select * into who from private.challenge_identity();
  insert into public.challenge_players (challenge_id, user_id, display_name, badge)
  values (new_id, auth.uid(), who.display_name, who.badge);

  return jsonb_build_object('id', new_id, 'code', new_code);
end;
$$;

create or replace function private.join_challenge(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  target public.challenges%rowtype;
  who record;
begin
  if auth.uid() is null then
    raise exception 'Sign in to join a challenge.' using errcode = '42501';
  end if;

  select * into target from public.challenges
  where code = upper(btrim(coalesce(p_code, '')))
  for update;

  if not found or target.ended_at is not null or target.deadline <= now() then
    raise exception 'That code is wrong or the challenge has ended.' using errcode = 'P0002';
  end if;

  if exists (select 1 from public.challenge_players where challenge_id = target.id and user_id = auth.uid()) then
    return jsonb_build_object('id', target.id, 'already_joined', true);
  end if;

  if (select count(*) from public.challenge_players where challenge_id = target.id) >= 20 then
    raise exception 'This challenge is full (20 players).' using errcode = '55000';
  end if;

  select * into who from private.challenge_identity();
  insert into public.challenge_players (challenge_id, user_id, display_name, badge)
  values (target.id, auth.uid(), who.display_name, who.badge);

  return jsonb_build_object('id', target.id, 'already_joined', false);
end;
$$;

create or replace function private.submit_challenge_answer(
  p_challenge uuid,
  p_question_index integer,
  p_choice text,
  p_answer_ms integer,
  p_correct boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  target public.challenges%rowtype;
  player public.challenge_players%rowtype;
  timer_ms integer;
  earned integer;
begin
  select * into target from public.challenges where id = p_challenge;
  select * into player from public.challenge_players where challenge_id = p_challenge and user_id = auth.uid();

  if target.id is null or player.user_id is null then
    raise exception 'You are not in this challenge.' using errcode = '42501';
  end if;
  if player.finished_at is not null then
    raise exception 'You already finished this challenge.' using errcode = '55000';
  end if;
  if target.ended_at is not null or target.deadline <= now() then
    raise exception 'This challenge has ended.' using errcode = '55000';
  end if;
  if p_question_index is null or p_question_index < 0 or p_question_index >= cardinality(target.question_ids) then
    raise exception 'That question is not in this challenge.' using errcode = '22023';
  end if;

  timer_ms := target.question_timers[p_question_index + 1] * 1000;
  -- Correct: 1000 for an instant answer down to 500 at the last second. Wrong, blank or late: 0.
  earned := case
    when coalesce(p_correct, false) and p_choice is not null and p_answer_ms <= timer_ms
      then greatest(500, least(1000, round(1000 * (1 - (greatest(p_answer_ms, 0)::numeric / timer_ms) / 2))::integer))
    else 0
  end;

  -- First write wins: resending the same question (a retry after a dropped connection) changes nothing.
  insert into public.challenge_answers (challenge_id, user_id, question_index, choice, answer_ms, correct, points)
  values (p_challenge, auth.uid(), p_question_index, p_choice, least(greatest(coalesce(p_answer_ms, 0), 0), 600000), coalesce(p_correct, false) and earned > 0, earned)
  on conflict (challenge_id, user_id, question_index) do nothing;

  return jsonb_build_object('question_index', p_question_index, 'points', earned);
end;
$$;

create or replace function private.finish_challenge(p_challenge uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  still_playing integer;
begin
  update public.challenge_players
     set finished_at = coalesce(finished_at, now())
   where challenge_id = p_challenge and user_id = auth.uid();
  if not found then
    raise exception 'You are not in this challenge.' using errcode = '42501';
  end if;

  select count(*) into still_playing
  from public.challenge_players
  where challenge_id = p_challenge and finished_at is null;

  if still_playing = 0 then
    update public.challenges set ended_at = coalesce(ended_at, now()) where id = p_challenge;
  end if;

  return jsonb_build_object('revealed', still_playing = 0, 'still_playing', still_playing);
end;
$$;

create or replace function private.end_challenge(p_challenge uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.challenges
     set ended_at = coalesce(ended_at, now())
   where id = p_challenge and host_id = auth.uid();
  if not found then
    raise exception 'Only the host can end this challenge.' using errcode = '42501';
  end if;
  return jsonb_build_object('revealed', true);
end;
$$;

revoke all on function private.challenge_identity() from public, anon;
revoke all on function private.create_challenge(text, text[], integer[], text[], integer) from public, anon;
revoke all on function private.join_challenge(text) from public, anon;
revoke all on function private.submit_challenge_answer(uuid, integer, text, integer, boolean) from public, anon;
revoke all on function private.finish_challenge(uuid) from public, anon;
revoke all on function private.end_challenge(uuid) from public, anon;
grant execute on function private.challenge_identity() to authenticated;
grant execute on function private.create_challenge(text, text[], integer[], text[], integer) to authenticated;
grant execute on function private.join_challenge(text) to authenticated;
grant execute on function private.submit_challenge_answer(uuid, integer, text, integer, boolean) to authenticated;
grant execute on function private.finish_challenge(uuid) to authenticated;
grant execute on function private.end_challenge(uuid) to authenticated;

-- Public wrappers the app calls with supabase.rpc(...). They run as the caller and only forward to private.
create or replace function public.create_challenge(p_title text, p_question_ids text[], p_question_timers integer[], p_question_types text[], p_hours integer)
returns jsonb language sql security invoker set search_path = public
as $$ select private.create_challenge($1, $2, $3, $4, $5); $$;

create or replace function public.join_challenge(p_code text)
returns jsonb language sql security invoker set search_path = public
as $$ select private.join_challenge($1); $$;

create or replace function public.submit_challenge_answer(p_challenge uuid, p_question_index integer, p_choice text, p_answer_ms integer, p_correct boolean)
returns jsonb language sql security invoker set search_path = public
as $$ select private.submit_challenge_answer($1, $2, $3, $4, $5); $$;

create or replace function public.finish_challenge(p_challenge uuid)
returns jsonb language sql security invoker set search_path = public
as $$ select private.finish_challenge($1); $$;

create or replace function public.end_challenge(p_challenge uuid)
returns jsonb language sql security invoker set search_path = public
as $$ select private.end_challenge($1); $$;

revoke all on function public.create_challenge(text, text[], integer[], text[], integer) from public, anon;
revoke all on function public.join_challenge(text) from public, anon;
revoke all on function public.submit_challenge_answer(uuid, integer, text, integer, boolean) from public, anon;
revoke all on function public.finish_challenge(uuid) from public, anon;
revoke all on function public.end_challenge(uuid) from public, anon;
grant execute on function public.create_challenge(text, text[], integer[], text[], integer) to authenticated;
grant execute on function public.join_challenge(text) to authenticated;
grant execute on function public.submit_challenge_answer(uuid, integer, text, integer, boolean) to authenticated;
grant execute on function public.finish_challenge(uuid) to authenticated;
grant execute on function public.end_challenge(uuid) to authenticated;

-- ---------------------------------------------------------------------------------------------------------------
-- Rollback (removes the feature and every challenge, player and answer it stored; nothing else is touched):
--
-- drop function if exists public.end_challenge(uuid);
-- drop function if exists public.finish_challenge(uuid);
-- drop function if exists public.submit_challenge_answer(uuid, integer, text, integer, boolean);
-- drop function if exists public.join_challenge(text);
-- drop function if exists public.create_challenge(text, text[], integer[], text[], integer);
-- drop function if exists private.end_challenge(uuid);
-- drop function if exists private.finish_challenge(uuid);
-- drop function if exists private.submit_challenge_answer(uuid, integer, text, integer, boolean);
-- drop function if exists private.join_challenge(text);
-- drop function if exists private.create_challenge(text, text[], integer[], text[], integer);
-- drop function if exists private.challenge_identity();
-- drop table if exists public.challenge_answers;
-- drop table if exists public.challenge_players;
-- drop table if exists public.challenges;
-- drop function if exists private.challenge_revealed(uuid);
-- drop function if exists private.is_challenge_player(uuid);
