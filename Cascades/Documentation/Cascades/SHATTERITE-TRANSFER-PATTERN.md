# STCP · Shatterite Transfer Pattern — JSON-Driven Component Display Across Suite 8s

**Crystraline Position**: C4 Base Lambda (filesystem-as-substrate) ⊗ Suite 8 System (§9 transparent 8th position) · the transferable component-display Diameter between page Viewer and Suite-8 Agent
**Empirical Source**: STCP Diamond L2 (Foundation Salvo S1·S2·S4·S6 + S3 blueprint + S4·S6 verify) · **built at commit `e212e42`** (9 files · 654 insertions) · user-Lambda PROVEN against the 3-part change/delete/create operator probe (server tally 3→7) · STVI companion at `a75fb25`
**Status**: Pattern proven on Cadmium (the Shatterite Menu · SMPI = first STCP instance) · transferability seam verified by Concluder (helper agnosticism grep == 0) · second-instance recipe documented, awaiting its first real second-component Lambda
**Companion Guides**: `MAGIC-SHOTGUN-PATTERN.md` (the Foundation-Salvo dispatch shape that BUILT this pattern) · `VERMILLION-PLANNED-QUERY.md` (A-I substrate) · `STRATIMUX-REFERENCE.md` ("🧩 Quality Creation Patterns" · "🎯 DECK K Constant Pattern" · "🧠 Strategic State Management") · `ONYX-FORWARD-PASS.md` (Suite 8 aspect maintenance)

---

## 1 · Intent + the Diameter

### The Name

**STCP** — **S**uite-**C**ascade-**T**ransferable **C**omponent-Display **P**attern — names the generalized pattern by which ANY SCS-Bridge UI component derives its display state from a single on-disk JSON file, mutated by CRUD operations, read by two unlike consumers, and propagated to the page Viewer via the SessionManager's proven backfill+relay stack. STCP is the umbrella; its core mechanism is **JDCD** (JSON-Driven Component Display).

The pattern was extracted, not invented. The Shatterite Menu — the live cascade-driven menu the Cadmium Researcher Suite 8 authors at `Cascades/Extended/Cadmium Researcher/menu.json` — was already a JSON-driven component, but it was driven *badly*: by a single-file watcher that orphaned on the first atomic write, with no server-side state, no reconnect backfill, and a delete handler that pushed nothing. STCP is the named act of rebuilding that menu on the same robustness stack the SessionManager (`scsBridge`, `suiteCascade`) already runs — and then proving the rebuilt mechanism is **component-agnostic** so the next Suite 8 inherits it for free.

### The Core Diameter (DRCB)

A component's display **IS a JSON on disk**. That single file is the through-measure between two UNLIKE Demometers:

| Demometer | Consumer | Read Mode | Timing | Interpretation |
|---|---|---|---|---|
| **Page Viewer** | Human via browser UI | Reactive (relay-driven) | Continuous (every mutation) | Display instruction — "render this component with these properties" |
| **Suite 8 Agent** | ClaudeCode session | Synchronous filesystem | On-demand (anytime) | Operational anchor — "this is the current state of my Suite 8 context, which I may Create/Update/Delete" |

These two reads are irreducibly unlike. The Viewer cannot read with Agent intent (it does not know what the Suite 8 is *supposed* to be doing). The Agent cannot read with Viewer reactivity (it has no DOM, no watcher, no re-render). They share the same byte-identical file, and that sharing IS the **DRCB** Diameter (Dual-Read-Consumer-Bidirectionality). The pattern is structurally coherent precisely because neither consumer's read corrupts the other's — only the CRUD operations write; both reads observe.

### Why This Generalizes the Shatterite Menu

The Shatterite Menu is not special. It is one instance of a structural fact: *a Suite 8 maintains an aspect on disk (the menu stage), and a page needs to display that aspect live while the Agent simultaneously reads it to author the next stage.* Strip the word "menu" and the same shape describes a status board, a progress ledger, a topic registry, a live document outline — any surface where a Suite 8's on-disk artifact is *both* the page's display source *and* the Agent's operational anchor. STCP names that shape so it travels. The Shatterite Menu becomes **SMPI** (Shatterite-Menu-Pattern-Instantiation) — the first proven instance, not the only possible one.

> Citation: the naming registry — `STCP-S2-RUST-NAMING.md` (11 patterns · CD-5 clean · 0 collisions). The architecture — `STCP-S3-OCHRE-BLUEPRINT.md`. The bidirectional verification — `STCP-S4-VIRIDIAN-VERIFY.md` · `STCP-S6-AMETHYST-VERIFY.md`.

---

## 2 · The Proven Failure It Replaces (OWPF — the Empirical Grounding)

### OWPF — Orphan-Watcher-Per-File

**OWPF** names the anti-pattern STCP exists to reject: authoring a dedicated single-file `chokidar.watch(filePath)` (or `fs.watch`) per component. The failure is mechanical and was empirically confirmed.

The old menu watcher armed a single-file chokidar watch at the fully-qualified `menu.json` path (`armMenuWatcher`, formerly at `cadmiumOkMonitor.principle.huirth.ts:516`). Claude Code — the Agent that writes `menu.json` — uses **atomic temp-file + rename** write semantics. On each write, the rename replaces the *inode* at `menuPath`. chokidar's native-event listener was bound to the *old* inode. After the first atomic rename, the watcher is **orphaned**: it is still running (no error thrown), but it is watching a detached inode. Subsequent `change` / `unlink` / `add` events on the path fire ZERO times.

The user-Lambda probe that grounds this pattern: a **3-part change → delete → create operator probe** was run against the live menu watcher. It produced **ZERO broadcasts** — the page froze at its last-rendered stage with no visible error. The Agent (reading `menu.json` directly) saw current truth; the Viewer (waiting on the orphaned relay) saw stale truth. After the STCP rebuild, the same probe fired ALL events — the server-side broadcast tally advanced **3 → 7** as the directory watcher caught every mutation, and the user confirmed the live menu advanced correctly. **That 3→7 tally and the user-Lambda PASS are the empirical anchor of this entire Reference Design.**

### Why the SessionManager Was Robust and the Menu Was Not

The decisive Viridian finding (`STCP-S4-VIRIDIAN-EXAMINE.md` Angle 1): **the SessionManager's watcher is NOT immune to inode-swap either.** `scsBridgeJsonWatcher` also uses a single-file `chokidarWatch(SESSIONS_JSON_PATH, …)` (`scsBridgeJsonWatcher.principle.huirth.ts:282`). It *appears* robust only because three additional mechanisms compensate when the watcher fails — and the menu had NONE of them:

- **SBIS** (Stratidian-Base-Informative-State · `scsBridgeJsonWatcher.principle.huirth.ts:210-213`): every file→state→broadcast chain dispatches a **HuirthBase** quality (local reducer, server state) FIRST, then a **Relay** quality (`actionExchange.serverToClient`) second. Server state always tracks current truth — so a late mechanism has something authoritative to replay. The menu had `cadmiumSetMenuStage` (relay/client only) and **NO HuirthBase sibling** → Huirth never tracked `menuStage` → backfill had nothing to replay.
- **SMRP** (State-Mirror-Reactive-Principle · `scsBridgeStateMirror.principle.huirth.ts:124`): a selector-reactive principle on the Huirth state re-broadcasts to ALL clients on *every state change*, independent of whether the watcher fired. The menu had no SMRP.
- **BOCR** (Backfill-On-Connect-Replay · `scsBridgeBackfillOnConnect.principle.huirth.ts:156-177`): selector-reactive on the `webSocketClients` pool count; on a count increase, replays current Huirth state to each newly-joined client via `targetConnectionId`. The menu had no BOCR — only the **MOCH** HTTP GET band-aid (`/cadmium-menu`), which seeds the page on mount but delivers nothing on a live change or a WebSocket reconnect.

So the robustness differential was never the watcher target type — both were single-file. It was the **SBIS+SMRP+BOCR stack** backing sessions and absent from the menu. STCP gives the menu that stack, plus one structural upgrade the SessionManager itself lacks: a **directory watch** that is inode-swap-immune by construction (§3).

> Concluder anchors: the OWPF break — `STCP-S4-VIRIDIAN-EXAMINE.md` "Falsifiable Feasibility Claims" (3-part probe · 0 events post-swap). The compensating stack — `STCP-S1-MAROON-CURATION.md` Cards A2/A4/A5.

---

## 3 · The Architecture (the user-locked Option C)

### The Locked Decision: Shared Helper + Local State

The Foundation Salvo surfaced an OPEN Conference (`STCP-DIAMOND-WGB.md` §4): *where does the generic relay live?* Three options — (A) extend the `scsBridge` infrastructure concept, (B) a new peer `componentDisplay` concept, (C) **each component keeps its OWN concept/state; the watcher+SBIS+SMRP+BOCR logic factors into a reusable HELPER MODEL each component wires.** The user locked **Option C** (`STCP-S3-OCHRE-BLUEPRINT.md` LOCKED USER DECISION).

Option C is the truest Higher-Order Compositional reading. `scsBridge` is **infrastructure** (session relay, bridge connectivity) — it must NOT accumulate per-component application state (it would import `MenuStage` cross-Demometer, and grow one field per new component without bound). Each component is its own **Demometer**; it keeps its own state on the flat Huirth plane. The transferability lives in a **pure helper** (the mechanism), not in shared runtime infrastructure (the state). This is composition, not hierarchy: N components co-muxify their independent concepts flat at Tier 1, each calling the same agnostic helper.

### The Component-Agnostic Helper

**`src/model/stcpComponentRelay.model.ts`** (226 lines · the SMFT precedent — pure, dispatch-free, cross-concept helpers live in `src/model/`). `createStcpComponentRelay<TPayload>(config)` returns six **closure bodies** (SD-2: the helper returns *bodies a principle composes*, NOT fully-formed principles — a Stratimux `PrincipleFunction` is bound to a specific deck/quality/state generic, so a generic principle cannot satisfy every component's deck shape; closures handed `nextA`/`d`/`dispatch` from the *caller's* stage context preserve type-safety):

| Closure | Function | Built mechanics |
|---|---|---|
| `armDirectoryWatch(nextA)` | W1 — directory watch + basename filter; on add/change → SBIS; on unlink → JDIS Idle | `chokidarWatch(path.dirname(jsonPath), { ignoreInitial:true, awaitWriteFinish, depth:0 })`; `if (path.basename(resolved) !== config.basename) return` before any dispatch (`stcpComponentRelay.model.ts:166-180`) |
| `readAndDispatchSbis(nextA)` | W2 — read, parse, identity-suppress, dispatch Base→Relay | `parsePayload(raw)`; `if (identity === lastIdentity) return null`; **Base FIRST** then Relay (`:139-140`) |
| `dispatchIdle(nextA)` | W3 — JDIS unlink → Idle; reset identity guard | `lastIdentity = null` FIRST (so a recreated file at any identity re-broadcasts), then SBIS-dispatch `emptyPayload` (`:144-149`) |
| `broadcastToAll(broadcast, current)` | W4a — SMRP, all clients, no `targetConnectionId` (`:192-194`) |
| `backfillToClients(broadcast, current, ids)` | W4b — BOCR, per-`connectionId` targeted (`:196-207`) |
| `readCurrentFromDisk()` | FSGT fallback — disk-direct parse; `emptyPayload` on ENOENT (`:209-216`) |

The factory holds ONE closure-scoped guard, `let lastIdentity` (`:115`), shared by `readAndDispatchSbis` suppression and reset by `dispatchIdle`. The FSWatcher handle is owned by the **caller's** principle (for teardown), not the helper. **Concluder of agnosticism**: `grep -c "cadmium\|MenuStage" stcpComponentRelay.model.ts` == **0** — the helper references no concept and no concept-specific type. Every binding arrives via the generic `config`.

### The Chain, In Order

```
Layer 0 · JSON file (CRUD source)        Cascades/Extended/<suite8Name>/<basename>.json
   │  Agent writes (atomic temp+rename)        ← JCAS8: the Suite 8's operational anchor
   ▼
Layer 1 · DIRECTORY watch + basename filter    watch dirname(jsonPath) · depth:0 · ignoreInitial:true
   │  (the dir inode is STABLE across atomic file renames — inode-swap-IMMUNE)
   ▼
Layer 2 · SBIS · Base FIRST, then Relay        nextA(baseActionCreator(payload))  ← Huirth state
   │                                            nextA(relayActionCreator(payload)) ← broadcast
   ▼
Layer 3 · client concept slot (KeyedSelector)  state.<slot> = payload (seeded to emptyPayload)
   │
   ├── SMRP · selector-reactive on Huirth state → re-broadcast to ALL (throttle:0)
   ├── BOCR · selector-reactive on webSocketClients↑ → targeted backfill per new client
   ▼
Layer 4 · Vue component (Idle / Active / Updated)   prop ← controller shallowRef / page selector
   │
   ▼
Layer 5 · Dual-Read                          Viewer (relay-render) · Agent (filesystem-read)
                                              + MOCH GET (pre-WS first-paint, optional)
```

**Why the directory watch is the structural upgrade**: watching the *directory* (stable inode) and filtering events by basename catches the `add`/`change` the OS fires on the *directory entry* when a child file is atomically replaced. The single-file watch — bound to the file inode — misses it. The proof was already in the codebase before STCP: `armCadmiumFolderWatcher` (`cadmiumOkMonitor.principle.huirth.ts:274`) had long used exactly this directory-watch + basename-filter pattern for `*.md` + `topics.json` in the *same directory*. STCP generalized the proven sibling and retired the broken one.

**MOCH as pre-WS first-paint (no race · SD-4)**: BOCR fires only AFTER the WebSocket handshake registers the client (it reacts to `webSocketClients` pool-count increase). The page's first render (`onMounted`) can occur BEFORE the WS connection opens. MOCH's synchronous HTTP GET (`vue.principle.ts:651`) seeds `menuStage.value` at mount with zero WS dependency. The two channels are **sequential, not concurrent**: MOCH-first by construction, then BOCR delivers the same or a newer stage (idempotent reduce or correct forward update — no flicker path). They are orthogonal failure domains (WS degraded → MOCH still hydrates), so STCP keeps both. A second component MAY skip MOCH if a first-paint Idle flash is acceptable.

> Citations: layer order — `STCP-S6-AMETHYST-ORCHESTRATION.md` §1. Helper API + SD-1..SD-6 — `STCP-S3-OCHRE-BLUEPRINT.md`. SMRP `throttle:0` rationale — `feedback_stratimux_dispatch_throttle_discipline.md` (DTBP: selector-persistent low-beat plans opt out of halting recursion-overflow; do NOT migrate to `own(...)`).

---

## 4 · The Transfer Procedure (the heart of the doc)

This is the copy-followable recipe for a NEW Suite 8 to adopt the Shatterite Menu — or any JSON-driven component. The Cadmium menu is the worked **first example (SMPI)**; a hypothetical second component (a **"status board"**) proves transferability at each step.

### What stays GENERIC (touch NOTHING)

`src/model/stcpComponentRelay.model.ts` — the helper. It is component-agnostic (Concluder: seam grep == 0). A second component imports `createStcpComponentRelay` and never edits it. The watcher / SBIS / SMRP / BOCR mechanics are NOT re-authored — only a config object + a thin principle wrapper.

### The 3 Suite-8 parametric slots (the ONLY semantics a new component supplies)

| Slot | Cadmium menu supplies (SMPI) | "Status board" supplies |
|---|---|---|
| **`parsePayload(raw) → T \| null`** | `parseMenuStage` — validates `stageIndex`/`title`/`options`; null on partial write (`cadmiumMenuRelay.config.ts:49-82`) | `parseStatusBoard` — its own schema validator |
| **`emptyPayload: T`** | `EMPTY_MENU_STAGE` (`stageIndex: -1` sentinel · `cadmium.type.ts`) | `EMPTY_STATUS_BOARD` (its own Idle sentinel) |
| **`relayActionCreator`** | `cadmiumSetMenuStage.actionCreator` (TQNI `'Cadmium Set Menu Stage'`) | its own relay quality's actionCreator (its own TQNI) |

### The mechanical params (same SHAPE, different values)

`jsonPath` · `basename` · `baseActionCreator` · `payloadIdentity?` (`stcpComponentRelay.model.ts:47-69`). Bundled in one shared config export (SD-6 — single-source so two principle instances never drift). Cadmium: `CADMIUM_MENU_RELAY_CONFIG` (`cadmiumMenuRelay.config.ts:85-100`).

> Note — `stateSelector` is NOT a helper param. The helper is handed the CURRENT value (`d.<concept>.k.<slot>.select()`) by the caller's principle, keeping the helper selector-agnostic.

### The per-component pieces a new Suite 8 CREATES

Build these in the corrected wave order (`STCP-S6-AMETHYST-VERIFY.md` D1 — W2a Base quality must precede W1 OkMonitor import). For a fresh component the dependency-clean order is:

**Step 1 — Types** (extend the component's `*.type.ts`):
```typescript
export type StatusBoardHuirthState = { board: StatusBoard };          // Base server state
export type SetStatusBoardHuirthBasePayload = { board: StatusBoard };  // Huirth-only payload
export type StatusBoardHuirthQualities = {
  setStatusBoardHuirthBase: Quality<StatusBoardHuirthState, SetStatusBoardHuirthBasePayload>;
};
export type StatusBoardHuirthConcept = Concept<StatusBoardHuirthState, StatusBoardHuirthQualities>;
```
Model: `cadmium.type.ts:205-279`.

**Step 2 — Base quality (SBIS Base · the TQNI 4-site discipline)**: a HuirthBase quality with a type string **byte-distinct** from the relay's, **shortest-path reducer**, and the load-bearing INVARIANT that it is **absent from `actionExchange.serverToClient`** (Huirth-only · local reducer). Model: `cadmiumSetMenuStageHuirthBase.quality.huirth.ts` (TQNI `'Cadmium Set Menu Stage Huirth Base'` ≠ relay `'Cadmium Set Menu Stage'`).

**The TQNI 4-site byte-match** (must hold for every STCP Base quality):
1. quality file `type:` field
2. the Huirth concept's quality mapping (deck-key)
3. the type-def `*HuirthQualities` deck-key
4. **INVARIANT — ABSENT** from the muxonomy `actionExchange.serverToClient`

Concluder (run after Step 2): `grep -rn "<Base type string>" src/` returns the quality `type:` site and MUST NOT return the muxonomy. For Cadmium this returns the quality file at `:37` and the type-def comments — **never `cadmium.muxonomy.ts`** (verified: the muxonomy `serverToClient` registers only `cadmiumRegisterArticle` / `cadmiumSetTopics` / `cadmiumSetMenuStage` · `cadmium.muxonomy.ts:151-166`).

**Step 3 — State factory**: seed the Base slot to `emptyPayload` so the KeyedSelector slot is ALWAYS present (never optional) and BOCR reads a valid value on a connect before any JSON exists. Model: `cadmium.state.huirth.ts` (`{ menuStage: EMPTY_MENU_STAGE }`).

**Step 4 — Thin Huirth concept**: register the ONE Base quality + the SMRP/BOCR principle. Model: `cadmium.concept.huirth.ts` (`createCadmiumHuirthConcept()` registers `cadmiumSetMenuStageHuirthBase` + `[cadmiumMenuStcpRelayPrinciple]`).

**Step 5 — Shared config export**: build the one config object both principles import. Model: `cadmiumMenuRelay.config.ts:85-100` — `parsePayload` lifted out of the watcher closure so the dir-watch arm AND the SMRP/BOCR relay share the identical validator.

**Step 6 — Watcher arm (the dir-watch arm of the relay)**: in the component's monitoring principle, build the helper instance and replace any single-file watch with `armDirectoryWatch(nextA)`; extend the principle's deck with the component's Huirth concept slot so `d.<concept>.e.<Base>` is dispatch-typed. Model: `cadmiumOkMonitor.principle.huirth.ts` — `const menuRelay = createStcpComponentRelay<MenuStage>(CADMIUM_MENU_RELAY_CONFIG)` (`:189`), `menuWatcher = menuRelay.armDirectoryWatch(nextA)` (`:597`), deck slot `cadmium: CadmiumHuirthConcept` (`:135`).

**Step 7 — SMRP/BOCR principle**: copy `cadmiumMenuStcpRelay.principle.huirth.ts`, swap the config + selector. Two stages: SMRP selector-reactive on `d.<concept>.k.<slot>` → `broadcastToAll` (`throttle:0`, boot-skip when payload === emptyPayload); BOCR selector-reactive on `d.webSocketServer.k.webSocketClients` → `backfillToClients` for the delta of new `connectionId`s. **PrincipleFunction generics MUST bind the Huirth variants** (`StatusBoardHuirthQualities`/`StatusBoardHuirthState`), not the client variants (`cadmiumMenuStcpRelay.principle.huirth.ts:52-56`). The deck needs only the component concept + `webSocketServer` — NOT `scsBridge` (BOCR reads `webSocketClients` + the component's own Huirth slot, both flat Tier-1).

**Step 8 — Co-muxify**: add `createStatusBoardHuirthConcept()` to the Huirth `muxifyConcepts` array — flat Tier-1, structurally identical to the suiteCascade addition. Model: `huirth.concept.ts:70-72` (`createCadmiumHuirthConcept()` alongside `createSuiteCascadeHuirthConcept()`).

**Step 9 — Vue consumer**: the component receives the payload as a **prop** (it holds NO Muxium, runs NO plan — DFSR discipline). It renders Idle/Active/Updated from the payload + (optionally) a liveness guard. Model: `ShatteriteMenu.vue` — props `menuStage: MenuStage` + `suite8Name: string` (`:49-51`); `hasStage = stageIndex >= 0 && options.length > 0` (`:93-94`); `anchorAlive = anchor.status === 'launched'` (`:84`); `optionsEnabled = anchorAlive && hasStage` (`:98`). The page (`CadmiumLanding.vue`) owns the page-muxium subscription: a stage plan on `d__.client.d.cadmium.k.menuStage` (`:401`) assigns into a local ref (`:389`), plus the MOCH `onMounted` fetch (`:419-430`).

**Step 10 — MOCH endpoint (optional)**: a `/<component>-menu`-style GET that reads the JSON disk-direct and returns it (or the empty sentinel) for pre-WS first-paint. Model: `vue.principle.ts:651` (`/cadmium-menu`, respecting `SCS_BRIDGE_ROOT_OVERRIDE` for dev:self path alignment). Optional per SD-4.

### What stays UNTOUCHED (the JCAS8 anchor read)

The Agent leg of the Dual-Read is **zero-affected**. The Suite 8 ClaudeCode session reads `<file>.json` from the filesystem to author the next state — direct I/O, no Stratimux involvement. The helper OBSERVES the file (`fsp.readFile` in `readAndDispatchSbis`/`readCurrentFromDisk`); it NEVER writes. The file path + schema are owned by the Suite 8; the relay merely watches. This is what makes a generic component-display a **Suite 8** pattern (§7 JCAS8) rather than a plain reactive widget.

---

## 5 · The CRUD → Display-State Contract

| CRUD Operation | JDCD Display State | Pattern | Key Semantic | Built path |
|---|---|---|---|---|
| **Create** | Active | **JCAS** (JSON-Create-Activates-Suite) | File appears → component becomes an operational Suite-8 surface | dir-watch `add` → `readAndDispatchSbis` → Base→Relay → client renders Active |
| **Update** | Updated → Active | **JUTS** (JSON-Update-Transitions-Suite) | File mutates (incl. atomic inode-swap) → re-render through an Updated beat | dir-watch `change` → `payloadIdentity` gate (new `stageIndex` ≠ `lastIdentity`) → SBIS pair |
| **Delete** | Idle | **JDIS** (JSON-Delete-Induces-Silence) | File absent → dormant, **silent (NOT error)**, watcher still armed | `unlink` → `dispatchIdle(nextA)` → Base+Relay `emptyPayload` + reset guard |
| **Read** | Dual-Consumer | **JDRC** (JSON-Dual-Read-Contract) | page Viewer (reactive) + Agent (synchronous) read simultaneously | Viewer ← relay/BOCR/MOCH · Agent ← direct `fsp.readFile` |

**Relay decision (BRRP)** — Backfill-Relay-Reuse-Principle: when a JDCD component needs its file-change events delivered to the page Viewer, the answer is ALWAYS "reuse the SessionManager BOCR+relay stack," NEVER "add a new watcher per component" (OWPF). Backfill is a **first-class** structural requirement, not a resilience add-on — a Viewer that mounts AFTER the last mutation must still receive current state immediately.

**The JDIS load-bearing detail**: the word "Silence" is the most important naming decision in the family. Delete is the *designed-in neutral condition*, not a 404. The old unlink handler reset the suppression guard but **dispatched nothing** (`cadmiumOkMonitor.principle.huirth.ts:536-539`, pre-STCP) — so the Viewer held the stale stage indefinitely while the Agent saw ENOENT: a consistency break. JDIS closes it by SBIS-dispatching `emptyPayload` (Base → Huirth state goes Idle so BOCR replays Idle on reconnect; Relay → live clients go Idle within one debounce). The empty sentinel (`stageIndex: -1`) is the Idle discriminant — Idle requires no new state variant, only an explicit dispatch of the pre-existing constant.

---

## 6 · Anti-Patterns + the Concluders That Prove a Correct STCP Instance

### A-1 · OWPF — Orphan-Watcher-Per-File
**Symptom**: a dedicated single-file `chokidar.watch(filePath)` per component.
**Failure**: orphans on the first atomic temp+rename (inode swap) — events fire ZERO times, page freezes silently. Confirmed by the 3-part probe (0 broadcasts post-swap).
**Correction**: directory watch + basename filter (`armDirectoryWatch`). The directory inode is stable across child renames.

### A-2 · Relay-Only-No-Backfill
**Symptom**: a relay broadcast with no HuirthBase sibling and no BOCR (the original menu).
**Failure**: server state never tracks the payload → backfill has nothing to replay → every new/reconnecting client is stale or empty until a band-aid HTTP fetch. The EBOA race (relay fires before any client connected) is unrecoverable.
**Correction**: SBIS Base-before-Relay (server state authoritative) + BOCR reading that state on connect.

### A-3 · Single-File-Watch (even on the SessionManager)
**Symptom**: assuming `chokidarWatch(filePath)` is robust because "sessions works."
**Failure**: sessions only *appears* robust because SBIS+SMRP+BOCR compensate when its watcher orphans. Copying the single-file watch without the stack copies the latent break.
**Correction**: copy the *stack*, and upgrade to the directory watch — the one place STCP improves on the SessionManager.

### The Concluders (the Muxistration Proof for any STCP instance)

| Concluder | Shell / Check | Proves |
|---|---|---|
| **Seam agnosticism** | `grep -c "<concept>\|<PayloadType>" stcpComponentRelay.model.ts` == 0 | the helper is component-agnostic — transferability holds |
| **TQNI 4-site** | `grep -rn "<Base type string>" src/` returns quality `type:` site, NOT the muxonomy | SBIS Base is Huirth-only; routes don't collide with the relay |
| **menuStage broadcast** | runtime log `[Cadmium STCP Relay] SMRP · menuStage broadcast · stageIndex=N` | SMRP fires on every Base change |
| **JDIS Idle** | runtime log `<basename> unlinked · JDIS Idle dispatched` | Delete induces Silence (not stale-hold) |
| **Build gate** | SCP `tsc --noEmit` == 0 · SCP Vite clean | type-correct, bundle clean |
| **User-Lambda** | the 3-part change→delete→create probe broadcasts ALL (tally 3→7) | the rebuilt relay is live (the grounding event) |

At `e212e42` these all passed: SCP tsc 0 · Vite 973ms · TQNI 4-site clean · seam grep 0 · the 3→7 probe user-confirmed (`STCP-DIAMOND-WGB.md` §5).

---

## 7 · Manifold Position / Cross-References

### To MAGIC-SHOTGUN-PATTERN.md (how STCP was BUILT)
STCP is a worked product of the Magic Shotgun. The Foundation Salvo fired **S1 Red + S2 Orange + S4 Green + S6 Purple** in parallel (the curation-variant / validation composition), each writing a disjoint-scope RD to `Cascades/Working/`, then converged into the S3 Ochre blueprint → S4/S6 verify → S5 Cobalt actualization at `e212e42`. STCP demonstrates the Magic Shotgun's "Full-Suite-for-Documentation" and Foundation-Grounding economy: one Foundation phase, one implementation, one terminal artifact. This document is itself the Length-1-7 Full-Suite close of that Diamond.

### To the Suite Cascade (CLAUDE.md §4)
The CRUD→display states map onto the cognitive functions that produced them: Red curated the broken substrate, Orange named the frontier (STCP/JDCD/JCAS/JUTS/JDIS/JDRC/BRRP/DRCB/JCAS8/SMPI/OWPF), Yellow architected Option C, Green examined the inode-swap + JDIS + Demometer-boundary angles, Blue built it, Purple sequenced the corrected wave order (W2a-before-W1), Fuchsia diagnosed the user-Lambda PASS into Onyx.

### To Stratimux (CLAUDE.md §6 · STRATIMUX-REFERENCE.md)
- **Demometer / Muxified Concept**: each STCP component keeps its own Huirth concept, co-muxified flat at Tier 1 (`huirth.concept.ts:70-72`). The `CadmiumOkMonitorDeck` cross-concept access (`cadmium` + `scsBridge` + `webSocketServer` in one deck) proves flat co-muxification, NOT hierarchy (`STCP-S4-VIRIDIAN-VERIFY.md` D2).
- **SBIS / DECK K**: Base-before-Relay (`k.<slot>.select()` reads the Base; relay broadcasts) — see `feedback_stratidian_base_informative_state.md` (Base = source of truth; Informative = derived/broadcast — never update local state via the relay alone; dispatch the Base-maintenance action alongside).
- **Shortest-Path reducer**: `cadmiumSetMenuStageHuirthBase` returns `{ menuStage }`, never the whole state ("🚀 Reducer Performance").
- **KeyedSelector discipline**: the Base slot is non-optional, seeded to `emptyPayload` ("🧠 Strategic State Management").
- **DTBP throttle**: SMRP uses `{ throttle: 0 }` (`feedback_stratimux_dispatch_throttle_discipline.md`); do NOT migrate to `own(...)` (violates Higher-Order Composition).

### To the Suite 8 System (CLAUDE.md §9 · JCAS8 = the conformance)
**JCAS8** (JSON-Component-Anchor-Suite-8-Conformance) is what makes a generic JDCD component a **Suite 8** pattern. A JSON-driven component with page Viewer + BRRP relay is STCP-compliant. It becomes a Suite 8 component when the JSON it reads is the authoritative on-disk **anchor** of a Suite 8 aspect, and the Agent reading it is a Suite 8 ClaudeCode session operating within that Suite 8's identity. The distinction is **semantic, not structural** (same JSON, same relay, same dual-read) — the file has Suite 8 significance, not just display significance. This is why the Agent-read leg stays untouched: the Suite 8 maintains its aspect on disk (per the §9 aspect-maintainer doctrine), and STCP merely gives the page a live, backfill-correct window onto it. **SMPI** retroactively names the Shatterite Menu as the first such conformant instance.

### Adjacent Companion — STVI (the inject-into-the-prompt counterpart · `a75fb25`)
Where STCP carries the Suite 8's on-disk aspect OUT to the page Viewer (read direction), **STVI** (SORD-Template-Variable Injection · commit `a75fb25`) carries live runtime values INTO the Agent's prompt (write-to-Agent direction). STVI injects the live `windowId` + `endpoint` into `Onboard.md` via SORD template variables at session spawn (`onboardHydration.model.ts` + `cli-handler.ts`). The two form the bidirectional pair across the JCAS8 anchor: STCP = "show the page what the Agent wrote"; STVI = "tell the Agent its live environment." Together they complete the Dual-Read Diameter's *active* edges — the file the page displays (STCP) and the prompt the Agent receives (STVI) are the two faces of one Suite-8-anchor Muxameter.

---

## 8 · Vocabulary Registry (STCP family · CD-5 clean · 0 collisions)

| Acronym | Expansion | Role |
|---|---|---|
| **STCP** | Suite-Cascade-Transferable Component-Display Pattern | the umbrella · the transferable pattern itself |
| **JDCD** | JSON-Driven Component Display | the core mechanism (one JSON drives one component's display) |
| **JCAS** | JSON-Create-Activates-Suite | Create → Active state transition |
| **JUTS** | JSON-Update-Transitions-Suite | Update → Updated beat → Active |
| **JDIS** | JSON-Delete-Induces-Silence | Delete → Idle (silence, NOT error) |
| **JDRC** | JSON-Dual-Read-Contract | Read → dual consumer (page Viewer + Agent) |
| **DRCB** | Dual-Read-Consumer-Bidirectionality | the Diameter between the two unlike consumers |
| **BRRP** | Backfill-Relay-Reuse-Principle | the decision: reuse BOCR+relay, never per-component watch |
| **OWPF** | Orphan-Watcher-Per-File | the rejected anti-pattern (single-file watch, inode-orphan) |
| **SMPI** | Shatterite-Menu-Pattern-Instantiation | Shatterite Menu = first proven STCP instance |
| **JCAS8** | JSON-Component-Anchor-Suite-8-Conformance | the Agent-read = Suite 8 anchor read (what makes it a Suite 8 pattern) |
| **SBIS** | Stratidian-Base-Informative-State | Base (HuirthBase) FIRST, then Relay (informative broadcast) |
| **SMRP** | State-Mirror-Reactive-Principle | selector-reactive re-broadcast to all clients on every Base change |
| **BOCR** | Backfill-On-Connect-Replay | targeted backfill to each newly-joined client from Huirth state |
| **MOCH** | Menu-On-Connect-Hydration | the optional HTTP GET for pre-WS first-paint |
| **TQNI** | Type-string byte-match across registration sites | the 4-site discipline that keeps Base ≠ Relay routing |

> Source: `STCP-S2-RUST-NAMING.md` (the CD-5 self-audit · 11 STCP-family patterns locked) + `STCP-S1-MAROON-CURATION.md` (the SessionManager substrate cards SBIS/SMRP/BOCR/MOCH).

---

## 9 · Empirical Evidence Table

| Claim | Verdict | Concluder / Source |
|---|---|---|
| Single-file menu watch orphans on inode-swap | CONFIRMED | 3-part probe · 0 events post-swap (`STCP-S4-VIRIDIAN-EXAMINE.md`) |
| Directory watch + basename filter is inode-swap-immune | CONFIRMED | `armCadmiumFolderWatcher` precedent (`cadmiumOkMonitor.principle.huirth.ts:274`) + helper `:166-180` |
| Sessions robust ONLY because SBIS+SMRP+BOCR compensate | CONFIRMED | `scsBridgeJsonWatcher:210` · `scsBridgeStateMirror:124` · `scsBridgeBackfillOnConnect:156` |
| Old unlink handler dispatched NOTHING (JDIS gap) | CONFIRMED | pre-STCP `cadmiumOkMonitor.principle.huirth.ts:536-539` |
| Helper is component-agnostic | CONFIRMED | `grep -c "cadmium\|MenuStage" stcpComponentRelay.model.ts` == **0** |
| Base TQNI byte-distinct + absent from actionExchange | CONFIRMED | quality `:37` · muxonomy `serverToClient` lacks it (`cadmium.muxonomy.ts:151-166`) |
| STCP built · 9 files · 654 insertions | CONFIRMED | `git show --stat e212e42` |
| 3-part probe broadcasts ALL after rebuild (tally 3→7) · user-Lambda PASS | CONFIRMED | `STCP-DIAMOND-WGB.md` §5 (operator re-test) |

---

*Empirical Foundation*: STCP Diamond L2 · Foundation Salvo (S1·S2·S4·S6) + S3 Ochre blueprint + S4·S6 verify + S5 Cobalt at `e212e42` (9 files · 654 insertions · SCP tsc 0 · Vite 973ms · seam grep 0 · TQNI 4-site clean) · user-Lambda 3→7 probe PASS · STVI companion `a75fb25`.

*Maintained by*: Teal Claude (Suite 8 Conductor) — Pietersite Executor Full-Suite actualization. STCP instances are registered per-component as new Suite 8 domains adopt the JDCD pattern; the helper (`stcpComponentRelay.model.ts`) stays generic and untouched.

*Architect*: Micah Theodore Keller · STCP Diamond L2 (2026-06-03)

---

**End of SHATTERITE-TRANSFER-PATTERN.md**
