# T0026 State Content Audit And Simplification Brief

Date: 2026-07-12

## Purpose

This document inventories the complete visible product surface before another visual redesign. It separates required product information from repeated, confusing, decorative, or removable information. It does not authorize implementation by itself.

The future visual implementation must follow `docs/Generated_Image_To_UI_Playbook.md` after the decisions in this audit are approved.

The current fixture system exposes 37 named states. The earlier 36-state count omitted the `recent` fixture alias, which renders the same Progress route as `progress`.

## Classification

- **Keep:** required to understand or complete the current task.
- **Keep compact:** useful, but should not dominate the page.
- **Merge:** duplicates information shown elsewhere and should have one representation.
- **Move:** useful on another page, but distracting here.
- **Remove:** does not help a user make a decision or complete a task.
- **Fix:** required content with a visual, containment, wording, or interaction defect.
- **Decision:** needs product approval before the next mockup is generated.

## Complete State Register

| Area | Fixture states | Count |
| --- | --- | ---: |
| System | `loading`, `config`, `fatal` | 3 |
| Account access | `create`, `create-loading`, `select`, `signin-loading`, `forgot-password`, `forgot-error`, `forgot-success` | 7 |
| Study Hub | `dashboard`, `dashboard-empty` | 2 |
| Mock Exam Setup | `setup` | 1 |
| Exam player and blocking states | `exam`, `exam-collapsed`, `graph`, `chart-modal`, `pause`, `submit`, `timeout` | 7 |
| Practice and Review | `practice`, `mistakes`, `mistakes-empty`, `flagged`, `flagged-empty` | 5 |
| Progress | `recent`, `progress`, `progress-empty` | 3 |
| Results | `results`, `results-fail`, `results-practice` | 3 |
| Answer Review | `review`, `review-empty` | 2 |
| Account Settings | `profile-modal`, `password-expanded`, `delete-account` | 3 |
| Attempt deletion | `delete-attempt` | 1 |
| **Total** |  | **37** |

## Shared Product Shells

### Public Shell

| Container | Current contents and controls | Classification |
| --- | --- | --- |
| Header | Shield, `CSC Practice Reviewer`, `Independent mock exam and review tool`, invite-only indicator | Keep. Use exactly the same lockup, baseline, icon scale, and spacing on every public state. |
| Main frame | Loading, account access, or diagnostic content | Keep. |
| Bottom status rail | Independent reviewer, non-affiliation statement, secure storage | Keep compact. This is the correct place for the disclaimer; do not repeat it inside questions. |
| Toast layer | Success/error message | Keep. Must not cover primary actions. |
| Recovery dialog layer | Forgot-password form, error, success | Keep. |

### Signed-In Shell

| Container | Current contents and controls | Classification |
| --- | --- | --- |
| Header brand | Shield, two-line product lockup | Keep. Study Hub must use the same typography and subtitle as every other signed-in page. |
| Primary navigation | Study Hub, Full Mock, Practice & Review, Progress | Keep, but simplify naming after the decision table below. |
| Account control | Initials, account name, chevron | Keep. Opens Account Settings only. |
| Mobile navigation | Study Hub, Full Mock, Practice, Progress | Keep for mobile. Match desktop terminology. |
| Global modal/toast layers | Account Settings, destructive confirmations, messages | Keep. |

## System States

### Loading (`loading`)

| Container | Contents | Classification |
| --- | --- | --- |
| Background frame | Grid and four technical corners | Keep decorative, low contrast. |
| Identity block | Shield, private-network eyebrow, product name, subtitle | Keep compact. |
| Sync block | `Syncing reviewer data`, segmented loader, percentage, initialization copy | Keep. Percentage must represent real progress or become an indeterminate loader; a fabricated fixed `68%` should not ship in live mode. |
| Security block | Encrypted connection/AES-256, secure channel/TLS 1.3 | Remove or rewrite. These claims are decorative and may imply guarantees the browser app does not independently provide. A simple `Connecting securely` status is enough. |

### Configuration (`config`)

| Container | Contents | Classification |
| --- | --- | --- |
| Left status rail | Connection, Services, Data Access, Security | Keep compact for developer diagnostics. |
| Main diagnostic | Error code, brand, title, explanation, configuration sample, Reload | Keep. |
| Right metrics rail | Project URL, browser key, secrets exposed | Merge into the main diagnostic. The extra rail adds density without new action. |

### Fatal Error (`fatal`)

| Container | Contents | Classification |
| --- | --- | --- |
| Left status rail | Failed/unavailable/pending/standby states | Keep compact. |
| Main diagnostic | Error code, brand, readable error, technical details, Reload | Keep. |
| Right metrics rail | Availability, error rate, connections | Remove. `0%`, `100%`, and `0` are decorative restatements of failure. |

## Account Access States

The Create Account and Sign In screens are the current approved baseline. Their content architecture is already simple and should not be reworked merely to propagate the cockpit theme.

### Create Account (`create`, `create-loading`)

| Container | Contents and controls | Classification |
| --- | --- | --- |
| Left introduction | Private access pill, headline, one paragraph | Keep. |
| Left feature rail | Exam continuity, Private analytics, Targeted review | Keep. Three items are the maximum. |
| Form heading | Create Account, short subtitle | Keep. |
| Identity fields | Full Name, Email | Keep. |
| Password fields | Password and Confirm Password, eye toggles | Keep. Two columns on desktop. |
| Invite field | Invite Code | Keep. |
| Primary action | Create Account / Creating account | Keep. |
| Account switch | Already have an account? Sign in | Keep. |

### Sign In (`select`, `signin-loading`)

| Container | Contents and controls | Classification |
| --- | --- | --- |
| Left introduction | Returning reviewer, headline, one paragraph | Keep. |
| Left feature rail | Resume unfinished exams, View previous scores, Continue focused review | Keep. |
| Form | Email, Password, eye toggle | Keep. Pressing Enter must submit. Credentials must not be retained by the app. |
| Actions | Sign In, Forgot Password, Create account | Keep. |

### Password Recovery (`forgot-password`, `forgot-error`, `forgot-success`)

| Container | Contents and controls | Classification |
| --- | --- | --- |
| Recovery dialog | Email, Send Reset Link, Cancel | Keep. |
| Error state | Inline invalid-email or Supabase error | Keep. |
| Success state | Destination email, Return to Sign In | Keep. |

## Study Hub States

### Current Container Inventory (`dashboard`, `dashboard-empty`)

#### 1. Hero

- `Lock in. Keep moving.`
- `Welcome back, {first name}.`

Classification: **Keep compact.** It supplies personality but should not compete with the active task.

#### 2. Active Run Panel

- Run title (`Professional Mock 07`, `Focused Practice`, or default mock label)
- Four-color circular progress ring
- Four ring nodes
- Completed/total number in the ring center
- Five-entry legend: Verbal, Numerical, Analytical, General, Overall progress
- Time remaining or practice mode
- Three telemetry values: completion percent, remaining count, live/ready status
- Four section checkpoints with icon, state check, and answered/total
- Current checkpoint item
- Saved-online or versions-available status
- Resume Run or Start Full Mock action

Classification:

- **Keep:** run title, answered/total, time remaining, current item, saved state, one section breakdown, primary resume/start action.
- **Merge:** ring legend and section checkpoints. Both explain the same four colors. Use one labeled representation.
- **Merge:** completion percentage and remaining count with answered/total. Three mathematical forms of the same value are unnecessary.
- **Remove:** `Live/Ready status`; the button and saved state already communicate availability.
- **Fix:** `Numerical` is obscured because the five-entry legend has insufficient width beneath the ring.
- **Recommended vNext:** make the ring communicate overall completion only. Place four labeled section markers beside it, each with its own answered/total count. This removes the separate legend entirely and keeps color meaning visible without hover dependence.

#### 3. Your Records Panel

- Best Full Mock and personal-best percentage
- Numerical performance across completed attempts
- Fastest passing mock
- Open complete progress action

Classification:

- **Keep:** Best Full Mock.
- **Decision:** replace the arbitrary Numerical-only record with Latest Score or Completed Exams, which applies equally to every user.
- **Decision:** Fastest Pass is low-value for a small reviewer and encourages rushing; Average Score or Most Improved Section is more useful.
- **Keep:** Open Progress action, but shorten to `View Progress`.
- **Fix:** the purple Review Mistakes command currently intrudes into the records footer. These containers need separate bounded rows and a real gap.

#### 4. Mode Actions

- Full Mock / 170 items under exam conditions
- Focused Practice / Drill by section and difficulty
- Review Mistakes / missed and flagged counts

Classification:

- **Keep:** three stable destinations.
- **Rename:** `Mock Exam`, `Practice`, `Review` are more familiar and shorter.
- **Fix:** preserve one shared technical-card shape. Do not use three unrelated polygons or allow a plate to overlap the Records panel.

#### 5. Section Performance Ribbon

- Total questions completed
- Verbal, Numerical, Analytical, and General percentages
- Each section opens Practice

Classification: **Move to Progress or remove from Study Hub.** It repeats section checkpoints and records, adds a fourth competing information band, and makes the home screen feel like an analytics page.

### Recommended Study Hub Information Budget

The next mockup should contain only:

1. Compact greeting.
2. One active-run block: overall answered count, timer, current item, four labeled section counts, Resume/Start.
3. Three stable destination cards: Mock Exam, Practice, Review.
4. One compact records block: Best Score, Latest Score or Completed Exams, View Progress.

The empty state keeps the same geometry and uses `0 / 170`, `Ready to start`, `--` records, and disabled/zero section values. It must not invent data.

## Mock Exam Setup (`setup`)

### Current Container Inventory

#### 1. Page Introduction

- `Full mock / run protocol`
- `Mission Briefing`
- `Configure one complete Professional-level simulation.`

Classification: **Rename and simplify.** Recommended: `Mock Exam Setup` and `Choose a version and exam options.` Remove the jargon eyebrow.

#### 2. Exam Summary Badge

- Timed Simulation
- Professional Mock / 170-item protocol

Classification: **Merge** with the basic facts. It repeats the page purpose.

#### 3. Six Fact Cells

- Total Questions: 170
- Time Limit: 3h 10m
- Exam Type: Professional
- Navigation: Free movement
- Review Tools: Flag, skip, revisit
- Pause: Save and exit

Classification:

- **Keep compact:** 170 questions, 3h 10m, Free navigation, Pause/resume.
- **Remove:** Exam Type: Professional. This product has no other exam type.
- **Merge:** Review Tools into one short helper line near Start, not a full fact cell.

#### 4. Section Allocation

- Four section cards
- Section icon/name
- Item range
- Item count
- Segmented percentage meter
- Percentage of exam

Classification:

- **Keep:** section name, item range, item count.
- **Remove:** percentage meter and percentage text. The item count already communicates allocation and the decorative meter consumes most of each row.
- **Fix:** display the four sections as compact colored rows or a 2x2 grid with no unused horizontal track.

#### 5. Important Note

- Independent reviewer disclaimer
- Online progress statement

Classification: **Keep compact** as one bottom status line.

#### 6. Exam Options

- Mock Version selector
- Show Timer
- Enable Pause
- Shuffle Questions
- Shuffle Answer Choices
- Preflight Check: stable internet, quiet space, three hours available
- Start Full Mock
- Save Configuration

Classification:

- **Keep:** Version, Shuffle Questions, Shuffle Choices, Start.
- **Decision:** timer visibility and pause can be fixed product behavior instead of options. The product already promises a timed exam with pause/resume.
- **Remove:** Preflight Check. It is generic advice, not an interactive or verifiable check.
- **Decision:** remove Save Configuration and auto-preserve options, or keep it only if users need multiple reusable presets. Current use does not justify a separate action.

## Exam Player States

### Active Exam (`exam`, `exam-collapsed`)

#### 1. Exam Header

- Brand and subtitle
- Mock version or practice title
- Timer/Untimed label
- Answered count
- Practice difficulty/count when applicable
- Questions button on mobile
- Pause
- Submit Exam or Finish Practice

Classification: **Keep.** Use a compact, stable HUD. Do not animate the timer or move controls.

#### 2. Question Navigator

- Questions title
- Answered, Unanswered, Skipped, Flagged legend
- Section accordion headers
- Section range and answered count
- Expanded group state counts
- Five-column item grid
- Current/answered/skipped/flagged visual states
- More/Less disclosure
- Internal scroll

Classification: **Keep.** This is core exam navigation. Simplify only decoration. Expanded state must preserve access to lower sections and never shift width when its scrollbar appears.

#### 3. Question Workspace

- Item number and total
- Section/subtopic
- Answer status
- Prompt
- Choices A-E
- Previous, Clear, Flag, Skip, Next

Classification: **Keep.** Next stays answer-gated; Skip is the explicit unanswered action.

### Graph Question (`graph`)

#### Stimulus Container

- Set label, title, description
- Accessible chart or table
- Legend, values, axes
- Linked item chips
- Open Larger

Classification: **Keep.** This is content, not decoration. Chart labels and values must remain readable at 100% zoom.

#### Expanded Chart (`chart-modal`)

- Close action
- Enlarged stimulus and linked-item context

Classification: **Keep.** No other exam controls should compete inside this modal.

### Pause (`pause`)

- Paused symbol and title
- Frozen time
- Current item
- Saved-online status
- Resume Exam
- Save and Exit

Classification: **Keep.** `Checkpoint secured` can be removed or reduced; the user needs the paused state and two choices.

### Submit (`submit`)

- Warning and irreversible-action copy
- Answered, Unanswered, Skipped, Flagged counts
- Review Unanswered
- Review Flagged
- Cancel
- Submit Exam

Classification: **Keep.** This is the correct place for four status counts.

### Timeout (`timeout`)

- Time Expired
- 0:00
- Finalizing/synchronizing status
- Loader
- Answered count
- Keep-page-open note

Classification: **Keep compact.** Do not repeat security or product copy.

## Practice And Review States

### Shared Page Header And Mode Selector

Current:

- `Targeted training console`
- `Practice & Review`
- Description
- Three tabs: Practice, Mistakes, Flagged
- Entire workspace changes after a tab click

Classification:

- **Remove:** jargon eyebrow.
- **Keep:** one short page title and sentence.
- **Replace tabs:** show three static mode cards at the top at all times. Each card has icon, name, one-line purpose, and current count/status. Selecting a card changes only the bounded workspace below it. This preserves orientation and makes all three modes continuously readable.

Recommended familiar names:

- Practice
- Mistakes
- Flagged

### Practice Workspace (`practice`)

#### Current Section Picker

- Four section plates
- Icon, section name, description, pool size

Classification: **Keep**, but shorten descriptions and make the entire plate the radio control.

#### Current Run Profile

- Selected-section banner
- Question count: 10/20/30/40/60
- Difficulty: Mixed/Standard/Challenge
- Three repeated facts: selected count, selected difficulty, Untimed
- Start Custom Practice
- Reset Options

Classification:

- **Keep:** count, difficulty, Start.
- **Remove:** repeated selected-section banner and repeated fact cells. The selected plate and controls already show these values.
- **Remove:** Reset Options unless real users request it; defaults are obvious and changing a selection is faster.

#### Current Quick Practice

- Heading and description
- Four section modules
- Each launches a 20-item mixed drill and may show an average

Classification: **Merge with the section plates.** Add a compact `Quick 20` action to each section or make 20/Mixed the default. A second full set of section controls duplicates the builder.

### Mistakes Workspace (`mistakes`, `mistakes-empty`)

#### Current Summary Rail

- Total Missed
- Attempts Ready
- Sections Affected
- Highest Priority

Classification: **Merge** into the static Mistakes mode card and list heading. Four metrics are unnecessary before the user can act.

#### Current Attempt List

- Attempt index
- Title, type, date
- Score, missed count, answered count
- Per-section mistake strip
- Review Mistakes

Classification: **Keep.** This is the clearest actionable content. Reduce each row to title/date, score, missed count, section color strip, Review.

#### Current Review Focus Panel

- Total questions ready
- Four section counts and bars
- Top priority
- Review Largest Mistake Set
- Start priority practice

Classification: **Remove or merge into one suggestion under the list.** It repeats the summary and attempt data. A single `Practice weakest section` secondary action is sufficient.

#### Current Informational Note

- Correct answers stay out of queue; new mistakes are added after each run

Classification: **Keep compact only in the empty state or help tooltip.**

#### Empty State

- Four zero metrics
- No mistakes message
- Start Mock Exam and Start Practice
- Explanatory note

Classification: **Remove zero metrics.** Keep the success/empty message and two relevant actions.

### Flagged Workspace (`flagged`, `flagged-empty`)

#### Current Summary

- Total flagged
- Four section counts
- Oldest flagged date
- Average time per item

Classification:

- **Merge:** total and section counts into the static Flagged mode card and queue group headers.
- **Remove:** Oldest Flagged and Average Time. They do not help choose what to review.

#### Current Queue

- Filters button
- Sorted-by-section label
- Columns: item/topic, source attempt, answer state, time spent, review
- Section groups and Review actions

Classification:

- **Keep:** item/topic, source, answer state, Review.
- **Decision:** remove Time Spent unless users use it to prioritize; it currently adds density.
- **Fix or remove:** Filters button has no visible filter workspace. Do not show an inert control.

#### Empty State

- Explanation of how flags enter the queue
- Start Mock Exam and Start Practice

Classification: **Keep.**

## Progress States (`recent`, `progress`, `progress-empty`)

`recent` and `progress` currently render the same page. The alias should not be treated as a separate product destination.

### 1. Page Introduction

- `Private performance telemetry`
- Progress
- Description

Classification: **Remove jargon eyebrow.** Keep `Progress` and one short sentence.

### 2. Summary Metrics

- Total Attempts
- Full Mocks
- Practice Runs
- Average Score
- Best Score

Classification: **Reduce to three:** Completed Attempts, Average Score, Best Score. Full/practice counts are visible in filters and records.

### 3. Attempt Performance

- Completed-attempt score trend
- Completed count or awaiting-first-run state

Classification: **Keep.** This is score-based, not long-term time tracking.

### 4. Section Performance

- Four accuracy bars
- Review Focus weakest-section action

Classification: **Keep bars. Rename action to `Practice weakest section` or remove it if the Practice page already suggests the same action.**

### 5. Attempt Records

- Stored run count
- Filters: All, Full Mocks, Practice, Review
- Attempt name/date, type, status, score, answered, action
- Continue/View Results
- Overflow: Review Answers, Retake Setup, Delete Attempt

Classification:

- **Keep:** table, Continue/View Results, overflow actions.
- **Remove or define:** Review filter. Review is not currently a distinct attempt mode.
- **Rename:** `Retake Setup` to `Use same settings`.
- **Keep:** Progress may be the densest page, but table text must remain readable and internally scroll when records grow.

### Empty State

- Zero metrics
- Empty trend baseline
- Zero section bars
- No attempts message
- Start Mock Exam

Classification: **Keep geometry but reduce zero decoration.** One empty trend, one message, and one primary action are enough.

## Results States (`results`, `results-fail`, `results-practice`)

### 1. Results Heading

- Results
- Professional Mock Debrief or Focused Practice Debrief
- Attempt title/date

Classification: **Simplify wording.** Recommended: `Exam Results` or `Practice Results`; remove `Debrief`.

### 2. Overview

- Score gauge: label, percentage, correct/total, `correct`
- Total time
- Average per item
- Passed/Needs Work/Complete status and supporting copy

Classification:

- **Keep:** score, correct/total, status.
- **Keep compact:** total time and average/item as immediate post-exam context. The request to remove time tracking applies to Progress, not necessarily the immediate result.
- **Fix:** `Score` currently touches the gauge ring. Define protected inner padding and independent label/value/detail rows.

### 3. Section Performance

- Four section cards with icon, percentage, bar, correct/total

Classification: **Keep.** This is the most useful diagnostic block.

### 4. Run Insights

- Fastest question
- Longest question
- Strongest area
- Weakest area
- Changed answers
- Flagged questions
- Skipped questions
- Overall accuracy

Classification:

- **Remove:** Overall Accuracy because the score gauge already shows it.
- **Merge:** Flagged and Skipped into one `Review status` item if space is tight.
- **Keep:** Strongest, Weakest, Changed Answers, Fastest, Longest. These support the requested post-exam facts.
- **Fix:** panel height must fit its content instead of reserving a large empty lower half.
- **Fix:** item numbers and detail text need safe space from separators; icons need one consistent optical size and baseline.
- **Rename:** `Run Insights` to `Exam Highlights` or `What stood out` for familiar language.

### 5. Actions

Full exam:

- Review Answers
- Practice Weakest Area
- Retake Same Version

Practice:

- Review Answers
- Repeat Drill
- Change Practice

Classification: **Keep.** These are clear next actions.

## Answer Review States (`review`, `review-empty`)

### 1. Heading And Summary

- `Attempt inspection`
- Answer Review
- Attempt title
- Score, Correct, Needs Review, Flagged
- Back to Results

Classification:

- **Remove:** jargon eyebrow.
- **Keep compact:** title, attempt, Correct/Needs Review/Flagged.
- **Merge:** Score may be omitted because Results already owns the score.
- **Remove duplicate:** keep one Return to Results control, not one in both header and footer.

### 2. Filters

- All, Wrong, Correct, Flagged and counts
- Current scope note

Classification: **Keep filters; remove Current Scope note.** The active filter already states the scope.

### 3. Item Navigator

- Result count/range
- Current, correct, wrong, unanswered, flagged item states

Classification: **Keep.**

### 4. Question Review

- Question number/total
- Correct/Incorrect state
- Section/subtopic
- Optional graph stimulus
- Prompt
- Choices with user/correct labels

Classification: **Keep.**

### 5. Explanation And Metadata

- Explanation
- Time spent
- Visits
- Answer changes
- Flagged

Classification: **Keep explanation. Keep metadata compact.** If simplification is required, visits is the first removable metric.

### 6. Footer

- Previous
- Return to Results
- Next

Classification: **Keep.** If this footer remains, remove the header return button.

### Empty Filter State

- No matching items
- Disabled navigation
- Prompt to change filter

Classification: **Keep.**

## Account Settings And Destructive States

### Account Settings (`profile-modal`, `password-expanded`)

| Container | Contents and controls | Classification |
| --- | --- | --- |
| Drawer heading | Account command, Account Settings, description, Close | Remove `Account command`; keep title, short description, Close. |
| Identity | Initials avatar, Full Name, read-only Email | Keep. Avatar is optional decoration. |
| Password accordion | Current, New, Confirm, eye toggles, Update Password | Keep. |
| Account actions | Save Changes, Sign Out | Keep. |
| Danger zone | Delete Account | Keep separated. |

### Delete Account (`delete-account`)

- Target account
- Impact summary
- Type `DELETE`
- Cancel and Delete Account

Classification: **Keep.**

### Delete Attempt (`delete-attempt`)

- Attempt name
- Permanent-deletion warning
- Cancel and Delete Attempt

Classification: **Keep.**

## Naming Simplification Candidates

| Current | Recommended | Reason |
| --- | --- | --- |
| Study Hub | Home or Study Hub | `Home` is most familiar; `Study Hub` retains product character. Decision required. |
| Full Mock | Mock Exam | Familiar exam-reviewer terminology. |
| Focused Practice | Practice | Short and clear. |
| Review Mistakes | Review | Can contain both Mistakes and Flagged. |
| Mission Briefing | Mock Exam Setup | Describes the actual task. |
| Run Configuration | Exam Options | Familiar form label. |
| Run Profile | Practice Options | Familiar form label. |
| Run Insights | Exam Highlights | More human and less technical. |
| Professional Mock Debrief | Exam Results | Immediate meaning. |
| Focused Practice Debrief | Practice Results | Immediate meaning. |
| Private performance telemetry | Remove | Decorative jargon. |
| Targeted training console | Remove | Decorative jargon. |
| Attempt inspection | Remove | Decorative jargon. |
| Preflight Check | Remove | Generic advice, not a real check. |

## Cross-Page Duplication Map

| Information | Current repetitions | Recommended owner |
| --- | --- | --- |
| Active exam completion | Ring, telemetry, section checkpoints, performance ribbon | Study Hub active-run block only, with one overall and one section representation. |
| Section accuracy | Study Hub ribbon, Records numerical row, Progress, Results | Progress for history; Results for one attempt. Remove from Study Hub except optional compact summary. |
| Mistake counts | Study Hub action, Mistakes telemetry, attempt cards, focus panel | Static Mistakes mode card plus attempt rows. |
| Flagged counts | Study Hub action, Flagged summary, queue groups, Results, Review summary | Static Flagged mode card, queue groups, and contextual result/review counts only. |
| Overall score | Results gauge, Results overall-accuracy insight, Review score strip, Progress table | Results gauge for one attempt; Progress for history. |
| Practice selection | Section plate, selected banner, fact cells, Quick Practice modules | One section selector plus count/difficulty controls. |
| Return to Results | Review header and footer | Footer only. |

## Motion Direction

Motion should make status feel alive, not make the exam harder to read.

Recommended shared motion:

- Slow ambient grid/topographic drift on non-exam pages.
- One-time progress-ring and score-gauge fill when the page opens.
- Soft status-light pulse for saved/synchronized state.
- Short scan-line pass on primary-card hover.
- 120-180 ms pressed response on technical controls.
- Progress bars animate once from zero to their final value.
- Modal/drawer enter and exit use short opacity plus 8-12 px movement.

Exam restrictions:

- No continuous movement behind prompts or choices.
- Timer digits never pulse, wobble, or resize.
- The current question may use a static cyan edge or a very subtle reduced-frequency glow.
- Respect `prefers-reduced-motion` and provide a no-motion equivalent for every state.

## Music And Sound Feasibility

### License Sources

- [Pixabay music](https://pixabay.com/service/license-summary/) is usable under the Pixabay Content License when embedded in a larger work and not redistributed as a standalone track. Keep the exact track URL, filename, creator, download date, and license record. [Pixabay's FAQ](https://pixabay.com/service/faq/) notes that some tracks may still be registered with Content ID.
- [Freesound effects](https://freesound.org/help/faq/) must be filtered to CC0 or CC BY. CC BY requires attribution; CC0 is the simplest choice for UI sounds.

### Browser Constraint

[Browser autoplay policy](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay) means audible music cannot be relied on to start before a user interaction. Audio must default off or wait for a click/key action. The app needs visible user control.

### Recommended Product Contract

- Add one speaker control in the signed-in header; it opens Music and Sound Effects toggles plus volume sliders.
- Default both off for new accounts.
- Persist only the preference, not playback position.
- Use a low-volume ambient loop on non-exam pages.
- During timed exams, keep music off by default even if enabled elsewhere; allow the user to explicitly enable it from a compact control.
- Use short sounds only for answer selection, flag, completion, warning, and results reveal. Do not play a sound on every hover.
- Pause audio when the page is hidden and resume only if the user preference remains enabled.
- Use native `<audio>` and Web Audio APIs; no audio dependency is needed.

An exact track and effect pack should be selected only after the next visual direction is approved, then archived with its license evidence before inclusion.

## Recommended vNext Page Architecture

1. **Home/Study Hub:** active run, three destinations, compact records. No section-performance ribbon.
2. **Mock Exam Setup:** compact exam facts, four section counts, essential options, one Start action. No exam-type cell, preflight panel, or percentage tracks.
3. **Practice & Review:** three static mode cards remain visible; one bounded workspace changes below them.
4. **Practice:** section, count, difficulty, Start. No duplicated quick-practice grid.
5. **Mistakes:** attempt list plus one optional practice suggestion. No summary/focus duplication.
6. **Flagged:** grouped queue. No oldest-date or average-time summary.
7. **Progress:** three metrics, trend, section bars, records table. This is the only intentionally dense analytics page.
8. **Results:** score/status, section performance, five or six compact highlights, three next actions. All panels fit content.
9. **Answer Review:** filters, navigator, question, explanation, one return action.
10. **Exam player:** preserve the focused current workflow; simplify decoration only.

## Decisions Required Before Generating vNext Images

1. Use `Home` or retain `Study Hub` in navigation.
2. Replace `Full Mock` with `Mock Exam` throughout.
3. Study Hub record trio: recommended `Best Score`, `Latest Score`, `Completed Exams`.
4. Remove the Study Hub section-performance ribbon entirely, or retain a single compact weakest-section hint.
5. Make Timer and Pause fixed behavior, or keep them as setup toggles.
6. Remove Save Configuration and preserve setup choices automatically, or retain the button.
7. Results highlights: recommended Fastest, Longest, Strongest, Weakest, Changed Answers, and Review Status.
8. Add audio in the same visual rework or as a separate ticket after the visual architecture is approved.
