# V5 Visual Reference Manifest

## Active master

- `../v4/study_hub.png` remains the sole signed-in shell master.
- Canvas: `1672x942` logical pixels.
- Primary target: maximized Microsoft Edge at 100% zoom on desktop.
- V5 references inherit the v4 shield, two-line brand lockup, centered four-tab navigation, account control, graphite/cyan cockpit surfaces, content-proportional panels, and quiet internal scrolling.

## Approved reference set

All files below are generated visual direction, not production data. Implementations must preserve the information architecture and shell contract while replacing fabricated values with real or empty-state values.

- `full_mock_setup.png` - Mock Exam setup, approved.
- `practice_review_practice.png` - Practice builder, approved.
- `practice_review_mistakes.png` - Mistake review queue, approved.
- `practice_review_mistakes_empty.png` - Mistake review empty state, approved.
- `practice_review_flagged.png` - Flagged review queue, approved.
- `practice_review_flagged_empty.png` - Flagged review empty state, approved.
- `progress.png` - Progress and section accuracy, approved.
- `progress_empty.png` - Progress empty state, approved.
- `results_pass.png` - Full mock pass debrief, approved.
- `results_fail.png` - Full mock needs-work debrief, approved.
- `results_practice.png` - Practice debrief, approved.
- `answer_review.png` - Answer review workstation, approved.
- `answer_review_empty.png` - Answer review empty filter, approved.
- `exam_active.png` - Active exam, approved.
- `exam_graph.png` - Graph/table question, approved.
- `exam_pause.png` - Pause checkpoint, approved.
- `exam_submit.png` - Submit confirmation, approved.
- `exam_timeout.png` - Timeout synchronization, approved.
- `practice_exam.png` - Practice player, approved.
- `chart_modal.png` - Expanded chart modal, approved.
- `account_settings.png` - Account settings drawer, approved.
- `account_password_dialog.png` - Password update dialog, approved.
- `account_delete_confirmation.png` - Account deletion confirmation, approved.
- `delete_attempt.png` - Attempt deletion confirmation, approved.
- `create_account.png` - Create account access console, approved direction.
- `sign_in.png` - Sign-in access console, approved direction.
- `system_loading.png` - Loading/boot state, approved direction.
- `system_error.png` - Diagnostic error state, approved direction.

## Drafts requiring regeneration before parity sign-off

- `exam_nav_collapsed-draft.png`: generated header drifted from the active exam shell; use the approved active exam shell and regenerate only if a separate collapsed header reference is needed.
- `forgot_password-draft.png`: contains a dimmed `Remember me` control from an older direction; do not implement that control and regenerate before treating it as approved.

## Allowed deviations

- Live values may differ from references; geometry, hierarchy, shell, typography, and state semantics may not.
- Native emoji avatars may replace image assets if their octagonal plates, size, contrast, and keyboard states match the account reference.
- Empty, partial, dense, long-text, and error fixtures are required even when the approved image shows populated content.
