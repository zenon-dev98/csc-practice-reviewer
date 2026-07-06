# Known Issues And Followups

## Open

- Supabase backup/export workflow is not defined yet.
- The answer key has been captured from images but needs a second manual verification pass before scoring is considered final.
- The source booklet is missing or weak on Filipino verbal items, chart/table data interpretation, and visual/symbolic abstract reasoning; the generated typed bank now covers these areas structurally, but its pedagogy should still be reviewed before serious use.
- Stitch was used for the menu/dashboard redesign, but generated code export was not available through `Code to Clipboard`; it copied the prompt instead. Future Stitch iterations may still use Figma, MCP, or other export routes if configured.
- Supabase email confirmation is intentionally disabled for now because signup is invite-gated and the free email sender hit rate limits during QA. Revisit if using a custom SMTP sender.
- GitHub Actions reports a Node 20 deprecation warning for current action versions, but deployment succeeds under the forced Node 24 runner.
- Exact iconography may still differ from the generated `states/` assets where the app uses the existing inline icon set. Future UI repair must now check icon glyph quality, size, positioning, stroke weight, color, and label alignment explicitly against the active mockup.
- T0014 repaired the desktop quality regression at `1904x913` and `1536x816`. Mobile still should get a separate polish pass if it becomes a priority again.
- At the smaller `1536x816` desktop fixture, the Results fun-fact cards use a compact mode that shows titles and values while hiding the extra descriptive sentence to preserve the one-screen no-scroll contract.
- `states/v2/` currently contains `sign_in.png` and `account_settings.png`; create account remains a proportional adaptation from the existing create/auth direction plus the v2 feature-row style until a dedicated v2 create-account mockup exists.
- T0022 repaired the signed-in dashboard/account/practice/mistakes/recent/exam-control flows at the maximized Microsoft Edge viewport. Any future desktop UI change should rerun the same screenshot loop rather than relying on CSS inspection.

## Follow-Up Ticket Ideas

- Add a Supabase backup/export ticket before public use.
- Add a human content review ticket for generated Filipino, data-interpretation, legal/general-information, and symbolic-reasoning items.
- Add a Stitch MCP/Figma export ticket if direct generated-source handoff becomes available.
- Add a mobile-specific screenshot-density ticket after the desktop no-scroll contract stabilizes.
- Re-run the hardened mockup-adaptation rules whenever a new `states/` or `states/v2/` reference is added.
