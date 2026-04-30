# S10 — Quality Creation Patterns & Best Practices

**Domain**: Quality card implementation patterns for Stratimux v0.3.2+ — simple, payload, destructured, complex array/object, advanced method creator, and performance-optimized qualities, plus anti-patterns, checklists, and type definition patterns.
**Trigger**: Creating or modifying any `*.quality.ts` file; implementing quality cards; reviewing quality patterns for correctness.
**STRATIMUX-REFERENCE.md**: Lines 2715-3000

---

## Quality Creation Patterns & Best Practices

### Comprehensive Quality Implementation Guide

**Quality Definition Rules for v0.3.2+:**
- Always use explicit Quality type definitions (NEVER `typeof` patterns)
- Import correct APIs: `createQualityCard` or `createQualityCardWithPayload`
- Use proper type parameter order: `<State, Payload, Deck?>`
- Extract payloads with `selectPayload<PayloadType>(action)` when needed
- Follow Shortest Path Principle for optimal performance

### Pattern 1: Simple Quality (No Payload)

```typescript
// File: /concept/qualities/simpleAction.quality.ts
import { createQualityCard, defaultMethodCreator, type Quality } from 'stratimux';
import type { MyConceptState } from '../myConcept.concept.js';

export type MyConceptSimpleAction = Quality<MyConceptState>;

export const myConceptSimpleAction = createQualityCard<MyConceptState>({
  type: 'myConcept simple action',
  reducer: (state) => {
    return {
      // EFFICIENT: Return only changed properties
      isActive: !state.isActive
    };
  },
  methodCreator: defaultMethodCreator,
});
```

### Pattern 2: Payload Quality (With Parameters)

```typescript
// File: /concept/qualities/updateProperty.quality.ts
import { createQualityCardWithPayload, defaultMethodCreator, selectPayload, type Quality } from 'stratimux';
import type { MyConceptState } from '../myConcept.concept.js';
import type { MyConceptUpdatePropertyPayload } from './types.js';

export type MyConceptUpdateProperty = Quality<MyConceptState, MyConceptUpdatePropertyPayload>;

export const myConceptUpdateProperty = createQualityCardWithPayload<
  MyConceptState,
  MyConceptUpdatePropertyPayload
>({
  type: 'myConcept update property',
  reducer: (state, action) => {
    // CORRECT: Extract payload using selectPayload
    const { propertyName, newValue } = selectPayload<MyConceptUpdatePropertyPayload>(action);
    
    return {
      // EFFICIENT: Return only changed property
      [propertyName]: newValue
    };
  },
  methodCreator: defaultMethodCreator,
});
```

### Pattern 3: Destructured Payload (Alternative Syntax)

```typescript
// File: /concept/qualities/setData.quality.ts
import { createQualityCardWithPayload, defaultMethodCreator, type Quality } from 'stratimux';
import type { MyConceptState } from '../myConcept.concept.js';
import type { MyConceptSetDataPayload } from './types.js';

export type MyConceptSetData = Quality<MyConceptState, MyConceptSetDataPayload>;

export const myConceptSetData = createQualityCardWithPayload<
  MyConceptState,
  MyConceptSetDataPayload
>({
  type: 'myConcept set data',
  reducer: (state, { payload }) => {
    // ALTERNATIVE: Destructure payload directly from action
    const { data, timestamp } = payload;
    
    return {
      data,
      lastUpdated: timestamp || Date.now()
    };
  },
  methodCreator: defaultMethodCreator,
});
```

### Pattern 4: Complex Array/Object Updates

```typescript
// File: /concept/qualities/updateBuffer.quality.ts
import { createQualityCardWithPayload, defaultMethodCreator, selectPayload, type Quality } from 'stratimux';
import type { MyConceptState } from '../myConcept.concept.js';
import type { MyConceptUpdateBufferPayload } from './types.js';

export type MyConceptUpdateBuffer = Quality<MyConceptState, MyConceptUpdateBufferPayload>;

export const myConceptUpdateBuffer = createQualityCardWithPayload<
  MyConceptState,
  MyConceptUpdateBufferPayload
>({
  type: 'myConcept update buffer',
  reducer: (state, action) => {
    const { id, operation, data } = selectPayload<MyConceptUpdateBufferPayload>(action);
    
    if (operation === 'add') {
      return {
        // IMMUTABLE: Create new array with added item
        buffer: [...state.buffer, { id, data, timestamp: Date.now() }]
      };
    } else if (operation === 'remove') {
      return {
        // IMMUTABLE: Filter out item by ID
        buffer: state.buffer.filter(item => item.id !== id)
      };
    } else if (operation === 'update') {
      return {
        // IMMUTABLE: Map and update specific item
        buffer: state.buffer.map(item => 
          item.id === id 
            ? { ...item, data, timestamp: Date.now() }
            : item
        )
      };
    }
    
    // No change needed
    return {};
  },
  methodCreator: defaultMethodCreator,
});
```

### Pattern 5: Advanced Method Creator (Complex Logic)

```typescript
// File: /concept/qualities/complexOperation.quality.ts
import { 
  createQualityCardWithPayload, 
  createMethodWithState, 
  selectPayload,
  strategySuccess,
  strategyFailed,
  type Quality 
} from 'stratimux';
import type { MyConceptState } from '../myConcept.concept.js';
import type { MyConceptDeck } from '../myConcept.concept.js';
import type { MyConceptComplexOperationPayload } from './types.js';

export type MyConceptComplexOperation = Quality<
  MyConceptState, 
  MyConceptComplexOperationPayload, 
  MyConceptDeck
>;

export const myConceptComplexOperation = createQualityCardWithPayload<
  MyConceptState,
  MyConceptComplexOperationPayload,
  MyConceptDeck
>({
  type: 'myConcept complex operation',
  reducer: (state, action) => {
    const { targetValue } = selectPayload<MyConceptComplexOperationPayload>(action);
    
    return {
      targetValue,
      isProcessing: true
    };
  },
  methodCreator: () => createMethodWithState(({ action, state, deck }) => {
    if (action.strategy) {
      const { validateOperation } = selectPayload<MyConceptComplexOperationPayload>(action);
      
      // Complex validation logic
      if (validateOperation && state.someProperty > 10) {
        return strategySuccess(action.strategy);
      } else {
        return strategyFailed(action.strategy);
      }
    }
    
    return action;
  })
});
```

### Pattern 6: Performance-Optimized No-State-Change

```typescript
// File: /concept/qualities/conditionalUpdate.quality.ts
export const myConceptConditionalUpdate = createQualityCardWithPayload<
  MyConceptState,
  MyConceptConditionalUpdatePayload
>({
  type: 'myConcept conditional update',
  reducer: (state, action) => {
    const { condition, newValue } = selectPayload<MyConceptConditionalUpdatePayload>(action);
    
    // PERFORMANCE: Return empty object when no change needed
    if (!condition || state.currentValue === newValue) {
      return {}; // No state listeners notified
    }
    
    return {
      currentValue: newValue
    };
  },
  methodCreator: defaultMethodCreator,
});
```

### Critical Anti-Patterns to Avoid

#### WRONG: Legacy typeof Pattern
```typescript
// DON'T DO THIS (causes compilation failures in v0.3.2+)
const qualities = { actionOne, actionTwo };
export type MyConceptQualities = typeof qualities;
```

#### WRONG: Incorrect API Usage
```typescript
// DON'T DO THIS (not public API)
import { createQuality } from 'stratimux';

// DON'T DO THIS (wrong type parameter order)
export type MyQuality = Quality<Payload, State>; // Should be <State, Payload>
```

#### WRONG: State Spreading
```typescript
// DON'T DO THIS (notifies ALL state listeners)
return {
  ...state,           // INEFFICIENT: Entire state copied
  changedProp: value  // Only this actually changed
};
```

#### WRONG: Mutating State
```typescript
// DON'T DO THIS (breaks immutability)
state.array.push(newItem);  // Direct mutation
return state;               // Same reference returned
```

### Quality Implementation Checklist

Before considering a quality complete, verify:
- [ ] Uses `createQualityCard` or `createQualityCardWithPayload` APIs
- [ ] Explicit Quality type export with correct type parameter order
- [ ] Payload extraction uses `selectPayload<T>(action)` or destructuring
- [ ] Reducer returns only changed state properties (Shortest Path Principle)
- [ ] All array/object updates maintain immutability
- [ ] Import paths use `.js` extensions for TypeScript compliance
- [ ] Type imports use `type` keyword where appropriate
- [ ] No `typeof` patterns in type definitions

### Quality Type Definition Pattern

```typescript
// File: /concept/qualities/types.ts
export type MyConceptActionOnePayload = {
  property: string;
  value: number;
};

export type MyConceptActionTwoPayload = {
  items: string[];
  timestamp: number;
};

// Individual Quality Types
export type MyConceptActionOne = Quality<MyConceptState, MyConceptActionOnePayload>;
export type MyConceptActionTwo = Quality<MyConceptState, MyConceptActionTwoPayload>;
export type MyConceptSimpleAction = Quality<MyConceptState>;

// Combined Qualities Type (for concept definition)
export type MyConceptQualities = {
  myConceptActionOne: MyConceptActionOne;
  myConceptActionTwo: MyConceptActionTwo;
  myConceptSimpleAction: MyConceptSimpleAction;
};
```

This comprehensive guide ensures your qualities follow Stratimux v0.3.2 best practices and maintain optimal performance through the Shortest Path Principle.

**NOTE**: The "Advanced Pattern: Two-Stage KeyedSelector Routing for Parameter Observation" section exists at STRATIMUX-REFERENCE.md lines 609-738, which falls within the DECK K Constant Pattern section (covered by an earlier skill in this Suite 8).
