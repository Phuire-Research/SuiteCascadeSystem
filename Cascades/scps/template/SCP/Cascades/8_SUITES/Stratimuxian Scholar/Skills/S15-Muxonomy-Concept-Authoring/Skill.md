# S15 — Muxonomy Concept Authoring

**Diameter**: Framework-General · Muxonomic Concept Authoring Patterns
**Domain**: Authoring any Stratimux Concept that participates in the Muxonomy pattern — MuxonomicConfig pairing, FNES file grammar, DCQF dual-concept-file deployment split, Diameter junction qualities (DQWDS), MSDT self-documentation, ZKHP Vue handoff, TOBM bridge model safety. PORTABLE across any Stratimux project using the Muxonomy substrate.
**Trigger**: Authoring a new Muxonomy-aware Concept; adding `*.muxonomy.ts` self-documentation to an existing Concept; designing Quality files whose behavior must cross the WebSocket boundary; implementing the Vue handoff pattern from a Stratimux principle to a Vue controller; creating bridge model helpers that dispatch notifications or side-effect actions inside an ActionStrategy; using the Notification Concept as a Copy-Paste-Plus source (M63) for a new domain.
**Status**: NEW Skill from the Notification-Manifold Formalization Macro · Phase 3 Cobalt actualization · 2026-05-19. Reinforced by Suite 1 Maroon curation, Suite 2 Rust naming (17 pattern abbreviations), Suite 3 Ochre architecture, Suite 4 Viridian hazard audit (H1-H5).

---

## Pearl Summary

S15 Muxonomy Concept Authoring — a Muxonomic Concept (MAC) is an `AnyConcept` paired with a `MuxonomicConfig` declaration; the pair travels together as a `MuxonomicConcept<'conceptName'>` and is the atomic unit of Muxonomy registration. FNES (Filename-Encoded Deployment-and-Diameter Suffix Grammar) encodes deployment target and Diameter junction status directly in each filename — `{name}.{part}.{location?}.{diameter?}.ts` — making every file a machine-readable Demometer declaration. DCQF (Dual-Concept-File Single-ConceptName Deployment-Split) produces two concept files sharing the same `conceptName` string and `State` type but with divergent Quality registrations: the Client file hosts the Induction, the Huirth file hosts the Real. CISV CRITICAL INVARIANT: the variable holding `createDiametricQuality(...)` result MUST carry the `Induction` suffix or the `toReal` transformation fails and causes an infinite action loop at runtime — this is the most dangerous silent failure in the pattern. MSDT (Muxonomy Self-Documentation through Declarative Demometer Type Table) requires every Muxonomic Concept to carry a `*.muxonomy.ts` file that is simultaneously the configuration AND the authoritative topology map. TOBM (muxiumTimeOut Bridge Model Helper Group) prevents premature ActionController closure by scheduling notification dispatches outside the current strategy scope. ZKHP (Zero Knowledge Handoff Pattern) completes the Stratimux-to-Vue ownership transfer: principle calls `controller.take()`, then dispatches clear for each item, leaving Stratimux with zero knowledge of what was handed off.

---

## §1 — When to Invoke

Invoke S15 when authoring a Concept that spans Client + Huirth deployments; adding `*.muxonomy.ts` self-documentation; designing Diameter junction qualities (WebSocket-crossing); implementing the Vue handoff (Stratimux principle → Vue controller); creating bridge model helpers for ActionStrategy-internal dispatch; using the Notification Concept as a Copy-Paste-Plus source (M63). S15 is framework-general — for the SCS-specific Notification Concept exemplar see **S16**; for the Template SCP runtime walk-through see **SCP-Researcher SCP-S13 (`Skills/ConceptAuthoring.md`)**.

---

## §2 — The Muxonomic Concept

A standard Stratimux Concept is a runtime unit: `createConcept(name, state, qualities, principles)`. It governs its own domain within a Muxium.

A **Muxonomic Concept** is that same Concept PAIRED with a `MuxonomicConfig` declaration — a machine-readable topology map that declares:
- Which state properties must not sync (filterKeys)
- Which qualities are Diameter junctions (cross-boundary)
- Which qualities run on All, Huirth, or Client deployments
- Which principles run on which deployment targets
- The `actionExchange` routing contract (AESR) for runtime cross-boundary dispatch

The pair is created via `createMuxonomic{ConceptName}()` and returns a `MuxonomicConcept<'conceptName'>`:

```typescript
// The atomic Muxonomy registration unit
export function createMuxonomicNotification(): MuxonomicConcept<'notification'> {
  return {
    concept: createNotificationConcept(),
    muxonomy: notificationMuxonomic,
  };
}
```

**Why the pair matters**: the Muxium Creator reads `muxonomy` to auto-wire filterKeys, novel change detection, sync configuration, navigation, and registry codegen. Passing only the concept omits all of this — the Muxonomy registration chain breaks silently. This is the MCUC (MuxonomicConcept Union-Coupling) invariant.

### Demometer — Diameter — Muxameter in a Muxonomic Concept

| Term | Role in Concept |
|------|----------------|
| **Demometer** | Each independent file: the type file, Client concept file, Huirth concept file, each quality file, each principle file — each is a distinct measurement unit |
| **Diameter** | The shared type string `'Concept Quality Name'` that connects the Client Induction quality to the Huirth Real quality across the WebSocket boundary |
| **Muxameter** | The total Concept — all Demometers composing through their Diameters into one integrated, self-documenting runtime unit |

A Muxonomic Concept IS a Muxameter at its scope. The `*.muxonomy.ts` file IS the written record of that Muxameter's topology.

**Contrast with flat-Concept authoring**: a non-Muxonomic Concept has one concept file, qualities, principles, and a state — but no self-documentation, no deployment targeting, no Diameter junction qualities, and no machine-readable registry entry. When a Concept needs to operate bidirectionally across a WebSocket boundary, flat authoring is insufficient. Muxonomic authoring adds the self-documentation layer that makes the Concept legible to both developers and codegen tools.

---

## §3 — File-Naming Grammar (FNES)

**FNES — Filename-Encoded Deployment-and-Diameter Suffix Grammar (Muxonomic Naming Encoding System)**

Every file in a Muxonomic Concept directory encodes THREE pieces of information in its filename suffix: the concept part, the deployment target, and the Diameter junction status.

### Grammar Rules

```
{name}.{part}.ts                          — All deployments, no Diameter
{name}.{part}.{location}.ts               — Targeted deployment, no Diameter
{name}.{part}.{location}.diameter.ts      — Targeted deployment, IS a Diameter junction
```

Where:
- `{part}` = `concept` | `quality` | `principle` | `state` | `type` | `muxonomy` | `model`
- `{location}` = `huirth` | `client` (absent = `All`)
- `.diameter` = present means `diameter: true`; absent means `diameter: false`

### Production Table

| Filename Pattern | Location | Diameter | Example |
|-----------------|----------|----------|---------|
| `{name}.quality.ts` | All | false | `addNotification.quality.ts` |
| `{name}.quality.{location}.ts` | Huirth or Client | false | (isolated, no dummy on other side) |
| `{name}.quality.{location}.diameter.ts` | Huirth or Client | true | `helloWorld.quality.huirth.diameter.ts` |
| `{name}.principle.{location}.ts` | Huirth or Client | n/a | `notificationDisplay.principle.client.ts` |
| `{name}.concept.ts` | All (base) | n/a | `notification.concept.ts` |
| `{name}.concept.{location}.ts` | Deployment-split | n/a | `notification.concept.huirth.ts` |
| `{name}.muxonomy.ts` | Config (all) | n/a | `notification.muxonomy.ts` |

**Critical rule — Principles**: Principles have no `diameter` option. A Principle is either included or excluded from a deployment target. "A dummy principle would be meaningless" — a Principle with no implementation produces no observable effect, unlike a Diameter junction quality where the Induction serves a real routing function.

**StratiVERSE reads FNES**: The file naming grammar is machine-parseable. StratiVERSE uses it to auto-populate the `demometers` table in `MuxonomicConfig`. Do NOT name files arbitrarily — every filename is a declarative Demometer registration.

**FNES Pattern Note (G3 from Viridian)**: The canonical form places the Real quality in a standalone `.huirth.diameter.ts` file (discoverable by FNES scan). The Client Induction MAY be inline in `.concept.ts` (current Notification Concept exemplar) OR extracted to a standalone `.client.diameter.ts` file. The inline form is functional but the extracted form enables StratiVERSE codegen auto-discovery of both Demometer sides. When authoring new Concepts for M63 Copy-Paste-Plus adoption, extracting the Client Induction to a standalone `.client.diameter.ts` file is preferred.

---

## §4 — Demometer Pair Pattern (DCQF)

**DCQF — Dual-Concept-File Single-ConceptName Deployment-Split Pattern (Demometric Concept File Pair)**

A Muxonomic Concept that spans Client and Huirth deployments has TWO concept files that share the same `conceptName` and `State` type but diverge in their Quality registrations:

| Attribute | Client File | Huirth File |
|-----------|------------|-------------|
| Filename | `{name}.concept.ts` | `{name}.concept.huirth.ts` |
| `conceptName` | identical | identical |
| `State` type | identical | identical |
| Diameter junction quality | Induction (`createDiametricQuality`) | Real (imported from `*.huirth.diameter.ts`) |
| Principle included | Client display principle | Huirth broadcast principle |
| Factory exported | `createMuxonomic{Name}()` | `createMuxonomic{Name}Huirth()` |

**This is NOT inheritance, NOT extension, NOT conditional logic**. Both files are independent. The Muxium on each deployment side includes the appropriate file. The other file is excluded by build targeting. The `conceptName` identity is preserved across the boundary because both share the same string constant from `*.type.ts`.

**UPCT — Unified Pre-Canonicalized Concept Type File**: A shared `{name}.type.ts` declares ALL types used by BOTH concept files: `State`, `Qualities`, `Deck`, `ConceptDeck`, `ModelDeck`, payload types. Both concept files import from this single source. This is an application of M69 Canonical-Registry-Source at the type level — neither deployment file can diverge from the type contract.

```typescript
// In notification.type.ts — shared across BOTH concept files
export const notificationName = 'notification';
export type NotificationModelDeck = MuxiumDeck & {
  notification: Concept<NotificationState, NotificationQualities>;
};

// In notification.concept.ts — Client
import { notificationName, type NotificationModelDeck } from './notification.type';

// In notification.concept.huirth.ts — Huirth
import { notificationName, type NotificationModelDeck } from './notification.type';
// Same import. Same type. Different qualities object.
```

---

## §5 — Diameter Qualities (DQWDS + CISV)

**DQWDS — Diametric Quality With DiametricState Type Intersection Utility Pattern**

A Diameter junction quality is one where the Real implementation lives on one Demometer (e.g., Huirth) and an Induction lives on the opposite Demometer (Client). Both share the same Verbose Split type string. The Induction does NOT execute locally — it routes the action to `actionQue`, which the muxified `webSocketClient` principle monitors and sends across the WebSocket to the Real side.

### The WithDiametricState Intersection

`WithDiametricState<S>` = `S & DiametricState` where `DiametricState = { actionQue: AnyAction[] }`.

The Induction quality's state parameter MUST be `WithDiametricState<ConceptState>` because the Induction reducer writes to `actionQue`. That field is NOT in `ConceptState` — it is provided at runtime by the muxified `webSocketClient` concept. The intersection is a **compile-time assertion** that the concept will be muxified alongside a `webSocketClient` at runtime:

```typescript
// diametric.model.ts — the substrate
export type DiametricState = { actionQue: AnyAction[] };
export type WithDiametricState<S extends Record<string, unknown>> = S & DiametricState;

// notification.concept.ts — the Client Induction
const notificationHelloWorldInduction = createDiametricQuality<
  WithDiametricState<NotificationState>,   // intersection — NOT just NotificationState
  NotificationModelDeck
>('Notification Hello World');             // Verbose Split type string — MUST match Real
```

### CISV — CRITICAL INVARIANT

> **CRITICAL: Induction Suffix Invariant (CISV)**
> The variable that holds the result of `createDiametricQuality()` or `createDiametricQualityWithPayload()` MUST carry the `Induction` suffix. Example: `const notificationHelloWorldInduction = createDiametricQuality(...)`. Without this suffix, the `toReal` transformation mechanism cannot identify the Induction variant, causing the action to route to `actionQue` on BOTH sides — an infinite action loop that compiles without error and fails silently at runtime.

```typescript
// CORRECT — toReal transformation succeeds
const notificationHelloWorldInduction = createDiametricQuality<...>('Notification Hello World');

// WRONG — toReal transformation fails, infinite action loop
const notificationHelloWorld = createDiametricQuality<...>('Notification Hello World');
```

**Why this is the most dangerous silent failure**: the WRONG version compiles without error. TypeScript sees a valid Quality assignment. The failure only surfaces at runtime: without the `Induction` suffix, the `toReal` mechanism in the WebSocket routing pipeline cannot distinguish Induction from Real. The action is queued, sent, the other side executes the Real, which may produce another action of the same type, which loops back — an infinite action loop with no TypeScript error and no explicit error message.

**Detection command** (run after creating any Diameter junction quality):
```bash
grep -n "createDiametricQuality" src/concepts/{conceptName}/{conceptName}.concept.ts
# Verify every match has 'Induction' at the end of its variable name
```

### Payload Variant

For qualities with payload, use `createDiametricQualityWithPayload`:

```typescript
const conceptQualityNameInduction = createDiametricQualityWithPayload<
  WithDiametricState<ConceptState>,
  QualityPayload,
  ConceptModelDeck
>('Concept Quality Name');
```

The payload is preserved through the `actionQue` routing — `strategyDetermine` wraps bare actions for `clientStateKey` routing if needed.

### The Type String IS the Diameter

The Verbose Split type string `'Notification Hello World'` is the only link between the Client Induction and the Huirth Real. It must be identical across:
1. The `createDiametricQuality(...)` call in the Client concept
2. The `createQualityCard({ type: '...', ... })` in the Huirth quality file
3. The `demometers.qualities[n].type` in `*.muxonomy.ts`
4. The `actionExchange[direction][m].actionType` in `*.muxonomy.ts`

Any mismatch breaks runtime routing silently. All four must be updated atomically on any rename.

### AESR + FNES Orthogonality

FNES governs build-time deployment (WHAT SHIPS WHERE). AESR (`actionExchange` in `MuxonomicConfig`) governs runtime routing intent (WHAT CROSSES THE BOUNDARY AT RUNTIME AND IN WHICH DIRECTION). Both must be consistent and both are required:

```typescript
// In *.muxonomy.ts — AESR makes the Diameter explicit at runtime level
actionExchange: {
  serverToClient: [
    {
      qualityName: 'conceptQualityName',
      actionType: 'Concept Quality Name',   // MUST match FNES type string
      direction: ExchangeDirection.ServerToClient,
    },
  ],
  clientToServer: [],
},
```

**HAZARD H3**: FNES and `actionExchange` are two independent sources of truth. Drift between them is undetected at compile time. Update both atomically on any rename.

---

## §6 — Muxonomy Self-Documentation (MSDT)

**MSDT — Muxonomy Self-Documentation through Declarative Demometer Type Table**

Every Muxonomic Concept MUST carry a `{name}.muxonomy.ts` file. This file is NOT just configuration — it is the authoritative machine-readable topology map of the Concept. StratiVERSE reads it to auto-generate `muxonomyRegistry.generated.ts`. Drift between the code and the documentation is impossible because the topology declaration IS the code.

### Minimum MuxonomicConfig Skeleton

```typescript
import { type MuxonomicConfig, ChangeDetectionMode, DeploymentTarget, ExchangeDirection } from '../muxonomy/muxonomy.model';

export const conceptMuxonomic: MuxonomicConfig<'conceptName'> = {
  conceptName: 'conceptName',
  filterKeys: ['propertyA'],                                                     // Client-local, no sync
  novelChange: { mode: ChangeDetectionMode.KeyedSelector },
  sync: { direction: 'toClient', filterKeys: ['propertyA'], novelChange: { mode: ChangeDetectionMode.KeyedSelector } },
  demometers: {
    qualities: [
      { name: 'conceptQualityOne', type: 'Concept Quality One', filePath: 'qualities/qualityOne.quality.ts',
        location: DeploymentTarget.All, diameter: false },
      { name: 'conceptDiameterQuality', type: 'Concept Diameter Quality',
        filePath: 'qualities/diameterQuality.quality.huirth.diameter.ts',
        location: DeploymentTarget.Huirth, diameter: true },
    ],
    strategies: [],
    principles: [
      { name: 'conceptDisplayPrinciple', filePath: 'principles/conceptDisplay.principle.client.ts',
        location: DeploymentTarget.Client },
      { name: 'conceptBroadcastPrinciple', filePath: 'principles/conceptBroadcast.principle.huirth.ts',
        location: DeploymentTarget.Huirth },
    ],
  },
  decks: { huirth: 'ConceptHuirthDeck', client: 'ConceptClientDeck' },
  actionExchange: {
    serverToClient: [{ qualityName: 'conceptDiameterQuality', actionType: 'Concept Diameter Quality',
                       direction: ExchangeDirection.ServerToClient }],
    clientToServer: [],
  },
};
```

See S16 §2 for the live notification.muxonomy.ts that actualizes this skeleton.

### DTEC — DeploymentTarget Enum Classification

`DeploymentTarget.All` — quality ships to both sides. Opposite side gets nothing (no deck entry, no dummy).
`DeploymentTarget.Huirth` with `diameter: true` — Real on Huirth, Induction dummy on Client.
`DeploymentTarget.Huirth` with `diameter: false` — Huirth-only, no client representation.
`DeploymentTarget.Client` with `diameter: true` — Real on Client, Induction dummy on Huirth (reverse direction).

Principles have no `diameter` option — they are included or excluded, never dummied.

### FKSD — Filter Keys State Duality

Filter keys MUST be declared in two places:

1. `{name}.state.ts` — as a named export constant `CONCEPT_FILTER_KEYS` (M69 Canonical Registry Source at state level)
2. `{name}.muxonomy.ts` — inline in the `filterKeys` array

Both declarations enforce the same constraint from different structural boundaries. This is NOT redundancy — it is dual-boundary enforcement. A state property that is a function, ShallowRef, or client-local display concern belongs in filterKeys.

```typescript
// In notification.state.ts
export const NOTIFICATION_FILTER_KEYS = ['notifications', 'maxVisible', 'defaultDuration'];

// In notification.muxonomy.ts — same values, independent enforcement
filterKeys: ['notifications', 'maxVisible', 'defaultDuration'],
```

---

## §7 — Zero Knowledge Handoff (ZKHP)

**ZKHP — Zero Knowledge Handoff Pattern — Stratimux Relinquishes Ownership to Vue Controller, Then Empties State**

The ZKHP pattern solves a fundamental ownership problem: Vue reactivity and Stratimux state live in separate ownership domains. A Concept that needs to display items (notifications, messages, alerts) cannot let both systems own the same data simultaneously without creating stale-data stacking across page navigations.

### The Handoff Sequence

```
1. Stratimux adds item to concept state array
2. Display Principle observes change via k_.propertyName KeyedSelector
3. Principle calls controller.take(items) — Vue takes ownership, sets timers
4. Principle dispatches clearItem for each — Stratimux empties its array
5. Stratimux now has ZERO KNOWLEDGE of the items
6. Vue manages display, expiration, dismissal independently
7. Page navigation creates new controller + finds empty Stratimux array → no stacking
```

### Principle Implementation Pattern

```typescript
export const conceptDisplayPrinciple: ConceptDisplayPrinciple = ({ d_, k_, plan }) => {
  const displayPlan = plan('Concept Display', ({ stage }) => [
    stage(({ d, dispatch }) => {
      const items = k_.items.select();
      const controller = getGlobalConceptController();
      if (items.length === 0 || !controller) {
        dispatch(d_.muxium.e.muxiumKick(), { throttle: 0 });
        return;
      }
      controller.take(items);                               // Vue takes ownership
      for (const item of items) {                           // Stratimux relinquishes
        dispatch(d.concept.e.conceptClearItem({ id: item.id }), {});
      }
    }, { selectors: [k_.items], beat: 3 }),                 // beat:3 REQUIRED with throttle:0 (S3 §M66)
  ]);
  return () => { displayPlan.conclude(); };
};
```

### GCRM — Global Controller Registration Membrane

The Stratimux principle context has no access to Vue's `provide`/`inject` system. The GCRM pattern bridges this structural separation: the Tier 2 `IslandWrapper` creates the controller AND registers it globally; the Principle accesses it via `getGlobalConceptController()`.

```typescript
// In conceptController.ts
let globalController: ConceptController | null = null;
export function setGlobalConceptController(c: ConceptController) { globalController = c; }
export function getGlobalConceptController(): ConceptController | null { return globalController; }

// In IslandWrapper (Tier 2): const controller = createConceptController(); setGlobalConceptController(controller); provide(CONCEPT_CONTROLLER_KEY, controller);
// In Principle:                const controller = getGlobalConceptController();
```

**HAZARD H5 (SSR guard)**: The global registration pattern is SPA-only. In SSR environments, `setGlobalConceptController` must not be called during server render (add a `typeof window === 'undefined'` guard). The module-level counter in ID generation also poses SSR collision risk — use `crypto.randomUUID()` instead.

---

## §8 — Bridge Model Helpers (TOBM)

**TOBM — muxiumTimeOut Bridge Model Helper Group — ActionStrategy-Safe Notification Dispatch via Deferred Scheduling**

> **CRITICAL: ActionController is single-use scope (HAZARD H2)**
> Calling `controller.fire()` CLOSES the ActionController. If you call it before `controller.fire(strategySuccess(...))`, the strategy continuation is dropped silently. Always use `notifyLocal()`, `notifyClient()`, or `notifyAllClients()` (which wrap `muxiumTimeOut`) for any notification dispatch inside an ActionStrategy Quality method.

### BROKEN PATTERN (do NOT use)

```typescript
// BROKEN — controller.fire() closes the ActionController on line 1
createAsyncMethodWithConcepts(({ controller, action, deck }) => {
  controller.fire(deck.webSocketServer.e.webSocketServerAppendToActionQue({...}));  // CLOSES CONTROLLER
  controller.fire(strategySuccess(action.strategy));                                // FAILS — already closed
});
```

### CORRECT PATTERN — muxiumTimeOut defers outside strategy scope

```typescript
// CORRECT — muxiumTimeOut schedules OUTSIDE the ActionController scope
createAsyncMethodWithConcepts(({ controller, action, concepts_, deck }) => {
  const huirthDeck = deck as unknown as NotificationHuirthDeck;
  const clientStateKey = action.strategy?.data?.clientStateKey;
  notifyClient(concepts_, huirthDeck, { message: 'Operation complete', priority: 'viridian' }, clientStateKey);
  controller.fire(strategySuccess(action.strategy));                                // STILL OPEN — succeeds
});
```

### Implementing a Bridge Model Helper Group

```typescript
// In {concept}Bridge.model.ts
import { muxiumTimeOut, type Concepts } from 'stratimux';

export function notifyLocal(concepts_: Concepts, deck: ConceptClientDeck, payload: BridgePayload, timeout = 30): void {
  muxiumTimeOut(concepts_, () => deck.concept.e.conceptAddItem(mapPayload(payload)), timeout);
}

export function notifyClient(concepts_: Concepts, deck: ConceptHuirthDeck, payload: BridgePayload,
                             clientStateKey: string, timeout = 30): void {
  muxiumTimeOut(concepts_, () => deck.webSocketServer.e.webSocketServerAppendToActionQue({
    actionQue: [deck.concept.e.conceptAddItem(mapPayload(payload))],
    targetClientStateKey: clientStateKey,
  }), timeout);
}
```

**Deck interfaces should be NARROW** — declare only the qualities the caller needs, not the full DECK type. This prevents type-system leakage of one deployment's qualities into the other's dispatch contexts.

**NEVER call `controller.fire()` for a side-effect action inside an ActionStrategy quality method. Always use `muxiumTimeOut` via a bridge model helper.**

---

## §9 — Vue Island Integration (VCIP) and Pewter Tessera Diameter

**VCIP — Vue Concept Island Per-Concept Rendering Architecture**

Each Vue landing page creates and owns its own `ClientMuxiumInstance`, tied to the component's `onMounted`/`onUnmounted` lifecycle. There is NO global singleton Muxium shared across pages. Navigation to a new page creates a new Muxium; the old one closes and is garbage collected.

```typescript
// In ConceptLanding.vue
onMounted(() => { muxium = createClientMuxiumInstance([], { /* config */ }); /* inject controller */ });
onUnmounted(() => { muxium?.close(); });
```

**Tier 2 controller injection**: The `NotificationPopup.vue` component receives a `NotificationController` prop and reads `props.controller.activeNotifications.value` — it has NO Muxium reference and NO concept imports. This is the clean Tier 2 boundary. The controller is the sole interface between Vue's reactivity system and the Muxium's state history.

**d.client.d.notification.k** — Tier 3 (Landing) accesses muxified Concept state via the standard Tier 2 path:

```typescript
// In Landing — Tier 3 access to muxified notification state
const count = d.client.d.notification.k.notifications.select();
```

### Vue Rendering Considerations (Pewter Tessera Diameter)

When styling Vue components that display Muxonomic Concept state, S15 routes to **Pewter Tessera** (Suite 8 HiFi Design System Maintainer) for design token composition. Use `--color-{suite}` tokens from the HiFi design system rather than hardcoding hex values. The suite color constants in a Concept's type file (e.g., `PRIORITY_COLORS`) are runtime references only, not the CSS source of truth.

The structural Diameter: `NotificationPriority` (Stratimux state) → `--color-{priority}` (Pewter token) → CSS pane class → Vue component. See `Cascades/8_SUITES/Pewter Tessera/Instance.md` for the design token authority (Skills D1 Color Token Architecture · D3 Pane Gradient Assembly · D4 Complementary Text Shadow · D7 Button Variant System).

**HAZARD H5 (module counter)**: If `generateConceptId()` uses a module-level counter, it does NOT reset between Muxium instances in SSR multi-render contexts. Use `crypto.randomUUID()` for ID generation in any Muxonomic Concept targeting SSR environments.

---

## §10 — Authoring Checklist (Pearl-Compressed Sequence)

Steps for authoring a new Muxonomic Concept; substitute your `{conceptName}` throughout. Each step references the section above that holds the full pattern.

1. **Name + scope** — choose `conceptName` (camelCase); declare All/Huirth/Client + Diameter junction status per quality (§3 FNES).
2. **`{name}.type.ts`** — `conceptName` constant, `State` (NO optionals — M60), `Qualities` map, `Deck`/`ConceptDeck`/`ModelDeck`, payload types (PACP prefix per §11 A5).
3. **`{name}.state.ts`** — `createConceptState()` + `CONCEPT_FILTER_KEYS` constant (§6 FKSD · M69).
4. **Qualities** — `{name}.quality.ts` (All) + `{name}.quality.huirth.diameter.ts` (Huirth Diameter junction) (§3 FNES table).
5. **`{name}.concept.ts` (Client)** — `createDiametricQuality<WithDiametricState<State>, ModelDeck>('Verbose Split')` with **CISV `Induction` suffix** (§5). Register under SAME property key as Real. Export `createMuxonomic{Name}()` (§2 MCUC).
6. **`{name}.concept.huirth.ts` (Huirth)** — import All-deployment qualities + Real `*.huirth.diameter.ts` qualities. SAME property keys. Export `createMuxonomic{Name}Huirth()` (§4 DCQF).
7. **`{name}.muxonomy.ts`** — populate `MuxonomicConfig<'conceptName'>` per §6 MSDT skeleton; verify AESR `actionType` ↔ FNES type strings match (§5 H3).
8. **Principles** — `{name}Display.principle.client.ts` (ZKHP if Vue, §7) + `{name}Broadcast.principle.huirth.ts` (WebSocket broadcast if server push).
9. **Bridge model (REQUIRED for Strategy dispatch)** — `model/{name}Bridge.model.ts` using `notifyLocal`/`notifyClient` (§8 TOBM); NEVER `controller.fire()` before `strategySuccess` (H2 CRITICAL).
10. **Vue integration** — `{name}Controller.ts` (§7 GCRM); Vue component via controller as Tier 2 boundary (§9 VCIP); compose with Pewter Tessera tokens (§9 Diameter).
11. **Register** — add `createMuxonomic{Name}()` + `createMuxonomic{Name}Huirth()` to `muxonomyRegistry.generated.ts` client + Huirth arrays.
12. **Verify** — `npm run typecheck` exit 0 · CISV grep (Induction suffix) · AESR consistency · registry grep · FKSD duality.

---

## §11 — Anti-Patterns

Consolidated from Viridian H1-H5 plus Rust + Maroon Reference Designs.

| # | Anti-Pattern | Failure Mode | Detection | Fix |
|---|-------------|-------------|-----------|-----|
| **H1 (CRITICAL)** | `createDiametricQuality` variable missing `Induction` suffix | `toReal` fails silently → infinite action loop, no TS error | `grep -n "createDiametricQuality" *.concept.ts` | Rename to `{qualityName}Induction` |
| **H2 (CRITICAL)** | `controller.fire(sideEffect)` inside ActionStrategy before `strategySuccess` | Controller closes; strategy continuation silently dropped | `grep -n "controller.fire" qualities/` | Use `muxiumTimeOut` bridge model |
| **H3 (HAZARD)** | FNES filename / `actionExchange.actionType` string drift | WebSocket routing breaks silently | Cross-check `demometers.qualities[n].type` vs `actionExchange[dir][m].actionType` | Update both atomically on rename |
| **H4 (NOTE)** | Raw `ws.send(JSON.stringify(action))` in broadcast principle | Ships stale format if action shape changes | `grep -n "ws.send" principles/` | Route via `webSocketServer` quality |
| **H5 (NOTE)** | Module-level ID counter in SSR | Counter doesn't reset between Muxium instances; collisions | Architecture review | `crypto.randomUUID()` |
| **A1** | Pass only `concept` (not `{concept, muxonomy}`) to Muxium Creator | filterKeys/sync/nav/codegen all break silently | `grep createMuxonomic` | Use MCUC pair pattern |
| **A2** | Optional `?` properties in `State` | KeyedSelector misses changes (M60) | TS strict mode | Required + default values |
| **A3** | `actionExchange` missing for `diameter: true` quality | StratiVERSE can't verify contract | `grep -c "diameter: true"` vs `grep -c actionExchange` | Add `serverToClient`/`clientToServer` entry |
| **A4** | Global controller singleton unguarded in SSR | Second mount overwrites controller | Architecture review | `typeof window === 'undefined'` guard |
| **A5** | Payload property names collide with `Action` base type | `origin` shadowed silently | TS strict check | PACP — prefix with concept name |
| **A6** | FKSD drift: state `FILTER_KEYS` ≠ muxonomy `filterKeys` | Unexpected sync to Huirth or client leak | `diff <(grep FILTER_KEYS state.ts) <(grep filterKeys muxonomy.ts)` | Keep identical; update atomically |

---

## §12 — Cross-References

| Skill | Relationship to S15 |
|-------|---------------------|
| **S2** | ECK Limitation → narrow deck interfaces for Diameter junction qualities; `WithDiametricState` is Tier 2 composition. |
| **S5** | `muxiumTimeOut` (Strategy Temporal Expansion) is TOBM bridge model's substrate. |
| **S8** | Diameter junction Induction is the cross-WebSocket alternative to direct muxified state traversal (S8 = within-Muxium; S15 = cross-boundary). |
| **S9** | `k_` principle-level selector + `beat: 3` safety for `throttle: 0` (S3 §M66) underpins ZKHP. |
| **S10** | Verbose Split Naming applies to Diameter type strings; CISV extends naming discipline to the Induction variable. |
| **S13** | FKSD dual declaration extends M69 Canonical-Registry-Source to state level; M60 optional-property anti-pattern applies. |
| **S14** | S14 = from-scratch when NO pattern exists; S15 extends S14 for the Muxonomy layer (M63 Copy-Paste-Plus from Notification). |
| **S16** | S15's concrete demonstration in the SCS template — file-by-file citation-grounded traces. |
| **SCP-S13** | SCP-Researcher `Skills/ConceptAuthoring.md` — hands-on Template SCP walk-through using Notification as M63 source. S15 = Why/What; SCP-S13 = How-To. |

---

## §13 — Lambda Trigger (Verification Concluders)

Verification commands an authored Muxonomic Concept passes before claiming implementation complete.

```bash
npm run typecheck                                              # TypeScript gate: exit 0
find src/concepts/{conceptName}/ -type f | sort                # File structure: ≥ 7 files
grep -n "createDiametricQuality" src/concepts/{conceptName}/{conceptName}.concept.ts
                                                               # CISV: every match ends in Induction
grep "actionType:" src/concepts/{conceptName}/{conceptName}.muxonomy.ts
grep "type:" src/concepts/{conceptName}/qualities/*.diameter.ts
                                                               # AESR consistency: actionType ↔ Real type strings
grep -c "{conceptName}" src/concepts/muxonomyRegistry.generated.ts
                                                               # Registry: ≥ 2 (client + Huirth)
grep "FILTER_KEYS" src/concepts/{conceptName}/{conceptName}.state.ts
grep "filterKeys" src/concepts/{conceptName}/{conceptName}.muxonomy.ts
                                                               # FKSD duality: same property names
```

---

## §14 — Citation

**Primary code substrate**: `Cascades/scps/template/SCP/src/concepts/notification/` (canonical Muxameter exemplar — see S16 for file map) · `concepts/muxonomy/muxonomy.model.ts` (`MuxonomicConfig`, `DeploymentTarget`, `ExchangeDirection`, `QualityDemometer`) · `concepts/muxonomy/diametric.model.ts` (`createDiametricQuality{WithPayload}`, `WithDiametricState`, `DiametricState`).

**POC origin**: POC-2-4-NOTIFICATION-BRIDGE (ZKHP) · POC-2-5-DEMOMETRIC-QUALITY (Diameter Junction) · POC-2-6-DEMOMETRIC-INTERCHANGE (FNES architecture).

**Phase 1 Reference Designs**: Suite 1 Maroon (curation), Suite 2 Rust (17-pattern naming authority: FNES · CISV · DQWDS · DCQF · MSDT · AESR · ZKHP · GCRM · TOBM · DTEC · UPCT · RWCP · SCST · MCUC · VCIP · PACP · FKSD; M73-M78 candidates), Suite 4 Viridian (H1-H5 audit) — all in `Cascades/Working/`. RWCP (Re-entry Wrapped Continuation Pattern) governs how the `webSocketClient` principle wraps bare actions in `strategyDetermine` for cross-boundary routing — applied implicitly in §5 Diameter Quality dispatch.

**M-Rule provenance**: M63 Copy-Paste-Plus (Notification IS the source) · M69 Canonical-Registry-Source (FKSD + UPCT extend it) · M73 FNES, M74 CISV, M75 ZKHP, M76 TOBM, M77 AESR, M78 MSDT (promotion candidates from Rust S2).

---

## §15 — Scope Boundary

S15 is **framework-general**. Out of scope: notification.type.ts line-number citations (→ S16), scsBridgeMirror specifics (→ SCP-S13 / SBM Macro 2), Template SCP step-by-step (→ SCP-S13 ConceptAuthoring.md), `NotificationPriority` → Suite color SCST (→ S16 §9), Copy-Paste-Plus per-domain application (→ SCP-S13 Phase 1), Vue token CSS surface (→ Pewter Tessera Instance.md).

---

## Forward Diameter to scsBridgeMirror

This Skill is the framework-general substrate that the SBM Macro 2 Foundation Suite dispatch will read when authoring the SCP-side `scsBridgeMirror` Concept on the Template SCP. The scsBridgeMirror Concept has NO prior SCP-side counterpart to Copy-Paste-Plus from — the Notification Concept IS the authoritative reference. The structural analogy is exact enough to constitute M63 Copy-Paste-Plus: copy file structure verbatim, substitute `notification` → `scsBridgeMirror`.

### Sub-Target Decomposition (Six SBM Aspects)

| Sub-Target | S15 Provides | scsBridgeMirror Application |
|---|---|---|
| **Dual Nature** (Suite 8 + Concept) | §2 MuxonomicConcept pair pattern | `Cascades/8_SUITES/SCS Bridge/` ⊗ `concepts/scsBridgeMirror/` |
| **Loadable from any SCP** | §6 MSDT topology declaration | `scsBridgeMirror.muxonomy.ts` registers in `muxonomyRegistry.generated.ts` |
| **Session + SCP Management Qualities** | §5 Diameter junction + §11 PACP | `scsBridgeMirrorActivateScp`/`ListSessions`/`SpawnSession` each with `Induction` suffix |
| **MCP-Primary Dispatch** (not shell-exec) | §8 TOBM `muxiumTimeOut` | `mcpToolDispatch.strategy.ts` 5-Stage HTTP POST via `bridge.json` (generalizes SCSER) |
| **Pewter Tessera UI** | §9 VCIP + Pewter Diameter | `ScsBridgeMirrorDashboard.vue` uses `--color-cobalt`/`viridian`/`maroon` via Pewter D3+D1+D7+D4 |
| **SBM Macro 2 §13** | All §1-§14 patterns | Five SBM sub-Diamonds (D1 substrate · D2/D3 Strategy · D4 Anchor · D5 Sync+Vue) inherit S15 |

### Muxified Manifold Understanding

The scsBridgeMirror Concept and the existing Bridge-side `scsBridge` Concept form a **Demometer Pair** connected by the MCP+HTTP-callback Diameter — same structural pattern as the Notification Concept's Client↔Huirth WebSocket Diameter, but with MCP as the boundary substrate instead of WebSocket. The Demometer Pair principle: SCP is not subordinate to Bridge; Bridge does not own SCP; the circular reference `scsBridgeMirror.Activate → Bridge.Quality → Bridge.TUI → scsBridgeMirrorSync.Principle.update → Vue.render → ...` is structural, not broken.

**Critical doctrinal directives for SBM Macro 2 builders**:
- §5 CISV INVARIANT applies to EVERY `createDiametricQualityWithPayload` call in scsBridgeMirror — the `Induction` suffix on each variable is non-negotiable (H1 CRITICAL); SAWSR Cycles 148-153 substrate (BMTI + MASN + MTAM + SCSER + DCQI + CSEP + SSBM, M-rules M138-M145) is available on the Bridge side and does NOT need re-implementation in the Mirror.
- §8 TOBM applies to `mcpToolDispatch.strategy.ts` — it must NOT call `controller.fire()` for the HTTP POST before `strategySuccess`; use `muxiumTimeOut` for any deferred-completion path (H2 CRITICAL).
- §6 MSDT requires `scsBridgeMirror.muxonomy.ts` to declare every Mirror Quality as a `QualityDemometer` with explicit `location` and `diameter` fields, plus `actionExchange.serverToClient[]` entries for each MCP-boundary-crossing Quality (H3 atomic update on rename).
- §9 VCIP + Pewter Tessera Diameter applies to `ScsBridgeMirrorDashboard.vue` — Pewter Tessera MUST be dispatched CONCURRENT with SBM-D5 authoring (not after) so the Cobalt builder has `pane-bridge-*` class definitions BEFORE writing the `.vue` file.

The Manifold = Muxameter of Muxameters principle scales: the larger SCS runtime is itself a Muxameter where the Notification Concept Muxameter, the scsBridgeMirror Concept Muxameter, the WebSocket Concept pair Muxameter, and the Suite 8 doctrine Muxameter all compose through their Diameters into the integrated operational region. S15 is the authoring substrate for adding new Muxameters into that larger composition.
