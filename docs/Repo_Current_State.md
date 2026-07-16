# Repo Current State

Last updated: 2026-07-16

## Workspace

Path:

- `H:\My Drive\mini_projects\csc_reviewer`

## Repository

- This folder is a git repository on `main`.
- `package.json` contains helper scripts only; it has no dependency declarations.
- The runnable app is a static browser app in `app/`.
- The runnable bank uses 20 manually authored Professional mock versions with 170 items each and a strict CSC coverage blueprint.
- The app has been redesigned around the supplied `states/` screenshots, with approved source-backed deviations for A-D choices, section ranges, and one-profile-per-account auth in normal production mode.
- Screenshot-parity, desktop-density, and desktop quality-repair passes have added fixture-state QA URLs, bounded dashboard/exam/sidebar/graph/modal contracts, expandable graph subgroups, and no-scroll desktop overflow checks across every supplied state.
- Runtime persistence is now implemented against Supabase email/password auth and online tables, with per-attempt question snapshots and timing analytics.
- The app is deployed through GitHub Pages Actions at `https://zenon-dev98.github.io/csc-practice-reviewer/`.
- The pending T0038 release uses cache key `20260716-05`; it replaces the oversized Mock Exam Setup summary cards with a compact exam-format rail and adds containment/wrapping QA for that component.
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
- `app/v5-production.css`
- `app/question-data.js`
- `app/question-bank/manifest.js`
- `app/question-bank/version-01.js` through `version-20.js`
- `app/assets/brand-shield.svg`
- `app/assets/fonts/barlow-condensed-*.woff2` / `.ttf`
- `app/assets/fonts/rajdhani-*-latin.ttf`
- `app/assets/icons/*.svg`
- `app/assets/create_profile_background.png`
- `app/images/image_01.jpg` through `app/images/image_29.jpg`
- `scripts/audit-question-bank.mjs`
- `docs/Question_Bank_Authoring_Standard.md`
- `data/question_bank_quality_audit.json`
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
- The app loads `app/question-bank/manifest.js` plus 20 hand-authored version files containing 3,400 questions total.
- The authored questions include CSC skill metadata, provenance, review and quality status, explanations, and optional shared stimulus data.
- Strict static and quality audits enforce exact coverage and difficulty, four data groups per version, answer balance, accessible stimuli, and zero exact, normalized-template, or shuffled-choice duplicates.
- The original image-backed `app/question-data.js` remains available as source fallback and audit trail.
- Impeccable CLI detection has been run against `app/` and currently returns no findings.
- Browser fixture QA has been run for `create`, `select`, `dashboard`, `setup`, `exam`, `exam-collapsed`, `graph`, `pause`, `submit`, `results`, `review`, `practice`, `recent`, and `profile-modal` at `1904x913` and `1536x816`; document/body scrollbars and sampled container overflow are clean after T0014.
- Microsoft Edge-channel desktop QA exposed and repaired the T0013 forced-fit visual regression: dashboard cards now keep proportional row spacing, exam question groups use bounded internal sidebar scrolling, result/fun-fact cards fit without clipping, and the profile modal is compact without giant blank zones. Static assets are cache-busted through `v=20260705-3`.
- The public auth entry states now use account language and the `states/v2/sign_in.png` direction: create account includes two-column password/confirm-password fields with eye toggles and validation, sign-in uses the v2 icon-label left rail and `New here? Create account` switch, and static assets are cache-busted through `v=20260705-9`.
- The project screenshot-parity rules now explicitly require optical checks for icon glyph quality, icon size, icon positioning, proportional full-page spacing, font family/style, font hierarchy sizes, line heights, font colors, and contrast roles before UI work can be called complete.
- T0029 adds the v4 visual contract, v5 state manifest, content-proportional final overrides, per-question telemetry, nickname-first account personalization, 20 animal avatars, a dedicated password dialog, persistent exam navigator scrolling, explicit audio controls inside Account Settings, and the release-gate QA artifacts under `qa/t0029-*`.
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
- T0032 replaces the repository operating instructions with the hardened account, exam, persistence, security, accessibility, spacing, visual-QA, and deployment contract. It adds dedicated Manual Edge State and Interaction and Visual Parity Quality agents.
- T0032 uses pointer-versus-keyboard input modality so mouse clicks do not add a distracting auth/account field ring while keyboard focus remains visible. It also repairs the Study Hub title fill, Mock Exam Setup label/value and section scale, Practice & Review heading clearance, and mobile Practice & Review scroll ownership.
- Decorative animation and transition rules are disabled pending a purposeful motion specification. The interaction harness verifies that no animation remains active under normal-motion browser settings.
- T0032 release evidence includes 42/42 interaction checks across 72 screenshots and a 222-screenshot fixture matrix across logical desktop, `1904x913`, `1536x816`, `1536x736`, `390x844`, and `412x915`, with zero console/document failures, sampled overflows, geometry defects, or active animations.
- T0032 replaces the superseded additive V5 patch with `app/v5-production.css`, the final production visual authority for all 37 canonical states and their desktop/mobile variants.
- T0032 local release evidence includes 185 desktop screenshots, 74 mobile screenshots, 72 automated interaction screenshots with 42/42 checks passing, and 52 maximized external-Edge screenshots. The item 80 to item 21 path, More/Less, answer-gated Next, pause/resume, submit, and Account Settings entry all pass.
- Static assets are cache-busted through `app.js?v=20260714-04`, `cockpit-theme.css?v=20260714-02`, and `v5-production.css?v=20260714-04`.

## Current Active Ticket

- No implementation ticket is active. The next content gate is a qualified independent second review of the authored bank.

## T0035 Outcome

- Replaced the grouped-chart renderer's mismatched CSS axes and independently positioned bars with one responsive SVG coordinate system.
- Bar bottoms now share the exact zero baseline used by the axis and grid; the vertical range uses a rounded data-derived maximum instead of a fixed 0-120 scale.
- Desktop charts resize inside their panel without overflow, while phone layouts preserve physical label size in a bounded horizontal chart viewport.
- The fixture harness now rejects detached bars, bars outside the plot, zero-gridline mismatch, and desktop chart overflow.
- Local and live Edge chart matrices passed all `14` graph/modal captures across `1672x942`, `1904x913`, `1536x816`, `1536x736`, `1366x768`, `390x844`, and `412x915`.
- GitHub Pages serves the repair from commit `3aed02f` with asset version `20260716-03`.

## T0034 Outcome

- Fixed the authored-bank navigator dropping ordinary items whenever the same section also contained shared reading or data stimuli.
- The navigator now renders individual-item ranges and shared sets in one ordered sequence with every question represented exactly once.
- Verbal Ability exposes all 60 items from 21 through 80, including the previously missing 51-72 range, and shared passages are labeled as Reading Sets.
- Local and live Microsoft Edge interaction suites pass `41/41` checks, including direct navigation to items 21, 51, and 80 without refresh.
- GitHub Pages serves the fix from commit `83c0d19` with `app.js?v=20260716-02`.

## T0033 Outcome

- Replaced the generated production artifact and generator with 20 manually authored question-bank source files containing 170 stable items each.
- Preserved the documented CSC Professional scope and per-version difficulty blueprint while eliminating detected exact, normalized-template, and shuffled-choice duplicates.
- Added a strict authored-bank audit to `npm run check` and stored its machine-readable report at `data/question_bank_quality_audit.json`.
- Improved chart/table readability with per-metric visualization and exact values instead of aggregating unlike columns into an ambiguous total.
- Local and live Microsoft Edge runtime checks loaded all 3,400 questions and every cache-busted bank asset without console errors or overflow in the checked setup/graph states.
- GitHub Pages serves the authored bank from release commit `0ed9ddb` with asset version `20260716-01`.
- All items remain `needs_review`; qualified independent second review is still required before broader use.

## T0032 Outcome

- Promoted the approved V5 cockpit language from an incomplete override into a complete production state layer rather than another recolor or small spacing patch.
- Repaired the full desktop/mobile page matrix, all system/auth states, signed-in navigation, Setup, exam/navigator/chart/dialog states, Practice & Review, Progress, Results, Answer Review, and Account Settings.
- Final local automated QA is clean across five desktop and two mobile viewports; interaction QA passes 42/42 checks, including the permanent item 80 to item 21 regression.
- Maximized external Edge at 100% zoom captured every canonical state and the critical interaction paths under `qa/t0033-v5-production-edge-manual/`.

## T0031 Outcome

- Reproduced the item 80 to item 21 navigation failure in maximized external Edge: expanded sections rendered only a moving 20-item slice, so item 21 was absent from the DOM at item 80.
- Expanded sections now render their complete question range while the existing bounded sidebar owns scrolling, eliminating the nested-scroll trap.
- Added an automated 80-to-21 regression to the permanent interaction harness.
- Local and live Edge interaction suites passed 33/33 checks; the exam state passed all six target viewports, and targeted mobile navigation passed at `390x844`.
- The cache-busted fix is live from commit `25f3575` and was manually verified in maximized external Edge at 100% zoom.

## T0030 Outcome

- Reopened the original pasted request and completed every restored product, interaction, analytics, and visual requirement rather than relying on the incomplete T0029 summary.
- Added `app/v5-parity.css` as the measured V5 state layer under the invariant V4 shell, without introducing a framework or dependency inside Google Drive.
- Distinguished live Exam Sections completion from historical Section Accuracy and inventoried answer, timing, navigation, pause, visibility, flag, skip, and answer-change analytics in `docs/Analytics_Inventory.md`.
- Added nickname-first identity, 20 animal avatars, a dedicated current/new/confirm password flow, icon-first stable navigation, reduced-motion-safe cockpit animation, and the full Practice/Review/Progress/Results/Review state set.
- Final local QA produced 222 screenshots across six viewports with zero console/document/element-overflow failures; interaction QA passed 29/29 checks across 64 screenshots.
- The cache-busted `acc5b2b` build deployed successfully to GitHub Pages, passed live state and interaction checks, and was manually inspected in maximized external Edge at 100% zoom.

## T0029 Outcome

- Unified all canonical states under the v4 cockpit shell and documented the invariant shell/reference contract before implementation.
- Added account personalization and security rework: nickname-first identity, 20 animal avatars, compact audio controls, and a dedicated password-change dialog.
- Added privacy-conscious interaction telemetry and visibility-based timing protection while preserving existing per-question timing and persistence behavior.
- Repaired content-proportional sizing in Setup, Practice & Review, Progress, Account Settings, and Submit; removed the remaining mobile account-row overflow.
- Preserved exam navigator position across rerenders and added scrollbar-free wheel and pointer-drag scrolling.
- Final logical desktop QA: `37` screenshots, zero console/document failures, zero sampled element overflows.
- Final PC matrix QA: `111` screenshots across `1904x913`, `1536x816`, and `1536x736`, zero console/document failures, zero sampled element overflows.
- Final mobile matrix QA: `74` screenshots across `390x844` and `412x915`, zero console/document failures, zero sampled element overflows.
- Final interaction QA: `20/20` checks passed across `56` screenshots.

## T0028 Outcome

- Simplified the cockpit product across all 37 named fixture states: Study Hub, Mock Exam, Practice & Review, Progress, Results, Answer Review, Account Settings, system, auth, and dialogs.
- Added explicit user-controlled, disabled-by-default ambient audio/effects with license records in `app/assets/audio/LICENSE.md`.
- Final automated desktop QA produced `148` screenshots across four desktop targets; mobile QA produced `74` screenshots across two targets; interaction QA produced `61` screenshots and passed `20/20` checks.
- Maximized external Microsoft Edge at 100% zoom traversed all 37 fixture states and saved evidence under `qa/t0028-external-edge-final`.
- Static assets are cache-busted through `v=20260712-01`.

## T0027 Outcome

- Consolidated the complete generated-image adaptation workflow into `docs/Generated_Image_To_UI_Playbook.md` for reuse in this and future projects.
- Added a mandatory Generated Image Parity Agent to `AGENTS.md` covering content approval, reference authority, state completeness, target-browser measurement, typography/icons, safe geometry, screenshot iteration, and live verification.
- Documented the key failure modes encountered during earlier passes: recolor-only redesigns, raw-width copying, shrink-to-fit layouts, hidden overflow, malformed generated polygons, wrong-font compensation, tiny supporting copy, duplicate metrics, header drift, and automated-only signoff.
- Left application code, runtime behavior, and deployment unchanged.

## T0026 Outcome

- Audited all 37 named fixture states, including the `recent` alias that renders the Progress route.
- Grouped every canonical page by visible container and classified content as required, compact, duplicated, movable, removable, or needing a product decision.
- Identified the largest density causes: repeated Study Hub progress, repeated Practice selections, repeated Mistakes summaries, decorative Setup metrics, and duplicate Results accuracy.
- Proposed a simpler next architecture while leaving the running app unchanged.
- Recorded license and browser constraints for optional music and sound effects in `docs/T0026_State_Content_Audit.md`.

## T0025 Outcome

- Added explicit visual-agent release gates for text containment, decorative safe areas, edge clearance, final physical-scale readability, line-to-text collisions, ambiguous data-like decoration, and shared header consistency.
- Rebuilt all 36 fixture states against the original Study Hub and `states/v3/` cockpit references, including auth/system, setup, exam/graph, blocking dialogs, Practice & Review, Progress, results, Answer Review, and Account Settings.
- Restored the Study Hub two-line product lockup, replaced malformed command polygons with bounded technical plates, clarified progress-ring semantics with an accessible legend, added run telemetry, rebuilt Resume Run as a layered framed control, and increased undersized supporting labels.
- Maximized external Edge at 100% zoom was exercised across all 36 states. The final automated desktop matrix produced `144` screenshots at `1672x942`, `1904x913`, `1536x816`, and the actual `1536x736` Edge content viewport with zero console/document failures and zero sampled overflows.
- Final mobile evidence contains `72` screenshots at `390x844` and `412x915`; final interaction QA contains `60` screenshots and passes `20/20` checks.
- Impeccable detection, JavaScript syntax, data validation, and local-only dependency checks pass. Static assets are cache-busted through `v=20260711-03`.

## Next Ticket

- Qualified independent second review of authored legal, Filipino, numerical, and analytical items, or Supabase backup/export before broader use.
