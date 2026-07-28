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

---

## Principle-Side Dispatch (`observer.next` Pattern — M59)

**Origin**: Codified for the Stratimux framework as M59 — ActionQue Inductive Reservation.

**The Rule**: Within a Principle's reactive subscription, dispatching downstream actions uses the `observer.next(action)` pattern. The state's `actionQue` field is RESERVED for bus-class Concepts that orchestrate cross-Concept action propagation — it is NOT a general-purpose dispatch mechanism.

### Principle-Side Dispatch via observer.next

```typescript
// File: src/lib/{conceptName}/principles/{conceptName}.principle.ts
import type { Principle } from 'stratimux';
import type { MyConceptDeck } from '../myConcept.type';

export const myConceptPrinciple: Principle<MyConceptDeck> = ({ observer, plan, conceptName }) => {
  return plan('my concept reactive', ({ stage, conclude }) => [
    stage(({ d, k }) => {
      const triggered = k.triggerCondition.select();
      if (triggered) {
        // CORRECT: principle-side dispatch via observer.next
        observer.next(d.myConcept.e.downstreamAction({ data: 'value' }));
      }
    }),
    conclude(),
  ]);
};
```

### When to Use Each Dispatch Form

| Context | Dispatch Form | Notes |
|---------|--------------|-------|
| Plan stage callback | `dispatch(action, { iterateStage: ... })` | Stage-controlled, single dispatch per stage |
| Outer muxium.dispatch | `muxium.dispatch(action)` | One-shot, no stage options |
| Principle reactive subscription | `observer.next(action)` | Principle-context, M59 ActionQue Reservation |
| Quality Method context (multi-dispatch) | `strategyBegin(createStrategy({ initialNode }))` | See Multi-Dispatch section below |

### M59 — ActionQue Inductive Reservation

The `state.actionQue` field on bus-class Concepts (action bus, command router, websocket gateway) holds queued actions destined for cross-Concept propagation. ONLY bus-class Concepts should read or write this field. A general-purpose Concept that attempts to push to `state.actionQue` is misusing the reserved channel.

**Verification**:
```bash
# State files that touch actionQue should be limited to bus-class Concepts
grep -rln "actionQue" src/lib/
# Expected: hits limited to known bus Concepts (e.g., scpDockHost, command-bus)
```

---

## ActionStrategy Multi-Dispatch from Method Context (`strategyBegin` Pattern)

**Origin**: Codified by Cycle 132 of the SuiteCascadeSystem project (B.7 Regression #2 hotfix). The `scpRegistryStartupRescan` quality needed to dispatch one `scpRegistryFsScpAdded` action per discovered SCP from within a Method context. `nextA` is unavailable in Method context (plan-only). The canonical pattern is `strategyBegin(createStrategy({ initialNode }))` with sequentially chained nodes.

### The Multi-Dispatch Pattern

```typescript
import { createStrategy, createNode, strategyBegin, type Quality } from 'stratimux';
import type { MyConceptState, MyConceptDeck } from '../myConcept.type';

export const myConceptMultiDispatch = createQualityCardWithPayload<
  MyConceptState,
  { entries: Array<{ name: string; data: unknown }> },
  MyConceptDeck
>({
  type: 'myConcept multi-dispatch',
  reducer: (state) => state,  // No state change in reducer
  methodCreator: () => createMethodWithConcepts(({ action, deck }) => {
    const { entries } = selectPayload<{ entries: Array<{ name: string; data: unknown }> }>(action);

    // Build a chain of nodes — one per entry
    const nodes = entries.map((entry) =>
      createNode({
        actionCreator: deck.myConcept.e.processEntry,
        payload: { name: entry.name, data: entry.data },
      })
    );

    // Chain nodes via successNode
    for (let i = 0; i < nodes.length - 1; i++) {
      nodes[i].successNode = nodes[i + 1];
    }

    // Start the strategy
    if (nodes.length > 0) {
      const strategy = createStrategy({
        topic: 'myConcept multi-dispatch sequence',
        initialNode: nodes[0],
      });
      strategyBegin(strategy);
    }

    return action;
  }),
});
```

### Why `nextA` Cannot Be Used Here

`nextA` is a plan-context primitive — it requires the planning scope structure (stage, dispatch, stagePlanner). Method context does NOT have these — it has only `action`, `state`, `deck`. Attempting `nextA` from a Method fails silently (the call exists but the dispatch never reaches the action stream).

`strategyBegin` is the Method-context-safe alternative. It enters the ActionStrategy machinery directly, which IS available from any context.

### Why Sequential Chain (Not Parallel)

Sequential chaining via `successNode` is the canonical Stratimux multi-dispatch shape. Parallel dispatch would race the reducer-pipeline ordering and produce non-deterministic state. The ActionStrategy graph's success/failure branching is sequential by design.

---

## Startup Rescan as Admission Strategy Re-dispatch (PDRC)

**Origin**: Codified by Cycle 132 of the SuiteCascadeSystem project (B.7 Regression #2 root cause). The startup rescan path did NOT re-dispatch the same admission ActionStrategy (`scpRegistryFsScpAdded`) that the runtime filesystem watcher uses for live events. The result: state divergence between startup-derived state and runtime-event-derived state.

### The PDRC Rule (Principle Dispatch Re-Confirm)

**A startup rescan must replay the same admission ActionStrategy chain that runtime events use.** Without this, the startup path produces a degenerate state — present in storage but absent from the lifecycle FSM.

### The Failure Mode

```typescript
// WRONG — startup path bypasses admission
export const scpRegistryStartupRescan = createQualityCard<ScpRegistryState>({
  type: 'scpRegistry startup rescan',
  reducer: (state) => {
    const entries = readScpRegistry(state.basePath);
    return { installedScps: entries };  // Direct state merge — admission strategy SKIPPED
  },
  methodCreator: defaultMethodCreator,
});
// Consequence: lifecycle FSM never sees admission; lifecycleByScp.size stays 0
```

### The PDRC Pattern

```typescript
// CORRECT — startup path re-dispatches admission ActionStrategy
export const scpRegistryStartupRescan = createQualityCardWithPayload<
  ScpRegistryState,
  Record<string, never>,
  ScpRegistryDeck
>({
  type: 'scpRegistry startup rescan',
  reducer: (state) => state,  // No direct state change
  methodCreator: () => createMethodWithConcepts(({ action, state, deck }) => {
    // M69: source from canonical registry
    const entries = readScpRegistry(state.basePath);

    // PDRC: re-dispatch admission ActionStrategy per entry
    const nodes = entries.map((entry) =>
      createNode({
        actionCreator: deck.scpRegistry.e.scpRegistryFsScpAdded,
        payload: { name: entry.name, version: entry.version, ...entry },
      })
    );
    for (let i = 0; i < nodes.length - 1; i++) {
      nodes[i].successNode = nodes[i + 1];
    }
    if (nodes.length > 0) {
      strategyBegin(createStrategy({
        topic: 'scpRegistry startup admission',
        initialNode: nodes[0],
      }));
    }

    return action;
  }),
});
```

### PDRC Verification

```bash
# Startup rescan Quality should dispatch the same admission action as the runtime watcher
grep -A 5 "scpRegistryStartupRescan\|registryStartupRescan" src/lib/{conceptName}/qualities/

# The admission ActionStrategy actionCreator should match the runtime event handler
grep -rn "scpRegistryFsScpAdded\|registryFsItemAdded" src/lib/{conceptName}/

# Both startup AND runtime paths should reference the same actionCreator
```

### KDDDB — Five-Axis Migration Verification Discipline

For migration-class changes affecting dispatch flow (deck key renames, Concept restructuring, new bus-class Concepts), apply the KDDDB verification axes:

| Axis | Check |
|------|-------|
| **K** — Key derivation | Are all renamed keys updated in dispatch action creators? |
| **D** — Dispatch sites | Does every dispatch site use the new action creator (not the old)? |
| **D** — Deck access | Does every `d.{concept}.e.{action}` resolve to the new structure? |
| **B** — Build gate | `tsc EXIT 0` + `npm run build EXIT 0` |
| **L** — Log surface | Does runtime smoke produce the expected log events (registry, admission, downstream)? |

KDDDB is the orthogonal verification framework for dispatch-class migrations — it composes with M65 (grep scope) and the broader Cinnabar Dialectic (S14 §7.7).

---

## Dispatch Pattern Cross-References (B.7 Lineage)

The B.7 cycle and Triple-Regression Arc produced these dispatch doctrinal additions:
- **M59 ActionQue Inductive Reservation** — this section §Principle-Side Dispatch
- **Multi-dispatch from Method (`strategyBegin`)** — this section §ActionStrategy Multi-Dispatch
- **PDRC startup admission re-dispatch** — this section §Startup Rescan as Admission Strategy Re-dispatch
- **KDDDB five-axis verification** — this section §KDDDB

See **S14 §7.5 Canonical Registry Discipline** for the from-scratch authoring procedure that applies PDRC. See **S4 ActionStrategy Orchestration** for the strategy graph mechanics that underlie multi-dispatch.
