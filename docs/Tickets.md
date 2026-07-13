# Tickets

## Status Legend

- `open`: not started
- `in_progress`: active ticket
- `done`: completed and verified
- `blocked`: cannot continue without input or external setup

## T0029 - V4 Theme Unification, Telemetry Foundation, Account Personalization, And Full QA

Status: done

Use `states/v4/study_hub.png` as the sole visual master, regenerate coherent references for every canonical state, rebuild the shared shell and affected pages to match those references, strengthen question telemetry, add nickname and animal-avatar personalization, repair exam navigation/audio/dialog defects, test responsive states, and deploy the verified build.

Acceptance criteria:

- Every numbered requirement in `docs/T0029_Pending_Work.md` is implemented and marked complete.
- `docs/V4_Visual_Contract.md` defines the cross-page invariants before any v5 reference is generated.
- Compatible signed-in pages use one identical v4 shell and typography/icon/color system.
- Mock Exam Setup and all other short-content panels are content-proportional with no forced dead zones.
- Account Settings uses a dedicated password-change dialog and supports nickname plus 20 animal avatars.
- Exam navigation preserves internal scroll position after rerenders and supports wheel plus drag scrolling without a visible scrollbar.
- Existing per-question analytics remain intact and future-facing telemetry is persisted without collecting sensitive or unnecessary fingerprinting data.
- Audio controls are understandable, audible after an explicit user action, and do not disturb account-control alignment.
- Desktop, common laptop, tablet, and mobile fixture matrices pass visual, overflow, interaction, and console checks.
- The cache-busted GitHub Pages build is pushed and verified live.

Completion notes:

- Added the v4 visual contract and v5 state manifest, using `states/v4/study_hub.png` as the sole cockpit visual master.
- Added nickname-first account display, 20 native animal avatar choices, a dedicated password-change dialog, and compact account audio controls.
- Added question telemetry for selections, clears, skips, flags, navigation, and visibility changes without collecting fingerprints or unrelated device data.
- Repaired Submit layout, practice/setup/progress content sizing, exam navigator scroll preservation, hidden navigator scrollbars, wheel/drag scrolling, and active header/audio alignment.
- Verified logical desktop, three PC desktop sizes, two mobile sizes, 37 fixture states, 185 screenshots in the final matrices, 20/20 interaction checks, zero runtime/document failures, and zero sampled element overflows.
- Pushed to `origin/main` as `78e9acd` and verified live on GitHub Pages with cache-busted assets `v=20260713-01`.

## T0028 - Simplified Cockpit Product Rework, Audio, QA, And Deployment

Status: done

Implement the approved defaults from T0026 across all 37 named states, preserve the generated cockpit visual language under the T0027 parity workflow, add restrained motion and explicit user-controlled audio, complete automated and maximized external Microsoft Edge QA, then deploy and verify the cache-busted build.

Acceptance criteria:

- Signed navigation uses `Home`, `Mock Exam`, `Practice & Review`, and `Progress` consistently.
- Home contains one active-run representation, three stable destinations, and compact useful records without a duplicate section-performance ribbon.
- Mock Exam Setup removes Professional exam type, Preflight Check, allocation percentages/meters, and redundant protocol copy; timer/pause are standard behavior and option changes auto-save.
- Practice, Mistakes, and Flagged remain visible as static mode cards while only a bounded workspace changes.
- Practice removes duplicated selection/fact/quick-practice structures; Mistakes and Flagged remove repeated summary content.
- Progress uses three primary metrics, score trend, section performance, and attempt records without a meaningless Review filter.
- Results use protected score-gauge geometry and six content-fitted highlights without duplicate overall accuracy.
- Answer Review, system diagnostics, and Account Settings remove duplicated or decorative jargon while preserving behavior.
- Shared motion is restrained, task-safe, and reduced-motion compatible.
- Music and effects are disabled by default, explicitly controlled by the user, license-documented, and do not autoplay before user interaction.
- All fixture and interaction states pass syntax, data, dependency, overflow, console, and screenshot checks.
- Maximized external Microsoft Edge at 100% zoom is visually inspected and repaired before deployment.
- The final cache-busted GitHub Pages build is live and verified.

## T0028 Outcome

- Applied the approved lower-density cockpit architecture across the 37 fixture states while preserving exam, auth, timing, Supabase, and local persistence behavior.
- Added restrained motion and opt-in audio controls with CC0 license documentation under `app/assets/audio/`.
- Verified the final build with syntax, data, dependency, Impeccable, desktop/mobile fixture, interaction, and maximized external Microsoft Edge QA.
- Pushed the cache-busted build to GitHub Pages and verified the live asset version after propagation.

## T0027 - Generated Image To Production UI Playbook

Status: done

Consolidate the lessons from the complete generated-image adaptation cycle into reusable project documentation and a mandatory agent contract before any further redesign work.

Acceptance criteria:

- The documentation separates product/content approval from visual-parity approval.
- It covers reference versioning, source authority, state inventory, target-browser measurement, proportional layout, typography, iconography, color semantics, decorative safe areas, scrolling, real-data shapes, motion, accessibility, screenshot iteration, interaction QA, deployment verification, and common failure modes.
- It includes portable templates/checklists suitable for reuse in future projects.
- `AGENTS.md` contains a concise mandatory generated-image parity agent that points to the full playbook.
- No application code, styles, runtime behavior, or deployment changes are made.

Completion notes:

- Added `docs/Generated_Image_To_UI_Playbook.md` as the reusable long-form workflow.
- Added a mandatory `Generated Image Parity Agent` section to `AGENTS.md`.
- Linked the T0026 state-content audit to the new playbook so content decisions remain a prerequisite to visual implementation.
- Recorded the implementation order, screenshot delta loop, external-browser requirements, generated-image artifact handling, and definition of done learned during the auth and cockpit passes.
- Left the running application unchanged.

## T0026 - Complete State Content Audit And Simplification Brief

Status: done

Inventory every rendered route and fixture before another visual redesign, group all visible content by container, identify duplication and clutter, propose familiar naming, and document a license-safe audio direction without changing the running application.

Acceptance criteria:

- All 37 fixture states are accounted for, including the `recent` Progress alias.
- Every canonical page lists its containers, information, controls, and variant states.
- Required, duplicated, movable, confusing, and removable content is explicitly classified.
- The user-reported Study Hub legend, panel collision, Setup redundancy, Results spacing, Practice/Review orientation, naming, color, and motion concerns are represented.
- Music/SFX sources and browser autoplay constraints are researched from primary sources.
- No application code, styling, runtime behavior, or deployment changes are made during the audit.

Completion notes:

- Added `docs/T0026_State_Content_Audit.md` with a complete 37-state register and page-by-page container inventory.
- Proposed a lower-density architecture for Study Hub, Mock Exam Setup, Practice/Mistakes/Flagged, Progress, Results, Answer Review, and Account Settings.
- Recorded eight explicit product decisions that must be settled before generating the next visual reference set.
- Documented Pixabay/Freesound licensing considerations and the browser requirement to start audible playback only after user interaction.
- Left the deployed application unchanged.

## T0025 - Cockpit Visual Parity And Containment Repair

Status: done

Use the original Study Hub cockpit and `states/v3/` as hard visual references, repair shared header and typography inconsistencies, clarify ambiguous progress visualization, replace malformed command geometry, enforce text/icon safe areas, run all fixture and interaction checks in Microsoft Edge at 100% desktop zoom, and deploy the verified build.

Acceptance criteria:

- Study Hub uses the shared two-line brand lockup and readable secondary labels.
- Run ring semantics are explained accessibly; command and resume controls match technical-panel geometry without deformation.
- All 36 fixtures pass desktop containment, document overflow, and console checks.
- Every interaction harness state is captured and passes.
- Maximized external Microsoft Edge screenshots are saved for final comparison.
- Cache-busted build is deployed and verified live.

Reopened 2026-07-11: the first T0025 pass repaired only the Study Hub and reused existing page implementations. It did not satisfy page-by-page visual parity with all `states/v3/` references.

Completion notes:

- Rebuilt the complete 36-state fixture surface against the original Study Hub and `states/v3/` cockpit references instead of limiting the repair to Study Hub overrides.
- Added explicit ring semantics, run telemetry, readable support labels, framed command controls, shared two-line product lockups, and consistent signed-in navigation.
- Reworked setup, exam and graph players, blocking dialogs, Practice & Review tabs, Progress, pass/fail/practice results, Answer Review, account settings, auth, loading, and failure states with bounded desktop geometry and responsive mobile flow.
- Repaired defects found only in maximized Edge: graph-player actions missing at the actual browser content height, an undersized flagged queue, and a clipped `Needs Work` result title.
- Expanded the interaction harness to 20 checks, including Enter-to-sign-in, no retained credentials, delete-account arming, and visible attempt menus.
- Final desktop evidence contains `144` screenshots across four PC viewports, including the real `1536x736` maximized-Edge content area, with zero console/document failures and zero sampled overflows.
- Final mobile evidence contains `72` screenshots across `390x844` and `412x915`; final interaction evidence contains `60` screenshots with `20/20` checks passing.
- Impeccable detection, JavaScript syntax, static-data validation, and the local-only dependency policy all pass. Static assets are cache-busted through `v=20260711-03`.

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

## T0020 - Account Auth Rework From V2 Sign-In

Status: done

Rework the public auth entry screens around account language and the `states/v2/sign_in.png` visual direction.

Acceptance criteria:

- Create Profile is renamed to Create Account across the public create screen.
- The create account form includes Password and Confirm Password side by side on desktop, with validation that both values match.
- Password fields on create and sign-in screens have an eye icon toggle to show/hide typed passwords.
- The sign-in screen adapts `states/v2/sign_in.png`: card heading says `Sign In`, primary button says `Sign In`, and the bottom account switch says `Create account`.
- The left-side feature rows use the v2 icon-circle-plus-label style instead of white rectangular chips.
- The left visual stack remains proportionally close to the right auth card and does not introduce root/page scrollbars on desktop.
- Edge screenshot QA is captured for create account, sign in, and password-toggle states.

Completion notes:

- Renamed public auth language from profile to account on the create/sign-in entry screens.
- Added desktop two-column Password / Confirm Password fields to create account, with password-match validation before Supabase signup.
- Added password eye toggles for create account and sign-in password inputs.
- Reworked sign-in to follow `states/v2/sign_in.png`: `Sign In` heading/button, v2 left feature copy, and `New here? Create account` switch.
- Replaced left feature cards with v2 icon-circle-plus-label rows for create and sign-in.
- Updated `?fixture=select` to render the v2 sign-in state instead of the stale profile-picker list.
- Screenshot QA was saved under `qa/t0020-account-final` for create account, sign-in, password-visible, fixture select, and mismatch validation states.

## T0021 - Mockup Adaptation Rule Hardening

Status: done

Make the screenshot-parity agent rules explicit about the visual defects found during auth/profile adaptation.

Acceptance criteria:

- `AGENTS.md` explicitly treats icon quality, icon size, icon positioning, proportional spacing, font style, font size, line height, font color, and contrast as required parity checks.
- The rules distinguish full-page proportional balance from merely fitting elements into the viewport.
- The current-state docs record the strengthened UI-quality guardrails.

Completion notes:

- Added explicit first-class parity bullets for icon glyph quality, icon sizing/positioning, full-composition spacing proportions, typography style, hierarchy scale, line height, and color/contrast roles.
- Kept this as a documentation-only change so the next dashboard repair can apply the stricter rules cleanly.

## T0022 - Post-Sign-In Flow Rework And Edge QA

Status: done

Rework the signed-in app states after the auth repair so dashboard, account settings, practice, mistakes, recent attempts, and exam controls behave coherently and meet the hardened screenshot-quality rules.

Acceptance criteria:

- Manage Profile is retired and replaced with Account Settings, opened only from the upper-right account/avatar control.
- Switch Profile, Edit Profile, visible signed-in header disclaimer pill, preset profile photos, and the old profile-switch modal are removed from signed-in flows.
- Account Settings follows `states/v2/account_settings.png` direction with account fields, password controls, Sign Out, and Delete Account.
- The dashboard no longer links to redundant dashboard-like side pages; Practice and Review Mistakes open meaningful customization/selection states with no-data empty states where needed.
- Recent Attempts can show more than two attempts without broken layout.
- Time-left and answered trackers remain stable, and Supabase auth/token events do not force the user back to the dashboard while answering.
- The Next button cannot advance from an unanswered question; Skip is the explicit way to leave an unanswered item.
- Exam sidebar hover/scroll behavior is visually stable and does not shift the layout.
- Maximized Microsoft Edge screenshots and interaction checks are captured after implementation, and visible defects are iterated before completion.

Completion notes:

- Retired signed-in Switch Profile, Edit Profile, preset profile photos, and the signed-in header disclaimer pill.
- Replaced Manage Profile with Account Settings, opened from the upper-right account control and side-nav account row.
- Reworked dashboard recent attempts into compact rows and added full Recent Attempts handling for more than two attempts.
- Reworked Practice by Category into a custom-practice setup plus quick section practice, with no-data guidance.
- Reworked Review Mistakes into a targeted missed-question hub with summary cards, attempt rows, and an empty state.
- Stabilized Supabase auth refresh handling so token events no longer force a dashboard reset while answering.
- Changed Next so it is disabled on unanswered questions; Skip is the explicit unanswered navigation action.
- Hid the exam navigator scrollbar while preserving bounded internal scrolling and stable hover behavior.
- Cache-busted static assets through `v=20260706-1`.
- Maximized Microsoft Edge QA screenshots were saved under `qa/t0022-edge-final`, `qa/t0022-edge-r7`, and `qa/t0022-edge-r8`.

## T0023 - Gamified Study Hub Cockpit

Status: done

Replace the signed-in Home page with the approved dark training-cockpit direction while keeping the active exam mechanics and backend unchanged.

Acceptance criteria:

- Study Hub matches the approved dark cockpit reference at a maximized 16:9 Microsoft Edge viewport.
- The page uses a functional top navigation for Study Hub, Full Mock, Practice & Review, Progress, and Account Settings.
- Typography is self-hosted; icons are a locally vendored Lucide subset; no new runtime CDN or frontend framework is introduced.
- Active-attempt progress, timer, section checkpoints, actions, personal records, and section performance use real app data or explicit fixture-safe fallbacks.
- The page contains no study plan, XP, streak, currency, mission, mascot, or CRUD-style KPI grid.
- New-account, active-attempt, and completed-attempt states remain usable without overflow or clipped controls.
- Maximized Edge screenshots and interaction checks pass before deployment.
- Static validation, dependency checks, JavaScript syntax checks, and Impeccable detection pass.

Completion notes:

- Rebuilt the Study Hub against the approved cockpit image using measured desktop geometry instead of a generic dark dashboard approximation.
- Added the segmented completion ring, section checkpoint rail, angular resume control, three command panels, personal-record rail, and section-performance ribbon while keeping all values tied to real attempt data or fixture-safe fallbacks.
- Added functional top navigation for Study Hub, Full Mock, Practice & Review, Progress, and Account Settings.
- Self-hosted the Barlow Condensed display family and vendored the required Lucide SVG subset; no runtime framework, icon CDN, or font CDN was added.
- Kept group rankings and fabricated gamification out of the product; the reference's group-record area is implemented as private personal records.
- Fixed the exam fixture accordion so `More` expansions remain open across rerenders and continue to use bounded, scrollbar-free internal scrolling.
- Repaired Results and Answer Review clipping exposed by the full-state regression sweep.
- Cache-busted static assets through `v=20260710-15`.
- Edge-channel screenshots and interaction evidence were saved under `qa/t0023-parity-final-r2`, `qa/t0023-parity-interactions`, `qa/t0023-parity-state-final`, and `qa/t0023-control-sequence`.

## T0024 - Full Cockpit Theme And Page-Parity Rework

Status: done

Make the approved `1672x942` cockpit reference the visual master for every application state while preserving the existing Supabase, exam, timing, scoring, and persistence behavior.

Acceptance criteria:

- Desktop routes render inside one centered, uniformly scaled `1672x942` logical frame at 100% browser zoom without document scrolling or aspect-ratio distortion.
- Public auth, system states, setup, exam, graph, practice, progress, results, review, and account settings use the shared graphite/cyan cockpit language.
- Long data, question, navigator, explanation, and modal regions use bounded internal scrolling; mobile below `1100px` uses normal responsive document flow.
- Native prompt/confirm flows are replaced by accessible in-app dialogs for password reset, account deletion, and attempt deletion.
- Active-exam behavior remains intact, including persistent accordions, explicit Skip behavior, answer-gated Next, pause/resume, timeout submission, and timing analytics.
- Fixtures cover default, empty, loading, error, expanded, destructive, timeout, chart, pass/fail, and practice-result states.
- Maximized Edge screenshot and interaction sweeps pass at `1904x913`, `1536x816`, and the native logical frame before a cache-busted live deployment.

Completion notes:

- Consolidated the signed-in and public visual system into `cockpit-theme.css` and removed the superseded `study-hub.css` / `final-overrides.css` layers.
- Added a centered, uniformly scaled `1672x942` desktop frame with responsive mobile flow below `1100px`; desktop pages do not distort or use document scrolling.
- Reworked boot/config/error, account access, Study Hub, setup, full mock/practice players, graph questions, pause/submit/timeout, Practice & Review, Progress, results, Answer Review, and Account Settings into the graphite/cyan cockpit language.
- Replaced native password-reset and destructive confirmation flows with accessible in-app dialogs, added loading/error states, and kept answer-gated Next plus explicit Skip behavior.
- Added self-hosted Rajdhani weights and retained local Barlow Condensed / local icon assets without installing project dependencies in Google Drive.
- Added reusable Edge screenshot and interaction harnesses in `scripts/qa-cockpit.cjs` and `scripts/qa-interactions.cjs`.
- Final Edge fixture sweeps produced `108` desktop screenshots and `72` mobile screenshots with zero console/document failures and zero sampled element overflows; the final interaction run produced `59` screenshots with `15/15` checks passing.
- Static assets are cache-busted through `v=20260711-01`.
