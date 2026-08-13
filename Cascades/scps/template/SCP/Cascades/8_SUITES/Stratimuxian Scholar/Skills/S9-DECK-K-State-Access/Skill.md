# S9 — DECK K State Access

**Domain**: Reactive state access via the DECK K Constant Pattern across all execution contexts (principle, planning scope, createMethodWithConcepts)
**Trigger**: When implementing state selection, cross-concept state coordination, dynamic concept name resolution, or migrating from legacy state access patterns
**STRATIMUX-REFERENCE.md**: Lines 2402-2713

---

## DECK K Constant Pattern - Reactive State Access (v0.2.242+)

**The DECK K Constant Pattern is Stratimux's primary method for type-safe, reactive state access across all contexts. This pattern provides consistent state selection with automatic reactivity and performance optimization.**

### Pattern Architecture Overview

The `k` (K Constant) provides a reactive state selector interface that automatically adapts to the execution context:
- **Principle Context**: Direct access to concept's own state via `k.property.select()`
- **Planning Scope Context**: Cross-concept state access via `d.conceptName.k.property.select()`
- **Automatic Reactivity**: All selections are reactive and trigger re-evaluation on state changes
- **Type Safety**: Full TypeScript inference with compile-time validation

### Context-Aware Usage Patterns

#### 1. Principle Context Pattern (Within Concept's Own Principles)
**Use `k.property.select()` when accessing the concept's own state from within its principles:**

```typescript
// Within a principle of the myConcept
stage(({ k, dispatch, d }) => {
  // CORRECT: Direct access to own concept's state
  const currentValue = k.someProperty.select();
  const anotherValue = k.anotherProperty.select();
  const complexData = k.dataStructure.select();
  
  // State access is reactive and type-safe
  if (currentValue > 10) {
    dispatch(d.myConcept.e.processData({ value: currentValue }), {
      iterateStage: true
    });
  }
});
```

#### 2. Planning Scope Context Pattern (Cross-Concept Access)
**Use `d.conceptName.k.property.select()` when accessing any concept's state from planning scope:**

```typescript
// Within muxium.plan() or cross-concept operations
muxium.plan<MyConceptDeck>('reactive operation', ({ stage, conclude }) => [
  stage(({ d, dispatch }) => {
    // CORRECT: Access any concept's state via DECK
    const myConceptValue = d.myConcept.k.someProperty.select();
    const otherConceptValue = d.otherConcept.k.differentProperty.select();
    const sharedState = d.sharedConcept.k.globalData.select();
    
    // Reactive state comparison across concepts
    if (myConceptValue !== otherConceptValue) {
      dispatch(d.myConcept.e.synchronizeState({ 
        target: otherConceptValue 
      }), { iterateStage: true });
    }
  }),
  conclude()
]);
```

### Performance-Optimized State Selection

#### Efficient Single Property Access
```typescript
// OPTIMAL: Direct property selection
const isReady = k.isReady.select();
const currentCommand = k.currentCommand.select();
const userPreferences = k.userPreferences.select();

// Use selected values directly in conditional logic
if (isReady && currentCommand) {
  // Reactive logic executes only when these properties change
}
```

#### Reactive State Observation
```typescript
// REACTIVE: State changes trigger automatic re-evaluation
stage(({ k, dispatch, d }) => {
  const historyLength = k.commandHistory.select().length;
  const maxHistory = k.maxHistorySize.select();
  
  // Automatically triggers when history or max size changes
  if (historyLength > maxHistory) {
    dispatch(d.myConcept.e.trimHistory(), { iterateStage: true });
  }
});
```


### Working Implementation Examples

#### Interface State Management
```typescript
// Real-world example from Interface concept
stage(({ k, dispatch, d }) => {
  // Principle context - accessing own concept's state
  const currentCmd = k.currentCommand.select();
  const history = k.history.select();
  const available = k.availableCommands.select();
  
  // Reactive command validation
  if (currentCmd && !available.includes(currentCmd)) {
    dispatch(d.interface.e.setError({ 
      message: `Unknown command: ${currentCmd}` 
    }), { iterateStage: true });
  }
});

// Cross-concept orchestration
muxium.plan<AppDeck>('data processing', ({ stage, conclude }) => [
  stage(({ d, dispatch }) => {
    // Planning scope - accessing multiple concepts
    const command = d.interface.k.currentCommand.select();
    const clientReady = d.client.k.isReady.select();
    const serverState = d.server.k.connectionStatus.select();
    
    // Multi-concept reactive coordination
    if (command && clientReady && serverState === 'connected') {
      dispatch(d.client.e.executeOperation({ command }), { 
        iterateStage: true 
      });
    }
  }),
  conclude()
]);
```

### Critical Anti-Patterns to Avoid

#### Wrong Context Usage
```typescript
// DON'T use planning scope pattern in principle context
stage(({ k, d }) => {
  const wrong = d.myConcept.k.property.select(); // Redundant in principle
  const correct = k.property.select(); // Direct access in principle
});

// DON'T use principle pattern in planning scope without d prefix
stage(({ k }) => {
  const wrong = k.property.select(); // k is undefined in planning scope
  const correct = d.myConcept.k.property.select(); // Use DECK access
});
```

#### Legacy State Access
```typescript
// DON'T use deprecated state access methods
const state = muxium.getState(); // Legacy, non-reactive
const value = state.concept.property; // Direct state access

// DO use DECK K Constant Pattern
const value = d.concept.k.property.select(); // Reactive, type-safe
```

### Performance Benefits

#### Memory Efficiency
- **Selective Reactivity**: Only selected properties trigger re-evaluation
- **Lazy Evaluation**: State selections computed only when accessed
- **Automatic Optimization**: Framework handles subscription management

#### Type Safety Advantages
- **Compile-Time Validation**: TypeScript catches property access errors
- **IntelliSense Support**: Full auto-completion for state properties
- **Refactoring Safety**: Automated updates when state structure changes

### createMethodWithConcepts Deck K Usage Pattern

**Critical Pattern**: For ActionStrategy qualities that need dynamic concept name resolution, use `createMethodWithConcepts` with the DECK K pattern to access both concept state and metadata.

#### Dynamic Concept Name Resolution
```typescript
import { createMethodWithConcepts, strategyBegin, muxiumConclude } from 'stratimux';

// CORRECT: createMethodWithConcepts with DECK K pattern
export const actionStrategyQuality = createQualityCardWithPayload<
  ConceptState,
  PayloadType,
  ConceptDeck  // CRITICAL: Include deck type parameter
>({
  type: 'concept action strategy',
  reducer: nullReducer, // No immediate state change - handled by ActionStrategy
  methodCreator: () => createMethodWithConcepts(({ action, concepts_, deck }) => {
    const { param1, param2 } = action.payload;
    
    // Get dynamic concept name using DECK K pattern
    const conceptName = deck.conceptName.k.getName(concepts_) || 'defaultConceptName';
    
    // Get state using DECK K pattern with undefined check
    const state = deck.conceptName.k.getState(concepts_);
    if (state === undefined) {
      return muxiumConclude(); // Exit early if state unavailable
    }
    
    // Access state properties safely
    const someProperty = state.someProperty;
    const anotherProperty = state.anotherProperty;
    
    // Perform logic with state data
    const targetItem = Object.values(state.items).find(item => 
      item.name === param1 || item.id === param1
    );
    
    // Early exit if required data not found
    if (targetItem?.id === undefined) {
      return muxiumConclude();
    }
    
    // Create strategy with dynamic concept name and state data
    const strategy = createActionStrategy(
      deck,
      conceptName,
      param1,
      param2,
      targetItem.id,
      someProperty
    );
    
    if (strategy) {
      return strategyBegin(strategy);
    }
    
    return muxiumConclude();
  })
}) as ActionStrategyQuality;
```

#### Key Pattern Elements

1. **`createMethodWithConcepts`**: Provides access to `concepts_` parameter for dynamic resolution
2. **`deck.conceptName.k.getName(concepts_)`**: Gets dynamic concept name at runtime
3. **`deck.conceptName.k.getState(concepts_)`**: Gets full concept state safely
4. **State validation**: Always check for `undefined` state before proceeding
5. **Early returns**: Use `muxiumConclude()` for invalid states or missing data
6. **Type safety**: Include proper deck type parameter in quality definition

#### Critical Requirements

- **Always check state for `undefined`** before accessing properties
- **Use `muxiumConclude()` for early exits** instead of throwing errors
- **Include full deck type parameter** in quality type definition
- **Provide fallback concept names** with `|| 'defaultName'` pattern
- **Validate required data existence** before creating strategies

#### Usage Context

This pattern is essential for:
- **ActionStrategy qualities** that access muxified concept state
- **Cross-concept operations** requiring runtime concept identification
- **Composable qualities** that work across different concept configurations

### Debugging & Troubleshooting

#### Common State Access Issues
```typescript
// SOLUTION: Verify context and use appropriate pattern
// In principle context:
const value = k.property.select();

// In planning scope:
const value = d.conceptName.k.property.select();

// In createMethodWithConcepts context:
const state = deck.conceptName.k.getState(concepts_);
const conceptName = deck.conceptName.k.getName(concepts_);
```

#### Type Inference Problems
```typescript
// If TypeScript can't infer types, ensure proper DECK typing:
muxium.plan<MyConceptDeck>('operation', ({ stage, conclude }) => [
  stage(({ d }) => {
    // Now d.myConcept.k has full type inference
    const typedValue = d.myConcept.k.property.select();
  }),
  conclude()
]);

// For createMethodWithConcepts, include deck type parameter:
createQualityCardWithPayload<State, Payload, ConceptDeck>({
  methodCreator: () => createMethodWithConcepts(({ concepts_, deck }) => {
    // Full type inference available
  })
})
```

### Migration Guide from Legacy Patterns

#### From Direct State Access
```typescript
// OLD: Direct state manipulation
const state = muxium.getState();
const value = state.concept.property;

// NEW: DECK K Constant Pattern
const value = d.concept.k.property.select();
```

#### From Manual Subscriptions
```typescript
// OLD: Manual subscription management
const subscription = muxium.subscribe(state => {
  const value = state.concept.property;
  // Manual update logic
});

// NEW: Automatic reactive selection
stage(({ d }) => {
  const value = d.concept.k.property.select();
  // Automatic reactivity and re-evaluation
});
```

**The DECK K Constant Pattern is the foundation of reactive state management in Stratimux v0.2.242+. Master this pattern for efficient, type-safe, and maintainable Stratimux applications.**
