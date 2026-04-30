# S3 — Planning & Stage Control

**Domain**: Critical planning context patterns, single dispatch rule, stage options, flow control, two-stage KeyedSelector routing, and the synchronizing principle pattern with setStage
**Trigger**: When creating plans via muxium.plan(), implementing principles with stage progression, building reactive monitoring loops, or debugging stage control issues
**STRATIMUX-REFERENCE.md**: Lines 463-925

---

## Critical Planning Context Patterns

### **Outer Plan Context vs Principle Context** 

Understanding the distinction between these two planning contexts is **CRITICAL** for proper Stratimux development:

#### Outer Plan Context (via `muxium.plan()`)
```typescript
// When you create a plan from muxium, you're in OUTER PLAN CONTEXT
muxium.plan<ConceptDeck>('operation name', ({ stage, conclude }) => [
  stage(({ dispatch, d, k }) => {
    // WRONG: k refers to MUXIUM global state, not concept state
    const wrongValue = k.someProperty.select(); // This won't work!
    
    // CORRECT: Use d.conceptName.k for concept state access
    const correctValue = d.myConcept.k.someProperty.select();
    
    // SINGLE dispatch per stage - acts like final return
    dispatch(d.myConcept.e.myAction({ data: correctValue }), { 
      iterateStage: true // Explicit stage control required
    });
    // No other dispatches allowed in this stage
  }),
  conclude()
]);
```

#### Principle Context (within concept principles)
```typescript
// When you're inside a principle, you're in PRINCIPLE CONTEXT
export const myPrinciple: MyConceptPrinciple = ({ d_, k_, plan }) => {
  return plan('principle operation', ({ stage, conclude }) => [
    stage(({ dispatch, d, k }) => {
      // CORRECT: k refers directly to concept's own state
      const conceptValue = k.someProperty.select();
      
      // SINGLE dispatch per stage - acts like final return
      dispatch(d.myConcept.e.myAction({ data: conceptValue }), { 
        iterateStage: true // Explicit stage control required
      });
      // No other dispatches allowed in this stage
    }),
    conclude()
  ]);
};
```

### Single Dispatch Pattern (CRITICAL RULE)

**Each stage must have exactly ONE dispatch that acts like a final return statement:**

#### Correct Single Dispatch Pattern
```typescript
stage(({ dispatch, d }) => {
  const value = d.myConcept.k.property.select();
  
  if (value === 'condition') {
    // SINGLE dispatch with early return
    dispatch(d.myConcept.e.actionOne({ data: value }), { 
      iterateStage: true 
    });
    return; // Explicit early return
  }
  
  // SINGLE dispatch for alternate path
  dispatch(d.myConcept.e.actionTwo({ data: 'default' }), { 
    iterateStage: false 
  });
  // This is the implicit final return
})
```

#### Wrong Multiple Dispatch Pattern
```typescript
stage(({ dispatch, d }) => {
  // WRONG: Multiple dispatches in same stage
  dispatch(d.myConcept.e.actionOne());   // First dispatch
  dispatch(d.myConcept.e.actionTwo());   // Second dispatch - CAUSES ERRORS
  dispatch(d.myConcept.e.actionThree()); // Third dispatch - CAUSES ERRORS
  
  return { iterateStage: true }; // WRONG: return object instead of dispatch options
})
```

### Stage Options Reference

Every dispatch **MUST** include explicit stage options:

```typescript
// Stage control options
{ iterateStage: true }   // Move to next stage after dispatch
{ iterateStage: false }  // Stay on current stage for next iteration
{ }                      // Empty object - completes current plan iteration
```

### Planning Flow Control

#### Pattern: Conditional Stage Progression
```typescript
stage(({ dispatch, d }) => {
  const needsProcessing = d.myConcept.k.needsProcessing.select();
  
  if (needsProcessing) {
    // Continue to next stage for processing
    dispatch(d.myConcept.e.startProcessing(), { 
      iterateStage: true 
    });
    return;
  }
  
  // Skip processing, complete plan
  dispatch(d.myConcept.e.markComplete(), { 
    iterateStage: false 
  });
})
```

#### Pattern: Stage Recursion
```typescript
stage(({ dispatch, d }) => {
  const items = d.myConcept.k.itemsToProcess.select();
  
  if (items.length > 0) {
    // Process one item, stay on this stage
    dispatch(d.myConcept.e.processNextItem(), { 
      iterateStage: false // Recurse on this stage
    });
    return;
  }
  
  // All items processed, move forward
  dispatch(d.myConcept.e.processingComplete(), { 
    iterateStage: true 
  });
})
```

**Key Insights:**
- **Outer plans**: Use `d.conceptName.k` for state access
- **Principle plans**: Use `k` directly for concept's own state
- **One dispatch per stage**: Each stage ends with exactly one dispatch
- **Explicit options**: Every dispatch needs stage control options
- **Flow control**: Use `iterateStage` boolean to control plan progression

This understanding prevents the most common Stratimux planning errors and ensures proper reactive behavior.

### Advanced Pattern: Two-Stage KeyedSelector Routing for Parameter Observation

This advanced pattern provides an efficient routing mechanism for any system requiring parameter observation and change-based reactions. It's an enhancement of the standard planned subscription pattern.

#### Pattern Overview

The pattern uses a two-stage approach:
1. **Activation Stage**: Creates a routing record and performs initial parameter binding
2. **Subscription Stage**: Uses the routing record to efficiently handle parameter changes

#### Architecture

```typescript
// General implementation for any parameter observation system
let routingRecord: Record<string, (selector: any) => void> = {};

muxium.plan<ConceptDeck>('parameterObservation', ({ stage, d__ }) => [
  // Stage 1: Activation - Create routing infrastructure
  stage(({ d, dispatch }) => {
    console.log('Activation stage - creating routing record')
    
    // Access the concept containing parameters to observe
    const targetConcept = d.myConcept;
    if (!targetConcept) {
      console.warn('Target concept not found in deck');
      return;
    }

    // Extract KeyedSelectors for parameters
    const param1Selector = targetConcept.k.parameter1;
    const param2Selector = targetConcept.k.parameter2;
    const param3Selector = targetConcept.k.parameter3;

    // Create routing record using KeyedSelector keys property
    // Each binding function accepts the KeyedSelector for type safety
    routingRecord = {
      [param1Selector.keys]: (selector: any) => {
        const newValue = selector.select();
        if (newValue !== undefined) {
          // Handle parameter1 change
          handleParameter1Change(newValue);
          console.log('Updated parameter1:', newValue);
        }
      },
      [param2Selector.keys]: (selector: any) => {
        const newValue = selector.select();
        if (newValue !== undefined) {
          // Handle parameter2 change
          handleParameter2Change(newValue);
          console.log('Updated parameter2:', newValue);
        }
      },
      [param3Selector.keys]: (selector: any) => {
        const newValue = selector.select();
        if (newValue !== undefined) {
          // Handle parameter3 change
          handleParameter3Change(newValue);
          console.log('Updated parameter3:', newValue);
        }
      }
    };

    // Initial binding: Pass selectors to their binding functions
    console.log('Performing initial parameter binding');
    routingRecord[param1Selector.keys](param1Selector);
    routingRecord[param2Selector.keys](param2Selector);
    routingRecord[param3Selector.keys](param3Selector);

    // Proceed to subscription stage
    dispatch(d.muxium.e.muxiumKick(),
    {
      iterateStage: true
    });
  }),

  // Stage 2: Subscription - Handle changes via routing
  stage(({ d, changes }) => {
    console.log('Subscription stage - processing changes:', changes);

    if (changes.length > 0) {
      // Enhanced routing: Changes array provides KeyedSelectors
      changes.forEach((change) => {
        // Direct indexing into routing record using change.keys
        const bindingFn = routingRecord[change.keys];
        if (bindingFn) {
          console.log('Routing change to binding:', change.keys);
          bindingFn(change); // Pass the KeyedSelector from the change
        }
      });
    }
  }, {
    // Specify selectors to observe
    selectors: [
      d__.myConcept.k.parameter1,
      d__.myConcept.k.parameter2,
      d__.myConcept.k.parameter3
    ]
  }),
]);
```

#### Key Benefits

1. **Type Safety**: Routing record ensures type-safe KeyedSelector handling
2. **Performance**: O(1) change routing without if/else chains
3. **Separation of Concerns**: Clean separation between setup and observation logic
4. **Scalability**: Easy to add/remove parameter observations
5. **Framework Agnostic**: Works with any system requiring parameter observation

#### Use Cases

This pattern is ideal for:
- **Frontend Framework Integration**: React, Vue, Angular, Svelte state synchronization
- **Backend Services**: Monitoring configuration parameters or system metrics
- **Game Engines**: Observing game state changes for physics/rendering updates
- **Data Processing**: Reacting to data pipeline parameter changes
- **IoT Systems**: Monitoring sensor readings and triggering responses
- **Real-time Systems**: Efficient routing of time-critical parameter updates

#### Comparison with Standard Pattern

**Standard Planned Subscription**:
```typescript
stage(({ d }) => {
  // Direct property updates
  property1 = d.concept.k.property1.select();
  property2 = d.concept.k.property2.select();
}, { selectors: [d__.concept.k.property1, d__.concept.k.property2] })
```

**Advanced Two-Stage Routing**:
- Activation stage for infrastructure setup
- Routing record for O(1) change handling
- KeyedSelector passing maintains type safety
- More scalable for many parameters

#### Implementation Considerations

1. **Memory Usage**: Routing record persists between stages
2. **Closure Scope**: Handler functions capture activation stage scope
3. **Type Safety**: Use TypeScript generics for full type safety
4. **Error Handling**: Add try/catch in binding functions for robustness
5. **Cleanup**: Ensure proper plan conclusion for memory management

#### Advanced Variations

**Dynamic Parameter Registration**:
```typescript
// Allow runtime parameter registration
const registerParameter = (selector: KeyedSelector, handler: (value: any) => void) => {
  routingRecord[selector.keys] = (sel: typeof selector) => {
    const value = sel.select();
    if (value !== undefined) handler(value);
  };
};
```

**Batched Updates**:
```typescript
// Batch multiple parameter changes
const batchedChanges: Record<string, any> = {};
changes.forEach((change) => {
  batchedChanges[change.keys] = change.select();
});
processBatchedUpdates(batchedChanges);
```

This advanced pattern represents a significant evolution in parameter observation, providing a robust foundation for any system requiring efficient change-based routing.

### Synchronizing Principle Pattern with setStage

**Critical Pattern**: For continuous monitoring principles that need to recursively monitor and synchronize state changes while preventing recursion overflow.

#### The setStage Pattern Architecture

The `setStage` dispatch option enables **non-linear stage progression**, essential for synchronizing principles:

```typescript
// Stage flow with setStage control
dispatch(d.concept.e.action(), { setStage: 0 }); // Jump to stage 0 (monitoring recursion)
dispatch(d.concept.e.action(), { setStage: 2 }); // Jump to stage 2 (update stage)
```

#### Complete Synchronizing Principle Implementation

```typescript
export const synchronizingPrinciple: PrincipleFunction = ({ d_, k_, plan }) => {
  return plan('Synchronizing Principle', ({ stage, conclude }) => [
    // Stage 0: Primary monitoring recursion - watches for changes
    stage(({ dispatch, d, k }) => {
      // Check prerequisites
      if (!k.isActive.select()) {
        dispatch(d.concept.e.activate(), { setStage: 0 }); // Return to monitoring
        return;
      }
      
      if (!k.isInitialized.select()) {
        dispatch(d_.muxium.e.muxiumKick(), { setStage: 3 }); // Go to initialization
        return;
      }
      
      // Monitor for changes
      const currentData = d.externalConcept.k.monitoredProperty.select();
      const lastKnownData = k.lastKnownData.select();
      
      if (hasChanges(currentData, lastKnownData)) {
        console.log('Changes detected, proceeding to process stage');
        dispatch(d_.muxium.e.muxiumKick(), { setStage: 1 }); // Go to process stage
      } else {
        dispatch(d_.muxium.e.muxiumKick(), { setStage: 0 }); // Stay in monitoring recursion
      }
    }, {
      beat: 300, // Check every 300ms - reasonable monitoring frequency
      selectors: [
        d_.externalConcept.k.monitoredProperty,  // External state to monitor
        k_.isActive,                            // Internal state flags
        k_.lastKnownData,
        k_.isInitialized
      ]
    }),
    
    // Stage 1: Process detected changes
    stage(({ dispatch, d, k }) => {
      const currentData = d.externalConcept.k.monitoredProperty.select();
      
      console.log('Processing changes in stage 1');
      
      dispatch(d.concept.e.updateWithChanges({
        newData: currentData,
        timestamp: Date.now()
      }), { setStage: 2 }); // Go to update tracking stage
    }, {
      beat: 100, // Execute quickly when reached
      selectors: [
        d_.externalConcept.k.monitoredProperty,
        k_.isActive
      ]
    }),
    
    // Stage 2: Update tracking and return to monitoring
    stage(({ dispatch, d, k }) => {
      const currentData = d.externalConcept.k.monitoredProperty.select();
      
      console.log('Updating tracking in stage 2');
      
      dispatch(d.concept.e.setLastKnownData({ 
        data: currentData 
      }), { setStage: 0 }); // Return to monitoring recursion
    }, {
      beat: 100, // Execute quickly when reached
      selectors: [
        d_.externalConcept.k.monitoredProperty
      ]
    }),
    
    // Stage 3: Initialization stage
    stage(({ dispatch, d, k }) => {
      if (!k.isInitialized.select()) {
        console.log('Initializing principle');
        dispatch(d.concept.e.setInitialized({ initialized: true }), { setStage: 0 });
      } else {
        dispatch(d_.muxium.e.muxiumKick(), { setStage: 0 }); // Return to monitoring
      }
    }, {
      beat: 100, // Execute quickly when reached
      selectors: [
        k_.isInitialized
      ]
    }),
    
    conclude()
  ]);
};
```

#### Critical Pattern Elements

1. **setStage for Non-Linear Flow**:
   ```typescript
   { setStage: 0 }  // Jump to monitoring recursion (Stage 0)
   { setStage: 1 }  // Jump to processing stage (Stage 1)
   { setStage: 2 }  // Jump to update stage (Stage 2)
   ```

2. **Beat Timing for Recursion Prevention**:
   ```typescript
   beat: 300,  // Monitoring stage - reasonable frequency
   beat: 100,  // Processing stages - quick execution
   ```

3. **Selectors with k_ and d_ References**:
   ```typescript
   selectors: [
     d_.externalConcept.k.monitoredProperty,  // External concept state
     k_.internalProperty,                     // This concept's state
     k_.flags
   ]
   ```

#### Critical Benefits

- **Prevents Recursion Overflow**: `selectors` ensure stages only execute when relevant state changes
- **Controlled Timing**: `beat` prevents excessive execution frequency  
- **Non-Linear Flow**: `setStage` enables flexible stage jumping for recursive monitoring
- **Selective Notifications**: Stages activate only on meaningful state changes
- **Resource Efficient**: No unnecessary re-executions

#### When to Use This Pattern

- **Continuous Monitoring**: Watching external state for changes
- **Synchronization Tasks**: Keeping multiple states in sync
- **Background Processing**: Ongoing operations that need recursive execution
- **State Validation**: Continuously checking consistency
- **Event Detection**: Monitoring for specific conditions

This pattern is essential for building robust, efficient principles that can monitor and synchronize state changes without overwhelming the system through controlled recursive execution.
