# S7 — Dispatch Patterns

**Domain**: Critical distinction between outer muxium dispatches and stage dispatches, flow control, and action overflow prevention
**Trigger**: When implementing action dispatch logic, debugging system lockups, or choosing between direct dispatch and planning scope
**STRATIMUX-REFERENCE.md**: Lines 2033-2211

---

## Critical Dispatch Pattern Differences (Essential Knowledge)

**Understanding the fundamental difference between dispatch patterns in Stratimux is critical to prevent system lockup and ensure proper flow control.**

### Two Distinct Dispatch Patterns

#### 1. Outer Muxium Dispatches (One-Shot Operations)
**Used for direct action dispatch without flow control or reactive stages.**

```typescript
// CORRECT: Outer muxium dispatch pattern
muxium.dispatch(action);
// Notice: NO stage options object - this is immediate one-shot dispatch

// Examples of correct outer dispatch usage:
muxium.dispatch(
  muxium.deck.d.concept.e.setProperty({ value: 'new value' })
);

// From UI components or external contexts
const handleClick = () => {
  muxium.dispatch(
    muxium.deck.d.concept.e.userAction({ data: buttonData })
  );
};
```

#### 2. Stage Dispatches (Flow-Controlled Operations)
**Used within planning scope stages with explicit flow control.**

```typescript
// CORRECT: Stage dispatch pattern
stage(({ dispatch, d }) => {
  dispatch(d.concept.e.action({ data: 'value' }), { 
    iterateStage: true // REQUIRED: Explicit stage options
  });
});

// Available stage options:
{ iterateStage: true }   // Move to next stage
{ iterateStage: false }  // Stay on current stage for next iteration
{ }                      // Complete current plan iteration
```

### Critical Anti-Pattern (Causes System Lockup)

**NEVER mix the patterns - this causes immediate system failure:**

```typescript
// CRITICAL ERROR: Using stage options with outer dispatch
muxium.dispatch(action, {}); // WRONG - causes undefined errors

// CRITICAL ERROR: Missing stage options in stage dispatch
stage(({ dispatch, d }) => {
  dispatch(d.concept.e.action()); // WRONG - no stage options causes lockup
});
```

### Action Overflow Prevention

**Stage dispatches must be throttled to prevent action overflow that locks the priority queue:**

#### Correct: Throttled Stage Dispatch
```typescript
stage(({ dispatch, d }) => {
  const needsAction = d.concept.k.shouldProcess.select();
  
  if (needsAction) {
    // Throttled dispatch with explicit iteration control
    dispatch(d.concept.e.processItem(), { 
      iterateStage: true // Moves to next stage, preventing immediate re-execution
    });
    return;
  }
  
  // Alternative path with controlled flow
  dispatch(d.concept.e.idle(), { 
    iterateStage: false // Stay on stage but wait for next plan iteration
  });
});
```

#### Wrong: Uncontrolled Stage Dispatch
```typescript
stage(({ dispatch, d }) => {
  // DANGER: Missing stage options can cause infinite dispatch recursion
  dispatch(d.concept.e.processItem()); // System lockup risk!
});
```

### When to Use Each Pattern

#### Use Outer Muxium Dispatch When:
- Triggering actions from UI components
- Responding to external events (WebSocket, HTTP, user input)
- Simple state updates without reactive logic
- No need for stage-based flow control

#### Use Stage Dispatch When:
- Inside planning scope (principles, muxium.plan())
- Need reactive flow control between operations
- Implementing multi-stage logical sequences
- Building orchestrated concept behaviors

### Key Success Indicators

**Your dispatch pattern is correct when:**
- No "Cannot read properties of undefined" errors
- Actions execute in expected sequence
- No infinite recursion or system lockups
- Proper flow control between planning stages
- Clean separation between one-shot and flow-controlled operations

**This distinction is fundamental to Stratimux architecture and must be understood for successful development.**

### Shortest Path Dispatch Pattern (Efficiency Optimization)

**When you have direct muxium access and only need to dispatch an action without reactive logic, use direct dispatch instead of creating unnecessary planning scope.**

#### Efficient Direct Dispatch Pattern
```typescript
// When you only need to dispatch, not observe state changes
const handleSimpleAction = () => {
  // Direct dispatch via muxium.deck - no planning scope needed
  muxium.dispatch(
    muxium.deck.d.myConcept.e.myAction({ data: 'value' })
  );
};
```

#### Unnecessary Planning Overhead Pattern
```typescript
// INEFFICIENT: Creating full planning scope just to dispatch
const handleSimpleAction = () => {
  muxium.plan<ConceptDeck>('simple action', ({ stage, conclude }) => [
    stage(({ dispatch, d, stagePlanner }) => {
      dispatch(d.myConcept.e.myAction({ data: 'value' }), {
        iterateStage: true
      });
      stagePlanner.conclude();
    }),
    conclude()
  ]);
};
```

#### When to Use Each Pattern

**Use Direct Dispatch (`muxium.dispatch()`) when:**
- You only need to trigger an action
- No reactive state observation required
- Simple, one-time operations
- UI event handlers with direct actions

**Use Planning Scope (`muxium.plan()`) when:**
- You need to observe state changes
- Multi-stage reactive logic required
- Complex conditional workflows
- Long-running reactive processes

#### Performance Comparison
```typescript
// HIGH EFFICIENCY: Direct dispatch
muxium.dispatch(muxium.deck.d.concept.e.action());

// MEDIUM EFFICIENCY: Simple planning scope
muxium.plan('operation', ({ stage, conclude }) => [
  stage(({ dispatch, d }) => dispatch(d.concept.e.action(), {})),
  conclude()
]);

// COMPLEX LOGIC: Full planning scope (when needed)
muxium.plan('complex operation', ({ stage, conclude }) => [
  stage(/* reactive state observation and conditional logic */),
  stage(/* multi-step processing */),
  conclude()
]);
```
