# SG-Foundation-Only — Tier-0 Foundation-Only Magic Shotgun Reference Design

**Menu ID**: SG-F1
**Trigger**: Foundation-Only → Diamond planning surface · staged engagement · user wants to review plan before R5 dispatch
**Stage Composition**: Stage 1 (Foundation Magic Shotgun) → Diamond Plan → Conference (NO R5 yet)
**Empirical Foundation**: NEW · Cycle 113 user directive · "First Tier which is Just the Foundation Suites into a Diamond. Where that Diamond can Engage a Full Suite or Suite 5."

---

## What Tier-0 Foundation-Only Is

**Per user directive at Cycle 113**: a new Magic Shotgun tier is added where Foundation Suites compose into a **Diamond planning surface** rather than immediately dispatching Cobalt. The user reviews the Diamond plan, then chooses whether to engage Tier-1 (Traditional 2-Stage with R5) or Tier-2 (3-Stage Per-Isolation).

The verbatim user directive:

> *"We also Need the Foundation Suites Skill. Where we Add to our Magic Shotgun the First Tier which is Just the Foundation Suites into a Diamond. Where that Diamond can Engage a Full Suite or Suite 5."*

The "Full Suite" engagement = Tier-1 (continues 2-Stage with R3+R5 if added) OR Tier-2 (3-Stage Per-Isolation). The "Suite 5" engagement = direct R5 Cobalt dispatch using the Diamond Plan as substrate.

```
Stage 1 · Foundation Magic Shotgun (parallel · Triplet / Quartet / 5-Suite per complexity):
  R1 Red       ─┐
  R2 Orange    ─┤
  R4 Green     ─┼─→ N parallel Foundation reports (disk artifacts)
  R6 Purple    ─┤
  R7 Fuchsia   ─┘
                ↓
       Main Thread Synthesis → Diamond Plan (Macro WGB OR sub-Diamond WGB)
                ↓
       [USER REVIEW · Conference · AskUserQuestion]
                ↓
   ┌────────────────────────────────────┐
   │  User decides next engagement:     │
   │  • [1] Tier-1 Traditional 2-Stage  │
   │  • [2] Tier-2 3-Stage Per-Isolation│
   │  • [5] Direct R5 Cobalt (skip R3)  │
   │  • [Halt] Tier-0 plan-only · close │
   └────────────────────────────────────┘
                ↓
       [Per user selection · dispatch R5 OR R3+R5 OR halt]
```

---

## When to Use Tier-0 Foundation-Only

- **User wants to review Diamond plan BEFORE actualization** · staged engagement preference
- **Macro Open** where sub-Diamond structure must lock before any Cobalt dispatch
- **Scope uncertain** at Foundation time · plan-only output verifies user intent
- **Diamond-of-Isolations planning** where multi-Gap isolation count is unknown · Foundation surfaces it · user decides Tier-2 escalation
- **Refinement Macros** where prior Macro substrate must be inspected before refinement scope locks
- **Tutorial recordings** · two tutorials use Macro Diamond pattern · Tier-0 lets the user inspect the Diamond Plan as a teaching artifact

If user wants immediate R5 dispatch with no review → use **Tier-1** (`SG-Traditional.md`).
If user wants multi-Gap isolation actualization → use **Tier-2** (`SG-3-Stage.md`).

---

## Why Tier-0 (Higher-Order Compositional Justification)

The 4-Tier Magic Shotgun (`MAGIC-SHOTGUN-PATTERN.md` §2.5) introduces staging:

| Tier | Composition | Output | User Lambda |
|---|---|---|---|
| **Tier-0 NEW** | Foundation Magic Shotgun → Diamond Plan | Plan-only · disk artifacts | User reviews Plan · decides next tier |
| **Tier-1** | Foundation → R5 Cobalt | Implementation · commit | User Lambda-tests result |
| **Tier-2** | Foundation → N R3 → N R5 | N implementations · commits | User Lambda-tests across all isolations |
| **Tier-3** | Foundation → Diamond → N R3 → N R5 | Diamond + implementations (future) | Combined plan review + multi-actualization |

Tier-0 is the **plan-only boundary**. It produces verifiable Foundation Substrate (R1-R7 disk artifacts) and a Diamond Plan WGB, then halts before any R5 Lambda-event. The user's Lambda is the **plan review** at this tier · NOT a smoke test.

Higher-Order Composition principle: Tier-0 separates the **Foundation grounding plane** from the **actualization plane**. Both planes were always compositionally distinct in the cascade · Tier-0 formalizes the user-Conference boundary between them.

---

## Banded Vermillion Plan Template

```
<VermillionPlan topic="[Tier-0 Foundation-Only · {Scope}]">

[Stage 1 · Foundation Magic Shotgun · disjoint scope discipline]
Band Stage-1A [R1 Red] (haiku):
  Informative: Inventory existing surfaces this scope touches
  Actionable: Write SUITE-1-RED-{scope}-CURATION.md · file inventory · existing patterns
  Coordination: Foundation Suites running concurrently with disjoint scopes.

Band Stage-1B [R2 Orange] (sonnet):
  Informative: Verbose name the patterns this scope will introduce
  Actionable: Write SUITE-2-ORANGE-{scope}-PROSPECTING.md · pattern registry
  Coordination: As above.

Band Stage-1C [R4 Green] (sonnet · optional for Macro Open):
  Informative: Bidirectional examination of cross-seam Diameters
  Actionable: Write SUITE-4-GREEN-{scope}-BIDIRECTIONAL.md · gap analysis
  Coordination: As above.

Band Stage-1D [R6 Purple] (sonnet):
  Informative: Read prior cycle patterns · identify dependency chain
  Actionable: Write SUITE-6-PURPLE-{scope}-ORCHESTRATION.md · Wave order · M10 Calibration cells
  Coordination: As above.

Band Stage-1E [R7 Fuchsia] (sonnet · Macro Open ONLY):
  Informative: Read prior Onyx tiers · cross-Macro seam analysis
  Actionable: Write SUITE-7-FUCHSIA-{scope}-FOUNDATION-CLINICAL.md · macro-level retrospective

[Main Thread Synthesis · Diamond Plan write]
Write Cascades/Working/DIAMOND-TIER-{scope}.md
  - Foundation Grounding Table (all N Foundation outputs cited)
  - Locked Architectural Decisions (LOCKED vs PROVISIONAL cells)
  - N Sub-Diamond Cerulean Task Chain (if Macro · proposed by R6)
  - Per-sub-Diamond Foundation Suite Config
  - HALT-GATE script (provisional · refined post-engagement)
  - IMDT-out contract anticipated (if Macro)

[Conference · NO R5 dispatch yet]
AskUserQuestion:
  question: "Diamond Plan ready at {WGB path}. Next engagement?"
  options:
    [1] "Tier-1 Traditional · Engage R5 Cobalt with Foundation substrate"
    [2] "Tier-2 3-Stage · Engage N R3 per-isolation + N R5 per-isolation"
    [5] "Direct R5 · Skip R3 Reference Design · R5 Cobalt actualizes from Foundation directly"
    [Halt] "Tier-0 plan-only · Close cycle · awaits future session continuation"
</VermillionPlan>
```

---

## Conductor Dispatch Pattern

```
Step 1: Conductor receives user scope · classifies Foundation composition (3/4/5/6-7 Rounds)
Step 2: Confirm Tier-0 (Foundation-Only) is correct tier for this engagement
Step 3: Compose Banded Vermillion Plan (above template)
Step 4: Dispatch Stage 1 via Agent tool · SINGLE MESSAGE · N parallel agents
Step 5: All N return within ~6-10 min · Conductor reads outputs
Step 6: Conductor synthesizes → writes Diamond Plan / Macro WGB
        - At Cascades/Working/DIAMOND-TIER-{scope}.md
        - Documents R3 vs R6 Reconciliation if any
        - Includes LOCKED / PROVISIONAL cells per Foundation returns
Step 7: Conference: AskUserQuestion presents Diamond Plan · user decides next tier
Step 8a: User selects Tier-1 → continue per SG-Traditional.md (dispatch R5)
Step 8b: User selects Tier-2 → continue per SG-3-Stage.md (N R3 → N R5)
Step 8c: User selects Direct R5 → dispatch R5 directly with Foundation substrate
Step 8d: User selects Halt → cycle closes at plan-only · Fuchsia G/L/M records plan-only close
```

**Critical Boundary**: At Step 6, the Diamond Plan is a Lambda-event (disk artifact · verifiable). Tier-0 close is a legitimate cycle close — Lambda is the **plan**, not the implementation. Onyx records this explicitly.

---

## Tutorial Use Case · Macro Open with Tier-0 Foundation-Only

Per user directive, **both tutorials use the Macro Diamond pattern**. Tier-0 Foundation-Only is the recommended Macro Open pattern when:

1. Sub-Diamond count is unclear at Foundation time → Foundation surfaces it → user reviews Cerulean Task Chain before any sub-Diamond engages
2. Isolation count is unclear → Foundation surfaces N Diameter Gaps → user reviews Diamond-of-Isolations table before R3 dispatch
3. Tutorial recording → Tier-0 produces clean plan-only artifact for teaching · separates Foundation grounding from actualization for pedagogical clarity

### Example: Macro Open via Tier-0

```
User: "I want to plan the next Macro · architectural review before actualization"
Conductor: Tier-0 Foundation-Only · 5-Suite Macro Open (R1+R2+R4+R6+R7)
           Dispatches Foundation Magic Shotgun
           ~10 min · 5 disk artifacts in Cascades/Working/
           Synthesizes → Cascades/Working/DIAMOND-TIER-{NEW-MACRO}.md
           Conference: "Macro WGB ready · 6 sub-Diamonds planned · 3 Diameter Gaps · next engagement?"
User: [2] Tier-2 3-Stage (because 3 isolated Gaps confirmed)
Conductor: Continues per SG-3-Stage.md · dispatches 3 R3 Yellow per-isolation in single message
```

---

## Empirical Anchor

Tier-0 Foundation-Only is NEW at Cycle 113. The 4-Tier Magic Shotgun formalizes a structure that was previously implicit:

- The 4-Suite Macro Open (Cycle 59 Macro 1 open) effectively ran Tier-0 (Foundation only · then planning · then sub-Diamond cycles · then R5 per sub-Diamond) but without a named tier boundary
- The 5-Suite Macro Open (Cycle 112 Refinement Macro open) effectively ran Tier-0 → Tier-2 escalation when 3 Gaps surfaced · but the tier transition was not explicit

Tier-0 formalizes the staging that was already empirically present, making the user-Conference boundary explicit and the Macro Open pattern more pedagogically clean for tutorial documentation.

---

## Diameter to Macro Diamond + Foundation Suites Skills

Tier-0 Foundation-Only is the entry point most aligned with:

- **S-MACRO-DIAMOND Skill** (Macro Open Foundation Grounding) — Tier-0 IS the Foundation Grounding cycle of every Macro
- **S-FOUNDATION-SUITES Skill** (composition selection) — Tier-0 uses Foundation Suites compositions directly

Conductor routing:
- User selects [F1] in Magic Shotgun Main Menu → SG-Foundation-Only.md (this file)
- User selects [0] in Foundation Suites Menu (SF-Foundation-Suites.md) → routes here
- User selects [Macro Diamond] in main Shatterite menu → routes through SM-Macro-Diamond.md (which often selects Tier-0 for plan-only Macro Open)

---

## Navigation

- `[B]` Back to Magic Shotgun Main Menu (SG-Main.md)
- `[1]` Continue to Tier-1 Traditional (SG-Traditional.md)
- `[2]` Continue to Tier-2 3-Stage (SG-3-Stage.md)
- `[F]` Continue to 5-Suite Macro Open Foundation (SG-Macro-Open.md)
- `[D]` Macro Diamond Menu (SM-Macro-Diamond.md)
- `[M]` Return to Main Shatterite Menu (SM-Main.md)
- `[Q]` Exit Shatterite
