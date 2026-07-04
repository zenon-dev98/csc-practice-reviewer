# Supabase Data Model

Supabase is planned as the hosted v1 backend, but the current runnable app saves locally so it can work immediately without credentials.

## Schema

The SQL schema is in:

- `supabase/schema.sql`

It defines:

- `profiles`
- `questions`
- `question_choices`
- `exam_versions`
- `exam_version_questions`
- `attempts`
- `attempt_question_state`
- `pause_events`
- `profile_seen_questions`

Question content supports both source-image questions and generated typed questions through:

- `source_type`: `source_image` or `generated`
- `mode`: `image` or `typed`
- `exam_version_id` and `version_number` for generated versions
- nullable source-image fields for generated typed questions
- `csc_skill`, `quality_status`, and optional `stimulus` JSON for generated audit and shared chart/table/logic questions

## Privacy

The schema enables Row Level Security on user/private tables. Policies are intentionally not opened yet because a real Supabase Auth decision must be made before public hosting.

## Free-Tier Notes

For fewer than 10 users, the important risks are not monthly active users. The practical concerns are:

- inactive project pausing
- database size if large media is stored
- lack of paid-plan automatic backups
- free-plan policy changes

The app should keep large images as static assets and store only text/state/statistics in Supabase.

## Current Runtime

The static app uses browser `localStorage` for:

- profiles
- attempts
- answers
- timing
- pause events
- seen questions

This keeps the mini-project usable before Supabase credentials are available.
