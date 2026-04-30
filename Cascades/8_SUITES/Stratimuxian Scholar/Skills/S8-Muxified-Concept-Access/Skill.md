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
