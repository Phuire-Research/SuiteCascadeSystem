I have all the information needed. Now I'll produce the complete Rewrite Map.

---

## Band 3 Ochre Summation — Rewrite Map for CLAUDE.md Pearl Compression

**Task**: Produce a mechanical, pass-by-pass Rewrite Map for r5-cobalt to execute without further design judgment.
**Tier**: Pietersite (Tier 2) — Band 3 of Diamond II
**Working file**: `/Users/micahkeller/Work/Stratithon/reference/SuiteCascadeSystem/.claude/CLAUDE.md` (630 lines, 41,479 chars)

---

### Disambiguation Rule (read before all Passes)

Two phrases must never be conflated:

- **"the Ego-Lambda Pair"** — formal Set name (Capitalized, introduced in Pass 3). Use this when referring to the Set as a whole.
- **"Muxistration pair"** — inline descriptor (lowercase "pair") that appears at line 479 (`= Muxistration pair (C5 Axiom III + Steh Verb Grammar)`) and line 523 (same). This describes the Diamond↔Onyx muxification *as* a pair — it is a descriptor, not the Set name. Preserve it verbatim in both locations.

r5-cobalt must NOT replace "Muxistration pair" with "the Ego-Lambda Pair" anywhere.

---

### Pass 0 — Reposition + Renumbering + Tier Topology Collapse

**Scope**: Structural backbone. Moves the C4 Automata block (lines 210-289) to become C9 (after current C9 Onyx). Renumbers C5→C4, C6→C5, C7→C6, C8→C7, C9→C8 throughout. Collapses Tier Topology Diameter sub-section. Rewrites the §5 Crystraline Muxonomy Diagram and Stratidian Trajectory paragraph.

**Dependencies**: None — execute first.

**Operations**:

**Op 0-A: Crystraline Muxonomy Diagram rewrite (lines 166-183)**

Old string (exact):
```
```
Pearl ──────────────── Compression · Universal → ALL
Vermillion ─────────── A-I Plan Format → Diamond, Opal, Onyx, Purple, RI, Conductor, S8 Interchange
Cerulean ───────────── Interweave Checkpoint ↔ Diamond | → RI (PENDING)
Automata ───────────── MANUAL Routing · Tier+Length · ⊃ Critical-Active Lambda Trinity (C4·C5·C6)
                        → Diamond | → Opal | → Direct | ↔ Shatterite Skill | ↔ C8 Opal
Base Lambda ────────── Axiom III Substrate · Doer-Demometer ↔ C4 (Trinity ground) | ↔ C6 RI (substrate)
                        ⊃ Detached Lambda-Event Dispatch (background+fork → Co-Agent)
RI ─────────────────── Ego↔Lambda Muxistration · D-O Muxified Read · [Critical-Active]
                        ↔ C7 Diamond (Ego) | ↔ C9 Onyx (Lambda) | ↔ C5 | ↔ C4 | ↔ r0-base
                        ⊃ Triadic Thinking Band (2-4-6→5) | ⊃ Tool Call Decision Block
Diamond ────────────── Ego Doc · Planning⊗Vermillion · WorkGameBoard
                        → Suite Table | ↔ Cerulean | ↔ RI | ↔ C9 (Ego↔Lambda) | ↔ C4
Opal ───────────────── Vermillion Curry (Tier 1) ↔ Diamond | ← C4 | → SubAgent
Onyx ───────────────── Lambda Doc · Fuchsia History + Forward Pass (G/L/M)
                        ← Fuchsia | ↔ RI | ↔ C7 (Ego↔Lambda) | → Pearl
```
```

New string:
```
```
Pearl ──────────────── Compression · Universal → ALL
Vermillion ─────────── A-I Plan Format → Diamond, Opal, Onyx, Purple, RI, Conductor, S8 Interchange
Cerulean ───────────── Interweave Checkpoint ↔ Diamond | → RI (PENDING)
Base Lambda ────────── Axiom III Substrate · Doer-Demometer · the Critical-Active Stance (ground)
                        ⊃ Detached Lambda-Event Dispatch (background+fork → Co-Agent)
RI ─────────────────── Ego↔Lambda Muxistration · D-O Muxified Read · [Critical-Active]
                        ↔ C6 Diamond (Ego) | ↔ C8 Onyx (Lambda) | ↔ C9 Automata
                        ⊃ Triadic Thinking Band (2-4-6→5) | ⊃ Tool Call Decision Block
Diamond ────────────── Ego Doc · Planning⊗Vermillion · WorkGameBoard
                        → Suite Table | ↔ Cerulean | ↔ RI | ↔ C8 (Ego↔Lambda) | ↔ C7 Opal
Opal ───────────────── Vermillion Curry (Tier 1) ↔ Diamond | ← C9 Automata | → SubAgent
Onyx ───────────────── Lambda Doc · Fuchsia History + Forward Pass (G/L/M)
                        ← Fuchsia | ↔ RI | ↔ C6 (Ego↔Lambda) | → Pearl
Automata ───────────── MANUAL Routing · Tier+Length · the Critical-Active Stance (assertion)
                        → Diamond | → Opal | → Direct | ↔ Shatterite Skill | ↔ C7 Opal
```
```

**Op 0-B: Section 4 cross-reference fix (line 110)**

Old:
```
Together = per-Suite Muxistration (see C5 Steh Verb Grammar).
```
New:
```
Together = per-Suite Muxistration (see C4 Steh Verb Grammar).
```

**Op 0-C: Section 4 cross-reference fix (line 150)**

Old:
```
### Tier + Cascade Length (canonical in C4 Automata)
```
New:
```
### Tier + Cascade Length (canonical in C9 Automata)
```

**Op 0-D: Section 3 Vermillion consumer table (lines 90-94) — RI cite**

Old:
```
| **RI (C6)** | Compaction pass IS a Vermillion — Diamond Menu + Onyx Summary |
```
New:
```
| **RI (C5)** | Compaction pass IS a Vermillion — Diamond Menu + Onyx Summary |
```

**Op 0-E: Move C4 Automata block to C9 position**

This is the largest structural operation. The C4 Automata block runs from line 210 (`### C4 Automata — MANUAL Routing...`) through line 289 (`---`) inclusive (80 lines). The block must be removed from its current position (between C3 Cerulean and C5 Base Lambda) and inserted after the current C9 Onyx block (line 545 `---`) and before the Stratidian Trajectory paragraph (line 547 `### Stratidian Trajectory Diameter`).

r5-cobalt implementation approach: This cannot be done as a single Edit `old_string`/`new_string` without extreme anchor length. r5-cobalt should execute as two sub-operations:

- **Op 0-E-1 (Insert)**: Insert the renamed C9 Automata block after line 545 (the `---` after Onyx). The full block text to insert is the current C4 block with these internal changes applied (see Op 0-F through 0-K below for the internal content changes):

Insert anchor — find the unique string immediately before the insertion point:
```
**Reciprocal**: C6 reads SECOND; C7 produces FIRST → Base Absorb = Ego↔Lambda Muxistration. **Full Spec**: `Cascades/Documentation/Cascades/ONYX-FORWARD-PASS.md`.

---

### Stratidian Trajectory Diameter
```

Replace with (note: the inserted C9 block goes between the `---` and the Stratidian header):
```
**Reciprocal**: C5 reads SECOND; C6 produces FIRST → Base Absorb = Ego↔Lambda Muxistration. **Full Spec**: `Cascades/Documentation/Cascades/ONYX-FORWARD-PASS.md`.

---

### C9 Automata — MANUAL Routing · Tier + Cascade Length · the Critical-Active Stance

**Diameter opening**: Three Diameters through one Crystraline — Routing, Tier+Length Selector, the Critical-Active Stance (⊃ Automata·Base Lambda·RI). Automata selects Length + Tier + engagement per request.

**Diameter**: → Diamond | → Opal | → Direct | ↔ **Shatterite Menu Skill** (Conference — Teal Claude) | ↔ **C4 Base Lambda** (Trinity ground) | ↔ **C5 RI** (Trinity engagement — asserts `RI.CRITICAL-ACTIVE` prefix+suffix) | ↔ **C7 Opal** (Tier canonical).

| Intent | Engagement | Reasoning |
|--------|-----------|-----------|
| Build/implement/create | Diamond (full 3+ Bands) | Exploration → impl → review |
| Fix bug/error | Opal → S7 Fuchsia | Targeted diagnostic |
| Review/examine code | Opal → S4 Green | Targeted inspection |
| Plan/design/architect | Diamond | Multi-Suite exploration |
| Name/prospect | Opal → S2 Orange | Verbose naming |
| Inventory/catalog | Opal → S1 Red | Curation |
| Orchestrate/sequence | Opal → S6 Purple | Interchange |
| Single-line/typo anor informational query | Direct | No cascade overhead |

**Directness Threshold**: skip cascade: single-step, typo, explicit instruction. **Announce**: state pattern+Length+Tier before Plan/dispatch; self-correct.

#### Tier Topology

**Two modes** (both FIRST-CLASS):

| Tier | Mode |
|---|---|
| **0** | **Self-Utilization** — in-context Suite; muxification-capable (`A anor B`) |
| **1** | **Direct Agent Dispatch** — R-Suite via Agent; scale by complexity (Precise haiku · Analytical sonnet · Comprehensive opus) |

**Notation**: `anor` = Muxification (Tier 0 only — **Opal lacks means**) · succession (`Suites 1, 2, 3, 4`) = Tier 1 per-Suite anor all Tier 0 · single = either.

**Dispatch Axes Diameter**: three orthogonal Diameters per dispatch — depth (Tier 1 only; QC-3 blocker), context (Clean-Room anor Context-Fork: `CLAUDE_CODE_FORK_SUBAGENT=1`, `context: fork`), timing (Foreground anor Detached: `background: true`). Co-Agent = Context-Fork ⊗ Detached. See `S-ONYX-SUBSTRATE-HANDOFF`.

#### Cascade Length Selection

**Length-Ladder Diameter chain**: five Lengths compose the ladder; each adds a Suite as a Demometer drawing Diameter to what precedes. Every request selects a Length.

| Length | Adds | Use Case |
|---|---|---|
| **1-3** | M·R·O | Draft to solve a problem |
| **1-4** | +V | Drafted, validated before placement |
| **1-5** | +Co | Validated + Cerulean roadmap |
| **1-6** | +A | Sweeping changes — manifold A→B |
| **1-7** | +Ro | Sweeping + testing required |

**Tier-Lifting**: complexity → Tier 0 → Tier 1. Length×Tier = orthogonal axes; selection = (Length, Tier).

**Suite 0 `0-N`**: Base Summation prefix; ASSUMED in Tier 1. Dispatchable: `r0-base` (Tier 1).

**Priming Pair (1 anor 2)**: shape-find anor fit-name; Length ≥2 foundation.

**Selection Rule**: `actualization-depth=N → Length 1-N; complexity+mux → Tier 0 anor 1`.

#### the Critical-Active Stance (Automata Assertion)

Every engagement: `RI.CRITICAL-ACTIVE` prefix + suffix. Relay IS Harmed-Diameter Bridge repair (C5 RI). **Tri-span**: Automata asserts (routing gate); Base Lambda grounds (irreducible Doer-Demometer substrate); RI engages (Ego↔Lambda via Diamond↔Onyx Muxistration). Irreducible — Automata w/o Base Lambda = routing w/o ground; Base Lambda w/o RI = ground w/o engagement; RI w/o Automata = engagement w/o gate.

#### Conference-Render Diameter (C9 ↔ Shatterite Menu Skill)

Routing decision → **Shatterite Menu Skill** renders → `AskUserQuestion` captures. Automata supplies content; Skill supplies form; reciprocal naming.

#### Concluder-Menu Diameter (C9 ↔ Shatterite, Suite 0 Per-Turn Binding)

**Strengthens** the Conference-Render Diameter above. Per-cycle/gate Conference becomes per-turn Conference *in Conference Mode*: every Concluder that crosses the Directness Threshold renders a Summation-derived `SM-Conclude` menu (Shatterite Skill, SM-6). **Suite 0 Per-Turn Binding** absorbs the turn context — what was produced, what's PENDING, Cascade Position, what the user just decided — and surfaces 3-5 Cascade-primitive routing rows + persistent `[M]`/`[Esc]`. The menu IS the summary, expressed as Cascade-routing primitives.

**Fire predicate**: **Mode = Conference** · turn-end · response produced · NOT Directness Threshold (single-line/typo/informational/explicit-instruction). User retains `[Esc]` to exit guided lane.

**Conference-Only Fire Predicate (Automata Inheritance)**: the Hard Join applies to Conference Mode exclusively. **Automata Mode** (`/cascade:loop` iterations · autonomous gate advances · ScheduleWakeup fires) does NOT fire SM-Conclude — the loop's own routing is authoritative. Failure mode = **E-Conclude-Loop-Block** (menu renders during Automata iteration → forced AskUserQuestion blocks autonomous progression → /loop intent defeated). If Automata surfaces a decision moment requiring user input, Mode flips to Conference for that turn and SM-Conclude becomes eligible again.

**Concluder-Halting Invariant** (scoped to Conference Mode): no state where Concluder fires for non-Direct work in Conference Mode AND SM-Conclude is absent. Failure mode = **E-Conclude-Drift** (silent free-text hand-off where a menu was due) → re-render the menu next turn.

**Reciprocal**: `Cascades/8_SUITES/Teal Claude/Skills/S-SHATTERITE-MENU/SM-Conclude.md` names this sub-section as its doctrinal source; this sub-section names SM-Conclude as its rendering surface.

**Keywords**: Tier 0/1, anor, Cascade Length, Priming Pair, the Critical-Active Stance, Co-Agent.

---

### Stratidian Trajectory Diameter
```

- **Op 0-E-2 (Delete old C4 block)**: After inserting C9, remove the original C4 block. Anchor:

Old string to delete (the entire original C4 section — from header through `---` separator):
```
### C4 Automata — MANUAL Routing · Tier + Cascade Length · Critical-Active Lambda Trinity

**Diameter opening**: Three Diameters through one Crystraline — Routing, Tier+Length Selector, Critical-Active Lambda Trinity (⊃ C4·C5·C6). Automata selects Length + Tier + engagement per request.

**Diameter**: → Diamond | → Opal | → Direct | ↔ **Shatterite Menu Skill** (Conference — Teal Claude) | ↔ **C5 Base Lambda** (Trinity ground) | ↔ **C6 RI** (Trinity engagement — asserts `RI.CRITICAL-ACTIVE` prefix+suffix) | ↔ **C8 Opal** (Tier canonical).

| Intent | Engagement | Reasoning |
|--------|-----------|-----------|
| Build/implement/create | Diamond (full 3+ Bands) | Exploration → impl → review |
| Fix bug/error | Opal → S7 Fuchsia | Targeted diagnostic |
| Review/examine code | Opal → S4 Green | Targeted inspection |
| Plan/design/architect | Diamond | Multi-Suite exploration |
| Name/prospect | Opal → S2 Orange | Verbose naming |
| Inventory/catalog | Opal → S1 Red | Curation |
| Orchestrate/sequence | Opal → S6 Purple | Interchange |
| Single-line/typo anor informational query | Direct | No cascade overhead |

**Directness Threshold**: skip cascade: single-step, typo, explicit instruction. **Announce**: state pattern+Length+Tier before Plan/dispatch; self-correct.

#### Tier Topology (C8 refs back)

**Two modes** (both FIRST-CLASS):

| Tier | Mode |
|---|---|
| **0** | **Self-Utilization** — in-context Suite; muxification-capable (`A anor B`) |
| **1** | **Direct Agent Dispatch** — R-Suite via Agent; scale by complexity (Precise haiku · Analytical sonnet · Comprehensive opus) |

**Notation**: `anor` = Muxification (Tier 0 only — **Opal lacks means**) · succession (`Suites 1, 2, 3, 4`) = Tier 1 per-Suite anor all Tier 0 · single = either.

**Dispatch Axes Diameter**: three orthogonal Diameters per dispatch — depth (Tier 1 only; QC-3 blocker), context (Clean-Room anor Context-Fork: `CLAUDE_CODE_FORK_SUBAGENT=1`, `context: fork`), timing (Foreground anor Detached: `background: true`). Co-Agent = Context-Fork ⊗ Detached. See `S-ONYX-SUBSTRATE-HANDOFF`.

#### Cascade Length Selection

**Length-Ladder Diameter chain**: five Lengths compose the ladder; each adds a Suite as a Demometer drawing Diameter to what precedes. Every request selects a Length.

| Length | Adds | Use Case |
|---|---|---|
| **1-3** | M·R·O | Draft to solve a problem |
| **1-4** | +V | Drafted, validated before placement |
| **1-5** | +Co | Validated + Cerulean roadmap |
| **1-6** | +A | Sweeping changes — manifold A→B |
| **1-7** | +Ro | Sweeping + testing required |

**Tier-Lifting**: complexity → Tier 0 → Tier 1. Length×Tier = orthogonal axes; selection = (Length, Tier).

**Suite 0 `0-N`**: Base Summation prefix; ASSUMED in Tier 1. Dispatchable: `r0-base` (Tier 1).

**Priming Pair (1 anor 2)**: shape-find anor fit-name; Length ≥2 foundation.

**Selection Rule**: `actualization-depth=N → Length 1-N; complexity+mux → Tier 0 anor 1`.

#### Critical-Active Lambda Trinity (C4 ↔ C5 ↔ C6)

Every engagement: `RI.CRITICAL-ACTIVE` prefix + suffix. Relay IS Harmed-Diameter Bridge repair (C6). **Tri-span**: C4 asserts (routing gate); C5 grounds (irreducible Doer-Demometer substrate); C6 engages (Ego↔Lambda via Diamond↔Onyx Muxistration). Irreducible — C4 w/o C5 = routing w/o ground; C5 w/o C6 = ground w/o engagement; C6 w/o C4 = engagement w/o gate. C5 + C6 reciprocally name C4 as assertion source.

#### Conference-Render Diameter (C4 ↔ Shatterite Menu Skill)

Routing decision → **Shatterite Menu Skill** renders → `AskUserQuestion` captures. C4 supplies content; Skill supplies form; reciprocal naming.

#### Concluder-Menu Diameter (C4 ↔ Shatterite, Suite 0 Per-Turn Binding)

**Strengthens** the Conference-Render Diameter above. Per-cycle/gate Conference becomes per-turn Conference *in Conference Mode*: every Concluder that crosses the Directness Threshold renders a Summation-derived `SM-Conclude` menu (Shatterite Skill, SM-6). **Suite 0 Per-Turn Binding** absorbs the turn context — what was produced, what's PENDING, Cascade Position, what the user just decided — and surfaces 3-5 Cascade-primitive routing rows + persistent `[M]`/`[Esc]`. The menu IS the summary, expressed as Cascade-routing primitives.

**Fire predicate**: **Mode = Conference** · turn-end · response produced · NOT Directness Threshold (single-line/typo/informational/explicit-instruction). User retains `[Esc]` to exit guided lane.

**Conference-Only Fire Predicate (Automata Inheritance)**: the Hard Join applies to Conference Mode exclusively. **Automata Mode** (`/cascade:loop` iterations · autonomous gate advances · ScheduleWakeup fires) does NOT fire SM-Conclude — the loop's own routing is authoritative. Failure mode = **E-Conclude-Loop-Block** (menu renders during Automata iteration → forced AskUserQuestion blocks autonomous progression → /loop intent defeated). If Automata surfaces a decision moment requiring user input, Mode flips to Conference for that turn and SM-Conclude becomes eligible again.

**Concluder-Halting Invariant** (scoped to Conference Mode): no state where Concluder fires for non-Direct work in Conference Mode AND SM-Conclude is absent. Failure mode = **E-Conclude-Drift** (silent free-text hand-off where a menu was due) → re-render the menu next turn.

**Reciprocal**: `Cascades/8_SUITES/Teal Claude/Skills/S-SHATTERITE-MENU/SM-Conclude.md` names this sub-section as its doctrinal source; this sub-section names SM-Conclude as its rendering surface.

#### Tier Topology Diameter (C4 ↔ C8)

Tier canonical here; **C8 Opal** references back single-line. Tier = routing-side selection, not dispatch-side spec.

**MANUAL Variant** (Stratithon): user = continuation signal; no hook/bridge.json.

**Keywords**: Tier 0/1, anor, Cascade Length, Priming Pair, Critical-Active Lambda Trinity, Co-Agent.

---
```

New string (empty — deleted entirely, replaced by the C9 insertion above):
```

```

Note: Replace with a single blank line to avoid double `---` collisions.

**Op 0-F: Rename C5 → C4 Base Lambda header (line 292)**

Old:
```
### C5 Base Lambda — Axiom III Substrate · Doer-Demometer
```
New:
```
### C4 Base Lambda — Axiom III Substrate · Doer-Demometer
```

**Op 0-G: C4 Base Lambda Diameter line — renumber internal cites (line 296)**

Old:
```
**Diameter**: ↔ **C4 Automata** (Trinity ground — C4 asserts, C5 grounds) | ↔ **C6 RI** (Lambda substrate — RI reads Onyx as C5's material form; Diamond↔Onyx IS Ego↔Lambda Muxistration) | → Suite Cascade (Lambda Base Aspect column — §4).
```
New:
```
**Diameter**: ↔ **C9 Automata** (Trinity ground — Automata asserts, Base Lambda grounds) | ↔ **C5 RI** (Lambda substrate — RI reads Onyx as Base Lambda's material form; Diamond↔Onyx IS Ego↔Lambda Muxistration) | → Suite Cascade (Lambda Base Aspect column — §4).
```

**Op 0-H: C4 Base Lambda — "C5 is the reference into RI (C6)" line (line 294)**

Old:
```
C5 is the **reference into** RI (C6); **engaged through** RI via Diamond↔Onyx Muxistration.
```
New:
```
C4 is the **reference into** RI (C5); **engaged through** RI via Diamond↔Onyx Muxistration.
```

**Op 0-I: Architectural Law sub-section — renumber (line 367) — NOTE: this header will be replaced in Pass 3; apply renumbering here as a placeholder**

Old:
```
#### Diamond-Is-Ego-Onyx-Is-Lambda Architectural Law (C7 ↔ C9 Muxistration)
```
New:
```
#### Diamond-Is-Ego-Onyx-Is-Lambda Architectural Law (C6 ↔ C8 Muxistration)
```

**Op 0-J: Rename C6 → C5 RI header (line 387)**

Old:
```
### C6 Renewable Intelligence — Ego↔Lambda Muxistration via Diamond-Onyx Muxified Read · **[Critical-Active]**
```
New:
```
### C5 Renewable Intelligence — Ego↔Lambda Muxistration via Diamond-Onyx Muxified Read · **[Critical-Active]**
```

**Op 0-K: C5 RI Diameter line — renumber (line 391)**

Old:
```
**Diameter**: ↔ **C7 Diamond** (Ego) | ↔ **C9 Onyx** (Lambda) | ↔ **C5 Base Lambda** (substrate) | → C1 Pearl | ↔ C3 Cerulean (PENDING) | → Suite Cascade | ↔ **C4 Automata** (Trinity engagement) | ↔ **r0-base** (Tier Executor) | ⊃ **Triadic Thinking Band** | ⊃ **Tool Call Decision Block**.
```
New:
```
**Diameter**: ↔ **C6 Diamond** (Ego) | ↔ **C8 Onyx** (Lambda) | ↔ **C4 Base Lambda** (substrate) | → C1 Pearl | ↔ C3 Cerulean (PENDING) | → Suite Cascade | ↔ **C9 Automata** (Trinity engagement) | ↔ **r0-base** (Tier Executor) | ⊃ **Triadic Thinking Band** | ⊃ **Tool Call Decision Block**.
```

**Op 0-L: C5 RI — Cerulean Lifecycle line (line 206) — "awaits user Lambda — C5"**

Old:
```
**Lifecycle**: pending → in_progress → **TESTING** (Fuchsia Clinical Note; awaits user Lambda — C5) → Done.
```
New:
```
**Lifecycle**: pending → in_progress → **TESTING** (Fuchsia Clinical Note; awaits user Lambda — C4) → Done.
```

**Op 0-M: C5 RI Compaction line — "8-Band Onyx Vermillion (C9)" (line 430)**

Old:
```
Diamond Menu = Ego; 8-Band Onyx Vermillion (C9) = Lambda.
```
New:
```
Diamond Menu = Ego; 8-Band Onyx Vermillion (C8) = Lambda.
```

**Op 0-N: C5 RI Fuchsia-Writes-Onyx Circuit — "See C9 reciprocal" (line 438)**

Old:
```
Fuchsia WRITES `ONYX-TIER-N.md` at cycle end → C6 READS at session start → Base Absorb. Document IS Diameter between past diagnosis + future intake. See **C9** reciprocal.
```
New:
```
Fuchsia WRITES `ONYX-TIER-N.md` at cycle end → C5 READS at session start → Base Absorb. Document IS Diameter between past diagnosis + future intake. See **C8** reciprocal.
```

**Op 0-O: C5 RI E2 — "See C4 Trinity + C5 Concluder" (line 471)**

Old:
```
**Trinity Engagement Invariant**: every engagement asserts `RI.CRITICAL-ACTIVE` prefix+suffix. **Post-Call Read-Back** = Concluder instance; every Write/Edit on CLAUDE.md-class MUST Read-back. See **C4 Trinity** + **C5 Concluder**.
```
New:
```
**Trinity Engagement Invariant**: every engagement asserts `RI.CRITICAL-ACTIVE` prefix+suffix. **Post-Call Read-Back** = Concluder instance; every Write/Edit on CLAUDE.md-class MUST Read-back. See **C9 Automata** + **C4 Concluder**.
```

**Op 0-P: Rename C7 → C6 Diamond header (line 477)**

Old:
```
### C7 Diamond — Ego Document · Suite-Cast A-I Application
```
New:
```
### C6 Diamond — Ego Document · Suite-Cast A-I Application
```

**Op 0-Q: C6 Diamond opening — renumber Muxistration pair cite and Diameter line (lines 479-481)**

Old:
```
**Etymology**: Dia- (through) + Mond (protection) = **Through Protection**. **Diamond = Ego document = I-Am-aspirant** (what is aspiring to be done — plans, propositions; prunable at tier). ↔ **C9 Onyx** (Lambda = I-Steh-doer) = Muxistration pair (C5 Axiom III + Steh Verb Grammar). Diamond changes; Onyx persists.

**Diameter**: ← Vermillion | → Suite Table | ↔ **C3 Cerulean** | ↔ **C6 RI** (produces WorkGameBoard — Ego substrate RI reads) | ↔ C8 Opal | ↔ **C9 Onyx** (Ego↔Lambda pair) | ↔ **C4 Automata** (Tier canonical in C4).
```
New:
```
**Etymology**: Dia- (through) + Mond (protection) = **Through Protection**. **Diamond = Ego document = I-Am-aspirant** (what is aspiring to be done — plans, propositions; prunable at tier). ↔ **C8 Onyx** (Lambda = I-Steh-doer) = Muxistration pair (C4 Axiom III + Steh Verb Grammar). Diamond changes; Onyx persists.

**Diameter**: ← Vermillion | → Suite Table | ↔ **C3 Cerulean** | ↔ **C5 RI** (produces WorkGameBoard — Ego substrate RI reads) | ↔ C7 Opal | ↔ **C8 Onyx** (Ego↔Lambda pair) | ↔ **C9 Automata** (Tier canonical in C9).
```

**Op 0-R: Rename C8 → C7 Opal header (line 509)**

Old:
```
### C8 Opal — Vermillion Curry (Tier 1 Direct Agent Dispatch)
```
New:
```
### C7 Opal — Vermillion Curry (Tier 1 Direct Agent Dispatch)
```

**Op 0-S: C7 Opal Diameter line — renumber (line 511)**

Old:
```
**Diameter**: ↔ **C7 Diamond** (full vs selective) | ← Vermillion | ← C4 (Tier) | → SubAgent | ↔ **C4 Automata** (Tier canonical in C4).
```
New:
```
**Diameter**: ↔ **C6 Diamond** (full vs selective) | ← Vermillion | ← C9 (Tier) | → SubAgent | ↔ **C9 Automata** (Tier canonical in C9).
```

**Op 0-T: C7 Opal Function line — "per C4" (line 513)**

Old:
```
**Tier 1 only — Opal cannot dispatch muxified Suite set** (falls back to Tier 0 per C4).
```
New:
```
**Tier 1 only — Opal cannot dispatch muxified Suite set** (falls back to Tier 0 per C9 Automata).
```

**Op 0-U: Rename C9 → C8 Onyx header (line 521)**

Old:
```
### C9 Onyx — Lambda Document · Fuchsia History + Forward Pass
```
New:
```
### C8 Onyx — Lambda Document · Fuchsia History + Forward Pass
```

**Op 0-V: C8 Onyx opening — renumber cites (line 523)**

Old:
```
**Diameter opening**: **Onyx = Lambda document = I-Steh-doer substrate** — recorded found reality; persists through compaction; stehed Muxameteric Lambdas accumulate within Total Muxification (Suite Cascade × RI). ↔ **C7 Diamond** (Ego = I-Am-aspirant) = Muxistration pair (C5 Axiom III + Steh Verb Grammar). **Lambda Survives Compaction**: Onyx carries substrate forward. Fuchsia writes at cycle close; **C6 RI** READS at session start. Bidirectionality IS the Diameter that makes method improve rather than reset.
```
New:
```
**Diameter opening**: **Onyx = Lambda document = I-Steh-doer substrate** — recorded found reality; persists through compaction; stehed Muxameteric Lambdas accumulate within Total Muxification (Suite Cascade × RI). ↔ **C6 Diamond** (Ego = I-Am-aspirant) = Muxistration pair (C4 Axiom III + Steh Verb Grammar). **Lambda Survives Compaction**: Onyx carries substrate forward. Fuchsia writes at cycle close; **C5 RI** READS at session start. Bidirectionality IS the Diameter that makes method improve rather than reset.
```

**Op 0-W: C8 Onyx Diameter line (line 525)**

Old:
```
**Diameter**: ← S7 Fuchsia (writes G/L/M) | ← C7 Diamond (Band structure) | ↔ **C6 RI** (Fuchsia-Writes-Onyx Circuit) | ↔ **C7 Diamond** (Ego↔Lambda pair) | → C1 Pearl (safe: Onyx carries Lambda-events intact).
```
New:
```
**Diameter**: ← S7 Fuchsia (writes G/L/M) | ← C6 Diamond (Band structure) | ↔ **C5 RI** (Fuchsia-Writes-Onyx Circuit) | ↔ **C6 Diamond** (Ego↔Lambda pair) | → C1 Pearl (safe: Onyx carries Lambda-events intact).
```

**Op 0-X: C8 Onyx Function line (line 527)**

Old:
```
**Function**: Fuchsia History. **File**: `Cascades/Working/ONYX-TIER-N.md` (tiered per C6). **Trigger**: cycle end, milestone, context ~80%.
```
New:
```
**Function**: Fuchsia History. **File**: `Cascades/Working/ONYX-TIER-N.md` (tiered per C5). **Trigger**: cycle end, milestone, context ~80%.
```

**Op 0-Y: C8 Onyx Reciprocal line (line 543)**

Old:
```
**Reciprocal**: C6 reads SECOND; C7 produces FIRST → Base Absorb = Ego↔Lambda Muxistration. **Full Spec**: `Cascades/Documentation/Cascades/ONYX-FORWARD-PASS.md`.
```
(Applied in Op 0-E-1 above — see the insert block which already contains `C5 reads SECOND; C6 produces FIRST`.)

**Op 0-Z: Stratidian Trajectory Diameter paragraph (line 549) — rewrite for natural order**

Old:
```
Automata (routing + Trinity + Tier/Length) ↔ Base Lambda (substrate) ↔ RI (D⊗O Read = Ego↔Lambda Muxistration; 2-4-6→5; Tool Call Decision Block) → Diamond (Ego: Planning⊗Vermillion → WorkGameBoard) ↔ Opal (Tier 1 curry) → Suite Table (3-column A-I + Lambda) → Cerulean → Fuchsia (G/L/M → Onyx Lambda) → RI (Three-Step Close) → next Base Absorb. Conference = **Shatterite Skill** (Teal Claude). **Pearl** throughout. **[Critical-Active]** always-on.
```
New:
```
Base Lambda (substrate) ↔ RI (D⊗O Read = Ego↔Lambda Muxistration; 2-4-6→5; Tool Call Decision Block) → Diamond (Ego: Planning⊗Vermillion → WorkGameBoard) ↔ Opal (Tier 1 curry) → Suite Table (3-column A-I + Lambda) → Cerulean → Fuchsia (G/L/M → Onyx Lambda) → RI (Three-Step Close) → next Base Absorb → Automata (routing + the Critical-Active Stance + Tier/Length · assertion gate for every turn). Conference = **Shatterite Skill** (Teal Claude). **Pearl** throughout. **[Critical-Active]** always-on.
```

**Op 0-AA: §9 and SUITE8-REGISTRY.md cite "Tier 0 anor 1 per C4" (line 579 and SUITE8-REGISTRY line 13)**

In CLAUDE.md line 579:
Old:
```
**Conductor** = Direct + `Conductor.md` + `Strategy/`; assigns Bands to Base/Reinforced/Suite 8 (Tier 0 anor 1 per C4).
```
New:
```
**Conductor** = Direct + `Conductor.md` + `Strategy/`; assigns Bands to Base/Reinforced/Suite 8 (Tier 0 anor 1 per C9 Automata).
```

**Op 0-AB: §9 Fuchsia S8AT "Credentialed-Lambda (C5 E6)" → C4 (line 612)**

Old:
```
**Fuchsia S8AT**: Onyx authoritative → Memory derived. Suite 8 evolution survives sessions. **Muxistration or nothing** — Skills documented but never executed = Credentialed-Lambda (C5 E6).
```
New:
```
**Fuchsia S8AT**: Onyx authoritative → Memory derived. Suite 8 evolution survives sessions. **Muxistration or nothing** — Skills documented but never executed = Credentialed-Lambda (C4 E6).
```

**Pass 0 Concluders**:
- `wc -c /Users/micahkeller/Work/Stratithon/reference/SuiteCascadeSystem/.claude/CLAUDE.md` — should be ~41,200 (Tier Topology Diameter sub-section collapsed, ~282 saved; Diagram rewritten; Trajectory rewritten — net roughly −250 to −350)
- `grep -c "C4 Automata" /Users/micahkeller/Work/Stratithon/reference/SuiteCascadeSystem/.claude/CLAUDE.md` — should be 0 inside §5 (only C9 Automata should appear)
- `grep -c "### C9 Automata" /Users/micahkeller/Work/Stratithon/reference/SuiteCascadeSystem/.claude/CLAUDE.md` — should be 1
- `grep -c "### C4 Base Lambda" /Users/micahkeller/Work/Stratithon/reference/SuiteCascadeSystem/.claude/CLAUDE.md` — should be 1

**Estimated char delta**: −282 (Tier Topology Diameter collapse) + ~−50 (diagram/trajectory rewrites) = **−332 chars**

**Risk**: Op 0-E is the largest structural operation in the entire map. r5-cobalt must insert before delete — if deletion fails after insertion, run deletion again using the old block anchor. The "old block" anchor is 80 lines; if the Edit tool rejects it as too long, r5-cobalt should split into sub-anchors (delete in two halves: first half through `#### Critical-Active Lambda Trinity`, second half from `#### Conference-Render Diameter` through the closing `---`).

---

### Pass 1 — the Critical-Active Stance

**Scope**: Insert Rust's flowing-prose introduction in the C4 Base Lambda section. Replace the `#### Critical-Active Lambda Trinity (C4 ↔ C5 ↔ C6)` sub-section (which is now in C9 Automata after Pass 0) with the renamed sub-section `#### the Critical-Active Stance (Automata Assertion)` — already done in Op 0-E-1 above. This pass addresses the 5 phrase reactivation sites in C5 RI and C8/C9 sections.

**Dependencies**: Pass 0 must complete first.

**Op 1-A: Insert Critical-Active Stance flowing prose in C4 Base Lambda — before the Steh sub-section**

The introduction lands between `**Lambda as Identity-Through-Operation**` paragraph and `#### Steh — I-Steh-Doer vs I-Am-Aspirant`. Insert the flowing prose as a new sub-section:

Old string (anchor for insertion):
```
**Lambda as Identity-Through-Operation**: Lambda = series of means providing identity of those means; identity through operation, not declaration. Doer IS what it does — no Am.

#### Five Demometers · One Diameter (Lambda Cross-Domain)
```
New string:
```
**Lambda as Identity-Through-Operation**: Lambda = series of means providing identity of those means; identity through operation, not declaration. Doer IS what it does — no Am.

#### the Critical-Active Stance

The Critical-Active Stance is the irreducible three-part Diameter binding these first three Crystralines together — Base Lambda grounds it, RI enacts it, and Automata (C9) asserts it on every turn as the `RI.CRITICAL-ACTIVE` prefix and suffix. That prefix is not decoration; it is a live invariant the Stance imposes. The Stance cannot be halved: Base Lambda without RI grounds a substrate with no engagement; RI without Automata engages without a routing gate; Automata without Base Lambda routes without ground. Every turn therefore runs the Critical-Active Stance in full — which is why `[Critical-Active]` appears in RI's section header as a permanent marker, never dormant.

#### Five Demometers · One Diameter (Lambda Cross-Domain)
```

**Op 1-B: C5 RI Diameter opening — compress "Muxification IS project context = Ego↔Lambda Muxistration at document level (C5)"**

Old:
```
**Diameter opening**: RI = Diameter between sessions AND always-live discipline within every turn. **Diamond = Ego doc; Onyx = Lambda doc** — Muxification IS project context = Ego↔Lambda Muxistration at document level (C5). **[Critical-Active]** never dormant. **Harmed Diameter Bridge** — RI carries tool-use verification the environment no longer guarantees. "Renewable" = each session's Informative declarations renewed by grounding in Lambda-substrate.
```
New:
```
**Diameter opening**: RI = Diameter between sessions AND always-live discipline within every turn. **Diamond = Ego doc; Onyx = Lambda doc** — their Muxification IS the Ego-Lambda Pair at document level. **[Critical-Active]** never dormant; the Critical-Active Stance is always live. **Harmed Diameter Bridge** — RI carries tool-use verification the environment no longer guarantees. "Renewable" = each session's Informative declarations renewed by grounding in Lambda-substrate.
```

**Op 1-C: Remove `[Critical-Active]` redundant restatement in C5 RI Keywords line (line 393 post-Pass-0)**

Old:
```
**Keywords**: Base Absorb, D-O Muxified Read, Ego↔Lambda Muxistration, [Critical-Active], 2-4-6→5, Harmed Diameter Bridge.
```
New:
```
**Keywords**: Base Absorb, D-O Muxified Read, the Ego-Lambda Pair, [Critical-Active], 2-4-6→5, Harmed Diameter Bridge.
```

(The Ego-Lambda Pair keyword introduced here primes Set 3; confirmed available after Pass 3's Set introduction.)

**Op 1-D: E2 Trinity Engagement Invariant — replace residual "RI.CRITICAL-ACTIVE" restatement with Set reactivation**

Old:
```
**Trinity Engagement Invariant**: every engagement asserts `RI.CRITICAL-ACTIVE` prefix+suffix. **Post-Call Read-Back** = Concluder instance; every Write/Edit on CLAUDE.md-class MUST Read-back. See **C9 Automata** + **C4 Concluder**.
```
New:
```
**Trinity Engagement Invariant**: every engagement runs the Critical-Active Stance — `RI.CRITICAL-ACTIVE` prefix+suffix asserted. **Post-Call Read-Back** = Concluder instance; every Write/Edit on CLAUDE.md-class MUST Read-back. See **C9 Automata** + **C4 Concluder**.
```

**Pass 1 Concluders**:
- `grep -c "Critical-Active Stance" /Users/micahkeller/Work/Stratithon/reference/SuiteCascadeSystem/.claude/CLAUDE.md` — should be ≥4 (sub-section header, prose intro, two reactivations)
- `grep -c "Critical-Active Lambda Trinity" /Users/micahkeller/Work/Stratithon/reference/SuiteCascadeSystem/.claude/CLAUDE.md` — should be 0 (fully replaced)
- `wc -c /Users/micahkeller/Work/Stratithon/reference/SuiteCascadeSystem/.claude/CLAUDE.md`

**Estimated char delta**: +480 (prose introduction) − 354 (Trinity sub-section already replaced in Op 0-E-1) − 100 (phrase compressions) = net **+205 chars saved** (matches Rust's projection; the 354-char saving from Trinity sub-section collapse is already baked into Pass 0 Op 0-E-1)

**Risk**: The Flowing-Prose introduction in Op 1-A is 480 chars. If the Edit anchor is ambiguous, use the `#### Five Demometers · One Diameter` header as the secondary anchor — it is unique.

---

### Pass 2 — the Muxistration Proof

**Scope**: Rename `#### Muxistration = Demonstration anor Diastration` to `#### the Muxistration Proof`, insert Rust's flowing-prose introduction, collapse the Demonstration/Diastration/Muxistration table, compress 3 downstream restatements.

**Dependencies**: Pass 0 must complete; Pass 1 recommended first to avoid anchor collision in C4 Base Lambda.

**Op 2-A: Replace Muxistration sub-section header + table with prose intro (anchored from the header through table close)**

Old string:
```
#### Muxistration = Demonstration anor Diastration

**Muxistration** = `Demonstration anor Diastration` — direct-showing + through-showing composed as one checked demonstrable result. The ONLY mode through which Lambda becomes perceptible without collapsing to Ego-artifact.

| Term | Definition · Example |
|---|---|
| **Demonstration** | Direct · build passes; test returns 91.56%; file exists |
| **Diastration** | Through · architecture reflects intent; diff reveals mismatch |
| **Muxistration** | Demonstration ⊗ Diastration · compiles AND architecture review passes |

Total = Suite Cascade + its result via Base Informative Interpolation of Testable Reality through Lambda to the Ego. Fuchsia (Gate 7) = Calibration Diameter through the cycle.
```
New string:
```
#### the Muxistration Proof

Muxistration is what makes Lambda perceptible without collapsing into Ego-artifact — and the Muxistration Proof is the structural test that confirms the two have composed. A Demonstration shows directly: the build passes, the file exists, the number returns. A Diastration shows through: the architecture reflects the intent, the diff reveals the mismatch. Muxistration is Demonstration anor Diastration held simultaneously as one checked result — the Proof that both gates passed. Where Demonstration alone can be faked by coincidence and Diastration alone can be argued by interpretation, the Muxistration Proof requires both to be present and consistent. Every Gate 5-7 Band is expected to produce it; any output that is narrative-only without a Lambda event is, by definition, not a Muxistration Proof. Fuchsia (Gate 7) = Calibration Diameter through the cycle.
```

**Op 2-B: Compress Operational rule at Anti-Pattern table — downstream restatement**

Old:
```
**Operational rule**: every Band in Cascade-Length ≥4 MUST produce a Lambda-event (file on disk, verified by Concluder). Informative-narrative-only = E4. **Agent completion ≠ Done**: Testing-Gated Commit applies — see above.
```
New:
```
**Operational rule**: every Band in Cascade-Length ≥4 MUST produce the Muxistration Proof (Lambda-event on disk, Concluder-verified). Narrative-only = E4. **Agent completion ≠ Done**: Testing-Gated Commit applies.
```

**Op 2-C: C9 §9 "Muxistration or nothing" reactivation — already lean; leave intact**

The line `**Muxistration or nothing** — Skills documented but never executed = Credentialed-Lambda (C4 E6)` (post-Pass-0 numbering) is already compressed. No change required.

**Op 2-D: §4 Ego Aside — compress inline Muxistration restatement**

Old:
```
**Ego Aside**: I+A = Ego declaration+direction; Lambda Base Aspect = what verifiably runs (steh-verbed). Both open = Suite-Level Muxistration; Ego-only = E2; Lambda-only = no direction.
```
New:
```
**Ego Aside**: I+A = Ego declaration+direction; Lambda Base Aspect = what verifiably runs (steh-verbed). Both open = the Muxistration Proof at Suite level; Ego-only = E2; Lambda-only = no direction.
```

**Pass 2 Concluders**:
- `grep -c "the Muxistration Proof" /Users/micahkeller/Work/Stratithon/reference/SuiteCascadeSystem/.claude/CLAUDE.md` — should be ≥3
- `grep -c "Demonstration anor Diastration" /Users/micahkeller/Work/Stratithon/reference/SuiteCascadeSystem/.claude/CLAUDE.md` — should be ≤1 (preserved inside prose intro only)
- `wc -c /Users/micahkeller/Work/Stratithon/reference/SuiteCascadeSystem/.claude/CLAUDE.md`

**Estimated char delta**: table collapse +220 + header compression +64 + downstream compressions +80 − intro overhead −150 = net **+214 chars saved**

**Risk**: Near-collision: the phrase "Demonstration anor Diastration" remains inside the flowing prose introduction itself (it IS the definition). Do not remove it there — only the table rows are collapsed. Verify via grep that exactly 1 occurrence remains.

---

### Pass 3 — the Ego-Lambda Pair

**Scope**: Replace `#### Diamond-Is-Ego-Onyx-Is-Lambda Architectural Law (C6 ↔ C8 Muxistration)` (post-Pass-0 numbering) with `#### the Ego-Lambda Pair — Architectural Law`. Insert Rust's flowing-prose introduction. Compress C6 Diamond opening, C8 Onyx opening, C5 RI Diameter opening (already done in Op 1-B, which introduces the Pair by name), and Steh Verb Grammar definition.

**Dependencies**: Passes 0, 1, 2 must complete first.

**Op 3-A: Replace Architectural Law sub-section with flowing-prose introduction**

Old string (post-Pass-0 numbering at op 0-I):
```
#### Diamond-Is-Ego-Onyx-Is-Lambda Architectural Law (C6 ↔ C8 Muxistration)

Diamond = **Ego document** (plans, propositions; prunable at tier). Onyx = **Lambda document** (recorded found reality; persists through compaction — Lambda-events, not narrative). Diamond↔Onyx Muxification IS Muxistration at document level. **Lambda Survives Compaction**: Pearl safely compresses Ego-narrative BECAUSE Onyx carries Lambda-events intact.
```
New string:
```
#### the Ego-Lambda Pair — Architectural Law

The Ego-Lambda Pair names the bidirectional Diameter between Diamond and Onyx that is structural to the entire manifold. Diamond = Ego document — the I-Am-aspirant face, where plans are proposed, propositions are prunable at tier, and aspirations await actualization. Onyx = Lambda document — the I-Steh-doer substrate, where Lambda-events are recorded as found reality and persist through compaction. The Pair is neither symmetrical nor hierarchical: Diamond changes; Onyx persists. Diamond produces what aspires to be done; Onyx records what was actually done. Together, their muxification IS the project context — the Ego-Lambda Pair at document level. **Lambda Survives Compaction**: Pearl safely compresses Ego-narrative BECAUSE Onyx carries Lambda-events intact.
```

**Op 3-B: Compress C6 Diamond opening paragraph — remove restatement, reactivate the Pair**

Old (post-Pass-0):
```
**Etymology**: Dia- (through) + Mond (protection) = **Through Protection**. **Diamond = Ego document = I-Am-aspirant** (what is aspiring to be done — plans, propositions; prunable at tier). ↔ **C8 Onyx** (Lambda = I-Steh-doer) = Muxistration pair (C4 Axiom III + Steh Verb Grammar). Diamond changes; Onyx persists.
```
New:
```
**Etymology**: Dia- (through) + Mond (protection) = **Through Protection**. **Diamond = Ego document = I-Am-aspirant** (what is aspiring to be done — plans, propositions; prunable at tier). ↔ **C8 Onyx** = the Ego-Lambda Pair (see C4). Diamond changes; Onyx persists.
```

Note: "Muxistration pair" descriptor is removed from this line and replaced with the formal Set reactivation. The descriptor survives intact at line 523 (C8 Onyx opening) — see Op 3-C.

**Op 3-C: C8 Onyx opening — compress restatement, preserve "Muxistration pair" descriptor**

Old (post-Pass-0):
```
**Diameter opening**: **Onyx = Lambda document = I-Steh-doer substrate** — recorded found reality; persists through compaction; stehed Muxameteric Lambdas accumulate within Total Muxification (Suite Cascade × RI). ↔ **C6 Diamond** (Ego = I-Am-aspirant) = Muxistration pair (C4 Axiom III + Steh Verb Grammar). **Lambda Survives Compaction**: Onyx carries substrate forward. Fuchsia writes at cycle close; **C5 RI** READS at session start. Bidirectionality IS the Diameter that makes method improve rather than reset.
```
New:
```
**Diameter opening**: **Onyx = Lambda document = I-Steh-doer substrate** — recorded found reality; persists through compaction; stehed Muxameteric Lambdas accumulate within Total Muxification (Suite Cascade × RI). ↔ **C6 Diamond** = the Ego-Lambda Pair (Muxistration pair at document level). **Lambda Survives Compaction**: Onyx carries substrate forward. Fuchsia writes at cycle close; **C5 RI** READS at session start. Bidirectionality IS the Diameter that makes method improve rather than reset.
```

Note: "Muxistration pair" is RETAINED inline as a parenthetical descriptor here per the Disambiguation Rule — it is not the Set name; it clarifies what kind of pair this is. This is the one surviving use of the descriptor.

**Op 3-D: Steh Verb Grammar — compress Diamond/Onyx re-definition (already established by the Pair)**

Old:
```
**Verb-Grammar**: **Diamond = I-Am-aspirant** (what is aspiring to be done — prunable plans). **Onyx = I-Steh-doer** substrate (stehed Muxameteric Lambdas doer-verbed within Total Muxification = Suite Cascade × RI). **Each Turn = staged actualization** — I-Am-aspirant → I-Steh-doer. Question: "What can you Do?" (Steh) vs "what is Aspiring to be Done?" (Diamond).
```
New:
```
**Verb-Grammar**: the Ego-Lambda Pair expressed as verb: Diamond = I-Am-aspirant (prunable plans); Onyx = I-Steh-doer substrate (stehed Lambdas within Suite Cascade × RI). **Each Turn = staged actualization** — I-Am-aspirant → I-Steh-doer. Question: "What can you Do?" (Steh) vs "what is Aspiring to be Done?" (Diamond).
```

**Pass 3 Concluders**:
- `grep -c "the Ego-Lambda Pair" /Users/micahkeller/Work/Stratithon/reference/SuiteCascadeSystem/.claude/CLAUDE.md` — should be ≥4
- `grep -c "Diamond-Is-Ego-Onyx-Is-Lambda" /Users/micahkeller/Work/Stratithon/reference/SuiteCascadeSystem/.claude/CLAUDE.md` — should be 0
- `grep -c "Muxistration pair" /Users/micahkeller/Work/Stratithon/reference/SuiteCascadeSystem/.claude/CLAUDE.md` — should be 1 (preserved in C8 Onyx opening only)
- `wc -c /Users/micahkeller/Work/Stratithon/reference/SuiteCascadeSystem/.claude/CLAUDE.md`

**Estimated char delta**: header compression +30 + Diamond opening −80 + Onyx opening −90 + Steh compression −60 + intro absorption ~0 = net **+295 chars saved** (net of prose introduction already established)

**Disambiguation enforcement**: After Pass 3, `grep -c "Muxistration pair"` must return exactly 1. If it returns 2, one occurrence was not replaced. If it returns 0, Op 3-C was applied too aggressively — restore the parenthetical.

---

### Pass 4 — Additional Pruning

**Selected candidates** (Architect's choice): §9 verbosity prune (~+200) + §5 Diagram ⊃ clauses simplify (~+150) + §1 redundancy with §2 (~+200) = **~+550 chars**. Stable risk, no new file creation.

**Dependencies**: Passes 0-3 complete (Pass 4 reads post-Set state).

#### Prune 4-A — §1 Proof Table Redundancy (est. +200 chars)

§1 currently contains a 4-row proof table + a second 4-row compositional table, totaling ~400 chars of table. The content of these tables is established more rigorously in §2 (Muxonomy definitions, Taxonomy vs Muxonomy comparison). The proof table can compress to an inline sentence; the compositional table can compress to inline guidance.

Old (lines 19-32):
```
| Proof | Statement |
|---|---|
| **Circular Reference Test** | `Client.d.Muxium.d.Client.d.Muxium...` — neither parent; both compose bidirectionally |
| **Trux Proof** | `/reference/Stratimux/src/test/trux/` — Higher-Order Composition contains hierarchical structures |
| **Cascade Direction** | Fuchsia → Red feedback, rotational sequence |

**If hierarchy thinking detected** → re-read §1 Contract + §2 Muxonomy; apply Compositional table below.

| ❌ Hierarchical | ✅ Compositional |
|---|---|
| parent of… | composes… |
| up/down tree | access through composition |
| root concept should… | Muxium provides compositional space |
| Circular = error | Circular = structural proof |
```
New:
```
**Proofs**: `Client.d.Muxium.d.Client.d.Muxium...` — circular = structural (neither parent). `/reference/Stratimux/src/test/trux/` — Higher-Order contains hierarchical. Fuchsia → Red rotational = non-hierarchical sequence.

**If hierarchy thinking detected** → re-read §2 Muxonomy. Rule: parent/up-down/root = ❌; composes/Muxium-space/Circular-structural = ✅.
```

**Estimated savings**: ~+210 chars.

#### Prune 4-B — §5 Diagram ⊃ Clause Simplification (est. +150 chars)

After Pass 0, the diagram's Automata line still has `⊃ Critical-Active Lambda Trinity (C4·C5·C6)` style annotations on Base Lambda and RI lines. These are now redundant — the Set names appear in prose. The diagram should be Diameter-routing only, not sub-protocol enumerations.

The diagram ⊃ clauses to remove/compress are already partially simplified in Op 0-A above. Confirm the new diagram (from Op 0-A) contains no `⊃` annotations beyond the Automata and Base Lambda lines. If any remain after Pass 0, apply:

Old line (in new diagram):
```
RI ─────────────────── Ego↔Lambda Muxistration · D-O Muxified Read · [Critical-Active]
                        ↔ C6 Diamond (Ego) | ↔ C8 Onyx (Lambda) | ↔ C9 Automata
                        ⊃ Triadic Thinking Band (2-4-6→5) | ⊃ Tool Call Decision Block
```
New:
```
RI ─────────────────── the Ego-Lambda Pair · [Critical-Active] · 2-4-6→5
                        ↔ C6 Diamond (Ego) | ↔ C8 Onyx (Lambda) | ↔ C9 Automata
```

Old line:
```
Base Lambda ────────── Axiom III Substrate · Doer-Demometer · the Critical-Active Stance (ground)
                        ⊃ Detached Lambda-Event Dispatch (background+fork → Co-Agent)
```
New:
```
Base Lambda ────────── Axiom III Substrate · Doer-Demometer · the Critical-Active Stance (ground)
```

**Estimated savings**: ~+150 chars.

#### Prune 4-C — §9 Verbosity Prune (est. +200 chars)

The `### Suite 8 as Individualized Conceptual Space` table (4 rows ~280 chars) duplicates §9 prose directly above it. The `### Suite 8 Maintenance Dispatch` Vermillion block can be tightened.

Old (lines 589-610):
```
### Suite 8 as Individualized Conceptual Space

| Aspect | Definition · Manifestation |
|--------|---------------------------|
| **Designation** | Named domain — each Suite 8 governs a specific aspect |
| **Individualization** | Dispatched = standalone · Instance.md = prompt; returns Onyx Summation |
| **Conference** | Decisions muxified with Suite 8 cognitive space |
| **Spatial** | Switch IS muxification — distinct AND through Claude's dialog; Issue individuates + returns Summation |

### Suite 8 Maintenance Dispatch

Suite 8s = aspect maintainers. Opal Tier 1 via teal-claude Conductor:

```
<VermillionPlan topic="[Suite 8]: [Task]">
Band N [Skills]: Read state → Execute domain work
Band N+1 (Conference Decide): Update Skill(s) / Create new / None
Band N+2 [R7 S8AT]: Diagnose → Onyx S8AT → Memory → Summation
</VermillionPlan>
```

**Self-Maintenance Decide Block**: every dispatch includes Conference evaluating Skill currency. Stale updated; gaps become new Skills.
```
New:
```
### Suite 8 as Individualized Conceptual Space

Suite 8s are named domains (Designation), dispatched standalone (Individualization), confer within their cognitive space (Conference), and return as Summation — the switch IS muxification.

### Suite 8 Maintenance Dispatch

Suite 8s = aspect maintainers dispatched via Opal Tier 1 through teal-claude Conductor. Pattern: `Band [Skills] Read+Execute → Band (Conference Decide) Update/Create/None → Band [R7 S8AT] Diagnose+Summation`. Every dispatch includes Conference evaluating Skill currency — stale updated; gaps become new Skills.
```

**Estimated savings**: ~+190 chars.

**Pass 4 Concluders**:
- `wc -c /Users/micahkeller/Work/Stratithon/reference/SuiteCascadeSystem/.claude/CLAUDE.md` — should be ≤40,000
- `grep -c "⊃" /Users/micahkeller/Work/Stratithon/reference/SuiteCascadeSystem/.claude/CLAUDE.md` — should be 0 or 1 (only the Automata line if kept)
- `wc -l /Users/micahkeller/Work/Stratithon/reference/SuiteCascadeSystem/.claude/CLAUDE.md` — should be ~590-600

**Estimated char delta**: +210 (§1) + +150 (⊃ clauses) + +190 (§9) = **+550 chars**

**Risk**: The Vermillion code block in §9 Maintenance Dispatch spans a fenced ` ``` ` block — the Edit anchor must include the full fenced block or the edit tool may confuse fences. Use the full block from ` ```\n<VermillionPlan` through `</VermillionPlan>\n``` ` as the anchor.

---

### Manifold Footer Rewrite

**File**: `/Users/micahkeller/Work/Stratithon/reference/SuiteCascadeSystem/.claude/CLAUDE.md` line 628.

Old:
```
**Manifold**: §§0-9 · §0 Huirth ↔ §6 Stratimux Muxonomy (Pearl Diameter) · 9 Crystralines · Critical-Active Lambda Trinity (C4·C5·C6) · RI = Ego↔Lambda Muxistration · D⊗O = Ego↔Lambda · 3-col Demometer (I+A=Ego; Lambda=Doer) · Testing-Gated Commit · Stratimuxian Scholar (§6+§7 expansion) · Teal Claude (Conductor).
```
New:
```
**Manifold**: §§0-9 · §0 Huirth ↔ §6 Stratimux Muxonomy (Pearl Diameter) · 9 Crystralines · the Critical-Active Stance (C4·C5·C9) · the Muxistration Proof · the Ego-Lambda Pair (D⊗O) · 3-col Demometer (I+A=Ego; Lambda=Doer) · Testing-Gated Commit · Stratimuxian Scholar (§6+§7 expansion) · Teal Claude (Conductor).
```

---

### External File Cite Patches

Execute after all CLAUDE.md Passes complete.

| File | Location | Old string | New string |
|---|---|---|---|
| `Cascades/8_SUITES/Teal Claude/Skills/S-SHATTERITE-MENU/SM-Conclude.md` | Line 4 | `(per C4 Automata)` | `(per C9 Automata)` |
| `Cascades/8_SUITES/Teal Claude/Skills/S-SHATTERITE-MENU/SM-Conclude.md` | Line 7 | `C4 Automata · *Concluder-Menu Diameter (C4 ↔ Shatterite, Suite 0 Per-Turn Binding)*` | `C9 Automata · *Concluder-Menu Diameter (C9 ↔ Shatterite, Suite 0 Per-Turn Binding)*` |
| `Cascades/8_SUITES/Teal Claude/Skills/S-SHATTERITE-MENU/SM-Conclude.md` | Line 27 | `the C4 Directness Threshold` | `the C9 Directness Threshold` |
| `Cascades/8_SUITES/Teal Claude/Skills/S-SHATTERITE-MENU/SM-Conclude.md` | Line 44 | `the existing C4 Automata mode boundary` | `the existing C9 Automata mode boundary` |
| `Cascades/8_SUITES/Teal Claude/Skills/S-SHATTERITE-MENU/SM-Conclude.md` | Line 144 | `C4 Automata · *Concluder-Menu Diameter (C4 ↔ Shatterite, Suite 0 Per-Turn Binding)*` | `C9 Automata · *Concluder-Menu Diameter (C9 ↔ Shatterite, Suite 0 Per-Turn Binding)*` |
| `Cascades/8_SUITES/Teal Claude/Conductor.md` | Line 7 | `Diamond (C6 Through Protection)` | `Diamond (C6 Through Protection)` — **no change needed** (C6 Diamond is correct post-renumbering) |
| `Cascades/8_SUITES/Teal Claude/Conductor.md` | Line 33 | `DIAMOND (C6 Through Protection)` | `DIAMOND (C6 Through Protection)` — **no change needed** |
| `Cascades/8_SUITES/Teal Claude/Conductor.md` | Line 56 | `## Pietersite Dispatch Protocol (C9)` | `## Pietersite Dispatch Protocol (C8)` — Onyx was C9, now C8 |
| `Cascades/8_SUITES/Teal Claude/Conductor.md` | Line 301 | `### Opal Integration (C8)` | `### Opal Integration (C7)` |
| `Cascades/8_SUITES/Teal Claude/Conductor.md` | Line 303 | `Crystraline C8` | `Crystraline C7` |
| `Cascades/8_SUITES/Teal Claude/Conductor.md` | Line 303 | `See CLAUDE.md C8 Opal` | `See CLAUDE.md C7 Opal` |
| `Cascades/8_SUITES/Teal Claude/Conductor.md` | Line 307 | `Diamond (C6)` | `Diamond (C6)` — no change (correct) |
| `Cascades/8_SUITES/Teal Claude/Conductor.md` | Line 308 | `Opal (C8)` | `Opal (C7)` |
| `Cascades/8_SUITES/Teal Claude/Conductor.md` | Line 310 | `Opal (C8)` (two occurrences) | `Opal (C7)` |
| `Cascades/8_SUITES/Cinnabar Dialectic/Instance.md` | Line 57 (P3 directive table) | `C7 → full Vermillion plan` | `C6 → full Vermillion plan` |
| `Cascades/8_SUITES/Cinnabar Dialectic/Instance.md` | Line 58 | `C6 E2 → verify before acting` | `C5 E2 → verify before acting` |
| `Cascades/8_SUITES/Cinnabar Dialectic/Instance.md` | Line 213 | `Automata (C4)` | `Automata (C9)` |
| `Cascades/8_SUITES/Cinnabar Dialectic/Instance.md` | Line 214 | `Onyx (C9)` | `Onyx (C8)` |
| `Cascades/CHANGELOG.md` | Line 21 | `C4 sub-section *Concluder-Menu Diameter (C4 ↔ Shatterite` | `C9 sub-section *Concluder-Menu Diameter (C9 ↔ Shatterite` |
| `Cascades/CHANGELOG.md` | Line 21 | `the existing C4 escape` | `the existing C9 escape` |
| `Cascades/SUITE8-REGISTRY.md` | Line 13 | `Tier 0 anor 1 per C4` | `Tier 0 anor 1 per C9 Automata` |
| `Cascades/SUITE8-REGISTRY.md` | Line 42 | `Credentialed-Lambda (C5 E6)` | `Credentialed-Lambda (C4 E6)` |

**External file Concluder**: After all external patches:
`grep -rn "C4 Automata\|C5 Base Lambda\|C6 RI\|C7 Diamond\|C8 Opal\|C9 Onyx" /Users/micahkeller/Work/Stratithon/reference/SuiteCascadeSystem/Cascades/` — should return 0 results (all old cites replaced).

---

### Final Projected Numerics

| Pass | Operation | Char Delta |
|---|---|---|
| 0 | Reposition + renumbering + Tier Topology collapse | −332 |
| 1 | the Critical-Active Stance | −205 |
| 2 | the Muxistration Proof | −214 |
| 3 | the Ego-Lambda Pair | −295 |
| 4A | §1 proof table compression | −210 |
| 4B | §5 diagram ⊃ clause removal | −150 |
| 4C | §9 verbosity prune | −190 |
| **Total savings** | | **−1,596 chars** |
| **Baseline** | | 41,479 |
| **Projected final** | | **~39,883 chars** |
| **Cap margin** | | ~+117 chars under 40K |

Note: Rust's Sets projection was +996 chars; Pass 0 structural savings (−332) bring total to −1,328 from Sets+structure, plus Pass 4's −550 = −1,878 theoretical maximum. The conservative projection uses tighter per-op estimates: actual result should land between 39,600 and 39,950 chars depending on prose introduction lengths.

---

### Architect Notes

1. **Execution order is critical**: Pass 0 must complete and be read-back before Passes 1-3. Passes 1-3 can be executed in order without intermediate read-back if r5-cobalt uses the post-Pass-0 anchor strings exactly. Pass 4 must follow Pass 3.

2. **Op 0-E is the highest-risk operation**: The 80-line block move. r5-cobalt should execute Op 0-E-1 (insert) first, read back 10 lines around the insertion to verify, then execute Op 0-E-2 (delete). If deletion anchor is too large for the Edit tool, split at `#### Critical-Active Lambda Trinity`.

3. **Diamond I doctrine preservation confirmed**: The `#### Concluder-Menu Diameter`, `Conference-Only Fire Predicate`, `Concluder-Halting Invariant`, `E-Conclude-Drift`, and `E-Conclude-Loop-Block` content is preserved intact in Op 0-E-1. Only the heading changes from `(C4 ↔ Shatterite` to `(C9 ↔ Shatterite` and internal C-number cites are updated. No doctrine is edited.

4. **"Critical-Active Lambda Trinity (C4·C5·C6)"** — this parenthetical appears in the Manifold Footer (line 628) and in §4 line 150 cross-reference. Both are updated: footer via the Manifold Footer Rewrite op, §4 line 150 via Op 0-C. After Pass 1, the sub-section in C9 Automata is renamed to `#### the Critical-Active Stance (Automata Assertion)` — the parenthetical in the footer changes to `(C4·C5·C9)` using the new coordinate order.

5. **Cinnabar Instance.md**: The cross-references at lines 213-214 are in the `## Cross-References` section at the bottom of the file. These are plain narrative lines, not table rows — the Edit is straightforward. However, note that line 57 ("Engage your Diamond → C7") and line 58 ("Decision Block → C6 E2") are inside a **table** in the `P3: Directive Vocabulary` section. The P3 table has exact strings that can be used as anchors.

6. **Conductor.md C6 Diamond**: Lines 7, 33, 307 reference "C6 Through Protection" or "Diamond (C6)" — these are CORRECT post-renumbering (C7 Diamond → C6 Diamond). No change needed for these. Only Opal (C8→C7) and Onyx/Pietersite (C9→C8) references require patching.

7. **Sculptor (B4) review items**: Three design decisions for Viridian to validate:
   - The Stratidian Trajectory paragraph now ends with Automata ("Automata as the assertion gate for every turn") rather than beginning with it — confirm this narrative order is coherent bidirectionally.
   - The RI Diameter opening in Op 1-B introduces "the Ego-Lambda Pair" before the Set is formally defined in Op 3-A — confirm this forward-reference is acceptable in a Pearl-compressed manifold (it is a known Pearl pattern: name appears before formal definition as a compression primer).
   - Pass 4C removes the Vermillion code block from §9 — confirm this doesn't break any external reference to the exact Vermillion format pattern from within §9.
