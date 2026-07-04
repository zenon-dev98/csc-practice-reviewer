# CSC Reviewer Design System

## Product Context

Audience: friends preparing for the Philippine Career Service Examination Professional level. They need a focused practice tool that feels closer to an exam console than a marketing site.

Voice: quiet, direct, instructional, and utilitarian.

Design intent: dense but readable, fast to scan, keyboard-friendly, and calm under time pressure.

Tool status:

- Impeccable CLI detector has been run locally against `app/`; current app styles return no findings.
- Stitch is represented by reusable prompts and state briefs in `docs/Stitch_Prompts.md`. A true Stitch-driven pass requires importing an authenticated Stitch export before implementation.

Anti-references:

- Decorative hero sections
- Purple/blue gradient SaaS look
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

## Pre-Ship Audit Checklist

- Accessibility: visible focus states, labeled grouped navigation, readable table stimulus, no color-only status.
- Performance: static JS only, no remote fonts, no heavy animation beyond result count-up.
- Theming: tokenized colors, no one-note beige or gradient palette.
- Responsive: no horizontal overflow at 390px, navigator collapses by section, choices stack cleanly.
- Anti-patterns: no nested decorative cards, no hero layout, no giant whitespace in exam mode.
