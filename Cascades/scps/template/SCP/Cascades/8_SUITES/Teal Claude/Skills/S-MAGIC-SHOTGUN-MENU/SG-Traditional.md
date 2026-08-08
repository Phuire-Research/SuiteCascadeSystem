# SG-Traditional — Traditional 2-Stage Magic Shotgun Reference Design

**Menu ID**: SG-T
**Trigger**: Standard sub-Diamond · 1 Diameter Gap · Length 1-5 · canonical Foundation Triplet → Cobalt
**Round Composition**: 3 Rounds (Foundation Triplet) · ~6 min wall-clock
**Empirical Foundation**: 13 consecutive sub-Diamond cycles in Macro 1 (Cycles 62-74)

---

## What Traditional 2-Stage Magic Shotgun Is

The canonical Foundation Triplet (3 Rounds) firing in parallel at Stage 1, followed by R5 Blue Cobalt actualization at Stage 2. This is the **default Magic Shotgun shape** for standard sub-Diamond work — one Diameter Gap to close, no isolation requirement.

```
Stage 1 · Foundation Triplet (parallel):
  R1 Red    OR   R2 Orange       (curate OR name · choose by need)
       +
  R3 Yellow                      (architect)
       +
  R6 Purple                      (orchestrate · Mid-Flight-Calibrator)
                 ↓
       Main Thread Synthesis (WGB write · R3 vs R6 Reconciliation)
                 ↓
Stage 2 · R5 Blue Cobalt: implementation · Concluders · commit
```

---

## When to Use

- Single Diameter Gap to close in this sub-Diamond
- Standard implementation scope (no Interactive-class moment · no closure scope · no Macro open)
- Cascade Length 1-5 (Foundation + R5 Cobalt)
- No isolation requirement (one R5 dispatch suffices)

---

## Round Selection Decision Tree

```
Is existing codebase inventory needed before architecture?
├── YES → Use R1 + R3 + R6 (curation variant)
└── NO  → Use R2 + R3 + R6 (canonical Triplet · naming variant)
```

**Macro 1 M1-A1-D2 precedent** (Cycle 62): chose R1+R3+R6 because claudeBridge curation was the architectural prerequisite (not pattern naming).
**Macro 1 Cycles 65-73 standard**: R2+R3+R6 — naming layer first, then architecture composes on top.

---

## Banded Vermillion Plan Template

```
<VermillionPlan topic="[Sub-Diamond Title]">

Band Stage-1A [R{1|2} {Red|Orange}] (sonnet):
  Informative: [Inventory OR Name patterns in {target area}]
  Actionable: Write {SUITE-1-RED-{sub}-CURATION.md OR SUITE-2-ORANGE-{sub}-NAMING.md}
  Coordination: Suites X/3/6 running concurrently with disjoint scopes. Do not duplicate other Suite's scope.

Band Stage-1B [R3 Yellow] (sonnet):
  Informative: Source-read target files (M9) · read prior Diamond + Onyx
  Actionable: Write SUITE-3-YELLOW-{sub}-ARCHITECTURE.md · type shapes · file structures · Wave inventory · dependency chain
  Coordination: Suites X/3/6 running concurrently with disjoint scopes. Do not duplicate other Suite's scope.

Band Stage-1C [R6 Purple] (sonnet):
  Informative: Read prior Macro WGB patterns · identify dependency chain
  Actionable: Write SUITE-6-PURPLE-{sub}-ORCHESTRATION.md · Wave-by-Wave execution order · coordination notes · PROVISIONAL cells if Foundation Suites return out-of-order (M10 Calibration)
  Coordination: Suites X/3/6 running concurrently with disjoint scopes. Do not duplicate other Suite's scope.

[Main Thread Synthesis · WGB write · R3 vs R6 Reconciliation · documented]

Band Stage-2 [R5 Blue Cobalt] (opus):
  Informative: Read all 3 Foundation Suite outputs + WGB Reconciliation
  Actionable: Implement per Reference Designs · run 5 Concluders (typecheck · build · tests · invariant grep · Read-back) · commit at cycle close per M14
</VermillionPlan>
```

---

## Conductor Dispatch Pattern

```
Step 1: Conductor receives user scope + Cascade.json + active Diamond
Step 2: Determine R1 vs R2 (curation OR naming) per decision tree above
Step 3: Compose Banded Vermillion Plan (above template)
Step 4: Dispatch Stage 1 via Agent tool · SINGLE MESSAGE · 3 parallel agents:
        - Agent(subagent_type="r{1|2}-{curator|prospector}", model="sonnet", prompt=Band Stage-1A)
        - Agent(subagent_type="r3-architect",                 model="sonnet", prompt=Band Stage-1B)
        - Agent(subagent_type="r6-orchestrator",              model="sonnet", prompt=Band Stage-1C)
Step 5: All 3 return within ~6 min · Conductor reads all outputs
Step 6: Conductor (or main thread) synthesizes into WGB · documents Reconciliation
Step 7: Dispatch Stage 2 via Agent tool:
        - Agent(subagent_type="r5-professional", model="opus", prompt=Band Stage-2 with WGB references)
Step 8: R5 returns Concluder output · cycle close · Fuchsia G/L/M (separate cycle close event)
```

---

## Concluder Set (Sub-Diamond Close)

After Stage 2 R5 Blue returns:

1. **typecheck** → 0 errors
2. **build** → tsup clean · bundle size within tolerance
3. **tests** → all pass + new tests if R3 specified
4. **invariant grep** → `muxifyConcepts=6` (or current project invariant)
5. **Read-back** → modified files match disk

---

## Disjoint Scope Discipline

Each Round's dispatch prompt MUST include:

> *"Suites X/3/6 are running concurrently with disjoint scopes. R{1|2} {curates|names}; R3 designs structure; R6 sequences execution. Do not duplicate the other Suite's scope."*

Source: `FOUNDATION-SUITES-GUIDE.md` §2 · 13-cycle empirical proof in Macro 1.

---

## Navigation

- `[B]` Back to Magic Shotgun Main Menu (SG-Main.md)
- `[M]` Return to Main Shatterite Menu (SM-Main.md)
- `[Q]` Exit Shatterite
