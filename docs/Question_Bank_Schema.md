# Question Bank Schema

The app supports two question sources:

- source-image questions from the provided mock booklet
- manually authored questions used by the current 20-version practice bank

The authored bank is loaded from `app/question-bank/`. The source-image bank remains available as an audit trail and recovery fallback.

## Source Files

- `data/source_question_index.csv`: canonical item index for all 170 items.
- `data/answer_key_set_h_v3_2026.json`: captured final answer key from source pages 26-28.
- `app/question-data.js`: source-image browser metadata retained for audit and fallback.
- `app/question-bank/manifest.js`: shared authored-question constructors and version registry.
- `app/question-bank/version-01.js` through `version-20.js`: manually authored production versions.
- `scripts/audit-question-bank.mjs`: duplicate, balance, difficulty, ambiguity, metadata, and coverage audit. It validates content; it does not generate questions.
- `data/question_bank_quality_audit.json`: latest machine-readable authored-bank audit.
- `app/images/image_01.jpg` through `app/images/image_29.jpg`: static source images.

## Fields

Each question has:

- `id`: stable ID, e.g. `set-h-v3-2026-1`
- `itemNumber`: 1-170
- `sourceImage`: source page image filename
- `sourcePage`: booklet page number
- `version`: authored version number when applicable
- `mode`: `image`, `typed`, or `stimulus`
- `section`: General Information, Verbal Ability, Numerical Ability, or Analytical Ability
- `subtopic`: specific classification used for stats
- `cscSkill`: official coverage skill used for audit checks
- `prompt`: typed question stem
- `choices`: four answer choices
- `correctChoice`: A, B, C, or D
- `explanation`: explanation shown after submission
- `expectedSeconds`: initial expected answer time estimate
- `reviewStatus`: extraction/review state
- `qualityStatus`: authored-content review status
- `stimulus`: optional shared table/chart/logic setup for linked questions

## Validation Rules

- Exactly 170 items.
- Item numbers must be 1-170 with no duplicates.
- Every item must have one answer A-D.
- CSV answer and JSON answer key must match.
- Section counts must be 20/60/40/50.
- Every item must point to an existing source image.
- The authored bank must contain exactly 20 versions and 3,400 stable question IDs.
- Each version must contain exactly 170 questions with section counts of 20/60/40/50.
- Every version must satisfy the documented CSC skill matrix and a 50 easy / 90 medium / 30 hard split.
- Prompts must have no exact, normalized-template, or shuffled-choice duplicates.
- Choices must contain four distinct A-D options and the correct choice must exist.
- Questions must include prompt, explanation, difficulty, expected seconds, review status, quality status, CSC skill, provenance, and a valid render mode.
- Every version must include four data-interpretation stimulus groups, with at least two exact-value tables.
- Stimulus groups must link 3-5 questions and include labels plus accessible alternate text.

## Variant Support

The app stores 20 authored version IDs, each with its own 170 questions. It tracks seen question IDs per account and chooses the next least-repeated version for returning users. The original source-image set remains available for audit and fallback but is not the primary runtime bank.
