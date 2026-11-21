# Known Issues And Followups

## Open
- A friend-reported attempt from the previous day is not visible in Progress. The client requests every `attempts` row owned by the current authenticated `user_id`, ordered by `started_at`, and contains no age/retention deletion path. Diagnosis therefore requires the friend's email or Auth UID and a Supabase Dashboard check of `attempts` and `attempt_answers`; likely causes include a different signed-in account, an interrupted initial save, or an explicit deletion. No production data was changed during this UI ticket.
- Cross-user attempt access is restricted to the enrolled administrator console by RLS. The admin deletion flow uses the private-schema security-definer helper and public security-invoker RPC in supabase/admin_attempt_delete.sql; the live deletion control is protected by admin enrollment, typed confirmation, and a complete audit snapshot. A service-role key must never be placed in this GitHub Pages frontend.
- T0042 automation validates camera-style image files, local-only OMR processing, frozen timeout handling, confirmation, and grading. Physical rear-camera permission capture and a real two-device Supabase handoff still require hardware/account verification and are not claimed as manually certified.
- T0040's final local automated release evidence is clean. The cache-busted live replay and the user's hands-on maximized Edge inspection remain required before closing the ticket; automation evidence does not replace that manual gate.
- All 3,400 authored questions remain `needs_review`. Automated structural, duplicate, balance, and coverage checks are clean, but qualified second review is still required for legal nuance, Filipino usage, distractor strength, and pedagogy.

- Future generated-image work must follow `docs/Generated_Image_To_UI_Playbook.md` and the `Generated Image Parity Agent` in `AGENTS.md`; the playbook does not itself approve the unresolved T0026 content decisions.
- T0026 documents a lower-density information architecture for all 37 fixture states. The eight decisions at the end of `docs/T0026_State_Content_Audit.md` must be approved before generating vNext references or implementing another redesign.
- T0028 repaired the Study Hub ring legend, Review Mistakes/Your Records collision, Mock Exam Setup density, and Results score/insight geometry; the final fixture and external-Edge sweeps passed without sampled overflow.
- Optional music and sound effects are now present as explicitly user-controlled, disabled-by-default CC0 assets. No audible autoplay occurs before interaction.

- Supabase backup/export workflow is not defined yet.
- The answer key has been captured from images but needs a second manual verification pass before scoring is considered final.
- The source booklet is missing or weak on Filipino verbal items, data interpretation, and symbolic reasoning. The manually authored bank now covers every official domain with no detected duplicates, but legal nuance, Filipino usage, distractor quality, and pedagogy still need an independent human second review before the bank should be treated as high-confidence study material.
- Stitch was used for the menu/dashboard redesign, but generated code export was not available through `Code to Clipboard`; it copied the prompt instead. Future Stitch iterations may still use Figma, MCP, or other export routes if configured.
- Supabase email confirmation is intentionally disabled for now because signup is invite-gated and the free email sender hit rate limits during QA. Revisit if using a custom SMTP sender.
- GitHub Actions reports a Node 20 deprecation warning for current action versions, but deployment succeeds under the forced Node 24 runner.
- The cockpit reference is now the active visual master. Older light `states/` screenshots remain behavioral references only and should not be mixed into new visual work.
- T0028's live build is cache-busted through `v=20260712-01`; future UI changes must bump this version and repeat the external Edge loop.
- At the smaller `1536x816` desktop fixture, the Results fun-fact cards use a compact mode that shows titles and values while hiding the extra descriptive sentence to preserve the one-screen no-scroll contract.
- `states/v2/` currently contains `sign_in.png` and `account_settings.png`; create account remains a proportional adaptation from the existing create/auth direction plus the v2 feature-row style until a dedicated v2 create-account mockup exists.
- T0022 repaired the signed-in dashboard/account/practice/mistakes/recent/exam-control flows at the maximized Microsoft Edge viewport. Any future desktop UI change should rerun the same screenshot loop rather than relying on CSS inspection.
- The Study Hub intentionally uses private personal records instead of the reference image's group rankings. Group comparisons require explicit user consent, aggregate privacy rules, and enough real participants before they should be added.
- T0024 is PC-first and uses a fixed logical desktop frame. Wider or differently proportioned desktop viewports intentionally show balanced ambient margins instead of stretching the cockpit.
- Mobile is fully responsive and screenshot-checked at `390x844` and `412x915`; long setup, practice, analytics, results, and review pages scroll normally by design rather than reproducing the fixed desktop frame.
- T0025 adds the actual maximized Edge content viewport (`1536x736`) to permanent fixture QA. Future cockpit changes must pass that target in addition to the logical, `1904x913`, and `1536x816` desktop canvases.
- T0029 final QA is clean across logical desktop, `1904x913`, `1536x816`, `1536x736`, `390x844`, and `412x915`; the only issue found during the last pass was a 4px narrow-screen Account Settings arrow overflow, which was repaired in the final override layer.
- T0030 supersedes the incomplete T0029 parity claim. Its final local six-viewport matrix, local/live 29-check interaction suites, live boot retry, and maximized external Edge inspection are clean. No open V5 parity defect remains from the restored pasted request.
- T0031 removed the moving expanded-section window and nested chip-grid scroll. The complete Verbal 21-80 range is now reachable in one sidebar flow; local/live desktop and mobile 80-to-21 regressions pass.
- T0032 deliberately retires all decorative animation and transitions. Motion should remain disabled until a future ticket defines a meaningful trigger, endpoint, duration, easing, and reduced-motion fallback.
- T0032 adds permanent release checks for pointer/keyboard focus modality, Setup label/value collisions and physical icon/type scale, Mistakes heading clearance, active animations, More/Less lower-content reachability, and mobile content that extends beyond the browser's actual scrolling element.
- T0032 now uses `app/v5-production.css` as the sole post-theme V5 production authority. The former `v5-parity.css` remains in repository history only and is not loaded by the app.

## Follow-Up Ticket Ideas

- Generate vNext page references only after the T0026 naming, content-removal, records, setup-toggle, results-highlight, and audio-scope decisions are approved.
- Implement the approved T0026 information architecture as a separate ticket, then run the full desktop/mobile fixture and interaction loops.

- Add a Supabase backup/export ticket before public use.
- Add a qualified second-review ticket for authored Filipino, data-interpretation, legal/general-information, and symbolic-reasoning items; promote individual items from `needs_review` only after that review.
- Add a Stitch MCP/Figma export ticket if direct generated-source handoff becomes available.
- Re-run the hardened mockup-adaptation rules whenever a new `states/` or `states/v2/` reference is added.

## Redesign follow-ups (2026-11-21)

- Sign-in, create-account, the paper scan/confirm workflow and the loading/config/error screens are not yet converted to the game style.
- 15 of 80 chart/table sets label rows with bare A–D, which collides with answer letters; renaming them is a question-content change that needs approval.
- `npm run qa:paper` was not run for stage 1: Playwright is not installed on this machine (`npm run setup` installs it). Stage 5 restyled the paper scan/review screens (markup and data hooks only) and qa:paper has still not run.

## Question bank follow-ups (2026-11-21)

- Reading passages are now 146-247 words, but nearly all follow one template (problem, pilot, result, keep monitoring). More varied genres (argument, narrative, explanation) would test reading more like the real exam.
- Abstract reasoning still has many quick letter/number code items; only the 26 word-described figure puzzles became drawn figure series.
- Answer leak and joke choices: fixed for reading comprehension (correct longest in 28%, was 94%) and General Information (23-41%, was 73-89%). Still open for assumptions/conclusions (54%). The rewritten GI choices should get a legal spot-check by a human reviewer. Cross-mock near-duplicates remain open; Numerical repeats most (47% of items have a twin).
- Pipe/work problems reuse the same number pairs across mocks (10 and 15 days, 12 and 18 hours).

## Motion follow-ups (2026-11-21)

- Motion timing was verified by class triggers and end states only: the in-app browser pane was hidden, so animation frames were throttled, and Playwright (needed for impeccable motion-capture or qa:motion) is not installed. Watch it once in a visible browser, including with reduced motion turned on in the OS.
