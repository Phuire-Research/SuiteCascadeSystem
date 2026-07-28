# Macro Diamond — Reference Design Guide

**Crystraline Position**: Macro Diamond ↔ C6 Diamond (multi-cycle scale)
**Empirical Source**: Macro Diamond 1 · Cycles 59-73 · 15 sub-Diamonds · 14 atomic /loop iterations
**Status**: Pattern proven · 0 net-new typecheck errors maintained throughout · CD-5 streak preserved at 62 consecutive PASS
**Companion Guide**: `FOUNDATION-SUITES-GUIDE.md`

---

## Executive Summary

A **Macro Diamond** is a Diamond WorkGameBoard that governs a multi-sub-Diamond, multi-Aspirant scope too large for a single atomic cycle. Where an ordinary Diamond closes in one cycle with one Fuchsia G/L/M append, a Macro Diamond decomposes into Prerequisite sub-Diamonds + Aspirant sub-Diamonds + Final Closer — each its own atomic cycle. The Macro Diamond runs autonomously via **Stratimuxian Automata** (`/loop` dynamic mode) with **Foundation Suites at-once Tier-1 parallel grounding** per sub-Diamond, and closes with **Post-Macro Summation** to formalize what was learned.

---

## 1 · Macro Diamond Definition

A Macro Diamond differs from an ordinary Diamond in four structural properties:

### 1.1 · Multi-Aspirant Structure

A Macro decomposes into distinct **Aspirants** — each Aspirant is a Named Objective composed of 4-6 sub-Diamonds. Each Aspirant has its own Pearl-name, its own cycle chain, and its own Closure Note when all its sub-Diamonds complete. Aspirants are NOT phases in a single plan; they are independently deliverable Conceptual Surfaces that compose via Diameter at the end.

### 1.2 · Prerequisite Phase

Before Aspirants engage, Prereq sub-Diamonds land shared infrastructure that all Aspirants depend on. Prereqs are atomic Diamonds of their own (each with Fuchsia close + Onyx append).

### 1.3 · Final Closer

After all Aspirants close, a dedicated Final sub-Diamond lands deferred server-side mechanisms, cleans up swap-gate stubs, and wires the remaining Diameters. The Final sub-Diamond IS the Macro Diamond's Muxistration Proof.

### 1.4 · Scope Criteria (When to Use Macro)

Use a Macro when all four conditions hold:
- **(a)** the work requires 2+ independently deliverable Conceptual Surfaces
- **(b)** the work spans 10+ sub-Diamonds
- **(c)** the work has a prerequisite infrastructure phase distinct from the Aspirant implementation phases
- **(d)** the Aspirants compose via shared infrastructure (a base concept, an API, a ported library)

### What a Macro is NOT

A Macro is NOT a mega-Diamond that does everything in one WGB pass. Each sub-Diamond is its own atomic cycle (own Diamond WGB · own Fuchsia close · own Onyx append). The Macro Diamond WGB (`DIAMOND-TIER-MACRO-1.md`) is the Aspirant + Prereq + Final composition plan — not the implementation plan. Each sub-Diamond WGB (`DIAMOND-TIER-M1-A1-D2.md`, etc.) is the implementation plan for that sub-Diamond.

---

## 2 · Macro 1 Concrete Example

**Pearl**: The Bridge Becomes Its Own Surface · Suite 8 ClaudeCode Becomes Operational Spawn · HomePage Becomes Portable Hyper-Personalization

**Cycles**: 59-73 (15 sub-Diamonds across 14 atomic /loop iterations)

### Sub-Diamond Breakdown

| ID | Phase | Cycle | Pearl |
|---|---|---|---|
| M1-P1 | Prereq | 59 | actionExchange API on MuxonomicConfig |
| M1-P2 | Prereq | 60 | StratiVerse Port · 138 files / 23,693 insertions |
| M1-A1-D1 | Aspirant 1 | 61 | SCS-Bridge Island Foundation (4 core files) |
| M1-A1-D2 | Aspirant 1 | 62 | CommandLine UI Mirror + Initial Connection (CESA gate) |
| M1-A1-D3 | Aspirant 1 | 63 | Suite8 Concept + Navigation Toolbar + D2 Latent Fix |
| M1-A1-D4 | Aspirant 1 | 64 | Sample Designations + Markdown · **MCSP first coinage** |
| M1-A1-D5 | Aspirant 1 | 65 | Area Selection / Screenshot Capture |
| M1-A1-D6 | Aspirant 1 | 66 | Pewter Turn Over Button · **Aspirant 1 CLOSES** |
| M1-A2-D1 | Aspirant 2 | 67 | Cadmium Foundation · 5 FSDCS skeletons |
| M1-A2-D2 | Aspirant 2 | 68 | Spawned Instance · **HRDVS first coinage** |
| M1-A2-D3 | Aspirant 2 | 69 | Form Binding (smallest sub-Diamond · single-file edit) |
| M1-A2-D4 | Aspirant 2 | 70 | MCP Back-Connection · SIMULATED |
| M1-A2-D5 | Aspirant 2 | 71 | Vermillion Skill System · MOST COMPLEX |
| M1-A2-D6 | Aspirant 2 | 72 | Personalized HomePage · **Aspirant 2 CLOSES** · FSDCSFC |
| M1-Final | Final | 73 | Hard Turn Over server mechanism · **MACRO 1 CLOSES** |

### Aspirant Pearl Chains

**Aspirant 1** (SCS-Bridge Concept · Cycles 61-66): Foundation → Live · UI Mirror → Suite8 + Toolbar → Markdown (scope-pivot) → Area Selection → Turn Over Button. Result: scsBridge concept with 18 files / 7 client qualities / 1 principle / 3 Vue components.

**Aspirant 2** (Cadmium Researcher Page Island · Cycles 67-72): Foundation (5 FSDCS skeletons) → Simulated Spawn → Form Binding → Simulated MCP → Vermillion Skill Registry → Personalized HomePage. Result: cadmium concept with 13 files / 9 client qualities composing Suite8Page.

### Key Artifact Paths

- Macro WGB: `Cascades/Working/DIAMOND-TIER-MACRO-1.md`
- Definition: `Cascades/Working/MACRO-DIAMOND-1-DEFINITION.md`
- Sample sub-Diamond WGBs: `Cascades/Working/DIAMOND-TIER-M1-A1-D1.md` · `DIAMOND-TIER-M1-FINAL.md`
- Onyx accumulation: `Cascades/Working/ONYX-TIER-8.md` (Cycles 59-63) · `ONYX-TIER-9.md` (Cycles 64-73)

---

## 3 · /loop Autonomous Engagement

Macro Diamond 1 ran via **Stratimuxian Automata** (Suite 8 instance) bound to Claude Code's `/loop` mechanism. Each sub-Diamond was one autonomous /loop iteration.

### Binding

Single invocation drives the entire automaton:

```
/loop Read Cascades/Cascade.json. Execute Stratimuxian Automata per Cascades/8_SUITES/Stratimuxian Automata/Skill.md
```

The slash command `/cascade:loop` emits this prompt.

### SA-S1 through SA-S4 Lifecycle

Each /loop iteration runs the 4-skill cycle:

| Skill | Function |
|---|---|
| **SA-S1 Obsidian Wake** | Read Cascade.json → activeDiamond · activeOnyx · cyclePosition · count Diamond PENDING · evaluate continuation predicate |
| **SA-S2 Gate Advance** | Execute current gate's cognitive function · Foundation Suites dispatch (R2+R3+R6) inside Gate 2-3-6 arcs |
| **SA-S3 Delay Select** | Cache-aware ScheduleWakeup delay selection |
| **SA-S4 Lifecycle Close** | Write `automata.state` to Cascade.json · decide continue/halt · if halt, omit ScheduleWakeup |

### Continuation Predicate

The Diamond PENDING task list IS the automaton's fuel. A sub-Diamond closes only when its task closes in the WGB. The Macro Diamond WGB held ~15 tasks (one per sub-Diamond). Each iteration consumed exactly one PENDING task. When `pendingCount` reached 0 at M1-Final close, SA-S4 wrote `automata.state: "halted"` and the loop terminated cleanly.

### Cache-Aware Delay Discipline

Never use 300s (worst of both: pays cache miss without amortizing). Canonical delays:

| Context | Delay | Reason |
|---|---|---|
| Active build (Gate 5) | 270s | Stay in 5-min prompt cache |
| Post-Rose · next cycle intake | 270s | Quick Obsidian Absorb re-entry |
| TESTING state | 1200s | Waiting for user Lambda · no rush |
| Idle (no PENDING signal) | 1800s | Amortize cache miss over long wait |

In practice across Macro 1, sub-Diamonds used 1500s between iterations — autonomous Concluder-gated closure (typecheck PASS + Onyx append) bypassed the TESTING-state user-Lambda wait.

### Autonomous vs Manual Mode Discrimination

**C9 Automata** (CLAUDE.md §Section 5) governs MANUAL routing — user supplies continuation signal. **Stratimuxian Automata** governs AUTONOMOUS routing — ScheduleWakeup IS the continuation signal.

The SM-Conclude Concluder-Menu (Conference Mode fire predicate) explicitly does NOT fire during Automata Mode iterations. `E-Conclude-Loop-Block` is the documented failure mode where an AskUserQuestion blocks autonomous progression. Macro 1 ran cleanly in Automata Mode throughout because sub-Diamond closes were Concluder-gated, not Conference-gated.

---

## 4 · MCSP Pattern · Mid-Cycle Scope Pivot

**First Coinage**: Cycle 64 (M1-A1-D4)

**Definition**: MCSP is the atomic-shippable discipline for /loop cascade throughput. When a sub-Diamond's planned scope is too large to ship atomically in one /loop iteration, the scope pivots mid-cycle to a reduced, typecheck-verifiable subset. The original Foundation Suite returns + any Tier-fork outputs remain as authoritative substrate for the NEXT sub-Diamond.

### Macro 1 Instance (Cycle 64 / M1-A1-D4)

Original D4 scope: file-loading Diametric Inductions (4 client + 4 huirth Real qualities + new server-side concept + loader principle + markdown library).

Mid-cycle pivot: ship ONLY sample designation registration + `marked` library + markdown rendering.

The full file-loading architecture (from R1+R3+R6 returns) remained as substrate for D4.5 / A2-D1. Onyx records the pivot explicitly with scope "DEFERRED" under Lossy.

### Discipline Rules

- The /loop atomic-shippable rule: each iteration must produce a typecheck-clean (`0 net-new errors`) Concluder-verifiable result
- When original scope fails this test, pivot scope DOWN until it passes
- Never discard Foundation Suite returns — they are authoritative substrate for the next iteration
- Record the scope pivot explicitly in the sub-Diamond's WGB and Onyx Lossy
- The pivoted-away scope names itself via a `.5` sub-Diamond slot (D4 pivots → D4.5 is the optional refinement Diamond)

**MCSP proven across 14 consecutive cycles (Cycles 60-73)** — every sub-Diamond in Macro 1 shipped atomically clean.

---

## 5 · HRDVS Pattern Family · Highest-Risk-Deferred-via-Simulation

**Definition**: HRDVS ships a **Simulated** state machine for the highest-risk integration point (real OS/network/filesystem calls) to preserve atomic-shippable discipline. The simulation uses Vue handler setTimeout or equivalent to produce visible lifecycle state transitions WITHOUT the real external call. A **Single-Quality-Replacement-Gate** then defers the real implementation to a `.5` refinement sub-Diamond where swapping ONE quality converts the simulation to real operation with **zero contract delta**.

### Macro 1's 5-Member Swap-Gate Family

| Gate | Abbrev | Deferred Mechanism | Target |
|---|---|---|---|
| **RSSQG** | Real-Spawn-Single-Quality-Gate | Node child_process spawn | D2.5 |
| **RMCQSG** | Real-MCP-Connection-Quality-Swap-Gate | WebSocket /mcp handshake | D4.5 |
| **AIPED** | A-I-Plan-Execution-Deferred | Stage planner A-I execution | D5.5 |
| **RHPPD** | Real-Homepage-Promotion-Path-Deferred | Vue Router beforeEach guard | M1-Refinement |
| **WSBBCCD** | WebSocket-Broadcast-Before-Connection-Close-Client-Clear | Pattern G full broadcast + IndexedDB clear + ClientState regeneration | Macro 2 |

### Why 5 Members? The Family is a Diameter Family

Each member defers one real integration concern. The five form a coherent family: OS (spawn) → Network (MCP) → Execution (A-I plan) → Routing (HomePage) → State (Pattern G full). They compose sequentially — RSSQG unblocks RMCQSG; AIPED unblocks real Skill execution; WSBBCCD closes the full Pattern G spec.

### Recognition Signature for Future Macros

A sub-Diamond proposes an integration with OS/network/filesystem that would take 2+ /loop iterations to implement safely → apply HRDVS:
- Name the simulation explicitly with the `*Simulated*` Pearl qualifier
- Name the swap-gate pattern with an `*SQG` or `*Deferred` suffix
- Record both in the sub-Diamond's Gainy section and in the Macro WGB's deferred-gates table

---

## 6 · Post-Macro Summation Pattern

After the Macro WGB's pendingCount reaches 0 (Macro mechanically complete), the main thread issues a **Foundation Summation Agent** dispatch at Tier-1 with explicit ground-then-return mandate: read accumulated Onyx + cascade trajectory, extract the empirical method, produce grounded substrate for documentation.

### Pattern Structure

1. **Macro Closure Trigger**: Macro WGB pendingCount reaches 0 · SA-S4 writes `automata.state: "halted"` · /loop terminates cleanly
2. **Summation Agent Dispatch**: r0-obsidian dispatched at Tier 1 with explicit read-manifest (Onyx Tiers · Macro Diamond WGBs · Foundation Suite outputs)
3. **Output Target**: `Cascades/Working/FOUNDATION-SUMMATION-AGENT-OUTPUT.md` — NOT the final Reference Design Guides themselves
4. **Main Thread Action**: After reading the substrate, the main thread authors the formal guides in `Cascades/Documentation/Cascades/`

### Structural Difference from Tier-Transition Summation

| Aspect | Tier-Transition Summation | Post-Macro Summation |
|---|---|---|
| Mode | Detached Co-Agent · Context-Fork · parallel | Foreground Tier-1 dispatch · sequential |
| Output | New Onyx tier file (ONYX-TIER-N.md) | Grounding substrate for documentation |
| Trigger | Onyx >400 lines OR >4 cycles in tier | Macro WGB pendingCount = 0 |
| Cascade.json | Pointer update deferred to next Fuchsia close | No Cascade.json change |

### Diameter to Onyx Tier Progression

Post-Macro Summation is the appropriate moment to evaluate whether a **Tier-N+1 fork** is warranted. Macro 1 closed with ONYX-TIER-9 at ~750+ lines (well past the >400-line threshold). The Tier-10 fork (r0-origin dispatch) co-runs with or precedes the post-Macro documentation cycle.

**This guide itself is the canonical example**: Macro Diamond 1 closed at Cycle 73, the main thread dispatched a Foundation Summation Agent to ground both this guide and `FOUNDATION-SUITES-GUIDE.md`, and concurrently dispatched r0-origin for Tier-10 fork.

---

## 7 · Onyx Tier Progression in Macro Context

### Threshold Criteria

| Criterion | Threshold | Macro 1 Observation |
|---|---|---|
| Line count | > 400 lines | Tier-7 fired at 449 (Cycle 58) · Tier-8 at ~435 (Cycle 63) · Tier-9 at ~750 (Cycle 73) |
| Cycle count | > 4 cycles | Tier-7 carried 4 cycles |
| Read complexity | > 3 | 3+ complex clinical summations require context management |
| Fuchsia count | > 6 | Rose count in active tier exceeds 6 entries |

### Timing Discipline

Tier forks happen at the sub-Diamond level, NOT between sub-Diamonds. The r0-origin (or r0-obsidian) agent dispatches as a **detached Co-Agent** (`Context-Fork + background: true`) DURING a sub-Diamond's engagement — concurrent with main thread's implementation work. The Co-Agent writes the new Onyx tier; Cascade.json `activeOnyx` pointer updates at the NEXT sub-Diamond's Fuchsia close.

### Multi-Tier Preservation Invariant

Prior tiers are NEVER deleted. Tier-1 through Tier-9 are all preserved at their canonical paths. Each opens with a Pearl Clinical Summation referencing the prior tier. The Diamond Menu and Onyx Menu enumerate all tiers without loading them — "falling-out-of-scope reinforcement" per C5 RI.

### Practical Implication for Macro-Scale Work

A 15-sub-Diamond Macro spanning 15 cycles will almost certainly exhaust 1-2 Onyx tiers. Plan for at least one Tier fork per 4-5 sub-Diamonds. Each fork is a Detached Co-Agent that costs ~3 minutes wall-clock and does not block the main thread.

---

## 8 · Composability Summary

A Macro Diamond is a Higher-Order Compositional Unit. Its sub-units (Aspirants · Prereqs · Final) compose bidirectionally:

```
Macro Diamond
  ├── Prereqs (shared infrastructure)
  │    └── M1-P1 · M1-P2 (each its own atomic cycle)
  ├── Aspirants (independently deliverable surfaces)
  │    ├── Aspirant 1 (6 sub-Diamonds · own Pearl Chain · own Closure Note)
  │    └── Aspirant 2 (6 sub-Diamonds · own Pearl Chain · own Closure Note)
  └── Final Closer (deferred mechanisms · swap-gate stubs)
       └── M1-Final (Muxistration Proof of the Macro)
```

The Macro composes via **/loop autonomous engagement** (Stratimuxian Automata SA-S1→S4 per cycle) with **Foundation Suites at-once Tier-1 parallel grounding** per sub-Diamond and **MCSP discipline** preserving atomic-shippable throughput throughout.

---

## Related References

- `FOUNDATION-SUITES-GUIDE.md` — companion guide for the parallel Tier-1 dispatch pattern
- `PEARL-FORMALIZATION.md` — Pearl-compressed Set boundary discipline
- `VERMILLION-PLANNED-QUERY.md` — A-I pattern lineage (ActionStrategy → Planned Query → Vermillion)
- `ONYX-FORWARD-PASS.md` — Onyx 8-Band tier-transition structure
- `Cascades/8_SUITES/Stratimuxian Automata/Instance.md` + `Skill.md` — the autonomous-engagement Suite 8
- `Cascades/Working/MACRO-DIAMOND-1-DEFINITION.md` — Macro 1's user-resolved definition
- `Cascades/Working/DIAMOND-TIER-MACRO-1.md` — Macro 1's composition WGB

---

*Empirical Foundation*: Macro Diamond 1 · Cycles 59-73 · 15 sub-Diamonds · 14 atomic /loop iterations · 0 net-new typecheck errors throughout · CD-5 Convergence Diameter streak preserved at 62 consecutive PASS · Stratimuxian Automata + Pewter Tessera maintained in scope throughout.
