# S5 — Strategy Data & Temporal Expansion

**Domain**: ActionStrategy data transformation pipeline and deferred strategy continuation via muxiumTimeOut
**Trigger**: When implementing ActionStrategy data flow between qualities, async method patterns, failure conditions, or temporal expansion of the action stream
**STRATIMUX-REFERENCE.md**: Lines 1342-1665

---

### Strategy Temporal Expansion Pattern (Deferred Strategy Continuation)

**The `muxiumTimeOut` pattern enables qualities to expand the sequential action stream by deferring strategy execution using Stratimux's built-in "Tail Whip" functionality.**

#### Conceptual Understanding

Stratimux enforces strict sequential operation through head, body, tail action ordering to maintain provable termination in its recursive function composition. The `muxiumTimeOut` function leverages Stratimux's **single timeout mechanism** (the "Tail Whip") that already exists to ensure all actions are depleted from the queue. This pattern allows a quality to:

1. **Execute its immediate action**
2. **Schedule the original strategy continuation** using the existing timeout infrastructure
3. **Expand the action stream** without violating sequential constraints
4. **No additional overhead** - uses Stratimux's default timeout mechanism

#### Implementation Pattern

```typescript
methodCreator: () => createMethodWithConcepts(({ action, concepts_, deck }) => {
  // Immediate action to execute first
  const immediateStrategy = createStrategy({
    topic: 'Immediate action before continuing',
    initialNode: createActionNode(deck.myConcept.e.immediateAction())
  });
  
  // Check if there's an incoming strategy to defer
  if (action.strategy) {
    // Continue the original strategy after delay using built-in Tail Whip
    const punt = strategySuccess(action.strategy);
    muxiumTimeOut(concepts_, () => punt, 30); // Registers with existing timeout
  }
  
  // Return the immediate strategy
  return strategyBegin(immediateStrategy);
})
```

#### Use Cases

1. **Sequential Dependencies**: When an action must complete before a strategy continues
2. **State Synchronization**: Ensuring state updates propagate before next actions
3. **Resource Management**: Allowing cleanup or preparation between action sequences
4. **Avoiding Race Conditions**: Ensuring proper ordering of dependent operations

#### Pattern Requirements

- **`createMethodWithConcepts`**: Required to access `concepts_` for timer registration
- **`action.strategy` check**: Verify incoming strategy exists before deferring
- **`strategySuccess()`**: Properly continue the deferred strategy
- **`muxiumTimeOut()`**: Register with Stratimux's single timeout mechanism

#### Benefits

- **Zero Additional Overhead**: Uses existing Tail Whip timeout infrastructure
- **Maintains Sequential Integrity**: Respects Stratimux's head-body-tail ordering
- **Expands Action Capacity**: Allows N actions from a single method dispatch
- **Provable Termination**: Preserves recursive function termination guarantees
- **Built-in Efficiency**: Leverages Stratimux's default action depletion mechanism

#### Important Notes

- **Single Timeout System**: Stratimux uses only ONE timeout for all deferred actions
- **Tail Whip Functionality**: This is Stratimux's built-in mechanism to ensure action queue depletion
- **No Performance Penalty**: Since this uses the existing timeout, there's no additional overhead
- **Timing Coordination**: All deferred actions share the same timeout cycle

---

### ActionStrategy Data - Universal Transformer Pattern

**ActionStrategies serve as Universal Transformers through their data transformation capabilities, following Data Oriented Design principles.**

#### Fundamental ActionStrategy Data Concepts

**Core Principle**: ActionStrategies transform data over time through a series of steps, with each step able to read, modify, and enhance the data payload using Record muxification.

```typescript
// ActionStrategy Data Field Definition Pattern
export type ApiResponseDataField = {
  response: string;
  query: string;
  timestamp: number;
  type: 'context-aware' | 'standalone';
  duration?: number;
  tokenCount?: number;
};

// Universal naming convention: avoid collision with "Universal Properties"
// Use prepositions for non-unifying parameters: "uiDivStyle" vs "style"
```

#### Data Flow Consumer Functions

ActionStrategy data is managed through these consumer functions:

```typescript
// Data manipulation functions available in qualities
import {
  strategyData_appendFailure,    // Add failure condition to data
  strategyData_selectFailureCondition, // Get current failure condition
  strategyData_clearFailureCondition,  // Remove failure condition
  strategyData_select,          // Extract typed data from strategy
  strategyData_muxifyData      // Merge new data with existing data
} from 'stratimux';

// Usage in quality method creators
const data = strategyData_select<MyDataField>(strategy);
const updatedData = strategyData_muxifyData(strategy, { newProperty: 'value' });
```

#### Producing ActionStrategy Data in Qualities

**Pattern**: Qualities generate data and store it in ActionStrategy using `strategyData_muxifyData`:

```typescript
// Example: External API quality that produces response data
export const apiStandaloneQuery = createQualityCardWithPayload<
  ApiConceptState,
  ApiStandaloneQueryPayload
>({
  type: 'api standalone query',
  reducer: (state, action) => {
    // Standard state updates
    return {
      isProcessing: true
    };
  },
  methodCreator: () => {
    // Async function defined outside method scope
    const executeQuery = async (apiState: ApiConceptState, query: string) => {
      const startTime = Date.now();
      
      // API call logic here
      const response = await callExternalAPI(query);
      const duration = Date.now() - startTime;
      
      // Return data that will be stored in ActionStrategy
      return {
        response,
        query,
        timestamp: Date.now(),
        type: 'standalone' as const,
        duration,
        tokenCount: response.usage?.output_tokens
      };
    };
    
    return createAsyncMethodWithState<ApiConceptState>(({ controller, action, state }) => {
      if (action.strategy) {
        const { query } = selectPayload<ApiStandaloneQueryPayload>(action);
        const apiState = state as ApiConceptState;
        
        executeQuery(apiState, query)
          .then((responseData) => {
            // Store data in ActionStrategy using strategyData_muxifyData
            controller.fire(strategySuccess(
              action.strategy!, 
              strategyData_muxifyData(action.strategy!, responseData)
            ));
          })
          .catch(() => {
            controller.fire(strategyFailed(action.strategy!));
          });
      }
    });
  }
});
```

#### Consuming ActionStrategy Data in Qualities

**Pattern**: Downstream qualities extract data using `strategyData_select`:

```typescript
// Example: Quality that consumes API response data
export const interfaceAddDataToHistory = createQualityCardWithPayload<
  InterfaceState,
  InterfaceAddDataToHistoryPayload
>({
  type: 'interface add ActionStrategy data to history',
  reducer: (state, action) => {
    if (action.strategy) {
      // Extract data from ActionStrategy
      const data = strategyData_select<ApiResponseDataField>(action.strategy);
      const { entryType, contentTemplate } = selectPayload<InterfaceAddDataToHistoryPayload>(action);
      
      if (data && data.response) {
        // Use ActionStrategy data to create history entry
        const content = contentTemplate ? 
          contentTemplate.replace('{{response}}', data.response) : 
          data.response;
          
        const entry: InterfaceHistoryEntry = {
          type: entryType,
          content
        };
        
        // Return only changed state properties
        return {
          history: [...state.history, entry]
        };
      }
    }
    return {}; // No change if no valid data
  },
  methodCreator: () => createAsyncMethodWithState<InterfaceState>(({ controller, action }) => {
    if (action.strategy) {
      const data = strategyData_select<ApiResponseDataField>(action.strategy);
      
      if (data && data.response) {
        // Create success data for downstream steps
        const successData = strategyData_muxifyData(action.strategy, {
          addedToHistory: true
        });
        
        controller.fire(strategySuccess(action.strategy, successData));
      } else {
        controller.fire(strategyFailed(
          action.strategy, 
          strategyData_appendFailure(action.strategy, 'No response data available')
        ));
      }
    }
  })
});
```

#### Asynchronous Method Creator Patterns

**CRITICAL**: When using async operations in method creators, follow these patterns to handle action expiration (default 5000ms, configurable via action options):

```typescript
// CORRECT: Async function declared outside method scope
methodCreator: () => {
  const performAsyncOperation = async (state: ConceptState, params: any) => {
    // Set timeout with buffer for action expiration (default 5000ms, configurable)
    const timeoutMs = Math.min(state.configTimeout, 4000); // Leave 1s buffer for default
    
    // Perform async operation
    const result = await externalAPI.call(params, { timeout: timeoutMs });
    
    return {
      result,
      timestamp: Date.now(),
      // ... other data
    };
  };
  
  return createAsyncMethodWithState<ConceptState>(({ controller, action, state }) => {
    if (action.strategy) {
      const payload = selectPayload<PayloadType>(action);
      
      performAsyncOperation(state, payload)
        .then((data) => {
          controller.fire(strategySuccess(
            action.strategy!, 
            strategyData_muxifyData(action.strategy!, data)
          ));
        })
        .catch((error) => {
          controller.fire(strategyFailed(action.strategy!));
        });
    }
  });
}

// WRONG: Using async/await in method creator
methodCreator: () => createAsyncMethodWithState<ConceptState>(async ({ controller, action, state }) => {
  // DON'T DO THIS - method creators should not be async
})

// CORRECT: Configuring action expiration for long-running operations
stage(({ dispatch, d }) => {
  dispatch(d.concept.e.longRunningAction({ data: 'value' }), { 
    iterateStage: true,
    expiration: 30000 // 30 seconds for long-running operation
  });
})

// For outer muxium dispatches
muxium.dispatch(
  muxium.deck.d.concept.e.longRunningAction({ data: 'value' }),
  { expiration: 15000 } // 15 seconds custom expiration
);
```

#### Failure Conditions and Higher Order Logic

ActionStrategies support advanced failure handling through failure conditions:

```typescript
// Built-in failure conditions
export enum failureConditions {
  ownershipExpired = 'ownershipExpired',
  ownershipBlocked = 'ownershipBlocked', 
  controllerExpired = 'controllerExpired',
  muxiumExpired = 'muxiumExpired',
  muxiumBadGeneration = 'muxiumBadGeneration'
}

// Using failure conditions in quality method creators
if (validationFailed) {
  controller.fire(strategyFailed(
    action.strategy!, 
    strategyData_appendFailure(action.strategy!, 'Custom validation failure')
  ));
}

// Failure nodes can read failure conditions for intelligent decisions
const failureCondition = strategyData_selectFailureCondition(strategy);
if (failureCondition === 'controllerExpired') {
  // Handle timeout specifically
} else if (failureCondition === 'ownershipBlocked') {
  // Handle blocking specifically
}
```

#### ActionStrategy Data Best Practices

1. **Data Field Design**: Create explicit TypeScript interfaces for ActionStrategy data
2. **Timeout Management**: Account for action expiration (default 5000ms, configurable via options object)
3. **Custom Expiration**: Use `{ expiration: ms }` in dispatch options for long-running operations
4. **Error Handling**: Use failure conditions for intelligent error recovery
5. **Type Safety**: Use `strategyData_select<T>()` with explicit types
6. **Data Evolution**: Use `strategyData_muxifyData()` to enhance data through strategy steps
7. **Universal Properties**: Follow naming conventions to enable data unification
8. **Async Patterns**: Declare async functions outside method scope, use `.then()` for controller.fire
