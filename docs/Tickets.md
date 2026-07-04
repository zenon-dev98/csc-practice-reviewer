# Tickets

## Status Legend

- `open`: not started
- `in_progress`: active ticket
- `done`: completed and verified
- `blocked`: cannot continue without input or external setup

## T0000 - Documentation Pack

Status: done

Create the project documentation pack and workflow guardrails.

Acceptance criteria:

- `AGENTS.md` exists with project instructions.
- README explains current state and workflow.
- Full design, MVP technical design, manual verification, current state, prompt playbook, known issues, and ticket docs exist.
- Current state reflects that no app scaffold or git repo exists yet.
- Completion report recorded in `docs/Completion_Reports.md`.

## T0001 - Content Extraction And Coverage Audit

Status: done

Analyze all 29 images, digitize the visible exam content, classify every question by topic/subtopic, and identify gaps against official CSC Professional coverage.

Acceptance criteria:

- Every page has a page-level inventory.
- Every visible question is transcribed or marked `needs_review`.
- Questions are classified by topic/subtopic.
- Missing or underrepresented official topics are listed.
- Answer key pages are captured if present.
- The audit records image-quality risks and manual review needs.
- Image-backed source digitization is implemented in the app; generated typed versions now provide the full runnable practice bank.

## T0002 - Question Bank Schema

Status: done

Define the JSON/TypeScript schema for questions, choices, explanations, topic tags, source references, difficulty, expected time, and review status.

Acceptance criteria:

- Schema supports 170-item Professional exams.
- Schema supports source tracking back to image/page/item number.
- Schema supports imported questions and generated variants.
- Validation rules are documented.
- Schema documented in `docs/Question_Bank_Schema.md`.

## T0003 - Supabase Data Model

Status: done

Create the Supabase schema plan for profiles, attempts, answers, pauses, timing events, generated versions, and aggregate statistics.

Acceptance criteria:

- Tables, keys, indexes, and RLS intent are documented.
- Local recovery/fallback behavior is specified.
- Free-tier risk and backup approach are documented.
- SQL schema added in `supabase/schema.sql`; model notes added in `docs/Supabase_Data_Model.md`.

## T0004 - App Shell And Profile Entry

Status: done

Scaffold the static web app with the home screen, profile entry, returning profile picker, and saved progress display.

Acceptance criteria:

- App runs locally.
- Name/email can create a profile.
- Returning profiles can be selected.
- Saved attempts are visible.
- UI includes clear independent-reviewer disclaimer.
- Static app added in `app/`.

## T0005 - Exam Player

Status: done

Build the exam-taking interface: timer, answer selection, question navigation, skip/revisit, pause/resume, live save, and timeout submit.

Acceptance criteria:

- Timer starts on exam start.
- Answer changes persist.
- Pause/resume works without counting paused time.
- Skipped questions are visible and revisitable.
- Timeout submits automatically.
- Exam player implemented with image-backed source pages and digital A-D answer controls.

## T0006 - Results And Stats

Status: done

Build score reveal, result tier screens, per-topic stats, timing stats, and fun-fact comparisons.

Acceptance criteria:

- Score reveal ends at the actual score.
- Results show pass/fail using 80 percent threshold.
- Stats reflect persisted answer/timing data.
- Aggregate comparisons are hidden until enough attempts exist.
- Results, section stats, timing, skipped/unanswered counts, and comparison facts implemented.

## T0007 - Multi-Version Exam Generation

Status: done

Create the strategy and implementation for multiple mock versions while avoiding repeated questions for the same profile.

Acceptance criteria:

- App can generate/select a new exam version.
- Seen questions are tracked per profile.
- Generated/variant questions keep source and review metadata.
- Repetition rules are documented and tested.
- Twenty deterministic 170-item generated typed versions are implemented, with source-image fallback retained and seen-question tracking per profile.

## T0008 - Generated Bank QA And Documentation Sync

Status: done

Harden the generated bank, validation, schema docs, dependency checks, and rendered app smoke tests so the local build is internally consistent.

Acceptance criteria:

- Generated bank has 20 complete 170-item typed versions.
- Generated content avoids terminal-sensitive symbols and awkward template wording.
- Static validation checks source-image references and generated-bank structure.
- Supabase schema supports generated typed questions and source-image fallback.
- Browser smoke checks pass for home, exam, results, and mobile viewport.
- Project docs reflect the final local build state and remaining external setup tasks.

## T0009 - Master Redesign And CSC Content Audit

Status: done

Replace the draft-quality generated bank and redesign the exam experience around section grouping, stimulus questions, and a dense exam workflow.

Acceptance criteria:

- Generated bank remains 20 versions, 170 items each, with a documented CSC coverage matrix.
- Weak repeated templates are replaced with blueprint-driven coverage across General, Verbal, Numerical, and Analytical sections.
- Graph/table/logic stimulus groups exist and link to 3-5 questions with accessible labels.
- Generated questions include `cscSkill`, `qualityStatus`, and stimulus metadata where applicable.
- Left navigator is grouped by CSC section with answered/skipped/open counts.
- Question view is compact, removes confusing metadata, and supports stimulus panels above prompts.
- `DESIGN.md`, Stitch prompts, and generated-bank audit docs exist.
- Validation and browser smoke checks pass after the redesign.

## T0010 - Stitch-Guided Home Menu Redesign

Status: done

Replace the bare profile/start form with a Stitch-guided exam cockpit dashboard.

Acceptance criteria:

- Authenticated Stitch session is used to generate a dashboard/menu direction.
- Home screen is redesigned around profile rail, active exam resume/start, progress, section blueprint, mock versions, latest attempt, recent runs, local-save status, and disclaimer.
- Layout avoids giant empty space on desktop/laptop widths.
- Mobile layout stacks without clipped heading controls.
- Impeccable detector passes after implementation.

## T0011 - State-Image Redesign And Online Supabase Deployment

Status: done

Replace the current local static reviewer shell with the state-image UI system, Supabase email/password auth, online attempt storage, invite-code signup gate, post-exam performance insights, and GitHub Pages deployment.

Acceptance criteria:

- All supplied `states/` UI states are represented in the app flow with approved source-backed deviations.
- Supabase email/password auth is used with one profile per account.
- Signup includes a shared invite code validated by a Supabase Before User Created hook.
- Runtime persistence is online-only through Supabase for profiles, setup drafts, attempts, answer snapshots, timing, flags, skips, pauses, and results.
- Full mock exams support 20 versions, 170 items, A-D choices, 3h10m timer, grouped navigation, pause/save-exit, submit confirmation, and timeout submit.
- Practice by Category uses separate 120-question category pools, real difficulty filtering, 20-question default drills, and practice-labeled results.
- Results include post-exam performance insights: average time, fastest/slowest item, fastest/slowest section, strongest/weakest section, changed-answer stats, and retry recommendation.
- GitHub repository and GitHub Pages Actions deployment are configured.
- Validation, browser smoke tests, responsive checks, and Impeccable audit pass.

Completion notes:

- Supabase SQL, RLS policies, authenticated table grants, invite-code Before User Created hook, Auth redirect URLs, and email/password provider settings are applied.
- GitHub Pages is live at `https://zenon-dev98.github.io/csc-practice-reviewer/`.
- Live QA verified dashboard load, full exam start, grouped navigation, answer selection, submit modal, results insights, and Supabase attempt/answer persistence.
- Follow-up UI correction pass replaced the remaining recolor-like surfaces with closer state-image structures for auth, dashboard, exam, results, review, practice, and profile modal.
