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
