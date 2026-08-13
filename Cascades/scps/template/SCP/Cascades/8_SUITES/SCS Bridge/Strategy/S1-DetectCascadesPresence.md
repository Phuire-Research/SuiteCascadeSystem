# S1 — Detect Cascades Presence

**Strategy**: Detect Cascades Presence
**Phase**: S1 (first — unconditional gate)
**Conductor**: SCS Bridge Install Conductor
**Input**: `process.cwd()` — no additional state required
**Output**: `cascadesDetected: false` + `proceed` decision (or `abort-already-installed`)

---

## Engagement Criteria

This strategy triggers when:
- `install-selected` KeyAction fires in `animatedTui.ts` or `menu.ts`
- Conductor dispatches S1 first, unconditionally

S1 is the gate that prevents double-install. It is the canonical source of the
`cascadesPresent` boolean that initiated the Install row in B-1. If `Cascades/`
is already present at `process.cwd()`, the UI should not have reached this point —
S1 surfaces that contract violation cleanly rather than silently proceeding.

---

## Vermillion Plan

```
<VermillionPlan topic="Detect Cascades Presence">

Band 1 [R1 Red — Curate] (Tier 0):
  Informative: Read process.cwd(); probe existsSync(join(cwd, 'Cascades'))
  Actionable: Capture boolean result; log to install state

Band 2 [R5 Blue — Decide] (Tier 0):
  Informative: Read detection result from Band 1
  Actionable: If present → emit 'abort-already-installed' (surface to user via stderr);
              If absent → emit 'proceed' to Conductor (advance to S2)

</VermillionPlan>
```

---

## Invariants

- This phase is read-only — no filesystem mutations
- Decision emitted in all outcomes (either `proceed` or `abort-already-installed`)
- `existsSync` throws (permission error) → abort with diagnostic; no state mutated
- No rollback needed: read-only probe
- Conductor must receive explicit emit before advancing to S2
