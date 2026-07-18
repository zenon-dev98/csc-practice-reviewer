# V4 Visual Contract

## Authority

- Sole visual master: `states/v4/study_hub.png`.
- Native canvas: `1672x942` at 100% browser zoom.
- Older `states/v3/` images are behavioral/content references only. Their headers, logos, spacing, fonts, and page-specific visual systems are retired.

## Shared Signed-In Shell

- One dark graphite canvas with subtle cyan topographic traces, fine technical grid/rails, and no white page surfaces.
- Header height, left/right inset, border line, and component baselines stay identical across Home, Mock Exam, Practice & Review, and Progress.
- Left lockup: transparent cyan shield with white star; `CSC PRACTICE REVIEWER`; secondary line `Independent practice reviewer`.
- Center navigation: four equal tabs in this order: `Home`, `Mock Exam`, `Practice & Review`, `Progress`. Active tab uses cyan text and a cyan lower rail.
- Right account control: animal/initial avatar plate, nickname or name, chevron. It is vertically centered to the header and cannot be displaced by audio controls.
- No alternate site icon, wordmark, page-specific logo, or different header geometry is allowed on compatible pages.

## Typography

- Display: Barlow Condensed, 800/italic for hero headings; 700-800 upright for major numerics and page titles.
- HUD/navigation/forms: Rajdhani, 600-700.
- Long prompts, explanations, and paragraphs: system sans-serif at comfortable reading line height.
- Supporting text must remain readable after desktop scaling; metadata is never reduced to decorative microtype.
- One hierarchy applies everywhere: hero, page title, panel title, control label, body, metadata.

## Color Semantics

- Cyan: primary actions, Home, active/current state, overall progress.
- Blue: numerical.
- Green: analytical/correct/success.
- Purple: general/review/flagged collection.
- Amber: practice/skipped/warning.
- Red: destructive/wrong/submit danger.
- Colors that resemble data must have visible labels and accessible text.

## Geometry And Spacing

- Outer content inset, panel gaps, and header alignment follow the v4 master at proportional scale.
- Panels use thin double rails, restrained corner cuts, and safe rectangular content zones. Decorative lines never cross text or icons.
- Default panel gap is visually comparable to its internal padding. Adjacent panels do not touch.
- Short content uses compact content-sized panels. Equal-height stretching is forbidden unless the content or approved reference needs equal comparison rows.
- Primary buttons keep clear bottom/side padding and never hug borders.
- Internal scrolling belongs only to long lists, navigators, tables, explanations, and dialogs; scrollbars are hidden or 4px quiet rails.

## Icon Contract

- One transparent shield favicon/brand mark across all states.
- Primary symbols use the same cyan/semantic-color outline weight and octagonal plate treatment as v4.
- Secondary familiar actions use the existing local Lucide subset with matching optical weight.
- Icons align to label baselines, remain clear of notches/rails, and never substitute unexplained decoration for meaning.

## Motion Contract

- Hero energy effect: slow cyan/white heat shimmer with a restrained ember edge, never obscuring letters.
- Active progress nodes breathe subtly; primary actions receive one directional edge sweep on hover/focus; state changes use short opacity/translate transitions.
- No constant large movement, flashing, layout shift, or animation during long question reading.
- `prefers-reduced-motion: reduce` disables all non-essential motion.

## Page Composition Rules

- Home: exact v4 hierarchy - hero, one active-run panel, compact records panel, three destination commands.
- Mock Exam: familiar `Mock Exam Setup` naming; compact run facts, compact section allocation, proportional options panel, one primary start action.
- Exam: focused header, bounded navigator, calm question surface, fixed actions, no signed-in global navigation.
- Practice & Review: three mode selectors remain visible while a bounded workspace changes.
- Progress: long-term metrics are visually distinct from active-run completion; use `Section Accuracy` for historical correctness.
- Results: score, timing, section accuracy, and insights use content-fitted panels with no empty lower half.
- Account Settings: right drawer with compact identity/avatar/nickname fields; password change opens a dedicated dialog rather than reserving collapsed space.
- System/auth/dialog states reuse the same fonts, shield, graphite surfaces, border language, spacing, and semantic colors.

## Visual Acceptance

- Compare every generated and implemented state to this contract and the v4 master by direct image inspection, not OCR.
- Reject any state with a different header, logo, font family, background language, panel geometry, spacing rhythm, or account placement.
- Reject text overflow, edge hugging, forced dead zones, unclear data colors, malformed corner cuts, and decorative collisions.
- Capture empty, partial, full, long-text, open, closed, hover, focus, error, loading, disabled, and submitted states at every release viewport.
