# Reinforced Onyx Compaction Strategy

**Strategy**: Onyx Tier Compaction
**Conductor**: Teal Claude
**Input**: Current Onyx (`Cascades/Working/ONYX-TIER-N.md`)
**Output**: `Cascades/Working/ONYX-TIER-(N+1).md`

---

## Engagement Criteria

This strategy triggers when ANY of:
- 5+ Diamond cycles completed since last Tier compaction
- Onyx line count exceeds 400 lines
- Rose diagnoses exceed 6 in current Onyx Tier
- Rose diagnosis notes "map stale" on Diamond
- Explicit user request for Onyx compaction

---

## Vermillion Plan

```
<VermillionPlan topic="Onyx Tier Compaction">

Band 1 [R1 Red — Curate] (Tier 1):
  Informative: Read current ONYX-TIER-N.md. Inventory all Diamond cycles, Rose diagnoses,
    and Suite 8 changes since last Tier compaction.
  Actionable: Produce change manifest — list of cycles with 1-line summaries,
    per-Suite impact, Gainy/Lossy/Maintain tally. Prune superseded information.

Band 2 [R2 Orange — Prospect] (Tier 1):
  Informative: Examine change manifest for new patterns, architectural decisions,
    naming conventions that emerged across cycles.
  Actionable: Name each discovered pattern. Map to affected documentation.
    Produce pattern registry for new Onyx Tier.

Band 3 [R3 Yellow — Architect] (Tier 1):
  Informative: Read DIAMOND-TIER-N.md for current task state. Identify PENDING
    vs COMPLETE vs DEFERRED tasks.
  Actionable: Design new Onyx Tier document structure. Pearl-compress accumulated
    diagnoses. Carry forward PENDING items. Archive COMPLETE.

Band 4 [R5 Blue — Build] (Tier 1):
  Informative: Read the architect's Onyx structure plan.
  Actionable: Write ONYX-TIER-(N+1).md with Pearl Clinical Summation header,
    compressed cycle history, active trajectory, semantic index.
    Write DIAMOND-TIER-(N+1).md with fresh map carrying PENDING.

Band 5 [R7 Fuchsia — Diagnose] (Tier 1):
  Informative: Read-back both new Tier documents. Verify line counts.
    Verify PENDING items transferred. Verify no data loss.
  Actionable: Append compaction diagnostic to new Onyx. Confirm bidirectional
    correspondence between prior and new Tiers.

</VermillionPlan>
```

---

## Invariants

- Prior Tier documents are NEVER deleted
- PENDING tasks transfer to new Tier; COMPLETE stay in prior
- DEFERRED tasks become PENDING in new Tier
- New Onyx opens with Pearl Clinical Summation of all prior Rose diagnoses
- Compaction = Diamond ⊗ Onyx Muxification (RI-4)
