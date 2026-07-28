# SG-Macro-Open — 5-Suite Macro Open Reference Design

**Menu ID**: SG-F
**Trigger**: Macro opens · multi-Gap surface · cross-Macro seam · Refinement Macro Foundation Grounding
**Round Composition**: 5 Rounds (R1 + R2 + R4 + R6 + R7) · ~10 min wall-clock
**Empirical Foundation**: Cycle 112 Refinement Macro (`DIAMOND-TIER-BRIDGE-CLAUDECODE-REFINEMENT.md`)

---

## What 5-Suite Macro Open Is

The 5-Round Foundation composition firing at **Macro open** when:

- Multiple Diameter Gaps anticipated
- Cross-Macro seam concerns may exist
- Macro-level clinical retrospective needed at Foundation level (NOT only at Macro close)

```
Stage 1 · 5-Suite Macro Open (parallel · per user directive at Refinement Macro Cycle 112):
  R1 Red        ─┐
  R2 Orange     ─┤
  R4 Green      ─┼─→ 5-Suite Foundation · R7 at Foundation level for macro-level clinical
  R6 Purple     ─┤
  R7 Fuchsia    ─┘
                 ↓
       Main Thread Synthesis (Macro WGB write · Locked Architectural Decisions · M35 candidate)
                 ↓
   [If multiple isolated Gaps → escalate to 3-Stage variant per SG-3-Stage.md]
                 ↓
Stage 2 · R5 Blue Cobalt (single isolation · or 3-Stage per-isolation if multi-Gap)
```

---

## When to Use

- **Macro opening cycle** (first cycle of new Macro · pre-sub-Diamond planning)
- **Refinement Macro Foundation Grounding** (where user-Lambda smoke surfaced cross-Macro seam gaps)
- **Multi-Gap anticipated** but exact isolation count unclear at Foundation time
- **Cross-Macro seam closure** required — prior Macros each correctly scoped surfaces but seam unaddressed

If multiple isolated Gaps confirmed at planning → escalate to **3-Stage Magic Shotgun** (`SG-3-Stage.md`) for the Diamond-of-Isolations architecture.

---

## Why R7 at Foundation Level (Macro Open)

R7 Fuchsia normally fires at cycle close. At Macro open level, R7 fires at Foundation to:

- Surface seam-crossing concerns BEFORE sub-Diamonds are planned
- Codify candidate M-rules (e.g., M35 candidate at Cycle 112 · cross-Macro seam smoke discipline)
- Provide macro-level clinical retrospective on prior Macros' HALT-GATE coverage

Source: Cycle 112 Refinement Macro precedent — R7 Foundation identified that 3 user-flagged Gaps existed at SEAM between Install Refinement Macro + Stratidian Bridge Macro + Session-by-SCP Macro · no single HALT-GATE owned the seam.

---

## Why R3 Yellow EXCLUDED at Macro Open

R3 Yellow is NOT included in the 5-Suite Macro Open. Why?

At Macro open, the architecture must be **per-sub-Diamond** (or **per-isolation** in 3-Stage). Firing R3 at Foundation would either:

- Architect the WHOLE Macro upfront (too coarse · doesn't respect sub-Diamond isolation)
- Architect a single Gap arbitrarily (premature commitment · skip the Diamond planning step)

Instead, R3 Yellow fires later: at sub-Diamond Foundation (2-Stage) or at Stage 2 per-isolation (3-Stage). The Macro Open Foundation surfaces the LOCKED ARCHITECTURAL DECISIONS table (what's frozen across sub-Diamonds) and the SEQUENCE (which sub-Diamond first) — the design plane is sub-Diamond-scoped.

---

## Banded Vermillion Plan Template

```
<VermillionPlan topic="[Macro Open · {Macro Pearl}]">

Band Stage-1A [R1 Red] (haiku):
  Informative: Inventory all surfaces this Macro will touch
  Actionable: Write SUITE-1-RED-{Macro}-CURATION.md · file inventory · existing patterns

Band Stage-1B [R2 Orange] (sonnet):
  Informative: Verbose name the patterns this Macro will introduce
  Actionable: Write SUITE-2-ORANGE-{Macro}-PROSPECTING.md · pattern registry · Diameter framing

Band Stage-1C [R4 Green] (sonnet):
  Informative: Bidirectional examination of cross-Macro seams
  Actionable: Write SUITE-4-GREEN-{Macro}-BIDIRECTIONAL.md · gap analysis · prior Macro HALT-GATE coverage check

Band Stage-1D [R6 Purple] (sonnet):
  Informative: Read prior Macro WGB patterns · Macro-level orchestration
  Actionable: Write SUITE-6-PURPLE-{Macro}-ORCHESTRATION.md · Macro WGB · Locked Architectural Decisions · sub-Diamond chain · dependency analysis

Band Stage-1E [R7 Fuchsia] (sonnet · Foundation-level clinical):
  Informative: Read prior Onyx tiers · cross-Macro seam analysis
  Actionable: Write SUITE-7-FUCHSIA-{Macro}-FOUNDATION-CLINICAL.md · macro-level retrospective · M-rule candidates · seam-crossing concerns
  Note: This is NOT cycle close G/L/M. That fires at Macro CLOSE (separate event).

[Main Thread Synthesis · Macro WGB write · Locked Architectural Decisions table · sub-Diamond chain]

[Decision Point]
  Single Gap → continue 2-Stage with sub-Diamond Foundation Triplet OR Quartet
  Multiple isolated Gaps → escalate to 3-Stage Magic Shotgun (SG-3-Stage.md)
</VermillionPlan>
```

---

## Conductor Dispatch Pattern

```
Step 1: Conductor detects Macro open scope (new Macro · user directive includes Pearl-level scope)
Step 2: Compose Banded Vermillion Plan with 5-Suite Macro Open
Step 3: Dispatch Stage 1 via Agent tool · SINGLE MESSAGE · 5 parallel agents:
        - Agent(r1-curator,      haiku,  Band Stage-1A)
        - Agent(r2-prospector,   sonnet, Band Stage-1B)
        - Agent(r4-sculptor,     sonnet, Band Stage-1C)
        - Agent(r6-orchestrator, sonnet, Band Stage-1D)
        - Agent(r7-clinician,    sonnet, Band Stage-1E · Foundation-level clinical · NOT cycle close)
Step 4: All 5 return within ~10 min · Conductor reads + synthesizes
Step 5: Write Macro WGB (DIAMOND-TIER-{Macro}.md) with Locked Architectural Decisions + sub-Diamond chain
Step 6: Decision point: continue 2-Stage per sub-Diamond OR escalate to 3-Stage per isolation
Step 7: Sub-Diamond cascade begins (per-sub-Diamond Foundation + R5 OR 3-Stage Stage 2/3)
```

---

## Empirical Example · Cycle 112 Refinement Macro

```
Macro: SCS-Bridge↔ClaudeCode Communication Refinement
Foundation 5-Suite outputs (combined ~2001 lines):
  - SUITE-1-RED-BRIDGE-CLAUDECODE-REFINEMENT-CURATION.md      (~600 lines)
  - SUITE-2-ORANGE-BRIDGE-CLAUDECODE-REFINEMENT-PROSPECTING.md (~700 lines)
  - SUITE-4-GREEN-BRIDGE-CLAUDECODE-REFINEMENT-BIDIRECTIONAL.md (~600 lines)
  - SUITE-6-PURPLE-BRIDGE-CLAUDECODE-REFINEMENT-ORCHESTRATION.md (~500 lines)
  - R7 Foundation-level clinical (inline in WGB)

Decision Point Outcome: 3 isolated Diameter Gaps confirmed
  → Escalated to 3-Stage Magic Shotgun (SG-3-Stage.md)
  → Stage 2 (Cycle 113): 3 R3 Yellow per-isolation in parallel
  → Stage 3 (Cycle 113): 3 R5 Blue Cobalt dependency-sequenced
```

---

## Navigation

- `[B]` Back to Magic Shotgun Main Menu (SG-Main.md)
- `[3]` Continue to 3-Stage Per-Isolation (SG-3-Stage.md · if multi-Gap)
- `[M]` Return to Main Shatterite Menu (SM-Main.md)
- `[Q]` Exit Shatterite
