// Friends' challenge security check.
// 1. Static contract (always): the SQL keeps RLS on, grants no direct writes, and keeps privileged code in private.
// 2. Live RLS check (only when test accounts are supplied): runs against the real Supabase project with three
//    signed-in test accounts and the public anon key. Nothing secret is stored in this file.
//
//   $env:CHALLENGE_TEST_A="a@example.com:password"; $env:CHALLENGE_TEST_B="b@example.com:password"; $env:CHALLENGE_TEST_C="c@example.com:password"
//   npm run check:challenges
//
// The live run leaves one small test challenge titled "RLS check" owned by account A. Remove it in the SQL editor with
//   delete from public.challenges where title = 'RLS check';
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const sql = await readFile("supabase/challenges.sql", "utf8");
const body = sql.split("-- Rollback")[0];

for (const table of ["challenges", "challenge_players", "challenge_answers"]) {
  assert.match(body, new RegExp(`alter table public\\.${table} enable row level security`, "i"), `${table}: RLS on`);
}
assert.match(body, /revoke all on public\.challenges, public\.challenge_players, public\.challenge_answers from public, anon, authenticated/i);
assert.match(body, /grant select on public\.challenges, public\.challenge_players, public\.challenge_answers to authenticated;/i);
assert.doesNotMatch(body, /grant\s+(insert|update|delete|all)[^;]*on\s+public\.challenge/i, "no direct writes are granted");
assert.doesNotMatch(body, /to\s+anon\b/i, "nothing is granted to anon");
assert.doesNotMatch(body, /create or replace function public\.[a-z_]+\([^)]*\)\s*returns[^;]*security definer/i, "no security definer function in public");
for (const fn of ["create_challenge", "join_challenge", "submit_challenge_answer", "finish_challenge", "end_challenge", "is_challenge_player", "challenge_revealed", "challenge_identity"]) {
  assert.match(body, new RegExp(`create or replace function private\\.${fn}\\(`, "i"), `private.${fn} exists`);
}
assert.match(body, /others' after the reveal/i, "answers policy gates other players on the reveal");
assert.match(body, /on conflict \(challenge_id, user_id, question_index\) do nothing/i, "answers are write-once");
assert.match(body, /finished_at is not null then\s+raise exception/i, "answers lock after finishing");
console.log("Challenge SQL contract: pass");

const accounts = ["A", "B", "C"].map((name) => process.env[`CHALLENGE_TEST_${name}`]);
if (accounts.some((value) => !value)) {
  console.log("Live RLS check: skipped (set CHALLENGE_TEST_A, _B and _C to email:password of three test accounts)");
  process.exit(0);
}

const config = await readFile("app/supabase-config.js", "utf8");
const url = config.match(/url:\s*"([^"]+)"/)?.[1]?.replace(/\/$/, "");
const key = config.match(/(?:publishableKey|anonKey):\s*"([^"]+)"/)?.[1];
assert.ok(url && key, "app/supabase-config.js has the project URL and publishable key");

async function signIn(pair) {
  const split = pair.indexOf(":");
  const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: key, "Content-Type": "application/json" },
    body: JSON.stringify({ email: pair.slice(0, split), password: pair.slice(split + 1) })
  });
  const data = await response.json();
  assert.ok(response.ok, `test account signs in (${response.status})`);
  return { token: data.access_token, id: data.user.id };
}

function client(session) {
  const headers = { apikey: key, "Content-Type": "application/json", Authorization: `Bearer ${session ? session.token : key}` };
  return {
    rpc: async (name, args) => {
      const response = await fetch(`${url}/rest/v1/rpc/${name}`, { method: "POST", headers, body: JSON.stringify(args) });
      return { ok: response.ok, status: response.status, data: await response.json().catch(() => null) };
    },
    select: async (table, query) => {
      const response = await fetch(`${url}/rest/v1/${table}?${query}`, { headers });
      return { ok: response.ok, status: response.status, data: await response.json().catch(() => null) };
    },
    write: async (method, table, query, payload) => {
      const response = await fetch(`${url}/rest/v1/${table}?${query}`, { method, headers: { ...headers, Prefer: "return=representation" }, body: JSON.stringify(payload) });
      const data = await response.json().catch(() => null);
      return { ok: response.ok && !(Array.isArray(data) && data.length === 0), status: response.status, data };
    }
  };
}

const results = [];
const check = (name, ok, detail = "") => results.push({ name, ok: Boolean(ok), detail });
const [A, B, C] = await Promise.all(accounts.map(signIn));
const host = client(A), friend = client(B), outsider = client(C), anon = client(null);

const anonCreate = await anon.rpc("create_challenge", { p_title: "RLS check", p_question_ids: ["a", "b", "c", "d", "e"], p_question_timers: [50, 50, 50, 50, 50], p_question_types: [], p_hours: 1 });
check("anon cannot create a challenge", !anonCreate.ok, String(anonCreate.status));

const created = await host.rpc("create_challenge", { p_title: "RLS check", p_question_ids: ["v01-q001", "v01-q002", "v01-q003", "v01-q004", "v01-q005"], p_question_timers: [50, 50, 50, 50, 50], p_question_types: ["test"], p_hours: 1 });
check("member can create a challenge", created.ok && created.data?.code, JSON.stringify(created.data));
const { id, code } = created.data || {};

check("wrong code is rejected", !(await outsider.rpc("join_challenge", { p_code: "ZZZZZ9" })).ok);
const joined = await friend.rpc("join_challenge", { p_code: code });
check("friend joins with the code", joined.ok && joined.data?.id === id, JSON.stringify(joined.data));

const anonRead = await anon.select("challenges", `id=eq.${id}`);
check("anon cannot read challenges", !anonRead.ok || (Array.isArray(anonRead.data) && anonRead.data.length === 0), String(anonRead.status));
check("outsider cannot read the challenge", (await outsider.select("challenges", `id=eq.${id}`)).data?.length === 0);
check("outsider cannot read the player list", (await outsider.select("challenge_players", `challenge_id=eq.${id}`)).data?.length === 0);
check("outsider cannot submit an answer", !(await outsider.rpc("submit_challenge_answer", { p_challenge: id, p_question_index: 0, p_choice: "A", p_answer_ms: 3000, p_correct: true })).ok);
check("player list shows both players", (await friend.select("challenge_players", `challenge_id=eq.${id}&select=user_id,display_name`)).data?.length === 2);

for (let index = 0; index < 5; index += 1) await host.rpc("submit_challenge_answer", { p_challenge: id, p_question_index: index, p_choice: "A", p_answer_ms: 5000, p_correct: true });
const friendAnswer = await friend.rpc("submit_challenge_answer", { p_challenge: id, p_question_index: 0, p_choice: "B", p_answer_ms: 25000, p_correct: true });
check("points come from the server (25 s of 50 s = 750)", friendAnswer.data?.points === 750, JSON.stringify(friendAnswer.data));

const peek = await friend.select("challenge_answers", `challenge_id=eq.${id}&select=user_id`);
check("before the reveal a player sees only their own answers", Array.isArray(peek.data) && peek.data.length === 1 && peek.data[0].user_id === B.id, JSON.stringify(peek.data));
check("outsider cannot read answers", (await outsider.select("challenge_answers", `challenge_id=eq.${id}`)).data?.length === 0);

const directInsert = await host.write("POST", "challenge_answers", "", { challenge_id: id, user_id: A.id, question_index: 1, choice: "A", answer_ms: 1, correct: true, points: 1000 });
check("direct table insert is refused", !directInsert.ok, String(directInsert.status));
const directUpdate = await host.write("PATCH", "challenge_answers", `challenge_id=eq.${id}&question_index=eq.0`, { points: 1000 });
check("direct table update is refused", !directUpdate.ok, String(directUpdate.status));
const resend = await host.rpc("submit_challenge_answer", { p_challenge: id, p_question_index: 0, p_choice: "B", p_answer_ms: 100, p_correct: true });
const kept = await host.select("challenge_answers", `challenge_id=eq.${id}&user_id=eq.${A.id}&question_index=eq.0&select=choice`);
check("resending an answer does not change it", kept.data?.[0]?.choice === "A", JSON.stringify(resend.data));

check("friend cannot end the host's challenge", !(await friend.rpc("end_challenge", { p_challenge: id })).ok);
await host.rpc("finish_challenge", { p_challenge: id });
check("answers are locked after finishing", !(await host.rpc("submit_challenge_answer", { p_challenge: id, p_question_index: 1, p_choice: "B", p_answer_ms: 100, p_correct: true })).ok);
check("still hidden while a player is unfinished", (await friend.select("challenge_answers", `challenge_id=eq.${id}&select=user_id`)).data?.length === 1);

const finished = await friend.rpc("finish_challenge", { p_challenge: id });
check("last player finishing reveals the results", finished.data?.revealed === true, JSON.stringify(finished.data));
check("after the reveal every player's answers are visible", (await friend.select("challenge_answers", `challenge_id=eq.${id}&select=user_id`)).data?.length === 6);
check("after the reveal an outsider still sees nothing", (await outsider.select("challenge_answers", `challenge_id=eq.${id}`)).data?.length === 0);
check("an ended challenge's code no longer joins", !(await outsider.rpc("join_challenge", { p_code: code })).ok);

for (const result of results) console.log(`${result.ok ? "ok  " : "FAIL"} ${result.name}${result.detail && !result.ok ? `  ${result.detail}` : ""}`);
const failed = results.filter((result) => !result.ok).length;
console.log(`Live RLS check: ${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
