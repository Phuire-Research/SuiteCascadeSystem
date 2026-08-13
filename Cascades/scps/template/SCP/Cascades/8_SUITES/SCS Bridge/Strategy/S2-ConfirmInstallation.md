# S2 — Confirm Installation

**Strategy**: Confirm Installation
**Phase**: S2 (human-in-the-loop gate)
**Conductor**: SCS Bridge Install Conductor
**Input**: `process.cwd()`, install scope (what Cascades/ scaffold will contain)
**Output**: User-confirmed install scope captured in install state; advance to S3 or clean abort

---

## Engagement Criteria

This strategy triggers when:
- S1 returns `proceed` decision (Cascades/ absent confirmed)

S2 is the human-in-the-loop gate — the user explicitly confirms what will be installed
and where before any filesystem writes occur. Uses Shatterite Tome to render the
confirmation menu. If the user cancels, no files are written and Bridge returns to the
standard menu cleanly.

---

## Vermillion Plan

```
<VermillionPlan topic="Confirm Installation">

Band 1 [R1 Red — Curate] (Tier 0):
  Informative: Read cwd; enumerate what Cascades/ scaffold will contain
  Actionable: Compose confirmation summary (dirs, optional paths, revert note)

Band 2 [R6 Purple — Conference] (Tier 0):
  Informative: Read confirmation summary from Band 1
  Actionable: Dispatch Shatterite Tome AskUserQuestion — 3 options:
              [1] Install (default) · [2] Cancel · [3] Preview scope
  Conference: AskUserQuestion — user selects install scope + confirms

Band 3 [R5 Blue — Decide] (Tier 0):
  Informative: Read user selection from Band 2
  Actionable: If confirm → advance to S3;
              If cancel → abort cleanly (no files written);
              If preview → re-render scope + return to Band 2

</VermillionPlan>
```

---

## Invariants

- This phase is read-only — no filesystem mutations
- AskUserQuestion must render without error before user selection is captured
- User cancels → emit clean abort; no state mutated; Bridge returns to standard menu
- Shatterite Tome unavailable → fallback to plain confirmation prompt (stdin readline)
- User selection must be captured (not timed-out or abandoned) before Conductor advances
- Preview path loops back to Band 2 — must not advance Conductor until explicit confirm or cancel
