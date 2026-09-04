# SCP-S13 · Concept Authoring on the Template SCP

**Aspect**: Agent-actionable curriculum for authoring a new Muxonomy-aware Concept in the Template SCP runtime, using the Notification Concept as the Hello World template (Copy-Paste-Plus · M63)
**Protocol**: Eight-Phase procedural walk-through · each Phase ends with a Concluder gate that must pass before proceeding
**Version**: 1.0
**Origin**: Notification-Manifold Formalization Macro · Phase 2 · Ochre-C Final Draft · Cycle 154
**Skill ID**: SCP-S13
**Skill Name**: ConceptAuthoring

---

## Curation
The SCP paradigm enables adding a Muxonomy-aware Concept to a running SCP by Copy-Paste-Plus from ONE solved exemplar — the Notification Concept — rather than from scratch: every structural problem a new Concept meets (the dual face, the Diameter junction, the Induction/Real pair, the registry) is already solved and verified in `src/concepts/notification/`. Each Phase below ends in a Concluder, so authoring is measured at eight gates, not declared at the end. What THIS SCP composes today (its `src/concepts/` listing) is the first read — the same procedure on a different SCP yields a different enumeration.

## Research
`<SCP>` = the SCP this seat sits in — the directory holding `scp.config.json`, three levels above this file. Every step is a literal command; run it, report what RETURNS, never what the body below says should return (`Instance.md` §"Operating Principle" · B). The body (Phases 1-8) IS the Vermillion-scale research procedure; this section is the Sentence / Section read and the freshness law the body predates.

1. Identity — `cat <SCP>/scp.config.json` → `scpName`.
2. What this SCP composes — `ls -d <SCP>/src/concepts/*/ | wc -l` and `ls <SCP>/src/concepts/`. Against the template baseline (`Cascades/scps/template/SCP/src/concepts/` · 22 directories at C1124): `diff <(ls <SCP>/src/concepts) <(ls <template>/src/concepts)` names the SCP-specific Concept(s). Measured C1124: Stratithon adds exactly `meteoricShipwright`.
3. The exemplar exists — the Phase 1 Concluder verbatim (three `test -f` on `notification/notification.muxonomy.ts` · `notification/qualities/helloWorld.quality.huirth.diameter.ts` · `muxonomy/diametric.model.ts`, all under `<SCP>/src/concepts/`). All three `ok`, or this door is not open on this SCP.
4. FRESHNESS of the generated registry (the Freshness Proof · `Instance.md` §B) — `grep -n "conceptCount\|generatedAt" <SCP>/src/concepts/muxonomyRegistry.generated.ts` against step 2's directory count. Measured C1124 on Stratithon AND on the template: `conceptCount: 0`, `generatedAt: '2026-01-28…'`, `REGISTERED_MUXONOMICS = []` — a STALE EMPTY STUB against 23 (Stratithon) / 22 (template) concept directories. Its header names `npm run strativerse:scan` as the regenerator; that script is NOT in the template's `package.json` (`bridge · start · build · build:client · build:server · build:all · test`). Therefore the Phase 7 / 8.3 Concluder `grep -c "<conceptName>" muxonomyRegistry.generated.ts >= 2` measures registration IN THIS FILE, which the running SCP does not currently populate — report the staleness as a finding; never report `conceptCount: 0` as "no concepts". The concepts wired at boot are the `BASE_CONCEPTS_CREATORS` in `<SCP>/src/concepts/client/client.muxonomy.ts` (`grep -n -A 12 "export const BASE_CONCEPTS_CREATORS" …`).
5. CISV on the exemplar — `grep -n "Induction" <SCP>/src/concepts/notification/notification.concept.ts` (the Client owns the Induction) and `grep -n "Induction" <SCP>/src/concepts/notification/notification.concept.huirth.ts` (comments only — the dead Huirth Induction was removed at Phase 3 Cobalt-C). Read the placement from the files, not from the Phase prose.
6. The typecheck gate (Vermillion rung only) — Phase 8.1 names `npm run typecheck`; the template's `package.json` carries no `typecheck` script at C1124. Run `cd <SCP> && npx tsc --noEmit -p .` (a `tsconfig.json` is present) or the SCP's own `npm run build`, and report the command ACTUALLY run with its exit code.

Inward only. When the ask is Vermillion-scale, Phases 2-8 are queued as a per-ask Vermillion whose Bands are the Phases and whose gates are the Phase Concluders (`Instance.md` §B · how research is queued).

## Return
- Sentence: "`<scpName>` composes `<N>` concepts, `<K>` beyond the template baseline (`<names>`); the generated registry is stale (`conceptCount: 0`)."
- Section: the Sentence + the exemplar-present Concluder + the Phase the ask concerns + that Phase's own Concluder.
- Vermillion: the Eight-Phase walk (this Skill's native scale) — Bands = Phases, gates = Phase Concluders, the §"Lambda Trigger" battery as the close.
- Diamond: a pattern the Notification exemplar does not cover — returned INLINE with the founding offer (`Instance.md` §B · the Diamond rung's law); the What/Why feeds back to SCP-S14.
---

## Pearl Summary

Authoring a new Concept on the Template SCP runtime means creating a Muxonomy-aware compositional unit — not a module, not a class hierarchy, but a Demometer with Diameters to the Client and Huirth sides of the SCP runtime. The Notification Concept at `Cascades/scps/template/SCP/src/concepts/notification/` is the Hello World template: every pattern an author needs is already working and verified there. Success looks like this: the new Concept compiles (exit 0 on typecheck), registers in `muxonomyRegistry.generated.ts`, and its Diameter Junction quality routes correctly from Client through WebSocket to Huirth and back. This Skill is the procedural curriculum; S15 (Stratimuxian Scholar) is the framework-level theory; S16 (Stratimuxian Scholar) is the deep Notification-file walkthrough. This Skill is the action — an agent who reads and executes its phases produces a working Concept.

---

## Invocation Context

This Skill fires when:

- A Diamond or Banded Plan requires a new Stratimux Concept to be added to the Template SCP runtime tree at `Cascades/scps/template/SCP/src/concepts/<newConceptName>/`
- Pattern E (Research-Target Adaptation) in Conductor.md Band 5 when `addition_scope = new_concept`
- Any Band that has completed Stratimuxian Scholar architectural review (S15) and needs the hands-on implementation counterpart

**Cross-Suite invocation pattern**: Conductor routes Pattern E Band 3 to Stratimuxian Scholar (S15 for architecture). Pattern E Band 5 invokes this Skill (SCP-S13) as the implementation guide. The Scholar architects the types; SCP-S13 grounds the authoring in the Template SCP's specific runtime structure.

**What this Skill does NOT cover**: Framework-general Muxonomy theory (read S15 first). Deep Notification file anatomy (read S16 for that). Bridge-communication via bridge.json (read SCP-S12).

---

## Phase 1 · Pre-Authoring Study

Before writing a single file, the agent MUST read the Hello World template in full. This is not optional — authoring without reading the template produces the From-Scratch Gap (S14 §Why This Skill Exists). The Notification Concept has already solved every structural problem the new Concept will face.

**Required reads (in order)**:

```
0. SCP-S14 DemometricConceptPattern.md — read FIRST if you have not. S14 is the What/Why; this Skill is the How. Author from S14's mental model.
1. Cascades/scps/template/SCP/src/concepts/notification/notification.type.ts
2. Cascades/scps/template/SCP/src/concepts/notification/notification.state.ts
3. Cascades/scps/template/SCP/src/concepts/notification/notification.muxonomy.ts
4. Cascades/scps/template/SCP/src/concepts/notification/notification.concept.ts
5. Cascades/scps/template/SCP/src/concepts/notification/notification.concept.huirth.ts
6. Cascades/scps/template/SCP/src/concepts/notification/qualities/helloWorld.quality.huirth.diameter.ts
7. Cascades/scps/template/SCP/src/concepts/notification/model/notificationBridge.model.ts
8. Cascades/scps/template/SCP/src/concepts/muxonomy/muxonomy.model.ts  (MuxonomicConfig type)
9. Cascades/scps/template/SCP/src/concepts/muxonomy/diametric.model.ts  (createDiametricQuality)
10. Stratimuxian Scholar S15 Skill (Muxonomy Concept Authoring Patterns — the Why/What)
11. Stratimuxian Scholar S16 Skill (Notification Muxameter Exemplar — the citation-grounded trace)
```

**Pre-Authoring Comprehension Checklist (Concluder Gate)**

Before writing any file, the agent MUST be able to answer these without re-reading:

```
[ ] What are the three Notification qualities? Which is a Diameter Junction?
    Answer: notificationAddNotification (All·false), notificationClearNotification (All·false),
            notificationHelloWorld (Huirth·true — the Diameter Junction)

[ ] What FNES suffix signals a Diameter Junction quality?
    Answer: .quality.huirth.diameter.ts (or .quality.client.diameter.ts)

[ ] What does createDiametricQuality do at runtime?
    Answer: Produces a reducer that appends the action to actionQue (provided by muxified
            webSocketClient). The WebSocket principle picks it up and sends it to the other
            side where the Real quality executes by matching type string.

[ ] What is the CISV invariant and what breaks without it?
    Answer: The Induction variable MUST carry the 'Induction' suffix
            (e.g., const notificationHelloWorldInduction = createDiametricQuality(...)).
            Without it, toReal transformation fails → infinite action loop (silent at compile time).

[ ] What do FilterKeys protect?
    Answer: State properties excluded from server-sync. Declared in both state.ts
            (FILTER_KEYS constant) and muxonomy.ts (filterKeys array) — FKSD dual declaration.

[ ] What is Zero Knowledge Handoff (ZKHP) and why does it prevent notification stacking?
    Answer: Stratimux holds the array → principle calls controller.take() → Vue takes ownership
            → principle dispatches clearNotification → Stratimux array is empty.
            Page navigation creates a new controller AND finds an empty Stratimux array:
            no stacking across navigation events.
```

**Concluder for Phase 1**:
```bash
# Verify all required source files exist before proceeding
test -f "Cascades/scps/template/SCP/src/concepts/notification/notification.muxonomy.ts" && echo "muxonomy ok"
test -f "Cascades/scps/template/SCP/src/concepts/notification/qualities/helloWorld.quality.huirth.diameter.ts" && echo "diameter quality ok"
test -f "Cascades/scps/template/SCP/src/concepts/muxonomy/diametric.model.ts" && echo "diametric model ok"
```

All three must return `ok` before Phase 2 opens.

---

## Phase 2 · Name and Scope Definition

Define the new Concept before writing any file. This is the Spec-Before-Code discipline.

### 2.1 — Choose a Concept Name

- camelCase, lowercase-first, single or compound word
- Examples: `presence`, `commandLog`, `activityFeed`, `sessionState`
- The name becomes the directory: `src/concepts/<conceptName>/`
- The name becomes the Muxonomy key: `MuxonomicConfig<'conceptName'>`

### 2.2 — Declare Deployment Scope for Each Quality

For every Quality you plan to author, decide its FNES classification:

| Quality | Location | Diameter? | File Suffix |
|---|---|---|---|
| Shared state operation (add, clear, update) | All | false | `.quality.ts` |
| Server executes, client initiates | Huirth | true | `.quality.huirth.diameter.ts` |
| Client executes, server initiates (rare) | Client | true | `.quality.client.diameter.ts` |
| Server-only, no client counterpart | Huirth | false | `.quality.huirth.ts` |

**Decision rule**: If the Quality must cross the WebSocket boundary in EITHER direction, it is a Diameter Junction (`diameter: true`). If it runs identically on both sides, it is All with no diameter.

**H5 NOTE (Viridian Hazard · Module Counter SSR Collision)**: If the Concept needs to generate unique IDs in `type.ts` (e.g., `generateNotificationId()` pattern), use `crypto.randomUUID()` instead of a module-level counter. In SSR environments with multiple render threads, a module-level counter (`let counter = 0; counter++`) accumulates across concurrent requests and produces ID collisions.

### 2.3 — Declare Principles

| Principle | When needed | File Suffix |
|---|---|---|
| Client display/reactive principle (ZKHP pattern) | Concept needs to hand state to Vue | `.principle.client.ts` |
| Huirth broadcast/processing principle | Concept needs to react on server and route to clients | `.principle.huirth.ts` |

### 2.4 — Declare Vue Integration Level

| Level | Pattern | When |
|---|---|---|
| Controller (ZKHP) | createConceptController() pattern from notificationController.ts | Concept has ephemeral display state that Vue must own after handoff |
| Direct reactive ref | Simpler: principle directly updates a Vue ref | Concept state is long-lived and Vue should mirror it continuously |
| No Vue | No vue/ directory | Concept is server-only or has no display concern |

### 2.5 — Write the Scope Spec (Concluder Precondition)

Document the answers above as a written spec BEFORE creating any file:

```
Concept: <conceptName>
Qualities:
  - <qualityOneName>: All · diameter:false
  - <qualityTwoName>: Huirth · diameter:true  (Diameter Junction)
Principles:
  - <conceptName>Display.principle.client.ts  (ZKHP handoff)
  - <conceptName>Broadcast.principle.huirth.ts  (server broadcast)
Vue: Controller pattern (ZKHP)
FilterKeys: [<list state properties that must NOT sync to server>]
```

**Concluder for Phase 2**:
```bash
# Spec document exists before any code is written
echo "Scope spec written — proceed to Phase 3"
# (This is a human/agent confirmation gate, not a filesystem check)
```

---

## Phase 3 · Seven-File Skeleton (7FG · Seven-File Grammar)

Create the directory and scaffold all files in dependency order. The Notification Concept is the Copy-Paste-Plus source (M63): copy structure verbatim, substitute `notification` → `<conceptName>` as the domain identifier.

**Create directories first**:
```bash
mkdir -p Cascades/scps/template/SCP/src/concepts/<conceptName>/qualities
mkdir -p Cascades/scps/template/SCP/src/concepts/<conceptName>/principles
mkdir -p Cascades/scps/template/SCP/src/concepts/<conceptName>/model
mkdir -p Cascades/scps/template/SCP/src/concepts/<conceptName>/vue
```

---

### Phase 3a · `<conceptName>.type.ts`

**Copy-Paste-Plus source**: `notification.type.ts`

**Contains**:
- `<ConceptName>Name` constant (`export const <conceptName>Name = '<conceptName>'`)
- `<ConceptName>State` type (NO optional properties — M60 / KeyedSelector requirement)
- Payload types for each Quality, prefixed with concept name to avoid `Action` base-type collision (PACP pattern)
- `<ConceptName>Qualities` type mapping `Quality<State, Payload>` for each quality
- `<ConceptName>Deck` type
- `<ConceptName>ModelDeck` type: `MuxiumDeck & { <conceptName>: Concept<State, Qualities> }`
- Constants, defaults, color maps if applicable (SCST pattern optional)

**Key invariant**: `<ConceptName>ModelDeck` MUST be declared here and imported by BOTH concept files (UPCT pattern). This is the canonical type anchor — neither deployment file can diverge from it.

**PACP: Payload Property Naming**:
```typescript
// CORRECT — prefix avoids collision with Action base type
export type Add<ConceptName>Payload = {
  <conceptName>Message: string;    // NOT: message (Action has its own fields)
  <conceptName>Priority?: string;  // prefix guards collision silently
};
```

---

### Phase 3b · `<conceptName>.state.ts`

**Copy-Paste-Plus source**: `notification.state.ts`

**Contains**:
- `create<ConceptName>State()` factory returning `<ConceptName>State`
- `<CONCEPT_NAME>_FILTER_KEYS: string[]` constant, co-located with the state factory

**FKSD dual-declaration discipline**: This constant will ALSO be referenced by `<conceptName>.muxonomy.ts`. Co-locate it here (state module), not only in muxonomy — two independent enforcement points.

```typescript
export const <CONCEPT_NAME>_FILTER_KEYS: string[] = [
  '<propertyThatShouldNotSyncToServer>',
  '<anotherLocalOnlyProperty>',
];

export const create<ConceptName>State = (): <ConceptName>State => ({
  // all fields required, no optional properties
});
```

---

### Phase 3c · `<conceptName>.muxonomy.ts`

**Copy-Paste-Plus source**: `notification.muxonomy.ts`

**Contains the complete MSDT self-documentation**:

```typescript
import {
  type MuxonomicConfig,
  ChangeDetectionMode,
  DeploymentTarget,
  ExchangeDirection,
} from '../muxonomy/muxonomy.model';
import { <CONCEPT_NAME>_FILTER_KEYS } from './<conceptName>.state';

export const <conceptName>Muxonomic: MuxonomicConfig<'<conceptName>'> = {
  conceptName: '<conceptName>',

  filterKeys: [...<CONCEPT_NAME>_FILTER_KEYS],

  novelChange: { mode: ChangeDetectionMode.KeyedSelector },

  sync: {
    direction: 'toClient',
    filterKeys: [...<CONCEPT_NAME>_FILTER_KEYS],
    novelChange: { mode: ChangeDetectionMode.KeyedSelector },
  },

  demometers: {
    qualities: [
      // All-deployment quality (no diameter):
      {
        name: '<qualityOneName>',
        type: '<ConceptName> <QualityOne Name>',    // Verbose Split
        filePath: 'qualities/<qualityOne>.quality.ts',
        location: DeploymentTarget.All,
        diameter: false,
      },
      // Huirth Diameter Junction quality:
      {
        name: '<qualityTwoName>',
        type: '<ConceptName> <QualityTwo Name>',    // same Verbose Split as Real quality
        filePath: 'qualities/<qualityTwo>.quality.huirth.diameter.ts',
        location: DeploymentTarget.Huirth,
        diameter: true,
      },
    ],
    strategies: [],
    principles: [
      {
        name: '<conceptName>DisplayPrinciple',
        filePath: 'principles/<conceptName>Display.principle.client.ts',
        location: DeploymentTarget.Client,
      },
      {
        name: '<conceptName>BroadcastPrinciple',
        filePath: 'principles/<conceptName>Broadcast.principle.huirth.ts',
        location: DeploymentTarget.Huirth,
      },
    ],
  },

  decks: {
    huirth: '<ConceptName>HuirthDeck',
    client: '<ConceptName>ClientDeck',
  },

  // AESR: Explicit Diameter junction registration
  // FNDR (file name) governs build-time; AESR governs runtime routing intent.
  // Both MUST be consistent — update atomically on any type string rename.
  actionExchange: {
    serverToClient: [
      {
        qualityName: '<qualityTwoName>',
        actionType: '<ConceptName> <QualityTwo Name>',   // MUST match Real quality type string
        direction: ExchangeDirection.ServerToClient,
      },
    ],
    clientToServer: [],
  },
};
```

---

### Phase 3d · `<conceptName>.concept.ts` (Client Deployment)

**Copy-Paste-Plus source**: `notification.concept.ts`

**Key steps**:
1. Import Real All-deployment qualities + `createDiametricQuality` + `WithDiametricState`
2. Create the Induction for each Huirth Diameter Junction quality

```typescript
// CRITICAL (CISV invariant): variable MUST carry 'Induction' suffix
const <qualityTwoName>Induction = createDiametricQuality<
  WithDiametricState<<ConceptName>State>,
  <ConceptName>ModelDeck
>('<ConceptName> <QualityTwo Name>');
//   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
//   Verbose Split type string — MUST match Real quality and AESR entry exactly
```

3. Export `<conceptName>Qualities` with Induction mapped under the SAME property key as Huirth Real:
```typescript
export const <conceptName>Qualities = {
  <conceptName>QualityOne: <qualityOne>,           // Real (All)
  <conceptName>QualityTwo: <qualityTwoName>Induction, // Induction (routes to Huirth)
};
```

4. Export `createMuxonomic<ConceptName>()` returning `MuxonomicConcept<'<conceptName>'>`:
```typescript
export function createMuxonomic<ConceptName>(): MuxonomicConcept<'<conceptName>'> {
  return {
    concept: create<ConceptName>Concept() as AnyConcept,
    muxonomy: <conceptName>Muxonomic,
  };
}
```

---

### Phase 3e · `<conceptName>.concept.huirth.ts` (Huirth Deployment)

**Copy-Paste-Plus source**: `notification.concept.huirth.ts`

**Key differences from client file**:
- Import Real quality from `<qualityTwo>.quality.huirth.diameter.ts` (NOT createDiametricQuality)
- Include Huirth principle in `createConcept` call
- Export `createMuxonomic<ConceptName>Huirth()` (distinct from client creator)
- DO NOT create an unused Induction variable on the Huirth side — Client owns Induction, Huirth owns Real

```typescript
export const <conceptName>HuirthQualities = {
  <conceptName>QualityOne: <qualityOne>,    // same Real as Client
  <conceptName>QualityTwo: <qualityTwoReal>, // Real from .huirth.diameter.ts
};

export function createMuxonomic<ConceptName>Huirth(): MuxonomicConcept<'<conceptName>'> {
  return {
    concept: create<ConceptName>HuirthConcept() as AnyConcept,
    muxonomy: <conceptName>Muxonomic,
  };
}
```

---

### Phase 3f · `qualities/<qualityOne>.quality.ts` and `qualities/<qualityTwo>.quality.huirth.diameter.ts`

**All-deployment quality (3f-1)**:
```typescript
// Copy-Paste-Plus: addNotification.quality.ts
export const <conceptName><QualityOne> = createQualityCardWithPayload<
  <ConceptName>State,
  <Add<ConceptName>Payload>,
  <ConceptName>ModelDeck
>({
  type: '<ConceptName> <QualityOne Verbose Split>',
  reducer: (state, action) => {
    // return ONLY changed properties (Reducer Shortest Path — S12)
    return { <changedField>: [...state.<changedField>, action.payload.<field>] };
  },
});
```

**Huirth Diameter Junction Real quality (3f-2)**:
```typescript
// Copy-Paste-Plus: helloWorld.quality.huirth.diameter.ts
// This file is the Real implementation — FNES suffix .huirth.diameter.ts signals:
//   location: Huirth, diameter: true
export const <conceptName><QualityTwo> = createQualityCardWithPayload<
  <ConceptName>State,
  <QualityTwoPayload>,
  <ConceptName>ModelDeck
>({
  type: '<ConceptName> <QualityTwo Verbose Split>',
  // ^^^^ MUST match Induction createDiametricQualityWithPayload type string
  // ^^^^ MUST match muxonomy.ts demometers.qualities[n].type
  // ^^^^ MUST match actionExchange.serverToClient[n].actionType
  // All three are the SAME string — the Diameter anchor
  reducer: (state, action) => { ... return { <changedFields> }; },
  methodCreator: () => createMethodWithConcepts(({ action, concepts_, deck }) => {
    // Use notifyClient (not controller.fire!) for any notification within strategy
    controller.fire(strategySuccess(action.strategy));
  }),
});
```

---

### Phase 3g · Principles scaffold

Create empty placeholder files with the correct export signature. Phase 4 fills the bodies.

```typescript
// principles/<conceptName>Display.principle.client.ts
export const <conceptName>DisplayPrinciple: <ConceptName>DisplayPrinciple = ({ d_, k_, plan }) => {
  // Phase 4 implementation
};
```

```typescript
// principles/<conceptName>Broadcast.principle.huirth.ts
export const <conceptName>BroadcastPrinciple: <ConceptName>BroadcastPrinciple = ({ d_, k_, plan }) => {
  // Phase 4 implementation
};
```

**Concluder for Phase 3**:
```bash
# 7-file skeleton present
find Cascades/scps/template/SCP/src/concepts/<conceptName>/ -type f | sort
# Expected minimum: type.ts · state.ts · muxonomy.ts · concept.ts · concept.huirth.ts
#   + qualities/<qualityOne>.quality.ts · qualities/<qualityTwo>.quality.huirth.diameter.ts
#   + principles/<name>Display.principle.client.ts · principles/<name>Broadcast.principle.huirth.ts

# FNES naming check: Diameter quality has correct suffix
find Cascades/scps/template/SCP/src/concepts/<conceptName>/ -name "*.diameter.ts" | wc -l
# Expected: 1 (exactly one Diameter Junction quality file)

# CISV check: Induction variable has Induction suffix in concept.ts
grep -c "Induction" Cascades/scps/template/SCP/src/concepts/<conceptName>/<conceptName>.concept.ts
# Expected: >= 1
```

**Direction + State note (→ SCP-S14 §D/§E)**: This Skill's Notification exemplar teaches the ServerToClient direction with a SHARED state type. For a ClientToServer quality (Client initiates, Huirth executes), the Induction lives on the CLIENT file (`.quality.client.diameter.ts`) — see scsBridge `sendBridgeMessage.quality.client.diameter.ts`. For a Concept where Huirth needs server-only state, split into `<Concept>ClientState` + `<Concept>HuirthState` — see scsBridge dual-state. SCP-S14 §D/§E is the authority on both.

---

## Phase 4 · Principle Authoring

### 4.1 — Display Principle Pattern (Client — ZKHP)

**Copy-Paste-Plus source**: `notificationDisplay.principle.client.ts`

The Display Principle is the ZKHP mechanism. It observes state via KeyedSelector, calls `controller.take()`, and dispatches clear. This sequence MUST be preserved exactly:

```typescript
export const <conceptName>DisplayPrinciple: <ConceptName>DisplayPrinciple =
  ({ d_, k_, plan }) => {
    const displayPlan = plan('<ConceptName> Display (Client)', ({ stage }) => [
      stage(
        ({ d, dispatch }) => {
          const items = k_.<stateArrayProperty>.select();
          if (!items || items.length === 0) return;

          const controller = getGlobal<ConceptName>Controller();
          if (!controller) return;

          // ZKHP: hand off to Vue, then empty Stratimux
          controller.take(items);
          items.forEach((item) => {
            dispatch(d.<conceptName>.e.<conceptName>ClearItem({ id: item.id }), {});
          });
        },
        {
          selectors: [k_.<stateArrayProperty>],
          beat: 3,   // REQUIRED with throttle:0 — see S3 §beat safety
        },
      ),
    ]);
    return displayPlan;
  };
```

**beat: 3 is required** when dispatch uses `throttle: 0` (the default). Without it, the stage re-fires before dispatch completes, causing double-clear. This is documented in Stratimuxian Scholar S3 §Throttle vs SetStage.

**k_ vs d_**: Use `k_` for stage selectors at principle level (closure-based, no deck traversal). Use `d` inside the stage callback for dispatch target (`d.<conceptName>.e.qualityName()`). They are different things.

### 4.2 — Broadcast Principle Pattern (Huirth)

**Copy-Paste-Plus source**: `notificationBroadcast.principle.huirth.ts`

The Broadcast Principle monitors Huirth state and routes to connected clients:

```typescript
export const <conceptName>BroadcastPrinciple: <ConceptName>BroadcastPrinciple =
  ({ d_, k_, plan }) => {
    const broadcastPlan = plan('<ConceptName> Broadcast (Huirth)', ({ stage }) => [
      stage(
        ({ d, dispatch }) => {
          const items = k_.<stateArrayProperty>.select();
          if (!items || items.length === 0) return;

          const wsState = d.webSocketServer.k.getState();
          if (!wsState?.clients) return;

          // Broadcast to all connected clients
          wsState.clients.forEach((client) => {
            if (client.ws.readyState === 1 /* OPEN */) {
              const broadcastAction = d.<conceptName>.e.<conceptName>AddItem({ ... });
              client.ws.send(JSON.stringify(broadcastAction));
            }
          });

          // Clear Huirth state after broadcast
          items.forEach((item) => {
            dispatch(d.<conceptName>.e.<conceptName>ClearItem({ id: item.id }), {});
          });
        },
        {
          selectors: [k_.<stateArrayProperty>],
          beat: 3,
        },
      ),
    ]);
    return broadcastPlan;
  };
```

**H4 NOTE (Viridian Hazard · Raw ws.send Bypass)**: Direct `client.ws.send(JSON.stringify(addAction))` is a Tier-0 broadcast path that bypasses serialization and versioning. Use `d.webSocketServer.e.webSocketServerAppendToActionQue({ actionQue, targetClientStateKey? })` as the standard broadcast path. It IS available and IS the canonical path (real anchor: `scsBridge` `sendBridgeMessage.quality.huirth.diameter.ts:246-253`, `scsBridgeStateMirror.principle.huirth.ts`). The raw `client.ws.send` variant is legacy and MUST NOT be used in new code.

### Phase 4 Concluder:
```bash
# Principles have non-empty implementations
grep -c "plan(" Cascades/scps/template/SCP/src/concepts/<conceptName>/principles/<conceptName>Display.principle.client.ts
# Expected: >= 1

grep -c "plan(" Cascades/scps/template/SCP/src/concepts/<conceptName>/principles/<conceptName>Broadcast.principle.huirth.ts
# Expected: >= 1
```

---

## Phase 5 · Bridge Model (Required for Diameter Junction Qualities in Strategy Context)

If the new Concept needs to send notifications or trigger callbacks from within an ActionStrategy, a Bridge Model is REQUIRED. This is the Viridian H2 hazard non-negotiable: bridge model helpers are required for any Concept with a Diameter junction quality that executes inside an ActionStrategy scope. The optionality only applies to standalone Concepts that never invoke Diameter Junction qualities from within ActionStrategies (an edge case footnoted for completeness).

**Copy-Paste-Plus source**: `notificationBridge.model.ts`

### 5.1 — Create `model/<conceptName>Bridge.model.ts`

```typescript
import { muxiumTimeOut, type Concepts } from 'stratimux';

// Narrow deck interfaces — only what callers need
export type <ConceptName>ClientDeck = { ... };
export type <ConceptName>HuirthDeck = { ... };

// Local (Client-side) helper
export function notify<ConceptName>Local(
  concepts_: Concepts,
  deck: <ConceptName>ClientDeck,
  payload: <BridgePayload>,
  timeout: number = 30,
): void {
  muxiumTimeOut(
    concepts_,
    () => deck.<conceptName>.e.<conceptName>AddItem({ ...payload }),
    timeout,
  );
}

// Huirth-side routed helper (routes to specific client via clientStateKey)
export function notify<ConceptName>Client(
  concepts_: Concepts,
  deck: <ConceptName>HuirthDeck,
  payload: <BridgePayload>,
  clientStateKey: string,
  timeout: number = 30,
): void {
  muxiumTimeOut(
    concepts_,
    () =>
      deck.webSocketServer.e.webSocketServerAppendToActionQue({
        action: deck.<conceptName>.e.<conceptName>AddItem({ ...payload }),
        clientStateKey,
      }),
    timeout,
  );
}
```

### WARNING (H2 · Viridian · CRITICAL)

```
CRITICAL: NEVER call controller.fire(anyAction) before controller.fire(strategySuccess(...))
in an ActionStrategy method body.

controller.fire() CLOSES the ActionController.
Any subsequent controller.fire(strategySuccess(...)) FAILS SILENTLY.
The strategy graph is halted. The user sees a partial result with no error message.

WRONG (causes silent strategy termination):
  controller.fire(deck.webSocketServer.e.webSocketServerAppendToActionQue({...}));
  controller.fire(strategySuccess(action.strategy));   // FAILS — controller already closed

CORRECT (uses muxiumTimeOut, controller remains open):
  notify<ConceptName>Client(concepts_, huirthDeck, payload, clientStateKey);
  controller.fire(strategySuccess(action.strategy));   // succeeds — controller still open
```

The muxiumTimeOut schedules the dispatch OUTSIDE the current ActionController scope. The notification fires 30ms later. The controller remains open for strategySuccess.

**Concluder for Phase 5**:
```bash
# Bridge model uses muxiumTimeOut, not controller.fire
grep -c "muxiumTimeOut" Cascades/scps/template/SCP/src/concepts/<conceptName>/model/<conceptName>Bridge.model.ts
# Expected: >= 1

# No controller.fire in bridge model (would indicate broken pattern)
grep -c "controller\.fire" Cascades/scps/template/SCP/src/concepts/<conceptName>/model/<conceptName>Bridge.model.ts
# Expected: 0
```

---

## Phase 6 · Vue Integration (Island per Concept)

Each Vue landing creates its own `ClientMuxiumInstance` scoped to the component lifecycle (VCIP pattern). There is NO global singleton Muxium shared across pages.

### 6.1 — Controller (ZKHP — when Concept has ephemeral display state)

**Copy-Paste-Plus source**: `notificationController.ts`

```typescript
// <conceptName>Controller.ts
export type <ConceptName>Controller = {
  active<Items>: Ref<<ItemType>[]>;
  take: (items: <ItemType>[]) => void;
  clear: (id: string) => void;
  clearAll: () => void;
};

export const <CONCEPT_NAME>_CONTROLLER_KEY: InjectionKey<<ConceptName>Controller> =
  Symbol('<conceptName>Controller');

export function create<ConceptName>Controller(): <ConceptName>Controller {
  const active<Items> = ref<<ItemType>[]>([]);
  return {
    active<Items>,
    take: (items) => { active<Items>.value = [...active<Items>.value, ...items]; },
    clear: (id) => { active<Items>.value = active<Items>.value.filter(i => i.id !== id); },
    clearAll: () => { active<Items>.value = []; },
  };
}

// Global membrane (GCRM) — bridge between Stratimux principle space and Vue provide/inject
let globalController: <ConceptName>Controller | null = null;
export function setGlobal<ConceptName>Controller(c: <ConceptName>Controller) { globalController = c; }
export function getGlobal<ConceptName>Controller() { return globalController; }
```

**SSR Guard (H5 mitigation)**: The global controller must not be set during SSR. The IslandWrapper that calls `setGlobal<ConceptName>Controller` runs in `onMounted` — this gate is already SSR-safe because `onMounted` does not fire server-side.

### 6.2 — Vue Landing Component

**Copy-Paste-Plus source**: `NotificationLanding.vue`

```vue
<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { createClientMuxiumInstance } from '../muxonomy/muxonomy.model';
import { createMuxonomic<ConceptName> } from './<conceptName>.concept';

let muxium: ClientMuxiumInstance | null = null;

onMounted(() => {
  muxium = createClientMuxiumInstance([], {
    // BASE_CONCEPTS are pre-included; add NEW concepts here
    additionalConcepts: [createMuxonomic<ConceptName>()],
  });
  // VCIP: Muxium lifecycle bound to component lifecycle
});

onUnmounted(() => {
  muxium?.close();
  muxium = null;
});
</script>
```

**Pewter Tessera integration**: When the Vue surface participates in the SCS HiFi design system, use `--color-{priority}` CSS tokens from the Pewter Tessera design system (D1 Skill) for suite-color coded status indicators. DO NOT hardcode hex values. The `PRIORITY_COLORS` constant in `notification.type.ts` is a runtime reference for programmatic use — the CSS source of truth is Pewter Tessera's token system.

```css
/* CORRECT: Pewter token */
.concept-status-active  { color: var(--color-viridian); }
.concept-status-error   { color: var(--color-maroon); }
.concept-status-system  { color: var(--color-cobalt); }

/* WRONG: hardcoded hex from PRIORITY_COLORS */
.concept-status-active  { color: #4a7c5c; }
```

### Phase 6 Concluder:
```bash
# Vue landing component exists
test -f "Cascades/scps/template/SCP/src/concepts/<conceptName>/vue/<ConceptName>Landing.vue" && echo "landing ok"

# Controller uses Induction key pattern
grep -c "InjectionKey" Cascades/scps/template/SCP/src/concepts/<conceptName>/<conceptName>Controller.ts
# Expected: >= 1
```

---

## Phase 7 · MuxonomyRegistry Registration

The `muxonomyRegistry.generated.ts` file is the runtime registry that wires all Muxonomy-aware Concepts into the SCP application at startup. The new Concept MUST be registered here.

### 7.1 — Open and Edit the Registry

```
Cascades/scps/template/SCP/src/concepts/muxonomyRegistry.generated.ts
```

### 7.2 — Add Client Registration

```typescript
// Add import
import {
  createMuxonomic<ConceptName>,
} from './<conceptName>/<conceptName>.concept';

// Add to CLIENT registry array
clientConceptRegistry.push(createMuxonomic<ConceptName>());
```

### 7.3 — Add Huirth Registration

```typescript
// Add import
import {
  createMuxonomic<ConceptName>Huirth,
} from './<conceptName>/<conceptName>.concept.huirth';

// Add to HUIRTH registry array
huirthConceptRegistry.push(createMuxonomic<ConceptName>Huirth());
```

### 7.4 — Verify MCUC Pattern

Both `createMuxonomic<ConceptName>()` and `createMuxonomic<ConceptName>Huirth()` return `MuxonomicConcept<'<conceptName>'>` — the union of `concept` AND `muxonomy`. The registry receives the full pair. If the Concept is registered without the muxonomy pairing (raw `createConcept()` call), filterKeys, sync, and navigation will NOT be wired automatically.

**Concluder for Phase 7**:
```bash
# Registry contains concept name (both client and huirth entries)
grep -c "<conceptName>" Cascades/scps/template/SCP/src/concepts/muxonomyRegistry.generated.ts
# Expected: >= 2

# Both import lines present
grep -c "createMuxonomic<ConceptName>" Cascades/scps/template/SCP/src/concepts/muxonomyRegistry.generated.ts
# Expected: >= 2 (client + huirth creators)
```

---

## Phase 8 · Verification Gate (Concluder Battery)

Run the full battery in order. ALL gates must pass before declaring the Concept authored.

### 8.1 — TypeScript Gate (CRITICAL)

```bash
cd Cascades/scps/template/SCP
npm run typecheck
```

**Expected**: exit 0. Any type error → diagnose using the error message before proceeding. Do NOT mark Phase 8 complete with type errors outstanding.

**Common type errors and their sources**:
- `WithDiametricState<S>` missing from Induction call → Phase 3d
- Type string mismatch (Induction vs Real vs muxonomy.ts vs actionExchange) → CISV or AESR check
- Payload property collision with Action base type → PACP check (Phase 3a)
- Missing Induction suffix in variable name → CISV (will compile but loop at runtime)

### 8.2 — File Structure Concluder

```bash
find Cascades/scps/template/SCP/src/concepts/<conceptName>/ -type f | sort
```

Expected outputs (minimum):
```
.../  <conceptName>.concept.huirth.ts
      <conceptName>.concept.ts
      <conceptName>.muxonomy.ts
      <conceptName>.state.ts
      <conceptName>.type.ts
      <conceptName>Controller.ts
      model/<conceptName>Bridge.model.ts
      principles/<conceptName>Broadcast.principle.huirth.ts
      principles/<conceptName>Display.principle.client.ts
      qualities/<qualityOne>.quality.ts
      qualities/<qualityTwo>.quality.huirth.diameter.ts
      vue/<ConceptName>Landing.vue
```

### 8.3 — Registry Concluder

```bash
grep -c "<conceptName>" Cascades/scps/template/SCP/src/concepts/muxonomyRegistry.generated.ts
```

Expected: >= 2

### 8.4 — CISV Safety Check

```bash
# Verify Induction variable has suffix in concept.ts
grep "createDiametricQuality" Cascades/scps/template/SCP/src/concepts/<conceptName>/<conceptName>.concept.ts
# Expected output must show "= createDiametricQuality" AND the variable name before it must end in "Induction"
# Example of CORRECT: const <qualityTwo>Induction = createDiametricQuality<...>()
# Example of WRONG:   const <qualityTwo> = createDiametricQuality<...>()  ← infinite loop
```

### 8.5 — AESR Consistency Check

```bash
# Get the type string from the Real quality file
grep "type:" Cascades/scps/template/SCP/src/concepts/<conceptName>/qualities/<qualityTwo>.quality.huirth.diameter.ts

# Get the type string from the muxonomy file (demometers + actionExchange entries)
grep "type:\|actionType:" Cascades/scps/template/SCP/src/concepts/<conceptName>/<conceptName>.muxonomy.ts
```

All three occurrences MUST be identical strings. Any drift breaks routing silently at runtime (H3 from Viridian).

### 8.6 — Bridge Runtime Test (When Bridge Is Running)

```
1. Start the SCP in browser: navigate to the new Concept's landing page
2. Dispatch the Diameter Junction quality from the Vue component
3. Observe Huirth console: Real quality execution log appears
4. Observe Client Vue component: reactive state update reflects result
5. Confirms: actionQue routing · WebSocket delivery · Induction→Real path
```

This is the Muxistration Proof (C4): both Demonstration (logs show execution) AND Diastration (the architecture reflects the intent) must hold.

---

## Anti-Patterns Table

All five HAZARDS from Viridian Sculptor (H1-H5) are represented here with severity tags.

| # | Anti-Pattern | Severity | Detection | Fix |
|---|---|---|---|---|
| AP1 | **Induction variable missing `Induction` suffix** (CISV violation · Viridian H1). `const myQuality = createDiametricQuality(...)` — `toReal` transform fails; action bounces client→server→client in infinite loop. Silent at compile time. | CRITICAL | `grep "createDiametricQuality" <concept>.concept.ts` — check variable name | Rename: `const myQualityInduction = createDiametricQuality(...)` |
| AP2 | **Type string mismatch between Real and Induction** (AESR drift). Real quality has `type: 'My Quality A'`; Induction call has `'My Quality B'`; or muxonomy.ts actionExchange has a third string. | CRITICAL | `grep "type:\|actionType:" muxonomy.ts` vs quality file — compare all three | Align to single Verbose Split string across all three locations; update atomically |
| AP3 | **controller.fire() before strategySuccess** (TOBM violation · Viridian H2). Closes ActionController prematurely; strategy continuation never fires; silent failure. | CRITICAL | `grep "controller\.fire" qualities/*.quality.ts` — inspect call order | Replace with `notify<ConceptName>Client(concepts_, deck, payload, clientStateKey)` — uses muxiumTimeOut |
| AP4 | **FilterKeys missing from muxonomy.ts** (FKSD gap). Non-serializable or client-local state property syncs to server; Zero Knowledge principle is violated at state-sync layer. | HIGH | `grep "filterKeys" <concept>.muxonomy.ts` vs `grep "FILTER_KEYS" <concept>.state.ts` | Add missing property to both FILTER_KEYS constant and muxonomy.ts filterKeys array |
| AP5 | **FNDR and actionExchange drift** (Viridian H3). File renamed from `.huirth.diameter.ts` to `.huirth.ts` without updating muxonomy.ts `diameter: true` entry or actionExchange. Build succeeds; WebSocket routing fails at runtime. | HIGH | `grep "diameter" <concept>.muxonomy.ts` — verify all `diameter: true` entries have matching actionExchange entries | Update muxonomy.ts demometer entry AND actionExchange entry atomically |
| AP6 | **VCIP violation: global Muxium singleton across pages**. Module-level `let muxium = createClientMuxiumInstance(...)` shared across Vue components → cross-page state leakage → notifications from old page appear on new page. | HIGH | Check for module-level Muxium creation outside `onMounted` | Move Muxium creation to `onMounted`, destruction to `onUnmounted` |
| AP7 | **Optional state properties** (M60 violation). `NotificationState.items?: Item[]` — KeyedSelector cannot track optional properties. State change goes undetected; principle does not fire. | MEDIUM | TypeScript flag: any `?:` in State type | Remove `?`, initialize to empty array/default value in state factory |
| AP8 | **module-level counter for ID generation in SSR** (Viridian H5). `let counter = 0; counter++` at module scope accumulates across SSR render threads → ID collisions between concurrent requests. | MEDIUM | `grep "counter++" model/<concept>.model.ts` | Replace with `crypto.randomUUID()` or `Date.now() + Math.random()` |
| AP9 | **Raw `ws.send()` in broadcast principle** (Viridian H4). Direct WebSocket send bypasses serialization and versioning. | LOW | `grep "ws\.send" principles/` | Use `d.webSocketServer.e.webSocketServerAppendToActionQue` — the canonical broadcast path (see H4 NOTE in Phase 4.2). Raw `client.ws.send` MUST NOT be used in new code |
| AP10 | **`typeof` pattern in Qualities type mapping** (framework anti-pattern). `type ConceptQualities = typeof conceptQualities` fails in v0.3.2+. | CRITICAL | TypeScript compile error | Use explicit Quality<State, Payload> type mapping per S10 Quality Creation |

---

## M63 Copy-Paste-Plus Path

The Notification Concept is the authoritative M63 source for any new Concept on the Template SCP runtime.

### What to Substitute

```
Domain substitution (safe to replace):
  notification       → <conceptName>
  Notification       → <ConceptName>
  NOTIFICATION       → <CONCEPT_NAME>
  notificationName   → <conceptName>Name
  NotificationState  → <ConceptName>State
  NotificationQualities → <ConceptName>Qualities
  notificationMuxonomic → <conceptName>Muxonomic
  'Notification Hello World' → '<ConceptName> <QualityTwo Verbose Split>'
  NotificationPriority → (remove or replace with concept-specific vocabulary)
  PRIORITY_COLORS    → (remove or replace)
```

### What NOT to Substitute

```
Structural invariants (preserve exactly):
  createDiametricQuality<WithDiametricState<...>, ...>  — factory call pattern
  'Induction' suffix on Induction variable              — CISV invariant
  muxonomicConcept = { concept, muxonomy }              — MCUC union pattern
  filterKeys in BOTH state.ts AND muxonomy.ts           — FKSD dual declaration
  beat: 3 in stage options                              — throttle safety
  controller.take() + dispatch clear loop               — ZKHP sequence
  muxiumTimeOut in bridge model helpers                 — TOBM pattern
  DeploymentTarget.Huirth / .All / .Client enums        — DTEC vocabulary
  ExchangeDirection.ServerToClient                      — AESR vocabulary
```

### File Mapping

```
notification.type.ts                → <conceptName>.type.ts
notification.state.ts               → <conceptName>.state.ts
notification.muxonomy.ts            → <conceptName>.muxonomy.ts
notification.concept.ts             → <conceptName>.concept.ts
notification.concept.huirth.ts      → <conceptName>.concept.huirth.ts
notificationController.ts           → <conceptName>Controller.ts
model/notification.model.ts         → model/<conceptName>.model.ts
model/notificationBridge.model.ts   → model/<conceptName>Bridge.model.ts
qualities/addNotification.quality.ts → qualities/add<ConceptName>.quality.ts
qualities/clearNotification.quality.ts → qualities/clear<ConceptName>.quality.ts
qualities/helloWorld.quality.huirth.diameter.ts → qualities/<verb><ConceptName>.quality.huirth.diameter.ts
principles/notificationDisplay.principle.client.ts → principles/<conceptName>Display.principle.client.ts
principles/notificationBroadcast.principle.huirth.ts → principles/<conceptName>Broadcast.principle.huirth.ts
vue/NotificationLanding.vue         → vue/<ConceptName>Landing.vue
vue/NotificationPopup.vue           → vue/<ConceptName>Popup.vue  (if display popup pattern needed)
```

---

## Cross-References

| Reference | What It Covers | When to Consult |
|---|---|---|
| **Stratimuxian Scholar S15** (Muxonomy Concept Authoring Patterns) | Framework-level Why/What: MuxonomicConfig structure, Diameter Junction anatomy, FNES grammar theory, ZKHP formal definition, muxiumTimeOut contract | Before Phase 1 — understand the patterns before executing this Skill |
| **Stratimuxian Scholar S16** (Notification Muxameter Exemplar) | Deep citation-grounded trace through all 15 Notification files; Diameter junction walk-through step by step; provenance chain | Phase 1 study — read alongside the source files |
| **SCP-S12 Communication** | Bridge discovery via bridge.json; MCPL envelope format | When the new Concept needs to query Bridge state or send fire-and-forget messages |
| **Pewter Tessera D1 Skill** | HiFi design token system; suite-color CSS variables; pane gradient classes | Phase 6 Vue Integration — styling new Concept's Vue surface |
| **Stratimuxian Scholar S10** (Quality Creation) | createQualityCard / createQualityCardWithPayload patterns; Verbose Split Naming; `typeof` anti-pattern | Phase 3f when writing qualities |
| **Stratimuxian Scholar S12** (Reducer Performance) | Shortest-path reducer returns; why `{ ...state, prop: val }` is wrong | Phase 3f reducers |
| **Stratimuxian Scholar S5** (Strategy Data and Temporal) | muxiumTimeOut formal definition; Strategy Temporal Expansion Pattern | Phase 5 bridge model |
| **Stratimuxian Scholar S3** (Planning Stage Control) | beat/throttle discipline; stage selector options | Phase 4 principle authoring |

---

## Lambda Trigger

Concrete commands the agent runs to declare the authored Concept Lambda-complete:

```bash
#!/usr/bin/env bash
# Run from: Cascades/scps/template/SCP/
# Substitute <conceptName> with your actual concept name

CONCEPT=<conceptName>

echo "=== PHASE 8 VERIFICATION BATTERY ==="

echo ""
echo "--- 8.1 TypeScript Gate ---"
npm run typecheck
echo "Exit: $?"
# Must be 0

echo ""
echo "--- 8.2 File Structure ---"
find "src/concepts/${CONCEPT}/" -type f | sort
# Must list >= 9 files (type/state/muxonomy/concept/concept.huirth + qualities + principles + controller)

echo ""
echo "--- 8.3 Registry ---"
grep -c "${CONCEPT}" src/concepts/muxonomyRegistry.generated.ts
# Must be >= 2

echo ""
echo "--- 8.4 CISV Safety ---"
grep "createDiametricQuality" "src/concepts/${CONCEPT}/${CONCEPT}.concept.ts"
# Variable name MUST end in 'Induction' in output

echo ""
echo "--- 8.5 AESR Consistency ---"
echo "Real quality type string:"
grep "type:" "src/concepts/${CONCEPT}/qualities/"*".diameter.ts"
echo "Muxonomy type entries:"
grep "type:\|actionType:" "src/concepts/${CONCEPT}/${CONCEPT}.muxonomy.ts"
# All strings MUST match

echo ""
echo "--- 8.6 Diameter quality file FNES check ---"
find "src/concepts/${CONCEPT}/" -name "*.diameter.ts" | wc -l
# Expected: >= 1

echo ""
echo "--- Bridge model safety ---"
grep -c "muxiumTimeOut" "src/concepts/${CONCEPT}/model/${CONCEPT}Bridge.model.ts" 2>/dev/null || echo "no bridge model"
grep -c "controller\.fire" "src/concepts/${CONCEPT}/model/${CONCEPT}Bridge.model.ts" 2>/dev/null || echo "no controller.fire (correct)"

echo ""
echo "=== ALL GATES COMPLETE ==="
```

---

## Citation

**Notification Concept source files** (authoritative Hello World template — M63):
- `Cascades/scps/template/SCP/src/concepts/notification/` (all 15 files)
- `notification.concept.ts` lines 85-94 (CISV critical warning + Induction creation)
- `notification.concept.huirth.ts` lines 14-44 (TOBM footgun warning)
- `notification.muxonomy.ts` lines 62-143 (complete MSDT self-documentation)
- `model/notificationBridge.model.ts` (TOBM implementation)
- `principles/notificationDisplay.principle.client.ts` (ZKHP implementation)

**Pattern names sourced from Suite 2 Rust Prospector** (authoritative naming authority):
- FNES (Filename-Encoded Deployment-and-Diameter Suffix Grammar)
- CISV (Critical Induction Suffix Variable Requirement for toReal Transformation Integrity)
- DQWDS (Diametric Quality With DiametricState Type Intersection Utility Pattern)
- DCQF (Dual-Concept-File Single-ConceptName Deployment-Split Pattern)
- MSDT (Muxonomy Self-Documentation through Declarative Demometer Type Table)
- AESR (Action Exchange Semantic Registration)
- ZKHP (Zero Knowledge Handoff Pattern)
- GCRM (Global Controller Registration Membrane)
- TOBM (muxiumTimeOut Bridge Model Helper Group)
- DTEC (Deployment-Target Enum Classification System)
- UPCT (Unified Pre-Canonicalized Concept Type File)
- RWCP (Runtime Window Context Probe)
- SCST (Suite Color Semantic Taxonomy)
- MCUC (MuxonomicConcept Union-Pairing Creator)
- VCIP (Vue Concept Island Per-Concept Rendering Architecture)
- PACP (Payload Property Prefix Anti-Collision Pattern)
- FKSD (Filter Keys State Duality)

**Hazards sourced from Suite 4 Viridian Sculptor**: H1 (CISV) · H2 (TOBM controller.fire) · H3 (FNDR+AESR drift) · H4 (raw ws.send) · H5 (module-level counter SSR)

**Prior work honored**: SUITE-1-MAROON-NOTIFICATION-MANIFOLD-REFERENCE-DESIGN.md · SUITE-3-OCHRE-NOTIFICATION-MANIFOLD-REFERENCE-DESIGN.md (Phase 1 Ochre draft) · SCP-S12 Communication.md (Skills/ subdirectory format precedent) · Conductor.md Pattern E routing

**POC WorkGameBoards (historical provenance)**:
- POC-2-4-NOTIFICATION-BRIDGE-WORKGAMEBOARD.md (Zero Knowledge Handoff origin)
- POC-2-5-DEMOMETRIC-QUALITY-WORKGAMEBOARD.md (Diameter Junction Quality formalization)
- POC-2-6-DEMOMETRIC-INTERCHANGE-WORKGAMEBOARD.md (Demometric Interchange architecture)

---

## Forward Diameter to scsBridgeMirror

This Skill is the authoring substrate for the SCS-Bridge Mirror Concept (SBM Macro 2 Aspirant per Macro Diamond §13). The scsBridgeMirror Concept will be authored on the Template SCP side as the structural counterpart to the Bridge-side scsBridge Concept, forming a complete bidirectional Demometer Pair connected by the MCP+HTTP-callback Diameter. The Notification Concept IS the authoritative reference for the scsBridgeMirror Concept — the structural identity is exact enough to constitute M63 Copy-Paste-Plus. SCP-S13 readers tasked with authoring scsBridgeMirror should apply the eight phases above with the substitutions below.

### SCS-Bridge Substrate: Available Tools for Mirror Concept

The Bridge-side Diameter half is already Lambda-PASS (SAWSR Cycles 148-153). The Mirror Concept's strategies are consumers of this surface, NOT re-implementations:

| Acronym | M-Rule | Description | Status |
|---|---|---|---|
| BMTI | M138/M139 govern | Bridge Mirror Tool Invocation — 3 BMTI Qualities (`scsBridgeActivateScpSession`, `scsBridgeLaunchScpRuntime`, `scsBridgeSpawnNewScpSession`) + 3 MASN MCP tools (`scp_launch_session_management`, `scp_launch_runtime_only`, `scp_launch_new_session`) | Lambda PASS Cycle 150 |
| MASN | SB-S128 skill | MCP-Activate-SCP-Namespace — `scp_launch_*` tool namespace prefix | Lambda PASS Cycle 151 |
| MTAM | M139 | MCP-Tui-Activate-Mirror — Stratimux state field `activeScpFromMcp` + renderFrame canonical sync mirror | Lambda PASS Cycle 152 |
| SCSER | M140 | SCP-Caller-Session-Enacting-Registration — 5-stage HTTP POST callback from SCP to Bridge `/bind-caller-session` on SCP boot | Lambda PASS Cycle 153 |
| DCQI | M141 | Debounced-Caller-Quality-Intake — `createMethodDebounceWithConcepts(handler, 500)` on Bridge intake Quality | Lambda PASS Cycle 153 |
| CSEP | M142 | Caller-Session-Env-Propagation — `SCS_BRIDGE_SCP_NAME` + `SCS_BRIDGE_ULID` + `SCS_MCP_ENDPOINT` env vars injected into SCP spawn descriptor | Lambda PASS Cycle 153 |
| SSBM | M143 | Self-Session-Binding-Method — `registry.updateSessionScpName(ulid, scpName)` atomic via chainWrite mutex | Lambda PASS Cycle 153 |

The scsBridgeMirror Concept dispatches INTO the existing BMTI Quality surface via CLI (`scs` subcommands) or MCP (`scp_launch_*` tools). Phase 5 Bridge Model `mcpToolDispatch.strategy.ts` IS structurally the SCSER strategy generalized: 5-Stage read-bridge-json → build-jsonrpc-payload → post-dispatched → response → conclude.

### Apply M63 Copy-Paste-Plus: notification → scsBridgeMirror

```
notification concept files → scsBridgeMirror concept files
notificationAddNotification → scsBridgeMirrorUpdateStatus (local)
notificationHelloWorld (Diameter Junction) → scsBridgeMirrorActivateScp (Diameter Junction)
                                            scsBridgeMirrorListSessions (Diameter Junction)
                                            scsBridgeMirrorSpawnSession (Diameter Junction)
notificationBroadcastPrinciple (Huirth) → scsBridgeMirrorSync.principle.huirth.ts (SCP polls bridge.json)
notificationDisplay.principle.client.ts → scsBridgeMirrorDisplay.principle.client.ts
notification.muxonomy.ts → scsBridgeMirror.muxonomy.ts
vue/NotificationLanding.vue → vue/ScsBridgeMirrorDashboard.vue
```

### scsBridgeMirror State Shape (Phase 2.5 spec target)

```typescript
type ScsBridgeMirrorState = {
  connectedScps: ConnectedScpEntry[];    // Mirror of Bridge scsBridge.connectedScps
  activeSessions: SessionEntry[];        // Mirror of Bridge sessions.json relevant entries
  bridgeEndpoint: string | undefined;    // Derived from bridge.json at init
  syncStatus: 'idle' | 'syncing' | 'error'; // Principle polling status
  lastSyncAt: number | undefined;        // Epoch ms of last successful sync
};
```

**FilterKeys for scsBridgeMirror**: `['bridgeEndpoint', 'syncStatus', 'lastSyncAt']` — local-only state, never synced to server.

### CISV Applied to scsBridgeMirror Diameter Qualities

```typescript
// CORRECT
const scsBridgeMirrorActivateScpInduction = createDiametricQualityWithPayload<
  WithDiametricState<ScsBridgeMirrorState>,
  { scpName: string },
  ScsBridgeMirrorModelDeck
>('SCS Bridge Mirror Activate Scp');

// WRONG — omitting Induction suffix causes toReal failure at runtime
const scsBridgeMirrorActivateScp = createDiametricQualityWithPayload<...>('...');
```

### Pewter Tessera Diameter for scsBridgeMirror Vue Dashboard

The SCST (Suite Color Semantic Taxonomy) Diameter applies identically: Bridge status = `--color-cobalt` (Suite 5 · System), active SCP = `--color-viridian` (Suite 4 · Success), error state = `--color-maroon` (Suite 1 · Critical). The `BRIDGE_STATUS_COLORS` constant in `scsBridgeMirror.type.ts` MUST reference `--color-{suite}` CSS variables — never hardcoded hex — per the Pewter D1 Color Token Architecture Skill.

### Demometer Pair: SCP-Side ↔ Bridge-Side

```
[SCP Runtime · port 7700]                    [Bridge Process · port from bridge.json]
  scsBridgeMirror Concept                       scsBridge Concept
    Quality.Method                 ←HTTP POST→   MCP endpoint /-mcp
    mcpToolDispatch.strategy.ts                  scsBridgeScpToolRegistration
    (MASN tool call)               ←200 JSON→    Quality handler dispatches
```

The Diameter is NOT parent → child (SCP is not subordinate to Bridge), NOT sequential (either side can initiate — SCSER demonstrates reverse direction), NOT hierarchical. Circular reference (`scsBridgeMirror.Activate → Bridge.Quality → Bridge.TUI → scsBridgeMirrorSync.Principle.update → Vue.render`) is structural.

### Refinements to §13 Aspirant (from Summation Agent Section 2)

1. **MCP-Dispatch is PRIMARY, CLI is fallback**: Option B (HTTP MCP POST) supersedes Option A (CLI shell-exec). MCP routes through Stratimux Quality machinery; CLI bypasses it.
2. **FNES file grammar required**: SBM-D1 produces files with deployment-encoded suffixes (`.concept.huirth.ts`, `.quality.huirth.diameter.ts`, etc.).
3. **Pewter Tessera dispatch CONCURRENT with SBM-D5**: Pane class names must exist before Vue file written.
4. **CISV applies to ALL Mirror Diameter Qualities**: Induction suffix mandatory on every Diameter junction.
5. **MuxonomicConfig self-documentation required**: SBM-D4 multi-session anchor visible in machine-readable registry, not only in code.
6. **Bridge Model Phase 5 REQUIRED**: `mcpToolDispatch.strategy.ts` MUST use muxiumTimeOut pattern because Mirror Qualities execute inside ActionStrategy scope (H2 non-negotiable).

### Foundation Suite Dispatch Plan (SBM Macro 2 Opening)

When NM-T6 + NM-T7 + NM-T8 close and Rose Cycle 154 fires, SBM Macro 2 Foundation Magic Shotgun opens — 5-Suite concurrent dispatch (Suites 1, 2, 3, 4, 6 at Length 1-6 · Analytical sonnet scale · Tier 1 Opal dispatch). Each Suite reads S15 (architecture) and SCP-S13 (this Skill — implementation walk-through) as the authoring guides. SBM-D1 through SBM-D5 sub-Diamond chain then actualizes scsBridgeMirror following the Copy-Paste-Plus path above.

**Forward composition references**:
- `SUMMATION-AGENT-SCS-BRIDGE-ENHANCEMENT-CONTEXT.md` — full SCS-Bridge enhancement vision (Sub-Targets 1-6 · SAWSR substrate catalog · Manifold structural analogy)
- `MACRO-DIAMOND-ASPIRANT.md §13` — SBM Macro 2 Aspirant authoritative source
- `SUITE-6-AMETHYST-NOTIFICATION-MANIFOLD-REFERENCE-DESIGN.md §Section 5` — Pewter Tessera Composition Trajectory

---

## Cobalt Build Checklist

```
[ ] Create directory: Cascades/8_SUITES/SCP Researcher/Skills/
    (already present from SCP-S12)
[ ] Write this Final Draft as Skills/ConceptAuthoring.md
    - Match SCP-S12 Communication.md format (frontmatter + sections + Concluder + Cross-References)
    - Preserve all pattern abbreviations (FNES · CISV · TOBM · ZKHP · etc.) from Rust naming authority
    - All 5 Viridian HAZARDS (H1-H5) must appear in Anti-Patterns table as CRITICAL/HIGH/MEDIUM severity
    - All Phase Concluders must be executable bash commands
[ ] Update Conductor.md Skills Registry section with SCP-S13 entry (after SCP-S12 entry)
    - Include: File · Aspect · Dispatch trigger · Pattern E Band 5 annotation
[ ] Update base Skill.md with SCP-S13 register entry
[ ] Verify SCP-S12 bidirectional cross-reference exists (SCP-S12 cross-references SCP-S13 for new-concept scope)
[ ] Run Phase 8 Verification Battery commands and confirm all targets met
```
