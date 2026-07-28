# S12 — Critical Reducer Performance Optimization

**Domain**: The Shortest Path Principle for quality reducer state updates — partial state returns, empty object returns, performance impact demonstration, complex update patterns, and the quality reducer checklist.
**Trigger**: Reviewing or implementing quality reducers; diagnosing excessive re-renders or slow UI updates; performance optimization of state updates.
**STRATIMUX-REFERENCE.md**: Lines 3452-3668

---

## Critical Reducer Performance Optimization (ESSENTIAL)

### The Shortest Path Principle for State Updates

**CRITICAL PERFORMANCE RULE**: Quality reducers should return only the changed state slice, never the entire state object.

This is fundamental to Stratimux's reactive performance - returning partial state objects ensures only relevant subscribers are notified of changes.

### CORRECT: Partial State Return Pattern

```typescript
// File: addToBuffer.quality.ts
export const addToBuffer = createQualityCardWithPayload<
  MyConceptState,
  AddToBufferPayload
>({
  type: 'add to buffer',
  reducer: (state, { payload }) => {
    const { item } = payload;
    
    // CRITICAL: Only return the changed state slice
    return {
      buffer: [...state.buffer, item]
    };
    // Notice: No spreading of entire state object
  },
  methodCreator: defaultMethodCreator,
});
```

```typescript
// File: clearBuffer.quality.ts
export const clearBuffer = createQualityCard<MyConceptState>({
  type: 'clear buffer',
  reducer: (state) => {
    // CRITICAL: Only return the changed state slice
    return {
      buffer: []
    };
    // Notice: Not returning { ...state, buffer: [] }
  },
  methodCreator: defaultMethodCreator,
});
```

```typescript
// File: conditionalUpdate.quality.ts
export const conditionalUpdate = createQualityCardWithPayload<
  MyConceptState,
  ConditionalUpdatePayload
>({
  type: 'conditional update',
  reducer: (state, { payload }) => {
    const { shouldUpdate, newValue } = payload;
    
    // PERFORMANCE: Return empty object when no change needed
    if (!shouldUpdate || state.currentValue === newValue) {
      return {}; // No state change, no notifications
    }
    
    // CRITICAL: Only return the changed property
    return {
      currentValue: newValue
    };
  },
  methodCreator: defaultMethodCreator,
});
```

### WRONG: Full State Return Anti-Patterns

```typescript
// PERFORMANCE KILLER: Full state spreading
reducer: (state, { payload }) => {
  return {
    ...state,              // WRONG: Notifies ALL state listeners
    changedProperty: value // Only this actually changed
  };
}

// PERFORMANCE KILLER: Returning entire state reference
reducer: (state, { payload }) => {
  state.property = value;  // WRONG: Mutation + full state
  return state;           // WRONG: Returns entire state object
}

// INEFFICIENT: Unnecessary state spread for simple updates
reducer: (state) => {
  return {
    ...state,           // WRONG: Full state copy
    isActive: true     // Only this property changed
  };
}
```

### Performance Impact Demonstration

```typescript
// Example concept with multiple state properties
export type ExampleState = {
  userProfile: UserProfile;     // Large object
  notifications: Notification[]; // Large array  
  shoppingCart: CartItem[];     // Medium array
  uiPreferences: UIConfig;      // Small object
  currentPage: string;          // Primitive value
  isLoading: boolean;           // Primitive value
};

// EFFICIENT: Only shopping cart listeners are notified
const addToCart = createQualityCardWithPayload<ExampleState, AddToCartPayload>({
  type: 'add to cart',
  reducer: (state, { payload }) => {
    return {
      shoppingCart: [...state.shoppingCart, payload.item]
      // Only shoppingCart selectors receive updates
    };
  },
  methodCreator: defaultMethodCreator,
});

// INEFFICIENT: ALL state listeners are notified unnecessarily
const addToCartBad = createQualityCardWithPayload<ExampleState, AddToCartPayload>({
  type: 'add to cart bad',
  reducer: (state, { payload }) => {
    return {
      ...state,  // userProfile, notifications, ALL selectors notified!
      shoppingCart: [...state.shoppingCart, payload.item]
    };
  },
  methodCreator: defaultMethodCreator,
});
```

### When to Return What

#### Return Partial State Object `{ changedProp: value }`
- **When**: You're updating one or more specific properties
- **Effect**: Only selectors watching those properties get notified
- **Performance**: Optimal - minimal reactive notifications

#### Return Empty Object `{}`
- **When**: No state change is needed (condition not met, value unchanged)
- **Effect**: No selectors are notified of changes
- **Performance**: Maximum efficiency - zero reactive notifications

#### Return Full State `{ ...state, changes }`
- **When**: NEVER in production code (breaks performance paradigm)
- **Effect**: ALL selectors get notified regardless of what changed
- **Performance**: TERRIBLE - causes cascade of unnecessary updates

### Complex State Update Patterns

```typescript
// CORRECT: Multiple related property updates
const updateUserData = createQualityCardWithPayload<UserState, UserDataPayload>({
  type: 'update user data',
  reducer: (state, { payload }) => {
    const { userId, dataToken, expiresAt } = payload;
    
    // Return only the properties that actually changed
    return {
      userId,
      dataToken, 
      dataExpiresAt: expiresAt,
      lastLoginAt: Date.now()
    };
    // Notice: Not spreading the entire state
  },
  methodCreator: defaultMethodCreator,
});

// CORRECT: Array manipulation with partial return
const updateItemInArray = createQualityCardWithPayload<MyState, UpdateItemPayload>({
  type: 'update item in array',
  reducer: (state, { payload }) => {
    const { itemId, updates } = payload;
    
    const updatedItems = state.items.map(item => 
      item.id === itemId ? { ...item, ...updates } : item
    );
    
    // Only return the changed array, not entire state
    return {
      items: updatedItems
    };
  },
  methodCreator: defaultMethodCreator,
});
```

### Memory and Performance Benefits

1. **Reactive Efficiency**: Only relevant component subscriptions update
2. **Memory Optimization**: Unchanged state branches maintain references 
3. **Computation Savings**: Derived selectors only recalculate when dependencies change
4. **Network Efficiency**: State synchronization sends minimal diffs
5. **Developer Experience**: Clear intent about what actually changed

### Debugging Performance Issues

If you're experiencing:
- Excessive component re-renders
- Slow UI updates
- High memory usage
- Laggy user interactions

**Check your quality reducers** - they should follow the partial state return pattern shown above.

### Quality Reducer Checklist

Before shipping any quality, verify:
- [ ] Returns only changed properties (not `{ ...state, changes }`)
- [ ] Returns `{}` when no change is needed
- [ ] Maintains immutability for arrays/objects (`[...array]`, `{ ...object }`)
- [ ] No direct state mutations (`state.prop = value`)
- [ ] Clear intent about what properties are being updated
