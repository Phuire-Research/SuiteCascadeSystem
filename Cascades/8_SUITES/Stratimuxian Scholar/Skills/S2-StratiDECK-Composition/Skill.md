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
