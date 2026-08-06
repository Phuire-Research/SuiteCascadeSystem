/**
 * scsBridge Type Definitions · Cycle 139 · CPPP Wiring
 *
 * Migration source: scpDockHost.type.ts (Phase B.5 · Cycle 133). The Tier-2 nested
 * container scpDockHost is being promoted/renamed to top-level scsBridge as part
 * of the CPPP rewire. Types `ConnectedScpEntry`, `ScpDockHostLogEntry`, and
 * `OpenedTabEntry` are copied verbatim with scpDockHost-prefixed names preserved
 * (decoupling — scsBridge OWNS them now; scpDockHost dir is deleted).
 *
 * Citation: SUITE-3-YELLOW-CYCLE-139-CPPP-WIRING-BLUEPRINT.md §3 + §5 Step 1
 * Citation: M63 Copy-Paste-Plus
 */

import type { Action, Concept, PrincipleFunction, Quality } from 'stratimux';

// ────────────────────────────────────────────────
// CONCEPT NAME
// ────────────────────────────────────────────────

export const scsBridgeName = 'scsBridge';

// ────────────────────────────────────────────────
// LOG ENTRY TYPE
// ────────────────────────────────────────────────

export type ScpDockHostLogEntry = {
  logEntry: string;
  timestamp: number;
};

// ────────────────────────────────────────────────
// CONNECTED SCP ENTRY (NDIP)
// ────────────────────────────────────────────────

export type ConnectedScpEntry = {
  scpName: string;
  dockedAt: number;
  lastDockedAt: number;
  scpPort: number;
  logEndpoint: string;
  status: 'active';
};

export type Suite8RegistrationEntry = {
  suite8Name: string;
  scpName: string;
  registeredAt: number;
};

// ────────────────────────────────────────────────
// OPENED TAB ENTRY (Cross-Platform Browser Tab)
// ────────────────────────────────────────────────

export type OpenedTabEntry = {
  openedAt: number;
  logEndpoint: string;
  platform: 'macos' | 'linux' | 'windows' | 'wsl' | 'electron';
  opener: string;
};

// ────────────────────────────────────────────────
// STATE
// ────────────────────────────────────────────────

export type ScsBridgeState = {
  userCwd: string;
  startedAt: number;
  connectedScps: Record<string, ConnectedScpEntry>;
  logBuffers: Record<string, ScpDockHostLogEntry[]>;
  suite8Registrations: Record<string, Suite8RegistrationEntry>;
  openedBrowserTabs: Record<string, OpenedTabEntry>;
  // MASF · MCP-Active-Scp-Filter · SAWSR-D2.A Rung 1 Cycle 152
  // Set by BMTI Activate Quality (scsBridgeActivateScpSession) when MCP-driven
  // activation fires · M17 closure in animatedTui mirrors to menuState.activeScpFilter
  // (MTAM · MCP-Tui-Activate-Mirror). Closes gap where MCP Activate launched SCP
  // but TUI did not surface PSM Active Display (per Cycle 152 S7 Fuchsia Tier 0).
  // Non-optional per Stratimuxian Scholar S13 (state-design discipline · no optionals).
  activeScpFromMcp: string | undefined;
  // ────────────────────────────────────────────────
  // SBMRQ · Synchronous Blocking Message Relay Queue · MVP-RC3 D1
  // ────────────────────────────────────────────────
  // SBMRQ · Holds PRE-BUILT relay Actions (NOT descriptors). The RQPOAD drain
  // Principle FIRES the head Action when unblocked; the fired relay Quality's
  // OWN Reducer sets relayBlocked=true AND shifts the head (block+dequeue in one
  // synchronous return). Parity: webSocketClient.actionQue / appendActionQue.
  messageRelayQue: Action[];
  // RBGF · Relay-Blocked Gate Flag. true while a relay Quality's async Method
  // runs (the structural one-at-a-time serializer). Each relay Quality's Reducer
  // sets true; scsBridgeRelayUnblock (fired from the Method's finally) clears it.
  // Default false (H1 safe-init — a stuck block never survives muxium re-init).
  relayBlocked: boolean;
};

export const createScsBridgeState = (userCwd: string): ScsBridgeState => ({
  userCwd,
  startedAt: 0,
  connectedScps: {},
  logBuffers: {},
  suite8Registrations: {},
  openedBrowserTabs: {},
  activeScpFromMcp: undefined,
  messageRelayQue: [],      // SBMRQ safe-init (empty queue)
  relayBlocked: false,      // RBGF safe-init (H1: never starts blocked)
});

// ────────────────────────────────────────────────
// QUALITY PAYLOAD TYPES
// ────────────────────────────────────────────────

export type ScsBridgeRegisterScpPayload = {
  scpName: string;
  scpPort: number;
  logEndpoint: string;
  dockedAt: number;
  status: 'active';
};

export type ScsBridgeUnregisterScpPayload = {
  scpName: string;
  unregisteredAt: number;
  reason: 'lifecycle' | 'admin' | 'teardown' | 'unknown';
};

export type ScsBridgePublishLogsPayload = {
  scpName: string;
  logEntry: string;
  timestamp: number;
};

export type ScsBridgeOpenBrowserTabPayload = {
  scpName: string;
  logEndpoint: string;
};

export type ScsBridgeLaunchScpPayload = {
  scpName: string;
};

// MB-W2 · install_scp MCP tool payload. designation = the new SCP name (required).
// sourcePath / sourceUrl = MB-W1 foreign-source arms (both optional · mutually
// exclusive · sourceUrl WINS if both set). Neither → bundled-template install.
export type ScsBridgeInstallScpPayload = {
  designation: string;
  sourcePath?: string;
  sourceUrl?: string;
  // C822 D2 · the SCP Manifest (RD-SCP-MANIFEST v1 · raw JSON string): when present the
  // install is COMMIT-LOCKED — validated strictly, then the sourceUrl clone checks out
  // manifest.commit.hash (never HEAD). REQUIRES sourceUrl.
  manifestJson?: string;
};

// ────────────────────────────────────────────────
// BMTI Payload Types · SAWSR-D2.A · Cycle 150
// Menu-Action-SCP-Namespace (MASN) Quality payloads. Each MASN MCP tool
// dispatches into one of these narrow Qualities (Option B granularity ·
// per Stratimuxian Scholar S10 verbose-naming + S8 muxified-tier-2 doctrine).
// callerSessionUlid carried through ALL BMTI payloads → spawn env →
// SessionStart hook → SCSER backward Arc registers caller to SCP scope.
// ────────────────────────────────────────────────

export type ScsBridgeActivateScpSessionPayload = {
  scpName: string;
  callerSessionUlid?: string;
};

// SES · THE STOP RAIL (C632 · Exit ability) · scp_stop MCP tool payload. Stops a
// named LIVE SCP: closes its window (CSSP close-by-id + same-process
// BrowserWindow), drives the FSM dying→gone via scpSpawnManagerKillRequested
// (SIGTERM the dedicated server · handle→pid→port fallback), and writes status
// 'pending'. RECOVERABLE — Spawn re-boots; no destructive worktree removal.
export type ScsBridgeStopScpPayload = {
  scpName: string;
  callerSessionUlid?: string;
};

// MD-ARC+C · SARC · scp_archive MCP tool payload. Archives a STOPPED SCP: the
// vault move (Cascades/scps/<name>/ → .archive/<name>/) + the ledger mutation +
// the retirement teardown. REFUSED live (3A: stop first) · WAPF-branched on
// worktrees (H1 needs force=Path B anor retire-first · H2 redirects to retire).
// ACK-OD: the durable products are the SCPs.json ledger + the sink log.
export type ScsBridgeArchiveScpPayload = {
  scpName: string;
  // Path B consent (H1 owner): move + `git worktree repair` from the vault.
  force?: boolean;
  callerSessionUlid?: string;
};

// MD-ARC+C · SRST · scp_reinstate MCP tool payload. Moves the vault entry back
// to its original seat + restores the ledger row to scps[] at status 'pending'.
export type ScsBridgeReinstateScpPayload = {
  scpName: string;
  callerSessionUlid?: string;
};

// MD-ARC+C · Wave 7 · SDEL · scp_delete MCP tool payload. PERMANENT rm of an SCP
// package dir + ledger removal (scps[] anor archivedScps[]). fromArchive selects
// the vault seat (.archive/<name>) vs the installed seat (scps/<name>). REFUSED
// system/template · live (stop first) · owner-with-instances (retire first). The
// destructive sibling of scp_archive (which is reversible via scp_reinstate).
export type ScsBridgeDeleteScpPayload = {
  scpName: string;
  // Select the vault seat (Cascades/scps/.archive/<name>) instead of the installed
  // seat — set true when deleting an already-archived SCP.
  fromArchive?: boolean;
  callerSessionUlid?: string;
};

export type ScsBridgeLaunchScpRuntimePayload = {
  scpName: string;
  callerSessionUlid?: string;
};

// TTVS · null payload = spawn without specific SCP binding (Template SCP / All SCP default). Manager.createSession handles null fine (Wave-1 evidence). Cite: D3D-HOTFIX-2-R4-GREEN-AUDIT.md Angle 6.
export type ScsBridgeSpawnNewScpSessionPayload = {
  scpName: string | null;
  // MD-9 · D-MC-1 · Per-Instance Model Control · optional spawn-time model (a full
  // AVAILABLE_MODELS id · src/shared/modelCatalog.model.ts). Validated via isAvailableModel
  // in the Method; valid → setSessionModel records it on the entry; absent/invalid → warn
  // + proceed WITHOUT recording (the session rides the global default · spawn NEVER breaks).
  model?: string;
  callerSessionUlid?: string;
};

// C1-D2 · SBST · SCS-Bridge Spawn Tool · Cadmium Researcher Epoch Macro C1
// Payload for the scs_spawn_suite8_session MCP tool handler. Sibling to CMIA-Spawn
// (scsBridgeSpawnNewScpSession); the Method calls setSessionSuite8Name(ulid, suite8Name)
// BEFORE spawnElectronSessionForUlid so cli-handler `case 'open-session'` reads a
// POPULATED entry.suite8Name when it composes the Base→Dock→Instance prompt (LINCHPIN
// ordering — a swap silently spawns a mis-identified General Agent).
// suite8Name (NDEP) is the literal dir name under Cascades/8_SUITES/.
export type ScsBridgeSpawnSuite8SessionPayload = {
  suite8Name: string;        // NDEP: literal dir name under Cascades/8_SUITES/
  scpName?: string | null;   // optional SCP binding (null = Template SCP default)
  // SBST asWorker · true = NON-anchor research worker spawn. The async body SKIPS the existingAnchor
  // anti-flood guard AND claimAnchorIfUnclaimed so a fresh worker ALWAYS registers (the worker still
  // gets suite8Name so awaitNewLaunchedWorker matches + status becomes 'launched'). Omit/false =
  // anchor/PPOL path (anti-flood + auto-anchor preserved · a duplicate-anchor relay race is blocked).
  asWorker?: boolean;
  // MD-9 · D-MC-1 · Per-Instance Model Control · optional spawn-time model (a full
  // AVAILABLE_MODELS id). Same guard as the SCP-spawn payload: valid → setSessionModel
  // records it after setSessionSuite8Name; absent/invalid → warn + global default.
  model?: string;
  // C386 · THE FRESH FLAG · Per-Actualization Forge semantics. true = a NEW conduction that
  // never resumes a prior one. When fresh===true AND the liveness-aware anchor branch resolves
  // OFFLINE, the quality does NOT re-engage the dead anchor (the C385 offline→re-engage is right
  // for ordinary anchors, WRONG for the Forge's Engage) — it falls through to the CREATE leg +
  // RE-CLAIMS the anchor onto the NEW session (setSessionAnchor · reassign-one-per-suite8Name;
  // the dead prior keeps its history, loses the claim). The ALIVE branch is unchanged (skip — the
  // client focuses instead). The ABSENT branch is unchanged. Omit/false = the C385 behavior exactly.
  fresh?: boolean;
  // D-UP · THE MANUAL-MODE SEVER · asWorker fused two semantics: the fresh-worker spawn
  // (skip anti-flood — repeat dispatches always register) AND the WAPM auto-permission
  // marker (setSessionWorker → spawn-settings defaultMode='acceptEdits'). manualMode=true
  // keeps the FIRST and severs the SECOND: the session boots with the approval gate INTACT
  // (user-controlled — the Gitm Resolver's update law) and gains the registry standBy marker
  // so the presenter paints the Stand By overlay while the directive delivery is pending.
  // Only meaningful alongside asWorker=true; ignored on the anchor path.
  manualMode?: boolean;
  // RS.2b · THE COMBINED INITIAL ENTRY · the per-run directive (an SCS:Vermillion
  // anchor built by the CALLER at spawn time — parameters are spawn-derivable, so
  // waiting for a post-boot typed delivery was the C285 interleave class). Persisted
  // onto the registry entry (setSessionInitialDirective) BEFORE spawn; cli-handler's
  // open-session appends it to the Onboard seed as ONE initial positional prompt.
  // When present, the standBy overlay arm is SKIPPED (no pending delivery to wait on).
  initialDirective?: string;
  // THE ONBOARD OPTION · true by DEFAULT (omit = the current behavior: the Onboard seed
  // rides an anchor spawn's initial prompt). false = suppress the Onboard placement —
  // persisted as entry.suppressOnboard so cli-handler skips the seed compose (the
  // initialDirective, when present, then rides ALONE as the initial entry). The Session
  // Manager spawns with the default; false is for callers supplying their own seed.
  onboard?: boolean;
  // THE PLAIN-SPAWN LANE (the Spawn-Lane Contract) · true by DEFAULT (omit = the anchor
  // lane: liveness guard + claim/re-engage/durable-binding — the page/Shatterite Menu
  // door). false = a PLAIN instance: the ENTIRE anchor machinery is skipped (no
  // anti-flood, no claim, no re-engage) while the approval gate stays intact (no worker
  // marker). The Session Manager's default Suite 8 spawn is this lane (anchor:false +
  // onboard:false) — anchoring belongs to the Shatterite Menu system first.
  anchor?: boolean;
  // EF-3′ · THE TARGET S8 THREAD · the Suite 8 PAGE this spawn is commissioned to formalize
  // (the engaging page's own designation). Persisted onto the registry entry
  // (setSessionTargetSuite8Name · the initialDirective rail) — the field-agnostic relay
  // carries it to clients for the per-page Previous Conductions filter.
  targetSuite8Name?: string;
  callerSessionUlid?: string;
};

// D3D · CMIA-Engage · Cycle 163 R0
// Payload for the scp_engage_session MCP tool handler. Sibling to CMIA-Spawn
// (scsBridgeSpawnNewScpSession); calls launchInformative(sessionId, 'resume')
// via the SAME shared manager.ts function as the TUI handleResume path at
// animatedTui.ts:L1109. Shared-function discipline (SFDS) maintained for engage.
// Citation: D3D-ARCHITECTURE-R3A-YELLOW-SHARED-FUNCTION-VERIFICATION.md §4
export type ScsBridgeEngageSessionPayload = {
  sessionId: string;
  callerSessionUlid?: string;
};

// D3RM-E · CMIA-Focus · MAFF (MCP-Agnostic-Focus-Functionality)
// Payload for the scp_focus_session MCP tool handler. Sibling to CMIA-Engage;
// brings the target session's Terminal.app window to front via the shared
// focusTerminalWindow primitive (ASFP) in osTerminal.ts. macOS-only; non-darwin
// no-ops gracefully (HAZARD-D). Side-effect-only operation — no state mutation.
// Citation: D3RM-E-FOUNDATION-R7-FUCHSIA-CLINICAL.md §5 Wave 3
export type ScsBridgeFocusSessionPayload = {
  sessionId: string;
  callerSessionUlid?: string;
};

// D3RM-G · CHAT · PCBW (Pending-Chat-Batch-Write)
// Payload for the scp_chat_session MCP tool handler. Resolves the target
// session, writes message body to ~/.claude/pending-chat/{ulid}.txt (UIMJ
// queue · keyed by ULID for hook subprocess resolution), and ACKs HTTP 200.
// The CHMH Stop hook (asyncRewake) reads the queue file at the next turn-end
// in the target session and injects via process.stdout.write + exit(2).
// Side-effect-only operation — no state mutation. Atomic tmp→rename write
// per sessionStartHook.ts precedent.
// Citation: D3RM-G-FOUNDATION-R7-FUCHSIA-CLINICAL.md §5 Wave 2
// Citation: D3RM-G-FOUNDATION-R6-PURPLE-ORCHESTRATION.md §1 Research Q5
export type ScsBridgeChatSessionPayload = {
  sessionId: string;
  message: string;
  callerSessionUlid?: string;
};

// RM-D4 · SNDF/DUAL · scsBridgeRenameSession payload. MCP tool 'scp_rename_session'.
// IDTND: sessionId is the ULID lookup key (never routed/mutated); name is the
// display-only SNDF value (empty/whitespace → field delete via setSessionDisplayName).
// Citation: RM-D4-R3-WIRING-ARCHITECTURE.md §1.3
export type ScsBridgeRenameSessionPayload = {
  sessionId: string;
  name: string;
};

// A-D3b · ARFSP · scsBridgeSetSessionAnchor payload. MCP tool 'scs_set_anchor_session'.
// Manual "fragment then correct" Anchor reassignment: sessionId is the ULID of the
// session to become the page's Anchor for its suite8Name scope. setSessionAnchor
// (registry.ts · A-D1) sets isAnchor=true on this entry and clears isAnchor on every
// OTHER entry sharing the same suite8Name (≤1 anchor per Suite 8). No-ops if the
// session has no suite8Name scope. ACK-only · the saveRegistry json-watcher relays
// the isAnchor change to all surfaces (SCP grid Anchor column).
// Citation: registry.ts setSessionAnchor (A-D1) · ScsBridgeSessionManagement Anchor cell (A-D2)
export type ScsBridgeSetSessionAnchorPayload = {
  sessionId: string;
  callerSessionUlid?: string;
};

// SAC.1 · ARFSP · scsBridgeUnsetSessionAnchor payload. MCP tool 'scs_unset_anchor_session'.
// Manual "release the Anchor" leg: sessionId is the ULID of the session to release from
// its suite8Name page Anchor. unsetSessionAnchor (registry.ts · SAC.1) clears isAnchor on
// ONLY this entry (no scope-clear loop — releasing one anchor cannot open a two-anchor
// window). No-ops if the session is not currently anchored. ACK-only · the saveRegistry
// json-watcher relays the isAnchor change to all surfaces (SCP grid Anchor column).
// Faithful mirror of ScsBridgeSetSessionAnchorPayload.
// Citation: registry.ts unsetSessionAnchor (SAC.1) · SAC-WGB.md § ◆ SAC.1
export type ScsBridgeUnsetSessionAnchorPayload = {
  sessionId: string;
  callerSessionUlid?: string;
};

// SAC.3 · scsBridgeSetAnchorConfig payload. MCP tool 'scs_set_anchor_config'. Keyed by
// suite8Name (NDEP · the literal Cascades/Extended/<name>/ dir Name · NOT a session ULID).
// The Method writes Cascades/Extended/<suite8Name>/anchor.override.json = { autoAnchor } (the
// USER OVERRIDE leg · the menu.json DEFAULT is READ-ONLY here · only the Anchor writes menu.json).
// ACK-only · the override write IS the Lambda. claimAnchorIfUnclaimed reads the resolved config
// on the next spawn (a page set autoAnchor:false does NOT auto-stamp). Sibling write-class to
// the un-anchor leg but keyed by page, not session.
// Citation: SAC-WGB.md § ◆ SAC.3 · anchorConfig.model.ts (resolveAnchorOverridePath)
export type ScsBridgeSetAnchorConfigPayload = {
  suite8Name: string;
  autoAnchor: boolean;
  callerSessionUlid?: string;
};

// SAC.3 · scsBridgeResetAnchorConfig payload. MCP tool 'scs_reset_anchor_config'. Keyed by
// suite8Name (NDEP). The Method DELETES Cascades/Extended/<suite8Name>/anchor.override.json so
// the page falls back to the menu-creator default (menu.anchorConfig.autoAnchor ?? system default
// true). No-ops gracefully when no override file exists (AFPR). ACK-only · the delete IS the Lambda.
// Faithful sibling of ScsBridgeSetAnchorConfigPayload minus the autoAnchor value.
// Citation: SAC-WGB.md § ◆ SAC.3 · anchorConfig.model.ts (resolveAnchorOverridePath)
export type ScsBridgeResetAnchorConfigPayload = {
  suite8Name: string;
  callerSessionUlid?: string;
};

// VS · DSST · scsBridgeDissipateSession payload. MCP tool 'scs_dissipate_session'.
// Invoked by the spawned researcher itself as its final Vermillion step. Closes out
// the ephemeral non-anchor session by removing it from the Session Manager registry
// (dissipateSession · registry.ts · S4 H2 anchor-guarded — NEVER dissipates the page
// Anchor). sessionId is the ULID lookup key (never routed/mutated). ACK-only · the
// json-watcher relays the removal to all surfaces (SCP grid drops the entry).
// Citation: EPOCH-DIAMOND §6 Macro VS DSST · EPOCH-SR-S4-GREEN-SCULPT.md H2
export type ScsBridgeDissipateSessionPayload = {
  sessionId: string;
  callerSessionUlid?: string;
};

// CWDC · scsBridgeCloseWaitDissipate payload. MCP tool 'scs_close_wait_dissipate'.
// Invoked by the spawned researcher itself as its FINAL Vermillion step (frontier/worker
// path) with its OWN session ULID. Composes the existing primitives: CLOSE (graceful pty
// teardown via the `kill` CSSP verb) → WAIT (bounded) → DISSIPATE (dissipateSession ·
// registry removal + .jsonl delete · S4 H2 anchor-guarded) → SDTC (session-dir rmdir ·
// the deferred Session-Dir-Teardown-Closure). sessionId is the ULID lookup key (never
// routed/mutated). ACK-only. Anchor-guarded by the inner dissipateSession (NEVER the
// page Anchor). Sibling to ScsBridgeDissipateSessionPayload — same {sessionId} shape.
// Citation: registry.ts dissipateSession · electronSessionSpawn.ts killElectronSessionForUlid
export type ScsBridgeCloseWaitDissipatePayload = {
  sessionId: string;
  callerSessionUlid?: string;
};

// ARST · scsBridgeArchiveSession payload. MCP tool 'scs_archive_session'. Sibling to
// DSST — but archives (moves) the real ClaudeCode session into Cascades/Archive/YYYY/MM/DD/
// (archiveSession · registry.ts · S4 H2 anchor-guarded — NEVER archives the page Anchor)
// THEN removes the entry from sessions.json. RSAR: absent real session → sessions.json-only
// removal (resilient). sessionId is the ULID lookup key (never routed/mutated). ACK-only.
// Citation: DISSOLUTION-ARCHIVAL-DIAMOND-WGB.md §2 ARST · §4 Wave 2
export type ScsBridgeArchiveSessionPayload = {
  sessionId: string;
  callerSessionUlid?: string;
};

// VS · VSDT · scsBridgeDeliverVermillion payload. MCP tool 'scs_deliver_vermillion'.
// Invoked by the ORCHESTRATOR (CadmiumBulletin trigger via controller) to hand a
// research worker its Vermillion (plan text + create+actualize-Planned-Query command).
// Delivered as a 'SCS:Vermillion' first-line SORD message (mirrors the SCS:Aspect
// first-line contract) over the SAME live-keystroke transport send_message uses
// (dispatchFkisMessage · EVRC origin discovery). sessionId is the target ULID; the
// vermillion body is opaque text typed into the target session. ACK-only.
// Citation: EPOCH-DIAMOND §6 Macro VS VSDT · scsBridgeSendMessage (transport sibling)
export type ScsBridgeDeliverVermillionPayload = {
  sessionId: string;
  vermillion: string;
  // Per-SCP-Identity-Config · FKIS Origin · ENV-FIRST, payload-fallback (parity with
  // ScsBridgeSendMessagePayload). UI-reachable (triggerDeliverVermillion · GitmSubPage) →
  // the controller carries the SCP's OWN name from GET /scp-config where the shared workspace
  // bridge muxium has no per-SCP env. Env stays authoritative for agents/dev:self.
  originScpName?: string;
};

// D3 FKIS · Focused-Keyed-Input-Streaming · scsBridgeSendMessage payload.
// MCP tool 'send_message' · live keystroke streaming (NOT UIMJ queue).
// originScpName resolved ENV-FIRST server-side from process.env.SCS_BRIDGE_ORIGIN_SCP
// anor SCS_BRIDGE_SCP_NAME (EVRC pattern · agents/dev:self stay server-authoritative &
// unspoofable). The optional originScpName field ONLY fills the UI-send gap where no env
// exists: the shared workspace bridge muxium (port 7111) boots before any SCP is chosen
// and serves multiple boundScps — it has no per-send env, so the UI controller carries the
// origin from the SCP's OWN scp.config.json (Per-SCP-Identity-Config · GET /scp-config).
// Citation: DIAMOND-3-FKIS-S3-OCHRE-BLUEPRINT.md §E
export type ScsBridgeSendMessagePayload = {
  targetUlid: string;
  text: string;
  originScpName?: string;
};

// S8P-SCP-TOOL · scsBridgeSuite8PageCreate payload. MCP tool 'suite8_page_create'.
// Binds runSuite8PageCreate (SVLF model) as an SCP-side tool: the calling SCP supplies
// its own name as `designation` (FKIS payload-supplied pattern · registry-guarded); the
// bridge runs the concept create + AIME wiring + gate chain FOR that SCP. name (PascalCase
// Suite8Name) + displayName (the exact spaced dir name) are required; designation (the
// caller SCP name · validated against Cascades/SCPs.json) required; home/force optional.
// projectRoot is NOT a payload field — it resolves server-side to the bridge daemon's
// userCwd (the workspace root where SCPs.json lives). The MCP arguments object IS this
// payload (scpToolManifold qualityEmitter[qualityName](params)) — all fields JSON-safe.
export type ScsBridgeSuite8PageCreatePayload = {
  name: string;         // PascalCase Suite8Name (the --name argv)
  displayName: string;  // the EXACT Cascades/8_SUITES/{name}/ dir name (spaced)
  designation: string;  // the calling SCP's name (validated against SCPs.json · FKIS origin)
  home?: boolean;       // claim the home route (SSBLF · default false)
  force?: boolean;      // S8ERI re-run override (default false)
};

// SCSER intake Quality payload · SAWSR-D2.B Cycle 153
// Bridge-side intake for SCP-side SCSER Strategy HTTP callback.
// Debounced Method (createMethodDebounceWithConcepts · 500ms per user-author
// Stratimux guidance) collapses rapid re-callback into single registry write.
export type ScsBridgeBindCallerSessionToScpPayload = {
  callerSessionUlid: string;
  scpName: string;
};

// PP-D2 · Ping Pong Liveness Diameter · PPLD · Cycle 160
// Payload for the bridge_ping_pong MCP tool handler. clientId echoes back via
// pongReceipt; timestamp enables RTT measurement (PPCT). Stateless Quality —
// nullReducer + filesystem-as-Bidirectional-Bridge write (Option β).
// Citation: PPLD-DIAMOND-2-WAVE2-OCHRE-A-SCS-BRIDGE-BLUEPRINT.md §5 + §6
export type ScsBridgePingPongPayload = {
  clientId: string;
  timestamp: number;
};

// DIAGNOSTIC-REENGAGED R2 · TSPK · scs_persist_last_turn (BATCH)
// Payload for the scs_persist_last_turn MCP tool handler. Single-Writer last-turn
// persistence — the CLI loops extract+write each listed session's last assistant
// turn into sessions.json in ONE chainWrite transaction. sessionIds is a rolled-up
// array (the SCP transcript-watcher coalesces N per-session triggers into one
// batched POST). Side-effect-only Quality · ACK-only · no state mutation.
// Citation: DIAGNOSTIC-REENGAGED-R2-LASTTURN-MCP-S6-COMPOSITION-VALIDATION.md §A.3
export type ScsBridgePersistLastTurnPayload = {
  sessionIds: string[];
  callerSessionUlid?: string;
};

// ASDR · BWRF · scsBridgeFocusUrlWindow payload. MCP tool 'scs_focus_bridge_window'.
// Invoked by the SPAWNED ANCHOR ITSELF (the page-bound Cadmium session) during its
// Onboard routine to bring the SCS-Bridge UI window to the foreground so the user
// sees the Shatterite Menu it just authored. The target URL is resolved SERVER-SIDE
// (EVRC-style): from process.env.SCS_BRIDGE_ORIGIN_SCP anor SCS_BRIDGE_SCP_NAME →
// bridge.json boundScps[scp].browserUrl (the exact EWHM/urlWindowMap key). Optional
// `url` overrides the server-side resolution when the caller knows the exact window
// URL. Caller does NOT normally supply the URL. Side-effect-only Quality.
// Citation: ANCHOR-SELF-DIRECTION-ROUTINE-WGB.md §7 W1 · ASDR-S1-RED-CURATION C5
// W3.5 (C781) · scsBridgeFocusSuite8Page payload · scp_focus_suite8_page MCP tool. The
// Installation Agent focuses the SCP window AND navigates it to the NEW Suite 8 page
// (?island=<camel(suite8Name)>) after the proven mint — S9 post-scaffold step (c).
export type ScsBridgeFocusSuite8PagePayload = {
  suite8Name: string;
  // C791 · FOCUS TRUTH · the caller (the Installation Agent) names the SCP it was just
  // working on + the S8 it just drafted; by-name resolution needs no body-dir probe (the
  // freshly minted page exists but the S8 body dir may not yet — the old owner-probe found
  // nothing → silent no-op). When present, resolution is by NAME (boundScps key anor SCPs.json).
  scpName?: string;
};

// C785 · scsBridgeAlertTurnOver payload · scp_alert_turn_over MCP tool. THE STALE-SERVER
// CURE: alerts the USER to perform Turn Over A on the SCP routed by name (writes
// turnOverAlert into that SCP's per-SCP gitm.json + focuses the window). The agent then
// STANDS BY — the user's Turn Over is the sovereign rebuild+restart, and their first
// contact with the build-while-you-use loop.
export type ScsBridgeAlertTurnOverPayload = {
  scpName: string;
  purpose?: string;
};

// C787 · scsBridgeQueryHoldings payload · scp_query_holdings MCP tool. Read-only one-beat
// snapshot of everything the bridge is holding — the cure for port-guessing + idle-watching.
export type ScsBridgeQueryHoldingsPayload = {
  callerSessionUlid?: string;
};

// C853 · scsBridgeInstallProgress payload · scp_install_progress MCP tool. Read-only
// single read of the C839 staged-install sidecar (cloning → installing → ready anor
// failed + reason). scpName = the sibling-family alias for designation.
export type ScsBridgeInstallProgressPayload = {
  designation?: string;
  scpName?: string;
};

export type ScsBridgeFocusUrlWindowPayload = {
  url?: string;
  // M3 · THE FOCUS RECORD SEAM (D-WR C628). The caller's KNOWN SCP name. When present, the by-id
  // path resolves the windowId from THIS record (lookupScpWindowId(scpName)) instead of the env
  // SCS_BRIDGE_ORIGIN_SCP ?? SCS_BRIDGE_SCP_NAME ?? 'template' fallback — the exact fallback that
  // resolved to 'template' and grabbed a stale windowId:1 (the helm/first window) in R7. The
  // /bridge-focus route already knows the row's scpName; threading it here targets the right record.
  scpName?: string;
  callerSessionUlid?: string;
};

// D-N3 · Neon PlayTester · scsBridgeOrchestrateWindow payload. MCP tool
// 'scs_orchestrate_window'. Executes an ATOMIC step sequence against a target
// BrowserWindow via the CSSP round-trip (sendControlRequest → cli-handler
// 'orchestrate-window' → windowOrchestrate executor). WINDOW-GENERAL: the SCP is
// the binding location but terminal session windows are equally targetable — the
// SCS-Bridge is the Grounding Literal Bridge. Target resolution (Electron side):
// windowId → sessionId → scpName → the ACTIVE SCP (bridge.json activeScp).
// Steps: click{selector} · key{key,modifiers?} · js{code · serialized return} ·
// wait{ms} · capture{label?} · probe{} — a sequence holds its timing beats (the
// CGDA arm→confirm) IN Electron main, immune to agent round-trip latency. The
// full per-step result array returns in the tool response (the agent consumer
// reads it; the client-dispatch discipline stays ACK-only per SORD §3).
export type ScsBridgeOrchestrateWindowPayload = {
  target?: { windowId?: number; sessionId?: string; scpName?: string };
  steps: Array<Record<string, unknown>>;
  runId?: string;
  callerSessionUlid?: string;
};

// D-N2 · Neon PlayTester · scsBridgeRenderCapture payload. MCP tool 'scs_render_capture'.
// Captures the target window's CURRENT render to a PNG under Cascades/Bridge/playtests/
// <runId>/. For a shader-wrapped (offscreen) window the STREAMED latest paint frame is
// returned — the render context PRIOR to the shader pass, as it streams — else capturePage
// for flat windows. Same window-general target resolution as scs_orchestrate_window.
export type ScsBridgeRenderCapturePayload = {
  target?: { windowId?: number; sessionId?: string; scpName?: string };
  label?: string;
  runId?: string;
  callerSessionUlid?: string;
};

// ────────────────────────────────────────────────
// SBMRQ · Message Relay Queue Payload Types · MVP-RC3 D1 (Focused-Blocking Core)
// ────────────────────────────────────────────────

// ENQUEUE · scsBridgeRelayEnqueue · appends PRE-BUILT relay Actions to
// messageRelayQue (D1: the queue stores ACTUAL Stratimux Actions, not descriptors).
// Mirror: webSocketClientAppendToActionQue payload { actionQue: AnyAction[] }.
export type ScsBridgeRelayEnqueuePayload = {
  actions: Action[];
};

// FOCUS RELAY · scsBridgeRelayFocus · the queued Focus relay. Reducer blocks +
// dequeues the head; the async Method wraps the proven Focus logic (listSessions
// pre-flight → focusElectronSessionForUlid) with a Promise.race watchdog + a
// finally→relayUnblock so the queue advances on every exit path (H1).
export type ScsBridgeRelayFocusPayload = {
  sessionId: string;
};

// SEND-MESSAGE RELAY · scsBridgeRelaySendMessage · the queued FKIS send relay. Reducer
// blocks + dequeues the head; the async Method wraps the proven FKIS logic (EVRC origin
// resolution → dispatchFkisMessage with { targetUlid: sessionId, text }) inside the same
// Promise.race([relaySequence, deadline]) + finally→relayUnblock backstop as Focus (H1).
// Mirror: scsBridgeRelayFocusPayload shape + the FKIS body of scsBridgeSendMessage.
export type ScsBridgeRelaySendMessagePayload = {
  sessionId: string;
  text: string;
  // C403 · the payload origin lane (scsBridgeSendMessage parity — env ?? env ?? payload).
  // The shared workspace bridge daemon can never carry a per-SCP env; the Cadmium research
  // relay skipped EVERY send for lacking it (relaySend.skipped {hasOrigin:false}).
  originScpName?: string;
};

// RESIZE RELAY · scsBridgeRelayResize · the queued window-resize relay (RRRRQ). Reducer
// blocks + dequeues the head; the async Method wraps the NEW resizeElectronSessionForUlid
// CSSP helper (D2 · scales the BrowserWindow bounds by scalePct) inside the same
// Promise.race + finally→relayUnblock backstop as Focus (H1). scalePct e.g. 1.10 expand,
// 0.909 contract-back (RRRRQ render-reset pair).
export type ScsBridgeRelayResizePayload = {
  sessionId: string;
  scalePct: number;
};

// ENQUEUE-BATCH · scsBridgeEnqueueRelayBatch · MVP-RC3 Build B · the MCP-facing builder.
// Takes JSON-SAFE relay specs (NOT runtime Action[]) — the Method builds the real relay
// Actions server-side via deck.scsBridge.e.scsBridgeRelay<Kind>({...}) then dispatches
// scsBridgeRelayEnqueue({ actions }) via muxiumTimeOut deck-deferral (mirrors relayUnblock).
// kind ∈ {'focus','send','resize'}. The MCP arguments object IS this payload
// (scpToolManifold.strategy.ts qualityEmitter[meta.qualityName](params)), so it MUST be
// JSON-serializable — hence specs, not pre-built Action[].
export type ScsBridgeRelaySpec = {
  kind: 'focus' | 'send' | 'resize' | 'spawn';
  // focus/send/resize target an EXISTING session. The 'spawn' kind (C407 · SQRK) creates
  // its own — sessionId is ignored for spawn (the ULID is born inside the relay body ·
  // ULFK dissolved); suite8Name addresses it instead.
  sessionId: string;
  text?: string;       // send · spawn (the priming Vermillion delivered after launch)
  scalePct?: number;   // resize only
  suite8Name?: string; // spawn only · REQUIRED for spawn
  asWorker?: boolean;  // spawn only · defaults TRUE (anchors ride scsBridgeSpawnSuite8Session)
  model?: string;      // spawn only · per-instance model record (setSessionModel re-guards)
  scpName?: string;    // D-SLE · spawn only · the EFFECTIVE LOCALITY stamp (specified-live
                       // target ?? own citizen) — the batch builder forwards it to
                       // ScsBridgeRelaySpawnPayload.scpName (preferred over the batch origin).
};
export type ScsBridgeEnqueueRelayBatchPayload = {
  specs: ScsBridgeRelaySpec[];
  // C403 · batch-level origin — threaded into every send-kind relay Action so the
  // Focus-Return-Out leg knows which SCP window to restore. Optional: a missing origin
  // downgrades to deliver-without-restore (never drops the message).
  originScpName?: string;
};

// SPAWN RELAY · scsBridgeRelaySpawn · C407 · SQRK — the ASTO in one spec: the relay body
// composes create → LINCHPIN → spawn → the launched gate → the priming awaited to
// CLI-exit, ALL inside one relay block (PKDM 60s · legal via the drain-refresh).
// MISO: N specs, N different suite8Names, one serialized focus channel.
export type ScsBridgeRelaySpawnPayload = {
  suite8Name: string;
  text?: string;          // the priming Vermillion (delivered after the launched gate)
  originScpName?: string; // the focus-return lane (batch-threaded · C403/C404 downgrades apply)
  scpName?: string;       // the C390 birth-stamp lane
  asWorker?: boolean;     // default TRUE
  model?: string;
};
export type ScsBridgeRelaySpawn =
  Quality<ScsBridgeState, ScsBridgeRelaySpawnPayload>;

// UNBLOCK · scsBridgeRelayUnblock · payload-less. Reducer clears relayBlocked.
// Dispatched EXCLUSIVELY from inside a relay Method's finally via relayUnblock
// (muxiumTimeOut deck-deferral) — never from external callers.

// ────────────────────────────────────────────────
// QUALITY TYPES
// ────────────────────────────────────────────────

export type ScsBridgeRegisterScp =
  Quality<ScsBridgeState, ScsBridgeRegisterScpPayload>;

export type ScsBridgeUnregisterScp =
  Quality<ScsBridgeState, ScsBridgeUnregisterScpPayload>;

export type ScsBridgePublishLogs =
  Quality<ScsBridgeState, ScsBridgePublishLogsPayload>;

export type ScsBridgeOpenBrowserTab =
  Quality<ScsBridgeState, ScsBridgeOpenBrowserTabPayload>;

export type ScsBridgeLaunchScp =
  Quality<ScsBridgeState, ScsBridgeLaunchScpPayload>;

// MB-W2 · install_scp MCP tool Quality type.
export type ScsBridgeInstallScp =
  Quality<ScsBridgeState, ScsBridgeInstallScpPayload>;

// BMTI Quality Types · SAWSR-D2.A
export type ScsBridgeActivateScpSession =
  Quality<ScsBridgeState, ScsBridgeActivateScpSessionPayload>;

// SES · THE STOP RAIL (C632) · scp_stop MCP tool Quality type.
export type ScsBridgeStopScp =
  Quality<ScsBridgeState, ScsBridgeStopScpPayload>;

// MD-ARC+C · SARC anor SRST Quality types.
export type ScsBridgeArchiveScp =
  Quality<ScsBridgeState, ScsBridgeArchiveScpPayload>;
export type ScsBridgeReinstateScp =
  Quality<ScsBridgeState, ScsBridgeReinstateScpPayload>;
// MD-ARC+C · Wave 7 · SDEL · scp_delete Quality type (PERMANENT).
export type ScsBridgeDeleteScp =
  Quality<ScsBridgeState, ScsBridgeDeleteScpPayload>;

export type ScsBridgeLaunchScpRuntime =
  Quality<ScsBridgeState, ScsBridgeLaunchScpRuntimePayload>;

export type ScsBridgeSpawnNewScpSession =
  Quality<ScsBridgeState, ScsBridgeSpawnNewScpSessionPayload>;

// C1-D2 · SBST · scsBridgeSpawnSuite8Session · scs_spawn_suite8_session MCP tool.
// Sets entry.suite8Name (NDEP) BEFORE spawn so cli-handler composes Base+Dock+Instance.
export type ScsBridgeSpawnSuite8Session =
  Quality<ScsBridgeState, ScsBridgeSpawnSuite8SessionPayload>;

// D3D · CMIA-Engage · Quality routes scp_engage_session MCP tool to
// launchInformative('resume') — same shared function as TUI handleResume.
export type ScsBridgeEngageSession =
  Quality<ScsBridgeState, ScsBridgeEngageSessionPayload>;

// D3RM-E · CMIA-Focus · MAFF · Quality routes scp_focus_session MCP tool to
// focusTerminalWindow(terminalWindowId) — the ASFP primitive that brings the
// target Terminal.app window to front. SFDS shared with future TUI focus path.
export type ScsBridgeFocusSession =
  Quality<ScsBridgeState, ScsBridgeFocusSessionPayload>;

// D3RM-G · CHAT · PCBW · Quality routes scp_chat_session MCP tool to UIMJ
// queue write (~/.claude/pending-chat/{ulid}.txt · atomic tmp→rename). The
// CHMH Stop hook subprocess (registered via spawn-settings with asyncRewake)
// reads the queue at next turn-end and injects via process.stdout.write +
// process.exit(2). Side-effect-only Quality; no state mutation.
export type ScsBridgeChatSession =
  Quality<ScsBridgeState, ScsBridgeChatSessionPayload>;

// RM-D4 · scsBridgeRenameSession · DUAL Vue-surface write leg onto SNDF. Quality
// routes scp_rename_session MCP tool to setSessionDisplayName(sessionId, name).
// Side-effect-only Quality; no state mutation. IDTND: ULID immutable, name only writes.
export type ScsBridgeRenameSession =
  Quality<ScsBridgeState, ScsBridgeRenameSessionPayload>;

// A-D3b · ARFSP · scsBridgeSetSessionAnchor · "Set as Anchor" reassignment write leg.
// Quality routes scp/set_anchor MCP tool 'scs_set_anchor_session' to
// setSessionAnchor(sessionId). Side-effect-only Quality; no state mutation. The
// registry chainWrite IS the Lambda; the json-watcher relays the isAnchor flip.
export type ScsBridgeSetSessionAnchor =
  Quality<ScsBridgeState, ScsBridgeSetSessionAnchorPayload>;

// SAC.1 · ARFSP · scsBridgeUnsetSessionAnchor · "Release Anchor" un-anchor write leg.
// Quality routes the 'scs_unset_anchor_session' MCP tool to unsetSessionAnchor(sessionId).
// Side-effect-only Quality; no state mutation. The registry chainWrite IS the Lambda; the
// json-watcher relays the isAnchor release. Faithful mirror of ScsBridgeSetSessionAnchor.
export type ScsBridgeUnsetSessionAnchor =
  Quality<ScsBridgeState, ScsBridgeUnsetSessionAnchorPayload>;

// SAC.3 · scsBridgeSetAnchorConfig · "Set Auto-Anchor" write leg (USER OVERRIDE). Quality routes
// the 'scs_set_anchor_config' MCP tool to a writeAnchorOverride(suite8Name, autoAnchor) FS write of
// Cascades/Extended/<suite8Name>/anchor.override.json. Side-effect-only Quality; no state mutation.
// The override write IS the Lambda; resolveAnchorConfig reads it on the next claimAnchorIfUnclaimed.
export type ScsBridgeSetAnchorConfig =
  Quality<ScsBridgeState, ScsBridgeSetAnchorConfigPayload>;

// SAC.3 · scsBridgeResetAnchorConfig · "Reset to Default" write leg. Quality routes the
// 'scs_reset_anchor_config' MCP tool to a deleteAnchorOverride(suite8Name) FS unlink of
// anchor.override.json (page reverts to the menu-creator default). Side-effect-only Quality; no
// state mutation. The delete IS the Lambda. Faithful sibling of ScsBridgeSetAnchorConfig.
export type ScsBridgeResetAnchorConfig =
  Quality<ScsBridgeState, ScsBridgeResetAnchorConfigPayload>;

// VS · DSST · scsBridgeDissipateSession · scs_dissipate_session MCP tool. Quality
// routes to dissipateSession(sessionId) — anchor-guarded registry removal (S4 H2).
// Side-effect-only Quality; no state mutation. The chainWrite IS the Lambda; the
// json-watcher relays the removal. IDTND: ULID immutable, never routed.
export type ScsBridgeDissipateSession =
  Quality<ScsBridgeState, ScsBridgeDissipateSessionPayload>;

// CWDC · scsBridgeCloseWaitDissipate · scs_close_wait_dissipate MCP tool. Quality
// composes killElectronSessionForUlid (graceful CLOSE) → bounded WAIT → dissipateSession
// (DISSIPATE · anchor-guarded registry removal + .jsonl delete · S4 H2) → fsp.rm of
// sessionDir (SDTC · session-dir teardown). Side-effect-only Quality; no state mutation.
// The composed Lambda is the Doer; the json-watcher relays the removal. IDTND: ULID immutable.
export type ScsBridgeCloseWaitDissipate =
  Quality<ScsBridgeState, ScsBridgeCloseWaitDissipatePayload>;

// ARST · scsBridgeArchiveSession · scs_archive_session MCP tool. Quality routes to
// archiveSession(sessionId) — anchor-guarded real-session MOVE → Cascades/Archive
// then registry removal (S4 H2). Side-effect-only Quality; no state mutation. The
// chainWrite IS the Lambda; the json-watcher relays the removal. IDTND: ULID immutable.
export type ScsBridgeArchiveSession =
  Quality<ScsBridgeState, ScsBridgeArchiveSessionPayload>;

// VS · VSDT · scsBridgeDeliverVermillion · scs_deliver_vermillion MCP tool. Quality
// formats text as 'SCS:Vermillion\n<vermillion>' and relays via dispatchFkisMessage
// (same transport as scsBridgeSendMessage · EVRC origin). Side-effect-only Quality;
// no state mutation. The CSSP keystroke relay IS the Lambda.
export type ScsBridgeDeliverVermillion =
  Quality<ScsBridgeState, ScsBridgeDeliverVermillionPayload>;

// D3 FKIS · scsBridgeSendMessage · live keystroke streaming via FORF manifold.
// Quality method invokes CSSP `sendMessage` relay (electronMessageDispatch.ts)
// which crosses process boundary to cli-handler · case 'sendMessage' →
// executeFkis() in messageDispatch.ts. Form-α + ACK-OD (fire-and-forget).
export type ScsBridgeSendMessage =
  Quality<ScsBridgeState, ScsBridgeSendMessagePayload>;

export type ScsBridgeBindCallerSessionToScp =
  Quality<ScsBridgeState, ScsBridgeBindCallerSessionToScpPayload>;

// S8P-SCP-TOOL · scsBridgeSuite8PageCreate · suite8_page_create MCP tool. Quality routes
// to runSuite8PageCreate (SVLF model) with the bridge-resolved projectRoot (userCwd). The
// disk create + AIME wiring + gate chain IS the Lambda; the structured result rides
// strategyData_muxifyData out through the SCP manifold tail. Reducer {} · no state mutation.
export type ScsBridgeSuite8PageCreate =
  Quality<ScsBridgeState, ScsBridgeSuite8PageCreatePayload>;

// PP-D2 · PPLD · stateless Pong handler · nullReducer + bridge.json write
export type ScsBridgePingPong =
  Quality<ScsBridgeState, ScsBridgePingPongPayload>;

// DIAGNOSTIC-REENGAGED R2 · TSPK · scs_persist_last_turn (BATCH) · Quality routes
// the MCP tool to the Single-Writer batch persist (loops extractLastTurnSnippet
// per id · ONE updateSessionTranscriptSnippets transaction). Side-effect-only.
export type ScsBridgePersistLastTurn =
  Quality<ScsBridgeState, ScsBridgePersistLastTurnPayload>;

// ASDR · BWRF · scsBridgeFocusUrlWindow · scs_focus_bridge_window MCP tool. Quality
// resolves the SCS-Bridge UI window URL server-side (EVRC env → bridge.json browserUrl,
// optional `url` override) and fire-and-forget spawns the CSSP `focus-url` verb
// (spawnFocusUrlWindow → cli-handler → focusUrlWindow). Side-effect-only Quality; no
// state mutation. The CSSP focus relay IS the Lambda (brings the existing window to front).
export type ScsBridgeFocusUrlWindow =
  Quality<ScsBridgeState, ScsBridgeFocusUrlWindowPayload>;

// W3.5 (C781) · scsBridgeFocusSuite8Page · scp_focus_suite8_page MCP tool. Side-effect-only:
// resolves the owning SCP + browserUrl + windowId server-side and fires the CSSP
// `focus-suite8-page` verb (navigate + focus). See the quality header for the sequence law.
export type ScsBridgeFocusSuite8Page =
  Quality<ScsBridgeState, ScsBridgeFocusSuite8PagePayload>;

// C785 · scsBridgeAlertTurnOver · scp_alert_turn_over MCP tool. Side-effect-only: the
// per-SCP gitm.json turnOverAlert write + the window focus. See the quality header for
// the self-retiring-alert law.
export type ScsBridgeAlertTurnOver =
  Quality<ScsBridgeState, ScsBridgeAlertTurnOverPayload>;

// C787 · scsBridgeQueryHoldings · scp_query_holdings MCP tool. Sync file-read quality —
// the result rides strategy.data ({holdings}) into the JSON-RPC response (the orchestrate
// return precedent). Never spawns · never awaits · never hangs.
export type ScsBridgeQueryHoldings =
  Quality<ScsBridgeState, ScsBridgeQueryHoldingsPayload>;

// C853 · scsBridgeInstallProgress · scp_install_progress MCP tool. Sync sidecar read —
// the result rides strategy.data ({progress}) into the JSON-RPC response. Never hangs.
export type ScsBridgeInstallProgressQuality =
  Quality<ScsBridgeState, ScsBridgeInstallProgressPayload>;

// D-N3 · Neon PlayTester · scsBridgeOrchestrateWindow · scs_orchestrate_window MCP tool.
// Async quality: awaits the CSSP round-trip (sendControlRequest → cli-handler
// 'orchestrate-window' → windowOrchestrate) and carries the FULL per-step result array
// into strategy.data ({orchestrate}) for the SCP manifold tail to return to the caller.
// No state mutation (reducer {}). The sequence execution in Electron main IS the Lambda.
export type ScsBridgeOrchestrateWindow =
  Quality<ScsBridgeState, ScsBridgeOrchestrateWindowPayload>;

// D-N2 · Neon PlayTester · scsBridgeRenderCapture · scs_render_capture MCP tool. Async
// quality: awaits the CSSP round-trip (cli-handler 'capture-window-render') and carries
// {renderCapture: {ok, path, w, h, bytes, mode:'stream'|'page'}} into strategy.data for
// the SCP manifold tail. No state mutation. The PNG on disk IS the Lambda.
export type ScsBridgeRenderCapture =
  Quality<ScsBridgeState, ScsBridgeRenderCapturePayload>;

// ────────────────────────────────────────────────
// SBMRQ · Message Relay Queue Quality Types · MVP-RC3 D1
// ────────────────────────────────────────────────

// ENQUEUE · scsBridgeRelayEnqueue · pure-append Reducer (refreshAction per item)
// + defaultMethodCreator. Pushes pre-built relay Actions onto messageRelayQue.
export type ScsBridgeRelayEnqueue =
  Quality<ScsBridgeState, ScsBridgeRelayEnqueuePayload>;

// FOCUS RELAY · scsBridgeRelayFocus · block+dequeue Reducer + async Method that
// wraps the proven Focus logic (relaySequence) inside Promise.race([relaySequence,
// deadline(RELAY_BLOCK_MAX_MS)]) with finally→relayUnblock (Halting-Complete).
export type ScsBridgeRelayFocus =
  Quality<ScsBridgeState, ScsBridgeRelayFocusPayload>;

// SEND-MESSAGE RELAY · scsBridgeRelaySendMessage · block+dequeue Reducer + async Method
// that wraps the proven FKIS logic (EVRC origin → dispatchFkisMessage) inside
// Promise.race([relaySequence, deadline(RELAY_BLOCK_MAX_MS)]) + finally→relayUnblock.
export type ScsBridgeRelaySendMessage =
  Quality<ScsBridgeState, ScsBridgeRelaySendMessagePayload>;

// RESIZE RELAY · scsBridgeRelayResize · block+dequeue Reducer + async Method that wraps
// the NEW resizeElectronSessionForUlid (D2 CSSP resize verb) inside
// Promise.race([relaySequence, deadline(RELAY_BLOCK_MAX_MS)]) + finally→relayUnblock.
export type ScsBridgeRelayResize =
  Quality<ScsBridgeState, ScsBridgeRelayResizePayload>;

// UNBLOCK · scsBridgeRelayUnblock · payload-less. Reducer { relayBlocked: false }
// + defaultMethodCreator. Fired from each relay Method's finally via relayUnblock.
export type ScsBridgeRelayUnblock =
  Quality<ScsBridgeState>;

// ENQUEUE-BATCH · scsBridgeEnqueueRelayBatch · MVP-RC3 Build B · the server-side Action
// builder. Reducer () => ({}) (no own-state mutation — the dispatched scsBridgeRelayEnqueue
// mutates messageRelayQue). createMethodWithConcepts Method maps JSON-safe specs → real relay
// Actions → muxiumTimeOut(concepts_, () => deck.scsBridge.e.scsBridgeRelayEnqueue({ actions }), 0).
export type ScsBridgeEnqueueRelayBatch =
  Quality<ScsBridgeState, ScsBridgeEnqueueRelayBatchPayload>;

// RQPOAD · the Relay-Queue Pure-Observer-And-Drainer Principle type alias. Mirrors
// WebSocketServerPrinciple shape (PrincipleFunction<Qualities, Deck, State>). The
// deck is the local Tier-1 base deck { scsBridge: ScsBridgeConcept } — defined
// inline here (NOT imported from scsBridge.concept.ts) to avoid a circular import
// (concept.ts imports this types file). The drainer fires the head Action via
// dispatch and constructs scsBridgeRelayUnblock via d — no muxified deck reach.
export type ScsBridgeRelayQueuePrinciple =
  PrincipleFunction<ScsBridgeQualities, { scsBridge: ScsBridgeConcept }, ScsBridgeState>;

// ────────────────────────────────────────────────
// QUALITY MAP (Explicit · NEVER typeof)
// ────────────────────────────────────────────────

export type ScsBridgeQualities = {
  scsBridgeRegisterScp: ScsBridgeRegisterScp;
  scsBridgeUnregisterScp: ScsBridgeUnregisterScp;
  scsBridgePublishLogs: ScsBridgePublishLogs;
  scsBridgeOpenBrowserTab: ScsBridgeOpenBrowserTab;
  scsBridgeLaunchScp: ScsBridgeLaunchScp;
  // MB-W2 · install_scp MCP tool · install an SCP into the workspace (template / PATH / URL)
  scsBridgeInstallScp: ScsBridgeInstallScp;
  scsBridgeActivateScpSession: ScsBridgeActivateScpSession;
  // SES · THE STOP RAIL (C632) · scp_stop MCP tool · close window + SIGTERM server + FSM + status pending
  scsBridgeStopScp: ScsBridgeStopScp;
  // MD-ARC+C · SARC anor SRST anor SDEL · scp_archive / scp_reinstate / scp_delete
  scsBridgeArchiveScp: ScsBridgeArchiveScp;
  scsBridgeReinstateScp: ScsBridgeReinstateScp;
  // MD-ARC+C · Wave 7 · SDEL · scp_delete MCP tool · PERMANENT rm + ledger removal
  scsBridgeDeleteScp: ScsBridgeDeleteScp;
  scsBridgeLaunchScpRuntime: ScsBridgeLaunchScpRuntime;
  scsBridgeSpawnNewScpSession: ScsBridgeSpawnNewScpSession;
  // C1-D2 · SBST · scs_spawn_suite8_session MCP tool · setSessionSuite8Name BEFORE spawn
  scsBridgeSpawnSuite8Session: ScsBridgeSpawnSuite8Session;
  // D3D · CMIA-Engage · Cycle 163 R0 · scp_engage_session MCP tool
  scsBridgeEngageSession: ScsBridgeEngageSession;
  // D3RM-E · CMIA-Focus · scp_focus_session MCP tool · ASFP primitive caller
  scsBridgeFocusSession: ScsBridgeFocusSession;
  // D3RM-G · CHAT · scp_chat_session MCP tool · PCBW writes UIMJ queue file
  scsBridgeChatSession: ScsBridgeChatSession;
  // RM-D4 · SNDF/DUAL · scp_rename_session MCP tool · TQNI key matches renameSessionMetadata
  scsBridgeRenameSession: ScsBridgeRenameSession;
  // A-D3b · ARFSP · scs_set_anchor_session MCP tool · TQNI key matches setAnchorMetadata
  scsBridgeSetSessionAnchor: ScsBridgeSetSessionAnchor;
  // SAC.1 · ARFSP · scs_unset_anchor_session MCP tool · TQNI key matches unsetAnchorMetadata
  scsBridgeUnsetSessionAnchor: ScsBridgeUnsetSessionAnchor;
  // SAC.3 · scs_set_anchor_config MCP tool · TQNI key matches setAnchorConfigMetadata
  scsBridgeSetAnchorConfig: ScsBridgeSetAnchorConfig;
  // SAC.3 · scs_reset_anchor_config MCP tool · TQNI key matches resetAnchorConfigMetadata
  scsBridgeResetAnchorConfig: ScsBridgeResetAnchorConfig;
  // VS · DSST · scs_dissipate_session MCP tool · TQNI key matches dissipateSessionMetadata
  scsBridgeDissipateSession: ScsBridgeDissipateSession;
  // CWDC · scs_close_wait_dissipate MCP tool · TQNI key matches closeWaitDissipateMetadata
  scsBridgeCloseWaitDissipate: ScsBridgeCloseWaitDissipate;
  // ARST · scs_archive_session MCP tool · TQNI key matches archiveSessionMetadata
  scsBridgeArchiveSession: ScsBridgeArchiveSession;
  // VS · VSDT · scs_deliver_vermillion MCP tool · TQNI key matches deliverVermillionMetadata
  scsBridgeDeliverVermillion: ScsBridgeDeliverVermillion;
  // D3 FKIS · send_message MCP tool · live keystroke streaming via FORF
  scsBridgeSendMessage: ScsBridgeSendMessage;
  scsBridgeBindCallerSessionToScp: ScsBridgeBindCallerSessionToScp;
  // S8P-SCP-TOOL · suite8_page_create MCP tool · TQNI key matches suite8PageCreateMetadata
  scsBridgeSuite8PageCreate: ScsBridgeSuite8PageCreate;
  // PP-D2 · PPLD · MCP tool handler · TQNI invariant key matches pingPongMetadata
  scsBridgePingPong: ScsBridgePingPong;
  // DIAGNOSTIC-REENGAGED R2 · TSPK · scs_persist_last_turn · TQNI key matches persistLastTurnMetadata
  scsBridgePersistLastTurn: ScsBridgePersistLastTurn;
  // ASDR · BWRF · scs_focus_bridge_window MCP tool · TQNI key matches focusUrlWindowMetadata
  scsBridgeFocusUrlWindow: ScsBridgeFocusUrlWindow;
  scsBridgeFocusSuite8Page: ScsBridgeFocusSuite8Page;
  // C785 · scp_alert_turn_over MCP tool · TQNI key matches alertTurnOverMetadata
  scsBridgeAlertTurnOver: ScsBridgeAlertTurnOver;
  // C787 · scp_query_holdings MCP tool · TQNI key matches queryHoldingsMetadata
  scsBridgeQueryHoldings: ScsBridgeQueryHoldings;
  // C853 · scp_install_progress MCP tool · TQNI key matches installProgressMetadata
  scsBridgeInstallProgress: ScsBridgeInstallProgressQuality;
  // D-N3 · Neon PlayTester · scs_orchestrate_window MCP tool · TQNI key matches orchestrateWindowMetadata
  scsBridgeOrchestrateWindow: ScsBridgeOrchestrateWindow;
  // D-N2 · Neon PlayTester · scs_render_capture MCP tool · TQNI key matches renderCaptureMetadata
  scsBridgeRenderCapture: ScsBridgeRenderCapture;
  // SBMRQ · D1 Focused-Blocking Core · message relay queue (enqueue + Focus relay + unblock)
  scsBridgeRelayEnqueue: ScsBridgeRelayEnqueue;
  scsBridgeRelayFocus: ScsBridgeRelayFocus;
  scsBridgeRelayUnblock: ScsBridgeRelayUnblock;
  // SBMRQ · D3 relay set · the remaining messaging means as parallel relay Qualities
  // (send-message · resize) — each block+dequeue + async-wrap + relayUnblock.
  scsBridgeRelaySendMessage: ScsBridgeRelaySendMessage;
  scsBridgeRelayResize: ScsBridgeRelayResize;
  scsBridgeRelaySpawn: ScsBridgeRelaySpawn;
  // MVP-RC3 Build B · ENQUEUE-BATCH · scs_relay_enqueue MCP tool · TQNI key matches
  // scsBridgeEnqueueRelayBatch.quality `type:` literal 'Scs Bridge Enqueue Relay Batch'.
  scsBridgeEnqueueRelayBatch: ScsBridgeEnqueueRelayBatch;
};

export type ScsBridgeConcept = Concept<ScsBridgeState, ScsBridgeQualities>;
