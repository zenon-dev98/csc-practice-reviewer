# CSC Reviewer Design System

## Product Context

Audience: friends preparing for the Philippine Career Service Examination Professional level. They need a focused practice tool that feels closer to an exam console than a marketing site.

Voice: focused, energetic, direct, and adult.

Design intent: the signed-in study shell feels like a premium training cockpit with a memorable identity; the active exam remains dense, readable, keyboard-friendly, and calm under time pressure.

Tool status:

- Impeccable CLI detector has been run locally against `app/`; current app styles return no findings.
- Stitch is represented by reusable prompts and state briefs in `docs/Stitch_Prompts.md`. A true Stitch-driven pass requires importing an authenticated Stitch export before implementation.

Anti-references:

- Decorative hero sections
- Purple/blue gradient SaaS look
- White CRUD/admin dashboards made from interchangeable KPI cards
- Cartoon rewards, XP systems, streak pressure, currencies, missions, or mascots
- Oversized cards and empty spacing
- Wall-of-number navigators without section context
- Any wording that implies Civil Service Commission affiliation

## Interface Rules

- Use the first screen as the usable app, not a landing page.
- Keep cards only for real panels, results tiles, and question/stimulus containers.
- Group exam navigation by CSC section:
  - General `1-20`
  - Verbal `21-80`
  - Numerical `81-120`
  - Analytical `121-170`
- Keep question header compact: section/subtopic, item number, version, and status.
- Keep the independent-practice disclaimer on public access and setup surfaces, not in the signed-in header or question metadata.
- Shared graph/table/logic setups render above the prompt as stimulus panels with clear labels such as `Chart for Items 101-104`.

## Tokens

- Surfaces: graphite `#03080c`, raised ink `#071116`, panel `#09151b`, calm question surface `#101b20`.
- Text: primary `#eef5f3`, muted `#9bafb2`, dim `#667c83`.
- Lines: structural `#344850`, recessed `#1c3038`, metallic `#789098`.
- Primary action / verbal: cyan `#21ded7`; numerical `#3b8dff`; analytical `#5bcf62`; general `#a66af1`.
- Warning / skipped: `#f2b632`; danger / flagged: `#ef4c4c`.
- Display: self-hosted Barlow Condensed 800 italic. HUD and forms: self-hosted Rajdhani. Long prompts: readable system sans-serif.
- Corners: clipped technical polygons for major panels; square or minimally rounded controls.
- Touch target minimum: `30px` for item chips, `38px` for command buttons.

## Cockpit Direction

- The generated `1672x942` cockpit is the desktop visual master for every state.
- Desktop uses one uniformly scaled logical frame centered in the available viewport; it never stretches to fill a different aspect ratio.
- Use connected panels, clipped corners, progress tracks, inset rails, hatch marks, and restrained technical linework instead of repeated white cards.
- The Study Hub may be expressive; exam questions, choices, and controls remain calm, readable, and distraction-free.
- Decorative patterns are locally hosted or native CSS/SVG and never carry essential information.
- Below `1100px`, use responsive stacking and normal document scrolling rather than scaling the desktop frame.

## Pre-Ship Audit Checklist

- Accessibility: visible focus states, labeled grouped navigation, readable table stimulus, no color-only status.
- Performance: static JS only, no remote fonts, no heavy animation beyond result count-up.
- Theming: tokenized colors, no one-note beige or gradient palette.
- Responsive: no horizontal overflow at 390px, navigator collapses by section, choices stack cleanly.
- Anti-patterns: no nested decorative cards, no hero layout, no giant whitespace in exam mode.
