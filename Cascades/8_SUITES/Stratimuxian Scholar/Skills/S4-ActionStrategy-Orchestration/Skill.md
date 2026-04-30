# S4 — ActionStrategy Orchestration

**Domain**: ActionStrategies for orchestrated action sequences — creation approaches, method creator patterns, selectStratiDECK pattern for strategy creator functions, best practices, and execution flow
**Trigger**: When building multi-step action workflows, composing strategy creator functions, using strategyBegin/strategyDetermine in qualities, or needing reusable action orchestration across concepts
**STRATIMUX-REFERENCE.md**: Lines 926-1340

---

## ActionStrategies - Orchestrated Action Sequences

**ActionStrategies are the foundation of complex action orchestration in Stratimux, providing reusable, composable sequences of actions.**

### Understanding ActionStrategies vs Plans

**Critical Distinction**: ActionStrategies are **NOT** the same as planning within qualities:
- **ActionStrategies**: Pre-defined sequences of actions that can be reused across different contexts
- **Plans**: Dynamic, recursive stages that respond to state changes in real-time
- **Usage**: ActionStrategies are ideal for fixed workflows; Plans are ideal for reactive logic

### ActionStrategy Architecture

**ActionStrategies are explicit data structures** that define orchestrated action sequences. They are **consumed with no active parts** - pure data that describes what should happen when executed.

#### Key Concept: Functions Compose Strategies
ActionStrategies use **function composition** to build explicit data structures that Stratimux can execute. The strategy itself is immutable data; functions are used to compose and construct these data structures.

#### Creating ActionStrategies - Multiple Approaches

**Approach 1: Inline Strategy Creation**
```typescript
// In a principle or quality - direct inline creation
const initializeAction = d_.myConcept.e.initialize({
  configName: configName
});
const contextSwitchAction = d_.myConcept.e.switchContext({
  contextName: contextName,
  availableContexts: allAvailableContexts,
  contextData: configInfo.flatList
});

// Create explicit data structure using composition functions
const strategy = createStrategy({
  topic: 'Initializing Configuration Sequence', 
  initialNode: createActionNode(initializeAction, {
    successNode: createActionNode(contextSwitchAction)
  })
});

// Execute the explicit data structure
dispatch(strategyBegin(strategy), { iterateStage: true });
```

**Approach 1b: Inline ActionStrategy with Functional Composition**
```typescript
// Direct inline functional composition - perfect for principles
dispatch(strategyBegin(
  createStrategy({
    topic: 'Register Data Sources for Sync',
    initialNode: createActionNode(d.syncConcept.e.registerDataSource({
      key: 'primary_data_source',
      keyedSelector: k_.primaryData,
      encrypted: false
    }), {
      successNode: createActionNode(d.syncConcept.e.registerDataSource({
        key: 'secondary_data_source',  
        keyedSelector: k_.secondaryData,
        encrypted: false
      }))
    })
  })
), { setStage: 1 });

// Key Benefits:
// No separate function definition needed
// Functional composition creates explicit data structure
// Immediate execution with strategyBegin()
// Perfect for principles that need action sequences
// Maintains reactive recursion flow with stage control
```

**Approach 2: Function-Composed Strategy Builder**
```typescript
// strategies/exampleStrategy.ts
import { createActionNode, createStrategy, ActionStrategy, ActionStrategyParameters } from 'stratimux';
import type { Deck } from 'stratimux';
import type { MyConceptDeck } from '../myConcept.concept';

export const myStrategyTopic = 'My Strategy Topic';

// Function that composes an ActionStrategy data structure
export function myStrategy<T extends Deck<MyConceptDeck>>(
  deck: Partial<T>,  // Partial to handle unloaded concepts
  param1: string,
  param2: number
): ActionStrategy | undefined {
  // Guard against missing concept
  if (!deck.myConcept) {
    return undefined;
  }
  
  // Extract actions from deck
  const { actionOne, actionTwo, actionThree } = deck.myConcept.e;
  
  // Build strategy in reverse order (last to first) using composition functions
  const stepThree = createActionNode(actionThree({ 
    data: 'complete' 
  }), {
    successNotes: {
      preposition: 'and finally',
      denoter: 'process completed.',
    },
  });
  
  const stepTwo = createActionNode(actionTwo({ 
    value: param2 
  }), {
    successNode: stepThree,
    successNotes: {
      preposition: 'then',
      denoter: 'value processed;',
    },
  });
  
  const stepOne = createActionNode(actionOne({ 
    text: param1 
  }), {
    successNode: stepTwo,
    successNotes: {
      preposition: 'First',
      denoter: 'initialization started;',
    },
  });
  
  // Create the explicit ActionStrategy data structure
  const params: ActionStrategyParameters = {
    topic: myStrategyTopic,
    initialNode: stepOne,
  };
  
  // Return immutable data structure (not a function)
  return createStrategy(params);
}
```

**Approach 3: Simple Sequential Strategy**
```typescript
// For simple sequential actions
const actions = [actionOne(), actionTwo(), actionThree()];
const strategy = createStrategy({
  topic: 'Simple Sequential Actions',
  initialNode: actions.reduce((next, action, index) => 
    createActionNode(action, index < actions.length - 1 ? { successNode: next } : {})
  )
});
```

#### Core Architecture Principles

1. **Explicit Data Structures**: ActionStrategies are pure data, not executable code
2. **Function Composition**: Use functions like `createStrategy()` and `createActionNode()` to build data structures
3. **Immutable**: Once created, strategies are immutable data that can be safely passed around
4. **Consumed by Execution**: `strategyBegin()` consumes the data structure and creates executable runtime behavior

### Using ActionStrategies in Qualities

#### Method Creator Pattern with Deck Loading
```typescript
// qualities/myQuality.quality.ts
import { createMethodWithState, strategyBegin } from 'stratimux';
import { myStrategy } from '../strategies/myStrategy';

export const myQuality = createQualityCardWithPayload<
  MyConceptState,
  MyPayload
>({
  type: 'my quality action',
  reducer: (state, action) => {
    // Reducer logic
    return { /* changed properties only */ };
  },
  methodCreator: () => createMethodWithState<
    MyConceptState,     // State type
    MyPayload,          // Payload type
    MyConceptDeck       // Deck type - CRITICAL for muxified access
  >(({ action, deck }) => {
    if (action.strategy) {
      const { param1, param2 } = selectPayload<MyPayload>(action);
      
      // Create strategy instance
      const strategy = myStrategy(deck, param1, param2);
      if (strategy) {
        // Return strategyBegin() directly - DON'T dispatch
        return strategyBegin(strategy);
      }
    }
    
    return action;
  })
});
```

### Critical TypeScript Pattern - Deck Type Parameter

**Due to TypeScript's recursive type limitations, the deck type must be explicitly provided:**

```typescript
// WRONG - Missing deck type parameter
methodCreator: () => createMethodWithState<State, Payload>(({ action, deck }) => {
  // deck will have incomplete type information
})

// CORRECT - Explicit deck type parameter
methodCreator: () => createMethodWithState<
  State,
  Payload,
  ConceptDeck  // Critical third parameter
>(({ action, deck }) => {
  // deck now has full muxified concept access
})
```

### selectStratiDECK Pattern for Strategy Creator Functions

**Critical Pattern**: Strategy Creator Functions should always return `ActionStrategy | undefined` and accept `deck: unknown` due to TypeScript's design limitations with type parameter constraints.

#### The Problem: TypeScript Type Parameter Constraints

TypeScript's design creates unavoidable issues when dealing with complex muxified concept access in ActionStrategy functions:

```typescript
// PROBLEMATIC: TypeScript constraint issues with complex deck types
export function myStrategy<T extends Deck<ComplexDeck>>(
  deck: Partial<T>,  // TypeScript struggles with complex type constraints
  payload: MyPayload
): ActionStrategy | undefined {
  // Type inference breaks down
}
```

#### The Solution: Strategy Creator Function Pattern

**CRITICAL RULE**: All Strategy Creator Functions must follow this exact pattern:

```typescript
import { 
  createActionNode, 
  createStrategy, 
  selectStratiDECK,
  type ActionStrategy,
  type StratiDECK
} from 'stratimux';

// CORRECT: Strategy Creator Function Pattern
export function dataTransferStrategy(
  deck: unknown,  // ALWAYS use unknown type due to TypeScript design limitations
  transferPayload: DataTransferPayload
): ActionStrategy | undefined {  // ALWAYS return ActionStrategy | undefined
  
  // Access muxified concepts using selectStratiDECK with explicit Concept types
  const sourceDeck: StratiDECK<SourceConcept> | undefined = selectStratiDECK<SourceConcept>(
    deck, 
    sourceConceptName
  );
  
  const targetDeck: StratiDECK<TargetConcept> | undefined = selectStratiDECK<TargetConcept>(
    deck, 
    targetConceptName
  );
  
  // Guard clause: Return undefined if concepts unavailable
  if (!sourceDeck || !targetDeck) {
    console.warn('Strategy: Cannot create strategy - missing required concepts');
    return undefined;
  }
  
  // Access state safely after selectStratiDECK verification
  const currentSourceId = sourceDeck.k.currentSourceId.select();
  const sourceData = sourceDeck.k.sourceData.select();
  const currentBuffer = targetDeck.k.dataBuffer.select();
  const targetData = sourceData[transferPayload.targetId];
  
  // Build action chain in reverse order (last action first)
  const finalAction = createActionNode(
    sourceDeck.e.updateTrackingState({ buffer: targetData?.entries || [] }),
    {
      successNotes: { 
        preposition: 'Finally', 
        denoter: 'strategy completed successfully.' 
      }
    }
  );
  
  const middleAction = createActionNode(
    targetDeck.e.replaceDataBuffer({
      buffer: targetData?.entries || [],
      sourceId: transferPayload.targetId
    }),
    {
      successNode: finalAction,
      successNotes: { 
        preposition: 'then', 
        denoter: 'data buffer replaced;' 
      }
    }
  );
  
  const initialAction = createActionNode(
    sourceDeck.e.saveCurrentData({
      sourceId: currentSourceId,
      newBuffer: currentBuffer || []
    }),
    {
      successNode: middleAction,
      successNotes: { 
        preposition: 'First', 
        denoter: 'current data saved;' 
      }
    }
  );
  
  // Create and return ActionStrategy
  return createStrategy({
    topic: `Coordinated Data Transfer to ${transferPayload.targetId}`,
    initialNode: initialAction
  });
}
```

#### Critical Pattern Requirements

1. **Function Signature**:
   ```typescript
   export function strategyName(
     deck: unknown,  // ALWAYS unknown due to TypeScript limitations
     payload: PayloadType
   ): ActionStrategy | undefined  // ALWAYS this return type
   ```

2. **selectStratiDECK Usage**:
   ```typescript
   const conceptDeck: StratiDECK<ConceptType> | undefined = selectStratiDECK<ConceptType>(
     deck, 
     conceptName
   );
   ```

3. **Guard Clause Pattern**:
   ```typescript
   if (!requiredDeck1 || !requiredDeck2) {
     return undefined; // Graceful failure when concepts unavailable
   }
   ```

4. **Explicit Deck Usage**:
   ```typescript
   // In vast majority of cases, use the explicit deck as 'd'
   const state = conceptDeck.k.property.select();
   const action = conceptDeck.e.action({ data });
   ```

#### Why This Pattern is Mandatory

- **TypeScript Design Limitation**: Complex type constraints cause compilation failures
- **Muxified Concept Access**: Only way to safely access composed concepts
- **Type Safety**: Provides full type safety after selectStratiDECK verification
- **Graceful Degradation**: Returns undefined when concepts unavailable
- **Consistency**: Standardized pattern across all Strategy Creator Functions

#### Strategy Creator Function Checklist

- [ ] Function accepts `deck: unknown`
- [ ] Function returns `ActionStrategy | undefined`
- [ ] Uses `selectStratiDECK<ConceptType>()` for concept access
- [ ] Includes guard clause returning `undefined` for missing concepts
- [ ] Accesses state/actions through verified deck references
- [ ] Creates strategy with `createStrategy()` and returns it

This pattern is the **only reliable way** to create Strategy Creator Functions that work with muxified concepts while avoiding TypeScript's type parameter limitations.

### ActionStrategy Best Practices

1. **Directory Structure**: Store strategies in `/strategies` folder within concept
2. **Reusability**: Design strategies to be reusable across different contexts
3. **Error Handling**: Always check for concept availability with guards
4. **Node Order**: Build action nodes in reverse order (last to first)
5. **Return Pattern**: Return `strategyBegin(strategy)` in method creators, don't dispatch

### When to Use ActionStrategies vs Plans

**Use ActionStrategies when:**
- You have a fixed sequence of actions
- The workflow is reusable across multiple contexts
- The logic doesn't require reactive state monitoring
- You need to compose complex multi-step operations

**Use Plans when:**
- You need reactive behavior based on state changes
- The flow is dynamic and conditional
- You need stage persistence and flow control
- The logic is specific to a single context

### ActionStrategy Execution Flow

```typescript
// 1. Quality is dispatched with strategy
dispatch(d.concept.e.myQuality({ data }), { iterateStage: true });

// 2. Method creator creates and returns strategy
return strategyBegin(myStrategy(deck, param));

// 3. Strategy executes nodes in sequence
First: initialization started;
then: value processed;
and finally: process completed.
```

**Key Insights:**
- ActionStrategies provide structured, reusable workflows
- Method creators need explicit deck type for muxified access
- Use `strategyBegin()` to initiate strategies, not dispatch
- Strategies are ideal for complex but deterministic operations
- Keep strategies in dedicated files for maintainability
