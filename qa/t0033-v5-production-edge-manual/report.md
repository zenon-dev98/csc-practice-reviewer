# T0033 V5 Production External Edge Report

## Environment

- Browser: Microsoft Edge
- Window: maximized
- Zoom: 100%
- Captured content viewport: 1536 x 816
- App: `http://127.0.0.1:4173/index.html`
- Evidence: 52 PNG screenshots in this directory

## Canonical State Sweep

The external-browser pass captured every registered canonical fixture:

- System: loading, configuration, fatal error
- Account access: create account, create loading, sign in, sign-in loading, forgot password, reset error, reset success
- Home: populated Study Hub and new-account empty state
- Setup and exam: setup, default exam, collapsed groups, graph question, expanded chart, pause, submit, timeout
- Practice & Review: practice, mistakes, mistakes empty, flagged, flagged empty
- Progress: populated, recent alias, empty
- Results: pass, fail, practice result
- Answer Review: populated and empty
- Account: settings, password expanded, delete account, delete attempt

## Manual Interaction Evidence

- `38`-`44`: expanded Verbal Ability, internal navigator scrolling, item 80, return to item 21, and Less collapse. Lower sections remain reachable and the sidebar remains the sole scroll owner.
- `45`-`46`: selecting an answer enables Next; Next advances to item 22. Unanswered Next remains disabled in the default exam captures.
- `47`-`48`: Pause opens the checkpoint dialog and Resume restores the active exam.
- `49`: Submit opens the final confirmation without submitting the fixture.
- `50`-`51`: Account Settings opens only from the upper-right signed-in account control.
- `52`: final cache-busted Study Hub recapture after the release asset version was applied.

## Automated Release Evidence

- `qa/t0033-v5-production-desktop-matrix-r2/`: 185 screenshots, five desktop viewports, zero failures.
- `qa/t0033-v5-production-mobile-matrix-r2/`: 74 screenshots, two mobile viewports, zero failures.
- `qa/t0033-v5-production-interactions-r3/`: 72 screenshots, 42/42 checks passed.

## Outcome

No remaining text collision, clipped control, document overflow, sampled element overflow, console failure, unreachable expanded question, or active decorative animation was found in the final local build.
