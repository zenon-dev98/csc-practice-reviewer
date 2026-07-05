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

## T0012 - Screenshot-Parity Repair And Manual State QA

Status: done

Rebuild the screenshot-state UI contracts and verify every supplied state before redeploying.

Acceptance criteria:

- Fixture mode can force create/select/dashboard/setup/exam/collapsed exam/graph/pause/submit/results/review/practice/recent/profile-modal states without Supabase writes.
- Dashboard, exam sidebar, graph stimulus, submit/pause, results/review, practice/recent, and profile modal layouts use bounded screenshot contracts.
- Expanded exam groups and graph subgroups never overflow their cards or viewport.
- Answer selection, clear, skip, flag, previous/next, pause/resume, submit/review paths, and graph linked chips are manually exercised.
- Desktop and mobile fixture sweeps show no horizontal overflow, no containment offenders, and no console errors.
- Static checks, dependency check, and Impeccable detector pass.

## T0013 - Maximized Edge No-Scroll Desktop Density Repair

Status: done

Redesign every supplied desktop state so it fits within a maximized Microsoft Edge PC viewport without root/page scrollbars caused by oversized cards, typography, spacing, or panels.

Acceptance criteria:

- Target viewport is a maximized Microsoft Edge window on the user's PC; windowed captures are invalid and must be retaken after maximizing.
- Fixture states for create/select/dashboard/setup/exam/exam-collapsed/graph/pause/submit/results/review/practice/recent/profile-modal render without a document/body scrollbar on desktop.
- Oversized typography, paddings, card heights, modal dimensions, and button heights are reduced to match the density of the `states/` mockups.
- Long content uses compact grids, pagination, tabs, collapsible sections, or bounded internal controls instead of forcing the whole page to scroll.
- Exam states keep all primary controls visible in one viewport: timer/status, pause/submit, grouped navigator, prompt, choices, and question actions.
- Results/review/practice/recent/profile states fit the desktop viewport without hiding important controls below the fold.
- A screenshot loop is run in maximized Microsoft Edge and QA screenshots are saved under `qa/`.

Completion notes:

- Added a desktop density contract for the supplied fixture states at `1920x920` and the user's maximized Microsoft Edge viewport, measured at `1536x816`.
- Reduced oversized desktop headers, cards, buttons, modals, exam choices, graph panels, sidebar chips, dashboard rows, results cards, practice/recent layouts, and profile modal controls.
- Replaced full review/question chip walls with bounded preview windows so long question lists do not force page scrolling.
- Dashboard recent attempts now previews two attempts on the dashboard; the full recent table remains on the Recent Attempts page.
- QA screenshots were saved under `qa/t0013-density-edge-final`, `qa/t0013-density-interactions`, and `qa/t0013-density-edge-1536x816-r4`.
- Static checks, data validation, dependency check, Impeccable detector, automated fixture sweeps, interaction sweeps, and real maximized Microsoft Edge checks passed.

## T0014 - Desktop Screenshot Quality Regression Repair

Status: done

Repair the T0013 forced-fit regression where cards, buttons, groups, and text technically fit a maximized desktop viewport but lost the spacing, proportions, and polish of the `states/` mockups.

Acceptance criteria:

- Dashboard, setup, exam, results, practice, answer review, recent attempts, and profile modal preserve mockup-like proportions instead of stretched full-width strips or cramped controls.
- Primary buttons, text blocks, score cards, and form controls have consistent breathing room and never hug card edges.
- Exam question groups can expand without hiding lower groups; the sidebar uses bounded internal scrolling with hidden or unobtrusive scrollbars instead of clipping content.
- Long dashboard/review/results regions avoid giant unused voids while keeping text and controls readable on a maximized 16:9 desktop.
- The app still avoids document/body scrollbars on the target desktop fixture states where the mockups fit in one screen.
- Desktop screenshot QA is rerun after changes and saved under `qa/`.

Completion notes:

- Replaced the forced-fit desktop layer with quality-preserving dashboard, exam, setup, results, review, profile modal, and side-page layout contracts.
- Fixed the exam sidebar by changing it back to normal block flow with bounded internal scrolling; expanded `More` question groups no longer clip lower groups or force page scroll.
- Rebalanced dashboard card rows so cards keep breathing room without giant bottom voids or buttons touching card edges.
- Reworked results layout into a two-column desktop composition with a richer Exam Overview list and compact fun-fact cards for smaller desktop viewports.
- Added a favicon and cache-busted static assets through `v=20260705-3`.
- Edge-channel screenshot sweeps passed at `1904x913` and `1536x816`; interaction screenshots covered sidebar expansion/scrolling, answer selection, clear, flag, skip, pause, and submit modal.

## T0015 - Auth Background Asset Pass

Status: done

Use the provided `images/create_profile_background.png` as the background for the public create-profile and continue-profile entry screens.

Acceptance criteria:

- The background image is available from the deployed `app/` asset path.
- Create Profile and Continue Profile states use the image behind the auth layout without reducing form readability.
- Fixture create/select QA states keep their existing layout contracts while inheriting the same background treatment where applicable.
- Static checks pass and local screenshots confirm no root scrollbar or obvious visual regression on the auth entry states.

Completion notes:

- Copied `images/create_profile_background.png` into the deployed `app/assets/` path.
- Applied the background to create-profile, continue-profile, and fixture select/profile-entry surfaces with translucent readable cards.
- Cache-busted app assets through `v=20260705-4`.
- Edge-channel screenshots for create, continue, and fixture select states were saved under `qa/t0015-auth-background`, with no document/body overflow detected.

## T0016 - Ponytail Auth Screenshot-Parity Repair

Status: done

Repair the public create-profile and continue-profile screens against the supplied mockup using Ponytail discipline: remove wrong layers first, reuse existing markup/helpers, and apply the smallest CSS/asset changes needed for screenshot parity.

Acceptance criteria:

- The installed Ponytail skill is reflected in project guardrails, and this ticket avoids new dependencies unless no native/simple option works.
- The left `Review smarter...` content is no longer inside a large card/container; only the pill and feature rows have small surfaces.
- The background is replaced or regenerated so the dotted lower-left and soft blue waves fit the full desktop width naturally.
- Typography changes from the current `Bahnschrift/Aptos` look to a closer mockup-like UI stack, with hero size/line breaks matched to the reference.
- Icons for profile fields, feature rows, disclaimer, and the green pill are resized/recolored to match the mockup hierarchy.
- Header layout, logo scale, disclaimer pill placement, form-card width, input height, CTA treatment, feature-row width, colors, and copy are tuned against the mockup.
- Production-only Password and Invite Code fields remain functional but are styled to preserve the mockup's proportions as much as the extra fields allow.
- Desktop browser screenshots compare the target mockup and the repaired create/continue states before completion.

Completion notes:

- Removed the large `auth-copy` card treatment that boxed the `Review smarter...` copy.
- Replaced the raster auth background dependency with scalable CSS dots/waves so the background fits desktop widths.
- Reworked auth-only typography, header/disclaimer placement, form-card sizing, input sizing, CTA styling, and feature-row/icon sizing.
- Kept the Supabase Password and Invite Code fields functional while compacting the production form to fit the desktop viewport.
- Cache-busted static assets through `v=20260705-5`.
- Screenshot QA was saved under `qa/t0016-auth-final` for create/continue at `1904x913` and `1536x816`.

## T0017 - Auth Proportional Desktop Layout Repair

Status: done

Replace the fixed auth screen column/gap sizing with a proportional desktop layout so create-profile and continue-profile fit at 100% browser zoom and do not leave an obvious dead zone on wide desktops.

Acceptance criteria:

- Create Profile and Continue Profile use centered proportional columns instead of fixed copied mockup widths.
- The right-side form card does not leave excessive unused space to its right on wide desktop screens.
- The production four-field signup form fits in the visible desktop viewport at 100% zoom without clipping important actions.
- The continue/switch profile screen uses the same proportional composition.
- Auth root no longer hides overflow in a way that cuts off content if a browser viewport is shorter than the QA viewport.
- Desktop screenshots are captured for create and continue states at wide and smaller desktop viewports.

Completion notes:

- Replaced fixed auth canvas sizing with proportional centered columns, clamped gaps, and height-aware spacing.
- Aligned the form card to the right side of its proportional column so wide screens no longer show a large dead zone to the right.
- Changed auth root overflow from hidden vertical clipping to recoverable vertical overflow while preserving normal no-scroll fit at tested desktop sizes.
- Cache-busted static assets through `v=20260705-6`.
- Screenshot QA was saved under `qa/t0017-proportional-r2` for create and continue at `1904x913`, `1536x816`, and `1904x760`.

## T0018 - Auth Visual Balance Spacing Repair

Status: done

Tune the auth create/continue screens after the proportional repair so the page reads as one balanced composition instead of two separated blocks.

Acceptance criteria:

- Center gap is visually balanced against outer margins; the form is not shoved to the far right.
- Top and bottom whitespace in the content area feel balanced at desktop sizes.
- Create and Continue cards use a softer, less bottom-right-heavy shadow.
- Feature rows are slightly tighter and no longer feel stretched.
- Hero text and left-side rhythm are calmer while preserving readability.
- Create and continue states are screenshot-checked at wide and smaller desktop viewports.

Completion notes:

- Reduced the center gap and balanced outer margins so the auth page reads as one composed unit.
- Moved auth content slightly upward through height-aware padding.
- Replaced the broad bottom-right-heavy auth card shadow with a softer, shorter shadow.
- Tightened feature-row width and icon scale, and slightly calmed hero sizing.
- Screenshot QA was saved under `qa/t0018-balance-r1` for create and continue at `1904x913`, `1536x816`, and `1904x760`.

## T0019 - Auth Vertical Span And Header Hierarchy Repair

Status: done

Repair the remaining create/continue auth imbalance where the left feature stack is visually shorter than the right form card, and strengthen the form-card heading hierarchy.

Acceptance criteria:

- The create screen's left stack from `Civil Service Exam Practice` through `Reviewer history` visually spans close to the right card from `Create Profile` through `Select existing profile`.
- The continue/select screen uses the same proportional vertical balance.
- `Create Profile` and `Continue Profile` read clearly as form-card titles, not just ordinary text inside the card.
- No root/page scrollbar is introduced at the desktop QA viewport.
- Create and continue states are screenshot-checked after the repair.

Completion notes:

- Matched the create screen's left visual stack height to the right form card at the desktop QA viewport.
- Applied the same proportional span treatment to the continue/select profile screen.
- Strengthened form-card title hierarchy with larger, heavier `Create Profile` and `Continue Profile` headings.
- Kept the change CSS-only; no new markup, assets, or dependencies were added.
- Screenshot QA was saved under `qa/t0019-span-r2` for create and continue at `1904x913`.
