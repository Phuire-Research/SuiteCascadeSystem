# SCP-S14 · Demometric Concept Pattern — the Structural Ground Truth

**Aspect**: What a Concept IS in the SCP runtime BEFORE you author one (S13 is the How; S14 is the What/Why)
**Version**: 1.0
**Origin**: SCP-Researcher Full Suite Refinement · Cycle 172 · #592
**Skill ID**: SCP-S14
**Skill Name**: DemometricConceptPattern

---

## §A · Pearl Summary

A Concept in the SCP runtime is a **Demometer** — a distinct, measurable unit of state and behavior — that draws **Diameters** (through-measures of similarity) to the *other side* of the runtime across a WebSocket. The SCP runtime has two halves: a **Huirth** Muxium (the Node server process) and a **Client** Muxium (the browser/Vue process). A "Demometric Concept" is ONE logical Concept that lives on BOTH halves with independently-created Stratimux concepts sharing a single name. This Skill names six patterns — **DCFM** (the dual-face structure), **WSDM** (the WebSocket-as-Diameter), **PCIP** / **TBAA** / **CIMB** (the persistent-vs-island lifecycle), with **CSCM** cross-referenced — and the single sharpest edge a contributor will cut themselves on: the **ClientToServer CISV Induction-placement rule** (§D). Read this Skill BEFORE SCP-S13 (`Skills/ConceptAuthoring.md`); S13 is the eight-phase authoring procedure that generates a Concept *from the mental model this Skill installs*. The Diameter S14↔S13 is circular-structural: S14 routes to S13 for the How, S13 forward-points to S14 for the What/Why — neither is parent.

---

## §B · DCFM — Dual-Concept Faceted Measure

A single logical Concept exists as TWO independently-created Stratimux concepts that measure the SAME domain from DIFFERENT vantage points: a **SCP-Huirth Face** (server-runtime measure) and a **SCP-Client Face** (browser-runtime measure). The two faces:

- **Share a concept name** — both are created as `'scsBridge'`. Name constant: `scsBridge.type.ts:35` — `export const scsBridgeName = 'scsBridge'`; the Huirth name literal at `scsBridge.concept.huirth.ts:49` — `export const scsBridgeHuirthName = 'scsBridge'`.
- **Are created by separate factory functions**:
  - SCP-Client Face: `Cascades/scps/template/SCP/src/concepts/scsBridge/scsBridge.concept.client.ts:98` — `createScsBridgeClientConcept`
  - SCP-Huirth Face: `Cascades/scps/template/SCP/src/concepts/scsBridge/scsBridge.concept.huirth.ts:68` — `createScsBridgeHuirthConcept`
- **Carry non-overlapping but related state shapes** — `ScsBridgeClientState` vs `ScsBridgeHuirthState` (see §E for the dual-state variant).
- **Register the SAME quality type-strings at different deployment targets** — the type-string is the identity that crosses the wire (see §C/§D).

Neither face is parent to the other; both are independently createable. The composition is **structural, not hierarchical**.

### "Faceted" not "Split"

The term "Faceted" is deliberate over "Split" or "Dual": a gemstone facet is a distinct measuring surface of the SAME underlying stone — each facet reflects state and behavior differently while being inseparable from the stone's identity. The SCP-Huirth face owns session lists, bridge JSON, and file-system watchers; the SCP-Client face owns bar visibility, toolbar buttons, install-wizard state, and trigger fields. Together they measure the complete domain. This is **M3 Verbose Split Naming non-negotiable** — kept verbatim from S2 Orange naming (DCFM §1.1).

### The Tri-Face Note — Dual by Default, Tri-Face is the Exemplar's Special Case

`scsBridge` ALSO has a THIRD concept file: a CLI/daemon Huirth face at `src/lib/bridge/concepts/scsBridge/scsBridge.concept.ts:66` (`createScsBridgeConcept`). This is the **EXEMPLAR's special case** — it exists ONLY because `scsBridge` mirrors a running daemon (the SCS-Bridge process). **A contributor authoring a NEW Concept produces 2 faces, not 3.** The pattern *generalizes* to N faces (the same logical domain can have N distinct deployment measures, each a Demometer in the full Muxonomy), but the **authoring norm is exactly 2 faces** (SCP-Huirth + SCP-Client) unless the new Concept mirrors an external daemon — which is rare and currently `scsBridge`-only. If you read scsBridge's three files and feel you must produce three, you have mistaken the exemplar's daemon-mirror requirement for the authoring norm. Author 2.

---

## §C · WSDM — WebSocket-as-State-Diameter

The WebSocket between `webSocketClient` (Client Muxium) and `webSocketServer` (Huirth Muxium) is NOT merely a transport — it is the active **Diameter** passing through both Demometers, carrying Stratimux ACTION OBJECTS (matching type-strings) that are **executed on the receiving Muxium**. The two faces are measurably unlike (different state shapes, different qualities, different runtime contexts), yet the WebSocket reveals what they share: the same concept name, the same action type-strings, the same payload contracts. The action type *is* the similarity — the Through-Measure.

### actionExchange declares the Diameter junctions

The `actionExchange` block in `scsBridge.muxonomy.ts:295-333` declares which actions cross the wire and in which direction. Both directions are present in the real exemplar:

- **`actionExchange.clientToServer`** (`scsBridge.muxonomy.ts:296-307`): `scsBridgeSendBridgeMessage` (`actionType: 'Scs Bridge Send Bridge Message'`, lines 297-301) and `scsBridgeTriggerHardTurnOver` (lines 302-306). Client initiates; Huirth executes.
- **`actionExchange.serverToClient`** (`scsBridge.muxonomy.ts:308-332`): `scsBridgeSetBridgeStatus`, `scsBridgeSetBridgeJsonRelay`, `scsBridgeSetSessionsListRelay`, `scsBridgeSetSessionTranscriptDataRelay`. Huirth initiates; Client receives.

### SMRP — the reactive return-leg confirms the channel is ACTIVE

`principles/scsBridgeStateMirror.principle.huirth.ts` (SMRP · State-Mirror-Reactive-Principle) observes the Huirth `bridgeJson`+`sessionsList` selectors and dispatches `webSocketServerAppendToActionQue` on every change → broadcast to clients. SMRP proves the WebSocket Diameter is **active, not passive** — it does not wait to be polled; it pushes Stratimux qualities on state change.

---

## §D · THE SHARPEST EDGE — ServerToClient vs ClientToServer + the CISV/Induction-placement Rule

**This section is the reason this entire Skill exists.** A contributor who reads SCP-S13 alone learns only the ServerToClient direction (the Notification Hello World exemplar) and will silently misplace a ClientToServer Induction.

### Two directions, OPPOSITE Induction placement

| Direction | Exemplar | Where the Induction lives | Where the Real lives |
|---|---|---|---|
| **ServerToClient** | Notification `notificationHelloWorld` (S13 teaching exemplar) | on the **Huirth** side | on the **Huirth** side (Client just receives the broadcast) |
| **ClientToServer** | scsBridge `sendBridgeMessage` | on the **CLIENT** file (`.quality.client.diameter.ts`) | on the **Huirth** file (`.quality.huirth.diameter.ts`) |

### The CISV invariant, stated as the rule that prevents an hour of silent debugging

CISV (Critical Induction Suffix Variable requirement) means: the variable holding the `createInductionQualityCardWithPayload` (or `createDiametricQuality`) result MUST carry the `Induction` suffix. For the **ClientToServer** direction, that Induction-suffixed variable lives in the **CLIENT concept file** — NOT the Huirth file.

### The CISV proof — verbatim anchors (load-bearing)

The CLIENT concept file holds BOTH Induction variables. `scsBridge.concept.client.ts:17`:

```
import { scsBridgeSendBridgeMessageInduction } from './qualities/sendBridgeMessage.quality.client.diameter';
import { scsBridgeTriggerHardTurnOverInduction } from './qualities/triggerHardTurnOver.quality.client.diameter';
```

(lines 17-18), mapped into the qualities object at `scsBridge.concept.client.ts:60-61`:

```
scsBridgeSendBridgeMessage: scsBridgeSendBridgeMessageInduction,
scsBridgeTriggerHardTurnOver: scsBridgeTriggerHardTurnOverInduction,
```

The Induction itself is created in the CLIENT-side `.client.diameter.ts` file at `qualities/sendBridgeMessage.quality.client.diameter.ts:25-28`:

```
export const scsBridgeSendBridgeMessageInduction = createInductionQualityCardWithPayload<
  ScsBridgeClientState,
  ScsBridgeSendBridgeMessagePayload
>('Scs Bridge Send Bridge Message');
```

The HUIRTH concept file holds the REAL — NO Induction in sight. `scsBridge.concept.huirth.ts:55-56`:

```
scsBridgeTriggerHardTurnOver: scsBridgeTriggerHardTurnOverHuirth,
scsBridgeSendBridgeMessage: scsBridgeSendBridgeMessageHuirth,
```

The Huirth Real is created in `qualities/sendBridgeMessage.quality.huirth.diameter.ts:180-184`:

```
export const scsBridgeSendBridgeMessageHuirth = createQualityCardWithPayload<
  ScsBridgeHuirthState,
  ScsBridgeSendBridgeMessagePayload
>({ type: 'Scs Bridge Send Bridge Message', ... });
```

### The teaching sentence (verbatim — do not paraphrase)

> In the ServerToClient direction the Induction is on Huirth; in the ClientToServer direction the Induction is on the CLIENT file. A contributor who reads S13 alone will believe the Induction is always on Huirth, will place a ClientToServer Induction in the wrong file, and will get SILENT routing failure with no diagnostic. The `.client.diameter.ts` suffix on the file plus the `Induction` suffix on the variable are the two markers that prove correct placement.

### AESR cross-cut — the type-string is IDENTICAL across all three locations

The Verbose Split type-string `'Scs Bridge Send Bridge Message'` appears identically in three places:
- the Client Induction: `sendBridgeMessage.quality.client.diameter.ts:28`
- the actionExchange entry: `scsBridge.muxonomy.ts:299`
- the Huirth Real: `sendBridgeMessage.quality.huirth.diameter.ts:184`

camelCase type-strings (`'scsBridgeSendBridgeMessage'`) COMPILE but mis-route at runtime. AESR (Action Exchange Semantic Registration) requires all three to be the SAME Capitalized Space-Separated string. Cross-reference SCP-S13 Phase 8.5 (the AESR consistency Concluder).

---

## §E · Dual-State Demometric variant

SCP-S13's Notification exemplar teaches a SINGLE SHARED state type used by both faces. **scsBridge does NOT** — its two faces carry DIFFERENT types sharing no fields:

- `ScsBridgeClientState` — `scsBridge.type.ts:47-142`. Owns bar visibility, toolbar buttons, install-wizard state, trigger fields, the `actionQue`/`filterKeys` InductionState (required for Diameter routing).
- `ScsBridgeHuirthState` — `scsBridge.type.ts:553-561`. Owns raw `bridgeJson`/`sessionsList` file data and `serverStartupTime` (the boot timer). Three fields, none shared with the Client type.

### When to split

Split into `<Concept>ClientState` + `<Concept>HuirthState` when **Huirth needs state the Client does not** — raw server-file data, server-only timers, connection tracking. If both sides genuinely operate on the same data identically (Notification), keep one shared type.

### SBIS — the Base/Relay pattern (the relay teaching)

The canonical ServerToClient flow in the real codebase is NOT a single broadcast — it is a **two-quality Base/Relay split** (SBIS · Stratidian-Base-Informative-State: Base = Huirth, Informative = Client). The server writes state via:

1. A **HuirthBase quality** that updates Huirth state so the SMRP selector fires locally. `scsBridge.concept.huirth.ts:60` — `scsBridgeSetBridgeJsonHuirthBase`. Payload type `ScsBridgeSetBridgeJsonHuirthBasePayload` at `scsBridge.type.ts:594-597` (and `ScsBridgeSetSessionsListHuirthBasePayload` at :599-601). **INVARIANT** (comment at `scsBridge.type.ts:591`): these Base qualities **"MUST NOT appear in actionExchange.serverToClient"** — they are Huirth-local only.
2. A **Relay quality** that DOES cross the wire — it is the one registered in `actionExchange.serverToClient`. `scsBridge.concept.huirth.ts:57` — `scsBridgeSetBridgeJsonRelay`.

`bridgeJson`, `sessionsList`, and `transcriptData` all use this Base+Relay pair. The Base updates server state (fires SMRP); the Relay broadcasts to clients. A contributor adding a ServerToClient field follows this pair, not a bare broadcast.

---

## §F · PCIP / TBAA / CIMB — Persistent vs Island lifecycle

Two Concept lifecycles exist in the SCP runtime. Confusing them is the second-most-common contributor error after §D.

### PCIP — Persistent-Concept Island-Partitioned split

Some Client-Muxium concepts are ALWAYS registered (persistent); others exist only when a specific Island is loaded (island-partitioned). The persistent set is `BASE_CONCEPTS_CREATORS` at `client.muxonomy.ts:71-80` — each entry MTRR-annotated:

```
webSocketClient  — MTRR · universal transport
localStorage     — MTRR · universal persistence
notification     — MTRR · ZKHB global notification surface
scsBridge        — MTRR · CSCM · drives TaskBar from ANY page
```

Island-partitioned concepts (`suite8`, `cadmium`) were REMOVED from the persistent set in Cycle 159 D1 (IUPA · Island Unto Page Adoption) — comments at `client.muxonomy.ts:34, 63-65`.

### The two lifecycles, stated as a rule

1. **Island (VCIP)** — a Muxium created in the island load, scoped to a single page. The lazy island registry is `IslandWrapper.vue:158-164` (`islandRegistry` — a map of `islandId → async component loader`). New domain Concepts are almost ALWAYS Islands.
2. **Persistent** — alive at the IslandWrapper tier for the entire session, across all island navigations. `scsBridge` is the ONLY persistent domain Concept in the default template. **Toolbar integration requires the persistent path** — an island-partitioned concept cannot drive a button that must be live on every page.

### TBAA — TaskBar-Always-Able

The TaskBar is hosted in `IslandWrapper.vue` (the Tier-2 client-hydrated root), NOT in `Shell.vue` (SSR-only, dead client bindings — the E13 fix at `IslandWrapper.vue:101-112`). The `scsBridgeController` is created once at `IslandWrapper.vue:97-99` and lives in the same Vue tree as the TaskBar; the render path is `IslandWrapper.vue:126-132` (`toolbarButtonsForRender`). Because the persistent `scsBridge` concept + its display principle anchor a live Muxium reference into the controller, the TaskBar can dispatch from any page without that page's Island being mounted.

### CIMB — Concept-Individuation-at-Muxium-Boot

`scsBridge` is a **muxified** concept (accessed at `d.client.d.scsBridge`, Tier 2) yet behaves like a **base** concept for the toolbar — fully able WITHOUT its Island mounted. This is the Stratimux **Individuation Principle** in concrete form: a muxified concept can operate as independently as a base concept within its compositional tier. The concept IS its qualities and state, not its Landing.vue. This is why a muxified concept is a *compositional unit*, not a hierarchical dependent.

---

## §G · FNES — File-Naming Suffix Table

S13 (`Skills/ConceptAuthoring.md`) is the authoritative source of the FNES (Filename-Encoded Deployment-and-Diameter Suffix) vocabulary. This table is reproduced here so a no-RI contributor can classify any file by its suffix WITHOUT reading all of S13 first.

| Suffix | Execution scope | Example anchor |
|---|---|---|
| `.quality.all.ts` (or `.quality.ts` with no side suffix) | Both sides — shared reducer / dual-deployment | notification add/clear; relay setters like `setBridgeJsonRelay.quality.ts` |
| `.quality.client.ts` | Client only — local reducer | `setBarVisible.quality.client.ts` |
| `.quality.huirth.ts` | Huirth only | `setServerStartupTime.quality.huirth.ts` |
| `.quality.client.diameter.ts` | Client **Induction** — the ClientToServer junction | `sendBridgeMessage.quality.client.diameter.ts` |
| `.quality.huirth.diameter.ts` | Huirth **Real** — receives the crossed action | `sendBridgeMessage.quality.huirth.diameter.ts` |
| `.principle.client.ts` / `.principle.huirth.ts` | Principle deployment side | `scsBridgeJsonWatcher.principle.huirth.ts` |

The `.quality.ts` (no side suffix) row is **dual-deployment** — the same file is registered on BOTH faces (e.g. the relay setters `setBridgeJsonRelay.quality` and `setSessionsListRelay.quality`, imported into both `scsBridge.concept.client.ts:35-36` and `scsBridge.concept.huirth.ts:57-58`).

---

## §H · ECK 2-tier ceiling

State the rule plainly: `d.myConcept.k.property.select()` is the ceiling inside a plan. There is **NO** `d.a.d.b.k.*` access in plans. Muxified access reaches `d.client.d.scsBridge` (Tier 2) — and Tier 2 is the floor of the wall: you cannot compose a third tier (`d.client.d.scsBridge.d.somethingElse`). This is the ECK Limitation (CLAUDE.md §6).

**If a concept needs another concept's data** inside a method or principle: declare a NARROWED deck type in the file and read via that deck. Real anchor: the cross-concept `ScsBridgeBackfillDeck` note at `scsBridge.concept.huirth.ts:40-43`, and the inline `ScsBridgeSendBridgeMessageHuirthDeck` declaration at `sendBridgeMessage.quality.huirth.diameter.ts:162-178` — a local-typed view exposing only the `.e` action emitters the method body actually calls, sidestepping the opaque full ConceptDECK type graph.

---

## §I · "Add a New Demometric Concept" Checklist

This is the actionable spine. It decides the shape; SCP-S13 executes the procedure.

```
[ ] 1. Decide direction(s):
       ServerToClient (Real on Huirth · Notification exemplar)
       ClientToServer (Induction on CLIENT · scsBridge sendBridgeMessage exemplar)
       both
[ ] 2. Decide state shape:
       shared (Notification) OR dual-state (scsBridge §E)
       — split when Huirth needs server-only fields
[ ] 3. Decide lifecycle:
       Island (default · VCIP) OR Persistent (toolbar · add to BASE_CONCEPTS_CREATORS) — §F
[ ] 4. For each Diameter quality:
       register in actionExchange (muxonomy.ts) + Induction file + Real file — §C/§D
[ ] 5. CISV: Induction variable carries 'Induction' suffix, in the correct-side file — §D
[ ] 6. AESR: type-string identical across Induction · actionExchange · Real — §D
[ ] 7. Execute the procedure: → SCP-S13 ConceptAuthoring.md (the Eight-Phase walk-through)
[ ] 8. Concluder: typecheck exit 0 · muxonomyRegistry grep >= 2
```

---

## §J · Cross-References

| Reference | Diameter | When |
|---|---|---|
| **SCP-S13** `Skills/ConceptAuthoring.md` | **Circular-structural** — S14 (What/Why) ↔ S13 (How). Neither is parent: S14 routes to S13 for the eight-phase procedure; S13 Phase 1 forward-points to S14 for the mental model. | After absorbing this Skill; to author. |
| **SCP-S15** `Skills/MessagingMechanisms.md` | Messaging qualities ARE Diameter qualities — the structural ground (§C/§D) is what S15's SORD/permission/rename routing rides on. | When wiring a message/tool into a Concept. |
| **SCP-S16** `Skills/ContributorOnboarding.md` | S16 is the no-RI front door; it routes to THIS Skill at Reading-Path Step 1. | A contributor arriving cold reads S16 first, then here. |
| **Stratimuxian Scholar S15/S16** | Framework-level Muxonomy theory + Notification Muxameter runtime trace. | For the framework Why behind `createDiametricQuality` / `createInductionQualityCardWithPayload`. |
