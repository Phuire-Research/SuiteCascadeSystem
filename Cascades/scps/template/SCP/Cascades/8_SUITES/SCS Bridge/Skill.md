# SCS Bridge — Skills

**Suite 8**: SCS Bridge
**Configuration**: Conductor
**Skills**: SB-S1 through SB-S131 (SB-S127 = Bridge Discovery + MASN Activate Invocation Doctrine — agent-invoked two-step `jq -r .port ./Cascades/Bridge/bridge.json` project-local discovery → POST /mcp tools/call `scp_launch_session_management` (BMTI Activate Quality · composes ALHOC double-bind: Boot Overlay paint + scpSpawnManagerSpawnRequested); Skill IS the action, NOT instruction-mode; endpoint rename `/-mcp` → `/mcp` (no dash) propagated · `bridge.json` writeBridgeMetadata wired into scsBridgeMuxium startup post-scpDockHostStart; Diamond Manifold Completion · v8.5.0; SB-S126 = MCP Tool Call handler — `launch_scp` via POST `/mcp` · JSON-RPC 2.0 · `callingSessionId` → SCPs.json `sessions[]` append via chainWrite mutex · `scpSpawnManagerSpawnRequested` dispatched (same Quality as TUI L/Enter — TMTR · LOCK 2 idempotent) · `mcpProtocol.ts` + `scpSessionRegistry.ts` helpers · Diamond MCP-Skill; SB-S122..SB-S125 = `u` hotkey · Pewter HiFi confirmation modal · D5+D7 closed-box surface continuity · destructive-default-N safety asymmetry · CLI/TUI engine sharing added at Diamond B-26-PEWTER · v8.1 milestone; SB-S114..SB-S121 = `scs uninstall` first-class subcommand · manifest-driven reverse-muxify · schema v1/v2/v3 backward-compat · Iced-preserving round-trip · user-data dirs retention added at Diamond B-26 · Muxification Branch arc closure; SB-S113 = Suite 8 transition cognitive marker; SB-S103..SB-S112 = Stratidian Welcome arc · Strategy S8 · Shatterite-driven naming · conditional multi-Suite branching · memory probe · Cinnabar engagement · RI activation · First Diamond initiation · Pewter HiFi Welcome · Bridge-Agent handoff · UTSW Pearl added at Diamond B-25-UX · v8.0 milestone; SB-S99..SB-S102 = Path B routing for Muxified Path · drop-in SCS Manifold · Strategy S7 MuxifyUserClaudeMd · plain-text priming added at Diamond B-24-FIX; SB-S89..SB-S98 = Muxified Path · Iced folder · compose-not-replace · agent sub-namespace · manifest declarative-record skills added at Diamond B-24; SB-S82..SB-S88 = Muxification Branch Reference Design fixture + reversibility infrastructure skills added at Diamond B-23; SB-S76..SB-S81 = Pewter Diamond trust-confer HiFi v3 + arrow-nav + flicker resolution skills added at Diamond B-22; SB-S74..SB-S75 = responsive cascadesPresent + Reinstall re-scaffold skills added at Diamond B-21; SB-S69..SB-S73 = Install-Reinstall-Update lifecycle row skills added at Diamond B-20; SB-S66..SB-S68 = bridge-embedded Cascade.json skills added at Diamond B-19; SB-S61..SB-S65 = SCS Manifold particle sphere skills added at Diamond B-18; SB-S55..SB-S60 install-animation skill set added at Diamond B-17; SB-S46/S47/S51/S53 RETIRED — typeahead infrastructure superseded at B-16)
**Version**: 8.5.0

---

## SB-S127: Bridge Discovery + SCP Launch Invocation Doctrine

### MANDATORY Concluder Sequence (agent MUST execute in this order)

```
1. Verify current project root has Cascades/Bridge/ directory:
   test -d ./Cascades/Bridge/ || FAIL "not in SCS-installed project root"

2. Read bridge.json from project-local canonical path:
   PORT=$(jq -r .port ./Cascades/Bridge/bridge.json)

3. Invoke the SCP Launch tool · composes ALHOC double-bind:
   tool name: scp_launch_session_management
```

### Discovery Doctrine (Structural Law · Cycle 150 SAWSR Fuchsia Tier 0 calibration)

**BRDH · BridgeRoot-Derived-Never-Hardcoded**: discovery paths derive from the runtime invariant `bridgeRoot()` (returns `join(process.cwd(), 'Cascades', 'Bridge')` per `src/lib/bridge/paths.ts` · SB-S30 Project-Local Bridge State Substrate · Diamond O · v5.6). Skill literal-path citations are subordinate to the structural law. If the Skill body shows a literal path that conflicts with `bridgeRoot()`, the runtime-derived path WINS.

**PLBSS Cross-Reference** (SB-S30 substrate authority):
- `bridgeRoot() === join(process.cwd(), 'Cascades', 'Bridge')` · pure function · always project-local
- All downstream consumers (`debugLog.ts`, `bridgeStateFeed.ts`, `bridgeMetadata.ts`) derive from `bridgeRoot()`
- The home-directory path `~/.scs-bridge/` is ORPHANED — no bridge code writes there post-Diamond-O
- Skill citation drift (this Skill or others referencing the legacy path) IS a known training-bias attractor · ALWAYS prefer runtime-derived

**C5-VBA · C5-RI-Verify-Before-Acting Gate** (CLAUDE.md C5): "Memory records can become stale over time. Use memory as context for what was true at a given point in time. Before answering the user or building assumptions based solely on information in memory records, verify that the memory is still correct and up-to-date by reading the current state of the files or resources." Skill body text IS memory in this sense. Verify path existence + tool registration via probe BEFORE invocation.

**TLFD · Tools-List-First-Discovery Doctrine**: before invoking a hardcoded MCP tool name, probe `tools/list` to discover the PRIMARY tool dynamically. Skills age faster than the MCP surface evolves · tools/list IS the live truth.

```bash
# TLFD probe · discover PRIMARY launch tool dynamically (defends against SCSD)
PORT=$(jq -r .port ./Cascades/Bridge/bridge.json 2>/dev/null)
TOOLS=$(curl -s -X POST "http://127.0.0.1:$PORT/mcp" \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":0,"method":"tools/list"}' | jq -r '.result.tools[].name' 2>/dev/null)
# Pick the launch tool that mentions session_management (PRIMARY · composes ALHOC double-bind)
PRIMARY=$(echo "$TOOLS" | grep -E 'scp_launch_.*session_management' | head -1)
[[ -z "$PRIMARY" ]] && PRIMARY="scp_launch_session_management"  # fallback to canonical name
echo "PRIMARY launch tool: $PRIMARY"
# Then invoke $PRIMARY with scpName + callerSessionUlid (Step 2 below)
```

**SCSD Anti-Pattern** (Skill-Context-Staleness-Drift): agents load Skill content into context at session start · live Skill edits don't propagate to in-flight agents · TLFD + BRDH defend against this by deriving from RUNTIME state, not Skill literal text.

**Diamond**: Manifold Completion · v8.5.0 (Suite 5 Blue · Implement · Sequenced Placement)

**Domain**: Cascade-primitive doctrine for an install agent (Shatterite OR external Claude Code session OR any Bash-capable caller) to DISCOVER the running SCS-Bridge dockServerPort and INVOKE the SCP Launch MCP tool `scp_launch_session_management`. The Skill IS the action — NOT a recipe for the user to copy. The SCP Launch tool composes ALHOC double-bind (Boot Overlay paint + scpSpawnManagerSpawnRequested) — the agent observes the full launch sequence in the TUI overlay surface.

**Diameter Resolved**: prior 3-surface MCP reciprocity (TUI · PIBR · MCP-endpoint) was harmed by missing discovery — agents reading SM-SCP Stage I4 saw `{{DOCK_PORT}}` placeholder + curl recipe and defaulted to instruction-mode (printing to user). SB-S127 closes the Diameter by formalizing `bridge.json` as the discovery surface.

### The Two-Step Doctrine

**Step 1 · Discover** the live SCS-Bridge dockServerPort (Bash tool):

```bash
PORT=$(jq -r .port ./Cascades/Bridge/bridge.json 2>/dev/null)
WRITTEN_AT=$(jq -r .writtenAt ./Cascades/Bridge/bridge.json 2>/dev/null)
```

`bridge.json` is written by `scsBridgeMuxium` on startup at `./Cascades/Bridge/bridge.json` (project-local · canonical · single source of truth). Schema fields: `port` (live dockServerPort · ephemeral OS-assigned · NOT 7111) · `writtenAt` (epoch ms) · `endpoint` (`http://127.0.0.1:$PORT`) · `bridgeVersion` · `userCwd` · `boundScps` (Record) · `installedScps` (string[]).

**Staleness gate**: if `(Date.now() - WRITTEN_AT) > 3_600_000` (1 hour), treat as likely-stale — re-check after user restarts `scs`.

**Step 2 · Invoke** the SCP Launch tool via `/mcp` (Bash tool · only if Step 1 succeeded):

```bash
# callerSessionUlid MUST be the agent's REAL Bridge session ULID for SCSER
# backward Arc to bind correctly. Cycle 153 R3 fix: SCS_BRIDGE_ULID is NOT in
# claude's runtime env (only in hook command-prefix per spawnSettings.ts:53).
# Resolution precedence:
#   1. Registry cwd-match: find session entry where .cwd == $PWD and status is
#      launched/allocated; sort by spawnedAt; take most recent. This IS the
#      agent's own session per install pipeline registration.
#   2. SCS_BRIDGE_ULID env override (future-proof if ever propagated).
#   3. uuidgen fallback (non-install-agent contexts · WILL fail SCSER binding).
SESSION_ID=$(jq -r --arg cwd "$PWD" '.sessions | map(select(.cwd == $cwd and (.status == "launched" or .status == "allocated"))) | sort_by(.spawnedAt) | reverse | .[0].id' ./Cascades/Bridge/sessions.json 2>/dev/null)
[[ -z "$SESSION_ID" || "$SESSION_ID" == "null" ]] && SESSION_ID="${SCS_BRIDGE_ULID:-$(uuidgen 2>/dev/null || date +%s)}"
curl -s -X POST "http://127.0.0.1:$PORT/mcp" \
  -H 'Content-Type: application/json' \
  -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/call\",\"params\":{\"name\":\"scp_launch_session_management\",\"arguments\":{\"scpName\":\"$SCP_NAME\",\"callerSessionUlid\":\"$SESSION_ID\"}}}"
```

Response routes through `scpDockHostMcpToolsCall` (SB-S126) → BMTI Launch Quality `scsBridgeActivateScpSession` (SB-S129 · Option B narrow) → composes ALHOC double-bind: (a) `scpBootOverlay.scpBootOverlayShow` → Boot Overlay paints in TUI · (b) `scpSpawnManagerSpawnRequested` (TMTR · LOCK 2 idempotent · same Quality as TUI `L`/`Enter`) → immediate `{ status: 'spawning', url, port, bootRequestUlid }` envelope.

The `scp_launch_session_management` tool IS the canonical agent invocation surface for launching an installed SCP. It composes launch (Boot Overlay paint + spawn) — distinguishing it from `launch_scp` (legacy POC · spawn-only · NO overlay) by surfacing the TUI Boot Overlay, mirroring the TUI Enter-on-SCP-entry path (Cycle 148 ALHOC M130) and providing forward-compatibility for SCSER session binding (Rung 2 · D2.B).

### Pre-Invocation Concluders (Bridge Liveness Verification)

Before invoking `scp_launch_session_management`, the agent SHOULD verify SCS-Bridge liveness:

```bash
# Concluder A · bridge.json exists at project-local canonical path
test -f ./Cascades/Bridge/bridge.json || { echo "SCS-Bridge not running · ./Cascades/Bridge/bridge.json absent"; exit 1; }

# Concluder B · writtenAt freshness (< 1 hour)
WRITTEN_AT=$(jq -r .writtenAt ./Cascades/Bridge/bridge.json)
NOW_MS=$(($(date +%s) * 1000))
AGE_MS=$((NOW_MS - WRITTEN_AT))
[[ $AGE_MS -lt 3600000 ]] || { echo "bridge.json stale"; exit 1; }

# Concluder C · port reachable (optional · curl HEAD)
PORT=$(jq -r .port ./Cascades/Bridge/bridge.json)
curl -sf --max-time 2 "http://127.0.0.1:$PORT/mcp" -X POST -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":0,"method":"initialize","params":{"protocolVersion":"2024-11-05"}}' > /dev/null \
  || { echo "MCP endpoint unreachable"; exit 1; }
```

If ALL three Concluders pass → invoke `scp_launch_session_management` · MCP path viable.
If ANY Concluder fails → fall back to TUI engagement instructions · the user runs `scs` first.

### When to Invoke (Caller Surfaces)

| Caller | When | Why |
|---|---|---|
| **Shatterite agent** at `/cascade:scp-install` Stage I4 | Post-install · `[L]` selected | SM-SCP Stage I4 routes directly to this Skill (not instruction-mode) |
| **External Claude Code session** | Wants to engage an installed SCP from any project context | Agent registers itself as `callingSessionId` + boots the SCP server |
| **Cascade Loop / Automata Mode** | Auto-launch logic post-install | Same two-step · no user prompt |

### Failure Modes

| Failure | Cause | Remedy |
|---|---|---|
| `bridge.json` missing | SCS-Bridge not running | Instruct user: open new terminal · run `scs` |
| `bridge.json` stale (`writtenAt` > 1h) | Likely stale port from prior session | Re-check after user starts `scs` fresh |
| curl ECONNREFUSED | Port mismatch · bridge crashed | Re-discover after restart |
| MCP `-32602` invalid params | `scpName` not in SCPs.json registry | Validate designation via `scs scp list` first |
| MCP `-32601` method not found | Unknown tool name | Verify tool name is `scp_launch_session_management` (registered at Bridge boot per SB-S130 MCSC) |

### Stratimuxian Scholar Citations

- S10 Quality Creation Pattern 5 (advanced Method) — `scp_launch_session_management` routes to BMTI Launch Quality `scsBridgeActivateScpSession` (SB-S129) · composes ALHOC double-bind: `scpBootOverlay.scpBootOverlayShow` + `scpSpawnManagerSpawnRequested` · dispatch-origin-agnostic · this Skill makes the dispatch reachable from ANY Bash-capable agent context
- TMTR (TUI-MCP-Trigger-Reciprocal) extended: TUI keypress (Cycle 148 ALHOC double-bind) · BMTI MCP invocation doctrine (SB-S127 — this Skill) · BMTI Launch Quality (SB-S129) · MCSC translator (SB-S130)

### Frontier Pattern Citations

- **BDLI** · Bridge-Discovery-Local-Indirection (file-system mediated port lookup avoids hardcoded ports)
- **SIIAA** · Skill-Is-Invocation-Action-Always (anti-pattern: Credentialed-Lambda E6 if documented but never executed)
- **HRMSS** · Harmed-Reciprocity-Mended-via-Substrate-Skill (the bridge.json file IS the Diameter repair)

### Lambda Trigger

- `wc -c ./Cascades/Bridge/bridge.json` > 100 (project-local canonical path)
- `jq -r .port ./Cascades/Bridge/bridge.json` returns numeric ephemeral port (NOT 7111, NOT 0)
- `jq -r .writtenAt ./Cascades/Bridge/bridge.json` returns epoch ms within last hour
- curl returns 200 with `{"jsonrpc":"2.0","id":1,"result":{...}}` envelope containing `status: "spawning"`
- Browser tab opens at `http://localhost:{{boundBridgePort}}/` automatically (HPRD chain)

User-Lambda smoke: `/cascade:scp-install` → install completes → agent INVOKES SB-S127 (not instruction-mode) → SCP boots → browser opens.

---

## SB-S126: SCP Launch via MCP Protocol

**Domain**: MCP endpoint handler · external Claude session integration · Quality-as-Model-Function (LAMF)

**Endpoint**: `POST /mcp` · JSON-RPC 2.0 body · `GET /mcp` (capability info) — renamed `/-mcp` → `/mcp` in Manifold Completion Diamond per Suite 5 Blue directive.

**Three JSON-RPC methods routed**:
| Method | Result |
|--------|--------|
| `initialize` | Capability handshake · `protocolVersion: 2024-11-05` · `capabilities.tools: {}` · `serverInfo: { name: 'scs-bridge', version }` |
| `tools/list` | `{ tools: [LAUNCH_SCP_TOOL] }` with full JSON Schema `inputSchema` |
| `tools/call` | Dispatches `scpDockHostMcpToolsCall` Quality (Method-only · silent Reducer) |

**`launch_scp` Tool Call Payload** (within `params.arguments`):
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `scpName` | string | YES | Name matching `Cascades/SCPs.json` registry entry |
| `callingSessionId` | string | NO | Claude session UUID registering interest (generated if absent) |
| `mcpClientId` | string | NO | Optional MCP client identifier |

**Quality Method Flow** (`scpDockHostMcpToolsCall`):
1. Branch on `toolName`; unknown → JSON-RPC `-32601` (Method not found)
2. Validate `scpName` non-empty; missing → `-32602` (Invalid params)
3. Look up SCP record via `lookupScpRecord(scpName)` (reads `Cascades/SCPs.json`); missing → `-32602`
4. `appendSessionToScp(scpName, sessionId, 'mcp', mcpClientId?)` — chainWrite mutex + atomic tmp+rename (HIGH-3 resolution)
5. Generate `bootRequestUlid` via `ulid()`
6. `dispatchFromHandler(h => h.muxium.deck.d.scp.d.scpSpawnManager.e.scpSpawnManagerSpawnRequested(...))` — same Quality as TUI L/Enter (TMTR · LOCK 2 idempotent)
7. Immediate response `mcpToolsCallResponse(rpcId, { status: 'spawning', scpName, sessionId, bootRequestUlid, port, url })` — HPRD probe + browser open fire fire-and-forget inside SpawnRequested

**Response Envelope** (JSON-RPC 2.0 · `tools/call` success):
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "content": [{ "type": "text", "text": "{\"status\":\"spawning\",...}" }],
    "_meta": {
      "status": "spawning",
      "scpName": "Test011",
      "sessionId": "mcp-...",
      "bootRequestUlid": "01XXXXXX",
      "port": 7700,
      "url": "http://localhost:7700/"
    }
  }
}
```

**Dispatch Origin Agnosticism (TMTR)**: `scpSpawnManagerSpawnRequested` is dispatch-origin-agnostic. LOCK 2 (`getChildProcess(scpName) !== undefined → skip`) prevents double-spawn whether caller is TUI keypress OR MCP `launch_scp` invocation.

**Security**: endpoint binds to `127.0.0.1` via inheritance from `scpDockHostStart.quality.ts:113` (`app.listen(0, '127.0.0.1', ...)`); loopback-only · no external exposure. MVP trusts loopback. Future: `X-MCP-Token` header gate provisioned at startup, returned in `GET /mcp` capabilities.

**Helper Files**:
- `src/lib/bridge/mcpProtocol.ts` — JSON-RPC 2.0 envelope (`parseMcpRequest`, `mcpInitializeResponse`, `mcpToolsListResponse`, `mcpToolsCallResponse`, `mcpErrorResponse`) + `LAUNCH_SCP_TOOL` constant with `inputSchema` (HIGH-5)
- `src/lib/bridge/scpSessionRegistry.ts` — `appendSessionToScp` (chainWrite mutex + tmp+rename), `listSessionsForScp`, `lookupScpRecord` (mirrors `registry.ts:25-53` write pattern)

**Quality File**: `src/lib/bridge/concepts/scpDockHost/qualities/scpDockHostMcpToolsCall.quality.ts`

**Principle Mount**: `src/lib/bridge/concepts/scpDockHost/principles/scpDockHost.principle.ts` Surface 1 (after `/status` handler, before handlers-bound log).

**Stratimuxian Scholar Citations**:
- S1 Framework Foundation §Quality as Model Function — `launch_scp` IS the `scpSpawnManagerSpawnRequested` Quality, exposed as MCP tool
- S10 Pattern 5 (Method-Only Quality · Reducer returns `{}`)
- S12 Reducer Performance — shortest-path partial-state return
- S7 Dispatch Patterns — `dispatchFromHandler` for cross-Concept dispatch from Method body
- S8 Muxified Concept Access — Tier-2 deck path `d.scp.d.scpSpawnManager`

**Frontier Pattern Citations**: MCPE (parasitic route) · LAMF (Quality-as-MCP-tool identity) · MCQD (adapter Quality) · CSRA (atomic session-append) · TMTR (TUI+MCP dispatch reciprocal) · QECF (this Skill.md format) · MMCO (browser-open completes Manifold) · SBMS (this registration).

**R4 HIGH Resolutions**:
- HIGH-1 (JSON-RPC envelope) → `mcpProtocol.ts` envelope helpers
- HIGH-2 (initialize handshake) → `mcpInitializeResponse` with `protocolVersion: 2024-11-05`
- HIGH-3 (sessions[] write mutex) → `appendSessionToScp` chainWrite + tmp+rename
- HIGH-4 (async response strategy) → immediate spawning response with `bootRequestUlid` + `url`
- HIGH-5 (inputSchema for launch_scp) → `LAUNCH_SCP_TOOL` constant with full JSON Schema

**Lambda Trigger**: `npm run typecheck` exit 0 + `npm run build` exit 0 · `grep -c '/mcp\\|launch_scp'` in principle ≥ 3 · `test -f src/lib/bridge/mcpProtocol.ts` ok · `test -f src/lib/bridge/scpSessionRegistry.ts` ok · `test -f .../scpDockHostMcpToolsCall.quality.ts` ok · User-Lambda smoke now invokes SB-S127 (Bridge Discovery + Launch Invocation) — see SB-S127 above.

---

## SB-S1: Session Lifecycle

**Domain**: async non-blocking launch, status transitions `'allocated' → 'launched'`, `--no-launch`

**Spawn** (`scs bridge spawn`):
- Allocates a ULID (internal) + UUID (claude token) via `allocateClaudeSessionId()`
- Creates `~/.scs-bridge/sessions/<ulid>/` with: `heads/`, `body/`, `tails/`, `archive/`
- Writes `meta.json` with `{ id, claudeSessionId, status: 'allocated', spawnedAt, claudeBinary, cwd }`
- Registers session in `sessions.json` with ULID + UUID
- Default: calls `launchInformative(sessionId, 'new')` — async fire-and-forget
  → Opens a NEW terminal window running `claude --session-id <uuid>`
  → Bridge returns to prompt immediately (Pattern 6 *Base-Persistent Startup Composition*)
  → Bridge NEVER blocks on the spawned Claude session
- After `launchInformative` resolves: `status` transitions `'allocated' → 'launched'`; `terminalCommand` + `launchedAt` persist to meta.json
- `--no-launch`: allocates ULID + UUID, writes meta, registers — does NOT call `launchInformative`; status remains `'allocated'`
- `--cwd <path>`: sets working directory for launched session

**Attach** (`scs bridge attach <id>`):
- Looks up session ULID in registry → reads `claudeSessionId` from registry row
- Calls `launchInformative(sessionId, 'resume')` — async fire-and-forget
  → Opens a NEW terminal window running `claude --resume <uuid>`
  → Bridge returns to prompt immediately; the resumed Claude session opens in THAT new window
- Guard: if no `claudeSessionId` on record (e.g. `--no-launch` session that was never launched), errors clearly

**List** (`scs bridge list`):
- Reads `sessions.json` registry
- Counts queue files in heads/, body/, tails/, archive/ per session
- Tabular output: ID (ULID first 10) | STATUS | SPAWNED | HEADS | BODY | TAILS | ARCHIVE | CLAUDE-UUID (first 8)

**Status lifecycle**: `'allocated'` = ULID+UUID assigned but no terminal opened · `'launched'` = terminal window opened + `terminalCommand`/`launchedAt` recorded · `'archived'` = retired

Note: Bridge cannot observe ongoing Claude session state after launch (Pattern 4 *Opaque Informative State* / Pattern 5 *Tri-Priority Queue As Future Substrate* — the content of each Informative's conversation is opaque to Bridge).

---

## SB-S2: Message Composition

**Domain**: envelope construction, priority selection, sender semantics (queue infrastructure retained)

**Send** (`scs bridge send <sessionId> <content> --priority <level>`):
- Creates a `BridgeMessageEnvelope` with a new ULID `id`
- Writes the envelope as `<id>.json` to the corresponding priority folder
- Prints the new message ULID on success

**Note**: Queue files are written to disk (Diamond D substrate) but are NOT delivered to the running Claude Informative in Diamond C. Delivery activation is Diamond D territory.

**Priority Selection**:
| Priority | Folder | Use Case |
|----------|--------|----------|
| `head` | `heads/` | High-urgency; delivered first |
| `body` | `body/` | Normal; default |
| `tail` | `tails/` | Low-priority background context |

---

## SB-S3: Queue Discipline

**Domain**: tri-priority merge order — structural reference; Diamond D activation

The Tri-Priority Queue directories (`heads/`, `body/`, `tails/`, `archive/`) are created by every session allocation. The merge semantics (heads before body before tails; ULID sort within tier) are intact in `queue.ts` and `consumer.ts`. Queue-to-Informative delivery is deferred to Diamond D.

---

## SB-S4: Archive Reading

**Domain**: treating archive/ as session history — structural reference; deferred to Diamond D

The `archive/` directory persists as the session's communication history once Diamond D activates. Reading order: ULID filename sort = creation-time order. Files in archive/ carry `consumedAt` timestamps. This pattern is documented but inactive in Diamond C.

---

## SB-S5: Opaque Informative State

**Domain**: Bridge knowledge boundary — Pattern 4 *Opaque Informative State*

SCS Bridge knows:
- The UUID it allocated (`claudeSessionId` in meta.json)
- The ULID it allocated (`id` in meta.json)
- The cwd it passed to the launch call
- The `terminalCommand` used to open the terminal window
- The `launchedAt` timestamp when the window was opened
- The `status` field (`'allocated'` / `'launched'` / `'archived'`)

SCS Bridge does NOT know:
- What claude stored in `~/.claude/projects/`
- How many turns occurred in the Claude session
- What was said in the session
- Whether the Claude session is still running (Bridge has no live link to the child process after `child.unref()`)
- The content of any Claude Informative's conversation

**Boundary invariant**: the minimum integration contract is preserved by never reading or writing `~/.claude/` paths. Claude is opaque to SCS Bridge. If the UUID is valid and claude is installed, the session lifecycle works.

This is the intended composition boundary. Bridge is Base — the operational center. Each Claude Informative is an independent Demometer managing its own state. The Registry Mapping (ULID ↔ UUID ↔ status ↔ cwd) is the Diameter. There is no parent-child ownership across that Diameter.

---

## SB-S6: OS-Terminal Detection With Fallback Chain

**Domain**: `osTerminal.ts` per-OS builders + fallback chain + AppleScript boundary-quote discipline

**Module**: `src/lib/bridge/osTerminal.ts`

**Primary exports**:
- `detectTerminal(): { platform: Platform; terminalChoice: string }` — inspects `process.platform` + WSL markers
- `buildTerminalCommand(input: BuildTerminalCommandInput): BuildTerminalCommandOutput` — routes to per-OS builder
- `escapeForOsascript(s: string): string` — escapes `\`, `"`, `$` in cwd VALUES embedded in AppleScript strings
- `escapeForCmd(s: string): string` — Windows cmd.exe quoting

**Per-OS builders**:

| Platform | Command Shape | Notes |
|---|---|---|
| macOS | `osascript -e 'tell application "Terminal" to do script "cd \"<cwd>\" && claude <flag> <uuid>"'` | AppleScript boundary-quote discipline (see below) |
| Linux | `<terminal-choice> -- sh -c "cd <cwd> && claude <flag> <uuid>"` | `selectLinuxTerminal()` fallback chain |
| Windows | `wt.exe -d <cwd> -- claude <flag> <uuid>` | `cmd /c start` fallback; `detached: true` is cosmetic on Win32 |
| WSL | Detected via `/proc/sys/fs/binfmt_misc/WSLInterop` + `WSL_DISTRO_NAME`; pass-through to Linux path with TODO for path translation |

**Linux Fallback Chain** (`selectLinuxTerminal()`):
`x-terminal-emulator` → `gnome-terminal` → `konsole` → `xterm` — each probed via `which`; first found wins; all-absent throws with informative error.

**AppleScript Boundary-Quote Escape Discipline** (Rose mid-cycle circuit lesson):

The `escapeForOsascript` function escapes special characters (`\`, `"`, `$`) that appear WITHIN the cwd VALUE. However, the structural double-quote characters that wrap the path in the shell command inside the AppleScript string are template-literal constants — they are NOT part of the cwd value and are therefore NOT processed by `escapeForOsascript`.

When `inner` is embedded inside the outer AppleScript `do script "..."` string (which itself uses `"` as its string delimiter), those structural `"` chars would prematurely terminate the outer string unless they are themselves AppleScript-escaped as `\"`.

**Correct pattern** (line 59):
```typescript
const inner = `cd \\"${escapedCwd}\\" && claude ${flag} ${uuid}`;
```

The TypeScript `\\"` produces the two-character runtime string `\"`. When embedded in the outer AppleScript string via the template literal at line 60, those two characters are the AppleScript escape sequence for a literal double-quote. The osascript parser then reads the interior path as a properly-quoted shell string.

**Pre-fix symptom**: `osascript` received a syntactically invalid expression, exited non-zero, but `{ stdio: 'ignore' }` discarded stderr silently — Bridge printed the Terminal line and returned successfully while no window opened. This is the failure mode that only user-Lambda smoke can catch (unit tests with `.toContain()` assertions pass regardless).

**Distinction**: `escapeForOsascript` for VALUE escaping + `\\"` for BOUNDARY escaping are complementary disciplines addressing different embedding layers. Both are required.

---

## SB-S7: Persistent Menu Substrate

**Domain**: long-running TUI menu mode invoked via `scs bridge` (no subcommand) or `scs bridge menu`; Default-Spawn-First Boot Invariant; Live Registry Subscription via Filesystem Polling; Cursor-by-Identity Refresh Stability; Arrow-Key Cascade-Primitive Menu; Self-Closing Base Process

**Lifecycle**:
1. TTY check — `process.stdout.isTTY === false` → error + exit 1
2. Boot invariant — registry empty → `createSession()` + `launchInformative('new')` BEFORE first render
3. Enter alt-buffer + hide cursor; initial render
4. `fs.watchFile(registryPath(), { interval: 500 })` polls for changes; re-renders preserving cursor by ULID
5. `readline.emitKeypressEvents(stdin)` + `setRawMode(true)`; keypress handler dispatches `applyKeypress` → `KeyAction`
6. Self-close via `q`/`Esc`/`Ctrl+C`/`SIGTERM`/`SIGHUP` — ordered cleanup: unwatchFile → remove listeners → setRawMode(false) → SHOW_CURSOR → EXIT_ALT → process.exit(0)

**Keybindings**:
- `↑/k` cursor up (no wrap)
- `↓/j` cursor down (no wrap)
- `Enter` re-launch selected session in NEW window via `launchInformative(selectedUlid, 'resume')`
- `n` spawn new session via `createSession()` + `launchInformative('new')` (debounced via `spawnInFlight` flag)
- `q/Esc` close bridge — spawned Claude Informatives untouched (Pattern 6 invariant)
- `Ctrl+C/SIGINT/SIGTERM/SIGHUP` cleanExit

**Pure-function core (Layer 1 testable)**: `applyKeypress(state, key) → {newState, action}` and `renderMenu(state) → string`. Side-effecting `startMenu()` orchestrates lifecycle.

**Session Validity Probe** (`sessionValidity.ts`):
- `encodeCwdForClaudeProjects(cwd)` — replaces `/` with `-` to match Claude's directory encoding
- `claudeSessionJsonlPath(cwd, claudeSessionId)` — constructs `~/.claude/projects/<encoded>/<uuid>.jsonl`
- `checkSessionValidity(claudeSessionId, cwd, nowMs?)` — returns `'alive' | 'expired' | 'unknown'` via mtime probe (5h threshold); `'unknown'` if JSONL absent; non-destructive, no `claude` invocation required

**Synthetic Row Composition** (menu.ts):
- `SYNTHETIC_NEW = '__new__'` and `SYNTHETIC_CLOSE = '__close__'` identify synthetic rows by non-ULID ID
- `buildMenuRows(sessions, nowMs?)` produces `[synthetic-new, ...sessions, synthetic-close]` with validity probed per session row
- `preserveCursorAcrossUpdate` early-return guard for synthetic IDs; empty-sessions fallback selects `SYNTHETIC_NEW`

**Forward Note — Diamond E (Orphan-UUID)**: `--session-id <uuid>` is an intent declaration; Claude only persists JSONL when it self-assigns the UUID. Bridge-allocated UUIDs may yield sessions whose JSONL never appears on disk, surfacing as `'unknown'` validity. Diamond E resolves this via a SessionStart hook bundled in `--settings` — drop `--session-id` pre-assignment; capture Claude's real UUID from hook stdin.

---

## SB-S9: Animated SCS Bridge Logo Substrate

**Demometer**: The `src/lib/tui/` library — a composable, reusable TUI substrate. The 9-module set (`grid` · `overlay` · `modes` · `colors` · `terminalCaps` · `bridgeStateFeed` · `animatedTui` · `index` · their tests) constitutes a self-contained animation substrate that can be extended with new mode functions without modifying the frame loop.

**Actionable**: Implement new mode functions conforming to `ModeFn = (t: number, grid: Grid, caps: TerminalCaps) => void` and add to `STRATIDIAN_MODES` array in `modes.ts`. New modes appear automatically in the cycle rotation (mode index = floor(elapsed / 7000) % 6; expand `MODE_DURATIONS_MS` to add slots beyond 6).

**Diameter**: SB-S9 ↔ SB-S10 — the animation substrate (S9) provides the top pane; the session column viewport (S10) occupies the bottom pane. Together they compose the two-pane TUI launched by bare `scs`. SB-S9 ↔ SB-S6 (Persistent Menu Substrate) — the animated TUI wraps the existing `renderMenu` non-invasively; both keybinding sets (cursor + horizontal scroll) coexist.

**Frame-Body Invariant**: The 33ms frame body is **synchronous** — no `await` calls inside `renderFrame`. `handleResume` and `handleSpawn` fire-and-forget via `void` discard; their state mutations (`spawnInFlight`) surface on the next frame. Re-entrancy is prevented by a `frameRunning` boolean lock cleared in `finally`. Asynchronous work happens outside the frame; the frame is a pure read of cached state.

**Visual Vocabulary**: Stratidian — every mode is named for a Demometer-system primitive (CASCADE, DIAMETER, DEMOMETER, MUXAMETER, STRATIDIA, SUITE-WHEEL). The palette is the canonical 8-Suite color set from `colors.ts` `SUITE_COLORS`. No SCP-Origin animation content was carried across; the visual content is greenfield Stratidian.

**Lambda Trigger**: Wave 5 build gate — `npx jest --testPathPattern="modes|animatedTui|grid|overlay|colors|terminalCaps|bridgeStateFeed"` passes; `npx tsc --noEmit` exits 0; `npm run build` produces `dist/cli.cjs`.

---

## SB-S10: Horizontal-Scroll Truncated Session Column Viewport

**Demometer**: The `columnOffset?: number` optional field on `MenuState` and the `SESSION_COLUMNS: ColumnDef[]` array in `menu.ts`. Horizontal scroll allows the full session record to be traversed on narrow terminals without wrapping. Default `columnOffset === 0` (or `undefined`) preserves bit-identical render behavior to v3.x — verified by the `renderMenu columnOffset=0 stability` snapshot test.

**Actionable**: Extend `SESSION_COLUMNS` with new column definitions. Each `ColumnDef` provides `{ name, width, extract: (s: RegistryEntry) => string }`. **FIX-3 grounding**: `extract` operates on `RegistryEntry` (NOT a hypothetical `SessionEntry` — that type does not exist in this codebase). Active sessions are detected via `s.status === 'launched'` (NOT `s.isActive` — that field does not exist).

**Keybinding Composition**:
- `←` / `h` — `applyKeypress` returns `{ action: { type: 'scroll-left' }, newState: { ...state, columnOffset: Math.max(0, current - 1) } }`
- `→` / `l` — `applyKeypress` returns `{ action: { type: 'scroll-right' }, newState: { ...state, columnOffset: Math.min(current + 1, SESSION_COLUMNS.length - 1) } }` (**FIX-1 upper-bound cap**)

The vim-flavored `h`/`l` mirrors the existing `j`/`k` cursor pair; no key conflict (no prior keypress case used `h` or `l`).

**Diameter**: SB-S10 ↔ SB-S9 — the viewport (S10) occupies the bottom pane of the two-pane layout provided by the animation substrate (S9). Neither owns the other; both compose via `animatedTui.ts` frame loop reading `renderMenu(menuView)`. SB-S10 ↔ SB-S6 (Persistent Menu Substrate) — `columnOffset` is additive; existing menu invocation (`scs bridge menu`) initializes it to 0/undefined and is unaffected.

**Lambda Trigger**: Wave 7 build gate — `npx jest --testPathPattern="menu.test"` passes (65/65 — 56 pre-existing + 9 new horizontal-scroll tests); `grep -c 'columnOffset' src/lib/bridge/menu.ts` ≥ 5; FIX-1 cap verified by test.

---

## SB-S12: Head-Body-Tail Pane Composition with Page-Jump Body Navigation

**Domain**: Render-time discipline ensuring `renderMenu` emits exactly `state.termHeight` lines when `termHeight >= MIN_TERM_HEIGHT (6)` while structuring the bottom pane as **HEAD (fixed top, Viridian) + BODY (paginated) + TAIL (fixed bottom, Rose)**. Inverts Diamond G's Cursor-Tracking Minimal-Shift Viewport into a discrete page-jump pagination where Left/Right move between pages and Up/Down navigate within the current page bounded by HEAD and TAIL. Replaces Diamond G's `viewportTop` and Diamond F's `columnOffset` with a single `currentPage?: number` field.

**Demometer**: `src/lib/bridge/menu.ts` constants `RESERVED_LINES = 5` (header(2) + HEAD(1) + TAIL(1) + footer(1)) and `MIN_TERM_HEIGHT = 6`. The render contract: header (line 1 = title `(v0.10.0)`; line 2 = `N session(s) · Page X of Y · rows A-B[ · Spawning new session...]`) + HEAD row (`⊕ New Session` rgbToAnsi Viridian) + BODY of `termHeight - RESERVED_LINES` slots + TAIL row (`× Close Bridge` rgbToAnsi Rose) + footer (`↑/↓ navigate · ←/→ page · Enter activate · n new · q quit`). Final `padToHeight(allLines, termHeight)` is the safety belt.

**Three-Branch Render Contract**:

| Branch Predicate | Output |
|---|---|
| `!termHeight \|\| termHeight === 0` | `renderMenuLegacy(state)` — Diamond D/E/F/G backward compat |
| `0 < termHeight < MIN_TERM_HEIGHT` | `[terminal too small for menu]` padded |
| `termHeight >= MIN_TERM_HEIGHT` | header(2) + HEAD(1) + body(termHeight-5) + TAIL(1) + footer(1) padded |

**Page-Jump Algorithm** (`clampCurrentPage` + `getBodyPageSessions`):

```
visibleBodySlots = termHeight - RESERVED_LINES
filtered = filterGhostsOlderThan(sessions, 5min)
sorted = filtered.sort(DESC by spawnedAt)
totalPages = max(1, ceil(sorted.length / visibleBodySlots))
currentPage = clampCurrentPage(state.currentPage ?? 0, totalPages)
pageSessions = getBodyPageSessions(sorted, currentPage, visibleBodySlots)
```

**Page-Jump Cursor Discipline** (OQ-3 / OQ-7): Left/Right page changes preserve cursor position when it is on HEAD or TAIL (synthetic edges); otherwise the cursor resets to the first body row of the new page. `resetCursorOnPageJump(oldId, newPageSessions)` encodes this — a single helper called by both `page-left` and `page-right` handlers.

**Page-Bounded Cursor Discipline** (Up/Down within page): HEAD ↔ first body row ↔ ... ↔ last body row ↔ TAIL. Up at HEAD = silent no-op; Down at TAIL = silent no-op. Up at first body → HEAD; Down at last body → TAIL.

**FIX-3 Empty Body Discipline**: when `pageSessions.length === 0`, Up at TAIL → HEAD (skip body); Down at HEAD → TAIL (skip body); HEAD/TAIL remain reachable on empty pages.

**FIX-2 Color Composition** — HEAD and TAIL emit colors via `rgbToAnsi(SUITE_COLORS.Viridian, caps)` and `rgbToAnsi(SUITE_COLORS.Rose, caps)` from `src/lib/tui/colors.ts`. `caps` is detected at module load via `detectTerminalCaps()`. Truecolor terminals get `\x1b[38;2;R;G;Bm`; 256-color terminals get `\x1b[38;5;Nm` via `rgbTo256` mapping.

**Keybinding Composition**:

| Key | Action | newState |
|---|---|---|
| `←` / `h` / `PgUp` / `b` | `page-left` | `currentPage = max(0, page-1)`; cursor preserve HEAD/TAIL else first body row |
| `→` / `l` / `PgDn` / `f` | `page-right` | `currentPage = min(maxPage, page+1)`; same |
| `↑` / `k` | `cursor-up` | Page-bounded HEAD↔body↔TAIL |
| `↓` / `j` | `cursor-down` | Page-bounded mirror |
| `Home` / `g` | `cursor-home` | `currentPage = 0` + cursor → HEAD |
| `End` / `G` | `cursor-end` | `currentPage = maxPage` + cursor → TAIL |
| `Enter` | (validity-gated; SB-S13) | ghost/unknown → noop + stderr; else `resume-selected` |

**WARN-1 Defensive Cell-Sanitization**: `formatSessionRow` runs each cell value through `safeCell(s) = s.replace(/\n/g, ' ')` so an embedded newline in a cwd or status field cannot break the line-count invariant.

**Diamond H Registry-Refresh Discipline** — in `src/lib/tui/animatedTui.ts`, the `watchFile(registryPath())` callback simply swaps `sessions` (`menuState = { ...menuState, sessions: newSessions }`). `clampCurrentPage` applies on next render; no `updateViewport` indirection. Diamond G's OQ-2 wrapping is removed because page state is computed afresh at render time from `state.currentPage`.

**Pane-Aware Render Contract** (cross-tool invariant): any future Suite 8 tool composing into the bottom pane MUST emit exactly `state.termHeight` lines. The Layer-1 invariant test in `src/lib/tui/animatedTui.test.ts` codifies this for the SCS Bridge baseline tool — extension tools (archive viewer, search filter, message routing) inherit this contract.

**Diameter**: SB-S12 ↔ SB-S9 — HBT pane (S12) fills the bottom pane provided by the animation substrate (S9). SB-S12 ↔ SB-S13 — Per-row 5-state validity column (SB-S13) composes into S12 body row formatter. SB-S12 ↔ SB-S7 — `renderMenuLegacy` preserves SB-S7 Persistent Menu Substrate verbatim; bare `scs bridge menu` invocation never sets termHeight, inherits legacy render unchanged. SB-S12 supersedes SB-S11 (Diamond G) but does not delete it — historical context preserved in CHANGELOG.

**Lambda Trigger**: Wave 6 build gate — `npx jest --testPathPattern="bridge/menu"` passes 101/101; Wave 7 — `npx jest --testPathPattern="tui/animatedTui"` passes 9/9; Wave 9 — `npm run build` produces `dist/cli.cjs` exit 0; `node dist/cli.cjs --version` prints `0.10.0`; `npm pack --dry-run` enumerates 5 files invariant.

---

## SB-S13: 5-State Session Validity Probe — DEPRECATED (Diamond I · v5.0)

**Status**: DEPRECATED. Filesystem-probe of `~/.claude/projects/<encoded>/<uuid>.jsonl` (size + mtime) violated Pattern 4 *Opaque Informative State* by reading Claude-owned filesystem state. Diamond I retired this Skill in favor of registry-as-source-of-truth (SB-S15) plus PID-based liveness polling (SB-S14). The 5-state model is replaced by 2-state derivation from registry presence (`pending` / `alive`). The `sessionValidity.ts` module + test were DELETED (Wave 11 of Diamond I); 21 tests removed from the suite.

**Migration pointer**: state derivation now lives in `menu.ts::deriveSessionState(entry: RegistryEntry): SessionState`. See SB-S15 below for the structural law that prohibits re-introducing this Skill.

**Historical record (preserved below for trajectory continuity)**:

**Domain**: Filesystem-metadata probe of a registry session's state along five orthogonal Demometers — `'alive' | 'expired' | 'empty' | 'unknown' | 'ghost'`. Extends Diamond D's 3-state model (`'alive' | 'expired' | 'unknown'`) with two new states surfacing the empirical failure modes of Bridge-allocated sessions:
- `'ghost'` names registry entries whose `claudeSessionId` is undefined (the SessionStart hook never fired — Diamond E's Pattern 5 *Late-Bound Claude Session Identity* visible failure mode)
- `'empty'` names JSONL files that exist but contain no conversation content (size < 3KB, the empirical threshold from Amethyst Vermillion WebSearch)

**Demometer**: `src/lib/bridge/sessionValidity.ts` — function `checkSessionValidity(claudeSessionId: string | undefined, cwd: string, nowMs?: number): SessionValidity` and constant `EMPTY_SIZE_THRESHOLD = 3072`.

**Algorithm**:

```typescript
if (!claudeSessionId) return 'ghost';        // 1. ghost
if (!cwd) return 'unknown';                  //
if (!existsSync(jsonlPath)) return 'unknown'; // 2. unknown
const stats = statSync(jsonlPath);
if (stats.size < 3072) return 'empty';        // 3. empty (FIX-1: strict `<`)
const ageMs = nowMs - stats.mtimeMs;
return ageMs < FIVE_HOURS_MS ? 'alive' : 'expired'; // 4. alive · 5. expired
```

**FIX-1 Boundary Discipline** (Viridian): the size check uses strict `<` so `size === 3072` falls through to the age check (treated as alive when mtime within 5h). `size === 3071` returns `'empty'`. This boundary is verified by test `FIX-1: returns 'alive' when size = 3072 + mtime within 5h`.

**Pattern 4 *Opaque Informative State* Preservation**: `statSync` reads only file METADATA — `size` (bytes), `mtimeMs` (millisecond modification time). Bridge does NOT open or read the JSONL contents. The 3KB threshold is a structural upper bound: a JSONL with no user/assistant message turns is below this size; one with at least one full turn is above. The threshold is *opaque* in the same sense — Bridge can probe whether content exists without inspecting what it says.

**Filter-on-Read Discipline** (`filterGhostsOlderThan`): ghost entries older than 5 minutes are filtered from menu rendering but kept on disk. The 5-minute window covers slow-system hook firings (typical fire is ~100ms); after 5 minutes a missing hook capture is presumed permanent. Manual archival via `scs bridge archive <id>` remains the user-initiated cleanup path; auto-archive is deferred (Approach 2 in Amethyst Vermillion WebSearch carries write-on-read race risk).

**Pre-Launch Validity Probe**: in the `'return'` keypress handler, when the cursor is on a real session row, `checkSessionValidity` is invoked synchronously. Ghost or unknown sessions block resume with a stderr message (`[scs] cannot resume session <id> (<state>); skipping`) and return a `noop` action. Race window is negligible (statSync between probe and launchInformative).

**FIX-4 Per-Row Validity Column**: `formatSessionRow` displays the 5-state validity per session row in a 7-character column between status and cwd. Session rows now read: `<indicator> <ulid10>  <uuid8>  <status>  <validity>  <cwd>  <relative-time>`. `formatBodyPage` calls `checkSessionValidity` per row at render time — cost is bounded by `visibleBodySlots` (typically 5-30) per render frame, well within budget.

**Keybinding Diameter**: SB-S13's pre-launch probe gates SB-S12's `Enter` action — every resume-selected dispatch passes through validity check first. The Diameter is a one-way Informative gate (probe informs action), not a state mutation.

**Diameter**:
- SB-S13 ↔ SB-S12 — validity column composes into S12 body row formatter; pre-launch probe gates S12's Enter dispatch
- SB-S13 ↔ Pattern 4 *Opaque Informative State* — preserved by reading only `statSync.size` + `mtimeMs`, never JSONL content
- SB-S13 ↔ Pattern 5 *Late-Bound Claude Session Identity* (Diamond E) — ghost state surfaces the visible failure mode of late-bound identity capture

**Lambda Trigger**: Wave 1 build gate — `npx tsc --noEmit` exits 0; Wave 2 — `npx jest --testPathPattern="sessionValidity"` passes 21/21 (5 ghost/unknown + 4 empty + 6 alive/expired + 6 boundary/encoding tests); Wave 9 — `npm pack --dry-run` enumerates 5 files invariant.

---

## SB-S14: Child Process PID Liveness Polling (Diamond I · v5.0)

**Domain**: Non-destructive PID liveness probe via `process.kill(pid, 0)` (POSIX signal-0 existence check) running on a 2-second interval inside `animatedTui.ts`. Replaces SB-S13's filesystem probe with a kernel-mediated existence query. Bridge gains a true liveness handle on each Claude CLI process via the `process.ppid` capture in the SessionStart hook (the parent PID of the hook process IS Claude's PID).

**Demometer**: `src/lib/bridge/liveness.ts` — pure functions `isPidAlive(pid: number): boolean` and `probeLivenessTick(sessions: RegistryEntry[], nowMs?: number, staleAgeMs?: number): { aliveIds, deadIds, staleIds }`; constant `STALE_AGE_MS = 5 * 60 * 1000`. Side-effect-free: caller (`animatedTui.ts`) owns the `removeSession` mutations.

**Algorithm — `isPidAlive`**:

```typescript
if (!pid || pid <= 0) return false;
try {
  process.kill(pid, 0);  // signal 0 = existence check, never sends an actual signal
  return true;
} catch (err) {
  if (err.code === 'EPERM') return true;  // process exists, different uid
  return false;                            // ESRCH or other → dead
}
```

**Algorithm — `probeLivenessTick`**:

```typescript
for each session in sessions:
  if session.claudePid !== undefined:
    isPidAlive(session.claudePid) ? aliveIds : deadIds
  else:
    (Date.now() - session.spawnedAt) >= staleAgeMs ? staleIds : aliveIds  // pending; let hook fire
```

**PID Capture Point** (`sessionStartHook.ts`): `const claudePid = process.ppid;` captured between stdin parse and `updateSessionLiveIdentity(ulid, claudeSessionId, claudePid)` call. `process.ppid` is POSIX-standard and available on macOS, Linux, WSL, and Windows. The hook process is spawned by claude as a child; its parent IS the claude CLI invocation that wants tracking.

**Integration Loop** (`animatedTui.ts`):

```typescript
const LIVENESS_TICK_MS = 2000;
const FIRST_TICK_LOG_THRESHOLD = 5;

livenessInterval = setInterval(async () => {
  if (exited) return;
  try {
    const currentSessions = await listSessions();
    const { deadIds, staleIds } = probeLivenessTick(currentSessions);
    const removalIds = [...deadIds, ...staleIds];
    if (livenessFirstTick) {
      livenessFirstTick = false;
      if (removalIds.length >= FIRST_TICK_LOG_THRESHOLD) {
        process.stderr.write(`[scs] cleaned up ${removalIds.length} pre-Diamond-I orphan entries\n`);
      }
    }
    for (const id of removalIds) await removeSession(id);
  } catch { /* never crash the tick */ }
}, LIVENESS_TICK_MS);
```

`clearInterval(livenessInterval)` fires in `cleanExit` BEFORE `unwatchFile(registryPath())`. Sequential `await removeSession(id)` is acceptable for typical session counts; registry tmp+rename is atomic — race-free.

**Pattern 4 Preservation**: kernel process table is system metadata, NOT Claude state. `process.kill(pid, 0)` issues no signal; no Claude-owned file is read. The 5-min stale-age window covers slow hook firings (typical fire is ~100ms); after 5min a missing PID is presumed permanent (hook never fired).

**FIX-3 First-Tick Transparency** (Viridian audit): when ≥5 pre-Diamond-I orphan entries are removed on the first tick after upgrade, a one-line stderr message names the count. Migration grace for users with accumulated stale registry entries (~28+ orphans documented at design time).

**Diameter**:
- SB-S14 ↔ SB-S15 — PID polling IS the mechanism by which the registry remains the source of truth
- SB-S14 ↔ Pattern 4 *Opaque Informative State* — SB-S14 is the technical proof that liveness can be polled without crossing the Diameter into Claude's state
- SB-S14 ↔ Pattern 6 *Base-Persistent Startup Composition* — Bridge process owns the tick interval; Claude processes remain independent Demometers
- SB-S14 ↔ SB-S13 (DEPRECATED) — replacement; the architectural inversion that makes Pattern 4 grep-verifiable

**Lambda Trigger**: Wave 5 — `liveness.ts` exists at `src/lib/bridge/liveness.ts`; Wave 6 — `npx jest --testPathPattern="bridge/liveness"` passes 10/10 (3 isPidAlive bucket tests + 4 probeLivenessTick bucket tests + boundary tests); Wave 9 — `animatedTui.ts` setInterval/clearInterval pair verified by Layer-1 invariant tests in `animatedTui.test.ts`; Wave 14 — `grep -rn "claude/projects\|sessionValidity" src/ | grep -v ".test.ts"` returns ZERO matches.

---

## SB-S15: Registry-Detached Operation (Pattern 4 Structural Law) · Diamond I · v5.0

**Domain**: Architectural invariant elevating Pattern 4 *Opaque Informative State* from guideline to grep-verifiable structural law. Bridge code reads exactly two information sources: (1) its own registry I/O (`~/.scs-bridge/sessions.json` plus per-session meta.json), (2) kernel-mediated PID existence (`process.kill(pid, 0)` via SB-S14). Bridge code does NOT read `~/.claude/projects/` or any Claude-owned filesystem state. The structural law is enforceable via grep.

**Demometer**: the absence of any `~/.claude/projects/` reference in `src/` (excluding `.test.ts`). Verifiable by:

```bash
grep -rn "claude/projects\|sessionValidity\|checkSessionValidity" src/ | grep -v ".test.ts"
# MUST return ZERO matches
```

**Negative-Space Pattern**: SB-S15 is what the architecture does NOT do. Future Suite 8 tools that need session liveness state MUST use `deriveSessionState(entry: RegistryEntry)` (SB-S14 substrate) — they MUST NOT re-introduce filesystem probing of Claude state. Any code review surfacing such a regression invokes SB-S15 by name.

**The Three Permitted Information Sources**:

| Source | Permitted? | Reason |
|---|---|---|
| Bridge's own registry (`sessions.json`) | YES | Bridge owns this state |
| Bridge's own meta.json (per-session) | YES | Bridge owns this state |
| Kernel PID existence (`process.kill(pid, 0)`) | YES | System metadata, not Claude state |
| Bridge env (`process.env.SCS_BRIDGE_ULID`) | YES | Bridge owns this channel |
| Claude's `~/.claude/projects/<uuid>.jsonl` | **NO** | Violates Pattern 4 |
| Claude's stdout/stderr | **NO** | Bridge does not capture; Claude owns its terminal |
| Claude's hook stdin (`session_id` JSON) | YES (write-only on Bridge side) | Hook is the dual-write bridge — Claude → Bridge handoff point |

The hook stdin row is subtle: the SessionStart hook reads JSON from Claude's stdin pipe to extract `session_id`, but this is the singular permitted handoff Diameter — Claude is the source, Bridge is the destination, and the value transferred is exactly `session_id` (the UUID Bridge already allocated and passed via `--session-id`). No content is read.

**Diameter Eliminations**:
- `menu.ts ↗ sessionValidity.ts` — DELETED (entire module retired)
- `menu.ts ↗ ~/.claude/projects/*` — never existed; preserved as never-existing
- `animatedTui.ts ↗ ~/.claude/projects/*` — never existed; preserved
- `liveness.ts ↗ filesystem` — never; only kernel PID table

**Diameter**:
- SB-S15 ↔ SB-S14 — SB-S14 is the technical mechanism; SB-S15 is the architectural law it makes geometrically lockable
- SB-S15 ↔ Pattern 4 *Opaque Informative State* — SB-S15 IS Pattern 4 elevated to grep-verifiable status
- SB-S15 ↔ SB-S13 (DEPRECATED) — SB-S15 names what SB-S13 violated; deprecation enforced via deletion + grep gate
- SB-S15 ↔ Pattern 6 *Base-Persistent Startup Composition* — Bridge persists across many Claude lifetimes precisely because it is registry-detached

**Lambda Trigger**: Wave 14 audit gate — `grep -rn "claude/projects\|sessionValidity\|checkSessionValidity" src/ | grep -v ".test.ts"` exits with ZERO production matches. Build-time structural law: any future Diamond that re-introduces a forbidden read fails this grep and is rejected at audit. Recommend future Diamond add this grep as a `pretest` hook to prevent regression.

---

## SB-S16: Debug Logging Pipe via `--debug` Flag (Diamond J · v5.1)

**Status**: ACTIVE. Optional observability surface that pipes structured trace events to `~/.scs-bridge/debug.log` as JSONL when the user invokes any `scs` subcommand with `--debug`. Default OFF — zero CPU/IO cost when the flag is absent. Flag is a top-level commander option on the root `scs` program; `.hook('preAction')` ensures `setDebugEnabled(true)` fires before any subcommand handler runs.

**Module**: `src/lib/bridge/debugLog.ts` — five exports: `setDebugEnabled(boolean)`, `isDebugEnabled()`, `log(event, payload?)`, `debugLogPath()`, `closeDebugLog()` (no-op forward-compatible). Module-level boolean guard; on `log()`, early-return when disabled before any `mkdirSync` / `JSON.stringify` / `appendFileSync` is touched.

**JSONL Format**: each entry is `JSON.stringify({ ...payload, ts: ISO8601, event }) + '\n'` — payload spread FIRST so canonical `ts` and `event` fields cannot be shadowed by caller-supplied keys (Green Audit Angle 2 fix). One line per event, `tail -f`-able and `jq`-queryable without a parser.

**Event Inventory (POC set)**:

| Event | Payload | Site |
|---|---|---|
| `registry.add` | `{ulid}` | `registry.ts:addSession` |
| `registry.update` | `{ulid, claudeSessionId, claudePid}` | `registry.ts:updateSessionLiveIdentity` |
| `registry.remove` | `{ulid}` | `registry.ts:removeSession` |
| `manager.create` | `{ulid}` | `manager.ts:createSession` |
| `manager.launch` | `{ulid, mode}` | `manager.ts:launchInformative` (pre-spawn) |
| `manager.launched` | `{ulid, pid, mode}` | `manager.ts:launchInformative` (post-write) |
| `spawn.attempt` | `{ulid, mode}` | `spawn.ts:launchClaudeWindow` (entry) |
| `spawn.complete` | `{ulid, pid}` | `spawn.ts:launchClaudeWindow` (success) |
| `spawn.error` | `{ulid, message}` | `spawn.ts:launchClaudeWindow` (catch) |
| `spawnSettings.write` | `{ulid, path}` | `spawnSettings.ts:writeSpawnSettings` |
| `hook.fire` | `{ulid, claudeSessionId, claudePid, source}` | `sessionStartHook.ts` (post-update) |
| `cursor.reconcile` | `{before, after, reason}` | `animatedTui.ts:watchFile` (when prevUlid !== nextUlid) |
| `liveness.tick` | `{aliveCount, offlineCount, staleCount}` | `animatedTui.ts:livenessInterval` (when offlineIds + staleIds > 0) — Diamond K: `deadCount` renamed to `offlineCount` reflecting semantic flip |
| `hook.exit` | `{ulid, claudeSessionId}` | `sessionEndHook.ts` (post-update) — Diamond K |
| `registry.offline` | `{ulid}` | `registry.ts:markSessionOffline` — Diamond K |
| `tui.cleanExit` | `{}` | `animatedTui.ts:cleanExit` |

**Process-Boundary Carry-Through**: when bridge is invoked with `--debug`, `spawn.ts:29` env block conditionally adds `SCS_BRIDGE_DEBUG: '1'` alongside the proven `SCS_BRIDGE_ULID` env var (Diamond E precedent). The hook subprocess reads `process.env.SCS_BRIDGE_DEBUG` at entry and calls `setDebugEnabled(true)` — same Carry-Through shape as `SCS_BRIDGE_ULID`.

**Confidence-By-Proxy Caveat (Green Audit Angle 6)**: SCS_BRIDGE_DEBUG propagation to the SessionStart hook subprocess crosses TWO process boundaries: bridge → terminal/claude → hook. Bridge → claude inheritance is direct env spread. Claude → hook inheritance depends on Claude Code passing inherited env unfiltered to its hook subprocesses. SCS_BRIDGE_ULID is functionally required (hooks fire correctly today) so reasonable confidence holds; SCS_BRIDGE_DEBUG inherits this confidence by proxy. **Degradation mode**: if Claude Code strips the env, the hook silently does not log — no crash, no behavior change to the bridge. Documentation-only risk; non-blocking.

**Spam Guards**: `cursor.reconcile` logged only when `prevUlid !== nextUlid` (OQ-1 resolution); `liveness.tick` logged only when `removalIds.length > 0` (OQ-2 resolution). Estimated <100 entries per typical session.

**Append-Only POC**: `appendFileSync` per call (no stream lifecycle); `mkdirSync({ recursive: true })` is cheap and idempotent. `closeDebugLog()` exported as forward-compatible no-op for future `createWriteStream` upgrade if profiling shows I/O contention.

**Pattern 4 Preservation**: log payloads contain ULID + UUID identifiers + integer counts only. NEVER message content, prompt text, token counts, API keys, or anything from `~/.claude/projects/`. The debug.log path itself is bridge-owned (`~/.scs-bridge/debug.log`) — outside project tree, excluded from npm pack.

**Diameter**:
- SB-S16 ↔ Diamond E (SCS_BRIDGE_ULID env Carry-Through) — second instance of the same env-var propagation mechanism; pattern is now proven across two payloads
- SB-S16 ↔ SB-S15 (Pattern 4 Structural Law) — debug log payloads are designed to satisfy SB-S15 by construction; the Wave 14 grep gate passes post-Diamond-J
- SB-S16 ↔ Diamond I (cursor.reconcile + liveness.tick) — these events are the inspectable trace surface for Diamond I's behavioral invariants; what was previously implicit is now grep-verifiable in the log
- SB-S16 ↔ CD-10 candidate (Zero-Cost Opt-In Observability Diameter) — promotable to coronation post user-Lambda smoke confirms `tail -f ~/.scs-bridge/debug.log` shows JSONL on live session activity

**Lambda Trigger**: Diamond J Wave gates — `npx tsc --noEmit` exit 0; `npm test` 305 → 313 PASS; `npm run build` exit 0 producing 67.80 KB `dist/cli.cjs`; `npm pack --dry-run` 5 files invariant; Wave 14 Pattern 4 grep ZERO; `node dist/cli.cjs --version` prints `0.12.0`; `node dist/cli.cjs --help` includes `--debug` flag line. User-Lambda smoke (TUI + tail -f debug.log) gates final coronation of CD-10.

---

## SB-S17: SessionEnd Hook Event-Driven Offline Marker (Diamond K · v5.2)

**Status**: ACTIVE. Symmetric counterpart to the SessionStart hook (Diamond E). Where SessionStart writes `claudePid + claudeSessionId` to the registry row when a Claude Informative starts, SessionEnd CLEARS `claudePid` and SETS `status='offline'` when that Informative exits gracefully (terminal close, `/exit`, claude exits naturally). The hook PAIR closes the session lifecycle Diameter — identity-write at entry, identity-clear at exit, both event-driven via Claude Code's hook surface.

**Hook event name**: `SessionEnd` (NOT `Stop` — `Stop` fires per-turn when the assistant response ends, wrong semantic). `SessionEnd` is the canonical Claude Code hook event for process exit. Registered alongside `SessionStart` at the top-level `hooks` key in the spawn settings JSON.

**Module**: `src/lib/bridge/sessionEndHook.ts` — single export `runSessionEndHook(): Promise<void>`. Mirrors `runSessionStartHook` shape exactly: ULID guard via `process.env.SCS_BRIDGE_ULID`, debug-flag propagation via `SCS_BRIDGE_DEBUG`, stdin read via `readStdin()` (re-imported from `sessionStartHook.ts` — no duplication), JSON parse, `markSessionOffline(ulid)` call, `log('hook.exit', { ulid, claudeSessionId })`, `process.exit(0)` always (success and error paths alike).

**Plumbing**:
- `src/commands/__hook.ts` — adds `session-end` subcommand parallel to `session-start`. Dispatcher uses Commander's `.command(...).action(...)` chaining (matches existing pattern, not a switch).
- `src/lib/bridge/spawnSettings.ts` — `SpawnSettings` type extends with `SessionEnd` array; `buildSpawnSettings` writes BOTH `SessionStart` and `SessionEnd` hook entries to the JSON. Same `SCS_BRIDGE_ULID` env-var injection per Diamond E precedent.
- `src/lib/bridge/registry.ts` — adds `markSessionOffline(id)` using the same load → find → mutate → saveRegistry pattern as `updateSessionLiveIdentity` and `removeSession`. Atomic tmp+rename inherited from `saveRegistry` (still unexported). Sets `status='offline'`, clears `claudePid`. PRESERVES `claudeSessionId` (load-bearing for resume) and `cwd`.

**Pattern 4 Preservation**: `markSessionOffline(id)` receives a ULID string; the hook reads `SCS_BRIDGE_ULID` env + stdin JSON `session_id` (opaque Claude session UUID, not a path). No `~/.claude/projects/` access. Wave 14 grep returns ZERO matches in production code.

**Diameter**:
- SB-S17 ↔ Diamond E (Late-Bound Claude Session Identity) — symmetric complement; the PAIR is the structural Diameter
- SB-S17 ↔ SB-S18 (Three-State Session Visibility) — SB-S17 is the fast-path event signal that emits the `'offline'` state; SB-S18 is the Demometer extension consuming it
- SB-S17 ↔ SB-S16 (Debug Logging Pipe) — adds `hook.exit` event to the JSONL inventory; same Carry-Through env path as `hook.fire`

**Lambda Trigger**: Diamond K Wave gates — `npx tsc --noEmit` exit 0; `npm test` 313 → 329 PASS; `npm run build` exit 0 producing 69.43 KB `dist/cli.cjs`; `npm pack --dry-run` 5 files invariant; Wave 14 Pattern 4 grep ZERO; `node dist/cli.cjs --version` prints `0.13.0`; `node dist/cli.cjs __hook session-end </dev/null` exits 0 (no-op without ULID).

---

## SB-S18: Three-State Session Visibility with Persistent Offline Rows (Diamond K · v5.2)

**Status**: ACTIVE. Extends Diamond I's two-state session model (`pending → alive`) to three states (`pending → alive → offline`) with offline rows RETAINED in the registry. Removing rows on exit would destroy `claudeSessionId` and working directory, foreclosing `claude --resume`. Keeping the row as an offline tombstone preserves the full Demometer set so the menu offers a resume affordance from any prior session — without ever reading `~/.claude/projects/`.

**SessionStatus union extension** (`src/lib/bridge/types.ts:26`): `'allocated' | 'launched' | 'archived'` → `'allocated' | 'launched' | 'archived' | 'offline'`. The `'offline'` value is set ONLY by `markSessionOffline` and is cleared back to `'launched'` automatically when `updateSessionLiveIdentity` writes a new live identity (the existing SessionStart hook path). This means the offline → resume → alive cycle requires no additional registry edit — `updateSessionLiveIdentity`'s existing `status: 'launched'` write naturally overrides the prior `'offline'` value.

**SessionState 3-state derivation** (`src/lib/bridge/menu.ts:deriveSessionState`):
```typescript
if (entry.status === 'offline') return 'offline';   // PRECEDENCE FIRST — closes hook-vs-tick race
if (entry.claudePid !== undefined) return 'alive';
return 'pending';
```
Precedence-first matters: if SessionEnd hook fires before the next liveness tick has cleared `claudePid` from a separate path, `status === 'offline'` correctly wins, preventing a stale-alive display flicker.

**Liveness tick semantic flip** (`src/lib/tui/animatedTui.ts:livenessInterval`):
- Before Diamond K: `deadIds + staleIds → removeSession(id)` for ALL of them
- After Diamond K: `offlineIds → markSessionOffline(id)` (preserve row); `staleIds → removeSession(id)` (purge ghost)
- Two separate loops; `liveness.tick` payload now `{aliveCount, offlineCount, staleCount}`
- Stale-pending behavior unchanged: a row with `claudePid === undefined` aged past 5min is still REMOVED — those are ghosts where SessionStart hook never fired; nothing to preserve

**STATE column rendering**: 3-state pad (`pending` / `alive  ` / `offline`) right-padded to 7 chars in the renderer. The `indicator` glyph uses `●` for launched, `○` for allocated, `⊘` for offline (and archived). Text discrimination via the STATE column distinguishes offline from archived.

**Resume from offline** (CD-9 + SB-S18 muxified): user presses Enter on an offline row → `launchInformative('resume')` uses preserved `claudeSessionId` → claude --resume spawns a fresh process → SessionStart hook fires → `updateSessionLiveIdentity` sets `status='launched'` + new `claudePid` → `deriveSessionState` returns `'alive'`. Cursor reconciliation (CD-9) naturally extends because offline rows persist in `newSessions`, so `preserveCursorAcrossUpdate` finds the ULID and the cursor stays.

**Pattern 4 Preservation**: every component above derives from registry-mediated signals only — `entry.status` and `entry.claudePid` are registry fields; `probeLivenessTick` uses `kill(pid, 0)` (kernel signal, not filesystem); `markSessionOffline` accepts a ULID. No `~/.claude/projects/` read anywhere. Pattern 4 structural law (SB-S15) holds unchanged.

**Diameter**:
- SB-S18 ↔ Diamond H (Head/Body/Tail Pane Composition) — STATE Demometer expands from 2 to 3 values; Head/Body/Tail structure unchanged
- SB-S18 ↔ Diamond I (Pattern 4 + PID Liveness) — extends the polled mechanism; semantic flip preserves Pattern 4
- SB-S18 ↔ CD-9 (Cursor Reconciliation Parity) — offline rows persist → stale-ULID problem cannot occur on graceful exits; CD-9 invariant strengthened
- SB-S18 ↔ CD-11 candidate (Symmetric Hook-Pair Lifecycle Closure Diameter) — SB-S17 + SB-S18 jointly compose CD-11; promotable to coronation post user-Lambda smoke

**Lambda Trigger**: Diamond K Wave gates (shared with SB-S17). User-Lambda smoke (graceful exit → row stays as `offline`; force-quit → polling backstop sets `offline` within 2s; resume from offline → state returns to `alive`) gates final coronation of CD-11.


---

## SB-S19: Filesystem-Metadata-Only Persistence Validation (Diamond L · v5.3)

**Status**: ACTIVE. Module `src/lib/bridge/sessionPersistence.ts`. Provides `hasPersistedSession(cwd, claudeSessionId)` answering exactly one question: did Claude write a non-empty JSONL for this session? Answer drawn from `existsSync` + `statSync.size`. NEVER reads JSONL content.

**Surface**:
- `BLANK_SIZE_THRESHOLD_BYTES = 0` — v1: any non-empty file = persisted. Tighten only if false-positive blank removals are observed.
- `encodeCwdForClaudeProjects(cwd)` — mirrors Claude's projects-dir encoding (replace `/` with `-`); pure string transform.
- `claudeSessionJsonlPath(cwd, claudeSessionId)` — joins `~/.claude/projects/<encoded-cwd>/<sid>.jsonl`. Path is informational; never opened for content.
- `hasPersistedSession(cwd, claudeSessionId)` — boolean. Returns false on any error. Never throws.

**Boundary**: existsSync + statSync ARE permitted; readFileSync + JSON.parse against the projects path are NOT. SB-S20 (Pattern 4 Modulation) names this boundary explicitly and the Wave 14 v2 grep gate enforces it.

**Diameter**:
- SB-S19 ↔ SB-S20 — SB-S19 IS the metadata-only mechanism; SB-S20 IS the structural-law evolution that admits it
- SB-S19 ↔ SB-S15 (Pattern 4 Structural Law) — preserves the spirit (no content read), evolves the letter (metadata stat permitted)
- SB-S19 ↔ liveness.ts — reciprocal purity: liveness probes pids (kernel signal); SB-S19 stats files (filesystem metadata); both impure helpers consumed by the animatedTui caller

**Lambda Trigger**: Diamond L Wave gates — `npx tsc --noEmit` exit 0; `npm run lint` no NEW errors; `npm test` 332 → 350 PASS (+11 sessionPersistence + 7 animatedTui Diamond L); `npm run build` exit 0 producing 71.68 KB `dist/cli.cjs`; `npm pack --dry-run` 5 files invariant; Wave 14 v2 grep ZERO; `node dist/cli.cjs --version` prints `0.14.0`.

---

## SB-S20: Pattern 4 Modulation — Metadata Stat Admission (Diamond L · v5.3)

**Status**: ACTIVE. Pattern 4 (Registry-Detached Operation, SB-S15) is the structural law that says Bridge does not depend on `~/.claude/projects/`. Diamond L modulates that law without violating it.

**SPIRIT preserved**: Bridge does NOT read or parse `.claude/projects` JSONL content. Claude's session log remains an opaque artifact owned by Claude. The Bridge cannot answer "what did the user say" or "what did the model do" — that information stays in Claude's hands.

**LETTER evolved**: existsSync + statSync (filesystem metadata, byte size) against the path ARE now permitted, scoped exclusively to Diamond L's blank-session filter use case. Metadata is observation of the filesystem state machine; content is the data Claude owns. The Bridge legitimately needs the former to distinguish a real session from a no-op spawn.

**NEW boundary named**: content-read forbidden; metadata-stat permitted. The line is drawn at `readFileSync` and `JSON.parse` invocations against the `.claude/projects` path. Anything that reads file content for interpretation is across the line; anything that asks the kernel "does this exist / how many bytes" is inside the boundary.

**NEW grep gate** (Wave 14 v2):
```bash
grep -rn "readFileSync.*claude/projects\|JSON.parse.*claude/projects" src/ | grep -v ".test.ts"
```
Expected: ZERO matches in production code. The prior Wave 14 grep (`grep -rn "claude/projects" src/`) was structurally too broad — it would fire on the new sessionPersistence module's own path-construction string. The refined gate targets precisely the operations that violate the new boundary while admitting the operations that uphold it.

**Why this is modulation, not violation**: the structural law says "Bridge does not depend on Claude-owned content." Reading metadata is not reading content. The kernel maintains the inode independent of Claude's writes; existsSync / statSync ask the kernel, not Claude. Pattern 4's spirit — that Bridge cannot crash, lock, or misbehave when `.claude/projects` is in any state Claude leaves it in — is unchanged. The blank-session filter only consults metadata to decide whether to remove a Bridge-owned registry row; Claude's data is never copied, parsed, or rendered.

**Diameter**:
- SB-S20 ↔ SB-S15 (Pattern 4 Structural Law) — modulation, not replacement; preserves the architectural commitment with a refined boundary
- SB-S20 ↔ SB-S19 (Filesystem-Metadata-Only Persistence Validation) — SB-S19 IS the implementation of the modulation; SB-S20 IS its doctrinal naming
- SB-S20 ↔ Diamond L Wave 14 v2 grep — the grep IS the structural test that the modulation is upheld; coronation candidate CD-13

**Lambda Trigger**: Diamond L Wave 14 v2 grep returns zero matches in production code (`src/` minus `*.test.ts`); `node dist/cli.cjs --version` prints `0.14.0`. User-Lambda smoke (spawn-without-typing → row removed after 60s grace; spawn-with-typing → row preserved across reconciliation pass) gates final coronation of CD-13.

---

## SB-S21: Post-SessionEnd Persistence Eviction (Diamond M · v5.4)

**Status**: ACTIVE. Modifies `sessionEndHook.ts` to consult `hasPersistedSession(cwd, claudeSessionId)` immediately after the offline transition. If NOT persisted → `removeSession(ulid)` (phantom evicted at hook-exit time, row disappears immediately). If persisted → `markSessionOffline(ulid)` (Diamond K behavior). This closes the phantom-row window from 60s (Diamond L reactive sweep grace) to ~0 for the common case of a graceful close without typing — the most user-visible failure mode.

**Architecture Constraint**: The Diamond L reactive sweep (blank-filter loop, 60s grace) is UNCHANGED. It now serves exclusively as the backstop for sessions where the SessionEnd hook did not fire (kill -9, OS crash, bridge process death). The two passes are not redundant — they address different failure modes at different trigger sites.

**Pattern 4 Preservation**: `hasPersistedSession` reads filesystem metadata (existsSync + statSync.size) as modulated by SB-S20. The SessionEnd hook already crosses this boundary via SB-S19's admitted mechanism.

**Diameter**:
- SB-S21 ↔ SB-S19 (Filesystem-Metadata-Only Persistence Validation) — consumes the same hasPersistedSession predicate; SB-S21 is the hook-path consumer
- SB-S21 ↔ SB-S17 (SessionEnd Hook) — extends the hook's exit logic with a persistence gate
- SB-S21 ↔ Diamond L blank-filter loop — complementary; hook = fast path; reactive sweep = backstop

**Lambda Trigger**: Diamond M Wave gates — `npx tsc --noEmit` exit 0; `npm test` 350 → 367 PASS (+17 across SB-S21/S22/S23 test coverage); `npm run build` exit 0 producing `dist/cli.cjs`; Wave 14 v2 grep ZERO; `node dist/cli.cjs --version` prints `0.15.0`; user-smoke: spawn-without-typing → row disappears IMMEDIATELY on close (not after 60s).

---

## SB-S22: Async Write-Chain Mutex for Registry Mutations (Diamond M · v5.4)

**Status**: ACTIVE. Module-level Promise chain serializes all mutating operations on `registry.ts`. Implementation:

```typescript
let writeChain: Promise<void> = Promise.resolve();

function withWriteChain(op: () => Promise<void>): Promise<void> {
  writeChain = writeChain.then(op, op); // append to chain; previous error does not block next
  return writeChain;
}
```

Every call to `addSession`, `updateSessionLiveIdentity`, `removeSession`, `markSessionOffline` is wrapped by `withWriteChain`. Each mutation's load-modify-write cycle is guaranteed to complete before the next begins. No deadlock possible — each link is independently awaitable; the chain is strictly unidirectional (always append to tail).

**Cross-process invariant**: out of scope. Single-bridge-process assumption is documented. Multi-instance concurrent registry writes are a non-goal.

**Debug log**: `registry.write` event emitted per mutation with `{op, ulid, queueDepth}` (queueDepth = internal metric for chain depth estimation; zero-cost when `--debug` absent per SB-S16 guard).

**Diameter**:
- SB-S22 ↔ SB-S15 (Pattern 4 Structural Law) — serialization applies to bridge-owned registry mutations only; no extension toward Claude state
- SB-S22 ↔ SB-S16 (Debug Logging Pipe) — adds `registry.write` event to the event inventory
- SB-S22 ↔ Diamond L (blank-filter loop) — concurrent rapid spawns now produce N distinct rows instead of N-1 due to eliminated race window

**Lambda Trigger**: same Diamond M wave gates as SB-S21. User-smoke: concurrent rapid spawns (e.g. 3 quick `Enter` presses on ⊕ New Session) produce exactly N rows in the TUI — no row lost to load-modify-write collision.

---

## SB-S23: Projects-Dir Auto-Discovery via Filesystem-Metadata Scan (Diamond M · v5.4)

**Status**: ACTIVE. New function `discoverPersistedSessions(cwd: string): Promise<RegistryEntry[]>` in `src/lib/bridge/sessionPersistence.ts`. Called once at Bridge startup (after Startup Validation Pass) from `animatedTui.ts`. Reads `~/.claude/projects/<encoded-cwd>/` directory; for each JSONL file > `BLANK_SIZE_THRESHOLD_BYTES` not already in the registry by `claudeSessionId`, synthesizes a registry entry and calls `addSession`.

**Synthesized RegistryEntry fields**:

| Field | Value |
|---|---|
| `ulid` | `'01DISCOVERED' + padded-mtime-ms` — sortable, collision-impossible (mtime resolution) |
| `status` | `'offline'` — auto-discovered sessions are resumable, not live |
| `claudeSessionId` | filename stem (the UUID claude assigned to the session) |
| `cwd` | `process.cwd()` — same cwd used for path construction |
| `spawnedAt` | JSONL `mtimeMs` (filesystem metadata; last-modification time) |
| `claudePid` | `undefined` — no process to probe; liveness tick treats as stale-immune (already offline) |

**Pattern 4 Preservation**: Pattern 4 Modulation (SB-S20) explicitly admits `existsSync + statSync` on `~/.claude/projects/` paths for metadata-only queries. Auto-discovery uses `readdirSync` + `statSync.size` — no `readFileSync`, no `JSON.parse`. The Wave 14 v2 grep gate (`readFileSync.*claude/projects\|JSON.parse.*claude/projects`) continues to return ZERO production matches.

**Scope invariant**: discovery is scoped to the current cwd's encoded projects directory ONLY. Cross-cwd discovery (scanning all encoded directories) is deferred — out of scope per Diamond M decision.

**Caveats**: auto-discovered sessions carry no `claudePid`, so the liveness tick treats them as already-offline (immune to stale-pending sweep). They can only be resumed; their original claude process no longer exists. Discovery is one-shot at startup; not periodic (avoid stat load on large projects dirs). Users can `q` and re-launch to refresh.

**Startup sequence** (after Diamond M):
1. `listSessions()` → registry from disk
2. Startup Validation Pass — prune entries whose JSONL is absent (Diamond L backstop)
3. **Auto-Discovery Pass (M-3)** — `discoverPersistedSessions(cwd)` → `addSession` for undiscovered JSONLs > 15KB
4. Render TUI

**Diameter**:
- SB-S23 ↔ SB-S19 (Filesystem-Metadata-Only Persistence Validation) — extends sessionPersistence.ts with the discovery function; same metadata-only boundary
- SB-S23 ↔ SB-S20 (Pattern 4 Modulation) — auto-discovery is a second consumer of the modulated boundary; same spirit-preserved, letter-evolved admission
- SB-S23 ↔ SB-S22 (Write-Chain Mutex) — synthesized `addSession` calls flow through the mutex; no race with concurrent hook fires at startup
- SB-S23 ↔ CD-13 candidate (Pattern 4 Modulation Diameter) — third consumption point of the modulation; strengthens the coronation case

**Lambda Trigger**: same Diamond M wave gates as SB-S21/S22. User-smoke: registered claude conversation (existing JSONL > 15KB in `~/.claude/projects/`) visible in TUI after bridge relaunch without prior Bridge registry entry. `discovery.scan` event in `~/.scs-bridge/debug.log` shows `discoveredCount >= 1` when expected.

---

## SB-S24: Synthesized-Entry Removal-Path Exemption via synthesizedAt Guard (Diamond N · v5.5)

**Status**: ACTIVE. Auto-discovered sessions (entries with `synthesizedAt` set, created by Diamond M's `discoverPersistedSessions`) were being removed within 2 seconds of bridge launch via two independent attack paths: (1) `probeLivenessTick` in `liveness.ts` classified them as stale because their `spawnedAt` (set from JSONL mtime) was hours/days old, exceeding `staleAgeMs`; (2) the blank-filter loop in `animatedTui.ts` occasionally fired against them before the guard was added. Fix N-A adds `synthesizedAt`-based exemption guards at both sites.

**liveness.ts guard**: in `probeLivenessTick`, at the start of the per-session loop, `if (session.synthesizedAt !== undefined) { aliveIds.push(session.id); continue; }` — synthesized entries bypass all age/PID checks and route to `aliveIds`, preserving them across every liveness tick regardless of how old their `spawnedAt` is.

**animatedTui.ts blank-filter guard**: the blank-session filter loop that precedes `hasPersistedSession` check adds `if (s.synthesizedAt !== undefined) continue;` — discovered sessions skip the blank-removal pass entirely. They are always treated as intentionally offline.

**Behavior post-fix**: synthesized sessions persist indefinitely in the `'offline'` state until the user explicitly removes them via `x`-key (SB-S28). They remain resumable via Enter at any time. Discovery remains one-shot at startup per Diamond M invariant.

**Diameter**:
- SB-S24 ↔ SB-S23 (Projects-Dir Auto-Discovery) — SB-S24 is the survival guarantee that makes SB-S23 actually useful across bridge launches
- SB-S24 ↔ SB-S14 (PID Liveness Polling) — exemption routes discovered entries around the liveness-based removal without disabling liveness for regular entries
- SB-S24 ↔ SB-S28 (User Forced Eviction) — the complement: synthesized entries cannot be auto-removed; SB-S28 provides the user-intentional removal path

**Lambda Trigger**: Diamond N wave gates — `npm test` 367 → 391 PASS (+24); `npm run build` exit 0 producing 79.7 KB `dist/cli.cjs`; Wave 14 v2 grep ZERO; `node dist/cli.cjs --version` prints `0.16.0`; user-smoke: auto-discovered sessions persist across bridge relaunch (no removal within 2s).

---

## SB-S25: Registry-First Resume Identity Lookup (Diamond N · v5.5)

**Status**: ACTIVE. `src/lib/bridge/manager.ts:launchInformative` previously called `loadSessionMeta(sessionId)` unconditionally to retrieve `claudeSessionId`. Auto-discovered ULIDs (`01DISCOVERED-*`) have no session directory and no `meta.json` — the call produced `ENOENT`. Fix N-B re-orders the lookup: registry row consulted first; `meta.json` read preserved as fallback for non-synthesized entries.

**Lookup sequence** (post-fix):
1. `const sessions = await listSessions()` — O(sessions.length) read, already in memory for TUI
2. `const entry = sessions.find(s => s.id === sessionId)`
3. `if (entry?.claudeSessionId)` → use `entry.claudeSessionId` directly; proceed to terminal launch
4. `else → loadSessionMeta(sessionId)` → read `meta.json` for `claudeSessionId` (legacy path for entries where registry row may be incomplete)

`cwd`, `terminalCommand`, `launchedAt` still read from `meta.json` when the file exists (non-destructive; synthesized entries simply fall through when `meta.json` is absent). This preserves backward compatibility for all pre-Diamond-M sessions that rely on `meta.json` presence.

**Diameter**:
- SB-S25 ↔ SB-S23 (Projects-Dir Auto-Discovery) — makes auto-discovered entries actually launchable; without SB-S25, SB-S23 produces entries that error on resume
- SB-S25 ↔ SB-S1 (Session Lifecycle) — extends the resume path to handle the synthesized-ULID case; spawn path unchanged
- SB-S25 ↔ SB-S24 (synthesizedAt Guard) — SB-S24 keeps the entry alive; SB-S25 makes it resumable

**Lambda Trigger**: Diamond N wave gates shared with SB-S24. User-smoke Stage 10/11: auto-discovered session resume succeeds without `ENOENT meta.json` error; `[scs] cannot resume` message absent from stderr; new terminal opens with `claude --resume <uuid>`.

---

## SB-S26: Spawn-Settings Filesystem-Resident Env-Prefix Injection (Diamond N · v5.5)

**Status**: ACTIVE. `hook.fire` events were absent from `~/.scs-bridge/debug.log` despite the SessionStart hook firing (evidenced by `claudeSessionId` appearing in registry rows). Root cause: `SCS_BRIDGE_DEBUG=1` was NOT injected into the spawn-settings command string, so the hook subprocess received no `SCS_BRIDGE_DEBUG` env var after Claude Code's env-sanitization barrier.

**Fix site**: `src/lib/bridge/spawnSettings.ts:buildSpawnSettings`. When `isDebugEnabled()` returns true at write time, BOTH `commandStart` and `commandEnd` strings in the spawn settings JSON are prefixed with `SCS_BRIDGE_DEBUG=1 ` before the existing `SCS_BRIDGE_ULID=<id>` prefix. The env-prefix ordering: `SCS_BRIDGE_DEBUG=1 SCS_BRIDGE_ULID=<ulid> node <cli> __hook session-start`.

**Process-boundary carry-through**: spawn settings are written to a temp file whose path is injected via `--settings` into the Claude invocation. Claude Code reads the settings file and invokes hooks using the command strings as written — including the env prefixes. Since `SCS_BRIDGE_ULID` already crossed this boundary successfully (Diamond E), `SCS_BRIDGE_DEBUG` uses the same proven mechanism.

**Backward compat**: non-debug bridge runs (`isDebugEnabled() === false`) produce no `SCS_BRIDGE_DEBUG` prefix — existing behavior preserved identically.

**Diameter**:
- SB-S26 ↔ SB-S16 (Debug Logging Pipe) — SB-S26 closes the process-boundary gap that SB-S16's Confidence-By-Proxy Caveat documented; `hook.fire` events now appear reliably
- SB-S26 ↔ Diamond E (SCS_BRIDGE_ULID carry-through) — third instance of the env-prefix mechanism; the carry-through shape is now a proven multi-payload pattern
- SB-S26 ↔ SB-S17 (SessionEnd Hook) — `sessionEndHook.ts` reads `process.env.SCS_BRIDGE_DEBUG` via the same path; fix N-C applies to both start and end hooks

**Lambda Trigger**: Diamond N wave gates. User-smoke: `scs --debug` launch + spawn session → `tail -f ~/.scs-bridge/debug.log` shows `hook.fire` events within seconds of terminal open; previously absent.

---

## SB-S27: Mtime-Advance Orphan Detection (Passive Signal) (Diamond N · v5.5)

**Status**: ACTIVE. macOS Terminal.app's default behavior on window close does not SIGKILL the child process — a claude process orphaned from its TTY remains alive (process IS running; no terminal). `process.kill(pid, 0)` returns `true`; the PID-death backstop never fires. SessionEnd hook requires a graceful exit — it does not fire on TTY loss. Without this fix, the row stays `alive` indefinitely.

**Signal**: if Claude is actively responding, its session JSONL file at `~/.claude/projects/<encoded>/<uuid>.jsonl` receives new bytes frequently (at least every turn). An alive process that is genuinely running accumulates mtime advances. A TTY-orphaned process that is stuck or idle produces no JSONL writes. The passive signal is: PID alive AND JSONL mtime unchanged for `ORPHAN_DETECTION_MS`.

**New export** (`sessionPersistence.ts`): `getJsonlMtime(cwd, claudeSessionId): number | null` — calls `statSync(claudeSessionJsonlPath(...)).mtimeMs`; returns `null` on error (no JSONL, no cwd, etc.). Pattern 4 Modulation (SB-S20) fourth channel: metadata stat only; no content read.

**animatedTui.ts integration**: module-level `mtimeTracker: Map<string, {mtimeMs: number, firstSeenMs: number}>`. On each liveness tick iteration for entries with alive `claudePid`:
1. `currentMtime = getJsonlMtime(entry.cwd, entry.claudeSessionId) ?? null`
2. If `currentMtime` is null → skip (no JSONL to track; not an orphan signal)
3. If tracker has no entry for this ulid → insert `{mtimeMs: currentMtime, firstSeenMs: Date.now()}`
4. If tracker entry exists AND `currentMtime === trackedMtime` AND `Date.now() - firstSeenMs >= ORPHAN_DETECTION_MS` → `markSessionOffline(ulid)` (orphan)
5. If tracker entry exists AND `currentMtime !== trackedMtime` → update tracker (mtime advanced; not orphan)

Tracker entries are cleaned on every state-change path (orphan → offline, offline, stale removal, blank removal) to prevent stale map growth.

**Trade-off (documented in CHANGELOG)**: `ORPHAN_DETECTION_MS = 90_000` (90 seconds). An idle-but-alive session (user not typing, model not responding) exceeds 90s without JSONL writes and transitions to offline. User can re-resume via Enter (launches a new terminal with `--resume`). The x-key escape valve (SB-S28) provides immediate forced removal if desired. This trade-off was explicitly noted in the CHANGELOG Diamond N entry.

**Diameter**:
- SB-S27 ↔ SB-S19/SB-S20 (Pattern 4 Modulation) — `getJsonlMtime` is the fourth metadata-only channel (after existsSync, statSync.size, readdirSync); same boundary enforcement
- SB-S27 ↔ SB-S14 (PID Liveness Polling) — orthogonal signal: SB-S14 catches PID death; SB-S27 catches TTY-orphan-while-alive; together they cover both failure modes
- SB-S27 ↔ SB-S28 (User Forced Eviction) — SB-S27 detects orphans passively; SB-S28 lets users proactively remove them before the 90s window

**Lambda Trigger**: Diamond N wave gates. User-smoke Stage 6/9: Terminal window close → after 90s (or when bridge relaunches), orphaned row transitions to `offline`; row no longer shows `alive` indefinitely.

---

## SB-S28: User-Driven Forced Eviction Escape Valve via x-Key (Diamond N · v5.5)

**Status**: ACTIVE. All auto-detection channels (PID-death, hook-fire, blank-filter, mtime-advance) have edge cases: orphaned sessions may persist for 90s before SB-S27 fires; auto-discovered sessions are exempt from all auto-removal paths (SB-S24). Users need a manual escape valve for any row in any state that should be removed immediately.

**Implementation** (`src/lib/bridge/menu.ts`):
- New `KeyAction` variant: `'remove-selected'`
- Keypress case: `case 'x': return { action: { type: 'remove-selected' }, newState: state }`
- Caller (`animatedTui.ts`) handles `'remove-selected'`: reads `state.selectedUlid`; guards against synthetic rows (`if (ulid === SYNTHETIC_NEW || ulid === SYNTHETIC_CLOSE) return`); calls `removeSession(ulid)` (idempotent, registry-only mutation, no JSONL touched)
- Footer hint updated to include `x remove` alongside existing hints

**Safety properties**:
- JSONL-safe: `removeSession` only mutates Bridge's own `sessions.json` registry; Claude's JSONL in `~/.claude/projects/` is NEVER touched
- Idempotent: double-press on the same row is a no-op (entry already gone; next render shows cursor reconciliation)
- Synthetic-row protected: `SYNTHETIC_NEW` (`⊕ New Session`) and `SYNTHETIC_CLOSE` (`× Close Bridge`) cannot be targeted; the guard is in the caller, not relying on menu state alone
- Pattern 4 preserved: no filesystem reads; registry-only write path through SB-S22 mutex

**Diameter**:
- SB-S28 ↔ SB-S24 (synthesizedAt Guard) — SB-S24 exempts synthesized entries from auto-removal; SB-S28 is the intentional removal path for those same entries
- SB-S28 ↔ SB-S27 (Mtime-Advance Orphan Detection) — SB-S28 provides immediate eviction without waiting for the 90s detection window
- SB-S28 ↔ SB-S22 (Write-Chain Mutex) — `removeSession` is serialized through the mutex; safe against concurrent spawns or liveness-tick removals
- SB-S28 ↔ CD-15 candidate (Multi-Channel Invalidation Quartet) — SB-S28 is the fourth channel; the quartet = hook + PID-death + blank-filter + mtime-freeze, with x-key as user-override across all states

**Lambda Trigger**: Diamond N wave gates. User-smoke: pressing `x` on any session row (alive, offline, pending, discovered) removes it immediately from the TUI; row absent on next registry poll; no error; `registry.remove` event in `--debug` log.

---

## SB-S29: Synthesized-Aware Conditional Meta Read (Diamond O · v5.6)

**Status**: ACTIVE. Auto-discovered sessions (those with `synthesizedAt` set in the registry entry) have no `sessions/<ulid>/` directory on disk — they are synthesized from `~/.claude/projects/` filesystem metadata at startup. Calling `loadSessionMeta(sessionId)` for such entries throws ENOENT because there is no meta.json to read. This is the root cause of Bug O-1 (Diamond N Fix N-B was incomplete: it re-ordered claudeSessionId resolution but left `loadSessionMeta` called unconditionally).

**Implementation** (`src/lib/bridge/manager.ts`):
- In `launchInformative`: read registry entry FIRST via `listSessions()` before any meta.json access
- Guard: `if (entry?.synthesizedAt !== undefined)` → use `entry.cwd` directly; skip `loadSessionMeta` entirely
- `claudeSessionId` already present in registry row (set during `discoverPersistedSessions`); no meta.json needed
- `terminalCommand` generated fresh for synthesized entries (no cached command to preserve)
- Status update via `updateSessionStatus` only (no `writeSessionMeta` — no session dir exists)
- For non-synthesized entries: existing behavior preserved (loadSessionMeta supplies cwd/terminalCommand/launchedAt)

**Safety properties**:
- No regression: non-synthesized paths unchanged; all 391 prior tests continue to pass
- synthesizedAt guard is the canonical discriminant (same guard used by SB-S24 and blank-filter)
- cwd field populated by `discoverPersistedSessions` from `process.cwd()` at discovery time — reliable substitute for meta.json cwd

**Diameter**:
- SB-S29 ↔ SB-S23 (Projects-Dir Auto-Discovery) — S23 synthesizes the entries; S29 ensures those entries can be resumed without ENOENT
- SB-S29 ↔ SB-S24 (Synthesized-Entry Removal-Path Exemption) — both use `synthesizedAt` as the discriminant; form the synthesized-session handling pair
- SB-S29 ↔ SB-S30 (Project-Local Bridge State Substrate) — together they complete the Diamond O architectural circuit

**Lambda Trigger**: Diamond O wave gates. User-smoke: `scs bridge attach <discovered-ulid>` or TUI Enter on auto-discovered row succeeds (no ENOENT); session opens in new terminal window.

---

## SB-S30: Project-Local Bridge State Substrate (Diamond O · v5.6)

**Status**: ACTIVE. Bridge state was stored globally in `~/.scs-bridge/` — a home-directory path that mixes state across all projects. Per-project scoping is architecturally correct: each project root has independent sessions, each launched from that root's cwd. `./Cascades/Bridge/` lives alongside `./Cascades/Working/`, `./Cascades/Documentation/`, `./Cascades/8_SUITES/` — bridge state is the runtime cousin of planning artifacts, naturally co-located.

**Implementation** (`src/lib/bridge/paths.ts` and consumers):
- `bridgeRoot()` returns `join(process.cwd(), 'Cascades', 'Bridge')` — replaces `join(homedir(), '.scs-bridge')`
- All downstream paths derive from `bridgeRoot()`: sessions dir, sessions.json registry, debug.log
- `src/lib/bridge/debugLog.ts` — `debugLogPath()` uses `bridgeRoot()` (removes inline `homedir()`)
- `src/lib/tui/bridgeStateFeed.ts` — uses `bridgeRoot()` (removes hardcoded `homedir() + '.scs-bridge'`)
- `src/cli.ts` help text updated: "Pipe trace events to ./Cascades/Bridge/debug.log"
- `.gitignore` updated: `Cascades/Bridge/` added (runtime state, not committed)
- Tests updated: `debugLog.test.ts`, `bridgeStateFeed.test.ts`, `sessionPersistence.test.ts` — tmpdir fixtures adjusted to new path convention

**Migration note**: existing `~/.scs-bridge/sessions.json` is **orphaned** by this change. Users with pre-Diamond-O sessions in `~/.scs-bridge/` will not see them in the new location. Auto-discovery (SB-S23) surfaces real sessions from `~/.claude/projects/<encoded-cwd>/` — the actual Claude conversation record is unaffected. No automated migration provided (acceptable: auto-discovery restores session visibility within startup).

**Safety properties**:
- Pattern 4 preserved: bridge owns `<cwd>/Cascades/Bridge/` fully; `~/.claude/projects/` remains claude's territory
- `mkdirSync(..., { recursive: true })` on first write — `Cascades/Bridge/` auto-created if absent (existing pattern in registry.ts and debugLog.ts)
- Cross-cwd launches get independent state — by design; each project root is a separate operational center
- Wave 14 v2 grep gate unchanged: `readFileSync.*claude/projects|JSON.parse.*claude/projects` → ZERO production matches

**Diameter**:
- SB-S30 ↔ SB-S29 (Synthesized-Aware Conditional Meta Read) — together they complete the Diamond O architectural circuit: S29 fixes resume for discovered sessions; S30 roots all bridge state project-locally
- SB-S30 ↔ SB-S23 (Projects-Dir Auto-Discovery) — auto-discovery still reads `~/.claude/projects/` (claude's territory unchanged); session records now written to project-local bridge root
- SB-S30 ↔ CD-16 candidate (*Project-Local Bridge Capsule Diameter*) — project-local scoping is the fifth invalidation channel: per-project state containers eliminate cross-project leakage; promotable to coronation pending user-Lambda smoke

**Lambda Trigger**: Diamond O wave gates. User-smoke: `scs bridge spawn` from project root creates `./Cascades/Bridge/sessions.json` (not `~/.scs-bridge/sessions.json`); `scs --debug` creates `./Cascades/Bridge/debug.log`; `~/.scs-bridge/` is NOT created or modified.

---

## SB-S31: Empirical Single-Call Threshold Calibration via Distribution Evidence (Diamond P · v5.7)

**Status**: ACTIVE. `BLANK_SIZE_THRESHOLD_BYTES` in `src/lib/bridge/sessionPersistence.ts` lowered from `15 * 1024` (15360 bytes, documentation-derived) to `5 * 1024` (5120 bytes, empirically derived). Prior threshold was sourced from Diamond H's Amethyst Vermillion WebSearch heuristic (3KB) scaled up during Diamond M's auto-discovery pass without empirical validation. Diamond P provides the distribution evidence.

**Distribution evidence (user's project, 16 JSONL files)**:

| Cluster | Size Range | Count | Classification |
|---|---|---|---|
| claude-died-early | 2-3 KB | 4 files | correctly blank |
| single-call real exchange | 9-10 KB | 8 files | FALSE-POSITIVE blank under 15KB threshold |
| multi-turn brief | ~51 KB | 1 file | correctly persisted |
| long conversation | ~693 KB | 1 file | correctly persisted |

Empirical viability boundary: ~5KB cleanly separates the two clusters. A "Stand By" / "Standing by" single-message exchange constitutes a minimum-viable session.

**Implementation**: one-line constant change. Both `hasPersistedSession` and `discoverPersistedSessions` consume `BLANK_SIZE_THRESHOLD_BYTES` directly — both updated automatically. No call-site changes required. Comment updated to cite empirical basis.

**Backward compat**: the change ONLY affects sessions in the 5-15KB range. Sessions <5KB continue to be treated as blank (correctly). Sessions >15KB continue to be persisted (no change). The 5-10KB cluster (previously false-positive blank removals) is now correctly classified as persisted.

**Diameter**:
- SB-S31 ↔ SB-S19 (Filesystem-Metadata-Only Persistence Validation) — SB-S31 calibrates the threshold SB-S19 applies; mechanism unchanged, boundary improved
- SB-S31 ↔ SB-S21 (Post-SessionEnd Persistence Eviction) — eviction now correctly preserved for single-call sessions that the old threshold incorrectly evicted
- SB-S31 ↔ CD-17 candidate (*Empirical-Layer-4 Threshold Validation Diameter*) — first threshold derived from actual observed distribution rather than heuristic; promotable post user-Lambda smoke

**Lambda Trigger**: Diamond P wave gates. User-smoke: spawn a session, type one message, close terminal → row persists (not removed by blank-filter); single-call JSONL (~9KB) correctly classified as persisted; 5/403 tests cover threshold edge cases.

---

## SB-S32: Discovered-Session First-Class Scaffolding (Diamond P · v5.7)

**Status**: ACTIVE. Auto-discovered sessions (synthesized from `~/.claude/projects/` metadata by `discoverPersistedSessions`) previously had no session directory under `Cascades/Bridge/sessions/<ulid>/`. Without `meta.json` and `spawn-settings.json`, resumed discovered sessions could not inject the SessionStart hook — status stayed `launched/pending` instead of transitioning to `alive`. Diamond P elevates discovered sessions to first-class citizens by scaffolding the full session directory at discovery time.

**New helper**: `scaffoldDiscoveredSession(ulid, cwd, claudeSessionId, mtimeMs)` in `src/lib/bridge/sessionPersistence.ts`.

Creates the full session directory:
- `Cascades/Bridge/sessions/<ulid>/meta.json` — synthesized from registry data; `launchedAt` = JSONL mtime; `status = 'offline'`; `claudeSessionId` from discovered entry
- `Cascades/Bridge/sessions/<ulid>/spawn-settings.json` — identical hook injection shape to spawned sessions; `SCS_BRIDGE_ULID` = synthesized ULID; SessionStart + SessionEnd hooks registered
- `Cascades/Bridge/sessions/<ulid>/archive/` — empty dir
- `Cascades/Bridge/sessions/<ulid>/body/` — empty dir
- `Cascades/Bridge/sessions/<ulid>/heads/` — empty dir
- `Cascades/Bridge/sessions/<ulid>/tails/` — empty dir

**Idempotency**: skips scaffold if `meta.json` already present (safe on repeated startups; existing scaffolded entries not clobbered).

**Trigger site**: `animatedTui.ts` auto-discovery pass. After `addSession(synthesizedEntry)`, calls `await scaffoldDiscoveredSession(...)`.

**Diamond O Fix O-1 REVERTED** (`manager.ts`): the `synthesizedAt` guard that skipped `loadSessionMeta` and `writeSessionMeta` is removed. Discovered sessions now have `meta.json` on disk — `loadSessionMeta` succeeds. `launchInformative` needs no special case; discovered and spawned sessions are architecturally identical from the resume perspective.

**Resumption lifecycle (post-Fix P-2)**:
1. Auto-discovery → `addSession` + `scaffoldDiscoveredSession` → session dir created
2. User presses Enter → `launchInformative('resume')` → `loadSessionMeta` succeeds (synthesized `meta.json`)
3. `spawn-settings.json` present → `--settings <path>` flag injected → claude receives hook config
4. SessionStart hook fires → `updateSessionLiveIdentity(ulid, claudeSessionId, process.ppid)` → `status = 'launched'`, `claudePid` set
5. Liveness tick → `deriveSessionState` returns `'alive'`

**Diameter**:
- SB-S32 ↔ SB-S23 (Projects-Dir Auto-Discovery) — SB-S23 discovers entries; SB-S32 scaffolds them to first-class
- SB-S32 ↔ SB-S29 (Synthesized-Aware Conditional Meta Read) — SB-S29 IS REVERTED by SB-S32; discovered sessions no longer need the meta-skip gate
- SB-S32 ↔ SB-S1 (Session Lifecycle) — discovered sessions now traverse the full `pending → alive → offline` lifecycle

**Lambda Trigger**: Diamond P wave gates. User-smoke: auto-discovered session TUI Enter → new terminal opens → hook fires → STATE column shows `alive` (not `pending`); `Cascades/Bridge/sessions/<discovered-ulid>/meta.json` exists on disk.

---

## SB-S33: Body Slot Pad-To-Clear Render Discipline (Diamond P · v5.7)

**Status**: ACTIVE. When the session list shrank between frames (e.g., a session was removed), prior render frames left stale terminal content in body slot rows beyond the new session count. The TUI writes body rows sequentially from top; if the new frame has fewer rows than the previous, the terminal retains the previous content in the vacated positions. User observed: after closing spawned session `01KR1R11XB`, one of the two discovered-session rows appeared as a phantom duplicate (unselectable; cursor-skip evidence proved it was render-time artifact, not a registry state).

**Root cause**: `renderMenu` body section iterated `pageSessions.length` times and emitted one row per session. When `pageSessions.length` decreased, the terminal retained prior content in the vacated slots.

**Fix**: `renderMenu` body section emits exactly `visibleBodySlots` lines unconditionally on every frame:

```typescript
for (let i = 0; i < visibleBodySlots; i++) {
  if (i < pageSessions.length) {
    lines.push(formatSessionRow(pageSessions[i], caps, state));
  } else {
    lines.push(' '.repeat(termWidth ?? 80));  // pad-to-clear
  }
}
```

The `output.split('\n').length === termHeight` Layer-1 invariant (Diamond H) is preserved — total line count is unchanged; only the content of vacated body slots changes from stale to blank.

**Test coverage**: Layer 1 source-scan test asserts body emission count === `visibleBodySlots` for session counts from 0 to `visibleBodySlots + 2` (covers the vacated-slot case explicitly).

**Diameter**:
- SB-S33 ↔ Diamond H (Head/Body/Tail Pane Composition) — strengthens HBT render contract; vacated slots now deterministically blank
- SB-S33 ↔ CD-9 (Cursor Reconciliation Parity) — pad-to-clear is the render analog to cursor reconciliation: both ensure the display accurately reflects the current state, not a prior one
- SB-S33 ↔ SB-S32 (First-Class Scaffolding) — Fix P-2 and Fix P-3 are compositionally independent but surface together; scaffolding ensures hook fires, pad-to-clear ensures no phantom row appears after session count changes

**Lambda Trigger**: Diamond P wave gates. User-smoke: close a spawned session → TUI body shows exactly two discovered-session rows (no phantom duplicate); subsequent spawn-and-close cycle produces no stale content in vacated body slots.

---

---

## SB-S34: Optional Display Name as User-Sourced Registry Field (Diamond Q · v5.8)

**Status**: ACTIVE. `displayName?: string` field added to `RegistryEntry` (and mirrored in `SessionMeta`) as a user-sourced organizational label independent of the generated session ULID and claudeSessionId. When unset (all existing sessions on upgrade), menu rendering is identical to prior behavior. When set, the display name replaces the uuid-short column in `formatSessionRow` and `renderMenuLegacy` for human-readable session identification. Stored as the registry row's source of truth; `meta.json` mirrors the value for cross-tool visibility.

**Schema extension**:
```typescript
interface RegistryEntry {
  // ...existing fields...
  displayName?: string;  // user-sourced organizational label; undefined = unset
}
```

**Backward compat**: Optional field; registries and meta.json files written before Diamond Q load cleanly with `displayName === undefined`. No migration required.

**Diameter**:
- SB-S34 ↔ SB-S35 (Rename-Mode State Machine) — the field SB-S34 defines is the target SB-S35 writes to
- SB-S34 ↔ SB-S36 (Column Substitution) — the value SB-S34 stores is the content SB-S36 renders
- SB-S34 ↔ Feature Q-3 (registry.ts `setSessionDisplayName`) — new registry export wraps `chainWrite` mutex (Diamond M Fix M-2 preserved)

**Lambda Trigger**: Diamond Q implementation waves. User-smoke: sessions with displayName unset render identically to v5.7; session with displayName set renders name in primary column.

---

## SB-S35: Modal Rename-Mode Keypress State Machine (Diamond Q · v5.8)

**Status**: ACTIVE. `'r'` key activates rename-mode when the cursor is on a non-synthetic session row (ULID-bearing). Synthesized/discovered rows ARE eligible — users may assign display names to auto-discovered sessions. The modal overlay captures character-by-character text input: printable characters append to `renameMode.buffer`; Backspace pops the last character; Enter confirms; Escape cancels without saving.

**MenuState extension**:
```typescript
interface MenuState {
  // ...existing fields...
  renameMode?: { ulid: string; buffer: string };
}
```

**State machine** (`applyKeypress`):
- `normal` state + `'r'` on eligible row → `renameMode = { ulid, buffer: entry.displayName ?? '' }` → footer switches to rename prompt
- `rename-mode` state + printable char → `buffer += char`
- `rename-mode` state + Backspace → `buffer = buffer.slice(0, -1)`
- `rename-mode` state + Enter → `setSessionDisplayName(ulid, buffer.trim() || undefined)` → `renameMode = undefined` → standard footer restored; empty buffer clears displayName (unset semantics)
- `rename-mode` state + Escape → `renameMode = undefined` → discard buffer; standard footer restored

**Footer rendering** (rename mode active): `Rename: <buffer>_  · Enter confirm · Esc cancel`

**Footer rendering** (standard mode, updated): `↑/↓ navigate · ←/→ page · Enter activate · n new · x remove · r rename · q quit`

**Diameter**:
- SB-S35 ↔ SB-S34 (Display Name Field) — state machine writes the field SB-S34 defines
- SB-S35 ↔ SB-S36 (Column Substitution) — confirmation triggers re-render that SB-S36 governs
- SB-S35 ↔ SB-S28 (x-Key Forced Eviction) — compositionally independent; both are modal-free in standard mode; both protect SYNTHETIC sentinels

**Lambda Trigger**: Diamond Q implementation waves. User-smoke: press `r` on selected row → footer switches to rename prompt; type name → buffer updates; Enter → `registry.rename` debug event; Escape → footer reverts; no state change.

---

## SB-S36: Display Name Column Substitution in Row Formatter (Diamond Q · v5.8)

**Status**: ACTIVE. `formatSessionRow` and `renderMenuLegacy` check `entry.displayName` before emitting the uuid-short column. When `displayName` is set, it is rendered in place of the uuid-short value — truncated to 32 characters with trailing ellipsis if longer. When `displayName` is unset, the existing uuid-short fallback (`(entry.claudeSessionId ?? '').slice(0, 8)`) is used unchanged. Column width and alignment are preserved in both branches so the row layout is consistent regardless of whether a name is set.

**Render logic**:
```typescript
const nameCol = entry.displayName
  ? entry.displayName.length > 32
    ? entry.displayName.slice(0, 31) + '…'
    : entry.displayName
  : (entry.claudeSessionId ?? '').slice(0, 8);
```

**Backward compat invariant**: rows for sessions without `displayName` are bit-identical to Diamond P output. Only rows with `displayName` set change appearance.

**Diameter**:
- SB-S36 ↔ SB-S34 (Display Name Field) — renders the optional field SB-S34 defines
- SB-S36 ↔ SB-S35 (Rename-Mode State Machine) — confirmation in SB-S35 triggers re-render via watchFile; SB-S36 governs what the new frame shows
- SB-S36 ↔ Diamond H (HBT Pane Composition) — column substitution preserves the Layer-1 line-count invariant; `termHeight` contract unaffected

**Lambda Trigger**: Diamond Q implementation waves. User-smoke: session with displayName 'my-project-claude' renders `my-project-claude` in name column; session without displayName renders uuid-short as before.

---

---

## SB-S37: Synthesized-Aware ULID Column Substitution (Diamond R · v5.9)

**Status**: ACTIVE. `formatSessionRow` (viewport path) and `renderMenuLegacy` (legacy path) substitute `claudeSessionId.slice(0, 10)` for the ULID column when `entry.synthesizedAt !== undefined`; spawned entries continue to render `id.slice(0, 10)` as before. Information-density fix: synthesized entries' ULID prefix `01DISCOVER` is the same string in every discovered row — Pattern 1 replaces it with the real (Claude-issued) session UUID prefix, which is the meaningful identity.

**Render logic**:
```typescript
const ulidShort = safeCell(
  s.synthesizedAt !== undefined
    ? (s.claudeSessionId ?? '').slice(0, 10)
    : s.id.slice(0, 10),
);
```

**Diameter**:
- SB-S37 ↔ SB-S34 (Display Name Field) — both consume `synthesizedAt` for column substitution; SB-S37 governs ULID column, SB-S34 governs name column
- SB-S37 ↔ Diamond M (Discovered Session Auto-Discovery) — surfaces the meaningful claudeSessionId for synthesized rows that Diamond M auto-discovers
- SB-S37 ↔ CD-12 Predicate-Bidirectionality — `synthesizedAt` reaches its 8th+ consumption site (the ULID column conditional)

**Lambda Trigger**: Diamond R implementation waves. User-smoke: synthesized rows show real claudeSessionId prefix (e.g., `f81ef5c1-3`); spawned rows still show ULID prefix (e.g., `01KR1J0QZQ`).

---

## SB-S38: ANSI-Aware Line-Width Clip-And-Pad Discipline (Diamond R · v5.9)

**Status**: ACTIVE. Every line emitted by `renderMenu` (header, status, HEAD, body row, TAIL, footer) AND `renderMenuLegacy` passes through `clipAndPadToWidth(line, termWidth)` helper. Helper strips ANSI escape sequences for VISIBLE-character counting, clips lines exceeding termWidth (preserving ANSI codes within the clipped portion + appending trailing reset codes defensively), and pads lines shorter than termWidth with spaces. Generalizes Diamond P Fix P-3 (body slot pad-to-clear) from body-only to UNIVERSAL pad-to-clear-AND-clip.

**Helpers**:
```typescript
const ANSI_REGEX = /\x1b\[[0-9;]*[A-Za-z]|\x1b\][^\x07]*\x07|\x1b./g;
export function stripAnsiCodes(s: string): string;
export function visibleLength(s: string): number;
export function clipAndPadToWidth(line: string, width: number): string;
```

**Width math** (termWidth=80, cwdMaxWidth = `Math.max(15, termWidth - 92)` = 15):
- Fixed visible chars in row = 56 (col separators + fixed-width fields)
- cwd column padded to cwdMaxWidth via explicit `padEnd(cwdMaxWidth)` — deterministic
- Row width = 56 + 15 (cwd padded) + 2 (separator) + L (launched relative time)
- L=6 ("8h ago") → 79 chars (fits with 1-char margin)
- L=8 ("just now") → 81 chars → clipAndPadToWidth clips to 80

**Failing mode without it**: rows exceeding termWidth wrap onto next visual line; wrapped chars become prefix on next emitted line; phantom Close Bridge + duplicate footer hint accumulate as page renders longer than allocated `bottomRows`.

**Diameter**:
- SB-S38 ↔ SB-S33 (Body Slot Pad-To-Clear) — generalizes from body-only to all-line-emissions
- SB-S38 ↔ Diamond H (HBT Pane Composition) — line-count invariant becomes line-count + line-width invariant
- SB-S38 ↔ CD-9 Cursor Reconciliation — render-side reconciliation now matches state-side reconciliation

**Lambda Trigger**: Diamond R implementation waves. User-smoke: at terminal width 80, rows fit cleanly; no wrap; no phantom Close Bridge stacking across page navigation; selection highlight (REVERSE ANSI) survives clip+pad correctly.

---

---

## SB-S39: Cascades-Presence-Driven Conditional Top Menu + SCS Installation Orchestration

**Status**: FULLY WIRED — animatedTui handler live (Diamond B-6 Apex)

**What This Skill Does** (8-line description):

SB-S39 governs two distinct behaviors unified by one architectural Diameter:

1. **Boot-Time Menu Topology** — at Bridge startup, `existsSync(join(cwd,'Cascades'))` determines
   the top-menu composition. When `cascadesPresent === false`: HEAD renders `⊕ Install SCS-Bridge`
   (Viridian) above `⊕ New Session`; cursor default-selects `SYNTHETIC_INSTALL`. When
   `cascadesPresent === true`: prior behavior preserved bit-for-bit.

2. **Install Orchestration** — when `install-selected` KeyAction fires, the Conductor
   dispatches six Strategy/ phases in sequence:
   S1 DetectCascadesPresence → S2 ConfirmInstallation (AskUserQuestion) →
   S3 CloneRepo → S4 ScaffoldCascadesDir → S5 ConvertClaudeMd (optional, AskUserQuestion) →
   S6 CleanupTempDir. Pattern 4 discipline maintained throughout: bridge-owned
   temp dir (`<bridgeRoot>/install-temp/`) is the only non-user-territory write
   during S3; S4-S5 write only to user-project-root which Bridge already owns per SB-S30.

**Conductor Reference**: `Cascades/8_SUITES/SCS Bridge/Conductor.md`
**Strategy References**:
- `Strategy/S1-DetectCascadesPresence.md` — S1 gate; existsSync probe
- `Strategy/S2-ConfirmInstallation.md` — S2 gate; Shatterite Tome AskUserQuestion
- `Strategy/S3-CloneRepo.md` — S3 build; shallow clone → bridge-owned temp
- `Strategy/S4-ScaffoldCascadesDir.md` — S4 build; copy Cascades/ → user project root
- `Strategy/S5-ConvertClaudeMd.md` — S5 optional; CLAUDE.md → Suite 8 + Revert.md
- `Strategy/S6-CleanupTempDir.md` — S6 terminal; remove temp dir unconditionally

**SB-S39 Lifecycle**:
- **B-1 (STUB)**: `cascadesPresent` flag + `SYNTHETIC_INSTALL` sentinel + `'install-selected'` KeyAction + stderr stub handler
- **B-2 (REAL spec)**: Conductor.md + Strategy/S1-S6 Vermillion plans; spec complete; src/ still stub
- **B-3 (src/ helpers)**: `installSpawn.ts` + `installHooks.ts` — `runInstallSpawnPipeline`, `cloneScsBridge`, `assembleJoinedSuite8`, hooks; animatedTui dispatch still stub
- **B-4 (in-instance S4)**: `pollScaffoldComplete` + `runScaffoldCompleteSignalHook`; `Cascade.template.json`; `Cascades/Bridge/.gitkeep`
- **B-5 (in-instance S5)**: `backupUserDotClaudeAgents`; Strategy/templates/ + Revert.md template; Conductor.md v1.2
- **B-6 (FULLY WIRED — Apex)**: `installConstants.ts` (`SCS_INSTALL_REPO_URL` + env override); `handleInstall` async function in `animatedTui.ts`; `case 'install-selected'` → `void handleInstall()`; `MenuState.installRunning?` field; `installSuffix` in `renderMenu`; `legacyInstallSuffix` in `renderMenuLegacy`; both banners v0.23.0
- **B-7 (forthcoming)**: Cleanup trigger (`pollScaffoldComplete` + `cleanupInstallTemp` from bridge after scaffold-done.flag) + user closeout + bulk-smoke graduation

**Diameter Map**:
- SB-S39 ↔ SB-S30 (Project-Local Bridge State Substrate) — `bridgeRoot()` provides
  the temp dir location for S3; same `process.cwd()` origin; Cascades/ detection is
  a probe of the same project-local space Bridge already owns
- SB-S39 ↔ SYNTHETIC_NEW/SYNTHETIC_CLOSE — SYNTHETIC_INSTALL is the third synthetic
  sentinel; cursor-by-identity invariant preserved; visibleBodySlots math unchanged
  (Install row is in HEAD above body, not in body slice)
- SB-S39 ↔ CD-23 candidate *Conditional Bridge Bootmode Diameter* — bridge personality
  switches at boot based on filesystem state; future personalities (dev-mode, demo-mode)
  compose into same Diameter; coronates after B-6 user-Lambda smoke

**Lambda Trigger**: User-smoke on completed B-7 bulk-smoke (end-to-end: `scs` in fresh project →
Install selected → Cascades/ scaffold written → optional CLAUDE.md conversion → temp cleaned).
B-1 Lambda (Install row visibility) confirmed STUB. B-6 Lambda = src/ wired. B-7 = bulk-smoke graduation.

---

## SB-S40: Probe-Before-Auto-Spawn Probe-Ordering (POFPFD)

**Status**: LANDED at Diamond B-8

**What This Skill Does**: Encodes the rule that any filesystem probe whose value gates downstream state-machine routing MUST run BEFORE any side-effecting action that could mutate the probed path. The `cascadesPresent = existsSync(cwd + '/Cascades')` probe in `animatedTui.ts` was previously fired AFTER the empty-registry auto-spawn block — the auto-spawn wrote `Cascades/`, the probe returned true, and the Install row was hidden on fresh installs. POFPFD requires probe-first declaration with a strict gating expression on the side-effecting block.

**Pattern Spec**:
- Declare probe immediately after the last pure-read pass (discovery loop close).
- Gate any side-effecting block on probe value (`if (cascadesPresent && sessions.length === 0)`).
- Side-effects that COULD mutate the probed path are forbidden between probe and gate.
- Probe value flows downstream through `MenuState.cascadesPresent` (single source of truth).

**Diameter Map**:
- SB-S40 ↔ SB-S39 (CD-23 Conditional Bridge Bootmode Diameter) — same probe value drives both menu composition AND auto-spawn gate
- SB-S40 ↔ Pattern 4 v2 (metadata-only probes) — `existsSync` is a pure read; auto-spawn is the side-effect that must be gated

**Lambda Trigger**: Diamond B-8 build gate (518/518 tests, build 104 KB, tsc 0 errors). Source-level concluder: `grep -n cascadesPresent src/lib/tui/animatedTui.ts` confirms probe-then-gate ordering.

---

## SB-S41: Install-Scope Targeted Permission Allow-Rules (PTS)

**Status**: LANDED at Diamond B-8

**What This Skill Does**: When the bridge spawns a special install instance (Diamond B-3 `runInstallSpawnPipeline`), the spawn-settings JSON now carries a `permissions.allow` array of `Tool(glob)` rules scoped to bridge-managed paths only. The instance can `Write(<userCwd>/Cascades/**)`, `Edit(<userCwd>/.claude/{CLAUDE.md,agents/**,commands/**})`, `Read(<userCwd>/CLAUDE.md)`, and run install-shell primitives (`git clone`, `cp -R`, `mkdir -p`, `test -d`, `test -f`) without permission prompts. NOT bypassPermissions mode — the user's other Claude work is unaffected (CD-25 preserved).

**Pattern Spec**:
- Optional `permissions?: { allow: string[] }` on `SpawnSettings` type.
- Session-mode (`buildSpawnSettings`) leaves the field undefined — backward compatibility invariant.
- Install-mode (`buildInstallSpawnSettings`) populates with `Tool(glob)` strings only; userCwd substituted at call site via `process.cwd()`.
- JSON key path: `permissions.allow` (Conductor decision; failure mode is silent-ignore not breakage).
- `Tool(glob)` syntax is Lambda-confirmed via `claude --help` (Green Angle 1).

**Diameter Map**:
- SB-S41 ↔ SB-S39 (Install Orchestration) — allow-rules are the means by which install-scope writes proceed without per-tool prompts
- SB-S41 ↔ Pattern 4 v2 — install-scope writes are explicitly bounded; bypassPermissions is rejected
- SB-S41 ↔ CD-25 (preserved) — user's session-mode bridge spawns remain unscoped

**Lambda Trigger**: Diamond B-8 build gate. test-002 retest will confirm install completes without permission prompts; if Claude Code uses a different JSON key the failure mode is silent-ignore (Green confirmation).

---

## SB-S42: Pewter HiFi Trust-Confer Pane (HWMTUC + HWMTUC-SURFACE)

**Status**: LANDED at Diamond B-8

**What This Skill Does**: Before the install pipeline fires, the bridge presents a Pewter Tessera HiFi Trust-Confer pane listing every path that will be written. The pipeline cannot fire until the user explicitly confirms with Y/Enter (or declines with N/Esc, which clears the modal cleanly). The pane is rendered in the standard menu surface via `renderTrustConferPane`, applying Pewter HiFi rules adapted to ANSI terminal primitives.

**Pattern Spec**:
- `MenuState.trustConfer?: { paths: string[]; optionalPaths: string[]; ulid: string }` — modal active when defined.
- `KeyAction` adds `'trust-confer-confirm'` and `'trust-confer-decline'` variants.
- `applyKeypress` early-return branch (mirrors `renameMode` pattern) — captures Y/Enter/N/Esc, returns noop for any other keypress.
- `renderTrustConferPane` applies HiFi rules:
  - **D3 (pane gradient)**: bold/dim ANSI layering simulates radial gradient (CSS unavailable in TUI).
  - **D4 (text-shadow)**: DIM ANSI layer over Pewter base — warm amber complement approximated.
  - **D5 (embossed border)**: `═` bright top + `─` dim bottom; `ANSI.REVERSE` on YES button for active inversion.
- Pewter color rgb(180,185,190) inline — NOT added to `SUITE_COLORS` (Conductor decision).
- `animatedTui.ts` `case 'install-selected'` → sets `menuState.trustConfer` (does NOT call `handleInstall`); `case 'trust-confer-confirm'` clears modal and fires `handleInstall`; `case 'trust-confer-decline'` clears and logs `install.declined`.

**Diameter Map**:
- SB-S42 ↔ SB-S39 (Install Orchestration) — pane is the user-confirmation gate before pipeline fires
- SB-S42 ↔ Pewter Tessera Suite 8 (D3/D4/D5) — first TUI application of HiFi rules; Pattern 4 strict (state-only, no fs writes from render)
- SB-S42 ↔ SB-S35 (`renameMode` modal) — same early-return + spread-reassign + override-render shape; structural mirror

**Lambda Trigger**: Diamond B-8 build gate (518/518 tests, build 104 KB). Source-level concluder: `grep -c trust-confer src/lib/bridge/menu.ts` returns ≥4; renderTrustConferPane present.

---

## SB-S43: SCS-Scaffold-Marker-Probe-Target (CD-23 refinement)

**Status**: LANDED at Diamond B-9

**What This Skill Does**: The cascadesPresent probe targets `<cwd>/Cascades/8_SUITES` (the canonical SCS scaffold marker), not `<cwd>/Cascades` (which `ensureBridgeRoot()` creates as a side effect of session enumeration). This semantic refinement prevents the probe from spuriously returning TRUE on bare bridge boot.

**Pattern Spec**:
- `existsSync(process.cwd() + '/Cascades/8_SUITES')` at TUI startup (animatedTui.ts) and startMenu (menu.ts).
- `8_SUITES/` is created ONLY by Strategy/S4 scaffold copy from cloned repo's `Cascades/8_SUITES/SCS Bridge/...`.
- `Cascades/Bridge/` is created by `ensureBridgeRoot()` in `loadRegistry()` — bridge state, NOT SCS scaffold.
- Probe target = invariant scaffold marker · NOT incidental state location.

**Diameter Map**:
- SB-S43 ↔ SB-S39 (Install Orchestration · CD-23) — refines the probe target to remove side-effect conflation
- SB-S43 ↔ Diamond B-8 SB-S40 (POFPFD probe ordering) — Diamond B-8 ordered the probe correctly; Diamond B-9 fixes the probe TARGET so the ordering can do its job
- SB-S43 ↔ Diamond P SB-S30 (`bridgeRoot()` project-local) — the very feature that creates the side effect; SB-S43 distinguishes the bridge-state vs SCS-scaffold concerns at the probe layer

**Trust Dialog Note (paired finding · OVERTURNED at Diamond B-13)**: Diamond B-9's "no programmatic skip" verdict was based on a directory-only probe of `~/.claude/`. Diamond B-12 Orange B2 hyper-focus probe surfaced `~/.claude.json` (root file at `$HOME`, NOT directory) containing `projects[abs].hasTrustDialogAccepted: boolean`. Diamond B-13 implements `preSeedTrust(userCwd)` (SB-S48) that writes this field via atomic `.tmp + rename`. The trust dialog IS programmatically skippable. SB-S42 Pewter trust-confer pane remains as the bridge's user-sanctioning gate (the Pattern 4.1 chain that authorizes `preSeedTrust` to fire); the Claude Code dialog itself is now bypassed.

---

## SB-S76: Pewter-Trust-Confer-HiFi-Redesign (Diamond B-22 · CD-71 · PTCHR)

**Status**: LANDED at Diamond B-22 (First Pewter Diamond)

**What This Skill Does**: Trust-confer permission pane (B-8 SB-S42 v0 era) refined to Pewter HiFi v3 standards matching install animation (B-17/18 v2 era). D5 closed-box border (corners + sides), D1 color tokens (Cobalt title · Ochre ⚠ · Rose-tint Cancel), centered geometry, selected-state visual cursor.

**Pattern Spec**:
- Pewter D5 Embossed Border: `┌─┐` DARK top + right · `└─┘` LIGHT bottom + left · matches `installAnimation.ts buildPewterPane`
- D1 Color Tokens: PEWTER neutral body · COBALT title accent · OCHRE ⚠ glyph · ROSE Cancel REVERSE
- D7 Active-Button Inversion: REVERSE + BOLD + suite-tinted color + ▶ glyph (active); 2-space prefix + dim Pewter (inactive)
- Centered geometry: `bodyLine(content) + padCenter(text, visLen) + padLeft(text, visLen, indent)` helpers
- Footer hint advertises arrow-nav explicitly

**Diameter Map**:
- SB-S76 ↔ B-8 SB-S42 (predecessor v0): same modal pattern · refined visual standards
- SB-S76 ↔ B-17/18 Pewter v2 (cross-Diamond visual continuity): same D5 border construction · same color cycle discipline
- SB-S76 ↔ B-20 SB-S69 IRULRT: title verb adapts to lifecycle phase ("SCS Install" / "SCS Reinstall")

---

## SB-S77: Trust-Confer-Arrow-Navigation-Cursor (Diamond B-22 · CD-72 · TCANC)

**Status**: LANDED at Diamond B-22

**What This Skill Does**: Arrow keys ↑↓←→ + Tab toggle the active button between [Y] Approve / [N] Cancel. Enter/Space activate the selected button. Y/N/Esc remain as direct shortcuts (B-8 backward compat).

**Pattern Spec**:
- `MenuState.trustConfer.selected: 'approve' | 'cancel'` field tracks active button (default 'approve')
- 2 NEW KeyActions: `trust-confer-toggle` (state mutation already applied by applyKeypress newState) · `trust-confer-activate` (translates to confirm OR decline based on `selected`)
- applyKeypress modal branch: arrow/Tab → toggle selected · Enter/Space → activate · Y/N/Esc → direct shortcut
- Visual cursor: ▶ glyph + REVERSE highlight on active button (PMSH · CD-76)
- Default 'approve' on install-selected dispatch preserves B-8 Y/Enter direct-confirm semantic

**Diameter Map**:
- SB-S77 ↔ B-Q SB-S35 renameMode modal (modal keypress discipline precedent)
- SB-S77 ↔ B-17 SB-S55 IAILT (input-lock modal pattern · same early-return discipline)
- SB-S77 → CD-78 candidate (future): generalize modal-arrow-nav-discipline to other modals

---

## SB-S78: Trust-Confer-Cancel-Aborts-Install-Cleanly (Diamond B-22 · CD-73 · TCCAI · STRUCTURAL)

**Status**: STRUCTURAL at Diamond B-22 (verified existing wiring · extended for arrow-nav)

**What This Skill Does**: N keypress / Esc / arrow-Enter on Cancel button → trustConfer state cleared · NO install routine fires · return to menu cleanly. Verified existing trust-confer-decline action does this (animatedTui.ts:743-746); trust-confer-activate translates Cancel selection to same decline path.

**Pattern Spec**:
- `trust-confer-decline` KeyAction (existing): `menuState = { ...menuState, trustConfer: undefined }` · `log('install.declined')` · NO handleInstall call
- `trust-confer-activate` (NEW · CD-72 TCANC): reads `state.trustConfer.selected`; if 'cancel' → log declined + return; if 'approve' → fire handleInstall
- Direct shortcuts (N · Esc) → trust-confer-decline (unchanged from B-8)
- Arrow-nav to Cancel + Enter → trust-confer-activate with selected='cancel' → declined

**Diameter Map**:
- SB-S78 ↔ B-8 SB-S42 (existing decline wiring · verified · extended)
- SB-S78 ↔ Pattern 4.1 sanctioning chain: user trust-confer-confirm authorizes; user trust-confer-decline aborts

---

## SB-S79: Trust-Confer-Pane-Flicker-Root-Cause-Resolution (Diamond B-22 · CD-74 · TCPFR)

**Status**: LANDED at Diamond B-22

**What This Skill Does**: Resolves visible flicker AND user-named "Lack of Mobility with the Cursor" issue. Root cause confirmed by Suite 4 Green forensics: `renderTrustConferPane` emitted `ANSI.HOME + ANSI.CLEAR_SCREEN` as first output AND `renderFrame` called it every 33ms (30 FPS loop). Full terminal clear + redraw 30/sec while pane visible → flicker + ANSI cursor positioning stomped per frame.

**Pattern Spec**:
- `renderTrustConferPane` no longer contains `ANSI.HOME + ANSI.CLEAR_SCREEN` (moved to caller)
- `renderFrame` (animatedTui.ts) NEW early-return branch: when `state.trustConfer !== undefined`, compute hash via `trustConferStateHash(state)`; compare against `lastTrustConferHash`; emit ANSI.HOME + CLEAR_SCREEN + renderMenu output ONLY when hash differs
- Hash composition: `[selected, paths.length, optionalPaths.length, cascadesPresent, termWidth, termHeight].join('|')`
- Reset `lastTrustConferHash = ''` on trustConfer transition to undefined (next open paints fresh)
- 30/sec wasted writes → 0/sec wasted writes (only on user input or terminal resize)

**Diameter Map**:
- SB-S79 ↔ SB-S80 MRFD (generalization of this pattern)
- SB-S79 ↔ CD-66 SRDBR (same-row-different-routing): cursor mobility was BLOCKED by flicker; resolution unblocks both UX and arrow-nav (CD-72 TCANC)
- SB-S79 → user-named hypothesis CONFIRMED: flicker IS root cause of cursor mobility issue

---

## SB-S80: Modal-Render-Frame-Decoupling-Discipline (Diamond B-22 · CD-75 · MRFD · STRUCTURAL)

**Status**: STRUCTURAL at Diamond B-22

**What This Skill Does**: Generalization of CD-74 TCPFR — modal panes (trustConfer · renameMode · future modals) should render-on-state-change, not per-FPS-frame. Hash-memo pattern composable across all modal surfaces.

**Pattern Spec**:
- Trigger: any modal field on MenuState (trustConfer · renameMode · etc.) becomes defined
- Mechanism: hash compare against lastModalHash; emit only on change
- Hash composition: include all fields that affect render output (selected state · text content · termWidth · termHeight)
- Reset on modal transition to undefined (next open paints fresh)
- Generalizes to N modal types via dispatch table

**Diameter Map**:
- SB-S80 ↔ SB-S79 TCPFR (concrete instance for trustConfer)
- SB-S80 ↔ B-17 SB-S56 FSIAO (full-screen overlay · install-animating uses different render path BUT same render-on-state-change principle)
- Future: extend to Q SB-S35 renameMode (currently re-renders 30/sec like trustConfer pre-B-22; could benefit from same hash-memo)

---

## SB-S82: Reference-Design-Test-Fixture-Scaffold (Diamond B-23 · CD-77 · RDTFS)

**Status**: LANDED at Diamond B-23

**What This Skill Does**: Materializes an 8-file Reference Design representing a "typical user Claude Code setup" at any caller-supplied destination directory. Reference Design content lives as bridge-embedded `SCS_MUX_FIXTURE_*` constants in `installConstants.ts` (mirrors B-19 BECIS pattern · bytes-stable · source-controlled). `scaffoldReferenceDesignFixture(destDir)` writes all 8 files, creates parent dirs as needed, returns the list of relative paths written. Idempotent — overwrites existing files on re-run.

**Pattern Spec**:
- Constants: 8 distinct content strings + `SCS_MUX_FIXTURE_FILES: ReadonlyArray<readonly [string, string]>` (path, content) tuples
- Function: iterates tuples, joins with destDir, calls `mkdirSync(parent, {recursive:true})` + `writeFileSync(full, content, 'utf8')`
- Returns: `string[]` of written relative paths
- Idempotent: existing files overwritten without error; existing parent dirs unchanged

**Diameter Map**:
- SB-S82 ↔ SB-S66 BECIS (B-19 · same bridge-embedded-constant authorial discipline)
- SB-S82 ↔ SB-S85 TUSS (Typical User Setup Specification → SB-S82 materializes that spec)
- SB-S82 ↔ SB-S83 SHSDV (scaffolded fixture is the source for snapshot+compare)

---

## SB-S83: Snapshot-Hash-State-Deterministic-Verification (Diamond B-23 · CD-82 · SHSDV)

**Status**: LANDED at Diamond B-23

**What This Skill Does**: Walks a directory tree recursively, hashes each file's content, returns aggregate SHA-256 hex over sorted `(relPath, contentHash)` pairs. Content-only — no stat metadata (mtime/atime would cause false-negatives across operations that touch files without changing content). Skip-list excludes irrelevant files (`*.bak`, `Cascades/Cascade.json`, `Cascades/Bridge/`, `.git/`, `node_modules/`, `.DS_Store`). Deterministic: same content → same hash, independent of walk order or filesystem timing.

**Pattern Spec**:
- Recursive walk: `readdirSync(dir).sort()` + recurse on directories
- Per-file: `readFileSync` + `createHash('sha256').update(content).digest('hex')`
- Per-tree: collect `{relPath, contentHash}` pairs · sort by relPath · feed into outer SHA-256 with `\0` separators
- Skip-list: 6 default RegExp patterns + caller-extensible `extraSkipPatterns` parameter
- Throws on missing directory (caller must ensure existence)

**Diameter Map**:
- SB-S83 ↔ SB-S84 MRV (snapshot is the foundation for comparison verification)
- SB-S83 ↔ SB-S87 Skip-List-Discipline (skip-list is the load-bearing line between meaningful divergence and irrelevant runtime state)
- SB-S83 ↔ Pattern 4 Modulation (filesystem-only read; no Claude state probe)

---

## SB-S84: Muxification-Reversibility-Verification (Diamond B-23 · CD-78 · MRV)

**Status**: LANDED at Diamond B-23 (infrastructure) · IMPL TARGET at B-26 (full round-trip)

**What This Skill Does**: File-by-file content comparison between two directories. Returns array of `{relPath, kind: 'only-in-a' | 'only-in-b' | 'content-mismatch'}` differences; empty array means directories match within skip-list scope. Used post-muxify-reverse to verify state matches original Reference Design. Preferred over pure state-hash because (a) timestamped `*.bak` files would cause false-positive hash mismatches even with skip-list at hash-time, and (b) caller gets actionable per-file diff info for debugging muxify failures.

**Pattern Spec**:
- Walk both directories into `Map<relPath, contentHash>` using same skip-list as SHSDV
- Iterate mapA: missing in mapB → `only-in-a`; hash differs → `content-mismatch`
- Iterate mapB: missing in mapA → `only-in-b`
- Sort diffs by relPath for deterministic output
- Throws on missing dirA or dirB

**Diameter Map**:
- SB-S84 ↔ SB-S83 SHSDV (compare uses same per-file hashing primitive)
- SB-S84 ↔ B-26 round-trip test (full IMPL: clone fixture → muxify → reverse → compare returns empty)
- SB-S84 ↔ SB-S88 MBDTC-Trajectory (Diamond chain target)

---

## SB-S85: Typical-User-Setup-Specification (Diamond B-23 · CD-81 · TUSS)

**Status**: LANDED at Diamond B-23

**What This Skill Does**: Defines the bare-minimum 8-file inventory representing "user has Claude Code set up" before SCS Bridge muxification. Inventory chosen to (a) be representative of real user setups (CLAUDE.md at root + `.claude/` duplicate · custom agent · custom command · minimal settings) and (b) provide collision targets for B-27 adversarial testing (`my-reviewer` agent name will collide with hypothetical SCS `reviewer` agent without sub-namespace).

**Pattern Spec** (8 files, 9 path entries):
1. `CLAUDE.md` — generic project instructions (2-space indent · named exports · npm test conventions)
2. `.claude/CLAUDE.md` — same content (typical user duplication)
3. `.claude/agents/my-reviewer.md` — custom code-review agent
4. `.claude/commands/review.md` — custom slash command
5. `.claude/settings.json` — minimal `{"permissions":{"allow":[]}}`
6. `README.md` — Setup + Project Structure
7. `package.json` — stub
8. `src/index.ts` — stub `greet(name)` export
9. `.gitignore` — `node_modules/` · `dist/` · `*.log` · **`*.bak`** (B-3 backups excluded from fixture identity)

**Diameter Map**:
- SB-S85 ↔ SB-S82 RDTFS (TUSS is the spec; RDTFS is the materialization)
- SB-S85 ↔ B-27 adversarial (my-reviewer is the collision target)
- SB-S85 ↔ Cross-platform readiness (forward-slash paths · no shebang · macOS-only B-cascade scope)

---

## SB-S86: BECIS-Mux-Extension-Bridge-Embedded-Reference-Content (Diamond B-23 · BECIS pattern reuse)

**Status**: LANDED at Diamond B-23

**What This Skill Does**: Extends the B-19 BECIS (Bridge-Embedded-Cascade-Initial-State) discipline from Cascade.json (single-file embedded JSON) to multi-file Reference Design (8 content constants + ordered tuple). Same authorial style: capitalized prefix (`SCS_MUX_FIXTURE_*`), exhaustive JSDoc rationale, source-of-truth in `installConstants.ts`. Same operational properties: bytes-stable, source-controlled, branch-source-independent, push-resilient.

**Pattern Spec**:
- Each file gets one `export const SCS_MUX_FIXTURE_<NAME> = '...'` constant
- Inventory tuple: `export const SCS_MUX_FIXTURE_FILES: ReadonlyArray<readonly [string, string]> = [['path1', CONST1], ['path2', CONST2], ...]`
- Tuple order = write order (parents before children where filesystem dependencies exist; otherwise alphabetical)
- Caller imports tuple, iterates, materializes via writeFileSync

**Diameter Map**:
- SB-S86 ↔ SB-S66 BECIS (parent pattern · single-file embedded JSON)
- SB-S86 ↔ SB-S82 RDTFS (consumer)
- SB-S86 ↔ Future: `Cascades/Lab/MuxificationTestFixture/` materialization on-disk if/when canonical materialized snapshot needed (B-24+)

---

## SB-S87: Skip-List-Discipline-State-Divergence-Boundary (Diamond B-23 · DEFAULT_SKIP_PATTERNS)

**Status**: LANDED at Diamond B-23 · STRUCTURAL

**What This Skill Does**: Codifies the line between "muxification-state divergence" (relevant for reversibility verification) and "irrelevant runtime/install-time state divergence" (must be skipped or every comparison false-positives). Skip-list is shared between SHSDV (snapshot) and MRV (compare) so the boundary is consistent across both primitives.

**Default Skip Patterns**:
- `*.bak` — B-3 timestamped CLAUDE.md backups (install-added; not part of fixture identity)
- `Cascades/Cascade.json` — B-19 BECIS-written; varies by install timestamp
- `Cascades/Bridge/` — runtime sessions, debug logs, registry
- `.git/` — version control metadata (irrelevant to muxification state)
- `node_modules/` — dependency tree (huge, deterministically reproducible from package.json)
- `.DS_Store` — macOS Finder metadata (filesystem noise)

**Diameter Map**:
- SB-S87 ↔ SB-S83 SHSDV + SB-S84 MRV (consumed by both)
- SB-S87 ↔ Pattern 4 Modulation (skip-list excludes `~/.claude/projects/` because muxFixture never reads there in the first place — defense-in-depth)
- SB-S87 ↔ Caller-extensible: `extraSkipPatterns` parameter on both SHSDV + MRV functions allows test-specific additions

---

## SB-S88: MBDTC-Muxification-Branch-Diamond-Trajectory-Chain (Diamond B-23 · CD-83 · TRAJECTORY)

**Status**: TRAJECTORY-NAMED at Diamond B-23 · IMPL ARC B-23..B-27

**What This Skill Does**: Names the 5-Diamond chain composing the Muxification Branch from B-23 transition through B-27 adversarial edge cases. Each Diamond's deliverable is the foundation for the next; cross-Diamond Diameters bind the chain into a single architectural arc.

**Chain**:
- B-23 (LANDED): Reference Design fixture + reversibility infrastructure (SB-S82..SB-S87)
- B-24 (NEXT): Muxification implementation — bridge install for pre-existing Claude Code, preserves user CLAUDE.md/agents/commands, agent sub-namespace `.claude/agents/scs-{name}` (CD-79 PECCC IMPL)
- B-25 (FUTURE): SCS Uninstall command + B-5 agents-backup persistence refactor (close EPHEMERAL gap; CD-80 SUBR IMPL)
- B-26 (FUTURE): End-to-end round-trip test (clone B-23 fixture → muxify B-24 → reverse B-25 → compareDirectories returns empty diff; CD-78 MRV IMPL CORONATION)
- B-27 (FUTURE): Adversarial edge cases (existing CLAUDE.md merge conflicts · agent name collision · partial-muxify recovery · re-muxify idempotence)

**Cross-Diamond Diameters**:
- B-23 fixture ↔ B-25 uninstall (snapshot-based test reversibility composes with production uninstall)
- B-26 round-trip ↔ ALL prior (composes B-23 + B-24 + B-25 into single Concluder gate)
- B-27 adversarial ↔ B-24 muxify (extends muxify with collision-resolution semantics)

**Diameter Map**:
- SB-S88 ↔ All B-23 skills (S82..S87 · the foundation B-24..B-27 build upon)
- SB-S88 ↔ Suite 6 Purple v8.0 v-bump rationale (Muxification Branch milestone landing at B-24/B-25)

---

## SB-S103: Shatterite-Driven-Suite-8-Naming-Welcome (Diamond B-25-UX · CD-98 · SDSWN)

**Status**: LANDED at Diamond B-25-UX (v8.0 milestone)

**What This Skill Does**: Replaces unilateral S7 auto-naming with user-driven Shatterite menu (`SM-NAME-SUITE-8`). Generates 4-6 algorithmic suggestions sourced from package.json + CLAUDE.md H1/H2 + project-type signals · sanitize pipeline fixes B-24-FIX bug (`user-project` → "User", not "User Project Project Context"). User picks via arrow-nav · Custom row enables free-text · Keep auto-name preserves S7 default · Cancel halts cleanly.

**Pattern Spec**:
- `generateNameSuggestions({userCwd, preInstallSnapshotDir})` returns ordered NameSuggestion[] (Slot A pkg-name → Slot B type-qualified → Slot C/D H2-vocab → Slot E bare → Slot F custom · F is menu-handled not function-output)
- `sanitizeProjectName(raw)`: strip `@scope/` → strip trailing `-project|_project| project` → replace `-_` with space → title-case → return BARE name
- Generic-skip list (13 names): `my-app`, `my-project`, `user-project`, `app`, `project`, `starter`, `template`, `boilerplate`, `example`, `test`, `demo`, `repo`, `code`
- Generic-name → SKIP to next priority signal (H1 → H2 → dir basename → fallback "User Project Context")

**Diameter Map**:
- SB-S103 ↔ SB-S104 PTSNS (project-type signal feeds Slot B)
- SB-S103 ↔ Pewter SM-NAME-SUITE-8 menu Reference Design
- SB-S103 ↔ B-24-FIX S7 (replaces S7's unilateral naming with user agency)

---

## SB-S104: Project-Type-Signal-Naming-Suggestion-Heuristic (Diamond B-25-UX · CD-99 · PTSNS)

**Status**: LANDED at Diamond B-25-UX

**What This Skill Does**: Detects project type from filesystem signals to inform Slot B type-qualified suggestion. Signals: `tsconfig.json` (TypeScript) · `pyproject.toml` / `requirements.txt` (Python) · `Cargo.toml` (Rust) · `go.mod` (Go) · `vue.config.js` or vue dependency (Vue) · react dependency (React) · `package.json` fallback (Node) · returns 'unknown' for empty dirs.

**Pattern Spec**: lockfile + dependency dual-signal detection. TypeScript suffix is "TypeScript Library" (libraries are common); other types use "App" suffix (e.g., "Vue App", "Node App"). Future Diamonds can extend with finer heuristics (Vite vs Next vs Nuxt distinction).

**Diameter Map**:
- SB-S104 ↔ SB-S103 SDSWN (Slot B suggestion source)
- SB-S104 ↔ B-23 fixture (test-fixture has `package.json` for type detection verification)

---

## SB-S105: Memory-Surfaced-Existing-Project-Detection (Diamond B-25-UX · CD-100 · MSEPD)

**Status**: LANDED at Diamond B-25-UX

**What This Skill Does**: Probes `~/.claude/projects/{encoded-cwd}/` for prior session JSONLs to classify install as fresh-slate vs existing-project. Pattern 4 metadata-only — never opens JSONL contents. Encoded-cwd format: `/` → `-` (verified on real filesystem · format `-Users-x-Work-proj`). Returns `MemoryProbeResult { encodedCwd, projectsDir, exists, sessionCount, latestMtime, classification }`.

**Pattern Spec**:
- `probeProjectMemory(userCwd, homeDirOverride?)` (override for tests)
- `classification: 'existing-project' | 'fresh-slate'` (sessionCount > 0 → existing)
- `formatLatestSessionAge(latestMtime, nowMs?)` returns "3 days ago" / "2 hours ago" / "just now" / "no prior sessions"

**Diameter Map**:
- SB-S105 ↔ SM-WELCOME-RI-ENGAGE PATH A vs PATH B branching
- SB-S105 ↔ Pattern 4 boundary (Suite 4 Green Angle 3 resolution: install agent IS Claude · metadata read legitimate)

---

## SB-S106: Conditional-Multi-Suite-8-Router-Detection (Diamond B-25-UX · CD-101 · CMSRD)

**Status**: LANDED at Diamond B-25-UX

**What This Skill Does**: 3-signal hard gate detection of router architecture in user CLAUDE.md. ALL three must fire: H2 ≥4 AND ≥2 distinct router-keywords (router, dispatch, orchestrat, multi-agent, routing, agent A/B) AND ≥2 mutually-exclusive H2 pairs (token overlap <50%). Drops false-positive rate from ~40% (keyword-only) to ~5% (3-signal AND).

**Pattern Spec**:
- `detectRouterPattern(claudeMdPath)` returns `RouterDetectionResult { h2Count, h2Labels, routerKeywordsFound, mutualExclusiveCount, isRouterPattern }`
- User-confirmation invariant: agent NEVER auto-splits regardless of signal strength · `SM-MULTI-SUITE-BRANCH` is ADVISORY only

**Diameter Map**:
- SB-S106 ↔ SM-MULTI-SUITE-BRANCH menu Reference Design
- SB-S106 ↔ Suite 4 Green Angle 2 hard threshold values

---

## SB-S107: Cinnabar-Dialectic-Welcome-Engagement (Diamond B-25-UX · CD-102 · CDWE)

**Status**: DESIGNED at Diamond B-25-UX (handoff to Cinnabar Suite 8 implementation)

**What This Skill Does**: For existing-project drop-ins, S8 Band 6 offers `[D] Cinnabar Dialectic` menu option. When user picks, install agent invokes Cinnabar Dialectic Suite 8 in dialectic-only mode (2-question scope · ~500-1500 tokens · NEVER full session-analysis). Result feeds back into First Diamond recovery direction OR re-renders Welcome menu for further decisions.

**Pattern Spec**:
- Optional · user-driven · never auto-fires
- Dialectic-only constraint (Suite 4 Green Angle 4 cost mitigation)
- Fallback: if Cinnabar Suite 8 absent → plain `AskUserQuestion` for "What were you working on?"

**Diameter Map**:
- SB-S107 ↔ Cinnabar Dialectic Suite 8 (dialectic-only invocation)
- SB-S107 ↔ SB-S108 FDSI (Cinnabar summary feeds First Diamond recovery direction)

---

## SB-S108: First-Diamond-Stratidian-Initiation (Diamond B-25-UX · CD-104 · FDSI)

**Status**: LANDED at Diamond B-25-UX

**What This Skill Does**: Install agent creates `Cascades/Working/DIAMOND-TIER-1.md` framing the user's first Cascade engagement. Two variants: 'recovery' (existing-project · Cinnabar-derived direction OR Cinnabar-pending placeholder) · 'tutorial' (fresh-slate · Manifold introduction + Length 1-3 cycle suggestion). Written atomically as part of `activateRenewableIntelligence`.

**Pattern Spec**:
- `buildFirstDiamond({suite8Name, diamondType, cinnabarSummary?})` returns markdown body
- Recovery body: "Recovery Direction (Cinnabar-Derived)" header + summary + "First Cascade Cycle" section
- Tutorial body: Manifold introduction + cycle suggestion + /scs-cascade pointer

**Diameter Map**:
- SB-S108 ↔ SB-S109 RIIA (FDSI Diamond write IS one of RIIA's three atomic writes · Suite 2 Orange Initiation Muxameter)
- SB-S108 ↔ SM-WELCOME-RI-ENGAGE [C] Continue / [F] First Diamond engages this artifact

---

## SB-S109: Renewable-Intelligence-Install-Activation (Diamond B-25-UX · CD-103 · RIIA)

**Status**: LANDED at Diamond B-25-UX · STRUCTURAL atomic-or-rollback

**What This Skill Does**: Atomic 3-write activation — Onyx-Tier-1.md FIRST (Pearl Clinical Summation seed · immutable) · Diamond-Tier-1.md SECOND (mutable plan) · Cascade.json LAST (live state cycle 0→1 · temp+rename atomic). All-or-none contract: any write failure rolls back prior writes via deletion. Suite 6 Purple D-6 high-severity risk (partial RI state) mitigated structurally.

**Pattern Spec**:
- `activateRenewableIntelligence({userCwd, suite8Name, diamondType, cinnabarSummary?})` → `RiActivationResult { onyxPath, diamondPath, cascadeJsonPath, cycleBefore, cycleAfter }`
- Throws on any failure with clear error · prior writes rolled back via unlinkSync
- Cascade.json malformed JSON → fail-fast BEFORE any write (atomicity gate at step 0)

**Diameter Map**:
- SB-S109 ↔ SB-S108 FDSI (Diamond write is step 2 of 3)
- SB-S109 ↔ Manifest schema v3 'updated' action enum (Cascade.json cycle change tracked for B-26 reverse)

---

## SB-S110: Pewter-HiFi-Stratidian-Welcome-Override (Diamond B-25-UX · CD-105 · PHSWO)

**Status**: LANDED at Diamond B-25-UX

**What This Skill Does**: Replaces B-24-FIX's 11-line plain-text priming wall with Pewter HiFi welcome. Install agent's first turn is a 5-7 line user-facing welcome inside D5 closed-box border (Cobalt title · Viridian highlights for "yours-already" content · Pewter neutral body). Repairs install-anxiety Diameter ("Nothing was overwritten") · previews next steps (naming · branching if relevant · welcome menu).

**Pattern Spec**:
- Body content drafted by Pewter Tessera (B-24-UX foundation deliverable)
- `SCS_INSTALL_MUXIFY_AGENT_PROMPT` directive: "Begin with a Pewter HiFi welcome to the user (5-7 lines, framed in D5 closed-box border)"
- Cross-surface coherence: shares D5 + D7 with B-22 trust-confer pane + B-17/18 install animation

**Diameter Map**:
- SB-S110 ↔ B-22 Pewter HiFi v3 (visual continuity)
- SB-S110 ↔ SB-S102 PTPMS (B-24-FIX timing-race immunity preserved · plain-text directive triggers Pewter welcome)

---

## SB-S111: Bridge-To-Agent-Welcome-Handoff-Discipline (Diamond B-25-UX · CD-106 · BAWHD)

**Status**: STRUCTURAL at Diamond B-25-UX

**What This Skill Does**: Codifies the structural rule that bridge does scaffold + spawn (Pattern 4 Modulation · filesystem-only at user cwd) and install agent does welcome + dialectic + RI activation (Pattern 4.1 Sanctioning · within Claude awareness). The handoff at spawn time is via joined Suite 8 + plain-text priming. Bridge cannot do agent's work (no intelligence); agent cannot do bridge's pre-spawn work (not yet running). Each layer holds its own discipline.

**Pattern Spec**: not a function — a structural property emerging from B-23 (fixture) + B-24 (Iced + manifest) + B-24-FIX (Path B routing) + B-25-UX (S8 + RI + memory probe) composing together.

**Diameter Map**:
- SB-S111 ⊃ SB-S99..SB-S110 (composition of all B-24-FIX + B-25-UX patterns)
- SB-S111 ↔ Pattern 4 vs Pattern 4.1 boundary (Suite 4 Green Angle 3 resolution canonical)

---

## SB-S112: User-Trust-Through-Stratidian-Welcome (Diamond B-25-UX · CD-107 · UTSW · v8.0 PEARL)

**Status**: STRUCTURAL at Diamond B-25-UX · LOAD-BEARING v8.0 MILESTONE PEARL

**What This Skill Does**: Names the Pearl synthesis of Diamond B-25-UX — the user is a Manifold member with agency at every choice point, not a hosted-tenant receiving agent decisions. Every Shatterite menu surfaces user choice (naming · branching · continuing · re-engaging · exiting). The install isn't a deposit; it's an INDUCTION. v8.0 EARNED at this Diamond.

**Pattern Spec**: not a function — the qualitative leap that justifies Suite 8 v8.0 major bump (Suite 6 Purple trajectory rationale: "full Stratidian induction arc is the ontological leap that earns v8.0 · Uninstall is surgical reversal, not ontological elevation").

**Diameter Map**:
- SB-S112 ⊃ All B-25-UX skills (S103..S111 compose into UTSW)
- SB-S112 ↔ B-24 SB-S98 TEPTSG (user-trust contract extended from "structural exit" to "agentive entry")
- SB-S112 ↔ Pearl-of-Pearls: B-23 reversibility · B-24 composition · B-24-FIX joined-context · **B-25-UX welcome-as-membership**

---

## SB-S99: Path-B-Routing-For-Muxified-Path (Diamond B-24-FIX · CD-94 · PBRMP)

**Status**: LANDED at Diamond B-24-FIX (rotation 2 of B-24)

**What This Skill Does**: Routes Muxified Path installs through the pre-existing Path B infrastructure (`runInstallSpawnPipeline` / NEW `runInstallMuxifiedPath`) which spawns the install agent with `--append-system-prompt-file=joinedSuite8` AND positional `seedPrompt`. The install agent receives the full SCS Bridge Suite 8 (Instance + Conductor + Skill + Strategy/S1..S7) as appended system prompt and a plain-text priming directing execution of Strategy S7. Replaces B-24's wrong-path Path A menu launch routing.

**Pattern Spec**:
- New function `runInstallMuxifiedPath(opts)` combines bridge-side scaffold (Cascades/, .claude/ drop-in, Iced snapshot, manifest, UserSCSConfig) with Path B spawn
- `assembleJoinedSuite8` concatenates all 10 SOURCES (3 Suite docs + 7 Strategy files including NEW S7) into one file
- `spawnInstallInstance` spawns Claude Code with `--append-system-prompt-file=joinedFilePath` and `seedPrompt`
- Pre-spawn fs.statSync invariants verify scs-cascade.md AND joined Suite 8 file exist before spawn
- handleInstall first-time-install branch (`!cascadesScaffoldPresent`) calls runInstallMuxifiedPath; Reinstall branch (`cascadesScaffoldPresent`) keeps runInstallScaffoldOnly path for now (B-25 may unify)

**Diameter Map**:
- SB-S99 ↔ B-11 era spawnInstallInstance pre-existing infrastructure (Path B was built but unused for Muxified)
- SB-S99 ↔ SB-S101 ASMS7 (S7 Strategy is what install agent executes via Path B priming)
- SB-S99 ↔ SB-S102 PTPMS (plain-text priming structurally eliminates slash-command timing race)

---

## SB-S100: Drop-In-CLAUDE-MD-Tight-Manifold-Discipline (Diamond B-24-FIX · CD-95 · DICMD)

**Status**: LANDED at Diamond B-24-FIX

**What This Skill Does**: SCS Manifold drops into `.claude/CLAUDE.md` verbatim — NOT delimited-appended above user content. Honors Claude Code's tight 40K project-memory character budget. User's pre-existing CLAUDE.md content is preserved ONLY in `Cascades/Iced/PreInstallSnapshot/{ts}/` and gets first-class Suite 8 treatment via Strategy S7 muxification (NOT a delimited prefix demotion).

**Pattern Spec**:
- `dropInClaudeMd(targetPath, scsContent, relPath)` in `muxCompose.ts` — simple writeFileSync verbatim
- ManifestFileEntry action: `'replaced'` if file existed, `'created'` if new (schema v2)
- Replaces B-24's `composeClaudeMd` (delimited-append, ~50 LOC, removed entirely)
- ICED_MANIFEST_SCHEMA_VERSION 1 → 2 reflects the action enum addition

**Diameter Map**:
- SB-S100 ↔ B-24 SB-S93 CNRPFT-CLAUDEMD (predecessor delimited-append · superseded)
- SB-S100 ↔ SB-S101 ASMS7 (user content preserved for S7 to muxify into Suite 8)
- SB-S100 ↔ B-25 reverse (drop-back from snapshot is one copyFileSync · simpler than delimiter strip)

---

## SB-S101: Agent-Side-Muxification-Strategy-S7 (Diamond B-24-FIX · CD-96 · ASMS7)

**Status**: LANDED at Diamond B-24-FIX

**What This Skill Does**: NEW Strategy S7-MuxifyUserClaudeMd at `Cascades/8_SUITES/SCS Bridge/Strategy/S7-MuxifyUserClaudeMd.md` directs the install agent (which has full SCS Bridge Suite 8 context loaded via Path B) to read user's preserved CLAUDE.md from `Cascades/Iced/PreInstallSnapshot/{ts}/`, auto-name a Suite 8 from package.json (or default `User Project Context`), write `Cascades/8_SUITES/{name}/Instance.md` with Stratidian boilerplate + user content body, append registry row to SUITE8-REGISTRY.md if exists, then engage `/scs-cascade` to begin user's first cycle.

**Pattern Spec**:
- 5-Band Vermillion: Curate (find snapshot · auto-name) · Examine (read content · assess router-pattern) · Build (write Instance.md) · Register (SUITE8-REGISTRY.md if exists) · Closeout (engage /scs-cascade)
- Snapshot source only — never reads live `.claude/CLAUDE.md` (which is now SCS Manifold)
- Single Suite 8 default — multi-Suite router-architecture split deferred to B-27 adversarial
- No overwrite — if `{name}/` exists, append `-2` suffix
- Manifest gets `'agent-derived'` action entry for B-25 reverse to remove the directory

**Diameter Map**:
- SB-S101 ↔ SOURCES array (S7 added at end · 9 → 10 entries)
- SB-S101 ↔ SB-S99 PBRMP (S7 reaches install agent via Path B appended system prompt)
- SB-S101 ↔ B-27 adversarial (router-pattern multi-Suite split lands there)
- SB-S101 ↔ SB-S100 DICMD (drop-in preserves snapshot for S7 to muxify)

---

## SB-S102: Plain-Text-Priming-Muxified-Spawn (Diamond B-24-FIX · CD-97 · PTPMS)

**Status**: LANDED at Diamond B-24-FIX · STRUCTURAL TIMING-RACE-IMMUNE

**What This Skill Does**: `SCS_INSTALL_MUXIFY_AGENT_PROMPT` is plain-text (NOT a slash command) directing the install agent to execute Strategy S7. Eliminates Claude Code session-start command-index timing race that plagued B-24's slash-command priming (`/cascade` → "Unknown command"). The terminal `/scs-cascade` engagement happens from S7 Band 5 AFTER muxification completes — by then Claude Code has fully indexed `.claude/commands/scs-cascade.md`.

**Pattern Spec**:
- Plain-text constant in `installConstants.ts` — references PreInstallSnapshot path · directs S7 execution · names auto-Suite-8 strategy
- Replaces B-24's `'/cascade'` priming (which was stale B-15-era constant with no test verifying file match)
- Defense-in-depth: pre-spawn `fs.statSync` invariants in `runInstallMuxifiedPath` verify scs-cascade.md exists (so when S7 Band 5 engages `/scs-cascade`, file is guaranteed present)

**Diameter Map**:
- SB-S102 ↔ SB-S99 PBRMP (priming becomes positional seedPrompt to spawnInstallInstance)
- SB-S102 ↔ SB-S101 ASMS7 (priming directs S7 execution explicitly)
- SB-S102 ↔ Pattern: any future spawn-after-write where slash-command timing matters should use plain-text priming

---

## SB-S89: Muxified-Path-Activation-Discrimination (Diamond B-24 · CD-84 · MPAD)

**Status**: LANDED at Diamond B-24

**What This Skill Does**: Detection module (`muxDetect.ts`) that probes user's cwd before any install write. Returns `'fresh' | 'muxified' | 'remuxify'` mux state determining install routing. Detection runs in BOTH install and reinstall flows (CD-89 RRTMU unification). Pure filesystem read — Pattern 4 Modulation preserved.

**Pattern Spec**:
- `detectUserState(cwd) → UserStatePresence` (5 booleans + aggregate `detected`)
- `detectMuxState(cwd) → {state, userState, hasIcedManifest}` (Iced manifest presence wins precedence)
- Empty `.gitkeep` and `{}` settings.json correctly treated as "not present"

**Diameter Map**:
- SB-S89 ↔ SB-S91 PISCD (snapshot capture conditional on userState.detected)
- SB-S89 ↔ SB-S95 RRTMU (Reinstall path consults same detector)
- SB-S89 ↔ Pattern 4 (filesystem-only, no Claude state read)

---

## SB-S90: Iced-Folder-Frozen-Aside-But-Living-Compositional-Semantics (Diamond B-24 · CD-85 · IFALS)

**Status**: LANDED at Diamond B-24 · STRUCTURAL

**What This Skill Does**: Names the new `Cascades/Iced/` convention as a Stratidian Demometer — preserved + protected sub-area within Cascades/ that COMPOSES with rather than nests within the main install. Three sub-areas serve three purposes: PreInstallSnapshot (revert source · CD-86) · MuxificationManifest.json (declarative change record · CD-87) · UserSCSConfig (user personalization protected · CD-92).

**Pattern Spec**:
- `Cascades/Iced/PreInstallSnapshot/{ts}/` — timestamped (multi-reinstall coexistence)
- `Cascades/Iced/MuxificationManifest.json` — single file, latest install authoritative; preInstallSnapshotDir field links to specific snapshot
- `Cascades/Iced/UserSCSConfig/` — `.gitkeep` + README explaining user ownership; SCS updates never touch
- Iced is excluded from `pathFilterCascadesScaffold` to prevent silent erase on reinstall (Suite 6 Purple D-6)

**Diameter Map**:
- SB-S90 ↔ SB-S91 (PreInstallSnapshot is Iced sub-area)
- SB-S90 ↔ SB-S92 (Manifest is Iced sub-area)
- SB-S90 ↔ SB-S96 (USCPPP UserSCSConfig is Iced sub-area)
- SB-S90 ↔ SB-S98 TEPTSG (Iced is the declaration of bounded SCS footprint)

---

## SB-S91: Pre-Install-Snapshot-Capture-Discipline (Diamond B-24 · CD-86 · PISCD)

**Status**: LANDED at Diamond B-24

**What This Skill Does**: Captures user's pre-install state to `Cascades/Iced/PreInstallSnapshot/{ts}/` for B-25 revert source. Replaces the EPHEMERAL B-5 `backupUserDotClaudeAgents` (which wrote to tempDir cleaned at install end — Suite 4 Green B-23 audit finding). Captures: root CLAUDE.md · .claude/CLAUDE.md · .claude/agents/ (recursive) · .claude/commands/ (recursive) · .claude/settings.json. Timestamped subfolder enables multi-reinstall coexistence.

**Pattern Spec**:
- `captureSnapshot(userCwd, timestamp, userState) → {snapshotDir, snapshotRelPath, capturedFiles}`
- Conditional capture per UserStatePresence flag (only what exists)
- POSIX-style snapshotRelPath in manifest for cross-platform readiness
- Byte-for-byte content preservation (cpSync recursive · copyFileSync for individual files)

**Diameter Map**:
- SB-S91 ↔ SB-S89 MPAD (consumes detection result)
- SB-S91 ↔ SB-S92 MMDC (snapshotRelPath embedded in manifest)
- SB-S91 ↔ B-25 reverse (snapshot is the byte source for revert)
- SB-S91 ↔ B-3 *.bak (defense-in-depth: PISCD primary, .bak secondary)

---

## SB-S92: Muxification-Manifest-Declarative-Change-Record (Diamond B-24 · CD-87 · MMDC)

**Status**: LANDED at Diamond B-24 · STRUCTURAL · FROZEN B-25 CONTRACT

**What This Skill Does**: JSON schema + read/write/atomic operations for `Cascades/Iced/MuxificationManifest.json`. Schema version 1 frozen at B-24 close — B-25 reverse-muxify reads this exact format. Per-file entry `action` enum (`'created' | 'appended' | 'merged' | 'untouched'`) maps directly to reversal operations.

**Pattern Spec**:
- `MuxificationManifest = {schemaVersion, scsBridgeVersion, installTimestamp, preInstallSnapshotDir, userStateDetected, files[]}`
- `ManifestFileEntry = {relPath, action, preInstallExisted, delimiterStart?, delimiterEnd?, scsAdditions?}`
- Atomic write: `.tmp` → rename (prevents partial-state on mid-write crash)
- `readManifest` returns null on missing/invalid — caller handles gracefully
- `ICED_MANIFEST_SCHEMA_VERSION` constant in installConstants.ts is the version-bump signal

**Diameter Map**:
- SB-S92 ↔ B-25 reverse (frozen contract · Suite 6 Purple D-1 load-bearing)
- SB-S92 ↔ SB-S91 PISCD (preInstallSnapshotDir field links manifest to snapshot)
- SB-S92 ↔ SB-S93..SB-S96 (per-file entries from compose primitives)

---

## SB-S93: Compose-Not-Replace-CLAUDE-MD-Delimited-Append (Diamond B-24 · CD-88 · CNRPFT)

**Status**: LANDED at Diamond B-24

**What This Skill Does**: `composeClaudeMd(target, scsContent, scsBridgeVersion, relPathInManifest)` appends SCS Manifold to user CLAUDE.md between version-aware delimiters. Idempotent re-muxify (replaces existing block in-place). Cross-version upgrade (open-tag version-aware match strips old block, writes new). End-of-file normalization to single trailing newline (idempotence invariant).

**Pattern Spec**:
- Open delimiter: `<!-- BEGIN SCS-BRIDGE-MANIFOLD v{version} -->` (version-aware)
- Close delimiter: `<!-- END SCS-BRIDGE-MANIFOLD -->` (version-agnostic for cross-version match)
- `findExistingOpenDelimiter` matches any prior version → enables upgrade
- Returns `ManifestFileEntry` with `action: 'created' | 'appended'` + delimiter strings (B-25 reverse-precision contract)

**Diameter Map**:
- SB-S93 ↔ SB-S92 MMDC (entry recorded with delimiter strings)
- SB-S93 ↔ B-25 reverse (regex strips block between delimiters using same constants)
- SB-S93 ↔ `installConstants.ts` SCS_CLAUDEMD_DELIMITER_OPEN_PREFIX + SCS_CLAUDEMD_DELIMITER_CLOSE (single-source-of-truth · Suite 6 Purple delimiter constant discipline)

---

## SB-S94: Compose-Not-Replace-Agents-And-Commands-Sub-Namespace (Diamond B-24 · CD-93 · ASNCPP)

**Status**: LANDED at Diamond B-24

**What This Skill Does**: `namespaceAgents` + `namespaceCommands` copy SCS agent/command markdown files from clone source to user's `.claude/agents/` + `.claude/commands/` with `scs-` prefix. User's pre-existing files (e.g., `my-reviewer.md` from B-23 Reference Design fixture) are NEVER touched — collision prevention is structural via prefix. Idempotent: source already prefixed `scs-*.md` is not double-prefixed.

**Pattern Spec**:
- Reads `.md` files from src dir; writes to dest with prefix conditional
- `if (item.startsWith(prefix)) destName = item; else destName = prefix + item;`
- Returns array of `ManifestFileEntry` for B-25 reverse (scs-prefixed files removable by name match)
- Identical pattern for both agents and commands (DRY via shared `namespaceFiles` helper)

**Diameter Map**:
- SB-S94 ↔ SB-S92 MMDC (entries recorded for B-25 surgical removal)
- SB-S94 ↔ SB-S98 TEPTSG (`scs-*` prefix IS the structural exit signal for `rm scs-*` two-step exit)
- SB-S94 ↔ B-23 Reference Design `my-reviewer.md` (collision target verified BYTE-UNCHANGED in B-24 smoke test)

---

## SB-S95: Compose-Not-Replace-Settings-JSON-Additive-Merge (Diamond B-24 · CD-88 · CNRPFT)

**Status**: LANDED at Diamond B-24

**What This Skill Does**: `mergeSettingsJson(target, scsHooks, scsPermissionsAllow)` adds SCS hooks/permissions to user's settings.json. Rules: user wins on every key collision (SCS additions only fill gaps); hooks[] are concatenated (SCS appends after user's); permissions.allow deduped on collision. Invalid JSON → fail-fast with clear error. Records `scsAdditions` array in manifest entry for B-25 surgical reverse.

**Pattern Spec**:
- Hooks: `userSettings.hooks = [...userHooks, ...scsHooks]` (additive append; user first)
- Permissions: `Array.from(new Set([...userAllow, ...scsPermissionsAllow]))` (dedup union)
- JSON parse failure → throw with file path in message
- scsAdditions = `['hooks[+N]', 'permissions.allow[+M]']` for B-25 size-precise reverse

**Diameter Map**:
- SB-S95 ↔ SB-S92 MMDC (entries recorded with scsAdditions for B-25 contract)
- SB-S95 ↔ B-25 reverse (uses scsAdditions counts to remove only N appended hooks from end)
- SB-S95 ↔ Pattern 4 (filesystem read of user file; never `~/.claude/projects/`)

---

## SB-S96: Reinstall-Routes-Through-Muxified-Path-Unification (Diamond B-24 · CD-89 · RRTMU)

**Status**: LANDED at Diamond B-24

**What This Skill Does**: Per user directive, Reinstall path now routes through Muxified Path detection — first-install and reinstall semantics unified under compose-not-replace when user state is detected. Achieved structurally: `detectMuxState` runs in `runInstallScaffoldOnly` BEFORE any write; both Path A (first install · `cascadesPresent === false`) and Path B Reinstall (`cascadesPresent === true`) call the same function with the same detection logic. `pathFilterCascadesScaffold` excludes `Iced/` so the muxification record SURVIVES reinstall (Suite 6 Purple D-6 critical-fix).

**Pattern Spec**:
- One detection function consumed by both install and reinstall callers
- Iced/ filter exclusion in `pathFilterCascadesScaffold` prevents silent erase
- Reinstall over existing Iced manifest → `state='remuxify'` → re-muxify is idempotent (delimiter replace + scs-prefix dedup + manifest overwrite)

**Diameter Map**:
- SB-S96 ↔ SB-S89 MPAD (single detection authority)
- SB-S96 ↔ SB-S90 IFALS (Iced/ filter exclusion preserves manifest)
- SB-S96 ↔ B-21 RRSF (extension semantic — Reinstall existed; B-24 routes it through Muxified)

---

## SB-S97: User-SCS-Configuration-Personalization-Persistence-Protection (Diamond B-24 · CD-92 · USCPPP)

**Status**: LANDED at Diamond B-24

**What This Skill Does**: `Cascades/Iced/UserSCSConfig/` is scaffolded with `.gitkeep` + README on first install via `ensureUserSCSConfigDir`. README explains user ownership ("This directory is YOURS. SCS Bridge updates will not modify or remove its contents."). The `pathFilterCascadesScaffold` Iced exclusion automatically protects this sub-area from reinstall overwrites. User customizations to SCS (custom Suite 8 instances · project overrides) survive reinstall + SCS version updates.

**Pattern Spec**:
- `ensureUserSCSConfigDir(userCwd)` idempotent — does not overwrite existing files
- `.gitkeep` + README placed only when missing
- Protected by Iced/ filter exclusion (no separate logic needed)

**Diameter Map**:
- SB-S97 ↔ SB-S90 IFALS (UserSCSConfig is Iced sub-area)
- SB-S97 ↔ SB-S96 RRTMU (Iced filter protects USCPPP through reinstall)
- SB-S97 ↔ User trust contract (continue-using-SCS exit path requires personalization persistence)

---

## SB-S98: Three-Exit-Path-User-Trust-Structural-Guarantee (Diamond B-24 · CD-90 · TEPTSG)

**Status**: STRUCTURAL at Diamond B-24 · LOAD-BEARING USER-TRUST PROPERTY

**What This Skill Does**: Codifies the three exit paths user always has from SCS Bridge:
1. **Continue using SCS** — UserSCSConfig protected from updates (SB-S97 USCPPP)
2. **`scs uninstall`** (B-25) — manifest + snapshot used for one-command revert (SB-S92 MMDC contract)
3. **`rm -rf Cascades/ && rm .claude/agents/scs-*.md .claude/commands/scs-*.md`** + manual delimiter strip — two-step manual exit always tractable via `scs-` prefix structural signal (SB-S94 ASNCPP) and CLAUDE.md delimited block (SB-S93)

**Suite 4 Green Resolution**: pure single-command `rm -rf Cascades/` cannot remove files outside `Cascades/` (Claude Code reads them by necessity). The `scs-` prefix discipline + delimited CLAUDE.md block make manual exit always tractable WITHOUT depending on agent goodwill.

**Pattern Spec**: not a function — a structural property emerging from SB-S89..SB-S97 composing together. Verified in B-24 smoke test: `my-reviewer.md` byte-unchanged after muxify; user CLAUDE.md content preserved at top of file with SCS Manifold below delimiters.

**Diameter Map**:
- SB-S98 ⊃ SB-S89..SB-S97 (composition of all B-24 patterns)
- SB-S98 ↔ B-27 adversarial (verification test: `rm -rf Cascades/` + manual scs-* removal returns user state to pre-install via compareDirectories)
- SB-S98 ↔ User trust contract (the user can ALWAYS exit cleanly without SCS cooperation)

---

## SB-S81: Pewter-Modal-Selected-State-Highlight (Diamond B-22 · CD-76 · PMSH)

**Status**: LANDED at Diamond B-22

**What This Skill Does**: Pewter D7 Button Variant System applied to TUI modal buttons. Active button: REVERSE + BOLD + suite-tinted color + ▶ glyph; inactive: 2-space prefix + dim Pewter. Visual selected-state cursor enables user to see which button arrow-nav has focused.

**Pattern Spec**:
- Active prefix: `▶ ` (2-char visible width)
- Inactive prefix: `  ` (2-space pad · same visible width as ▶ )
- Active style: `${ANSI.REVERSE}${ANSI.BOLD}${suiteColor}${prefix}${text}${ANSI.RESET}`
- Inactive style: `${PEWTER_DIM}${prefix}${text}${ANSI.RESET}`
- Suite color choice: COBALT for Approve · ROSE for Cancel (D1 color token + emotional tone match)

**Diameter Map**:
- SB-S81 ↔ SB-S77 TCANC (visual feedback for arrow-nav state)
- SB-S81 ↔ Pewter D7 Button Variant System (web HiFi → TUI translation)
- Future: extend to other modal buttons across the bridge

---

## SB-S74: Post-Scaffold-Cascades-Present-Reflexive-Probe (Diamond B-21 · CD-68 · PSCRP)

**Status**: LANDED at Diamond B-21

**What This Skill Does**: After `handleInstall` Path A scaffold completes successfully, flips `menuState.cascadesPresent = true` so the bridge UI immediately reflects the just-completed filesystem reality. Without this, `cascadesPresent` was probed-once at TUI startup (animatedTui.ts:264) and never refreshed — UI stayed stale through the bridge's own scaffold action.

**Pattern Spec**:
- Trigger: Path A success block · after `runInstallScaffoldOnly` returns AND `result.cascadesScaffolded === true`
- Mutation: `menuState = { ...menuState, selectedUlid: SYNTHETIC_NEW, cascadesPresent: result.cascadesScaffolded ? true : menuState.cascadesPresent }`
- Combined with existing cursor reassign — single spread mutation
- Log event: `install.cascades-present.refreshed { cascadesPresent, ulid }`
- Side effect: row label flips Install → Reinstall on next render frame; future `handleInstall` invocations from the same bridge process route Path B (existsSync re-fires per press)

**Diameter Map**:
- SB-S74 ↔ B-20 SB-S69 IRULRT (lifecycle toggle): PSCRP makes IRULRT actually responsive in-process
- SB-S74 ↔ B-20 SB-S72 SRDBR (same-row-different-routing): PSCRP unblocks the routing flip — same SYNTHETIC_INSTALL row · same install-selected KeyAction · BUT existsSync(8_SUITES) per-press finds different state → Path A vs Path B
- SB-S74 ↔ B-13 SB-S49 Two-Path-Detect: handleInstall path-detect already fires existsSync per-press; PSCRP ensures the menu's visible state matches what path-detect will find

---

## SB-S75: Reinstall-Re-Scaffold-Fire (Diamond B-21 · CD-69 · RRSF)

**Status**: LANDED at Diamond B-21

**What This Skill Does**: When user presses Reinstall (Path B routing), `handleInstall` PREPENDS `runInstallScaffoldOnly` call BEFORE `runInstallSpawnPipeline`. Re-clones source + re-scaffolds non-user artifacts (8_SUITES + Documentation + CHANGELOG + REGISTRY). User-state preservation via existing filter exclusion (Working/Lab/Bridge) + BECIS skip-if-exists guard (Cascade.json) + B-3 timestamped CLAUDE.md backup. Then spawns install instance with joined Suite 8 content as before.

**Pattern Spec**:
- Path B head modification: `await runInstallScaffoldOnly(cwd, SCS_INSTALL_REPO_URL)` BEFORE `runInstallSpawnPipeline`
- Re-scaffold failure is non-fatal: catch + log + proceed to spawn anyway
- Log events: `install.reinstall.rescaffolded { ulid, cascadesScaffolded, templateRenamed, cascadeJsonSeeded }` · `install.reinstall.rescaffold-error { message }`
- User-state preservation:
  - Cascade.json — preserved (BECIS skip-if-exists B-19)
  - Working/* · Lab/* · Bridge sessions/log — preserved (filter B-13)
  - <userCwd>/CLAUDE.md — backed up timestamped (B-3 backup)
  - 8_SUITES/* + Documentation/* + CHANGELOG.md + REGISTRY — REFRESHED (deliberate Reinstall semantic)

**Diameter Map**:
- SB-S75 ↔ B-13 runInstallScaffoldOnly: reused mechanism · no new functions
- SB-S75 ↔ B-13 SB-S49 Two-Path-Detect: Path B branch now does scaffold-then-spawn (was spawn-only)
- SB-S75 ↔ B-19 SB-S66 BECIS: BECIS skip-if-exists guard preserves user's Cascade.json on Reinstall
- SB-S75 ↔ B-3 backupUserClaudeMd: timestamped backup ensures Reinstall is non-destructive to user's CLAUDE.md

**Reinstall Semantic User-Visible Effect**:
- 8_SUITES content refreshed (gets latest bridge Suite 8 docs · including SCS Bridge Suite 8 itself)
- Documentation/ refreshed (latest reference docs)
- CHANGELOG.md refreshed (matches current bridge version)
- SUITE8-REGISTRY.md refreshed
- User's working state (Diamond WGBs in Working/, Lab/ artifacts, bridge session registry) UNCHANGED
- User's Cascade.json (cycle position) UNCHANGED — Reinstall doesn't reset cascade progress

---

## SB-S69: Install-Reinstall-Update-Lifecycle-Row-Toggle (Diamond B-20 · CD-63 · IRULRT)

**Status**: LANDED at Diamond B-20

**What This Skill Does**: The `SYNTHETIC_INSTALL` MenuRow position evolves through 3 lifecycle phases (Install · Reinstall · Update) via label discrimination on `cascadesPresent` (and future `updateAvailable`). Single sentinel · same KeyAction · 3 different labels + behaviors.

**Pattern Spec**:
- Sentinel: `SYNTHETIC_INSTALL = '__install__'` UNCHANGED across all 3 phases
- KeyAction: `'install-selected'` UNCHANGED across all 3 phases
- Phase A (cascadesPresent === false OR undefined): `INSTALL_LABEL = '⊕ Install SCS-Bridge'`
- Phase B (cascadesPresent === true): `REINSTALL_LABEL = '⊕ Reinstall SCS-Bridge'`
- Phase C (future · updateAvailable defined): `UPDATE_LABEL = '⊕ Update SCS-Bridge'` (slot reserved · NOT IMPLEMENTED)
- Routing: handleInstall path-detect `existsSync(8_SUITES)` already discriminates Path A vs Path B (CD-39 unchanged); Reinstall reuses Path B as "already-scaffolded re-install" semantic

---

## SB-S70: Cascades-Present-Conditional-Label-Discrimination (Diamond B-20 · CD-64 · CPCLD)

**Status**: LANDED at Diamond B-20

**What This Skill Does**: Label discrimination function `installPhaseLabel(cascadesPresent: boolean | undefined): string` returns `INSTALL_LABEL` when undefined or false, `REINSTALL_LABEL` when true. Consumed by `formatInstall(selected, cascadesPresent?)` and trust-confer pane header (`trustConferActionLabel`). Single source of truth for label discrimination.

**Pattern Spec**:
- Function signature: `installPhaseLabel(cascadesPresent?: boolean): string`
- Returns: `cascadesPresent === true ? REINSTALL_LABEL : INSTALL_LABEL`
- Consumers: `formatInstall` (renderMenu + renderMenuLegacy callsites) · `renderTrustConferPane` header
- Future Phase C extension: pre-pend `updateAvailable !== undefined ? UPDATE_LABEL : ...` ahead of cascadesPresent check
- Backward compat: `formatInstall(selected)` without second arg returns INSTALL_LABEL (matches pre-B-20 behavior)

---

## SB-S71: Forward-Compatible-Update-Hook-Reservation (Diamond B-20 · CD-65 · FCUHR · STRUCTURAL)

**Status**: STRUCTURAL at Diamond B-20 (slot reserved · implementation deferred)

**What This Skill Does**: Reserves the `SYNTHETIC_INSTALL` slot for future Phase C Update label/routing. `MenuState.updateAvailable?: string` field declared (semver string when defined; undefined otherwise). Future Diamond wires the discriminator into `installPhaseLabel`.

**Pattern Spec**:
- MenuState extension: `updateAvailable?: string` (NEW · undefined in B-20)
- Slot semantic: when bridge detects available SCS-Bridge update at startup (post-release Diamond), sets this field
- Discriminator priority (future): `updateAvailable !== undefined ? UPDATE_LABEL : (cascadesPresent === true ? REINSTALL_LABEL : INSTALL_LABEL)`
- Routing for Phase C: out of scope for B-20; future Diamond designs the update mechanism (could fire Path B with version-check upfront, OR new code path)

---

## SB-S72: Same-Row-Different-Behavior-Routing (Diamond B-20 · CD-66 · SRDBR · STRUCTURAL)

**Status**: STRUCTURAL at Diamond B-20 (existing routing reused)

**What This Skill Does**: `'install-selected'` KeyAction unchanged across all 3 lifecycle phases. Routing discrimination already happens in `handleInstall` via `existsSync(cwd + '/Cascades/8_SUITES')` path-detect (CD-39 from B-13). No new KeyAction needed; no new dispatch path needed; the existing routing IS the lifecycle behavior discriminator.

**Pattern Spec**:
- KeyAction: `{ type: 'install-selected' }` UNCHANGED
- Path-detect: `existsSync(cwd + '/Cascades/8_SUITES')` UNCHANGED (animatedTui.ts:526 area)
- Phase A → Path A scaffold-only (existsSync false)
- Phase B → Path B install-instance (existsSync true)
- Phase C (future) → routing TBD by future Diamond
- Pattern: lifecycle row labels evolve; routing logic is structural-stable

---

## SB-S73: Single-Sentinel-Multi-Label-Composition (Diamond B-20 · CD-67 · SSMLC · STRUCTURAL)

**Status**: STRUCTURAL at Diamond B-20

**What This Skill Does**: Generalization principle — use ONE MenuRow sentinel with multiple possible labels rather than per-label sentinels. Avoids cursor logic complexity (every additional sentinel multiplies cursor navigation case-handling). Scales to N lifecycle phases via label-only discrimination.

**Pattern Spec**:
- One sentinel string (`SYNTHETIC_INSTALL`) covers N phases
- One KeyAction (`install-selected`) covers N phases
- N label constants (INSTALL_LABEL · REINSTALL_LABEL · UPDATE_LABEL · ...)
- One discriminator function (`installPhaseLabel`) reads MenuState fields and returns appropriate label
- Cursor logic IS PHASE-INDEPENDENT (treats SYNTHETIC_INSTALL as one row regardless of label)

**Generalizes to other lifecycle-toggle situations** (e.g., New Session row could have lifecycle phases · Tail "Close Bridge" row could have lifecycle phases). Pattern reusable across the menu surface.

---

## SB-S66: Bridge-Embedded-Cascade-Initial-State (Diamond B-19 · CD-58 · BECIS)

**Status**: LANDED at Diamond B-19

**What This Skill Does**: Bridge ships a hardcoded `SCS_FRESH_CASCADE_JSON` constant matching `Cascades/Cascade.template.json` exactly. `runInstallScaffoldOnly` writes this constant to `<userCwd>/Cascades/Cascade.json` after the cpSync + rename block, with skip-if-exists guard. Fresh installs reliably receive Cascade.json regardless of clone source state. Reverses the silent-failure mode where `templateRenamed: false` left the scaffold without Cascade.json (Lambda evidence: debug.log of test-007 fresh install).

**Pattern Spec**:
- Constant: `SCS_FRESH_CASCADE_JSON` exported from `src/lib/bridge/installConstants.ts`
- Content: TypeScript template literal matching `Cascade.template.json` byte-equivalent (`activeDiamond: null` · `activeOnyx: null` · 8-color suiteColors map · cycle 0 · gate 0 · colorSelectionComplete: false · automata: null)
- Write site: `runInstallScaffoldOnly` after rename block (line 348+), before cleanup
- Guard: `!existsSync(livePath) && existsSync(userCascadesPath)`
- Return field: `cascadeJsonSeeded: boolean`
- Log event: `install.scaffold.cascade-json-embedded-write { path, bytes }`

**Single-Source-of-Truth Invariant**: a unit test asserts `JSON.parse(SCS_FRESH_CASCADE_JSON) === JSON.parse(readFileSync('Cascades/Cascade.template.json'))`. If they diverge, test fails — manual sync required. Long-term: post-merge to main, `Cascade.template.json` could be removed (constant supersedes).

**Diameter Map**:
- SB-S66 ↔ B-6 SCS_INSTALL_REPO_URL (RUSGF · CD-24) — same bridge-embedded-constant pattern
- SB-S66 ↔ B-11 SCS_INSTALL_PRIMING_PROMPT — same pattern
- SB-S66 ↔ B-15 SCS_PATH_A_PRIMING_PROMPT — same pattern
- SB-S66 ↔ B-13 SB-S49 Two-Path-Detect — bridge owns scaffold authority for both paths
- SB-S66 OVERTURNS B-13 implicit assumption that template-rename suffices for fresh install

---

## SB-S67: Filter-Failsafe-Hardcode-Fallback (Diamond B-19 · CD-59 · FFHF)

**Status**: LANDED at Diamond B-19

**What This Skill Does**: Composes the existing filter exclusion + template rename + bridge-embedded write into a 3-step fallback chain. Filter still excludes `Cascade.json` from cpSync (B-13 SB-S49 unchanged). Rename runs if template present (B-13 unchanged). Embedded-write runs if `Cascade.json` STILL absent. Result: Cascade.json present in user cwd regardless of which step delivered it.

**Pattern Spec**:
- Step 1: cpSync filter excludes `Cascade.json` (don't copy dev's live state)
- Step 2: rename `Cascade.template.json` → `Cascade.json` if template exists AND livePath absent
- Step 3: write `SCS_FRESH_CASCADE_JSON` to `livePath` if STILL absent (skip-if-exists guard)
- Composition: each step checks `!existsSync(livePath)` before mutating — never overwrites prior step's success
- Logs distinguish steps (`install.scaffold.cascade-template-rename` vs `install.scaffold.cascade-json-embedded-write`) for debug.log forensics

---

## SB-S68: Push-Held-Resilient-Scaffold-Discipline (Diamond B-19 · CD-60 · PHRSD)

**Status**: LANDED at Diamond B-19

**What This Skill Does**: Governance principle — any scaffold artifact whose absence blocks Session Start Protocol must be bridge-owned (embedded as code constant), not clone-source-deferred. Reframes scaffold authority: bridge IS the source of truth for fresh-install state; clone source provides templates ONLY (not authority).

**Pattern Spec**:
- Discipline: critical scaffold artifacts → bridge-embedded constants
- Examples (existing): `SCS_INSTALL_REPO_URL` · `SCS_INSTALL_PRIMING_PROMPT` · `SCS_PATH_A_PRIMING_PROMPT` · `SCS_FRESH_CASCADE_JSON` (B-19 NEW)
- Anti-pattern: depend on clone-source state for any field that Session Start Protocol reads
- Trigger: this Diamond — Lambda evidence (32 commits ahead of main, push HELD) revealed the divergence-vulnerable assumption

**Long-term migration path**: when SCS-Bridge-Install merges to main, `Cascade.template.json` becomes redundant (constant supersedes). Post-merge cleanup Diamond can: (a) verify constant matches template byte-equivalent, (b) remove template from repo, (c) remove rename block from `runInstallScaffoldOnly`. Until then, both paths coexist (rename layer is harmless when constant skip-if-exists guard fires after).

---

## SB-S61: SCS-Manifold-Particle-Sphere-Animation (Diamond B-18 · CD-53 · SMPSA)

**Status**: LANDED at Diamond B-18

**What This Skill Does**: Replaces `STRATIDIAN_MODES[idx]` rotation backdrop in `installAnimation.ts` with a 3D-projected particle sphere representing the SCS §§0-9 Manifold. Fibonacci-distributed particles (uniform-as-possible) rotated around tilted axis, depth-sorted, glyph-tiered by z-depth, colored via Suite spectrum cycle. Phase-driven density (30% / 70% / 100%) and dominant accent (Cobalt / Ochre / Viridian).

**Pattern Spec**:
- File: `src/lib/tui/manifoldMode.ts` exports `renderManifoldSphere(t, grid, caps, phase)`
- Particle count by terminal: N=80 (cols<100 OR rows<32) · 160 (medium) · 280 (large)
- Distribution: Fibonacci sphere (golden-angle spiral · `i * π(3-√5)`)
- Rotation: spin-Y(t × spinRate) → tilt-X(23°) — Earth-like tilt
- Projection: orthographic with `ASPECT=0.5` terminal aspect correction
- Depth-sort ascending (back-first paint order)
- Glyph tier (unicode): `●` ≥0.85 · `◉` ≥0.55 · `◯` ≥0.20 · `*` ≥-0.20 · `•` ≥-0.55 · `·` (back)
- ASCII fallback: `O` / `o` / `*` / `.`
- Brightness: 0.35..1.00 linear by depth; accent +20%
- Suite color cycle: `i % 8` → SUITE_ORDER[idx] → SUITE_COLORS / SUITE_COLORS_DARK (back-facing)

---

## SB-S62: Manifold-Concept-Label-Orbit-Composition (Diamond B-18 · CD-54 · MCLOC)

**Status**: LANDED at Diamond B-18

**What This Skill Does**: 42 concepts from CLAUDE.md §§0-9 placed at orbital positions on the Manifold sphere. Each concept tagged with owning Suite (color) and `(thetaDeg, phiDeg)` spherical coordinates. Equator carries 8 Suite anchors; mid-latitudes carry Crystralines; poles carry §0 Embodiment (Huirth) + §5 closure (Stratidian Trajectory). Visibility gated to front-facing hemisphere; front-most labels selected first up to phase budget.

**Pattern Spec**:
- Export: `MANIFOLD_CONCEPTS: SphericalConcept[]` (42 entries)
- Schema: `{ label, suite, thetaDeg (0..360), phiDeg (-90..90) }`
- Visibility: `v.z >= 0` after rotation (back-facing → skip)
- Selection: depth-descending sort, slice top N by phase budget
- Render: label characters left-to-right at projected `(x, y)` via setCell
- Color: SUITE_COLORS[concept.suite] × brightness(depth)

**Density principle**: equator (8 Suites visible front-facing) drives heavy-center pattern; orbital edges sparse — matches user's screenshot reference (golden particle cloud with concept labels).

---

## SB-S63: Diameter-Connection-Line-Render-Discipline (Diamond B-18 · CD-55 · DCLRD)

**Status**: LANDED at Diamond B-18

**What This Skill Does**: 18 logical Diameter connections rendered as box-drawing line segments between concept positions. Visibility gate: BOTH endpoints `v.z > 0.05` (both visibly forward). As the sphere rotates, the connection network organically composes + decomposes — *the Manifold revealing itself*.

**Pattern Spec**:
- Export: `MANIFOLD_DIAMETERS: DiameterConnection[]` (18 entries)
- Schema: `{ a: string (label), b: string (label), colorHint: SuiteName }`
- Edge selection: `MANIFOLD_DIAMETERS.slice(0, params.lineCount)` — phase-driven count (0 / 5 / 18)
- Concept lookup: `Map<label, SphericalConcept>` for O(1) endpoint resolution
- Visibility: `va.z >= 0.05 && vb.z >= 0.05` (both endpoints forward)
- Line algorithm: bresenham (local copy from modes.ts to avoid cross-module coupling)
- Glyph: `lineChar(dx, dy)` — `─` horizontal · `│` vertical · `╲`/`╱` diagonal
- Color: SUITE_COLORS[colorHint] × 0.45 (dim — line layer subordinate to particle layer)

**Connection inventory** (categorized):
- §2 Stratidia stack (3 edges): Demometer ↔ Diameter ↔ Muxameter ↔ Muxonomy
- §3 Plan format (2 edges): Vermillion ↔ A-I Pattern · Pearl ↔ Vermillion
- C6↔C8 Ego-Lambda Pair (1 edge): Diamond ↔ Onyx
- C6↔C7 Diamond-Opal (1 edge): Diamond ↔ Opal
- C8→C1 (1 edge): Onyx ↔ Pearl
- Trinity ground (3 edges): Base Lambda ↔ RI ↔ Automata
- Lambda discipline (1 edge): Critical-Active ↔ Concluder
- Triadic Band → Forward Pass (1 edge)
- §9 dispatch (2 edges): Suite 8 ↔ Conductor · Suite 8 ↔ Shatterite
- C9 axes (1 edge): Cascade Length ↔ Tier 0 anor 1
- Muxistration (1 edge): Anor ↔ Muxistration
- §0↔§5 manifold seal (1 edge): Huirth ↔ Stratidian Trajectory

---

## SB-S64: Suite-Spectrum-Particle-Hue-Cycling (Diamond B-18 · CD-56 · SSPHC)

**Status**: LANDED at Diamond B-18

**What This Skill Does**: Particles cycle through the 8 SUITE_COLORS palette via index-modulo (`i % 8` → SUITE_ORDER[idx]). Phase-driven dominant accent (Cobalt for pre-spawn / Ochre for awaiting-alive / Viridian for ready) selects which Suite gets +20% brightness boost — visually anchors the phase identity within the rotating Manifold.

**Pattern Spec**:
- Suite cycle: `suiteIdx = i % 8` per particle index
- Suite name: `SUITE_ORDER[suiteIdx]` (8 entries: Maroon · Rust · Ochre · Viridian · Cobalt · Amethyst · Rose · Obsidian)
- Front-facing color: `SUITE_COLORS[name]`
- Back-facing color: `SUITE_COLORS_DARK[name]` (Pewter D5 darken-helper applied to suite color)
- Accent boost: `if (suiteIdx === phaseParams.accentSuiteIdx) brightness *= 1.20`
- Pewter doctrinal anchor: D8 `.suite-hr` rotating-through-8-suite-colors projected into 3D + time

---

## SB-S65: Manifold-Phase-Density-Modulation (Diamond B-18 · CD-57 · MPDM)

**Status**: LANDED at Diamond B-18

**What This Skill Does**: Phase advances modulate the Manifold's visual density and motion characteristics — pre-spawn appears as a sparse scanning cloud; awaiting-alive organizes into a denser composing network; ready blooms to full Manifold with all concepts + connections visible. Spin rate also scales (slow-scanning → composing → alive-rotating).

**Pattern Spec**:
- Phase parameter table:
  - pre-spawn: 30% particles · 5 labels · 0 lines · 0.18 rad/s · Cobalt accent
  - awaiting-alive: 70% · 12 · 5 · 0.30 rad/s · Ochre accent
  - ready: 100% · 24 · 18 · 0.55 rad/s · Viridian accent
- Particle filtering: `skipModulus = round(1 / particleRatio)`; filter by `i % skipModulus !== 0`
- Label budget: phase budget capped by `labelBudgetFor(termWidth, phaseBudget)` for narrow terminals
- Line slice: `MANIFOLD_DIAMETERS.slice(0, lineCount)` — first N pairs from inventory order

**UX semantic**:
- pre-spawn = "scanning the void" (sparse particles, slow motion, Cobalt anchor)
- awaiting-alive = "organizing the network" (medium density, faster motion, Ochre anchor — Cerulean checkpoint kinship)
- ready = "Manifold alive" (full bloom, faster rotation, Viridian anchor — alive Suite color)

---

## SB-S55: Install-Animation-Input-Lock-Trance (Diamond B-17 · CD-47 · IAILT)

**Status**: LANDED at Diamond B-17

**What This Skill Does**: When the full-screen install animation is active (`menuState.installAnimating !== undefined`), keypressHandler short-circuits all keys EXCEPT Ctrl-C. Animation auto-clears on first-spawn-alive (ACOFSAT) or 30s timeout (ATSC); lock auto-releases at the same time. Extends Diamond B-8 SB-S42 trustConfer modal precedent (input-lock during user-decision modal) to a system-state animation.

**Pattern Spec**:
- Guard placement: top of keypressHandler in `animatedTui.ts`, BEFORE applyKeypress dispatch
- Allow-list: `key.ctrl && key.name === 'c'` → cleanExit (full bridge exit)
- Drop-list: ALL other keypresses absorbed (return without dispatch)
- Lock duration: from handleInstall first state mutation to phase='ready' clearance / ATSC timeout / cleanExit
- Diameter to B-8 SB-S42: trustConfer modal allows confirm/decline keys; IAILT allows only Ctrl-C — broader lock scope reflects that animation IS in-progress system action (not user decision)

---

## SB-S56: Full-Screen-Initialization-Animation-Overlay (Diamond B-17 · CD-48 · FSIAO)

**Status**: LANDED at Diamond B-17

**What This Skill Does**: When `menuState.installAnimating !== undefined`, renderFrame replaces the entire frame output (top-pane Stratidian-mode + divider + bottom-menu) with `renderInstallAnimation(state, cols, rows, caps, Date.now())` from `src/lib/tui/installAnimation.ts`. The full-screen overlay composes Stratidian mode background + Pewter D5 Embossed Pane Border + centered status overlay.

**Pattern Spec**:
- File: `src/lib/tui/installAnimation.ts` exports `renderInstallAnimation(state, cols, rows, caps, nowMs)`
- Composition: Stratidian mode background (full grid) + Pewter pane (centered, ~60×12 cells) + status overlay (title + phase label + sub-status + progress bar + mode footer + abort hint)
- Phase-driven mode subset (Pewter HiFi recommendation): muxameter (pre-spawn) / stratidia (awaiting-alive) / suiteWheel (ready) — 3 of 6 modes selected for "initializing" semantics
- Phase-driven color: Cobalt (pre-spawn) / Ochre (awaiting-alive) / Viridian (ready)
- Sub-status time-bucket: pre-spawn 0-2s "Cloning bridge..." → 2-4s "Scaffolding cwd..." → 4s+ "Spawning Terminal..." → awaiting-alive "SessionStart hook firing..." → ready "ALIVE"
- Progress bar fill: pre-spawn 0→0.6 over 5s → awaiting-alive 0.6→0.9 over 8s → ready 1.0

---

## SB-S57: Animation-Cessation-On-First-Spawn-Alive-Trigger (Diamond B-17 · CD-49 · ACOFSAT)

**Status**: LANDED at Diamond B-17

**What This Skill Does**: Animation auto-clears when registry transition surfaces `entry.claudeSessionId !== undefined` for the install-animating ulid. Single source of truth shared with bridge menu's alive indicator (deriveSessionState in menu.ts). NO timing-based heuristic; pure registry-driven via existing `watchFile(registryPath(), { interval: 500 }, ...)` handler.

**Pattern Spec**:
- Detection site: watchFile handler in `animatedTui.ts` (after cursor reconcile, before exception catch)
- Predicate: `menuState.installAnimating?.phase === 'awaiting-alive'` AND `newSessions.find(s => s.id === installAnimating.ulid && s.claudeSessionId !== undefined)`
- Phase advance: 'awaiting-alive' → 'ready' (sets ready frame; 250ms settle beat)
- Final clear: `setTimeout(() => menuState = { ...menuState, installAnimating: undefined }, 250)` with ulid+phase guard to prevent double-clear race
- Diameter to retired SB-S51 PSRT (B-14): same registry-transition signal, different consumer — PSRT consumed it for typeahead dispatch (retired); ACOFSAT consumes it for animation cessation (B-17)

---

## SB-S58: Install-Path-Discriminated-Animation-Activation (Diamond B-17 · CD-50 · IPDAA)

**Status**: LANDED at Diamond B-17

**What This Skill Does**: Animation triggers ONLY for handleInstall path (Path A scaffold-only OR Path B install-instance). Regular New Session presses (`'n'` key + handleSpawn) do NOT activate animation. Discriminator is structural — distinct KeyAction branches in keypressHandler dispatch.

**Pattern Spec**:
- Activation site: top of `handleInstall` (before any await), sets `menuState.installAnimating` with phase='pre-spawn' + placeholder ulid='pending'
- Non-activation: `handleSpawn` does NOT set installAnimating; only spawnInFlight flag
- Real ulid binding: post-`createSession`/`runInstallSpawnPipeline`, advancePhase to 'awaiting-alive' AND bind real ulid AND `armAtscTimeout(ulid)`
- Failure clear: outer catch / inner catch of handleInstall clears installAnimating to prevent stuck animation on spawn failures

---

## SB-S59: Install-Phase-Status-Overlay-Transition (Diamond B-17 · CD-51 · IPSOT)

**Status**: LANDED at Diamond B-17

**What This Skill Does**: Phase tracking 'pre-spawn' → 'awaiting-alive' → 'ready' drives the status overlay text + color + Stratidian mode. Phase advance is deterministic (state-driven, not timing-driven): pre-spawn set on handleInstall start; awaiting-alive set after spawn returns; ready set on watchFile cessation detection.

**Pattern Spec**:
- Phase enum: `'pre-spawn' | 'awaiting-alive' | 'ready'`
- Phase → Mode index map: pre-spawn=3 (muxameter), awaiting-alive=4 (stratidia), ready=5 (suiteWheel)
- Phase → Color name map: pre-spawn=Cobalt, awaiting-alive=Ochre, ready=Viridian
- Phase → Label map: 'INITIALIZING' / 'AWAITING FIRST RESPONSE' / 'READY'
- Phase → Progress bar ratio: 0..0.6 (pre-spawn) / 0.6..0.9 (awaiting-alive) / 1.0 (ready)
- Time-bucket sub-status (pre-spawn only) provides finer-grained user feedback without requiring log-event subscription

---

## SB-S60: Animation-Timeout-Safety-Cessation (Diamond B-17 · CD-52 · ATSC)

**Status**: LANDED at Diamond B-17

**What This Skill Does**: 30-second hard timeout if claudeSessionId never surfaces (e.g., hook crashed, claude failed to launch). Animation clears with stderr instruction; user falls back to manual menu. Prevents hung animation state.

**Pattern Spec**:
- Timer: `setTimeout(() => { ... clear ... }, 30_000)` armed by `armAtscTimeout(ulid)` after spawn returns
- Guards: ulid match (only the install-animating session) + phase!=='ready' (don't clear after ACOFSAT already fired)
- User feedback: `process.stderr.write('[scs] Install animation timeout — first-spawn-alive signal not received within 30s.\n      Returning to menu. Check Cascades/Bridge/debug.log for hook events.\n')`
- Fallback: clears installAnimating; user returns to bridge menu; install may still complete in background (auto-discovery via SB-S23 will surface session next bridge launch)

---

## SB-S54: Positional-[prompt]-Cascade-Seeding-Pattern (Diamond B-16 · CD-46 · PCSP)

**Status**: LANDED at Diamond B-16

**What This Skill Does**: Bridge seeds the first user prompt of a fresh interactive `claude` session by passing the prompt text as a positional CLI argument — `claude --session-id <uuid> --settings <path> "/cascade"`. Documented at `code.claude.com/docs/en/cli-reference` literally as "Start interactive session with initial prompt." Bypasses macOS TCC AppleEvents permission entirely (no `tell System Events to keystroke` ever invoked). Replaces and retires the entire typeahead infrastructure of Diamonds B-11, B-14, B-15.

**Pattern Spec**:
- `BuildTerminalCommandInput.seedPrompt?: string | null` threaded through `buildClaudeCommandFragment` + 4 platform builders (macOS / Linux / Windows / WSL).
- `mode === 'new'` applies seed; `mode === 'resume'` IGNORES (positional reserves next-message semantics in resumed conversations).
- Empty/falsy seedPrompt produces NO positional arg (no extra trailing literal).
- Bash-shell branches (macOS osascript `do script`, Linux x-terminal/xterm bash-c, WSL bash-c) use `escapeForBashSingleQuote(s)` — wraps in `'...'` with internal `'` escaped as `'\''`.
- Args-array branches (gnome-terminal, konsole, wt) pass seedPrompt as separate spawn arg (no shell escape; spawn delivers argv directly).
- macOS specifically: 2-layer escape — bash-single-quote first, then AppleScript escape on top so `\` doubles for AppleScript decoding.

**Diameter Map**:
- SB-S54 ↔ SB-S39 (Install Orchestration · Diamond B-2/B-6) — install-flow seed mechanism
- SB-S54 ↔ SB-S50 PALA (Path A auto-launch · Diamond B-14) — PALA spawns; SB-S54 seeds
- SB-S54 RETIRES SB-S46 dispatchTypeahead (B-11), SB-S47 register-ready typeahead (B-11), SB-S51 PSRT (B-14), SB-S53 AAPD (B-15) — the entire typeahead/permission-detection chain dissolved structurally
- SB-S54 ↔ SB-S52 PASCP (Diamond B-15) — PASCP names `/cascade` as Path A's seed content; SB-S54 names the Lambda path that delivers it
- SB-S54 ↔ Pattern 4 modulation — positional arg is bridge-side argv composition; no Claude state read, no AppleEvents, no fs probe

**Per-Branch Parameterization**:
- Path A (Clean blank-slate auto-launch): `SCS_PATH_A_PRIMING_PROMPT = '/cascade'` → bash sees `'/cascade'` → claude positional `[prompt]` = `/cascade`
- Path B (Primed install-instance): `SCS_INSTALL_PRIMING_PROMPT = 'You are operating as SCS Bridge... execute Strategy S1...'` → bash sees `'You are...'` → claude positional `[prompt]` = verbose paragraph
- Same `escapeForBashSingleQuote` handles both. Mechanism is identical; only seed string varies.

**Primary Source Documentation** (Hard Validation per 4-agent research):
- `code.claude.com/docs/en/cli-reference` — `claude "query"` row literally documented as "Start interactive session with initial prompt"
- `code.claude.com/docs/en/headless` — clarifies that `--print`/`-p` is the NON-INTERACTIVE variant; positional alone keeps interactive mode
- GitHub Issue #38495 — source-cited proof: positional flows into `initialMessage` and auto-submits as user message
- GitHub Issue #6009 — stdin-pipe-to-interactive Closed-as-not-planned (because positional already does it)
- GitHub Issue #10373 — SessionStart hooks broken for fresh sessions (confirms why hook-based mechanism was wrong path)

**Lambda Trigger**: 6 unit tests in `osTerminal.test.ts buildTerminalCommand — macOS describe block`: `/cascade` positional, resume mode ignores seed, undefined no positional, empty no positional, internal single-quote bash-escape, verbose Strategy S1 renders correctly. Net 537→533 total pass (10 typeahead tests retired, 6 PCSP positional tests added).

**Open Risk (test-007-bis Lambda gate)**: slash-command-in-positional needs live-test. If `/`-prefixed positional routes through claude's slash-command pipeline → `/cascade` auto-fires. If sent as literal text → `/cascade` displays in the prompt for user-press-Enter. Issue #38495 used `"ssh"` (non-slash); slash routing in positional position is empirically unconfirmed. Cobalt Band 5 ran `claude --help` standalone confirming `[prompt]` is documented; live-validation completes the chain.

---

## SB-S46: Diamond-B-11-Interactive-Seeded-Spawn-Mechanism (RETIRED at Diamond B-16)

**Status**: RETIRED at Diamond B-16 — superseded by SB-S54 PCSP. Code (`dispatchTypeahead`, `pollRegisterReadyAndTypeahead`) deleted.

**Reason for Retirement**: AppleEvents-based keystroke injection had a hard TCC permission boundary (-1743). The documented `claude [opts] "[prompt]"` positional CLI argument achieves first-prompt seeding without any AppleEvents — TCC gate dissolved structurally rather than worked around. ~50 lines of code removed.

---

## SB-S51: Path-A-Session-Ready-Typeahead PSRT (RETIRED at Diamond B-16)

**Status**: RETIRED at Diamond B-16 — superseded by SB-S54 PCSP. Code (`pollSessionReadyAndTypeahead`) deleted.

**Reason for Retirement**: PSRT polled the registry for `claudeSessionId` transition then fired `dispatchTypeahead`. With positional CLI argument injection at spawn time, no post-spawn signal is needed — claude receives the seed before its TUI renders. Registry transition is still observable but no longer the trigger for any action. ~30 lines of code removed.

---

## SB-S53: Apple-Automation-Permission-Detection AAPD (RETIRED at Diamond B-16)

**Status**: RETIRED at Diamond B-16 — superseded by SB-S54 PCSP. Code (AAPD branch in `dispatchTypeahead`) deleted with parent function.

**Reason for Retirement**: AAPD detected the macOS TCC -1743 permission error and emitted user instruction. With no AppleEvents call ever firing, -1743 cannot occur from this code path — detection becomes vestigial. ~20 lines of code removed.

---

## SB-S52: Path-A-Slash-Command-Priming (Diamond B-15 · CD-44 · PASCP)

**Status**: LANDED at Diamond B-15

**What This Skill Does**: Path A's auto-launched session is primed with the `/cascade` slash command — not the verbose Path B Strategy S1 directive. The freshly-scaffolded cwd already has `.claude/CLAUDE.md` (full Stratidian Manifold), `.claude/commands/cascade.md` (slash command body), and `Cascades/8_SUITES/` (all Suite 8 instances). `/cascade` invocation triggers the cascade slash command with rich context already loaded — the canonical Stratidian first-input gesture, not a free-text instruction.

**Pattern Spec**:
- Constant: `SCS_PATH_A_PRIMING_PROMPT = '/cascade'` exported from `src/lib/bridge/installConstants.ts`.
- Used by: `animatedTui.ts handleInstall` Path A's `pollSessionReadyAndTypeahead(sessionId, SCS_PATH_A_PRIMING_PROMPT)` call.
- Path B retains `SCS_INSTALL_PRIMING_PROMPT` (verbose Strategy S1 directive) because the install instance's cwd is NOT yet fully scaffolded — it has the joined Suite 8 SCS Bridge content via `--append-system-prompt-file` but lacks `.claude/commands/cascade.md`.
- The two priming constants are deliberately distinct — same source-of-truth file, different semantic targets.

**Diameter Map**:
- SB-S52 ↔ SB-S51 (PSRT) — PSRT does the polling + dispatching; PASCP names the content
- SB-S52 ↔ SB-S46 (Diamond B-11 priming) — B-11 introduced the verbose paragraph for Path B; B-15 introduces the slash command for Path A
- SB-S52 ↔ Path A scaffold (Diamond B-13/B-14) — `/cascade` only makes sense AFTER the scaffold completes, because `.claude/commands/cascade.md` is one of the scaffolded artifacts; PASCP is downstream of the scaffold authority
- SB-S52 OVERTURNS the implicit B-11 assumption that one priming prompt fits all spawn paths — Path A and Path B have different cwd states and need different primings

**Lambda Trigger**: 2 unit tests in `installSpawn.test.ts SCS_PATH_A_PRIMING_PROMPT describe block`: exports `/cascade` literal · Path B prompt remains verbose paragraph (not slash command). Build gate 537/537 tests pass.

---

## SB-S53: Apple-Automation-Permission-Detection (Diamond B-15 · CD-45 · AAPD)

**Status**: LANDED at Diamond B-15

**What This Skill Does**: `dispatchTypeahead` detects macOS error `-1743` ("Not authorized to send Apple events to System Events") and emits a clear actionable user instruction via `process.stderr.write` instead of a generic log entry. macOS Automation permission is a one-time-grant per parent app; bridge cannot programmatically bypass — only inform the user clearly and degrade gracefully (install + auto-launch succeed; only priming-prompt seed degrades).

**Pattern Spec**:
- Match: `err.message.includes('-1743')` OR `err.message.includes('Not authorized to send Apple events')`.
- Permission-error branch: `log('install.typeahead.permission-needed', { message, instruction })` + 4-line `process.stderr.write` instruction:
  1. `[scs] Auto-seeded prompt blocked by macOS Automation permission.`
  2. `      Grant access in: System Settings → Privacy & Security → Automation`
  3. `      Find your Terminal app (Terminal/iTerm/etc.) and toggle "System Events" ON.`
  4. `      Future installs will auto-fire the priming prompt.`
- Generic-error branch (unchanged): `log('install.typeahead.error', { message })` — no stderr noise; caller handles
- Resolves cleanly in both branches — non-fatal; install + auto-launch already succeeded by the time typeahead fires
- Tests cover: skip-on-non-darwin · success-no-stderr · -1743-detection-with-instruction · generic-error-no-stderr-noise · escape-quotes-and-backslashes (5 tests)

**Diameter Map**:
- SB-S53 ↔ SB-S46 (Diamond B-11 dispatchTypeahead) — same function; SB-S53 adds error-class branching at the catch site
- SB-S53 ↔ SB-S51 (PSRT) — PSRT calls dispatchTypeahead; AAPD ensures PSRT's failure mode produces actionable user feedback rather than silent log noise
- SB-S53 ↔ Pattern 4 modulation — `dispatchTypeahead` only inspects its own osascript exec error message; no Claude state read; no fs probe; pure error-message string match

**macOS Permission Acquisition Workflow** (one-time per parent app):
1. User invokes `scs` from Terminal.app (or iTerm/etc.)
2. Bridge runs install → auto-launches session → dispatchTypeahead fires → `-1743` error
3. Bridge emits stderr instruction (this skill)
4. User opens System Settings → Privacy & Security → Automation
5. Locates parent Terminal app → toggles "System Events" ON
6. Subsequent installs auto-fire priming prompt without further intervention

**Lambda Trigger**: 5 unit tests in `installSpawn.test.ts dispatchTypeahead describe block`. All 537 total tests pass; build 117.12 KB; `npm pack` 5 files / 105.5 kB.

---

## SB-S50: Path-A-Lift-After-scaffold (Diamond B-14 · CD-40 · PALA)

**Status**: LANDED at Diamond B-14

**What This Skill Does**: After Path A blank-slate scaffold completes (Diamond B-13 SB-S49), bridge auto-spawns a fresh claude session in the freshly-scaffolded cwd via the same mechanism the user uses for New Session (`createSession` + `launchInformative('new')`). Closes the Diameter the user named in test-007 as "the Broken Diameter is Now the Ability to Launch the Instance. Which may just be an Orphaned Branching Path not Laid."

**Pattern Spec**:
- Triggers: Path A success block in `animatedTui.ts handleInstall` (after `selectedUlid = SYNTHETIC_NEW` cursor reassign).
- Mechanism: `await createSession()` + `await launchInformative(sessionId, 'new')` — same code path as the `n` keybinding's `handleSpawn`. Spawns a NEW Terminal.app window with `claude --session-id <new-uuid> --settings <path>`.
- Non-fatal: inner try/catch swallows errors and logs `install.scaffold-only.auto-launch.error`; user falls back to manual New Session keypress.
- Logs: `install.scaffold-only.auto-launched { sessionId }` on success.
- Pairs with SB-S51 PSRT: PALA does the spawn; PSRT seeds the priming prompt once SessionStart hook signals readiness.

**Diameter Map**:
- SB-S50 ↔ SB-S49 (Two-Path-Detect) — SB-S49's Path A branch was scaffold-only; SB-S50 extends it to scaffold-then-spawn
- SB-S50 ↔ SB-S39 (Install Orchestration) — SB-S39's `handleSpawn` is the canonical new-session entry point; SB-S50 reuses it post-scaffold without modification
- SB-S50 ↔ SB-S48 (Trust Pre-Seed) — preSeedTrust runs first; spawn that follows lands in a trusted cwd → claude opens direct to interactive (no dialog)
- SB-S50 OVERTURNS the implicit assumption that Path A is scaffold-terminal — Path A is scaffold-then-spawn-then-seed (PALA + PSRT)

**Lambda Trigger**: build gate 530/530 tests pass; `pollSessionReadyAndTypeahead` 5 unit tests cover the post-spawn seeding flow. Path A live-verification deferred to test-007-bis retest gate (post-commit).

---

## SB-S51: Path-A-Session-Ready-Typeahead (Diamond B-14 · CD-41 · PSRT)

**Status**: LANDED at Diamond B-14

**What This Skill Does**: Registry-native ready-signal for the priming-prompt typeahead in Path A's auto-launched session. Path B has `pollRegisterReadyAndTypeahead` (SB-S46 / Diamond B-11) which polls `<tempDir>/register-state.json` written by `runRegisterInstallHook`. Path A has no tempDir or install-mode hooks — but `runSessionStartHook` writes `claudeSessionId` to the registry for ANY new-session spawn. That registry transition (`claudeSessionId: undefined → <real-uuid>`) IS the natural ready signal.

**Pattern Spec**:
- Function: `pollSessionReadyAndTypeahead(ulid, primingText, timeoutMs = 120_000, intervalMs = 500): Promise<void>` exported from `src/lib/bridge/installSpawn.ts`.
- Polls `await listSessions()` every `intervalMs`; finds entry with `id === ulid`; checks `entry.claudeSessionId !== undefined`.
- Once ready: `setTimeout(1000)` (let claude render input prompt) → `dispatchTypeahead(primingText)` → resolve.
- Re-entrancy guard via `probing` flag — async listSessions can't run concurrently (registry file mutex is preserved).
- Non-fatal: catches errors per tick; keeps polling. Logs `install.session-ready.detected` on signal, `install.session-ready.timeout` on expiry.
- Timeout default 120s — matches Path B `pollRegisterReadyAndTypeahead`.

**Diameter Map**:
- SB-S51 ↔ SB-S46 (Diamond B-11 Interactive Seed) — Path B uses tempDir register-state.json; Path A uses registry claudeSessionId transition. Both fire `dispatchTypeahead` once ready
- SB-S51 ↔ SB-S50 (Path-A-Lift-After-scaffold) — SB-S50 spawns; SB-S51 seeds. Together they complete the Path A install-flow circuit
- SB-S51 ↔ SessionStart hook (Diamond E architecture) — `runSessionStartHook` writes claudeSessionId via `updateSessionLiveIdentity`; SB-S51 reads that very write
- SB-S51 preserves Pattern 4 modulation: ready-signal is bridge's own registry, not Claude's session storage. No `~/.claude/projects/` content read, no JSONL probe — just `listSessions()` (registry.json metadata)

**Re-entrancy Discipline**: setInterval can fire while previous async listSessions is still resolving — `probing` flag short-circuits the new tick to prevent file-mutex contention. Pattern matches the canonical-async-poll style from `pollScaffoldComplete` (Diamond B-7) but adapted for async signal source.

**Lambda Trigger**: 5 unit tests in `installSpawn.test.ts pollSessionReadyAndTypeahead` describe block: immediate-ready (claudeSessionId already set on first poll), transition (undefined → defined across 3 polls), timeout (never appears), ulid-mismatch (other sessions ignored), transient-error (listSessions throws once, recovers). All 530 total tests pass; build 116.37 KB; `npm pack` 5 files / 104.2 kB.

---

## SB-S48: Haiku-Trust-Dialog-Accepted-JSON-Pre-Seed (Diamond B-13 · CD-38)

**Status**: LANDED at Diamond B-13

**What This Skill Does**: Bridge writes `projects["<absolutePath>"].hasTrustDialogAccepted = true` to `~/.claude.json` BEFORE the install instance spawns. The Claude Code first-time directory-trust dialog that otherwise gates UserPromptSubmit + auto-priming is skipped. Reverses Diamond B-9's negative-space verdict (CD-34 OVERTURNED).

**Pattern Spec**:
- File: `~/.claude.json` (root file at `$HOME`, NOT `~/.claude/` directory). Anthropic-documented as per-project state (allowed tools, trust settings).
- Field: `projects["<absolutePath>"].hasTrustDialogAccepted: boolean` — `true` skips dialog; `false` or missing fires dialog.
- Atomic write: `<path>.tmp` → `renameSync` to final (matches `registry.ts saveRegistry` crash-safety pattern).
- Merge-safe: existing fields on the project entry preserved; existing entries on other projects untouched. Corrupt JSON treated as fresh and overwritten.
- Sanctioning chain (Pattern 4.1): user `trust-confer-confirm` KeyAction → `handleInstall` → `preSeedTrust`. Bridge writes user-state file under explicit user authority.
- Non-fatal on failure: caller logs `install.trust-preseed.error`; user falls back to manual click.

**Diameter Map**:
- SB-S48 ↔ SB-S42 (Pewter HiFi Trust-Confer) — SB-S42 is the bridge's user-sanctioning gate; SB-S48 is the disk-write that fires AFTER user confirms
- SB-S48 ↔ SB-S43 (Probe Target) — SB-S43 detects whether SCS is installed; SB-S48 prepares for the spawn that follows the install
- SB-S48 OVERTURNS SB-S43's "no programmatic skip" sub-finding — Distinct-Demometer-By-Diameter Lambda evidence (test-005 trusted vs test-006 untrusted in Diamond B-12) named the parameter
- SB-S48 ↔ SB-S49 (Two-Path Detect) — both fire on `handleInstall`; SB-S48 first (trust-skip), then SB-S49 (path branch)

**Methodological Lesson**: hyper-focus directives surface mechanisms prior cascades miss. Three Diamonds (B-9, B-11, initial B-12 Red) probed `~/.claude/` directory-only; user's "Hyper Focus" call expanded to sibling-level config files. Probe both directory AND sibling-level file scope when searching for config-state mechanisms.

**Lambda Trigger**: 7 unit tests in `trustPreSeed.test.ts` cover fresh creation, atomic write order, merge-safety, idempotent re-write, corrupt-JSON recovery. Build gate 525/525 tests pass.

---

## SB-S49: Two-Path-Install-Detect-Branch (Diamond B-13 · CD-39)

**Status**: LANDED at Diamond B-13

**What This Skill Does**: `handleInstall` branches on `existsSync(<userCwd>/Cascades/8_SUITES)` to choose between blank-slate scaffold-only (Path A) and already-scaffolded spawn-instance (Path B). Detection is metadata-only; Pattern 4 modulation form preserved.

**Pattern Spec**:
- **Path A — blank-slate scaffold-only** (8_SUITES absent): bridge calls `runInstallScaffoldOnly(cwd, repoUrl)` which clones, scaffolds `.claude/` (SB-S39+), copies `Cascades/` via `pathFilterCascadesScaffold` (excludes `Working/* except .gitkeep` · `Lab/* except .gitkeep` · `Bridge/sessions.json` · `Bridge/debug.log` · `Bridge/sessions/` · `assets/` · `Cascade.json` · `.DS_Store`), renames `Cascade.template.json` → `Cascade.json`, and cleans up. **No spawn. No Strategy. No typeahead.** Cursor reassigns to `SYNTHETIC_NEW`.
- **Path B — already-scaffolded** (8_SUITES present): existing flow preserved — `runInstallSpawnPipeline` + register-poll typeahead (SB-S46 / Diamond B-11) + scaffold-complete cleanup (SB-S39 / Diamond B-7). Used for re-install or strategy-driven scenarios.
- Both paths share `preSeedTrust` (SB-S48) so the trust dialog is skipped regardless of path.

**Diameter Map**:
- SB-S49 ↔ SB-S43 (Probe Target) — same canonical 8_SUITES/ marker; SB-S43 is read-only at TUI start, SB-S49 is read-only at install dispatch
- SB-S49 ↔ SB-S39 (Install Orchestration) — SB-S39's pipeline IS Path B; SB-S49 introduces Path A as a peer Demometer
- SB-S49 ↔ SB-S46 (Diamond B-11 Interactive Seed) — Path B preserves SB-S46's typeahead flow; Path A bypasses it (no spawn to seed)

**Filter Discipline (`pathFilterCascadesScaffold`)**: operates on path strings only (no content read). Path A's `Cascades/` copy is the bridge's first-class authoritative install (no in-instance Strategy needed for scaffolding). Filter rules align with the Diamond A `.gitignore` policy — runtime artifacts and machine noise excluded; structural directories (Working/, Lab/, Bridge/) preserved with their `.gitkeep` placeholders.

**Lambda Trigger**: build gate 525/525 tests pass; `pack` confirms 5 files / 103 kB / 415 kB unpacked. Path A live-test deferred to test-007 retest gate (post-commit).

**Lambda Trigger**: Diamond B-9 build gate (518/518 tests). Source-level concluder: `grep '/Cascades/8_SUITES' src/lib/tui/animatedTui.ts src/lib/bridge/menu.ts` returns 2 hits.

---

*Skill.md version: 6.4 · 41 active skills (SB-S1–SB-S42, minus deprecated SB-S7/S8/S9/S10/S11/S13) · Last Diamond: B-8*

---

## SB-S128: Menu-Action-SCP-Namespace (MASN) MCP Tool Naming Convention (SAWSR-D2.A · Cycle 150)

**Status**: LANDED at SAWSR-D2.A

**What This Skill Does**: Defines `scp_launch_*` MCP tool namespace as the agent-callable mirror of the TUI keypressHandler action surface. Each MASN tool maps 1:1 to a TUI menu action: `scp_launch_session_management` mirrors Enter on SCP entry · `scp_launch_runtime_only` mirrors `[L]` hotkey · `scp_launch_new_session` mirrors `[N]` from filtered PSM context.

**Pattern Spec**:
- Prefix `scp_launch_*` reserves the namespace · agent's training bias on "launch" pattern RESOLVES to this namespace (distinct from legacy `launch_scp` POC · informative `get_scp_*` · SCP self-reg `dock_scp`)
- 1:1 mapping invariant: every MASN tool → exactly one BMTI Quality (Option B narrow per Stratimuxian Scholar S10) · NEVER polymorphic
- Input schemas: `scpName` (required) + optional `callerSessionUlid` (carried to spawn env for SCSER backward Arc · D2.B)
- All MASN tools: `toolType: 'actionable'` · `handlerType: 'quality'` · qualityName matches BMTI emitter key (Cycle 140 TQDR Quality-Name-Identity)

**Diameter Map**:
- SB-S128 ↔ SB-S129 (BMTI pattern) — naming names the surface · BMTI names implementation
- SB-S128 ↔ SB-S130 (MCSC translator) — naming says WHAT exists · MCSC says HOW it translates
- SB-S128 ↔ SB-S126 (legacy launch_scp POC) — MASN is aligned namespace · launch_scp retained alongside

**Lambda Trigger**: 3 MASN tools at Bridge boot · `tools/list` returns 7 (4 legacy + 3 MASN) · build CJS 545.25 KB.

---

## SB-S129: Bridge-MCP-Tool-Intake (BMTI) Quality Pattern (SAWSR-D2.A · Cycle 150)

**Status**: LANDED at SAWSR-D2.A

**What This Skill Does**: Each MASN tool dispatches into one narrow BMTI Quality. Form-α (Method+Reducer) per `scsBridgeLaunchScp` template (Cycle 140 TQDR): Reducer `() => ({})` · Method reads payload + validates · reads SCPs.json · builds spawn payload · Tier-2 deck cast dispatch.

**Pattern Spec** (per Stratimuxian Scholar S10 Pattern 5):
```typescript
export const scsBridgeXyz = createQualityCardWithPayload<ScsBridgeState, ScsBridgeXyzPayload>({
  type: 'Scs Bridge Xyz',  // Verbose Naming Space-Separated Capitalized
  reducer: () => ({}),
  methodCreator: () => createMethodWithConcepts(({ action }) => {
    const { scpName, callerSessionUlid } = selectPayload<ScsBridgeXyzPayload>(action);
    // 1. Validate scpName · 2. getActiveScsBridgeMuxiumHandle · 3. readScpRegistry
    // 4. Build downstream payload · 5. Tier-2 dispatch · 6. muxiumConclude/strategySuccess
  })
});
```

**3 BMTI Qualities landed at D2.A**:
| Quality | MASN Tool | Downstream Composition |
|---|---|---|
| `scsBridgeActivateScpSession` | `scp_launch_session_management` | ALHOC double-bind (overlay-show + scpSpawnManagerSpawnRequested) |
| `scsBridgeLaunchScpRuntime` | `scp_launch_runtime_only` | scpSpawnManagerSpawnRequested only ([L] mirror) |
| `scsBridgeSpawnNewScpSession` | `scp_launch_new_session` | imperative createSession + launchInformative (NSESF mirror) |

**Stratimuxian Scholar Citations**: S10 Quality Creation Pattern 5 · S8 Muxified Concept Access Tier-2 cast · S7 Dispatch Patterns

**Diameter Map**:
- SB-S129 ↔ SB-S128 (MASN naming) — BMTI implements MASN surface
- SB-S129 ↔ Cycle 140 TQDR (scsBridgeLaunchScp template) — form-α preserved · payload extended with callerSessionUlid
- SB-S129 ↔ Cycle 148 ALHOC M131 (Internal-Conditionals) — Activate composes ALHOC double-bind · idempotency via launchScpRuntime Gate 1+2

**Lambda Trigger**: agent MCP `tools/call scp_launch_session_management` triggers same chain as user Enter on SCP entry · boot overlay + spawn + browser + live badge.

---

## SB-S130: Menu-Command-SCP-Conduit (MCSC) Tool→Action Translator Routing (SAWSR-D2.A · Cycle 150)

**Status**: LANDED at SAWSR-D2.A

**What This Skill Does**: Routes incoming MCP `tools/call` to corresponding BMTI Quality dispatch via existing `scsBridgeScpToolRegistration.principle.huirth.ts` metadata registry mechanism. **Zero menu logic replication** — BMTI Quality IS the dispatch surface · MCP is purely transport.

**Pattern Spec**:
- Tool metadata `SCPQualityMetadataRegistered` constructed in `buildToolRoster()` per Cycle 139 CPPP Wiring
- Metadata fields: `conceptName · qualityName · toolName · description · inputSchema · toolType · handlerType · strategyName · relatedActionables`
- `relatedActionables` documents Diameters (MASN Activate relates: launch_runtime · spawn_new_session · legacy launch_scp)
- Metadata array → registry map keyed by toolName → dispatched via `d.muxium.d.scp.e.scpRegisterToolsWithMetadata` at Bridge boot
- MCP tool call → metadata lookup → Quality-route via existing scpExecuteTool path (scpExpressTransport:176)

**Zero-Replication Invariant**: MCSC adds NO menu logic. Agent-driven MCP call enters same downstream composition the TUI keypress enters (scpSpawnManagerSpawnRequested · ALHOC double-bind · NSESF createSession). Future MASN additions require only: (1) one BMTI Quality file · (2) one metadata entry · (3) one types.ts payload extension.

**Diameter Map**:
- SB-S130 ↔ SB-S128 (MASN naming) — naming defines tool names · MCSC routes them
- SB-S130 ↔ SB-S129 (BMTI pattern) — MCSC bridges tool name to Quality dispatch
- SB-S130 ↔ SB-S126 (legacy launch_scp) — same routing mechanism · MASN tools added alongside

**Lambda Trigger**: Bridge boot logs `[Scs Bridge] LaunchScp dispatched...` equivalent on first MASN tool call · agent receives MCP response per scpExtractAndSendResponse.

---

*Skill.md version: 6.0 (SAWSR-D2.A bump) · v5.7 → v6.0 reflects MASN namespace + BMTI Option B narrow Qualities · 44 active skills · Last Diamond: SAWSR-D2.A (Cycle 150)*

---

## SB-S131: Post-Install MASN Activate Invocation (SAWSR-D2.A Rung 1 · Cycle 150)

**Status**: LANDED at SAWSR-D2.A · Rung 1 binding closure

**What This Skill Does**: Installation Agent's post-install Conclude turn autonomously invokes the MASN tool `scp_launch_session_management` via Bash tool (NOT instruction-mode · per SB-S127 doctrine). Closes the Rung 1 Lambda gate by binding the Shatterite Menu SM-SCP.md Stage I4 Option 1 to the new BMTI Activate Quality (SB-S129) — the same tool composes ALHOC double-bind (overlay-show + scpSpawnManagerSpawnRequested) that the TUI Enter-on-SCP path triggers (Cycle 148).

**Pattern Spec** (Skill IS the action · agent autonomous invocation):

```bash
# Stage 1 · discover bridge port from project-local canonical path
PORT=$(jq -r .port ./Cascades/Bridge/bridge.json 2>/dev/null)
[[ -z "$PORT" || "$PORT" == "null" ]] && exit 1  # bridge not live · instruct user to run scs

# Stage 2 · MASN Activate invocation · composes ALHOC double-bind
# callerSessionUlid resolved via Bridge registry cwd-match (Cycle 153 R3).
# SCS_BRIDGE_ULID is NOT in claude's runtime env · must query sessions.json.
SESSION_ID=$(jq -r --arg cwd "$PWD" '.sessions | map(select(.cwd == $cwd and (.status == "launched" or .status == "allocated"))) | sort_by(.spawnedAt) | reverse | .[0].id' ./Cascades/Bridge/sessions.json 2>/dev/null)
[[ -z "$SESSION_ID" || "$SESSION_ID" == "null" ]] && SESSION_ID="${SCS_BRIDGE_ULID:-$(uuidgen 2>/dev/null || date +%s)}"
curl -s -X POST "http://127.0.0.1:$PORT/mcp" \
  -H 'Content-Type: application/json' \
  -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/call\",\"params\":{\"name\":\"scp_launch_session_management\",\"arguments\":{\"scpName\":\"<designation>\",\"callerSessionUlid\":\"$SESSION_ID\"}}}"
```

**Expected downstream chain** (Lambda verification):
1. Bridge MCP receives `scp_launch_session_management` tool/call
2. Routes via MCSC translator (SB-S130) → BMTI Activate Quality (SB-S129 · `scsBridgeActivateScpSession`)
3. ALHOC double-bind composes (Cycle 148 substrate):
   - Dispatches `scpBootOverlayShow` → Boot Overlay paints
   - Dispatches `scpSpawnManagerSpawnRequested` → SCP child_process spawns
4. SCP boots on `boundBridgePort` · `scpspawnmgr.readiness.probe.success`
5. `scsBridgeOpenBrowserTab` chain fires → browser tab opens at `http://localhost:{port}/`
6. FSTW Wave 1+2 (Cycle 148 M125) → FSM `pending→booting→live` · TUI badge updates
7. `callerSessionUlid` carried in payload (consumed by D2.B SCSER backward Arc when landed · currently no-op)

**Diameter Map**:
- SB-S131 ↔ SB-S128 (MASN naming) — invokes the namespace SB-S128 defines
- SB-S131 ↔ SB-S129 (BMTI pattern) — Bash tool call routes to BMTI Activate Quality
- SB-S131 ↔ SB-S130 (MCSC translator) — uses the same routing mechanism
- SB-S131 ↔ SB-S127 (Bridge Discovery + MCP Launch doctrine) — supersedes the legacy `launch_scp` invocation in SM-SCP.md Stage I4 · legacy retained as fallback
- SB-S131 ↔ SB-S30 (Project-Local Bridge State Substrate · BJDP) — uses project-local `./Cascades/Bridge/bridge.json` (single source of truth)
- SB-S131 ↔ SM-SCP.md Stage I4 Option 1 — direct doctrinal binding (post-install Conclude rendering)

**Rung Position** (SAWSR Lambda Ladder · bottom-up):
- **Rung 1 (THIS · Cycle 150)**: Installation Agent invokes Activate Quality as POC of forward Diameter trajectory · proves Bridge MCP intake + BMTI dispatch + ALHOC composition
- **Rung 2 (D2.B)**: Agent uses Registration Skill SEPARATELY post-Activate · proves SCSER backward Arc standalone
- **Rung 3 (D4 IAUCW)**: Single Skill = Registered Strategy = SCP tool that composes Activate + Debounce + Session Registration in one call · IAUCW unified

**Rung 1 Lambda Trigger** (test fixture):
```bash
cd /tmp/test-fresh
scs --debug                      # SCS-Bridge npm-linked entry · spawns Installation Agent
# Installation Agent completes install flow · scs scp install <Designation>
# Installation Agent Conclude turn → SM-SCP.md Stage I4 SM-Conclude renders
# Agent autonomously selects Option 1 · executes SB-S131 Bash invocation
# Expected: Boot Overlay paints · SCP boots port 7700 · browser opens · live badge advances
# Expected NOT yet (Rung 2 work): PSM "Sessions for SCP: TestSCP (1 active)" increment for agent's own session
```

**Lossy-Compaction Note**: agent autonomous Skill invocation path (vs user-AskUserQuestion path) was confirmed at Conference 2026-05-19 · the Conclude turn fires SB-S131 without user prompt when Installation Agent is in Automata-equivalent mode post-install.

---

*Skill.md version: 6.1 (SB-S131 added · Rung 1 binding closure) · 45 active skills · Last Diamond: SAWSR-D2.A Rung 1 (Cycle 150)*
