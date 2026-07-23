# T0048 Preset Avatar Frame QA

- Date: 2026-07-23
- Target: local fixture build before commit
- Cache key: `v5-production.css?v=20260723-03`
- Browser: Microsoft Edge
- Viewport: 1536 x 736 at 100% zoom
- State: dashboard and Account Settings with Cat preset selected

## Checks

- Header avatar component border: `0px`
- Header avatar padding: `0px`
- Header avatar shadow: `none`
- Displayed sprite crop: `scale(1.36)`
- Initial-based avatars: unchanged
- Avatar picker tiles and selection behavior: unchanged

## Evidence

- `header-final.png`: compact signed-in account control
- `account-preview-final.png`: Account Settings identity preview
- `state-final.png`: Account Settings state

## Verdict

The redundant component frame is removed. Displayed preset avatars no longer
show both the generic square frame and the source artwork frame.
