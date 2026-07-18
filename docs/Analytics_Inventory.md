# Analytics Inventory

This document records the privacy-conscious learning telemetry already captured by the reviewer. It is product data for the signed-in user, not advertising or cross-site tracking.

## Two Different Section Views

- **Study Hub: Exam Sections** shows completion in the current unfinished attempt. `8 / 60` means eight Verbal questions currently have selected answers. It does not represent correctness.
- **Progress: Section Accuracy** combines correct and attempted answers from completed attempts. `75%` means three out of every four answered Numerical questions were correct across the selected history.
- **Results: Section Accuracy** shows correctness for one submitted attempt only.

These labels must remain explicit because completion and accuracy can have similar colored bars while answering different questions.

## Attempt Record

Persisted in `attempts`:

- User, mode, title, practice category, exam version, and question order.
- Status: in progress, paused, submitted, or timed out.
- Start, pause, submit, and update timestamps.
- Current question index and total question count.
- Total elapsed active time and configured time limit.
- Score, percentage, timeout state, and run options.
- Aggregate event count, action counts, visibility interruptions, hidden duration, and a bounded recent event history.

## Per-Question Record

Persisted in `attempt_answers`:

- Question ID, position, displayed item number, original item number, section, subtopic, skill, difficulty, prompt, choices, correct choice, explanation, and stimulus snapshot.
- Selected answer, skipped state, flagged state, and answer history.
- Active time spent on that question. Time follows the active item across free navigation and resumes when the user returns.
- Visit count, first/last seen timestamps, and first/last answered timestamps.
- Answer-change count, wrong-to-correct changes, and correct-to-wrong changes.

## Interaction Events

The bounded attempt telemetry records these event types with a timestamp and current question ID:

- `answer-selected`, including the new and previous choice.
- `answer-cleared`.
- `skip`.
- `flag` and `unflag`.
- `navigate`, including source and from/to indexes.
- `visibility-hidden` and `visibility-visible`.
- `save-and-exit`.

The detailed event list retains only the most recent 200 events. Aggregate counts continue beyond that limit.

## Pause And Visibility

- Pause/resume intervals are persisted in `pause_events`.
- A hidden browser tab does not accrue active question time.
- Visibility interruptions and total hidden duration are retained as aggregate context, not treated as study time.
- Returning to a visible tab resets the timing baseline so background throttling cannot create a time jump.

## Synchronization Guarantees

- Dirty attempt and answer records are batched for synchronization every 3.5 seconds.
- Pause, save-and-exit, visibility loss, submission, and timeout request an immediate flush.
- Failed writes remain dirty and are retried; a failed network request must not silently discard timing or answer changes.

## Deliberate Privacy Limits

The app does not collect advertising identifiers, browsing history, precise location, device fingerprinting, keystrokes, clipboard data, or background activity outside the reviewer. Raw telemetry is private to the signed-in account and should only be surfaced as useful personal feedback.
