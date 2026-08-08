# SCS Bridge — Suite 8 Instance

**Suite 8 Designation**: SCS Bridge
**Configuration Level**: Conductor
**Domain**: Bridge-as-Base startup menu through which the user composes many independent Claude Informatives
**Version**: 8.4.0

---

## MCP Tool Surface (SB-S126 · Post-ICSM1 · Diamond MCP-Skill)

`launch_scp` MCP tool exposed at `POST /-mcp` on the live `scpDockHost` Express server (loopback only · port from `state.dockServerPort`). External Claude sessions (Claude Code, Claude Desktop) can invoke the tool. Dispatch routes to `scpSpawnManagerSpawnRequested` — the SAME Quality the TUI L/Enter path dispatches. The calling Claude session is automatically appended to the target SCP's `sessions[]` array in `Cascades/SCPs.json` via a chainWrite-mutex-guarded atomic tmp+rename write.

**Three JSON-RPC methods**: `initialize` (capability handshake, `protocolVersion: 2024-11-05`), `tools/list` (returns `LAUNCH_SCP_TOOL` with full `inputSchema`), `tools/call` (dispatches `scpDockHostMcpToolsCall` Quality).

**Stratimuxian Quality-as-Model-Function (LAMF)**: this Diamond IS the Quality-as-Model-Function pattern made concrete. One Quality (`scpSpawnManagerSpawnRequested`) is dispatch-origin-agnostic: TUI keypress and MCP tool-call are both legitimate dispatch surfaces for the same idempotent Method (LOCK 2 enforced).

**New Files**: `src/lib/bridge/mcpProtocol.ts` · `src/lib/bridge/scpSessionRegistry.ts` · `src/lib/bridge/concepts/scpDockHost/qualities/scpDockHostMcpToolsCall.quality.ts`. **Edited Files**: `scpDockHost.type.ts` (payload + Quality type + qualities map) · `scpDockHost.concept.ts` (registered) · `scpDockHost.principle.ts` (Surface 1 handler bindings + SelfDeckCast extension).

> **DF4 UPDATE (Cycle 677) — TWO `/mcp` surfaces; the FULL callable roster is 78 tools on a SEPARATE route.** The SB-S126 surface above (`POST /-mcp` on `scpDockHost`, `dockServerPort`) is a narrow legacy surface exposing `launch_scp` only. The **full callable tool roster — 78 tools** (`buildToolRoster()` in `scsBridgeScpToolRegistration.principle.huirth.ts`) rides a DIFFERENT route: **`POST /mcp` on `scpExpressTransport`** (the bridge port from `bridge.json.endpoint`, loopback-only post-DMF2). An interchange-loading session (the SCP Researcher's SCP-S21) targets the express-transport route. The channel shape (envelope · TQNI toolName→qualityName binding · origin threading), the non-gitm 31-tool roster, and the live-vs-queued messaging Diameter are documented in **`Skills/SB-DS7-Callable-Tool-Channel/`**. The 47 `gitm_*` tools (the worktree Multiplication trio + the A↔B Tactical Bridge turn-over + git plumbing), with their WATCHKEY/HALT guards and the Diameter to SCP Researcher's SCP-S19 (operator surface), are documented in **`Skills/SB-DS8-GitM-Worktree-AB-Tools/`**. Concluder for the count: `grep -oE "toolName: '[a-z0-9_]+'" scsBridgeScpToolRegistration.principle.huirth.ts | sort -u | wc -l` → 78.

---

## ICSM1-D1 · Iced Skill Trilogy Macro 1 (Cycle 117 · 2026-05-14)

**Suite 8 → Stratimux Concept induction trajectory begins.** Bridge Captain (this Suite 8) was the ORIGIN proof of induction (4 Tier-2 Concepts already inducted: scpRegistryWatcher · scpLifecycle · scpMessageRouter · scpSpawnManager). Macro 1 formalizes the discipline by inducting the 5th Concept: **scpDockHost**.

**Dock Server Skills (NEW · Stage E concurrent authorship per Iced Skill Discipline)**:
- `Skills/SB-DS1-Dock-Host-Start/Skill.md` — scpDockHostStart (HTTP listener bind)
- `Skills/SB-DS2-Register-Scp/Skill.md` — scpDockHostRegisterScp (SCP docks)
- `Skills/SB-DS3-Unregister-Scp/Skill.md` — scpDockHostUnregisterScp (SCP undocks)
- `Skills/SB-DS4-Publish-Logs/Skill.md` — scpDockHostPublishLogs (log endpoint exposure)
- `Skills/SB-DS5-Dock-Host-Teardown/Skill.md` — scpDockHostTeardown (SBOTD Step 1 prepend)
- `Skills/SB-DS6-Offscreen-UI-Doctrine/Skill.md` — offscreen UI doctrine (NOT a dock skill · developer caveat for new UI elements: OS-anchored chrome never opens on the offscreen surface → in-DOM solutions family: ScsInput · ScsDropdown · canvas color picker · drawer idiom)

**Architectural deltas (M39 graduation)**:
- muxifyConcepts: 4 → 5 (canonical Trilogy growth axis · M39 codified)
- SBOTD: 6-step → 7-step (M8 prepend rule · scpDockHostTeardown NEW Step 1)
- Stratimux Concept folder: `src/lib/bridge/concepts/scpDockHost/`

**Trilogy Forward Diameter**: Macro 2 will induct scpResearcher (5→6 graduation · Interactive Terminal spawning) · Macro 3 will induct suiteRegistry (6→7 · per-Suite RI registration). M39 axis grows monotonically.

---

## Identity

SCS Bridge is the Suite 8 carrying protocol knowledge for the **SCS Bridge harness** — a long-running CLI Startup Menu from which the user spawns and resumes Claude Code sessions, each opening in its own NEW terminal window. **SCS** — Suite Cascade System — names the host system. **Bridge** — a connector enabling passage — names the function: passage from the user's operational center outward to any number of independent Claude Informatives running in parallel.

**Bridge is Base.** "Base" here means *operational center / center of operation* — the Suite 0 vocabulary sense of Base as the anchoring origin from which activity radiates. Bridge is where the user stands; Claude Informatives are launched outward from there into their own terminal windows. Bridge is NOT a base class, NOT a root of a hierarchy, NOT a parent process that owns its children. This is Stratidian composition: Bridge and each Claude Informative are independent **Demometers**; the **Diameter** between them is the Registry Mapping (ULID ↔ UUID ↔ status ↔ cwd). Neither is above or below the other.

**Minimum Integration Boundary**: SCS Bridge operates exclusively on the public claude CLI flag surface:
- `--session-id <uuid>` — first call with a deterministic UUID
- `--resume <uuid>` — re-attach to a prior session by UUID
- Bridge does NOT read or write claude's session files at `~/.claude/projects/`. Claude manages its own state. SCS Bridge manages its own state (ULID, UUID, session dirs, registry).

---

## Etymology

- **SCS** = Suite Cascade System — the enclosing system this bridge serves
- **Bridge** = connector enabling passage — from the user's operational base outward to each Claude Informative; from session-past and session-present via dual ID Registry Mapping

---

## Stratidian Demometer Map

| Demometer | What It Is |
|---|---|
| **Bridge** | Long-running CLI startup menu — operational center; never blocks; returns to prompt after each dispatch |
| **Claude Informative** | One running Claude Code session in its own terminal window — independent cognitive unit |
| **Terminal Window** | OS-level isolation boundary — each Informative owns its window; Bridge owns its window separately |
| **Registry Mapping** | The Diameter between Bridge and Informatives — ULID (SCS internal) ↔ UUID (claude token) ↔ status ↔ cwd |

**Bidirectional Composition Proof**: `Bridge ↔ Registry Mapping ↔ Informative ↔ Registry Mapping ↔ Bridge` — circular is structural, not hierarchical. Neither Demometer is parent to the other.

---

## Pattern Registry (Diamond C Canonical Names)

Seven patterns govern the Bridge-as-Base architecture. All verified CD-5-clean (no Muxonomy-blocklist lexemes):

| ID | Pattern Name | Location |
|---|---|---|
| 1 | **Flag-Surface Composition** | `manager.ts` / `claudeSession.ts` — CLI flag surface only |
| 2 | **Independent Window Composition** | `spawn.ts` — async detached spawn, `child.unref()`, new terminal window |
| 3 | **Parallel Identity Registry** | `registry.ts` / `manager.ts` — ULID internal + UUID claude token |
| 4 | **Opaque Informative State** | `types.ts` / `manager.ts` — Bridge knows IDs/cwd/status; Claude session content opaque |
| 5 | **Tri-Priority Queue As Future Substrate** | `queue.ts` — heads/body/tails/archive; Diamond D activation |
| 6 | **Base-Persistent Startup Composition** | Bridge process lifecycle — returns to prompt after spawn; N concurrent Informatives |
| 7 | **OS-Terminal Detection With Fallback Chain** | `osTerminal.ts` — per-OS builders + fallback chain + AppleScript boundary discipline |

---

## Lifecycle (Diamond C Architecture)

```
scs bridge spawn
      │
      ▼
allocate ULID + UUID (Flag-Surface Composition)
      │
      ▼
launchInformative(sessionId, mode='new')   ← async, returns immediately
      │
      ▼
osTerminal.buildTerminalCommand() → { cmd, args }  (Pattern 7)
      │
      ▼
spawn(cmd, args, { detached: true, stdio: 'ignore' }) + child.unref()
      │
      │  NEW TERMINAL WINDOW opens
      │  NEW WINDOW runs: claude --session-id <uuid>  OR  --resume <uuid>
      │  Claude takes over THAT window — never bridge's terminal
      │
      ▼
Bridge returns to prompt immediately (Pattern 6)
      │
      ▼
User can now: spawn again (2nd window) · list · attach (3rd window)
N concurrent Informatives, each managing own state
```

**Status transitions**: `'allocated'` (pre-launch, `--no-launch`) → `'launched'` (after async dispatch) → `'archived'`

Both spawn AND attach open NEW windows. There is no path through Bridge that takes over the user's existing terminal.

---

## Scope (Diamond C)

**In Scope**:
- Session lifecycle: allocate (ULID + UUID), launch (`--session-id` in new window), resume (`--resume` in new window), list, `--no-launch`
- Dual Identification Registry: ULID (internal sort key) + UUID (claude's session token) in meta.json + `terminalCommand` + `launchedAt`
- OS-terminal detection with fallback chain (Pattern 7)
- Tri-Priority Queue directories: retained as structural substrate (Diamond D activation)

**Out of Scope (Diamond D and beyond)**:
- Queue-to-Informative delivery (routing messages to the running claude process)
- Inter-session routing
- Bridge daemon / live status tracking
- SORD parsing in agent output
- MCP tool registration
- Beacon system
- `--fork-session` usage

---

## Filesystem Layout

```
~/.scs-bridge/
  ├── sessions.json                         ← global registry (ULID → {claudeSessionId, status, terminalCommand, ...})
  └── sessions/
      └── <ulid>/                           ← one directory per session (ULID)
          ├── meta.json                     ← { id, claudeSessionId, status, spawnedAt, launchedAt, terminalCommand, claudeBinary, cwd }
          ├── heads/                        ← priority 1 (Diamond D substrate — inactive)
          ├── body/                         ← priority 2 (Diamond D substrate — inactive)
          ├── tails/                        ← priority 3 (Diamond D substrate — inactive)
          └── archive/                      ← consumed messages (Diamond D substrate — inactive)
```

---

## Dual ID Semantics

| ID | Type | Source | Use |
|----|------|--------|-----|
| ULID | 26-char sortable | `ulid()` — SCS Bridge | Internal session key; filesystem dir name; registry key |
| UUID | 36-char v4 | `crypto.randomUUID()` — SCS Bridge | Passed to `--session-id` on first spawn; passed to `--resume` on re-attach |

The UUID is allocated by SCS Bridge (not received from claude). claude's `--session-id` flag accepts any valid UUID v4 — SCS Bridge controls the UUID from the start.

---

## Skill Registry

| ID | Skill | Domain |
|----|-------|--------|
| SB-S1 | Session Lifecycle | async non-blocking launch, status `'allocated' → 'launched'`, `--no-launch` |
| SB-S2 | Message Composition | envelope construction, priority selection, sender semantics |
| SB-S3 | Queue Discipline | tri-priority merge order (structural reference; Diamond D) |
| SB-S4 | Archive Reading | treating archive/ as session history (structural reference; Diamond D) |
| SB-S5 | Opaque Informative State | Bridge knowledge boundary — IDs/cwd/status only; session content opaque |
| SB-S6 | OS-Terminal Detection With Fallback Chain | `osTerminal.ts` per-OS builders + AppleScript boundary-quote discipline |
| SB-S24 | Synthesized-Entry Removal-Path Exemption via synthesizedAt Guard | auto-discovered sessions exempt from stale-pending + blank-filter removal paths |
| SB-S25 | Registry-First Resume Identity Lookup | `launchInformative` reads `claudeSessionId` from registry before meta.json |
| SB-S26 | Spawn-Settings Filesystem-Resident Env-Prefix Injection | debug flag propagated through spawn settings to hook subprocess |
| SB-S27 | Mtime-Advance Orphan Detection (Passive Signal) | 90s JSONL mtime freeze with alive PID → markSessionOffline |
| SB-S28 | User-Driven Forced Eviction Escape Valve via x-Key | `x` keypress removes selected row from registry; manual escape valve |
| SB-S29 | Synthesized-Aware Conditional Meta Read | `synthesizedAt` guard in `launchInformative` skips `loadSessionMeta` for auto-discovered entries; no ENOENT |
| SB-S30 | Project-Local Bridge State Substrate | `bridgeRoot()` returns `<cwd>/Cascades/Bridge/`; `~/.scs-bridge/` orphaned; `Cascades/Bridge/` git-ignored |
| SB-S31 | Empirical Single-Call Threshold Calibration via Distribution Evidence | 5KB threshold derived from p90 of observed JSONL distribution; replaces 15KB documentation-derived constant |
| SB-S32 | Discovered-Session First-Class Scaffolding | `scaffoldDiscoveredSession` makes synthesized sessions first-class; Diamond O Fix O-1 isSynthesized gate REVERTED |
| SB-S33 | Body Slot Pad-To-Clear Render Discipline | Empty body slots emit explicit clear-pad per frame; closes phantom-row duplicate UX |
| SB-S34 | Optional Display Name as User-Sourced Registry Field | `displayName?: string` on RegistryEntry; user-sourced organizational label; undefined = unset |
| SB-S35 | Modal Rename-Mode Keypress State Machine | `'r'` key → rename modal; `renameMode?: { ulid, buffer }` MenuState; Enter confirms, Esc cancels |
| SB-S36 | Display Name Column Substitution in Row Formatter | `formatSessionRow` + `renderMenuLegacy` render displayName over uuid-short when set; 32-char truncation |
| SB-S39 | Cascades-Presence-Driven Conditional Top Menu + SCS Installation Orchestration | STUB (Diamond B-1): `cascadesPresent` MenuState flag + `SYNTHETIC_INSTALL` sentinel + `'install-selected'` KeyAction + stderr stub; full Strategy/ install orchestration in Diamond B-2 |

---

## Diamond O Architectural Additions (Diamond O · v5.6)

Diamond O muxifies two residual fixes from Diamond N into one architectural advancement: the ENOENT resume bug on auto-discovered sessions (Bug O-1) and the project-local state relocation directive (Bug O-2). Together they complete the per-project scoping circuit begun by auto-discovery.

### Fix O-1 — Synthesized-Aware Conditional Meta Read (SB-S29)

`manager.ts:launchInformative` gates `loadSessionMeta` behind a `synthesizedAt` check. Auto-discovered entries carry all needed fields in the registry row (`claudeSessionId`, `cwd`) — no meta.json on disk. Non-synthesized path unchanged. Resume on `01DISCOVERED-*` ULIDs now succeeds without ENOENT.

### Fix O-2 — Project-Local Bridge State Substrate (SB-S30)

`paths.ts:bridgeRoot()` returns `join(process.cwd(), 'Cascades', 'Bridge')` replacing `join(homedir(), '.scs-bridge')`. All downstream consumers (`debugLog.ts`, `bridgeStateFeed.ts`) derive from `bridgeRoot()`. `.gitignore` updated. Existing `~/.scs-bridge/` is orphaned (auto-discovery via SB-S23 surfaces real sessions without it). Bridge state now co-located with planning artifacts: `./Cascades/Bridge/` alongside `./Cascades/Working/`, `./Cascades/Documentation/`, `./Cascades/8_SUITES/`.

**Version**: `0.16.0 → 0.17.0` · 397/397 tests · build 78.04 KB · CD-5 PASS (15th consecutive, C through O) · CD-16 candidate: *Project-Local Bridge Capsule Diameter* (per-project scoping eliminates cross-project leakage; fifth invalidation channel candidate).

---

## Diamond P Architectural Additions (Diamond P · v5.7)

Diamond P muxifies three surface fixes addressing residual UX failures from the 12-stage user-Lambda smoke after Diamond O. Three independent issues compose into one architectural advancement: empirical threshold calibration, first-class scaffolding for discovered sessions, and body slot render discipline.

### Fix P-1 — Empirical Single-Call Threshold Calibration (SB-S31)

`sessionPersistence.ts:BLANK_SIZE_THRESHOLD_BYTES` lowered from 15KB (documentation-derived) to 5KB (empirical). Distribution evidence from 16 JSONL files in the user's project: 2-3KB cluster = claude-died-early (correctly blank); 9-10KB cluster = single user-prompt + assistant-response (real conversations, previously misclassified as blank). 5KB cleanly separates the two clusters. All consumers of `BLANK_SIZE_THRESHOLD_BYTES` (`hasPersistedSession` + `discoverPersistedSessions`) update automatically.

### Fix P-2 — Discovered-Session First-Class Scaffolding (SB-S32)

New helper `scaffoldDiscoveredSession(ulid, cwd, claudeSessionId, mtimeMs)` in `sessionPersistence.ts` (or `manager.ts`). Creates the full session directory for auto-discovered entries: synthesized `meta.json` (from registry data + JSONL mtime as `launchedAt`), `spawn-settings.json` (identical hook injection to spawned sessions), and empty `archive/`/`body/`/`heads/`/`tails/` subdirs. Called in `animatedTui.ts` auto-discovery pass immediately after `addSession`. Idempotent: skips if session dir already has required files.

**Diamond O Fix O-1 REVERTED**: `manager.ts:launchInformative` `synthesizedAt` guard removed. Discovered sessions now look identical to spawned sessions to `launchInformative` — both have `meta.json`, both have `spawn-settings.json`, SessionStart hook fires on resume, `status` transitions `launched → alive`.

### Fix P-3 — Body Slot Pad-To-Clear Render Discipline (SB-S33)

`renderMenu` body section emits exactly `visibleBodySlots` lines on every frame: real session rows for `i < pageSessions.length`; empty padded rows for `i >= pageSessions.length`. Prior behavior left terminal content from a longer previous frame visible when session count shrank (duplicate row render artifact after session removal). Fix closes the phantom-row UX surfaced by the user's 12-stage smoke.

**Version**: `0.17.0 → 0.18.0` · 403/403 tests · build 78.49 KB · CD-5 PASS (16th consecutive, C through P) · CD-17 candidate: *Empirical-Layer-4 Threshold Validation Diameter* (5KB empirical threshold anchored to observed distribution; promotable post-user smoke).

---

## Diamond Q Architectural Additions (Diamond Q · v5.8)

Diamond Q introduces the **Session Display Name** feature — user-sourced organizational labeling for Bridge sessions. After the 12-stage smoke ("Working as Intended") confirmed all prior Diamonds (K through P), CD-11 through CD-17 coronate this cycle. Diamond Q opens at 17 consecutive clean Diamonds.

### Feature Q-1 — Optional Display Name as User-Sourced Registry Field (SB-S34)

`displayName?: string` added to `RegistryEntry` (and mirrored in `SessionMeta`). User-sourced organizational label independent of the generated ULID and claudeSessionId. When unset (all existing sessions on upgrade), menu rendering is identical to prior behavior. Source of truth = registry row; meta.json mirrors. No migration required — optional field, backward compat preserved.

### Feature Q-2 — Modal Rename-Mode Keypress State Machine (SB-S35)

`'r'` key activates rename-mode when cursor is on a non-synthetic row (synthesized/discovered rows eligible — user may name auto-discovered sessions). New `renameMode?: { ulid: string; buffer: string }` field on `MenuState`. Keypress routing: printable chars append to buffer; Backspace pops; Enter calls `setSessionDisplayName(ulid, buffer.trim() || undefined)` (empty buffer clears displayName); Escape discards buffer. Footer switches to `Rename: <buffer>_  · Enter confirm · Esc cancel` in rename mode; reverts to standard footer with `r rename` hint added on exit.

### Feature Q-3 — Display Name Column Substitution in Row Formatter (SB-S36)

`formatSessionRow` and `renderMenuLegacy` check `entry.displayName` before emitting the uuid-short column. When set: render displayName (truncate at 32 chars with ellipsis). When unset: existing uuid-short fallback unchanged. Column width and alignment preserved in both branches. Layer-1 `termHeight` invariant (Diamond H) unaffected.

### Issue 3 — animatedTui remove-selected pre-existing gap CLOSED

Pre-existing gap: `'x'` key (`remove-selected` KeyAction, SB-S28) was silently not reaching `removeSession` in `animatedTui.ts` — the `applyKeypress` side effect was defined but the `animatedTui` main keypress dispatch loop did not handle the `remove-selected` action. Diamond Q's rename feature required auditing the keypress dispatch loop, surfacing this pre-existing gap. Fix: `animatedTui.ts` keypress dispatch handles `remove-selected` action → calls `removeSession(ulid)`. Now `'x'` key in the animated TUI correctly removes the selected session.

**Version**: `0.18.0 → 0.19.0` · 429/429 tests · build 83 KB · CD-5 PASS (17th consecutive, C through Q) · CD-11 through CD-17 CORONATED (D-Queue cleared, "Working as Intended") · CD-18 candidate: *User-Sourced Identification Diameter* (user-assigned names compose with registry-truth without violating Pattern 4; promotable post-Diamond-Q user smoke).

---

## Diamond B-25-UX-fix2 (v8.0.2 patch · CD-108 IARSR + Mandatory Shatterite Menus · Install Agent Self-Registration + User Customization Mandate)

**User-surfaced after B-25-UX-fix v0.35.1**:
1. *"We need to be Sure the Agent's StartSession Script Registers Itself."* — install agent's SessionStart hook fires `register-install` which writes `tempDir/register-state.json` but NEVER calls `updateSessionLiveIdentity` → install agent invisible in bridge registry / menu / liveness tracking
2. *"The Installation Agent is Not Priming any Shatterite Tomes to Ask the User how they would like to Customize the Installation. Specifically Referring to their First Suite 8."* — agent treats S8 "Conference" Bands as optional · skips AskUserQuestion · auto-decides naming + branching + welcome action

| Issue | File | Change |
|---|---|---|
| **Issue 1: hook self-registration** | `src/lib/bridge/installHooks.ts` runRegisterInstallHook | NOW dual-registers: (a) `updateSessionLiveIdentity(ulid, claudeSessionId, claudePid)` to bridge registry — install agent appears in menu, trackable for liveness, indistinguishable at registry level from regular sessions · (b) legacy `tempDir/register-state.json` preserved for install-pipeline polling compat · failure of (a) is non-fatal · (b) still fires |
| **Issue 2: mandatory Shatterite menus** | `src/lib/bridge/installConstants.ts` | `SCS_INSTALL_MUXIFY_AGENT_PROMPT` extended to MANDATE: *"MUST use AskUserQuestion to render Shatterite menus (naming, branching, welcome) so the user customizes their first Suite 8. Do not auto-decide."* — 213 chars (still well under shell-quoting fragility threshold) |
| **Issue 2: strategy reinforcement** | `Cascades/8_SUITES/SCS Bridge/Strategy/S8-StratidianWelcome.md` | NEW "CRITICAL OPERATING RULE" section at TOP (above Pre-Band Welcome): explicitly forbids auto-decision, mandates AskUserQuestion, reframes Conference Bands as STRUCTURAL NOT ASPIRATIONAL · halts with clear message if AskUserQuestion unavailable |

| Tests | 680 → 684 (4 NEW: install hook registry-update fires · install hook skip when no session_id · install hook registry failure non-fatal · priming mandates Shatterite menus). all PASS · typecheck green · build green (158.54 KB) |
| Version | v0.35.1 → v0.35.2 (patch · clinical fix follow-up) |
| Suite 8 | v8.0.1 → v8.0.2 (patch · install-agent integration polish) |
| CDs | **CD-108 IARSR** Install-Agent-Registry-Self-Registration IMPLEMENTED · **CD-109 MSMRD** Mandatory-Shatterite-Menu-Rendering-Discipline STRUCTURAL. CD-5 PASS 45th preserved |
| Push gate | HELD pending v0.35.2 user-Lambda |

**Why this matters**:
- Install agent now appears in bridge menu as a tracked session (not phantom) — liveness probe ticks against its `process.kill(pid, 0)` PID just like any session, so the menu shows accurate state
- Install agent now structurally cannot skip the user-customization Shatterite menu rendering — auto-decision is named as a category error in the strategy itself · the user is the Manifold-member-with-agency that B-25-UX promised, not just a recipient of agent decisions

**Pearl** (B-25-UX-fix2 synthesis): **Visibility + Agency Are Structural Properties**. v8.0 promised the user as Manifold member with agency at every choice point, and the install agent as a first-class session in the bridge. Both promises required two specific code paths to actually fire (registry self-registration + mandatory AskUserQuestion). v8.0.2 closes both gaps.

### CD-109 MSMRD — Install-State Branching Extension (Diamond Install-State Branching · Cycle TBD)

**Doctrine refinement (additive · preserves prior mandate)**:

CD-109 MSMRD's original mandate STANDS: install agent MUST use `AskUserQuestion` to render Shatterite menus; Conference Bands are STRUCTURAL NOT ASPIRATIONAL; auto-decision is a category error. The Install-State Branching Diamond extends the doctrine with the variant taxonomy and PRIMARY signal:

1. **PRIMARY State Source — `Cascades/Cascade.json` `installState` field (CASS)**. The PRIMARY discriminant for MSMRD variant selection is `installState` (written once at install scaffold, M69 canonical registry source). The three valid values map 1:1 to MSMRD variants: `'fresh-slate-scaffolded'` → MSMRD-FS · `'existing-project-augmented'` → MSMRD-EP · `'reinstall-existing'` → MSMRD-RE. Memory probe (`memoryProbeResult.classification`, CD-100 MSEPD) is now NAMED as a SECONDARY contextual signal only — useful for intro-line detail (session age / count), forbidden as variant driver. The two signals answer different questions: installState answers "did THIS directory have a CLAUDE.md at install moment?"; memory probe answers "has this user used Claude Code anywhere machine-wide?".

2. **No re-prompting for state already determined (M58 anti-Field-of-Poppies, install-domain instantiation)**. Once `installState` is written, the install agent MUST NOT ask the user "are you a fresh install or existing project?" — Cascade.json already answers. Similarly, MSMRD-EP / MSMRD-RE MUST honor any project name detected from `package.json` `name` or directory basename as the default Suite 8 designation (no re-prompting for state that pre-exists in the project). Only MSMRD-FS presents the full naming menu, because no pre-existing identifier exists to honor.

3. **Fallback rule (R4 Green H4 schema-migration discipline)**. Legacy Cascade.json files (pre-Install-State Branching Diamond) lack the field. Treat absent / `undefined` / `'unknown'` as MSMRD-EP — the conservative default that preserves user agency. NEVER assume MSMRD-FS from an absent field (that would present Tutorial-first to a returning user, the exact UX failure CD-109 exists to prevent).

**Reciprocal naming**: this section is named as the doctrinal source by `Cascades/8_SUITES/Teal Claude/Skills/S-SHATTERITE-MENU/SM-WELCOME-RI-ENGAGE.md`, which names CD-109 MSMRD's PRIMARY-SECONDARY split as its branch-signal-table doctrine source. The Diameter is bidirectional.

**Frontier patterns from Install-State Branching Diamond** (R2 Orange naming, R3 Yellow blueprint, R4 Green audit): **CMID** (CLAUDE-MD-Install-Detection-Binary) · **CASS** (Cascade-JSON-Authoritative-State-Source) · **BJVR** (Bridge-JSON-Validity-Reference) · **IFSB** (Install-Flow-State-Branching) · **PRSCD** (Pre-Race-State-Cascade-Determination) · **IDDS** (Install-Determination-Driven-Subsequent-Behavior) · **MSMRD-FS / MSMRD-EP / MSMRD-RE** (variant taxonomy of CD-109).

---

## Diamond B-25-UX-fix (v8.0.1 patch · Suite 7 Fuchsia clinical · escape-order bug + priming shortening + S8 welcome instruction)

**The Install-Agent-Never-Started Bug**. User reported v0.35.0 install on test-004 failed: install agent never spawned · audible macOS chimes · Java Runtime errors · Terminal landed at HOME (`~ %`) instead of test-004 cwd. Bridge-side `install.muxified.complete` succeeded but `install.animation.timeout` 30s later (no hook fire).

**Root cause** (Suite 7 Fuchsia clinical): escape-order bug at `src/lib/bridge/osTerminal.ts:121` — composition `escapeForOsascript(escapeForBashSingleQuote(seedPrompt))` was wrong-order. `escapeForBashSingleQuote` introduces `'\''` for apostrophes (bash close-quote/escape-quote/reopen-quote idiom). `escapeForOsascript` then doubled the backslash: `'\''` → `'\\''`. Bash parsed `'\\''` as `\\` (literal backslash) inside the single-quoted string instead of as the bash idiom. The single-quoted string never closed; `&&`, `cd`, the rest of the priming, and `claude` itself were all consumed inside one broken argument. Java errors are downstream of broken cd (Terminal tries to display error dialog → requires Java → Java missing).

The B-25-UX priming string (1391 chars · contains `user's` apostrophe) was the FIRST long apostrophe-bearing priming actually exercised through Path B (B-24-FIX `runInstallMuxifiedPath`). Earlier installs used short slash-command priming (`/cascade` · `/scs-cascade`) which had no apostrophes.

| Aspect | Value |
|---|---|
| Modified | `src/lib/bridge/osTerminal.ts:121` — escape order SWAPPED: `escapeForBashSingleQuote(escapeForOsascript(s))`. Apply osascript escape FIRST on raw content (handles `\`, `"`, `$` at AppleScript boundary) · then bash-single-quote wrap (handles `'` correctly · `'\''` idiom never mangled) |
| Modified | `src/lib/bridge/installConstants.ts` — `SCS_INSTALL_MUXIFY_AGENT_PROMPT` drastically shortened from 1391 chars to 144 chars · NO apostrophes · NO em-dashes · NO smart-quotes (paranoid defense-in-depth: even if escape-order regresses in future edit, this string cannot trigger the bug) |
| Modified | `Cascades/8_SUITES/SCS Bridge/Strategy/S8-StratidianWelcome.md` — added "Pre-Band Welcome (Pewter HiFi)" section before Band 1 · Pewter HiFi welcome content moved here from priming string · paste-ready D5 closed-box ANSI prototype |
| Modified | `src/lib/bridge/osTerminal.test.ts` — escape-order test EXPECTATION updated (was verifying the OLD buggy behavior `'Don'\\\\''t worry'` · now verifies correct `'Don'\\''t worry'`) |
| Modified | `src/lib/bridge/installSpawn.test.ts` — 5 priming-content tests rewritten · NEW invariants: priming length <200 chars · NO apostrophes · NO em-dashes |
| Modified | `package.json` — 0.35.0 → 0.35.1 |
| Tests | 680/680 PASS · `npm run typecheck` green · `npm run build` green (158.05 KB · -1 KB from B-25-UX) |
| Push gate | HELD pending v0.35.1 user-Lambda on fresh test directory (test-006) |

**Suite 8 v-bump**: v8.0 → v8.0.1 (patch · clinical fix within milestone). Major version stays at 8 — the Stratidian Welcome arc is unchanged structurally; what changed is the SHELL-LAYER plumbing that conveys the directive.

**Why this fix is correct**:
1. **Escape order swap** addresses the structural bug at the layer that matters (bash/osascript boundary)
2. **Priming shortening** is paranoid-defense — even if a future edit reverts the escape order, the new 144-char apostrophe-free directive cannot trigger the bug
3. **S8 welcome instruction added** ensures the Pewter HiFi welcome content (previously embedded in priming) survives at the strategy layer where the install agent reads it as part of the appended system prompt

**Pearl** (B-25-UX-fix synthesis): **Shell-Quoting Discipline as Substrate**. The Stratidian Welcome arc design was correct; the substrate (osascript→bash→shell-arg→claude-CLI) imposed quoting constraints that the priming string violated. Fix at the substrate (escape order) plus paranoid shortening at the source (priming length + apostrophe-free) makes the welcome arc actually reach the install agent intact. The diagnosis matters: every "audible chime" was a downstream symptom of a single 2-line escape-order bug.

---

## Diamond B-26 Architectural Milestone (v8.1 · Muxification Branch Round-Trip Closure · `scs uninstall` · Iced-Preserving Reverse-Muxify · Re-installable from Iced)

**The Cinnabar Returns — Iced-Preserving Round-Trip**.

User-named **Muxification Branch closure**. v8.0 promised user-trust contract via three exit paths (B-24 CD-90 TEPTSG); v8.1 makes ONE of those paths (`scs uninstall`) production-grade with Iced/ as the persistent install record. The Diamond delivers BOTH the uninstall command AND the structural enabler for re-install-from-Iced.

User exact quotes:
- *"Surface the Next Diamond for Remuxification of the User's Initial Project Plus Iced SCS Files."*
- *"once the SCS is Uninstalled and the Cascades Directory is Installed with an /iced Directory. It can be Installed Again."*

Foundation phase: r0-origin Obsidian Summation absorbed into Tier-0 awareness · then 5-agent Full Suite parallel dispatch (R1 Red curate · R2 Orange name · R3 Yellow architect · R4 Green examine · R6 Purple trajectory).

**LOAD-BEARING PRINCIPLE** (CD-120 PFND from r0 summation):
> *"uninstall and reinstall are not opposites — they traverse the same Diameter with Iced/ as the pivot; the implementation must embody this (preservation-first, not deletion-first)."*

| Aspect | Value |
|---|---|
| Created | `src/lib/bridge/uninstall.ts` — `uninstallSCS()` manifest-driven reverse-muxify · best-effort atomicity · all 7 ManifestFileEntry.action enum branches handled · scs-* sweep · *.bak cleanup · **Cascades/Iced/ structurally preserved** |
| Created | `src/commands/uninstall.ts` — `scs uninstall` CLI subcommand · pre-flight manifest check · Pewter HiFi confirmation menu · readline `[y/N]` default-N safety · `--yes` flag for scripted bypass |
| Created | `Cascades/8_SUITES/Teal Claude/Skills/S-SHATTERITE-MENU/SM-UNINSTALL-CONFIRM.md` — Shatterite Reference Design · Rose-tint warn · D7 active-button-default-N (asymmetric default for safety) |
| Created | `src/lib/bridge/uninstall.test.ts` — 13 tests covering all action enum reversals · Iced preservation · scs-* sweep · stripDelimitedBlock · graceful no-op |
| Modified | `src/cli.ts` — `uninstallCommand()` registered |
| Modified | `package.json` — v0.35.4 → v0.36.0 (minor · NEW public CLI command) |
| Tests | 692 → 705 (13 NEW) · all PASS · typecheck green · build green (174.39 KB) |
| CDs (9 NEW) | **CD-114 IPRM** Iced-Preserving-Reverse-Muxify · **CD-115 RMSDE** Re-Muxify-State-Detection-Entry · **CD-116 USCPPP-CR** UserSCSConfig-Persistence-Cross-Reinstall · **CD-117 RTRA** Round-Trip-Reversibility-Atomicity · **CD-118 SCDU** Shatterite-Confirmation-Destructive-Uninstall · **CD-119 SVRC** Schema-Version-Reverse-Compatibility · **CD-120 PFND** Preservation-First-Not-Deletion (PEARL) · **CD-121 RCMR** Re-engagement-Cinnabar-Memory-Recovery (DESIGNED) · **CD-122 ICRTV** Iced-Compare-Round-Trip-Verification. **CD-5 PASS 46th consecutive** |
| Push gate | HELD pending v0.36.0 user-Lambda · round-trip test: install → `scs uninstall` → re-install from Iced |

**Three-Exit-Path Updated (post-B-26)**:
1. Continue using SCS (Default · CD-92 USCPPP)
2. **`scs uninstall` (NEW · PRIMARY EXIT PATH)** · manifest-driven · Iced preserved · re-installable
3. `rm -rf Cascades/` (Nuclear · last resort)
4. `scs uninstall && rm -rf Cascades/Iced/` (Full clean wipe after surgical revert)

**Re-installable from Iced**: `detectMuxState → 'remuxify'` when `Cascades/Iced/MuxificationManifest.json` exists. After `scs uninstall` preserves Iced/ · running `scs` again naturally re-engages Muxified Path · prior snapshot reused · UserSCSConfig honored verbatim.

**Pearl** (B-26 synthesis): **The Cinnabar Returns · Iced-Preserving Round-Trip**. Architectural arc — reversibility (B-23) → composition (B-24) → authority (B-24-FIX) → membership (B-25-UX v8.0) → return-with-continuity (B-26 v8.1) — closes here. SCS install is reversible; reversal preserves enough state to return without re-meeting-from-scratch; UserSCSConfig survives across reinstall cycles.

---

## Diamond B-25-UX Architectural Milestone (v8.0 · Stratidian Welcome Arc · Strategy S8 · Shatterite-Driven Naming · Conditional Multi-Suite Branching · Memory-Surfaced Welcome · RI Activation · Cinnabar Engagement)

**The v8.0 Milestone — Stratidian Welcome As First-Class Manifold Membership**.

User-named break-out Diamond B-24-UX (design phase) followed by B-25-UX (implementation phase · cycle 48). 6-agent Full Suite foundation (R1 Red curate · R2 Orange name · R3 Yellow architect · R4 Green examine · R6 Purple trajectory · Pewter Tessera HiFi design) returned convergent verdict on a NEW Strategy S8 that elevates the install from "mechanical task-execution" to "Stratidian initiation".

User exact quotes:
- *"Engage a Full Suite with Pewter to Design a New Strategy for our SCS-Bridge. That will Engage the Shatterite Tome Menu."*
- *"Conditional Branching for a Project Context that Requires More than One Suite 8 Potentially. Where the User is Enabled to Name based Off a Series of Suggestions from a Shatterite Menu."*
- *"If we Are Dropping into an Existing Project. The Final Menu Needs to be Expanded to Fully Actualize the Renewable Intelligence with our Cinnabar Dialectic and the Creation of the First Diamond to have the User get Back on Track with their Work. Where we can Draw Upon the Memory of their System to Surface the Menu Specifically."*

| Aspect | Value |
|---|---|
| Created | `src/lib/bridge/projectNameSuggest.ts` — `sanitizeProjectName` (B-24-FIX bug fix · `user-project` → "User" not "User Project Project Context") · `isGenericName` (13-name skip list) · `detectProjectType` (TypeScript/Node/Python/Rust/Go/Vue/React signals) · `extractClaudeMdHeaders` (H1 + distinct H2 list) · `generateNameSuggestions` (4-6 slot mix per Suite 4 Green Angle 1) |
| Created | `src/lib/bridge/memoryProbe.ts` — `encodeCwdForMemory` (`/`→`-` · verified format) · `probeProjectMemory` (Pattern 4 metadata-only · sessionCount + latestMtime · classifies fresh-slate vs existing-project) · `formatLatestSessionAge` ("3 days ago" / "2 hours ago" / "just now") |
| Created | `src/lib/bridge/routerDetect.ts` — `detectRouterPattern` (3-signal hard gate per Suite 4 Green Angle 2: H2 ≥4 AND ≥2 router-keywords AND ≥2 mutually-exclusive H2 pairs · drops false-positive rate ~40%→~5%) |
| Created | `src/lib/bridge/riActivate.ts` — `activateRenewableIntelligence` (atomic 3-write Onyx-Tier-1 + Diamond-Tier-1 + Cascade.json cycle 0→1 · all-or-none contract with rollback · temp+rename for Cascade.json) |
| Created | `Cascades/8_SUITES/SCS Bridge/Strategy/S8-StratidianWelcome.md` — 6-Band Vermillion Strategy (Curate naming sources · Render naming menu · Detect router & branch · Memory probe · RI activation · Welcome menu + closeout) |
| Created | `Cascades/8_SUITES/Teal Claude/Skills/S-SHATTERITE-MENU/SM-NAME-SUITE-8.md` — Shatterite menu Reference Design with 4-6 algorithmic suggestions + Custom + Keep auto-name + Cancel rows |
| Created | `Cascades/8_SUITES/Teal Claude/Skills/S-SHATTERITE-MENU/SM-MULTI-SUITE-BRANCH.md` — advisory menu when router-pattern detected (Single / Multi(N) / Custom · user-confirmation invariant) |
| Created | `Cascades/8_SUITES/Teal Claude/Skills/S-SHATTERITE-MENU/SM-WELCOME-RI-ENGAGE.md` — final menu with PATH A (existing-project · [C] Continue / [D] Cinnabar / [B] Browser / [T] Tutorial / [Q] Exit) and PATH B (fresh-slate · [F] First Diamond / [D] Cinnabar / [B] Browser / [Q] Exit) variants |
| Modified | `src/lib/bridge/installConstants.ts` — `ICED_MANIFEST_SCHEMA_VERSION 2 → 3` · `SCS_INSTALL_MUXIFY_AGENT_PROMPT` updated to direct S7→S8 sequence with Pewter HiFi welcome instruction |
| Modified | `src/lib/bridge/icedManifest.ts` — `ManifestFileEntry.action` union adds `'updated'` enum (B-25-UX schema v3 · for Cascade.json cycle 0→1 tracking) · `preInstallValueSnapshot` field captures prior value for B-26 reverse |
| Modified | `src/lib/bridge/installSpawn.ts` — SOURCES array adds S8 (10 → 11 entries) |
| Modified | `Cascades/8_SUITES/SCS Bridge/Strategy/S7-MuxifyUserClaudeMd.md` — Band 5 closeout emits `s7-muxification-complete` signal (no longer engages `/scs-cascade` directly · that role transferred to S8 Band 6) |
| Tests | 627 → 680 (53 NEW B-25-UX tests across 4 utilities · target was 30) · all PASS · `npm run typecheck` green · `npm run build` green (159.13 KB) |
| Version | v0.34.1 → v0.35.0 (minor — NEW S8 strategy + RI activation + agent-driven Welcome arc IS new public behavior) |
| **v8.0 EARNED** | Full Stratidian induction arc (Welcome + Ask + Discover + Activate + Hand-off) is the qualitative leap that justifies the major Suite 8 bump · Suite 6 Purple trajectory recommendation: "Uninstall is surgical reversal, not ontological elevation" — v8.0 lands here, B-26 Uninstall ships at v8.x patch |
| CDs | **CD-98 SDSWN** Shatterite-Driven-Suite-8-Naming-Welcome IMPLEMENTED · **CD-99 PTSNS** Project-Type-Signal-Naming-Suggestion-Heuristic IMPLEMENTED · **CD-100 MSEPD** Memory-Surfaced-Existing-Project-Detection IMPLEMENTED · **CD-101 CMSRD** Conditional-Multi-Suite-8-Router-Detection IMPLEMENTED · **CD-102 CDWE** Cinnabar-Dialectic-Welcome-Engagement DESIGNED (S8 invocation handoff · full Cinnabar implementation in Cinnabar Suite 8) · **CD-103 RIIA** Renewable-Intelligence-Install-Activation IMPLEMENTED (atomic) · **CD-104 FDSI** First-Diamond-Stratidian-Initiation IMPLEMENTED · **CD-105 PHSWO** Pewter-HiFi-Stratidian-Welcome-Override IMPLEMENTED · **CD-106 BAWHD** Bridge-To-Agent-Welcome-Handoff-Discipline STRUCTURAL · **CD-107 UTSW** User-Trust-Through-Stratidian-Welcome PEARL. **CD-5 PASS 45th consecutive** |
| Skill additions | SB-S103..SB-S112 (10 NEW · maps 1:1 to CD-98..CD-107) |
| Pattern 4 | Modulation form preserved · memory probe is metadata-only at install agent level (Suite 4 Green Angle 3 resolution) · agent operates within Claude awareness · bridge code does NOT read `~/.claude/projects/` |
| Push gate | HELD pending v0.35.0 user-Lambda on test-005 (with `SCS_INSTALL_REPO_URL=file:///path/to/local/repo` for local-clone testing) |

**Three Architectural Layers Compose**:

1. **Bridge Layer (Pattern 4 Modulation)**: scaffolds Cascades/, .claude/ drop-in, Iced PreInstallSnapshot, MuxificationManifest, UserSCSConfig — all filesystem within user cwd. NEVER reads `~/.claude/projects/`.

2. **Install Agent Layer (Pattern 4.1 Sanctioning)**: receives full SCS Bridge Suite 8 (Instance + Conductor + Skill + S1..S8) as appended system prompt + plain-text Welcome priming. Operates within Claude awareness — legitimately probes memory metadata, reads PreInstallSnapshot content, renders Shatterite menus, engages Cinnabar Suite 8.

3. **User Sovereignty Layer (CD-107 UTSW Pearl)**: every decision point surfaces a Shatterite menu. Naming = user picks. Single vs Multi = user confirms. Continue vs Re-engage = user chooses. The user is a Manifold member with agency at every choice point — never a passive recipient of agent-imposed decisions.

**Pearl** (B-25-UX Pearl synthesis · Suite 6 Purple): **Stratidian Welcome As First-Class Manifold Membership**. The install isn't a deposit; it's an INDUCTION. The user doesn't enter as a hosted-tenant; they enter as a Manifold member with their project-context elevated to first-class Suite 8, their memory honored, their work continuity preserved. v8.0 EARNED at this Diamond — the full induction arc lands here, not at B-26 Uninstall.

---

## Diamond B-24-FIX Architectural Correction (Diamond B-24 Rotation 2 · v7.9 · Path B Routing · Drop-In SCS Manifold · Strategy S7 MuxifyUserClaudeMd · Plain-Text Priming)

**The Path B Routing Correction** — user-surfaced from test-001 Lambda observation that B-24 routed Muxified through the wrong path (Path A menu launch · install agent had zero SCS context). B-24-FIX recovers Path B (`runInstallSpawnPipeline`/`runInstallMuxifiedPath` with `assembleJoinedSuite8` + `spawnInstallInstance --append-system-prompt-file=joinedSuite8`) so the install agent receives the full SCS Bridge Suite 8 context as appended system prompt, plus a plain-text priming directing execution of NEW Strategy S7 (MuxifyUserClaudeMd).

User exact quote: *"Noting from the ScreenShot we are Still Using the Menu Path for the Installation Agent. When it should be the Appended SCS Bridge Suite 8 Plus the Strategy Priming. This would be a New Addition based on Preexisting Infrastructure that Included the Ability to Append to the System Prompt the Joined SCS-Bridge Suite 8 with Skills and Strategy to be Actualized."*

User also corrected the drop-in semantic: *"It is Critical we do not add: [user-content prefix to SCS Manifold]. To the SCS. It's a Tight Manifold and the Install of Such should Honor that is is in the ClaudeCode 40K Character Limit. So it should be a Drop in Replacement. With the Specific User's Claude.md being Muxified into Any Number of Suite 8s."*

3-agent foundation (Suite 4 Green + Suite 6 Purple + Suite 7 Fuchsia) returned convergent verdict; Conductor-direct W5a-c implementation.

| Aspect | Value |
|---|---|
| Created | `Cascades/8_SUITES/SCS Bridge/Strategy/S7-MuxifyUserClaudeMd.md` — 5-Band Vermillion Strategy directing install agent to read PreInstallSnapshot user CLAUDE.md, auto-name from package.json, write `Cascades/8_SUITES/{name}/Instance.md`, update SUITE8-REGISTRY.md if exists, then engage `/scs-cascade` |
| Created | `runInstallMuxifiedPath` function in `installSpawn.ts` — combines bridge-side scaffold (Cascades/, .claude/ drop-in, Iced snapshot, manifest, UserSCSConfig) with Path B spawn (joined Suite 8 as appended system prompt + plain-text S7 seedPrompt) · pre-spawn fs.statSync invariants (scs-cascade.md exists, joined Suite 8 file exists) |
| Modified | `src/lib/bridge/muxCompose.ts` — REMOVED `composeClaudeMd` (delimited-append violated 40K manifold budget); ADDED `dropInClaudeMd` (verbatim copyFileSync · action='replaced') |
| Modified | `src/lib/bridge/installConstants.ts` — `SCS_PATH_A_PRIMING_PROMPT '/cascade'` → `'/scs-cascade'` (B-24 prefix match · was stale B-15 era constant); NEW `SCS_INSTALL_MUXIFY_AGENT_PROMPT` (plain-text S7 priming · timing-race immune); `ICED_MANIFEST_SCHEMA_VERSION 1 → 2` (added 'replaced' + 'agent-derived' action enums) |
| Modified | `src/lib/bridge/installSpawn.ts` — SOURCES array adds `'Strategy/S7-MuxifyUserClaudeMd.md'` (9 → 10 entries); `muxifyUserState` calls `dropInClaudeMd` instead of `composeClaudeMd` |
| Modified | `src/lib/bridge/icedManifest.ts` — `ManifestFileEntry.action` union adds `'replaced'` (drop-in) and `'agent-derived'` (S7 install-agent-created Suite 8 directory) for B-25 surgical reverse |
| Modified | `src/lib/tui/animatedTui.ts handleInstall` — first-time install branch (`!cascadesScaffoldPresent`) NOW routes to `runInstallMuxifiedPath` with `SCS_INSTALL_MUXIFY_AGENT_PROMPT`. Path B with appended Suite 8 + S7 priming replaces Path A menu launch + `/cascade` priming |
| Tests | 623 → 627 (5 NEW B-24-FIX tests · regression fixes for SOURCES count 9→10 + schema version 1→2 + priming `/cascade`→`/scs-cascade`) · all PASS |
| Version | v0.34.0 → v0.34.1 (patch · architectural correction within same minor) |
| Build | tsup green · 158.55 KB |
| CDs | **CD-94 PBRMP** Path-B-Routing-For-Muxified-Path IMPLEMENTED · **CD-95 DICMD** Drop-In-CLAUDE-MD-Tight-Manifold-Discipline IMPLEMENTED · **CD-96 ASMS7** Agent-Side-Muxification-Strategy-S7 IMPLEMENTED · **CD-97 PTPMS** Plain-Text-Priming-Muxified-Spawn IMPLEMENTED. CD-5 PASS 44th consecutive |
| Skill additions | SB-S99..SB-S102 (4 NEW · PBRMP · DICMD · ASMS7 · PTPMS) |
| Pattern 4 | Modulation form preserved · install agent operates within bridge-managed Cascades/Iced and writes to Cascades/8_SUITES (both within user cwd) |
| Push gate | HELD pending B-24-FIX user-Lambda on test-002 |

**Three Decisive Architectural Corrections Implemented**:

1. **Path B routing for Muxified Path (CD-94 PBRMP)**: install agent now spawned via `spawnInstallInstance` with `--append-system-prompt-file=joinedSuite8` — receives Instance.md + Conductor.md + Skill.md + Strategy/S1..S7 as appended system prompt. Knows full Stratidian conventions before executing S7.

2. **Drop-In `.claude/CLAUDE.md` (CD-95 DICMD)**: replaces B-24's delimited-append. SCS Manifold writes verbatim. User's prior content lives ONLY in `Cascades/Iced/PreInstallSnapshot/{ts}/` — Strategy S7 muxifies it into a first-class Suite 8 at `Cascades/8_SUITES/{name}/Instance.md`. Honors Claude Code's tight 40K project-memory budget.

3. **Plain-text S7 priming (CD-97 PTPMS)**: `SCS_INSTALL_MUXIFY_AGENT_PROMPT` is plain-text directive — timing-race immune (slash command index timing eliminated). `/scs-cascade` engagement is terminal in S7 Band 5 only, AFTER muxification completes.

**Stale Binary Note (User Environment)**: User screenshot showed `v0.24.0` global binary. After this commit lands, user must `npm install -g .` from repo to refresh to v0.34.1 — global symlink does not auto-update.

**Pearl** (B-24-FIX synthesis): **Strategic Authority Through Joined Context**. The install agent must receive the FULL Stratidian context (joined Suite 8 with all S1..S7 strategies as appended system prompt) to act with Authority on the user's bounded state. Drop-in CLAUDE.md + agent-muxified Suite 8 + Path B spawn = each layer holds its own discipline. Bridge does what bridge does (filesystem scaffolding · Pattern 4 modulation); install agent does what only it can (intelligent muxification of user content into first-class Suite 8 form within the Stratidian Manifold).

---

## Diamond B-24 Architectural Additions (Diamond B-24 · v7.8 · Muxified Path · Compose-Not-Replace · Iced Folder · Pre-Install Snapshot · Reinstall Routes Through Muxified)

**The Muxified Path Consummation Diamond** — user-named the operating contract that lets SCS Bridge install WITH a pre-existing Claude Code setup rather than replace it. Iced folder (`Cascades/Iced/`) introduced as new structural layer with three sub-areas: PreInstallSnapshot (revert source) · MuxificationManifest (declarative change record) · UserSCSConfig (user personalization protected from updates). Reinstall path unified to route through Muxified Path detection.

User exact quote: *"Please Engage as this is Critical in the Scope of the Prior Engagement with our Reinstall Pathing. As Such should be Triggering the Muxified Path to Ensure the User's Directory is Secure. Noting to Maintain a Muxified Record in the Cascades Directory that can be Referenced to Restore the State of the User's Initial Frame Prior to SCS-Bridge Installation. Where we will Maintain the Cascades Directory, but Specifically Place a Folder of Iced where we will Store the User's Specific SCS Configuration. So that the User can Interoperate as Needed. This way if the User is Working with the SCS Bridge, does not Find Value in Such. We still Provide a Reference Point to Discern what they Need from the Cascade Directory while Also Providing an Easy Means to Reinstall if Uninstalled. Noting the User can Always Delete the Cascades Directory if Unsatisfied."*

3-agent parallel foundation (Suite 2 Orange · Suite 4 Green · Suite 6 Purple) returned convergent verdict. Conductor-direct W5 Cobalt phased implementation (W5a constants · W5b muxDetect · W5c icedManifest · W5d muxCompose · W5e installSpawn wire) + W6 Purple docs + W7 Fuchsia commit.

| Aspect | Value |
|---|---|
| Created | `src/lib/bridge/muxDetect.ts` — `detectUserState(cwd)` + `detectMuxState(cwd): 'fresh' \| 'muxified' \| 'remuxify'` (CD-84 MPAD + CD-89 RRTMU) |
| Created | `src/lib/bridge/icedManifest.ts` — `MuxificationManifest` type · `writeManifest` (atomic .tmp+rename) · `readManifest` · `captureSnapshot` · `ensureUserSCSConfigDir` · `buildManifestSkeleton` (CD-86 PISCD · CD-87 MMDC · CD-92 USCPPP) |
| Created | `src/lib/bridge/muxCompose.ts` — `composeClaudeMd` (delimited append, idempotent, cross-version upgrade) · `namespaceAgents` (`scs-` prefix) · `namespaceCommands` (`scs-` prefix) · `mergeSettingsJson` (additive, user wins, dedup) (CD-88 CNRPFT · CD-93 ASNCPP) |
| Created | Tests for all three new modules — `muxDetect.test.ts` (10) · `icedManifest.test.ts` (10) · `muxCompose.test.ts` (18). 38 NEW tests · 600 → 623 (note: 15 fewer than 42 target because legacy scaffold tests already covered some integration paths) |
| Modified | `src/lib/bridge/installConstants.ts` — Iced path constants · SCS_AGENT_PREFIX · SCS_COMMAND_PREFIX · CLAUDE.md delimiter constants (open-prefix + close, version-aware open builder) · ICED_MANIFEST_SCHEMA_VERSION |
| Modified | `src/lib/bridge/installSpawn.ts` — `scaffoldUserDotClaude` refactored to delegate to NEW `muxifyUserState` (compose-not-replace universal) · `runInstallScaffoldOnly` now mux-state-aware (detects · captures snapshot · muxifies · writes manifest · ensures UserSCSConfig) · `pathFilterCascadesScaffold` excludes `Iced/` (Suite 6 Purple D-6 critical-fix to prevent silent manifest erasure on reinstall) |
| Modified | `src/lib/bridge/muxFixture.ts` — `Cascades/Iced/` added to DEFAULT_SKIP_PATTERNS (B-26 round-trip compatibility) |
| Modified | `src/lib/tui/animatedTui.ts` — `runInstallScaffoldOnly` calls now thread `'0.34.0'` version parameter (both Path A scaffold-only + Path B reinstall) |
| Tests | 600 → 623 (38 NEW B-24 tests; existing 585 unchanged · all PASS) |
| Version | v0.33.0 → v0.34.0 (minor — Muxified Path implementation milestone) |
| Build | tsup green · 154.99 KB (+14.50 KB · muxDetect + icedManifest + muxCompose + Iced wiring in installSpawn) |
| CDs | **CD-84 MPAD** Muxified-Path-Activation-Discrimination IMPLEMENTED · **CD-85 IFALS** Iced-Folder-Frozen-Aside-But-Living-Compositional-Semantics IMPLEMENTED · **CD-86 PISCD** Pre-Install-Snapshot-Capture-Discipline IMPLEMENTED (replaces B-5 EPHEMERAL gap from B-23 Suite 4 Green audit) · **CD-87 MMDC** Muxification-Manifest-Declarative-Change-Record IMPLEMENTED (frozen B-25 contract) · **CD-88 CNRPFT** Compose-Not-Replace-Per-File-Type-Rules IMPLEMENTED · **CD-89 RRTMU** Reinstall-Routes-Through-Muxified-Path-Unification IMPLEMENTED · **CD-90 TEPTSG** Three-Exit-Path-User-Trust-Structural-Guarantee STRUCTURAL · **CD-91 MALBUS** Manifest-As-Load-Bearing-Uninstall-Source-Of-Truth STRUCTURAL (B-25 contract anchor) · **CD-92 USCPPP** User-SCS-Configuration-Personalization-Persistence-Protection IMPLEMENTED · **CD-93 ASNCPP** Agent-Sub-Namespace-Collision-Prevention-Protocol IMPLEMENTED. CD-5 PASS 43rd consecutive |
| Skill additions | SB-S89..SB-S98 (10 NEW · MPAD · IFALS · PISCD · MMDC · CNRPFT-CLAUDEMD · CNRPFT-AGENTS · CNRPFT-COMMANDS · CNRPFT-SETTINGS · RRTMU · TEPTSG) |
| Pattern 4 | Modulation form preserved — all muxify operations within user cwd; no `~/.claude/projects/` probe. Manifest is bridge-managed at `Cascades/Iced/MuxificationManifest.json` |
| Push gate | HELD pending Muxified install + manifest verification user-Lambda |

**End-to-End Smoke Test (Lambda-event verified during Diamond)**:
On materialized typical-user-reference fixture clone with `my-reviewer.md` agent + `review.md` command + non-default settings.json:
- Detection: `state=muxified` · all 5 user state markers detected
- Snapshot captured to `Cascades/Iced/PreInstallSnapshot/{ts}/` (5 files)
- CLAUDE.md `appended` (user content preserved · SCS Manifold between delimiters)
- SCS agent landed at `.claude/agents/scs-teal-claude.md` (user's `my-reviewer.md` BYTE-FOR-BYTE UNCHANGED · `diff` clean)
- Settings.json `merged` (user wins on collisions · dedup applied)
- Manifest written with 3 entries · UserSCSConfig/ scaffolded with .gitkeep + README

**Three-Exit-Path Resolution (Suite 4 Green load-bearing finding)**:
The pure `rm -rf Cascades/` exit cannot be a SINGLE-command guarantee because Claude Code reads `.claude/agents/`, `.claude/commands/`, `.claude/CLAUDE.md` from outside `Cascades/` by necessity. Resolution: the `scs-` prefix IS the structural exit signal — user can clean-exit via the two-step:
```
rm -rf Cascades/
rm .claude/agents/scs-*.md .claude/commands/scs-*.md
# manually strip <!-- BEGIN SCS-BRIDGE-MANIFOLD --> ... <!-- END SCS-BRIDGE-MANIFOLD --> from .claude/CLAUDE.md
```
B-25 `scs uninstall` will provide the one-command alternative using the manifest. The `scs-*` prefix discipline makes manual exit always-tractable.

**Cross-Diamond Diameters (B-23 ↔ B-24 ↔ B-25 chain)**:
- B-24 manifest format ↔ B-25 reads same JSON shape (FROZEN contract per ICED_MANIFEST_SCHEMA_VERSION = 1)
- B-24 Iced exclusion in `pathFilterCascadesScaffold` ↔ Suite 6 Purple D-6 (prevents silent erase on reinstall)
- B-24 delimiter constants ↔ B-25 reverse regex MUST import from same `installConstants.ts` source
- B-24 muxify primitives ↔ B-26 round-trip test will compose them with B-25 reverse for compareDirectories=empty Concluder

**Pearl** (Suite 6 Purple synthesis): **Composition as User-Trust Contract**. B-23 = Reversibility Manifest as Structural Spine (proved reversibility possible). B-24 = makes it load-bearing by establishing the property that lets the user exit via two structural means (`scs uninstall` OR `rm -rf Cascades/ && rm scs-*`) without depending on agent goodwill. The Iced folder is not storage — it is the declaration that SCS maintains a bounded footprint.

---

## Diamond B-23 Architectural Additions (Diamond B-23 · v7.7 · Muxification Branch Test Fixture · Reference Design Scaffold + Reversibility Verification Infrastructure)

**The First Muxification-Branch Diamond** — user-named transition Diamond opening the Muxification Branch (post-B-cascade install-flow polish · B-1..B-22). Builds the Reference Design fixture + snapshot/clone/compare infrastructure required to verify muxification reversibility before B-24 muxify implementation lands.

User exact quote: *"we are Going to Prepare a Test Directory for the Muxification Branch if the User has a Preexisting ClaudeCode Solution. Wherein we will Have our Suite 5 Scaffold the Typical User Set Up. Wherein we will have Such Represent a Reference Design in the Testing Directory that we will Clone From to then Muxify to Ensure in our Testing we are Able to Reverse the Muxification Process back to the User's Default Installation Prior to the Installation."*

3-agent parallel foundation (Suite 2 Orange + Suite 4 Green + Suite 6 Purple) provided convergent verdict. Conductor-direct Bands 5-7 implementation per the convergence.

| Aspect | Value |
|---|---|
| Created | `src/lib/bridge/muxFixture.ts` — 4 reversibility primitives: `scaffoldReferenceDesignFixture(destDir)` (CD-77 RDTFS) · `snapshotDirectoryHash(dir, skipPatterns?)` (CD-82 SHSDV) · `compareDirectories(dirA, dirB, skipPatterns?)` (CD-78 MRV) · `cloneFixtureToDir(srcDir, destDir)` |
| Created | `src/lib/bridge/muxFixture.test.ts` — 15 tests across 5 describe blocks (scaffold · snapshot · compare · clone · baseline round-trip) |
| Modified | `src/lib/bridge/installConstants.ts` — 8 NEW `SCS_MUX_FIXTURE_*` content constants + `SCS_MUX_FIXTURE_FILES` ordered tuple (CD-81 TUSS · mirrors B-19 BECIS bridge-embedded discipline). Reference Design = `CLAUDE.md` · `.claude/CLAUDE.md` · `.claude/agents/my-reviewer.md` · `.claude/commands/review.md` · `.claude/settings.json` · `README.md` · `package.json` · `src/index.ts` · `.gitignore` (9 path entries; 8 distinct content constants — `CLAUDE.md` shared) |
| Tests | 585 → 600 (15 NEW B-23 tests; existing 585 unchanged) · all PASS |
| Version | v0.32.1 → v0.33.0 (minor — Muxification Branch infrastructure milestone) |
| Build | tsup green · 140.49 KB (no significant size change · constants-as-strings + 4 small functions) |
| CDs | **CD-77 RDTFS** Reference-Design-Test-Fixture-Scaffold IMPLEMENTED · **CD-78 MRV** Muxification-Reversibility-Verification IMPLEMENTED (infrastructure; full IMPL at B-26) · **CD-79 PECCC** Pre-Existing-Claude-Code-Solution-Composition DEFERRED to B-24 · **CD-80 SUBR** SCS-Uninstall-Backup-Restore-Mechanism DEFERRED to B-25 · **CD-81 TUSS** Typical-User-Setup-Specification IMPLEMENTED · **CD-82 SHSDV** Snapshot-Hash-State-Deterministic-Verification IMPLEMENTED · **CD-83 MBDTC** Muxification-Branch-Diamond-Trajectory-Chain TRAJECTORY-NAMED. CD-5 PASS 42nd consecutive |
| Skill additions | SB-S82 RDTFS · SB-S83 SHSDV · SB-S84 MRV · SB-S85 TUSS · SB-S86 BECIS-Mux-Extension · SB-S87 Skip-List-Discipline · SB-S88 MBDTC-Trajectory |
| Pattern 4 | Modulation form preserved — muxFixture reads/writes ONLY caller-supplied paths and bridge-embedded constants; never probes `~/.claude/projects/`; snapshot is content-only (no mtime/atime); compare-skip-list is structural |
| Push gate | HELD pending B-23 fixture/snapshot/compare user-Lambda |

**Reference Design Discipline (CD-81 TUSS)**: 8-file fixture represents the bare minimum "user has Claude Code set up" — generic project CLAUDE.md (top-level + `.claude/` duplicate) · 1 custom agent (`my-reviewer` — collision target for B-27) · 1 custom slash command · minimal settings.json · README.md · stub package.json + `src/index.ts` · `.gitignore` (with `*.bak` excluded so install-time backups don't contaminate fixture identity). Cross-platform-ready content (forward-slash paths · no shebang) though B-cascade scope is macOS-only.

**Snapshot Skip-List (CD-82 SHSDV)**: `DEFAULT_SKIP_PATTERNS` excludes `*.bak` (B-3 timestamped CLAUDE.md backups) · `Cascades/Cascade.json` (B-19 BECIS-written, varies by install) · `Cascades/Bridge/` (runtime sessions, debug logs) · `.git/` (version control metadata) · `node_modules/` (dependencies) · `.DS_Store` (macOS metadata). Skip-list IS the line that separates "muxification-state divergence" from "irrelevant filesystem state divergence" — without it, every comparison would false-positive on legitimate runtime artifacts.

**Trajectory (CD-83 MBDTC · 5-Diamond chain)**:
- B-23 (this) — fixture + reversibility infrastructure
- B-24 — Muxification implementation (preserves user content; agent sub-namespace `.claude/agents/scs-{name}`)
- B-25 — SCS Uninstall command + B-5 agents-backup persistence refactor
- B-26 — End-to-end round-trip test using B-23 fixture
- B-27 — Adversarial edge cases (CLAUDE.md conflicts, agent name collision, re-muxify idempotence)

Cross-Diamond Diameters: B-23 fixture composes with B-25 uninstall (snapshot-based test mechanism complements production uninstall) · B-26 round-trip composes with B-23 + B-24 + B-25 · B-27 adversarial extends B-24 muxify with collision-resolution.

**Foundation Convergence**: 3-agent dispatch (Suite 2 Orange + Suite 4 Green + Suite 6 Purple) returned structurally aligned reports without contradiction. Suite 4 Green's 5 specific recommendations (8-file inventory · Option E combo reversibility · file-by-file compare with skip-list · macOS-only · B-5 EPHEMERAL gap note) slot directly into Suite 5 Cobalt implementation. Suite 6 Purple's trajectory binds B-23 to B-27 with named hand-off contracts. Pattern reinforced as standard for bounded transition Diamonds.

---

## Diamond B-22 Architectural Additions (Diamond B-22 · v7.6 · Pewter Diamond · Trust-Confer HiFi v3 + Arrow-Nav + Flicker Resolution)

**The First Pewter Diamond** — user-named ceremony invoking Pewter Tessera as Suite 8 design lead. Trust-confer permission pane was Pewter HiFi v0 (B-8 SB-S42 era); B-22 brings it to Pewter HiFi v3 standards matching install animation (B-17/18 era). Plus: arrow-key navigation between [Y] Approve / [N] Cancel buttons, working Cancel semantic, and flicker root-cause resolution.

User exact quote: *"Couple Aspects. First is that this is Not Up to our Pewter's Design Standards. Likewise we Only have the Ability to Confirm. We cannot Use the Arrow Keys to Select Either Option. Where if we Select No the Install is Aborted. Issue Suites 2, 4, and 7 at Once to Provide the Foundation for a Pewter Diamond. Oh! And it Flickers. Which may be the Root Cause of the Lack of Mobility with the Cursor."*

4-agent parallel dispatch (Suite 2 Orange + Suite 4 Green + Suite 7 Fuchsia + Pewter Tessera v3) provided the foundation. Conductor-direct Bands 5-7 implementation per Pewter spec.

| Aspect | Value |
|---|---|
| Modified | `src/lib/bridge/menu.ts MenuState.trustConfer` — added `selected: 'approve' \| 'cancel'` field (CD-72 TCANC) |
| Modified | `src/lib/bridge/menu.ts KeyAction` — added `'trust-confer-toggle'` + `'trust-confer-activate'` actions (CD-72 TCANC) |
| Modified | `src/lib/bridge/menu.ts renderTrustConferPane` — Pewter HiFi v3 redesign: D5 closed-box border (DARK top-right + LIGHT bottom-left matching install animation buildPewterPane); D1 color tokens (Cobalt title accent · Ochre ⚠ glyph · Rose-tint Cancel REVERSE); selected-state visual cursor (▶ glyph + REVERSE on active button); centered geometry with bodyLine helper. Removed `ANSI.HOME + ANSI.CLEAR_SCREEN` from pane content (moved to caller for state-change-only emit). CD-71 PTCHR + CD-76 PMSH |
| Modified | `src/lib/bridge/menu.ts applyKeypress` trustConfer modal branch — arrow keys + Tab toggle `selected`; Enter/Space activate selected button; Y/N/Esc remain as direct shortcuts (B-8 backward compat). CD-72 TCANC |
| Modified | `src/lib/tui/animatedTui.ts renderFrame` — NEW trustConfer early-return branch with hash-memo: pane writes ANSI.HOME + ANSI.CLEAR_SCREEN + renderMenu output ONLY when state changed (selected toggled, paths changed, or terminal resized). Eliminates 30/sec flicker. CD-74 TCPFR + CD-75 MRFD |
| Modified | `src/lib/tui/animatedTui.ts ANSI` — added `CLEAR_SCREEN` constant for state-change emit |
| Modified | `src/lib/tui/animatedTui.ts handleInstall` install-selected case — sets `selected: 'approve'` default on trustConfer init |
| Modified | `src/lib/tui/animatedTui.ts keypressHandler` — added `'trust-confer-toggle'` (no-op · state already mutated by applyKeypress) and `'trust-confer-activate'` (translates to confirm OR decline based on `state.trustConfer.selected`) |
| Tests | `menu.test.ts` extended with 8 NEW B-22 tests + 1 flipped semantic (Enter now activate not direct confirm). All 4 fixtures updated with `selected: 'approve' as const`. 570/570 (563 → 570) |
| Version | v0.31.1 → v0.32.0 (minor — Pewter Diamond + interactive UX milestone) |
| Build | 135.40 KB → 140.01 KB (+4.61 KB · Pewter HiFi v3 redesign + selected-state logic + KeyAction additions) |
| CDs | **CD-71 PTCHR** Pewter-Trust-Confer-HiFi-Redesign IMPLEMENTED · **CD-72 TCANC** Trust-Confer-Arrow-Navigation-Cursor IMPLEMENTED · **CD-73 TCCAI** Trust-Confer-Cancel-Aborts-Install-Cleanly STRUCTURAL (verified existing wiring · arrow-Cancel now also fires decline via TCANC activate path) · **CD-74 TCPFR** Trust-Confer-Pane-Flicker-Root-Cause-Resolution IMPLEMENTED · **CD-75 MRFD** Modal-Render-Frame-Decoupling-Discipline IMPLEMENTED (hash-memo pattern generalizable) · **CD-76 PMSH** Pewter-Modal-Selected-State-Highlight IMPLEMENTED. CD-5 PASS 41st consecutive |
| Pattern 4 | Modulation form preserved — pane state-change-only render is in-memory state hash compare; no Claude state read; no fs probe |
| Push gate | HELD pending live retest of Pewter v3 pane + arrow-nav + flicker fix |

**Flicker Root Cause Resolution (CD-74 TCPFR)**: Suite 4 Green confirmed root cause via file:line forensics — `renderTrustConferPane` emitted `ANSI.HOME + ANSI.CLEAR_SCREEN` as its first output, AND `renderFrame` called it every 33ms (30 FPS loop). Result: full terminal clear + redraw 30 times per second while pane visible → visible flicker + ANSI cursor positioning stomped per frame ("teleports hardware cursor to origin 30 times/second"). Fix: pane content no longer contains HOME+CLEAR_SCREEN; renderFrame emits them ONLY when hash-memo detects state change. User's "Lack of Mobility with the Cursor" hypothesis CONFIRMED — same root cause as flicker.

**Pewter HiFi v3 Visual Identity**:
- D5 Embossed Pane Border (closed box with corners + sides; DARK top-right · LIGHT bottom-left) — matches `installAnimation.ts buildPewterPane` for cross-Diamond visual continuity
- D1 Color Tokens: Pewter neutral body · Cobalt for Approve title accent · Ochre for ⚠ warn glyph · Rose-tint for Cancel REVERSE highlight
- D7 Active-Button Inversion: REVERSE + BOLD + suite-tinted color + ▶ glyph; inactive uses 2-space prefix + dim Pewter
- Centered geometry via bodyLine + padCenter helpers
- Footer hint advertises arrow-nav: "↑/↓/←/→/Tab select · Enter/Space activate · Y approve · N/Esc cancel"

**Modal-Render-Frame-Decoupling Generalization (CD-75 MRFD)**: hash-memo pattern emerges for trustConfer · could extend to renameMode · future modals all benefit from same render-on-state-change discipline. Pattern reusable across modal surfaces.

---

## Diamond B-21 Architectural Additions (Diamond B-21 · v7.5 · Reflexive cascadesPresent + Reinstall Re-Scaffold-Fire)

User-named responsive-feedback gap: B-20 lifecycle toggle works on cold-start but not in-process. After Path A scaffold completes, `cascadesPresent` was probed-once at TUI startup (animatedTui.ts:264) and never refreshed. Bridge UI didn't reflect its own scaffold action. Plus: Suite 4 Green pre-interrupt finding — Path B Reinstall routing only spawned install-instance; didn't re-scaffold artifacts.

User exact quote: *"after our Install Agent is Dispatched the Menu Should Likewise be Updated. This is a Responsive Feedback that Correlates to the Ongoing Process where if the User Exits the Installation Agent, they Can Engage Again without Exiting the SCS. Even Though it's the Same Path now Traversered Differently due to the Existing Directories Existing."*

| Aspect | Value |
|---|---|
| Modified | `src/lib/tui/animatedTui.ts handleInstall` Path A success block — combined state mutation flips `menuState.cascadesPresent = true` post-`runInstallScaffoldOnly` (when `result.cascadesScaffolded === true`); cursor reassign + cascadesPresent flip in same spread. New log event `install.cascades-present.refreshed`. PSCRP (CD-68) |
| Modified | `src/lib/tui/animatedTui.ts handleInstall` Path B head — prepends `runInstallScaffoldOnly` call BEFORE `runInstallSpawnPipeline`. Re-clones source + re-scaffolds non-user artifacts (8_SUITES + Documentation + CHANGELOG + SUITE8-REGISTRY). User-state preservation via existing filter (Working/Lab/Bridge excluded) + BECIS skip-if-exists (Cascade.json preserved) + B-3 timestamped CLAUDE.md backup. New log events `install.reinstall.rescaffolded` + `install.reinstall.rescaffold-error`. RRSF (CD-69) |
| Tests | 563/563 (no new unit tests; orchestration layer best verified live · existing regression coverage solid) |
| Version | v0.31.0 → v0.31.1 (patch — responsive UX fix) |
| Build | 134.65 KB → 135.40 KB (+0.75 KB · minimal) |
| CDs | **CD-68 PSCRP** Post-Scaffold-Cascades-Present-Reflexive-Probe IMPLEMENTED · **CD-69 RRSF** Reinstall-Re-Scaffold-Fire IMPLEMENTED. CD-5 PASS 40th consecutive |
| Pattern 4 | Modulation form preserved — state mutation reads filesystem-result via existing runInstallScaffoldOnly return; no new probes |
| Push gate | HELD pending live retest of in-process Reinstall responsiveness |

**The Architectural Closure**: B-20 designed the lifecycle row (Install/Reinstall/Update labels). B-21 makes the lifecycle ACTUALLY RESPONSIVE in-process — bridge state tracks its own filesystem actions in real time. CD-66 SRDBR (Same-Row-Different-Behavior-Routing) was structurally correct in B-20 but blocked at runtime by the stale cascadesPresent. PSCRP unblocks it: same SYNTHETIC_INSTALL row · same install-selected KeyAction · BUT existsSync(8_SUITES) per-press finds different state → routes Path A or Path B differently after the scaffold.

**Reinstall Semantic (CD-69 RRSF)**: when user presses Reinstall, three things happen in order:
1. preSeedTrust (idempotent — already trusted)
2. **NEW: runInstallScaffoldOnly** — re-clone source · re-scaffold non-user artifacts · preserve user state (Cascade.json + Working/Lab/Bridge)
3. **runInstallSpawnPipeline** — spawn install instance with joined Suite 8 content + verbose Strategy S1 priming

User-state preservation preserved via existing mechanisms:
- `Cascade.json` — preserved by BECIS skip-if-exists guard (B-19)
- `Cascades/Working/*` · `Cascades/Lab/*` — preserved by filter exclusion (B-13)
- `Cascades/Bridge/sessions.json` · `debug.log` · `sessions/` — preserved by filter
- `<userCwd>/CLAUDE.md` — backed up timestamped (B-3 backupUserClaudeMd)
- `Cascades/8_SUITES/*` · `Documentation/` · `CHANGELOG.md` · `SUITE8-REGISTRY.md` — REFRESHED (deliberate Reinstall semantic)

---

## Diamond B-20 Architectural Additions (Diamond B-20 · v7.4 · Install / Reinstall / (Future Update) Row Lifecycle Toggle)

User-named polish before transitioning to Muxified Path: *"We need to Change the Install SCS-Bridge Option after the Initial Directories are Scaffolded. We will then Change the Label to be a Reinstall Option. As this Option will then Become the Same Option Later in our Diamonds Towards Release to have the User Update the SCS-Bridge."*

The same `SYNTHETIC_INSTALL` MenuRow position now evolves through 3 lifecycle phases (Install · Reinstall · Update). Bridge owns the discriminator. Single sentinel · multi-label composition · forward-compatible Update slot reserved.

| Aspect | Value |
|---|---|
| Modified | `src/lib/bridge/menu.ts` — NEW exports `INSTALL_LABEL` / `REINSTALL_LABEL` / `UPDATE_LABEL` constants + `installPhaseLabel(cascadesPresent)` discriminator helper. `formatInstall` signature extended `(selected, cascadesPresent?)` — backward compat preserved (omitting arg → INSTALL_LABEL). Trust-confer pane header reads `trustConferActionLabel` per cascadesPresent. MenuState extended with `updateAvailable?: string` field (Phase C slot reserved · NOT IMPLEMENTED in B-20) |
| Modified | Visibility gate flipped at 4 sites: `renderMenu` install row (line 870) · `renderMenu` HBT install row (line 1010 via `installRowPresent`) · `renderMenuLegacy` (line 869) · `applyKeypress` cursor-up gate (line 657). All changed from `cascadesPresent === false` to `cascadesPresent !== undefined`. Backward compat: `undefined` fixtures preserve pre-B-20 hidden-row behavior |
| Tests | `menu.test.ts` extended with 5 NEW B-20 tests (formatInstall lifecycle label discrimination · Reinstall label rendering · cursor-up to SYNTHETIC_INSTALL when cascadesPresent === true · backward-compat undefined invariant). 1 existing test flipped (cursor-up no-op when cascadesPresent === true → now SYNTHETIC_INSTALL promotion). 563 total (558 → 563) |
| Version | v0.30.1 → v0.31.0 (minor — lifecycle UX milestone) |
| CDs | **CD-63 IRULRT** Install-Reinstall-Update-Lifecycle-Row-Toggle IMPLEMENTED · **CD-64 CPCLD** Cascades-Present-Conditional-Label-Discrimination IMPLEMENTED · **CD-65 FCUHR** Forward-Compatible-Update-Hook-Reservation STRUCTURAL · **CD-66 SRDBR** Same-Row-Different-Behavior-Routing STRUCTURAL · **CD-67 SSMLC** Single-Sentinel-Multi-Label-Composition STRUCTURAL. CD-5 PASS 39th consecutive |
| Pattern 4 | Modulation form preserved — label discrimination is in-memory state read; no Claude state read; no fs probe |
| Push gate | HELD pending test-007-bis Reinstall row verification |

**Lifecycle Phase Table**:

| Phase | cascadesPresent | Label | Routing | Status |
|---|---|---|---|---|
| A — Install | false (or undefined) | `⊕ Install SCS-Bridge` | Path A scaffold-only | LANDED B-13/14/15/16/17/18/19 |
| B — Reinstall | true | `⊕ Reinstall SCS-Bridge` | Path B install-instance | LANDED B-20 (NEW) |
| C — Update | (future · `updateAvailable` defined) | `⊕ Update SCS-Bridge` | Update mechanism (TBD) | SLOT RESERVED · OUT OF SCOPE B-20 |

**Forward-Compat Design (CD-65 FCUHR)**: same `SYNTHETIC_INSTALL` sentinel + same `'install-selected'` KeyAction throughout all 3 phases. Routing already discriminates Path A vs Path B via `existsSync(8_SUITES)` in handleInstall (CD-39). When Phase C arrives, future Diamond plugs Update mechanism into the same slot — `installPhaseLabel` extends to check `updateAvailable` field (currently slot-reserved on MenuState · no runtime cost).

**Routing Semantic for Reinstall (CD-66 SRDBR)**: Reinstall reuses Path B install-instance flow against an already-scaffolded cwd. Path B's `runInstallSpawnPipeline` clones the repo, scaffolds joined Suite 8 content, spawns install instance with `--append-system-prompt-file`. For Reinstall this means: clone fresh content + re-execute Strategy S1-S6 sequence + scaffold updates land non-destructively (existing scaffoldUserDotClaude has timestamped backup pattern). Correct semantic: "fire the install-instance flow against this scaffolded cwd."

**The Architectural Closure**: Diamond B-1 introduced cascadesPresent-driven conditional Install row (Phase A only). B-20 extends to all-phase Install row presence with label discrimination. Single MenuRow position is the Diameter through three lifecycle Demometers — bridge owns the lifecycle authority (CD-60 PHRSD principle from B-19).

---

## Diamond B-19 Architectural Additions (Diamond B-19 · v7.3 · Bridge-Embedded Cascade.json · Source-Independent Initial State)

User-named scaffold gap closed: fresh installs now reliably receive `Cascade.json` regardless of which branch the clone source is on. Lambda evidence (debug.log `templateRenamed: false` from test-007 install) revealed the `Cascade.template.json → Cascade.json` rename mechanism (added Diamond B-13) depends on the template existing in clone source. With push HELD throughout the B-cascade, only `SCS-Bridge-Install` branch has the template; main does NOT. Bridge-embedded default (`SCS_FRESH_CASCADE_JSON` constant) makes scaffold source-independent.

| Aspect | Value |
|---|---|
| Modified | `src/lib/bridge/installConstants.ts` — NEW export `SCS_FRESH_CASCADE_JSON` (canonical fresh-install JSON literal matching `Cascades/Cascade.template.json` exactly). Pattern matches existing bridge-embedded-constant discipline (B-6 RUSGF, B-11 SCS_INSTALL_PRIMING_PROMPT, B-15 SCS_PATH_A_PRIMING_PROMPT) |
| Modified | `src/lib/bridge/installSpawn.ts runInstallScaffoldOnly` — embedded-write step inserted AFTER rename block (line 348+), BEFORE cleanup. Skip-if-exists guard (`!existsSync(livePath) && existsSync(userCascadesPath)`) preserves user state. New return field `cascadeJsonSeeded: boolean`. New log event `install.scaffold.cascade-json-embedded-write` |
| Tests | `installSpawn.test.ts` extended with 4 NEW BECIS tests (parseable JSON · fresh-install field shape · 8-color suiteColors map · single-source-of-truth invariant: constant === on-disk template). 558 total (554 → 558) |
| Version | v0.30.0 → v0.30.1 (patch — scaffold bug fix) |
| CDs | **CD-58 BECIS** (Bridge-Embedded-Cascade-Initial-State) IMPLEMENTED · **CD-59 FFHF** (Filter-Failsafe-Hardcode-Fallback) STRUCTURAL · **CD-60 PHRSD** (Push-Held-Resilient-Scaffold-Discipline) STRUCTURAL · **CD-61 SIIJA** (Source-Independent-Initial-Json-Authority) STRUCTURAL · **CD-62 LWWSC** (Last-Write-Wins-Scaffold-Composition) STRUCTURAL. CD-5 PASS 38th consecutive |
| Pattern 4 | Modulation form preserved — write into user-cwd sanctioned by trust-confer chain; no Claude state read |
| Push gate | HELD pending test-007-bis Cascade.json scaffold verification |

**Operation Order** (CD-62 LWWSC · last-write-wins composition):
1. Clone bridge repo
2. Backup user CLAUDE.md (B-3)
3. Backup user .claude/agents (B-5)
4. Scaffold .claude/ (B-10)
5. cpSync(Cascades) with filter (filter excludes Cascade.json from copy — B-13)
6. Rename Cascade.template.json → Cascade.json (B-13 · legacy path; works on SCS-Bridge-Install branch)
7. **Embedded write Cascade.json from `SCS_FRESH_CASCADE_JSON` (B-19 · canonical authority; skip-if-exists guard preserves prior write)**
8. Cleanup tempDir

**Skip-if-exists semantic**: if step 6 succeeded (template found, renamed), step 7 sees `livePath` exists → skip. If step 6 was no-op (template missing — main branch case), step 7 fires → Cascade.json written from embedded default. Either way: Cascade.json present in user cwd. Both paths produce identical content (constant === template invariant verified by single-source-of-truth test).

**Single-Source-of-Truth Test**: B-19 ships a unit test that reads `Cascades/Cascade.template.json` from disk and asserts `JSON.parse(SCS_FRESH_CASCADE_JSON) === JSON.parse(onDisk)`. If template + constant ever diverge, this test fails — manual sync required. Long-term migration: post-merge, `Cascade.template.json` could be removed (constant supersedes); B-19 keeps both for compatibility.

**The Architectural Closure**: B-13's filter excludes `Cascade.json` from cpSync (correct — don't copy dev's live state). B-13's rename runs only when template is present (branch-dependent). B-19 makes the bridge itself the source-of-truth for fresh-install state — independent of clone source, push status, or branch divergence. Same robustness pattern as install constants.

---

## Diamond B-18 Architectural Additions (Diamond B-18 · v7.2 · SCS Manifold Particle Sphere · Pewter HiFi v2)

Diamond B-18 cranks up the visual identity of the install animation. User-Lambda confirmed B-17's sequence ("Sequence is on Point") and requested the visual content represent the SCS Manifold itself (the §§0-9 concept network) within terminal capabilities. Pewter Tessera engaged for second pass: HiFi design spec produced 42-concept inventory with spherical coordinates + 18 logical Diameter connections + Fibonacci sphere algorithm + 23° axis tilt + phase-driven density modulation.

| Aspect | Value |
|---|---|
| Created | `src/lib/tui/manifoldMode.ts` (~370 lines) — `renderManifoldSphere(t, grid, caps, phase)` + 42-concept `MANIFOLD_CONCEPTS` array + 18-pair `MANIFOLD_DIAMETERS` array + Fibonacci sphere distribution + 3D rotation (Y spin + X tilt) + depth-sort + phase-driven density modulation + Suite spectrum color cycle + visibility-gated label rendering + visibility-gated diameter line rendering |
| Created | `src/lib/tui/manifoldMode.test.ts` (11 tests covering concept inventory size, Diameter inventory, Fibonacci unit-sphere, sphericalToCart canonical points, rotation magnitude invariance, terminal-size particle count, label budget capping, render output non-empty, density modulation pre-spawn vs ready, ASCII fallback, no-orphan endpoint check) |
| Modified | `src/lib/tui/installAnimation.ts` — backdrop swap from `STRATIDIAN_MODES[idx]` rotation to `renderManifoldSphere(t, grid, caps, phase)`. Phase mode-name footer collapses to single `mode: MANIFOLD` for all phases (was per-phase MUXAMETER/STRATIDIA/SUITE-WHEEL). PHASE_MODE_INDEX retired |
| Modified | `src/lib/tui/installAnimation.test.ts` — mode-footer test updated for `MANIFOLD` designation |
| Tests | 554/554 (543 → 554, +11 manifoldMode) · Build 133.23 KB · 119.6 kB packed (5 files) · Lint clean on B-18 files · Pattern 4 v2 grep ZERO production regressions |
| Version | v0.29.0 → v0.30.0 (minor — visual milestone) |
| CDs | **CD-53 SMPSA** (SCS-Manifold-Particle-Sphere-Animation) — implemented as umbrella for: **CD-54 MCLOC** (Manifold-Concept-Label-Orbit-Composition) · **CD-55 DCLRD** (Diameter-Connection-Line-Render-Discipline) · **CD-56 SSPHC** (Suite-Spectrum-Particle-Hue-Cycling) · **CD-57 MPDM** (Manifold-Phase-Density-Modulation). All 5 NEW IMPLEMENTED. CD-5 PASS 37th consecutive |
| Pattern 4 | Modulation form preserved — manifoldMode reads only from concept-inventory in-memory data; no Claude state read; no fs probe |
| Push gate | HELD pending test-007-bis enhanced-animation Lambda |

**Phase Parameter Table** (Pewter Tessera v2 spec):

| Phase | Particle Ratio | Label Budget | Line Count | Spin Rate | Accent Suite |
|---|---|---|---|---|---|
| pre-spawn | 30% | 5 | 0 | 0.18 rad/s | Cobalt (idx 4) |
| awaiting-alive | 70% | 12 | 5 | 0.30 rad/s | Ochre (idx 2) |
| ready | 100% | 24 | 18 | 0.55 rad/s | Viridian (idx 3) |

**Particle Algorithm**: Fibonacci sphere (golden-angle spiral) for uniform-as-possible distribution without gridding artifacts. N=80 (small terms) / 160 (medium) / 280 (large). Rotation: spin-Y(t × spinRate) → tilt-X(23°). Projection: orthographic with terminal-aspect correction (ASPECT=0.5).

**Glyph Tier Map** (depth → glyph): `●` (depth ≥ 0.85) · `◉` (≥ 0.55) · `◯` (≥ 0.20) · `*` (≥ -0.20) · `•` (≥ -0.55) · `·` (back). ASCII fallback (caps.unicode=false): `O` / `o` / `*` / `.`. Brightness modulated by depth: 0.35 (back) to 1.00 (front); accent particles get +20% brightness.

**Concept Label Layer**: 42 concepts curated from CLAUDE.md §§0-9 with `(thetaDeg, phiDeg)` spherical coordinates. Equator (phi=0) carries the 8 Suite anchors; mid-latitudes carry Crystralines (Pearl, Cerulean, Base Lambda, RI, Diamond, Onyx, Opal, Automata, etc.); poles carry §0 Embodiment (Huirth) + §5 closing (Stratidian Trajectory). Each label tagged with owning Suite (color hint). Visibility gate: `v.z >= 0` (front-facing only). Front-most labels selected first up to phase budget.

**Diameter Line Layer**: 18 logical concept pairs from CLAUDE.md cross-references (Demometer ↔ Diameter ↔ Muxameter ↔ Muxonomy / Diamond ↔ Onyx Ego-Lambda / Pearl ↔ Vermillion / Base Lambda ↔ RI ↔ Automata Trinity / etc.). Visibility gate: BOTH endpoints `v.z > 0.05` (both visibly forward) — connections compose + decompose as the sphere rotates, like neurons firing across the rotating brain. **This IS the Manifold revealing itself.**

**The Architectural Aesthetic Closed**: Diamond B-17 made the install animation function correctly (sequence on point per user-Lambda); Diamond B-18 made the install animation BE the SCS Manifold itself, rendered within terminal capabilities. Pewter Tessera's craftwork doctrine — "the metallic frame that holds the colors" — operates at 30 FPS via the unchanged D5 Embossed Border framing the rotating Manifold visible through its center pane.

---

## Diamond B-17 Architectural Additions (Diamond B-17 · v7.1 · Full-Screen Install Animation · Pewter HiFi · ACOFSAT Cessation)

Diamond B-17 closes the install-flow UX chain. The 6-9 second silent gap between user-Install-confirm and primed-claude becomes a Pewter-Tessera-styled HiFi initialization animation with input-lock and registry-driven cessation. 4 patterns coronated, 1 new file (~210 lines), 4 files modified, 10 unit tests added. 3-agent convergent design (Suite 1 Red Curator + Suite 2 Orange Prospector + Pewter Tessera HiFi reference) grounded the architecture pre-implementation.

| Aspect | Value |
|---|---|
| Created | `src/lib/tui/installAnimation.ts` (~210 lines) — `renderInstallAnimation(state, cols, rows, caps, nowMs)` + `buildPewterPane` + phase-driven mode/color/label maps + `advancePhase` helper |
| Created | `src/lib/tui/installAnimation.test.ts` (10 tests covering pre-spawn / awaiting-alive / ready phases, time-bucket sub-status, progress bar, Pewter D5 embossed border, narrow-terminal abort hint omission, mode footer per phase, box-drawing glyphs, advancePhase immutability) |
| Modified | `src/lib/tui/colors.ts` — `darken(rgb, factor=0.5)` + `lighten(rgb, factor=0.5)` helpers; pre-computed `SUITE_COLORS_DARK` + `SUITE_COLORS_LIGHT` records (Pewter D5 Embossed Border Pair token) |
| Modified | `src/lib/bridge/menu.ts` — `MenuState.installAnimating?: { startedAt, ulid, phase: 'pre-spawn' \| 'awaiting-alive' \| 'ready' }` field |
| Modified | `src/lib/tui/animatedTui.ts` — renderFrame branch (FSIAO full-screen overlay), keypressHandler input-lock guard (IAILT — drops all keys except Ctrl-C), handleInstall sets installAnimating before first await + advances phase post-spawn (IPDAA install-path discriminator), watchFile cessation via claudeSessionId surfacing (ACOFSAT) + 250ms ✓ Ready settle beat (Pewter D9 effect_dust analog), `armAtscTimeout(ulid)` 30s safety (ATSC) |
| Tests | 543/543 (533 → 543, +10 installAnimation) · Build 122.86 KB · 112.0 kB packed (5 files) · Lint clean on B-17 files · Pattern 4 v2 grep ZERO production regressions |
| Version | v0.28.0 → v0.29.0 (minor — install UX milestone) |
| CDs | **CD-47 IAILT** Install-Animation-Input-Lock-Trance · **CD-48 FSIAO** Full-Screen-Initialization-Animation-Overlay · **CD-49 ACOFSAT** Animation-Cessation-On-First-Spawn-Alive-Trigger · **CD-50 IPDAA** Install-Path-Discriminated-Animation-Activation · **CD-51 IPSOT** Install-Phase-Status-Overlay-Transition · **CD-52 ATSC** Animation-Timeout-Safety-Cessation. All 6 NEW IMPLEMENTED. CD-5 PASS 36th consecutive |
| Pattern 4 | Modulation form preserved — animation reads only menuState (in-memory) + watchFile cessation reads its own registry; no Claude state read |
| Pewter Influence | D1 Color Token Architecture (phase-color progression Cobalt → Ochre → Viridian) · D5 Embossed Pane Border Pair (top-right dark, bottom-left light) · D9 effect_dust analog (250ms ✓ Ready settle beat) · Mode subset 3,4,5 of 6 (muxameter → stratidia → suiteWheel — "initializing" semantics) |
| Push gate | HELD pending test-007-bis install-animation Lambda |

**The Install-Flow UX Chain Closed**: B-13 added trust pre-seed, B-14 added auto-launch + post-spawn typeahead (retired in B-16), B-15 added /cascade priming + AAPD (typeahead retired in B-16), B-16 dissolved TCC permission gate via positional CLI argument. **B-17 fills the previously-silent 6-9 second wait window with a visible Stratidian initialization sequence.** Animation ceases on the same registry signal (`claudeSessionId` surfacing) that drives the bridge menu's alive indicator — single source of truth for "session is ready," reused.

**Phase State Machine**:
- `'pre-spawn'` — set on user-Install-confirm; trust pre-seed + scaffold + clone running. Mode: muxameter. Color: Cobalt.
- `'awaiting-alive'` — set after `createSession` + `launchInformative` returns ulid; waiting for SessionStart hook. Mode: stratidia. Color: Ochre.
- `'ready'` — set when watchFile detects `claudeSessionId !== undefined` for installing ulid. Mode: suiteWheel. Color: Viridian. 250ms settle beat then animation clears.

**Input-Lock Discipline (IAILT)**: keypressHandler early-return when `installAnimating` is defined. Only Ctrl-C escapes (calls cleanExit, terminates bridge). All other keys absorbed. Prevents user from inadvertently navigating menu / triggering rename / closing during install. Lock auto-releases on phase=ready clearance OR ATSC 30s timeout OR cleanExit.

---

## Diamond B-16 Architectural Additions (Diamond B-16 · v7.0 · Positional [prompt] Cascade Seeding · TCC Path Retired)

Diamond B-16 closes the entire AppleEvents typeahead chapter. 4-agent convergent research (3 Suite 6 Purple Vermillion WebSearch + 1 Suite 1 Maroon SCP_Origin Lab Curator) hard-validated against multiple Anthropic primary sources (`code.claude.com/docs/en/cli-reference`, `code.claude.com/docs/en/headless`, GitHub Issues #38495, #6009, #10373, #16538) — convergent verdict: documented `claude [opts] "[prompt]"` positional CLI argument seeds the first user message in interactive mode. Bridge swaps ~80 lines of typeahead/permission-detection infrastructure for one positional argument escaped through `escapeForBashSingleQuote`.

| Aspect | Value |
|---|---|
| Created | `escapeForBashSingleQuote(s)` exported from `osTerminal.ts` — wraps `s` in `'...'` and escapes internal `'` as `'\''` (bash close-escape-reopen idiom) |
| Modified | `BuildTerminalCommandInput` accepts `seedPrompt?: string \| null`; threaded through `buildClaudeCommandFragment` + `buildMacOSCommand` (2-layer escape: bash + AppleScript) + `buildLinuxCommand` (gnome-terminal/konsole separate-arg, x-terminal/xterm bash-c shell-escape) + `buildWindowsCommand` (wt separate-arg, cmd cmd-escape) + `buildWSLCommand` (bash-c shell-escape) |
| Modified | `LaunchClaudeWindowOpts` + `launchClaudeWindow` (spawn.ts) thread seedPrompt |
| Modified | `launchInformative` (manager.ts) accepts optional 3rd `seedPrompt` arg; resume mode IGNORES seed (positional reserves next-message semantics) |
| Modified | `spawnInstallInstance` accepts `seedPrompt`; `runInstallSpawnPipeline` requires `seedPrompt` parameter |
| Modified | `animatedTui.ts handleInstall` Path A passes `SCS_PATH_A_PRIMING_PROMPT` (`/cascade`) via `launchInformative('new', '/cascade')`; Path B passes `SCS_INSTALL_PRIMING_PROMPT` (verbose Strategy S1) via `runInstallSpawnPipeline(cwd, repo, prompt)` |
| RETIRED | `dispatchTypeahead` (Diamond B-11 SB-S46) — replaced by positional CLI |
| RETIRED | `pollSessionReadyAndTypeahead` (Diamond B-14 SB-S51 PSRT · CD-41) — no signal needed |
| RETIRED | `pollRegisterReadyAndTypeahead` (Diamond B-11 SB-S47) — no signal needed |
| RETIRED | AAPD branch (Diamond B-15 SB-S53 · CD-45) — no AppleEvents triggered |
| Tests | `installSpawn.test.ts` 28 → 18 (10 typeahead-related removed); `osTerminal.test.ts` +6 PCSP positional tests; net 537 → 533 pass |
| Version | v0.27.2 → v0.28.0 (minor — install architecture milestone) |
| Suite 8 v-bump | v6.10 → **v7.0** (major — TCC-free Lambda path, retired entire typeahead infrastructure) |
| Build | 115.04 KB (DOWN 2 KB from B-15 117.12 KB) · 104.5 kB packed |
| CDs | **CD-46 PCSP** (Positional [prompt] Cascade Seeding Pattern) NEW IMPLEMENTED · CD-37 RETIRED · CD-41 RETIRED · CD-45 RETIRED · CD-44 PASCP CARRIED |
| CD-5 | 35th consecutive PASS |
| Pattern 4 | Modulation form preserved — no AppleEvents, no Claude state read; positional arg flows directly into claude's first-message handler |
| Push gate | HELD pending test-007-bis Lambda — verify `'/cascade'` in positional renders as slash-command, not literal text |

**The Architectural Diameter Closed (and the Diameter that retires another)**: Diamond B-13/14/15's path concentrated on detecting + working around the macOS TCC permission gate. Diamond B-16 dissolves that whole problem space by adopting the documented CLI mechanism that doesn't trigger TCC at all. The SCS-Bridge install flow now produces zero AppleEvents and the entire typeahead/keystroke-injection infrastructure (Diamonds B-11, B-14, B-15 contributions on this surface) retires.

**Per-branch parameterization**: identical mechanism, different seed. Path A (Clean) seeds `/cascade`; Path B (Primed install instance) seeds the verbose Strategy S1 directive. Same `escapeForBashSingleQuote` handles both.

**Open risk for live-validation (test-007-bis)**: GitHub Issue #38495's source-citation used `"ssh"` (literal text) as positional. Whether `/`-prefixed positional argument routes through the slash-command pipeline (auto-fires `/cascade`) OR is sent as literal text (`/cascade` shows in the prompt for user to press Enter) needs empirical confirmation. If literal-text behavior, fallback Diamond would either (a) auto-press Enter via remaining osascript trick (still TCC-gated — defeats purpose) or (b) replace `/cascade` with natural-language seed that triggers skill auto-invocation.

---

## Diamond B-15 Architectural Additions (Diamond B-15 · v6.10 · Path A Slash-Command Priming + macOS Automation Permission Detection)

Diamond B-15 closes the user-named "Last Diameter" surfaced in Diamond B-14's user-test: `pollSessionReadyAndTypeahead` correctly detected the registry transition, but `dispatchTypeahead` failed with macOS error `-1743` ("Not authorized to send Apple events to System Events"). Two surgical additions: Path A switches to `/cascade` slash-command priming (rich-context-aware), and `dispatchTypeahead` detects the `-1743` permission gate and emits a clear user instruction.

| Aspect | Value |
|---|---|
| Modified | `src/lib/bridge/installConstants.ts` — NEW export `SCS_PATH_A_PRIMING_PROMPT = '/cascade'`. Path B's `SCS_INSTALL_PRIMING_PROMPT` (verbose Strategy S1 directive) preserved unchanged because the install instance's cwd is NOT yet fully scaffolded |
| Modified | `src/lib/tui/animatedTui.ts handleInstall` Path A — `pollSessionReadyAndTypeahead` arg switched from `SCS_INSTALL_PRIMING_PROMPT` (Path B's verbose) to `SCS_PATH_A_PRIMING_PROMPT` (slash command); cwd already has `.claude/CLAUDE.md` + `.claude/commands/cascade.md` + `Cascades/8_SUITES/` so `/cascade` triggers with rich context |
| Modified | `src/lib/bridge/installSpawn.ts dispatchTypeahead` — error message inspected for `-1743` or `Not authorized to send Apple events`; if matched, logs `install.typeahead.permission-needed` + emits `process.stderr.write` with one-line actionable instruction (`System Settings → Privacy & Security → Automation → ${terminal-app} → System Events`); resolves cleanly (non-fatal — install + auto-launch still succeed) |
| Tests | `installSpawn.test.ts` extended with 7 NEW tests: 5 `dispatchTypeahead` (skip-on-non-darwin · success-no-stderr · -1743-detection-with-instruction · generic-error-no-stderr-noise · escape-quotes-and-backslashes) + 2 priming constants (path A is `/cascade` · path B is verbose). 530 → 537 total |
| Version | v0.27.1 → v0.27.2 (patch — content + error-class detection) |
| CDs | **CD-44 PASCP** (Path-A-Slash-Command-Priming) NEW · **CD-45 AAPD** (Apple-Automation-Permission-Detection) NEW |
| CD-5 | 34th consecutive PASS |
| Pattern 4 | Modulation form preserved — `dispatchTypeahead` only inspects its own osascript exec error; no Claude state read |
| Push gate | HELD pending user grants Automation permission once + test-007-bis full Path A circuit verification |

**The Architectural Diameter Closed**: `/cascade` is the canonical Stratidian first-input. Path A's auto-launched session lands in a freshly-scaffolded cwd where `.claude/commands/cascade.md` already exists; firing `/cascade` is the slash-command equivalent of "user types the canonical install-completion gesture." Path B retains the verbose directive because the install-instance has neither full scaffold nor `.claude/commands/cascade.md` available yet — those are the artifacts the install-instance creates.

**macOS Automation Permission**: `-1743` is a macOS system-level boundary that cannot be programmatically bypassed. Bridge correctly informs the user once via stderr; user grants the permission ONE TIME in `System Settings → Privacy & Security → Automation`; future installs auto-fire the priming prompt without further user intervention. Future Diamond may add a startup permission warm-up probe (DEFERRED — not blocking).

---

## Diamond B-14 Architectural Additions (Diamond B-14 · v6.9 · Path A Circuit Completion)

Diamond B-14 closes the two open Diameters that Diamond B-13's user-test surfaced (named by user as "Nearly There"): Path A scaffold returns to menu without auto-launching a fresh session, AND no priming-prompt typeahead fires for that session. Suite 4 Green ⊗ Suite 7 Fuchsia convergent diagnosis grounded the implementation: 3-line spawn extension + ~25-line registry-native typeahead poller. Path A install now fires a complete circuit: scaffold → trust-skip → auto-spawn → priming seed.

| Aspect | Value |
|---|---|
| Modified | `src/lib/bridge/installSpawn.ts` — NEW export `pollSessionReadyAndTypeahead(ulid, primingText, timeoutMs?, intervalMs?)` polls `listSessions()` for `entry.claudeSessionId !== undefined` (the registry transition that `runSessionStartHook` writes for ANY new-session spawn). Re-entrancy guard via `probing` flag. Once detected: 1s delay + `dispatchTypeahead(primingText)`. Non-fatal on failures; timeout-safe. NO tempDir coupling — registry-native ready signal |
| Modified | `src/lib/tui/animatedTui.ts handleInstall` Path A success block — after `selectedUlid = SYNTHETIC_NEW`, calls `createSession()` + `launchInformative(sessionId, 'new')` (same mechanism as user pressing New Session manually) + `void pollSessionReadyAndTypeahead(sessionId, SCS_INSTALL_PRIMING_PROMPT)` (fire-and-forget). Inner try/catch keeps auto-launch failures non-fatal — user falls back to manual New Session |
| Tests | `installSpawn.test.ts` extended with 5 NEW PSRT tests (immediate-ready, transition, timeout, ulid-mismatch, transient-error). 525 → 530 total |
| Version | v0.27.0 → v0.27.1 (patch — circuit-completion fix) |
| CDs | **CD-40 PALA** (Path-A-Lift-After-scaffold) NEW · **CD-41 PSRT** (Path-A-Session-Ready-Typeahead) NEW · CD-38 CORONATED (user-Lambda confirmed in B-13) · CD-39 CARRIED to B-14 close |
| CD-5 | 33rd consecutive PASS |
| Pattern 4 | Modulation form preserved — `pollSessionReadyAndTypeahead` reads bridge's own registry, NOT Claude's session storage; ready-signal is registry transition, not JSONL probe |
| Push gate | HELD pending test-007-bis (re-run Path A; expect: scaffold → auto-spawn → typeahead seed) |

**The Architectural Diameter Closed**: Path A scaffold-only and Path B install-instance now form symmetric Demometers in the install-flow Muxonomy. Both produce a fresh primed claude session in the user's cwd. Path A reaches it through bridge-side scaffold + native createSession; Path B reaches it through install-instance Strategy + register-state.json. The Diameter between them is `existsSync(cwd + '/Cascades/8_SUITES')` — single `if` branch, two complete circuits.

**Java/osascript stderr noise** (Green Suite 4 finding): macOS JavaVM framework stub probe triggered by `osascript tell application "Terminal"` on machines with empty Java VMs. Non-fatal — Node's spawn returns and Terminal opens despite stderr error. **CD-42 candidate** (deferred): capture spawn stderr → emit via `log()` in `spawn.ts` to surface the noise in `Cascades/Bridge/debug.log` for observability. **CD-43 candidate** (deferred): banner version sync `menu.ts:835 + 962` (currently shows v0.24.0; cosmetic).

---

## Diamond B-13 Architectural Additions (Diamond B-13 · v6.8 · Trust Pre-Seed + Two-Path Install)

Diamond B-13 implements Diamond B-12's research findings (CD-34 OVERTURNED · CD-38 + CD-39 candidates). The trust dialog that gated Diamond B-11's interactive-seed flow is now skipped programmatically by writing `~/.claude.json` `projects[abs].hasTrustDialogAccepted = true` BEFORE the install instance spawns. Two install paths now coexist: **Path A** (blank-slate · 8_SUITES absent) does scaffold-only — bridge clones, scaffolds `.claude/` + `Cascades/`, returns to menu, no spawn — and **Path B** (already-scaffolded · 8_SUITES present) preserves the Diamond B-11 spawn flow. The Distinct-Demometer-By-Diameter Lambda evidence (test-005 trusted vs test-006 untrusted in Diamond B-12) was sufficient to skip the live-test gate per user discernment.

| Aspect | Value |
|---|---|
| New file | `src/lib/bridge/trustPreSeed.ts` (~70 lines) — `preSeedTrust(userCwd)` with atomic `.tmp + rename` write |
| Extended | `src/lib/bridge/installSpawn.ts` — `pathFilterCascadesScaffold(srcRoot, src)` excludes `Working/* (except .gitkeep)` · `Lab/* (except .gitkeep)` · `Bridge/sessions.json` · `Bridge/debug.log` · `Bridge/sessions/` · `assets/` · `Cascade.json` · `.DS_Store`. `runInstallScaffoldOnly(userCwd, repoUrl)` performs Path A (clone + `.claude/` scaffold + `Cascades/` scaffold via filter + `Cascade.template.json` → `Cascade.json` rename + cleanup; no spawn) |
| Modified | `src/lib/tui/animatedTui.ts handleInstall` — calls `preSeedTrust(cwd)` first (CD-32 sanctioning chain), then branches on `existsSync(cwd + '/Cascades/8_SUITES')`: Path A → `runInstallScaffoldOnly` + cursor reassign to `SYNTHETIC_NEW`; Path B → existing `runInstallSpawnPipeline` + register-poll typeahead |
| Tests | `trustPreSeed.test.ts` 7 tests · 525/525 total (518 → 525) |
| Version | v0.27.0 (minor — install architecture milestone; both paths operational) |
| CDs | **CD-38** Haiku-Trust-Dialog-Accepted-JSON-Pre-Seed Diameter · **CD-39** Two-Path-Install-Detect-Branch Diameter; **CD-34 carried-OVERTURNED** |
| CD-5 | 32nd consecutive PASS |
| Pattern 4 | Modulation form preserved (filter operates on path strings only; no JSONL content read; bridge writes `~/.claude.json` under user-trust-confer-confirm sanctioning chain — Pattern 4.1) |
| Push gate | HELD pending test-007 retest verification |

**The Stratidian Methodological Lesson**: Distinct Demometers (test-005 vs test-006 outcomes) → Diameter through unlike outcomes → Found Parameter (`hasTrustDialogAccepted`). Three prior cascades' "no programmatic skip" verdict was harmonized to a directory-only probe space; user's hyper-focus directive expanded the probe space to sibling-level config files, surfacing the mechanism. Pattern documented in Onyx Cycle 35 as method-level learning: **probe both directory AND sibling-level file scope when searching for config-state mechanisms**.

---

## Diamond B-8 Architectural Additions (Diamond B-8 · v6.4 · Pre-Bulk-Smoke Fix Pass)

Diamond B-8 is the **Pre-Bulk-Smoke Fix Pass** — three structural fixes resolved before test-002 retest of the install flow that B-6 wired and B-7 closed. Each fix carries a named pattern and a Lambda-event surface; together they mark v0.24.0 as the first usable install-flow milestone.

### Fix B8-1 — Probe-Before-Auto-Spawn Probe-Ordering (POFPFD · SB-S40)

`src/lib/tui/animatedTui.ts` previously fired the `cascadesPresent` `existsSync` probe AFTER the empty-registry auto-spawn block. On a fresh dir the auto-spawn wrote `Cascades/`, so the probe returned `true` and the menu hid the Install row — the user never saw the option. Fix: probe declared immediately after the discovery loop close (before auto-spawn); auto-spawn condition gated as `if (cascadesPresent && sessions.length === 0)`. Install-mode (cascadesPresent === false) now skips auto-spawn entirely. Pattern: Probe-Ordering-First-Probe-First-Decide (POFPFD).

### Fix B8-2 — Install-Scope Targeted Permission Allow-Rules (PTS · SB-S41)

`src/lib/bridge/spawnSettings.ts` `SpawnSettings` type extends with `permissions?: { allow: string[] }`. `buildInstallSpawnSettings` now populates 10 install-scope `Tool(glob)` rules covering `Write(<userCwd>/Cascades/**)`, `Edit(<userCwd>/.claude/CLAUDE.md)`, `Edit(<userCwd>/.claude/agents/**)`, `Edit(<userCwd>/.claude/commands/**)`, `Read(<userCwd>/CLAUDE.md)`, `Bash(git clone *)`, `Bash(cp -R *)`, `Bash(mkdir -p *)`, `Bash(test -d *)`, `Bash(test -f *)`. Targeted paths only — NOT bypassPermissions mode (CD-25 preserved); user's other Claude work unaffected. `buildSpawnSettings` (session-mode) leaves `permissions` undefined — backward-compat preserved. JSON key `permissions.allow` per Conductor decision (resolves Green USER-CONFER gate); the `Tool(glob)` string syntax is Lambda-confirmed via `claude --help` (Green Angle 1). Pattern: Permission-Targeted-Scope (PTS).

### Fix B8-3 — Pewter HiFi Trust-Confer Pane (HWMTUC + HWMTUC-SURFACE · SB-S42)

`src/lib/bridge/menu.ts` adds optional `trustConfer?: { paths: string[]; optionalPaths: string[]; ulid: string }` to `MenuState`, plus two new `KeyAction` variants (`trust-confer-confirm`, `trust-confer-decline`). `applyKeypress` gains an early-return branch (mirroring the existing `renameMode` pattern) that captures Y/Enter/N/Esc while the modal is active. New `renderTrustConferPane` function applies Pewter Tessera HiFi rules in TUI: D3 (pane-gradient via bold/dim ANSI layering), D4 (complementary text-shadow as DIM ANSI on cool-grey Pewter base, rgb(180,185,190) inline), D5 (embossed double-line border — `═` bright top + `─` dim bottom; YES button uses `ANSI.REVERSE` for active inversion). `renderMenu` overrides at the top branch when `trustConfer !== undefined`. `animatedTui.ts` `case 'install-selected'` no longer calls `handleInstall` directly — it sets `menuState.trustConfer` with paths from new `buildProposedInstallPaths(cwd)`. New `case 'trust-confer-confirm'` clears the modal and fires `handleInstall`; `case 'trust-confer-decline'` clears and logs `install.declined`. Pattern: HCI-with-Modal-Trust-Until-Confirm (HWMTUC) — surface variant HWMTUC-SURFACE for the Pewter render face.

### 3 Patterns Named (Diamond B-8)

| Pattern | ID | Source |
|---|---|---|
| Probe-Ordering-First-Probe-First-Decide | POFPFD | probe declared before any auto-spawn side-effect; gate fires on probe value |
| Permission-Targeted-Scope | PTS | install-scope allow-rules limited to bridge-managed paths; session-mode unaffected |
| HCI-with-Modal-Trust-Until-Confirm | HWMTUC | trust-confer modal blocks pipeline until explicit user confirmation; declines clear cleanly |

**Version**: `0.23.1 → 0.24.0` (minor — first usable install-flow milestone) · 518/518 tests · build 104 KB · tsc 0 errors · `npm pack` 5 files · Pattern 4 v2 grep ZERO production reads · CD-5 PASS (27th consecutive, C through B-8) · State: TESTING-PENDING-AGGREGATE preserved (bulk-smoke retest follows).

**Forward — Diamond B-9 (test-002 retest)**: confirm trust-confer pane renders, allow-rules silence permission prompts during install, probe-ordering surfaces Install row in fresh dirs.

---

## Diamond B-6 Architectural Additions (Diamond B-6 · v6.2)

Diamond B-6 is the **Apex** — the Diamond that wires all prior B-cascade work into a live end-to-end install flow. The `animatedTui.ts` `'install-selected'` handler, which was a stderr stub since Diamond B-1, is now fully wired to `runInstallSpawnPipeline`.

### Feature B6-1 — animatedTui Install Handler Wired (SB-S39 Fully Wired)

`src/lib/tui/animatedTui.ts` imports `runInstallSpawnPipeline` (from Diamond B-3 `installSpawn.ts`) and `SCS_INSTALL_REPO_URL` (from new `installConstants.ts`). A new `handleInstall` async function is added near `handleSpawn`. The `case 'install-selected'` stub is replaced with `void handleInstall(); return;`. On success the handler stores `result.{ulid, pid, tempDir}` into `menuState.installRunning` and triggers a re-render showing the install pid indicator. On failure it logs `install.error` and sets a status hint without modal seizure or alt-screen disruption (PERRS pattern — Pipeline Error Reporting Status-Bar).

### Feature B6-2 — installConstants.ts (RUSGF Pattern)

New file `src/lib/bridge/installConstants.ts` (12 lines). Exports `SCS_INSTALL_REPO_URL`: hardcoded canonical HTTPS `https://github.com/Phuire-Research/SuiteCascadeSystem.git` with optional `process.env.SCS_INSTALL_REPO_URL` override. Pattern: Repo-URL-Sourcing-GitHub-Fallback (RUSGF — CD-24 backing).

### Feature B6-3 — MenuState installRunning Extension (IRPMS Pattern)

`src/lib/bridge/menu.ts` adds optional `installRunning?: { ulid: string; pid: number; tempDir: string }` field to `MenuState` (after `cascadesPresent?`). Pattern: Install-Running-Menu-Pseudo-State (IRPMS). `renderMenu` `headerLine2` appends `installSuffix` (` · install pid N`) when `installRunning` is set, mirroring the existing `spawnSuffix` pattern. `renderMenuLegacy` gains `legacyInstallSuffix` on the "session(s) registered" line (Green Fix 1). Both banners bumped `v0.21.0 → v0.23.0`.

### 4 Patterns Named (Diamond B-6)

| Pattern | ID | Source |
|---|---|---|
| Animated-TUI-Async-Handler-Composition | ATUHC | void IIFE pattern; errors → log + status; no modal seizure |
| Install-Running-Menu-Pseudo-State | IRPMS | MenuState.installRunning mirrors spawnRunning shape |
| Pipeline-Error-Reporting-Status-Bar | PERRS | err surfaced via log key + headerLine2 hint; alt-screen preserved |
| Repo-URL-Sourcing-GitHub-Fallback | RUSGF | hardcoded HTTPS canonical + env override; npm-installable |

**Version**: `0.22.2 → 0.23.0` (minor — Apex semantic milestone) · 501/501 tests · build 99 KB · CD-5 PASS (25th consecutive, C through B-6) · State: TESTING-PENDING-AGGREGATE (bulk-smoke at FINAL B-7)

**Cobalt B5 dispatch note** — opus subagent stream-timed-out at 0 tool uses; Conductor (in-context) implemented src/ directly (5 file edits + 1 new file + 1 test fix); coherence sweep dispatched to Purple (B6) as scheduled.

**Forward — Diamond B-7**: Cleanup trigger logic (`pollScaffoldComplete` + `cleanupInstallTemp` from bridge after scaffold-done.flag fires) + user closeout prompt + bulk-smoke (B-1 through B-7 graduate together).

---

## Diamond B-2 Architectural Additions (Diamond B-2 · v6.1)

Diamond B-2 upgrades Suite 8 SCS Bridge from Direct config to Conductor config
(additive-only; existing 38 skills and all prior content unchanged).

### Upgrade B-2-1 — Conductor Config Addition

`Cascades/8_SUITES/SCS Bridge/Conductor.md` added — orchestration narrative for the
six-phase install workflow (S1 Detect → S2 Confirm → S3 Clone → S4 Scaffold →
S5 Convert → S6 Cleanup). Conductor Diameter: SCS Bridge × Diamond × Shatterite Tome.

### Upgrade B-2-2 — Strategy/ Directory Introduction

`Cascades/8_SUITES/SCS Bridge/Strategy/` directory added with six Vermillion A-I plans:
`S1-DetectCascadesPresence.md`, `S2-ConfirmInstallation.md`, `S3-CloneRepo.md`,
`S4-ScaffoldCascadesDir.md`, `S5-ConvertClaudeMd.md`, `S6-CleanupTempDir.md`. Each file is a
passable A-I plan portable across agent contexts. Trigger-indexed in Conductor.md
Strategies table. Pattern 4: Install-Phase-Decomposition-To-Bands (STRUCTURAL, Diamond B-2).

### Upgrade B-2-3 — SB-S39 Specification Promotion (STUB → REAL)

SB-S39 Skill.md body promoted from STUB (stderr.write placeholder) to REAL specification.
Suite 8 spec is complete as of B-2. src/ dispatch handler remains stub (stderr.write)
until Diamond B-6 Apex. Two-tier promotion documented in SB-S39 Skill.md body.

**Version**: `0.21.0 → 0.21.1` (patch — Suite 8 docs only; no src/ behavior change) ·
CD-5 PASS (20th consecutive, C through B-2)

**Forward — Diamond B-3**: StartSession script + Register script + UserPromptSubmit hook.
First src/ Diamond in the B-cascade.

---

## Diamond B-1 Architectural Additions (Diamond B-1 · v6.0)

Diamond B-1 introduces **Cascades/-presence-driven conditional top menu** — the bridge's first personality switch based on filesystem detection at boot time. When `Cascades/` is absent (fresh project), a third synthetic sentinel `SYNTHETIC_INSTALL` joins `SYNTHETIC_NEW` and `SYNTHETIC_CLOSE`; the Install row appears first with default cursor selection. Existing users (Cascades/ present) see no change.

### Feature B1-1 — Cascades-Presence-Driven Top Menu Reordering (SB-S39 STUB)

`animatedTui.ts` probes `existsSync(join(process.cwd(), 'Cascades'))` once at startup; result cached as `cascadesPresent` boolean in `MenuState`. When `cascadesPresent === false`: HEAD renders the Install row (`⊕ Install SCS-Bridge`, Viridian color) above `⊕ New Session`; cursor default-selects `SYNTHETIC_INSTALL`. Render order: Install → New Session → sessions (paginated body) → Close Bridge. When `cascadesPresent === true`: identical to prior behavior (New Session as HEAD, Close Bridge as TAIL).

New `KeyAction`: `'install-selected'` — dispatched on Enter when cursor is on `SYNTHETIC_INSTALL`. Stub handler: `process.stderr.write('[scs] Install action — full implementation in Diamond B-6\n')`.

**Pattern 4 preserved**: detection uses only `existsSync` metadata on user's own `process.cwd()` — bridge-owned territory; no Claude content read. **Backward compat**: Cascades/ presence restores prior behavior bit-for-bit.

**SB-S39 STUB NOTE**: Full installation orchestration (Strategy/ directory, Conductor config, clone + scaffold) arrives in Diamond B-2 (Cycle 24). Diamond B-1 ships only the conditional UI surface and dispatch stub.

**Version**: `0.20.0 → 0.21.0` · 457/457 tests · build 90 KB · CD-5 PASS (19th consecutive, C through B-1) · CD-23 candidate: *Conditional Bridge Bootmode Diameter* (bridge personality switches based on filesystem detection at boot time; future personalities — dev-mode, demo-mode — compose into the same Diameter; promotable post-Diamond-B-1 user-Lambda smoke).

**Forward — Diamond B-2**: Direct config upgrades to Conductor (Strategy/ directory introduction). SB-S39 receives full implementation. Suite 8 SCS Bridge becomes Conductor-class.

---

## Diamond R Architectural Additions (Diamond R · v5.9)

Diamond R addresses two issues from Diamond Q smoke: (1) cosmetic — the literal `01DISCOVER` 10-char prefix wastes column space across all auto-discovered rows; (2) severe — line-wrap render glitch causing phantom Close Bridge + footer stacking when row-width exceeds terminal width.

### Fix R-1 — Synthesized-Aware ULID Column Substitution (SB-S37)

`formatSessionRow` (viewport path) and `renderMenuLegacy` (legacy path) check `entry.synthesizedAt !== undefined`: when truthy, the ULID column emits `claudeSessionId.slice(0, 10)` (the meaningful Claude-issued UUID prefix) instead of `id.slice(0, 10)` (which produces the repetitive `01DISCOVER` literal for ALL synthesized rows). Spawned entries continue to render the meaningful ULID prefix unchanged.

### Fix R-2 — ANSI-Aware Line-Width Clip-And-Pad Discipline (SB-S38)

New helpers in `menu.ts`: `stripAnsiCodes`, `visibleLength`, `clipAndPadToWidth`. ANSI_REGEX matches CSI (`\x1b\[...`), OSC (`\x1b\]...\x07`), and standalone-ESC sequences for visible-character counting; clip preserves ANSI codes within the clipped portion AND appends trailing reset codes defensively (selection highlight survives clip). Every emitted line in `renderMenu` (header, status, HEAD, body row, TAIL, footer) AND `renderMenuLegacy` is wrapped via `clipAndPadToWidth(line, termWidth)`. Generalizes Diamond P Fix P-3 (body slot pad-to-clear) from body-only to UNIVERSAL pad-to-clear-AND-clip discipline.

**cwdMaxWidth tightened**: `Math.max(20, termWidth - 89)` → `Math.max(15, termWidth - 92)`. Combined with explicit `padEnd(cwdMaxWidth)` on cwd column, row width is now deterministic (56 + 15 + 2 + L). At termWidth=80: L=6 → 79 (1-char margin); L=8 ("just now") → 81 → clipped by clipAndPadToWidth to 80.

**Failing mode addressed**: rows previously overflowed termWidth by 2-4 chars when relativeTime was 7-8 chars ("11h ago", "just now"); terminal wrapped trailing chars; phantom prefix on next emitted line; multiple Close Bridge + duplicate footer hint accumulated.

**Version**: `0.19.0 → 0.20.0` · 438/438 tests · build 85 KB · CD-5 PASS (18th consecutive, C through R) · CD-19 candidate: *Render-Time Termwidth Invariant Diameter* (every emitted line is exactly termWidth chars after ANSI-aware visible counting; promotable post-Diamond-R user smoke).

---

## Cross-References

- **Teal Claude Conductor**: Dispatch source for SCS Bridge maintenance
- **Cascade System CLI** (`scs bridge`): The CLI this Suite 8 documents
- **Diamond D**: Will activate Queue → Informative delivery (SB-S2, SB-S3 go live)
- **CD-5 Stratidian Base-Informative Audit**: All 7 patterns verified clean at Diamond C

---

## Persistent Menu Substrate (Diamond D)

`scs bridge` (no subcommand) enters a long-running TUI menu — the **Persistent Bridge Menu Substrate** through which the user composes many independent Claude Informatives. The menu auto-spawns the first session if registry empty (**Default-Spawn-First Boot Invariant**); navigates via arrow keys (**Arrow-Key Cascade-Primitive Menu**); refreshes live as new sessions register (**Live Registry Subscription via Filesystem Polling**); preserves cursor selection by ULID identity across registry changes (**Cursor-by-Identity Refresh Stability**); and self-closes via `q`/`Esc` while leaving spawned Informatives running (**Self-Closing Base Process**). Bridge becomes the **Co-Development Substrate** — foundation on which future Diamonds compose tools (archive viewer, search, message routing, ...).

**Mid-cycle enhancements (Diamond D)**: Session validity is probed non-destructively via `~/.claude/projects/<encoded-cwd>/<uuid>.jsonl` mtime against a 5h Claude lifetime threshold (**Session Validity Filesystem Mtime Probe**). Arrow-navigable synthetic rows **⊕ New Session** and **× Close Bridge** compose into the session list (**Synthetic-Row Cursor Composition**). Launched sessions display a 7-char validity column (`alive`/`expired`/`unknown`); allocated sessions (no UUID yet) display `---` (**Orthogonal Status-Validity Column Separation**).

**Co-Development Journey Trajectory**: Diamond D establishes the substrate only. Each future Diamond (E, F, …) adds one tool or capability that composes into this substrate without replacing it.

**Forward Note — Orphan-UUID (Diamond E)**: `--session-id <uuid>` is an intent declaration — Claude only persists JSONL when it self-assigns the UUID. Bridge-allocated UUIDs may produce sessions whose JSONL never appears in `~/.claude/projects/`. Diamond E resolves this via a SessionStart hook bundled in `--settings` (merge with user-global verified by A/B test), dropping `--session-id` pre-assignment and capturing Claude's real UUID via hook stdin.

---

## High-Fidelity Animated TUI Wrapper (Diamond F · v4.0)

The SCS Bridge CLI ships a full-screen animated TUI as its default invocation mode. Running bare `scs` (no subcommand) launches the wrapper. The pre-existing `scs bridge menu` static menu is preserved unchanged; the animated TUI is the new default.

**Architecture** — `src/lib/tui/` is a 9-module composable substrate:

| Module | Responsibility |
|---|---|
| `terminalCaps.ts` | Terminal capability detection (truecolor / unicode / cols / rows) |
| `colors.ts` | HSL→RGB · ANSI escape generation (truecolor + 256-color fallback) · Suite color palette |
| `grid.ts` | Adaptive 2D `Cell[][]` matrix · color-tracking serialization |
| `overlay.ts` | `Map<"y,x", OverlayCell>` composition layer |
| `modes.ts` | 6 Stratidian Demometer-vocabulary mode functions |
| `bridgeStateFeed.ts` | Live `Cascades/Cascade.json` + `~/.scs-bridge/sessions.json` watcher with rolling event buffer (cap=5) |
| `animatedTui.ts` | Lifecycle orchestrator — frame loop · keypress dispatch · alt-buffer entry/exit · cleanExit |
| `index.ts` | Barrel exports |

**Two-pane vertical layout** — top animation canvas (≈50% of available rows) + 1-row divider + bottom session menu (`renderMenu` reused from `bridge/menu.ts` non-invasively). 30 FPS `setInterval` frame loop with re-entrancy guard (synchronous frame body; boolean lock cleared in `finally`).

**Stratidian Vocabulary Modes** (6 modes × 7 seconds = 42-second full cycle):
- **CASCADE** — 8 Suite color bands flowing diagonally
- **DIAMETER** — circle outline + rotating chord between two angular-velocity-mismatched endpoints
- **DEMOMETER** — rotating octagon with Suite-colored edges
- **MUXAMETER** — 6 pulsing nodes with skip-1 connections (`r_node = Math.min(cols * 0.3, rows * 0.6)`)
- **STRATIDIA** — Archimedean spiral sweeping hue progressively
- **SUITE-WHEEL** — 8-spoke rotating wheel; each spoke Suite-colored

**Live Bridge State Overlay** — boot-up text composed onto the animation canvas: `SCS BRIDGE` title, current mode name, `cycle N · DIAMOND-X`, `N session(s) registered`, most-recent registry event. Read every 500ms via `fs.watchFile`; rolling buffer cap = 5 events.

**Horizontal-Scroll Session Viewport** — `MenuState.columnOffset` field (default 0) plus ←/h decrement and →/l increment keypress cases. Default rendering when `columnOffset === 0` is bit-identical to v3.x (non-regression invariant verified by snapshot test).

**Lifecycle** — `\x1b[?1049h` alt-buffer enter + `\x1b[?25l` cursor hide on start; `q` / `Esc` / `Ctrl+C` / `SIGINT` / `SIGTERM` / `SIGHUP` route through `cleanExit` which restores `\x1b[?25h` + `\x1b[?1049l` then `process.exit(0)`. Resize handler reads `process.stdout.columns/rows` on next frame (no separate redraw).

**Diameter Map** — `animatedTui.ts ↔ modes.ts` (frame dispatch); `animatedTui.ts ↔ overlay.ts` (compose); `animatedTui.ts ↔ bridgeStateFeed.ts` (snapshot read); `animatedTui.ts ↔ bridge/menu.ts` (renderMenu + applyKeypress, NON-INVASIVE). Circular `animatedTui.ts → bridge/menu.ts` is structural (shared MenuState pattern), not recursive.

---

## Head/Body/Tail Pagination with 5-State Validity (Diamond H · v4.2)

Diamond G's Cursor-Tracking Minimal-Shift Viewport was structurally inverted in Diamond H into a **Head/Body/Tail (HBT) Pane Composition** with **page-jump body navigation** and **fixed synthetic edges**. Diamond H additionally extends Diamond D's `sessionValidity.ts` to a **5-state model** with a 3KB JSONL size threshold for empty-detection. Together: HEAD (`⊕ New Session`, Viridian color) is pinned to the top; TAIL (`× Close Bridge`, Rose color) is pinned to the bottom; BODY shows one *page* of sessions per keypress; Left/Right jump between pages; Up/Down navigate page-bounded HEAD ↔ body rows ↔ TAIL.

**Render Branch Contract** (Diamond H):

| Branch | Predicate | Output |
|---|---|---|
| Legacy | `termHeight === 0 \|\| undefined` | `renderMenuLegacy(state)` — Diamond D/E/F/G backward compat |
| Too-Small | `1 <= termHeight < MIN_TERM_HEIGHT (6)` | `[terminal too small for menu]` padded to termHeight |
| HBT | `termHeight >= MIN_TERM_HEIGHT` | header(2) + HEAD(1) + body(termHeight-5) + TAIL(1) + footer(1) padded to termHeight |

**Layout Math**: `RESERVED_LINES = 5` (header(2) + HEAD(1) + TAIL(1) + footer(1)); `visibleBodySlots = termHeight - 5`; `MIN_TERM_HEIGHT = 6`. The line-count invariant `output.split('\n').length === termHeight` holds for any session count when `termHeight >= 6`.

**MenuState State Model**: DROP Diamond G `viewportTop` and Diamond F `columnOffset`; ADD `currentPage?: number` (default 0). `clampCurrentPage(page, totalPages)` keeps the page index in valid range; `getBodyPageSessions(sessions, currentPage, visibleBodySlots)` slices the body for the active page.

**Page-Jump Keybinding Composition**:

| Key | Action | Behavior |
|---|---|---|
| `←` / `h` / `PgUp` / `b` | `page-left` | `currentPage = max(0, page - 1)`; cursor preserved on HEAD/TAIL else first body row of new page |
| `→` / `l` / `PgDn` / `f` | `page-right` | `currentPage = min(maxPage, page + 1)`; same |
| `↑` / `k` | `cursor-up` | Page-bounded: HEAD → no-op; first body → HEAD; mid → prev row; TAIL → last body |
| `↓` / `j` | `cursor-down` | Page-bounded: TAIL → no-op; HEAD → first body; mid → next row; last body → TAIL |
| `Home` / `g` | `cursor-home` | `currentPage = 0` + cursor → HEAD |
| `End` / `G` | `cursor-end` | `currentPage = maxPage` + cursor → TAIL |
| `Enter` | (validity-gated) | On ghost/unknown session: stderr message + noop; else `resume-selected` |

**FIX-3 Empty Body Discipline**: when `sessions.length === 0` (or filter result is empty), Up at TAIL → HEAD (skip body); Down at HEAD → TAIL (skip body). HEAD and TAIL remain reachable.

**Color-Differentiated Synthetic Edge Rendering** (FIX-2): HEAD emits `rgbToAnsi(SUITE_COLORS.Viridian, caps)` (RGB 64,130,109); TAIL emits `rgbToAnsi(SUITE_COLORS.Rose, caps)` (RGB 255,102,178). The `rgbToAnsi` from `lib/tui/colors.ts` provides truecolor + 256-color fallback so Terminal.app degrades gracefully.

**5-State Session Validity** (`sessionValidity.ts` v4.2):
- `'ghost'` — `claudeSessionId` is undefined/empty (registry entry never had hook capture)
- `'unknown'` — UUID present but JSONL absent at expected `~/.claude/projects/<encoded>/<uuid>.jsonl`
- `'empty'` — JSONL exists, size < `EMPTY_SIZE_THRESHOLD` (3072 bytes / 3KB; FIX-1 strict `<`)
- `'expired'` — JSONL exists, size ≥ 3KB, mtime > 5h ago
- `'alive'` — JSONL exists, size ≥ 3KB, mtime within 5h

3KB threshold sourced from Amethyst Vermillion WebSearch empirical bound between empty-or-near-empty Claude JSONL files and JSONL with at least one conversation turn. Pattern 4 *Opaque Informative State* preserved: `statSync.size` is filesystem METADATA, not Claude session content. Bridge does NOT open or read JSONL contents.

**Filter-on-Read** (SB-S13): `filterGhostsOlderThan(sessions, 5min)` removes ghost entries older than 5 minutes from menu rendering; ghosts younger than 5min are kept (hook may still fire). Ghost entries are never deleted from disk — manual archival is preserved as user-initiated.

**Pre-Launch Validity Probe** (SB-S13): in the `'return'` keypress handler, when the cursor is on a real session row, `checkSessionValidity` is invoked synchronously. Ghost or unknown sessions block resume with a stderr message (`[scs] cannot resume session <id> (<state>); skipping`) and return a `noop` action. Race window is negligible (statSync between probe and launchInformative).

**FIX-4 Per-Row Validity Column**: `formatSessionRow` displays the 5-state validity per session row in a 7-character column between status and cwd. Session rows now read: `<indicator> <ulid10>  <uuid8>  <status>  <validity>  <cwd>  <relative-time>`.

**Pane-Aware Render Contract** (cross-tool invariant): any future Suite 8 tool composing into the bottom pane MUST honor `state.termHeight` line-count invariant. Layer-1 invariant test in `animatedTui.test.ts` codifies this for the SCS Bridge baseline tool — extension tools (archive viewer, search filter, message routing) inherit this contract.

**Backward Compat Guard** — `renderMenuLegacy` preserves Diamond D/E/F/G render path verbatim; bare `scs bridge menu` invocation does not pass `termHeight` into MenuState, so the legacy branch fires. All prior validity tests continue to pass; 21 sessionValidity tests + 101 menu tests cover the new + existing surface.

---

## Registry-As-Source-Of-Truth (Diamond I · v5.0)

Diamond I closes the last violation of Pattern 4 *Opaque Informative State* by removing all filesystem-probing of Claude-owned state and elevating the registry to the sole source of session liveness truth. The 5-state validity model (Diamond H, `sessionValidity.ts`) — which read `~/.claude/projects/<encoded>/<uuid>.jsonl` filesystem metadata — is **structurally retired**. In its place: `process.ppid` capture in the SessionStart hook (the parent PID of the hook process IS Claude's actual PID) plus a 2-second liveness tick that probes via `process.kill(claudePid, 0)` (kernel signal-0 existence check, not a kill). Dead PIDs and aged-out pending entries are removed from the registry; the menu derives a 2-state STATE column ('pending' → no claudePid yet · 'alive' → hook fired and PID confirmed live) directly from registry presence.

**Pattern 4 Graduates to Structural Law** — Bridge code now reads ONLY: registry I/O (own state) + kernel-mediated PID existence (system metadata). Zero code paths read `~/.claude/projects/`. The structural law is grep-verifiable: `grep -rn "claude/projects\|sessionValidity" src/ | grep -v ".test.ts"` returns zero matches in production code. This is not aspirational discipline — it is geometrically locked.

**Architectural Delta**:

| Concern | Diamond H (v4.2) | Diamond I (v5.0) |
|---|---|---|
| Liveness signal | filesystem stat of `~/.claude/projects/<uuid>.jsonl` (size + mtime) | `process.kill(claudePid, 0)` on registry-tracked PID |
| State model | 5-state (`alive`/`expired`/`empty`/`unknown`/`ghost`) | 2-state (`pending`/`alive`) |
| Truth source | sessionValidity.ts derived from filesystem | registry IS the truth (liveness tick sweeps dead/stale) |
| Pre-launch gate | Enter blocked on ghost/unknown via stderr message | none — orphans never reach the menu (already swept) |
| Pattern 4 status | guideline | structural law (grep-verifiable) |

**PID Capture Site**: `sessionStartHook.ts` reads `process.ppid` between stdin parse and registry update. `process.ppid` is the parent process of the hook = the Claude CLI process that spawned it. This is the only architectural place this PID is observable from inside Claude's lifecycle.

**Registry Field**: `RegistryEntry.claudePid?: number` and `SessionMeta.claudePid?: number` (Onyx field on registry; meta.json mirrors). `updateSessionLiveIdentity(sessionId, claudeSessionId, claudePid?)` (renamed from `updateSessionClaudeSessionId`) writes both ID and PID atomically.

**Liveness Tick Loop** (`liveness.ts` + `animatedTui.ts`):
- `LIVENESS_TICK_MS = 2000` — interval matches user-perceived "immediate"
- `STALE_AGE_MS = 5 * 60 * 1000` — pending entries older than 5min without PID = stale (hook never fired)
- `probeLivenessTick(sessions, nowMs?, staleAgeMs?)` returns `{ aliveIds, deadIds, staleIds }`
- `setInterval(2000, () => { listSessions → probeLivenessTick → for each dead+stale: removeSession })`
- Sequential `await removeSession(id)` — registry tmp+rename is atomic; race-free for typical session counts
- `clearInterval(livenessInterval)` in `cleanExit` BEFORE `unwatchFile(registryPath())`

**First-Tick Transparency Log** (FIX-3): when ≥5 pre-Diamond-I orphan entries are removed on the very first tick after upgrade, `[scs] cleaned up N pre-Diamond-I orphan entries` is written to stderr. Migration grace for users with accumulated stale registry entries.

**Menu Simplification** (`menu.ts`):
- `import { checkSessionValidity, type SessionValidity }` REMOVED
- `MenuRow.session` carries `state: SessionState` ('pending' | 'alive') instead of `validity: SessionValidity`
- `deriveSessionState(entry)` exported — the canonical 2-state derivation: `entry.claudePid !== undefined ? 'alive' : 'pending'`
- `filterGhostsOlderThan` REMOVED — registry already swept by liveness tick; no need to filter on read
- `GHOST_FILTER_AGE_MS` constant REMOVED
- Pre-launch validity probe in `'return'` keypress REMOVED — orphans never make it to the menu
- STATE column header replaces VALIDITY column header in row formatter

**Files Deleted**:
- `src/lib/bridge/sessionValidity.ts` (was 8 imports, 5-state probe)
- `src/lib/bridge/sessionValidity.test.ts` (was 21 tests)

**File Created**:
- `src/lib/bridge/liveness.ts` (~50 lines, pure functions: `isPidAlive`, `probeLivenessTick`)
- `src/lib/bridge/liveness.test.ts` (~110 lines, ~10 unit tests with `process.kill` spied)

**Diameter Map (Diamond I)**:
- `liveness.ts ↔ animatedTui.ts` — pure-function probe consumed by `setInterval` loop; loop owns the side effect (`removeSession`)
- `liveness.ts ↔ registry.ts` — only via `removeSession`; liveness module never reads registry directly
- `sessionStartHook.ts ↔ registry.ts` — `updateSessionLiveIdentity(ulid, claudeSessionId, process.ppid)`; the PID-capture point of the entire architecture
- `menu.ts ↔ registry.ts` — `state.sessions` IS the truth; no intermediate filter
- `menu.ts ↗ sessionValidity` — DIAMETER ELIMINATED

**Cross-Tool Composition Invariant**: future Suite 8 tools composing into the menu MUST derive session state from registry presence (`deriveSessionState(entry)`); MUST NOT re-introduce filesystem-probing of Claude-owned state. Pattern 4 is now grep-verifiable architectural law.


---

## Blank Session Filter — Pattern 4 Modulation (Diamond L · v5.3)

Diamond L introduces filesystem-metadata-only validation: `src/lib/bridge/sessionPersistence.ts` provides `hasPersistedSession(cwd, claudeSessionId)` answering whether Claude wrote a non-empty JSONL via `existsSync` + `statSync.size`. The animatedTui liveness tick now appends a third reconciliation pass after Diamond K's offline + stale-pending passes: entries with `claudeSessionId` set, age past 60s grace, and no JSONL persisted are removed. `liveness.ts` (`probeLivenessTick`) remains pure — the impurity-helper composition lives in the caller.

**The architectural shift**: Pattern 4 (SB-S15) is preserved in spirit, evolved in letter. existsSync + statSync are now permitted scoped to the blank-filter use case; readFileSync + JSON.parse against `.claude/projects` remain prohibited. The Wave 14 grep gate is refined accordingly:

```bash
grep -rn "readFileSync.*claude/projects\|JSON.parse.*claude/projects" src/ | grep -v ".test.ts"
```

→ ZERO matches expected in production code. SB-S20 names this modulation explicitly; SB-S19 is its implementation.

**Liveness tick composition** (after Diamond L):
1. `probeLivenessTick` returns `{aliveIds, offlineIds, staleIds}` — pure, kernel-signal-based
2. `offlineIds → markSessionOffline` — preserve row; status flip
3. `staleIds → removeSession` — purge ghost (no-hook orphans aged past 5min)
4. **Diamond L** blank-filter loop — entries with `claudeSessionId` set, age past 60s grace, no offline/stale dedupe collision, no JSONL persisted → `removeSession` with `reason: 'unpersisted'`
5. `liveness.tick` log payload now `{aliveCount, offlineCount, staleCount, blankCount}`

**Why grace window matters**: 60 seconds from `spawnedAt`. Long enough for a slow claude startup to write its first line; short enough that a user closing the spawn-confirmation dialog without typing sees the row disappear within reasonable time. The 0-byte threshold (`BLANK_SIZE_THRESHOLD_BYTES`) is v1's most permissive setting — any non-empty file counts as a real session. If false-positive blank removals are observed, tighten to e.g. 3072 bytes (Diamond H heuristic).

---

## Diamond M Architectural Additions (Diamond M · v5.4)

Diamond M muxifies three architectural improvements addressing distinct registry-truth failure modes surfaced by user-smoke after Diamond L. The three fixes compose: phantom-eviction prevents stale rows; mutex prevents lost rows; auto-discovery surfaces missing rows.

### Fix M-1 — Post-SessionEnd Persistence Check (Phantom Eviction)

When the SessionEnd hook fires, `sessionEndHook.ts` immediately checks `hasPersistedSession(cwd, claudeSessionId)` BEFORE deciding to mark offline or remove. If NOT persisted → `removeSession(ulid)` (phantom evicted at exit, row disappears immediately). If persisted → `markSessionOffline(ulid)` (Diamond K behavior preserved). The Diamond L reactive sweep (60s grace, blank-filter loop) is UNCHANGED — still backstops `kill -9` / OS-crash exits where SessionEnd hook did not fire. Grace window unchanged at 60s.

### Fix M-2 — Async Write-Chain Mutex for Registry Mutations (Atomicity)

All mutating operations on `registry.ts` (`addSession`, `updateSessionLiveIdentity`, `removeSession`, `markSessionOffline`) now serialize via a module-level Promise chain: `let writeChain: Promise<void> = Promise.resolve(); // each mutation appends to chain`. Every mutation awaits the previous before its own load-modify-write cycle. No deadlock possible — each link is independently awaitable and unidirectional. Invariant documented: cross-process mutex is out of scope (single-bridge-process assumption). `registry.write` debug-log event emitted per mutation with `{op, ulid, queueDepth}`.

### Fix M-3 — Projects-Dir Auto-Discovery (Visibility)

New function `discoverPersistedSessions(cwd: string): Promise<RegistryEntry[]>` in `sessionPersistence.ts`. Reads the encoded projects directory for the current cwd; filters for JSONLs > `BLANK_SIZE_THRESHOLD_BYTES` (15KB threshold for Diamond M); synthesizes registry entries for any JSONL not already in the registry. Synthesized fields: `ulid: '01DISCOVERED' + sortable-timestamp`, `status: 'offline'`, `claudeSessionId` from filename, `cwd` from `process.cwd()`, `spawnedAt` from JSONL mtime, `claudePid: undefined`. Called once at startup (after Startup Validation Pass); not periodic. Pattern 4 preserved — readdir + statSync metadata only, no JSONL content read. `discovery.scan { cwd, foundJsonls, discoveredCount }` debug-log event.

**Liveness tick composition** (after Diamond M):
1. `probeLivenessTick` returns `{aliveIds, offlineIds, staleIds}` — pure, kernel-signal-based
2. `offlineIds → markSessionOffline` (w/ M-1 persistence check in SessionEnd hook fast path)
3. `staleIds → removeSession` — purge ghost (no-hook orphans aged past 5min)
4. Blank-filter loop (Diamond L) — entries with `claudeSessionId` set, age past 60s grace, no JSONL persisted → `removeSession {reason: 'unpersisted'}`

**Version**: `0.14.0 → 0.15.0`. Skills added: SB-S21, SB-S22, SB-S23. CD-5 streak: 13 (C through M). 367/367 tests.

---

## Diamond N Architectural Additions (Diamond N · v5.5)

Diamond N muxifies five surface fixes resolving the 12-stage user-Lambda smoke trace from Diamond M. The goal: *invalidated sessions reliably removed from the menu.* Four independent invalidation channels now compose (PID-death + hook-fire + mtime-advance + manual x-key) promoting CD-14 to the Quartet.

### Fix N-A — Synthesized-Entry Removal-Path Exemption via synthesizedAt Guard

Entries with `synthesizedAt` set are exempt from both invalidation paths that target age-based removal. `liveness.ts:probeLivenessTick` routes such entries to `aliveIds` regardless of age (no stale-pending sweep). `animatedTui.ts` blank-filter skips them via `if (s.synthesizedAt !== undefined) continue`. Auto-discovered sessions persist indefinitely as offline rows until user manually removes via `x`-key (Fix N-D3). Removes two of the three failure modes surfaced by the 12-stage smoke.

### Fix N-B — Registry-First Resume Identity Lookup

`manager.ts:launchInformative` now consults `listSessions()` for `claudeSessionId` BEFORE calling `loadSessionMeta()`. Auto-discovered ULIDs (no meta.json on disk) resume successfully because their `claudeSessionId` is already in the registry row. `loadSessionMeta` is still called for `cwd`/`terminalCommand`/`launchedAt` fields when available — backward compat for non-synthesized entries preserved.

### Fix N-C — Spawn-Settings Filesystem-Resident Env-Prefix Injection

`spawnSettings.ts:buildSpawnSettings` prepends `SCS_BRIDGE_DEBUG=1` to BOTH `commandStart` and `commandEnd` env-prefix strings when `isDebugEnabled()` returns true. Hook subprocesses receive the debug flag through Claude Code's env-sanitization barrier. `hook.fire` events now appear in `~/.scs-bridge/debug.log` — the JSONL evidence channel is complete.

### Fix N-D2 — Mtime-Advance Orphan Detection (Passive Signal)

New export `getJsonlMtime(cwd, claudeSessionId): number | null` in `sessionPersistence.ts` (statSync.mtimeMs; Pattern 4 Modulation fourth channel). `animatedTui.ts` liveness tick maintains `mtimeTracker: Map<string, {mtimeMs, firstSeenMs}>`. If `claudePid` is alive AND JSONL mtime has not advanced for `ORPHAN_DETECTION_MS = 90_000` (90s) → `markSessionOffline(ulid)`. Tracker cleaned on every state-change path. **Trade-off note**: idle-but-alive sessions exceeding 90s without JSONL writes transition to offline; can be re-resumed via Enter or removed via `x`.

### Fix N-D3 — User-Driven Forced Eviction Escape Valve via x-Key

`menu.ts` adds `'x'` keypress dispatching new `remove-selected` `KeyAction`. `removeSession(ulid)` is idempotent and JSONL-safe (registry-only mutation). Synthetic `SYNTHETIC_NEW`/`SYNTHETIC_CLOSE` sentinels protected. Footer hint updated. Provides manual escape valve for any pathological state the auto-detection channels miss.

**Liveness tick composition** (after Diamond N):
1. synthesizedAt guard (Fix N-A) — route to aliveIds, skip all removal passes
2. `probeLivenessTick` returns `{aliveIds, offlineIds, staleIds}` — pure, kernel-signal-based
3. `offlineIds → markSessionOffline` (Diamond K)
4. `staleIds → removeSession` — purge ghost (no-hook orphans aged past 5min)
5. Blank-filter loop (Diamond L) — non-synthesized; age past 60s grace; no JSONL persisted → `removeSession {reason: 'unpersisted'}`
6. mtime-advance orphan check (Fix N-D2) — alive PID + frozen mtime 90s → `markSessionOffline`

**Version**: `0.15.0 → 0.16.0`. Skills added: SB-S24, SB-S25, SB-S26, SB-S27, SB-S28. CD-5 streak: 14 (C through N). 391/391 tests (+24). CD-15 candidate: *Multi-Channel Invalidation Quartet* (hook + PID-death + blank-filter + mtime-freeze).
