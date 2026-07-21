# Temporary V5 Parity Rework Decision Log

Status: requirements discussion only

Last consolidated: 2026-07-17

This is a temporary, detailed decision log for the next UI, behavior, audio,
and QA rework. It is not an implementation ticket and does not claim that any
item below has already been completed.

## Purpose

- Preserve every decision from the current clarification loop.
- Separate approved requirements from recommendations and unresolved choices.
- Prevent later implementation from silently simplifying or omitting a state.
- Keep the V5 references authoritative instead of producing merely inspired
  approximations.

## Reference authority

- `states/v4/study_hub.png` remains the signed-in shell master where the V5
  manifest says it is authoritative.
- `states/v5/manifest.md` defines the approved V5 state set.
- Desktop priority is maximized Microsoft Edge at 100% browser zoom.
- V5 geometry, hierarchy, typography, icon weight, color semantics, border
  construction, density, and state meaning are required unless this document
  explicitly approves a deviation.
- Live data may change text and values, but must not collapse or distort the
  approved composition.

## Current baseline that must not be mistaken for the target

### Audio currently present

The repository currently contains only:

- `app/assets/audio/ambient-airy.mp3`: one looping ambient music track.
- `app/assets/audio/ui-activate.mp3`: one general interface effect.
- `app/assets/audio/result-complete.mp3`: one result-completion effect.

These files came from the CC0 Dark Sci-Fi Audio Pack and are documented in
`app/assets/audio/LICENSE.md`.

The present one-track/one-general-effect behavior is not the approved target.
`ambient-airy.mp3` is confirmed retired from all user-facing music choices. It
must not appear as a third category or play automatically. The file may remain
temporarily only as a legacy source-controlled asset until the replacement
audio pass removes it deliberately and updates the license manifest.

### Planned first complete audio library

Approved library for a three-hour exam: 12 music tracks total.

- 6 instrumental cafe-jazz tracks.
- 6 classical tracks mixing solo piano and light chamber music.

Rationale:

- Six tracks per category makes Shuffle meaningful and reduces obvious repeats.
- Target 55-75 minutes of unique program material across the 12 tracks. That is
  enough to loop unobtrusively during a 3:10:00 exam when Shuffle uses a bag
  that plays every track once before refilling and prevents the same track from
  playing twice in succession.
- Three hours of completely repetition-free music would require roughly 30-45
  normal-length tracks and would create an unnecessarily large GitHub Pages
  payload. The 12-track target is the better quality/size compromise.
- Use gentle transitions and consistent loudness so a category can repeat two
  to four times without abrupt changes becoming distracting.
- Tracks must be locally bundled so the reviewer does not depend on a third-
  party streaming service during an exam.
- Every asset must be CC0, public domain, or otherwise explicitly licensed for
  redistribution, modification, and static website use.
- Source, author, license, original URL, download date, and local filename must
  be recorded in the audio license manifest.

Planned effect families:

- Navigation.
- Answer selection.
- Confirmation/completion.
- Warning/error.

There will be no hover sound.

## Locked global visual requirements

### Continuous clipped-panel construction

The current open-corner appearance is a global component defect. It affects
nearly every page and must be repaired in shared visual primitives rather than
patched separately on each screen.

V5 still uses chamfered or clipped corners. The requirement is not to replace
them with ordinary square cards. Every clipped shape must instead have:

- A fully enclosed silhouette.
- A continuous border on every side and around every chamfer.
- No missing corner segments or visible holes.
- A background that fills the complete clipped shape.
- Consistent stroke weight across equivalent panels.
- Consistent chamfer size across equivalent components.
- Enough protected clearance that text, icons, and controls never touch the
  border, notch, rail, hatch, connector, or decorative line.
- Correct hover, focus, selected, disabled, warning, and error outlines without
  changing the component's outer geometry.

This repair applies to:

- Shared navigation and header containers.
- Upper-right account control.
- Account Settings drawer and all fields.
- Setup, Practice, Progress, Results, and Review panels.
- Active-exam shell, question navigator, question area, and choices.
- Buttons, segmented tabs, statistics, insight cards, and empty states.
- Pause, submit, timeout, chart, password, and destructive-action dialogs.

### Shared shell consistency

- Compatible signed-in pages retain the same brand lockup, navigation geometry,
  account control, typography, and background treatment.
- The shell must not appear to be independently redesigned on each route.
- The active exam remains focused and does not expose normal route navigation,
  but its brand treatment must still belong to the same visual system.
- Selected avatars replace initials in compatible header/account controls.
- Initials remain the fallback until an avatar is explicitly selected.

### Typography and spacing

- Physical readability at 100% Edge zoom is the standard, not just CSS pixel
  measurements.
- V5 display headings retain their intended condensed weight and scale.
- Long prompts and explanations use a readable face rather than an ornamental
  display face.
- Equivalent heading, label, value, body, and metadata roles use consistent
  sizes across pages.
- No header, label, value, icon, or control may touch an outer edge, divider,
  neighboring object, or decorative element.
- Related content is closer than unrelated content, but compactness must not
  become crowding.
- No blank region may be reserved only because another question or state may
  need a larger component.

## Active exam requirements

Reference masters:

- `states/v5/exam_active.png` for ordinary multiple-choice questions.
- `states/v5/exam_graph.png` for stimulus-based questions.
- `states/v5/practice_exam.png` for the practice player.

### Composition

- Ordinary questions use all content width available beside the question
  navigator.
- A passage, chart, graph, or table column exists only when the active question
  has that stimulus.
- Removing the stimulus must remove its grid track entirely; an invisible or
  empty placeholder is prohibited.
- The navigator and question panel use deliberate V5 proportions with no large
  accidental gutter between them.
- Headers, prompt, choices, and footer controls must occupy the viewport with
  V5-like density while retaining readable spacing.
- The action footer remains stable and reachable without being pushed by prompt
  or choice length.

### Stable exam HUD

- Mock Exam number, Time Left, and Answered use fixed-width HUD cells.
- The timer uses tabular numerals.
- Changing any timer or answered digit must not move another HUD label, divider,
  Pause button, or Submit button.
- Time displays as `H:MM:SS` for the full mock.

### Timer behavior

- The timer is based on an authoritative deadline and real elapsed wall-clock
  time, not on subtracting a fixed amount on every render.
- One real elapsed second equals one countdown second.
- Background-tab throttling must not create time gain or unexplained time loss.
- Refresh and resume reconstruct the same remaining time from persisted state.
- Pause freezes the deadline deliberately and Resume continues from the frozen
  remainder.
- Timeout uses the normal submission, scoring, and persistence path.
- Timer behavior must be tested in fixtures and a real standard attempt because
  accelerated fixture clocks must never leak into production attempts.

### Keyboard controls

- Main keyboard `1`, `2`, `3`, and `4` select choices A, B, C, and D.
- Numeric keypad `1`, `2`, `3`, and `4` perform the same actions.
- `Enter` activates Next only when an answer is selected.
- On item 170, `Enter` opens the Submit Exam confirmation after an answer is
  selected.
- `Enter` never bypasses the confirmation dialog or submits directly.
- Shortcuts do not fire while focus is in an input, textarea, select, account
  control, audio control, menu, or modal.
- Shortcuts do not conflict with modifier-key browser commands.

## Pause state

Reference: `states/v5/exam_pause.png`.

- The pause icon sits fully inside the modal and never intersects or clips
  against the modal's upper border.
- Title, supporting message, three facts, and actions follow the V5 vertical
  hierarchy.
- The supporting saved-progress message is vertically centered in its region.
- The three facts are Time Remaining, Current Item, and Sync Status.
- Resume Exam is primary; Save and Exit is secondary.
- Backdrop clicking does not dismiss the checkpoint accidentally.
- The real timer is frozen while the pause state is active.

## Account Settings and avatars

Reference: `states/v5/account_settings.png`.

Locked decisions:

- Restore the exact V5 roster of 20 animal avatars.
- Existing users retain initials until they choose an avatar.
- A selected avatar replaces initials across the signed-in header and account
  surfaces.
- Avatar selection is staged and persists only after Save Changes.
- Users may change the avatar later through Account Settings.
- Nickname becomes a separate persistent profile field.
- New-account nickname defaults to the first word of the supplied full name.
- Nickname remains editable.
- The header uses nickname; Account Settings retains full name and email.
- Email remains read-only in normal profile editing.
- Account Settings remains accessible from the upper-right account control.
- The drawer must include profile identity, avatar selection, nickname, full
  name, read-only email, audio, password, Save Changes, Sign Out, and Delete
  Account without turning the document into an unbounded page.

Audio controls will live in a bounded Audio section inside Account Settings.
A compact speaker control will remain available in shared headers.

## Audio behavior and controls

Locked decisions:

- Music defaults to Off.
- Music categories are Cafe Jazz and Classical.
- Classical is a mix of solo piano and light chamber music.
- Music and effects have independent volume controls.
- Audio includes Category, Track, Previous, Play/Pause, Next, Shuffle, Music
  Volume, Effects Volume, and Mute.
- Effects use separate restrained sounds for navigation, answer selection,
  confirmation/completion, and warning/error.
- Hovering never plays a sound.
- A compact speaker control appears beside Pause during an active exam.
- The active-exam audio popover must not navigate away from the exam.
- Selected music continues uninterrupted between compatible pages, during the
  active exam, and while the exam is paused.
- Browser autoplay restrictions are respected: playback begins only after a
  user gesture.
- The selected category, track, Shuffle state, mute state, and volume settings
  persist.
- Question answering never plays a correct/incorrect sound during an active
  exam because that would reveal answer correctness.
- Warning sounds must be rare and tied to meaningful conditions such as a save
  failure or imminent timeout, not routine navigation.

## Practice and Review

Reference shell: `states/v5/practice_review_mistakes.png`.

- Practice, Mistakes, and Flagged always remain visible in one static three-tab
  rail.
- The rail occupies the same position and geometry on all three states.
- Switching tabs changes only the content region below it.
- Practice uses amber, Mistakes uses red, and Flagged uses purple.
- Tab selection, counts, icons, and labels remain readable and do not shift the
  surrounding page.
- Practice content follows the approved builder behavior from
  `practice_review_practice.png`, adapted under the common shell.
- Mistake content follows `practice_review_mistakes.png`.
- Flagged content follows `practice_review_flagged.png`, adapted under the
  common shell.
- Mistakes and Flagged empty states use their corresponding V5 empty references
  while preserving the same header and tab rail.
- Empty states do not fabricate attempts, mistakes, flags, scores, or dates.

## Progress

References:

- `states/v5/progress.png`.
- `states/v5/progress_empty.png`.

- General Information uses purple for icon, label, bar, and percentage.
- Verbal uses cyan.
- Numerical uses blue.
- Analytical uses green.
- Section rows have deliberate vertical separation and cannot touch adjacent
  rows, dividers, headings, or panel edges.
- Summary statistics, score history, section accuracy, and attempt history use
  the approved V5 hierarchy.
- Empty Progress preserves the page composition without fake trend points or
  fabricated performance.

## Full mock results

Structural master: `states/v5/results_fail.png`.

- Both passing and failing full mock results use the same geometry.
- Failure uses red status treatment and needs-work language.
- Passing changes the status treatment to green and uses passing language.
- Cyan remains the standard interface accent in both outcomes.
- Score ring, section accuracy, timing/status facts, Run Insights, and footer
  actions remain in identical positions for pass and fail.
- Passing must not switch back to the separate `results_pass.png` geometry.

## Practice results

Structural master: `states/v5/results_practice.png`.

- Practice results retain their section-specific score, comparison, timing,
  and action structure.
- Practice results use the same dynamic six-slot Run Insight selection rules as
  full mock results, but draw from practice-relevant candidate insights.
- Repeat Practice repeats the same configuration.
- Change Practice returns to the practice builder rather than Mock Exam setup.

## Dynamic Run Insights

### Stable layout

- The results layout always reserves six insight slots.
- The six slots preserve V5 geometry and do not collapse to four or five.
- Completed attempts must never show blank cards, `--`, fabricated values, or
  generic No Data cards.
- An insight already shown prominently in the score, timing, or section panel
  should not be repeated unless it adds materially different interpretation.

### Why six cards remain valid without historical data

A completed attempt always has enough current-run facts to populate six cards.
Historical comparison is optional, not required. If a comparison is not valid,
the selector substitutes a current-attempt fact.

Safe current-attempt candidates include:

- Strongest section or topic.
- Weakest section or topic.
- Fastest question.
- Longest question.
- Fastest or slowest section.
- Longest correct streak.
- Answer-change impact.
- Skipped, unanswered, or flagged review load.
- Pacing or unused time.
- Completed every item.
- No skipped questions.
- Difficulty performance when sufficiently sampled.

Historical candidates include:

- Improvement or decline versus the previous comparable attempt.
- New personal best.
- Improvement in a previously weak section or topic.

### Full mock candidate priority

The selector should favor actionable and non-duplicative insights:

1. Weakest section or most-missed topic.
2. Strongest section.
3. Pacing or slowest section/question.
4. Answer-change impact.
5. Review load from skipped, unanswered, or flagged questions.
6. A valid comparison, streak, personal best, or positive completion fact.

### Practice candidate priority

1. Weakest topic in the selected section.
2. Strongest topic in the selected section.
3. Valid comparison with the previous comparable drill.
4. Difficulty performance with a sufficient sample.
5. Fastest or longest question.
6. Answer-change, skipped, incorrect, streak, or positive completion fact.

### Data-quality rules

- A topic or difficulty percentage requires at least three applicable questions.
- No improvement language appears without a comparable previous attempt.
- Comparability requires the same result family and a materially similar scope;
  a full mock is not compared to a ten-question drill.
- Ties use deterministic rules and do not randomly change after rerender.
- Legacy attempts missing timing telemetry use section, topic, answer-state,
  streak, completion, and review facts instead.
- Missing telemetry is never silently converted to zero.

## Answer Review

References:

- `states/v5/answer_review.png`.
- `states/v5/answer_review_empty.png`.

- Restore the populated left navigator instead of leaving a large dead region.
- Summary statistics retain the V5 scale and placement.
- The main question workstation balances question status, timing, prompt,
  choices, explanation, and per-question telemetry.
- Wrong choice uses red, correct choice uses green, and unanswered remains
  neutral.
- Section color semantics remain visible without overwhelming answer status.
- Explanation and telemetry must not collide or become unreadably small.
- Previous, Return to Results, and Next retain the V5 footer geometry.
- A filter with no matching questions uses the approved empty state and disables
  inappropriate navigation.

## Motion

Locked motion scope:

- Short tab/content transitions.
- Answer-selection glow or state transition.
- Modal reveal and dismissal.
- Progress interpolation when values become visible.
- Restrained hover, focus, and press feedback.

Motion rules:

- Motion must explain interaction or state change.
- No endless decorative pulse, bounce, floating element, or moving background
  that distracts from exam content.
- Prefer opacity and transform.
- Motion must not change layout dimensions or cause text/control movement.
- `prefers-reduced-motion` removes nonessential transitions and interpolation.

## Required QA and evidence

Implementation is not complete until all affected states are tested after the
last code change.

Required coverage includes:

- New account with no avatar and no data.
- Existing account before and after avatar selection.
- Nickname fallback and long nickname/full-name cases.
- Audio Off, each category, Previous/Next, Shuffle, mute, volume changes, route
  transitions, active exam, pause, hidden tab, and reduced motion.
- Full mock ordinary, long-prompt, long-choice, passage, table, bar, line, and
  grouped-chart questions.
- Timer over real elapsed time, pause/resume, refresh, hidden tab, reconnect,
  timeout, and stable HUD geometry.
- Keyboard main-row and keypad selection, disabled Enter, enabled Enter, final-
  item submit confirmation, modal focus, and editable-field exclusion.
- Practice, Mistakes, Flagged, and all corresponding empty states.
- Progress empty, partial, dense, and long-history states.
- Full mock fail and pass using the same geometry.
- Practice results with first-attempt and comparable-history insight selection.
- Answer Review populated and empty-filter states.
- Every clipped panel and control at required desktop and relevant mobile
  viewports.

Evidence requirements:

- Automated syntax, data, focused behavior, and interaction checks.
- Screenshot matrix at the required Edge desktop targets.
- Maximized external Microsoft Edge at 100% zoom.
- Saved screenshots after every meaningful state or interaction.
- Recapture after the final edit; old captures cannot verify a newer build.
- Cache-busted live deployment and live smoke replay before completion.

## Fresh 2026-07-17 full-state audit

This audit is evidence for the rework plan, not proof that the current visuals
pass. It deliberately separates functional checks from visual judgment.

### Evidence captured

- State matrix: `qa/2026-07-17-v5-rework-state-audit/`.
- State report: `qa/2026-07-17-v5-rework-state-audit/report.json`.
- 48 deterministic states captured at `1536x816` and `390x844`: 96 source
  screenshots total.
- 16 state contact sheets were generated in the same folder for comparison.
- Interaction matrix: `qa/2026-07-17-v5-rework-interactions-audit/`.
- Interaction report:
  `qa/2026-07-17-v5-rework-interactions-audit/report.json`.
- 49 automated interaction checks passed and produced 75 resulting-state
  screenshots. Five interaction contact sheets were generated in that folder.
- No browser or console failure was reported by either sweep.
- The automated geometry detector reported zero overflow and zero visual
  defects. Manual screenshot review disproved the usefulness of that result as
  a parity verdict. It did not detect undersized physical text, open panel
  corners, dead space, compressed hierarchy, label collisions, or unreadable
  mobile navigation. Future QA must never treat zero metric findings as a
  visual pass.

States captured were loading, configuration, fatal error, create account,
create loading, sign in, sign-in loading, forgot-password default/error/success,
Study Hub populated/empty, setup, active/collapsed exam, graph, passage, data
table, metric bars, line chart, multi-series line, multi-series bars, long
prompt, long choices, four expanded-stimulus modals, pause, submit, timeout,
Practice, Mistakes populated/empty, Flagged populated/empty, recent/progress
populated/empty, full-mock pass/fail, practice results, answer review
populated/empty, Account Settings, password expanded, delete account, and
delete attempt.

### What is functionally healthy and must not regress

- Sign-in Enter submission, visible keyboard focus, and quiet pointer focus.
- Question selection, clear, flag, skip, next, previous, and disabled-next
  behavior.
- Direct navigation to question 80, back to question 21, and mixed-navigator
  access to question 51.
- Question timing restoration across navigation.
- Pause, resume, review-unanswered, review-flagged, save-and-exit, submit, and
  results transitions.
- Passage, chart, line, and table expansion and closure.
- Practice customization, practice start, repeat drill, and change-practice
  routes.
- Mistake and Flagged review routes.
- Progress filters, row overflow, and delete-attempt confirmation/cancel.
- Answer Review filters, empty filter, previous/next, and explanation scrolling.
- Account Settings open/close, password visibility, audio toggle, and destructive
  confirmation behavior.

These behaviors passed the interaction suite, but their current visual
presentation remains subject to the repairs below.

### Global visual defects found

1. Panel geometry still uses thin borders with visibly open or missing clipped
   corners. V5 panels read as continuous manufactured frames; the current
   implementation reads as disconnected line fragments.
2. The signed-in pages are physically smaller and less legible than the V5
   references at the same target viewport. Large headings are close, but most
   labels, captions, icons, controls, and data rows are one or two type roles
   too small.
3. Icon plates are thin, flat, and visually weak compared with the heavier V5
   octagonal plates and luminous outlines.
4. Cyan is overused as a universal data color. Section-owned data must retain
   purple General, cyan Verbal, blue Numerical, and green Analytical treatment.
5. Several layouts use fixed-height containers without redistributing content,
   creating dead lower halves or large empty regions. Content density must be
   intentional per state rather than inherited from the largest possible state.
6. Equivalent shells do not yet maintain equivalent physical scale. Setup,
   Practice & Review, Progress, Results, Review, and settings all feel like
   separately reduced interpretations of V5.
7. No captured default state showed purposeful active motion. Motion still
   needs explicit implementation and video/trace verification; screenshots
   alone cannot prove it.
8. Decorative rails, notches, hatch marks, and clipped corners sometimes take
   space without strengthening hierarchy. Decoration must have a safe area and
   must never force text smaller.

### System and account-access states

- Desktop loading, configuration, fatal-error, create, and sign-in states are
  broadly coherent with the cockpit direction.
- At `390x844`, the loading title is clipped horizontally and the connection
  status row collapses into concatenated text.
- Mobile configuration and fatal-error headings extend beyond the viewport;
  the right side of the diagnostic card is visibly cut off.
- Mobile create and sign-in prioritize the marketing panel so heavily that the
  actual form begins below the first viewport. The form may scroll, but the
  primary account task needs to appear earlier on a phone.
- Forgot-password states remain readable, but their mobile modal body is too
  close to the viewport edges and must own its scrolling when errors expand.

### Study Hub

- Preserve the V4/V5 cockpit Study Hub composition, but repair the previously
  identified unclear ring legend, undersized supporting copy, and weak action
  panels.
- The multicolor completion ring needs an adjacent or hover/focus-accessible
  legend that explains each segment without colliding with the ring.
- The ordinary Resume control must match the engineered V5 button geometry;
  it must not become a solid arrow silhouette.
- The current main run panel still leaves a weakly used area beside the timer.
  Use that area for the four section checkpoints and save status rather than
  decorative emptiness.
- Records and bottom action panels must keep a full spacing token between their
  borders, labels, and neighboring actions. No Review panel may touch the
  `View Progress`/records footer.
- Mobile Study Hub needs a deliberate single-column information order; the
  progress ring, timer, section nodes, records, and bottom navigation currently
  compete inside one narrow viewport.

### Mock Exam Setup

- The current desktop setup is approximately one visual density step smaller
  than `states/v5/full_mock_setup.png`: icons, labels, values, toggles, section
  modules, and the primary button all need more physical presence.
- The four top facts are generic equal cells. V5 uses stronger icon plates,
  clearer value/label hierarchy, and more generous vertical separation.
- The section modules lack the V5 icon glow, colored edge ownership, and
  readable section-name scale.
- Toggle rows are too flat and their controls are too small for the panel.
- The Start button lacks the V5 double-frame depth and strong endpoint icon.
- Clipped corners remain open at the content-panel boundaries.
- At mobile width, setup content continues beneath the fixed bottom navigation;
  the bottom safe area and page padding must prevent controls from being hidden.

### Active exam and question types

- The exam HUD is undersized relative to `exam_active.png`, and the timer,
  answered counter, and title do not occupy stable equal-width cells.
- The timer requires tabular numerals and a fixed width large enough for
  `3:10:00`; no adjacent HUD item may shift as it counts down.
- The timer rate still requires a real elapsed-time audit. Static fixture values
  and navigation restoration do not prove one-second-per-second behavior.
- The current ordinary-question card places the footer correctly but leaves a
  large unused lower region for short prompts. It must use V5-scale prompt and
  answer rows, balanced answer spacing, and a calmer bounded remainder rather
  than shrinking the whole interface.
- Ordinary questions must not reserve a hidden stimulus column. The question
  card must expand into the full available content width whenever no stimulus
  exists.
- Stimulus layouts use a different internal scale from ordinary questions.
  Passage, table, and chart headings, descriptions, item chips, and expansion
  controls are too small compared with V5.
- The current desktop chart is materially smaller than the V5 chart and leaves
  value labels harder to compare. Charts need V5-size plot areas, labels, exact
  values, and clear series ownership.
- Stimulus footer actions move vertically between question types. The player
  needs one stable footer rail while only the owned content region scrolls.
- Sidebar nested groups are functionally reachable but visually dense. Stable
  five-column chips, bounded internal scrolling, clear group labels, and visible
  lower sections remain required.
- The visible sidebar scrollbar is heavier than the V5 treatment. Use a 4px
  rail or hidden scrollbar while preserving wheel, keyboard, and pointer scroll.
- Mobile exam HUD labels are extremely small and compressed between the brand
  and icon-only actions. The Questions control and Submit action need accessible
  names and stable target sizes.
- Mobile long prompts, long choices, and stimuli create pages between roughly
  938 and 1,588 pixels high. The bottom action rail must remain reachable and
  must not overlap the fixed navigation.
- Expanded graph/table/passage modals do not fit in one mobile viewport and need
  a clearly owned internal scroll area with a sticky title and Close control.
- The active-exam header still lacks the approved compact speaker control beside
  Pause.

### Pause, submit, and timeout

- The current pause panel places its circular pause symbol through the upper
  border. V5 keeps the symbol fully contained with deliberate breathing room.
- Desktop pause data cells are too small compared with V5; mobile labels collide
  into strings such as the frozen-time, checkpoint, and progress labels.
- The pause explanatory message is not optically centered in its band.
- Resume and Save-and-Exit should stack at V5 scale in the modal, not become two
  undersized side-by-side controls.
- Submit confirmation is functionally complete, but its desktop panel and four
  status cells are substantially smaller than V5. Counts and labels need a
  stronger hierarchy without becoming cramped on mobile.
- Mobile timeout copy is tightly stacked, and `Time Remaining`/`0:00` has weak
  separation. The synchronization state needs one clear progress treatment and
  a non-colliding recovery message.

### Practice and Review

- Keeping Practice, Mistakes, and Flagged permanently visible is correct and
  passed the interaction sweep. Their current tabs are still smaller and less
  integrated than the shared band in `practice_review_mistakes.png`.
- The Practice builder leaves unused lower/right space and uses compact controls
  rather than the V5 connected run-builder scale.
- The Mistakes summary rail and table are readable on desktop but physically
  too small. Column headers and rows need V5 spacing and stronger icon plates.
- Mistakes and Flagged empty states place a tiny icon and short text in a very
  large panel. Empty-state geometry should stay consistent, but the focal icon,
  copy, and actions must occupy a deliberate center group rather than look lost.
- The mobile Flagged populated fixture reaches about 5,649 document pixels. The
  queue must be a bounded internally scrolling owner or paged/virtualized list;
  a multi-screen unbounded stack is not acceptable.
- All three tabs need the same content-frame origin, heading baseline, summary
  rail height, and scroll ownership so tab changes do not feel like unrelated
  pages.

### Progress

- Current Section Accuracy uses white icons and cyan bars for every section.
  Restore purple General, cyan Verbal, blue Numerical, and green Analytical
  icon, label, value, and bar ownership from `states/v5/progress.png`.
- KPI cells, score chart, section tracks, and attempt rows are all smaller than
  the V5 reference.
- Chart value labels crowd the first data point in the populated fixture. Plot
  padding must reserve room for endpoint labels at 0% and 100%.
- `5 stored runs` wraps into an unintended two-line micro-label beside Attempt
  Records. It should be a single stable count or removed.
- Attempt row actions and overflow controls are too small for repeated use.
- The empty chart has a barely visible baseline and excessive unused area. Its
  empty composition should retain the panel but provide a readable `No attempts
  yet` focal state and primary action.

### Results

- Full-mock pass and fail currently share geometry, which is the correct
  behavioral direction, but the geometry is not yet `results_fail.png` parity.
- The current score ring, metric rail, section rows, and six insight cells are
  reduced, flatter versions of V5.
- Passing results must change the fail treatment to green while leaving cyan as
  the standard interface accent; the current pass ring is predominantly cyan.
- Run Insights currently look like a compact statistics table. V5 uses six
  individually framed, icon-led cards with enough room for a useful sentence.
- Mobile metric cells stack with touching bright borders and no group breathing
  room. They need tokenized gaps and a clear reading order.
- Practice Results currently reuse the compact full-mock structure. They must
  use `results_practice.png`: a practice-specific score block, comparison panel,
  six dynamic insights, and practice-specific actions.

### Answer Review

- The desktop navigator shows its heading and item range but leaves the lower
  rail blank in the populated fixture. V5 requires the full question/status
  matrix to remain visible and internally scrollable.
- On mobile, the same navigator collapses into concatenated header text and a
  dense wall of symbols. This is unreadable and is a release blocker.
- Summary KPI cells, prompt type, answer rows, explanation, and timing metadata
  are all smaller than `answer_review.png`.
- The current explanation and metadata are compressed into a shallow band,
  while the outer footer retains unused space.
- The no-match state leaves an oversized empty main area and disabled controls
  without enough contextual hierarchy.
- Mobile review should use filters plus a compact item list/drawer; it must not
  attempt to reproduce the full desktop status matrix at phone width.

### Account Settings and destructive dialogs

- The current Account Settings drawer has only an initials tile. The confirmed
  20-animal V5 avatar selector is completely absent.
- Nickname exists, but the profile summary and field scale are much smaller than
  `account_settings.png`.
- Current Audio UI exposes only an On/Off control and two sliders. It lacks
  Category, Track, Previous, Play/Pause, Next, Shuffle, Mute, and track status.
- The current drawer uses generic range inputs rather than V5-quality controls
  and does not show the compact header audio control state.
- Drawer and dialog borders still exhibit the global open-corner problem.
- Mobile Account Settings is long and places destructive actions below the
  initial viewport. The drawer must own scrolling and keep Close plus save state
  stable without hiding fields.
- Password and delete confirmations are functionally sound but physically
  smaller and flatter than their V5 references. Destructive target identity and
  final action must remain unambiguous after the visual rescale.

### Audio implementation findings

- The current one-track ambient implementation is insufficient for a 3:10:00
  run and is now retired from user-facing playback.
- The current app has one generic interface effect and one result effect, not
  the confirmed four effect families.
- The current audio UI does not provide a real playlist or track selection.
- The replacement library should use 12 local tracks, a no-repeat Shuffle bag,
  consistent loudness, and cross-page continuation after a user gesture.
- Audio QA must include uninterrupted route changes, active exam, pause, hidden
  tab, next/previous history, shuffle refill, mute, and preference restoration.

## Confirmed decisions from the clarification loop

- Existing accounts retain initials until avatar selection: confirmed.
- Restore exact 20 V5 animal avatars: confirmed.
- Selected avatar replaces initials after Save Changes: confirmed.
- Separate persistent Nickname field: confirmed.
- Nickname defaults to first word of full name: confirmed.
- Cafe category is instrumental cafe jazz: confirmed.
- Classical category mixes solo piano and light chamber music: confirmed.
- Existing sci-fi ambient track is retired from user-facing playback: confirmed.
- Twelve-track library with six Cafe Jazz and six Classical tracks: confirmed.
- Target 55-75 minutes of unique program material before a no-repeat shuffle
  bag refills: confirmed.
- Music defaults Off: confirmed.
- Separate music and effects volume: confirmed.
- Include Shuffle: confirmed.
- No hover sounds: confirmed.
- Four restrained effect families: confirmed.
- Audio section in Account Settings plus header control: confirmed.
- Active-exam audio popover beside Pause: confirmed.
- Music continues across pages, exam, and pause after user activation: confirmed.
- Six stable dynamic insight slots: confirmed.
- Three-question minimum for topic/difficulty percentages: confirmed.
- Full mock pass uses fail geometry with green status treatment: confirmed.
- Practice results retain `results_practice.png` geometry: confirmed.
- Main-row and keypad `1-4` shortcuts: confirmed.
- Final-item Enter opens confirmation and never direct-submits: confirmed.
- Short purposeful motion with reduced-motion support: confirmed.

## QA audit validity and required correction

The July 17 interaction report cannot be treated as proof that every tested
workflow was usable by a person. In particular, its More/Less block was guarded
by `if (await more.count())`. The fixture did not expose that control at the
point where the block ran, so the entire More/Less sequence and every assertion
inside it were silently skipped. The report still completed successfully and
did not identify the missing coverage.

The separate question-navigation test expanded the Verbal group and used
Playwright `scrollIntoViewIfNeeded()` before clicking questions 51, 80, and 21.
That proves those DOM nodes existed and that automation could force them into
view. It does not prove that a user could discover the controls, retain scroll
context, reach lower groups, or return naturally through the visible
navigator. Programmatic auto-scroll must not substitute for reachability QA.

Future release evidence must distinguish three independent gates:

1. Functional state correctness: the expected data and route change occurs.
2. Human interaction reachability: a user can find, reach, and operate the
   control through visible pointer, wheel, keyboard, and owned-scroll paths.
3. Optical parity and quality: screenshots match the approved reference in
   scale, spacing, typography, color, framing, and density.

The More/Less release path must start from the real collapsed state, visibly
open More, capture the expanded group, scroll by wheel through every lower
section, open question 80, return to question 21 without fixture reset, visibly
operate Less, and verify that scroll position is clamped sensibly and every
section remains reachable. Every intermediate state needs a screenshot. A
missing conditional control is a failed test, not a skipped optional branch.

The visual sweep also cannot establish V5 parity by itself. Its automated
checks cover a limited selector set, selected collisions, document overflow,
and a few component-specific geometries. It explicitly permits descendants of
owned scroll containers and performs no pixel/anchor comparison against V5,
no global minimum physical type/icon/control-size audit, and no evaluation of
border continuity or overall visual density. Headless Edge at a fixed viewport
is useful regression evidence, but it is not the required maximized external
Edge manual pass.

## Unresolved decisions for the next clarification loop

1. Should music and effect preferences remain browser-local, or synchronize to
   the signed-in Supabase profile across computers?
2. Should the header speaker control show only play/mute, or also expose current
   category and track name before opening the popover?
3. When Shuffle is enabled, should Previous return through the actual playback
   history or select another random track?
4. Should music resume at the same timestamp after refresh/reopen, or restart
   the selected track after the required user gesture?
5. Should imminent-time warnings play at fixed thresholds such as 30, 10, and
   5 minutes, or should warnings remain visual only?
6. Should the nickname be required, and what maximum length should it allow?
7. For full mock Run Insights, should Most-missed topic take precedence over
   Weakest section whenever at least three questions share that topic?
8. For a first practice drill with only one topic represented, which fallback
   should be preferred: pacing, longest correct streak, or answer-state facts?
9. On mobile Answer Review, should the item navigator open as a full-height
    drawer, or as a separate route above the selected reviewed question?
