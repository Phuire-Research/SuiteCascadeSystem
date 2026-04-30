# S11 — Testing Patterns & Asynchronous State Management

**Domain**: Stratimux testing patterns — asynchronous state management, stage separation, reactive stream timing, Jest integration, muxified concept testing, and complete test file templates with anti-patterns and best practices checklist.
**Trigger**: Creating or modifying test files (`test/*.test.ts`); debugging test failures involving state timing; setting up Jest with Stratimux.
**STRATIMUX-REFERENCE.md**: Lines 3002-3449

---

## Stratimux Testing Patterns & Asynchronous State Management

### Essential Testing Principles

Testing in Stratimux requires understanding the **asynchronous nature** of the framework and proper **stage separation** for state changes. This section documents critical patterns discovered through comprehensive test development.

**Core Testing Foundation**:
- **Asynchronous State Changes**: Dispatched actions don't immediately update state in the same stage
- **Stage Separation Required**: Each state change needs `{ iterateStage: true }` and separate validation stage
- **Planning Scope Timing**: Reactive streams need processing time between stages
- **Jest Integration**: Specific patterns for Jest + Stratimux with done callback pattern

### Asynchronous State Management (CRITICAL)

#### The Fundamental Rule: State Changes Are Asynchronous

**CRITICAL**: When you dispatch an action in Stratimux, the state change does **NOT** happen immediately within the same stage. State changes are processed asynchronously through the reactive stream system.

```typescript
// WRONG: Expecting immediate state change in same stage
stage(({ dispatch, d, stagePlanner }) => {
  // Dispatch action
  dispatch(d.concept.e.updateValue({ value: 'new-value' }), { iterateStage: true });
  
  // BUG: This will still show OLD state - change hasn't processed yet!
  const currentValue = d.concept.k.value.select();
  expect(currentValue).toBe('new-value'); // FAILS - still old value!
  
  stagePlanner.conclude();
})
```

```typescript
// CORRECT: Separate stages for dispatch and validation
stage(({ dispatch, d, stagePlanner }) => {
  // Stage 1: Dispatch the action
  dispatch(d.concept.e.updateValue({ value: 'new-value' }), { 
    iterateStage: true // Move to next stage after dispatching
  });
  stagePlanner.conclude();
}),
stage(({ d, stagePlanner }) => {
  // Stage 2: Validate the state change (now processed)
  const currentValue = d.concept.k.value.select();
  expect(currentValue).toBe('new-value'); // SUCCESS - change processed!
  
  stagePlanner.conclude();
})
```

### Stage Separation for State Changes

#### Pattern: Dispatch then Iterate then Validate

Every action dispatch that should trigger a state change requires **explicit stage separation**:

1. **Dispatch Stage**: Send action with `{ iterateStage: true }`
2. **Validation Stage**: Check updated state in separate stage

```typescript
// Complete Example: Data Buffer Update Test
test('should update data buffer with stage separation', (done) => {
  try {
    muxium.plan<ParentDeck>('test data buffer update', ({ stage, conclude }) => [
      // Stage 1: Dispatch Update
      stage(({ dispatch, d, stagePlanner }) => {
        try {
          dispatch(d.parent.d.interface.e.updateDataBuffer({
            dataBuffer: 'hello world',
            position: 11
          }), { iterateStage: true }); // CRITICAL: iterateStage: true
          
          stagePlanner.conclude();
        } catch (error) {
          console.error('Dispatch failed:', error);
          expect(false).toBe(true);
          done();
        }
      }),
      
      // Stage 2: Validate State Change
      stage(({ d, stagePlanner }) => {
        try {
          // NOW the state change has been processed
          const dataBuffer = d.parent.d.interface.k.dataBuffer.select();
          const position = d.parent.d.interface.k.position.select();
          
          expect(dataBuffer).toBe('hello world');
          expect(position).toBe(11);
          
          stagePlanner.conclude();
          setTimeout(() => done(), 100); // Allow reactive stream completion
        } catch (error) {
          console.error('Validation failed:', error);
          expect(false).toBe(true);
          done();
        }
      }),
      conclude()
    ]);
  } catch (error) {
    console.error('Test setup failed:', error);
    expect(false).toBe(true);
    done();
  }
});
```

#### Stage Options Reference

```typescript
// Dispatch patterns for different scenarios
dispatch(action, { iterateStage: true });  // Move to next stage - for state changes
dispatch(action, { iterateStage: false }); // Stay in current stage - for side effects
dispatch(action, {});                      // Empty options - use framework defaults
```

### Reactive Stream Timing & Planning Scope

#### Jest Integration Timing Pattern

Stratimux reactive streams require processing time. The established pattern uses `setTimeout` after `stagePlanner.conclude()`:

```typescript
// Reactive Stream Completion Pattern
stage(({ d, stagePlanner }) => {
  try {
    // State validation logic
    const value = d.concept.k.property.select();
    expect(value).toBe(expectedValue);
    
    stagePlanner.conclude(); // End the planning scope
    setTimeout(() => done(), 100); // Allow reactive stream to complete
  } catch (error) {
    console.error('Validation failed:', error);
    expect(false).toBe(true);
    done();
  }
})
```

#### Multi-Stage Planning Flow

```typescript
// Complex Multi-Stage Test Pattern
muxium.plan<ConceptDeck>('complex state management test', ({ stage, conclude }) => [
  // Stage 1: Initial Setup
  stage(({ dispatch, d, stagePlanner }) => {
    dispatch(d.concept.e.initializeState({}), { iterateStage: true });
    stagePlanner.conclude();
  }),
  
  // Stage 2: Validate Initialization
  stage(({ d, dispatch, stagePlanner }) => {
    const initialized = d.concept.k.isInitialized.select();
    expect(initialized).toBe(true);
    
    // Trigger next state change
    dispatch(d.concept.e.processData({ data: 'test' }), { iterateStage: true });
    stagePlanner.conclude();
  }),
  
  // Stage 3: Validate Processing
  stage(({ d, stagePlanner }) => {
    const processedData = d.concept.k.processedData.select();
    const status = d.concept.k.status.select();
    
    expect(processedData).toBe('test');
    expect(status).toBe('completed');
    
    stagePlanner.conclude();
    setTimeout(() => done(), 100);
  }),
  conclude()
]);
```

### Jest Integration Patterns

#### Complete Test File Template

```typescript
// File: src/concepts/myConcept/test/myConcept.test.ts
import { createMyConceptConcept, type MyConceptDeck } from '../myConcept.concept.js';
import { muxification } from 'stratimux';

describe('My Concept', () => {
  let muxium: ReturnType<typeof muxification>;

  beforeEach((done) => {
    const myConceptConcept = createMyConceptConcept();
    muxium = muxification('My Concept Test', {
      myConcept: myConceptConcept
    });

    // Give muxium time to initialize
    setTimeout(() => done(), 100);
  });

  afterEach(() => {
    if (muxium) {
      muxium.close();
    }
  });

  test('should handle state changes with proper stage separation', (done) => {
    try {
      muxium.plan<MyConceptDeck>('test state change', ({ stage, conclude }) => [
        stage(({ dispatch, d, stagePlanner }) => {
          try {
            // Dispatch action that changes state
            dispatch(d.myConcept.e.updateProperty({
              property: 'newValue'
            }), { iterateStage: true });
            
            stagePlanner.conclude();
          } catch (error) {
            console.error('Dispatch failed:', error);
            expect(false).toBe(true);
            done();
          }
        }),
        
        stage(({ d, stagePlanner }) => {
          try {
            // Validate state change in separate stage
            const property = d.myConcept.k.property.select();
            expect(property).toBe('newValue');
            
            stagePlanner.conclude();
            setTimeout(() => done(), 100);
          } catch (error) {
            console.error('Validation failed:', error);
            expect(false).toBe(true);
            done();
          }
        }),
        conclude()
      ]);
    } catch (error) {
      console.error('Test setup failed:', error);
      expect(false).toBe(true);
      done();
    }
  });
});
```

### Complete Testing Implementation Examples

#### Example 1: Muxified Concept State Access

```typescript
// Testing state access through muxified concept composition
test('should access muxified concept state through parent', (done) => {
  try {
    muxium.plan<ParentDeck>('test muxified access', ({ stage, conclude }) => [
      stage(({ d, stagePlanner }) => {
        try {
          // Access child concept state through parent concept
          const childProperty = d.parent.d.childConcept.k.property.select();
          const anotherProperty = d.parent.d.childConcept.k.anotherProperty.select();
          
          expect(typeof childProperty).toBe('string');
          expect(Array.isArray(anotherProperty)).toBe(true);
          
          stagePlanner.conclude();
          done();
        } catch (error) {
          console.error('Muxified access failed:', error);
          expect(false).toBe(true);
          done();
        }
      }),
      conclude()
    ]);
  } catch (error) {
    console.error('Test setup failed:', error);
    expect(false).toBe(true);
    done();
  }
});
```

#### Example 2: Action Dispatch to Muxified Concepts

```typescript
// Testing action dispatch to child concepts through parent
test('should dispatch actions to muxified concepts', (done) => {
  try {
    muxium.plan<ParentDeck>('test muxified dispatch', ({ stage, conclude }) => [
      stage(({ dispatch, d, stagePlanner }) => {
        try {
          // Dispatch to child concept through parent
          dispatch(d.parent.d.childConcept.e.updateChildState({
            newValue: 'test-value',
            timestamp: Date.now()
          }), { iterateStage: true });
          
          stagePlanner.conclude();
        } catch (error) {
          console.error('Muxified dispatch failed:', error);
          expect(false).toBe(true);
          done();
        }
      }),
      
      stage(({ d, stagePlanner }) => {
        try {
          // Validate the dispatch worked through parent access
          const childValue = d.parent.d.childConcept.k.value.select();
          const childTimestamp = d.parent.d.childConcept.k.lastUpdated.select();
          
          expect(childValue).toBe('test-value');
          expect(typeof childTimestamp).toBe('number');
          
          stagePlanner.conclude();
          setTimeout(() => done(), 100);
        } catch (error) {
          console.error('Muxified validation failed:', error);
          expect(false).toBe(true);
          done();
        }
      }),
      conclude()
    ]);
  } catch (error) {
    console.error('Test setup failed:', error);
    expect(false).toBe(true);
    done();
  }
});
```

#### Example 3: Complex State Validation Chain

```typescript
// Testing complex state changes across multiple actions
test('should handle complex state validation chain', (done) => {
  try {
    muxium.plan<ConceptDeck>('complex validation chain', ({ stage, conclude }) => [
      // Initialize
      stage(({ dispatch, d, stagePlanner }) => {
        dispatch(d.concept.e.initialize({}), { iterateStage: true });
        stagePlanner.conclude();
      }),
      
      // Validate initialization and trigger processing
      stage(({ d, dispatch, stagePlanner }) => {
        const isInitialized = d.concept.k.isInitialized.select();
        expect(isInitialized).toBe(true);
        
        dispatch(d.concept.e.processInput({ input: 'test-data' }), { iterateStage: true });
        stagePlanner.conclude();
      }),
      
      // Validate processing and trigger completion
      stage(({ d, dispatch, stagePlanner }) => {
        const processedInput = d.concept.k.processedInput.select();
        const status = d.concept.k.status.select();
        
        expect(processedInput).toBe('test-data');
        expect(status).toBe('processing');
        
        dispatch(d.concept.e.complete({}), { iterateStage: true });
        stagePlanner.conclude();
      }),
      
      // Final validation
      stage(({ d, stagePlanner }) => {
        const finalStatus = d.concept.k.status.select();
        const result = d.concept.k.result.select();
        
        expect(finalStatus).toBe('completed');
        expect(result).toBeDefined();
        
        stagePlanner.conclude();
        setTimeout(() => done(), 100);
      }),
      conclude()
    ]);
  } catch (error) {
    console.error('Complex test setup failed:', error);
    expect(false).toBe(true);
    done();
  }
});
```

### Critical Testing Anti-Patterns

#### Anti-Pattern 1: Immediate State Validation
```typescript
// WRONG: Checking state immediately after dispatch
stage(({ dispatch, d }) => {
  dispatch(d.concept.e.updateValue({ value: 'new' }), {});
  
  // BUG: State hasn't updated yet!
  const value = d.concept.k.value.select();
  expect(value).toBe('new'); // FAILS
})
```

#### Anti-Pattern 2: Missing Stage Iteration
```typescript
// WRONG: Not using iterateStage for state changes
stage(({ dispatch, d }) => {
  dispatch(d.concept.e.updateValue({ value: 'new' }), { iterateStage: false });
  // State change won't be processed for next stage validation
})
```

#### Anti-Pattern 3: Async/Await in Tests
```typescript
// WRONG: Using async/await with Stratimux tests
test('wrong pattern', async () => {
  // DON'T mix async/await with Stratimux planning scope
  await muxium.plan(...); // BREAKS
});
```

#### Anti-Pattern 4: Missing Reactive Stream Timing
```typescript
// WRONG: Not allowing reactive stream completion
stage(({ d, stagePlanner }) => {
  const value = d.concept.k.value.select();
  expect(value).toBe('expected');
  
  stagePlanner.conclude();
  done(); // Missing setTimeout - can cause timing issues
})
```

### Testing Best Practices Checklist

- [ ] **Use done callback pattern** - Never async/await in Stratimux tests
- [ ] **Separate dispatch and validation stages** - Each state change needs stage separation
- [ ] **Use `{ iterateStage: true }`** for actions that change state
- [ ] **Include `setTimeout(() => done(), 100)`** after final stage for reactive stream completion
- [ ] **Wrap all operations in try/catch blocks** with proper error handling
- [ ] **Test concept creation separately** from functionality tests
- [ ] **Use proper DECK K pattern** for state access: `d.concept.k.property.select()`
- [ ] **Initialize muxium in beforeEach with timeout** for proper setup
- [ ] **Close muxium in afterEach** to prevent memory leaks
- [ ] **Test both individual concepts and muxified compositions**
- [ ] **Validate state access through proper concept composition**
- [ ] **Focus on concept functionality, not implementation details**
