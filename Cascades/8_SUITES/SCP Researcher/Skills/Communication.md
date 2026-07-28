# SCP-S12 · Communication · Bridge-Aware Cross-Suite Messaging (MCPL)

**Aspect**: Bridge discovery and communication via `./Cascades/Bridge/bridge.json` (project-local · BJDP per SB-S30)
**Protocol**: MCP-Connection-Likeness (MCPL) — reads bridge.json · formats requests in near-standard MCP envelope shape · no full MCP stdio server required
**Version**: 1.0
**Origin**: Refinement Macro · REF-D2 · BJLM+SRSKD+MCPL · Cycle 113
**Skill ID**: SCP-S12

---

## Invocation Context

This skill is dispatched when a ClaudeCode session running inside (or alongside) an installed SCP needs to communicate with the SCS-Bridge process. Common triggers:

- "What's the Bridge status?"
- "What SCPs are connected?"
- "Is `<scpName>` running?"
- "Check what SCPs are live."

Cross-Suite reference: invokable by Teal Claude Conductor for any Suite that needs bridge awareness.

---

## Section 1 · Locate bridge.json (BJDP · Bridge-JSON-Discovery-Path)

bridge.json lives EXCLUSIVELY at: **`./Cascades/Bridge/bridge.json`** (project-local · per SB-S30 Project-Local Bridge State Substrate · Diamond O · v5.6)

**Project-local resolution**:

- Path is RELATIVE to the project root (where the SCP is installed alongside `Cascades/`)
- Always under `<project-root>/Cascades/Bridge/bridge.json`

**Claude Code read patterns**:

```bash
# Simple read · project-local canonical
cat ./Cascades/Bridge/bridge.json

# Extract port with jq
PORT=$(jq -r .port ./Cascades/Bridge/bridge.json)
```

**Absence handling**: If `./Cascades/Bridge/bridge.json` does not exist, either (a) not in an SCS-installed project root (test with `test -d ./Cascades/Bridge/`) OR (b) the Bridge is not running. Report: "Bridge metadata not found at `./Cascades/Bridge/bridge.json`. Verify project root has `Cascades/Bridge/` directory and bridge is started with `scs` (from the project root) to spawn the TUI."

---

## Section 2 · MCPL Envelope Shape (Request/Response Form)

For bridge-directed queries, format requests as near-standard MCP envelopes. The Phase 1 implementation serves ALL operations by reading bridge.json directly (no HTTP call yet); the MCPL envelope is pre-defined so Phase 2 (HTTP endpoint CRCEP) can reuse the same shape over the wire without contract churn.

```json
{
  "mcplVersion": "1.0",
  "kind": "bridge-request",
  "scpName": "<the-scp-name-you-are-running-from>",
  "requestId": "<ulid-or-timestamp>",
  "payload": {
    "operation": "list-active-scps" | "get-bridge-status" | "list-installed-scps",
    "params": {}
  }
}
```

**Response envelope shape**:

```json
{
  "mcplVersion": "1.0",
  "kind": "bridge-response",
  "requestId": "<echoed>",
  "ok": true,
  "data": { ... }
}
```

---

## Section 3 · File-Queue Mechanism (PRIMARY · Phase 1)

For fire-and-forget commands that need a bridge to act asynchronously, MCPL falls back to the BridgeMessageEnvelope file queue (the same substrate the bridge already consumes via `scpMessageRouter`). This is the PRIMARY transport path for write-side commands.

**Queue path**: `Cascades/Bridge/sessions/<sessionId>/heads/<ulid>.json`

The session id must be an existing bridge session (the bridge's `scpMessageRouter` chokidar watches each session's `heads/` directory). The envelope `kind` controls dispatch routing on the bridge side.

For discovery-only reads (the common case), this file-queue is NOT needed — direct bridge.json filesystem read is sufficient.

The write-side envelope is formed by SMFT (`buildSordEnvelope()` in `src/lib/bridge/sordEnvelope.model.ts`) — see SCP-S15 §1. Do not hand-form the envelope.

---

## Section 4 · HTTP to `/mcp` — Two Directions, Two Statuses

The `endpoint` field in bridge.json carries the base address (e.g., `http://127.0.0.1:7111`). Two distinct HTTP directions exist; they have DIFFERENT implementation statuses.

### Direction A · Claude-session → Bridge `/mcp` (NOW LIVE)

A Claude Code session carrying the BDAP appended system prompt can POST a `《send_message》` SORD envelope directly to `deriveMcpEndpoint(endpoint)` — that is, `endpoint + '/mcp'` (NOT the bare `endpoint` — the bare form was pruned in RM-D2). This direction is **Lambda-proven** (RM-D2, Cycle 168): a session with the BDAP directive successfully performed this POST.

The SORD `《send_message》` envelope IS the transport for Direction A. The POST target is always `deriveMcpEndpoint(endpoint)` from `sordEnvelope.model.ts`. See SCP-S15 §1 for the SORD shape and §2 for the BDAP directive that enables it.

### Direction B · Bridge as general MCPL listener / CRCEP (STILL DEFERRED)

The bridge does NOT expose a general MCPL request endpoint. The bridge responds only over `/mcp` (MCP JSON-RPC protocol), not over a free-form ClaudeCode-Request-Communication-Endpoint. When the bridge adds a general CRCEP endpoint in a future cycle, MCPL requests will POST the envelope shape from Section 2 to that URL. Until then, do NOT attempt a general MCPL POST.

```
POST <endpoint>/scs-bridge/request   ← Direction B ONLY (future · CRCEP not yet implemented)
Content-Type: application/json

<MCPL request envelope>
```

---

## Section 5 · bridge.json Schema (BJWS · Validation)

Minimum valid shape that this Skill expects:

```json
{
  "schemaVersion": 1,
  "bridgeVersion": "<semver>",
  "writtenAt": <epoch-ms>,
  "port": <number>,
  "endpoint": "http://127.0.0.1:<port>",
  "userCwd": "<absolute-path>",
  "boundScps": {
    "<scpName>": {
      "port": <number>,
      "status": "<live|booting|other>",
      "browserUrl": "<url>"
    }
  },
  "installedScps": ["<scpName>", "..."]
}
```

**Field semantics**:

- `schemaVersion` — integer · bump on breaking changes. If not `1`, report incompatible schema.
- `bridgeVersion` — bridge package semver. Allows detection of incompatible bridge.
- `writtenAt` — epoch-ms. Used for staleness check.
- `port` / `endpoint` — base address; POST target for Direction A (live) is `endpoint + '/mcp'` (`deriveMcpEndpoint(endpoint)`); future Direction B CRCEP will use a separate path.
- `userCwd` — project root the bridge was started from. Disambiguates multiple bridges on one machine.
- `boundScps` — LIVE SCPs only (currently active spawns).
- `installedScps` — ALL installed SCPs (superset of boundScps keys).

**Staleness check**: `Date.now() - writtenAt > 120000` (2 minutes) → bridge may not be running. Warn: "Bridge metadata is `<N>` seconds old — bridge may not be running."

---

## Section 6 · Operation Reference (Phase 1 · File-Read Path)

### Operation 1 · `list-active-scps`

Read `boundScps` from bridge.json. Each entry has `{ port, status, browserUrl }`.

**Example response**:

```
1 SCP active — TestSeven (port 8001, live, http://localhost:8001)
```

### Operation 2 · `get-bridge-status`

Read all fields from bridge.json. Compose a status report:

```
Bridge v<bridgeVersion> · cwd <userCwd>
Endpoint: <endpoint> (Phase 2 · HTTP not yet available)
<N> installed · <M> active
```

### Operation 3 · `list-installed-scps`

Read `installedScps` array. Return formatted list with active-status overlay (cross-reference `boundScps` keys).

---

## Section 7 · Error Handling · Graceful Absence

| Condition | Response |
|-----------|----------|
| bridge.json absent | "Bridge is not running. Start the bridge with `scs` (TUI from project root)." |
| bridge.json malformed | "Bridge metadata corrupted — restart bridge to regenerate." |
| `writtenAt` > 2 min old | "Bridge appears to have exited. Restart to refresh metadata." |
| `schemaVersion !== 1` | "Bridge schema version mismatch — update SCP-Researcher Skill or bridge." |
| `endpoint` present but Phase 2 not yet implemented | "Bridge HTTP endpoint is at `<endpoint>` — HTTP request-response will be supported in a future skill update." |

The Skill MUST NEVER throw on graceful-absence conditions. Every absence path returns a user-readable message.

---

## Concluder

```bash
cat ./Cascades/Bridge/bridge.json | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log('schemaVersion:', d.schemaVersion, '| boundScps:', Object.keys(d.boundScps || {}).length, '| installedScps:', d.installedScps.length)"
```

Returns `schemaVersion: 1 | boundScps: <N> | installedScps: <M>`.

---

## Cross-References

- **Doctrine**: REF-D2 (Refinement Macro · Cycle 113 · `Cascades/Working/SUITE-3-YELLOW-REF-D2-ARCHITECTURE.md`)
- **Helper module**: `src/lib/bridge/bridgeMetadata.ts` (writes the artifact this Skill reads)
- **Conductor registration**: `Cascades/8_SUITES/SCP Researcher/Conductor.md` · SCP-S12 entry
- **Template entry-point**: `Cascades/scps/template/SCP/.claude/CLAUDE.md` · "SCP-Researcher Communication" section instructs ClaudeCode sessions opened from inside an installed SCP that this Skill is dispatchable
- **BridgeMessageEnvelope** (file-queue substrate): `src/lib/bridge/messageEnvelope.model.ts` + `src/lib/bridge/message.ts` (`enqueueMessage` signature)
- **scpMessageRouter** (bridge-side consumer): `src/lib/bridge/concepts/scpMessageRouter/`
- **SCP-S15 Messaging Mechanisms** (`Skills/MessagingMechanisms.md`): SORD envelope + SMFT model + BDAP pipeline + permission/rename/PMA — the write-path complement to this Skill's read-path
