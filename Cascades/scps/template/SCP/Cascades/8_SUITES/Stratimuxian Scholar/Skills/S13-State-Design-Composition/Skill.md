# S13 — Strategic State Management & Concept Composition Wisdom

**Domain**: State structure design, concept composition strategies, normalization, separation of concerns, reactivity design, optional property avoidance (KeyedSelector requirement), optimal reducer returns, state creator export for decomposition, DECK type composition, and advanced composition insights.
**Trigger**: Designing new concept state types; composing multiple concepts via muxifyConcepts; reviewing state structure for KeyedSelector compatibility; planning application architecture.
**STRATIMUX-REFERENCE.md**: Lines 3671-3996

---

## Strategic State Management & Concept Composition Wisdom

### Designing Effective State Structures

**Golden Rule**: Your state structure should mirror your problem domain, not your UI or implementation details.

#### Well-Designed State Examples

```typescript
// Good: Domain-focused state structure
export type ShoppingCartState = {
  items: CartItem[];           // Core business data
  totalAmount: number;         // Computed but cached value
  discountCode: string | null; // Optional business rule
  isCalculating: boolean;      // Process state indicator
  lastModified: Date;          // Audit information
};

// Good: Clear interface state
export type InterfaceState = {
  currentCommand: string;      // User input
  history: CommandEntry[];     // Interaction history
  availableCommands: string[]; // Valid options
  promptSymbol: string;        // Presentation config
  isProcessing: boolean;       // Process indicator
};
```

#### Poorly-Designed State Anti-Patterns

```typescript
// Bad: UI-focused instead of domain-focused
export type BadUIState = {
  modalOpen: boolean;          // UI implementation detail
  buttonColor: string;         // Presentation concern
  animationState: string;      // UI animation concern
  formData: any;               // Untyped business data
};

// Bad: Mixed concerns and unclear boundaries
export type BadMixedState = {
  userData: User;              // User domain
  apiErrors: ApiError[];       // Network domain  
  uiPreferences: UIConfig;     // Presentation domain
  temporaryVariables: any;     // Implementation details
};
```

### Concept Composition Strategies

**Principle**: Compose small, focused concepts rather than building monolithic ones.

#### Pattern 1: Feature-Based Composition
```typescript
// Each concept handles one domain responsibility
const muxium = muxification('E-commerce App', {
  user: createUserConcept(),           // Authentication & user management
  cart: createShoppingCartConcept(),   // Shopping cart operations
  products: createProductConcept(),    // Product catalog
  orders: createOrderConcept(),        // Order processing
  ui: createUIStateConcept()           // Cross-cutting UI state
});
```

#### Pattern 2: Layer-Based Composition  
```typescript
// Concepts organized by architectural layer
const muxium = muxification('Business App', {
  data: createDataLayerConcept(),      // Data access & persistence
  business: createBusinessLogicConcept(), // Domain rules & validation
  service: createServiceLayerConcept(), // External integrations
  presentation: createPresentationConcept() // UI state & interactions
});
```

#### Pattern 3: Using muxifyConcepts for State Decomposition
```typescript
// Child concept with decomposable state
export const createChildConcept = () => {
  return createConcept<ChildState, ChildQualities>(...);
};

export const initialChildState = (): ChildState => ({
  childProperty1: 'default',
  childProperty2: 0
});

// Parent concept that incorporates child state
export type ParentState = {
  parentProperty: string;
} & ChildState; // Decompose child state

export const createParentConcept = () => {
  return muxifyConcepts(
    [createChildConcept()], // Include child concept
    createConcept<ParentState, ParentQualities>(
      'parent',
      {
        parentProperty: 'value',
        ...initialChildState() // Decompose state creator
      },
      parentQualities,
      []
    )
  );
};
```

### State Design Best Practices

#### 1. **Normalize Complex Data**
```typescript
// Good: Normalized relationships
export type ProjectState = {
  projects: Map<string, Project>;     // Keyed by ID
  userProjects: Map<string, string[]>; // userID -> projectIDs
  activeProjectId: string | null;     // Single source of truth
};

// Bad: Denormalized duplicate data
export type BadProjectState = {
  projects: Project[];                // Array with duplicates
  userProjects: UserProjectData[];   // Duplicated project data
  activeProject: Project | null;      // Duplicate of project data
};
```

#### 2. **Separate Concerns Clearly**
```typescript
// Good: Clear separation of concerns
export type DataState = {
  entities: EntityData;       // Pure business data
  metadata: DataMetadata;     // Data about the data
};

export type UIState = {
  viewMode: 'list' | 'grid';  // View configuration  
  selectedItems: string[];   // Selection state
  filters: FilterCriteria;   // Display filters
};

// Bad: Mixed data and UI concerns
export type BadMixedState = {
  items: Item[];             // Business data
  selectedItems: string[];   // UI state
  sortOrder: 'asc' | 'desc'; // UI state
  lastApiCall: Date;         // Technical metadata
};
```

#### 3. **Design for Reactivity**
```typescript
// Good: Properties designed for selective reactivity
export type ReactiveState = {
  connectionStatus: 'connected' | 'disconnected'; // Status changes
  messageCount: number;                           // Counter updates
  activeUsers: string[];                          // List modifications  
  lastActivity: Date;                            // Timestamp updates
};

// Each property can be selectively observed:
// k.connectionStatus.select() - only reacts to connection changes
// k.messageCount.select() - only reacts to count changes
```

#### 4. **CRITICAL: Avoid Optional Properties in State (KeyedSelector Requirement)**
```typescript
// CRITICAL ERROR: Optional properties break DECK K Constant pattern
export type BrokenState = {
  requiredProperty: string;
  optionalProperty?: string;  // BREAKS KeyedSelector - NOT ACCESSIBLE via k.optionalProperty.select()
  undefinedProperty: string | undefined; // BREAKS KeyedSelector when undefined
  muxTapeBuffer?: BufferArea; // REAL EXAMPLE: Optional HTML buffer breaks state access
};

// CORRECT: All state properties must be defined with proper defaults
export type CorrectState = {
  requiredProperty: string;
  alwaysDefinedProperty: string;     // Always has a value
  arrayProperty: string[];           // Use empty array [] as default
  objectProperty: Record<string, any>; // Use empty object {} as default
  nullableProperty: string | null;   // Use null as explicit "empty" state
  muxTapeBuffer: BufferArea;        // FIXED: Always defined, initialized as []
};

// CORRECT: Proper state initialization with all properties defined
export const initialCorrectState = (): CorrectState => ({
  requiredProperty: '',
  alwaysDefinedProperty: 'default value',
  arrayProperty: [],                // Never undefined
  objectProperty: {},               // Never undefined  
  nullableProperty: null,           // Explicit null is OK
  muxTapeBuffer: [],               // FIXED: Always defined as empty array
});
```

**Why This Matters:**
- **KeyedSelector Foundation**: The DECK K Constant pattern relies on KeyedSelector system
- **Undefined Properties Vanish**: Optional (`?`) or undefined properties are not included in KeyedSelector generation
- **Breaks Reactivity**: `k.optionalProperty.select()` will not exist and cause TypeScript errors
- **State Access Failure**: Planning scope cannot access undefined properties via DECK patterns
- **Real-World Impact**: HTML Tape buffer example shows how this breaks actual functionality

**Fix Pattern:**
1. **Remove all `?` optional markers** from state type definitions
2. **Provide explicit defaults** in state initializers for all properties
3. **Use `null` instead of `undefined`** for "empty" states that need to be reactive
4. **Use empty arrays `[]` and objects `{}`** instead of optional properties

This is a **framework-level requirement** for Stratimux's reactive state system to function correctly.

#### 5. **CRITICAL: Optimal Reducer Returns (Shortest Path Principle)**

**Performance Rule**: Quality reducers should return **only the changed state slice**, not the entire state object.

```typescript
// INEFFICIENT: Returns entire state - notifies ALL state listeners
export const inefficientQuality = createQualityCardWithPayload<State, Payload>({
  type: 'inefficient update',
  reducer: (state, action) => {
    const payload = selectPayload<Payload>(action);
    return {
      ...state,                    // Spreads entire state
      targetProperty: newValue     // Only this actually changed
    };
  }
});

// EFFICIENT: Returns only changed slice - notifies ONLY relevant listeners
export const efficientQuality = createQualityCardWithPayload<State, Payload>({
  type: 'efficient update',
  reducer: (state, action) => {
    const payload = selectPayload<Payload>(action);
    return {
      targetProperty: newValue     // Only returns what changed
    };
  }
});
```

**Why This Matters:**
- **Shortest Path Notification**: Stratimux notifies listeners along the shortest path to changed data
- **Performance Optimization**: Prevents unnecessary re-renders and computations
- **Precise Reactivity**: Only components watching `targetProperty` get notified, not entire state tree
- **Scalability**: Critical for applications with complex state and many listeners

**Implementation Pattern:**
```typescript
// Instead of spreading state, return only what changed
return {
  muxTapeBuffer: [...state.muxTapeBuffer, newEntry]  // Only buffer listeners notified
};

// Not:
return {
  ...state,                                           // ALL listeners notified
  muxTapeBuffer: [...state.muxTapeBuffer, newEntry]
};
```

### Composition Integration Patterns

#### Pattern: State Creator Export for Decomposition
```typescript
// Interface concept exports its state creator
export const initialInterfaceState = (): InterfaceState => ({
  currentCommand: '',
  history: [],
  // ... other properties
});

// Parent concept decomposes this state using spread operator
export type ParentState = {
  parentSpecificProperty: string;
} & InterfaceState;

const initialParentState = (): ParentState => ({
  parentSpecificProperty: 'value',
  ...initialInterfaceState() // Decompose state
});
```

#### Pattern: DECK Type Composition
```typescript
// Individual concept deck types
export type UserDeck = {
  user: Concept<UserState, UserQualities>;
};

export type CartDeck = {
  cart: Concept<CartState, CartQualities>;
};

// Composed application deck type
export type AppDeck = UserDeck & CartDeck & {
  app: Concept<AppState, AppQualities>;
};

// Enables type-safe cross-concept communication
muxium.plan<AppDeck>('cross-concept logic', ({ stage, conclude }) => [
  stage(({ d }) => {
    const userId = d.user.k.currentUserId.select();
    const cartTotal = d.cart.k.totalAmount.select();
    // Use both in application logic
  })
]);
```

### Advanced Composition Wisdom

#### Insight 1: **Vertical vs Horizontal Composition**
- **Vertical**: Layer-based concepts (data -> business -> presentation)
- **Horizontal**: Feature-based concepts (user, cart, orders)
- **Hybrid**: Most real applications use both patterns

#### Insight 2: **State Ownership Clarity**  
- Each piece of state should have ONE concept that owns it
- Other concepts can READ via DECK but shouldn't duplicate
- Use composition to share state, not duplication

#### Insight 3: **Reactive Boundaries**
- Design state properties to minimize unnecessary reactivity
- Group frequently-changing data together
- Separate stable configuration from dynamic data

This strategic approach to state management and composition ensures your Stratimux applications remain maintainable, performant, and true to the framework's reactive philosophy.

---

## Canonical Registry Source Rule (M69)

**Origin**: Codified by Cycle 132 of the SuiteCascadeSystem project (B.7 Regression #2). The `scpRegistryStartupRescan` quality had been rewritten to use `readdirSync(observedPath)` for startup enumeration — the filesystem returned 3 entries (`.staging`, `template`, `Test011`); the canonical registry file `SCPs.json` contained 1 entry (`Test011`). The state diverged from canonical truth.

### The Rule

**When a Concept manages an inventory of registered items, the canonical inventory reader function is the authoritative source. Raw filesystem enumeration is the physical substrate but is NOT a registry access pattern.**

| Source | Returns | Is a Registry? |
|--------|---------|----------------|
| `readScpRegistry()` / `readRegistry()` — typed JSON reader | Typed entries with validated shape (`{name, version, ...}`) | YES (canonical) |
| `readdirSync(dirPath)` — raw filesystem listing | Untyped strings, includes `.staging`, `template`, hidden directories, system artifacts | NO (physical substrate) |
| `glob(pattern)` — pattern-matched filesystem | Untyped matches; can include cache/temp artifacts | NO (physical substrate) |

### Concrete Code Shape

```typescript
// CORRECT — canonical registry reader as the sole inventory source
import { readScpRegistry } from './scpRegistry.io';

export const scpRegistryStartupRescan = createQualityCard<ScpRegistryState>({
  type: 'scpRegistry startup rescan',
  reducer: (state) => state,  // No state change in reducer
  methodCreator: () => createMethodWithConcepts(({ action, deck }) => {
    // M69: source from canonical registry file
    const entries = readScpRegistry(state.basePath);
    // Re-dispatch admission ActionStrategy per entry (PDRC — see S7)
    // ...
  }),
});

// WRONG — filesystem-as-registry anti-pattern
const scpNames = fs.readdirSync(observedPath); // Returns ['.staging', 'template', 'Test011']
// Includes non-registry artifacts; count diverges from canonical registry
```

### Why M69 Matters

1. **Filesystem listings include sentinels**: `.staging` directories, `template` placeholders, hidden system files — none of which are valid registry entries
2. **Type safety is bypassed**: filesystem returns untyped strings; canonical reader returns typed records
3. **Validation cannot run**: a canonical reader validates entry shape; filesystem enumeration cannot
4. **Cross-process consistency**: the registry file is the contract between processes; the filesystem is a private snapshot

### M69 Verification Concluder

```bash
# Verify zero filesystem-as-registry violations in registry-managing Concepts
grep -rn "readdirSync\|fs.readdir" src/lib/{conceptName}/ | grep -v "test"
# Expected: 0 hits in production code paths
```

---

## Dual-Registry Divergence Hazard

**When a Muxium-internal registry (derived from filesystem watcher events) and an external canonical registry (e.g., `SCPs.json`) both exist, they CAN diverge.** This hazard is structural — both surfaces are valid in isolation, but their drift is what causes regressions.

### The Hazard Pattern

1. The canonical registry file changes (e.g., user edits `SCPs.json`)
2. A filesystem watcher event fires for the directory containing the file
3. The Muxium-internal state is updated FROM the watcher event
4. But the watcher event sources from the DIRECTORY, not the FILE — the count and identity differ

This was exactly the B.7 Regression #2 trajectory: filesystem watcher events were the source-of-truth for `installedScps`, but the watcher saw the parent directory (3 entries) while the canonical `SCPs.json` held 1 entry.

### Prevention Pattern

1. **Always source registry state from the canonical FILE**, even when triggered by a filesystem event
2. **The filesystem event is the TRIGGER; the canonical file is the SOURCE**
3. **Re-read the canonical file on every event** — do not cache from prior event payloads

```typescript
// CORRECT — filesystem event triggers canonical re-read
watcher.on('change', () => {
  const canonicalEntries = readScpRegistry(basePath);  // Re-source from canonical
  dispatch(scpRegistryUpdated({ entries: canonicalEntries }));
});

// WRONG — filesystem event payload as registry source
watcher.on('add', (filePath) => {
  const name = path.basename(filePath);  // Derives identity from filesystem
  dispatch(scpRegistryFsScpAdded({ name }));  // May not match canonical
});
```

---

## Cross-Type Annotation Discipline (M70 — PROVISIONAL)

**When two distinct types exist in a codebase with the same semantic purpose but different field names** (e.g., `ScpEntry { scpName: string }` and `RegistryEntry { name: string }`), both type definitions MUST carry cross-reference comments naming the other type and documenting which consumers use each.

### The Hazard

A registry-managing Concept may use one type internally and accept another type at the API boundary. Without cross-type annotation, downstream consumers cannot tell which type to use, and from-scratch reasoning will produce a third (incompatible) type.

### The Annotation Pattern

```typescript
// File: scp.type.ts
/**
 * ScpEntry — typed entry from SCPs.json canonical registry.
 *
 * RELATED TYPES (M70 cross-reference):
 *   - RegistryEntry (./registry.type.ts) — internal Muxium state shape
 *   - ScpFsEvent (./watcher.type.ts) — filesystem watcher payload shape
 *
 * Use ScpEntry when reading from canonical SCPs.json.
 * Use RegistryEntry when reading from Muxium state via DECK K.
 * Use ScpFsEvent when receiving filesystem watcher events.
 */
export type ScpEntry = {
  scpName: string;
  version: string;
  // ...
};
```

### M70 Verification Concluder

```bash
# Find homonymous types that lack cross-references
grep -l "export type Scp\|export type Registry" src/lib/{conceptName}/
# Each file in the result MUST contain "RELATED TYPES" or equivalent cross-reference comment
```

---

## MMUI — Module-Map Pattern for Non-Serializable Resources

**Origin**: Codified during Cycle 132 of SuiteCascadeSystem (B.4 scpSpawnManager actualization).

**The Constraint**: Stratimux state must be serializable (JSON-compatible). Non-serializable resources — `ChildProcess`, `ExpressApp`, `FSWatcher`, `Socket` handles, in-memory caches with cyclic references — CANNOT live in Concept state.

### The MMUI Pattern

Store non-serializable resources in a module-scope `Map<string, Resource>` keyed by a serializable identifier (UUID, Concept name, ULID). The state stores ONLY the key; the module-scope Map holds the resource.

```typescript
// File: src/lib/scpSpawnManager/scpSpawnManager.runtime.ts
// Module scope — NOT in state, NOT serialized
const spawnHandleMap = new Map<string, ChildProcess>();

export const registerSpawn = (id: string, proc: ChildProcess): void => {
  spawnHandleMap.set(id, proc);
};

export const getSpawn = (id: string): ChildProcess | undefined => {
  return spawnHandleMap.get(id);
};

export const releaseSpawn = (id: string): void => {
  const proc = spawnHandleMap.get(id);
  if (proc) {
    proc.kill();
    spawnHandleMap.delete(id);
  }
};
```

```typescript
// File: scpSpawnManager.type.ts
export type ScpSpawnManagerState = {
  // State holds the KEY only — serializable string identifiers
  activeSpawnIds: string[];
  activeSpawnsById: Record<string, { startedAt: number; pid: number }>;
  // NO ChildProcess fields here — non-serializable
};
```

### MMUI Verification Concluder

```bash
# Verify state files contain no non-serializable types
grep -E "FSWatcher|ChildProcess|Socket|ExpressApp" src/lib/{conceptName}/*.type.ts
# Expected: 0 hits in state type definitions

# Resource handles live in runtime modules, NOT state files
ls src/lib/{conceptName}/*.runtime.ts
# Expected: runtime modules exist for any Concept managing non-serializable resources
```

### Why MMUI Is Non-Obvious for From-Scratch Builders

A from-scratch builder will reasonably attempt to store `ChildProcess` directly in state — it is a JavaScript object, the type system accepts it, and the Concept compiles. The failure surfaces only when the state is serialized (Muxium internal state replay, persistence, debug snapshots) or when a Quality reducer tries to clone the object. By that point the architecture has hardened around the wrong shape.

MMUI is the codified workaround. State holds the serializable key; the runtime module holds the resource.

---

## filterKeys Discipline for Non-Serializable State

**When a Concept's state MUST contain a field that cannot be safely serialized** (a complex object with method references, a function, a Symbol), use the `filterKeys` mechanism to mark the field as non-serializable.

```typescript
import { createConcept } from 'stratimux';

export const createMyConcept = () => createConcept<MyState, MyQualities>(
  'myConcept',
  initialState,
  qualities,
  [],
  {
    filterKeys: ['nonSerializableField', 'anotherNonSerializableField']
  }
);
```

The Muxium runtime will skip these fields during serialization paths (state replay, debug snapshots, persistence). The fields remain accessible via DECK K within planning scope, but are not included in any serialization output.

**Trade-off**: filterKeys'd fields survive within a single Muxium lifetime but do NOT survive across replay boundaries. For cross-process or cross-session resource handles, MMUI is the more robust pattern.

---

## State Design Cross-References (B.7 Lineage)

The B.7 cycle and Triple-Regression Arc produced these state-design doctrinal additions:
- **M69 Canonical-Registry-Source** — this section §Canonical Registry Source Rule
- **M70 Type-Mismatch-Registry-Alert** — this section §Cross-Type Annotation Discipline
- **MMUI Module-Map** — this section §MMUI Module-Map Pattern
- **filterKeys discipline** — this section §filterKeys Discipline

See **S14 §7.5 Canonical Registry Discipline** for the from-scratch authoring procedure that applies M69. See **S7 §Startup Rescan Admission Strategy** for the dispatch pattern that completes M69's runtime story.

---

### FilterKeys + Canonical Registry at Muxonomy Level (S15 Pointer)

In Muxonomy-aware Concepts (those carrying a `*.muxonomy.ts` self-documentation file), the FilterKeys discipline takes on a second purpose: in addition to excluding non-serializable state from serialization (the existing M69 / filterKeys discipline), the filter keys also declare which state properties must NOT participate in the server↔client sync channel. The pattern is dual-declaration (FKSD — Filter Keys State Duality): the `CONCEPT_FILTER_KEYS` constant lives in `{name}.state.ts` (Canonical Registry Source at state level), and the SAME values are inlined in `MuxonomicConfig.filterKeys` and `MuxonomicConfig.sync.filterKeys` in `{name}.muxonomy.ts`. Both declarations enforce the same constraint from different structural boundaries — drift between them is undetected at compile time and surfaces only as unexpected server→client sync or as client-local config leaking to Huirth. See **S15 §6 Muxonomy Self-Documentation (MSDT)** § FKSD for the dual-declaration pattern, and **S16 §3 Type Demometer** for the canonical Notification implementation that demonstrates it.
