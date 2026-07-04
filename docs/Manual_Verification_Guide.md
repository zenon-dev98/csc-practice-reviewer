# Manual Verification Guide

Use this after every ticket.

## Every Ticket

- Confirm the changed files match the active ticket.
- Confirm docs that should change were updated.
- Confirm there are no unrelated rewrites.
- Record commands run and results in the completion report.
- Update `docs/Repo_Current_State.md`.

## Content Tickets

- Compare transcribed text against source images.
- Mark uncertain text as `needs_review`.
- Verify each question has exactly four choices before app import.
- Verify topic and subtopic match the official taxonomy.
- Verify answer keys are captured from source pages when available.

## Database Tickets

- Verify schema can support pause/resume and abrupt browser close.
- Verify user-private data is covered by Row Level Security intent before deployment.
- Verify aggregate stats do not expose names or emails.
- Verify backup/export instructions exist for Supabase Free.

## Frontend Tickets

- Run `npm run validate:data`.
- Run `npm run check`.
- Open the app locally through `npm run start` or `app/index.html`.
- Test at desktop and mobile widths.
- Confirm text does not overlap or overflow.
- Confirm exam-like flow: start, answer, skip, revisit, pause, resume, submit.
- Confirm timeout path.
- Confirm results path.

## Release Readiness

- Confirm disclaimers are visible.
- Confirm no CSC affiliation is implied.
- Confirm source images are not exposed unnecessarily.
- Confirm free-tier storage is not used for large media without reason.
