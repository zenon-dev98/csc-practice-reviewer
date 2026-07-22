# July 22 Focused Remediation Coverage

- Build fingerprint: `339f3e4462084998`
- Asset cache key: `20260722-02`
- Browser/viewport: Microsoft Edge, `1536x736`, 100% logical browser zoom
- Data setup: deterministic local fixtures; no Supabase writes
- Reference: applicable approved V5 state image

| State | Expected result | Scroll owner | Evidence | Functional | Reachability | Optical |
| --- | --- | --- | --- | --- | --- | --- |
| Home | Complete-corner panels and stable audio anchor | none | `dashboard-edge-1536x736.png` | pass | pass | pass |
| Mock Exam Setup | Legible fact cells and contained controls | none | `setup-edge-1536x736.png` | pass | pass | pass |
| Active Exam | Complete-corner question/navigator surfaces | exam navigator | `exam-edge-1536x736.png` | pass | pass | pass |
| Paused Exam | Contained 68px logical icon, centered message, three facts | none | `pause-edge-1536x736.png` | pass | pass | pass |
| Results | Native Review/Practice/Retake deep links | none | `results-edge-1536x736.png` | pass | pass | pass |
| Answer Review | Five navigator columns, no P/R, semantic section cells | review question region | `review-edge-1536x736.png` | pass | pass | pass |
| Progress | Spaced section rows, colored icons/bars, account-scoped attempts and refresh | attempt table | `recent-edge-1536x736.png` | pass | pass | pass |
| Account Settings | Audio below Password; lower controls reachable without reset | command drawer | `profile-modal-edge-1536x736.png`, `account-settings-bottom.png` | pass | pass | pass |
| Ordering question | Roman-numeral statements render as four aligned rows | question panel | `ordering-question-35.png` | pass | pass | pass |

Automated fixture summary: expected `8`, executed `8`, passed `8`, failed `0`, blocked `0`, skipped `0`. Focused interaction summary: expected `6`, executed `6`, passed `6`, failed `0`, blocked `0`, skipped `0`; details are in `focused-interactions.json`.

Live verification: GitHub Pages deployed commit `5c01bcc`. The cache-busted Edge smoke passed 3/3 checks with no console errors; evidence is under `qa/2026-07-22-remediation-live/`.
