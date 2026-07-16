# Content Audit

Status: complete for source-image audit and generated-bank expansion

## Purpose

Digitize and audit `image_01.jpg` through `image_29.jpg` for the CSC Reviewer app.

## Official Coverage Baseline

Professional level:

- 170 total items
- 3 hours and 10 minutes
- General Information
- Verbal Ability
- Numerical Ability
- Analytical Ability

Official topic details to cover:

- Verbal Ability: vocabulary, grammar and correct usage, correct reasoning / reading comprehension
- Numerical Ability: basic operations, number sequence, word problems
- Analytical Ability: word analogy, symbolic logic / abstract reasoning, identifying assumptions and drawing conclusions, data interpretation
- General Information: Philippine Constitution, Code of Conduct and Ethical Standards for Public Officials and Employees, peace and human rights, environment management and protection

Sources:

- https://www.csc.gov.ph/more-than-400k-to-take-26-march-career-service-exam
- https://csc.gov.ph/phocadownload/userupload/erpo/advisories/2026/ExamAdvisory_2026_02_School%20Assignment%20Impt%20Reminders%20for%2008%20March%202026%20CSE-PPT%20Sgd.pdf
- https://csc.gov.ph/phocadownload/userupload/erpo/announcements/2026/ExamAnn_2026_03_Conduct%20of%2009%20Aug%202026%20CSE-PPT_orig%20signed.pdf

## Initial Observations

- The mock booklet's own table of specifications lists:
  - General Information: 20 items
  - Verbal Ability: 60 items
  - Numerical Ability: 40 items
  - Analytical Ability: 50 items
  - Total: 170 items
- The source images include cover/instruction pages, question pages, answer sheet pages, answer key/explanation pages if present, and a disclaimer.
- The visible sample questions are all four-choice multiple choice.

## Page Inventory

| Image | Page role | Status | Notes |
| --- | --- | --- | --- |
| image_01.jpg | Cover | inspected | Professional 170 items, Set H v3 2026, practice copy disclaimer. |
| image_02.jpg | Table of specifications | inspected | Lists 20/60/40/50 item split. |
| image_03.jpg | Questions | indexed | General Information items 1-7. |
| image_04.jpg | Questions | indexed | General Information items 8-15. |
| image_05.jpg | Questions | indexed | General Information items 16-20; Verbal Ability items 21-22. |
| image_06.jpg | Questions | indexed | Verbal Ability items 23-30. |
| image_07.jpg | Questions | indexed | Verbal Ability items 31-38. |
| image_08.jpg | Questions | indexed | Verbal Ability items 39-46. |
| image_09.jpg | Questions | indexed | Verbal Ability items 47-53. |
| image_10.jpg | Questions | indexed | Verbal Ability items 54-61. |
| image_11.jpg | Questions | indexed | Verbal Ability items 62-70. |
| image_12.jpg | Questions | indexed | Verbal Ability items 71-79. |
| image_13.jpg | Questions | indexed | Verbal Ability item 80; Numerical Ability items 81-88. |
| image_14.jpg | Questions | indexed | Numerical Ability items 89-97. |
| image_15.jpg | Questions | indexed | Numerical Ability items 98-107. |
| image_16.jpg | Questions | indexed | Numerical Ability items 108-116. |
| image_17.jpg | Questions | indexed | Numerical Ability items 117-120; Analytical Ability items 121-125. |
| image_18.jpg | Questions | indexed | Analytical Ability items 126-134. |
| image_19.jpg | Questions | indexed | Analytical Ability items 135-143. |
| image_20.jpg | Questions | indexed | Analytical Ability items 144-151. |
| image_21.jpg | Questions | indexed | Analytical Ability items 152-159. |
| image_22.jpg | Questions | indexed | Analytical Ability items 160-166. |
| image_23.jpg | Questions | indexed | Analytical Ability items 167-170. |
| image_24.jpg | Answer sheet | inspected | Items 1-85 answer sheet. |
| image_25.jpg | Answer sheet | inspected | Items 86-170 answer sheet. |
| image_26.jpg | Answer key | captured | Final answer key items 1-60. |
| image_27.jpg | Answer key | captured | Final answer key items 61-120. |
| image_28.jpg | Answer key | captured | Final answer key items 121-170. |
| image_29.jpg | Disclaimer | inspected | Independent practice material disclaimer. |

## Extracted Artifacts

- `data/source_question_index.csv`: item-level source image, section, subtopic, answer, and transcription status for all 170 items.
- `data/answer_key_set_h_v3_2026.json`: machine-readable final answer key captured from pages 26-28.
- `app/question-data.js`: browser-ready source-image metadata retained for audit and fallback.
- `app/question-bank/`: manually authored production bank with 20 versions and 3,400 questions.
- `data/question_bank_quality_audit.json`: coverage, difficulty, balance, duplicate, ambiguity, and stimulus audit for all authored versions.

## Section Boundaries

- General Information: items 1-20
- Verbal Ability: items 21-80
- Numerical Ability: items 81-120
- Analytical Ability: items 121-170

These match the booklet's table of specifications: 20/60/40/50.

## Coverage Audit

Confirmed present:

- General Information covers RA 6713, Constitution, environment, human rights, peace education, accountability, transparency, and frontline service.
- Verbal Ability covers synonyms, antonyms, vocabulary in context, grammar, error identification, spelling, and short reading comprehension.
- Numerical Ability covers basic operations, percentage, fractions/decimals, ratio, rate, averages, algebra, geometry, GCF/LCM, number sequence, and word problems.
- Analytical Ability covers word analogy, conclusion-following logic, alphanumeric/process sequences, and number patterns.

Missing or weak against official CSC topic expectations:

- Filipino verbal items appear absent.
- Data interpretation using tables, charts, schedules, or graphs appears absent.
- Symbolic logic / abstract reasoning appears weak; most items are verbal logic or number patterns rather than symbolic/visual reasoning.
- Numerical number sequence is present but limited compared with arithmetic and word problems.
- Analytical assumptions/conclusions are present, but many use the same repeated answer-choice pattern.
- No visual abstract reasoning items were observed.

Authored-bank coverage:

- The authored bank includes Filipino vocabulary, sentence completion, error recognition, structure, paragraph organization, and reading items.
- Every version includes 22 numerical word problems and 16 analytical data-interpretation questions.
- Every version includes analogy, symbolic/abstract reasoning, and assumption/conclusion items.
- Every version includes original shared passages and four linked data stimulus groups with exact tables and accessible alternatives.
- Every version preserves the Professional split of 20 General, 60 Verbal, 40 Numerical, and 50 Analytical items.
- All 3,400 stems are unique under exact, normalized-template, and shuffled-choice duplicate checks.

## Review Status Values

- `verified`: clear from image and reviewed
- `needs_review`: unclear wording, choice, answer, or classification
- `source_only`: page is not an app question source

## Next Steps

- Manually review the generated Filipino, data-interpretation, and symbolic-reasoning questions for teaching quality.
- Manually review generated legal/general-information items for exact phrasing and legal nuance.
- Manually verify the source answer key against images before using the image-backed fallback for serious scoring.
- Add Supabase import/export scripts after the hosted project and auth policy are chosen.
