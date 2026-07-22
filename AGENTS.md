# CSC Practice Reviewer — AGENTS.md

This repository contains an independent Civil Service Exam practice reviewer.

Do not imply Civil Service Commission affiliation, endorsement, sponsorship,
official status, or access to leaked examination materials.

## Stack and architecture

- Frontend: vanilla HTML, CSS, and JavaScript
- Backend, auth, and persistent data: Supabase
- Hosting: GitHub Pages
- Browser QA: existing scripts and Playwright
- No new production dependency without explicit approval
- Do not migrate to a frontend framework unless explicitly requested
- Keep the app static-hostable unless an architecture change is approved

## Instruction priority

When repository instructions conflict:

1. Safety, privacy, security, accessibility, and prevention of data loss
2. The user's explicit current request
3. Real production behavior and established product invariants
4. The active ticket's acceptance criteria
5. The active approved visual reference
6. This file
7. Supporting documents under `docs/`

A ticket, screenshot, mockup, or request must not silently weaken security,
corrupt data, violate accessibility, or contradict established product behavior.

## Canonical project facts

- This is an exam and review tool, not a marketing site.
- A standard Professional mock has 170 items and a 3:10:00 time limit.
- Supabase is authoritative for authenticated user data.
- Browser storage is only for recovery, drafts, caching, or documented offline
  behavior.
- Names, emails, answers, scores, timing, progress, and attempts are private.
- Preserve visible independence disclaimers where relevant.
- Main signed-in areas are Home, Mock Exam, Practice & Review, Progress,
  Results, Review, and Account Settings.

## Sources of truth

When documentation disagrees:

1. Current production behavior and deployed schema
2. `docs/Repo_Current_State.md`
3. Active ticket and approved product decisions
4. Current migrations, RLS policies, and persistence code
5. Tests and deterministic fixtures
6. README and older design documents

Identify and update stale documentation. Do not invent missing playbook content.
If a referenced file is absent, follow this file and report the missing reference.

## Canonical commands

```powershell
npm run check
npm run setup
npm run start
npm run validate:data
npm run audit:questions
npm run qa:paper
```

Default local URL:

```text
http://127.0.0.1:4173/index.html
```

`npm run check` is the fast JavaScript syntax check. The remaining commands are
triggered only when the risk table under Testing says they apply.

Never install packages or create `node_modules` inside the Google Drive
workspace. Do not run `npm install`, `npm ci`, dependency-installing `npx`, or
equivalent package-manager commands from this repository. Use `npm run setup`,
which installs optional tooling under `%LOCALAPPDATA%`, only when that tooling is
actually missing. Do not recheck dependency placement during routine releases.

## Lean release policy

Use the smallest verification set that can detect a regression caused by the
current change. Verification that already passed remains valid unless relevant
code, data, configuration, or merge results changed afterward.

Default release behavior:

- test locally before commit
- run only the checks triggered by the current diff
- use Microsoft Edge at `1536x736`, 100% zoom, for relevant UI checks
- do not run a full interaction suite, all-state screenshot matrix, motion
  suite, mobile matrix, independent audit, or live interaction replay unless
  the user explicitly requests it
- merge or rebase the latest `origin/main` before push and resolve changes
  deliberately
- commit and push the scoped change
- inspect one GitHub Pages deployment result
- perform one live HTTP check that confirms the page and changed cache-busted
  asset are available

GitHub Pages deployment must package the static app only. It must not repeat
question validation or install a Node runtime solely for validation.

## Working loop

Work one ticket at a time.

Before editing:

1. Read `docs/Tickets.md`, the active ticket, and
   `docs/Repo_Current_State.md`.
2. Read referenced design material or playbooks.
3. Summarize the intended change and likely files.
4. Reproduce bugs when practical.
5. State assumptions that materially affect behavior.
6. Report when no code change is required.

During implementation:

- Prefer the smallest complete root-cause fix.
- Reuse existing markup, styles, icons, tokens, fixtures, scripts, and helpers.
- Remove wrong code before adding compensating code.
- Avoid speculative refactors and unrelated behavior changes.
- Do not create duplicate implementations of the same concept.
- Do not alter question content during unrelated work.

After each ticket:

- Update `docs/Repo_Current_State.md`.
- Update `docs/Known_Issues_And_Followups.md` when needed.
- Update `docs/Tickets.md` when status or follow-up work changes.
- Report summary, files changed, commands, verification, artifacts, risks,
  follow-ups, and anything incomplete.

## Ambiguity and blockers

Ask before an irreversible, security-sensitive, schema-level, destructive, or
major product decision not resolved by the ticket.

Do not ask when a safe, reversible, evidence-based choice is available.

When credentials, fixtures, references, services, or environments are missing:
- do not fabricate results
- complete safe work
- mark affected verification incomplete
- identify the exact blocker

## Dependency policy

- No new production dependency without explicit approval.
- No new framework, component library, animation library, icon package, or
  state-management library without explicit approval.
- Prefer native browser features, CSS, inline SVG, and existing utilities.
- Development dependencies require justification when no equivalent path
  already exists.
- No dependency may be installed inside the Google Drive repository. This is a
  standing rule, not a deployment check.

A dependency proposal must explain necessity, type, runtime impact, maintenance
cost, and rollback cost.

## Question-bank integrity

Treat question text, choices, answers, explanations, metadata, and sources as
controlled content.

Every production question requires:

- stable question ID
- exam version
- section
- topic and subtopic
- choices and correct answer
- explanation
- source or provenance
- review status

Rules:

- Mark uncertainty as `needs_review`; never guess silently.
- Do not rewrite content during unrelated work.
- Preserve section boundaries, totals, coverage rules, and shared stimuli.
- Keep IDs stable once attempts may reference them.
- Validate after question-bank changes.
- Treat duplicate IDs, invalid answers, missing choices or explanations, broken
  stimuli, and incomplete metadata as blockers.

## Exam invariants

- Standard full mock: 170 questions, 3:10:00.
- Timer state must survive refresh, close, pause, resume, and reconnect without
  unexplained gain or loss.
- Timeout uses the same scoring and persistence path as manual submission.
- Scoring must be deterministic.
- Attempt question order and answer-choice order remain stable after start.
- Submitted attempts are immutable except through an explicit administrative
  correction workflow.
- Resume restores question, answers, flags, skipped state, elapsed time, and
  options.
- Retake creates a new attempt.
- Review does not mutate submitted answers.
- Shuffling must preserve correct-answer meaning.

## Persistence and synchronization

- Supabase is authoritative; browser storage is a recovery layer.
- Never overwrite newer cloud state with older client state.
- Saves must be idempotent and must not duplicate attempts or answers.
- Preserve recoverable progress across interruption and failed requests.
- Do not show "Saved online" until persistence succeeds.
- Failed cloud saves must remain visible and recoverable.
- Submitted attempts must not silently become editable.
- Resolve local/cloud conflicts deliberately and document the rule.

When persistence changes, test refresh, interrupted save, retry, reconnect,
stale state, duplicate submission, and resume.

## Security and privacy

Never:

- expose or commit service-role keys, secrets, passwords, or private tokens
- weaken auth, invite validation, or RLS to make a feature work
- place privileged backend logic in GitHub Pages frontend code
- log passwords, tokens, or unnecessary personal data

Always:

- use only publishable or anon browser credentials
- enable RLS on exposed tables
- scope user-owned data to `auth.uid()`
- preserve least privilege
- treat cross-user access as a release blocker
- keep user-facing errors free of secrets and stack traces

For schema, policy, auth, or persistence changes:

- verify same-user allow
- verify cross-user deny
- verify anon deny where applicable
- prefer additive, reversible migrations
- document rollback steps

Security-definer functions must not be placed in exposed schemas and must have
documented purpose and restricted privileges.

## Destructive changes

Do not delete, truncate, rewrite, or irreversibly migrate production user data
without explicit approval.

Preserve historical attempts and answer snapshots. Require confirmation for
destructive user actions. Verify deletion is limited to the authenticated
user. Document recovery or rollback steps.

## Error handling

- Fail visibly and recoverably.
- Do not swallow auth, sync, persistence, scoring, or content errors.
- Explain the next user action when recovery is possible.
- Retry automatically only when safe and idempotent.
- Preserve recoverable state after failed saves.
- Do not present stale data as current without indicating it.
- Do not expose stack traces or secret values.

## Frontend and UX

- Build the real study and exam experience first.
- Keep the interface focused, readable, calm, and task-oriented.
- Preserve the approved shared shell across compatible pages.
- Use familiar labels for primary tasks.
- Do not rely on color alone for state.
- Keep primary actions visually distinct.
- Avoid fake controls, fabricated data, fake security claims, and unexplained
  data-like decoration.
- Do not stretch short content into oversized panels merely to fill space.
- Use internal scrolling only when the component owns the overflow.
- Test long names, emails, dense histories, many mistakes or flags, empty
  states, and wrapped text.

## Spacing system

Use one shared spacing scale:

```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 40px;
  --space-8: 48px;
}
```

Define the tokens once in the global design layer. Verify they exist before
using them. Do not create page-specific token sets.

Defaults:

- icon-label or tight inline gap: `--space-2`
- label-control or grouped-control gap: `--space-2` to `--space-3`
- standard field or content gap: `--space-4`
- card groups and internal sections: `--space-5`
- major page sections: `--space-6` or larger
- standard card padding: `--space-5`
- compact padding: `--space-3` or `--space-4`
- content-to-decoration clearance: at least `--space-3`

Density:

- Comfortable: Home, Setup, Results, Settings
- Standard: Practice & Review, Progress, forms
- Compact: exam navigation, tables, question grids, dense review controls

Rules:

- Equivalent relationships use equivalent spacing across pages.
- Related content is closer than unrelated groups.
- Preserve consistent page margins, card padding, heading gaps, fields, button
  groups, and repeated components.
- Avoid arbitrary one-off values when a token is adequate.
- Do not remove spacing merely to avoid scrolling.
- Do not solve crowding by globally shrinking the UI.
- Protect content from borders, notches, rails, connectors, and pseudo-elements.
- Optical adjustments are allowed, but prefer the nearest token.
- Collisions, edge-hugging, merged controls, and inconsistent equivalent gaps
  are release blockers.

## Motion

Motion may communicate hierarchy, interaction, navigation, progress, loading,
saving, or content transition. It must not exist as decorative noise.

- Prefer `transform` and `opacity`.
- Avoid layout shift, large scaling, bounce, elastic easing, and endless pulse.
- Keep hover and press feedback restrained.
- Keep page-entry motion brief.
- Stop when the state is complete.
- Respect `prefers-reduced-motion`.

Meaningful motion changes must define trigger, start, end, duration, easing, and
reduced-motion behavior. Static screenshots alone do not verify time-based
motion.

## Accessibility

Target WCAG 2.2 AA.

- Use semantic HTML before ARIA.
- Preserve visible focus.
- Make controls keyboard reachable.
- Give icon-only controls accessible names.
- Associate form errors with controls.
- Do not rely on color alone.
- Do not disable zoom.
- Keep the app usable at 200% zoom.
- Respect reduced motion.
- Maintain readable contrast and target sizes.

## Visual QA

For ordinary UI, layout, or styling work, inspect only the affected route,
state, and interaction locally at the primary Edge viewport. Capture evidence
when it materially helps compare the changed state. Do not create a full state
matrix or test unrelated routes by default.

When the user explicitly requests full screenshot parity or a full visual
audit:

1. Start from a concrete approved reference.
2. Identify the active target version.
3. Map layout, spacing, typography, color, icons, states, scroll ownership, and
   responsive expectations.
4. Verify in a real browser after meaningful visual checkpoints.
5. Compare screenshots and record specific differences.
6. Repair obvious defects before completion.
7. Recapture affected evidence after meaningful edits.

Check relevant states:

- default
- hover, focus, active, pressed
- disabled, loading, error, empty
- modal, menu, expanded, collapsed
- lower or scrolled content
- long and wrapped text

Also inspect:

- page margins and card padding
- text-icon, text-border, control-control, and card-card spacing
- clipping, overflow, collisions, edge-hugging, and dead zones
- consistency between equivalent components

Store artifacts under:

```text
qa/<ticket-or-date>/
```

A full visual-audit ticket must create a coverage manifest before release
testing. Each required row records:

- route or fixture and starting data condition
- viewport and approved reference
- user action and expected visible result
- expected functional result
- scroll owner and required lower-content evidence
- screenshot, trace, or video filename
- functional, reachability, and parity verdicts

Required rows cannot disappear conditionally. A missing control, unexecuted
assertion, absent screenshot, or skipped required branch is a failure. Reports
must state expected, executed, passed, failed, blocked, and skipped counts.
`passed + failed + blocked + skipped` must equal the expected count, and a
release verdict requires `failed = blocked = skipped = 0`.

For a requested full visual audit, use four separate QA verdicts. Never collapse
them into the phrase `QA passed`:

1. Functional correctness: the intended state and data transition occurred.
2. Human reachability: a user could visibly find and operate the control.
3. Optical parity: the state meets the approved reference and quality bar.
4. Live verification: the deployed cache-busted build repeats the smoke path.

For explicitly requested generated-image or screenshot adaptation, follow
`docs/Generated_Image_To_UI_Playbook.md` when available and relevant.


## Manual Edge State and Interaction Agent

This agent is opt-in. Use it only when the user explicitly requests external
Edge takeover, a complete state/interaction walkthrough, or release-grade
reachability evidence. Ordinary UI changes use the targeted local check defined
under Testing.

The agent must:

1. Build the complete state and interaction matrix from current routes,
   deterministic fixtures, dialogs, menus, filters, accordions, controls, and
   responsive navigation. Do not test only the states named in the bug report.
2. Run the existing automated fixture and interaction suites first so failures
   are reproducible and screenshots are saved consistently.
3. Open the app in the user's external Microsoft Edge, maximize the window,
   set zoom to 100%, and verify the actual content viewport before inspection.
4. Walk through every reachable interaction manually: navigation, hover,
   pointer click, keyboard focus, selection, expand/collapse, More/Less,
   internal scrolling, modal open/close, disabled/enabled transitions, form
   validation, pause/resume, answer/clear/flag/skip/next/previous, submit,
   results, review filters, row menus, account settings, and sign out.
5. Capture a screenshot after every meaningful resulting state, including
   lower content after scrolling and all empty, partial, dense, loading, error,
   success, open, closed, selected, disabled, and submitted variants.
6. Save evidence under `qa/<ticket>-edge-manual/` with a manifest or report
   mapping each screenshot to the action that produced it.
7. Compare every applicable state against the active approved reference and
   inspect text containment, spacing, physical text size, icon weight,
   alignment, decorative safe areas, scroll ownership, and control behavior.
8. Repair every reproducible visual or functional defect found, rerun the
   affected interaction, and recapture its evidence. A defect log without the
   repair and recapture is incomplete.
9. After the final edit, rerun the complete release matrix. Earlier screenshots
   do not verify a later build.
10. Repeat the same smoke path on the cache-busted live deployment and verify
    that the live asset versions match the tested local build.

Reachability evidence must use the same means available to a user: visible
pointer clicks, wheel or touchpad scrolling, keyboard focus/navigation, and
pointer dragging. During the measured user path, do not use DOM `evaluate()`
to mutate state or scroll position, `scrollIntoViewIfNeeded()`, hidden-element
clicks, forced accordion state, direct route/state mutation, or locator actions
that automatically rescue an offscreen control. Deterministic setup is allowed
only before the path begins, must be declared in the manifest, and cannot
perform the interaction being verified.

Required controls must be asserted before interaction. Constructs such as
`if (await locator.count())` are prohibited for required coverage unless the
missing branch explicitly records a failed check. Fixtures must reproduce the
real production interaction structure; a fixture-only shortcut does not prove
production reachability.

For the exam navigator, permanent release coverage must start collapsed, open
More visibly, capture the expanded state, wheel through every lower section,
open item 80, return to item 21 without fixture reset, operate Less visibly,
and verify sensible scroll clamping plus continued access to every section.

A UI ticket is not complete when external Edge control is unavailable, the
window was not maximized, screenshots were not saved, any interaction was
skipped without a risk-based reason, or the last code change was not
recaptured. Report the exact incomplete portion instead of claiming success.

The first external-Edge screenshot must show the maximized application window,
100% browser zoom, and measured content viewport. Headless Edge is regression
evidence only and cannot satisfy the manual gate.

## Visual Parity Quality Agent

This agent is opt-in. Use it only when the user explicitly requests exact
screenshot/generated-image parity or a complete parity pass. When invoked, use
the active reference version named by its manifest. V5 is the active reference
for states that have an approved V5 image; the V4 Study Hub remains authoritative
only where its manifest or ticket explicitly says so.

The active reference manifest must map every applicable state to its reference
image, target viewport, primary panel anchors, typography roles, physical type
and icon sizes, color ownership, scroll owner, interaction variants, and any
approved deviation. A state without a manifest entry cannot claim parity.

The agent must reject and repair:

- text touching, crossing, or entering another label, border, divider, icon,
  notch, hatch, rail, connector, or neighboring control
- text, icons, and controls that are clipped, truncated, edge-hugging,
  undersized at the final physical viewport, or outside their containers
- inconsistent equivalent spacing, icon sizes, type roles, colors, shell
  geometry, and control states across compatible pages
- dead zones, forced equal-height panels, cramped rows, hidden lower sections,
  hover-induced scrollbar shifts, and inaccessible expanded content
- decorative animation without a defined state purpose, endpoint, and
  reduced-motion behavior
- broken, open, disconnected, or visually weak clipped-corner frames
- dynamic counters whose width changes shift neighboring HUD content
- large unexplained empty regions or layouts permanently sized for a stimulus
  that is absent in the current question
- section-owned data rendered with a generic color instead of its semantic
  General, Verbal, Numerical, or Analytical color
- any state that passes geometry checks but remains visibly lower quality than
  its approved reference

Use bounding-box metrics to locate defects and screenshots to judge optical
quality. Passing overflow metrics alone never establishes parity. Compare the
implementation and reference at the same physical viewport using an overlay or
side-by-side contact sheet. Record panel-anchor, type-scale, icon-scale,
spacing, density, border-continuity, and color differences in a delta log.
Automated pixel differences may guide inspection but cannot replace optical
judgment.

Every screenshot and report must record the git commit or worktree fingerprint,
asset cache key, viewport, fixture/data state, and capture time. Any later code
or style edit invalidates affected evidence. Recapture the affected route and
rerun its interactions after the final edit.

## Independent Release Auditor

This auditor is opt-in. Run it only when the user explicitly requests an
independent release audit or the active ticket requires it. When invoked, run a
separate adversarial audit from the approved references, coverage manifest, and
working application. Do not begin from the implementer's claimed pass list.

The auditor must:

- test empty, partial, typical, dense, long-text, error, loading, and submitted
  data shapes where applicable
- inspect every coverage row and fail missing evidence
- compare generated contact sheets against the active references
- report defects before summaries and distinguish functional, reachability,
  parity, accessibility, and live-deployment findings
- reject stale assertions that encode retired behavior or omit newly approved
  behavior
- require a regression assertion for every user-reported reproducible defect
- rerun the complete affected matrix after repairs

The implementer may repair findings, but the final audit must start again from
the resulting build rather than inheriting the previous verdict.


## Browser targets and proportional verification

Primary target:

- latest stable Microsoft Edge
- 100% zoom
- `1536x736` content viewport

Only when the user explicitly requests a viewport matrix, include these legacy
desktop targets:

- 1920×1080
- 1536×816
- 1536×736 (the known maximized Edge content viewport on the primary PC)
- 1366×768

Use risk-based verification:

- Local component CSS: changed state and relevant interaction only
- Shared shell or major layout: affected routes at the primary viewport
- Motion sequence: focused timing/reduced-motion evidence only when motion is
  changed or explicitly requested
- Mobile/responsive: deferred until the user requests mobile work
- Deployment: one workflow result and one live cache-key HTTP check

Do not run a viewport matrix unless the user explicitly requests it.

## Testing

Run existing relevant tests. Never claim verification that was not run.

Do not rerun an unchanged check after it passed. Rerun only when relevant files,
data, configuration, or merge results changed afterward.

Trigger checks from the diff:

- Documentation/workflow/package-script only: parse changed structured files
  and assert the intended workflow commands; no app or content QA.
- CSS or visual markup only: inspect the affected local state and interaction at
  `1536x736`; do not validate the question bank.
- Application JavaScript: `npm run check` plus focused tests for changed logic.
- Question-bank loading, version order, answer mapping, scoring, manifests, or
  question content: `npm run validate:data`.
- Question text, choices, answers, explanations, difficulty, provenance, or
  metadata: also run `npm run audit:questions`.
- Paper scanning, paper timer/attempt flow, OMR classification, paper scoring,
  or paper submission: `npm run qa:paper` plus focused syntax/interaction checks.
- Supabase schema, policies, auth, or persistence: focused persistence and RLS
  verification, including cross-user denial where applicable.
- Full interaction, screenshot, motion, mobile, viewport-matrix, and independent
  audit suites: only when explicitly requested.

Playwright tests should use user-visible behavior, resilient locators,
deterministic fixtures, and isolated state. Capture video or trace for
meaningful motion or timing behavior.

Interaction harnesses must declare their expected check names before execution.
Duplicate names, missing names, unexecuted checks, and unexpected checks fail
the run. Optional product behavior must be labeled explicitly and cannot count
toward required coverage. A test that uses automation-assisted scrolling may
verify DOM behavior but must be labeled `functional`, never `reachability`.

Reference and test manifests must be checked for drift. Retired behavior must
be removed from both; newly approved behavior must have coverage before release.
Purposeful motion is verified with timing evidence and reduced-motion evidence,
not by asserting that all active animations equal zero.

Cross-user access bugs are release blockers.

## CI and deployment

If `.github/workflows/` exists, GitHub Actions is canonical. Otherwise, keep
commands provider-neutral and do not invent CI unless requested.

For deployment:

- GitHub Pages serves static assets only.
- Secrets cannot be hidden in browser code.
- Cache-bust changed assets when necessary.
- Do not install a validation runtime or repeat question validation in the Pages
  deployment workflow.
- Inspect one deployment result after push.
- Verify the live page and changed cache-busted asset once over HTTP.
- Do not replay local functional or visual tests against production unless the
  user explicitly requests live QA.

## Definition of done

A ticket is complete only when all applicable conditions are true:

- scope is satisfied
- product, exam, content, persistence, security, and accessibility invariants
  remain intact
- relevant docs are updated
- required verification actually ran
- targeted visual evidence exists when the change is visual
- changed motion has focused timing and reduced-motion evidence
- Supabase security changes have policy verification
- incomplete areas are explicit
- the report lists commands, outcomes, artifacts, risks, and follow-ups
- any explicitly requested coverage manifest has no failed, blocked, skipped,
  or unexecuted required rows
- separate functional, reachability, parity, and live verdicts are required only
  for an explicitly requested full audit
- evidence identifies the final tested build and cache key
- an independent final audit ran only when explicitly required

Do not say "done" when required verification was skipped, blocked without being
reported, or replaced with assumption.
