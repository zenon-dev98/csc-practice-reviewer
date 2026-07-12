# Generated Image To Production UI Playbook

Date: 2026-07-12

## Purpose

This is a portable workflow for turning generated UI images, Stitch output, screenshots, or other visual references into a production interface. It records the lessons from repeated desktop parity passes on the CSC Reviewer project.

The goal is not merely to make a page resemble a picture. The goal is to preserve approved product behavior, reproduce the approved visual system, handle real data, and verify every state in the actual target browser.

## The Two Approval Gates

Do not start implementation until both gates are explicit.

### Gate 1: Product And Content Architecture

Before visual copying, decide:

- What the page is for.
- What information the user needs to make the next decision.
- Which controls perform real actions.
- Which data belongs on this page versus another page.
- Which values are unique and which repeat the same fact.
- Which generated labels are jargon, placeholders, or fabricated data.
- Which empty, loading, error, partial, and populated states exist.

A visually strong generated image can still be a poor product screen. Do not spend a parity pass faithfully reproducing duplicated metrics, fake security claims, inert controls, impossible geometry, or unnecessary panels.

### Gate 2: Visual Reference Approval

After content is approved, decide:

- Which image/version is the active visual master.
- Which elements require exact parity.
- Which deviations are required by real data, accessibility, or product behavior.
- Which viewport, browser, zoom, and operating-system conditions define the primary target.
- Whether the desktop reference is responsive or a fixed logical canvas that scales uniformly.

Only then should the image become a hard implementation target.

## 1. Establish Source Authority

### Save References Immediately

Every approved generated image should be saved in the repository as soon as it is created:

```text
states/
  v4/
    home-empty.png
    home-active.png
    exam-default.png
    exam-graph.png
    results-pass.png
    manifest.md
```

Do not rely on chat history as the only copy of a reference.

### Keep A Reference Manifest

For each image, record:

| Field | Example |
| --- | --- |
| State ID | `results-pass` |
| File | `states/v4/results-pass.png` |
| Approval | Approved / Draft / Rejected |
| Canvas | `1672x942` |
| Target browser | Maximized Microsoft Edge |
| Browser zoom | `100%` |
| Required parity | Layout, typography, color, icons, geometry |
| Behavioral source | Existing production Results flow |
| Approved deviations | Real score data; no fabricated leaderboard |
| Notes | Internal list scrolling allowed |

### Use One Active Visual Version

- Name the active folder before editing.
- Never mix `states/`, `states/v2/`, `states/v3/`, and a generated chat image without an explicit hybrid decision.
- Older references may remain behavioral evidence but must not silently influence visual styling.
- If a new image supersedes an old one, mark the old one retired instead of leaving both apparently authoritative.

### Treat Generated Images As Fallible

Generated references often contain:

- Warped polygons or impossible corner geometry.
- Text that is misspelled, too small, or not actually inside its intended panel.
- Fake percentages, rankings, security claims, or records.
- Decorative colors that look like data but have no meaning.
- Inconsistent headers between screens.
- Controls that have no plausible interaction.
- Different component styles on each generated page.
- Beautiful empty space that collapses when production adds required fields.

Classify each questionable element as one of:

- **Exact visual requirement**
- **Behavioral requirement only**
- **Production-data substitution**
- **Accessibility correction**
- **Generated artifact to remove**
- **Unresolved product decision**

## 2. Inventory The Product Before Coding

### Map Every Route And State

Create a state register from code, not memory. Include:

- Default pages.
- Empty and zero-data states.
- Partially populated states.
- Heavily populated states.
- Loading, success, warning, and error states.
- Disabled and busy controls.
- Expanded and collapsed panels.
- Hover, focus, selected, pressed, and validation states.
- Modals, drawers, menus, popovers, and toasts.
- Mobile-only or desktop-only navigation.
- Route aliases that render the same page.

Count the states and compare the count with the fixture/screenshot harness. A state omitted from QA is still unverified even if it shares a route.

### Map Every Container

For each canonical page, list:

1. Container name.
2. All text and values inside it.
3. Every button/control.
4. Data source.
5. Empty/error behavior.
6. Scroll behavior.
7. Whether the information exists elsewhere.
8. Keep, merge, move, remove, fix, or decision status.

This prevents a redesign from becoming a visual rearrangement of the same clutter.

### Map Every Interaction

Record:

- What starts the interaction.
- What visual state follows.
- Whether focus moves.
- Whether Escape or backdrop click dismisses it.
- Whether data is saved.
- Whether a control is allowed in the current state.
- What happens with keyboard-only input.
- What happens after leaving and returning to the tab.

Do not infer interaction behavior from a still image.

## 3. Define The Target Environment Honestly

### Browser Window Is Not Screen Resolution

A 1920x1080 monitor does not provide a 1920x1080 web content viewport. Browser chrome, title bars, tabs, taskbars, bookmarks, and operating-system scaling reduce the usable area.

Record the actual content viewport from the maximized target browser. In this project, the maximized Edge content area included a `1536x736` target even though other fixture canvases were taller.

### Browser Rules

- Primary desktop QA runs at `100%` browser zoom.
- A page that only looks correct at `90%` is not correct.
- Verify the browser is maximized before taking a desktop reference screenshot.
- Record whether the bookmarks/favorites bar is visible.
- Record device pixel ratio and OS scaling when screenshots differ unexpectedly.
- Use the user's requested browser when one is specified.

### Choose A Desktop Layout Contract

Use one of these deliberately:

1. **Responsive composition:** proportions adapt across widths while preserving hierarchy.
2. **Uniform logical canvas:** one reference canvas scales by a single factor and is centered with ambient margins.

Never scale width and height independently. That distorts fonts, circles, icons, and spacing.

Do not apply uniform scaling as a shortcut if the reference is actually meant to reflow. Do not force reflow if the approved reference is a fixed cockpit/dashboard canvas.

## 4. Decompose The Reference Visually

### Establish Anchors Before Details

Measure and record:

- Header height.
- Left and right outer margins.
- Top and bottom whitespace.
- Primary column widths.
- Center gap.
- Major panel bounds.
- Repeated row heights.
- Baseline alignment between neighboring panels.
- Primary action location.
- Scroll region bounds.

Match these anchors before refining texture, shadows, or decoration.

### Match Proportions, Not Isolated Pixels

The entire composition must balance:

- Left margin versus right margin.
- Center gap versus outer margins.
- Top whitespace versus bottom whitespace.
- Left visual span versus right visual span.
- Panel padding versus gaps between panels.
- Text scale versus panel scale.
- Icon scale versus label scale.

Copying a card's raw width while ignoring the browser's wider canvas produces an obvious dead zone. Stretching that card to fill the dead zone produces an equally obvious distortion.

### Track Negative Space

Negative space is part of the design, but it must have a job.

Reject:

- Giant empty panel bottoms caused by fixed heights.
- Large blank areas beside short content.
- Controls compressed against an edge while another region is empty.
- Decorative filler used only because a generated image left a hole.
- Content spread across the viewport merely to avoid scrolling.

Prefer content-fitting panels, balanced grid tracks, and deliberate alignment.

## 5. Typography Rules

### Font Family Comes First

Match the font's shape before adjusting layout:

- Width/condensation.
- x-height.
- Weight.
- Italic angle.
- Numeral shape.
- Uppercase rhythm.

Do not compensate for the wrong font by changing card widths, letter spacing, or global font size.

### Define A Hierarchy

Set separate roles for:

- Product brand.
- Hero/page title.
- Card title.
- Section label.
- Primary value/numeric display.
- Body copy.
- Field label.
- Input text.
- Button text.
- Table text.
- Helper/metadata text.
- Status/chip text.

Each role needs an intentional family, weight, size, line height, and color.

### Judge Final Physical Size

Text that is readable on the native reference image may become too small after the logical canvas is scaled into the real browser viewport.

- Inspect at final physical size.
- Increase the logical font size when uniform scaling turns supporting text into a footnote.
- Never shrink all text globally just to fit a screen.
- Avoid viewport-width font scaling; use stable role sizes and responsive breakpoints.
- Letter spacing should remain `0` unless the reference explicitly requires otherwise.

### Text Is A Release Gate

Every visible string must be checked for:

- Clipping.
- Unwanted ellipsis.
- Bad wrapping.
- Collision with borders or rules.
- Collision with icons.
- Collision with clipped corners, notches, hatches, or pseudo-elements.
- Edge hugging.
- Tiny secondary copy.
- Wrong contrast or color weight.

## 6. Icon Rules

Treat icons as core layout elements, not decoration added at the end.

Match:

- Glyph meaning.
- Stroke versus fill style.
- Stroke width.
- Optical size, not only CSS width/height.
- Color role.
- Icon-plate shape.
- Baseline alignment.
- Gap to its label.
- Clearance from panel geometry.

Use one coherent icon family per interface. Custom HUD icons may be used for primary domain concepts; familiar secondary actions should use standard symbols.

Do not use tiny icons inside large plates. Do not enlarge a thin glyph until it looks weak and blurry. Do not manually draw replacements when an installed/local icon already matches.

## 7. Color And Data Semantics

### Define Color Roles Once

Example roles:

- Primary action/current: cyan.
- Numerical: blue.
- Analytical: green.
- General: purple.
- Practice/skipped/warning: amber.
- Error/flagged/destructive: red.
- Neutral surfaces: graphite and metallic gray.

Use the same role on every compatible page.

### Decoration Must Not Look Like Unexplained Data

Colored rings, nodes, bars, tracks, dots, and status lights need:

- A nearby label.
- A visible legend.
- Accessible text.
- Or removal.

Hover-only explanations are insufficient for essential meaning. Color alone cannot be the only state indicator.

Do not fabricate values to make a fixture look full. Use explicit `--`, `0`, `No data yet`, or fixture-only sample data that cannot leak into production.

## 8. Decorative Geometry And Safe Areas

Generated cockpit designs often use clipped corners, diagonal rails, hatch marks, connector lines, and layered borders. These are safe only when content has protected space.

### Geometry Rules

- Keep text and icons out of clipped corners and slanted edges.
- Reserve explicit padding for hatch regions and rails.
- Never let a decorative line pass through text, numbers, icons, or controls.
- Do not let adjacent clipped panels visually merge into one malformed polygon.
- Clamp notches and cuts so narrow responsive panels do not deform.
- Avoid `clip-path` on containers whose content height or width is variable unless the safe area is guaranteed.
- Do not use a giant arrow silhouette when the reference shows a framed button with layered edge details.
- Neighboring panels require a real gap even when their borders visually connect.

### Edge Clearance

- Controls and text need deliberate clearance from every edge.
- An item technically inside its box can still fail if it visually hugs the border.
- Use a minimum logical safe area as a QA metric, then judge it optically in screenshots.
- Content near a diagonal edge needs more clearance than content near a straight edge.

## 9. Information Density And Content Ownership

### One Fact, One Primary Representation

Avoid showing the same value as:

- A count.
- A percentage.
- A remaining count.
- A ring.
- A progress bar.
- A status card.

all on the same screen.

Choose the representation that best supports the current decision. Move historical analytics to Progress. Keep attempt-specific diagnostics on Results. Keep only active-run information on Home.

### Remove Decorative Jargon

Generated themes often add flavor labels such as `Mission Briefing`, `Run Protocol`, `Private Performance Telemetry`, or `Attempt Inspection`. Keep theme language only when it remains immediately understandable.

Prefer familiar task names:

- Mock Exam Setup.
- Exam Options.
- Practice.
- Mistakes.
- Flagged.
- Progress.
- Exam Results.
- Answer Review.

### Static Orientation For Mode Switches

When one page contains several modes, keep the mode selector visible and structurally stable. Switching modes should update a bounded workspace, not make the whole page appear to become an unrelated design.

## 10. Implementation Order

Implement in this order:

1. Approved information architecture and copy.
2. Shared page shell and navigation.
3. Typography and font loading.
4. Logical canvas/responsive contract.
5. Major anchors and panel bounds.
6. Primary content and controls.
7. Icons and color semantics.
8. Decorative geometry and texture.
9. Empty/loading/error states.
10. Interaction states.
11. Motion.
12. Mobile adaptation.

Do not start with color and decorative effects. A recolored, repositioned CRUD layout is not a redesign.

### CSS Discipline

- Remove obsolete styling before adding new styling.
- Consolidate shared tokens and shell rules.
- Fix the shared cause once.
- Do not pile override files on top of one another.
- Avoid state-specific magic numbers when a shared geometry rule exists.
- Use native CSS and SVG before adding dependencies.
- Wait for fonts before screenshots.

## 11. Scrolling And Viewport Fit

### No-Scroll Does Not Mean Good

A page can fit one viewport and still fail because:

- Text is too small.
- Controls are cramped.
- Cards are stretched.
- Empty zones dominate.
- Buttons hug edges.
- Lower content becomes unreachable when an accordion expands.

Never force everything into one viewport by globally shrinking the interface.

### Use The Right Scroll Owner

- If the approved desktop screen is one fixed viewport, keep document scrolling disabled.
- Give long lists, tables, question navigators, explanations, and modal bodies bounded internal scrolling.
- Keep scrollbars visually quiet, but do not remove scrolling itself.
- Reserve scrollbar gutter space so hover does not shift layout.
- Verify expanded content does not hide sibling sections.
- Mobile may use normal document scrolling even when desktop does not.

## 12. State Fixtures And Real Data

### Deterministic Fixtures

Fixtures should force visual states without replacing real behavior:

- New account/zero data.
- One active attempt.
- Barely populated history.
- Many attempts.
- Pass, fail, and practice results.
- Correct, incorrect, skipped, flagged, and unanswered items.
- Graph/table question.
- Expanded/collapsed navigator.
- Loading, error, success, timeout.
- Open menus, drawers, and dialogs.
- Long names, emails, prompts, and labels.

Fixture data must be visibly and technically isolated from production persistence.

### Test Real Data Shapes

Do not test only perfect fixture copy. Include:

- Longest plausible names and emails.
- Long words that cannot wrap naturally.
- Zero values.
- One record.
- Maximum expected records.
- Missing optional data.
- Different question lengths and choice lengths.
- Every section color/state.

## 13. Screenshot Comparison Loop

### Mandatory Loop

1. Open the target state in the target browser.
2. Confirm browser maximization and `100%` zoom.
3. Wait for fonts, data, and stable animation state.
4. Capture the screenshot.
5. Compare it with the approved reference.
6. Write concrete deltas.
7. Fix the deltas.
8. Recapture the affected state.
9. Repeat until no obvious defects remain.

Never declare parity from code inspection.

### Compare In Layers

Use this order:

1. Canvas and header.
2. Major panel bounds.
3. Alignment anchors and gaps.
4. Typography family and scale.
5. Content density and wrapping.
6. Icon shape and optical weight.
7. Colors and contrast.
8. Decorative geometry.
9. Hover/focus/selected/disabled states.
10. Motion and transition quality.

### Delta Log Template

```markdown
| State | Element | Reference | Actual | Required change | Status |
| --- | --- | --- | --- | --- | --- |
| home-active | Records footer | 24 px clear of action dock | Overlaps purple plate | Separate grid rows and add 16 px gap | Open |
| results-pass | Score label | Centered inside gauge | Touches inner ring | Add protected gauge inset | Fixed |
```

Avoid vague notes such as `spacing is off`. Name the element, direction, and consequence.

### Automated Metrics And Manual Judgment

Automated checks should measure:

- Document overflow.
- Element scroll versus client dimensions.
- Descendants outside parents.
- Unintended text truncation.
- Minimum edge clearance.
- Loaded asset/font versions.
- Console and page errors.

These checks cannot determine whether a page looks balanced, whether an icon feels weak, whether a panel is too empty, or whether a generated shape looks deformed. Manual screenshot inspection remains mandatory.

### External Browser Verification

Headless Edge/Playwright is useful for deterministic fixture sweeps. It does not replace a final pass in the user's external maximized browser when that is the declared target.

For long pages or internal scroll regions, capture multiple screenshots at meaningful scroll positions.

## 14. Interaction QA

Press every relevant control and capture the resulting state:

- Navigation destinations.
- Form Enter submission.
- Password visibility.
- Hover, keyboard focus, pressed, disabled, loading, success, and error states.
- Tabs/mode selectors.
- Accordion expand/collapse.
- Internal scrolling and scrollbar appearance.
- Answer, clear, flag, skip, previous, next.
- Pause/resume.
- Submit and review shortcuts.
- Chart expansion.
- Filters and no-match states.
- Menus and row actions.
- Account drawer and password panel.
- Destructive confirmation and cancellation.

Check that controls do not move, resize, overflow, or become obscured after interaction.

## 15. Motion Rules

Motion should communicate state, not cover weak layout.

Good uses:

- One-time gauge/progress fill.
- Soft saved/sync pulse.
- Short hover scan line.
- Small pressed response.
- Drawer/modal entrance.
- Results reveal.

Avoid:

- Continuous movement behind reading or exam content.
- Pulsing timers.
- Layout-shifting hover effects.
- Motion that changes element dimensions.
- Animations used to fill empty space.

Always support `prefers-reduced-motion`. Screenshot fixtures should be able to pause or stabilize animations.

## 16. Accessibility And Semantics

- Keep visible keyboard focus.
- Use real buttons, inputs, fieldsets, labels, tables, and dialogs.
- Trap focus inside blocking dialogs.
- Define Escape/backdrop behavior explicitly.
- Do not rely on color alone.
- Give charts text alternatives and readable value labels.
- Keep contrast strong at final physical scale.
- Do not hide essential meaning exclusively in hover tooltips.
- Preserve touch targets on mobile even if desktop controls are dense.

Accessibility corrections are approved deviations from a generated image.

## 17. Common Failure Modes Learned

### `Recolor And Reposition`

Changing colors and moving cards while preserving the old information architecture does not reproduce a new design.

### `Copy Raw Reference Widths`

Fixed widths copied from a smaller mockup leave dead space on a wider browser. Stretching the same widths destroys proportions.

### `Shrink Until It Fits`

Global shrinking creates tiny text, tight controls, and unused areas. Fit must come from architecture, responsive constraints, and correct scroll ownership.

### `Remove Scrollbars By Hiding Overflow`

This clips or makes content unreachable. Hide only scrollbar chrome when scrolling still works and remains discoverable.

### `Blindly Copy Generated Geometry`

AI-generated polygons can be impossible or malformed. Preserve the intended visual language with bounded, production-safe geometry.

### `Wrong Font, Endless Spacing Tweaks`

If the typeface is too wide, narrow, heavy, or round, spacing corrections will never converge.

### `Tiny Supporting Copy`

Metadata that looks acceptable on the source canvas may become unreadable after desktop scaling.

### `Decoration Through Content`

Lines, seams, hatch marks, and notches intersecting text are release blockers even when DOM overflow metrics pass.

### `Page-By-Page Header Drift`

Small independent edits cause brand, subtitle, nav, active markers, and account controls to shift between routes. Use one shared shell.

### `Duplicate Metrics Masquerading As Richness`

Showing the same progress in a ring, percentage, remaining count, checkpoint row, and performance ribbon creates clutter, not depth.

### `Automated Green Means Done`

Zero overflow and zero console errors do not prove visual quality.

### `Tested Before The Last Edit`

Any meaningful change after the final screenshot invalidates that evidence. Recapture affected states.

### `Live Site Still Uses Old Assets`

Cache-bust CSS/JS, verify the deployed asset URLs, then capture the live page. Local parity is not deployed parity.

## 18. Definition Of Done

A generated-image adaptation is done only when:

- Product/content architecture is approved.
- The active visual reference version is explicit.
- Every route and fixture is listed.
- Every relevant interaction state is listed.
- Shared shell geometry is consistent.
- Typography and icons match optically.
- Color semantics are defined and accessible.
- No text, icon, control, line, or panel collision remains.
- No button or text hugs a container edge.
- No unexplained data-like decoration remains.
- Empty, partial, and populated data shapes are checked.
- Desktop works at the real maximized target viewport and `100%` zoom.
- Mobile follows its declared responsive contract.
- Automated overflow/console checks pass.
- Manual screenshot comparison passes.
- External target-browser QA passes when required.
- The final deployed, cache-busted build is verified live.
- The last meaningful edit is included in the final evidence.

## 19. Portable Project Checklist

Copy this short checklist into a new project's `AGENTS.md` and link back to the full playbook:

```markdown
- Approve information architecture before visual parity work.
- Save and version every approved reference; name one active visual master.
- Inventory every route, data state, modal, and interaction before coding.
- Record target browser, actual content viewport, zoom, and scaling contract.
- Match shell, anchors, typography, and proportions before decoration.
- Treat text/icon containment, safe areas, and line collisions as release gates.
- Reject unexplained data-like decoration and duplicated metrics.
- Use one shared header/navigation geometry across compatible pages.
- Test empty, partial, full, long-text, loading, error, and disabled states.
- Screenshot, compare, log deltas, repair, and repeat after every meaningful change.
- Use automated geometry checks and manual visual judgment.
- Verify the final cache-busted build in the real target browser at 100% zoom.
```
