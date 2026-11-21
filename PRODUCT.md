# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
A small, invite-only group of friends and family in the Philippines preparing for the Civil Service Examination, Professional level. They study around work and school, often in the evening, and use a laptop for full sit-down mock exams and a phone for shorter practice, roughly equally.

## Product Purpose
An independent practice reviewer for the CSC Career Service Examination (Professional): 20 hand-authored 170-item mock exams with the real 3:10:00 time limit, section practice, and review of mistakes and flagged items. Success is a user who passes the real exam (80%+) and keeps coming back to practice until they reliably score above that line.

## Positioning
Full-length, timed mocks that follow the official CSC Professional coverage (General Information, Verbal, Numerical, Analytical), with saved progress across devices, per-question timing, and explanations, built for one study group rather than a mass-market course.

## Operating Context
Long sessions: a full mock is 170 questions over about three hours, so fatigue, pacing and resuming after interruptions matter. Question types include Filipino and English grammar and vocabulary, paragraph ordering, word analogies, number sequences, word problems, syllogisms, and data interpretation from shared tables, bar charts and line graphs. A paper answer-sheet mode exists for printed practice.

## Capabilities and Constraints
- Static app on GitHub Pages with vanilla HTML, CSS and JavaScript; Supabase for auth and data. No frontend framework or new production dependency without approval.
- Exam invariants: 170 items, 3:10:00, pause/resume, skip/revisit, timeout submits through the same path, stable question and choice order after start.
- Accessibility target WCAG 2.2 AA; must work on phones and desktops.
- Open decision: how much repetition per question type each exam should allow.

## Brand Commitments
- Name: CSC Practice Reviewer.
- Must visibly state independence: not affiliated with or endorsed by the Civil Service Commission.
- Dark theme by default, with a light theme option (user's explicit choice).
- Motivating, with a light layer of game-like progress; not a neutral, purely clinical tool (user's explicit choice).
- Craft and feel reference: Duolingo-style game learning apps (bright, chunky, rewarding, polished). Reference sets the bar, not a look to copy: no Duolingo mascot, fonts or exact colors (user's choice, 2026-11-21).
- Keep the progress seal: a badge that fills as you answer and is earned when you pass a mock (user's choice, 2026-11-21).
- Rejected: plain neutral dark study-app look, and the transit-map, banknote and passer-tarp worlds as whole looks (2026-11-21).
