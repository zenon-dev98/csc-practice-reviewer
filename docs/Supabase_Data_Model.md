# Supabase Data Model

Supabase is the hosted v1 backend for the deployed reviewer. The static app keeps question content in browser JavaScript and stores private user/account/progress data in Supabase.

## Schema

The SQL schema is in:

- `supabase/schema.sql`

It defines:

- `profiles`
- `setup_drafts`
- `attempts`
- `attempt_answers`
- `pause_events`
- `app_updates`
- `invite_codes`
- `hook_validate_invite_code(event jsonb)`

Question content is not imported into Supabase as a shared bank. Each attempt stores per-question snapshots in `attempt_answers`, including:

- `csc_skill`, `quality_status`, and optional `stimulus` JSON for generated audit and shared chart/table/logic questions
- prompt, choices, correct choice, selected choice, timing, flags, skips, visit count, and answer history

## Privacy

The schema enables Row Level Security on user/private tables and grants authenticated users only the table privileges needed for their own rows. Policies use `auth.uid() = user_id`. `app_updates` is read-only for authenticated users. Invite codes are not readable by app users.

## Free-Tier Notes

For fewer than 10 users, the important risks are not monthly active users. The practical concerns are:

- inactive project pausing
- database size if large media is stored
- lack of paid-plan automatic backups
- free-plan policy changes

The app should keep large images as static assets and store only text/state/statistics in Supabase.

## Current Runtime

The deployed app uses Supabase for:

- profiles
- attempts
- answers
- timing
- pause events
- setup drafts
- results and review data

The local static server is still supported for development, but it points at the same Supabase project when `app/supabase-config.js` is present.
