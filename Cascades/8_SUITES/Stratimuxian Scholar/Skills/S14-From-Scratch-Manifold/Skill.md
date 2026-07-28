# S14 — Stratimux From-Scratch Manifold

**Domain**: The complete from-scratch lifecycle for actualizing a new Stratimux Concept (or Concept cluster) where NO prior pattern exists in the project. Pre-implementation discipline (M58/M61/M63), Concept file structure baseline, Container Re-Muxification (CRM/SCT — M64), Card 18 verification protocol (M65/M67), Canonical Registry Source doctrine (M69), UX State Machine Completeness (M71 CSRP), and the 4-Layer Cinnabar Dialectic pre-commit gate (M72).
**Trigger**: Authoring a new Concept, Concept cluster, or container Concept from scratch; bringing a Stratimux pattern over from an authoritative reference project (ADMIN_ICP class); migrating a flat Concept cluster into a Container Re-Muxification.
**Status**: NEW Skill closing the from-scratch gap surfaced in B.7 Triple-Regression Arc (Cycles 125-135 of the SuiteCascadeSystem project). S1-S13 cover maintenance-of-established-pattern; S14 covers authoring-when-no-pattern-exists.

---

## Why This Skill Exists — The From-Scratch Gap

The other 13 Skills in this Suite 8 assume the builder is working within an established Stratimux pattern: a Concept already exists, a Quality is being added, a state field is being read. They govern how to do that correctly. They do NOT cover the moment when a builder is staring at an empty directory, knowing they need a new Concept, with no prior shape to copy from in the immediate project.

The B.7 Triple-Regression Arc proved this gap exists. The Container Re-Muxification (CRM) executed correctly because the builder had ADMIN_ICP's huirth Concept as a Copy-Paste-Plus reference (M63). But verification methodology was built from-scratch — and three sequential regressions surfaced three different verification gaps that no documented checklist had named.

**The "From-Scratch Manifold"** is the composite failure state that emerges when implementation OR verification is reasoned from first principles rather than from a verified, named realized pattern. Its symptoms:
1. The code compiles. `tsc` returns EXIT 0. The build is green.
2. The implementation diverges from the realized pattern in 2-4 specific, locality-bound ways.
3. Each divergence is in the "seam" between the new code and the existing system (not in the core logic).
4. Each divergence surfaces as a separate regression after the initial verification passes.

This Skill is the seven-section checklist that prevents from-scratch verification from masquerading as Lambda-event.

---

## §7.1 — Pre-Implementation Recognition Check (M58 / M61 / M63)

**The first question is never "how do I build this?" — it is "does this pattern already exist?"**

### Step 1 — Search Project Totality (M61 Project-Totality Authoritative Scope)

Before authoring a single line of a new Concept, run the recognition check.

```bash
# Search the current project for any existing pattern matching your intent
grep -rln "createConcept\|muxifyConcepts" src/ | head -30

# Search by domain keyword — what are you actually about to model?
grep -rln "{domain-keyword}" src/

# Search for similarly-named structures
grep -rln "{conceptName}\|{conceptName}Concept\|{ConceptName}Deck" src/
```

If the pattern exists in the current project → proceed to Step 3 (Copy-Paste-Plus).

### Step 2 — Search Authoritative Reference Projects (M58 Field-of-Poppies prevention)

If the project itself has no precedent, consult the canonical reference projects in the surrounding workspace:

```bash
# ADMIN_ICP is the canonical Huirth-pattern reference for the SCP-Origin ecosystem
ls -la /Users/{user}/Work/Stratithon/reference/beginning/ADMIN_ICP/src/lib/

# Search ADMIN_ICP for the pattern you are about to implement
grep -rln "huirth\|icp\|createICPConcept" /Users/{user}/Work/Stratithon/reference/beginning/ADMIN_ICP/src/

# Search the Stratimux reference repo for framework-level patterns
grep -rln "muxifyConcepts" /Users/{user}/Work/Stratithon/reference/Stratimux/src/
```

The M61 doctrine: the authoritative reference project's pattern supersedes any from-scratch reasoning. The pattern there is the *realized* pattern — internally consistent, runtime-verified, and battle-tested. From-scratch reasoning will produce something that compiles but diverges.

### Step 3 — Apply Copy-Paste-Plus (M63)

If a pattern is found (in current project or authoritative reference):

1. **Copy** the file structure verbatim — directory names, file names, type definitions, factory functions.
2. **Paste** into the new Concept's location, keeping the structural skeleton intact.
3. **Plus** the necessary adaptations:
   - Rename identifiers to the new domain
   - Substitute state fields for the new domain
   - Adjust Quality names to the new domain's actions
4. **Document the source**: every new file's top-line comment names the authoritative source it was Copy-Paste-Plus'd from.

```typescript
// File: src/lib/newConcept/newConcept.concept.ts
// Authoritative source: ADMIN_ICP/src/lib/huirth/huirth.concept.ts (Copy-Paste-Plus per M63)
// Domain adaptation: huirth → newConcept, ICP → NC
```

**Muxonomy-Aware Copy-Paste-Plus Source (S15 + S16 Pointer)**: For Concepts that need Muxonomy self-documentation (any Concept that will participate in the SCP Template runtime with `*.muxonomy.ts`, Diameter junction qualities, Vue handoff, or cross-WebSocket dispatch), M63 Copy-Paste-Plus applies at TWO levels: (1) base Concept files (`.type.ts` · `.state.ts` · `.concept.ts` · qualities/ · principles/) follow the Notification Concept structure; (2) Muxonomy layer files (`.muxonomy.ts` · `.concept.huirth.ts` / `.concept.client.ts`) follow the Notification Muxonomy structure. **S15 — Muxonomy Concept Authoring Patterns** provides the framework-level authoring checklist (FNES grammar · DCQF dual-concept-file split · DQWDS Diameter junctions with CISV Induction-suffix invariant · MSDT self-documentation · TOBM bridge model · ZKHP Vue handoff). **S16 — Notification Muxameter Exemplar** provides the Notification Concept as the M63 Copy-Paste-Plus source reference (file-by-file map · citation-grounded). Do NOT author a Muxonomy-aware Concept from first principles when Notification exists as a verified reference.

### Step 4 — Only If No Pattern Exists: Proceed to From-Scratch Authoring

If neither current project nor reference projects contain a precedent, only THEN proceed with from-scratch authoring — and apply §7.2-§7.7 with maximum rigor. The absence of a pattern is the high-risk path; the checklist is the substitute for the missing realized pattern.

---

## §7.2 — Concept File Structure (Copy-Paste-Plus Baseline)

Every Stratimux Concept lives in a self-named directory with a canonical file set. This structure is non-negotiable — its absence is itself a from-scratch deviation signal.

### Required Directory Layout

```
src/lib/{conceptName}/
├── {conceptName}.type.ts          # State type, Payload types, Deck type
├── {conceptName}.concept.ts       # createConcept factory + qualities mapping
├── {conceptName}.muxonomy.ts      # Muxonomy registration metadata (if applicable)
├── index.ts                       # Public exports
├── qualities/
│   ├── types.ts                   # Per-quality Payload types
│   ├── action1.quality.ts
│   ├── action2.quality.ts
│   └── ...
└── principles/                    # Optional — for reactive logic
    └── conceptPrinciple.principle.ts
```

### The Three Anchor Files

**`{conceptName}.type.ts`** — defines the State interface, the Quality types, and the Deck type. All three live here as the type substrate of the Concept.

```typescript
import type { Concept, Quality } from 'stratimux';

export type NewConceptState = {
  fieldOne: string;
  fieldTwo: number;
  fieldThreeList: string[];  // M60 — no optional `?` markers (S13)
};

export type NewConceptDoSomething = Quality<NewConceptState>;
export type NewConceptUpdateFieldOne = Quality<NewConceptState, { value: string }>;

export type NewConceptQualities = {
  newConceptDoSomething: NewConceptDoSomething,
  newConceptUpdateFieldOne: NewConceptUpdateFieldOne,
};

export type NewConceptDeck = {
  newConcept: Concept<NewConceptState, NewConceptQualities>;
};
```

**`{conceptName}.concept.ts`** — the factory function and explicit qualities mapping. The mapping is EXPLICIT (NEVER `typeof` — see S1 Anti-Patterns).

```typescript
import { createConcept } from 'stratimux';
import type { NewConceptState, NewConceptQualities } from './newConcept.type';
import { newConceptDoSomething } from './qualities/doSomething.quality';
import { newConceptUpdateFieldOne } from './qualities/updateFieldOne.quality';

const qualities: NewConceptQualities = {
  newConceptDoSomething,
  newConceptUpdateFieldOne,
};

export const createNewConcept = () => createConcept<NewConceptState, NewConceptQualities>(
  'newConcept',
  {
    fieldOne: '',
    fieldTwo: 0,
    fieldThreeList: [],
  },
  qualities,
  []
);
```

**`{conceptName}.muxonomy.ts`** — registration metadata when the Concept participates in a project-level Muxonomy registry (e.g., the SCS Bridge Concept registry).

### State Primitives Discipline (M60 — State-or-Payload Anor)

State fields MUST be serializable primitives, arrays, plain objects, Maps, or Sets — NOT ChildProcess, FSWatcher, ExpressApp, or any handle-class object. For non-serializable resources, use the MMUI Module-Map pattern (S13 §MMUI).

Verify: `grep -E "FSWatcher|ChildProcess|Socket" src/lib/{conceptName}/*.type.ts` → 0 hits.

---

## §7.3 — Container Concept Template (SCT 4 Invariants — M64)

**When the Concept is a Container-of-Parts** (composing multiple sibling Concepts under a single namespace), apply the Self-Named Container Template (SCT). The full 4-invariant pattern lives in S8 §Self-Named Container Template — this section is the from-scratch checklist for applying it.

### The 4 SCT Invariants (Quick Reference)

| # | Invariant | What to Check |
|---|-----------|---------------|
| 1 | Container name IS the muxonomy namespace | Directory name === Concept name === deck key |
| 2 | Siblings imported as native types | NO widening intermediary (no SMMC) — direct import from sibling's `.concept.ts` |
| 3 | Tier-2 DECK K access only | `d.{container}.d.{sibling}.k.{field}.select()` — ECK enforces no Tier 3 |
| 4 | Card 18 migration surface tracked | Any consumer of the renamed container key needs `src/`-scope grep |

### From-Scratch SCT Procedure

1. **Decide which Concepts compose**: list the sibling Concepts the container will compose. Each MUST be capable of Individuation (standing alone as a Base Concept).
2. **Self-name the directory**: `src/lib/{container}/` where `{container}` IS the future deck key.
3. **Author empty container state and qualities**: container has NO state of its own — it is the namespace.
4. **Compose via `muxifyConcepts([...siblings], base)`**: the factory pattern that locks the SCT contract.
5. **Author the DECK type**: siblings appear under the container's `d` property.
6. **Card 18 audit**: if this CRM renames an existing deck key, run §7.4 immediately.

See S8 §SCT for the complete code template and verification checklist.

---

## §7.4 — Card 18 Verification Protocol (M65 + M67)

**Any deck-key rename creates a Card 18 migration surface.** The verification protocol below is the prevention substitute for Regression #1 of B.7 (Cycle 128).

### Step 1 — Identify the Rename Surface

Before executing the rename, enumerate every site that consumes the OLD key:

```bash
# OLD key consumer enumeration
grep -rn "{oldKey}" src/ > /tmp/card18-old-key-sites.txt
wc -l /tmp/card18-old-key-sites.txt
```

Expected output: a non-zero count. Each line is a site that must be touched by the rename. Zero matches means either (a) the old key was never live, or (b) the grep scope was wrong — re-run from `src/`, not from a sub-directory.

### Step 2 — Apply the Rename

For each site in the enumeration, update from old key to new key. Edits should be exhaustive — no "I'll get to it later" deferrals.

### Step 3 — M65 Grep at `src/` Scope

After the rename, verify zero residual sites at PROJECT ROOT scope:

```bash
# M65 Concluder
grep -rn "{oldKey}" src/
# Expected: 0 matches (or only intentional residuals — migration comments, test fixtures)
```

**Why M65 is critical**: the B.7 Regression #1 failure was a directory-scoped grep that missed sibling directories. The fix was discipline: ALWAYS grep at `src/` (the project source root), NEVER at a sub-directory scope, for any renamed deck key.

### Step 4 — M67 Cast-Bypass Audit

TypeScript double-casts (`as unknown as { ... }`) bypass structural type checking. After a rename, EVERY cast site that approximates deck structure must be re-verified manually:

```bash
# M67 Concluder — locate all cast sites referencing deck structure
grep -rn "as unknown as" src/ | grep -E "deck|concept|\.d\.|\.k\."
```

For each hit:
- Read the cast carefully — does the structural approximation match the NEW deck shape?
- If yes, the cast is valid for the new key.
- If no, the cast is silently lying to tsc — fix immediately.

### Step 5 — Runtime Smoke for Cast-Bearing Plan Stages (M66 cross-reference)

Any plan stage that uses `as unknown as` for deck declarations CANNOT be verified by tsc alone. M66 mandates a runtime smoke: actually execute the plan stage, observe the runtime behavior, confirm the cast resolves to a real object. See S3 §M66 DiastrationIncludesRuntimeSmoke.

---

## §7.5 — Canonical Registry Source Doctrine (M69)

**When a Concept manages an inventory of registered items** (SCPs, plugins, sessions, any typed list), there is exactly ONE canonical source — and it is NOT the filesystem.

### The Failure Mode (B.7 Regression #2)

The `scpRegistryStartupRescan` quality was rewritten during the B.7 CRM to use `readdirSync(observedPath)` for startup enumeration. The filesystem returned 3 entries (`.staging`, `template`, `Test011`); the canonical registry file `SCPs.json` contained 1 entry (`Test011`). The state diverged from canonical truth, the admission ActionStrategy chain never fired, and `lifecycleByScp.size` stayed at 0. The TUI menu reported `anyScpsInstalled: false` despite a valid SCP being installed.

### The M69 Rule

**`readScpRegistry` (or its domain equivalent) is the authoritative inventory source.** Raw filesystem enumeration (`readdirSync`, `readdir`, `glob`) is the PHYSICAL substrate but is NOT a registry access pattern.

### From-Scratch Canonical Registry Procedure

1. **Identify the canonical registry file**: every registry-managing Concept has a JSON (or equivalent) file that records typed entries. Locate or define it.
2. **Author the canonical reader function**: `readRegistry()` (or `readScpRegistry`, `readSessionRegistry`, etc.) returns typed entries.
3. **Use the canonical reader EVERYWHERE inventory is read**: startup rescans, refresh events, status checks — all read through the same function.
4. **Never substitute filesystem enumeration**: a directory listing has access to non-registry artifacts (`.staging` sentinels, template directories, hidden files). It is not the same surface as the registry.

```typescript
// CORRECT — canonical registry reader
export const readScpRegistry = (basePath: string): ScpEntry[] => {
  const registryPath = path.join(basePath, 'SCPs.json');
  if (!fs.existsSync(registryPath)) return [];
  const raw = fs.readFileSync(registryPath, 'utf-8');
  return JSON.parse(raw) as ScpEntry[];
};

// WRONG — filesystem-as-registry anti-pattern
const scpNames = fs.readdirSync(observedPath); // Returns ['.staging', 'template', 'Test011'] — NOT the registry
```

### M69 Verification Concluder

```bash
# Verify zero filesystem-as-registry violations in production code paths
grep -rn "readdirSync\|fs.readdir" src/lib/{conceptName}/ | grep -v "test"
# Expected: 0 hits in registry-reading code paths
```

### Startup Admission Strategy (PDRC — Principle Dispatch Re-Confirm)

The B.7 Regression #2 also exposed a second failure mode: the startup rescan did not REPLAY the same ActionStrategy chain (`scpRegistryFsScpAdded`) that runtime filesystem events use. The startup path was silent — it read the registry but never dispatched admission actions.

**Rule**: a startup rescan must dispatch the same ActionStrategy chain as the runtime watcher would for each entry. This guarantees startup-state parity with runtime-event state.

See S7 §Startup Rescan as Admission Strategy Re-dispatch for the dispatch pattern (using `strategyBegin(createStrategy({ initialNode }))` for multi-dispatch from Method context).

---

## §7.6 — UX State Machine Completeness (M71 CSRP)

**When a Concept introduces a new synthetic identifier into a menu or navigation state machine**, EVERY structural slot must register the identifier. The failure mode (B.7 Regression #3) is a row that renders but is unreachable by keyboard navigation — silent on the page, invisible to traversal.

### The 7-Slot CSRP Checklist

For any new `SYNTHETIC_*` constant (or analogous menu-identifier), verify ALL 7 slots:

| # | Slot | Location |
|---|------|----------|
| 1 | Constant declaration | `const SYNTHETIC_NEW_ROW = 'synthetic_new_row';` |
| 2 | Type union membership | `type SyntheticRowId = SYNTHETIC_INSTALL | SYNTHETIC_NEW_ROW | ...` |
| 3 | rowId helper / isSyntheticRow predicate | `isSyntheticRow(id)` returns true for the new constant |
| 4 | Render path emission | `renderMenu` emits the row (conditionally or unconditionally) |
| 5 | Render path legacy (if exists) | `renderMenuLegacy` matches Slot 4 |
| 6 | Navigation up-branch | `applyKeypress case 'up'` has a branch for the new constant |
| 7 | Navigation down-branch | `applyKeypress case 'down'` has a branch for the new constant |

Additional slot (if applicable):
- **Enter handler**: `applyKeypress case '\r'` (or equivalent) has a branch for the new constant
- **Reserved lines**: if the new row adds a visible line, `RESERVED_LINES_WITH_*` constant updated AND used in both render and navigation pagination

### M71 Verification Concluder

```bash
# The new constant should appear in render + navigation + handler — count its occurrences
grep -c "{NEW_SYNTHETIC_CONSTANT}" src/lib/{menu-file}.ts
# Expected: at least 7 occurrences (one per slot)

# Build gate
npm run build && tsc --noEmit
# Expected: EXIT 0 for both
```

### Why M71 Cannot Be Detected by tsc

A `SYNTHETIC_*` constant that appears in the type union but is missing from a `case 'up'` branch is structurally valid TypeScript — the missing branch simply means the row is unreachable, not that the code is malformed. tsc EXIT 0 does NOT certify navigation graph completeness. M71 CSRP is the human checklist that compensates for the type system's blind spot.

---

## §7.7 — 4-Layer Cinnabar Dialectic Pre-Commit Gate (M72)

**The Cinnabar Dialectic** is the doctrinal name for the four-layer Verification Muxonomy proven by the B.7 Triple-Regression Arc. Each layer captures one architecturally-independent failure class. Together they compose the pre-commit gate for any migration-class change.

### The 4 Layers

| Layer | Domain | Codifying Rule | Question |
|-------|--------|----------------|----------|
| **L1** | Abstraction Identity | M58 Field-of-Poppies | Did we drift from the authoritative substrate? |
| **L2** | Verification Scope | M65 MigrationGrepScope | Did we grep `src/` for all consumers of any renamed key? |
| **L3** | Data Provenance | M69 Canonical-Registry-Source | Did every enumeration method source from the canonical registry? |
| **L4** | UX State Consistency | M71 CSRP | Does every new SyntheticRowId appear in BOTH render and navigation? |

### M72 — Cinnabar-Dialectic-Layer-Coverage (CANDIDATE)

**Statement**: For any migration-class change (Concept rename, container muxification, new synthetic identifier, startup rescan logic), verification MUST explicitly check ALL FOUR Cinnabar Dialectic layers before claiming Muxistration-complete.

**Layer-Coverage Invariant**: a migration is NOT Muxistration-complete until all four layers are checked AND cleared. Any one layer failing = a named regression class with a prescribed fix.

### M72 Pre-Commit Concluder

```bash
# L1 — Abstraction Identity
grep -rn "{oldDeckKey}\|{oldConceptName}" src/
# Expected: 0 hits (the old identity is fully retired)

# L2 — Verification Scope
grep -rn "{renamedKey}" src/ | wc -l
# Expected: positive count; all sites at src/ scope, NOT a sub-directory

# L3 — Data Provenance
grep -rn "readdirSync\|fs.readdir" src/lib/{registry-concept}/ | grep -v test
# Expected: 0 hits in registry-managing Concept production paths

# L4 — UX State Consistency
grep -c "{NEW_SYNTHETIC_CONSTANT}" src/lib/{menu-file}.ts
# Expected: ≥7 occurrences (CSRP 7-slot completeness)

# Final structural gate
npm run build && tsc --noEmit
# Expected: EXIT 0 for both
```

### Why M72 Compresses Four Rules Into One Gate

The 4 layers are architecturally INDEPENDENT — none subsumes another. Layer 2 (Scope) does not catch Layer 3 (Provenance); Layer 3 does not catch Layer 4 (UX); Layer 1 does not catch any of the others. Skipping a layer leaves a runtime gap that ONLY user-Lambda testing will surface.

M72 is the pre-commit gate that prevents from-scratch verification reasoning from passing-by-omission. The B.7 Triple-Regression Arc proved each layer in turn; M72 is the doctrinal compression that prevents the same three-regression sequence from recurring on the next CRM.

---

## From-Scratch Complete Circuit Example — The Huirth → SCP CRM

The canonical from-scratch circuit example is the Container Re-Muxification executed in B.7 (Cycles 128-135 of SuiteCascadeSystem).

### Pre-Implementation Recognition (§7.1)

The builder needed an SCP Container Concept composing `scpLifecycle`, `scpRegistry`, `scpSpawnManager`, `scpDockHost`, `scpRegistryWatcher` siblings.

**M61 search**: `grep -rn "huirth" /Users/{user}/Work/Stratithon/reference/beginning/ADMIN_ICP/src/` returned ADMIN_ICP's `huirth.concept.ts` as the authoritative SCT pattern.

**M63 Copy-Paste-Plus**: `huirth.concept.ts:58-74` was the verbatim template for `scp.concept.ts`. Identifier rename: `huirth` → `scp`, `ICP` → `SCP`. Structural skeleton preserved.

### Concept File Structure (§7.2)

```
src/lib/bridge/concepts/scp/
├── scp.type.ts          # ScpState, ScpDeck
├── scp.concept.ts       # createScpConcept factory + muxifyConcepts
├── scp.muxonomy.ts      # SCP Bridge Muxonomy registration
└── (no qualities — container has no state of its own)
```

### Container Concept Template (§7.3)

```typescript
// scp.concept.ts — SCT applied
export const createScpConcept = () => muxifyConcepts(
  [
    createScpLifecycleConcept(),
    createScpRegistryConcept(),
    createScpSpawnManagerConcept(),
    createScpDockHostConcept(),
    createScpRegistryWatcherConcept(),
  ],
  createConcept<ScpState, ScpQualities>('scp', {}, {}, [])
);
```

### Card 18 Verification (§7.4)

The CRM renamed `scsBridgeCore` → `scp`. M65 grep:

```bash
grep -rn "scsBridgeCore" src/
# 9 hits in src/lib/tui/animatedTui.ts — Regression #1 fix surface
# After hotfix: 0 hits — M65 satisfied
```

M67 cast audit:
```bash
grep -rn "as unknown as" src/lib/tui/animatedTui.ts | grep -E "deck|d\.scp"
# 1 hit at line 347 — cast structure updated to reflect 'scp' key
```

### Canonical Registry Discipline (§7.5)

The B.7 R5 of #2 hotfix replaced `readdirSync(observedPath)` with `readScpRegistry(basePath)` in `scpRegistryStartupRescan`. The startup rescan now sources from `SCPs.json` (canonical) and re-dispatches `scpRegistryFsScpAdded` for each entry via `strategyBegin(createStrategy({ initialNode }))` (S7 multi-dispatch pattern).

### UX State Machine Completeness (§7.6)

The B.7 R5 of #3 hotfix completed the CSRP 7-slot registration for `SYNTHETIC_INSTALL_SCP`. Pre-hotfix `grep -c SYNTHETIC_INSTALL_SCP src/lib/bridge/menu.ts` = 7 (incomplete). Post-hotfix count = 23 (complete navigation chain restored).

### 4-Layer Cinnabar Dialectic Gate (§7.7)

Each B.7 regression closed one layer:
- L1 (Abstraction Identity) — closed by M63 Copy-Paste-Plus from ADMIN_ICP huirth during initial CRM
- L2 (Verification Scope) — closed by Regression #1 hotfix (M65 codified)
- L3 (Data Provenance) — closed by Regression #2 hotfix (M69 codified)
- L4 (UX State Consistency) — closed by Regression #3 hotfix (M71 codified)

The post-Triple-Close debug.log (lines 94-126) recorded the Muxistration Proof: `lifecycleSize:1, latestAnyScpsInstalled:true`, `tui.launch.scp.start`, `tui.launch.scp.enqueued`. Test-011 smoke PASS.

---

## From-Scratch Anti-Pattern Recognition Table

| Symptom | Likely From-Scratch Deviation | Refer To |
|---------|------------------------------|----------|
| `tsc` EXIT 0 but runtime `TypeError: Cannot read properties of undefined` | M67 cast bypass — structural approximation lies to tsc | §7.4 Step 4 |
| Build green, file renders, but cursor skips it | M71 CSRP slot incomplete — render path has it, navigation does not | §7.6 |
| Count mismatch (filesystem reports N entries, registry reports M ≠ N) | M69 violation — `readdirSync` substituted for canonical reader | §7.5 |
| Quality compiles but state mutation never reaches downstream consumer | Admission ActionStrategy chain not re-dispatched at startup (PDRC) | §7.5 + S7 |
| `as unknown as { d: {...} }` cast in a plan stage | M67 risk — runtime smoke required (M66) | §7.4 + S3 |
| New deck key renamed but TUI/CLI consumer outside the Concept dir is broken | M65 violation — grep was sub-directory-scoped instead of `src/`-scoped | §7.4 Step 3 |
| Concept compiles but cannot be Individuated (extracted as standalone) | SCT Invariant 1 violation — coupling beyond the container key | §7.3 + S8 |
| Container's Qualities/Principles bloated with sibling-specific logic | SCT Invariant 4 violation — container should be empty namespace | §7.3 + S8 |

---

## Cross-Reference Map

| Concern | Skill |
|---------|-------|
| Four Pillars / Higher-Order paradigm / anti-patterns | S1 Framework Foundation |
| ECK Limitation / Tier-2 access mechanics | S2 StratiDECK Composition |
| External consumer deck access (`planAny` + `as unknown as`) | S2 §External Consumer Deck Access |
| Plan vs Principle context / Single Dispatch / stage options | S3 Planning Stage Control |
| M66 DiastrationIncludesRuntimeSmoke / M68 Menu-State-Binding | S3 §Migration-Class Verification Discipline |
| ActionStrategy graph and selectStratiDECK | S4 ActionStrategy Orchestration |
| Multi-dispatch from Method context (`strategyBegin`) | S7 §Principle-Side Dispatch / Startup Admission Re-dispatch |
| Plan vs principle dispatch / overflow prevention | S7 Dispatch Patterns |
| `observer.next` dispatch / M59 ActionQue Reservation | S7 §Principle-Side Dispatch |
| Self-Named Container Template (SCT 4 Invariants) | S8 §Self-Named Container Template |
| Container Re-Muxification (CRM — M64) | S8 §Container Re-Muxification |
| Card 18 Full-Surface Grep (M65 / M67) | S8 §Card 18 Full-Surface Grep Discipline |
| DECK K Constant Pattern / state-derived paths | S9 DECK K State Access |
| Quality patterns / M71 CSRP 7-slot checklist | S10 §Menu-State-Machine Quality Completeness |
| Integration smoke test pattern | S11 §Integration Smoke Pattern |
| Shortest Path Principle / reducer returns | S12 Reducer Performance |
| Canonical Registry Source (M69) / Dual-Registry Hazard / M70 | S13 §Canonical Registry Source Rule |
| MMUI Module-Map / non-serializable resources | S13 §MMUI Module-Map Pattern |

---

## §7 Verification Checklist (Aggregate)

Before marking a from-scratch Concept (or CRM) complete:
- [ ] §7.1 Recognition Check: searched current project + authoritative reference; pattern source documented or absence justified
- [ ] §7.2 File Structure: self-named directory; `.type.ts` + `.concept.ts` + `.muxonomy.ts` + qualities present; no optional state markers; no non-serializable state fields
- [ ] §7.3 SCT (if Container): 4 invariants satisfied; siblings Individuation-capable
- [ ] §7.4 Card 18: `grep -rn "{oldKey}" src/` = 0; every `as unknown as` cast site re-verified
- [ ] §7.5 Canonical Registry: filesystem enumeration absent from registry code paths; startup rescan re-dispatches admission ActionStrategy
- [ ] §7.6 CSRP (if menu-driven): 7-slot completeness verified for every new `SYNTHETIC_*` constant
- [ ] §7.7 M72 Cinnabar Dialectic: L1+L2+L3+L4 all checked and cleared
- [ ] Build gate: `npm run build` EXIT 0 + `tsc --noEmit` EXIT 0
- [ ] User-Lambda testing: ICSM-class smoke or equivalent runtime traversal recorded (debug.log / test artifact)

**The From-Scratch Manifold is closed when this checklist is closed.** Anything less is a regression-class risk surface waiting for user-Lambda testing to surface it.
