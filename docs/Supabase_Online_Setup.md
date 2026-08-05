# Supabase Online Setup

Project:

- URL: `https://nifkdqhlwrztigitttfh.supabase.co`
- Browser key type: publishable key
- Runtime mode: online-only, one profile per email/password account

## SQL

Run the full contents of `supabase/schema.sql` in the Supabase SQL Editor.

This creates:

- `profiles`
- `setup_drafts`
- `attempts`
- `attempt_answers`
- `pause_events`
- `app_updates`
- `invite_codes`
- `hook_validate_invite_code(event jsonb)`

The public app stores the static question bank in JavaScript and stores per-attempt question snapshots in `attempt_answers`.

Administrator attempt deletion controls:

- Run `supabase/admin_console.sql` first to create the administrator enrollment
  and read policies.
- Run `supabase/admin_attempt_reset.sql` only when upgrading an older deployment
  that used the retired reset-and-replace action, then run
  `supabase/admin_attempt_delete.sql`. The current administrator console can
  delete either active or completed attempts only through the typed-confirmation
  action; the complete attempt, answer, timing, and pause snapshots remain in
  `admin_attempt_deletions`, and no replacement attempt is created.
- Never grant the browser a service-role key or direct cross-user delete access.

## Auth

Dashboard settings:

- Authentication > Sign In / Providers > Email: enabled
- Minimum password length: `8`
- Required email confirmation: disabled for immediate access
- Password reset: enabled through Supabase email

Invite gate:

- Authentication > Hooks > Before User Created
- Type: Postgres function
- Function: `public.hook_validate_invite_code`

The shared invite code is not committed to the repo. The SQL stores only its SHA-256 hash.

## Redirect URLs

Add these during local development:

- `http://127.0.0.1:4173/`
- `http://localhost:4173/`

After GitHub Pages is live, add:

- `https://zenon-dev98.github.io/csc-practice-reviewer/`

## GitHub Actions Secrets

Repository secrets required by `.github/workflows/pages.yml`:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`

The workflow generates `app/supabase-config.js` during deployment.
