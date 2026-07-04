# UI State Map From `states/`

Created: 2026-07-04

Method: visual inspection of each state image using the built-in image viewer. No OCR scripts or Python were used.

## Global System

- Brand: shield/star/laurel logo from `states/logo.png`.
- Product title: `CSC Practice Reviewer`.
- Subtitle: `Independent mock exam and review tool`; dashboard-side navigation variants also show `Professional Level`.
- Independent disclaimer pill: shield-check icon plus `Not affiliated with the Civil Service Commission`.
- Core layout: white/light blue background, white cards, navy text, teal primary actions, blue secondary/nav, orange skipped/general information, purple analytical, green numerical.
- Buttons use icon + text where shown. Most primary actions are teal filled with white text.
- Header states:
  - Public/create/select/profile-dashboard/results/review: logo left; disclaimer pill near center or right; profile actions on right when signed in.
  - Exam player: logo left; centered exam title/status; timer/answered counts; pause and submit buttons on right.
  - Side-nav pages: fixed left sidebar with profile card, nav links, study tip, logout.

## `create_profile.png`

Screen purpose: first-run profile creation.

Header:
- Left logo + `CSC Practice Reviewer` + subtitle.
- Right disclaimer pill.

Main left marketing panel:
- Pill: building icon + `Civil Service Exam Practice`.
- Headline: `Review smarter. Track your progress clearly.`
- Supporting copy about saving mock exam scores, review history, progress.
- Three feature chips:
  - stopwatch icon: `Timed mock exams`
  - bar chart icon: `Score tracking`
  - document/list icon: `Reviewer history`

Main right card:
- Title `Create Profile`, subtitle `Set up your reviewer profile.`
- Input `Full Name` with user icon and placeholder `Enter your full name`.
- Input `Email Address` with mail icon and placeholder `Enter your email address`.
- Primary button `Start Reviewing`.
- Divider line with `or`.
- Text `Already have a profile?`
- Link/button `Select existing profile`.

Interactions:
- `Start Reviewing`: validate name/email, create profile, go to dashboard or exam setup.
- `Select existing profile`: go to `select_profile`.
- Inputs update local profile draft.

## `select_profile.png`

Screen purpose: choose saved profile.

Header:
- Logo/title left.
- Disclaimer pill.
- Primary button `+ Create New Profile` on top right.

Main:
- Heading `Select Profile`; subtext `Continue your practice session using an existing profile.`
- Profile rows, full-width cards:
  - Avatar initials tile.
  - Name.
  - Email.
  - Status row with icon:
    - `Last reviewed today`
    - `Progress: 64%`
    - `3 mock exams completed`
    - `New profile`
  - Right action `Continue ->`.
- Bottom link `Back to Create Profile`.

Interactions:
- `Create New Profile`: go to `create_profile`.
- `Continue`: select that profile and go to `profile_dashboard`.
- `Back to Create Profile`: go back to profile creation.

## `profile_dashboard.png`

Screen purpose: signed-in command dashboard.

Header:
- Logo/title/subtitle left.
- Disclaimer pill.
- `Switch Profile` outline button with swap icon.
- Circular initials avatar.

Main heading:
- `Dashboard`
- Subtext: `Continue your review journey and choose what to do next.`

Top cards:
- Profile summary card:
  - Avatar initials.
  - `Welcome back, John Smith`
  - email.
  - role: `Professional Mock Exam Reviewer`
  - `Last active: Today`
  - `3 mock exams completed`
  - `Edit Profile` text button with pencil icon.
- Continue card:
  - clock icon.
  - `Continue Last Exam`.
  - `Question 43 of 170`.
  - `42 answered`.
  - `Time left: 03:09:22`.
  - Primary `Resume Exam`.
- Start card:
  - document icon.
  - `Start Full Mock Exam`.
  - `170 questions • 3 hours 10 minutes`.
  - copy: `Simulates the Professional Civil Service Exam`.
  - Primary `Start Exam`.

Middle cards:
- `Practice by Category`: four category cards with icon, progress bar, percent, and `Practice ->`.
  - Verbal Ability, 82%, green.
  - Numerical Ability, 64%, blue.
  - Analytical Ability, 76%, purple.
  - General Information, 70%, orange.
- `Review Mistakes`: flag icon, explanatory copy, outline `Review Now`.

Bottom cards:
- `Progress Summary`: four stat tiles:
  - Average Score `78%`
  - Best Score `84%`
  - Completed Mock Exams `3`
  - Flagged Questions `12`
- `Category Performance`: four horizontal bars with same percentages.
- `Recent Attempts`: table with Exam/Session, Date, Score, Answered, Action.

Interactions:
- `Switch Profile`: open switch/profile modal.
- Avatar likely opens profile modal.
- `Edit Profile`: open profile modal in edit mode.
- `Resume Exam`: go to active `default_exam_page` at saved question.
- `Start Exam`: go to `exam_setup_instructions`.
- Category `Practice`: go to `practice_by_category_page` or start category drill for that category.
- `Review Now`: go to mistakes/review mode.
- Recent attempts `View Result`/`Review`: go to result or answer review.

## `exam_setup_instructions.png`

Screen purpose: pre-exam setup.

Header:
- Logo/title/subtitle left.
- Disclaimer pill.
- `Switch Profile`.
- Avatar initials.

Main title:
- `Exam Setup`
- Subtext: review exam details before beginning.

Left large card:
- `Professional Mock Exam` with document icon and `Timed Exam` pill.
- Detail rows:
  - Total Questions: 170.
  - Time Limit: 3 hours 10 minutes.
  - Exam Type: Professional Civil Service Mock Exam.
  - Navigation: Skip and return to questions anytime.
  - Review Tools: Flag questions for later review.
  - Pause: Allowed in practice mode; question content will be hidden while paused.
- `Question Groups` list:
  - Verbal Ability, Questions 1-60.
  - Numerical Ability, Questions 61-100.
  - Analytical Ability, Questions 101-140.
  - General Information, Questions 141-170.
- Important notes:
  - Timer starts once `Start Exam` is clicked.
  - Explanations/analytics shown only after submission.
  - Be ready before beginning.
- Bottom `Back to Dashboard`.

Right cards:
- `Exam Options` with toggles:
  - Show Timer: on.
  - Enable Pause: on.
  - Shuffle Questions: off.
  - Shuffle Answer Choices: off.
- `Readiness Check`: three checked statements.
- Action card:
  - Primary `Start Exam` with play icon.
  - Note `Once started, the timer begins immediately.`
  - Outline `Save for Later` with bookmark icon.

Interactions:
- Toggle options update exam config.
- `Start Exam`: creates active attempt, starts timer, goes to `default_exam_page`.
- `Save for Later`: returns to dashboard with setup saved, no timer start.
- `Back to Dashboard`: returns to `profile_dashboard`.

## `default_exam_page.png`

Screen purpose: active normal question.

Header:
- Logo/title/subtitle left.
- Center: `Professional Mock Exam`.
- Timer: clock icon + `Time Left: 03:09:22`.
- Answer count: checkbox icon + `Answered: 42/170`.
- Outline `Pause`.
- Primary `Submit Exam` with paper-plane icon.

Left question sidebar:
- Title `Questions`.
- Legend: Answered teal filled square, Unanswered white/blue outline, Skipped orange outline, Flagged red flag.
- Four accordion sections:
  - Verbal Ability 1-60, `18/60 answered`.
  - Numerical Ability 61-100, `12/40 answered`.
  - Analytical Ability 101-140, `8/40 answered`.
  - General Information 141-170, `4/30 answered`.
- Expanded section shows grid of numbered chips, five per row, two rows then ellipsis.
- Chip states:
  - teal filled: answered.
  - navy filled: current.
  - white outline: unanswered.
  - orange outline/faint background: skipped.
  - small red flag corner: flagged.

Main question card:
- `Question 43 of 170`.
- Topic pill: `Verbal Ability • Grammar and Correct Usage`.
- Prompt.
- Five answer choices A-E.
- Each choice is a full-width row with letter circle left, answer text, radio circle right.
- Selected answer has teal border/faint teal background and filled radio.
- Footer controls:
  - `Previous`.
  - `Clear Answer`.
  - `Flag for Review`.
  - `Skip`.
  - Primary `Next`.

Interactions:
- Chip click jumps to question.
- Accordion chevron expands/collapses section.
- Choice click selects answer and updates answered count.
- `Clear Answer`: removes selected answer.
- `Flag for Review`: toggles flag; flag appears in sidebar and review state.
- `Skip`: marks skipped, likely moves to next or stays while chip becomes skipped.
- `Previous`/`Next`: navigate.
- `Pause`: show `exam_pause`.
- `Submit Exam`: show `submit_view`.

## `collapsed_question_groups.png`

Same active exam layout, but only Verbal Ability group is expanded; other groups are collapsed rows with chevron down and answered count.

Required behavior:
- Only one or multiple groups may be expanded; image implies collapsed groups preserve section count and range.
- Collapsed groups hide question chips entirely.

## `graph.table_question_set.png`

Screen purpose: active graph/table stimulus set.

Header and sidebar same as exam player.

Left sidebar:
- Numerical group expanded.
- It contains nested stimulus groups:
  - `Chart Set A • Questions 81-85`, `3/5 answered`, expanded.
  - `Numerical Set B • Questions 86-90`, collapsed.
  - `Numerical Set C • Questions 91-100`, collapsed.
- Chart Set A shows chips 81-85.

Main card uses two-column layout:
- Left stimulus panel:
  - Heading `Questions 81-85 refer to the chart below.`
  - Topic pill `Numerical Ability • Data Interpretation`.
  - Chart title `Monthly Sales (in Million PHP) by Region - 2024`.
  - Bar chart with legend: Luzon blue, Visayas teal, Mindanao orange.
  - X axis months Jan-May; Y axis Sales (Million PHP).
  - Buttons under chart:
    - `Zoom`.
    - `Open Larger`.
  - Linked question strip card:
    - `Chart Set A • Questions 81-85`.
    - chips 81-85.
    - note: `These questions are connected and use the same chart.`
    - small `Previous` button.
- Right question panel:
  - `Question 82 of 170`.
  - same topic pill.
  - prompt.
  - choices A-E.
  - footer controls: Clear Answer, Flag for Review, Skip, Next.

Interactions:
- `Zoom`: enlarges chart in-place or modal.
- `Open Larger`: opens chart modal/fullscreen.
- Linked chips jump within same stimulus set.
- `Previous` under chart likely moves to previous linked item or previous question.

## `exam_pause.png`

Screen purpose: paused exam modal.

Background:
- Entire exam page blurred and dimmed.
- Header timer status changes to amber `Paused 03:09:22`.
- Question content hidden/blurred.

Modal:
- Center white card.
- Amber pause icon circle.
- Title `Exam Paused`.
- Copy:
  - `Your timer is stopped.`
  - `Question content is hidden while paused.`
- Primary `Resume Exam`.
- Text button `End Exam`.

Interactions:
- `Pause`: enters this state, stops timer, hides content.
- `Resume Exam`: exits modal, resumes timer.
- `End Exam`: likely opens submit confirmation or abort confirmation; unclear.
- Background is non-interactive while paused.

## `submit_view.png`

Screen purpose: submit confirmation modal.

Background:
- Active exam dimmed.

Modal:
- Large icon circle with paper plane.
- Title `Submit Exam?`
- Copy: can still review unanswered or flagged questions before final submission.
- Stats row:
  - Answered `142/170`.
  - Unanswered `28`.
  - Skipped `12`.
  - Flagged `7`.
- Copy: `Review remaining items or submit your exam now.`
- Buttons:
  - `Review Unanswered`.
  - `Review Flagged`.
  - `Cancel`.
  - Primary `Submit Exam`.

Interactions:
- Top `Submit Exam`: opens modal.
- `Review Unanswered`: filters/jumps navigator to unanswered items; modal closes.
- `Review Flagged`: filters/jumps navigator to flagged items; modal closes.
- `Cancel`: close modal, return to exam.
- `Submit Exam`: finalizes attempt, goes to `results_summary_page`.

## `results_summary_page.png`

Screen purpose: post-exam results.

Header:
- Logo/disclaimer/switch profile/avatar.

Top:
- `Results Summary`.
- Subtitle: exam completed successfully.
- Celebration/trophy message: `Great job, John!` with pass encouragement.

Left top score card:
- Final Score `84%` with `PASSED` pill.
- Details:
  - `142 correct out of 170 questions`.
  - `Completed in 2 hours 54 minutes`.
  - `Date: Jul 4, 2026`.

Stats card:
- Correct Answers `142` and percentage.
- Wrong Answers `28`.
- Flagged Questions `7`.
- Accuracy `84%`.

Category Breakdown:
- Verbal Ability `88%`, `53 / 60 correct`.
- Numerical Ability `76%`, `38 / 50 correct`.
- Analytical Ability `82%`, `41 / 50 correct`.
- General Information `79%`, `10 / 10 correct`.

Right:
- Performance Insights card:
  - Top Strength: Verbal Ability.
  - Needs Improvement: Numerical Ability.
  - Overall Performance: Strong.
  - Quote/feedback text.
- Exam Overview table:
  - Exam Type.
  - Total Questions.
  - Answered.
  - Time Limit.
  - Exam Duration.
  - Date Completed.

Bottom actions:
- Primary `Review Answers`.
- Outline `Back to Dashboard`.
- Outline `Retake Exam`.

Interactions:
- `Review Answers`: go to `answer_review_page`.
- `Back to Dashboard`: go to `profile_dashboard`.
- `Retake Exam`: go to `exam_setup_instructions` or start same exam/version again.
- `Switch Profile`: profile modal.

## `answer_review_page.png`

Screen purpose: review submitted answer and explanations.

Header:
- Logo/disclaimer/switch profile/avatar.

Top:
- `Answer Review`, subtext.
- Score summary strip: Score 84%, Correct 142, Wrong 28, Flagged 7.
- `Back to Results` button.

Left sidebar:
- `Review Filters` buttons:
  - All Questions 170, active.
  - Wrong Answers 28.
  - Correct Answers 142.
  - Flagged 7.
- `Question Navigator` with same section/chip pattern as exam player.
- Legend: Current, Correct, Wrong, Flagged.

Main review card:
- `Question 43 of 170`.
- Topic pill.
- Status pill top right: `Incorrect`.
- Prompt.
- Choices A-E.
- User answer row highlighted red, label `Your Answer`, radio filled red.
- Correct answer row highlighted teal, label `Correct Answer`, radio filled teal.
- Explanation cards:
  - `Explanation` with correct reasoning.
  - `Why your answer was incorrect`.
  - Metadata card:
    - User Answer B.
    - Correct Answer C.
    - Time Spent 00:54.
    - Flagged during exam Yes.
- Footer:
  - `Previous Question`.
  - `Return to Results`.
  - Primary `Next Question`.

Interactions:
- Filter buttons update navigator/question set.
- Navigator chips jump to review item.
- Previous/Next move review item.
- Back/Return go to results summary.

## `practice_by_category_page.png`

Screen purpose: category practice hub.

Layout: left fixed sidebar plus main content.

Sidebar:
- Logo variant: crest + `CSC Practice Reviewer`, `Professional Level`.
- Profile card: initials, name/email, level badge, chevron.
- Nav links:
  - Dashboard.
  - Start Full Mock Exam.
  - Practice by Category, active.
  - Review Mistakes.
  - Recent Attempts.
  - Results History.
  - Bookmarks.
- Study Tip card.
- `Log Out`.

Main:
- Header icon + `Practice by Category`.
- Top right: `Switch Profile`, bell notification with red `2`.
- Four category cards:
  - Verbal Ability, blue, book icon, description, 120 questions, 82% average score, last practiced Jul 4 2026, `Start Practice`.
  - Numerical Ability, green/calculator, 120 questions, 64%, Jul 3 2026.
  - Analytical Ability, purple/chart, 120 questions, 76%, Jul 2 2026.
  - General Information, orange/globe, 120 questions, 70%, Jul 1 2026.
- Custom Practice card:
  - Select Category dropdown.
  - Number of Questions dropdown, default 10 Questions.
  - Difficulty Level dropdown, default Mixed.
  - Primary purple `Start Custom Practice`.
- Note card:
  - `All practice sessions are untimed and show explanations after each question.`
  - `View Settings`.
- Footer copyright.

Interactions:
- Sidebar nav changes pages.
- Profile card chevron opens edit/switch modal.
- `Start Practice`: starts category practice for that category.
- Dropdowns change custom settings.
- `Start Custom Practice`: starts custom category practice.
- Notification bell opens notifications; count=2.
- `View Settings`: opens practice settings.
- `Log Out`: returns to create/select profile state.

## `recent_attempts_page.png`

Screen purpose: attempts history.

Same side navigation layout; `Recent Attempts` active.

Main:
- Header icon + `Recent Attempts`.
- Top right switch profile + notification.
- Summary cards:
  - Total Attempts 12.
  - Average Score 78%.
  - Highest Score 92% (Full Mock Exam).
  - Days Active 31 (This Month).
- Attempts panel:
  - Tabs: All Attempts active, Full Mock Exams, Category Practice, Quick Practice, Review Sessions.
  - Filter button `All Time`.
  - Table columns: Attempt, Type, Date, Score, Time Taken, Questions, Actions.
  - Rows include icons, name/subtitle, type badge, date/time, score/ratio, time, questions answered, `View Results`, overflow menu.
  - Pagination bottom: showing 1 to 7 of 12; prev, page 1 active, page 2, next.

Interactions:
- Tabs filter table.
- `All Time` opens date-range dropdown.
- `View Results`: opens result summary for row.
- Overflow menu likely offers review, delete, rename/export; unclear.
- Pagination navigates attempts pages.

## `edit_profile_switch_profile_modal.png`

Screen purpose: manage profile modal over dashboard.

Background:
- Dashboard dimmed.

Modal:
- Title `Manage Profile`.
- Subtitle: edit information or switch profile.
- Close X.
- Two columns:
  - Left `Switch Profile`:
    - Profile list cards.
    - Active profile gets blue outline and `Active` badge.
    - `Create New Profile` dashed button.
    - Tip card.
  - Right `Edit Profile`:
    - Profile picture initials circle, small camera button.
    - `Change Photo`.
    - Inputs: Full Name, Email Address.
    - Dropdown: Civil Service Level.
    - Birth Date optional.
    - Notes optional textarea.
    - Footer buttons: Cancel, primary Save Changes.
- Bottom centered danger outline: `Delete This Profile`.

Interactions:
- X: close modal.
- Select profile card: switch active profile.
- Create New Profile: likely opens create profile flow inside modal or navigates to create profile.
- Camera/Change Photo: opens file picker.
- Civil Service Level: dropdown.
- Birth Date: date picker.
- Cancel: discard edits, close/return.
- Save Changes: persist profile edits.
- Delete This Profile: should open destructive confirm before deleting.

## Unclear Items To Confirm

1. Official section order/count conflict:
   - Exam setup and exam player mockups use Verbal 1-60, Numerical 61-100, Analytical 101-140, General 141-170.
   - Earlier app/content plan used General 1-20, Verbal 21-80, Numerical 81-120, Analytical 121-170.
   - Confirm which order/count must be implemented.

2. Choice count:
   - Exam screens show A-E choices.
   - Current generated bank uses A-D choices.
   - Confirm whether every question should have five choices.

3. Dashboard family mismatch:
   - `profile_dashboard.png` uses top-header dashboard.
   - `practice_by_category_page.png`, `recent_attempts_page.png`, and modal background use a left permanent sidebar layout with different logo variant.
   - Confirm whether the whole signed-in app should switch to the sidebar layout, or only secondary pages.

4. Logo inconsistency:
   - Most top-header screens use star shield/laurel logo.
   - Sidebar pages use a different crest with small stars and gold accents.
   - Confirm which logo to use globally, or whether both are intentional by layout family.

5. `End Exam` behavior from pause modal:
   - It could open `submit_view`, abandon attempt, or return to dashboard.
   - Confirm desired behavior.

6. Practice categories show 120 questions each:
   - The full mock sections have 60/40/40/30 in these mockups.
   - Confirm whether category practice banks are separate 120-question pools or placeholder text.

7. Graph/chart data:
   - Mockup chart is a specific monthly sales chart.
   - Confirm whether generated chart stimuli should match this exact chart style/data, or only the layout.

8. Recent Attempts overflow menu:
   - Three-dot row actions are shown but menu contents are not visible.
   - Confirm actions: review, retake, delete, export, etc.

9. Notifications:
   - Bell shows `2`, but no notification panel state is provided.
   - Confirm whether to implement as static button, dropdown, or omit until a state is provided.

10. Profile photo upload:
   - Modal shows change-photo flow, but local app has no image storage design yet.
   - Confirm whether to support local base64 avatar upload or initials only for now.
