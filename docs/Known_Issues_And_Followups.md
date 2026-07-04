# Known Issues And Followups

## Open

- The folder is not a git repository. Decide later whether to initialize git.
- Supabase project is not created yet.
- Supabase backup/export workflow is not defined yet.
- Exact deployment target is not chosen yet.
- The answer key has been captured from images but needs a second manual verification pass before scoring is considered final.
- The source booklet is missing or weak on Filipino verbal items, chart/table data interpretation, and visual/symbolic abstract reasoning; the generated typed bank now covers these areas structurally, but its pedagogy should still be reviewed before serious use.
- Supabase schema exists, but runtime sync is not connected until credentials/auth policy are provided.
- Public hosting is not configured. The app is currently local/static and browser-storage based.
- Stitch was used for the menu/dashboard redesign, but generated code export was not available through `Code to Clipboard`; it copied the prompt instead. Future Stitch iterations may still use Figma, MCP, or other export routes if configured.
- T0011 is replacing browser-storage runtime persistence with Supabase email/password auth and GitHub Pages deployment. Until the Supabase SQL and auth hook are applied, the new online app will show auth/storage errors.
- GitHub Pages deployment is live, but online signup/storage will not work until `supabase/schema.sql` is run and the `public.hook_validate_invite_code` Before User Created hook is selected in Supabase Authentication > Hooks.

## Follow-Up Ticket Ideas

- Add a git initialization ticket before broad distribution.
- Add a Supabase backup/export ticket before public use.
- Add a human content review ticket for generated Filipino, data-interpretation, legal/general-information, and symbolic-reasoning items.
- Add a Stitch MCP/Figma export ticket if direct generated-source handoff becomes available.
