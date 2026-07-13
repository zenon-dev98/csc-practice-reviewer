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
- When versioned mockup folders exist, such as `states/v2/`, identify the active target version before editing. Do not mix old and new state references unless the user explicitly asks for a hybrid.
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

## Mockup Adaptation Quality Rules

Use these rules whenever adapting generated mockups, Stitch output, screenshots, or `states/` images into the app. These rules come from the create/account auth repair work and are meant to prevent "technically fits, visually bad" implementations.

- Match proportions, not raw pixels. A mockup made for one canvas should be translated into proportional browser layout: balanced left margin, center gap, right margin, top whitespace, and bottom whitespace.
- Treat browser zoom honestly. The primary desktop target must work at 100% zoom in a maximized PC browser; a layout that only looks correct at 90% zoom is not done.
- Removing scrollbars is not enough. A no-scroll page can still fail if it creates huge dead zones, stretched cards, cramped controls, tiny text, or buttons hugging card edges.
- Keep visual spans comparable. If a left hero/info stack pairs with a right form/card, the visible start-to-end height of both sides should be close unless the mockup clearly shows otherwise.
- Preserve vertical rhythm. Titles, subtitles, labels, fields, primary actions, dividers, and secondary actions need intentional spacing; do not use giant elastic gaps or compressed bottom controls just to force a fit.
- Keep hierarchy obvious. Page titles, card titles, section labels, body copy, helper text, and button text must have clear size, weight, and color differences. A large heading can still fail if surrounding whitespace makes it read like ordinary card content.
- Copy the container model. If the mockup shows free-floating hero text, do not put it inside a large visible card. Use boxes only where the mockup uses boxes or where containment is required for real data.
- Match icon language optically. Icons should share stroke width, size, color, and visual weight. Feature icons can be larger and stronger; input icons should be visible but secondary; disclaimer/status icons should match their label scale.
- Check icon quality, size, and positioning as first-class parity items. Do not treat icons as decorative afterthoughts: compare the actual glyph style, stroke thickness, filled/outline treatment, color, circle/container treatment, alignment to text baseline, and spacing from labels/field edges.
- Check proportional spacing across the whole composition, not only inside one card. Outer margins, center gaps, top/bottom whitespace, card padding, row gaps, button clearance, and section spacing should feel balanced against each other and against the mockup.
- Match font family and typography style before tuning layout. If the app font looks heavier, narrower, rounder, or more condensed than the mockup, fix that instead of compensating with spacing.
- Match font sizes and line heights by hierarchy. Brand title, page headline, card title, labels, inputs, helper text, table text, chips, and buttons each need their own visual scale; do not globally shrink or enlarge text just to force a screen to fit.
- Match font colors and contrast roles. Primary headings, secondary copy, muted metadata, teal actions, warning/error states, borders, and placeholder text must use the same visual strength as the mockup; wrong color weight can make correct layout still look cheap.
- Do not hide production constraints. If real auth or data requirements add fields not present in the mockup, preserve functionality and rebalance the layout. If exact parity becomes impossible, state the structural reason and the cleaner product alternative.
- Prefer native/simple fixes. Use existing inline icon helpers, CSS, and current markup before adding assets, dependencies, wrappers, or new component systems.
- Test real data shapes. Check empty states, long names/emails, many attempts, answered/skipped/flagged states, expanded/collapsed groups, and disabled/error/loading states when the screen supports them.
- Check interaction states, not only default screenshots. Buttons that open, expand, collapse, reveal, submit, pause, skip, flag, clear, or switch views must have the resulting state visually checked.
- Use subtle internal scrolling for long lists. Page-level scrollbars are wrong for mockup states meant to fit one viewport; long navigators/lists may use bounded internal scrolling if it is visually quiet and does not hide primary actions.
- Cache-bust every deployed UI change. Live QA is invalid if the deployed page may still be serving stale CSS or JavaScript.
- Measure and inspect. Use browser metrics for overflow, dimensions, and asset versions, but still open screenshots visually; metrics catch containment problems while screenshots catch poor taste and proportion errors.
- Judge text at the final physical desktop scale, not only on the 1672x942 logical canvas. Supporting labels must remain comfortably readable at the 1536x816 and 1904x913 targets; increase their logical size when uniform scaling makes them look like footnotes.
- Treat line-to-text collisions as release blockers. Decorative rules, connector lines, panel seams, chart marks, and clipped corners must never pass through letters, numerics, icons, or controls, even when their bounding boxes technically fit.
- Treat text containment as a release gate. Inspect every visible label, value, paragraph, chip, button, and heading for clipping, wrapping, ellipsis, overlap, and collision with borders, notches, connector lines, icons, or neighboring controls.
- Enforce optical safe areas inside decorative geometry. Text and icons must stay clear of clipped corners, slanted edges, hatch regions, rails, and inner borders; increase the component's internal padding or change its geometry when content enters those areas.
- Reject edge-hugging compositions. Buttons, labels, and values need deliberate clearance from every container edge, and adjacent objects need enough separation to remain visually distinct at 100% zoom.
- Reject ambiguous decoration. Colored rings, nodes, tracks, and status marks must communicate a named state through nearby labels, a legend, or accessible hover/focus help. Decoration that looks like data but has no defined meaning must be removed or clarified.
- Compare bounding boxes as well as screenshots. The QA report must flag visible descendants outside their parent bounds, text intersecting decorative pseudo-element zones, controls with less than 8 logical pixels of edge clearance, and unintended text truncation.
- The visual agent must repair defects it finds and rerun the affected screenshots. A written observation without the corresponding UI correction is not a completed parity loop.
- Keep compatible page headers structurally identical. Brand mark, two-line product lockup, primary navigation, active marker, and account control may change state but not geometry between Study Hub, Full Mock, Practice & Review, and Progress.
- Size panels from their content and purpose. Never stretch a short label, four compact section summaries, a small form, or a single action into a large container merely to fill the viewport. Empty area must serve a deliberate visualization, reading, or focus purpose; otherwise reduce the panel, rebalance the grid, or move related content into the space.
- Reject forced compositions during screenshot QA. A panel fails when its visible content occupies only a small fraction of its area without a documented reason, when equal-height grid tracks create dead zones, or when spacing exists only to make the page fill the logical canvas. Prefer content-sized rows, proportional spans, and clearly separated groups.
- Keep the v4 Study Hub shell invariant across compatible signed-in pages: the same shield, two-line product lockup, four-tab navigation geometry, account control placement, fonts, background treatment, border language, corner cuts, and spacing rhythm. State-specific content may change; the shell may not drift.

## Generated Image Parity Agent

For any future generated-image, Stitch, screenshot, or mockup adaptation, read and follow `docs/Generated_Image_To_UI_Playbook.md`. The playbook is the long-form reusable source; the rules below are mandatory release gates for this repository.

- Use two separate approvals: first product/content architecture, then visual reference parity. Do not implement a visually attractive screen before deciding what information, controls, and states belong on it.
- Save every approved generated image under a versioned `states/` folder with its canvas, target browser, approval status, required parity, behavioral source, and allowed deviations. Name one active visual version and do not mix retired references into it.
- Treat generated images as fallible. Remove fabricated data, fake security claims, inert controls, warped geometry, unexplained color, inconsistent headers, and decorative jargon unless the user explicitly approves them.
- Inventory every route, fixture, alias, empty/partial/full state, modal, menu, error, loading state, and interaction before coding. Compare that inventory against the screenshot harness so no state is silently omitted.
- Record the real target environment: actual browser content viewport, maximized/windowed state, browser zoom, bookmarks bar, device pixel ratio, and desktop scaling contract. Monitor resolution is not browser viewport size.
- Choose responsive reflow or one uniformly scaled logical canvas deliberately. Never stretch width and height independently, and never require 90% zoom to make the page work.
- Match in this order: information architecture, shared shell, typography, canvas/anchors, major panel bounds, content, icons, color semantics, decoration, state variants, motion, then mobile.
- Match proportions across the entire composition. Outer margins, center gaps, top/bottom whitespace, panel padding, visual spans, and primary-action placement must balance together.
- Treat final physical text size as authoritative. A label that is readable on the source image but tiny after scaling must be enlarged logically; do not globally shrink typography to force fit.
- Treat icons as measured layout elements. Match glyph, stroke/fill style, optical weight, color, plate shape, baseline, label gap, and safe clearance.
- Give every data-like ring, node, bar, color, and status mark an explicit meaning through visible labels and accessible text. Remove decoration whose meaning cannot be explained.
- Protect content from clipped corners, notches, hatches, rails, pseudo-elements, and connector lines. Generated geometry must be rebuilt as bounded production-safe shapes when direct copying would deform or clip.
- Keep one primary representation of each fact on a screen. Repeated counts, percentages, remaining values, gauges, and bars are clutter unless they support different decisions.
- Use familiar task names unless thematic language improves comprehension. Do not let cockpit/game vocabulary obscure ordinary actions such as Mock Exam, Practice, Progress, Results, and Review.
- Fit content through architecture and correct scroll ownership, not global shrinking or hidden overflow. Fixed desktop pages use bounded internal scrolling; mobile may use normal document scrolling.
- Build deterministic fixtures for new, empty, partial, dense, long-text, success, error, disabled, open, closed, hover, focus, and submitted states. Fixture data must never leak into production persistence.
- Run both geometry checks and visual checks. Metrics catch overflow; screenshots catch poor proportion, weak icons, tiny text, malformed shapes, excess empty space, and bad hierarchy.
- Perform the screenshot loop in the real requested browser at 100% zoom. Headless screenshots supplement but do not replace final external-browser inspection when that is the target.
- Any meaningful edit after a screenshot invalidates that evidence. Recapture affected states, then rerun the complete release matrix after the last visual change.
- Cache-bust and verify the live asset versions before calling deployment complete. Local parity is not live parity.
