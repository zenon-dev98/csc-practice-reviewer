# Repo Current State

Last updated: 2026-07-11

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
- Ponytail has been installed into `C:\Users\Acer\.codex\skills\ponytail`; restart Codex to load it as a named skill in future sessions. The project `AGENTS.md` now includes a Ponytail guardrail for this repo immediately.

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
- `app/cockpit-theme.css`
- `app/question-data.js`
- `app/generated-question-bank.js`
- `app/assets/brand-shield.svg`
- `app/assets/fonts/barlow-condensed-*.woff2` / `.ttf`
- `app/assets/fonts/rajdhani-*-latin.ttf`
- `app/assets/icons/*.svg`
- `app/assets/create_profile_background.png`
- `app/images/image_01.jpg` through `app/images/image_29.jpg`
- `scripts/generate-question-bank.mjs`
- `scripts/check-dependencies.ps1`
- `scripts/setup-local-deps.ps1`
- `scripts/start.ps1`
- `scripts/validate-static-data.mjs`
- `scripts/qa-cockpit.cjs`
- `scripts/qa-interactions.cjs`
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
- The public auth entry states now use account language and the `states/v2/sign_in.png` direction: create account includes two-column password/confirm-password fields with eye toggles and validation, sign-in uses the v2 icon-label left rail and `New here? Create account` switch, and static assets are cache-busted through `v=20260705-9`.
- The project screenshot-parity rules now explicitly require optical checks for icon glyph quality, icon size, icon positioning, proportional full-page spacing, font family/style, font hierarchy sizes, line heights, font colors, and contrast roles before UI work can be called complete.
- Signed-in account-era flows have been reworked: the signed-in header now uses only the brand and upper-right account control, Account Settings replaces Manage Profile, Switch/Edit Profile and preset profile photos are retired, Practice and Review Mistakes now open purposeful setup/review hubs, Recent Attempts can display more than two attempts, and exam Next/Skip behavior is explicit.
- Maximized Microsoft Edge QA for T0022 ran at `1528x732` with no document/body scrollbars or console errors on the checked signed-in states. QA screenshots are saved under `qa/t0022-edge-final`, `qa/t0022-edge-r7`, and `qa/t0022-edge-r8`.
- Static assets are cache-busted through `v=20260706-1`.
- Stitch was used in an authenticated browser session to generate the `Civil Service Exam Cockpit` dashboard direction. Stitch's `Code to Clipboard` export returned the original prompt rather than source code, so the app implementation was manually matched to the generated visual and agent summary.
- T0023 replaced the signed-in Home screen with a measured dark training cockpit: active-run ring, section checkpoints, personal records, command panels, and section performance are connected to real attempt data rather than decorative KPI fixtures.
- The cockpit typography and required icon subset are self-hosted, with no runtime font/icon CDN or frontend framework. Static assets are cache-busted through `v=20260710-15`.
- Final Edge-channel QA passed at `1904x913` and `1536x816` with no document overflow or console errors. Route, account-modal, answer/clear/next/previous/skip/flag, pause/resume, submit, graph-modal, practice-tab, review-filter, and review-navigation interactions were exercised.
- Final T0023 evidence is stored under `qa/t0023-parity-final-r2`, `qa/t0023-parity-interactions`, `qa/t0023-parity-state-final`, and `qa/t0023-control-sequence`.
- T0024 now uses one `cockpit-theme.css` layer for all public, signed-in, exam, result, review, dialog, and mobile states. The retired `study-hub.css` and `final-overrides.css` files are no longer loaded.
- Desktop viewports at or above `1100px` render a centered uniform `1672x942` logical frame; `1904x913` and `1536x816` preserve the reference ratio with balanced ambient margins and no document scrolling.
- Mobile uses normal stacked document flow, a compact account header, bottom navigation, a slide-over question navigator, and internally coherent setup/practice/progress/review/account layouts.
- Password reset, delete-account, and delete-attempt flows are in-app dialogs; no native `prompt()` or `confirm()` calls remain.
- Final T0024 Edge evidence is stored under `qa/t0024-cockpit-final-desktop`, `qa/t0024-cockpit-final-mobile`, `qa/t0024-cockpit-mobile-full-r2`, `qa/t0024-cockpit-modals-final`, and `qa/t0024-cockpit-interactions-final`.
- The final fixture sweep covered 36 states at three desktop sizes (`108` screenshots) and two mobile sizes (`72` screenshots), with zero console/document failures and zero sampled element overflows. The interaction harness passed `15/15` checks across `59` screenshots.
- Static assets are cache-busted through `v=20260711-01`.

## Current Active Ticket

- None. T0024 is complete pending only external follow-up work.

## Next Ticket

- Supabase backup/export workflow before broader public use, or a content pedagogy review pass for the generated bank after T0024.
