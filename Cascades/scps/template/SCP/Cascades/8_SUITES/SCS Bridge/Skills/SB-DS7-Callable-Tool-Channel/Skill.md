# SB-DS7 · The Callable Tool Channel (the /mcp roster another session reaches)

*Skill added: DF4 · Cycle 677 (2026-07-19) — the callable tool surface, previously documented only as the single legacy `launch_scp`. The live roster is **78 tools**.*

**What this Skill carries**: how any session — another SCP, an agent, Claude Desktop — CALLS a bridge tool, and the full roster of what is callable. This is the surface the SCP Researcher's **SCP-S21** dual-Muxonomy load reaches for: SCP-S12 reads `bridge.json` output (WHAT is running); this Skill is HOW to call and WHAT is callable.

---

## Two `/mcp` surfaces — do not conflate

| Surface | Route | Port | Roster |
|---|---|---|---|
| **`scpDockHost`** (SB-S126 · legacy) | `POST /-mcp` | `state.dockServerPort` | `launch_scp` only (backward-compat POC) |
| **`scpExpressTransport`** (THIS Skill) | `POST /mcp` | the bridge port (`bridge.json.endpoint`) | the full `buildToolRoster()` — **78 tools** |

A caller targeting the full roster uses the **express-transport** route. `scpExpressTransport.principle.huirth.ts:290` receives; the `tools/call` case at `:377` routes by tool metadata.

---

## The callable-channel shape (the Loopback JSON-RPC Tool-Call Channel)

A caller reads `endpoint` from `Cascades/Bridge/bridge.json` (`bridgeMetadata.ts:251` writes `http://127.0.0.1:${port}` — **loopback only** post-DMF2; `scpExpressTransport.principle.huirth.ts:764` binds `host: '127.0.0.1'`, so the tool surface is unreachable from other LAN hosts). It DERIVES the call URL as `${endpoint}/mcp` — bridge.json carries no `/mcp` field; the caller appends it (`sordEnvelope.model.ts:35-39` `deriveMcpEndpoint`, trailing-slash-safe).

The call is `POST ${endpoint}/mcp` with a JSON-RPC 2.0 envelope:
```json
{ "jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": { "name": "<toolName>", "arguments": { ... } } }
```
(an optional `mcp-session-id` header is minted + echoed for stateful runs.) The handler looks the tool up by `name`, then routes by its metadata: a `strategyCreator` tool engages `createSCPStrategyManifold` (`:417`); a quality tool engages `createSCPQualityManifold` (`:457`). **The response is deferred** — held on the Express `res` until the manifold's `scpExtractAndSendResponse` tail fires (a 30s guard at `:487` unblocks a stall).

**The TQNI byte-identity binding**: each registration maps `toolName` (the wire name, e.g. `send_message`) → `qualityName` (the `scsBridge.e.` key, e.g. `scsBridgeSendMessage`). `createSCPQualityManifold` does `qualityEmitter[meta.qualityName]` — a mismatch silently no-ops. The channel end-to-end: **`bridge.json.endpoint` → `+/mcp` → JSON-RPC `tools/call {name,arguments}` → toolName-keyed registry → TQNI-bound quality → its Method's Lambda.**

## Origin threading (the FKIS guard — the load-bearing detail)

Some tools (`send_message`, the whole `gitm_*` family via `GITM_ORIGIN_SCHEMA_PROP`) need to know WHICH SCP is calling — and this is **not** supplied by the caller (unspoofable by design). The origin is resolved **server-side, env-first** inside the quality (`scsBridgeSendMessage.quality.huirth.ts:94-97`):
```
SCS_BRIDGE_ORIGIN_SCP ?? SCS_BRIDGE_SCP_NAME ?? payload.originScpName
```
The env vars are injected at SCP boot (`SCS_BRIDGE_SCP_NAME` in production, `SCS_BRIDGE_ORIGIN_SCP=template` under dev:self), so agent/dev callers stay server-authoritative. `payload.originScpName` is the FALLBACK gap-filler for the SHARED workspace bridge (which boots before any SCP is chosen and has neither env — its UI controller carries the origin from `scp.config.json` via `GET /scp-config`). **An interchange caller usually OMITS `originScpName` and the bridge routes to the active/calling SCP.**

---

## The roster (78 tools · `buildToolRoster()` in `scsBridgeScpToolRegistration.principle.huirth.ts`)

Concluder: `grep -oE "toolName: '[a-z0-9_]+'" scsBridgeScpToolRegistration.principle.huirth.ts | sort -u | wc -l` → **78** (47 `gitm_*` + 31 non-gitm). The `gitm_*` family (worktree + A↔B turn-over + git plumbing) is documented in **SB-DS8**. The non-gitm 31:

**Session launch / lifecycle**
| Tool | Required | Purpose |
|---|---|---|
| `scp_launch_session_management` | `scpName` | **PRIMARY launch** — SCP into the Session Management surface (Boot Overlay). |
| `scp_launch_runtime_only` | `scpName` | Launch runtime without the management surface. |
| `scp_launch_new_session` | `scpName` (+`model`) | New Claude session under a running SCP. |
| `scp_stop` | `scpName` | Stop a live SCP (recoverable · FSM dying→gone). |
| `install_scp` | `designation` (+`sourcePath`/`sourceUrl`) | Install a new SCP. |
| `dock_scp` | `scpName, scpPort, logEndpoint` | SCP runtime self-registration (→ SB-DS2). |
| `get_scp_logs` / `get_scp_status` | `scpName` / — | Read buffered logs / the connected registry. |
| `launch_scp` | `scpName` | LEGACY POC (do not default-use; the `/-mcp` surface). |
| `suite8_page_create` | (per schema) | Create a Suite 8 page (the `scs suite8:page` pipeline). |

**Anchor / Suite 8**
| Tool | Required | Purpose |
|---|---|---|
| `scs_spawn_suite8_session` | `suite8Name` (+`asWorker`/`model`/`fresh`) | Spawn the identified Suite 8 session (the anchor class · DF1 binding). |
| `scs_set_anchor_session` / `scs_unset_anchor_session` | `sessionId` | Set (clears siblings) / release the page Anchor. |
| `scs_set_anchor_config` / `scs_reset_anchor_config` | `suite8Name` (+`autoAnchor`) | Per-page auto-anchor policy. |

**Engage / focus / messaging**
| Tool | Required | Purpose |
|---|---|---|
| `scp_engage_session` | `sessionId` | Resume an existing conversation. |
| `scp_focus_session` | `sessionId` | Foreground the session's Electron window. |
| `send_message` | `targetUlid, text` | **Live keystroke stream** (FKIS · real-time). |
| `scp_chat_session` | `sessionId, message` | **Queued** inject (UIMJ queue · next turn-end). |
| `scp_rename_session` | `sessionId` (+`name`) | Rename (empty clears). |
| `scs_deliver_vermillion` | `sessionId, vermillion` | Deliver a Vermillion directive to a worker (live rail). |

**Session management**
| Tool | Required | Purpose |
|---|---|---|
| `scs_dissipate_session` / `scs_close_wait_dissipate` / `scs_archive_session` | `sessionId` | Remove+delete `.jsonl` / graceful close+dissipate / archive (all anchor-guarded except archive). |
| `scs_persist_last_turn` | `sessionIds[]` | Batch last-turn transcript persistence (single-writer). |
| `scs_bridge_bind_caller_session` | `callerSessionUlid, scpName` | **INTERNAL** SCSER callback (not for direct call). |

**Window / render / relay / misc**
| Tool | Required | Purpose |
|---|---|---|
| `scs_orchestrate_window` | `steps[]` | Neon PlayTester — atomic step sequence against a live window. |
| `scs_render_capture` | — | Neon PlayTester — PNG capture of a live window. |
| `scs_focus_bridge_window` | — | Foreground the Bridge UI window. |
| `scs_relay_enqueue` | `specs[]` | Serialized batch relay (prevents OS-focus collision). |
| `bridge_ping_pong` | `clientId, timestamp` | MCP-endpoint liveness handshake. |

> **The live vs queued Diameter**: `send_message` streams keystrokes in real time (for interactive dialogue — e.g. an NPC surface, RD-SHATTERITE-MENU-SESSION-INSTILLATION §II.1); `scp_chat_session` queues to the target's next turn-end (deferred, safe mid-turn).

---

## The Diameter to SCP-S21

This Skill is the mechanism the SCP Researcher's **SCP-S21 (Bridge-Architecture Interchange)** loads: when a "how does the bridge compose / how do I call it" question fires, the Researcher inline-loads THIS Instance to learn the callable-channel shape. SCP-S21 supplies the load protocol; this Skill supplies the channel it loads. For the `gitm_*` family and the worktree/turn-over tools, continue to **SB-DS8**.
