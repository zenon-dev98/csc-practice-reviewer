import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [app, sql, html] = await Promise.all([
  readFile("app/admin.js", "utf8"),
  readFile("supabase/admin_console.sql", "utf8"),
  readFile("app/admin.html", "utf8")
]);

assert.match(html, /admin\.js/);
assert.match(app, /storageKey:\s*"csc-reviewer-admin-auth"/);
assert.match(app, /\.from\("app_admins"\)/);
assert.doesNotMatch(app, /\.\s*(insert|update|upsert|delete)\s*\(/);
assert.doesNotMatch(app + html, /service[_-]?role/i);
assert.match(sql, /alter table public\.app_admins enable row level security/i);
assert.match(sql, /private\.is_app_admin\(\)/i);
assert.match(sql, /administrators can read all profiles/i);
assert.match(sql, /administrators can read all attempts/i);
assert.match(sql, /administrators can read all attempt answers/i);
assert.doesNotMatch(sql, /grant\s+(insert|update|delete).*app_admins/i);

console.log("Admin console security contract: pass");
