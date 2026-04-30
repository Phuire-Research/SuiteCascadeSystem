# S6 — Ownership & Coordination

**Domain**: Bi-directional mutex coordination for concurrent ActionStrategies with stake-based FIFO priority
**Trigger**: When implementing concurrent strategy coordination, ownership-aware planning, off-premise action patterns, or stake-based resource locking
**STRATIMUX-REFERENCE.md**: Lines 1668-2031

---

## Ownership Patterns - Bi-Directional Coordination System

**The Ownership system provides deterministic mutex-like coordination for concurrent ActionStrategies, enabling safe parallel execution through stake-based coordination with temporal priority (FIFO). This opt-in system transforms how Stratimux handles concurrent operations.**

### Core Ownership Concepts

#### Understanding Ownership Coordination
```typescript
// Ownership creates bi-directional blocking within uni-directional trees
// Example: File paths like 'app.data.users.profile'
// - Ancestors block descendants (app.data blocks app.data.users)
// - Descendants block ancestors (app.data.users blocks app.data)
// - Siblings execute in parallel (app.data and app.ui run simultaneously)
```

#### Ownership State Structure
```typescript
export type OwnershipState = {
  initialized: boolean;
  ownershipLedger: OwnershipLedger;        // Ticket queues by key
  uniDirectionalLedger: UniDirectionalLedger; // v0.3.29: Stake tree
  pendingActions: Action[];                 // Blocked actions awaiting ownership
  isResponsibleForMode: boolean;           // Controls mode ownership
}
```

### Enabling Ownership in Your Muxium

#### Step 1: Compose Ownership Concept
```typescript
import { createOwnershipConcept } from 'stratimux';

const muxium = muxification('Your App', {
  yourConcept: createYourConcept(),
  ownership: createOwnershipConcept() // Just add this!
});
```

#### Step 2: Use stageO() for Ownership-Aware Stages
```typescript
// Following "Stage Planning with Ownership (stageO)" pattern
muxium.plan<YourDeck>('ownership-aware plan', ({ stageO, stage, conclude }) => [
  stageO(),      // Waits for ownership initialization (default)
  // OR
  stageO(true),  // Explicitly skip ownership check
  
  stage(({ dispatch, d }) => {
    // Your ownership-aware logic here
    dispatch(d.concept.e.action(), { iterateStage: true });
  }),
  conclude()
]);
```

### KeyedSelector Attachment Patterns

#### Pattern 1: Direct Action Attachment
```typescript
// Attach KeyedSelector to any action to opt into ownership
const action = d.concept.e.someAction({ data: 'value' });
action.keyedSelectors = [
  createKeyedSelector('your.ownership.path')
];
muxium.dispatch(action);
```

#### Pattern 2: Dynamic KeyedSelector Creation
```typescript
// Following the Trux test pattern - create selectors dynamically
methodCreator: () => createMethod(({ action }) => {
  // Create KeyedSelector based on action payload
  const path = action.payload.resourcePath;
  const selector = createConceptKeyedSelector('concept', path);
  
  // Attach to next action in strategy
  if (action.strategy) {
    const nextAction = strategySuccess(action.strategy);
    nextAction.keyedSelectors = [selector];
    return nextAction;
  }
})
```

#### Pattern 3: KeyedSelector Cascading in Strategies
```typescript
// KeyedSelectors automatically cascade through strategy chains
// Handled by mergeKeyedSelectors() in strategyHelpers
const strategy = createStrategy({
  topic: 'cascading example',
  initialNode: createActionNode(
    action1({ data }, { 
      keyedSelectors: [selector1] // This cascades to all nodes
    }),
    {
      successNode: createActionNode(action2()),  // Inherits selector1
      failureNode: createActionNode(action3())   // Also inherits selector1
    }
  )
});
```

### Strategy-Ownership Integration

#### Critical Pattern: ownershipBackTrack failureNode
```typescript
// Following "selectStratiDECK Pattern for Strategy Creator Functions"
export function createOwnershipAwareStrategy(
  deck: unknown,  // ALWAYS use unknown type
  resourcePath: string
): ActionStrategy | undefined {
  
  const myDeck = selectStratiDECK<MyConcept>(deck, 'myConcept');
  const ownershipDeck = selectStratiDECK<OwnershipConcept>(deck, 'ownership');
  
  if (!myDeck || !ownershipDeck) return undefined;
  
  // Create backtrack node for ownership blocking
  const backTrack = createActionNode(
    ownershipDeck.e.ownershipBackTrack({})
  );
  
  return createStrategy({
    topic: 'ownership-aware strategy',
    initialNode: createActionNode(
      myDeck.e.action1({ resourcePath }, { 
        agreement: 10000  // Sufficient time for coordination
      }),
      {
        failureNode: backTrack,  // Prevents auto-failure when blocked
        successNode: createActionNode(
          myDeck.e.action2({ resourcePath }, { agreement: 10000 }),
          {
            failureNode: backTrack,  // Each node needs backtrack
            successNode: createActionNode(
              myDeck.e.action3({ resourcePath }, { agreement: 10000 }),
              { failureNode: backTrack }
            )
          }
        )
      }
    )
  });
}
```

### Stage Planning with Ownership (stageO)

#### Understanding stageO() Behavior
```typescript
// stageO() ensures ownership is initialized before stage execution
export const stageO = <Q, C, S>(skipOwnershipInit?: true): BaseStaging<Q, C, S> => {
  // Default: Waits for both muxium.open AND ownership.initialized
  // skipOwnershipInit=true: Only waits for muxium.open
  
  return createBaseStage((params) => {
    // Stage with ownership awareness
  }, {
    selectors: skipOwnershipInit === undefined && ownershipDeck ?
      [muxiumSelectOpen, ownershipDeck.k.initialized]
      : [muxiumSelectOpen]
  });
};
```

#### Usage in Principles
```typescript
const myPrinciple: PrincipleFunction = ({ plan, k, d }) => {
  // Ownership-aware principle planning
  plan('process with ownership', ({ stageO, stage, conclude }) => [
    stageO(),  // Ensure ownership ready
    stage(({ dispatch }) => {
      // Safe to use ownership-tracked resources
      const resource = k.resource.select();
      if (resource.needsProcessing) {
        dispatch(d.myConcept.e.processResource({ 
          path: resource.path 
        }), { iterateStage: true });
      }
    }),
    conclude()
  ]);
};
```

### Stake-Based Coordination (v0.3.29)

#### How Stake System Works
```typescript
// Stake is awarded at END WRUNGS ONLY (where paths terminate)
// O(depth) performance vs O(n*m) for traditional checking

// Example tree:
//   app
//   +-- data        <- Can claim stake if no descendants own
//   |   +-- users   <- END WRUNG: Claims stake here
//   +-- ui          <- Independent branch, runs parallel

// Stake checking in ownership.ts:
if (!node.stake || node.stake === stubKey) {
  return true; // We have stake or can claim it
}
```

#### Critical Fix: switchMap to mergeMap
```typescript
// v0.3.29 fix enabling true bi-directional flow
// src/model/method/methodAsync.ts:79
mergeMap(([act, concepts]: [ActionDeck<T, C>, Concepts]) =>
  createActionController$(act, (params) => {
    // All action streams preserved, not orphaned by switchMap
  })
)
// Without this, 6/7 actions were being cancelled!
```

### Off-Premise Action Pattern

#### Moving Actions to Workers/Servers While Maintaining Locks
```typescript
// Quality without method - uses reducer to queue
export const offPremiseQueueQuality = createQualityCard({
  type: 'queue for off-premise',
  reducer: (state, action) => {
    if (action.strategy?.stubs) {
      return {
        offPremiseQueue: [...state.offPremiseQueue, action]
      };
    }
    return {};
  },
  // No methodCreator - handled by principle
});

// Principle monitors and processes queue
const offPremisePrinciple: PrincipleFunction = ({ plan, k }) => {
  const queue = k.offPremiseQueue.select();
  
  if (queue.length > 0) {
    plan('process off-premise', ({ stage, conclude }) => [
      stage(({ dispatch }) => {
        const action = queue[0];
        
        // Send to worker/server WITH stubs intact
        workerPort.postMessage({
          action: action,
          stubs: action.strategy.stubs,  // Maintains ownership
          expiration: action.expiration   // Respects timing
        });
        
        // Clear from queue but NOT from ownership
        dispatch(d.concept.e.dequeueOffPremise(), {});
      }),
      conclude()
    ]);
  }
};
```

### Critical Ownership Caveats

#### 1. Agreement Time Must Exceed Operation Time
```typescript
// WRONG: Default 5000ms may timeout
const action = d.concept.e.longOperation();

// CORRECT: Sufficient agreement time
const action = d.concept.e.longOperation({}, { 
  agreement: 30000  // 30 seconds for long operations
});
```

#### 2. Ownership Actions Bypass Ownership Checks
```typescript
// In ownership.mode.ts - ownership concept actions bypass
if (ownershipSemaphore !== -1 && action.semaphore[0] === ownershipSemaphore) {
  finalMode([action, concepts, action$, concepts$]);
  return; // Bypass prevents ownership deadlock
}
```

#### 3. Only Strategy Conclusion or Explicit Clear Releases Locks
```typescript
// Locks persist until:
// 1. Strategy reaches conclusion (auto-cleared in ownershipMode)
// 2. Explicit clear via ownership qualities:

d.ownership.e.ownershipClearPayloadStubs({ stubs });
// OR
d.ownership.e.ownershipClearStrategyStubsFromLedgerAndSelf();
```

#### 4. Generation Guard for Unprimed Actions
```typescript
// Actions with generation -1 must pass through for priming
if (action.semaphore[2] === -1 || 
    action.semaphore[2] !== muxiumState.generation) {
  finalMode([action, concepts, action$, concepts$]);
  return; // Let action get primed first
}
```

### Testing Ownership Patterns

#### Pattern: Deterministic Parallel Execution Test
```typescript
// Following "Stratimux Testing Patterns & Asynchronous State Management"
test('ownership enables deterministic parallel execution', (done) => {
  const muxium = muxification('test', {
    concept: createConcept(),
    ownership: createOwnershipConcept()
  });
  
  const completedActions: string[] = [];
  
  // Subscribe to track completions
  const sub = muxium.subscribe((concepts) => {
    const state = selectState(concepts, 'concept');
    if (state.lastCompleted && !completedActions.includes(state.lastCompleted)) {
      completedActions.push(state.lastCompleted);
    }
  });
  
  // Dispatch ownership-aware strategies
  muxium.plan<TestDeck>('test ownership', ({ stageO, stage, conclude }) => [
    stageO(),
    stage(({ dispatch, d }) => {
      // Create strategies with ownership paths
      const strategies = [
        createStrategy('path.a', 'action1'),      // Blocks path.a.b
        createStrategy('path.a.b', 'action2'),    // Blocked by action1
        createStrategy('path.c', 'action3'),      // Independent, parallel
      ];
      
      strategies.forEach(strategy => {
        muxium.dispatch(strategyBegin(strategy));
      });
      
      dispatch(d.muxium.e.muxiumKick(), { iterateStage: true });
    }),
    stage(({ stagePlanner }) => {
      if (completedActions.length === 3) {
        // Verify execution order
        expect(completedActions[0]).toBe('action1'); // Ancestor first
        expect(completedActions[1]).toBe('action3'); // Parallel branch
        expect(completedActions[2]).toBe('action2'); // Descendant last
        
        sub.unsubscribe();
        muxium.close();
        done();
        stagePlanner.conclude();
      }
    }, { beat: 100 })
  ]);
});
```

#### Key Testing Principles
1. **Use stageO()** to ensure ownership initialization
2. **Set sufficient agreement times** (10000ms+ for tests)
3. **Use beat for monitoring stages** to check completion
4. **Track execution order** to verify deterministic behavior
5. **Always unsubscribe and close** in test cleanup

**The Ownership system transforms Stratimux into a powerful distributed coordination framework, enabling safe concurrent operations across any computational premise while maintaining deterministic execution order.**
