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
```

Default local URL:

```text
http://127.0.0.1:4173/index.html
```

Do not install packages directly inside the Google Drive workspace. Use the
repository's existing local-only scripts and dependency location.

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

For UI, layout, styling, responsive, screenshot-parity, or mockup work:

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

For generated-image or screenshot adaptation, follow
`docs/Generated_Image_To_UI_Playbook.md` when available and relevant.


## Manual Edge State and Interaction Agent

Use this agent for any change that can affect a route, control, layout, scroll
owner, modal, menu, state transition, or deployed UI.

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

A UI ticket is not complete when external Edge control is unavailable, the
window was not maximized, screenshots were not saved, any interaction was
skipped without a risk-based reason, or the last code change was not
recaptured. Report the exact incomplete portion instead of claiming success.

## Visual Parity Quality Agent

For screenshot or generated-image parity, use the active reference version
named by its manifest. V5 is the active reference for states that have an
approved V5 image; the V4 Study Hub remains authoritative only where its
manifest or ticket explicitly says so.

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
- any state that passes geometry checks but remains visibly lower quality than
  its approved reference

Use bounding-box metrics to locate defects and screenshots to judge optical
quality. Passing overflow metrics alone never establishes parity.


## Browser targets and proportional verification

Primary target:

- latest stable Microsoft Edge
- 100% zoom
- maximized window

For shared-shell or major layout work, verify:

- 1920×1080
- 1536×816
- 1536×736 (the known maximized Edge content viewport on the primary PC)
- 1366×768

Use risk-based verification:

- Local component CSS: changed state, primary viewport, relevant interaction
- Shared shell or major layout: full desktop viewport matrix
- Motion sequence: video or trace plus reduced-motion check
- Responsive change: relevant mobile viewport
- Deployment change: local checks, deployed smoke test, asset freshness

Do not force the full viewport matrix for trivial non-layout changes.

## Testing

Run existing relevant tests. Never claim verification that was not run.

Preferred order:

1. syntax, data validation, or lint
2. focused unit tests
3. Playwright for changed routes and states
4. visual evidence for UI changes
5. persistence and RLS verification for Supabase changes
6. full relevant regression suite

Playwright tests should use user-visible behavior, resilient locators,
deterministic fixtures, and isolated state. Capture video or trace for
meaningful motion or timing behavior.

Cross-user access bugs are release blockers.

## CI and deployment

If `.github/workflows/` exists, GitHub Actions is canonical. Otherwise, keep
commands provider-neutral and do not invent CI unless requested.

For deployment:

- GitHub Pages serves static assets only.
- Secrets cannot be hidden in browser code.
- Cache-bust changed assets when necessary.
- Verify deployed asset versions.
- Run a deployed smoke test after deployment-related changes.

## Definition of done

A ticket is complete only when all applicable conditions are true:

- scope is satisfied
- product, exam, content, persistence, security, and accessibility invariants
  remain intact
- relevant docs are updated
- required verification actually ran
- visual evidence exists for visual work
- meaningful motion has timing evidence
- Supabase security changes have policy verification
- incomplete areas are explicit
- the report lists commands, outcomes, artifacts, risks, and follow-ups

Do not say "done" when required verification was skipped, blocked without being
reported, or replaced with assumption.
