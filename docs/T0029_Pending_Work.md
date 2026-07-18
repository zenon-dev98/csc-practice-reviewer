# T0029 Pending Work Register

This file is the durable checklist for the numbered requirements received on 2026-07-12. Items remain here until implementation, QA, and live verification are complete.

## Numbered Requirements

1. **Pending - content-proportional layout is a release gate.** Remove forced oversized containers, especially the four Mock Exam section summaries. Add the rule to the visual QA agent and reject dead space created only to fill the viewport.
2. **Pending - Account Settings rework.** Replace the preallocated password accordion with a standard dedicated password-change dialog; repair field spacing; add 20 animal avatar choices; add editable nickname and prioritize nickname in signed-in display.
3. **Pending - restrained motion.** Add a subtle energy/burning treatment to `LOCK IN. KEEP MOVING.` plus purposeful button, icon, progress, and transition motion with reduced-motion support.
4. **Pending - typography unification.** Enforce the v4 type roles across every state: Barlow Condensed for display/numerics, Rajdhani for controls/HUD labels, system sans-serif for long reading copy.
5. **Pending - Submit Exam alignment.** Vertically align the warning icon and keep the review note clear of the status-cell borders and decorative geometry.
6. **Pending - exam navigator continuity.** Preserve navigator scroll and expanded state after More/Less, question selection, and answer actions; support wheel and mouse drag scrolling with no visible scrollbar.
7. **Pending - audio behavior and header alignment.** Make audio reliably audible after explicit user activation and prevent audio controls from displacing the account control.
8. **Pending - full v4 visual reset.** Treat `states/v4/study_hub.png` as the sole theme master. Define invariants, repair Study Hub to parity, regenerate every other canonical state, visually reject disconnected generations, and adapt approved references into the app.
9. **Pending - responsive matrix.** Capture and inspect standard desktop, laptop, tablet, and mobile sizes; repair each layout rather than globally shrinking it.
10. **Pending - deploy.** Run pre-deployment validation, cache-bust, push `main`, and verify the public GitHub Pages build.
11. **Pending - favicon.** Replace the white-backed page icon with a transparent cockpit shield favicon.
12. **Pending - coexistence with other desktop work.** If another project controls the foreground browser, continue code, fixture, reference, or automated QA work and return to external Edge inspection when the screen is available.

## Analytics Foundation

The app already stores the following per attempt: mode, version, start/submission/pause timestamps, elapsed time, current item, question count, time limit, score, percent, timeout state, run options, and question order.

It already stores the following per question: section, subtopic, skill, difficulty, stimulus, selected and correct choice, skipped/flagged state, active time, visits, first/last seen, first/last answered, answer-change count, wrong-to-correct changes, correct-to-wrong changes, and timestamped answer history. Pause/resume events are stored separately.

T0029 will add compact versioned telemetry inside existing JSONB data rather than requiring a speculative new table. It will record question entry/leave/navigation source, clear/skip/flag actions, visibility interruptions, resume count, and action counters. It will not record pointer coordinates, keystrokes, device fingerprints, or unrelated personal data.

## Similar-Looking Metrics Clarification

- Study Hub `Exam Sections` means progress inside the currently active attempt: questions completed out of that run's section total.
- Progress `Section Performance` means historical correctness across completed attempts.
- Rename the historical view to `Section Accuracy` and keep different labels/units so the two views no longer look like duplicate information.

## Password Pattern Sources

- GOV.UK Password Input: show/hide controls, hidden by default, clear error behavior, and correct autocomplete purpose.
- MDN Password Inputs: `current-password` for verification and `new-password` for replacement fields.
- OWASP Authentication guidance: re-authenticate for sensitive changes, permit strong passphrases, and avoid arbitrary periodic password rotation.
