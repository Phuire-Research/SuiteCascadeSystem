# SG-3-Stage — 3-Stage Per-Isolation Magic Shotgun Reference Design

**Menu ID**: SG-3
**Trigger**: Refinement Macros · multiple isolated Diameter Gaps in single Macro · Diamond-of-Isolations architecture · Length 1-7
**Stage Composition**: Stage 1 (Foundation) + Stage 2 (N R3 per-isolation) + Stage 3 (N R5 per-isolation)
**Empirical Foundation**: Refinement Macro Cycles 112-113 (`DIAMOND-TIER-BRIDGE-CLAUDECODE-REFINEMENT.md` · `ONYX-TIER-14.md`)

---

## What 3-Stage Magic Shotgun Is

The **NEW Magic Shotgun variant** birthed at the Refinement Macro Cycle 112-113. Where Traditional 2-Stage synthesizes ALL Foundation returns into ONE R5 Cobalt brief, 3-Stage decomposes the actualization plane into **N isolated Reference Design + Cobalt pairs** — one per Diameter Gap.

```
Stage 1 · Foundation Magic Shotgun (typically 5-Suite for Macro open):
  R1 + R2 + R4 + R6 + R7   ─→ Foundation reports (parallel · single message)
                                  ↓
                          Diamond Planning · Diamond-of-Isolations table
                                  ↓
                          N Diameter Gaps formally separated
                                  ↓
Stage 2 · R3 Yellow Per-Isolation Shotgun (parallel · N R3 in single message):
  R3-Yellow-Gap-1 ─┐
  R3-Yellow-Gap-2 ─┼─→ N Reference Designs (each isolated · disjoint by design)
  R3-Yellow-Gap-N ─┘
                                  ↓
Stage 3 · R5 Blue Cobalt Per-Isolation (sequential or parallel · dependency-ordered):
  R5-Cobalt-Gap-1 (deepest dependency first) → commit
       ↓
  R5-Cobalt-Gap-2 (blocked by Gap-1)         → commit
       ↓
  R5-Cobalt-Gap-N (blocked by Gap-(N-1))     → commit
                                  ↓
                          HALT-GATE smoke (end-to-end · all isolations)
                                  ↓
                          R7 Fuchsia cycle close · G/L/M append to Onyx
```

---

## When to Use

- **Refinement Macro** with multiple user-flagged Diameter Gaps
- **Cross-Macro seam closure** where N independent surfaces need fixing in single Macro
- **Multi-isolation architecture** required to prevent cross-Gap contamination
- **Cascade Length 1-7** (full cascade · Foundation + per-isolation R3 + per-isolation R5 + Macro close R7)

If single Diameter Gap → use 2-Stage variants (Traditional / M19 Quartet / Closure Quartet / Macro Open). 3-Stage is for **multi-Gap** specifically.

---

## Why 3-Stage (Higher-Order Compositional Justification)

**Problem 2-Stage forces** when multiple Gaps exist:

- Option A: Bundle all Gaps into ONE R5 dispatch
  - Collision risk · architectural impurity · cross-Gap contamination
  - R5 cannot maintain disjoint scope across N implementations
- Option B: Run N sequential 2-Stage sub-Diamonds
  - N redundant Foundation phases (cost · time)
  - Foundation substrate is shared but rebuilt each time

**3-Stage Solution**: ONE Foundation phase (Stage 1) + N R3 per-isolation (Stage 2) + N R5 per-isolation (Stage 3).

The isolation IS the architectural protection. If Gap-A modifies `scpRegistryWatcher/` and Gap-B also touches `scpRegistryWatcher/`, the disjoint R3 Reference Designs at Stage 2 catch the collision at design time (not impl time).

Higher-Order Composition expressed as parallel actualization on a flat plane — NOT nested sub-Macros.

---

## Diamond-of-Isolations Architecture

After Stage 1 returns, Diamond planning produces a table of the form:

```
Sub-Diamond  Gap                                Dependency Chain
───────────  ─────────────────────────────────  ──────────────────────
REF-D1       {Surface-most Gap}                  blocked by D2 · HALT-GATE
REF-D2       {Mid-depth Gap}                     blocked by D3
REF-D3       {Deepest infrastructure Gap}        unblocked · first execute
```

Each sub-Diamond gets its own R3 Reference Design + R5 Cobalt actualization. Sub-Diamonds may run sequential (dependency chain) or parallel (true independence).

---

## Banded Vermillion Plan Template

```
<VermillionPlan topic="[Refinement Macro · Multi-Gap]">

[Stage 1 · Foundation Magic Shotgun · per SG-Macro-Open.md]
Band Stage-1A [R1 Red] (haiku): Inventory all surfaces
Band Stage-1B [R2 Orange] (sonnet): Name patterns · Diameter framing
Band Stage-1C [R4 Green] (sonnet): Bidirectional cross-seam exam
Band Stage-1D [R6 Purple] (sonnet): Macro WGB · Diamond-of-Isolations · sequence
Band Stage-1E [R7 Fuchsia] (sonnet · Foundation-level clinical)

[Diamond Planning · Locked Architectural Decisions · Diamond-of-Isolations table]

[Stage 2 · R3 Yellow Per-Isolation Shotgun · SINGLE MESSAGE]
Band Stage-2A [R3 Yellow] (sonnet · Gap 1):
  Informative: Source-read target files for Gap 1 · read Foundation substrate
  Actionable: Write SUITE-3-YELLOW-{Gap1}-ARCHITECTURE.md · exact change spec
  Coordination: 3 R3 Yellow agents running concurrently for 3 disjoint isolations. Do not touch other Gap's surface.

Band Stage-2B [R3 Yellow] (sonnet · Gap 2):
  Informative: Source-read target files for Gap 2 · read Foundation substrate
  Actionable: Write SUITE-3-YELLOW-{Gap2}-ARCHITECTURE.md · exact change spec
  Coordination: As above.

Band Stage-2N [R3 Yellow] (sonnet · Gap N):
  Informative: Source-read target files for Gap N · read Foundation substrate
  Actionable: Write SUITE-3-YELLOW-{GapN}-ARCHITECTURE.md · exact change spec
  Coordination: As above.

[Stage 3 · R5 Blue Cobalt Per-Isolation · dependency-sequenced]
Band Stage-3A [R5 Blue Cobalt] (opus · deepest dependency):
  Informative: Read R3 Reference Design for deepest Gap
  Actionable: Implement · 5 Concluders · commit (M14 + M21 · Cascade.json excluded)

Band Stage-3B [R5 Blue Cobalt] (opus · mid-depth):
  Informative: Read R3 Reference Design for mid-depth Gap · verify Stage-3A landed
  Actionable: Implement · 5 Concluders · commit

Band Stage-3N [R5 Blue Cobalt] (opus · surface · HALT-GATE):
  Informative: Read R3 Reference Design for surface Gap · verify all prior Stage 3 landed
  Actionable: Implement · 5 Concluders · commit · HALT-GATE end-to-end smoke

[Cycle Close]
Band Macro-Close [R7 Fuchsia] (sonnet):
  Informative: Read all Stage 3 commits · cross-Macro retrospective
  Actionable: Append G/L/M to ONYX-TIER-N.md · codify M-rule candidates (e.g., M35) · Three-Step Close
</VermillionPlan>
```

---

## Conductor Dispatch Pattern

```
Step 1: Conductor detects multi-Gap Refinement Macro scope
Step 2: Stage 1 dispatch: 5-Suite Foundation per SG-Macro-Open.md (5 parallel agents · single message)
Step 3: Stage 1 returns · Diamond planning · Diamond-of-Isolations table → Macro WGB write
Step 4: Stage 2 dispatch: N R3 Yellow per-isolation · SINGLE MESSAGE · all parallel
        - Agent(r3-architect, sonnet, Band Stage-2A · Gap 1)
        - Agent(r3-architect, sonnet, Band Stage-2B · Gap 2)
        - Agent(r3-architect, sonnet, Band Stage-2N · Gap N)
Step 5: All N R3 return · Conductor reads each Reference Design
Step 6: Stage 3 dispatch: R5 Blue Cobalt sequential per dependency chain
        - For each Gap (deepest first): Agent(r5-professional, opus, Band Stage-3X)
        - Wait for previous Stage 3 commit before next dispatch
Step 7: HALT-GATE smoke after final Stage 3 commit (end-to-end · all isolations)
Step 8: Macro close: R7 Fuchsia cycle close G/L/M → Onyx append + checkpoint commit
```

**Critical Invariant**: Stage 2 R3 agents run with **disjoint scope coordination note** in each prompt. Each R3 is told the other R3s are running concurrently for OTHER isolations. Do not touch other Gap's surface.

---

## Empirical Example · Refinement Macro Cycle 112-113

```
Macro: SCS-Bridge↔ClaudeCode Communication Refinement
Diamond-of-Isolations Table:
  REF-D1  Install SCP Menu Hookups + Pre-Approval (ISAPSP)          ← blocked by D2 · HALT-GATE surface
  REF-D2  bridge.json + SCP-Researcher Communication Skill          ← blocked by D3
          (BJLM + SRSKD + MCPL · 3 surfaces · load-bearing)
  REF-D3  chokidar SCP Discovery Pickup (CRBSP)                     ← unblocked · deepest fix

Stage 1 Foundation (Cycle 112 · 5 parallel agents · ~2001 lines combined output)
Stage 2 R3 Per-Isolation (Cycle 113 · 3 R3 Yellow parallel · 1564 lines combined):
  - R3-Yellow-REF-D3 · 461 lines · chokidar config change
  - R3-Yellow-REF-D2 · 772 lines · bridge.json + Communication Skill + Conductor Band
  - R3-Yellow-REF-D1 · 331 lines · pre-approval Menu Skill pathing

Stage 3 R5 Per-Isolation (Cycle 113 · sequential due to dependency chain):
  R5-Cobalt-REF-D3 → R5-Cobalt-REF-D2 → R5-Cobalt-REF-D1
  Each commits separately as discrete Lambda-event

HALT-GATE 7-step end-to-end smoke covers all 3 isolations
R7 Fuchsia cycle close → ONYX-TIER-14.md append + checkpoint commit
```

---

## When NOT to Use 3-Stage

- **Single Diameter Gap** → use 2-Stage (Traditional / M19 / Closure / Macro Open)
- **Gaps that genuinely share an implementation surface** → 2-Stage with single R5 may be cleaner (e.g., two Gaps both modifying the same file in obviously composable ways)
- **Very-low-complexity Macro** (1-2 Gaps with single-line fixes) → may be more efficient as sequential 2-Stage

The 3-Stage decision is governed by **isolation requirement** — if Gaps must be disjoint at implementation time to prevent contamination, 3-Stage is the answer.

---

## Navigation

- `[B]` Back to Magic Shotgun Main Menu (SG-Main.md)
- `[F]` Back to 5-Suite Macro Open (SG-Macro-Open.md · Foundation phase)
- `[M]` Return to Main Shatterite Menu (SM-Main.md)
- `[Q]` Exit Shatterite
