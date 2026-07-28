# SORD Tool System — Passing MCP Tools Through `/mcp` Without Loading Them

**Aspect**: How an SCP client (or any consumer) actuates a bridge MCP tool by passing a self-describing envelope to the bridge `/mcp` endpoint — the write/execution substrate beneath send_message, rename, anchor, relay, and the GitM turn-over. **Plus** the proven UI-UPDATE DIAMETER (the rendered UI mirrors a server-watched JSON; the client dispatch is ACK-only) and the GitM Conformance Checklist (§11) bringing the GitM Demometric Concept into the proven SCS-Bridge form.
**Version**: 1.1 (foundation + the proven UI-update Diameter + GitM conformance work-list — UPDATED after the Shield/Sword Bridge Turn-Over System is finalized)
**Origin**: Macro Diamond · Composed Shield-A/Sword-B Turn-Over · Suite 4 verification pass (Concluder-proven) · §9-§11 grounded in the SCS-Bridge proven patterns (send_message, session management, rename — production-proven)
**Complement**: SCP-S15 `MessagingMechanisms.md` (the SORD envelope §1 · the relay + Single-Writer §6) · SCP-S14 `DemometricConceptPattern.md` (the Huirth↔Client dual-face structure) · SCP-S12 `Communication.md` (the read-path)

---

## Pearl Summary

**SORD** = a means of actuating an MCP tool **without that tool being actively loaded** into the caller's tool registry. The caller forms a self-describing envelope (the tool name IS the opening tag — TNST) and passes it to the bridge's `/mcp` endpoint as a JSON-RPC `tools/call`. The bridge executes the tool and the result returns out-of-band (ACK-only; state arrives via a file-watcher relay, never the fetch body). The single load-bearing reason the system exists: **the bridge CLI is always stable, so recovery and git operations route through it — never through the SCP server, which a broken working branch may have bricked.**

---

## §1 · What SORD Is

A SORD call is a JSON-RPC `tools/call` POST whose `params.name` is the exact MCP tool name and whose `params.arguments` is the tool's argument object. The tool need not be registered in the caller — only in the **bridge's** tool registry (`scsBridgeScpToolRegistration.principle.huirth.ts`). The portable string form is the SORD envelope (`buildSordEnvelope`, `src/lib/bridge/sordEnvelope.model.ts:41`): the opening `《tool_name》` tag (TNST — Tag-Name-Is-Tool) + `ENDPOINT:` (the derived `/mcp` URL, `deriveMcpEndpoint`, `sordEnvelope.model.ts:35-39`) + `PARAMS:` + an optional `MESSAGE:`/`DIRECTIVE:` body. Whether sent as an envelope string (to a terminal) or a JSON-RPC body (over HTTP), the actuation target is identical: the bridge `/mcp`.

### The `/mcp` Dispatch Invariant (THE required shape — controller verb)

**EVERY tool call enters the bridge through the `/mcp` endpoint, issued from a controller verb.** The proven controller-verb family in `concepts/scsBridge/scsBridgeController.ts` is the canonical form — each builds `${bridgeJson.value.endpoint}/mcp`, POSTs a JSON-RPC `{ jsonrpc:'2.0', id:Date.now(), method:'tools/call', params:{ name, arguments } }`, and is **ACK-only** (drains `res.text()`, returns `{ ok }` from `res.ok`, never parses the body for state):

| Controller verb | Tool | file:line (exact) | Shape |
|---|---|---|---|
| `triggerSendMessage(sessionId, text)` | `send_message` | `scsBridgeController.ts:652-752` (url `:682`, fetch `:700`, drain `:725`) | the production reference |
| `triggerRenameSession(sessionId, name)` | `scp_rename_session` | `scsBridgeController.ts:758-803` (url `:773`, drain via `res.ok`) | **the template for new verbs** |
| `triggerGitmTurnOver(source)` | `gitm_turn_over_with_source` | `scsBridgeController.ts:811-852` (url `:820`, drain `:841`) | resilient anchor · Path B |
| `triggerGitmMean(tool, args)` | any `gitm_*` | `scsBridgeController.ts:858-897` (url `:867`, drain `:887`) | generic ACK-gated SORD mean |
| `triggerSetAnchor(sessionId)` | `scs_set_anchor_session` | `scsBridgeController.ts:904-948` (url `:918`) | same shape |

All five are byte-identical in transport: `const url = \`${bj.endpoint}/mcp\``, `fetch(url, { method:'POST', ..., keepalive:true })`, `await res.text()`, `return { ok: res.ok }`. **A new actuation copies this shape — it does NOT invent a new route or a new transport.**

#### Non-conforming deviations (the patterns GitM MUST migrate off — §11)

Two GitM actuation sites do NOT match the controller-verb-`/mcp` shape:

1. **`triggerGitmAction(tool, args)`** — `scsBridgeController.ts:1562-1590`. POSTs **same-origin `/gitm-action`** (`:1569`), NOT `${bj.endpoint}/mcp`. `/gitm-action` is an SCP-server forward route that does NOT exist in `dev:self` and is not the bridge `/mcp`. It is `void`/fire-and-forget (not awaitable), so it has no ACK step gate. Still wired into the controller return at `:1610`.
2. **`scsBridgeGitmActionPrinciple`** (`concepts/scsBridge/principles/scsBridgeGitmAction.principle.client.ts:39-167`) — the `gitmPendingAction` trigger-field watcher. It DOES fetch `${bridgeJson.endpoint}/mcp` (`:95`, fetch `:107`, ACK-drain `:131`), so its transport is correct — but it fetches **from inside a principle**, not from a controller verb. The dispatch discipline is "controller verb → `/mcp`"; a principle that owns its own fetch loop (Vue writes `gitmPendingAction`, the principle fires) is the structural deviation the conformance step collapses into a `triggerGitm*` verb.

These two are the GitM concept's work-list (§11). The transport target is already correct in (2); the structural placement is the deviation in both.

---

## §2 · WHY SORD — the Bricked-SCP Resilience Guarantee (load-bearing)

There are two independent processes:

| Process | Port | Runs | Failure mode |
|---|---|---|---|
| **SCP server** | :7700 | the SCP's OWN code (`ts-node ./src/index.ts`) | a broken working branch (B) can crash it / prevent boot — **bricked** |
| **Bridge CLI** | :7111 | the SCS-Bridge Electron process — independent of any SCP's code | **stable** — does not run SCP code |

A recovery action (turn over to a stable A) **must not depend on the SCP server being healthy** — the entire point of turning over is that B may have bricked it. Therefore git/recovery operations are issued as **SORD tools to the bridge `/mcp`** (the bridge performs the git ops on the SCP's repo from the outside via its gitm concept), **not** through the SCP server's own huirth quality.

This is why the proven Hard-Bridge-Turn-Over (`triggerHardTurnOver` → WS-Induction → SCP huirth `spawnSync git`) is the GROUND but **not** the resilient anchor: it requires the SCP server alive to receive the WebSocket action and run the switch. The SORD anchor (`gitm_turn_over_with_source` on the bridge) works even when the SCP is bricked. **The Shield-A recovery is SORD-routed for exactly this reason.**

---

## §3 · The Verified Client→Bridge Transport (Concluder-proven)

The working path is a **direct browser `fetch()` to the bridge `/mcp`** — cross-origin, and it works. The bridge `/mcp` already has CORS + Private-Network-Access configured (proven by every landing tool below). There is NO same-origin proxy and NO WebSocket hop in this path.

```
browser (SCP page :7700)
  → fetch(`${bridgeJson.endpoint}/mcp`, { method:'POST', body: JSON-RPC tools/call })   // cross-origin, WORKS
  → bridge :7111 /mcp handler → logs mcp.toolcall.received → executes the bridge quality
  → (side effect: gitm.json / sessions.json write) → file-watcher relay → client mirror updates
```

**The established controller idiom** (every one of these is a direct `/mcp` fetch — copy the shape, do NOT invent a new transport):

| Controller verb | Tool | Reference |
|---|---|---|
| `triggerSendMessage(sessionId, text)` | `send_message` | `scsBridgeController.ts:640-739` (url `:670`, fetch `:688`) |
| `triggerRenameSession(...)` | `scp_rename_session` | `scsBridgeController.ts:742-791` — **the template for new verbs** |
| `triggerRelayEnqueue(specs)` | `scs_relay_enqueue` | `scsBridgeController.ts:235` |
| `triggerSetAnchor` / `triggerDissipate` | `scp_*` | same shape |

**ACK-only discipline**: the fetch body is drained, never parsed for state (`scsBridgeGitmAction.principle.client.ts:128-131` RBDOS). State returns via the file-watcher relay (`gitm.json` → `scsBridgeGitmJsonWatcher` → broadcast → mirror). The awaited fetch resolving IS the completion signal.

---

## §4 · The Two Paths — When to Use Which

| | Path A — WebSocket Diameter | Path B — Direct `/mcp` SORD fetch |
|---|---|---|
| Mechanism | client Stratimux action → WS clientToServer → SCP huirth | controller `fetch(${endpoint}/mcp)` — no Stratimux, no WS |
| Reaches | the **SCP server** (huirth quality) | the **bridge CLI** (`/mcp` tool) |
| Survives a bricked SCP? | **NO** (needs the SCP alive) | **YES** (bridge is independent) |
| Use for | SCP-local state the SCP owns | git/recovery + anything that must survive an SCP brick |
| Example | `triggerHardTurnOver` (the proven ground) | `gitm_turn_over_with_source` (the resilient anchor), send_message |

The GitM turn-over migrates from Path A to Path B for resilience (§2).

---

## §5 · The gitm_* SORD Means ↔ gitm.json Correspondence

The bridge gitm concept registers ~30 gitm_* tools (`scsBridgeScpToolRegistration.principle.huirth.ts`). The turn-over-relevant means and the `gitm.json` state each reads/drives:

| gitm_* SORD mean | Args | gitm.json predicate it serves | Effect |
|---|---|---|---|
| `gitm_branch_create` | `{name, checkout}` | `!currentBranch.startsWith('b/')` & `changesPrimedOnB>0` | create `b/<stable>-<ts>` from HEAD, carry drift (`switch -c`) |
| `gitm_branch_switch` | `{name}` | recovery / merge-return | `git switch <name>` |
| `gitm_stage_all_and_commit` | `{message}` | `startsWith('b/')` & dirty | commit B's working tree |
| `gitm_confirm_success` | `{}` | `abMode:'turned-over'` | promote `abMode → 'success'` (enables merge) |
| `gitm_register_stable` | `{}` | A registration | mark current as `stableBranch` |
| `gitm_merge_working` | `{}` | `abMode:'success'` & `bMergeable` | merge B → A |
| `gitm_revert_to_stable` | `{}` | broken-B recovery | hard return to A |
| **`gitm_turn_over_with_source`** | `{source}` | ANY (terminal anchor) | `git switch` + write `.bridge-restart.json` → restart. **The resilient anchor.** Registered `:1299/:1305/:1497`; quality `gitmTurnOverWithSource.quality.ts` (switch `:158`, restart-file `:182`) |

---

## §6 · The Single SORD-Call Shape (copy this for a new verb)

```typescript
// In scsBridgeController.ts — mirror triggerRenameSession (:742-791). No new relay kind, no WS.
const triggerGitmTurnOver = async (source: string): Promise<{ ok: boolean; error?: string }> => {
  const bj = bridgeJson.value;
  if (!bj?.endpoint) return { ok: false, error: 'no bridge endpoint' };
  const body = {
    jsonrpc: '2.0', id: Date.now(), method: 'tools/call',
    params: { name: 'gitm_turn_over_with_source', arguments: { source } },
  };
  const res = await fetch(`${bj.endpoint}/mcp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
    body: JSON.stringify(body), keepalive: true,
  });
  await res.text();                 // ACK-only — drain, never parse for state
  return { ok: res.ok };
};
```

A **multi-step sequence** is just sequential `await` of these (the awaited ACK is the step gate); see the Shield/Sword time-stepped sequence in the Macro Diamond WGB.

---

## §7 · Verification (the Concluder)

Every `/mcp` `tools/call` logs `mcp.toolcall.received` to the bridge `debug.json`. This is the file-capturable proof a SORD call LANDED (client console is NOT captured). Proven:

```
$ curl -s -X POST http://127.0.0.1:7111/mcp -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"gitm_load_log","arguments":{}}}'
→ HTTP 200 · {"jsonrpc":"2.0","id":1,"result":{...gitmLoadLog ok...}}
# bridge debug.json: {"tool":"gitm_load_log","event":"mcp.toolcall.received"}
```

Post-implementation Concluder for any SORD tool: `grep '"tool":"<tool_name>"' <install>/Cascades/Bridge/debug.json`.

---

## §9 · The Demometric Concept Pattern — the Structural Reference (SCP-S14)

A concept in the SCP runtime is a **Demometer** measured from BOTH halves of the runtime: a **Huirth** Muxium (the Node server process) and a **Client** Muxium (the browser/Vue process). ONE logical concept, ONE shared name, TWO independently-created Stratimux concepts (DCFM — Dual-Concept Faceted Measure). Reference: SCP-S14 `DemometricConceptPattern.md` (§A-§D) and SCP-S15 `MessagingMechanisms.md` (§6 the relay + Single-Writer).

| Face | scsBridge | gitm |
|---|---|---|
| **Huirth (server)** | `scsBridge.concept.huirth.ts:68` `createScsBridgeHuirthConcept` | `gitm.concept.huirth.ts` `GitmHuirthState`/`GitmHuirthQualities` |
| **Client (browser)** | `scsBridge.concept.client.ts:98` `createScsBridgeClientConcept` | `gitm.concept.client.ts` `GitmClientState`/`GitmClientQualities` |
| **Shared name** | `'scsBridge'` (`scsBridge.type.ts:35`) | `'gitm'` |

**The two faces are joined by Diameter qualities crossing the WebSocket** (WSDM — WebSocket-as-State-Diameter). The WebSocket between `webSocketClient` (Client Muxium) and `webSocketServer` (Huirth Muxium) carries Stratimux ACTION OBJECTS (matching type-strings) executed on the receiving Muxium — the action type IS the Through-Measure. The junctions are declared in each concept's `actionExchange`:

- **`serverToClient`** — Huirth initiates, Client receives. scsBridge: `scsBridgeSetBridgeJsonRelay`, `scsBridgeSetSessionsListRelay`, `scsBridgeSetBridgeStatus`, `scsBridgeSetSessionTranscriptDataRelay` (`scsBridge.muxonomy.ts:350-393`). gitm: `gitmSetGitmJson`, `gitmSetUpdateDiff`, `gitmSetUpdateResolved` (`gitm.muxonomy.ts:112-135`).
- **`clientToServer`** — Client initiates, Huirth executes. scsBridge: `scsBridgeSendBridgeMessage`, `scsBridgeTriggerHardTurnOver` (`scsBridge.muxonomy.ts:338-349`). gitm: **empty** (`gitm.muxonomy.ts:113`) — GitM has NO client→server WS leg; its writes route through the bridge `/mcp`, and its reads return via the `serverToClient` relay. This is exactly the SORD shape: client → bridge `/mcp` (out-of-band of the WS), state back via the file-watcher relay.

**SBIS (Stratidian-Base-Informative-State)**: the Huirth state is the Base (source of truth, maintained by the watcher); the Client state is Informative (derived, broadcast-synchronized). The watcher dispatches a `...HuirthBase` action FIRST (Huirth-local reducer runs, Huirth selectors fire) then a `...Relay` action (`serverToClient` — broadcasts to the Client). The `...HuirthBase` quality is deliberately ABSENT from `actionExchange` (Huirth-only invariant — `gitm.muxonomy.ts:110-111`, `scsBridge.muxonomy.ts:279`).

---

## §10 · The UI-UPDATE DIAMETER — the rendered UI MIRRORS a server-watched JSON (CENTRAL)

**The client UI is NEVER the source of truth. It MIRRORS server-watched JSON.** A `/mcp` tool call mutates git/sessions and the bridge writes the JSON; the SERVER (Huirth) watches that file and relays the new snapshot across the WebSocket; the client reducer writes its state; the display principle syncs state → controller ref; Vue reads the controller ref reactively and re-renders. **The file watcher is authoritative; the client dispatch is ACK-only (fire-and-confirm); the rendered UI follows the watcher relay, not the dispatch response.**

### The full loop (file:line — scsBridge, the proven reference)

```
[1] controller verb POSTs /mcp tools/call (ACK-only)
      scsBridgeController.ts triggerSendMessage:652 / triggerRenameSession:758
      → bridge :7111 mutates → writes sessions.json / bridge.json
[2] SERVER (Huirth) WATCHES the file (chokidar)
      scsBridgeJsonWatcher.principle.huirth.ts:233 chokidarWatch(BRIDGE_JSON_PATH)
                                        :287 chokidarWatch(SESSIONS_JSON_PATH)
      on 'add'/'change' (debounced 100ms :58) → re-read JSON →
        nextA( ...SetBridgeJsonHuirthBase )   ← SBIS Base FIRST (:257-262 / :300-302)
        nextA( ...SetBridgeJsonRelay )        ← tagged serverToClient (:263-268 / :303-305)
[3] the Relay crosses the WebSocket via actionExchange.serverToClient
      scsBridge.muxonomy.ts:350-367 (scsBridgeSetBridgeJsonRelay / scsBridgeSetSessionsListRelay)
      → client reducer writes `state`
        setBridgeJsonRelay.quality.ts (reducer writes scsBridgeBridgeJson into client state)
        setSessionsListRelay.quality.ts
[4] the DISPLAY principle syncs state → controller ref
      scsBridgeDisplay.principle.client.ts:96-153
        selectors:[ k_.bridgeJson, k_.sessionsList, ... ] (:135-149)
        on change → controller.sync({ bridgeJson, sessionsList, ... }) (:117-132)
      → scsBridgeController.ts sync():361 → bridgeJson.value = state.bridgeJson (:366)
                                          → sessionsList.value = state.sessionsList (:372)
[5] Vue reads the controller ref reactively → re-renders
```

The awaited fetch resolving at [1] is the *completion* signal — NOT a state-carrier. State arrives only via [2]→[5]. An MCP call WITHOUT a server-side state write is a **one-armed Diameter** (the server changed but no client learned of it — SCP-S15 §6): the relay leg is the floor under every actuation.

### The GitM parallel (file:line — the same loop, gitm.json)

The GitM UI (Branches list, `abMode`, `changesPrimedOnB`, `bMergeable`, `commitsDivergenceCount`, `mergeEnabled`) MUST derive from the relayed `gitm.json` via `gitmController.gitmJson` — refreshed by the server's gitm-file watcher — NOT from any client-side optimistic state:

```
[1] a gitm_* SORD tool POSTs /mcp (today via triggerGitmAction:1562 / the principle:107 — see §11)
      → bridge mutates git → writes <bridgeRoot>/Cascades/Bridge/gitm.json
[2] SERVER (Huirth) WATCHES gitm.json
      gitmJsonWatcher.principle.huirth.ts:55-66 — STCP dir-watch + C1 first-load
      gitmRelay.config.ts:30 jsonPath = <BRIDGE_ROOT>/Cascades/Bridge/gitm.json
      on add/change → SBIS Base→Relay via createStcpComponentRelay(GITM_RELAY_CONFIG)
        baseActionCreator  → gitmSetGitmJsonHuirthBase  (Huirth-only · gitmRelay.config.ts:47-48)
        relayActionCreator → gitmSetGitmJson            (serverToClient · gitmRelay.config.ts:49-50)
      broadcast leg: gitmStcpRelay.principle.huirth.ts (SMRP on d.gitm.k.gitmJson + BOCR backfill)
[3] the relay crosses the WebSocket
      gitm.muxonomy.ts:114-119 serverToClient gitmSetGitmJson ('Gitm Set Gitm Json')
      → client reducer (gitmSetGitmJson.quality.client) writes gitm client state
[4] the DISPLAY principle syncs state → controller ref
      gitmDisplay.principle.client.ts:55-71 — SDPS, READ-ONLY (no dispatch shim)
        selectors:[ k_.gitmJson ] (:67) → liveController.sync({ gitmJson }) (:64)
      → gitmController.ts sync():119 → gitmJson.value = state.gitmJson (:120-122)
      → computeds derive: abMode:103, bMergeable:104, changesPrimedOnB:105,
        commitsDivergenceCount:107, mergeEnabled:110-114
[5] the A/B button group + Merge gate read gitmController computeds reactively → re-render
```

`gitmController.ts` is explicitly STATE-READ-ONLY (header §W4a, `:13-18`): it has NO dispatch method; every gate (`mergeEnabled`) and badge derives from `gitmJson`. This is the proven half. The deviation is only on the *write* side ([1]) — §11.

---

## §11 · GitM Conformance Checklist (the next cycle's work-list)

Bring the GitM Demometric Concept (Huirth + Client faces) into conformance with the proven SCS-Bridge form. The read/relay half (§10 GitM [2]→[5]) ALREADY conforms — the watcher → SBIS Base→Relay → `gitmSetGitmJson` serverToClient → `gitmController.gitmJson` loop is built and the UI derives purely from it. The work is the write half.

**(a) All dispatch through a controller verb → `/mcp`** — drop `/gitm-action` and the principle-fetch.
- [ ] **REMOVE** the same-origin `/gitm-action` POST: `scsBridgeController.ts:1562-1590` `triggerGitmAction` (route `:1569`), and its controller-return wire `:1610`. `/gitm-action` is not the bridge `/mcp` and does not exist in `dev:self`.
- [ ] **REMOVE / FOLD** the principle-owned fetch loop: `scsBridgeGitmAction.principle.client.ts:39-167` (the `gitmPendingAction` watcher; fetch `:107`). Its `/mcp` transport (`:95`) is correct, but the actuation must live in a controller verb, not a principle.
- [ ] **ADD/USE** a `triggerGitm*` controller verb mirroring `triggerGitmMean` (`scsBridgeController.ts:858-897`) — already conforming, awaitable, ACK-only, `${bj.endpoint}/mcp`. Vue stage/unstage/commit/branch-switch calls it directly instead of writing `gitmPendingAction`.

**(b) The GitM UI derives PURELY from the relayed `gitm.json`** (already conforming — keep as the invariant).
- [x] `gitmController.gitmJson` is the sole UI source; `abMode`/`bMergeable`/`changesPrimedOnB`/`commitsDivergenceCount`/`mergeEnabled` are computeds off it (`gitmController.ts:103-114`).
- [x] `gitmController.ts` is STATE-READ-ONLY (no dispatch method — `:13-18`).
- [ ] **VERIFY** no client-side optimistic mutation of `gitmJson` exists anywhere; the only writer of the client `gitm` state is the `gitmSetGitmJson` relay reducer.

**(c) The server gitm-file watcher is the single source feeding the relay** (already conforming — keep).
- [x] `gitmJsonWatcher.principle.huirth.ts:55-66` is the dir-watch + C1 first-load; `gitmStcpRelay.principle.huirth.ts` is the SMRP broadcast + BOCR backfill.
- [x] `gitm.json` lives in bridge-owned territory: `<BRIDGE_ROOT>/Cascades/Bridge/gitm.json` (`gitmRelay.config.ts:27,30`).
- [ ] **VERIFY** the SCP-Huirth side NEVER writes `gitm.json` directly (Single-Writer · SCP-S15 §6 — the bridge `/mcp` is the sole writer).

**(d) ACK-only client dispatch** — the awaited fetch resolving is the completion signal; state arrives via the watcher relay.
- [x] `triggerGitmMean` already drains `res.text()` and returns `{ ok: res.ok }` (`scsBridgeController.ts:887-891`) — copy this for every new GitM verb.
- [ ] **CONFIRM** no GitM verb parses the `/mcp` response body for state (state is gitm.json-watcher-only).

**Deviation sites catalogued (the exact work-list):**

| # | File:line | Deviation | Conformance action |
|---|---|---|---|
| D1 | `scsBridgeController.ts:1562-1590` (`triggerGitmAction`, route `:1569`) | POSTs same-origin `/gitm-action`, not `${bj.endpoint}/mcp`; `void` (no ACK gate) | REMOVE; replace callers with a `triggerGitm*` verb (mirror `triggerGitmMean`) |
| D2 | `scsBridgeController.ts:1610` | `triggerGitmAction` wired into controller return | REMOVE the wire |
| D3 | `scsBridgeGitmAction.principle.client.ts:39-167` (fetch `:107`) | actuation owned by a principle (the `gitmPendingAction` watcher), not a controller verb — transport correct, placement wrong | FOLD the fetch into a controller verb; Vue calls the verb directly |

---

## §8 · Forward (this document is UPDATED after the turn-over proves out)

This is the SORD foundation. After the **Shield/Sword Bridge Turn-Over System** is finalized and Lambda-proven (the state-dependent time-stepped sequences land via Path B), this document is updated with the proven sequences, then that knowledge is incorporated into the **SCP Researcher** and **SCS Bridge** Suite 8s on the basis of success. **Muxistration or nothing** — every claim here traces to a Concluder or a file:line; narrative-only entries are not added.
