# MVP Technical Design

## Stack

- Frontend: static HTML, CSS, and browser JavaScript in `app/`
- Runtime storage: Supabase Auth + Postgres tables with RLS
- Question bank: manually authored browser data in `app/question-bank/`, with source-image fallback in `app/question-data.js`
- Optional local server: `http-server` installed outside the project folder by `scripts/setup-local-deps.ps1`
- Backend: Supabase Free
- Database: Supabase Postgres using `supabase/schema.sql`
- Auth/profile v1: Supabase email/password with shared invite-code signup gate
- Hosting: GitHub Pages at `https://zenon-dev98.github.io/csc-practice-reviewer/`

## Initial App Views

- Home: profile entry, returning profile picker
- Exam: active exam player
- Results: score reveal and result summary
- Stats: profile-level progress and history

## Supabase Tables

Active tables:

- `profiles`
- `attempts`
- `pause_events`
- `attempt_answers`
- `setup_drafts`
- `app_updates`
- `invite_codes`

Derived or later tables:

- `profile_topic_stats`
- `aggregate_topic_stats`
- `question_performance_stats`

## Save Strategy

- Create an `attempt` when the user starts an exam.
- Save answer changes and question timing to Supabase through live dirty-row sync.
- Save pause/resume intervals separately.
- On reload or another device, resume from the persisted Supabase state.
- On timeout, force-submit the attempt and calculate score from persisted answers.

## Timer Rules

- Professional mock exam duration: 11,400 seconds.
- Timer starts when the user starts the attempt, not when they open the home page.
- Paused time does not count against elapsed exam time.
- User cannot answer questions while paused.
- If remaining time reaches zero, automatically submit and show the timeout result path.

## Question Navigation

- One primary question view.
- Next and previous buttons.
- Skip button marks current question as skipped without selecting an answer.
- Question navigator shows answered, unanswered, skipped, and current states.
- Navigator groups items by General, Verbal, Numerical, and Analytical ranges.
- User may change answers before submit.

## Stats Rules

Collect:

- total score
- percentage score
- pass/fail status using 80 percent threshold
- time per question
- time per topic/subtopic
- fastest and slowest answered questions
- skipped questions
- revised answers
- topic strengths and weaknesses
- comparison to aggregate users once at least 3 completed attempts exist

## Privacy Rules

- Treat profiles, emails, attempts, answers, timing, and scores as private.
- Configure Row Level Security before any public deployment.
- Do not expose raw aggregate data with personally identifiable information.

## Error Handling

- Current static app saves to Supabase through the signed-in account.
- If Supabase sync fails during an active exam, show a sync warning and retry on the next dirty sync.
- If restore fails, do not start a new attempt silently; show the recoverable state.

## Validation

- Question data must pass schema checks before import.
- Each question must have exactly four choices.
- Correct choice must be A, B, C, or D.
- Topic/subtopic must match the controlled taxonomy.
- Unknown or unclear transcriptions remain `needs_review`.
- Generated typed versions must pass the 20-version, 170-item, 3,400-question validation in `scripts/validate-static-data.mjs`.
- Stimulus groups must include accessible metadata and render above linked prompts.
