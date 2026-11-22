# UI/UX audit, 2026-11-22

Scope: every signed-in game-style screen (`gx*` in `app/app.js`, `app/game.css`): home, setup (screen and paper),
practice (builder, mistakes, flagged, empty), progress (full and empty), results (passed, failed, practice, paper),
review, account drawer, exam pop-ups (pause, submit, timeout), practice feedback, paper exam/scan/confirm, and the
exam question types (plain, analogy, ordering, figure series, figure analogy, number sequence, passage, table,
bar chart + table, line chart, long choices). 33 screens at 390x844 (phone, touch) and 1536x736 (desktop),
headless Edge, dark theme; light theme spot-checked on the changed screens.

Lenses applied: UX (hierarchy, dead space, primary-action placement), accessibility (target size, text size,
names, color-only state), frontend (overflow, flex/grid sizing, cascade conflicts), polish (labels that wrap,
chart legibility).

Evidence:

- `before/` and `after/`: one screenshot per screen and viewport, `metrics.json` (sideways overflow, targets under
  24px, text under 12px, runtime errors), and contact sheets `_sheet-*.png`.
- `capture.cjs` (capture + metrics), `sheet.cjs` (contact sheets), `light.cjs` (light theme spot check).
- `ux-check-run/`, `motion-run/`, `paper-mode-run/`: output of the regression suites on the final build.

## Findings, most severe first

| # | Severity | Screen | Finding | Fix |
|---|---|---|---|---|
| 1 | High | Review, phone | The page scrolled 48px sideways; choices, "Your answer"/"Correct answer" notes and the Wrong/Correct tag were cut off at the right edge. Cause: `.gx-review-main { align-items: flex-start }` overrode the stacked layout's stretch, so the question column grew to its widest line. | Removed the rule; `.gx-main` already aligns to the top side by side. |
| 2 | High | Progress, score history (both) | Y-axis labels clipped to "0%" on phones, the top value label ("100") cut off, all scores squashed into a flat line along the top because the axis always started at 0, and the in-chart "80% pass" label collided with point labels. | `gxScoreChart`: axis floor follows the data (10+ points under the lowest score and the pass line), wider left/top padding, points inset from the axis, in-chart pass label dropped (the card head already says "Pass line 80%"). |
| 3 | High | Time's up dialog | The clock icon was invisible: `.gx .is-warn` recolored the icon to the same orange as the badge. | `.gx .gx-modal-badge.is-warn` keeps the icon dark. |
| 4 | Medium | Results, perfect run | Primary button read "REVIEW 0 MISTAKES". | Reads "REVIEW ANSWERS" when every item is correct. |
| 5 | Medium | Results hero, phone | About 120px of empty space under the stats: `.gx-hero-text { flex: 1 1 260px }` became a fixed height once stacked. | `flex-basis: auto` on phones. |
| 6 | Medium | Results, phone | The next step (Review mistakes, Practice weakest, Retake) sat below two long cards, about two screens down. | Action row moved directly under the hero on all viewports; the main action takes its own full row on phones so its label stays on one line. |
| 7 | Medium | Line-chart stimulus (both) | First and last value labels collided with the y-axis tick labels (for example "12000" over "12000") and clipped at the right edge. | `gxLineChart`: points inset 34 units from both ends. |
| 8 | Low | Empty states, phone | "START MOCK EXAM" wrapped onto two lines inside its button. | Empty-state buttons stack full width on phones. |
| 9 | Low | Practice builder, mock setup (desktop) | The shorter card stretched to its neighbour's height, leaving dead space under the content. | `form.gx-split, form .gx-split { align-items: flex-start }`. |
| 10 | Low | Figure series, phone | Four frames plus the "?" did not fit one row; the blank wrapped alone onto a second row. | Phone frames size to `min(68px, (100% - 24px) / 5)`. |
| 11 | Low | Results (passed), phone | Confetti added up to 63px of sideways scroll width while it played. | `.gx-pagebody { overflow-x: clip }` (clip, so sticky headers are unaffected). |
| 12 | Low | Account drawer, paper confirm | "(used to sign in)" rendered at 10.8px; paper item status ("Blank", "Faint mark") at 11px. | 13px and 12px. |
| 13 | Low (a11y) | Review | The question strip had `aria-label` on a plain `div`, which screen readers ignore. | `role="group"`. |

Checked and left as is: phone table headers stay at 11.5px (12px made the 5-column v20-q159 table scroll 9px
sideways, which the no-sideways-scroll rule outranks); the collapsed paper step labels use `font-size: 0` on
purpose (the numbers stay visible, the text stays readable by screen readers); visually hidden radio/checkbox
inputs inside cards are flagged by the metric script but are labelled by their cards.

## Verification on the final build

- `qa/2026-11-22-ux/ux-check.cjs`: 0 failing of 128.
- `scripts/qa-motion.cjs` (CSC_QA_URL=http://127.0.0.1:4174/): 13/13.
- `scripts/qa-paper-mode.cjs` (same URL): 31/31, 0 runtime errors.
- `npm run check`: pass. `npm run validate:data`: pass (20 versions, 3,400 questions). `npm run audit:questions`: 0 blockers.
- Audit metrics after the fixes: no sideways overflow on any of the 66 screen/viewport pairs, no runtime errors.
- Cache keys: `game.css?v=20261122-02`, `app.js?v=20261122-04`.

Not covered: a visible (non-headless) Edge window or a real phone, live deployment (nothing was pushed), 200% zoom,
and a screen-reader pass.

## Second pass (same day): the three follow-ups and one more phone defect

| # | Severity | Screen | Finding | Fix |
|---|---|---|---|---|
| 14 | Medium | Passage/chart panels, phone and tablet | A stacked panel gave no cue that the passage continued below its edge. | `gxStimMore` sets `.has-more` while content remains below (run after every render and on panel scroll); the panel fades out over its last 56px until the end is reached. |
| 15 | Medium (a11y) | Review filter, Practice tabs, Progress run filter, chart measure switch | `role="tablist"`/`role="tab"` without arrow-key movement or tab panels. | Now a named `role="group"` of buttons with `aria-pressed`, which matches how they behave (Tab moves between them). |
| 16 | Low | Exam, desktop | Choices spanned about 1,100px while the ordering list and analogy tiles stopped at 820px. | The question column is capped at 920px and centred side by side; the separate 820px caps were removed so prompt, tiles, list and choices share one edge. |
| 17 | Medium | Exam header, 375px phones (iPhone mini/SE) | Pause wrapped onto a row of its own, pushing the question down by about 60px. | At 400px and below the header uses 44px buttons, an 8px gap and a tighter timer, so it stays on one row. |

While verifying #16 a regression was caught and fixed before release: `margin-inline: auto` on the question column
cancels the stacked layout's stretch (same cause as #1), so the centring applies only at 1181px and wider.

Verification of the second pass: checked in the app's built-in browser at 375x812 and 1536x736 (no sideways
overflow, header on one row, fade on and then off at the end of the passage, `aria-pressed` states correct).
Playwright could no longer launch Edge after the Edge 158 update installed at 12:25 local time (Edge exits at
once with code 0), so the suites ran by attaching Playwright to a separately started headless Edge over its
debugging port (a shim outside the repo, `chromium.launch` -> `connectOverCDP`); results are below.


Second-pass suite results (final build, via the CDP shim):

- `ux-check.cjs`: 0 failing of 128. A first attempt without `--hide-scrollbars` (which Playwright normally passes)
  showed 46px of table overflow on v20-q159; classic scrollbars took width from the panel. With the flag, as in a
  normal Playwright launch, and in the app's browser at 390px, the table fits.
- `qa-motion.cjs`: 13/13. `qa-paper-mode.cjs`: 31/31, 0 runtime errors. Both finished their checks and then hung
  on exit because of the shim's close, so they were stopped by hand after printing their results.
- `npm run check`: pass. Question data was not touched in this pass.
