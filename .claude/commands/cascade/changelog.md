View the SCS Rotating Changelog — recent additions to the methodology, tooling, and Suite 8 set.

Read `Cascades/Cascade.json` for current state.

Run the following Concluder first, in order, before rendering:

1. `wc -l Cascades/CHANGELOG.md` — capture the current line count.
2. `head -1 Cascades/CHANGELOG.md` — confirm the file's heading is intact.
3. If the line count is `≥150`, surface a **Rotation Required** notice (see below). Otherwise proceed to render.

## Render

Read `Cascades/CHANGELOG.md` and present:

- The header block (cap, order, rotation rule, **Last update** date).
- The most recent entry under `## Recent` (head — newest-first).
- A pointer to scroll for older entries: "Use `tail -50 Cascades/CHANGELOG.md` to see the oldest entries currently in the window, or list `Cascades/CHANGELOG-ARCHIVE-*.md` for prior periods."

## Maintenance Reminder (always include in output)

```
╔══════════════════════════════════════════════════════════╗
║  CHANGELOG MAINTENANCE                       [Yellow]    ║
║  ─ · ─                                                   ║
║  When adding an entry:                                   ║
║   1. Append at the TOP of `## Recent` (newest-first).    ║
║   2. wc -l Cascades/CHANGELOG.md — if ≥150, rotate.      ║
║   3. Update the **Last update** date in the header.      ║
║   4. Sync the README "Recent Changes — {date}" line.     ║
║                                                          ║
║  Cap = 150 lines (~24% of CLAUDE.md = 618 lines).        ║
╚══════════════════════════════════════════════════════════╝
```

## Rotation Required Notice (only if `wc -l ≥ 150`)

```
╔══════════════════════════════════════════════════════════╗
║  ROTATION REQUIRED                          [Fuchsia]    ║
║  ─ · ─                                                   ║
║  Cascades/CHANGELOG.md has exceeded the 150-line cap.    ║
║                                                          ║
║  Action: roll the oldest 75 lines to an archive file.    ║
║                                                          ║
║  1. Determine the year-month range covered by the        ║
║     oldest entries (read the bottom of `## Recent`).     ║
║  2. Create `Cascades/CHANGELOG-ARCHIVE-{YYYY-MM}.md`     ║
║     with those entries.                                  ║
║  3. Remove the rolled lines from CHANGELOG.md.           ║
║  4. Append a row to the `## Archives` section pointing   ║
║     at the new archive file with its date range.         ║
║  5. Re-run `wc -l Cascades/CHANGELOG.md` to confirm      ║
║     the new size is well under the cap.                  ║
╚══════════════════════════════════════════════════════════╝
```

After rendering, offer: "Add a new entry now? (y/n)" — if yes, prompt for the change description and apply the maintenance protocol above.
