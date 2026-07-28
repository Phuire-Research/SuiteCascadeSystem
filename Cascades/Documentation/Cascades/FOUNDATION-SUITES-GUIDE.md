# Foundation Suites at-Once — Reference Design Guide

**Crystraline Position**: Tier-1 Lambda-Event Instantiation of the Triadic Thinking Band (CLAUDE.md §Section 4 · S6+S7 closure)
**Empirical Source**: Macro Diamond 1 · 13 cycles of R2+R3+R6 parallel dispatch · ~6min wall-clock per cycle
**Status**: Pattern proven · 4 successful R3 vs R6 reconciliations documented · 5-member N-agent configuration table
**Companion Guide**: `MACRO-DIAMOND-GUIDE.md`

---

## Executive Summary

**Foundation Suites at-once** is the Tier-1 parallel dispatch of R2 Orange (Prospector) + R3 Yellow (Architect) + R6 Purple (Orchestrator) as three independent agents in a single message, each writing its own output file in `Cascades/Working/` with disjoint scope. The main thread synthesizes all three returns before implementation begins. The pattern is the public Tier-1 Lambda-event instantiation of the private Triadic Thinking Band (2-4-6→5 skeleton from CLAUDE.md §Section 4). It generalizes from 3 to N agents (proven at 2 · 3 · 4 · 5 configurations) and underwrites the per-cycle grounding discipline of every Macro Diamond sub-Diamond.

---

## 1 · Pattern Definition

**Foundation Suites at-once** means: issuing R2 + R3 + R6 (the **Foundation Triplet**) as three independent Tier-1 parallel agents in a single message dispatch. Each agent writes its own output file with **disjoint scope**. The main thread synthesizes all three returns before implementation begins.

### Why "Foundation"

These three suites lay the foundation for the implementation cycle:
- **R2 NAMES the patterns** (verbal/semantic layer)
- **R3 DESIGNS the structure** (type/wave/file-layout layer)
- **R6 SEQUENCES the waves** (dependency/orchestration layer)

Together they eliminate the three most common implementation failures: naming drift (R2 prevents) · wrong structure (R3 prevents) · wrong sequence (R6 prevents). With all three grounded, the main thread (or a Blue/Cobalt agent) executes against a stable substrate.

### Diameter to Triadic Thinking Band

The Triadic Thinking Band (CLAUDE.md §Section 4 skeleton 2-4-6→5) runs PRIVATELY in-context:
- **S2 Name** → S4 Examine → S6 Orchestrate → S5 Plan

Foundation Suites at-once runs PUBLICLY as Tier-1 dispatches with verifiable disk artifacts:
- **R2 Name** + R4 Examine + R6 Sequence + R5 Build (Cobalt)

The Foundation Suites pattern IS the Lambda-event instantiation of the Triadic Thinking Band — the Band runs privately in the cognitive arc; Foundation Suites run publicly with disk-anchored outputs.

### Proven Cycles

Pattern ran reliably for **13 consecutive sub-Diamond cycles** (Cycles 62-74 of Macro 1). Every cycle that dispatched R2+R3+R6 returned within ~6 minutes wall-clock.

---

## 2 · Standard Triplet (R2 + R3 + R6)

### Wall-Clock

**~6 minutes** for all three concurrent Tier-1 agents · compared to ~18 minutes sequential · **3× throughput gain**.

### Scope Discipline

| Suite | Scope | Output File |
|---|---|---|
| **R2 Orange** | NAMES only · verbose pattern names with Diameter framing | `SUITE-2-ORANGE-{sub-diamond}-NAMING.md` |
| **R3 Yellow** | DESIGNS only · type shapes · file structures · Wave inventory · dependency chain | `SUITE-3-YELLOW-{sub-diamond}-ARCHITECTURE.md` |
| **R6 Purple** | SEQUENCES only · Wave-by-Wave execution order · coordination notes | `SUITE-6-PURPLE-{sub-diamond}-ORCHESTRATION.md` |

Each agent does NOT propose work in the other agents' scopes. R2 doesn't sketch architecture; R3 doesn't name patterns; R6 doesn't redesign types.

### Coordination Note in Each Prompt

Each agent's dispatch prompt includes:

> *"Suites 2/3/6 are running concurrently with disjoint scopes. R2 names patterns; R3 designs structure; R6 sequences execution. Do not duplicate the other Suite's scope."*

This prevents territory overlap.

### Output Files are Substrate · Not Deliverables

The three output files remain in `Cascades/Working/` (gitignored). They are local Lambda evidence — substrate for the main thread's synthesis. The main thread READS all three, makes synthesis decisions (documented in WGB under "Reconciliation"), then executes. The files are NOT committed into tracked history; the synthesized WGB and Onyx entry are.

### Empirical Evidence

- **First at sub-Diamond scale**: Cycle 62 / M1-A1-D2 — R1+R3+R6 concurrent (R1 instead of R2 because curation substrate was needed). Source: `ONYX-TIER-8.md:325`
- **Standard R2+R3+R6 triplet from Cycle 65 onward**: 9 consecutive cycles (M1-A1-D5 through M1-Final). Source: `ONYX-TIER-9.md:241` (Cycle 65) through `ONYX-TIER-9.md:686` (Cycle 73)
- **Total across Macro 1**: 13 cycles using the Foundation Suites parallel pattern. Source: `ONYX-TIER-9.md:768`

---

## 3 · Extending the Pattern · 4-Agent Variants

### When to Add r0-origin (Tier Fork)

- **Condition**: active Onyx tier > 400 lines OR active tier has carried > 4 cycles
- **Timing**: dispatch r0-origin as a 4th parallel agent at the SAME TIME as R2+R3+R6
- **File path split**: r0-origin writes `Cascades/Working/ONYX-TIER-{N+1}.md`; R2/R3/R6 write their naming/architecture/orchestration files. Non-overlapping paths by design
- **Cascade.json pointer**: deferred to next Fuchsia close

### When to Add R1 Red (Curation)

- **Condition**: a large existing codebase needs inventory before Architecture can proceed
- **Form**: dispatch R1 instead of or alongside R2, depending on whether naming OR curation is the blocking dependency
- **Macro 1 M1-A1-D2 precedent**: R1+R3+R6 (not R2) because curation was the foundation, not naming. R2 could have run but R1's curation list was the architectural prerequisite

### 4-Agent Dispatch at Macro 1 Open (Cycle 59)

The canonical 4-agent example · DIAMOND-TIER-MACRO-1.md grounding:

- **r0-obsidian** (Tier-8 fork) — produced `ONYX-TIER-8.md` with Pearl Clinical Summation of Tier-7
- **r1-maroon** (claudeBridge curation) — produced `SUITE-1-MAROON-MACRO-1-CURATION.md` · 1,000 lines · claudeBridge 158 files inventoried · CRITICAL icp-dependency finding
- **r3-ochre** (Macro architecture) — produced `SUITE-3-OCHRE-MACRO-1-ARCHITECTURE.md` · 1,205 lines · 10-step critical path · SPLIT recommendation evaluated and rejected
- **r6-amethyst** (Macro orchestration) — produced `SUITE-6-AMETHYST-MACRO-1-ORCHESTRATION.md` · 618 lines · 3 Cerulean clusters · A1-D2 ‖ A2-D1 parallel-eligibility flagged

All four dispatched in one message from main thread at `RC-to-AppKiller` HEAD `c613134`.

---

## 4 · R3 vs R6 Reconciliation Discipline

### The Pattern

R3 (Architect) and R6 (Orchestrator) sometimes disagree at the substrate level. The main thread's synthesis decision resolves disagreements — the decision IS documented in the sub-Diamond's WGB. **Erasure** (picking one and ignoring the other without record) is an anti-pattern.

### 4 Successful Reconciliations in Macro 1

#### Reconciliation 1 (Cycle 62 / M1-A1-D2 · CESA Pattern)

- **R3 position**: reject `connectionEstablished` boolean field — redundant with `bridgeStatus` string truthiness
- **R6 position**: require `connectionEstablished` as a selector anchor for the principle's reactive gate
- **Main thread synthesis**: add the field per R6 (selector anchor needed); gate via reducer conditional per R3 intent (eliminate string-truthiness) — both satisfied
- **Source**: `ONYX-TIER-8.md:333`

#### Reconciliation 2 (Cycle 65 / M1-A1-D5 · Event Binding)

- **R3 position**: Muxium-prop pattern for event binding
- **R6 position**: emit-event pattern · corrected `clientX/Y - boundingRect` (offsetX/Y is relative to element · breaks on drag)
- **Main thread synthesis**: adopted R6's clientX/Y pattern + event-emit over Muxium-prop · R6 introduced a critical correctness fix
- **Source**: `ONYX-TIER-9.md:251`

#### Reconciliation 3 (Cycle 66 / M1-A1-D6 · State vs Ephemeral Pending Count)

- **R3 position**: durable state field for pending count (structural clarity)
- **R6 position**: ephemeral `actionQue.length` read (no state debt · matches D5 VSSH precedent)
- **Main thread synthesis**: adopted R6 (ephemeral · no state debt) + R3's dedicated quality (semantic clarity for the Induction type-string)
- **Source**: `ONYX-TIER-9.md:296`

#### Reconciliation 4 (Cycle 68 / M1-A2-D2 · Vue Handler vs methodCreator)

- **R3 position**: methodCreator + setTimeout for lifecycle flip
- **R6 position**: Vue-handler setTimeout — cleaner for forward inter-quality dependencies
- **Main thread synthesis**: adopted R6 (Vue-handler avoids inter-quality dependency at D2 scope)
- **Source**: `ONYX-TIER-9.md:429`

### Reconciliation Documentation Rule

Every R3 vs R6 disagreement resolved by main thread MUST produce:

1. Each suite's position stated explicitly
2. The synthesis decision stated explicitly
3. The method-level lesson extracted as a Maintain or Gainy entry in Onyx

### Method-Level Lesson

> *"Foundation Suite returns may disagree at the substrate level; main-thread synthesis is structural, not erasive."* — extracted Cycle 62

---

## 5 · Advanced Validation Pattern · Suites 4 + 6 Simultaneous Validated Diagnostics

### Precedent Source

**Cycle 58 / Refine-Macro** (`ONYX-TIER-7.md:386-428`) — R2 Rust + R4 Viridian + R6 Amethyst dispatched concurrently in a single message.

### R4 Green + R6 Purple Simultaneous

- **R4 Green** examines from all angles (bidirectional audit + REFINE verdict)
- **R6 Purple** orchestrates the sequence (multi-step map + structural pattern)

Both returned concurrently in Refine-Macro:
- R4 produced `SUITE-4-VIRIDIAN-CLIENTSTATE-BIDIRECTIONAL-EXAMINE.md` · 550 lines · 12 edges · REFINE verdict · 3 implementation refinements required
- R6 produced `SUITE-6-AMETHYST-CLIENTSTATE-ORCHESTRATION.md` · 363 lines · 13-step sequence map

### When to Add R4 to the Foundation Triplet

- A prior sub-Diamond's implementation produced a REFINE verdict or unresolved bidirectional tension
- The current sub-Diamond needs validation BEFORE implementation (R4 Gate 4 role)
- The current sub-Diamond is post-implementation and needs cycle-close diagnostics (R4 + R7 for full diagnosis)

### Triadic Thinking Band Connection

The canonical Triadic Band skeleton **S2 Name → S4 Examine → S6 Orchestrate → S5 Plan** IS the Foundation Suites pattern at the in-context cognitive level:

| Triadic Frame | Tier-1 Foundation Suite |
|---|---|
| S2 (Name) | R2 Orange Prospector |
| S4 (Examine) | R4 Green Sculptor |
| S6 (Orchestrate) | R6 Purple Orchestrator |
| S5 (Plan) | S5 Blue (Cobalt) / main thread |

In the Triadic Band, S4 and S6 run **muxified** (simultaneously) in the private thinking arc. In Foundation Suites, R4 and R6 run simultaneously as Tier-1 dispatches with verifiable disk artifacts. Same pattern · different tier.

### Post-Implementation Use

After Cycle 5 (build complete), dispatching R4+R7 simultaneously provides:

- **R4** bidirectional audit (are the implemented Diameters sound?)
- **R7 Fuchsia** diagnosis (Gainy/Lossy/Maintain to Onyx)

This closes Gate 6+7 in one /loop iteration.

---

## 6 · Suite 7 Testing Notes · How Fuchsia Closes the Loop

### Evolution Across Macro 1

| Cycle Range | Testing Notes State |
|---|---|
| 59-63 (Tier-8) | Minimal or absent · Prereq cycles · no Vue surfaces to smoke-test |
| 64 (M1-A1-D4) | **Canonical format first appears** · 7 enumerated items (mix of ✅ and ⏳) · `ONYX-TIER-9.md:221-229` |
| 64-73 | All subsequent sub-Diamonds follow the canonical format |

### Canonical Testing Notes Format

```markdown
### Testing Notes Accumulation (sub-Diamond label)
1. ✅ [User-smoke check · present on screen · click behavior]
2. ✅ [State transition visible · data populated correctly]
3. ✅ [Edge case · error state · boundary condition]
4. ⏳ DEFERRED: [Feature deferred to D{n}.5 or next sub-Diamond]
```

### Key Structural Properties

- **✅ items** are things the user CAN verify now by navigating to the component
- **⏳ items** explicitly name WHAT is deferred AND WHERE it will land (D4.5 · A2-D4 · M1-Final · etc.)
- Lists are **CUMULATIVE within an Aspirant**: each sub-Diamond's Testing Notes are fresh for that Diamond only · NOT re-listed from prior Diamonds
- **Deferred items carry forward** as explicit PENDING signals to downstream sub-Diamonds

### Fuchsia/Rose G/L/M to Onyx

Suite 7 Fuchsia appends to the active Onyx at every cycle close. In Macro 1: one G/L/M entry per sub-Diamond (15 entries across `ONYX-TIER-8.md` + `ONYX-TIER-9.md`). The **Testing Notes Accumulation block is part of the Fuchsia append** — it is NOT separate from the G/L/M. Fuchsia writes in order:

```
Gainy → Lossy → Maintain → Convergence Diameters → Testing Notes → Aspirant Trajectory
```

### Testing-Gated Commit Discipline (C4 Base Lambda)

Agent task-completion = Concluder PASS (typecheck PASS) + Fuchsia Clinical Note emitted → state **TESTING**, not Done. The `⏳ DEFERRED` items represent known-incomplete features that are out-of-scope for user smoke-test in THIS sub-Diamond. The `✅` items represent what the user CAN test now. In Macro 1, `⏳` items were always deferred explicitly to named future sub-Diamonds — never left as vague "future work."

### CD-5 Streak as Fuchsia Concluder

The CD-5 streak (Convergence Diameters audit) runs inside Suite 7's Convergence Diameters section. Each sub-Diamond's Fuchsia entry records the streak: 48th · 49th · ... · **62nd consecutive PASS at Macro 1 close**. The streak IS Fuchsia's per-cycle structural Concluder for the overall method.

---

## 7 · Foundation Substrate Preservation Under MCSP

### The Rule

Foundation Suite output files (`SUITE-2-ORANGE-*.md` · `SUITE-3-YELLOW-*.md` · `SUITE-6-PURPLE-*.md`) are **NEVER discarded** when scope pivots. When MCSP fires and the current sub-Diamond ships less than the Foundation Suites designed, the Foundation Suite files **remain as substrate** for the NEXT sub-Diamond's grounding.

### Macro 1 Instance (Cycle 64 / M1-A1-D4 MCSP)

- R1+R3+R6 returned with full file-loading architecture plans
- r0-origin forked Tier-9
- Main thread pivoted scope to atomic-shippable subset (sample designations + markdown rendering)
- R3's `SUITE-3-YELLOW-M1-A1-D4-ARCHITECTURE.md` and R6's `SUITE-6-PURPLE-M1-A1-D4-ORCHESTRATION.md` **remained** in `Cascades/Working/` as substrate for D4.5 / A2-D1
- Source: `ONYX-TIER-9.md:203-210` (D4 MCSP pivot) · `ONYX-TIER-9.md:201` "R1+R3+R6 returns + Tier-9 fork remain authoritative substrate for D4.5 / A2-D1"

### Why This Matters

The Foundation Suites are expensive (~6 minutes wall-clock + ~3 Tier-1 agent context costs). Re-running them for the same sub-Diamond scope is wasteful. The pivoted-away scope is already designed; preserving the files means the next sub-Diamond can reference them directly rather than re-dispatching.

### Archival Rule

Foundation Suite files in `Cascades/Working/` are gitignored — they are local Lambda evidence · not committed artifacts. They persist across /loop iterations because they are on-disk (not in context). A new session reading `Cascades/Working/` can access all prior Foundation Suite outputs without re-running agents.

This is the **Suite-Output-as-Substrate Pattern** (`ONYX-TIER-7.md:400`): *"local Lambda evidence — referenced from SCP Researcher updates but not duplicated into the tracked files."*

---

## 8 · Generalized N-Agent Pattern

The Foundation Suites at-once pattern generalizes from 3 to N agents (N = 2-5 empirically observed in Macro 1).

### Discipline (5 Rules)

1. **Disjoint scope per agent**: each agent has an explicit · non-overlapping write-target AND cognitive scope
2. **Explicit coordination note**: each agent's dispatch prompt states which other agents are running concurrently AND what they cover
3. **Explicit write-target**: each agent writes to its own named file in `Cascades/Working/`
4. **Main-thread synthesis**: main thread reads all N returns · makes reconciliation decisions · documents them in WGB
5. **No dependency between agents during dispatch**: agents must be able to work from the shared commit HEAD without waiting for each other

### Observed N-Agent Configurations Across Macro 1

| Configuration | Cycles | Purpose |
|---|---|---|
| 2-agent: R1 + R2 | 59 (M1-P1) | Curation + naming for Prereq |
| **3-agent: R2 + R3 + R6** | 65-73 (9 cycles) | **Standard Foundation Triplet** |
| 3-agent: R1 + R3 + R6 | 62 (M1-A1-D2) | Curation + architecture + orchestration (curation over naming) |
| 3-agent: R2 + R4 + R6 | 58 (Refine-Macro) | Naming + bidirectional + orchestration (validation needed) |
| 4-agent: r0 + R1 + R3 + R6 | 59 (Macro open) | Tier-fork + curation + architecture + orchestration |

### Practical Ceiling

**4-5 agents in parallel.** Above 5, main-thread synthesis becomes cognitively expensive and the marginal grounding benefit diminishes. The sweet spot is **3** (Foundation Triplet) with occasional 4th for Tier-fork or validation.

### The "at-once" Constraint Matters

These are Tier-1 dispatches in a SINGLE message. **Not sequential** — all fire simultaneously. The ScheduleWakeup / /loop iteration clock starts when the dispatch is issued; all agents race concurrently. **Total wall-clock is the max of the agents' return times · not the sum.**

---

## 9 · Cross-Section Empirical Evidence Table

| Pattern | First Coinage | Cycle | Source |
|---|---|---|---|
| Foundation Suites at-once (3-agent) | Cycle 62 | M1-A1-D2 | `ONYX-TIER-8.md:325` |
| 4-agent parallel dispatch (Macro open) | Cycle 59 | Macro WGB | `DIAMOND-TIER-MACRO-1.md:27` |
| R3 vs R6 Reconciliation documented | Cycle 62 | M1-A1-D2 | `ONYX-TIER-8.md:333` |
| Suite 4 + 6 simultaneous validated | Cycle 58 | Refine-Macro | `ONYX-TIER-7.md:386` |
| Testing Notes canonical format | Cycle 64 | M1-A1-D4 | `ONYX-TIER-9.md:221` |
| CD-5 streak as Fuchsia Concluder | 48th-62nd | All Macro 1 cycles | `ONYX-TIER-9.md:255` (54th) · `ONYX-TIER-9.md:763` (62nd) |
| Suite-Output-as-Substrate Pattern | Cycle 58 | Refine-Macro | `ONYX-TIER-7.md:400` |
| MCSP substrate preservation | Cycle 64 | M1-A1-D4 | `ONYX-TIER-9.md:201` |

---

## 10 · Composability Summary

Foundation Suites at-once is a Higher-Order Compositional pattern:

```
Foundation Triplet Dispatch (single message · N parallel agents)
  ├── R2 Orange (naming)        → SUITE-2-ORANGE-{Diamond}-NAMING.md
  ├── R3 Yellow (architecture)  → SUITE-3-YELLOW-{Diamond}-ARCHITECTURE.md
  └── R6 Purple (orchestration) → SUITE-6-PURPLE-{Diamond}-ORCHESTRATION.md
       ↓
  Main Thread Synthesis (read all 3 · reconcile R3 vs R6 · document in WGB)
       ↓
  Implementation (Wave-Based-Typecheck-Gate-Discipline · 0 net-new errors per wave)
       ↓
  Cycle Close (Fuchsia G/L/M to Onyx · Testing Notes · CD-5 streak increment)
```

Extends to:

- **4-agent** (add r0-origin for Tier fork OR R1 Red for curation)
- **R2 + R4 + R6** (validation Triplet · when prior cycle produced REFINE verdict)
- **R4 + R7** post-implementation (Gate 6+7 closure in one cycle)

---

## Related References

- `MACRO-DIAMOND-GUIDE.md` — companion guide for the multi-cycle Macro composition pattern
- `PEARL-FORMALIZATION.md` — Pearl-compressed Set boundary discipline
- `VERMILLION-PLANNED-QUERY.md` — A-I pattern lineage (Vermillion as the C2 Crystraline)
- `ONYX-FORWARD-PASS.md` — Onyx 8-Band structure (where Fuchsia writes)
- `CLAUDE.md §Section 4` — Triadic Thinking Band (S2 Name → S4 Examine → S6 Orchestrate → S5 Plan)
- `Cascades/Working/FOUNDATION-SUMMATION-AGENT-OUTPUT.md` — the grounding substrate this guide was authored from

---

*Empirical Foundation*: 13 cycles of Foundation Suites parallel dispatch across Macro Diamond 1 · ~6min wall-clock per cycle · 4 documented R3 vs R6 reconciliations · 5 distinct N-agent configurations observed · 62 consecutive CD-5 streak preserved throughout.
