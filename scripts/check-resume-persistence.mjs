import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(path.resolve("app/app.js"), "utf8");

function functionBody(name) {
  const start = source.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`Missing ${name}()`);
  const nextFunction = source.indexOf("\n  function ", start + 1);
  const nextAsyncFunction = source.indexOf("\n  async function ", start + 1);
  const nextCandidates = [nextFunction, nextAsyncFunction].filter((index) => index >= 0);
  const next = nextCandidates.length ? Math.min(...nextCandidates) : -1;
  return source.slice(start, next < 0 ? source.length : next);
}

const scheduleFlush = functionBody("scheduleFlush");
if (!scheduleFlush.includes("if (app.syncTimer) return")) {
  throw new Error("Autosave must be throttled instead of reset on every timer tick.");
}
if (scheduleFlush.includes("clearTimeout(app.syncTimer)")) {
  throw new Error("scheduleFlush() must not postpone an existing autosave checkpoint.");
}
if (!scheduleFlush.includes("app.syncTimer = null")) {
  throw new Error("The autosave timer must release its scheduled state before flushing.");
}

const touchAnswer = functionBody("touchAnswer");
if (!touchAnswer.includes("persistAttemptRecovery(attempt)")) {
  throw new Error("Answer changes must create a synchronous local recovery checkpoint.");
}

const loadUserData = functionBody("loadUserData");
if (!loadUserData.includes("filter(applyAttemptRecovery)")) {
  throw new Error("Startup must reconcile newer device recovery checkpoints.");
}

const flushDirty = functionBody("flushDirty");
if (!flushDirty.includes("elapsed_seconds: persistedSeconds(attempt.elapsed_seconds)")) {
  throw new Error("Attempt elapsed time must be converted to whole seconds before Supabase persistence.");
}

const dbAnswerPayload = functionBody("dbAnswerPayload");
if (!dbAnswerPayload.includes("time_spent_seconds: persistedSeconds(answer.time_spent_seconds)")) {
  throw new Error("Question time must be converted to whole seconds before Supabase persistence.");
}

const persistedSeconds = Function(`${functionBody("persistedSeconds")}; return persistedSeconds;`)();
for (const [input, expected] of [[1013.9209999997398, 1013], [0, 0], [-2.4, 0], ["7.9", 7]]) {
  if (persistedSeconds(input) !== expected) {
    throw new Error(`persistedSeconds(${input}) must return ${expected}.`);
  }
}

for (const eventName of ["beforeunload", "pagehide", "visibilitychange"]) {
  if (!source.includes(eventName)) throw new Error(`Missing ${eventName} recovery hook.`);
}

console.log("Resume persistence regression checks passed.");
