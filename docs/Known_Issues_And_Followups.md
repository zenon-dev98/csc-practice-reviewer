# Known Issues And Followups

## Open

- Supabase backup/export workflow is not defined yet.
- The answer key has been captured from images but needs a second manual verification pass before scoring is considered final.
- The source booklet is missing or weak on Filipino verbal items, chart/table data interpretation, and visual/symbolic abstract reasoning; the generated typed bank now covers these areas structurally, but its pedagogy should still be reviewed before serious use.
- Stitch was used for the menu/dashboard redesign, but generated code export was not available through `Code to Clipboard`; it copied the prompt instead. Future Stitch iterations may still use Figma, MCP, or other export routes if configured.
- Supabase email confirmation is intentionally disabled for now because signup is invite-gated and the free email sender hit rate limits during QA. Revisit if using a custom SMTP sender.
- GitHub Actions reports a Node 20 deprecation warning for current action versions, but deployment succeeds under the forced Node 24 runner.
- Exact iconography may still differ from the generated `states/` assets where the app uses the existing inline icon set, but the screenshot-state layout, containment, and interactions now have a fixture QA harness and desktop/mobile browser sweep.
- T0014 repaired the desktop quality regression at `1904x913` and `1536x816`. Mobile still should get a separate polish pass if it becomes a priority again.
- At the smaller `1536x816` desktop fixture, the Results fun-fact cards use a compact mode that shows titles and values while hiding the extra descriptive sentence to preserve the one-screen no-scroll contract.
- The production create-profile screen still has Password and Invite Code fields that are not present in the two-field mockup; T0019 balances their visual height, but exact two-field mockup parity would require a multi-step signup or removing those visible fields.

## Follow-Up Ticket Ideas

- Add a Supabase backup/export ticket before public use.
- Add a human content review ticket for generated Filipino, data-interpretation, legal/general-information, and symbolic-reasoning items.
- Add a Stitch MCP/Figma export ticket if direct generated-source handoff becomes available.
- Add a mobile-specific screenshot-density ticket after the desktop no-scroll contract stabilizes.
