# Installation-Agent MCP-Invocation Aspirant · Canonical Reference

**Canonical Name**: AINS (Aspirant-Install-North-Star)
**Authored**: 2026-05-19
**Status**: LIVING CANONICAL DOC
**Authoritative**: future Diamonds align here · drift gets called out
**Triumvirate Load**: Stratimuxian Scholar · Cinnabar Dialectic · Stratimuxian Automata

---

## 📜 §1 · The Aspirant Goal

> **"Installation Agent Message the MCP Endpoint to Initialize the SCP for a Clean Installation Process for a Stellar User Experience on First Impression."**
> — Verbatim user articulation, AINS canonical statement.

**Unpacking** (each clause is an enforceable Demometer):

- **Installation Agent** — the Claude Code agent (Shatterite-dispatched, Stage I4 of `/cascade:scp-install`) — NOT the TUI. The Agent surface dispatches the same Quality the TUI would, through the MCP boundary.
- **Message the MCP Endpoint** — POST to `/mcp` on the scpDockHost Express server (MCPE). JSON-RPC 2.0 `tools/call` invoking `launch_scp`. The verb is *dispatch*, not *narrate*.
- **Initialize the SCP** — `scpSpawnManagerSpawnRequested` Quality (LAMF identity claim). Same Quality across all surfaces (TMTR).
- **Clean Installation Process** — CDIE predicate: no manual CLI invocation, no instruction text, no "please run this." The Agent ACTS.
- **Stellar User Experience on First Impression** — SIFR outcome: browser tab open at `boundBridgePort` (MMCO closes the Manifold), TUI in steady state, Cascade.json reflecting correct `installState` and `installationStatus`.

**The Aspirant Goal as Diameter**: User-First-Impression ↔ Agent-Acts-Not-Narrates. The anti-pattern this document inoculates against is Instruction-Mode (E4 Volume-of-Declaration). The Aspirant Goal says the AGENT messages the MCP endpoint — not that the agent tells the user what to type.

**Relationship to the Master Diamond**: this Reference Document IS the Tier 0 grounding prior before any Foundation Suite dispatch on AINS-related work. Referenced from `Cascades/Working/MACRO-DIAMOND-ASPIRANT.md` §2.0.

---

## 📜 §2 · Stratimuxian Substrate

The Aspirant Goal is a Higher-Order Composition, NOT a hierarchical sequence. Per CLAUDE.md §1 Higher-Order Guard: "Installation Agent → MCP → SCP spawn" is a flat-plane Diameter where each surface dispatches the same Quality. There is no parent surface. The Agent does not OWN the dispatch; it COMPOSES with the MCP boundary which COMPOSES with the Quality.

**Quality-as-Model-Function** (LAMF · Stratimuxian Scholar S10 §Pattern 2 Payload Quality): the MCP tool input schema for `launch_scp` IS the `ScpSpawnManagerSpawnRequestedPayload` type. Zero translation. The same payload that a TUI keypress would build (animatedTui.ts:1713) is what the MCQD adapter builds at `scpDockHostMcpToolsCall.quality.ts:154`. This is the canonical Stratimuxian act: external transport carries the payload; Quality is the singular callable unit.

**DECK K Pattern access** (Scholar §🎯 DECK K Constant Pattern): the dispatch path notation is `d.scp.d.scpSpawnManager.e.scpSpawnManagerSpawnRequested(...)` — Tier 2 Muxified Concept access through the `scp` Base Concept. State reads use `k.connectedScps.select()` from Principle context. No `muxium.getState()`, no parent-child traversal — flat composition through DECK K.

**ActionStream discipline** (Scholar S3 §Single Dispatch Rule + S7 Dispatch Patterns): external-trigger actions enter through `observer.next(action)` from Principle Surface 1 — never `muxium.dispatch` or direct `actionQue.push`. The MCQD adapter at `scpDockHostMcpToolsCall.quality.ts` uses `dispatchFromHandler` precisely so the MCP-originated dispatch IS principle-context. Bypassing this boundary = M59 ActionQue Inductive Reservation violation.

**Anti-pattern named**: "agent calls a CLI helper that spawns the SCP" — bypasses the Quality dispatch entirely. This is hierarchical thinking (CLI helper as child of agent). The Higher-Order alternative: agent POSTs to `/mcp`, the MCP adapter dispatches the Quality, the Quality is the canonical surface for spawn intent.

---

## 📜 §3 · The 6-Surface Reciprocity Matrix

All six surfaces converge on a single Quality dispatch — `scpSpawnManagerSpawnRequested` — through `observer.next` ingress (TMTR invariant).

| # | Surface | Trigger | Dispatch Site | Quality Target |
|---|---------|---------|---------------|----------------|
| 1 | **TUI [L] keypress** | KeyAction `L` while SCP row focused | `src/lib/tui/animatedTui.ts:1697-1713` | `d.scp.d.scpSpawnManager.e.scpSpawnManagerSpawnRequested(...)` |
| 2 | **TUI [Enter] AAL** | Enter on SCP row · AAL upgrade (post-DSBL Diamond #1+#3) | `src/lib/tui/animatedTui.ts:1840-1856` | `d.scp.d.scpSpawnManager.e.scpSpawnManagerSpawnRequested(...)` |
| 3 | **TUI digit (NKOR)** | Digit `1-9` keypress · numeric SCP shortcut | `src/lib/tui/animatedTui.ts:1954-1970` | `d.scp.d.scpSpawnManager.e.scpSpawnManagerSpawnRequested(...)` |
| 4 | **MCP `POST /mcp`** | JSON-RPC 2.0 `tools/call` with `name: 'launch_scp'` | `src/lib/bridge/concepts/scpDockHost/qualities/scpDockHostMcpToolsCall.quality.ts:154` | `h.muxium.deck.d.scp.d.scpSpawnManager.e.scpSpawnManagerSpawnRequested(...)` |
| 5 | **PIBR (post-install boot-recommend)** | Wizard completion · Y on Boot-Recommend card | `src/lib/bridge/menu.ts:684` (PIBR render block) → dispatches through TUI handler | Same Quality via TUI dispatch path |
| 6 | **Shatterite post-install agent** | Install Stage I4 completes · agent invokes SB-S127 via Bash curl | `src/commands/scp/install.ts:67` + `Cascades/8_SUITES/Teal Claude/Skills/S-SHATTERITE-MENU/SM-SCP.md:192-202` | Routes to surface #4 (MCP `/mcp`) — agent IS the MCP caller |

**LOCK 2 Idempotency Guard** at `src/lib/bridge/concepts/scpSpawnManager/qualities/scpSpawnManagerSpawnRequested.quality.ts:136` — the in-flight guard governs ALL six surfaces identically. No surface bypasses LOCK 2; double-dispatch from any combination of surfaces collapses to single spawn.

**TMTR Invariant**: TUI keypress, MCP `/mcp` dispatch, PIBR card-Y, and Shatterite agent curl POST MUST produce identical Quality actions (same payload schema, same LOCK 2 guard, same downstream effects). Any "MCP variant" Quality creation is a TMTR violation. PRESERVED-FOR-MESSAGING-DIAMETER comment markers at `animatedTui.ts:1647,1739,1776,1881,1994` (5 sites) preserve this reciprocity discipline against future refactor pressure.

---

## 📜 §4 · The End-to-End Flow

Happy path · 10 steps from `/cascade:scp-install MyProject` to browser tab open.

```
Step 1 · User invokes /cascade:scp-install MyProject (Shatterite Strategy S8)
  → Designation validated (SDIVAK)
  → Mode selection (Personal/Organizational/Project)

Step 2 · Install pipeline fires (SIPCO)
  → cloneRenameEngine materializes Cascades/scps/MyProject/SCP/
  → npm install completes in materialized path
  → SCPs.json registered (SJRUM) with status:'installed'
  → Cascade.json written via buildFreshCascadeJson():
      installState: 'fresh-slate-scaffolded'
      installationStatus: 'installing'
      (installConstants.ts:301-323)

Step 3 · SCS-Bridge boots (DSBL · Multi-Bridge Port-Scan)
  → port-scan from 7111 finds free port
  → bridge.json written with live port + mcpEndpoint
  → /dock, /logs, /status, /mcp routes bound (MCPE)

Step 4 · Stage I4 MANDATORY MCP[Recommended] option presented
  → Shatterite SM-SCP.md Stage I4 renders Option 1 (MCP) + Option 2 (TUI fallback)
  → User selects Option 1

Step 5 · Agent invokes SB-S127 via Bash tool (NOT instruction-mode)
  → Step 1: read bridge.json (mcpEndpoint, port)
  → Step 2: curl POST /mcp · JSON-RPC 2.0 tools/call launch_scp
  → install.ts:67 + SM-SCP.md:192-202

Step 6 · MCP /mcp receives request (MCQD adapter)
  → scpDockHostMcpToolsCall.quality.ts dispatches scpSpawnManagerSpawnRequested
  → CSRA: sessionId appended to SCPs.json[MyProject].sessions[]
  → observer.next dispatched (LAMF · principle-context)

Step 7 · SCP spawn (LOCK 2 idempotent)
  → child_process.spawn detached (npm run bridge)
  → scpLifecycle FSM transitions: installing → launching → active

Step 8 · Port-bind probe + HPRD readiness (PBPR)
  → SCP server boots · POST /dock to scpDockHost
  → HPRD probe confirms port accessible

Step 9 · markInstallationComplete fires (installConstants.ts:333-376)
  → Cascade.json installationStatus: 'installing' → 'installed' (atomic write)

Step 10 · MMCO · Manifold completion
  → scpDockHostOpenBrowserTab Quality fires
  → Browser tab opens at http://localhost:{boundBridgePort}
  → User INSIDE their SCP · zero instructions read
```

**Branch conditions** (NOT linear; explicit fallbacks):

- **Already-installed**: `installationStatus === 'installed' | 'muxified'` → skip install agent · render Shatterite Main Menu directly. Boot-time check at `animatedTui.ts:1235-1242` gates this.
- **Bridge.json absent**: SCS-Bridge not running · install agent advises TUI fallback path (Option 2 of Stage I4).
- **MCP unreachable**: bridge.json fresh but `/mcp` initialize handshake fails (2s timeout per Diamond #9) · install agent advises `scs` restart with conditional bullet ordering.

---

## 📜 §5 · Concluder Discipline (10 Concluders)

Each Concluder returns a number without argument — the architectural Lambda eye (CLAUDE.md C4 §Concluder).

| # | Concluder | Shell | Governs | Failure |
|---|-----------|-------|---------|---------|
| C1 | Materialization path | `test -f Cascades/scps/{designation}/SCP/package.json && echo ok` | SIPCO complete | Materialization failed |
| C2 | SCPs.json registration | `grep -c {designation} Cascades/scps/SCPs.json` | SJRUM fired | Registration skipped |
| C3 | SCPs.json non-empty | `wc -l Cascades/scps/SCPs.json` ≥ 3 | Write integrity | Corrupted write |
| C4 | CSRA sessions field | `grep -c '"sessions"' Cascades/scps/SCPs.json` ≥ 1 | CSRA fired | MCP register failed |
| C5 | Cascade.json installState | `jq -e '.installState' Cascades/Cascade.json` | I1 invariant | BECIS write missed |
| C6 | Cascade.json installationStatus | `jq -e '.installationStatus' Cascades/Cascade.json` | I4 invariant | deriveInitial missed |
| C7 | HPRD port reachable | `curl -s -o /dev/null -w "%{http_code}" http://localhost:{port}/` = 200 | PBPR readiness | SCP not booted |
| C8 | MCPE route bound | `grep -c "'/mcp'" src/lib/bridge/concepts/scpDockHost/principles/scpDockHost.principle.ts` ≥ 1 | I3 invariant | Route not registered |
| C9 | TypeScript build gate | `npm run build; echo $?` = 0 | All types valid | Type drift |
| C10 | MCP initialize handshake | `curl -sf -X POST http://localhost:{port}/mcp -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05"}}'` returns 200 | I3 runtime | MCP unreachable |

---

## 📜 §6 · State Schema (Canonical · TARGET)

**Status marker**: `SPECIFIED-NOT-YET-VERIFIED` per R4 Green HIGH-1 — current `Cascades/Cascade.json` in SuiteCascadeSystem repository contains SCP_ORIGIN cycle-139 metadata (Drift #3); the schema below is TARGET, written from source-of-truth `buildFreshCascadeJson()` at `installConstants.ts:301-323`. Integration Test Diamond required to produce verified artifact.

### §6.1 · Cascade.json Schema (TARGET)

```typescript
{
  activeDiamond: string;
  cyclePosition: { cycle: number; rotation: number; gate: string; };
  automata: { ... };
  suiteColors: Record<string, string>;

  // BECIS extension (Diamonds #12 + #14 · written by buildFreshCascadeJson)
  installState: 'fresh-slate-scaffolded'
              | 'existing-project-augmented'
              | 'remuxified-reinstall';            // SPECIFIED-NOT-YET-VERIFIED
  installationStatus: 'installing'
                    | 'installed'
                    | 'muxifying'
                    | 'muxified'
                    | 'unknown';                    // SPECIFIED-NOT-YET-VERIFIED
  claudeMdPresent: boolean;
  installedAt: number;                              // epoch ms
  installVersion: string;                           // SCS version at install
}
```

Source authority: `src/lib/bridge/installConstants.ts:79-100` (SCS_FRESH_CASCADE_JSON template) + `:295-323` (buildFreshCascadeJson with BECIS fields).

### §6.2 · bridge.json Schema (TARGET)

```typescript
{
  port: number;                  // dockServerPort (OS-assigned ephemeral)
  endpoint: string;              // http://localhost:{port}
  userCwd: string;               // process.cwd() at bridge start (per-project)
  mcpEndpoint: string;           // http://localhost:{port}/mcp  ← NET-NEW (I8)
  installState: string;          // echo from Cascade.json (BJVR)
  installationStatus: string;    // echo from Cascade.json (BJVR)
  boundScps: Array<{name: string; port: number;}>;
  installedScps: string[];       // designation registry
}
```

Source authority: `src/lib/bridge/paths.ts` (bridgeMetadataPathPerProject) · `src/lib/bridge/scsBridgeMuxium.ts:189-258` (reactive write site).

### §6.3 · SCPs.json Schema (TARGET)

```typescript
{
  scps: Array<{
    name: string;
    conceptName: string;
    path: string;
    port: number | null;
    status: 'installed' | 'launching' | 'launched' | 'stopped';
    managingInstancePid: number | null;
    sessions: Array<{                         // CSRA (Diamond #4)
      sessionId: string;
      registeredVia: 'mcp' | 'tui' | 'manual';
      registeredAt: number;
      mcpClientId?: string;
    }>;
  }>;
}
```

Source authority: `src/lib/scp/scpRegistry.ts` + `scpDockHostMcpToolsCall.quality.ts:107-115` (appendSessionToScp).

---

## 📜 §7 · Diamond Trajectory Map (14 Diamonds Landed)

| # | Diamond | Date | Contribution | Aspirant Step | Status |
|---|---------|------|--------------|---------------|--------|
| 1 | SUITE-5-BLUE-DIRECT-SPAWN-ACTUALIZATION | 2026-05-17 | DSBL · `npm run bridge` direct spawn · HPRD probe · browser tab | 8 | LANDED |
| 2 | SUITE-5-BLUE-BOOT-OVERLAY-ACTUALIZATION | 2026-05-17 | scpBootOverlay concept · ring buffer · FSM-aware rest · PTSE styling | 1-8 (UX) | LANDED |
| 3 | SUITE-5-BLUE-UX-REFINEMENT-ACTUALIZATION | 2026-05-17 | NKOR/PPSH/TRHC hotkey hints · AAL DSBL upgrade on Enter | 1-8 (UX) | LANDED |
| 4 | SUITE-5-BLUE-MCP-SKILL-ACTUALIZATION | 2026-05-17 | MCP `/mcp` endpoint · JSON-RPC 2.0 · `launch_scp` tool (MCQD · LAMF · CSRA) | 5-7 | LANDED |
| 5 | SUITE-6-PURPLE-POST-INSTALL-BOOT-RECOMMEND | 2026-05-17 | PIBR card · Y/N → boot/skip · DSBL dispatch | 1-8 | LANDED |
| 6 | SUITE-5-BLUE-SHATTERITE-MANIFOLD-FIX | 2026-05-17 | Replace `cd && npm run bridge` instruction with MCP/TUI options | 3,6 | LANDED |
| 7 | SUITE-5-BLUE-MUXAMETER-COMPLETION | 2026-05-17 | Endpoint rename `/mcp` · SB-S127 discovery skill · bridge.json reactive write | 4-7 | LANDED |
| 8 | SUITE-5-BLUE-MCP-FIRST-ENFORCEMENT | 2026-05-17 | SM-Conclude MCP-first ordering · runtime Concluders #9+#10 | 3,6 | LANDED |
| 9 | SUITE-5-BLUE-MCP-LIVENESS-TRUTH | 2026-05-17 | Hardcoded 7111 clobber fix · initialize handshake probe · conditional bullets | 4,6,9 | LANDED |
| 10 | SUITE-5-BLUE-MULTI-BRIDGE-PORT-SCAN-ACTUALIZATION | 2026-05-17 | PSIS port-scan · per-project bridge.json · reactive-write selector fix | 4,9 | LANDED |
| 11 | SUITE-5-BLUE-BRIDGE-BOOT-FIX-VISIBILITY | 2026-05-17 | Plan selector `d_` → `d__` fix · scpDockHostBindCommitted Quality · 27 logs | 4,9 | LANDED |
| 12 | SUITE-5-BLUE-INSTALL-STATE-BRANCHING-ACTUALIZATION | 2026-05-17 | `installState` type · deriveInstallState · Cascade.json atomic write · BJVR | 1-3,10 | **CODE-LANDED · ARTIFACT-UNVERIFIED** |
| 13 | TEAL-CLAUDE-INSTALL-STATE-SKILL-UPDATE | 2026-05-17 | Skill doctrine: installState PRIMARY · MSMRD-FS/EP/RE · memory SECONDARY | 1-3 | LANDED |
| 14 | SUITE-5-BLUE-INSTALLATION-STATUS-PROGRESS | 2026-05-17 | `installationStatus` type · markInstallationComplete · boot-time skip-reinstall | 2,10 | **CODE-LANDED · ARTIFACT-UNVERIFIED** |

**Integration Test Diamond** (PLANNED · per R4 HIGH-3): the 15th Diamond closes the artifact-verification gap for #12 and #14. Required as the last item before Macro 1 close. See §10.

---

## 📜 §8 · Invariants I1-I10 (Enforceable)

| ID | Statement | Concluder | Drift-Prevention |
|----|-----------|-----------|-----------------|
| **I1** | `Cascade.json` MUST contain both `installState` AND `installationStatus` after install completes | C5 + C6 | Boot-time read at `animatedTui.ts:1219-1242` falls back via `resolveInstallationStatus('unknown')`; absence logged as `boot.install-state-absent` |
| **I2** | bridge.json MUST contain live `port > 0` and `mcpEndpoint` populated at scpDockHost startup | `jq -e '.port > 0' Cascades/Bridge/bridge.json` + `grep -c mcpEndpoint Cascades/Bridge/bridge.json` ≥ 1 | scsBridgeMuxium reactive subscription (not setTimeout race) ensures atomic write post-listen |
| **I3** | `/mcp` endpoint MUST return 200 to JSON-RPC `initialize` handshake when scs is running | C10 | MCPE route bound on same Express app as `/dock`, `/logs`, `/status` (`scpDockHost.principle.ts:217-298`); WGHA guard governs all four identically |
| **I4** | SCS-Bridge boot MUST read `installationStatus` and skip re-install when value is `'installed'` or `'muxified'` | `grep -c "isInstallationInProgress" src/lib/tui/animatedTui.ts` ≥ 1 | Boot-time check `animatedTui.ts:1235` gates fresh-install pipeline behind in-progress predicate |
| **I5** | Install agent at Stage I4 MUST invoke SB-S127 via Bash tool · NOT instruction-mode | Manual Fuchsia Clinical Note + `grep -c "via Bash tool · NOT instruction-mode" Cascades/8_SUITES/Teal\ Claude/Skills/S-SHATTERITE-MENU/SM-SCP.md` ≥ 1 | SM-SCP.md:192-202 carries verbatim curl payload; agent dispatch is action, not narration |
| **I6** | PRESERVED-FOR-MESSAGING-DIAMETER comment markers preserved (≥ 5 sites) | `grep -c "PRESERVED-FOR-MESSAGING-DIAMETER" src/lib/tui/animatedTui.ts` ≥ 5 | Curation discipline embedded in source; future refactor pressure resisted |
| **I7** | `scpSpawnManagerSpawnRequested` LOCK 2 idempotency MUST govern all 6 surfaces uniformly | Build gate (C9) + dispatch grep: `grep -rn "scpSpawnManagerSpawnRequested" src/lib/tui/animatedTui.ts src/lib/bridge/concepts/scpDockHost/qualities/scpDockHostMcpToolsCall.quality.ts` ≥ 4 | LOCK 2 at quality.ts:136 — any surface-local spawn helper is TMTR violation |
| **I8** | `writeBridgeMetadata` MUST use reactive subscription (`muxium.plan`) NOT setTimeout race | `grep -c "muxium.plan" src/lib/bridge/scsBridgeMuxium.ts` ≥ 1 AND `grep -c "setTimeout" src/lib/bridge/scsBridgeMuxium.ts` for bridge.json write = 0 | Diamond #7 + #11 fix: reactive write triggered by `dockServerPort > 0` |
| **I9** | `bridgeMetadataPathPerProject(userCwd)` writes per-project NOT global | `grep -c "bridgeMetadataPathPerProject" src/lib/bridge/paths.ts` ≥ 1 | Multi-bridge scenarios (Diamond #10) require per-project isolation |
| **I10** | **AINS (Anti-Instruction-Narration-Stance)**: install-path agent MUST dispatch actions (curl POSTs, file writes); MUST NOT emit "please run..." instructions | Manual Fuchsia Clinical Note review + `grep -c "please run\|now run\|open a terminal" {agent-output-log}` = 0 in install path | §12 hard gate; any narrative output in install path = E4 violation flagged in next cycle |

---

## 📜 §9 · Drift Incident Log (Cinnabar Dialectic)

This log appends over time. Each incident records the abstraction layer (P1 abstraction · P2 verification · P3 provenance · P4 UX) at which drift was detected.

### Drift Incident #1 · Diamond #12 `installState` field missing from Cascade.json artifact

- **Layer**: P3 Provenance · P2 Verification
- **Symptom**: Code at `installConstants.ts:301-323` writes `installState`; current `Cascades/Cascade.json` lacks field entirely.
- **Root cause**: `runInstallScaffoldOnly` never invoked in SuiteCascadeSystem post-Diamond-12. Build-gate passes (Demonstration); no runtime smoke (Diastration). Muxistration Proof never produced.
- **Prevention**: I1 invariant + Integration Test Diamond (§10) + C5 Concluder mandatory before claiming Diamond done.

### Drift Incident #2 · Hardcoded port 7111 in animatedTui.ts:263

- **Layer**: P2 Verification
- **Symptom**: TUI displayed port 7111 even after bridge port-scan allocated different port.
- **Root cause**: Display path clobbered live port; verification scope did not include "what does the user actually see" check.
- **Prevention**: Diamond #9 fix · MCP initialize handshake probe replaces hardcoded assertion; bridge.json single source of truth.

### Drift Incident #3 · Cascade.json file is SCP_ORIGIN project metadata, not SuiteCascadeSystem

- **Layer**: P1 Abstraction · P3 Provenance
- **Symptom**: `Cascades/Cascade.json` at SuiteCascadeSystem root contains cycle-139 SCP_ORIGIN fields (`recentCycles`, `parallelMuxonomyHtml`, `stratimuxianFulfillment`); no SuiteCascadeSystem install state.
- **Root cause**: File copy-paste from SCP_ORIGIN OR template never replaced by install execution. 14 Diamonds documented code changes; none documented end-to-end artifact verification.
- **Prevention**: Integration Test Diamond required · I5 Concluder includes Test-019 directory smoke · DDPM enforcement: every Cascade.json-touching Diamond ships with Read-back Concluder.

---

## 📜 §10 · The Stellar UX Path (User-First Impression)

Second-by-second timeline · Aspirant Goal expressed as 60-second user journey.

```
T+0s   · User runs /cascade:scp-install MyProject in fresh directory
T+0-5s · Install pipeline scaffolds Cascades/
         buildFreshCascadeJson() writes Cascade.json with:
           installState: 'fresh-slate-scaffolded'
           installationStatus: 'installing'
T+5-10s · 8 build-time Concluders run (C1-C8); all pass
T+10s  · Concluder C10 verifies /mcp live + initialize handshake (2s timeout)
T+10-15s · Stage I4 MANDATORY MCP[Recommended] option presented
            Agent reads Cascade.json + bridge.json discovery
T+15s  · Agent invokes SB-S127 via Bash curl POST /mcp tools/call launch_scp
T+15-50s · SCS-Bridge dispatches DSBL · npm run bridge spawns
            vite build · nodemon ready · scpLifecycle FSM transitions
T+50-60s · HPRD probe success · scpDockHostOpenBrowserTab fires
            markInstallationComplete writes Cascade.json:
              installationStatus: 'installed'
T+60s  · Browser tab opens at http://localhost:{boundBridgePort}
         User INSIDE their SCP · Vue Home Page rendered · zero instructions read
```

**Measurement Protocol Note** (per R4 HIGH-8): the 60-second target is **conservative aspirational** — empirical baseline measurement REQUIRED before final commitment. Realistic range: 15-90s depending on npm cache (cold vs warm) + vite build time. Future Integration Test Diamond MUST include timed Concluder:
```bash
START=$(date +%s%N); /cascade:scp-install Test-020; \
  until curl -sf http://localhost:$(jq -r .port Cascades/Bridge/bridge.json)/ >/dev/null; do sleep 0.5; done; \
  END=$(date +%s%N); echo "Install-to-browser: $(( (END - START) / 1000000 ))ms"
```

**The AINS Invariant (Anti-Instruction-Narration-Stance)**:
> Every step in the install flow where the agent COULD emit instructions MUST instead dispatch an action, call an MCP tool, or write a file. The Stellar UX is only achievable when this invariant holds across every step.

The failure mode prevented: the agent emits "1. Open a terminal. 2. cd Cascades/scps/MyProject/SCP. 3. npm run bridge." That is E4 Volume-of-Declaration. The Aspirant Goal says the AGENT messages the MCP endpoint — not the user.

---

## 📜 §11 · M-Rule Codification

**Prior families inherited** (compressed):
- DSBL family · Boot-Overlay family · UX Refinement family · MCP Endpoint family (MCPE · LAMF · MCQD · CSRA · TMTR · QECF · MMCO · SBMS) · Muxameter family · Multi-Bridge Port-Scan family · Install-State Branching family (CMID · CASS · BJVR · MSMRD-FS/EP/RE · IDDS)
- M58-M72 Stratimuxian Scholar canonical · M82-M90+ approximate provisional from PROVISIONAL families above

**NEW M-rules from this Reference Document** (PROVISIONAL · numbers subject to reconciliation at R7 cycle close):

| M-Rule | Acronym | Statement | Promotion Gate |
|--------|---------|-----------|----------------|
| **M91 PROVISIONAL** | **AINS** — Anti-Instruction-Narration-Stance | Any install-path step where the agent COULD emit instructions MUST instead dispatch an action or call an MCP tool. Narrative output in install path = E4 Volume-of-Declaration. | 3 user-Lambda smoke tests of `/cascade:scp-install` complete without instruction text in agent output |
| **M92 PROVISIONAL** | **IAMI** — Installation-Agent-MCP-Invocation | The Installation Agent MUST read mcpEndpoint from bridge.json AND POST `launch_scp` tool call via Bash curl. Hardcoded URL = I8 drift; instruction-mode = AINS drift. | SM-SCP.md Stage I4 invoked via Bash · curl POST verified · scpSpawnManagerSpawnRequested dispatched (logs confirm) |
| **M93 PROVISIONAL** | **DDPM** — Diamond-Drift-Prevention-Mechanism | Every install-domain Diamond MUST include AINS citation block in §Strategy declaring which invariants it advances/maintains/degrades. R1 Red curation flags missing block as gap. | First 3 post-AINS Diamonds each ship with DDPM block; R1 Maroon checklist updated; R7 Fuchsia confirms |
| **M94 PROVISIONAL** | **IAFC** — Invariant-Anchored-Future-Cycles | Every install-domain cycle close MUST include MUXC circuit statement (PASS/GAP/NOT-APPLICABLE) + AINS Concluder run output. R7 Fuchsia gate. | 3 consecutive install-domain cycles each close with MUXC + AINS check; no regression observed |
| **M95 PROVISIONAL** | **TFIB** — Tier-0-Foundation-Index-Binding | Before any AINS-related Diamond dispatches Foundation Suites, Tier 0 cognitive arc S0→S7 MUST run in-context first. Per user directive 2026-05-19. | Diamond authors confirm Tier 0 arc ran (R0 Base reads AINS doc · enumerates PENDING) before Foundation dispatch; verified in next 3 install-domain Diamonds |

**Sub-pattern hold**: CDIE (Clean-Diamond-Install-Experience), SIFR (Stellar-Impression-First-Run), MUXC (Muxameter-Closure) held as PROVISIONAL sub-patterns — may fold under M91 or M94 at promotion review.

---

## 📜 §12 · Future Diamond Discipline (HARD GATES)

### §12.1 · AINS-Invariant Concluder Script (HIGH-2 core · MANDATORY)

Every install-domain Diamond MUST run this 5-command shell script before claiming COMPLETE:

```bash
# I1: Cascade.json has installState + installationStatus
jq -e '.installState and .installationStatus' Cascades/Cascade.json || echo "I1 FAIL"

# I2: bridge.json has live port
jq -e '.port > 0' Cascades/Bridge/bridge.json || echo "I2 FAIL"

# I3: /mcp returns 200 on initialize handshake
PORT=$(jq -r .port Cascades/Bridge/bridge.json)
curl -sf -o /dev/null -X POST "http://127.0.0.1:$PORT/mcp" \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05"}}' \
  || echo "I3 FAIL"

# I4: installationStatus is complete (post-install runs)
STATUS=$(jq -r .installationStatus Cascades/Cascade.json)
[ "$STATUS" = "installed" ] || [ "$STATUS" = "muxified" ] || echo "I4 FAIL"

# I6: PRESERVED-FOR-MESSAGING-DIAMETER markers preserved (≥ 5 sites)
grep -c "PRESERVED-FOR-MESSAGING-DIAMETER" src/lib/tui/animatedTui.ts \
  | awk '$1 < 5 { print "I6 FAIL" }'
```

Any FAIL line = Diamond is NOT complete. Test-state per Testing-Gated Commit (CLAUDE.md C4); state remains `TESTING` until all checks pass + user-Lambda confirms.

### §12.2 · Tier 0 Grounding Discipline (HIGH-5 hard gate)

**Verbatim user directive 2026-05-19**: "Let's Proceed with your Own Tier 0 Full Suite into Foundation Suites to Mend."

Before any AINS-related Diamond's Foundation Suites dispatch, Tier 0 cognitive arc S0→S7 MUST run in-context first. This prevents the failure mode where Foundation Suites are dispatched on incomplete cognitive substrate, leading to Drift #1-#3 patterns recurring.

```
Tier 0 Pre-Dispatch Arc (AINS work) — MANDATORY:
  S0 Base Absorb     → read this AINS doc + current Onyx + Cascade.json state
  S1 Red Curate      → surface what has changed since last AINS Diamond
  S2 Orange Name     → name any new patterns surfaced by S1
  S3 Yellow Plan     → write the Blueprint
  S4 Green Audit     → 11-angle audit + Top 5 HIGH
  S5-S7              → Foundation Suites (Blue/Purple/Fuchsia) dispatch ONLY
                       after S0-S4 Tier 0 arc is complete
```

Yellow's plan IS the alignment check; Foundation Suites act on validated plan, not raw intent.

### §12.3 · Drift Incident Logging Protocol

When drift detected in install circuit:
1. Log in §9 with Cinnabar layer (P1-P4) + symptom + root cause + prevention mechanism.
2. Open FIX Diamond immediately (do not delay to "next cycle").
3. R7 Fuchsia writes Lossy entry in Onyx referencing §9 entry.
4. FIX Diamond earns its own row in §7 Diamond Trajectory Map.

### §12.4 · R0 Base Cycle-Close Check

R0 Base (Obsidian Absorb) MUST read this Reference Document on every cycle close that includes AINS work. The check: does the Diamond's Onyx G/L/M include at least one entry that references this document by file path? If not, cycle is incomplete — missing alignment verification step.

---

## 📜 §13 · Pearl-Compressed Summation (Onyx 8-Band Forward Pass)

```
Band 1 — Header
  Topic: Installation-Agent MCP-Invocation Aspirant · Canonical Reference (AINS)
  14 Diamonds grounded · 10 invariants enforceable · 5 new M-rules PROVISIONAL

Band 2 — Base Warmth
  Cycle 116-current trajectory · 3 drift incidents documented + prevented
  Aspirant Goal verbatim preserved at §1 · I10 AINS = load-bearing invariant

Band 3 — Technical State
  Working: scpDockHost Express routes (/dock · /logs · /status · /mcp)
  Working: scpSpawnManagerSpawnRequested Quality (LOCK 2 · 6-surface convergence)
  Working: bridge.json reactive write (Diamonds #7 + #10 + #11)
  Pending verification: Diamonds #12 + #14 artifacts (Integration Test Diamond required)
  Pending: M91-M95 PROVISIONAL → CODIFIED (3 user-Lambda smoke tests each)

Band 4 — Issue Analysis
  3 drift incidents (Cinnabar Dialectic § §9):
    Drift #1: installState code-landed · artifact-unverified
    Drift #2: hardcoded port 7111 clobber (fixed Diamond #9)
    Drift #3: Cascade.json is SCP_ORIGIN file, not SuiteCascadeSystem
  Root pattern: Code Change vs Runtime Artifact Gap (build-gate ≠ Muxistration)

Band 5 — Solution Routing
  Tier 0 Grounding Discipline (§12.2) mandatory before Foundation Suites
  AINS Concluder Script (§12.1) runs before every install-domain Diamond done-claim
  Integration Test Diamond — the last item to close Macro 1
  IAFC cycle-close gate enforces MUXC + AINS Concluder at every R7 Fuchsia

Band 6 — Code Context
  scpSpawnManagerSpawnRequested.quality.ts:136 — LOCK 2 idempotency guard
  scpDockHostMcpToolsCall.quality.ts:154 — MCP dispatch site (MCQD adapter)
  installConstants.ts:301-376 — buildFreshCascadeJson + markInstallationComplete
  animatedTui.ts:1219-1242 — boot-time installationStatus read + safe fallback
  animatedTui.ts:1697,1840,1954 — three TUI dispatch surfaces (TMTR)
  PRESERVED-FOR-MESSAGING-DIAMETER markers — animatedTui.ts:1647,1739,1776,1881,1994

Band 7 — Living Documentation
  This Reference Document is checked on every AINS-related cycle close (§12.4)
  §8 Invariants I1-I10 are the canonical alignment test
  §9 Drift Log appends over time — drift surfaces as named class, not anonymous
  M91-M95 promote to CODIFIED when 60-second UX is user-Lambda verified ×3

Band 8 — Cascade Position
  Gate: 7 Fuchsia (R5 Blue authoring complete · R7 calibration next)
  Next Diamond: Integration Test Diamond (Test-020 fresh install smoke)
  Master Diamond: Cascades/Working/MACRO-DIAMOND-ASPIRANT.md §2.0
  Next cycle's starting gate: 0 Base Absorb against this Reference Document
```

---

**Manifold**: §§1-13 · 10 invariants (I1-I10) · 5 PROVISIONAL M-rules (M91-M95) · 3 documented drift incidents · 6-surface reciprocity matrix · Pearl-compressed Onyx Summation · `Cascades/Working/MACRO-DIAMOND-ASPIRANT.md` §2.0 inbound reference · Stratimuxian Scholar S1/S3/S7/S10/S13/S14 cited · CLAUDE.md C4 Base Lambda (the Muxistration Proof · Concluder discipline · E1-E7 anti-pattern table) load-bearing.

**Stratimuxian Scholar Citations (consolidated)**:
- S1 §Pre-Implementation Recognition — Drift #1-#3 are Field-of-Poppies (M58) instances
- S3 §Single Dispatch Rule — IAMI is single, atomic, not duplicated across surfaces
- S7 Dispatch Patterns — `observer.next` from Principle Surface 1 is MCP ingress
- S10 §Pattern 2 Payload Quality — `launch_scp` arguments ARE Quality payload (LAMF)
- S13 §Canonical Registry Source Rule — this document IS the install-domain canonical registry
- S14 §7.1 Pre-Implementation Recognition Check — TFIB formalizes recognition as Tier 0 loading protocol

**End of AINS Canonical Reference**.
