# T0030 Pasted Request Redo Register

Status: in progress - live verification pending

Source of truth: `C:\Users\Acer\.codex\attachments\d5fe2964-2ad9-4c0a-9617-0c6386421e93\pasted-text.txt`

T0029 was closed without implementing or visually verifying the complete pasted request. This register restores the original requirements without compressing, renumbering, or silently dropping them. An item is complete only after implementation, interaction verification, direct screenshot comparison against the applicable V4/V5 reference, and live verification.

## Product And Analytics Questions

- [x] Explain and visually distinguish active-attempt `Exam Sections` completion from historical `Section Accuracy`.
- [x] Verify that per-question active time survives navigation and resumes when returning.
- [x] Inventory persisted attempt, answer, timing, navigation, pause, visibility, and answer-change analytics; preserve a privacy-conscious foundation for future reports.

## Original Numbered Requirements

1. [x] Repair the Study Hub progress visualization and its Verbal, Numerical, Analytical, General, and overall semantics. No label may collide with the ring or another label; every color must have an explicit meaning.
2. [x] Remove the collision between the Review command and the lower-left edge/action rail of Your Records.
3. [x] Keep the retired Study Hub section-performance ribbon removed and proportionally rebalance the active-run and records regions without forced height or dead space.
4. [x] Remove the `Saved online` label from Study Hub.
5. [x] Rework the compatible signed-in top navigation so each destination has a meaningful icon by default and reveals its familiar text label on hover/focus without moving the header or account control.
6. [x] Rebuild Account Settings around a standard dedicated password-change workflow informed by primary accessibility/security guidance; do not reserve collapsed accordion space.
7. [x] Restore deliberate spacing between email/account identity content and the password action.
8. [x] Provide about 20 cute animal avatar choices, editable nickname, and nickname-first signed-in display.
9. [x] Add restrained, reduced-motion-safe animation, including a subtle energy/heat effect for `LOCK IN. KEEP MOVING.` and purposeful interaction feedback.
10. [x] Enforce one typography system across every state.
11. [x] Rework every Practice & Review state using the connected V5 visual references, semantic section colors, content-sized controls, and no stretched low-content rectangles.
12. [x] Rework Results insights so their content fills its intended area, metadata clears panel edges and rails, and no value or icon collides.
13. [x] Audit every task/review/player state and provide a clear non-submitting exit/back route for accidental entry where product behavior permits it.
14. [x] Correct Submit Exam icon vertical alignment and separate the review warning from the status-cell geometry.
15. [x] Preserve exam navigator expansion and scroll position across More/Less, question selection, and answer rerenders; support wheel and pointer-drag scrolling with no prominent scrollbar.
16. [x] Treat `states/v4/study_hub.png` as the sole visual master and every approved `states/v5/*.png` image as a hard state contract. Implement every canonical state, reject disconnected shell/header/icon/font/layout treatments, and repeat direct image inspection until each state visibly belongs to one application.

## Release Gates

- [x] V4/V5 source images and matching implementation screenshots are paired in the final QA folder.
- [ ] Maximized Microsoft Edge at 100% zoom is inspected at the real desktop content viewport.
- [x] Empty, partial, populated, dense, open, closed, hover, focus, disabled, loading, error, modal, and submitted states are checked where applicable.
- [x] JavaScript, data, dependency, Impeccable, console, overflow, interaction, and responsive checks pass.
- [ ] Assets are cache-busted, pushed to `main`, and the live GitHub Pages asset versions and representative states are verified.

## Verification Evidence

- `qa/t0030-release-final/`: 37 states at six viewports, 222 screenshots, zero console/document failures, and zero sampled element overflows.
- `qa/t0030-release-interactions-final/`: 64 screenshots and 29/29 interaction assertions passed.
- `qa/t0030-final-comparison/`: eight direct V4/V5 reference/current pairs.
- `docs/Analytics_Inventory.md`: persisted analytics inventory and the completion-versus-accuracy distinction.
- Static checks passed: JavaScript syntax, generated-bank validation, local dependency policy, and Impeccable detection.
