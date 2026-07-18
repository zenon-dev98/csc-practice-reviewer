# Stitch Prompts

Use these prompts in Stitch for design exploration. Treat Stitch output as visual direction, then implement with the local static app and `DESIGN.md`.

## Global Context Prompt

Design a focused web app for a Philippine Civil Service Exam Professional practice reviewer. The user is an examinee studying with friends, not a buyer on a marketing page. The app must feel quiet, dense, and exam-like: readable, restrained, fast to scan, and not decorative. Avoid hero sections, gradients, oversized whitespace, glassmorphism, playful illustrations, and any wording that implies Civil Service Commission affiliation. Use a neutral light interface with teal action states, blue focus/info, amber skipped states, and red danger states.

## Home / Profile

Create a compact first screen for a static exam reviewer app. It has a sticky header, profile form, saved profiles, exam summary, local-save status, and independent-practice disclaimer. It should look like a practical study tool, not a landing page.

## Exam Active

Create a dense desktop exam-taking screen. Left sidebar has timer, answered count, pause/skip, submit, and collapsible section groups: General 1-20, Verbal 21-80, Numerical 81-120, Analytical 121-170. Each group shows answered/skipped/open counts and item chips. Main area has compact question header, typed prompt, four choices, previous/next controls. Keep spacing tight and readable.

## Graph / Stimulus Question

Create an exam question screen where a table or chart applies to four linked questions. The stimulus panel should be labeled `Chart for Items 101-104`, include a compact data table, and sit above the prompt without pushing choices off screen. It must work on mobile and desktop.

## Paused Exam

Create a paused state for the exam screen. The timer and section navigator remain visible, answers are disabled, and the main question area clearly says paused with a resume action. Keep the layout stable.

## Results

Create a results screen with score percentage, raw score, pass/fail tier, section score tiles, skipped/unanswered facts, and actions for statistics and new version. It should be celebratory only through restrained hierarchy, not decorative animation.

## Stats

Create a profile statistics screen with attempts, completed count, average, best score, and a list of attempts. Keep it utilitarian and readable.

## Mobile Exam

Create a 390px-wide mobile exam screen. The section navigator is collapsible, item chips fit without horizontal scrolling, the question prompt is readable, choices stack vertically, and the timer remains visible near the top.
