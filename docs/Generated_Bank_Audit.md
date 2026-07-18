# Authored Bank Audit

Last audited: 2026-07-16

## Current Result

- Versions: 20
- Items per version: 170
- Total manually authored questions: 3,400
- Per-version section split: General 20, Verbal 60, Numerical 40, Analytical 50
- Per-version difficulty split: 50 easy, 90 medium, 30 hard
- Per-version data stimulus groups: 4, each linked to four questions
- Exact duplicate prompt groups: 0
- Normalized-template duplicate groups: 0
- Shuffled-choice duplicate groups: 0
- Ambiguous logic groups detected: 0
- Blocking audit findings: 0

Machine-readable audit:

- `data/question_bank_quality_audit.json`

## CSC Coverage Checks

Every authored version is validated for the official 2026 Professional coverage areas:

- General Information: Philippine Constitution (6), RA 6713 / Code of Conduct (6), peace and human rights (4), and environment management and protection (4).
- Verbal Ability: word meaning (10), sentence completion (10), error recognition (10), sentence structure (10), paragraph organization (8), and reading comprehension (12), in English and Filipino where applicable.
- Numerical Ability: basic operations (10), number sequence (8), and word problems (22).
- Analytical Ability: word analogy (10), symbolic logic / abstract reasoning (10), identifying assumptions and drawing conclusions (14), and data interpretation (16).

## Replacement Of The Previous Bank

- Removed the runtime generator and the generated production artifact.
- Replaced repeated templates and choice-shuffled variants with manually authored stems, choices, answers, and explanations.
- Added stable provenance, review status, quality status, and CSC-skill metadata.
- Added original passages plus exact-value table, bar-table, and line-table stimuli with accessible alternatives.
- Added strict audits for repeated stems, repeated normalized templates, shuffled-choice duplicates, weak metadata, answer-position imbalance, long answer runs, difficulty, and skill coverage.

## Remaining Human Review

The bank has passed structural and editorial audits, but it remains independent practice content rather than an official CSC question set. A qualified second reviewer should still review:

- legal/general-information phrasing
- Filipino vocabulary nuance
- distractor plausibility
- graph/table difficulty balance
- explanations for ambiguous analytical items
