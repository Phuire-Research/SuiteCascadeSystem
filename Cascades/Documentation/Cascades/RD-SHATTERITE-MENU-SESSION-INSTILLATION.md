# Reference Design · The Shatterite Menu + Session Means Instillation
## Ground Truth for the IsomorphicExpanse Walk-Up

**Class**: Reference Design (RD) · gleanable · to be worked and expanded upon
**Commissioned for**: the IsomorphicExpanse SCP — whose Suite 8 **Entourage Forge** is designing the S8 Page for IsomorphicExpanse as of now
**Systems grounded**: (1) the Shatterite Menu System · (2) the SCS-Bridge SessionManager's messaging and session controls
**The subject**: IE's NPC carries a drafted proof-of-concept messaging system that just echoes back. This RD is the ground truth by which that echo is fully instilled with the Shatterite Menu — by IE's own means, walking up to it stage by stage.
**Authored**: Cycle 663 · from a three-rail grounding salvo (r4 system trace · r1 roster curation · r2 walk-up prospect), every contract Concluder-verified against the living code.

---

## §0 · THE NOVELTY — Why IsomorphicExpanse Is the Plain-as-Day Demonstration

IsomorphicExpanse is the most plain-as-day novelty in the system because it stages the Suite Cascade's deepest machinery — a persistent anchor agent authoring a live Shatterite Menu over a real session — as the oldest, most legible interface humans know: **walking up to a character and talking to them.** The NPC named "IsomorphicExpanse" (id `s8ie`) is not a mascot bolted onto the domain; it IS the domain concept given a body and a place to stand. Today it merely echoes — you type, and the Expanse repeats you back through a simulated responder whose own comments already name the day it will speak for real. That echo is the whole demonstration in miniature: the theater is fully built (the contract, the call site, the async speech bubble, even the latent option rows the dialogue tree carries but never shows), and only the actor behind the curtain is a mannequin. The walk-up replaces that mannequin one careful step at a time — first the echo rides a real session, then the character offers a standing menu, then a living anchor authors that menu turn by turn — until pressing "interact" on the NPC and summoning the Suite 8's anchor on its page are revealed to have been the same act all along. Nothing in the system is more novel and nothing is plainer: the frontier machinery and the childhood grammar of "go talk to that person" are, in IsomorphicExpanse, the same organ seen from two sides.

### The load-bearing Diameter — THE-TWIN-OPTIONED-SURFACE-ISOMORPHISM

The NPC's `DialogNode { text, options: DialogOption[] }` (IE `game/engine/types.ts:183-188`) and the Suite 8 page's `MenuStage { title, prompt, options: MenuOption[] }` (`src/model/shatteriteMenu.model.ts`) are the SAME SHAPE: a speaking surface bearing a prompt and a list of labeled choices. `DialogOption { id, text, nextNodeId }` maps nearly field-for-field to `MenuOption { label, kind, scsCommand }`. The Shatterite Menu is already a dialogue tree; the NPC dialogue tree is already a Shatterite Menu. **The walk-up is not building a new thing onto the NPC — it is revealing that the NPC dialogue panel and the Suite 8 anchor menu were always the same organ, and letting them converge.** This isomorphism is the structural spine of everything below.

---

## §I · THE SHATTERITE MENU SYSTEM

### I.0 The one-sentence Muxonomy

An **Anchor agent** (a live SCS-Bridge session bound to a page's Suite 8 designation) writes a `menu.json` file into its Extended directory; a **bridge dir-watcher (STCP relay)** parses it and broadcasts a `MenuStage` into the page muxium; **`ShatteriteMenu.vue`** renders that stage's options and, on click, dispatches curried SCS Commands back to the same live Anchor. The menu authors itself over time; the page is a pure render+dispatch surface holding no Muxium of its own.

The circuit, bidirectionally composed (circular = structural):

```
Agent.writes.menu.json ↔ Watcher.relays.MenuStage ↔ Page.renders.options ↔ Anchor.receives.dispatch ↔ Agent...
```

### I.1 The component — `ShatteriteMenu.vue`

**File**: template `src/concepts/suite8/vue/components/ShatteriteMenu.vue`

Props contract (lines 70-91):

```ts
interface Props {
  menuStage: MenuStage;          // REQUIRED · live agent-authored stage (page-muxium state)
  suite8Name: string;            // REQUIRED · the page's designation → finds its Anchor in sessionsList
  anchorAuthority?: boolean;     // ⚠ declared but NON-FUNCTIONAL — see Hazard H1
  title?: string;                // optional menu-zone header (falls back to stage title)
  defaultAssistPrompt?: string;  // default assist for an 'askMore' option carrying no scsCommand
  defaultStage?: MenuStage;      // static explainer shown when NO live stage exists (stageIndex < 0)
}
```

Emits: `option-selected` → `{ label, kind, ok }`.

**Live-wins-over-default (SDSD)**: `hasStage` (195-199) — a live stage (`stageIndex >= 0`) with options, else a non-empty `defaultStage`. `effectiveStage` (203-205) — the live menu.json stage ALWAYS wins; the static default only fills the `-1` seed gap.

**The S6 dispatch guard**: `optionsEnabled = anchorAlive && hasStage` (line 210). A static explainer RENDERS without an anchor, but only DISPATCHES with a live one. `anchorAlive = anchor?.status === 'launched'` where `anchor = resolveS8Anchor(sessionsList, suite8Name)` (108-123).

**The option dispatch** (`handleOption`, 693-760):

| `kind` | Behavior |
|---|---|
| `'scs'` | `ctrl.triggerSendMessage(target.id, option.scsCommand)` — relay the command to the Anchor |
| `'focus'` | `ctrl.triggerFocusSession(target.id)` — raise the Anchor terminal, no message |
| `'prime'` | SMSP skill-prime: `GET /suite8-skill-prime/<name>?ref=&kind=` → `{ envelope }` → `triggerSendMessage(target.id, envelope)` (657-691; one-shot 250ms retry on cold spawn) |
| `'askMore'` | focus + inject the assist prompt |

**The MOIS input surface** (`handleSubmit`, 879-959): an option carrying `inputConfig` renders an input row. `pairDirective` present → Submit sends `"<pairDirective> <userInput>"`; else the CEWT path sends `SCS:TopicUpdate <categories>` (whitespace tokenizer; `- _ . /` are intra-token connectors).

**The anchor pane** (the component owns the WHOLE anchor lifecycle — the page carries nothing):
- **Spawn + Anchor** renders when no anchor exists and `anchorSpawn === 'prompt'` → `triggerSpawnS8Session(suite8Name)` → 250ms/3000ms readiness poll → focus on launch.
- **Re-engage** renders when the anchor exists but is offline (orphan recovery) → `triggerEngageSession` (keeps isAnchor, sidesteps anti-flood).
- **Auto-Spawn toggle** reads/writes `anchorSpawn` via `GET/POST /suite8-anchor-spawn/<name>` (default `'prompt'` on any failure). `'auto'` runs settle-then-decide: alive → nothing · offline → re-engage · absent after 3s → spawn.

### I.2 The menu contract — `menu.json`

**Who writes it**: the Anchor agent, guided by the authoring doc prepended to every Anchor's onboarding — `src/lib/bridge/ShatteriteMenu.md`. One `MenuStage` OBJECT (never an array), whole-object rewrite each time, to:

```
<SCP cwd>/Cascades/Extended/<designation>/menu.json
```

Schema (byte-accurate to the parser, `parseMenuStage` at `suite8MenuRelay.config.ts:51-102`):

```json
{
  "stageIndex": 0,
  "title": "REQUIRED string — menu heading",
  "prompt": "optional string — one-line instruction",
  "options": [
    { "label": "string", "kind": "scs", "scsCommand": "SCS:...",
      "inputConfig": { "kind": "tags", "placeholder": "...", "options": ["..."], "pairDirective": "..." } }
  ]
}
```

Hard gates (the parser drops the WHOLE stage): `stageIndex` non-number · `title` non-string · `options` non-array.

**The stageIndex monotonic law**: the watcher suppresses re-broadcast on unchanged `payloadIdentity` (= `stageIndex`, config line 116). Re-using an index → the new stage NEVER appears. Increment every rewrite.

**Agents author three kinds** — `scs` · `focus` · `askMore`. See Hazard H2: `'prime'` in menu.json is silently downgraded to `'scs'` by the parser; skill-priming is a page-supplied `defaultStage`-only affordance.

**Who reads it**: `suite8MenuWatch.principle.huirth.ts` arms ONE chokidar FSWatcher per registered designation, each built from `createStcpComponentRelay<MenuStage>(createSuite8DesignationRelayConfig(name))`. Dispatch is Base-first (SBIS): `suite8SetDesignationMenuStageHuirthBase` (server Base state) THEN the client relay `suite8SetDesignationMenuStage`. Both reduce to `shatteriteMenus[designation] = menuStage`.

### I.3 The `S8.json` contract

**File**: `<SCP cwd>/Cascades/Extended/<designation>/S8.json` — additive, read-modify-write; every writer preserves unknown fields.

```json
{ "anchorSpawn": "auto" | "prompt", "boundSessionId": "<ULID>" }
```

- **`anchorSpawn`** — read/written by the `/suite8-anchor-spawn/:designation` routes (`vue.principle.ts:1063-1133`); sole POST caller is the menu's Auto-Spawn toggle; ANY read failure → `'prompt'`.
- **`boundSessionId`** — the DF1 durable binding (`src/lib/bridge/concepts/scsBridge/model/suite8Binding.model.ts`). SOLE writers = the three anchor seams (`setSessionAnchor` · `claimAnchorIfUnclaimed` · `unsetSessionAnchor` clears it) — single-writer discipline keeps it in lockstep with the registry's operational `isAnchor`. The spawn's absent-anchor leg consults it to RESUME a page's prior session across a wiped registry or fresh install. Root = `resolveOwningScpRoot(suite8Name)` first-match (the installed SCP whose `Cascades/8_SUITES/<name>/` exists).

### I.4 The anchor family (bridge server truth)

**Spawn three-branch liveness** (`scsBridgeSpawnSuite8Session.quality.huirth.ts:149-277`), with `existingAnchor = sessions.find(s => s.suite8Name === name && s.isAnchor === true)`:
1. **ALIVE** → surface/focus the existing window; skip duplicate.
2. **OFFLINE** → re-engage on the existing ULID (`fresh:true` instead re-mints + reclaims).
3. **ABSENT** → consult `readSuite8BoundSession`; resumable → `setSessionAnchor(boundSessionId)` + surface; else MINT: `createSession` → `setSessionSuite8Name` → `claimAnchorIfUnclaimed`.

**The ≤1-anchor-per-designation invariant** (`registry.ts`): `setSessionAnchor` (:645) clears `isAnchor` on every sibling of the same `suite8Name` and sets the target in ONE chainWrite (no two-anchor window); `unsetSessionAnchor` (:683) clears one entry only; `claimAnchorIfUnclaimed` (:717) auto-stamps only when no sibling holds the anchor and the per-page `autoAnchor` override permits. `isAnchor` SURVIVES `markAllSessionsOffline` — the page↔session binding persists across a bridge restart.

### I.5 The page integration recipe (the precedent: `Suite8HomeLanding.vue:379-415, 633-635`)

1. Get the global scsBridge controller; `sbController.setMuxium(muxium)` so triggers route (GPIM).
2. Hold `const menuStage = ref<MenuStage>(EMPTY_MENU_STAGE)`.
3. Subscribe the keyed relay via a stage-planner selector (Tier-2 DECK K):
```ts
muxium.plan<ClientMuxiumDeck>('suite8MenuStageSubscription', ({ staging, stage, d__ }) =>
  staging(() => [
    stage(({ d }) => {
      const record = d.client.d.suite8.k.shatteriteMenus.select() as Record<string, MenuStage>;
      menuStage.value = record[suite8Name.value] ?? EMPTY_MENU_STAGE;
    }, { selectors: [ d__.client.d.suite8.k.shatteriteMenus ] }),
  ]));
```
4. Compose: `<ShatteriteMenu :menu-stage="menuStage" :suite8-name="suite8Name" :default-stage="SUITE8_DEFAULT_MENU_STAGE" />`.
5. Ensure the designation is REGISTERED so the menu-watch arms an FSWatcher on its `Cascades/Extended/<name>/menu.json`.
6. Supply a `defaultStage` — the only place a `prime` option works.
7. The component owns the anchor lifecycle — the page carries nothing.

---

## §II · THE SESSION MEANS — Messaging + Controls

**Source of truth for every tool schema**: `buildToolRoster()` in `src/lib/bridge/concepts/scsBridge/principles/scsBridgeScpToolRegistration.principle.huirth.ts`. The TQNI invariant: `qualityName` must byte-match the `scsBridge.e.<key>` emitter — a mismatch silently no-ops.

### II.1 OUTBOUND — the two delivery paths

**PATH A — `send_message` (FKIS · live keystroke streaming · real-time):**

1. Client: `scsBridgeController.triggerSendMessage(sessionId, text) → Promise<{ok, error?}>` (`scsBridgeController.ts:853`) — POSTs `tools/call` `send_message` `{ targetUlid, text, originScpName }` to `${bridgeJson.endpoint}/mcp`; 8s abort; `originScpName` auto-resolved from this SCP's `scp.config.json`.
2. Bridge quality `scsBridgeSendMessage` — the FKIS Origin Guard: `SCS_BRIDGE_ORIGIN_SCP ?? SCS_BRIDGE_SCP_NAME ?? payload.originScpName` (env-FIRST; payload fills only the shared-workspace-bridge gap).
3. `dispatchFkisMessage` spawns detached → electron-main `case 'sendMessage'` (`cli-handler.ts:606`) → `executeFkis` (`src/main/messageDispatch.ts:50`): the FORF manifold — Focus-In → readiness ping-poll + textarea Concluder → 50-char chunk keystroke stream → `'\r'` submit → Focus-Return-Out. Per-ULID FIFO chain serializes concurrent sends.

**PATH B — `scp_chat_session` (UIMJ queue · DEFERRED to the target's next turn-end):**
`triggerChatMessage(sessionId, message)` → the `scp_chat_session` tool → atomic write to `~/.claude/pending-chat/{ulid}.txt` → the CHMH Stop hook injects it at the target's next turn-end.

> **The choice for an interactive surface (the NPC dialogue): PATH A.** `send_message`/`triggerSendMessage` is real-time; `scp_chat_session` is for targets that may be mid-turn where deferred delivery is acceptable. (A third internal transport, `scs_deliver_vermillion`, rides the same live rail with an `SCS:Vermillion` prefix — worker priming only.)

For MANY relays in sequence (multi-worker fan-out) use `scs_relay_enqueue` — a serialized batch of `{kind:'focus'|'send'|'resize'|'spawn', ...}` specs that prevents OS-focus collision.

### II.2 INBOUND — the return Diameter

The session's output reaches the client through **`sessions.json` as the Diameter** — there is NO separate chat-session object:

1. The Last-Turn extraction (`lastTurnExtraction.model.ts`, batched via the `scs_persist_last_turn` tool) pulls each session's last assistant turn from its Claude Code JSONL.
2. `registry.ts:853 updateSessionTranscriptSnippets` writes `transcriptSnippet` / `transcriptLastUserInput` / `transcriptLastModelOutput` / `transcriptLastReadAt` / `transcriptPath` onto the entry (plus live turn fields `finalTurnIndex` / `finalTurnSummary` / `lastActivityAt`).
3. The SCP-side chokidar watcher (`scsBridgeJsonWatcher.principle.huirth.ts`) reads `Cascades/Bridge/sessions.json` on change → Base dispatch + `actionExchange.serverToClient` broadcast → controller `sync()` → `sessionsList` ref.

**Consumer read surface** (the NPC reads these off its bound entry): `transcriptLastModelOutput` (the full last reply) · `transcriptLastUserInput` · `transcriptSnippet` (120-char) · `finalTurnSummary` · `isProcessing`.

### II.3 The control roster (session scope)

| Tool | Required args | Purpose |
|---|---|---|
| `scp_launch_session_management` | `scpName` | PRIMARY launch — SCP into the Session Management surface |
| `scp_launch_runtime_only` | `scpName` | runtime without the management surface |
| `scp_launch_new_session` | `scpName` (+`model`) | NEW Claude session bound to a running SCP |
| `scs_spawn_suite8_session` | `suite8Name` (+`scpName`,`asWorker`,`model`,`fresh`) | spawn the persistent identified Suite 8 session (the anchor class) |
| `scp_engage_session` | `sessionId` | resume an existing conversation (`claude --resume`; gated on `hasResumableIdentity`) |
| `scp_focus_session` | `sessionId` | raise the session's terminal window |
| `send_message` | `targetUlid`, `text` | PATH A live send |
| `scp_chat_session` | `sessionId`, `message` | PATH B deferred send |
| `scp_rename_session` | `sessionId` (+`name`) | set/clear displayName (≤32 chars; the ULID never routes by name) |
| `scs_set_anchor_session` / `scs_unset_anchor_session` | `sessionId` | anchor set (clears siblings) / release |
| `scs_set_anchor_config` / `scs_reset_anchor_config` | `suite8Name` (+`autoAnchor`) | per-page auto-anchor override |
| `scs_dissipate_session` | `sessionId` | remove + DELETE the real `.jsonl` (anchor-guarded) |
| `scs_close_wait_dissipate` | `sessionId` | graceful close → bounded wait → dissipate (anchor-guarded) |
| `scs_archive_session` | `sessionId` | MOVE the `.jsonl` → `Cascades/Archive/YYYY/MM/DD/` |
| `scs_relay_enqueue` | `specs[]` | serialized relay batch |
| `scs_persist_last_turn` | `sessionIds[]` | batch transcript extraction (the inbound rail's step 1) |
| `scp_stop` | `scpName` | stop a live SCP (recoverable; persists `pending`) |

### II.4 The client API (`scsBridgeController.ts` — what a page component consumes)

- **State refs**: `sessionsList: ShallowRef<ScsBridgeSessionEntry[]>` (the roster with transcript + status + anchor + processing fields) · `bridgeJson` · `bridgeStatus` · `connectionEstablished` · `bridgeActive`.
- **Binding**: `setMuxium(muxium)` (GPIM) — required before the void triggers route.
- **Two dispatch idioms**:
  1. *Muxium-dispatch void triggers* (need the bound muxium): `triggerEngageSession` · `triggerFocusSession` · `triggerChatMessage` · `triggerSpawnS8Session`.
  2. *Direct-fetch awaitable triggers* (`Promise<{ok, error?}>`): `triggerSendMessage` · `triggerRenameSession` · `triggerSetAnchor` / `triggerUnsetAnchor` · `triggerDissipate` · `triggerArchive`.

### II.5 The session entry (consumer-relevant `RegistryEntry` fields, `types.ts:114`)

`id` (ULID — THE routing key) · `claudeSessionId` (presence = resumable) · `status` (`allocated|launched|archived|offline`; `'launched'` is last-observed, not polled — deliberate opacity) · `cwd` · `displayName`/`scsLabel` (display priority: scsLabel > displayName > shortId) · `scpName` · `suite8Name` · `isAnchor` (survives offline sweep) · `isWorker` · `model` · `isProcessing` (**HAZARD-Z 3-value**: `undefined`=pre-D3D / `false`=OPEN / `true`=WORKING — compare with `===`, never truthy-coerce) · the transcript + turn fields (§II.2).

---

## §III · THE ISOMORPHIC EXPANSE GROUND

All IE paths relative to the IE SCP root: `Cascades/scps/IsomorphicExpanse/SCP/` (Lab-installed as its own repo).

### III.1 The NPC PoC map

- **The echo** — `src/concepts/isomorphicExpanse/game/vue/responder.ts:19-28`:
```ts
export const simulatedResponder: Responder = (input) => {
  /* 600-1200ms mock delay */ resolve({ text: `The Expanse echoes: "${input.text}"` })
}
export const responder: Responder = simulatedResponder;
```
The file's own header (lines 16-18) already names the walk-up: *"D5 replaces this implementation with a real ClaudeCode/SORD session that satisfies the SAME Responder contract — GameView's call site never changes; only this file's body swaps."*
- **The contract seam** — `Responder: (input: { text, npcId, dialogId }) => Promise<{ text }>` (responder.ts:1-11). **The single swap surface.**
- **The call site** — `GameView.vue:192-210 sendDialogMessage()`: push player message → `await responder(...)` → push NPC reply → catch pushes `'(...the Expanse is silent...)'`; `isProcessing` drives the typing bubble.
- **The latent options socket** — the dialogue tree ALREADY carries `options[]` (`game/engine/data/dialogs.ts:13-16`, `DialogOption` at `types.ts:175-181`) and the agent hook `getDialogState()` (GameView.vue:409) already exposes them — **but the chat panel (447-465) renders only free text.** The socket is pre-cut and unused.
- **The NPC** — `game/engine/data/npcs.ts:4-24`: id `s8ie`, name IsomorphicExpanse, `dialog: 's8ie_dialog'`, schedule all rest/home (it waits for you). `NPCSystem.ts` is pure pathing/schedule; dialogue lives entirely in the Vue layer.

### III.2 The Entourage Forge (IE-local: `Cascades/8_SUITES/Entourage Forge/`)

A **Conductor**-configured Suite 8 whose entire aspect is the PROCESS of minting other Suite 8s — creation only; at the close it hands the Suite 8 to its user. Its page-design mandate overlaps this RD exactly: the Forge does not design a marketing page — it **casts the Suite 8's own anchor grammar, and that grammar IS the Shatterite Menu**:
- **F1 Domain Elicitation**: the Forge's terminal IS the Conference surface — in-context Shatterite-shaped menus.
- **F5 The Actualization Close**: the minted Onboard.md closes with the STARTING MENU — the minted Suite's future anchor greets its user in the same menu grammar.
- **How it gleans this RD**: F2 Planned Query Conduction (Cadmium Researcher dispatch — Reference Designs land under the minted Suite 8's dir) and F4 Architecture Grounding (direct in-context read — "binds to the architecture as it IS, not as remembered"). This document is the F4 target for the IE S8 page work.

**The convergence law**: the S8 page the Forge is designing FOR IsomorphicExpanse and the NPC theater are the same deliverable seen twice. The Forge's F5 Starting Menu grammar is what the NPC's walk-up instills. Treat "design the S8 page" and "walk the NPC up to Shatterite" as ONE architecture, not two.

---

## §IV · THE WALK-UP — the staged instillation

Every stage is scoped by ONE question: *what crosses the `Responder` contract this stage?* (text → session-text → menu-stage). The call site never changes.

### Stage 0 — THE-SIMULATED-ECHO-TERMINAL (as-is · PROVEN)
Free text in, decorated free text out; no session, no menu, no anchor. What it already proves: the contract, the call site, the async UX (typing bubble, silence-catch). The theater stands; the actor is a mannequin.

### Stage 1 — THE-ECHO-RIDES-A-REAL-SESSION (the responder swap)
The NPC's input goes to a REAL bridge session; the reply is the session's real reply. Still free-text — but a living session behind it.
- **Files**: `responder.ts` ONLY — the body swaps to a `bridgeResponder`: `await triggerSendMessage(boundSessionId, input.text)` (§II.1 PATH A), then resolve when the reply lands.
- **The named risk — THE-AWAIT-OVER-DIAMETER-GAP**: the `Responder` contract promises a return value; the rail delivers via a later broadcast (the transcript fields on `sessionsList`, §II.2). Stage 1's real work is a Promise that resolves when the watcher lands the NPC's turn — watch `sessionsList` for the bound entry's `transcriptLastModelOutput`/`finalTurnIndex` to ADVANCE past the send-time value (the Round-Freshness idiom: compare against a captured pre-send marker, never presence alone), with `isProcessing === false` as the settle gate and a bounded timeout resolving to the silence line.
- **The binding**: hold the NPC's session by ULID. Prefer the anchor class — `triggerSpawnS8Session('IsomorphicExpanse')` and resolve via `resolveS8Anchor(sessionsList, name)` — so the DF1 `boundSessionId` gives the NPC continuity across restarts for free.

### Stage 2 — THE-PERSISTED-MENU-DEFAULT (the standing menu)
The NPC stops being a blank text box and OFFERS options — a statically-authored `MenuStage`-shaped menu, the game-world twin of `SUITE8_DEFAULT_MENU_STAGE`: *"The Expanse is quiet. For now."* + `[Summon Anchor]` `[Open Documentation]`.
- **Files**: GameView.vue's dialogue template gains an options render driven by the already-present `activeDialogNode.options` — **THE-LATENT-OPTIONS-SOCKET finally plugged**; `dialogs.ts` promotes `s8ie_dialog.options[]` from placeholder to real affordances; a thin adapter maps `DialogOption → MenuOption` (or renders the shared shape directly).
- **Contracts adopted**: `MenuOption { label, kind, scsCommand }` — a selected option dispatches its `scsCommand` down the Stage-1 rail. This static menu is where a `prime` option is legitimate (H2: defaultStage-only).

### Stage 3 — THE-ANCHORED-AGENT-AUTHORS-THE-NPC-MENU (the live instillation)
The full Shatterite circuit: the bound anchor authors the NPC's menu LIVE via `menu.json`, advancing stage-by-stage as the conversation proceeds — the NPC panel becomes a second consumer of the SAME relay the Suite 8 page reads.
- **Files**: GameView's dialogue panel subscribes `d.client.d.suite8.k.shatteriteMenus` exactly per the §I.5 recipe (or composes `ShatteriteMenu.vue` skinned as a dialogue box); `responder.ts` fattens from text-relay to menu-relay.
- **The named crossing — THE-ANCHOR-LIVENESS-GATE-CROSSING**: Stage 2's menu is dead (static rows, canned commands); Stage 3's menu is ALIVE only while the anchor is bound and launched (`optionsEnabled`). `doInteract()` (dialogue-open) takes on spawn/engage duty; `closeDialog()` decides whether the anchor persists (it should — the DF1 binding IS the NPC's memory); `isProcessing` becomes the anchor's live-thinking indicator.
- **The authoring side**: the anchor writes `Cascades/Extended/IsomorphicExpanse/menu.json` per §I.2 — three kinds, monotonic stageIndex, whole-object rewrite.

### Stage 4 — THE-NPC-IS-THE-PAGE
The convergence completes: walking up to `s8ie` and pressing interact is IDENTICAL to opening the IsomorphicExpanse S8 page and summoning its anchor. Same session, same `menu.json`, same anchor, same grammar — one rendered as a game dialogue box, one as a page menu. The walk-up is complete when there is no seam left between "talk to the NPC" and "engage the Suite 8."

---

## §V · THE HAZARD REGISTRY (Concluder-found · verify before relying)

| # | Hazard | Law |
|---|---|---|
| H1 | **`anchorAuthority` prop is non-functional** — the interface declares `anchorAuthority?` (ShatteriteMenu.vue:80) but the accessor reads the undeclared `noAnchorAuthority` (:97), so `isAnchorAuthority` is permanently `true`. | Do NOT rely on a non-authority menu instance until the prop/accessor mismatch is mended. Single-menu pages are unaffected. |
| H2 | **`kind:'prime'` is menu.json-invalid** — the parser (`suite8MenuRelay.config.ts:71`) accepts only `focus`/`askMore`, else `'scs'`; `primeRef`/`primeKind` are not forwarded. | Agents author `scs`/`focus`/`askMore`. Skill-priming lives ONLY in a page-supplied `defaultStage`. |
| H3 | **The two-roots Extended law** — `menu.json`/`S8.json` truth is SCP-LOCAL (`<cwd>/Cascades/Extended/<name>/`); the read routes' traversal base is the `8_SUITES` walk-up root; the bridge binding root is `resolveOwningScpRoot` first-match. | Three roots, three purposes — never conflate; an anchor agent whose cwd is the workspace writes the WRONG Extended unless it resolves the SCP root first. |
| H4 | **stageIndex reuse suppresses the stage** — unchanged `payloadIdentity` never re-broadcasts. | Monotonic increment, every rewrite. |
| H5 | **The BO-1 never-copied model law** — anchor lookups and the spawn route literal live in `s8Anchor.model.ts`, exempt from `suite8:page` token-rewrite (which would mangle `.suite8Name` and the route). | Always resolve through `resolveS8Anchor` / `s8AnchorSpawnPath`; never inline `.suite8Name` comparisons or route literals in a copyable component. |
| H6 | **HAZARD-Z** — `isProcessing` is 3-valued (`undefined`/`false`/`true`). | `===` comparisons only. |
| H7 | **`'launched'` is last-observed** — the bridge does not poll; a launched entry may have exited. | Liveness decisions compose status with the readiness poll / connection surfaces, never status alone. |
| H8 | **TQNI** — a tool's `qualityName` must byte-match its `scsBridge.e` emitter key; mismatch = silent no-op. | When extending the roster, Concluder the byte-match. |

---

## §VI · KEY FILE REGISTRY

**Template (the Shatterite side)** — `Cascades/scps/template/SCP/`:
`src/concepts/suite8/vue/components/ShatteriteMenu.vue` · `src/model/shatteriteMenu.model.ts` · `src/concepts/scsBridge/model/s8Anchor.model.ts` (BO-1) · `src/concepts/suite8/suite8MenuRelay.config.ts` · `src/concepts/suite8/model/suite8DefaultMenu.model.ts` · `src/concepts/vue/vue.principle.ts:1063+` (anchor-spawn + skill-prime routes) · `src/concepts/suite8/vue/Suite8HomeLanding.vue:379-415,633-635` (the page precedent) · `src/concepts/scsBridge/scsBridgeController.ts` (the client API) · `src/concepts/scsBridge/principles/scsBridgeJsonWatcher.principle.huirth.ts` (the inbound relay).

**Bridge (the session side)** — `src/lib/bridge/`:
`concepts/scsBridge/principles/scsBridgeScpToolRegistration.principle.huirth.ts` (ALL tool schemas) · `concepts/scsBridge/qualities/scsBridgeSendMessage.quality.huirth.ts` (FKIS + origin guard) · `concepts/scsBridge/qualities/scsBridgeSpawnSuite8Session.quality.huirth.ts:149-277` (three-branch spawn) · `concepts/scsBridge/model/suite8Binding.model.ts` (DF1) · `registry.ts:645/:683/:717` (anchor seams) · `lastTurnExtraction.model.ts` · `ShatteriteMenu.md` (the agent authoring doc) · `../main/messageDispatch.ts` (FORF).

**IsomorphicExpanse (the ground)** — `Cascades/scps/IsomorphicExpanse/SCP/`:
`src/concepts/isomorphicExpanse/game/vue/responder.ts` (THE swap surface) · `.../game/vue/GameView.vue:156-210,395-410,447-465` · `.../game/engine/data/{npcs,dialogs}.ts` · `.../game/engine/types.ts:175-195` · `Cascades/8_SUITES/Entourage Forge/{Instance,Skill,Conductor}.md`.

---

**The frontier vocabulary carried by this RD**: THE-TWIN-OPTIONED-SURFACE-ISOMORPHISM · THE-SIMULATED-ECHO-TERMINAL · THE-ECHO-RIDES-A-REAL-SESSION · THE-AWAIT-OVER-DIAMETER-GAP · THE-PERSISTED-MENU-DEFAULT · THE-LATENT-OPTIONS-SOCKET · THE-ANCHORED-AGENT-AUTHORS-THE-NPC-MENU · THE-ANCHOR-LIVENESS-GATE-CROSSING · THE-NPC-IS-THE-PAGE.

**End of Reference Design** — to be gleaned again for IsomorphicExpanse's usage, and expanded as the systems grow.
