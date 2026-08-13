# S16 — Notification Concept: Minimum Muxameter Exemplar

**Diameter**: The Notification Concept as living proof that Demometers, Diameters, and Muxameters compose into a runtime-verified whole
**Domain**: SuiteCascadeSystem Template SCP — `Cascades/scps/template/SCP/src/concepts/notification/` — concrete citation-grounded exemplar of the minimum Muxameter pattern in action
**Trigger**: Reading the Notification Concept to understand the Muxonomy pattern in a real implementation; using Notification as Copy-Paste-Plus source (M63) when authoring a new Concept; reviewing what "minimum Muxameter" means concretely; preparing to author the scsBridgeMirror Concept (SBM Macro 2)
**Status**: NEW Skill from the Notification-Manifold Formalization Macro · Phase 3 Cobalt actualization · 2026-05-19. SCS-specific exemplar that grounds S15's framework-general patterns into the live SCS Template SCP runtime.
**Citations**: POC-2-4-NOTIFICATION-BRIDGE-WORKGAMEBOARD.md · POC-2-5-DEMOMETRIC-QUALITY-WORKGAMEBOARD.md · POC-2-6-DEMOMETRIC-INTERCHANGE-WORKGAMEBOARD.md · ICED-SKILL-INDUCTION.md

---

## Pearl Summary

The Notification Concept is the minimum viable Muxameter in the SCS template: five Demometers (Type, Client, Huirth, Bridge, Vue) composed through five Diameters (Handoff, Quality, WebSocket, Temporal, Agnosticism) into ONE integrated region where a browser button click results in a visible notification popup via a full Huirth round-trip. It is not merely a notification system — it is a living proof that the Stratimuxian Manifold pattern works at the smallest possible scope. Where S15 teaches the framework-level mechanics of Muxonomy-aware Concept authoring, S16 walks the reader through the exact lines of code in the Notification Concept that actualize those mechanics. Read S16 when you need to understand what a Muxameter looks like as a concrete, runnable, citable artifact — not as abstraction but as the thing itself.

---

## 1. The Minimum Muxameter Claim

A Manifold is a Muxameter of Muxameters. A Muxameter is the integrated region where Demometers relate through their Diameters — each Demometer measured not in isolation but through its bidirectional composition with the others. The claim of this Skill is precise: the Notification Concept is the MINIMUM demonstrable Muxameter in the SCS template. Minimum because:

- It involves exactly two execution sides (Client Muxium and Huirth Muxium) — fewer than two would be a single-side Concept, not a Muxameter.
- It involves exactly one Diameter Quality (`notificationHelloWorld`) — the single quality that spans the boundary, proving bidirectionality with one type string.
- It involves exactly one Zero Knowledge Handoff — the single point where Stratimux ownership transfers to Vue, proving the Client↔Vue Diameter.
- The total composition is Stratimux ↔ WebSocket ↔ Stratimux ↔ Vue — a four-part compositional loop with no hierarchy and no parent.

This is NOT a parent-child structure. Client does not own Huirth. Huirth does not know about Vue. Vue does not know about WebSocket. What connects them is the DIAMETER at each boundary — the through-measure between unlike Demometers that allows each to remain independent while composing into a working whole.

The Manifold = Muxameter of Muxameters principle means the larger SCS runtime is itself a Muxameter composed of smaller Muxameters — and the Notification Concept is the smallest one. SAWSR Cycles 148-153 created the first integrated Muxameter (SCS-Bridge ↔ SCP runtime via MCP+HTTP-callback Diameter). The Notification Concept is the canonical minimum-Muxameter exemplar that proves the pattern before that larger composition.

---

## 2. 15-File Structural Map

All 15 files are in `Cascades/scps/template/SCP/src/concepts/notification/` unless otherwise noted.

| File | Role | Demometer Served | Imports From | Exports To | Suffix Rationale | Lines |
|------|------|-----------------|--------------|------------|------------------|-------|
| `notification.type.ts` | Shared type definitions: State, Payloads, Deck shapes, PRIORITY_COLORS | Type Demometer | `stratimux` | All 14 other files | `.type.ts` = canonical type boundary, no deployment qualifier | 153 |
| `notification.state.ts` | State factory + NOTIFICATION_FILTER_KEYS constant | Type Demometer | `.type.ts` | Both concept files | `.state.ts` = state module distinct from type module | 37 |
| `notification.muxonomy.ts` | MuxonomicConfig declaration — machine-readable topology | Type Demometer (shared) | `muxonomy/muxonomy.model` | Both concept files | `.muxonomy.ts` = topology config, does NOT cascade across projects | 143 |
| `notification.concept.ts` | Client Concept Creator + Induction quality + Display Principle | Client Demometer | `.type.ts`, `.state.ts`, `.muxonomy.ts`, qualities, display principle, `diametric.model` | Client Muxium creators | `.concept.ts` = base concept file, CASCADES across projects | 154 |
| `notification.concept.huirth.ts` | Huirth Concept Creator + Real quality + Broadcast Principle | Huirth Demometer | `.type.ts`, `.state.ts`, `.muxonomy.ts`, qualities, broadcast principle, real quality | Huirth Muxium creators | `.concept.huirth.ts` = deployment-targeted concept variant | 141 |
| `notificationController.ts` | Vue State Manager — `NotificationController` interface + factory + global membrane | Vue Demometer | `.type.ts` | Display Principle, Vue components | standalone (no suffix encoding — Vue-layer utility) | 269 |
| `model/notification.model.ts` | Pure utility functions: `createNotification()`, `isNotificationExpired()`, queue ops | Type Demometer (utility) | `.type.ts` | Both concept files, bridge model | `.model.ts` = pure functions, no Stratimux | 135 |
| `model/notificationBridge.model.ts` | muxiumTimeOut bridge helpers: `notifyLocal`, `notifyClient`, `notifyAllClients`, `notify.*` | Bridge Demometer | `stratimux`, `.type.ts` | Both concept files (re-exported) | `.model.ts` = pure functions with Stratimux temporal pattern | 263 |
| `qualities/addNotification.quality.ts` | Shared reducer — adds Notification to state array | Both (All deployment) | `.type.ts`, `.model.ts` | Both concept files | `.quality.ts` = All deployment, no diameter | 46 |
| `qualities/clearNotification.quality.ts` | Shared reducer — removes Notification by ID | Both (All deployment) | `.type.ts` | Both concept files | `.quality.ts` = All deployment, no diameter | 35 |
| `qualities/helloWorld.quality.huirth.diameter.ts` | The Diameter Quality — Real implementation on Huirth | Huirth Demometer (Diameter junction) | `.type.ts`, `.model.ts`, `stratimux` | `notification.concept.huirth.ts` | `.quality.huirth.diameter.ts` = Huirth-targeted + diameter:true encoding | 75 |
| `principles/notificationDisplay.principle.client.ts` | Zero Knowledge Handoff — Stratimux to Vue controller | Client Demometer | `.type.ts`, `notificationController` | `notification.concept.ts` | `.principle.client.ts` = Client-only principle | 100 |
| `principles/notificationBroadcast.principle.huirth.ts` | Huirth broadcast — relays to all connected WebSocket clients | Huirth Demometer | `.type.ts`, `webSocketServer` types | `notification.concept.huirth.ts` | `.principle.huirth.ts` = Huirth-only principle | 122 |
| `vue/NotificationLanding.vue` | Tier 3 test interface — dispatches actions, monitors state via Tier 2 muxified access | Vue Demometer (test) | `stratimux`, `client.muxonomy`, `.type.ts` | Router (SCP navigation) | `.vue` — Vue component (no suffix encoding) | 628 |
| `vue/NotificationPopup.vue` | Tier 2 display island — renders from controller, zero Stratimux knowledge | Vue Demometer (display) | `notificationController`, `.type.ts` | IslandWrapper (provider) | `.vue` — Vue component | 227 |

**Suffix grammar summary**: `{name}.{quality|principle|concept}.{huirth|client|omitted}?.{diameter|omitted}?.ts` — each segment encodes a measurable property: deployment target and Diameter junction status. The `.muxonomy.ts` suffix marks the topology config file and is the only file that does NOT cascade across projects (per CATB — Cascade-Aware Type Behavior, `muxonomy.model.ts:80-95`).

---

## 3. The 5 Demometers Identified

Each Demometer is an independent conceptual unit with measurable properties. The five in the Notification Concept:

### Type Demometer
**Files**: `notification.type.ts` (153 lines) · `notification.state.ts` (37 lines) · `notification.muxonomy.ts` (143 lines)

**What it holds**: All type definitions that both Client and Huirth sides share equally — `NotificationState`, `NotificationQualities`, `NotificationModelDeck`, `NotificationPriority`, `AddNotificationPayload`, `ClearNotificationPayload`, `PRIORITY_COLORS`, `NOTIFICATION_FILTER_KEYS`, and the `MuxonomicConfig<'notification'>` topology declaration. Neither Client nor Huirth can diverge from this type foundation. The `NotificationModelDeck` (`notification.type.ts:99-101`) is imported by BOTH concept files for the `createDiametricQuality` call — the type anchor that keeps both sides structurally aligned.

**Independence**: Used by all other files. Has no dependency on any other Notification file. This is the Canonical-Registry-Source (M69) applied at the type layer.

### Client Demometer
**Files**: `notification.concept.ts` (154 lines) · `principles/notificationDisplay.principle.client.ts` (100 lines) · `notificationController.ts` (269 lines)

**What it holds**: The complete Client-side lifecycle — concept instantiation with the Induction quality registered under `notificationHelloWorld` (`notification.concept.ts:109`), the Display Principle that performs Zero Knowledge Handoff to Vue, and the controller factory that Vue components consume. The `notificationHelloWorldInduction` variable (`notification.concept.ts:91-94`) is the Induction half of the Diameter junction — its `Induction` suffix is a structural invariant, not a naming convention (see Section 7).

**Independence**: Runs entirely in a browser process. Knows nothing about Huirth's implementation. The `createMuxonomicNotification()` function (`notification.concept.ts:133-138`) returns the union pairing `{ concept, muxonomy }` that Client Muxium creators require.

### Huirth Demometer
**Files**: `notification.concept.huirth.ts` (141 lines) · `principles/notificationBroadcast.principle.huirth.ts` (122 lines)

**What it holds**: The complete Huirth-side lifecycle — concept instantiation with the Real quality (`notificationHelloWorld`, imported from `helloWorld.quality.huirth.diameter.ts`) registered under the same `notificationHelloWorld` property key (`notification.concept.huirth.ts:80`), and the Broadcast Principle that reads Huirth's notifications array and relays each notification to all connected WebSocket clients via `client.ws.send(JSON.stringify(addAction))` (`notificationBroadcast.principle.huirth.ts:89`).

**Independence**: Runs entirely in a Node.js process. The `createMuxonomicNotificationHuirth()` function (`notification.concept.huirth.ts:104-109`) returns the union pairing for Huirth Muxium creators. Dead code note: lines 62-65 of `notification.concept.huirth.ts` instantiate an unused `notificationHelloWorldInduction` — this is prune target P3/P5 from the Maroon curation (a future Cobalt fix per Viridian G2).

### Bridge Demometer
**Files**: `model/notificationBridge.model.ts` (263 lines) · `model/notification.model.ts` (135 lines)

**What it holds**: Two distinct utility layers. The `notification.model.ts` is pure functions — `createNotification()`, expiration logic, queue operations — with zero Stratimux imports. The `notificationBridge.model.ts` is the muxiumTimeOut integration layer — `notifyLocal`, `notifyClient`, `notifyAllClients`, and the `notify.*` priority convenience group, all using `muxiumTimeOut(concepts_, () => action, timeout)` to defer dispatch without closing the ActionController (see Section 9).

**Independence**: No concept instantiation. Generalizes to ANY concept needing Huirth-to-Client routing via the same temporal safety pattern. Both concept files re-export these helpers so callers do not need to import from the model directly.

### Vue Island Demometer
**Files**: `vue/NotificationPopup.vue` (227 lines) · `vue/NotificationLanding.vue` (628 lines)

**What it holds**: Two Vue components with entirely different tiers of knowledge. `NotificationPopup.vue` is a pure Vue island — it receives a `NotificationController` prop, reads `props.controller.activeNotifications.value`, and calls `props.controller.clear(id)` for dismiss. It imports only `notification.type` and `notificationController` — no Muxium reference, no stage planner, no DECK access. `NotificationLanding.vue` is the Tier 3 test interface that creates its own `ClientMuxiumInstance` on `onMounted` (line 151-205) and accesses notification state via the Tier 2 muxified path `d.client.d.notification.k.notifications.select()` (line 183).

**Independence**: `NotificationPopup.vue` could be used by any controller implementing the `NotificationController` interface — it has zero coupling to the Notification Concept's Stratimux internals. This UI Agnosticism Diameter (see Section 6) is the pattern that enables safe Vue isolation.

---

## 4. The 5 Diameters Identified

Each Diameter is a bidirectional through-measure between UNLIKE Demometers — it is the similarity that allows two conceptually distinct units to compose.

### Handoff Diameter
**Between**: Client Muxium (Stratimux state owner) ↔ Vue Controller (Vue reactivity owner)

**Protocol**: The Zero Knowledge Handoff (ZKHP, Rust pattern naming S2). The Display Principle observes `notifications` via `k_.notifications` KeyedSelector (`notificationDisplay.principle.client.ts:89`), calls `controller.take(notifications)` (`line 76`), then dispatches `notificationClearNotification` for each (`lines 80-83`). After this sequence, Stratimux's array is empty and Vue owns the notification lifecycle including expiration timers.

**Bidirectionality**: Vue can call `controller.clear(id)` when a timer expires or user dismisses — this affects only Vue's `activeNotifications.value` and requires no Stratimux knowledge. The Diameter flows in both directions: Stratimux pushes to Vue at handoff; Vue manages independently after.

**What fails if Diameter breaks**: If `controller.take()` is not called, notifications accumulate in Stratimux indefinitely. If `clearNotification` is not dispatched after `take()`, page navigation carries stale notifications into the new controller's initial state — producing the notification stacking anti-pattern that ZKHP exists to prevent.

### Quality Diameter (Diameter Junction)
**Between**: Client Induction Quality (routes to `actionQue`) ↔ Huirth Real Quality (executes locally)

**Protocol**: Shared Verbose Split type string `'Notification Hello World'` (`notification.concept.ts:94` and `helloWorld.quality.huirth.diameter.ts:37`). Both qualities are registered under the same property key `notificationHelloWorld` in their respective concept files. The FNES suffix grammar (`helloWorld.quality.huirth.diameter.ts`) encodes that the Real lives on Huirth with `diameter: true`, creating the Induction placeholder on Client automatically.

**Bidirectionality**: Client can dispatch `d.notification.e.notificationHelloWorld()` — same API regardless of deployment context. On Client, the Induction routes the action to `actionQue`; the `webSocketClient.principle` monitors `actionQue` and sends via WebSocket; Huirth receives and executes the Real quality. The type string IS the Diameter anchor that survives the WebSocket boundary.

**What fails if Diameter breaks**: If the `Induction` suffix is omitted from the variable name (`notification.concept.ts:91`), the `toReal` transformation fails and the action loops: Client sends → Huirth executes Real → Real adds notification → Broadcast Principle relays back to Client → Client executes what it believes is Real... infinitely. This is Hazard H1 (Viridian audit) — silent at compile time, catastrophic at runtime.

### WebSocket Diameter
**Between**: Huirth notification state (holds notifications post-Real execution) ↔ Client notification concepts (receive `notificationAddNotification` actions)

**Protocol**: The Broadcast Principle (`notificationBroadcast.principle.huirth.ts`) observes `k_.notifications` (`line 111`), iterates `wsState.webSocketClients` (`line 59`), and calls `client.ws.send(JSON.stringify(addAction))` (`line 89`) for each connected client. Notably, the action sent is `notificationAddNotification` (not `notificationHelloWorld`) — the HelloWorld Diameter terminates at Huirth execution; the broadcast relays the RESULTING notification entity via the universal `addNotification` quality.

**Bidirectionality**: Clients can also send to Huirth via the Induction/Real path. Huirth clears its own notifications array after broadcast (`lines 106-108`) — Zero Knowledge at the server tier.

**What fails if Diameter breaks**: If `k_.notifications` selector doesn't fire (e.g., `beat: 3` removed with `throttle: 0` still active), the broadcast never triggers. If the WebSocket connection is absent, notifications are cleared without delivery — intentional design (the Broadcast Principle clears even with no clients to prevent Huirth accumulation).

### Temporal Diameter
**Between**: ActionStrategy scope (ActionController open) ↔ Notification dispatch scope (deferred via muxiumTimeOut)

**Protocol**: The Bridge Model (`notificationBridge.model.ts`) wraps all dispatch calls in `muxiumTimeOut(concepts_, () => action, timeout)` with a default 30ms delay. This schedules the action OUTSIDE the current ActionController scope, keeping the controller open for `strategySuccess` (`notificationBridge.model.ts:117-121`, `169-177`).

**Bidirectionality**: The deferred action re-enters the Muxium via the timeout scheduler — it is not lost, it arrives after the strategy continuation has already fired. The `notify.*` convenience group provides typed priority wrappers: `notify.success`, `notify.warning`, `notify.error`, `notify.info`, `notify.system` (all wrapping `notifyLocal`).

**What fails if Diameter breaks**: Calling `controller.fire(someNotificationAction)` BEFORE `controller.fire(strategySuccess(...))` closes the ActionController on the first call. The strategy continuation is dropped silently — this is the BROKEN PATTERN documented verbatim at `notification.concept.huirth.ts:33-36`.

### Agnosticism Diameter
**Between**: Vue Popup (pure display island) ↔ ANY controller implementing `NotificationController` interface

**Protocol**: `NotificationPopup.vue` is parameterized on the controller interface, not on any specific implementation. It reads `props.controller.activeNotifications.value` and calls `props.controller.clear(id)` — both defined in the `NotificationController` type (`notificationController.ts:32-67`).

**Bidirectionality**: The provider (IslandWrapper at Tier 2) creates and injects the controller. The consumer (NotificationPopup at Tier 2/3) reads and interacts. The Stratimux principle accesses the same controller via the Global Controller Membrane (GCRM, Rust pattern naming) — `getGlobalNotificationController()` (`notificationController.ts:254-268`).

**What fails if Diameter breaks**: If `setGlobalNotificationController` is called before the Display Principle initializes, the principle finds no controller and kicks indefinitely. In SSR multi-mount environments, a second `setGlobalNotificationController` call overwrites the first — the Viridian G6 gap requiring SSR hardening.

---

## 5. HelloWorld Diameter Quality — Full End-to-End Walkthrough

This is the living example. Every hop cites file:line from the actual SCS template source.

**Starting point**: User clicks the "Hello World" button in `vue/NotificationLanding.vue`.

**Hop 1 — Button Dispatch** (`NotificationLanding.vue:68-70`)
```typescript
muxium.dispatch(
  (muxium as Muxium<ClientMuxiumDeck>).deck.d.client.d.notification.e.notificationHelloWorld(),
);
```
The dispatch reaches `notification.e.notificationHelloWorld` — which on the Client side maps to `notificationHelloWorldInduction`. This is the Induction quality.

**Hop 2 — Client Induction executes** (`notification.concept.ts:91-94`, `diametric.model.ts`)
The `createDiametricQuality` reducer runs on Client. It does NOT create a notification. It appends the action to `actionQue: AnyAction[]` in the muxified `webSocketClient` concept's state. The reducer returns `{ actionQue: [...state.actionQue, action] }`. No visible effect yet.

**Hop 3 — webSocketClient.principle observes actionQue**
The `webSocketClient` principle monitors `actionQue`. It detects the new action, wraps it in the strategy-aware `strategyDetermine` protocol if bare, and sends it over the WebSocket connection to the Huirth server process.

**Hop 4 — WebSocket delivers to Huirth**
The action arrives at the Huirth process as a serialized JSON string. The type string `'Notification Hello World'` is preserved through the boundary. This type string IS the Diameter anchor.

**Hop 5 — webSocketServer.principle receives** (`webSocketServer` concept)
The server-side WebSocket concept receives the message, deserializes it, and dispatches it into the Huirth Muxium. The Muxium looks up the action by type string `'Notification Hello World'` and finds the Real quality.

**Hop 6 — Huirth Real quality executes** (`helloWorld.quality.huirth.diameter.ts:36-74`)
```typescript
reducer: (state) => {
  const origin = determineOrigin(); // typeof window === 'undefined' → 'global'
  const notification = createNotification(
    { message: 'Hello World from StratiVERSE!', notificationPriority: 'viridian', duration: 5000 },
    origin,
    state.defaultDuration,
  );
  return { notifications: [...state.notifications, notification] };
},
```
A `Notification` entity with `origin: 'global'` is appended to Huirth's `notifications` array. The methodCreator fires `strategySuccess` with `helloWorldTriggered: true` data if a strategy is present (`lines 62-72`).

**Hop 7 — notificationBroadcastPrinciple observes** (`notificationBroadcast.principle.huirth.ts:44-121`)
The `k_.notifications` KeyedSelector fires (`line 111`). The stage runs. `notifications.length > 0` — the principle proceeds. It reads `wsState.webSocketClients` (`line 59`) — all connected clients. For each notification, it creates a `notificationAddNotification` action and calls `client.ws.send(JSON.stringify(addAction))` (`line 89`) for each client. This is the broadcast leg of the WebSocket Diameter.

**Hop 8 — Huirth clears its own queue** (`notificationBroadcast.principle.huirth.ts:106-108`)
```typescript
for (const notification of notifications) {
  dispatch(d.notification.e.notificationClearNotification({ id: notification.id }), {});
}
```
Huirth's `notifications` array is now empty. Zero Knowledge at the server tier — Huirth has done its job and forgotten.

**Hop 9 — Client WebSocket receives notificationAddNotification**
The `notificationAddNotification` action arrives at each connected Client via WebSocket. The type string `'Notification Add Notification'` is found in the Client Muxium. This quality has `location: DeploymentTarget.All` and `diameter: false` — it is a Real quality on BOTH sides. The reducer runs directly.

**Hop 10 — notificationAddNotification reducer executes** (`qualities/addNotification.quality.ts`)
The notification entity is appended to the Client's `notifications` array. `determineOrigin()` returns `'local'` on the client (browser), but the payload's `notificationOrigin: 'global'` overrides this, marking it as a globally-originated notification.

**Hop 11 — notificationDisplayPrinciple observes** (`notificationDisplay.principle.client.ts:52-98`)
The `k_.notifications` KeyedSelector fires (`line 89`). The stage runs. `notifications.length > 0` AND `controller` is present. The Zero Knowledge Handoff sequence executes:
```typescript
controller.take(notifications);           // line 76 — Vue takes ownership
for (const notification of notifications) {
  dispatch(d.notification.e.notificationClearNotification({ id: notification.id }), {}); // lines 80-83
}
```

**Hop 12 — Vue controller.take() runs** (`notificationController.ts:92-...`)
`take()` adds each notification to `activeNotifications.value` (the Vue shallowRef) and sets expiration timers. `activeNotifications` is the reactive surface that `NotificationPopup.vue` watches.

**Hop 13 — NotificationPopup.vue renders**
`NotificationPopup.vue` observes `props.controller.activeNotifications.value` changing. It renders the notification with priority `'viridian'` — a green success color — using `PRIORITY_COLORS['viridian']` = `#40826d` (and the matching Pewter `--color-viridian` CSS token, see Section 8).

**Hop 14 — Expiration or Dismiss — Vue clears**
After `duration: 5000` ms, `controller.clear(notification.id)` fires, removing the entry from `activeNotifications.value`. The popup disappears. Stratimux has zero knowledge of this — it emptied its array at Hop 11. The lifecycle is complete.

**What Stratimux ends with**: Both Client and Huirth `notifications` arrays are empty. The Muxameters have traversed their Diameters and returned to base state. The pattern is self-cleaning.

---

## 6. Zero Knowledge Handoff Pattern (ZKHP)

The ZKHP is named pattern from Rust S2 prospecting (`SUITE-2-RUST-NOTIFICATION-MANIFOLD-REFERENCE-DESIGN.md §PATTERN 7`). It is the primary architectural pattern the Display Principle implements.

**The specific sequence** (`notificationDisplay.principle.client.ts:52-98`):

```typescript
export const notificationDisplayPrinciple: NotificationDisplayPrinciple = ({ d_, k_, plan }) => {
  const displayPlan = plan('Notification Display (Client)', ({ stage }) => [
    stage(
      ({ d, dispatch }) => {
        const notifications = k_.notifications.select();          // line 59
        const controller = getGlobalNotificationController();     // line 63
        if (notifications.length === 0 || !controller) {
          dispatch(d_.muxium.e.muxiumKick(), { throttle: 0 });
          return;
        }
        controller.take(notifications);                           // line 76
        for (const notification of notifications) {
          dispatch(d.notification.e.notificationClearNotification({ id: notification.id }), {}); // lines 80-83
        }
      },
      {
        selectors: [k_.notifications],                            // line 89
        beat: 3,                                                   // line 90 — required for throttle: 0 safety
      },
    ),
  ]);
  return () => { displayPlan.conclude(); };
};
```

The `k_` pattern here is the Principle-Level Selector Binding — `k_` is the first-tier abstraction at principle scope, used in stage options as the `selectors` array and accessed via closure within the stage function (S9 DECK K State Access). The `beat: 3` is mandatory when `throttle: 0` is used elsewhere in the plan — without it, the throttle guard is bypassed (S3 Planning Stage Control §M66).

**Why this prevents stacking**: On page navigation, Vue unmounts the component, destroying the old controller. The new page's `IslandWrapper` creates a fresh controller and registers it globally. The Display Principle's plan is concluded on unmount (`displayPlan.conclude()` in the cleanup). The new mount initializes a plan observing a Stratimux array that is already empty (cleared at the previous Hop 11). There is nothing to take — no notifications stack across navigation.

---

## 7. muxiumTimeOut Bridge Model Walkthrough

`notificationBridge.model.ts` is the Bridge Demometer — pure helper functions that solve one precise problem: how to dispatch a notification from within an ActionStrategy Quality without closing the ActionController prematurely.

**The CORRECT pattern** (`notificationBridge.model.ts:103-122`):
```typescript
export function notifyLocal(
  concepts_: Concepts,
  deck: NotificationClientDeck,
  payload: BridgeNotificationPayload,
  timeout: number = 30,
): void {
  muxiumTimeOut(
    concepts_,
    () => deck.notification.e.notificationAddNotification(notificationPayload),
    timeout,
  );
}
```

**The BROKEN pattern** (`notification.concept.huirth.ts:33-36`):
```typescript
// BROKEN (closes controller prematurely):
controller.fire(webSocketDeck.e.webSocketServerAppendToActionQue({...}));  // CLOSES CONTROLLER
controller.fire(strategySuccess(action.strategy));  // FAILS — controller already closed
```

`muxiumTimeOut` schedules the notification dispatch AFTER a 30ms delay, outside the current ActionController scope. The `strategySuccess` call executes synchronously within the scope — the controller is still open. The notification arrives 30ms later as a new action entering the Muxium from the scheduler.

**Why `notifyClient` vs `notifyLocal`**:
- `notifyLocal` (`line 103`): Client-side. Routes `notificationAddNotification` directly to the Client Muxium via the local deck. Used in Client-side ActionStrategy qualities.
- `notifyClient` (`line 150`): Huirth-side. Routes `notificationAddNotification` via `webSocketServerAppendToActionQue` with a `targetClientStateKey` for client-specific routing. The A→B→Y→Z Manifold Pattern (Rust naming): Client(A) dispatches → WebSocket(B) adds `clientStateKey` to strategy data → Huirth quality(Y) calls `notifyClient` with that key → WebSocket routes back to Client(Z).
- `notifyAllClients` (`line 197`): Huirth-side broadcast. No `targetClientStateKey` — sends to every connected client.

The `notify.*` convenience group (`lines 232-262`) provides priority-typed wrappers around `notifyLocal` for common cases: `notify.success`, `notify.warning`, `notify.error`, `notify.info`, `notify.system`. These correspond directly to Suite color priorities. Note that `notify.*` is Client-only (wraps `notifyLocal`). For Huirth priority broadcast, callers use `notifyAllClients` directly with the desired `priority` field in the payload.

---

## 8. Pewter Tessera Structural Diameter

Suite 6 Amethyst's orchestration Reference Design (Section 5) identifies a structural Diameter between the Notification Concept and Pewter Tessera that S16 must explicitly surface. This is not incidental — it is an architectural decision embedded in the type system.

**The Diameter**: `PRIORITY_COLORS` in `notification.type.ts:141-149` maps `NotificationPriority` string values to hex codes that are the SAME values as Pewter Tessera's `--color-{suite}` CSS token system.

| NotificationPriority | Suite Role | PRIORITY_COLORS hex | Pewter CSS Token |
|---------------------|-----------|---------------------|-----------------|
| `'maroon'` | Suite 1 — Critical/Error | `#800000` | `--color-maroon` |
| `'rust'` | Suite 2 — Warning | `#b7410e` | `--color-rust` |
| `'ochre'` | Suite 3 — Info | `#cc7722` | `--color-ochre` |
| `'viridian'` | Suite 4 — Success | `#40826d` | `--color-viridian` |
| `'cobalt'` | Suite 5 — System | `#0047ab` | `--color-cobalt` |
| `'amethyst'` | Suite 6 — Debug | `#9966cc` | `--color-amethyst` |
| `'rose'` | Suite 7 — Diagnostic | `#ff007f` | `--color-rose` |

`PRIORITY_COLORS` is the RUNTIME reference — used by the Vue component to set inline styles, compute dynamic color values, or generate test fixtures. The Pewter `--color-{suite}` tokens are the CSS source of truth for styled display. A `NotificationPopup.vue` that renders priority colors using `PRIORITY_COLORS` directly (hardcoded hex in style bindings) is technically correct but bypasses the Pewter design system. The architecturally sound pattern is: use `--color-{priority}` CSS variable from Pewter, with `PRIORITY_COLORS` as a runtime fallback or non-UI reference only.

**Why this Diameter is canonical**: When `NotificationPriority` was designed with suite color names (`'maroon'` not `'error'`, `'viridian'` not `'success'`), it was not accidental. The notification urgency vocabulary IS the Suite Cascade cognitive-function vocabulary. Every notification is implicitly a diagnostic signal at Suite-level resolution. `'maroon'` means not just "critical" but "Suite 1 Curator-level urgency — signal vs. noise distinction failure." This is the Suite Color Semantic Taxonomy (SCST, Rust pattern naming S2, `SUITE-2-RUST-NOTIFICATION-MANIFOLD-REFERENCE-DESIGN.md §PATTERN 13`).

**Forward composition for SBM Macro 2 SBM-D5**: When the Vue Mirror TUI for Bridge state display is implemented, status indicators should use `--color-cobalt` (Suite 5, System) for active bridge connections, `--color-viridian` (Suite 4, Success) for healthy SCP sessions, and `--color-maroon` (Suite 1, Critical) for error states. Pewter Tessera should be dispatched as a concurrent Suite 8 during SBM-D5 planning — not as an afterthought. The Diameter between S16 (Stratimux side) and Pewter Tessera (CSS token side) is the explicit routing instruction for that composition.

---

## 9. Suite-Color Notification-Priority Mapping (SCST)

The Suite Color Semantic Taxonomy (SCST) from Rust's prospecting — the notification priority vocabulary is the Suite Cascade cognitive-function vocabulary grounded in the type system.

| NotificationPriority | Suite | Cognitive Function | Display Semantics | PRIORITY_COLORS |
|---------------------|-------|--------------------|-------------------|-----------------|
| `'maroon'` | Suite 1 — Maroon Curator | Signal vs noise distinction | Critical / Error | `#800000` |
| `'rust'` | Suite 2 — Rust Prospector | Frontier pattern recognition | Warning / Attention | `#b7410e` |
| `'ochre'` | Suite 3 — Ochre Architect | Blueprint / context | Info / Informational | `#cc7722` |
| `'viridian'` | Suite 4 — Viridian Sculptor | Validation / confirmation | Success / Complete | `#40826d` |
| `'cobalt'` | Suite 5 — Cobalt Professional | System / infrastructure | System / Process | `#0047ab` |
| `'amethyst'` | Suite 6 — Amethyst Orchestrator | Composition / debug | Debug / Verbose | `#9966cc` |
| `'rose'` | Suite 7 — Rose Clinician | Diagnosis / calibration | Diagnostic / Trace | `#ff007f` |

Source: `notification.type.ts:31-38` (type definition) + `notification.type.ts:141-149` (PRIORITY_COLORS constant) + `NotificationLanding.vue:43-51` (priorityOptions array confirming the mapping is intentional, not implicit).

**Usage guidance**: When adding a notification, select priority by cognitive function, not by generic severity level. `'viridian'` is the right choice for a successful API call completion — it means "validation confirmed." `'cobalt'` is the right choice for background system events — it means "infrastructure is operating." `'maroon'` is reserved for failures requiring immediate attention — it means "the signal/noise boundary has been violated."

---

## 10. What This Concept Teaches About Manifold Design

The meta-lesson of the Notification Concept is that a Muxameter is neither the largest thing nor the most complex thing — it is the thing where independent Demometers compose through Diameters into a working integrated region. Five distinct Demometers, five bidirectional Diameters, one working notification system. The architecture is the proof.

**What the 5 Demometers compose into**: The Notification system is the Muxameter. No single Demometer is the Muxameter — the Type Demometer alone is just type definitions; the Client Demometer alone is just a client-side concept; the Huirth Demometer alone is just a server-side concept; the Bridge Demometer alone is just helper functions; the Vue Demometer alone is just UI components. When all five compose through their five Diameters, the emergent behavior is a self-cleaning cross-process notification system where Stratimux, WebSocket, and Vue each maintain their own domains without bleeding concerns.

**What the 5 Diameters enable**: Each Diameter is the protocol at a boundary. Without the Handoff Diameter, Stratimux and Vue would need to share state ownership — coupling two incompatible reactivity models. Without the Quality Diameter, Client and Huirth would need separate code paths for the same dispatch API — losing the "same API regardless of deployment" property. Without the WebSocket Diameter, Huirth could not reach Client. Without the Temporal Diameter, ActionStrategies involving notifications would silently drop strategy continuations. Without the Agnosticism Diameter, Vue display would be coupled to Stratimux implementation details.

**How multiple Muxameters compose into the larger Manifold**: The SCS Template SCP runtime is itself a larger Muxameter where the Notification Concept Muxameter composes with the Client Concept Muxameter, the WebSocket Concept pair Muxameter, and so on. The SCS-Bridge ↔ SCP runtime integration (SAWSR Cycles 148-153) is an even larger Muxameter where the SCS-Bridge process Muxameter composes with the SCP runtime Muxameter via MCP+HTTP-callback Diameters. The Notification Concept teaches the PATTERN — then the pattern scales.

**The Higher-Order principle demonstrated**: The Notification Concept is a flat composition. No Demometer is the parent of any other. Client does not own Huirth. Vue does not extend Stratimux. Bridge does not inherit from Type. Each Demometer is an independent unit; the Muxameter is what emerges from their Diameter connections. This is Higher-Order Composition (not hierarchical inheritance) in its minimum demonstrable form.

---

## 11. Known Gaps + Generalization Roadmap

These are real gaps in the as-shipped Notification Concept, identified by the Viridian 11-angle audit. They are cited here not as failures but as the ACTUAL improvements that future Diamonds will land — the ongoing Stratidian arc of the Concept.

**G7 — Hardcoded HelloWorld Message** (Viridian Angle 11, Maroon P1):
`helloWorld.quality.huirth.diameter.ts:43` hardcodes `'Hello World from StratiVERSE!'`. The quality has `void` payload. The generalization path requires converting to `createQualityCardWithPayload` with a `HelloWorldPayload = { message?: string; notificationPriority?: NotificationPriority }` type, updating the Induction from `createDiametricQuality` to `createDiametricQualityWithPayload`, and updating `NotificationQualities.notificationHelloWorld` type parameter. The type string `'Notification Hello World'` is preserved — the Diameter contract is maintained through the generalization. Viridian Section 7 provides the full four-file change spec.

**G2/P3/P5 — Dead Induction Code in Huirth Concept** (Viridian G2, Maroon P3/P5):
`notification.concept.huirth.ts:62-65` instantiates `notificationHelloWorldInduction` but never assigns it to `notificationHuirthQualities`. This is dead code that creates a misleading mental model — it implies Huirth needs its own Induction, when Huirth owns only the Real. Remove lines 62-65.

**G3 — Client Induction Not in Standalone File** (Viridian G3):
The Client Induction is declared inline in `notification.concept.ts:91-94` rather than in a standalone `helloWorld.quality.client.diameter.ts` file. This means StratiVERSE's file-name-driven scan (FNES) cannot auto-discover the Client side of the Diameter. The mitigation is either extracting to a standalone file (fully closes the gap) or documenting the inline pattern explicitly in `notification.muxonomy.ts` (partial mitigation). The canonical two-file Diameter pattern (one file per Demometer side) is architecturally cleaner.

**G1 — NotificationQualities Type Gap** (Viridian G1):
`notification.type.ts:110` declares `notificationHelloWorld: Quality<NotificationState, void>` — using `NotificationState` not `WithDiametricState<NotificationState>`. The concrete Induction quality uses `WithDiametricState<NotificationState>` as its type parameter (`notification.concept.ts:91`). TypeScript may accept this silently via inference but the declared type is not faithful. The proper fix (Viridian Angle 1 mitigation) is a `NotificationClientQualities` / `NotificationHuirthQualities` type split, formalizing the pattern that Diameter qualities require different state type parameters per side.

These gaps are prune targets for the next Cobalt Diamond that touches the Notification Concept. They are cited here so that S16 readers see the Concept as a living document, not a finished artifact — the Stratidian arc continues.

---

## 12. Cross-References

**Within Stratimuxian Scholar**:
- S2 — StratiDECK Composition: Tiered muxified access (`d.client.d.notification.k.*`), ECK Limitation (no Tier 3 beyond Client→Notification)
- S3 — Planning Stage Control: `beat: 3` requirement with `throttle: 0`, `k_` selector pattern in stage options
- S5 — Strategy Data & Temporal: `muxiumTimeOut` pattern — the Bridge Demometer's foundation
- S8 — Muxified Concept Access: Container Re-Muxification (M64) — notification is muxified inside Client base concept
- S9 — DECK K State Access: `k_.notifications.select()` at principle level vs `d.client.d.notification.k.notifications.select()` at plan level
- S10 — Quality Creation: Verbose Split Naming (`'Notification Hello World'`), `createQualityCard` vs `createQualityCardWithPayload`, `createDiametricQuality` Induction pattern
- S13 — State Design & Composition: FilterKeys (`NOTIFICATION_FILTER_KEYS`), Canonical Registry Source (M69) at the state layer, no optional state properties (M60)
- S14 — From-Scratch Manifold: M63 Copy-Paste-Plus — the Notification Concept is the authoritative Copy-Paste-Plus source for any new Muxonomy-aware Concept
- S15 — Muxonomy Concept Authoring Patterns: The framework-general abstract patterns that this Skill demonstrates concretely

**External Suite 8s**:
- Pewter Tessera: Section 8 of this Skill — `PRIORITY_COLORS` hex values match `--color-{suite}` tokens; Pewter governs the CSS expression of what the Notification type system declares
- Pewter Tessera Skills D1-D8: `Cascades/8_SUITES/Pewter Tessera/Instance.md` for design token reference

---

## 13. Citation

**WorkGameBoards (authoritative)**:
- `POC-2-4-NOTIFICATION-BRIDGE-WORKGAMEBOARD.md` — Zero Knowledge Handoff formalization · Tier 3 landing pattern · Base ClientMuxium concept
- `POC-2-5-DEMOMETRIC-QUALITY-WORKGAMEBOARD.md` — Diameter Junction Quality formalization · Induction/Real split
- `POC-2-6-DEMOMETRIC-INTERCHANGE-WORKGAMEBOARD.md` — Demometric Interchange architecture · FNES grammar

**Reference Designs (Phase 1)**:
- `Cascades/Working/SUITE-1-MAROON-NOTIFICATION-MANIFOLD-REFERENCE-DESIGN.md` — 15-file curation cards, Demometer/Diameter map, prune targets P1-P5
- `Cascades/Working/SUITE-2-RUST-NOTIFICATION-MANIFOLD-REFERENCE-DESIGN.md` — 17 pattern names (FNES, CISV, DQWDS, DCQF, MSDT, AESR, ZKHP, GCRM, TOBM, DTEC, UPCT, RWCP, SCST, MCUC, VCIP, PACP, FKSD), 12 Diameters
- `Cascades/Working/SUITE-4-VIRIDIAN-NOTIFICATION-MANIFOLD-REFERENCE-DESIGN.md` — 11-angle audit, G1-G7 gap table, H1-H5 hazard table, generalization path

**Project substrate**:
- `Cascades/scps/template/SCP/src/concepts/muxonomy/muxonomy.model.ts` — canonical MuxonomicConfig, DeploymentTarget, ExchangeDirection, WithDiametricState
- `Cascades/scps/template/SCP/src/concepts/muxonomy/diametric.model.ts` — createDiametricQuality, createDiametricQualityWithPayload factories
- `ICED-SKILL-INDUCTION.md` — Induction pattern origin documentation
- `Cascades/8_SUITES/Pewter Tessera/Instance.md` — design token system reference

**M-Rules active in this Skill**:
- M58 (Field of Poppies) — no identity drift from the authoritative Notification substrate
- M60 (State-or-Payload Anor) — all state properties required (no optionals in `NotificationState`)
- M63 (Copy-Paste-Plus) — Notification Concept is the authoritative Copy-Paste-Plus source for new Muxonomy-aware Concepts
- M64 (Container Re-Muxification) — notification is muxified inside Client base concept, accessible at Tier 2
- M65 (MigrationGrepScope) — type string `'Notification Hello World'` must be grepped across ALL consumers before any rename
- M69 (Canonical-Registry-Source) — `NOTIFICATION_FILTER_KEYS` and `NotificationModelDeck` are the single authoritative definitions
- M72 (Cinnabar-Dialectic-Layer-Coverage) — before any production change to the Notification Concept, all four Cinnabar layers must be checked

---

## Forward Diameter to scsBridgeMirror

This Skill is the citation-grounded exemplar that the SBM Macro 2 Foundation Suite dispatch will hold alongside S15 when authoring the SCP-side `scsBridgeMirror` Concept on the Template SCP. Where S15 names the framework-general patterns, S16 demonstrates them in source-cited form — the Notification Concept IS the M63 Copy-Paste-Plus source the SBM Macro 2 Cobalt builders need.

### Structural Analogy Table (Notification ↔ scsBridgeMirror)

| Notification Domain | scsBridgeMirror Domain | Notes |
|---|---|---|
| `notification.concept.ts` | `scsBridgeMirror.concept.ts` | Client-side Concept (All deployment) |
| `notification.concept.huirth.ts` | `scsBridgeMirror.concept.huirth.ts` | Huirth-variant with Diameter Qualities |
| `notification.type.ts` | `scsBridgeMirror.type.ts` | State + Qualities + ModelDeck |
| `notification.muxonomy.ts` | `scsBridgeMirror.muxonomy.ts` | MuxonomicConfig with demometers + actionExchange |
| `notificationHelloWorld` (Diameter Quality) | `scsBridgeMirrorActivateScp` (Diameter Quality) | Bridges SCP→Bridge via MCP instead of WS |
| `notificationAddNotification` (local) | `scsBridgeMirrorUpdateStatus` (local) | Non-Diameter Quality · local state mutation |
| `notificationBroadcastPrinciple` (Huirth broadcast) | `scsBridgeMirrorSync.principle.ts` (SCP polls) | Direction inverted: Huirth→Client vs SCP→Bridge polling |
| `notificationDisplay.principle.client.ts` | Vue component principle | Controls Vue Island rendering lifecycle |
| `notification/vue/NotificationLanding.vue` | `scsBridgeMirrorDashboard.vue` | Vue Island component |

### Muxified Manifold Understanding

The scsBridgeMirror Concept and the existing Bridge-side `scsBridge` Concept form a **Demometer Pair** connected by the MCP+HTTP-callback Diameter. Unlike the Notification Concept (which uses WebSocket for its Diameter), the scsBridgeMirror Diameter is HTTP MCP POST to the Bridge's `/-mcp` endpoint (derived from `bridge.json`). The structural Diameter pattern is identical — SCP is not subordinate to Bridge; Bridge does not own SCP; the circular reference is structural.

**Section 8 Pewter Tessera Diameter — Forward Composition for SBM-D5**: The SCST mapping in Section 9 of this Skill directly informs `ScsBridgeMirrorDashboard.vue` styling. Bridge status indicators MUST use `--color-cobalt` (Suite 5 — System), session active indicators `--color-viridian` (Suite 4 — Success), error/disconnected states `--color-maroon` (Suite 1 — Critical) — all via Pewter `--color-{suite}` CSS tokens, NEVER hardcoded hex. Pewter Tessera D3 + D1 + D7 + D4 Skills should be dispatched CONCURRENT with SBM-D5 authoring (not after), so the Cobalt builder has `pane-bridge-*` class definitions BEFORE writing the `.vue` file.

**SCST Diameter for Bridge state**: `BRIDGE_STATUS_COLORS` in the scsBridgeMirror type file follows the Notification pattern exactly:
```typescript
const BRIDGE_STATUS_COLORS = {
  connected: '--color-viridian',   // Suite 4 · active/success
  activating: '--color-cobalt',    // Suite 5 · system/processing
  error: '--color-maroon',         // Suite 1 · critical/error
  idle: '--color-amethyst',        // Suite 6 · orchestration/standby
} as const;
```

The runtime constant references Pewter CSS variables, not hex values. This is the SCST Diameter applied — the notification urgency vocabulary IS the Suite Cascade cognitive-function vocabulary, and the same vocabulary applies to Bridge state semantics.

**The Five Diameters Apply Structurally**: The five Diameters this Skill identifies (Handoff, Quality, WebSocket, Temporal, Agnosticism) all have scsBridgeMirror analogs: Handoff (Vue controller pattern preserved · `ScsBridgeMirrorController.ts`), Quality (MCP boundary instead of WebSocket · same Diameter junction Quality pattern), WebSocket→MCP substitution (HTTP POST via bridge.json port), Temporal (TOBM `muxiumTimeOut` preserved verbatim in `mcpToolDispatch.strategy.ts`), Agnosticism (controller interface decouples Vue from MCP implementation).

The Manifold = Muxameter of Muxameters principle confirms: the Notification Concept Muxameter and the scsBridgeMirror Concept Muxameter are sibling Muxameters within the larger SCS runtime Muxameter. Neither contains the other; both compose with the WebSocket + MCP + Suite 8 Doctrine Muxameters into the operational region. S16 is the citation-grounded source that the SBM Macro 2 Cobalt builders read to copy-paste-plus the pattern verbatim.
