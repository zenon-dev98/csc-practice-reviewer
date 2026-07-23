# T0049 Avatar Picker Frame QA

- Date: 2026-07-23
- Target: local fixture build before commit
- Cache key: `v5-production.css?v=20260723-04`
- Browser: Microsoft Edge
- Viewport: 1536 x 736 at 100% zoom
- State: Account Settings with Cat preset selected

## Checks

- Picker button border: `0px`
- Picker button background: transparent
- Picker button shadow: none
- Picker button clip path: none
- Source tile crop: `scale(1.36)`
- Hover, focus, and selected indication: artwork glow

## Evidence

- `avatar-selected-final.png`: selected Cat avatar without the square frame
- `avatar-picker-final.png`: complete frameless avatar grid

## Verdict

The square picker container and the source tile's outer option frame are no
longer visible. Each avatar retains only the generated artwork border.
