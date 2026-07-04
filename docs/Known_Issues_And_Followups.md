# Known Issues And Followups

## Open

- Supabase backup/export workflow is not defined yet.
- The answer key has been captured from images but needs a second manual verification pass before scoring is considered final.
- The source booklet is missing or weak on Filipino verbal items, chart/table data interpretation, and visual/symbolic abstract reasoning; the generated typed bank now covers these areas structurally, but its pedagogy should still be reviewed before serious use.
- Stitch was used for the menu/dashboard redesign, but generated code export was not available through `Code to Clipboard`; it copied the prompt instead. Future Stitch iterations may still use Figma, MCP, or other export routes if configured.
- Supabase email confirmation is intentionally disabled for now because signup is invite-gated and the free email sender hit rate limits during QA. Revisit if using a custom SMTP sender.
- GitHub Actions reports a Node 20 deprecation warning for current action versions, but deployment succeeds under the forced Node 24 runner.
- State-image UI fidelity has been corrected substantially, but exact iconography/pixel parity should still receive one final human screenshot comparison pass after deployment.

## Follow-Up Ticket Ideas

- Add a Supabase backup/export ticket before public use.
- Add a human content review ticket for generated Filipino, data-interpretation, legal/general-information, and symbolic-reasoning items.
- Add a Stitch MCP/Figma export ticket if direct generated-source handoff becomes available.
