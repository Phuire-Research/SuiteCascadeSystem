# SG-M19-Quartet — M19 Design-Moment Quartet Reference Design

**Menu ID**: SG-Q
**Trigger**: Interactive-class design moment · FSM extension · state-vs-rendering decision · M31 mandatory
**Round Composition**: 4 Rounds (R2 + R3 + R4 + R6) · ~8 min wall-clock
**Empirical Foundation**: Cycle 110 SS-A1-D2 (`ONYX-TIER-13.md:309-384`)

---

## What M19 Quartet Is

The 4-Round Foundation composition firing when an **Interactive-class design moment** is anticipated. The +1 R4 Green Round over the standard Triplet provides bidirectional examination authority that prevents costly architectural mistakes at design moments where detection signal availability informs the design.

```
Stage 1 · M19 Quartet (parallel):
  R2 Orange     ─┐
  R3 Yellow     ─┤
  R4 Green      ─┼─→ R4 has M31 authority over R2+R3+R6 at design moment
  R6 Purple     ─┘
                 ↓
       Main Thread Synthesis (R4 calibrates over R2+R3+R6 vacuum decisions)
                 ↓
Stage 2 · R5 Blue Cobalt: implementation per R4-authoritative design
```

---

## When to Use (M31 Mandatory Fires)

M31 (codified at Cycle 110): **Interactive-class M19 decisions MUST dispatch R4 in Foundation**.

Interactive-class signals (M19 territory):

- **Detection-signal design moment** — does the signal already exist? what shape? how stale?
- **FSM extension question** — should this be a new state in the FSM, or a DERIVED state at render time?
- **State-vs-rendering boundary** — durable state field vs ephemeral computation?
- **Optional discriminator design** — discriminated union vs runtime guard?
- **Type+JSON Hybrid validation** — optional discriminator + parsed-content cross-check?

If ANY of the above is anticipated in the sub-Diamond → fire M19 Quartet · M31 is the mandatory rule.

---

## Why R4 Authority (M31 Reasoning)

At Cycle 110 (SS-A1-D2 · PPHB detection signal):

- R2 Orange returned with RSLA-over-PPPD naming
- R3 Yellow returned with 5-state FSM + 4 new qualities
- R6 Purple returned with vacuum decisions
- R4 Green arrived LAST with full Foundation context
- **R4 OVERRULED all three** earlier suites · the most conservative correct architecture preserved `scpLifecycle` FROZEN + `scpLifecycleBadge` FROZEN + DERIVED 6th-state via `interactiveSessionsByScp Map<string,Map<string,number>>` + `filterRecentHeartbeats` + 90s threshold

**Outcome**: +1 R4 Round cost prevented 4 unnecessary quality files + FSM extension + badge format change. M30 codified (rendering-derived states are NOT FSM state extensions). M31 codified (R4 mandatory for M19).

---

## Banded Vermillion Plan Template

```
<VermillionPlan topic="[Sub-Diamond with M19 Design Moment]">

Band Stage-1A [R2 Orange] (sonnet):
  Informative: Verbose name candidates for the Interactive-class pattern + Diameter framing
  Actionable: Write SUITE-2-ORANGE-{sub}-NAMING.md
  Coordination: Suites 2/3/4/6 running concurrently. R2 names; R3 designs; R4 bidirectional; R6 sequences. Do not overlap.

Band Stage-1B [R3 Yellow] (sonnet):
  Informative: Source-read target FSM / detection-signal substrate (M9)
  Actionable: Write SUITE-3-YELLOW-{sub}-ARCHITECTURE.md · candidate FSM extension OR derivation design
  Coordination: As above.

Band Stage-1C [R4 Green] (sonnet):
  Informative: Bidirectional source-read · what the substrate THINKS vs what materialized · M19 design-moment authority
  Actionable: Write SUITE-4-GREEN-{sub}-BIDIRECTIONAL.md · AUTHORITATIVE for Interactive-class design · M31 authority noted
  Coordination: As above. R4 carries M31 authority for design-moment decisions.

Band Stage-1D [R6 Purple] (sonnet):
  Informative: Read prior Macro WGB patterns · identify dependency chain
  Actionable: Write SUITE-6-PURPLE-{sub}-ORCHESTRATION.md · PROVISIONAL cells where R4 will calibrate
  Coordination: As above. R6 acknowledges M32 (M10 Calibration is iterative · later Foundation Suite arrivals can re-calibrate earlier ones).

[Main Thread Synthesis · R4 authority over R2+R3+R6 per M31 · documented in WGB]

Band Stage-2 [R5 Blue Cobalt] (opus):
  Informative: Read R4 AUTHORITATIVE output + WGB final decisions
  Actionable: Implement per R4-calibrated design · run 5 Concluders · commit at cycle close per M14
</VermillionPlan>
```

---

## Conductor Dispatch Pattern

```
Step 1: Conductor detects M19 trigger (Interactive-class signal in user scope)
Step 2: Compose Banded Vermillion Plan with M19 Quartet
Step 3: Dispatch Stage 1 via Agent tool · SINGLE MESSAGE · 4 parallel agents:
        - Agent(r2-prospector,   sonnet, Band Stage-1A)
        - Agent(r3-architect,    sonnet, Band Stage-1B)
        - Agent(r4-sculptor,     sonnet, Band Stage-1C · R4 authority noted)
        - Agent(r6-orchestrator, sonnet, Band Stage-1D)
Step 4: All 4 return · Conductor reads in order R2 → R3 → R6 → R4 (R4 LAST for authority)
Step 5: Synthesis: R4 calibrates over R2+R3+R6 vacuum decisions · WGB documents M31 authority
Step 6: Dispatch Stage 2 (R5 Blue Cobalt) per R4-calibrated design
Step 7: Cycle close · Fuchsia G/L/M
```

---

## Anti-Pattern Block

**Anti-Pattern**: Firing R2+R3+R6 Triplet without R4 for an Interactive-class moment.

**Failure Mode**: R2/R3/R6 each architect in vacuum without bidirectional examination of substrate state. Risk: unnecessary FSM extensions · over-architecture · field name drift · cross-Macro inconsistency. R3 vs R6 Reconciliation cannot resolve substrate-derivation questions because that authority belongs to R4.

**Correction**: M31 is non-negotiable for Interactive-class moments. The +1 R4 Round cost is structural insurance.

---

## Navigation

- `[B]` Back to Magic Shotgun Main Menu (SG-Main.md)
- `[M]` Return to Main Shatterite Menu (SM-Main.md)
- `[Q]` Exit Shatterite
