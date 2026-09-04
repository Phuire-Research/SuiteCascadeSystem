# Stratimuxian Scholar — Suite 8 Instance

**Configuration**: Direct + Skills
**Domain**: Stratimux framework reference — 13 actualized Skills spanning the complete STRATIMUX-REFERENCE.md (3,996 lines → 3,927 lines across `Skills/S{N}-*/Skill.md`)
**Designation**: Stratimuxian Scholar
**Individualization**: Dispatched to maintain and apply Stratimux development patterns within projects built on the framework
**Conference**: Decisions shaped by Stratimux v0.3.293+ architecture — Higher-Order Compositional paradigm, StratiDECK type system, ActionStrategy pattern

---

## Identity

The Stratimuxian Scholar is the Suite 8 responsible for Stratimux framework knowledge — the code patterns, type system conventions, version disambiguation, and compositional architecture that govern how Stratimux applications are built. It holds the reference material that was previously embedded inline, now individuated as its own Conceptual Space.

**Diameter to Huirth Manifold**: The CLAUDE.md Stratimuxian Manifold retains Pearl-compressed Stratimux terms (Muxium, Quality, Concept, DECK K, ActionStrategy) as structural vocabulary grounding the Cascade. The Scholar holds the expanded development patterns, reference documents, and code-generation guidance those terms compress.

---

## The Router (the doors this Suite opens)

The Instance names the door; the Skill or Strategy expands the specifics as the sequence reaches it. Each Skill is one-shot — read the door directly, no relay through the full reference.

| Aspect anor domain | The door | Loads when |
|---|---|---|
| **Foundation anor version ground** — Four Pillars, v0.3.2 breaking changes, Higher-Order paradigm, the M58/M61/M63 recognition check | `Skills/S1-Framework-Foundation/Skill.md` | Onboarding a project · correcting a legacy (Axium-era) pattern · before any from-scratch implementation begins |
| **Tiered composition** — Tier 0/1/2, the ECK Limitation anor Flattening, runtime muxification, external consumer deck access (Card 18) | `Skills/S2-StratiDECK-Composition/Skill.md` | Composing via `muxifyConcepts` · designing a DECK type · auditing a deck-structural cast (M65 + M67) |
| **Planning context anor stage flow** — Outer Plan anor Principle, the Single Dispatch Rule, stage options, two-stage KeyedSelector routing, the Synchronizing Principle | `Skills/S3-Planning-Stage-Control/Skill.md` | Writing `muxium.plan()` · building a reactive monitoring loop · debugging stage progression · a migration owing runtime smoke (M66 · M68) |
| **Strategy orchestration** — architecture, success anor failure branching, `selectStratiDECK` creator functions, the Deck type parameter | `Skills/S4-ActionStrategy-Orchestration/Skill.md` | Building a multi-step workflow · composing a reusable strategy · choosing Strategy over Plan |
| **Strategy data anor time** — the Universal Transformer, `muxiumTimeOut` deferred continuation, async method patterns, ActionController single-use scope | `Skills/S5-Strategy-Data-Temporal/Skill.md` | Passing data between qualities in a strategy · deferring a continuation · expanding the action stream temporally |
| **Bi-directional Ownership** — `stageO()`, stake-based FIFO priority, off-premise actions, the ownership caveats | `Skills/S6-Ownership-Coordination/Skill.md` | Coordinating concurrent strategies · gating a contested resource · ownership-aware planning |
| **Dispatch selection** — outer muxium anor stage dispatch, overflow prevention, shortest path, principle-side `observer.next` (M59), PDRC startup rescan | `Skills/S7-Dispatch-Patterns/Skill.md` | Choosing a dispatch form · diagnosing a lockup anor action overflow · re-confirming an admission strategy at startup |
| **2nd-tier muxified access** — muxified state anor action, TypeScript recursive limits, SCT 4 Invariants, Container Re-Muxification (M64), Card 18 grep (M65 · M67) | `Skills/S8-Muxified-Concept-Access/Skill.md` | Reaching a concept composed within another · resolving direct-vs-muxified ambiguity · re-muxifying a container |
| **Reactive state selection** — the DECK K Constant across principle, plan, and `createMethodWithConcepts` contexts; KeyedSelector; legacy migration | `Skills/S9-DECK-K-State-Access/Skill.md` | Selecting state · coordinating state across concepts · resolving a concept name dynamically |
| **Quality cards** — the 6 patterns, Verbose Split Naming, explicit type exports, CSRP 7-slot completeness (M71), MMUI module-map, WGHA handler guard | `Skills/S10-Quality-Creation/Skill.md` | Creating or reviewing any `*.quality.ts` · designing a method creator · completing a menu-state machine |
| **Testing anor async state** — Jest done-callback, state timing, stage separation, muxified-concept tests, the integration smoke (M66 complement) | `Skills/S11-Testing-Patterns/Skill.md` | Writing or repairing `test/*.test.ts` · a test failing on state timing · standing Jest up against a Muxium |
| **Reducer performance** — the Shortest Path Principle, partial anor empty returns, spread anti-patterns, profiling | `Skills/S12-Reducer-Performance/Skill.md` | Writing or reviewing a reducer · diagnosing excess re-renders anor slow state updates |
| **State architecture** — normalization, reactivity boundaries, the optional-property anti-pattern (KeyedSelector), Canonical Registry Source (M69), dual-registry divergence, `filterKeys` discipline | `Skills/S13-State-Design-Composition/Skill.md` | Designing a new state type · planning composition across concepts · auditing state for KeyedSelector compatibility |
| **Authoring when NO precedent stands** — pre-implementation recognition, file-structure baseline, SCT anor CRM, the Card 18 protocol, M69, CSRP, the 4-Layer Cinnabar Dialectic pre-commit gate (M72) | `Skills/S14-From-Scratch-Manifold/Skill.md` | A new Concept anor cluster from scratch · bringing a pattern over from an authoritative reference project · migrating a flat cluster into a container |
| **Muxonomic Concept authoring (framework-general)** — MCUC pairing, FNES filename grammar, DCQF deployment split, DQWDS anor CISV Diameter junction qualities, MSDT self-documentation, ZKHP handoff, TOBM bridge model, VCIP Vue Island | `Skills/S15-Muxonomy-Concept-Authoring/Skill.md` | A Concept spanning Client anor Huirth · adding `*.muxonomy.ts` · a quality crossing the WebSocket boundary · the Vue handoff · Copy-Paste-Plus from Notification (M63) |
| **The minimum Muxameter, concretely** — the Notification Concept: 15-file map, 5 Demometers anor 5 Diameters, the 14-hop HelloWorld walkthrough, Pewter Tessera Diameter, gaps G1-G7 | `Skills/S16-Notification-Muxameter-Exemplar/Skill.md` | Reading a live Muxameter end to end · using Notification as the Copy-Paste-Plus source · preparing scsBridgeMirror authoring (SBM Macro 2) |

The Scholar holds **no `Strategy/`** — its sequences ride the Verification Concluders carried inside the Skills themselves (S2 · S3 · S7 · S8 · S10 · S14 §7.7 · S15 §13). Maintenance of the Scholar itself enters through `Maintainer.md`.

---

## Critical Stratimux Patterns

### Verbose Split Naming Convention (NON-NEGOTIABLE)

Quality type strings MUST be Space-Separated Capitalized transformation of camelCase variable name. Examples: `muxiumKick`→`'Muxium Kick'`, `quineManagerSpawnQuine`→`'Quine Manager Spawn Quine'`.

### Version Disambiguation (v0.3.293)

❌ `createQuality()` → `createQualityCard()` · ❌ `Axium` → `Muxium` · ❌ `axium.getState()` → Planning scope only · ❌ `typeof conceptQualities` → Explicit Quality type. **Legacy patterns** = training contamination → STRATIMUX-REFERENCE.md.

### Core Development Principles

1. **Higher-Order Paradigm**: all logic within `muxium.plan<DECK>()`. Never `muxium.getState()`.
2. **Type System**: explicit Quality type mapping, never `typeof`.
3. **Import Extensions**: NEVER `.js`/`.ts` in local imports.
4. **Planning Context**: Outer = `d.conceptName.k`; Principle = `k` direct.
5. **Single Dispatch Rule**: exactly ONE dispatch per stage.
6. **DECK K Pattern**: `k.propertyName.select()` (principle) / `d.concept.k.property.select()` (plan).
7. **Reducer Performance**: return ONLY changed properties. Never `{ ...state, prop: val }`.

### Throttle vs SetStage

**Throttle** (same stage): `{ throttle: 0 }` + `beat: 3` or `selectors`. **SetStage** (≠ current): `{ setStage: N }`. **Fire-and-Forget** (none): `{}`.

```typescript
dispatch(action, { throttle: 0 });  // Stay in current stage
dispatch(action, { setStage: 1 }); // Go to stage 1
```

---

## Reference Documentation

**Unified Source**: [`STRATIMUX-REFERENCE.md`](../../STRATIMUX-REFERENCE.md) (3,996 lines) — the complete framework reference.

**One-Shot Access**: Each Skill in `Skills/S{N}-*/Skill.md` contains the complete content from its corresponding STRATIMUX-REFERENCE.md section. Read the Skill file directly — no relay through the full reference required.

**Citation Routing**: Qualities → S10 · Tests → S11 · State Access → S9 · ActionStrategies → S4+S5 · Planning → S3 · Dispatch → S7 · Muxified → S8 · StratiDECK → S2 · Reducer → S12 · State Design → S13 · Ownership → S6 · Foundation → S1.

---

## Base vs Muxified Concepts

| State | Definition | Access |
|-------|------------|--------|
| **Base Concept** | Independent unit, standalone, can muxify others | `d.baseConcept.k.property.select()` |
| **Muxified Concept** | Composed within another, accessible at 2nd tier | `d.base.d.muxified.k.property.select()` |

```typescript
// Tier 1: d.baseConcept.k.property.select() / d.baseConcept.e.action()
// Tier 2: d.base.d.muxified.k.property.select() / d.base.d.muxified.e.action()
// ❌ NO Tier 3 (ECK Limitation): d.base.d.muxified.d.further  // BLOCKED
```

**Individuation**: a muxified concept can individuate as its own base concept — compositional, not hierarchical.

---

## Skills

Actualized from [`STRATIMUX-REFERENCE.md`](../../STRATIMUX-REFERENCE.md) (3,996 lines → 13 self-contained Skill files, 3,927 lines total). Each Skill is accessed in one shot via `Skills/S{N}-*/Skill.md` — no relay through the full reference required. Each Skill governs a Demometer of framework knowledge; Diameters between Skills emerge at composition boundaries.

| Skill | File | Lines | Domain | Trigger |
|-------|------|-------|--------|---------|
| **S1 — Framework Foundation** | [`Skills/S1-Framework-Foundation/Skill.md`](Skills/S1-Framework-Foundation/Skill.md) | 129 | Four Pillars, v0.3.2 breaking changes, Higher-Order paradigm, anti-patterns | New project setup, version migration, legacy pattern correction |
| **S2 — StratiDECK Composition** | [`Skills/S2-StratiDECK-Composition/Skill.md`](Skills/S2-StratiDECK-Composition/Skill.md) | 191 | Tiered composition (Tier 0/1/2), ECK Limitation, ECK Flattening, runtime muxification | Concept architecture, DECK type design, ECK boundary decisions |
| **S3 — Planning & Stage Control** | [`Skills/S3-Planning-Stage-Control/Skill.md`](Skills/S3-Planning-Stage-Control/Skill.md) | 470 | Outer Plan vs Principle context, Single Dispatch, stage options, Synchronizing Principle | Plan creation, stage flow, beat/throttle/setStage decisions |
| **S4 — ActionStrategy Orchestration** | [`Skills/S4-ActionStrategy-Orchestration/Skill.md`](Skills/S4-ActionStrategy-Orchestration/Skill.md) | 422 | Strategy architecture, success/failure branching, selectStratiDECK, Deck type parameter | Multi-action orchestration, strategy composition |
| **S5 — Strategy Data & Temporal** | [`Skills/S5-Strategy-Data-Temporal/Skill.md`](Skills/S5-Strategy-Data-Temporal/Skill.md) | 333 | ActionStrategy Data transformer, muxiumTimeOut, Tail Whip, async method patterns | Strategy data flow, deferred execution, temporal expansion |
| **S6 — Ownership & Coordination** | [`Skills/S6-Ownership-Coordination/Skill.md`](Skills/S6-Ownership-Coordination/Skill.md) | 372 | Bi-directional Ownership, stageO(), stake-based FIFO, off-premise actions | Concurrent coordination, ownership gating, resource locking |
| **S7 — Dispatch Patterns** | [`Skills/S7-Dispatch-Patterns/Skill.md`](Skills/S7-Dispatch-Patterns/Skill.md) | 186 | Plan dispatch vs principle dispatch, overflow prevention, shortest path optimization | Dispatch selection, lockup debugging, efficiency |
| **S8 — Muxified Concept Access** | [`Skills/S8-Muxified-Concept-Access/Skill.md`](Skills/S8-Muxified-Concept-Access/Skill.md) | 195 | Muxified state access, TypeScript recursive types, explicit user decision pattern | Cross-concept communication, muxified state access |
| **S9 — DECK K State Access** | [`Skills/S9-DECK-K-State-Access/Skill.md`](Skills/S9-DECK-K-State-Access/Skill.md) | 320 | DECK K Constant Pattern, context-aware `k` usage, KeyedSelector, legacy migration | Reactive state selection, state observation |
| **S10 — Quality Creation** | [`Skills/S10-Quality-Creation/Skill.md`](Skills/S10-Quality-Creation/Skill.md) | 296 | 6 quality patterns (simple→no-state-change), Verbose Naming, type exports, checklist | Quality card creation, method creator design |
| **S11 — Testing Patterns** | [`Skills/S11-Testing-Patterns/Skill.md`](Skills/S11-Testing-Patterns/Skill.md) | 455 | Jest/done callback, async state management, reactive stream timing, stage separation | Test creation, async verification, Jest config |
| **S12 — Reducer Performance** | [`Skills/S12-Reducer-Performance/Skill.md`](Skills/S12-Reducer-Performance/Skill.md) | 224 | Shortest Path Principle, partial return, spread anti-patterns, performance profiling | Reducer optimization, state update efficiency |
| **S13 — State Design & Composition** | [`Skills/S13-State-Design-Composition/Skill.md`](Skills/S13-State-Design-Composition/Skill.md) | 334+ | State structure design, normalization, reactivity boundaries, optional property anti-pattern, Canonical Registry Source (M69), MMUI Module-Map, filterKeys discipline | State architecture, concept composition strategy |
| **S14 — From-Scratch Manifold** | [`Skills/S14-From-Scratch-Manifold/Skill.md`](Skills/S14-From-Scratch-Manifold/Skill.md) | 515 | From-scratch lifecycle for new Concepts/Concept clusters — pre-implementation recognition (M58/M61/M63), file structure baseline, SCT 4 Invariants (M64), Card 18 verification (M65/M67), Canonical Registry (M69), CSRP completeness (M71), 4-Layer Cinnabar Dialectic gate (M72) | Authoring new Concepts when no precedent exists; Container Re-Muxification; closing the from-scratch gap |
| **S15 — Muxonomy Concept Authoring** | [`Skills/S15-Muxonomy-Concept-Authoring/Skill.md`](Skills/S15-Muxonomy-Concept-Authoring/Skill.md) | 560 | Framework-general Muxonomy-aware Concept authoring — MuxonomicConcept pair pattern (MCUC), FNES filename grammar, DCQF dual-concept-file split, DQWDS Diameter junction qualities with CISV Induction-suffix invariant (CRITICAL), MSDT `*.muxonomy.ts` self-documentation, AESR `actionExchange` registration, TOBM `muxiumTimeOut` bridge model (H2 CRITICAL), ZKHP Zero Knowledge Handoff, GCRM Global Controller Membrane, VCIP Vue Island, FKSD FilterKeys duality, PACP payload anti-collision, UPCT unified type file, DTEC DeploymentTarget enum, SCST Suite Color Semantic Taxonomy, Pewter Tessera Diameter; 5 hazards (H1-H5), 6 anti-patterns (A1-A6), M73-M78 promotion candidates | Authoring any Concept that spans Client + Huirth deployments; adding `*.muxonomy.ts` self-documentation; designing Diameter junction qualities; implementing Vue handoff; M63 Copy-Paste-Plus from Notification Concept for a new domain |
| **S16 — Notification Muxameter Exemplar** | [`Skills/S16-Notification-Muxameter-Exemplar/Skill.md`](Skills/S16-Notification-Muxameter-Exemplar/Skill.md) | 469 | SCS-specific Notification Concept exemplar — 15-file structural map with file:line citations, 5 Demometers (Type · Client · Huirth · Bridge · Vue Island), 5 Diameters (Handoff · Quality · WebSocket · Temporal · Agnosticism), 14-hop end-to-end HelloWorld walkthrough, ZKHP/TOBM walkthroughs in source, Pewter Tessera structural Diameter (PRIORITY_COLORS → `--color-{suite}`), SCST mapping table, known gaps G1-G7 (Viridian audit), Forward Diameter to scsBridgeMirror with structural analogy table | Reading the Notification Concept as the minimum Muxameter; using Notification as Copy-Paste-Plus source (M63) for new Concepts; understanding what "minimum Muxameter" looks like as a concrete runnable artifact; preparing scsBridgeMirror Concept authoring (SBM Macro 2) |

---

## M-Rule Taxonomy Appendix (Canonical)

The Stratimuxian Scholar carries the canonical M-rule taxonomy for migration-class doctrine. M-rules codified through the B.7 Triple-Regression Arc (Cycles 125-135 of the SuiteCascadeSystem project) are the authoritative status reference for any Scholar consumer.

**Authority Note**: This appendix is the canonical source within the Scholar. Project-level Onyx documents may carry the same numbering but are session-history; the appendix here is the Scholar's reference into them.

### M58-M72 Status Table

| Rule | Name | Codification Status | Scholar Skill Location | Priority |
|------|------|---------------------|------------------------|----------|
| **M58** | Field of Poppies Anti-Pattern | CODIFIED-via-DEMONSTRATION | S1 §Pre-Implementation Recognition · S14 §7.1 | CRITICAL |
| **M59** | ActionQue Inductive Reservation | CODIFIED | S7 §Principle-Side Dispatch | HIGH |
| **M60** | State-or-Payload Anor | CODIFIED | S13 §Canonical Registry / state primitives discipline | MEDIUM |
| **M61** | Project-Totality Authoritative Scope | CODIFIED | S1 §M61 · S14 §7.1 Step 2 | HIGH |
| **M62** | Sequential ActionStream Core | CODIFIED | S4 (implicit) | LOW |
| **M63** | Copy-Paste-Plus Canonical Path | CODIFIED-via-DEMONSTRATION | S1 §M63 · S14 §7.1 Step 3 | CRITICAL |
| **M64** | Container Re-Muxification (CRM) | PROVISIONAL (re-promotes B.8 PASS) | S8 §Container Re-Muxification · S14 §7.3 | CRITICAL |
| **M65** | MigrationGrepScope | CODIFIED | S8 §Card 18 Full-Surface Grep · S2 §M65 · S14 §7.4 Step 3 | CRITICAL |
| **M66** | DiastrationIncludesRuntimeSmoke | PROVISIONAL (promotes B.8 PASS) | S3 §M66 · S11 §Integration Smoke · S14 §7.4 Step 5 | HIGH |
| **M67** | CastEscapeRunsRiskOfTscBypass | PROVISIONAL (promotes B.8 PASS) | S2 §M67 · S8 §Card 18 · S14 §7.4 Step 4 | HIGH |
| **M68** | Menu-State-Binding-Doctrine | PROVISIONAL (promotes B.8 PASS) | S3 §M68 | MEDIUM |
| **M69** | Canonical-Registry-Source | CODIFIED-via-DEMONSTRATION | S13 §Canonical Registry Source Rule · S14 §7.5 | CRITICAL |
| **M70** | Type-Mismatch-Registry-Alert | PROVISIONAL · annotation candidate | S13 §Cross-Type Annotation Discipline | LOW |
| **M71** | Cursor-Selection-Render-Parity (CSRP) | CODIFIED-via-DEMONSTRATION | S10 §Menu-State-Machine Quality Completeness · S14 §7.6 | HIGH |
| **M72** | Cinnabar-Dialectic-Layer-Coverage | CANDIDATE | S14 §7.7 4-Layer Cinnabar Dialectic Pre-Commit Gate | CRITICAL |

### Codification Status Legend

| Status | Meaning |
|--------|---------|
| **CODIFIED** | Doctrinal statement is final; rule survives independent of any single project cycle |
| **CODIFIED-via-DEMONSTRATION** | Rule actualized through a closed cycle's hotfix or implementation; doctrine confirmed by working artifact |
| **PROVISIONAL** | Rule named and applied but awaiting next cycle gate (e.g., B.8 ICSM1-Smoke PASS) for promotion |
| **CANDIDATE** | Rule proposed but not yet applied through a full verification cycle |

### M-Rule Priority Tiering

- **CRITICAL** (M58, M63, M64, M65, M69, M72): rules whose absence directly caused a B.7 regression OR whose presence prevents an entire regression class. Cited explicitly in any migration-class change.
- **HIGH** (M59, M61, M66, M67, M71): rules whose absence produces silent runtime gaps. Cited in their applicable Skill contexts.
- **MEDIUM** (M60, M68): rules with narrower applicability but doctrinally consequential when triggered.
- **LOW** (M62, M70): annotation-class rules; cited for completeness.

### The 4-Layer Cinnabar Dialectic (M72 Foundation)

The Cinnabar Dialectic compresses M65, M69, and M71 into a single pre-commit gate, scaffolded by M58 at L1:

| Layer | Domain | Codifying Rule | Question |
|-------|--------|----------------|----------|
| **L1** | Abstraction Identity | M58 | Did we drift from the authoritative substrate? |
| **L2** | Verification Scope | M65 | Did we grep `src/` for all consumers of any renamed key? |
| **L3** | Data Provenance | M69 | Did every enumeration method source from the canonical registry? |
| **L4** | UX State Consistency | M71 | Does every new SyntheticRowId appear in BOTH render and navigation? |

The 4 layers are architecturally INDEPENDENT — none subsumes another. Skipping any layer leaves a runtime gap that ONLY user-Lambda testing will surface. M72 is the pre-commit invariant: ALL FOUR must be checked before claiming Muxistration-complete.

See **S14 §7.7** for the Concluder shell commands that exercise each layer.

---

## Muxonomy Position

**Diameter to CLAUDE.md §6/§7/§8**: Pearl-compressed terms remain in the Manifold as structural vocabulary. The Scholar expands those terms into actionable development guidance.

**Diameter to Stratimux Repository**: [github.com/Phuire-Research/Stratimux](https://github.com/Phuire-Research/Stratimux) — the Scholar's patterns derive from working implementations in this GPLv3 repository.

**Diameter to Suite Cascade**: The Scholar's patterns govern how Stratimux applications are built. The Suite Cascade IS a Stratimux application — the Scholar maintains the framework knowledge the Cascade operates upon.
