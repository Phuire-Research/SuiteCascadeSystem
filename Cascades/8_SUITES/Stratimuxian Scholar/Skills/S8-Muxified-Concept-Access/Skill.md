# S8 — Muxified Concept Access

**Domain**: Access patterns for muxified concepts through parent composition, TypeScript recursive type limitations, and explicit user decision patterns
**Trigger**: When accessing state or dispatching actions on concepts composed via muxifyConcepts(), or resolving type ambiguity between direct and muxified access
**STRATIMUX-REFERENCE.md**: Lines 2214-2400

---

## Muxified Concept Access Patterns (CRITICAL)

**When working with muxified concepts (concepts included in higher-order compositions), accessing their state and dispatching actions requires understanding the distinction between base concept access and muxified conceptual parts access.**

### Base Concept vs Muxified Conceptual Parts

#### Base Concept Access Pattern (Direct)
```typescript
// When working directly with a concept's own state and actions
muxium.plan<MyConceptDeck>('direct access', ({ stage, conclude }) => [
  stage(({ dispatch, d }) => {
    // Direct concept access via DECK
    const value = d.myConcept.k.property.select();
    
    // Direct action dispatch
    dispatch(d.myConcept.e.myAction({ data: value }), { 
      iterateStage: true 
    });
  }),
  conclude()
]);
```

#### Muxified Concept Access Pattern (Through Parent)
```typescript
// When accessing a muxified concept through its parent composition
muxium.plan<ParentDeck>('muxified access', ({ stage, conclude }) => [
  stage(({ dispatch, d }) => {
    // Accessing muxified concept through parent DECK
    const value = d.parent.d.childConcept.k.property.select();
    
    // Dispatching to muxified concept through parent
    dispatch(d.parent.d.childConcept.e.childAction({ data: value }), { 
      iterateStage: true 
    });
  }),
  conclude()
]);
```

### Outer Plan Dispatch Pattern for Muxified Concepts

**When working in outer plan context (via `muxium.plan()`), the dispatch pattern differs based on concept composition structure:**

#### Correct: Muxified Concept Dispatch
```typescript
// Pattern: d.parentConcept.d.childConcept.e.action()
muxium.plan<ParentDeck>('example operation', ({ stage, conclude }) => [
  stage(({ dispatch, d }) => {
    // Accessing muxified concept state
    const history = d.parent.d.childInterface.k.history.select();
    
    // Dispatching to muxified concept
    dispatch(d.parent.d.childInterface.e.updateBuffer({
      buffer: 'new data'
    }), { 
      iterateStage: true 
    });
  }),
  conclude()
]);
```

#### Wrong: Direct Concept Access on Muxified
```typescript
// WRONG: Attempting direct access to muxified concept
muxium.plan<ParentDeck>('broken operation', ({ stage, conclude }) => [
  stage(({ dispatch, d }) => {
    // WRONG: childInterface is not directly accessible
    const value = d.childInterface.k.property.select(); // TYPE ERROR
    
    // WRONG: Direct dispatch to muxified concept
    dispatch(d.childInterface.e.action(), {}); // TYPE ERROR
  }),
  conclude()
]);
```

### TypeScript Recursive Type Limitations

**Stratimux v0.3.2 StratiDECK cannot automatically determine whether a concept is accessed directly or through muxification due to TypeScript's recursive type limitations. This creates an ambiguity that requires explicit user decision.**

#### The Type Ambiguity Problem
```typescript
// TypeScript cannot distinguish between:
d.concept.k.property.select()         // Direct concept access
d.parent.d.concept.k.property.select() // Muxified concept access

// Both are valid TypeScript, but only one will work at runtime
// depending on the actual concept composition structure
```

### Explicit User Decision Pattern

**The developer must explicitly choose the correct access pattern based on their concept composition architecture:**

#### Decision Matrix
| Concept Relationship | Access Pattern | Example |
|----------------------|----------------|---------|
| **Direct Concept** | `d.concept.k.property.select()` | Concept is directly included in muxium |
| **Muxified Child** | `d.parent.d.child.k.property.select()` | Concept is included via `muxifyConcepts()` |
| **Nested Muxified** | `d.grandparent.d.parent.d.child.k.property.select()` | Multiple levels of composition |

#### Implementation Strategy
```typescript
// 1. Examine your concept composition
const parentConcept = createConcept('parent', {
  // ...parent state and qualities
}, [
  // ChildInterface is muxified INTO parent
  muxifyConcepts([childInterfaceConcept])
]);

// 2. Choose correct access pattern based on composition
muxium.plan<ParentDeck>('operation', ({ stage, conclude }) => [
  stage(({ dispatch, d }) => {
    // Since childInterface is muxified INTO parent,
    // use: d.parent.d.childInterface
    const value = d.parent.d.childInterface.k.buffer.select();
    
    dispatch(d.parent.d.childInterface.e.updateBuffer({
      buffer: value
    }), { iterateStage: true });
  }),
  conclude()
]);
```

### Correct Citation Examples

#### Example 1: Simple Muxified Access
```typescript
// Composition: parent contains childInterface
// Access Pattern: d.parent.d.childInterface

muxium.plan<ParentDeck>('clear suggestions', ({ stage, conclude }) => [
  stage(({ dispatch, d }) => {
    dispatch(d.parent.d.childInterface.e.clearSuggestion({}), { 
      iterateStage: true 
    });
  }),
  conclude()
]);
```

#### Example 2: Multi-Level Muxified Access
```typescript
// Composition: app contains parent, parent contains childInterface
// Access Pattern: d.app.d.parent.d.childInterface

muxium.plan<AppDeck>('complex operation', ({ stage, conclude }) => [
  stage(({ dispatch, d }) => {
    const buffer = d.app.d.parent.d.childInterface.k.dataBuffer.select();
    
    dispatch(d.app.d.parent.d.childInterface.e.parseInput({
      input: buffer
    }), { iterateStage: true });
  }),
  conclude()
]);
```

#### Example 3: Direct Concept Access (Non-Muxified)
```typescript
// Composition: concept is directly added to muxium
// Access Pattern: d.concept

muxium.plan<ConceptDeck>('direct operation', ({ stage, conclude }) => [
  stage(({ dispatch, d }) => {
    const value = d.concept.k.property.select();
    
    dispatch(d.concept.e.action({ data: value }), { 
      iterateStage: true 
    });
  }),
  conclude()
]);
```

**Key Insights:**
- **Composition Structure Determines Access**: The way concepts are composed determines the access pattern
- **TypeScript Cannot Help**: Due to recursive type limitations, compile-time checking cannot resolve the ambiguity
- **Developer Responsibility**: You must explicitly choose the correct pattern based on your architecture
- **Test-Driven Validation**: Use test files to validate that your chosen access pattern works correctly
- **Documentation Critical**: Document your concept composition structure for team clarity

This pattern is crucial for proper muxified concept interaction and prevents runtime errors in complex Stratimux applications.

---

## Self-Named Container Template (SCT — 4 Invariants)

**Doctrinal Origin**: Extracted from ADMIN_ICP huirth concept; actualized for SCP via Copy-Paste-Plus (M63) in Cycles 128-135 of the SuiteCascadeSystem project. Canonical reference: `ADMIN_ICP/src/lib/huirth/huirth.concept.ts:58-74` (factory function `createHuirthConcept`). The pattern produces a single named Container Concept whose deck key IS the muxonomy namespace for a cluster of sibling concepts.

**When the SCT Applies**: a Concept must compose multiple sibling Concepts under a single named container key — the from-scratch builder is creating the parent that other Concepts will see as `d.{container}.d.{sibling}`.

### The 4 SCT Invariants

| # | Invariant | Concrete Form |
|---|-----------|---------------|
| 1 | **Container Concept name IS the muxonomy namespace** | The string `'scp'` IS the deck key for ALL siblings — `d.scp.d.scpLifecycle`, `d.scp.d.scpRegistry`, etc. |
| 2 | **Sibling Concepts imported as native types** | NO widening intermediary type (no SMMC — Single-Muxified-Mock-Concept widening); siblings ride in via direct import from their `*.concept.ts` |
| 3 | **Tier-2 DECK K access ONLY** | Consumers reach state via exactly 2 tiers: `d.{container}.d.{sibling}.k.{stateField}.select()`. The ECK Limitation enforces this — no Tier 3 exists |
| 4 | **Card 18 migration surface tracked** | Any consumer of a renamed container key must be grep-swept at `src/` scope (NOT just the originating concept directory) — see Card 18 Full-Surface Grep below |

### SCT Code Shape (Copy-Paste-Plus Template)

```typescript
// File: src/lib/{containerName}/{containerName}.concept.ts
import { createConcept, muxifyConcepts } from 'stratimux';
import type { Concept } from 'stratimux';
import { createSibling1Concept } from './sibling1/sibling1.concept';
import { createSibling2Concept } from './sibling2/sibling2.concept';
import { createSibling3Concept } from './sibling3/sibling3.concept';

// Container has NO state of its own — namespace only
export type ContainerState = Record<string, never>;
export type ContainerQualities = Record<string, never>;

export const createContainerConcept = () => {
  // SCT Invariant 1: name = 'container' IS the muxonomy key
  const base = createConcept<ContainerState, ContainerQualities>(
    'container',
    {},
    {},
    [] // SCT Invariant 4: empty Principles at container level — siblings own their reactive logic
  );

  // SCT Invariant 2 + 3: siblings imported as native types, accessible at Tier 2
  return muxifyConcepts(
    [
      createSibling1Concept(),
      createSibling2Concept(),
      createSibling3Concept(),
    ],
    base
  );
};

// DECK type — siblings appear under `d` (Tier 2)
export type ContainerDeck = {
  container: Concept<ContainerState, ContainerQualities> & {
    d: {
      sibling1: ReturnType<typeof createSibling1Concept>;
      sibling2: ReturnType<typeof createSibling2Concept>;
      sibling3: ReturnType<typeof createSibling3Concept>;
    };
  };
};
```

### SCT Verification Checklist

Before considering an SCT-container Concept complete:
- [ ] Directory name === concept name === deck key (all three match)
- [ ] `muxifyConcepts([...siblings], baseContainer)` factory pattern used (NOT direct nesting)
- [ ] Container Qualities `{}` and Principles `[]` are empty (or near-empty)
- [ ] Each sibling concept is importable independently — Individuation Principle preserved
- [ ] DECK type exposes siblings under the container's `d` property at Tier 2

---

## Container Re-Muxification (CRM — M64)

**The Round-Trip Doctrine**: A Container Re-Muxification operates in two phases that must NOT be conflated.

### Phase 1 — Demuxify-for-Doctrine

When refactoring an existing flat-composed Concept cluster into an SCT container, FIRST extract each sibling Concept into its own self-named directory with full Quality independence. This is the "demuxify" phase — the cluster becomes a flat set of Base Concepts, each capable of Individuation.

The Demuxify phase satisfies M58 Field-of-Poppies and M63 Copy-Paste-Plus: each sibling concept exists in its authoritative form, derivable from the canonical pattern.

### Phase 2 — Re-Muxify-for-Composition

Once each sibling exists as an independent Base Concept, compose them through the SCT container (see "Self-Named Container Template" above). This is the "re-muxify" phase — the cluster gains its namespace key, consumers gain Tier-2 access, and the Container Concept becomes the unifying handle.

### Why CRM Matters (B.7 Compound-Context Evidence)

The B.7 Phase of the SuiteCascadeSystem project executed a CRM: the flat `scsBridgeCore` Concept cluster was demuxified into siblings (`scpLifecycle`, `scpRegistry`, `scpSpawnManager`, etc.), then re-muxified under the `scp` Container Concept. The CRM enabled clean Tier-2 access (`d.scp.d.scpLifecycle.k.lifecycleByScp.select()`) and identity-aligned naming.

The 3 sequential regressions that followed (Cycles 128-135) were NOT CRM failures — the round-trip itself was sound. Each regression surfaced a verification-discipline gap orthogonal to the CRM mechanic (see Card 18 Full-Surface Grep below).

### CRM Verification Checklist

- [ ] Each sibling Concept lives in its self-named directory (Demuxify phase complete)
- [ ] Each sibling can be imported and instantiated independently of the container
- [ ] Container Concept uses `muxifyConcepts([...siblings], base)` factory
- [ ] Container key matches container directory name matches container Concept name
- [ ] Card 18 Full-Surface Grep run for any renamed deck key (next subsection)

---

## Card 18 Full-Surface Grep Discipline (M65 + M67)

**The Verification Surface**: When a CRM renames the container's deck key (e.g., `scsBridgeCore` → `scp`), EVERY consumer of that key in the entire `src/` tree must be updated. The verification scope is NOT the originating Concept directory — it is the project root.

### M65 — MigrationGrepScope

**Rule**: For any renamed deck key consumed outside its originating Concept directory, the grep root MUST be `src/` (the project source root), not the Concept directory.

**Concrete shape**:
```bash
# WRONG (Cycle 128 regression cause): grep scoped to originating directory
grep -rn "scsBridgeCore" src/lib/bridge/
# Misses sibling directories like src/lib/tui/ that consume the renamed key

# CORRECT (M65 codification): grep scoped to src/
grep -rn "scsBridgeCore" src/
# Reaches all consumers: src/lib/tui/animatedTui.ts, tests, anywhere else
```

### M67 — CastEscapeRunsRiskOfTscBypass

**Rule**: TypeScript double-casts (`as unknown as { ... }`) silently bypass structural type checking. After any deck-key rename, audit ALL `as unknown as` sites that reference deck structure and verify they reflect the new shape.

**The Bypass Failure Mode** (Regression #1 of B.7, animatedTui.ts:347-409):
```typescript
// The cast told tsc "trust this shape" — tsc obliged with EXIT 0
const access = (planAny as unknown as {
  d: { scsBridgeCore: { d: { scpLifecycle: { ... } } } }
}).d.scsBridgeCore.d.scpLifecycle.k.lifecycleByScp.select();
// At runtime, the object had no `scsBridgeCore` key — it was `scp` now
// TypeError: Cannot read properties of undefined (reading 'd')
```

**Audit Protocol**:
```bash
# Locate every cast that approximates deck structure
grep -rn "as unknown as" src/ | grep -E "deck|concept|\.d\.|\.k\."

# For each hit, verify the structural approximation matches current deck shape
# Each cast site MUST be re-verified after any CRM or deck-key rename
```

### Card 18 Verification Checklist (Composed)

When closing a CRM-class change with renamed deck keys:
- [ ] M65: `grep -rn "{oldKey}" src/` returns 0 matches in production code paths
- [ ] M65: `grep -rn "{oldKey}" src/` accounts for any intentional residual references (test fixtures, migration comments)
- [ ] M67: Every `as unknown as` cast site referencing deck structure has been re-read and re-verified
- [ ] M67: Each cast site carries a comment naming the canonical type it approximates
- [ ] Runtime smoke executed on any plan stage that uses `as unknown as` deck declarations (see S3 M66 DiastrationIncludesRuntimeSmoke)

**Cross-references**: S14 §7.4 Card 18 Verification Protocol · S3 M66 DiastrationIncludesRuntimeSmoke · S2 External Consumer Deck Access (Card 18 TUI/CLI Pattern).

---

### Cross-WebSocket Induction Dispatch (S15 Pointer)

S8 governs muxified Concept access WITHIN a single Muxium boundary — `d.base.d.muxified.k.property.select()` etc., capped at Tier 2 by the ECK Limitation. When the access target lives in a SEPARATE Muxium (Client → Huirth across a WebSocket, or any Diameter junction boundary), the alternative pattern is the **Diameter junction Induction quality**: the muxified `webSocketClient` Concept owns an `actionQue: AnyAction[]` field; the Client-side `createDiametricQuality` reducer routes the dispatched action into that queue; the `webSocketClient` principle sends it across the boundary; the opposite side executes the Real quality by type-string lookup. Direct cross-boundary state access is NOT available at the DECK level — only the Induction-dispatch + ActionStrategy-result-data pattern. See **S15 §5 Diameter Qualities (DQWDS + CISV)** for the cross-WebSocket Induction-dispatch pattern, the `WithDiametricState<S>` intersection, and the CRITICAL Induction-suffix invariant (H1) that the routing pipeline depends on.
