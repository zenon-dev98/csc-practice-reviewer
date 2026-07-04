# Repo Current State

Last updated: 2026-07-04

## Workspace

Path:

- `H:\My Drive\mini_projects\csc_reviewer`

## Repository

- This folder is not currently a git repository.
- `package.json` contains helper scripts only; it has no dependency declarations.
- The runnable app is a static browser app in `app/`.
- The runnable bank uses 20 generated typed Professional mock versions, 170 items each, generated from a CSC coverage matrix.
- The home/menu UI uses a Stitch-generated cockpit-dashboard direction: left profile rail, active exam resume/start panel, section blueprint, mock-version grid, latest attempt, recent runs, local-save status, and disclaimer.
- The exam UI uses a dark exam-console sidebar, grouped section navigation, compact question surfaces, chart/table stimulus panels, and logic-rule stimulus panels.
- Project dependencies must not be installed in this Google Drive folder.
- Optional local server dependencies are installed under `%LOCALAPPDATA%\csc-reviewer\node-deps`.

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
- Stitch was used in an authenticated browser session to generate the `Civil Service Exam Cockpit` dashboard direction. Stitch's `Code to Clipboard` export returned the original prompt rather than source code, so the app implementation was manually matched to the generated visual and agent summary.

## Current Active Ticket

- T0011 - State-Image Redesign And Online Supabase Deployment.

## Next Ticket

- None currently open after T0011. External setup is being folded into T0011 for the hosted build.
