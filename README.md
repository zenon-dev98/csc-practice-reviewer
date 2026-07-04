# CSC Reviewer

Digitized mock Career Service Examination Professional reviewer app for a small group of examinees.

This project is documentation-first. Start with the docs in `docs/`, then implement one ticket at a time.

## Current State

The workspace currently contains 29 scanned/mock exam images:

- `image_01.jpg` through `image_29.jpg`

The runnable app is in `app/`. It is a static browser app that uses local browser storage. It includes the original source booklet images plus a generated typed practice bank with 20 full 170-item exam versions, grouped navigation, and shared graph/table-style stimulus questions.

## Product Direction

- Professional-level mock exam.
- 170 items.
- 20 generated typed versions, 3,400 generated questions total.
- CSC coverage-matrix audit for every version.
- Grouped section navigator and compact typed-question view.
- 3 hours and 10 minutes.
- Multiple choice.
- Name/email profile entry.
- Browser local storage for the current runnable app; Supabase Free schema is prepared for a later hosted version.
- Pause/resume, skip/revisit, timeout submit, and post-exam score/statistics views.

## Run Locally

Dependencies must not be installed in this Google Drive project folder.

Use:

```powershell
npm run check
npm run setup
npm run start
```

`npm run setup` installs the local static server only under:

```text
%LOCALAPPDATA%\csc-reviewer\node-deps
```

The app runs at:

```text
http://127.0.0.1:4173/index.html
```

The app can also be opened directly from:

```text
app\index.html
```

## Important Disclaimer

This project is an independent practice reviewer and is not affiliated with, endorsed by, produced by, sponsored by, or reviewed by the Civil Service Commission.

## Workflow

1. Read `AGENTS.md`.
2. Read `docs/Repo_Current_State.md`.
3. Pick the next open ticket from `docs/Tickets.md`.
4. Implement only that ticket.
5. Run verification from `docs/Manual_Verification_Guide.md`.
6. Update project docs.
7. Report changes, commands, verification, risks, and follow-ups.
