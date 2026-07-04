# Question Bank Schema

The v1 app supports two question sources:

- source-image questions from the provided mock booklet
- generated typed questions used by the current 20-version practice bank

The app prefers the generated typed bank when `app/generated-question-bank.js` is present. The source-image bank remains available as a fallback and audit trail.

## Source Files

- `data/source_question_index.csv`: canonical item index for all 170 items.
- `data/answer_key_set_h_v3_2026.json`: captured final answer key from source pages 26-28.
- `app/question-data.js`: generated browser data used by the static app.
- `app/generated-question-bank.js`: generated typed browser data with 20 full exam versions.
- `scripts/generate-question-bank.mjs`: source generator for the typed bank.
- `app/images/image_01.jpg` through `app/images/image_29.jpg`: static source images.

## Fields

Each question has:

- `id`: stable ID, e.g. `set-h-v3-2026-1`
- `itemNumber`: 1-170
- `sourceImage`: source page image filename
- `sourcePage`: booklet page number
- `version`: generated version number when applicable
- `mode`: `image` or `typed`
- `section`: General Information, Verbal Ability, Numerical Ability, or Analytical Ability
- `subtopic`: specific classification used for stats
- `cscSkill`: official coverage skill used for audit checks
- `prompt`: typed prompt for generated questions
- `choices`: four choices for generated questions
- `correctChoice`: A, B, C, or D
- `explanation`: explanation shown after submission
- `expectedSeconds`: initial expected answer time estimate
- `reviewStatus`: extraction/review state
- `qualityStatus`: generated-content review status
- `stimulus`: optional shared table/chart/logic setup for linked questions

## Validation Rules

- Exactly 170 items.
- Item numbers must be 1-170 with no duplicates.
- Every item must have one answer A-D.
- CSV answer and JSON answer key must match.
- Section counts must be 20/60/40/50.
- Every item must point to an existing source image.
- Generated bank must contain exactly 20 versions.
- Each generated version must contain exactly 170 questions.
- Generated question IDs and prompts must be unique across the 3,400-question bank.
- Generated section counts must be 20/60/40/50 per version.
- Generated choices must contain four A-D options and the correct choice must exist.
- Generated questions must include prompt, explanation, difficulty, expected seconds, review status, quality status, CSC skill, and typed mode.
- Generated versions must cover the documented CSC skill matrix.
- Stimulus groups must link 3-5 questions and include labels plus accessible alternate text.

## Variant Support

The app stores 20 generated version IDs, each with its own 170 typed questions. It tracks seen question IDs per profile and chooses the next least-repeated version for returning users. The original source-image set remains available for audit and fallback but is not the primary runtime bank when generated versions are loaded.
