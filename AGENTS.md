# CSC Reviewer Project Instructions

Follow the documentation-first workflow for this project.

## Working Loop
- Work one ticket at a time from `docs/Tickets.md`.
- Before implementation, read `docs/Repo_Current_State.md`, the active ticket, and any design sections referenced by the ticket.
- Keep changes scoped to the active ticket unless a blocker requires a small supporting change.
- After every ticket, update:
  - `docs/Repo_Current_State.md`
  - `docs/Known_Issues_And_Followups.md`
  - `docs/Tickets.md` if status or follow-up tickets changed
- End each completed ticket with a short report containing summary, files changed, commands run, verification, risks, and follow-ups.

## Product Guardrails
- This is an independent Civil Service Exam reviewer app. Do not imply CSC affiliation, endorsement, or use of official leaked materials.
- Preserve visible disclaimers in user-facing surfaces and content docs.
- The Professional mock exam target is 170 items with a 3 hour 10 minute timer.
- Use browser local storage in the current runnable app. Supabase Free is the planned hosted backend once credentials/auth/RLS are configured.
- Store exam progress live so a browser close, power interruption, or pause/resume does not lose meaningful work.
- Treat names, emails, answers, scores, and timing data as private user data.
- Do not install `node_modules` or package dependencies inside this Google Drive workspace. Use the local-only scripts in `scripts/`.

## Content Guardrails
- Use the 29 provided images as the initial source for direct digitization.
- Every question must receive a topic, subtopic, source page, answer choice, and review status before being used in the app.
- Web research must prefer official CSC sources for exam scope and timing.
- If content is uncertain from image quality, mark it as `needs_review`; do not guess silently.

## UI Guardrails
- Build the actual exam experience first, not a marketing landing page.
- Keep the interface quiet, focused, readable, and exam-like.
- Support answer selection, skip/revisit, pause/resume, timeout submit, and post-exam statistics.
- Use small animations only where they support the exam-results experience.

## Ponytail Guardrail

Use Ponytail discipline for all implementation work in this project. Ponytail means the laziest solution that actually works: understand the real flow first, then prefer deletion, reuse, native browser/CSS features, and the smallest root-cause diff over adding new layers.

- Remove wrong styling before adding compensating styling.
- Reuse existing markup, icon helpers, CSS tokens, fixtures, and QA scripts before creating new structures.
- Do not add a dependency for fonts, icons, backgrounds, layout, or QA if native CSS/SVG or existing assets cover the need.
- Fix the shared cause once instead of patching each visible symptom separately.
- Keep changes scoped to the active ticket and avoid speculative abstractions.
- For UI repair, Ponytail does not mean low quality. It means the shortest path to screenshot parity: fewer overrides, fewer containers, fewer invented components, and browser screenshots after each meaningful change.

## Frontend Screenshot Loop Agent

Use this mandatory loop for any frontend, UI, styling, layout, state-image, or screenshot-parity work. This is based on the Codex frontend-design workflow discussed in https://www.reddit.com/r/codex/comments/1ujqm5t/any_tips_for_good_codex_frontend_design/: implement from a concrete mockup/reference, take screenshots, compare the screenshots to the target, then iterate until the screenshots match instead of relying on code inspection or subjective claims.

- Start from concrete visual references: `states/` images, Stitch/Impeccable output, generated mockups, or user-provided screenshots. If the reference is missing or ambiguous, state the ambiguity before coding.
- Before editing, map the target state: layout grid, spacing, typography, colors, icons, button positions, scroll behavior, hover/focus/active states, and responsive constraints.
- After each meaningful UI change, run the app in a browser and capture screenshots of the changed state. Do not declare UI work done from CSS/HTML inspection alone.
- Compare captured screenshots against the reference and write down specific visual differences: overflow, clipped text, bad spacing, wrong hierarchy, wrong color, bad alignment, missing icons, incorrect scroll position, or mismatched interaction state.
- Fix the differences and repeat the screenshot loop until there are no obvious visual defects for the target viewport.
- For PC-priority work, test a maximized desktop browser first, preferably the user's requested browser. Mobile is secondary unless the active request says otherwise.
- Before any PC-view screenshot, verify the captured browser window is maximized. If the screenshot dimensions show a windowed browser, maximize the browser and retake the screenshot; do not use windowed captures for desktop visual QA.
- For long pages or modals, capture multiple screenshots while scrolling. A state with hidden lower content is not verified by a single top-of-page screenshot.
- For interactive screens, press every relevant button/control and capture the resulting state: open/close, expand/collapse, selected/unselected, disabled, modal, error, empty, loading, and submitted states.
- Store QA screenshots under `qa/<date-or-ticket>-<browser-or-scope>/` and summarize the pass/fail findings. Screenshot artifacts do not need to be committed unless the user asks.
- If browser control is interrupted or screenshots cannot be captured, mark visual QA incomplete. Do not call the UI finished.
- If screenshots show an obvious visual defect, repair it before reporting completion, then rerun the affected screenshots.
