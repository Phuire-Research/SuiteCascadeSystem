# SG-Closure-Quartet — Closure Quartet Reference Design

**Menu ID**: SG-C
**Trigger**: Sub-Diamond closure scope · post-impl verification · final-cycle clinical close
**Round Composition**: 4 Rounds (R1 + R4 + R6 + R7) · ~8 min wall-clock
**Empirical Foundation**: Cycle 111 SS-Final (`ONYX-TIER-13.md:401-451`)

---

## What Closure Quartet Is

The 4-Round Foundation composition firing when a sub-Diamond is **closing** (final sub-Diamond of a Macro · final implementation cycle) and the work requires both:

- Curation recheck (R1) — file presence verification · scope-confirmation
- Bidirectional examination (R4) — does WGB scope match source reality?
- Orchestration close-out (R6) — final sequence map · M33 verification
- Clinical close (R7) — Gainy/Lossy/Maintain G/L/M append to Onyx · Macro retrospective

```
Stage 1 · Closure Quartet (parallel):
  R1 Red        ─┐
  R4 Green      ─┤
  R6 Purple     ─┼─→ R4 source-reads · R6 verifies WGB scope · R7 fires Macro close
  R7 Fuchsia    ─┘
                 ↓
       Main Thread Synthesis (R4 may reduce scope per M33)
                 ↓
Stage 2 · R5 Blue Cobalt (or test-only per M27)
                 ↓
       R7 G/L/M append to Onyx · Macro close · checkpoint commit
```

---

## When to Use

- **Final sub-Diamond of a Macro** — needs clinical close + retrospective at the same cycle
- **Sub-Diamond with scope-uncertainty** — R4 source-read may reduce scope (M33 territory)
- **Post-impl verification cycle** — work shipped but verification scope unclear
- **Refinement Macro closing isolation** — REF-D1 (HALT-GATE surface) close pattern

---

## Why R7 at Foundation Level (Closure-Specific)

Normally R7 Fuchsia fires at cycle close (after R5 implementation), not at Foundation level. For Closure Quartet, R7 fires at BOTH:

- **Foundation level** (this Quartet) — Macro-level clinical retrospective written into WGB
- **Cycle close** (after R5) — G/L/M append to Onyx

The Foundation-level R7 surfaces cross-Macro seam concerns BEFORE R5 implements, so the implementation can address the seam if needed. Source: Cycle 112 Refinement Macro precedent — R7 at Foundation surfaced M35 candidate before R5 dispatched.

---

## Why R4 Authority at Closure (M33)

At Cycle 111 (SS-Final · Closure Quartet):

- WGB language prescribed `BootRequestPayload.originatingSessionId` extension + scpSpawnManager quality reducer
- R4 source-read at M19 verification caught that SCAL was ALREADY wired via existing `sessionId` field at `scpSpawnManager.type.ts:63`
- R4 reduced scope: extension kept additive but scpSpawnManager quality was VACUOUS
- 10 frozen envelope tests preserved untouched
- **M33 codified**: Cobalt verifies WGB language against source at impl time · WGB CAN be wrong about scope (additive vs already-wired) · M9 ground-truth wins at point of conflict

R4 authority at closure is structural — WGB scope is Ego (prunable plan) while source is Lambda (the substrate). At closure cycle, R4 verifies Ego ↔ Lambda alignment before R5 implements.

---

## Banded Vermillion Plan Template

```
<VermillionPlan topic="[Sub-Diamond Closure]">

Band Stage-1A [R1 Red] (haiku):
  Informative: Verify all WGB-referenced files exist (M10 gap protocol if absent)
  Actionable: Write SUITE-1-RED-{sub}-CURATION-CLOSE.md · file presence verification · scope confirmation

Band Stage-1B [R4 Green] (sonnet):
  Informative: Bidirectional source-read · WGB scope vs source reality
  Actionable: Write SUITE-4-GREEN-{sub}-BIDIRECTIONAL.md · M33 authority · scope reduction if redundant

Band Stage-1C [R6 Purple] (sonnet):
  Informative: Read R1+R4 returns · M10 Mid-Flight-Calibrator
  Actionable: Write SUITE-6-PURPLE-{sub}-ORCHESTRATION-CLOSE.md · final sequence map · gap protocol if R1 surfaces missing files

Band Stage-1D [R7 Fuchsia] (sonnet):
  Informative: Read Macro WGB + prior Onyx cycles · macro-level retrospective scope
  Actionable: Write SUITE-7-FUCHSIA-{sub}-FOUNDATION-CLINICAL.md · Macro-level clinical pre-read (NOT cycle close G/L/M · this is Foundation-level)

[Main Thread Synthesis · R4 may reduce R5 scope per M33]

Band Stage-2 [R5 Blue Cobalt] (opus):
  Informative: Read R4 AUTHORITATIVE output + WGB final scope
  Actionable: Implement per R4-calibrated scope · OR test-only per M27 if fix is one-line config
  Concluders: 5 (typecheck · build · tests · invariant grep · Read-back)

Band Cycle-Close [R7 Fuchsia] (sonnet):
  Informative: Read Stage 2 R5 output · cycle close diagnosis
  Actionable: Append G/L/M to ONYX-TIER-N.md (cycle close · Lambda-event · Read-back required) · checkpoint commit per Three-Step Close (CLAUDE.md C5)
</VermillionPlan>
```

---

## Conductor Dispatch Pattern

```
Step 1: Conductor detects sub-Diamond closure scope (final sub-Diamond OR HALT-GATE proximity OR scope-uncertainty)
Step 2: Compose Banded Vermillion Plan with Closure Quartet
Step 3: Dispatch Stage 1 via Agent tool · SINGLE MESSAGE · 4 parallel agents:
        - Agent(r1-curator,      haiku,  Band Stage-1A)
        - Agent(r4-sculptor,     sonnet, Band Stage-1B · M33 authority noted)
        - Agent(r6-orchestrator, sonnet, Band Stage-1C)
        - Agent(r7-clinician,    sonnet, Band Stage-1D · Foundation-level clinical only · NOT cycle close)
Step 4: All 4 return · synthesis · R4 may reduce R5 scope
Step 5: Dispatch Stage 2 (R5 Blue Cobalt OR skip if test-only per M27)
Step 6: Cycle close: dispatch R7 Fuchsia for G/L/M append (separate from Foundation-level R7)
Step 7: Three-Step Close (CLAUDE.md C5): Onyx append + checkpoint commit + Diamond task update
```

---

## Test-Only Sub-Diamond Variant (M27)

If R3's Reference Design is a one-line config change, R5 may skip implementation and the new integration test IS the Lambda-event proving the fix. The test file commit becomes the Muxistration Proof.

Source: M27 codified at Cycle 109 (SS-A1-D1 test-only verification of M17 wire).

---

## Navigation

- `[B]` Back to Magic Shotgun Main Menu (SG-Main.md)
- `[M]` Return to Main Shatterite Menu (SM-Main.md)
- `[Q]` Exit Shatterite
