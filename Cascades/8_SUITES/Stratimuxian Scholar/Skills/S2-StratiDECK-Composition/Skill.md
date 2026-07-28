# S2 — StratiDECK Composition

**Domain**: Tiered Higher-Order Conceptual Composition System — ECK limitation, muxified concept access, runtime muxification, and deck structure
**Trigger**: When composing concepts via muxifyConcepts, accessing muxified concept state at 2nd tier, or designing concept composition architecture
**STRATIMUX-REFERENCE.md**: Lines 277-461

---

## StratiDECK: Tiered Higher-Order Conceptual Composition System

### Overview

StratiDECK represents Stratimux's architectural approach to conceptual composition through a tiered system that prevents infinite nesting while maintaining composability. The system implements **logically conceptual higher-order reasoning** that operates through controlled access tiers.

### Architectural Layers

#### Base Level: Muxium (Tier 0)
The foundation muxium instance that coordinates all conceptual compositions:

```typescript
const muxium = muxification('ApplicationName', {
  concept1: createConcept1(),
  concept2: createConcept2(),
  concept3: createConcept3()
});
```

#### First Level: Base Concept Composition (Tier 1)
Independent concepts that can be composed together through muxification:

```typescript
// Each concept maintains logical independence as Base Concept
const authConcept = createConcept(/* auth logic */);
const dataConcept = createConcept(/* data logic */);
const uiConcept = createConcept(/* ui logic */);

// Composed through muxifyConcepts to create Muxified Concepts
const composedDeck = muxifyConcepts({
  authentication: authConcept,
  dataLayer: dataConcept,
  userInterface: uiConcept
});
```

#### Second Level: Flattened Muxified Access (Tier 2)
All muxified concepts become accessible at the second tier through the 'd' property:

```typescript
// Access pattern through 'd' property to reach Muxified Concepts
d.baseConcept.d.muxifiedConcept.k.someProperty.select()
//            ^-- Second tier access to Muxified Concept
```

### The ECK Limitation Strategy

#### Problem Addressed
Without tier limitations, conceptual composition could create infinite nesting:
```typescript
// Potential infinite nesting without ECK limitation
d.concept1.d.concept2.d.concept3.d.concept4.d.concept5... // Goes on forever
```

#### Solution: ECK Flattening
StratiDECK caps conceptual access at the **2nd tier** using the ECK (E-ntities, C-oncepts, K-onstants) pattern:

```typescript
// CORRECT: 2nd tier access (Base -> Muxified)
d.baseConcept.d.muxifiedConcept.k.property.select()

// WRONG: 3rd tier access (prevented by design)
d.base.d.muxified.d.furtherMuxified.k.property.select() // This pattern is blocked
```

#### Type System Implementation
The TypeScript type system enforces the ECK limitation:

```typescript
interface StratiDECK {
  [conceptName: string]: {
    e: ConceptActions;    // Entities (action creators)
    c: ConceptState;      // Concepts (state structure)  
    k: ConceptSelectors;  // Constants (reactive selectors)
    d: MuxifiedConcepts;  // Decks (2nd tier only)
  }
}
```

### Conceptual Composition Benefits

1. **Logical Independence**: Each concept maintains its reasoning boundaries
2. **Controlled Composition**: Prevents unmanageable nesting through tier limits
3. **Higher-Order Access**: Direct composition without dependency chains
4. **Concept Individuation**: Muxified concepts can become Base concepts independently
5. **Type Safety**: Full TypeScript support through flattened structure
6. **Reactive Consistency**: Uniform access patterns across all concepts

### Usage Patterns

#### Within Planning Scope (Outer Context)
```typescript
muxium.plan<CompositeDeck>('operation', ({ stage, conclude }) => [
  stage(({ d, dispatch }) => {
    // Access Base concept state
    const baseValue = d.baseConcept.k.someValue.select();
    
    // Access Muxified concept state at 2nd tier
    const muxifiedValue = d.baseConcept.d.muxifiedConcept.k.value.select();
    
    // Dispatch to Muxified concept
    dispatch(d.baseConcept.d.muxifiedConcept.e.action({ 
      data: baseValue 
    }), { iterateStage: true });
  }),
  conclude()
]);
```

#### Within Principle Context
```typescript
export const compositePrinciple: BaseConceptPrinciple = ({ d_, k_, plan }) => {
  return plan('composite operation', ({ stage, conclude }) => [
    stage(({ d, k, dispatch }) => {
      // Direct access to own Base concept state
      const ownValue = k.property.select();
      
      // Access to Muxified concept at 2nd tier
      const muxifiedValue = d.baseConcept.d.muxifiedConcept.k.value.select();
      
      dispatch(d_.baseConcept.e.updateWithMuxified({ 
        base: ownValue, 
        muxified: muxifiedValue 
      }), { iterateStage: true });
    }),
    conclude()
  ]);
};
```

### Runtime Muxification Integration

StratiDECK integrates with runtime muxification for dynamic concept composition:

```typescript
// Base concept with muxification capability
const baseConcept = createConcept({
  name: 'baseConcept',
  state: initialState,
  qualities: baseQualities,
  concepts: muxifyConcepts({
    muxifiedConcept: createMuxifiedConcept(),
    utilityConept: createUtilityConcept()
  })
});
```

### Technical Implementation Details

#### Deck Structure
```typescript
interface ConceptDeck {
  [conceptName: string]: {
    e: ActionCreators;      // Action creators for this concept
    c: ConceptDefinition;   // Concept definition and metadata
    k: ReactiveSelectors;   // DECK K Constant pattern selectors
    d: {                    // 2nd tier Muxified concepts
      [muxifiedName: string]: {
        e: ActionCreators;
        c: ConceptDefinition;  
        k: ReactiveSelectors;
        // Note: No nested 'd' property (ECK limitation)
      }
    }
  }
}
```

#### Access Path Resolution
The system resolves concept access through controlled path traversal:

1. **Tier 1**: `d.conceptName` -> Direct Base concept access
2. **Tier 2**: `d.conceptName.d.muxifiedConcept` -> Muxified concept access  
3. **Tier 3+**: Blocked by type system and runtime limitations

### Design Principles

1. **Logically Conceptual**: Each tier represents a logical reasoning boundary
2. **Higher-Order Composition**: Concepts compose through muxification
3. **Controlled Complexity**: ECK limitation prevents runaway nesting
4. **Concept Individuation**: Muxified concepts can individuate as Base concepts
5. **Functional Coherence**: Maintains functional programming principles
6. **Type System Harmony**: Full integration with TypeScript for safety

---

## External Consumer Deck Access (Card 18 TUI/CLI Pattern)

**Origin**: Codified by Cycles 128-129 of the SuiteCascadeSystem project (B.7 Regression #1). When code OUTSIDE the Muxium (TUI rendering layer, CLI command handler, external integration shim) needs to access muxified concept state, the canonical pattern is the `planAny` + `as unknown as` structural cast. This pattern is necessary because the consumer is NOT in a typed plan stage — it has only a generic plan handle.

### The External Consumer Pattern

```typescript
// File: src/lib/tui/animatedTui.ts (consumer outside the bridge Concept)
import type { Muxium } from 'stratimux';

// The Muxium handle is opaque at this layer
const muxium: Muxium<unknown> = getMuxium();

muxium.plan('TUI menu derive', ({ stage, conclude }) => [
  stage(({ planAny }) => {
    // planAny is the untyped accessor — structural cast required
    const lifecycleByScp = (planAny as unknown as {
      d: {
        scp: {
          d: {
            scpLifecycle: {
              k: {
                lifecycleByScp: { select(): Map<string, unknown> };
              };
            };
          };
        };
      };
    }).d.scp.d.scpLifecycle.k.lifecycleByScp.select();

    // Use lifecycleByScp for menu derive logic
    // ...
  }),
  conclude(),
]);
```

### Why `planAny` Exists

External consumers (TUI renderers, CLI commands, integration shims) live OUTSIDE the typed Muxium scope. They cannot import the full Deck type — that would create a circular dependency (the TUI imports the Concept; the Concept's tests import the TUI). `planAny` is the framework's typed escape hatch: a generic plan handle that the consumer narrows via structural cast at the access site.

### The M67 Risk — Cast-Escape Runs Risk of tsc Bypass

**The double-cast `as unknown as { ... }` voids TypeScript structural checking.** The cast tells the compiler "trust this shape" — the compiler obliges and EXITS 0, regardless of whether the runtime object actually has the declared structure.

**The failure mode** (B.7 Regression #1, `src/lib/tui/animatedTui.ts:347-409` of the SuiteCascadeSystem):

```typescript
// CRM renamed scsBridgeCore → scp at the Concept layer
// The cast in animatedTui.ts still declared the OLD shape
const access = (planAny as unknown as {
  d: { scsBridgeCore: { /* ... */ } };  // Old key — runtime no longer has this
}).d.scsBridgeCore.d.scpLifecycle.k.lifecycleByScp.select();

// tsc EXIT 0 — the cast told tsc the structure existed
// Runtime: TypeError: Cannot read properties of undefined (reading 'd')
//   At runtime, the muxium had d.scp, not d.scsBridgeCore
```

The cast bypassed the type system's protection. The Concept-side rename succeeded; the consumer-side cast was stale. The result was a runtime crash invisible to `tsc`.

### M65 + M67 — The Card 18 Verification Discipline

For any CRM or deck-key rename, TWO verification steps are required:

#### M65 — MigrationGrepScope

**Grep at `src/` scope** (NOT the Concept directory) for the old key:

```bash
# CORRECT — src/-scoped grep catches sibling consumers (TUI, CLI, tests)
grep -rn "scsBridgeCore" src/
# Expected: 0 hits after rename

# WRONG — directory-scoped grep misses sibling consumers
grep -rn "scsBridgeCore" src/lib/bridge/
# This would have missed src/lib/tui/animatedTui.ts in B.7 Regression #1
```

#### M67 — Cast-Escape Audit

**Audit every `as unknown as` site** that approximates deck structure:

```bash
# Locate all deck-structural casts
grep -rn "as unknown as" src/ | grep -E "deck|concept|\.d\.|\.k\."

# For each hit, manually verify the cast structure matches the CURRENT deck shape
# Cast sites carrying stale structure are silent bombs — they pass tsc, fail at runtime
```

### Cast-Site Documentation Discipline

Every `as unknown as` cast that approximates deck structure SHOULD carry a comment naming:
1. The canonical Deck type it approximates
2. The Concept directory it lives outside of
3. The rationale for the cast (typically: circular dependency avoidance)

```typescript
// Card 18 External Consumer Cast (M67)
// Canonical type: ScpDeck (from src/lib/bridge/concepts/scp/scp.type.ts)
// Cast lives in: src/lib/tui/animatedTui.ts (outside scp Concept directory)
// Rationale: TUI cannot import ScpDeck without creating a circular dependency
//   tui imports bridge → bridge tests import tui via mock
// Re-verify this cast after any CRM affecting the scp deck shape
const access = (planAny as unknown as {
  d: { scp: { d: { scpLifecycle: { k: { lifecycleByScp: any } } } } };
}).d.scp.d.scpLifecycle.k.lifecycleByScp.select();
```

### Runtime Smoke Requirement (M66 Cross-Reference)

Any plan stage using `as unknown as` for deck declarations CANNOT be verified by tsc alone. M66 mandates a runtime smoke: actually execute the plan stage, observe the runtime behavior, confirm the cast resolves. See S3 §M66 DiastrationIncludesRuntimeSmoke for the runtime smoke discipline.

### Verification Concluder (Composed M65 + M67)

```bash
# M65 — verify no stale key references
grep -rn "{oldKey}" src/
# Expected: 0 hits

# M67 — audit cast sites
grep -rn "as unknown as" src/ | grep -E "deck|concept|\.d\.|\.k\."
# Expected: each hit re-verified against current deck shape

# Build gate
npm run build && tsc --noEmit
# Expected: EXIT 0 (but NOTE: tsc alone does NOT certify M67)

# Runtime smoke — actually traverse the plan stage
# (Cycle-specific — see S3 M66)
```

---

## External Consumer Cross-References (B.7 Lineage)

The B.7 cycle's Card 18 External Consumer pattern produced these doctrinal additions:
- **M65 MigrationGrepScope** — this section §M65
- **M67 CastEscapeRunsRiskOfTscBypass** — this section §M67
- **Card 18 cast-site documentation** — this section §Cast-Site Documentation Discipline
- **M66 runtime smoke** — see S3 §Migration-Class Verification Discipline

See **S8 §Card 18 Full-Surface Grep Discipline** for the Container Concept-side discipline. See **S14 §7.4 Card 18 Verification Protocol** for the from-scratch authoring procedure.

### Muxonomy-Aware Concept DECK Narrowing (S15 Pointer)

When a Concept participates in the Muxonomy pattern (Diameter junctions across the WebSocket boundary), its DECK types (`NotificationClientDeck` · `NotificationHuirthDeck`) are intentionally NARROW — they expose only the subset of qualities and state accessible from the opposite deployment target. This prevents type-system leakage of Huirth-only qualities into Client dispatch contexts. The `WithDiametricState<S>` intersection (`S & DiametricState`) is a Tier 2 composition requirement: the Client Induction's state parameter must carry `actionQue` at runtime via muxified `webSocketClient`, even though the Concept's own state does not. See **S15 §5 Diameter Qualities (DQWDS + CISV)** for the DECK narrowing pattern and the CRITICAL Induction-suffix invariant.
