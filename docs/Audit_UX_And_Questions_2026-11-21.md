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

## Time-cost and realism audit (2026-11-21, second pass)

Bank: 20 mock versions x 170 items = 3,400 items. Per mock: 20 General Information, 60 Verbal, 40 Numerical, 50 Analytical. The time limit allows about 67 seconds per item.

| # | Severity | Finding | Scope |
|---|---|---|---|
| Q10 | High | Time is spent in the wrong place. Data-interpretation items are rated 81 s on average and word problems 77 s, but reading comprehension only 74 s. On the real exam, reading should be the slowest part. | bank-wide `expectedSeconds` |
| Q11 | High | Reading passages are too short to be a real test: 60 passages, 73-111 words each (90 on average), 4 items per passage. Real CSE passages are much longer and the questions take longer to answer. | 60 passages, 240 items |
| Q12 | High | 53 data-interpretation items make you calculate something for every row before you can answer: 17 ask for the highest or lowest ratio (4 divisions, e.g. v17-q163 59/11800 vs 51/10200 ...), 6 are weighted averages (4 multiplications and a division, e.g. v04-q161), 29 are multi-step. Some mocks have 6 of them (v04, v11). The answer usually hinges on rounding, not on reading the chart. | 53 of 320 DI items |
| Q13 | Medium | About 90 Numerical items are long hand arithmetic with no shortcut: compound interest to the peso (v12-q115), successive discounts plus tax plus a fee (v05-q099), mixed-fraction borrowing (v04-q088), decimal chains (v02-q082). These test patience rather than reasoning. | 52 basic operations, 38 word problems |
| Q14 | Low | 51 of the 80 chart/table sets use thousands-scale numbers (e.g. PHP 781,200 + 703,000 + ...) where small numbers would test the same skill. | 51 sets |

Still open from the first pass: Q3 answer leak (the correct choice is the longest option 58% of the time), Q4 joke distractors, Q5/Q6 duplicates and near-duplicates, Q7 nothing human-reviewed.

Overall: the answer keys are reliable (no wrong key found in about 50 hand-checked items and 690 recomputed sums), but as practice for the real exam the bank is weak. It is too easy to guess (Q3, Q4), it repeats itself across mocks (Q6), its reading is too short (Q11), and its hardest items are tedious arithmetic instead of reasoning (Q12, Q13).

### Fixes applied (2026-11-21)

- Q12 fixed: 31 data-interpretation items rewritten. Each still uses its original table, but now asks a reasoning question (a compound condition, a supported statement, a check against a friendly benchmark such as 90% or 300 per hour) or an "about what percent" question whose choices are far enough apart that estimating decides it. No weighted averages or four-way close ratio comparisons remain in these sets.
- Q13 narrowed and fixed: a closer read shows most flagged fraction and decimal items are normal 30-45 second exam work. 19 were truly tedious and are rewritten: 9 compound-interest-to-the-peso items now test the idea (interest on interest, up 20% then down 20%, doubling, simple vs compound), 3 stacked discount/tax items now ask for the equivalent discount or the effect of order, 6 long multiplications now have a shortcut (25 x, 99 x, 125 x 8), and the 9-and-15-hour pump item now resolves to whole hours.
- Every rewritten item keeps its ID; past attempts store their own copy of each question, so history is unchanged. Provenance notes the rewrite and status stays needs_review.
- Because difficulty now comes from reasoning rather than arithmetic, several rewritten items are medium or easy. To keep the validated 50/90/30 split per mock, 21 paragraph-organization items (hard under the authoring rubric) were relabeled from medium to hard.
- Still open: reading is rated slightly faster than data interpretation (74 vs 78 seconds) until the passages are lengthened (Q11).

## Question display audit (2026-11-21)

Real bank items of every type were opened in the exam screen (`?fixture=exam&question=<id>`) at 1536x736 and 375x812.

| # | Finding | Status |
|---|---|---|
| D1 | Line charts always started the axis at 0 with odd ticks (0, 27, 55, 82, 109), so 97-99% uptime drew as two flat overlapping lines and v06-q163 ("largest increase") could not be read from the chart. | Fixed: the axis fits the data with round steps, points show their values (one- and two-line charts), and the left margin fits the tick labels on phones. |
| D2 | Shape and arrow symbols came from mixed fonts, so ▲ and ○ differed in size and weight, and answer choices showed them at body-text size. | Fixed: shapes and arrows are drawn as matching SVG glyphs and enlarged in choices. |
| D3 | Sequences ("7, 12, 17, 22, ____", "▲○, ▲▲○○, ...") were plain sentences. | Fixed: number-sequence and abstract-reasoning items show each term as a tile with a "?" slot. |
| D4 | "Row 1: ... Row 2: ... Row 3: ..." matrices and "[2, 5, 7], [4, 3, 7], [6, ?, 10]" rows were plain text you had to picture. | Fixed: both render as grids. |
| D5 | Paragraph-ordering items in v14-v20 label sentences "A. B. C. D." and showed as one dense paragraph; choices like "A-C-D-B" were not drawn as steps. | Fixed: all 160 ordering items now parse into a numbered list, and letter orders render as steps. |
| D6 | Movement puzzles in words ("a marker moves two corners clockwise on every turn") make you imagine the figure, and the same ↑ → ↓ ← rotation item repeats in nearly every mock. | Fixed: all 26 word-described figure puzzles are replaced by drawn figure series (new `figures` stimulus kind). Each concept appears once; easy items use one rule, medium items combine two. Original answer letters and difficulty are kept. |
| D7 | Ordering items and 15 chart sets use A-D as statement or row labels, which collide with the A-D answer letters. | Fixed 2026-11-22: chart rows renamed (60 items); v15-v20 ordering sentences now I-IV (48 items); v14-q152 tasks renamed K-N. |
| D8 | Bar charts with several measures show one measure at a time behind tabs; the exact table below has all of them. | Open, minor. |

### Reading passages (2026-11-21)

- Q11 fixed: all 60 passages were lengthened from 73-111 words (average 90) to 146-247 words (average 182). Each keeps its original sentences word for word; a new opening paragraph adds background (who is affected, why it matters) and a middle paragraph adds detail or viewpoints. Neither adds an action, so all 240 existing questions keep the same single correct answer. A before/after diff confirmed that only passage text changed.
- Q10 fixed: reading items in versions 1-13 now expect 95 seconds, so reading averages 87 seconds against 78 for data interpretation. Versions 14-20 derive time from difficulty and were left unchanged.
- Still open: most passages share one template (a problem, a pilot, a result, more monitoring), and so do many of their questions. Real exam reading covers more genres.

### Guessable reading answers (2026-11-21)

- Q3, reading comprehension part fixed: in 234 of the 240 reading questions, the three wrong choices were rewritten as believable misreadings of the passage (a detail swapped in, a cause reversed, a later step presented as the first, true but not what was asked) at about the same length as the correct answer. Correct answers, answer letters and explanations are unchanged; a before/after diff confirmed nothing else moved. The six NOT-type questions (v04-q072, v06-q072, v06-q074, v16-q074, v18-q073, v19-q080) keep their true-statement choices.
- Result: the correct answer is the longest choice in 28% of reading questions (was 94%; 25% is pure chance), and correct and wrong choices now average the same length (ratio 1.02, was 1.97). Bank-wide, correct is the unique longest in 28% of all items.
- Still open: General Information (correct is longest in 73-89%, many joke wrong choices) and assumptions/conclusions (54%).

### Guessable General Information answers and joke choices (2026-11-21)

- Q3 and Q4, General Information part fixed: in 377 of the 400 GI questions the wrong choices were rewritten. Joke choices ("belongs permanently to anyone who passes a civil service exam", "freedom to impose a belief by force", "private passwords") are replaced with real near-misses from the same law: the wrong deadline or number (thirty days instead of sixty, five signatories instead of three), the wrong body (prosecutor instead of judge, Senate instead of House), a different UDHR article or constitutional right, a real RA 6713 prohibition that is not the one the scenario shows, or a plausible but unlawful environmental practice (dilution instead of treatment, controlled dump, open burning). Norm-name questions now list only real RA 6713 norms as wrong choices. Correct answers, answer letters and explanations are unchanged; one NOT-type item (v07-q005) keeps its true-statement choices.
- Result: correct is the longest choice in 23% (Constitution), 29% (human rights), 39% (RA 6713) and 41% (environment) of GI questions, down from 73-89%, and correct and wrong choices average the same length. Bank-wide, correct is the unique longest in 22.7% of items (25% is pure chance).
- Not human-reviewed: every rewritten choice was checked against the law by the author, but a reviewer with legal knowledge should spot-check a sample before relying on the bank for high-stakes study.
- Still open: assumptions/conclusions (correct longest in 54%), cross-mock repeats (Numerical 47%).

### Guessable assumption and conclusion answers (2026-11-22)

- Q3, assumptions/conclusions part fixed: 124 of the 280 items had a correct answer that stood out as the long, carefully hedged choice against short absolute wrong choices. Their wrong choices now read as equally careful reasoning errors: affirming the consequent, reversing a conditional, generalizing from a self-selected or small sample, before/after comparisons offered as the strongest test, or an assumption that helps the argument but is not necessary. Wrong choices that would themselves be a valid criticism (an unmentioned confound, reverse causation, a selection effect) were avoided so each item keeps one defensible answer. Short formal-logic items were left as they were.
- Result: correct is the longest choice in 19% of these items (was 54%); bank-wide 19.9%.
- Still open: cross-mock repeats, especially Numerical (47% of items have a close twin).

### Cross-mock copies (2026-11-22)

- Q5/Q6 fixed for near-identical copies: a stricter check (same wording, or similar wording plus the same numbers or answer) found 137 extra copies in 116 groups, such as the same analogy word for word in two or three mocks, 2, 6, 12, 20, 30 in five mocks, and "A in 10 days, B in 15" in five mocks. 98 later copies were replaced with new items of the same type, keeping each item's answer letter and difficulty: 36 analogies, 21 sequences and symbol puzzles, 14 word problems, 9 verbal and logic items, and 13 General Information items on different provisions. Each new sequence and analogy was checked against every other item in the bank; the arithmetic of every new word problem was recomputed.
- The 13 new General Information items were checked by web search against the statute or declaration text: RA 6713 Sections 4(c), 5, 7(b)(2) and 8; 1987 Constitution Article III Sections 6, 19 and 22; UDHR Articles 7 and 14; RA 9003 Sections 4 and 20. The searches also confirmed the facts the earlier rewritten wrong choices rely on (SALN within 30 days of assumption and by April 30, not more than three signatories as far as practicable, divestment within 60 days, response within 15 working days).
- Result: near-identical copies fell from 137 to 51, and every remaining match was reviewed. They are the same kind of question with different numbers (for example two different catch-up problems that both answer 1 hour), different scenarios testing the same RA 6713 norm, or different sentences sharing a generic instruction. None share both numbers and answer.
