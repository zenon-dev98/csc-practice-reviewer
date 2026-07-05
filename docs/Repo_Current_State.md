# Repo Current State

Last updated: 2026-07-05

## Workspace

Path:

- `H:\My Drive\mini_projects\csc_reviewer`

## Repository

- This folder is a git repository on `main`.
- `package.json` contains helper scripts only; it has no dependency declarations.
- The runnable app is a static browser app in `app/`.
- The runnable bank uses 20 generated typed Professional mock versions, 170 items each, generated from a CSC coverage matrix.
- The app has been redesigned around the supplied `states/` screenshots, with approved source-backed deviations for A-D choices, section ranges, and one-profile-per-account auth in normal production mode.
- Screenshot-parity, desktop-density, and desktop quality-repair passes have added fixture-state QA URLs, bounded dashboard/exam/sidebar/graph/modal contracts, expandable graph subgroups, and no-scroll desktop overflow checks across every supplied state.
- Runtime persistence is now implemented against Supabase email/password auth and online tables, with per-attempt question snapshots and timing analytics.
- The app is deployed through GitHub Pages Actions at `https://zenon-dev98.github.io/csc-practice-reviewer/`.
- The public GitHub repository is `https://github.com/zenon-dev98/csc-practice-reviewer`.
- The Supabase SQL/Auth Hook setup from `supabase/schema.sql` has been applied, including authenticated table grants and the `public.hook_validate_invite_code` Before User Created hook.
- Supabase Auth email/password is enabled with email confirmation disabled for this invite-gated small-group reviewer, avoiding free email quota failures during signup.
- Project dependencies must not be installed in this Google Drive folder.
- Optional local server dependencies are installed under `%LOCALAPPDATA%\csc-reviewer\node-deps`.
- Optional local QA dependencies are installed under `%LOCALAPPDATA%\csc-reviewer\qa-deps`, outside the Google Drive workspace.

## Existing Files

- `image_01.jpg` through `image_29.jpg`
- `desktop.ini`
- Documentation files created by T0000
- `docs/Completion_Reports.md`
- `docs/Generated_Bank_Audit.md`
- `docs/Stitch_Prompts.md`
- `DESIGN.md`
- `data/source_question_index.csv`
- `data/answer_key_set_h_v3_2026.json`
- `data/generated_bank_audit.json`
- `app/index.html`
- `app/app.js`
- `app/styles.css`
- `app/question-data.js`
- `app/generated-question-bank.js`
- `app/assets/create_profile_background.png`
- `app/images/image_01.jpg` through `app/images/image_29.jpg`
- `scripts/generate-question-bank.mjs`
- `scripts/check-dependencies.ps1`
- `scripts/setup-local-deps.ps1`
- `scripts/start.ps1`
- `scripts/validate-static-data.mjs`
- `supabase/schema.sql`

## Source Images

Observed page roles from initial inspection:

- `image_01.jpg`: cover page
- `image_02.jpg`: table of specifications / examinee notice
- `image_03.jpg` onward: exam question pages begin
- `image_24.jpg` and `image_25.jpg`: answer sheet pages
- `image_29.jpg`: disclaimer page

Detailed page inventory is tracked in `docs/Content_Audit.md`.

Current source item boundaries:

- General Information: 1-20
- Verbal Ability: 21-80
- Numerical Ability: 81-120
- Analytical Ability: 121-170

## Tooling Notes

- `python --version` returns Python 3.12.10.
- `tesseract` is not available on PATH.
- Content extraction used image inspection and source-page rendering.
- The app now prefers `app/generated-question-bank.js`, which contains 20 typed generated versions and 3,400 generated questions total.
- Generated questions include CSC skill metadata, quality status, and optional shared stimulus data.
- The original image-backed `app/question-data.js` remains available as source fallback and audit trail.
- Impeccable CLI detection has been run against `app/` and currently returns no findings.
- Browser fixture QA has been run for `create`, `select`, `dashboard`, `setup`, `exam`, `exam-collapsed`, `graph`, `pause`, `submit`, `results`, `review`, `practice`, `recent`, and `profile-modal` at `1904x913` and `1536x816`; document/body scrollbars and sampled container overflow are clean after T0014.
- Microsoft Edge-channel desktop QA exposed and repaired the T0013 forced-fit visual regression: dashboard cards now keep proportional row spacing, exam question groups use bounded internal sidebar scrolling, result/fun-fact cards fit without clipping, and the profile modal is compact without giant blank zones. Static assets are cache-busted through `v=20260705-3`.
- The public create-profile and continue-profile entry states now use the supplied pale blue wave background asset from `app/assets/create_profile_background.png`; static assets are cache-busted through `v=20260705-4`.
- Stitch was used in an authenticated browser session to generate the `Civil Service Exam Cockpit` dashboard direction. Stitch's `Code to Clipboard` export returned the original prompt rather than source code, so the app implementation was manually matched to the generated visual and agent summary.

## Current Active Ticket

- No active implementation ticket. T0015 is complete.

## Next Ticket

- Add a Supabase backup/export workflow before broader public use.
