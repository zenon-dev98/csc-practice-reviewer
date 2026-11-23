-- Live security check for supabase/challenges.sql, run in the Supabase SQL editor (no passwords needed).
-- It acts as three existing members (host A, friend B, outsider C) and as a signed-out visitor by switching the
-- database role and the JWT claims, exactly as Supabase does for real API requests, so RLS and grants apply.
-- It only uses the three accounts' internal ids. The whole check is one transaction that ALWAYS rolls back:
-- it ends by raising its result, so no challenge, player or answer is left behind.
-- Expected output: an error message that starts with "RLS CHECK: 23/23 passed".

do $$
declare
  a uuid; b uuid; c uuid;
  cid uuid; ccode text; r jsonb; n integer; ch text;
  passed integer := 0; total integer := 0; failures text := '';
begin
  select id into a from auth.users order by created_at limit 1;
  select id into b from auth.users order by created_at offset 1 limit 1;
  select id into c from auth.users order by created_at offset 2 limit 1;
  if c is null then raise exception 'RLS CHECK: needs at least three accounts in the project.'; end if;

  -- 1 signed-out visitor cannot create a challenge
  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  total := total + 1;
  begin
    perform public.create_challenge('RLS check', array['x1','x2','x3','x4','x5'], array[50,50,50,50,50], array['test'], 1);
    failures := failures || ' | anon created a challenge';
  exception when others then passed := passed + 1;
  end;

  -- 2 host creates
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  total := total + 1;
  r := public.create_challenge('RLS check', array['v01-q001','v01-q002','v01-q003','v01-q004','v01-q005'], array[50,50,50,50,50], array['test'], 1);
  cid := (r->>'id')::uuid; ccode := r->>'code';
  if cid is not null and ccode ~ '^[A-HJ-NP-Z2-9]{6}$' then passed := passed + 1; else failures := failures || ' | create failed'; end if;

  -- 3 outsider: wrong code is rejected
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  total := total + 1;
  begin
    perform public.join_challenge('ZZZZZ9');
    failures := failures || ' | wrong code joined';
  exception when others then passed := passed + 1;
  end;

  -- 4 friend joins with the code
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  total := total + 1;
  r := public.join_challenge(ccode);
  if (r->>'id')::uuid = cid then passed := passed + 1; else failures := failures || ' | friend could not join'; end if;

  -- 5 signed-out visitor cannot read challenges
  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  total := total + 1;
  begin
    select count(*) into n from public.challenges where id = cid;
    if n = 0 then passed := passed + 1; else failures := failures || ' | anon read a challenge'; end if;
  exception when others then passed := passed + 1;
  end;

  -- 6-8 outsider cannot read the challenge or player list, or submit
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  total := total + 1;
  select count(*) into n from public.challenges where id = cid;
  if n = 0 then passed := passed + 1; else failures := failures || ' | outsider read the challenge'; end if;
  total := total + 1;
  select count(*) into n from public.challenge_players where challenge_id = cid;
  if n = 0 then passed := passed + 1; else failures := failures || ' | outsider read the player list'; end if;
  total := total + 1;
  begin
    perform public.submit_challenge_answer(cid, 0, 'A', 3000, true);
    failures := failures || ' | outsider submitted an answer';
  exception when others then passed := passed + 1;
  end;

  -- 9 friend sees both players
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  total := total + 1;
  select count(*) into n from public.challenge_players where challenge_id = cid;
  if n = 2 then passed := passed + 1; else failures := failures || ' | player list count ' || n; end if;

  -- 10 host answers all five
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  for i in 0..4 loop perform public.submit_challenge_answer(cid, i, 'A', 5000, true); end loop;
  total := total + 1;
  select count(*) into n from public.challenge_answers where challenge_id = cid and user_id = a;
  if n = 5 then passed := passed + 1; else failures := failures || ' | host saved ' || n || ' answers'; end if;

  -- 11 points come from the server: 25 s of a 50 s timer = 750
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  total := total + 1;
  r := public.submit_challenge_answer(cid, 0, 'B', 25000, true);
  if (r->>'points')::integer = 750 then passed := passed + 1; else failures := failures || ' | points ' || coalesce(r->>'points', 'null'); end if;

  -- 12 before the reveal the friend sees only their own answer
  total := total + 1;
  select count(*) into n from public.challenge_answers where challenge_id = cid;
  if n = 1 then passed := passed + 1; else failures := failures || ' | friend saw ' || n || ' answers before the reveal'; end if;

  -- 13 outsider cannot read answers
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  total := total + 1;
  select count(*) into n from public.challenge_answers where challenge_id = cid;
  if n = 0 then passed := passed + 1; else failures := failures || ' | outsider read answers'; end if;

  -- 14-15 host cannot write the tables directly
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  total := total + 1;
  begin
    insert into public.challenge_answers (challenge_id, user_id, question_index, choice, answer_ms, correct, points) values (cid, a, 9, 'A', 1, true, 1000);
    failures := failures || ' | direct insert allowed';
  exception when others then passed := passed + 1;
  end;
  total := total + 1;
  begin
    update public.challenge_answers set points = 1000 where challenge_id = cid and user_id = a and question_index = 0;
    get diagnostics n = row_count;
    if n = 0 then passed := passed + 1; else failures := failures || ' | direct update allowed'; end if;
  exception when others then passed := passed + 1;
  end;

  -- 16 resending an answer does not change it
  perform public.submit_challenge_answer(cid, 0, 'B', 100, true);
  total := total + 1;
  select choice into ch from public.challenge_answers where challenge_id = cid and user_id = a and question_index = 0;
  if ch = 'A' then passed := passed + 1; else failures := failures || ' | resend changed the answer'; end if;

  -- 17 friend cannot end the host's challenge
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  total := total + 1;
  begin
    perform public.end_challenge(cid);
    failures := failures || ' | friend ended the challenge';
  exception when others then passed := passed + 1;
  end;

  -- 18 host finishes; answers are then locked
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  perform public.finish_challenge(cid);
  total := total + 1;
  begin
    perform public.submit_challenge_answer(cid, 1, 'B', 100, true);
    failures := failures || ' | answer saved after finishing';
  exception when others then passed := passed + 1;
  end;

  -- 19 still hidden while the friend has not finished
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  total := total + 1;
  select count(*) into n from public.challenge_answers where challenge_id = cid;
  if n = 1 then passed := passed + 1; else failures := failures || ' | revealed early (' || n || ')'; end if;

  -- 20 the last player finishing reveals the results
  total := total + 1;
  r := public.finish_challenge(cid);
  if (r->>'revealed')::boolean then passed := passed + 1; else failures := failures || ' | not revealed after the last finish'; end if;

  -- 21 after the reveal every player's answers are visible
  total := total + 1;
  select count(*) into n from public.challenge_answers where challenge_id = cid;
  if n = 6 then passed := passed + 1; else failures := failures || ' | after reveal saw ' || n; end if;

  -- 22 an outsider still sees nothing after the reveal
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  total := total + 1;
  select count(*) into n from public.challenge_answers where challenge_id = cid;
  if n = 0 then passed := passed + 1; else failures := failures || ' | outsider read answers after the reveal'; end if;

  -- 23 an ended challenge's code no longer joins
  total := total + 1;
  begin
    perform public.join_challenge(ccode);
    failures := failures || ' | joined an ended challenge';
  exception when others then passed := passed + 1;
  end;

  -- Always roll back: the result is reported as the error message.
  raise exception 'RLS CHECK: %/% passed%', passed, total, case when failures = '' then '' else '. Failures:' || failures end;
end;
$$;
