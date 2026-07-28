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

---

## Menu-State-Machine Quality Completeness (M71 CSRP — 7-Slot Checklist)

**Origin**: Codified by Cycle 135 of the SuiteCascadeSystem project (B.7 Regression #3). The `SYNTHETIC_INSTALL_SCP` menu row was present in the render path but absent from cursor navigation branches — the row was visible but unreachable. The 7-slot CSRP (Cursor-Selection-Render-Parity) checklist is the discipline that prevents this regression class.

### When CSRP Applies

When a Quality introduces a new synthetic identifier into a menu, navigation, or selection state machine. Examples: new `SYNTHETIC_*` menu rows, new tab identifiers, new modal types, new keyboard shortcut targets.

### The 7-Slot Checklist

For every new `SYNTHETIC_*` constant (or analogous menu-identifier), verify presence in ALL 7 structural slots:

| Slot | Location | Verification |
|------|----------|--------------|
| 1 | Constant declaration | `const SYNTHETIC_NEW_ROW = 'synthetic_new_row';` |
| 2 | Type union membership | `type SyntheticRowId = ... | typeof SYNTHETIC_NEW_ROW;` |
| 3 | rowId helper / isSyntheticRow predicate | Predicate function returns `true` for the new constant |
| 4 | Render path emission (primary) | `renderMenu` emits the row (conditionally or unconditionally) |
| 5 | Render path legacy (if exists) | `renderMenuLegacy` matches Slot 4 — same condition |
| 6 | Navigation up-branch | `applyKeypress case 'up'` has a branch for the new constant |
| 7 | Navigation down-branch | `applyKeypress case 'down'` has a branch for the new constant |

Additional slots when applicable:
- **Enter handler**: `applyKeypress case '\r'` (or `case 'enter'`) has a branch for the new constant
- **RESERVED_LINES update**: if the row adds a visible line, the `RESERVED_LINES_WITH_*` pagination constant is updated AND used in both render and navigation

### CSRP Verification Concluder

```bash
# Quantitative completeness check
grep -c "{NEW_SYNTHETIC_CONSTANT}" src/lib/{menu-file}.ts
# Expected: at least 7 occurrences (one per slot)

# Pre-vs-post hotfix delta example from B.7 R5 of #3:
#   grep -c SYNTHETIC_INSTALL_SCP src/lib/bridge/menu.ts
#   Pre-hotfix:  7 occurrences (incomplete — render path only)
#   Post-hotfix: 23 occurrences (complete — navigation chain restored)
```

### Why tsc Cannot Detect CSRP Failures

A `SYNTHETIC_*` constant that appears in the type union but is missing from a `case 'up'` branch is structurally valid TypeScript — the missing branch simply means the row is unreachable, not that the code is malformed. `tsc EXIT 0` does NOT certify navigation graph completeness.

M71 CSRP is the human checklist that compensates for the type system's blind spot. The pattern of failure: render path passes review (the reviewer SEES the new row appear), navigation gap escapes review (the reviewer doesn't try to navigate to it), runtime smoke surfaces the gap only when a user actually attempts navigation.

### CSRP Quality Authoring Pattern

When authoring a Quality that introduces a new menu identifier, the Quality file SHOULD reference the menu file that requires CSRP updates:

```typescript
// File: src/lib/{conceptName}/qualities/showNewRow.quality.ts
// MENU-STATE-MACHINE QUALITY: introduces SYNTHETIC_NEW_ROW into the bridge menu
// CSRP discipline (M71) — verify 7-slot completeness in src/lib/bridge/menu.ts:
//   [ ] Constant declaration
//   [ ] Type union member of SyntheticRowId
//   [ ] isSyntheticRow predicate branch
//   [ ] renderMenu emission
//   [ ] renderMenuLegacy emission
//   [ ] applyKeypress case 'up' branch
//   [ ] applyKeypress case 'down' branch
//   [ ] applyKeypress case '\r' (Enter) branch if interactive
// Concluder: grep -c SYNTHETIC_NEW_ROW src/lib/bridge/menu.ts ≥ 7

export const myConceptShowNewRow = createQualityCard<MyConceptState>({ /* ... */ });
```

---

## MMUI — Module-Map Pattern for Non-Serializable Resources (Quality Context)

**Cross-reference to S13 §MMUI Module-Map Pattern.** Qualities that manage non-serializable resources (ChildProcess, FSWatcher, Socket) MUST store the resource in a module-scope Map and keep only the serializable key in state.

```typescript
// File: src/lib/{conceptName}/qualities/spawnProcess.quality.ts
import { createQualityCardWithPayload, createMethodWithState, type Quality } from 'stratimux';
import { registerSpawn } from '../scpSpawnManager.runtime';  // Module-scope Map

export type ScpSpawnManagerSpawnProcess = Quality<ScpSpawnManagerState, { command: string }, ScpSpawnManagerDeck>;

export const scpSpawnManagerSpawnProcess = createQualityCardWithPayload<
  ScpSpawnManagerState,
  { command: string },
  ScpSpawnManagerDeck
>({
  type: 'scpSpawnManager spawn process',
  reducer: (state, action) => {
    const id = generateId();  // Serializable key
    return {
      activeSpawnIds: [...state.activeSpawnIds, id]
    };
  },
  methodCreator: () => createMethodWithState(({ action, state }) => {
    const { command } = selectPayload<{ command: string }>(action);
    const proc = childProcess.spawn(command);  // Non-serializable resource
    registerSpawn(state.activeSpawnIds[state.activeSpawnIds.length - 1], proc);  // MMUI Map
    return action;
  }),
});
```

The Quality's reducer mutates ONLY the serializable key in state. The non-serializable resource is registered in the module-scope Map via the runtime module's API. This separation is what makes the Quality serialization-safe and replay-compatible.

---

## WGHA — WeakSet Handler-Binding Guard (Quality Context)

**Origin**: Codified during Cycle 131 of the SuiteCascadeSystem project (B.1 scpRegistryWatcher).

**The Hazard**: When a Quality (or its principle) registers event handlers — filesystem watchers, process event listeners, socket handlers — re-execution of the plan stage will attempt to RE-BIND the handler. The result: duplicate handlers, amplified event callbacks, memory leaks.

### The WGHA Pattern

A module-scope `WeakSet` tracks whether a handler has already been bound to a given target. The binding step gates on the WeakSet membership.

```typescript
// File: src/lib/{conceptName}/{conceptName}.runtime.ts
// Module-scope guard — survives plan re-execution
const boundHandlers = new WeakSet<object>();

export const bindWatcherOnce = (watcher: FSWatcher, handler: (event: string) => void): void => {
  if (boundHandlers.has(watcher)) {
    return;  // Already bound — skip
  }
  watcher.on('change', handler);
  boundHandlers.add(watcher);
};
```

```typescript
// Quality / Principle usage
methodCreator: () => createMethodWithConcepts(({ action, deck }) => {
  const watcher = getWatcher(deck.concept.k.watcherId.select());  // From MMUI Map
  bindWatcherOnce(watcher, handleChange);  // Idempotent binding
  return action;
}),
```

### Why WGHA Cannot Be Replaced by Component-Level Guards

A reducer-internal "have I bound this yet?" check is unreliable because reducer state is part of replayable serialization — replay re-runs the binding logic. A module-scope WeakSet is OUTSIDE the replayable surface; it tracks the actual runtime binding state, not the recorded intent.

### WGHA Verification

```bash
# Locate handler-binding sites in production code paths
grep -rn "\.on(\|\.addEventListener(" src/lib/{conceptName}/ | grep -v test
# Each binding site MUST be guarded (WeakSet membership check)

# Locate the WeakSet guards
grep -rn "WeakSet\|boundHandlers" src/lib/{conceptName}/
# Expected: at least one WeakSet for each Concept managing external listeners
```

---

## Quality Authoring Cross-References (B.7 Lineage)

The B.7 cycle and Triple-Regression Arc produced these Quality-creation doctrinal additions:
- **M71 CSRP 7-slot checklist** — this section §Menu-State-Machine Quality Completeness
- **MMUI Module-Map** — this section §MMUI (Quality Context) + S13 §MMUI Module-Map Pattern
- **WGHA WeakSet Handler-Binding Guard** — this section §WGHA (Quality Context)
- **Startup Admission Strategy multi-dispatch** — see S7 §Startup Rescan as Admission Strategy Re-dispatch

See **S14 §7.6 UX State Machine Completeness** for the from-scratch authoring procedure that applies M71. See **S13 §MMUI Module-Map Pattern** for the broader state-design rationale.

---

### Diameter Junction Quality Type-String Equality Invariant (S15 Pointer)

Verbose Split Naming (the NON-NEGOTIABLE Quality naming discipline) takes on a load-bearing structural role when a Quality participates in a Diameter junction (FNES suffix `.huirth.diameter.ts` or `.client.diameter.ts`). In that case, the type string IS the Diameter — the only link between the Client Induction Quality and the Huirth Real Quality across the WebSocket boundary. It must be IDENTICAL across:

1. `createDiametricQuality(...)` call in the Client concept
2. `createQualityCard({ type: '...', ... })` in the Huirth quality file
3. `demometers.qualities[n].type` in `*.muxonomy.ts`
4. `actionExchange[direction][m].actionType` in `*.muxonomy.ts`

Any mismatch breaks runtime routing silently (no TypeScript error). Additionally, the Induction variable name MUST carry the `Induction` suffix (CISV — Critical Induction Suffix Invariant); without it, the `toReal` transformation fails and an infinite action loop results at runtime. See **S15 §5 Diameter Qualities (DQWDS + CISV)** and **S16 §4 Quality Diameter** for the type-string-equality invariant in Diameter junctions and the full CISV CRITICAL warning.
