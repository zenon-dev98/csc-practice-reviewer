# CSC Reviewer Full Design Document

## Vision

Build a digitized Civil Service Exam Professional mock reviewer that feels close to the paper exam while adding useful digital features: saved progress, pause/resume, skip/revisit, scoring, timing analytics, and repeated mock exam versions.

The app is for a small group of friends preparing for the CSC Professional exam. It should be practical, readable, and exam-focused rather than flashy.

## Source Material

Initial content source:

- `image_01.jpg` through `image_29.jpg`
- Mock booklet labeled as Professional Level, 170 items, Set H v3 2026

Current runnable bank:

- 20 generated typed Professional mock versions
- 170 items per version
- 3,400 generated questions total
- coverage-matrix validation per generated version
- shared graph/table/logic stimulus groups
- source-image booklet retained as fallback and audit reference

Official scope references:

- CSC article: Professional test has 170 items and 3 hours 10 minutes; topics include verbal ability, numerical ability, analytical ability, and general information.
- CSC 2026 advisory: Professional test proper is 150 items plus 20 EDQ items, 170 total, with 3 hours 10 minutes.
- CSC 2026 announcement: passing requires a general rating of at least 80.00.

## Exam Scope

Professional level target coverage:

- General Information
  - Philippine Constitution
  - Code of Conduct and Ethical Standards for Public Officials and Employees
  - Peace and human rights issues and concepts
  - Environment management and protection
- Verbal Ability
  - Vocabulary
  - Grammar and correct usage
  - Correct reasoning / reading comprehension
  - English and Filipino where applicable
- Numerical Ability
  - Basic operations
  - Number sequence
  - Word problems
- Analytical Ability
  - Word analogy
  - Symbolic logic / abstract reasoning
  - Identifying assumptions and drawing conclusions
  - Data interpretation

## Core Experience

### Home

- New examinee enters name and email.
- Returning examinee can pick an existing profile.
- Saved attempts show status, last question, elapsed time, and completion percentage.

### Exam

- Start screen shows instructions and disclaimer.
- Timer starts when the exam starts.
- User selects one answer per question.
- User can move next/previous.
- User can skip questions and revisit them from a question navigator.
- Question navigator is grouped by CSC section with answered/skipped/open counts.
- Shared graph/table/logic setups appear above linked prompts.
- User can pause and resume.
- Progress saves live to browser storage in the current app and should save to Supabase after hosted backend setup.
- If time expires, the attempt submits automatically.

### Results

- Score reveal animation runs before displaying the final result.
- Result tiers:
  - Failed: below 80 percent
  - Passed: 80 percent and above
  - Above average: configurable threshold after enough data exists
  - Excellent: configurable high-score threshold
- Results include topic scores, time spent per topic, fastest/slowest questions, skipped questions, revised answers, and comparative fun facts when enough attempts exist.

## Data Model Overview

Core entities:

- `profiles`: name, email, timestamps
- `questions`: prompt, choices, correct answer, explanation, topic metadata, source image, review status
- `exam_versions`: ordered question lists and timing configuration
- `attempts`: profile, exam version, status, started/submitted timestamps, elapsed time, score
- `answer_events`: selected choices, timing, skip/revisit data, revision counts
- `pause_events`: pause/resume intervals
- `topic_stats`: derived per-profile and aggregate statistics

## Storage Direction

Use browser local storage for the current runnable build. Use Supabase Free for the hosted backend once credentials and auth policy are available. This is practical for a small group of fewer than 10 users. Main concerns are not active users, but:

- free-tier policy changes
- inactive project pausing
- database size if large assets are stored
- lack of paid-plan automatic backups
- privacy and Row Level Security configuration

Store text data and analytics in Supabase. Keep heavy media outside Supabase unless a later ticket has a clear reason.

## Content Strategy

The first content milestone was direct digitization of the 29 images, followed by review and topic classification. The current runnable app now uses generated typed questions for 20 complete mock versions while retaining the source-image bank as fallback.

Each question needs:

- stable ID
- source page/image
- item number
- prompt
- choices A-D
- correct choice
- explanation
- topic and subtopic
- difficulty
- expected answer time
- review status

Generated versions track stable question IDs and preserve section counts, CSC skill metadata, explanations, difficulty, expected answer time, quality status, and review status. Each profile stores seen questions locally so returning users rotate through available versions.

## Non-Goals For Early Tickets

- No production deployment until the app shell, database, and privacy rules exist.
- No large animation/media asset collection until the core exam flow is working.
- No claim of CSC affiliation or access to official exam booklets.
