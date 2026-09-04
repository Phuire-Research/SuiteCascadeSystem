# SM-SCP-MANAGE — SCP Management Reference Design

**Reference Design ID**: SM-SCP-MANAGE
**Suite 8**: Teal Claude (Shatterite Menu Skill)
**Surface**: Reached from SM-SCP.md `[E] Engage Installed SCP` row (CSPMSR-conditional) anor Stage I4 `[L] Launch Now`
**Pewter HiFi**: D5 closed-box · D7 active-button inversion · destructive ops default-N (CD-125 SDDA inherited)
**Origin**: Cycle 140 · MSCM Gap-1 closure (per Macro §11.20 Phase 1 post-closure)
**Citation**: Pewter Tessera Suite 8 · SUITE-3-YELLOW-CYCLE-140-MSCM-TQDR-BLUEPRINT.md §5

---

## SCP Management Menu

This menu is the bridge tools/call surface for installed SCPs — engagement, monitoring, control. Distinct from SM-SCP.md which is the lifecycle surface (install, retire, adapt). Render when `anyScpsInstalled === true`.

```
<AskUserQuestion>
╔══════════════════════════════════════════════════════════╗
║  SCP MANAGEMENT — Engage · Monitor · Control             ║
║  ─ · ─                                                   ║
║  Bridge tools/call surface for installed SCPs            ║
║                                                          ║
║  [L] Launch SCP <name>                      [Blue]       ║
║      Start a registered SCP runtime + Session Mgmt.      ║
║      → MCP tools/call scp_launch_session_management      ║
║        {scpName, callerSessionUlid}                      ║
║      Prereq: SCP installed · Bridge running              ║
║                                                          ║
║  [D] Dock SCP (manual self-registration)    [Green]      ║
║      Register a running SCP with the Bridge.             ║
║      → MCP tools/call dock_scp                           ║
║        {scpName, scpPort, logEndpoint}                   ║
║                                                          ║
║  [M] Set Session Model <ulid>               [Yellow]     ║
║      Choose the model this session RESUMES with.         ║
║      → MCP tools/call scs_set_session_model              ║
║        {sessionId, model}                                ║
║      Current: <label> · undefined → default (Opus 5)     ║
║      Alive session: takes effect at the next resume.     ║
║                                                          ║
║  [S] Status — All Connected SCPs            [Yellow]     ║
║      Snapshot of bridge-registered SCPs.                 ║
║      → MCP tools/call get_scp_status {}                  ║
║                                                          ║
║  [O] Logs — View SCP Log Buffer             [Orange]     ║
║      Read buffered output for a named SCP.               ║
║      → MCP tools/call get_scp_logs {scpName}             ║
║                                                          ║
║  [B] Open in Browser <name>                 [Cobalt]     ║
║      Open SCP web UI in default browser.                 ║
║      → scs scp open <name> · resolves port via           ║
║        get_scp_status then spawns platform opener        ║
║                                                          ║
║  [U] Unregister SCP <name>                  [Fuchsia]    ║
║      Remove SCP from bridge registry. Destructive.       ║
║      → STUB · deferred to Macro 3 (no MCP tool surface   ║
║        currently exposes scsBridgeUnregisterScp)         ║
║      (Confirm: default-N per CD-125 SDDA)                ║
║                                                          ║
║  [I] Install New SCP                        [Orange]     ║
║      → SM-SCP.md [I] Initialize route                    ║
║                                                          ║
║  [V] View Installed List                    [Blue]       ║
║      → scs scp list · render as Pewter HiFi table        ║
║                                                          ║
║  [M] Maintain (meta-cognitive)              [Purple]     ║
║      → /cascade:maintain                                 ║
║                                                          ║
║  [Esc] Back to SCP Menu                                  ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
</AskUserQuestion>
```

---

## Row Specification Table (MSCM Routing Annotation)

Each row carries the four-field MSCM annotation per Orange §3 — `toolName` · `conceptName` · `qualityName` · `cliSubcommand`. This is the recognition condition that prevents future TQDR/TQNI drift.

| Key | Label | toolName | conceptName | qualityName | strategyName | cliSubcommand | Expected Response |
|---|---|---|---|---|---|---|---|
| `[L]` | Launch SCP | `scp_launch_session_management` | `scsBridge` | `scsBridgeActivateScpSession` | — | `scs scp launch <name>` | `{ ok: true, pid?, port? }` anor MCP error · composes ALHOC double-bind (Boot Overlay + spawn) · legacy `launch_scp` retained for backward-compat only |
| `[D]` | Dock SCP | `dock_scp` | `scsBridge` | `scsBridgeRegisterScp` | — | `scs scp dock <name> --port <N> --log-endpoint <URL>` | `{ ok: true }` |
| `[M]` | Set Session Model | `scs_set_session_model` | `scsBridge` | `scsBridgeSetSessionModel` | — | TUI hotkey `m` on the selected session row (the TUI calls registry `setSessionModel` in-process — the SAME function this tool's quality calls) | `{ ok: true }` · ACK-only · an unknown ULID is REFUSED · an off-catalog id no-ops (`registry.model.skipped`) |
| `[S]` | Status | `get_scp_status` | `scsBridge` | `''` (strategy route) | `getScpStatusStrategy` | `scs scp status [name]` | `{ scps: [...], count: N }` |
| `[O]` | Logs | `get_scp_logs` | `scsBridge` | `''` (strategy route) | `getScpLogsStrategy` | `scs scp logs <name>` | `{ logs: [...], count: N }` |
| `[B]` | Open Browser | — (CLI direct) | `scsBridge` | `scsBridgeOpenBrowserTab` (direct dispatch) | — | `scs scp open <name>` | Browser tab opened |
| `[U]` | Unregister | — (Macro 3) | `scsBridge` | `scsBridgeUnregisterScp` (deferred) | — | `scs scp unregister <name>` | STUB · directive output |
| `[I]` | Install | — | — | — | — | route to SM-SCP.md `[I]` | SM-SCP install flow |
| `[V]` | View List | — | — | — | — | `scs scp list` | Formatted table |
| `[M]` | Maintain | — | — | — | — | `/cascade:maintain` | Meta-cognitive routing |

---

## MCP Invocation Pattern (rows `[L]`, `[D]`, `[S]`, `[O]`)

```
Step 1: Read bridge port via bridgeMetadataPathPerProject(cwd) anor global fallback
Step 2: Verify bridge.json age < 1h
Step 3: POST http://127.0.0.1:{port}/mcp
  Body: {
    "jsonrpc": "2.0",
    "id": <auto-increment>,
    "method": "tools/call",
    "params": { "name": "<toolName>", "arguments": <payload> }
  }
  Headers: { "Content-Type": "application/json" }
  Timeout: 5000ms
Step 4: Parse response · render result via Pewter HiFi rendering anor error box
```

CLI helper: `src/lib/scp/mcpInvoke.ts` — both `readBridgeJsonPort()` and `invokeMcpTool()` are exported and shared across all six CLI subcommands AND the Shatterite menu surface.

---

## Failure Modes

- **Bridge not running** (`BRIDGE_NOT_RUNNING`) → instruct user to run `scs` in another terminal
- **Network error** (`NETWORK_ERROR`) → port mismatch · re-check `bridge.json`
- **HTTP error** (`HTTP_ERROR`) → bridge running but `/mcp` endpoint problem
- **MCP error** (jsonrpc `error` field) → tool found issue · pass error message through

---

## Identity-as-Perimeter Note

This management menu operates within the Suite 8 perimeter established by SM-SCP install. Every tools/call invocation requires a valid `scpName` registered in `Cascades/SCPs.json`. There is no global "manage any SCP" route — the perimeter is the access layer.

---

## The Lifecycle Controls — Close · Archive · Reinstate (MD-ARC+C · the Pewter Control Sync Law)

BOTH control surfaces (the SCS-Bridge SessionManager AND this management surface) bear
the SAME lifecycle set with the SAME predicates — Pewter D5 closed-box · D7 inversion ·
destructive default-N:

```
[X] Close SCP <name>                         [Fuchsia]
    Stop the running SCP: window closed · server SIGTERMed
    (handle→pid→port fallback) · status → 'pending'.
    → scsBridgeStopScp (the scp_stop three-leg · RECOVERABLE)
    Enabled: status live · The precondition Archive's guard names.

[A] Archive SCP <name>                       [Orange]
    The reversible vault move: Cascades/scps/<name>/ →
    Cascades/scps/.archive/<name>/ · entry → archivedScps[] ledger
    (port/sessions preserved) · gitm watcher disarm + slice delete.
    → archiveScpEntry (SARC · confirm default-N)
    REFUSED live ("stop the SCP first · [X]") · system SCPs never ·
    a worktree INSTANCE redirects to the Delete retire (the branch
    survives in its parent) · an OWNER confers: retire instances
    first anor [F] force (move + git worktree repair from the vault).
    Enabled: status pending.

▸ Archived (N)  ·  [T] toggle fold
    Dimmed rows · archive date · [R] Reinstate on the selected row:
    the reverse move + ledger restore at status 'pending' (launch is
    manual). REFUSED on a name collision anor an occupied seat.
    → reinstateScpEntry (SRST)
```

The predicates are shared verbatim across surfaces: live → Close enabled + Archive
refused · pending → Archive enabled · archived → Reinstate only.

---

## Cross-References

- Parent menu: `SM-SCP.md` (lifecycle surface)
- Menu index: `SM-Index.md`
- Bridge MCP tools: `src/lib/bridge/concepts/scsBridge/principles/scsBridgeScpToolRegistration.principle.huirth.ts`
- New Quality: `src/lib/bridge/concepts/scsBridge/qualities/scsBridgeLaunchScp.quality.huirth.ts`
- Read strategies: `src/lib/bridge/concepts/scsBridge/strategies/scsBridgeReadStrategies.ts`
- CLI commands: `src/commands/scp/{launch,status,logs,open,dock,unregister}.ts`
- MCP helper: `src/lib/scp/mcpInvoke.ts`
- Doctrinal source: `Cascades/Working/SUITE-3-YELLOW-CYCLE-140-MSCM-TQDR-BLUEPRINT.md` §5

---

## Trajectory

| Date | Cycle | Change |
|---|---|---|
| 2026-05-18 | 140 | RD created · MSCM Gap-1 closure · TQDR remap operational (launch_scp/dock_scp Quality branch · get_scp_status/get_scp_logs Strategy branch) · 6 CLI subcommands added · `[U] Unregister` stubbed pending Macro 3 |
| 2026-08-02 | MD-ARC+C | The Lifecycle Controls landed — [X] Close · [A] Archive (WAPF-branched · default-N) · the Archived fold + [R] Reinstate · the Pewter Control Sync Law (both surfaces · shared predicates) |
