# UI/UX and Question Bank Audit (2026-11-21)

Note: the audit ran on a July 21 backup restored from a phone, before this repo was cloned. On `main` (70858d5), U1 and U3 were already fixed; Q1, Q2 and U2 were then fixed here. Other rows were not re-checked against `main`.

How it was run: the app served locally (`python -m http.server`, `app/`) in `?fixture=` QA mode, viewed at 1366x768 and 375x812. Bank loaded from `app/question-bank/*.js` (20 versions, 3,400 items). `npm run check`, `validate:data` and `audit:questions` all pass. These findings are things those scripts miss.

## Question bank

| # | Severity | Finding | Scope |
|---|---|---|---|
| Q1 | Fixed 2026-11-21 | Explanation names the wrong letter, e.g. v01-q059 key A, explanation "Choice B has a complete subject…". Choices were reordered after the explanations were written. | 56 items, v01–v11, 54 of them Verbal (list below) |
| Q2 | Fixed 2026-11-21 | "Shuffle answer choices" makes every letter-citing explanation wrong, even the 13 that are right today. | 69 explanations cite a letter |
| Q3 | High | Answer leak: the correct choice is the single longest option 58% of the time (chance is 25%). General Information 82%, Verbal 58%, Analytical 46%, Numerical 20%. A test-wise guesser beats the exam without knowing the content. | 1,122 of 1,938 items with a unique longest option |
| Q4 | Medium | Joke distractors, mostly GI and Analytical "best conclusion" items ("Freedom to impose a belief by force", "belongs permanently to anyone who passes a civil service exam", "Exactly 76% of every resident will respond correctly forever"). They make items far easier than the real CSE. Same root cause as Q3. | Widespread in GI |
| Q5 | Medium | Exact duplicates across versions: identical analogies such as "COMPASS is to DIRECTION as CLOCK is to ___" (v01-q124 = v10-q125). `audit:questions` misses them because its normalizer keeps trailing punctuation and differing blank lengths (`_____.` vs `____`). | 20 groups, 44 items |
| Q6 | Medium | Near-duplicates (same fact, reworded): 95 of 400 GI items and 234 of 1,000 Analytical items have a close twin in another version. Someone doing several mock exams sees recycled content. GI only covers about 4 laws, so it saturates fastest. | GI and Analytical |
| Q7 | Low | Every item is still `reviewStatus/qualityStatus: needs_review`. Nothing has been signed off by a human. | 3,400 |
| Q8 | Low | 15 Numerical explanations are bare arithmetic with no reasoning ("25,000-14,768=10,232."). | 15 items |
| Q9 | Low | Weak analogy: v12-q125 "STATUTE : LAW :: FORMULA : CALCULATION" is defensible but loose. | spot check |

Checked and clean: answer keys are balanced (A/B/C/D about 25% each), no duplicate choices, no "all/none of the above". 690 arithmetic statements inside explanations were re-computed with no real errors. A hand-read sample of about 50 items found no wrong keys.

## UI/UX

| # | Severity | Finding | Where |
|---|---|---|---|
| U1 | Already fixed in 457d131 (2026-08-01) | Mobile exam header is broken: "Mock Exam 07" wraps to 3 lines and overlaps the "Run"/"Answered" labels. The title is `rgb(8,36,90)` on a near-black background, about 1.4:1 contrast (essentially invisible). | `?fixture=exam` at 375px |
| U2 | Fixed 2026-11-21 | Mobile charts are clipped: the line chart only shows Jan–Feb, and the question asks about April. You have to find a horizontal scroll inside the card. | `?fixture=series-line` at 375px |
| U3 | Already fixed in 457d131 (2026-08-01) | No Pause button on mobile during an exam (desktop has one). Pause/resume is a headline feature. | exam at 375px |
| U4 | Medium | Columns that aren't plotted (e.g. "First response" in v16 help-desk chart) are only reachable via the collapsed "Exact values" toggle, but questions ask about them. Show the table by default for those sets. | line-table and bar-table stimuli |
| U5 | Medium | Next is disabled until you answer, and there's no hint why. You have to use Skip, which seems at odds with the "Free movement" claim on the setup screen. | exam |
| U6 | Medium | Desktop navigator keeps General Information (1–20) expanded while you're on item 43 (Verbal). The current item isn't visible in the navigator. | `?fixture=exam` |
| U7 | Low | Mobile dashboard: the top-right avatar button renders as an empty box. "Exam Sections / Current attempt completion" text is crushed, and the Analytical icon is cut off. | dashboard at 375px |
| U8 | Low | Progress page: the "Attempt Records" heading overlaps its subtitle, the Section Accuracy subtitle overlaps the General row, and the score-history y-axis labels are near-invisible. | `?fixture=progress` |
| U9 | Low | Submit dialog shows Answered 42 / Unanswered 128 / Skipped 5 / Flagged 7. The four numbers add to 182, not 170, because skipped is a subset of unanswered. Label it "of which skipped". | `?fixture=submit` |
| U10 | Low | Results and Answer Review highlight the "Progress" tab in the top nav. | results, review |
| U11 | Low | Dashboard says "Best mock score 87%" while Progress says "Best score 100%" (includes practice). Label which scope each one uses. | dashboard vs progress |
| U12 | Low | Keyboard: 1–4 picks an answer and Enter goes next, but there are no keys for previous, flag or skip. The choices are labeled A–D but the A–D keys don't work. | exam |
| U13 | Low | QA fixture item 43 has two correct answers (C and D are both grammatical) and uses 5 choices, while the real bank uses 4. It's only fixture data, but it's what every QA screenshot shows. | `app.js` fixtureChoices |

What works well: the desktop layout is clean and consistent, and the timer, section progress and submit summary are clear. The pause modal is clear. The review screen shows your answer, the correct answer and an explanation side by side. There's no horizontal page overflow on mobile, and no tap targets under 40px.

## Not covered

Real sign-in, Supabase sync, the timeout flow, paper mode scanning, audio, and screen-reader behavior beyond aria-label spot checks. Fixture data drives every screen, so real-bank items were checked in the data, not rendered one by one.

## Q1 item list

Fixed: all 69 letter-citing explanations now say "the answer" / "ang tamang sagot" instead of a letter, so they stay correct when choices are shuffled. Keys and choices are unchanged; every key was checked by hand against its choices and all were correct.
- v01-q059 (key A, explanation says B)
- v01-q062 (key C, explanation says B)
- v01-q063 (key B, explanation says A)
- v01-q064 (key D, explanation says B)
- v02-q053 (key B, explanation says C)
- v02-q054 (key D, explanation says B)
- v02-q055 (key C, explanation says B)
- v02-q056 (key A, explanation says B)
- v02-q058 (key B, explanation says C)
- v02-q060 (key A, explanation says B)
- v02-q061 (key C, explanation says A)
- v02-q062 (key A, explanation says C)
- v03-q053 (key D, explanation says C)
- v03-q055 (key A, explanation says B)
- v03-q056 (key C, explanation says B)
- v03-q057 (key A, explanation says B)
- v03-q058 (key D, explanation says C)
- v03-q059 (key C, explanation says A)
- v03-q061 (key D, explanation says B)
- v03-q062 (key B, explanation says C)
- v04-q052 (key C, explanation says B)
- v04-q055 (key A, explanation says C)
- v04-q056 (key C, explanation says B)
- v04-q059 (key A, explanation says C)
- v04-q060 (key C, explanation says B)
- v05-q051 (key D, explanation says B)
- v05-q053 (key A, explanation says B)
- v05-q054 (key C, explanation says B)
- v05-q055 (key D, explanation says B)
- v05-q058 (key C, explanation says A)
- v05-q150 (key C, explanation says A)
- v06-q051 (key B, explanation says A)
- v06-q052 (key D, explanation says A)
- v06-q056 (key D, explanation says B)
- v06-q059 (key B, explanation says A)
- v06-q060 (key D, explanation says A)
- v06-q149 (key D, explanation says A)
- v07-q051 (key D, explanation says A)
- v07-q054 (key C, explanation says A)
- v07-q056 (key B, explanation says A)
- v08-q042 (key B, explanation says A)
- v08-q045 (key D, explanation says A)
- v08-q054 (key B, explanation says A)
- v09-q042 (key B, explanation says A)
- v09-q051 (key D, explanation says A)
- v09-q052 (key C, explanation says A)
- v09-q054 (key B, explanation says A)
- v09-q056 (key C, explanation says A)
- v10-q051 (key D, explanation says A)
- v10-q054 (key B, explanation says A)
- v10-q080 (key B, explanation says A)
- v11-q045 (key D, explanation says A)
- v11-q051 (key C, explanation says B)
- v11-q052 (key D, explanation says B)
- v11-q053 (key A, explanation says B)
- v11-q055 (key D, explanation says B)
