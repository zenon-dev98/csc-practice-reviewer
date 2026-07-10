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
- Keep the independent-practice disclaimer in shell/home areas, not as confusing question metadata.
- Shared graph/table/logic setups render above the prompt as stimulus panels with clear labels such as `Chart for Items 101-104`.

## Tokens

- Surfaces: `#ffffff`, `#f8fafc`, `#f4f6f8`, exam sidebar `#111827`
- Text: `#18202a`, `#5c6675`
- Lines: `#d8dee7`, `#aeb8c6`
- Action: `#08756f`
- Focus/info: `#315fba`
- Warning: `#9a6400`
- Danger: `#9a2d25`
- Radius: `8px`
- Touch target minimum: `30px` for item chips, `38px` for command buttons

## Study Hub Cockpit Direction

- Base surfaces: graphite `#071014`, raised ink `#0d171c`, line `#2b4047`, text `#f1f5f4`, muted `#9aabaa`.
- Primary action: electric teal `#10c7c1`; section accents: verbal `#2684ff`, numerical `#56c94f`, analytical `#9a59e8`, general `#f0a51b`; warning `#ff5d52`.
- Display and cockpit interface typography: locally hosted Barlow Condensed, with weight and scale separating navigation, labels, values, and commands.
- Use connected panels, clipped corners, progress tracks, and restrained technical linework instead of repeated white cards.
- The Study Hub may be expressive; exam questions, choices, and controls must remain conventional and distraction-free.
- Decorative patterns must be locally hosted or native CSS/SVG and must not carry essential information.

## Pre-Ship Audit Checklist

- Accessibility: visible focus states, labeled grouped navigation, readable table stimulus, no color-only status.
- Performance: static JS only, no remote fonts, no heavy animation beyond result count-up.
- Theming: tokenized colors, no one-note beige or gradient palette.
- Responsive: no horizontal overflow at 390px, navigator collapses by section, choices stack cleanly.
- Anti-patterns: no nested decorative cards, no hero layout, no giant whitespace in exam mode.
