/**
 * scsBridgeScpToolRegistration · Cycle 139 · CPPP Wiring
 *
 * Registers SCS Bridge tools with the SCP base concept on startup. The SCP
 * concept owns the MCP tool registry (toolMetadataRegistry); scsBridge contributes
 * its own bridge-management tools so they are exposed via the /mcp endpoint.
 *
 * Pattern: Outer Plan Context · Tier-1 cross-Concept dispatch via
 *          d.scp.e.scpRegisterToolsWithMetadata. Single dispatch per stage.
 *
 * Tool roster (delegated handlers · manifold execution downstream):
 *   - launch_scp       (actionable · delegates to scpSpawnManager)
 *   - get_scp_logs     (informative · reads scsBridge.logBuffers)
 *   - get_scp_status   (informative · queries scsBridge.connectedScps)
 *   - dock_scp         (actionable · SCP runtime self-registration)
 *
 * Citation: STRATIMUX-REFERENCE.md "🎯 DECK K Constant Pattern"
 * Citation: STRATIMUX-REFERENCE.md "🎯 Critical Planning Context Patterns"
 * Citation: STRATIMUX-REFERENCE.md "🏗️ Muxified Concept Access Patterns"
 * Citation: SUITE-3-YELLOW-CYCLE-139-CPPP-WIRING-BLUEPRINT.md §3
 */

import type { PrincipleFunction, MuxiumDeck } from 'stratimux';
import type { SCPDeck, SCPQualities } from '../../scp/scp.concept';
import type { SCPQualityMetadataRegistered, SCPToolDefinition } from '../../scp/scp.types';
import type { ServerDeck } from '../../server/server.concept';
import type { ScsBridgeState, ScsBridgeQualities } from '../scsBridge.types';
import {
  createGetScpStatusStrategy,
  createGetScpLogsStrategy,
} from '../strategies/scsBridgeReadStrategies';

type ScsBridgePrincipleDeck = MuxiumDeck & SCPDeck & ServerDeck;

const buildToolRoster = (): {
  tools: SCPToolDefinition[];
  metadataRegistry: Record<string, SCPQualityMetadataRegistered>;
} => {
  const now = Date.now();

  // Cycle 140 TQDR · qualityName must match a literal key on scsBridge.e.
  // scsBridgeLaunchScp is a thin Quality that mediates the 1-field MCP tool
  // input ({scpName}) into the 8-field ScpSpawnManagerSpawnRequestedPayload
  // and dispatches via the active scs bridge muxium handle.
  const launchScpMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'scsBridge',
    qualityName: 'scsBridgeLaunchScp',
    toolName: 'launch_scp',
    description: 'LEGACY POC · Launch Additional SCP from external context (backward-compat). DO NOT USE as the default launch — use scp_launch_session_management (composes ALHOC double-bind with Boot Overlay). Retained only for backward-compat with external Claude Code sessions calling the original 1-field POC endpoint.',
    inputSchema: {
      type: 'object',
      properties: {
        scpName: { type: 'string', description: 'SCP name to launch' },
      },
      required: ['scpName'],
    },
    toolType: 'actionable',
    handlerType: 'quality',
    strategyName: '',
    relatedActionables: [],
  };

  // MB-W2 · install_scp · install a NEW SCP into the workspace. TQNI invariant:
  // qualityName 'scsBridgeInstallScp' byte-matches the scsBridge.e key (Cycle 140
  // TQDR · createSCPQualityManifold does qualityEmitter[meta.qualityName] — a mismatch
  // silently no-ops). The Quality reads userCwd (the workspace root) + fire-and-forgets
  // runInstallScpPipelineAsync (ACK-only · non-blocking). Registration lands the new SCP
  // in Cascades/SCPs.json; the roster broadcasts via the next bridge.json write.
  const installScpMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'scsBridge',
    qualityName: 'scsBridgeInstallScp',
    toolName: 'install_scp',
    description:
      'Install a new SCP into the workspace from one of three sources: the BUNDLED TEMPLATE ' +
      '(supply designation only), a LOCAL PATH (sourcePath → a local SCP source directory, ' +
      'copied), or a GIT URL (sourceUrl → a git/file:// URL, cloned). sourcePath and sourceUrl ' +
      'are mutually exclusive — if both are supplied, sourceUrl wins. A foreign source (path/URL) ' +
      'keeps its own package name and may carry its own concepts (the -scp-suffix + concept-absent ' +
      'checks are relaxed for foreign sources), but it must still BE an SCP (src/index.ts + ' +
      'src/main.ts). ACK-only + non-blocking: the tool returns immediately; the install runs async ' +
      'and registers the SCP in Cascades/SCPs.json, then the roster broadcasts via bridge.json. ' +
      'ACK CONTRACT: the call returns {} immediately - the install runs in the background. POLL ' +
      'scp_install_progress { designation } with plain single reads about 15s apart — it walks the ' +
      'staged truth (cloning -> installing -> ready, anor failed WITH the reason); then confirm the ' +
      'registration landed via ONE scp_query_holdings read. progress null after ~30s AND no roster row ' +
      '= the install never started — read Cascades/Bridge/debug.json before re-firing. Do not hand-roll ' +
      'parsing loops and do not hold long foreground timeouts against this call.',
    inputSchema: {
      type: 'object',
      properties: {
        manifestJson: {
          type: 'string',
          description:
            'The SCP Manifest (RD-SCP-MANIFEST v1) as a raw JSON string — makes the install COMMIT-LOCKED: validated strictly (unknown keys reject), then the sourceUrl clone checks out manifest.commit.hash, NEVER HEAD. The safety chain: the registry verifies an anchor, the manifest carries it, the install runs exactly that tree. Requires sourceUrl.',
        },
        designation: { type: 'string', description: 'PascalCase SCP designation for the new install (e.g. MyResearchSCP)' },
        sourcePath: { type: 'string', description: 'Optional local SCP source directory path (copied · foreign source). Mutually exclusive with sourceUrl.' },
        sourceUrl: { type: 'string', description: 'Optional git/file:// URL to clone the SCP source from (foreign source). WINS if sourcePath is also set.' },
      },
      required: ['designation'],
    },
    toolType: 'actionable',
    handlerType: 'quality',
    strategyName: '',
    relatedActionables: ['launch_scp', 'scp_launch_session_management'],
  };

  // Cycle 140 TQDR · informative read route uses Strategy branch
  // (handlerType 'strategy' + strategyCreator). qualityName is intentionally
  // empty — strategy route ignores qualityEmitter lookup; meta.strategyCreator
  // is consulted instead inside createSCPStrategyManifold (HEAD/BODY/TAIL).
  const getScpLogsMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'scsBridge',
    qualityName: '',
    toolName: 'get_scp_logs',
    description: 'Read buffered logs for a registered SCP. Reads scsBridge.logBuffers.',
    inputSchema: {
      type: 'object',
      properties: {
        scpName: { type: 'string', description: 'SCP name to read logs for' },
      },
      required: ['scpName'],
    },
    toolType: 'informative',
    handlerType: 'strategy',
    strategyName: 'getScpLogsStrategy',
    strategyCreator: createGetScpLogsStrategy,
    relatedActionables: ['launch_scp', 'dock_scp'],
  };

  // Cycle 140 TQDR · informative read route uses Strategy branch
  // (handlerType 'strategy' + strategyCreator). qualityName cleared per
  // strategy route convention.
  const getScpStatusMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'scsBridge',
    qualityName: '',
    toolName: 'get_scp_status',
    description: 'DEPRECATED for install/liveness use — this strategy-path read can hang; PREFER scp_query_holdings (the live roster · one beat · socket-probed). Reads scsBridge.connectedScps.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
    toolType: 'informative',
    handlerType: 'strategy',
    strategyName: 'getScpStatusStrategy',
    strategyCreator: createGetScpStatusStrategy,
    relatedActionables: ['launch_scp'],
  };

  // Cycle 140 TQDR · qualityName matches scsBridgeRegisterScp emitter key.
  // dockedAt + status defaults injected at reducer-level (see
  // scsBridgeRegisterScp.quality.huirth.ts) — MCP tool inputSchema supplies
  // only {scpName, scpPort, logEndpoint}; defaults synthesize the rest.
  const dockScpMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'scsBridge',
    qualityName: 'scsBridgeRegisterScp',
    toolName: 'dock_scp',
    description: 'SCP runtime self-registration with the Bridge. Maps to scsBridgeRegisterScp.',
    inputSchema: {
      type: 'object',
      properties: {
        scpName: { type: 'string', description: 'SCP name' },
        scpPort: { type: 'number', description: 'SCP HTTP port' },
        logEndpoint: { type: 'string', description: 'SCP log endpoint URL' },
      },
      required: ['scpName', 'scpPort', 'logEndpoint'],
    },
    toolType: 'actionable',
    handlerType: 'quality',
    strategyName: '',
    relatedActionables: [],
  };

  // BMTI MASN Namespace · SAWSR-D2.A · Cycle 150
  // Menu-Action-SCP-Namespace MCP tools mirror TUI menu actions 1:1.
  // Each maps to a narrow BMTI Quality (Option B granularity per
  // Stratimuxian Scholar S10). Composes ALHOC double-bind path downstream
  // (Cycle 148) AND NSESF scpName propagation (Cycle 149).

  const masnActivateMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'scsBridge',
    qualityName: 'scsBridgeActivateScpSession',
    toolName: 'scp_launch_session_management',
    description: 'PRIMARY · Launch an SCP into Session Management surface · composes ALHOC double-bind (Boot Overlay paint + spawn). Mirrors TUI Enter-on-SCP path. THIS is the default "launch" tool for installed SCPs · use this when user/agent wants to launch and observe an SCP.',
    inputSchema: {
      type: 'object',
      properties: {
        scpName: { type: 'string', description: 'SCP name to launch into session management' },
        callerSessionUlid: { type: 'string', description: 'Caller agent session ULID (for SCSER backward Arc binding · D2.B)' },
      },
      required: ['scpName'],
    },
    toolType: 'actionable',
    handlerType: 'quality',
    strategyName: '',
    relatedActionables: ['scp_launch_runtime_only', 'scp_launch_new_session', 'launch_scp'],
  };

  // SES · THE STOP RAIL · C632 (Helm Exit + Icon Redesign)
  // scp_stop · the honest full-STOP of a named LIVE SCP from the helm's EXIT
  // ability. Composes THREE existing legs (REUSE, not reinvent): (1) close the
  // SCP window (CSSP close-by-id + same-process BrowserWindow) whose `closed`
  // handler cascades surface→pending + SIGTERM + FSM; (2) directly dispatch
  // scpSpawnManagerKillRequested (the 4-branch handle→pid→port fallback +
  // DyingToGone · the ONLY leg that stops a RE-ADOPTED SCP with no window);
  // (3) write persisted status 'pending' (PSSM setScpStatus · durable rest).
  // RECOVERABLE — Spawn re-boots; NO destructive worktree removal. TQNI:
  // qualityName 'scsBridgeStopScp' byte-matches the scsBridge.e emitter key.
  const masnStopScpMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'scsBridge',
    qualityName: 'scsBridgeStopScp',
    toolName: 'scp_stop',
    description: 'Stop a LIVE SCP from the helm (the EXIT ability). Closes the SCP window, SIGTERMs its dedicated server process (handle → state-pid → port fallback, so a re-adopted SCP still stops), drives the lifecycle FSM dying→gone, and writes persisted status "pending". RECOVERABLE — the SCP can be re-launched with scp_launch_session_management; this is NOT a destructive worktree removal. Use to close/stop a running SCP.',
    inputSchema: {
      type: 'object',
      properties: {
        scpName: { type: 'string', description: 'SCP name to stop (must be a LIVE / installed entry in SCPs.json)' },
        callerSessionUlid: { type: 'string', description: 'Caller agent session ULID (optional · diagnostic)' },
      },
      required: ['scpName'],
    },
    toolType: 'actionable',
    handlerType: 'quality',
    strategyName: '',
    relatedActionables: ['scp_launch_session_management', 'launch_scp'],
  };

  const masnLaunchRuntimeMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'scsBridge',
    qualityName: 'scsBridgeLaunchScpRuntime',
    toolName: 'scp_launch_runtime_only',
    description: 'Launch SCP runtime WITHOUT session-management surface · subset of scp_launch_session_management (no Boot Overlay). Use only when explicit narrower scope needed · prefer scp_launch_session_management for default launch.',
    inputSchema: {
      type: 'object',
      properties: {
        scpName: { type: 'string', description: 'SCP name to launch (runtime-only)' },
        callerSessionUlid: { type: 'string', description: 'Caller agent session ULID' },
      },
      required: ['scpName'],
    },
    toolType: 'actionable',
    handlerType: 'quality',
    strategyName: '',
    relatedActionables: ['scp_launch_session_management', 'launch_scp'],
  };

  const masnSpawnNewMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'scsBridge',
    qualityName: 'scsBridgeSpawnNewScpSession',
    toolName: 'scp_launch_new_session',
    description: 'Launch a NEW Claude session bound to an SCP · mirrors TUI [N] from PSM filtered context (NSESF path) · use to spawn an additional session under an already-running SCP scope.',
    inputSchema: {
      type: 'object',
      properties: {
        scpName: { type: 'string', description: 'SCP name to bind new session to' },
        model: { type: 'string', description: 'MD-9 · optional per-instance model id (a full AVAILABLE_MODELS id · e.g. claude-opus-5). Recorded on the entry; resume injects it over the global default. Omit/invalid → the bridge global default.' },
        callerSessionUlid: { type: 'string', description: 'Caller agent session ULID' },
      },
      required: ['scpName'],
    },
    toolType: 'actionable',
    handlerType: 'quality',
    strategyName: '',
    relatedActionables: ['scp_launch_session_management'],
  };

  // C1-D2 · SBST · SCS-Bridge Spawn Tool · Cadmium Researcher Epoch Macro C1
  // Spawns a NEW persistent IDENTIFIED Suite 8 session. Sibling to CMIA-Spawn
  // (scp_launch_new_session) but sets registry suite8Name (NDEP) BEFORE spawn so
  // cli-handler composes the 3-layer Base→Dock→Instance prompt. TQNI invariant:
  // qualityName 'scsBridgeSpawnSuite8Session' byte-matches the scsBridge.e key.
  const masnSpawnSuite8Metadata: SCPQualityMetadataRegistered = {
    conceptName: 'scsBridge',
    qualityName: 'scsBridgeSpawnSuite8Session',
    toolName: 'scs_spawn_suite8_session',
    description: 'C1 SBST · Spawn a new identified Suite 8 ClaudeCode session. Sets registry suite8Name (NDEP) BEFORE spawn so cli-handler composes Base+Dock+Instance.md prompt. Use to create a persistent identified Suite 8 instance. Pass asWorker:true to spawn a NON-anchor research worker (skips the existingAnchor anti-flood guard + auto-anchor so a fresh worker always registers even when an anchor already exists).',
    inputSchema: {
      type: 'object',
      properties: {
        suite8Name: { type: 'string', description: 'Suite 8 name (literal dir under Cascades/8_SUITES/)' },
        scpName: { type: 'string', description: 'C857 · YOUR OWN citizen\'s SCP name — ALWAYS pass it (read your Dock §4 stamp anor GET /scp-config on your page port). Omitting it forces a first-found designation probe: under a designation collision (two installed SCPs carrying the same Suite 8) the worker binds the WRONG citizen, its Dock §4 stamps the wrong root, and its writes land in the wrong Extended. Omit ONLY when no installed SCP owns the designation.' },
        asWorker: { type: 'boolean', description: 'true = NON-anchor research worker spawn (skip existingAnchor anti-flood guard + claimAnchorIfUnclaimed → always a fresh worker). Omit/false = anchor path (anti-flood + auto-anchor preserved).' },
        model: { type: 'string', description: 'MD-9 · optional per-instance model id (a full AVAILABLE_MODELS id · e.g. claude-opus-5). Recorded on the entry; resume injects it over the global default. Omit/invalid → the bridge global default.' },
        fresh: { type: 'boolean', description: 'C386 · Per-Actualization Forge. true = a NEW conduction that never resumes a prior one. When an OFFLINE anchor exists, fresh:true creates a NEW session + re-claims the anchor onto it (the dead prior keeps history, loses the claim) instead of re-engaging the dead anchor. ALIVE anchor branch unchanged (skip). Omit/false = the ordinary offline→re-engage behavior.' },
        manualMode: { type: 'boolean', description: 'D-UP · only meaningful with asWorker:true. true = fresh-worker spawn WITHOUT the auto-permission marker — the session boots with Claude Code\'s approval gate INTACT (user-controlled · the Gitm Resolver update law) and the presenter paints the Stand By overlay until the directive delivery lands. Omit/false = the ordinary worker auto-accept.' },
        initialDirective: { type: 'string', description: 'RS.2b · THE COMBINED INITIAL ENTRY · a per-run SCS:Vermillion directive composed by the caller at spawn time. Appended after the Onboard seed as ONE initial positional prompt — no post-boot typed delivery to race a mid-turn input (the C285 interleave class). When present the standBy overlay arm is skipped (no pending delivery). Prefer this over scs_deliver_vermillion whenever the directive is known at spawn.' },
        onboard: { type: 'boolean', description: 'THE ONBOARD OPTION · true by DEFAULT (omit = the Onboard seed rides an anchor spawn\'s initial prompt — the current behavior). false = suppress the Onboard placement for THIS spawn; the initialDirective (when present) rides alone as the initial entry. For callers supplying their own seed.' },
        anchor: { type: 'boolean', description: 'THE PLAIN-SPAWN LANE · true by DEFAULT (omit = the anchor lane: liveness guard + claim/re-engage — the page/Shatterite Menu door). false = a PLAIN instance: the whole anchor machinery is skipped while the approval gate stays intact. The Session Manager default (anchor:false + onboard:false); anchoring belongs to the Shatterite Menu first.' },
        callerSessionUlid: { type: 'string', description: 'Caller agent session ULID' },
      },
      required: ['suite8Name'],
    },
    toolType: 'actionable',
    handlerType: 'quality',
    strategyName: '',
    relatedActionables: ['scp_launch_new_session', 'scp_launch_session_management'],
  };

  // D3D · CMIA-Engage · Cycle 163 R0
  // Sibling to CMIA-Spawn · Engage existing session by ULID. Mirrors TUI
  // handleResume at animatedTui.ts:L1109 · calls launchInformative('resume')
  // via the SAME shared manager.ts function. SFDS (Shared-Function-Discipline-
  // Satisfied) maintained for engage path. ack-only · state-via-FBB contract.
  const masnEngageSessionMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'scsBridge',
    qualityName: 'scsBridgeEngageSession',
    toolName: 'scp_engage_session',
    description: 'Engage an existing session by sessionId · resumes existing Claude Code conversation via launchInformative(\'resume\') · shared function with TUI handleResume. Requires session to have a claudeSessionId (SessionStart hook must have fired).',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'Session ULID to engage (resume)' },
        callerSessionUlid: { type: 'string', description: 'Caller agent session ULID' },
      },
      required: ['sessionId'],
    },
    toolType: 'actionable',
    handlerType: 'quality',
    strategyName: '',
    relatedActionables: ['scp_launch_new_session', 'scp_launch_session_management'],
  };

  // D3RM-E · CMIA-Focus · MAFF (MCP-Agnostic-Focus-Functionality)
  // Brings a session's Electron BrowserWindow to the foreground via the shared
  // focusElectronSessionForUlid primitive in electronSessionSpawn.ts. D2
  // transition: routes through `open-session <ulid>` CSSP verb (Q2=Option A
  // focus-existing semantics); cross-platform via Electron, no osascript / TCC.
  // SFDS-preserved with TUI hotkey path (Diamond F · animatedTui.ts).
  const masnFocusSessionMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'scsBridge',
    qualityName: 'scsBridgeFocusSession',
    toolName: 'scp_focus_session',
    description: 'Bring an Electron terminal session\'s BrowserWindow to the foreground via the open-session CSSP verb (focus-existing semantics). Cross-platform via Electron; no osascript or TCC dependency. Requires session to be registered in the SRMP (in-process Electron session registry).',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'Session ULID to focus' },
        callerSessionUlid: { type: 'string', description: 'Caller agent session ULID' },
      },
      required: ['sessionId'],
    },
    toolType: 'actionable',
    handlerType: 'quality',
    strategyName: '',
    relatedActionables: ['scp_engage_session'],
  };

  // D3RM-G · CHAT · PCBW (Pending-Chat-Batch-Write) + UIMJ + CHMH
  // Writes a user-authored message to the target session's UIMJ queue file
  // (~/.claude/pending-chat/{ulid}.txt · atomic tmp→rename). The CHMH Stop
  // hook subprocess (registered in spawn-settings with asyncRewake: true)
  // reads the queue at the target session's next turn-end and injects the
  // message via process.stdout.write + process.exit(2) — the only native
  // Claude Code mechanism for autonomous user-context injection.
  // Citation: D3RM-G-FOUNDATION-R7-FUCHSIA-CLINICAL.md §5 Wave 2
  // Citation: D3RM-G-FOUNDATION-R6-PURPLE-ORCHESTRATION.md §4 Canonical Mechanism
  const masnChatSessionMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'scsBridge',
    qualityName: 'scsBridgeChatSession',
    toolName: 'scp_chat_session',
    description: 'D3RM-G CHAT · Send a chat message to a specific Claude session via the UIMJ queue (~/.claude/pending-chat/{ulid}.txt). The CHMH Stop hook reads the queue at the target session\'s next turn-end and injects the message via asyncRewake + exit(2). Single-message overwrite per session in Diamond G; Diamond H extends to multi-message append.',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'Session ULID to chat to' },
        message: { type: 'string', description: 'Message body to inject into the target session at next turn-end' },
        callerSessionUlid: { type: 'string', description: 'Caller agent session ULID' },
      },
      required: ['sessionId', 'message'],
    },
    toolType: 'actionable',
    handlerType: 'quality',
    strategyName: '',
    relatedActionables: ['scp_engage_session', 'scp_focus_session'],
  };

  // D3 FKIS · send_message · live keystroke streaming via FORF manifold
  // Replaces UIMJ-queue deferred delivery for online targets: focuses target
  // Electron window, streams chars per FBP (Char-Stream-Discrete-Fire), fires
  // a separate keyDown:Return event, restores origin SCP focus. Real-time
  // round-trip (sub-second) versus scp_chat_session's next-turn deferred
  // delivery. originScpName is server-resolved from SCS_BRIDGE_ORIGIN_SCP
  // anor SCS_BRIDGE_SCP_NAME (EVRC) — caller does NOT supply origin.
  // Citation: D3 FKIS · S3 Ochre Blueprint §E · S6 Amethyst W3 spec
  const sendMessageMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'scsBridge',
    qualityName: 'scsBridgeSendMessage',
    toolName: 'send_message',
    description:
      'D3 FKIS · Send a typed message into a target session via live keystroke streaming. ' +
      'Focuses target Electron window, streams chars per FIFO Break Principle, presses Enter, ' +
      'restores focus to origin SCP. Real-time delivery (NOT queued like scp_chat_session). ' +
      'Origin SCP is resolved server-side from environment.',
    inputSchema: {
      type: 'object',
      properties: {
        targetUlid: { type: 'string', description: 'Target session ULID' },
        text: {
          type: 'string',
          description: 'Message text to send (Enter is appended automatically by the FKIS pipeline)',
        },
        inFocus: {
          type: 'boolean',
          description:
            'C768 focus discipline · true = In Focus: the terminal keeps focus (the final refocus to the origin SCP is suppressed — Ask Me / SCS:In-Focus). Absent/false = Pass Through: traditional background messaging.',
        },
      },
      required: ['targetUlid', 'text'],
    },
    toolType: 'actionable',
    handlerType: 'quality',
    strategyName: '',
    relatedActionables: ['scp_engage_session', 'scp_focus_session', 'scp_chat_session'],
  };

  // RM-D4 · RENAME · scp_rename_session · DUAL Vue-surface write leg onto SNDF.
  // TQNI invariant: qualityName MUST byte-match scsBridge.e key 'scsBridgeRenameSession'
  // (Cycle 140 TQDR · createSCPQualityManifold does qualityEmitter[meta.qualityName] —
  // a mismatch silently no-ops). IDTND: sessionId is the ULID; name NEVER routes.
  // ACK-only · setSessionDisplayName chainWrite is the Lambda · json-watcher relays.
  // Citation: RM-D4-R3-WIRING-ARCHITECTURE.md §1.4
  const renameSessionMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'scsBridge',
    qualityName: 'scsBridgeRenameSession',          // ← TQNI byte-identity with scsBridge.e key
    toolName: 'scp_rename_session',
    description:
      'RM-D4 RENAME · Set or clear a session\'s user-facing display name (SNDF). ' +
      'Writes displayName on the registry entry via the single-writer registry.ts ' +
      '(32-char cap; empty/whitespace clears the name). The sessions.json json-watcher ' +
      'relays the change to all surfaces (Vue Communication Bar label + TUI column). ' +
      'IDTND invariant: the session ULID is the lookup key and is NEVER changed or used ' +
      'for routing — only the display name is written.',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'Session ULID to rename (lookup key · never mutated)' },
        name: { type: 'string', description: 'New display name (≤32 chars; empty string clears it)' },
      },
      required: ['sessionId'],     // name optional → empty clears (idempotent delete)
    },
    toolType: 'actionable',
    handlerType: 'quality',        // ← routes through createSCPQualityManifold (quality path)
    strategyName: '',
    relatedActionables: ['scp_engage_session', 'scp_focus_session'],
  };

  // A-D3b · ARFSP · scs_set_anchor_session · manual Anchor reassignment ("Set as Anchor").
  // TQNI invariant: qualityName MUST byte-match scsBridge.e key 'scsBridgeSetSessionAnchor'
  // (Cycle 140 TQDR · createSCPQualityManifold does qualityEmitter[meta.qualityName] —
  // a mismatch silently no-ops). IDTND: sessionId is the ULID; never routed/mutated.
  // ACK-only · setSessionAnchor chainWrite is the Lambda · json-watcher relays the flip.
  // Citation: registry.ts setSessionAnchor (A-D1) · ScsBridgeSessionManagement Anchor cell (A-D2)
  const setAnchorMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'scsBridge',
    qualityName: 'scsBridgeSetSessionAnchor',       // ← TQNI byte-identity with scsBridge.e key
    toolName: 'scs_set_anchor_session',
    description:
      'A-D3b ARFSP · Reassign a Suite 8 page\'s Anchor to a chosen session ("fragment ' +
      'then correct" override). Sets isAnchor=true on the target entry and clears isAnchor ' +
      'on every OTHER entry sharing the same suite8Name (≤1 anchor per page) in one ' +
      'single-writer registry.ts chainWrite. No-ops if the session has no suite8Name scope. ' +
      'The sessions.json json-watcher relays the change to all surfaces (SCP grid Anchor ' +
      'column). IDTND invariant: the session ULID is the lookup key and is NEVER changed or ' +
      'used for routing.',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'Session ULID to set as Anchor (lookup key · never mutated)' },
      },
      required: ['sessionId'],
    },
    toolType: 'actionable',
    handlerType: 'quality',        // ← routes through createSCPQualityManifold (quality path)
    strategyName: '',
    relatedActionables: ['scp_rename_session', 'scp_engage_session'],
  };

  // SAC.1 · ARFSP · scs_unset_anchor_session · manual Anchor release ("Release Anchor").
  // TQNI invariant: qualityName MUST byte-match scsBridge.e key 'scsBridgeUnsetSessionAnchor'
  // (Cycle 140 TQDR · createSCPQualityManifold does qualityEmitter[meta.qualityName] —
  // a mismatch silently no-ops). IDTND: sessionId is the ULID; never routed/mutated.
  // ACK-only · unsetSessionAnchor chainWrite is the Lambda · json-watcher relays the flip.
  // Faithful mirror of setAnchorMetadata. Citation: registry.ts unsetSessionAnchor (SAC.1)
  const unsetAnchorMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'scsBridge',
    qualityName: 'scsBridgeUnsetSessionAnchor',     // ← TQNI byte-identity with scsBridge.e key
    toolName: 'scs_unset_anchor_session',
    description:
      'SAC.1 ARFSP · Release a Suite 8 page\'s Anchor from a chosen session. Clears ' +
      'isAnchor on ONLY the one target entry (no scope-clear loop — releasing one anchor ' +
      'cannot open a two-anchor window) in one single-writer registry.ts chainWrite. ' +
      'No-ops if the session is not currently anchored. The sessions.json json-watcher ' +
      'relays the change to all surfaces (SCP grid Anchor column). IDTND invariant: the ' +
      'session ULID is the lookup key and is NEVER changed or used for routing.',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'Session ULID to release from Anchor (lookup key · never mutated)' },
      },
      required: ['sessionId'],
    },
    toolType: 'actionable',
    handlerType: 'quality',        // ← routes through createSCPQualityManifold (quality path)
    strategyName: '',
    relatedActionables: ['scs_set_anchor_session', 'scp_engage_session'],
  };

  // SAC.3 · scs_set_anchor_config · per-page auto-anchor USER OVERRIDE write ("Set Auto-Anchor").
  // TQNI invariant: qualityName MUST byte-match scsBridge.e key 'scsBridgeSetAnchorConfig'
  // (Cycle 140 TQDR · createSCPQualityManifold does qualityEmitter[meta.qualityName] —
  // a mismatch silently no-ops). Keyed by suite8Name (NDEP · the page · NOT a session ULID).
  // ACK-only · writeAnchorOverride FS write IS the Lambda · claimAnchorIfUnclaimed reads the
  // resolved config on the next spawn. Citation: anchorConfig.model.ts writeAnchorOverride (SAC.3)
  const setAnchorConfigMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'scsBridge',
    qualityName: 'scsBridgeSetAnchorConfig',        // ← TQNI byte-identity with scsBridge.e key
    toolName: 'scs_set_anchor_config',
    description:
      'SAC.3 · Set the per-page auto-anchor USER OVERRIDE for a Suite 8 page. Writes ' +
      'Cascades/Extended/<suite8Name>/anchor.override.json = { autoAnchor }. A page set ' +
      'autoAnchor:false does NOT auto-anchor its spawned session (claimAnchorIfUnclaimed skips ' +
      'the auto-stamp on the next spawn · a manual Set-as-Anchor still works). The menu.json ' +
      'menu-creator default is NEVER written here — only the override sibling. Keyed by ' +
      'suite8Name (the literal Cascades/Extended/<name> dir Name · NOT a session ULID).',
    inputSchema: {
      type: 'object',
      properties: {
        suite8Name: { type: 'string', description: 'Suite 8 page Name (literal Cascades/Extended/<name> dir · the page key)' },
        autoAnchor: { type: 'boolean', description: 'true = auto-anchor the page spawn (default behavior); false = do NOT auto-anchor' },
      },
      required: ['suite8Name', 'autoAnchor'],
    },
    toolType: 'actionable',
    handlerType: 'quality',        // ← routes through createSCPQualityManifold (quality path)
    strategyName: '',
    relatedActionables: ['scs_reset_anchor_config', 'scs_set_anchor_session'],
  };

  // SAC.3 · scs_reset_anchor_config · per-page auto-anchor RESET-to-default ("Reset to Default").
  // TQNI invariant: qualityName MUST byte-match scsBridge.e key 'scsBridgeResetAnchorConfig'.
  // Keyed by suite8Name (NDEP · the page). ACK-only · deleteAnchorOverride unlink IS the Lambda ·
  // the page reverts to the menu-creator default. Faithful sibling of setAnchorConfigMetadata.
  // Citation: anchorConfig.model.ts deleteAnchorOverride (SAC.3)
  const resetAnchorConfigMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'scsBridge',
    qualityName: 'scsBridgeResetAnchorConfig',      // ← TQNI byte-identity with scsBridge.e key
    toolName: 'scs_reset_anchor_config',
    description:
      'SAC.3 · Reset a Suite 8 page\'s auto-anchor override to the menu-creator default. Deletes ' +
      'Cascades/Extended/<suite8Name>/anchor.override.json so the page falls back to ' +
      'menu.json anchorConfig.autoAnchor (or the system default true when neither is set). ' +
      'No-ops gracefully when no override file exists. The menu.json default is NEVER touched. ' +
      'Keyed by suite8Name (the literal Cascades/Extended/<name> dir Name · NOT a session ULID).',
    inputSchema: {
      type: 'object',
      properties: {
        suite8Name: { type: 'string', description: 'Suite 8 page Name (literal Cascades/Extended/<name> dir · the page key)' },
      },
      required: ['suite8Name'],
    },
    toolType: 'actionable',
    handlerType: 'quality',        // ← routes through createSCPQualityManifold (quality path)
    strategyName: '',
    relatedActionables: ['scs_set_anchor_config'],
  };

  // VS · DSST · scs_dissipate_session · the spawned researcher's final Vermillion step.
  // TQNI invariant: qualityName MUST byte-match scsBridge.e key 'scsBridgeDissipateSession'
  // (Cycle 140 TQDR · createSCPQualityManifold does qualityEmitter[meta.qualityName] —
  // a mismatch silently no-ops). IDTND: sessionId is the ULID; never routed/mutated.
  // ACK-only · dissipateSession chainWrite is the Lambda (S4 H2 anchor-guarded inside
  // the body — NEVER dissipates the page Anchor) · json-watcher relays the removal.
  // Citation: EPOCH-DIAMOND §6 Macro VS DSST · EPOCH-SR-S4-GREEN-SCULPT.md H2
  const dissipateSessionMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'scsBridge',
    qualityName: 'scsBridgeDissipateSession',     // ← TQNI byte-identity with scsBridge.e key
    toolName: 'scs_dissipate_session',
    description:
      'VS DSST · Dissipate (remove) an ephemeral research session from the Session ' +
      'Manager. Invoked by a spawned Cadmium research worker itself as the final step ' +
      'of its Vermillion (after the Markdown + paired JSON are written). Removes the ' +
      'session\'s registry entry via the single-writer registry.ts. NEVER dissipates ' +
      'the page Anchor (the durable Setup/Chat instance) — the removal is guarded by ' +
      'an isAnchor check inside the chainWrite body and no-ops on an anchor or missing ' +
      'entry. The sessions.json json-watcher relays the removal to all surfaces. ' +
      'IDTND invariant: the session ULID is the lookup key and is NEVER changed or ' +
      'used for routing.',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'Session ULID to dissipate (lookup key · never mutated · never the Anchor)' },
      },
      required: ['sessionId'],
    },
    toolType: 'actionable',
    handlerType: 'quality',        // ← routes through createSCPQualityManifold (quality path)
    strategyName: '',
    relatedActionables: ['scs_deliver_vermillion', 'scp_engage_session'],
  };

  // CWDC · scs_close_wait_dissipate · the worker's FULL GRACEFUL terminal Vermillion step.
  // TQNI invariant: qualityName MUST byte-match scsBridge.e key 'scsBridgeCloseWaitDissipate'
  // (Cycle 140 TQDR · createSCPQualityManifold does qualityEmitter[meta.qualityName] —
  // a mismatch silently no-ops). IDTND: sessionId is the ULID; never routed/mutated.
  // ACK-only · the composed CLOSE→WAIT→DISSIPATE→SDTC chain is the Lambda (S4 H2
  // anchor-guarded — a pre-check guard AND dissipateSession's inner guard — NEVER the
  // page Anchor) · json-watcher relays the removal.
  // Citation: registry.ts dissipateSession · electronSessionSpawn.ts killElectronSessionForUlid
  const closeWaitDissipateMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'scsBridge',
    qualityName: 'scsBridgeCloseWaitDissipate',   // ← TQNI byte-identity with scsBridge.e key
    toolName: 'scs_close_wait_dissipate',
    description:
      'Gracefully close, wait for exit, then fully dissipate (registry + .jsonl + ' +
      'session dir) an ephemeral research worker session. Invoked by the worker ' +
      'itself as the final Vermillion step with its own session ID. Sibling to ' +
      'scs_dissipate_session, but adds a graceful pty CLOSE (the kill verb) + a ' +
      'bounded WAIT before the reap, and completes the session-directory teardown ' +
      '(Cascades/Bridge/sessions/<ulid>/) that scs_dissipate_session leaves in place. ' +
      'NEVER closes/dissipates the page Anchor (guarded by a pre-check isAnchor reject ' +
      'AND the isAnchor check inside dissipateSession\'s chainWrite body · no-ops on an ' +
      'anchor or missing entry). The sessions.json json-watcher relays the removal to ' +
      'all surfaces. IDTND invariant: the session ULID is the lookup key and is NEVER ' +
      'changed or used for routing. Anchor-guarded.',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'Session ULID to close + dissipate (lookup key · never mutated · never the Anchor)' },
      },
      required: ['sessionId'],
    },
    toolType: 'actionable',
    handlerType: 'quality',        // ← routes through createSCPQualityManifold (quality path)
    strategyName: '',
    relatedActionables: ['scs_dissipate_session', 'scs_deliver_vermillion'],
  };

  // ARST · scs_archive_session · move the real ClaudeCode session to Cascades/Archive then remove.
  // TQNI invariant: qualityName MUST byte-match scsBridge.e key 'scsBridgeArchiveSession'
  // (Cycle 140 TQDR · createSCPQualityManifold does qualityEmitter[meta.qualityName] —
  // a mismatch silently no-ops). IDTND: sessionId is the ULID; never routed/mutated.
  // ACK-only · archiveSession chainWrite is the Lambda (S4 H2 anchor-guarded inside the
  // body — NEVER archives the page Anchor · RSAR resilient on absent real session) ·
  // json-watcher relays the removal. PFCX: the real-session move is the intentional,
  // user-directed crossing of the bridge-detached law.
  // Citation: DISSOLUTION-ARCHIVAL-DIAMOND-WGB.md §2 ARST · registry.ts archiveSession
  const archiveSessionMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'scsBridge',
    qualityName: 'scsBridgeArchiveSession',       // ← TQNI byte-identity with scsBridge.e key
    toolName: 'scs_archive_session',
    description:
      'ARST · Archive a session: MOVE its stored real ClaudeCode session file ' +
      '(~/.claude/projects/<cwd-dashed>/<claudeSessionId>.jsonl) into ' +
      'Cascades/Archive/YYYY/MM/DD/ storage, THEN remove the session\'s registry ' +
      'entry from sessions.json via the single-writer registry.ts. Sibling to ' +
      'scs_dissipate_session, but archives (preserves) the real session rather than ' +
      'deleting it. NEVER archives the page Anchor (guarded by an isAnchor check inside ' +
      'the chainWrite body · no-ops on an anchor or missing entry). If the real session ' +
      'file does not exist, the entry is still removed from sessions.json (resilient). ' +
      'The sessions.json json-watcher relays the removal to all surfaces. IDTND ' +
      'invariant: the session ULID is the lookup key and is NEVER changed or routed.',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'Session ULID to archive (lookup key · never mutated · never the Anchor)' },
      },
      required: ['sessionId'],
    },
    toolType: 'actionable',
    handlerType: 'quality',        // ← routes through createSCPQualityManifold (quality path)
    strategyName: '',
    relatedActionables: ['scs_dissipate_session', 'scp_engage_session'],
  };

  // VS · VSDT · scs_deliver_vermillion · the orchestrator hands a research worker its
  // Vermillion (plan + create+actualize-Planned-Query command). TQNI invariant:
  // qualityName MUST byte-match scsBridge.e key 'scsBridgeDeliverVermillion'. Delivered
  // as a 'SCS:Vermillion' first-line Cascade Directive over the SAME live-keystroke
  // transport send_message uses (dispatchFkisMessage · EVRC origin). ACK-only.
  // Citation: EPOCH-DIAMOND §6 Macro VS VSDT · scs-bridge-base.skeleton.md §7
  const deliverVermillionMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'scsBridge',
    qualityName: 'scsBridgeDeliverVermillion',    // ← TQNI byte-identity with scsBridge.e key
    toolName: 'scs_deliver_vermillion',
    description:
      'VS VSDT · Deliver a Vermillion (research plan + create+actualize Planned Query ' +
      'command) to a spawned research worker session. The vermillion text is prefixed ' +
      'with a SCS:Vermillion first line (a Cascade Directive the worker reads and ' +
      'executes directly — NOT a tool call) and typed into the target session via the ' +
      'same live-keystroke transport as send_message. Origin SCP is resolved ' +
      'server-side from environment. Use to hand research work to a session spawned by ' +
      'scs_spawn_suite8_session; the worker dissipates itself via scs_dissipate_session.',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'Target research-worker session ULID' },
        vermillion: { type: 'string', description: 'Vermillion plan body (delivered as a SCS:Vermillion directive)' },
      },
      required: ['sessionId', 'vermillion'],
    },
    toolType: 'actionable',
    handlerType: 'quality',        // ← routes through createSCPQualityManifold (quality path)
    strategyName: '',
    relatedActionables: ['scs_spawn_suite8_session', 'scs_dissipate_session', 'send_message'],
  };

  const buildTool = (metadata: SCPQualityMetadataRegistered): SCPToolDefinition => ({
    name: metadata.toolName,
    description: metadata.description,
    inputSchema: metadata.inputSchema,
    registeredAt: now,
    handler: () => ({ error: 'Use manifold execution' }),
  });

  // SCSER intake tool · SAWSR-D2.B Cycle 153 · debounced 500ms
  // INTERNAL · NOT user-facing · invoked by SCP-side SCSER Strategy callback only
  const scserBindMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'scsBridge',
    qualityName: 'scsBridgeBindCallerSessionToScp',
    toolName: 'scs_bridge_bind_caller_session',
    description: 'INTERNAL · SCSER callback intake · invoked by SCP-side SCSER Strategy after SCP startup to bind caller-session-ULID to SCP scope. Debounced 500ms. NOT for user/agent direct invocation.',
    inputSchema: {
      type: 'object',
      properties: {
        callerSessionUlid: { type: 'string', description: 'Caller agent session ULID (registered in Bridge session registry)' },
        scpName: { type: 'string', description: 'SCP name to bind caller session to' },
      },
      required: ['callerSessionUlid', 'scpName'],
    },
    toolType: 'actionable',
    handlerType: 'quality',
    strategyName: '',
    relatedActionables: ['scp_launch_session_management'],
  };

  // S8P-SCP-TOOL · suite8_page_create · binds runSuite8PageCreate (the `scs suite8:page`
  // SVLF model) as an SCP-side MCP tool. The calling SCP (the Forge anchor session) supplies
  // its own name as `designation` (FKIS payload-supplied · registry-guarded); the bridge runs
  // the concept create + AIME wiring + gate chain (positive-presence → zero-grep → tsc) FOR
  // that SCP against the bridge daemon's userCwd (the workspace root where SCPs.json lives).
  // TQNI invariant: qualityName 'scsBridgeSuite8PageCreate' byte-matches the scsBridge.e key.
  // handlerType 'quality' → createSCPQualityManifold; the structured Suite8PageCreateResult
  // rides strategyData_muxifyData out through the SCP manifold tail. SYNC RULING: the model
  // runs `npx tsc --noEmit` synchronously (~10-30s); the /mcp handler holds the socket with a
  // 30s response-timeout guard — a small SCP completes under it, a large SCP could time out
  // (the concept files still land on disk; the caller re-checks / re-runs). No async/job idiom
  // exists for a DATA-returning bridge tool, so synchronous is the ruling.
  const suite8PageCreateMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'scsBridge',
    qualityName: 'scsBridgeSuite8PageCreate',   // ← TQNI byte-identity with scsBridge.e key
    toolName: 'suite8_page_create',
    description:
      'Create a Suite 8 domain page in the calling SCP (the `scs suite8:page` model, run ' +
      'bridge-side FOR the SCP). Copies the template suite8 concept into src/concepts/<domain>, ' +
      'token-renames all files, wires the 3 foreign AIMEs (IslandWrapper / huirth / vue.principle ' +
      'registry), and runs the gate chain (positive-presence → zero-grep → tsc --noEmit). Pass ' +
      'designation = your OWN SCP name (validated against Cascades/SCPs.json — an unknown SCP is ' +
      'an honest failure, never a throw). name = the PascalCase Suite8Name; displayName = the exact ' +
      'spaced Cascades/8_SUITES/<name>/ dir name; home:true also claims the / route (adds a ' +
      'build:client + one-home gate); force:true re-runs over an existing page. Returns the ' +
      'structured result { ok, reason?, conceptName, scpRoot, gatesPassed, ... }. COMPLETION STEP ' +
      '(the caller\'s): after ok:true the running SCP still serves the PRE-MINT bundle. Do NOT run ' +
      '`npm run build:client` and do NOT kill anor restart the SCP process — the bridge owns the SCP ' +
      'lifecycle (an external rebuild/restart strands the session registry). Instead call ' +
      'scp_alert_turn_over { scpName }: the USER\'s Turn Over A rebuilds and re-serves through the ' +
      'sovereign circuit, and it is their introduction to the build-while-you-use loop. ' +
      'TIMING: the tsc gate runs synchronously (~10-30s); if it exceeds the /mcp 30s window the ' +
      'call returns a timeout error but the concept files are already on disk — re-check or re-run.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'PascalCase Suite8Name (e.g. UserProjectContext)' },
        displayName: {
          type: 'string',
          description: 'The EXACT spaced Cascades/8_SUITES/<name>/ dir name (e.g. "User Project Context")',
        },
        designation: {
          type: 'string',
          description: 'The calling SCP\'s own name (validated against Cascades/SCPs.json)',
        },
        home: {
          type: 'boolean',
          description: 'true → also claim the / home route (adds build:client + one-home gates). Default false.',
        },
        force: {
          type: 'boolean',
          description: 'true → re-run over an already-created page (skip the already-installed guard). Default false.',
        },
      },
      required: ['name', 'displayName', 'designation'],
    },
    toolType: 'actionable',
    handlerType: 'quality',        // ← routes through createSCPQualityManifold (quality path)
    strategyName: '',
    relatedActionables: ['scs_spawn_suite8_session'],
  };

  // PPLD QMTR · Cycle 160 · Ping-Pong-Liveness-Diameter
  // TQNI invariant: qualityName MUST match scsBridge.e key exactly.
  // handlerType 'quality' → createSCPQualityManifold path in scpExpressTransport.
  // toolType 'informative' → confirms reachability · does not mutate Bridge state.
  // pongReceipt written to bridge.json by Ochre-A's Quality method (Option β).
  const pingPongMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'scsBridge',
    qualityName: 'scsBridgePingPong',
    toolName: 'bridge_ping_pong',
    description: 'PPLD · Ping-Pong-Liveness-Diameter · confirms SCS-Bridge MCP endpoint is browser-reachable from SCP Client. Client-initiated one-time call gated by CESA connectionEstablished. Returns Pong synchronously (MTPP). pongReceipt written to bridge.json (Option β).',
    inputSchema: {
      type: 'object',
      properties: {
        clientId: { type: 'string', description: 'Client SCP name or session identifier (PPSO echo)' },
        timestamp: { type: 'number', description: 'Client Date.now() at Ping fire · RTT measurement (PPCT)' },
      },
      required: ['clientId', 'timestamp'],
    },
    toolType: 'informative',
    handlerType: 'quality',
    strategyName: '',
    relatedActionables: [],
  };

  // DIAGNOSTIC-REENGAGED R2 · TSPK · scs_persist_last_turn (BATCH)
  // Single-Writer last-turn persistence. Extracts EACH listed session's last
  // assistant turn from its Claude Code JSONL (per-ULID PUTR) and writes
  // transcriptSnippet (+ siblings) into sessions.json in ONE chainWrite
  // transaction. Triggered by the SCP-side Last-Turn transcript watcher, which
  // rolls up N per-session triggers into ONE batched POST (sessionIds array).
  // The sessions.json watcher then carries the persisted snippet to clients.
  // TQNI invariant: qualityName MUST byte-match the scsBridge.e emitter key
  // 'scsBridgePersistLastTurn' (Cycle 140 TQDR · createSCPQualityManifold does
  // qualityEmitter[meta.qualityName](params) — a mismatch silently no-ops). ACK-only.
  const persistLastTurnMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'scsBridge',
    qualityName: 'scsBridgePersistLastTurn',
    toolName: 'scs_persist_last_turn',
    description: 'DIAGNOSTIC-REENGAGED R2 · Single-Writer last-turn persistence (batch). Extracts EACH listed session\'s last assistant turn from its Claude Code JSONL (per-ULID PUTR) and writes transcriptSnippet (+ siblings) into sessions.json in ONE chainWrite transaction. Triggered by the SCP-side Last-Turn watcher (rolls up N per-session triggers into one batched call). The sessions.json watcher then carries the persisted snippet to clients. ACK-only.',
    inputSchema: {
      type: 'object',
      properties: {
        sessionIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Session ULIDs whose last turns to extract and persist in one batch (CLI loops extract+write per id, single registry transaction)',
        },
        callerSessionUlid: { type: 'string', description: 'Caller agent session ULID (optional · diagnostics)' },
      },
      required: ['sessionIds'],
    },
    toolType: 'actionable',
    handlerType: 'quality',
    strategyName: '',
    relatedActionables: [],
  };

  // ASDR · BWRF · scs_focus_bridge_window · the spawned anchor refocuses the SCS-Bridge UI.
  // TQNI invariant: qualityName MUST byte-match scsBridge.e key 'scsBridgeFocusUrlWindow'
  // (Cycle 140 TQDR · createSCPQualityManifold does qualityEmitter[meta.qualityName] — a
  // mismatch silently no-ops). No required input: the target URL is resolved server-side
  // (EVRC env → bridge.json browserUrl); the optional `url` overrides it. ACK-only · the
  // CSSP focus-url relay IS the Lambda (focusUrlWindow brings the EWHM window to front;
  // graceful no-op when the URL is not in urlWindowMap / non-Electron mode).
  // Citation: ANCHOR-SELF-DIRECTION-ROUTINE-WGB.md §7 W1 BWRF · registry sibling: dissipate/archive
  const focusUrlWindowMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'scsBridge',
    qualityName: 'scsBridgeFocusUrlWindow',       // ← TQNI byte-identity with scsBridge.e key
    toolName: 'scs_focus_bridge_window',
    description:
      'ASDR BWRF · Bring the SCS-Bridge UI window (the Electron BrowserWindow rendering ' +
      'the SCP Vue app · e.g. the Cadmium Researcher page) to the foreground. Invoked by a ' +
      'page-bound Anchor session during its Onboard routine so the user SEES the Shatterite ' +
      'Menu it authored. The target window URL is resolved SERVER-SIDE (from environment → ' +
      'bridge.json boundScps browserUrl); the caller normally supplies NO arguments. An ' +
      'optional `url` overrides the server-side resolution. Distinct from scp_focus_session ' +
      '(which focuses a session TERMINAL window, not the bridge UI). Graceful no-op when the ' +
      'window is not tracked (browser-only / non-Electron mode).',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'Optional exact window URL override (omit to resolve server-side from environment + bridge.json)' },
        // M3 · THE FOCUS RECORD SEAM (D-WR C628) — the target SCP name. When present the by-id path
        // resolves the windowId from THIS record instead of the env 'template' fallback (which grabbed
        // a stale windowId:1 / the helm window in R7). The helm /bridge-focus route threads it.
        scpName: { type: 'string', description: 'Optional target SCP name — resolves the specific window record (avoids the env fallback that can target the wrong window)' },
        callerSessionUlid: { type: 'string', description: 'Caller agent session ULID (optional · diagnostics)' },
      },
      required: [],
    },
    toolType: 'actionable',
    handlerType: 'quality',        // ← routes through createSCPQualityManifold (quality path)
    strategyName: '',
    relatedActionables: ['scp_focus_session', 'scp_engage_session'],
  };

  // W3.5 (C781) · scp_focus_suite8_page — the S9 post-scaffold step (c): focus the SCP window
  // AND navigate it to the NEW Suite 8 page (?island=<camel(suite8Name)>) so the user is
  // looking at the page before the Installation Agent assumes the Entourage Forge persona.
  const focusSuite8PageMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'scsBridge',
    qualityName: 'scsBridgeFocusSuite8Page',
    toolName: 'scp_focus_suite8_page',
    description:
      'W3.5 · C791 FOCUS TRUTH · Focus the SCP window AND navigate it to the named Suite 8 page ' +
      '(the ?island deep-link). Pass BOTH names: scpName (the SCP you were just working on) + ' +
      'suite8Name (the S8 you just drafted). By-name resolution needs NO Suite 8 body dir — a ' +
      'freshly minted page exists before its body dir does, so name it and the tool resolves the ' +
      'window without probing. Returns { focus: { ok, reason?, scpName, navUrl } } — a skip is ' +
      'NEVER silent (ok:false + a reason string); act on the reason, do not treat an ACK as success. ' +
      'Without scpName it falls back to the owning-Suite-8 probe (which fails when the body dir is not ' +
      'yet on disk). The install-flow step between the proven mint and the Entourage Forge assumption: ' +
      'call it after the SCP loads so the user is viewing the new page before the build-out begins.',
    inputSchema: {
      type: 'object',
      properties: {
        suite8Name: { type: 'string', description: 'The Suite 8 designation (the NDEP directory name).' },
        scpName: { type: 'string', description: 'The target SCP name (bridge.json boundScps key anor SCPs.json name). Strongly preferred — the caller knows the SCP it was just working on.' },
      },
      required: ['suite8Name'],
    },
    toolType: 'actionable',
    handlerType: 'quality',
    strategyName: '',
    relatedActionables: ['scs_focus_bridge_window', 'scp_focus_session'],
  };

  // C785 · THE STALE-SERVER CURE · scp_alert_turn_over — the USER performs the Turn Over;
  // the agent stands by. TQNI: qualityName byte-matches the scsBridge.e key.
  const alertTurnOverMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'scsBridge',
    qualityName: 'scsBridgeAlertTurnOver',
    toolName: 'scp_alert_turn_over',
    description:
      'INSTALL FLOW · THE STALE-SERVER CURE: after a mint on a RUNNING SCP the served bundle ' +
      'predates the new page (SPA catch-all 200s lie). NEVER build, kill, anor restart the SCP ' +
      'process yourself — the bridge owns the SCP lifecycle (an external kill strands the ' +
      'session registry; the relaunch silently no-ops). This tool ALERTS THE USER to Turn Over ' +
      "their CURRENT tactical branch on the named SCP (C872: the side — A anor B — is read from the live gitm state, turnedOverTo/currentBranch): writes turnOverAlert into that SCP's " +
      'Cascades/Bridge/gitm.json (the GitM relay renders a banner directing them to the ' +
      'TaskBar TURN OVER button for that side) and focuses the SCP window. INFORM the user of the purpose ' +
      '— their FIRST CONTACT with the build-while-you-use loop — then STAND BY: present an ' +
      'INLINE markdown menu of next options (never AskUserQuestion for it) and POLL that ' +
      'gitm.json until turnOver.at EXCEEDS turnOverAlert.requestedAt (the outcome signal; the ' +
      'alert self-retires), then Concluder the served page before proceeding.',
    inputSchema: {
      type: 'object',
      properties: {
        scpName: { type: 'string', description: 'The target SCP name (bridge.json boundScps key).' },
        purpose: { type: 'string', description: 'Shown on the banner — why this Turn Over is requested.' },
      },
      required: ['scpName'],
    },
    toolType: 'actionable',
    handlerType: 'quality',
    strategyName: '',
    relatedActionables: ['scp_focus_suite8_page', 'gitm_confirm_success'],
  };

  // C787 · THE HOLDINGS QUERY · scp_query_holdings — the one-beat bridge-state snapshot.
  // TQNI: qualityName byte-matches the scsBridge.e key.
  const queryHoldingsMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'scsBridge',
    qualityName: 'scsBridgeQueryHoldings',
    toolName: 'scp_query_holdings',
    description:
      'THE LIVE ROSTER · ONE CALL, ANSWERS IN <1s, NEVER HANGS: the current SCP list with ' +
      'LIVE STATUS AS A REAL SOCKET PROBE (net.connect 127.0.0.1 · 300ms cap · parallel), ' +
      'never a lag-prone file projection. Returns { holdings: { port, userCwd, installState, ' +
      'activeScp, installedScps, roster: [{ name, live, host, port, url, status, lifecycle, ' +
      'windowId, dir, gitm: { currentBranch, stableBranch, workingBranch, abMode, turnOver, ' +
      'turnOverAlert } }] } } — live:true rows carry the name + host + port + a url composed ' +
      'from the port. USE THIS to establish SCP liveness and location — never probe hosts ' +
      'anor ports by hand, never idle-watch, never leave a hung status call running. One ' +
      'live:true read IS the boot Concluder. The gitm turnOver pair is the stand-by outcome ' +
      'signal: turnOver.at > turnOverAlert.requestedAt means the user performed the Turn Over.',
    inputSchema: {
      type: 'object',
      properties: {
        callerSessionUlid: { type: 'string', description: 'Caller agent session ULID (optional · diagnostics)' },
      },
      required: [],
    },
    toolType: 'informative',
    handlerType: 'quality',
    strategyName: '',
    relatedActionables: ['scp_alert_turn_over', 'launch_scp'],
  };

  // D-N3 · Neon PlayTester · scs_orchestrate_window · the PlayTester's PRIME MOVER.
  // TQNI invariant: qualityName MUST byte-match scsBridge.e key 'scsBridgeOrchestrateWindow'.
  // Executes an ATOMIC step sequence against a target BrowserWindow in Electron main
  // (zero agent-latency between steps — the CGDA arm→confirm design lesson). WINDOW-GENERAL:
  // the SCP is the binding location; terminal session windows are equally targetable.
  // BRIDGE-OWNED (SORD §2): the SCP turn-over kills its own server mid-test — orchestration
  // lives on the stable bridge. Returns the FULL per-step result array in the tool response
  // (the agent consumer reads it · gitm_load_log precedent). Every run is file-captured:
  // orchestrate.received/.result in debug.json + orchestrate.sequence in electron-debug.json
  // + captures under Cascades/Bridge/playtests/<runId>/.
  const orchestrateWindowMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'scsBridge',
    qualityName: 'scsBridgeOrchestrateWindow',   // ← TQNI byte-identity with scsBridge.e key
    toolName: 'scs_orchestrate_window',
    description:
      'NEON PLAYTESTER · Execute an atomic step sequence against a live window (the SCP page ' +
      'by default; a terminal session window via target.sessionId). Steps execute in Electron ' +
      'main with zero latency between them — timing-sensitive interactions (e.g. a 2-click ' +
      'arm→confirm inside a 10s window) hold their beat. Step kinds: ' +
      'click {kind:"click", selector} (real MouseEvent chain) · ' +
      'key {kind:"key", key, modifiers?} (sendInputEvent) · ' +
      'js {kind:"js", code} (executeJavaScript · SERIALIZED RETURN — the assertion primitive) · ' +
      'wait {kind:"wait", ms} (bounded ≤10s) · ' +
      'capture {kind:"capture", label?} (capturePage → PNG under Cascades/Bridge/playtests/<runId>/) · ' +
      'probe {kind:"probe"} (window alive? URL? loading? bridge.json freshness — the ' +
      'restart-spanning primitive; poll cheap probe sequences to wait out an SCP restart) · ' +
      'scroll {kind:"scroll", selector?, deltaY?, to?:"top"|"bottom", x?, y?} (selector → DOM ' +
      'scroll of that element; no selector → a mouseWheel input event at x,y|center — the route ' +
      'for TERMINAL scrollback; deltaY>0 scrolls up). ' +
      'A destroyed window mid-sequence reports PARTIAL (a turn-over test EXPECTS to lose the ' +
      'window) — never hangs. Sequence wall-time capped ~30s. Target resolution: ' +
      'target.windowId → target.sessionId (terminal) → target.scpName → the ACTIVE SCP ' +
      '(bridge.json). Returns { orchestrate: { ok, partial, runId, durationMs, steps:[...] } }.',
    inputSchema: {
      type: 'object',
      properties: {
        target: {
          type: 'object',
          description:
            'Optional window target: { windowId?: number, sessionId?: string (terminal), scpName?: string }. Omit to target the ACTIVE SCP window.',
        },
        steps: {
          type: 'array',
          description:
            'The atomic step sequence (≤24). Each: {kind:"click",selector} | {kind:"key",key,modifiers?} | {kind:"js",code} | {kind:"wait",ms} | {kind:"capture",label?} | {kind:"probe"}.',
          items: { type: 'object' },
        },
        runId: {
          type: 'string',
          description: 'Optional PlayTest run id — names the playtests/<runId>/ capture directory (groups a multi-sequence PlayTest).',
        },
        callerSessionUlid: { type: 'string', description: 'Caller agent session ULID (optional · diagnostics)' },
      },
      required: ['steps'],
    },
    toolType: 'actionable',
    handlerType: 'quality',        // ← routes through createSCPQualityManifold (quality path)
    strategyName: '',
    relatedActionables: ['scs_focus_bridge_window', 'gitm_turn_over_with_source'],
  };

  // D-N2 · Neon PlayTester · scs_render_capture · the visual-Lambda capture.
  // TQNI invariant: qualityName MUST byte-match scsBridge.e key 'scsBridgeRenderCapture'.
  // Returns the STREAMED pre-shader frame for a shader-wrapped window (the render context
  // PRIOR to the shader pass, as it streams — the paint-hook latest-frame store), else
  // capturePage for flat windows. PNG under Cascades/Bridge/playtests/<runId>/ — the agent
  // Reads the image (visual Lambda). Sibling of scs_orchestrate_window (shared
  // captureWindowRender model + shared target resolution).
  const renderCaptureMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'scsBridge',
    qualityName: 'scsBridgeRenderCapture',       // ← TQNI byte-identity with scsBridge.e key
    toolName: 'scs_render_capture',
    description:
      'NEON PLAYTESTER · Capture the CURRENT render of a live window to a PNG on disk. For a ' +
      'shader-wrapped SCP this returns the STREAMED pre-shader frame (the render context PRIOR ' +
      'to the shader pass, as it streams); flat windows use capturePage. The PNG lands under ' +
      'Cascades/Bridge/playtests/<runId>/<label>-<ts>.png — Read the returned path to SEE the ' +
      'window (visual verification of UI work). Target resolution: target.windowId → ' +
      'target.sessionId (a terminal session window) → target.scpName → the ACTIVE SCP ' +
      '(bridge.json). Returns { renderCapture: { ok, path, w, h, bytes, mode:"stream"|"page" } }. ' +
      'For captures INSIDE a timed interaction sequence use the scs_orchestrate_window ' +
      '{kind:"capture"} step instead.',
    inputSchema: {
      type: 'object',
      properties: {
        target: {
          type: 'object',
          description:
            'Optional window target: { windowId?: number, sessionId?: string (terminal), scpName?: string }. Omit to target the ACTIVE SCP window.',
        },
        label: { type: 'string', description: 'Capture label — names the PNG (<label>-<ts>.png). Default "render".' },
        runId: { type: 'string', description: 'Optional PlayTest run id — groups captures under playtests/<runId>/.' },
        callerSessionUlid: { type: 'string', description: 'Caller agent session ULID (optional · diagnostics)' },
      },
      required: [],
    },
    toolType: 'actionable',
    handlerType: 'quality',        // ← routes through createSCPQualityManifold (quality path)
    strategyName: '',
    relatedActionables: ['scs_orchestrate_window'],
  };

  // MRQ-B · RELAY-ENQUEUE · scs_relay_enqueue · the sweep's batch enqueue onto messageRelayQue.
  // TQNI: qualityName MUST byte-match scsBridge.e key 'scsBridgeEnqueueRelayBatch'.
  // Takes JSON-SAFE relay specs; the Quality builds the runtime relay Actions server-side
  // and dispatches scsBridgeRelayEnqueue. The RQPOAD drain Principle serializes the relays
  // one-at-a-time (no OS-focus collision when many workers are spawned in rapid succession).
  const relayEnqueueMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'scsBridge',
    qualityName: 'scsBridgeEnqueueRelayBatch',   // ← TQNI byte-identity with scsBridge.e key
    toolName: 'scs_relay_enqueue',
    description:
      'MRQ · Enqueue a batch of message-relay operations onto the bridge messageRelayQue. ' +
      'Each spec is an object { kind: "focus"|"send"|"resize"|"spawn", sessionId: string, ' +
      'text?: string (send only), scalePct?: number (resize only · e.g. 1.10 / 0.909) }. ' +
      'kind "spawn" creates+launches a Suite 8 worker AND delivers text as its priming, all ' +
      'inside ONE serialized block ({ kind: "spawn", sessionId: "", suite8Name, text?, model? }) ' +
      '- use one spawn spec per topic for stepped multi-worker sweeps. ' +
      'Specs are drained in array order, one block per relay. The bridge serializes the ' +
      'queued relays one-at-a-time (blocks between each focus/keystroke so concurrent workers ' +
      'never collide for OS focus). Use to deliver focus+send to a spawned research ' +
      'worker without racing other workers. PASS originScpName (this SCP designation, e.g. ' +
      'from scp.config.json) so the bridge returns focus to your SCP window after each send; ' +
      'omitted = the send still delivers but focus does not return.',
    inputSchema: {
      type: 'object',
      properties: {
        // JSONSchemaProperty.items is typed { type: string } only (shared contract · NOT
        // widened here · NR). The per-spec object shape lives in `description` above; the
        // server-side scsBridgeEnqueueRelayBatch Method validates each spec defensively.
        specs: {
          type: 'array',
          items: { type: 'object' },
          description:
            'Ordered relay specs — each { kind, sessionId, text?, scalePct? }; drained in ' +
            'array order, one block per relay.',
        },
        // C403 · the origin lane — threaded into every send-kind relay for Focus-Return-Out.
        originScpName: {
          type: 'string',
          description:
            'The calling SCP designation (scp.config.json scpName). Enables the focus ' +
            'return to your SCP window after each send; omitted = deliver without return.',
        },
      },
      required: ['specs'],
    },
    toolType: 'actionable',
    handlerType: 'quality',          // ← routes through createSCPQualityManifold (quality path)
    strategyName: '',
    relatedActionables: ['scs_deliver_vermillion', 'scp_focus_session', 'send_message'],
  };

  // ═══════════════════════════════════════════════════════════════════
  // GITM D3 (#634) · T2 ONE-ACTION OPERATIONS · the 13 gitm_* MCP tools
  // ───────────────────────────────────────────────────────────────────
  // BMTI shape · conceptName 'gitm' (selectStratiDECK resolves the Tier-1 peer).
  // TQNI invariant: qualityName MUST byte-match gitm.e.<key> exactly (dynamic
  // emitter lookup in createSCPQualityManifold) — any mismatch silently no-ops.
  // ═══════════════════════════════════════════════════════════════════
  // MULTI-SCP GITM MUXIFICATION (Fork B · MC-W1 · THE ORIGIN THREAD) — the SHARED origin property every
  // gitm_* tool's inputSchema.properties advertises (spread into each `properties` below · byte-parity).
  // OPTIONAL (never in a `required` array): a CALLING SCP names itself → resolveGitmTargetCwd routes the
  // op to ITS OWN repo (the CHIMERA repair); omit to run against the active SCP (env-first / dev:self).
  const GITM_ORIGIN_SCHEMA_PROP = {
    type: 'string',
    description:
      'MULTI-SCP GITM: the CALLING SCP name (or its absolute package dir) — routes this git op to that ' +
      "SCP's own repo. OPTIONAL: omit to run against the active SCP (env-first origin / dev:self).",
  } as const;

  const gitmStageFileMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'gitm',
    qualityName: 'gitmStageFile',
    toolName: 'gitm_stage_file',
    description:
      'GITM · Stage a file for commit (git add <path>). Updates stagedFiles within one ' +
      'WATCHDIAL cycle. Returns { ok, action, error, guardFired, reason, at }.',
    inputSchema: {
      type: 'object',
      properties: { path: { type: 'string', description: 'Repo-relative file path to stage' }, originScpName: GITM_ORIGIN_SCHEMA_PROP },
      required: ['path'],
    },
    toolType: 'actionable',
    handlerType: 'quality',
    strategyName: '',
    relatedActionables: [],
  };

  const gitmUnstageFileMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'gitm',
    qualityName: 'gitmUnstageFile',
    toolName: 'gitm_unstage_file',
    description:
      'GITM · Unstage a file (git restore --staged <path>). Returns the action result surface.',
    inputSchema: {
      type: 'object',
      properties: { path: { type: 'string', description: 'Repo-relative file path to unstage' }, originScpName: GITM_ORIGIN_SCHEMA_PROP },
      required: ['path'],
    },
    toolType: 'actionable',
    handlerType: 'quality',
    strategyName: '',
    relatedActionables: [],
  };

  const gitmCommitMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'gitm',
    qualityName: 'gitmCommit',
    toolName: 'gitm_commit',
    description:
      'GITM · Commit staged changes (git commit -m <message>). Soft guard: if nothing is ' +
      'staged, returns { guardFired: true, reason: "nothing-staged" } and git is not invoked.',
    inputSchema: {
      type: 'object',
      properties: { message: { type: 'string', description: 'Commit message' }, originScpName: GITM_ORIGIN_SCHEMA_PROP },
      required: ['message'],
    },
    toolType: 'actionable',
    handlerType: 'quality',
    strategyName: '',
    relatedActionables: [],
  };

  const gitmBranchCreateMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'gitm',
    qualityName: 'gitmBranchCreate',
    toolName: 'gitm_branch_create',
    description:
      'GITM · Create a branch (git branch <name>). CHECKOUT-TOGGLE: pass checkout:true to ' +
      'create AND switch onto it in one op (git switch -c <name> · carries dirty changes over); ' +
      'omit it (or false) for create-only (git branch <name>) — then switch separately via ' +
      'gitm_branch_switch.',
    inputSchema: {
      type: 'object',
      properties: {
        originScpName: GITM_ORIGIN_SCHEMA_PROP,
        name: { type: 'string', description: 'New branch name' },
        checkout: { type: 'boolean', description: 'true → create AND switch (git switch -c); false/absent → create-only' },
      },
      required: ['name'],
    },
    toolType: 'actionable',
    handlerType: 'quality',
    strategyName: '',
    relatedActionables: [],
  };

  const gitmBranchSwitchMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'gitm',
    qualityName: 'gitmBranchSwitch',
    toolName: 'gitm_branch_switch',
    description:
      'GITM · Switch branches (git switch <name>). GUARDSHUNT: if the working tree is dirty, ' +
      'returns { guardFired: true, reason: "dirty-tree", recommendation: "stash" } without ' +
      'switching (never a silent force-checkout). Stash first, then switch.',
    inputSchema: {
      type: 'object',
      properties: { name: { type: 'string', description: 'Branch name to switch to' }, originScpName: GITM_ORIGIN_SCHEMA_PROP },
      required: ['name'],
    },
    toolType: 'actionable',
    handlerType: 'quality',
    strategyName: '',
    relatedActionables: [],
  };

  const gitmStashPushMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'gitm',
    qualityName: 'gitmStashPush',
    toolName: 'gitm_stash_push',
    // GITM Dev Epoch (MD-B · THE LABELED STASH) — message is OPTIONAL (an empty/absent label = a
    // plain `git stash push`); the Stash Browser's label prompt supplies it when present.
    description: 'GITM · Stash working changes (git stash push [-m <message>]). Message optional — omit for a plain stash.',
    inputSchema: {
      type: 'object',
      properties: { message: { type: 'string', description: 'Optional stash label' }, originScpName: GITM_ORIGIN_SCHEMA_PROP },
      required: [],
    },
    toolType: 'actionable',
    handlerType: 'quality',
    strategyName: '',
    relatedActionables: ['gitm_stash_pop', 'gitm_stash_list'],
  };

  const gitmStashPopMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'gitm',
    qualityName: 'gitmStashPop',
    toolName: 'gitm_stash_pop',
    description: 'GITM · Restore the most recent stash (git stash pop).',
    inputSchema: { type: 'object', properties: { originScpName: GITM_ORIGIN_SCHEMA_PROP }, required: [] },
    toolType: 'actionable',
    handlerType: 'quality',
    strategyName: '',
    relatedActionables: ['gitm_stash_list'],
  };

  // GITM Dev Epoch (MD-B · THE LABELED STASH BROWSER) — gitm_stash_list · reads the stash roster
  // (git stash list --format=%gd|%s) into gitmJson.stashList (the Stash Browser panel renders it).
  const gitmStashListMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'gitm',
    qualityName: 'gitmStashList',
    toolName: 'gitm_stash_list',
    description:
      'GITM · List the stash roster (git stash list --format=%gd|%s). Populates gitmJson.stashList ' +
      'with one `<gitref>|<subject>` line per stash entry (e.g. `stash@{0}|WIP on master: …`). ' +
      'The command lands on the command log. Returns the action result surface.',
    inputSchema: { type: 'object', properties: { originScpName: GITM_ORIGIN_SCHEMA_PROP }, required: [] },
    toolType: 'actionable',
    handlerType: 'quality',
    strategyName: '',
    relatedActionables: ['gitm_stash_push', 'gitm_stash_pop'],
  };

  // GITM Dev Epoch (MD-B · THE BRANCH-SET LAW) — gitm_select_branch · the Shield-Gated Turn Over
  // Routing Law (three routes: b/-shield-guard · plain-ground turnover · newest-Sword equip + re-pair).
  const gitmSelectBranchMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'gitm',
    qualityName: 'gitmSelectBranch',
    toolName: 'gitm_select_branch',
    description:
      'GITM · Set a branch ACTIVE through the Branch-Set Law (routes through the Bridge Turn Over ' +
      'System). Three routes: (a) a b/ branch can NEVER be a Shield A → { guardFired:true, ' +
      'reason:"b-branch-cannot-be-shield" } (nothing moves); (b) a Shield with NO paired Sword → ' +
      're-register it + turn over onto the plain ground (source A); (c) a Shield WITH Swords → ' +
      're-register + equip the NEWEST paired Sword (b/<shield>-<ts>, greatest ts) + turn over onto ' +
      'the Sword seat (source B). The working signifier follows the selected Shield (the re-pair).',
    inputSchema: {
      type: 'object',
      properties: {
        originScpName: GITM_ORIGIN_SCHEMA_PROP,
        branchName: { type: 'string', description: 'The branch (Shield) to set active — must NOT be a b/ Sword' },
      },
      required: ['branchName'],
    },
    toolType: 'actionable',
    handlerType: 'quality',
    strategyName: '',
    relatedActionables: ['gitm_turn_over_with_source', 'gitm_branch_switch'],
  };

  // GITM Dev Epoch (MD-B · STAGE-FROM-DIFF) — gitm_stage_hunk · stage a unified-diff patch fragment
  // into the index without touching the working tree (git apply --cached - · the MD-A stdin seam).
  const gitmStageHunkMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'gitm',
    qualityName: 'gitmStageHunk',
    toolName: 'gitm_stage_hunk',
    description:
      'GITM · Stage a single hunk (or any unified-diff patch fragment) into the index without ' +
      'touching the working tree (git apply --cached - via stdin · lands on the command log). ' +
      'A failed apply hands the git stderr ({ ok:false, guardFired:true, reason:"apply-failed" }); ' +
      'an empty patch is guarded ({ reason:"empty-patch" }).',
    inputSchema: {
      type: 'object',
      properties: {
        originScpName: GITM_ORIGIN_SCHEMA_PROP,
        patch: { type: 'string', description: 'The unified-diff patch text to apply --cached (a hunk or a full file diff)' },
      },
      required: ['patch'],
    },
    toolType: 'actionable',
    handlerType: 'quality',
    strategyName: '',
    relatedActionables: ['gitm_load_diff', 'gitm_stage_file'],
  };

  const gitmLoadLogMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'gitm',
    qualityName: 'gitmLoadLog',
    toolName: 'gitm_load_log',
    description:
      'GITM · Read recent commit log (git log). Returns parsed commitLog entries ' +
      '({ hash, author, email, date, subject }[]) plus the action result surface.',
    inputSchema: {
      type: 'object',
      properties: { limit: { type: 'number', description: 'Max entries (default 50)' }, originScpName: GITM_ORIGIN_SCHEMA_PROP },
      required: [],
    },
    toolType: 'informative',
    handlerType: 'quality',
    strategyName: '',
    relatedActionables: [],
  };

  const gitmLoadLogGraphMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'gitm',
    qualityName: 'gitmLoadLogGraph',
    toolName: 'gitm_load_log_graph',
    description:
      'GITM · Read the commit DAG (git log --topo-order). Returns commitGraph entries ' +
      '({ hash, parents, refs, author, subject }[] · TRUE parents + ref decorations) plus ' +
      'the action result surface. The graph view (GitmCommitGraph.vue) renders lanes off ' +
      'parents, branch/tag chips off refs, and the luminous HEAD.',
    inputSchema: {
      type: 'object',
      properties: { limit: { type: 'number', description: 'Max entries (default 100)' }, originScpName: GITM_ORIGIN_SCHEMA_PROP },
      required: [],
    },
    toolType: 'informative',
    handlerType: 'quality',
    strategyName: '',
    relatedActionables: [],
  };

  const gitmLoadDiffMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'gitm',
    qualityName: 'gitmLoadDiff',
    toolName: 'gitm_load_diff',
    description:
      'GITM · Read a unified diff (git diff [--staged] [<path>]). Returns activeDiff (raw ' +
      'unified-diff string) plus the action result surface.',
    inputSchema: {
      type: 'object',
      properties: {
        originScpName: GITM_ORIGIN_SCHEMA_PROP,
        path: { type: 'string', description: 'Optional repo-relative path to scope the diff' },
        staged: { type: 'boolean', description: 'Diff the staged set (--staged) when true' },
      },
      required: [],
    },
    toolType: 'informative',
    handlerType: 'quality',
    strategyName: '',
    relatedActionables: [],
  };

  const gitmDiscardMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'gitm',
    qualityName: 'gitmDiscard',
    toolName: 'gitm_discard',
    description:
      'GITM · DESTRUCTIVE · Discard changes to a single file (tracked → git restore; untracked → ' +
      'git clean -f). HARD confirm gate: pass confirmed:true ONLY after explicit user ' +
      'acknowledgment. confirmed!==true → { guardFired: true, reason: ' +
      '"destructive-confirm-required" } and git is not invoked.',
    inputSchema: {
      type: 'object',
      properties: {
        originScpName: GITM_ORIGIN_SCHEMA_PROP,
        path: { type: 'string', description: 'Repo-relative file path to discard' },
        confirmed: { type: 'boolean', description: 'Must be true to perform the destructive discard' },
      },
      required: ['path', 'confirmed'],
    },
    toolType: 'actionable',
    handlerType: 'quality',
    strategyName: '',
    relatedActionables: [],
  };

  // THE VERSIONING MUXAMETER · the CLI self-update — the bridge updates ITSELF (npm
  // install -g scs-bridge at the global prefix · WITH scripts). On success gitm.json's
  // cliUpdate stamps 'restart-required' (fresh on-disk version vs the running process);
  // the RESTART stays in the user's hands.
  const gitmRunCliUpdateMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'gitm',
    qualityName: 'gitmRunCliUpdate',
    toolName: 'gitm_run_cli_update',
    description:
      'GITM · THE VERSIONING MUXAMETER · run `npm install -g scs-bridge` (the CLI self-update). ' +
      'Fires when the counter verdict is cli anor both (remote.cli > installed.cli). On success ' +
      'gitm.json cliUpdate reads restart-required — the user relaunches the bridge to load it.',
    inputSchema: { type: 'object', properties: {}, required: [] },
    toolType: 'actionable',
    handlerType: 'quality',
    strategyName: '',
    relatedActionables: [],
  };

  const gitmPullMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'gitm',
    qualityName: 'gitmPull',
    toolName: 'gitm_pull',
    description:
      'GITM · Fast-forward pull (git pull --ff-only). On failure surfaces a classified error ' +
      '("no-remote" | "merge-conflict" | "pull-failed").',
    inputSchema: { type: 'object', properties: { originScpName: GITM_ORIGIN_SCHEMA_PROP }, required: [] },
    toolType: 'actionable',
    handlerType: 'quality',
    strategyName: '',
    relatedActionables: [],
  };

  const gitmPushMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'gitm',
    qualityName: 'gitmPush',
    toolName: 'gitm_push',
    description:
      'GITM · Push to remote (git push). GUARDSHUNT: if behind the remote, returns ' +
      '{ guardFired: true, reason: "behind-remote", recommendation: "pull" } without pushing. ' +
      'On failure: "push-rejected" | "no-remote". Refreshes ahead/behind after a successful push.',
    inputSchema: { type: 'object', properties: { originScpName: GITM_ORIGIN_SCHEMA_PROP }, required: [] },
    toolType: 'actionable',
    handlerType: 'quality',
    strategyName: '',
    relatedActionables: [],
  };

  const gitmSetRemoteMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'gitm',
    qualityName: 'gitmSetRemote',
    toolName: 'gitm_set_remote',
    description:
      'GITM · C928 · Set anor modify the remote origin URL (git remote add/set-url origin). ' +
      'PARAMSEAL: only https:// · git@host:path · ssh:// shapes pass — otherwise ' +
      '{ guardFired: true, reason: "invalid-remote-url" } and git is never invoked. ' +
      'Refreshes the STARC status (remoteOrigin rides gitm.json) on success. ' +
      'Pair with gitm_push — the push of a release-ready SCP to its origin IS the release.',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'The remote origin URL (https:// · git@host:path · ssh://).' },
        originScpName: GITM_ORIGIN_SCHEMA_PROP,
      },
      required: ['url'],
    },
    toolType: 'actionable',
    handlerType: 'quality',
    strategyName: '',
    relatedActionables: [],
  };

  const gitmMergeFfOnlyMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'gitm',
    qualityName: 'gitmMergeFfOnly',
    toolName: 'gitm_merge_ff_only',
    description:
      'GITM · Fast-forward-only merge (git merge --ff-only <branch>). Non-ff / conflicting ' +
      'merges return { error: "merge-conflict" } with a T3-interactive-resolution note ' +
      '(non-ff merge is a T3/D4 surface, not exposed here).',
    inputSchema: {
      type: 'object',
      properties: { branch: { type: 'string', description: 'Branch to merge into the current branch' }, originScpName: GITM_ORIGIN_SCHEMA_PROP },
      required: ['branch'],
    },
    toolType: 'actionable',
    handlerType: 'quality',
    strategyName: '',
    relatedActionables: [],
  };

  // ═══════════════════════════════════════════════════════════════════
  // GITM Dev Menu (#644) · DEVBAR ACTIONS · the 5 new gitm_* tools (conceptName 'gitm')
  // ───────────────────────────────────────────────────────────────────
  // 3 T2 (stage-all / unstage-all / fetch) + 2 T3 (commit-amend single-confirm ·
  // discard-all double-confirm). TQNI invariant: qualityName MUST byte-match
  // gitm.e.<key> exactly (dynamic emitter lookup).
  // ═══════════════════════════════════════════════════════════════════
  const gitmStageAllMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'gitm',
    qualityName: 'gitmStageAll',
    toolName: 'gitm_stage_all',
    description:
      'GITM · Stage ALL changes (git add -A) — no commit. Stages the whole working tree; ' +
      'distinct from gitm_stage_all_and_commit (which also commits). Returns the action ' +
      'result surface.',
    inputSchema: { type: 'object', properties: { originScpName: GITM_ORIGIN_SCHEMA_PROP }, required: [] },
    toolType: 'actionable',
    handlerType: 'quality',
    strategyName: '',
    relatedActionables: [],
  };

  const gitmUnstageAllMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'gitm',
    qualityName: 'gitmUnstageAll',
    toolName: 'gitm_unstage_all',
    description:
      'GITM · Unstage the ENTIRE index (git restore --staged .). Distinct from ' +
      'gitm_unstage_file (one path). Returns the action result surface.',
    inputSchema: { type: 'object', properties: { originScpName: GITM_ORIGIN_SCHEMA_PROP }, required: [] },
    toolType: 'actionable',
    handlerType: 'quality',
    strategyName: '',
    relatedActionables: [],
  };

  const gitmFetchMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'gitm',
    qualityName: 'gitmFetch',
    toolName: 'gitm_fetch',
    description:
      'GITM · Fetch from the remote WITHOUT merging (git fetch --prune). Updates the ' +
      'remote-tracking refs (and the ahead/behind counts on the next read) but never touches ' +
      'the working tree. On failure surfaces a classified error ("no-remote" | "fetch-failed").',
    inputSchema: { type: 'object', properties: { originScpName: GITM_ORIGIN_SCHEMA_PROP }, required: [] },
    toolType: 'actionable',
    handlerType: 'quality',
    strategyName: '',
    relatedActionables: ['gitm_pull'],
  };

  const gitmCommitAmendMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'gitm',
    qualityName: 'gitmCommitAmend',
    toolName: 'gitm_commit_amend',
    description:
      'GITM · GUARDED · Amend the last commit (git commit --amend). Pass a non-empty message ' +
      'to rewrite the message (--amend -m); omit it to fold the staged changes into the last ' +
      'commit keeping its message (--amend --no-edit). Rewrites history → SINGLE confirm ' +
      '(WATCHKEY): call once with no confirmToken to receive ' +
      '{ guardFired:true, reason:"amend-confirm-required", confirmToken }, then call again with ' +
      'it to execute. The token is sealed to the message and expires after 2 minutes.',
    inputSchema: {
      type: 'object',
      properties: {
        originScpName: GITM_ORIGIN_SCHEMA_PROP,
        message: { type: 'string', description: 'New commit message; omit/empty → --no-edit (reuse last)' },
        confirmToken: { type: 'string', description: 'Single-confirm token from the call-1 guard' },
      },
      required: [],
    },
    toolType: 'actionable',
    handlerType: 'quality',
    strategyName: '',
    relatedActionables: [],
  };

  const gitmDiscardAllMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'gitm',
    qualityName: 'gitmDiscardAll',
    toolName: 'gitm_discard_all',
    description:
      'GITM · GUARDED · DESTROYS ALL uncommitted work (git restore . then git clean -fd — ' +
      'reverts tracked changes AND removes untracked files/dirs). DOUBLE confirm (WATCHKEY): ' +
      'call once with no confirmToken to receive ' +
      '{ guardFired:true, reason:"discard-all-confirm-required", confirmToken }, then call again ' +
      'with it to execute. The token expires after 2 minutes. More destructive than ' +
      'gitm_discard (single path).',
    inputSchema: {
      type: 'object',
      properties: {
        originScpName: GITM_ORIGIN_SCHEMA_PROP,
        confirmToken: { type: 'string', description: 'Double-confirm token from the call-1 guard' },
      },
      required: [],
    },
    toolType: 'actionable',
    handlerType: 'quality',
    strategyName: '',
    relatedActionables: [],
  };

  // ═══════════════════════════════════════════════════════════════════
  // GITM D4 (#635) · T3 GUARDED OPERATIONS · the 5 warning-muxified gitm_* tools
  // ───────────────────────────────────────────────────────────────────
  // WATCHKEY double-confirm round (reset --hard / branch -D / force-push) +
  // guard-as-outcome (merge) + conflicts-guard (merge-abort). TQNI invariant:
  // qualityName MUST byte-match gitm.e.<key> exactly (dynamic emitter lookup).
  // ═══════════════════════════════════════════════════════════════════
  const gitmResetMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'gitm',
    qualityName: 'gitmReset',
    toolName: 'gitm_reset',
    description:
      'GITM · GUARDED · Reset HEAD (git reset [--soft|--mixed|--hard] <ref>). soft/mixed: ' +
      'single confirm — pass confirmed:true. --hard is DESTRUCTIVE (discards working-tree ' +
      'changes) and requires DOUBLE confirm (WATCHKEY): call once with no confirmToken to ' +
      'receive { guardFired:true, reason:"reset-confirm-required", confirmToken }, then call ' +
      'again passing that confirmToken to execute. The token is sealed to (mode, ref) and ' +
      'expires after 2 minutes.',
    inputSchema: {
      type: 'object',
      properties: {
        originScpName: GITM_ORIGIN_SCHEMA_PROP,
        ref: { type: 'string', description: 'Reset target (e.g. HEAD~1, a commit hash)' },
        mode: { type: 'string', description: 'soft | mixed | hard (hard destroys working-tree changes)' },
        confirmed: { type: 'boolean', description: 'soft/mixed single-confirm — must be true to run' },
        confirmToken: { type: 'string', description: '--hard double-confirm token from the call-1 guard' },
      },
      required: ['ref', 'mode'],
    },
    toolType: 'actionable',
    handlerType: 'quality',
    strategyName: '',
    relatedActionables: [],
  };

  const gitmBranchDeleteMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'gitm',
    qualityName: 'gitmBranchDelete',
    toolName: 'gitm_branch_delete',
    description:
      'GITM · GUARDED · Delete a branch (git branch -d|-D <name>). force:false tries the ' +
      'merged-only -d; an unmerged branch returns { guardFired:true, ' +
      'reason:"branch-not-merged-use-force" } — re-call with force:true. force:true uses -D ' +
      '(DESTRUCTIVE · drops unmerged commits) behind DOUBLE confirm (WATCHKEY): call once ' +
      'with no confirmToken to receive { confirmToken }, then call again with it to execute. ' +
      'The token is sealed to the branch name and expires after 2 minutes.',
    inputSchema: {
      type: 'object',
      properties: {
        originScpName: GITM_ORIGIN_SCHEMA_PROP,
        name: { type: 'string', description: 'Branch name to delete' },
        force: { type: 'boolean', description: 'false → -d (merged-only); true → -D (force, token-gated)' },
        confirmToken: { type: 'string', description: '-D double-confirm token from the call-1 guard' },
      },
      required: ['name', 'force'],
    },
    toolType: 'actionable',
    handlerType: 'quality',
    strategyName: '',
    relatedActionables: [],
  };

  const gitmForcePushMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'gitm',
    qualityName: 'gitmForcePush',
    toolName: 'gitm_force_push',
    description:
      'GITM · GUARDED · Force-push to remote with lease protection (git push ' +
      '--force-with-lease — raw --force is NEVER exposed; the lease aborts if a teammate ' +
      'pushed since your last fetch). DOUBLE confirm (WATCHKEY): call once with no ' +
      'confirmToken to receive { guardFired:true, reason:"force-push-confirm-required", ' +
      'confirmToken }, then call again with it to execute. Pushing a protected branch ' +
      '(main/master/develop/release/*) adds a soft protected-branch note but still runs on a ' +
      'valid token. The token expires after 2 minutes.',
    inputSchema: {
      type: 'object',
      properties: {
        originScpName: GITM_ORIGIN_SCHEMA_PROP,
        remote: { type: 'string', description: 'Optional remote name (default: tracking remote)' },
        branch: { type: 'string', description: 'Optional branch ref to push' },
        confirmToken: { type: 'string', description: 'Double-confirm token from the call-1 guard' },
      },
      required: [],
    },
    toolType: 'actionable',
    handlerType: 'quality',
    strategyName: '',
    relatedActionables: [],
  };

  const gitmMergeMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'gitm',
    qualityName: 'gitmMerge',
    toolName: 'gitm_merge',
    description:
      'GITM · GUARDED · Merge a branch allowing a non-fast-forward merge (git merge <branch>). ' +
      'The merge always runs; the guard is the OUTCOME — a conflicting merge returns ' +
      '{ ok:false, error:"merge-conflict", reason:"merge-conflict-resolution-required" } and ' +
      'leaves the conflicted files in the repo conflicts list. Resolve and commit, or run ' +
      'gitm_merge_abort to back out. (Fast-forward-only merges are gitm_merge_ff_only.)',
    // FIELD-DRIFT REPAIR (093 · E3) — `source` is the CANONICAL merge-source field; `branch`
    // stays accepted for back-compat. The quality reads `source ?? branch`; a missing value
    // fires the guard 'merge-source-required' (never `git merge undefined`).
    inputSchema: {
      type: 'object',
      properties: {
        originScpName: GITM_ORIGIN_SCHEMA_PROP,
        source: { type: 'string', description: 'Branch to merge into the current branch' },
        branch: { type: 'string', description: 'Alias of source (back-compat)' },
      },
      required: ['source'],
    },
    toolType: 'actionable',
    handlerType: 'quality',
    strategyName: '',
    relatedActionables: ['gitm_merge_abort', 'gitm_merge_ff_only'],
  };

  const gitmMergeAbortMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'gitm',
    qualityName: 'gitmMergeAbort',
    toolName: 'gitm_merge_abort',
    description:
      'GITM · Abort an in-progress merge and restore the pre-merge state (git merge --abort). ' +
      'Guard: only meaningful mid-merge — if there are no conflicts, returns ' +
      '{ guardFired:true, reason:"no-merge-in-progress" } and git is not invoked. The recovery ' +
      'op for a conflicting gitm_merge.',
    inputSchema: { type: 'object', properties: { originScpName: GITM_ORIGIN_SCHEMA_PROP }, required: [] },
    toolType: 'actionable',
    handlerType: 'quality',
    strategyName: '',
    relatedActionables: ['gitm_merge'],
  };

  // ═══════════════════════════════════════════════════════════════════
  // THE SCP COMMAND MENU (W3/W4 · THE WORKTREE RAIL) · MULTIPLY + LIST + TYPED-NAME DELETE
  // ───────────────────────────────────────────────────────────────────
  const gitmWorktreeAddMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'gitm',
    qualityName: 'gitmWorktreeAdd',
    toolName: 'gitm_worktree_add',
    description:
      'GITM · Add a git worktree INSTANCE of the calling SCP (git worktree add) and register it as a ' +
      'FIRST-CLASS SCPs.json citizen — its own name (${scpName}--wt-${branchSlug}), path (a sibling ' +
      'citizen dir under scps/), a fresh port-pair, and a re-stamped scp.config.json. Guards: the ' +
      'origin must have its OWN .git (the dev:self template is excluded) · the branch must exist · the ' +
      'target dir must be free · the instance name must be collision-free. The A tree is untouched (a ' +
      'checkout into a NEW tree · no restart). Returns { ok, action, error, guardFired, reason, at } ' +
      '(+ instanceName · port on success).',
    inputSchema: {
      type: 'object',
      properties: {
        originScpName: GITM_ORIGIN_SCHEMA_PROP,
        branch: { type: 'string', description: 'Existing branch the worktree checks out (must exist · verbatim)' },
        instanceSlug: { type: 'string', description: 'Optional slug override (absent → derived from branch via /→-)' },
      },
      required: ['branch'],
    },
    toolType: 'actionable',
    handlerType: 'quality',
    strategyName: '',
    relatedActionables: ['gitm_worktree_list', 'gitm_worktree_remove'],
  };

  const gitmWorktreeListMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'gitm',
    qualityName: 'gitmWorktreeList',
    toolName: 'gitm_worktree_list',
    description:
      'GITM · List the git worktree roster (git worktree list --porcelain). Populates gitmJson.worktrees ' +
      'with one { path, branch, head } row per tree (the main A tree first, then each --wt- instance). ' +
      'A pure read — no guard, no confirmation. The command lands on the command log.',
    inputSchema: { type: 'object', properties: { originScpName: GITM_ORIGIN_SCHEMA_PROP }, required: [] },
    toolType: 'actionable',
    handlerType: 'quality',
    strategyName: '',
    relatedActionables: ['gitm_worktree_add', 'gitm_worktree_remove'],
  };

  const gitmWorktreeRemoveMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'gitm',
    qualityName: 'gitmWorktreeRemove',
    toolName: 'gitm_worktree_remove',
    description:
      'GITM · DESTRUCTIVE · Remove a worktree instance (git worktree remove) and RETIRE its registration ' +
      '(SCPs.json entry + slice + watcher). DOUBLE confirm (WATCHKEY): call once with no confirmToken to ' +
      'receive { guardFired:true, reason:"worktree-remove-needs-confirmation", confirmToken }, then call ' +
      'again passing that confirmToken to execute. The token is SEALED to the instanceName — a token for ' +
      'instance X can never remove Y. A dirty/locked tree refuses a clean remove → ' +
      '{ guardFired:true, reason:"worktree-dirty-use-force" }; re-call with force:true to override. The ' +
      'token expires after 2 minutes.',
    inputSchema: {
      type: 'object',
      properties: {
        originScpName: GITM_ORIGIN_SCHEMA_PROP,
        instanceName: { type: 'string', description: 'The exact SCPs.json citizen name to remove (the typed-name seal)' },
        force: { type: 'boolean', description: 'true → git worktree remove --force (overrides a dirty/locked tree)' },
        confirmToken: { type: 'string', description: 'Double-confirm token from the call-1 guard' },
      },
      required: ['instanceName'],
    },
    toolType: 'actionable',
    handlerType: 'quality',
    strategyName: '',
    relatedActionables: ['gitm_worktree_add', 'gitm_worktree_list'],
  };

  // ═══════════════════════════════════════════════════════════════════
  // GITM Dev Epoch (MD-D · TRUST COMPLETIONS) · UNIVERSAL UNDO + THE THREE-WAY SURFACE
  // ───────────────────────────────────────────────────────────────────
  const gitmLoadReflogMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'gitm',
    qualityName: 'gitmLoadReflog',
    toolName: 'gitm_load_reflog',
    description:
      'GITM · Read the reflog (git reflog --format=%h|%gd|%gs -<limit>). Returns reflogEntries ' +
      '(raw "<hash>|<selector>|<subject>" lines) plus the action result surface. Each selector ' +
      '(e.g. HEAD@{2}) is the reflogRef gitm_undo takes to move HEAD back to any prior state.',
    inputSchema: {
      type: 'object',
      properties: { limit: { type: 'number', description: 'Max reflog entries (default 20)' }, originScpName: GITM_ORIGIN_SCHEMA_PROP },
      required: [],
    },
    toolType: 'informative',
    handlerType: 'quality',
    strategyName: '',
    relatedActionables: ['gitm_undo'],
  };

  const gitmUndoMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'gitm',
    qualityName: 'gitmUndo',
    toolName: 'gitm_undo',
    description:
      'GITM · GUARDED · Universal undo (git reset --mixed <reflogRef>) — move HEAD + index back ' +
      'to any reflog state while KEEPING the working tree (the safe undo). DOUBLE confirm ' +
      '(WATCHKEY): call once with no confirmToken to receive { guardFired:true, ' +
      'reason:"undo-confirm-required", confirmToken, preview } — the preview is the diff HEAD → ' +
      'the target (what the undo will change) — then call again with the confirmToken to execute. ' +
      'The token is sealed to reflogRef and expires after 2 minutes.',
    inputSchema: {
      type: 'object',
      properties: {
        originScpName: GITM_ORIGIN_SCHEMA_PROP,
        reflogRef: { type: 'string', description: 'The reflog target (e.g. HEAD@{2}, a commit hash)' },
        confirmToken: { type: 'string', description: 'Double-confirm token from the call-1 guard' },
      },
      required: ['reflogRef'],
    },
    toolType: 'actionable',
    handlerType: 'quality',
    strategyName: '',
    relatedActionables: ['gitm_load_reflog'],
  };

  const gitmLoadConflictMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'gitm',
    qualityName: 'gitmLoadConflict',
    toolName: 'gitm_load_conflict',
    description:
      'GITM · Load the four sides of a conflicted file into activeConflict for the three-way ' +
      'editor: ours (git show :2: · LOCAL/HEAD), base (:1: · merge base), theirs (:3: · REMOTE), ' +
      'and merged (the working file\'s current marker-laden content). Read-only. The SCP conflict ' +
      'editor reads gitmJson.activeConflict {path, ours, base, theirs, merged}.',
    inputSchema: {
      type: 'object',
      properties: { path: { type: 'string', description: 'Repo-relative path of the conflicted file' }, originScpName: GITM_ORIGIN_SCHEMA_PROP },
      required: ['path'],
    },
    toolType: 'informative',
    handlerType: 'quality',
    strategyName: '',
    relatedActionables: ['gitm_resolve_conflict', 'gitm_merge_abort'],
  };

  const gitmResolveConflictMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'gitm',
    qualityName: 'gitmResolveConflict',
    toolName: 'gitm_resolve_conflict',
    description:
      'GITM · Save & Mark Resolved: write the resolved content to the working file THEN git add ' +
      'it (mark-resolved = stage · the git convention for resolving a conflict). A failed write ' +
      'returns { ok:false, reason:"resolve-write-failed" } and git is NOT invoked (activeConflict ' +
      'is kept so you can retry). On success the file is staged and activeConflict clears.',
    inputSchema: {
      type: 'object',
      properties: {
        originScpName: GITM_ORIGIN_SCHEMA_PROP,
        path: { type: 'string', description: 'Repo-relative path of the conflicted file' },
        content: { type: 'string', description: 'The resolved file content (the OUTPUT pane)' },
      },
      required: ['path', 'content'],
    },
    toolType: 'actionable',
    handlerType: 'quality',
    strategyName: '',
    relatedActionables: ['gitm_load_conflict', 'gitm_merge_abort'],
  };

  // ═══════════════════════════════════════════════════════════════════
  // GITM A↔B (#641) · THE 7 A/B RESERVE-MECHANISM gitm_* TOOLS (conceptName 'gitm')
  // ───────────────────────────────────────────────────────────────────
  // The Stable A / Create B / Turn Over / Merge B→A flow + the failsafe revert. TQNI
  // invariant: qualityName MUST byte-match gitm.e.<key> exactly (dynamic emitter lookup).
  // ═══════════════════════════════════════════════════════════════════
  const gitmStageAllAndCommitMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'gitm',
    qualityName: 'gitmStageAllAndCommit',
    toolName: 'gitm_stage_all_and_commit',
    description:
      'GITM A↔B · Stage the whole working tree and commit (git add -A && git commit -m ' +
      '<message>). Composite used by the register-stable-A flow (A must be clean before B ' +
      'is created). A clean tree surfaces "nothing to commit" as ok:false.',
    inputSchema: {
      type: 'object',
      properties: { message: { type: 'string', description: 'Commit message' }, originScpName: GITM_ORIGIN_SCHEMA_PROP },
      required: ['message'],
    },
    toolType: 'actionable',
    handlerType: 'quality',
    strategyName: '',
    relatedActionables: ['gitm_register_stable'],
  };

  const gitmRegisterStableMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'gitm',
    qualityName: 'gitmRegisterStable',
    toolName: 'gitm_register_stable',
    description:
      'GITM A↔B · Register the stable A. With `branch`: registers THAT branch VERBATIM ' +
      '(existence-gated · no transformation — the Selection-Verbatim law). Without: marks the ' +
      'current seat via the stable-root derivation. Run after committing via ' +
      'gitm_stage_all_and_commit.',
    inputSchema: { type: 'object', properties: { originScpName: GITM_ORIGIN_SCHEMA_PROP, branch: { type: 'string', description: 'The exact branch to register as A (verbatim · existence-gated). Absent → the current seat derivation.' } }, required: [] },
    toolType: 'actionable',
    handlerType: 'quality',
    strategyName: '',
    relatedActionables: ['gitm_stage_all_and_commit', 'gitm_create_working'],
  };

  const gitmCreateWorkingMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'gitm',
    qualityName: 'gitmCreateWorking',
    toolName: 'gitm_create_working',
    description:
      'GITM A↔B · Create the candidate B branch from A and switch onto it (git branch ' +
      'b/<shield>-<ts> && git switch b/<shield>-<ts>). GUARDSHUNTs: dirty tree → ' +
      '{ guardFired:true, reason:"dirty-tree" }; no stable A → ' +
      '{ guardFired:true, reason:"no-stable-registered" }.',
    inputSchema: { type: 'object', properties: { originScpName: GITM_ORIGIN_SCHEMA_PROP }, required: [] },
    toolType: 'actionable',
    handlerType: 'quality',
    strategyName: '',
    relatedActionables: ['gitm_turn_over_with_source'],
  };

  const gitmTurnOverWithSourceMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'gitm',
    qualityName: 'gitmTurnOverWithSource',
    toolName: 'gitm_turn_over_with_source',
    description:
      'GITM A↔B · Turn over to a source branch: switch to it THEN write .bridge-restart.json ' +
      '(the order is critical — the checkout precedes the restart so nodemon rebuilds the ' +
      'correct branch). source ∈ {A, B}. Empty target → ' +
      '{ guardFired:true, reason:"target-branch-empty" }; failed switch → ' +
      '{ guardFired:true, reason:"switch-failed" } (the restart file is never written). ' +
      'Turn Over A WITH WORKING CHANGES (a working B exists AND the tree is dirty, or the ' +
      'checkout is on a b/ branch) is HELD behind a DOUBLE confirm (WATCHKEY): call once with ' +
      'no confirmToken to receive { guardFired:true, reason:"a-turnover-needs-confirmation", ' +
      'confirmToken }, then call again passing that confirmToken to CARRY the working changes ' +
      'into B — the turn-over then SERVES B (the app reboots ONTO B so you see your changes; A ' +
      'remains the guarded stable you can revert to). The token is sealed to (source) and expires in 120s.',
    inputSchema: {
      type: 'object',
      properties: {
        originScpName: GITM_ORIGIN_SCHEMA_PROP,
        source: { type: 'string', description: 'A | B — which branch to serve' },
        confirmToken: {
          type: 'string',
          description:
            'A-turn-over double-confirm token from the call-1 guard (carry working changes into B, then serve B)',
        },
      },
      required: ['source'],
    },
    toolType: 'actionable',
    handlerType: 'quality',
    strategyName: '',
    relatedActionables: ['gitm_revert_to_stable', 'gitm_confirm_success'],
  };

  const gitmRevertToStableMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'gitm',
    qualityName: 'gitmRevertToStable',
    toolName: 'gitm_revert_to_stable',
    description:
      'GITM A↔B · THE FAILSAFE · revert to stable A when B failed to boot: auto-commit B\'s ' +
      'state (if dirty) → switch to A → write .bridge-restart.json (source:A) to restart onto ' +
      'A\'s code. Called by the client over the outer-bridge /mcp during the SCP-down window. ' +
      'No stable A → { guardFired:true, reason:"no-stable-branch" }.',
    inputSchema: { type: 'object', properties: { originScpName: GITM_ORIGIN_SCHEMA_PROP }, required: [] },
    toolType: 'actionable',
    handlerType: 'quality',
    strategyName: '',
    relatedActionables: ['gitm_turn_over_with_source'],
  };

  const gitmConfirmSuccessMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'gitm',
    qualityName: 'gitmConfirmSuccess',
    toolName: 'gitm_confirm_success',
    description:
      'GITM A↔B · Confirm B booted and works (pure state annotation · no git command). Sets ' +
      'abMode="success" and bMergeable=true (the Merge B→A gate). Run after the turn-over ' +
      'reconnected onto B and the user verified it.',
    inputSchema: { type: 'object', properties: { originScpName: GITM_ORIGIN_SCHEMA_PROP }, required: [] },
    toolType: 'actionable',
    handlerType: 'quality',
    strategyName: '',
    relatedActionables: ['gitm_merge_working'],
  };

  // D2 M9 W1 · THE TACTICAL BRIDGE ROLE CONTROLS — explicit assignment + role-following rename.
  const gitmAssignRoleMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'gitm',
    qualityName: 'gitmAssignRole',
    toolName: 'gitm_assign_role',
    description:
      'GITM Tactical Bridge · Assign ANY branch as A (guarded stable) anor B (working) EXPLICITLY, ' +
      'decoupled from the checkout — the b/ prefix is lineage naming, never role semantics. Guards: ' +
      'branch must exist · role collision · assigning B while seated on a foreign sword.',
    inputSchema: {
      type: 'object',
      properties: {
        role: { type: 'string', enum: ['A', 'B'], description: 'The role to assign' },
        branch: { type: 'string', description: 'The branch to assign the role to (verbatim · must exist)' },
        originScpName: GITM_ORIGIN_SCHEMA_PROP,
      },
      required: ['role', 'branch'],
    },
    toolType: 'actionable',
    handlerType: 'quality',
    strategyName: '',
    relatedActionables: ['gitm_rename_branch', 'gitm_register_stable', 'gitm_merge_working'],
  };

  const gitmResetAbMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'gitm',
    qualityName: 'gitmResetAb',
    toolName: 'gitm_reset_ab',
    description:
      'GITM Tactical Bridge · RECOVERY: zero the A/B machine to the true idle ground (stable/working/roles ' +
      'cleared · abMode idle) so the auto-induction re-arms on the next bind. Git branches untouched. ' +
      'Two-call confirm (call-1 mints confirmToken).',
    inputSchema: {
      type: 'object',
      properties: {
        confirmToken: { type: 'string', description: 'Double-confirm token from the call-1 guard' },
        originScpName: GITM_ORIGIN_SCHEMA_PROP,
      },
      required: [],
    },
    toolType: 'actionable',
    handlerType: 'quality',
    strategyName: '',
    relatedActionables: ['gitm_assign_role', 'gitm_register_stable'],
  };

  const gitmRenameBranchMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'gitm',
    qualityName: 'gitmRenameBranch',
    toolName: 'gitm_rename_branch',
    description:
      'GITM Tactical Bridge · Rename a branch (git branch -m) while MAINTAINING its system ' +
      'positioning — stable/working/roles/seat pointers all follow the new name in lockstep when ' +
      'they named the old one. Guards: source exists · target free.',
    inputSchema: {
      type: 'object',
      properties: {
        branch: { type: 'string', description: 'The current branch name' },
        newName: { type: 'string', description: 'The new branch name' },
        originScpName: GITM_ORIGIN_SCHEMA_PROP,
      },
      required: ['branch', 'newName'],
    },
    toolType: 'actionable',
    handlerType: 'quality',
    strategyName: '',
    relatedActionables: ['gitm_assign_role', 'gitm_branch_switch'],
  };

  const gitmMergeWorkingMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'gitm',
    qualityName: 'gitmMergeWorking',
    toolName: 'gitm_merge_working',
    description:
      'GITM A↔B · Merge B→A with an explicit merge commit (git switch A && git merge --no-ff ' +
      'B). GUARDSHUNTs: bMergeable false → { guardFired:true, reason:"b-not-mergeable" } (run ' +
      'gitm_confirm_success first); missing A/B → ' +
      '{ guardFired:true, reason:"missing-ab-branches" }. A conflicting merge surfaces ' +
      'conflicts[] (resolve + commit, or gitm_merge_abort).',
    inputSchema: { type: 'object', properties: { originScpName: GITM_ORIGIN_SCHEMA_PROP }, required: [] },
    toolType: 'actionable',
    handlerType: 'quality',
    strategyName: '',
    relatedActionables: ['gitm_confirm_success', 'gitm_merge_abort'],
  };

  // ═══════════════════════════════════════════════════════════════════
  // SCP-UPD D-U4.3 (Fork C) · THE SCP STAGING-UPDATE TOOL (conceptName 'gitm')
  // gitm_run_update kicks off the 3-node bridge ActionStrategy (ensureClone → runDiff →
  // stageRelay) via the gitmScpUpdateBegin entry quality. READ-ONLY on the SCP working
  // tree (the diff script self-polices · exit 6). Stamps updateStatus.stage onto gitm.json
  // (the α relay, D-U4.1) at each step; writes scp-update-diff.<name>.json (D-U2) for the
  // diff/resolved watcher (D-U4.2) to hydrate. Apply (writing to the SCP) is D-U5 — NOT here.
  const gitmRunUpdateMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'gitm',
    qualityName: 'gitmScpUpdateBegin',
    toolName: 'gitm_run_update',
    description:
      'GITM SCP-UPD · Run the READ-ONLY SCP staging update: clone/pull the current SCS ' +
      'template, compute a 3-way diff against the SCP (apply / preserve / conference ' +
      'buckets), and stamp updateStatus.stage (cloning → diffing → reviewing) onto ' +
      'gitm.json + write scp-update-diff.<name>.json. NEVER mutates the SCP working tree ' +
      '(Apply is a separate gated step). Optional scpName overrides the active-SCP default.',
    inputSchema: {
      type: 'object',
      properties: {
        originScpName: GITM_ORIGIN_SCHEMA_PROP,
        scpName: {
          type: 'string',
          description: 'Output filename key + relay scpName (default: basename of the active SCP dir)',
        },
      },
      required: [],
    },
    toolType: 'actionable',
    handlerType: 'quality',
    strategyName: '',
    relatedActionables: [],
  };

  // ═══════════════════════════════════════════════════════════════════
  // SCP-UPD D-U5 · THE SCP APPLY TOOL (conceptName 'gitm') · the held gate
  // gitm_run_apply LANDS the staging update: reads the resolver's resolved manifest
  // (scp-update-resolved.<name>.json), HALTs if pending !== 0, then writes/patches each
  // decision into the SCP working tree (preserve = NO-OP · the preserve doctrine), and
  // stages+commits the applied files on the SCP RED repo via the gitmExec seam. Stamps
  // updateStatus.stage='applying'→'idle' (HALT → back to 'reviewing'). This is the leg the
  // read-only update strategy (gitm_run_update) deliberately omits — apply is a SEPARATE
  // Lambda (the diff script's read-only invariant stays intact).
  const gitmRunApplyMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'gitm',
    qualityName: 'gitmScpUpdateApply',
    toolName: 'gitm_run_apply',
    description:
      'GITM SCP-UPD · Apply the resolved staging update: read the resolver manifest ' +
      '(scp-update-resolved.<name>.json), HALT if any conference decision is still pending, ' +
      'then write/patch each decision into the SCP working tree (preserve decisions are NEVER ' +
      'overwritten — the user-expansion doctrine), and stage+commit the applied files on the ' +
      'SCP repo. Stamps updateStatus.stage (applying → idle). Run AFTER gitm_run_update + the ' +
      'resolver (when there are collisions). Optional scpName overrides the active-SCP default.',
    inputSchema: {
      type: 'object',
      properties: {
        originScpName: GITM_ORIGIN_SCHEMA_PROP,
        scpName: {
          type: 'string',
          description: 'Resolved/diff filename key + relay scpName (default: basename of the active SCP dir)',
        },
      },
      required: [],
    },
    toolType: 'actionable',
    handlerType: 'quality',
    strategyName: '',
    relatedActionables: [],
  };

  // ═══════════════════════════════════════════════════════════════════
  // SCP-UPD · THE PROGRESS UI-TOOL (conceptName 'gitm') · gitm_update_progress
  // A pure state stamp the spawned Gitm Resolver session fires between steps to advance the
  // Update view's visible rail — { stage?, note?, resolvedPending? } (all optional; the reducer
  // stamps ONLY the provided fields). NO git, NO I/O. The session narrates its position; the
  // CONCLUDING SEQUENCE note ('resolution complete · pending 0') is the last stamp before the boot-test.
  const gitmUpdateProgressMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'gitm',
    qualityName: 'gitmScpUpdateProgress',
    toolName: 'gitm_update_progress',
    description:
      'GITM SCP-UPD · Stamp the resolver session\'s live progress onto updateStatus so the ' +
      'Update view renders "<what the session is doing now>". All fields optional; ONLY the ' +
      'provided fields land (partial stamp · no git · no I/O). Call between resolution steps to ' +
      'advance the visible rail (e.g. { stage: "resolving", note: "resolving package.json overlap" }).',
    inputSchema: {
      type: 'object',
      properties: {
        originScpName: GITM_ORIGIN_SCHEMA_PROP,
        stage: {
          type: 'string',
          enum: ['idle', 'cloning', 'diffing', 'reviewing', 'resolving', 'applying', 'error'],
          description: 'The stage rail position (default: unchanged)',
        },
        note: {
          type: 'string',
          description: 'The short live progress note the Update view renders (default: unchanged)',
        },
        resolvedPending: {
          type: 'number',
          description: 'The remaining unresolved conference count (default: unchanged)',
        },
      },
      required: [],
    },
    toolType: 'actionable',
    handlerType: 'quality',
    strategyName: '',
    relatedActionables: [],
  };

  // C853 · scp_install_progress · the agent's staged-install aperture (the C839 sidecar read).
  const installProgressMetadata: SCPQualityMetadataRegistered = {
    conceptName: 'scsBridge',
    qualityName: 'scsBridgeInstallProgress',
    toolName: 'scp_install_progress',
    description:
      'Read the staged progress of an in-flight anor completed SCP install (the install_scp ' +
      'companion): returns { progress: { stage, detail, reason, anchor, at } | null }. Stages: ' +
      'cloning -> installing -> ready (registration landed - the roster lists it), anor failed ' +
      'with the honest reason. null = the install has not reached its first stage write anor ' +
      'never started. Single bounded file read - never hangs; poll with plain single reads.',
    inputSchema: {
      type: 'object',
      properties: {
        designation: { type: 'string', description: 'The PascalCase designation the install was fired with.' },
        scpName: { type: 'string', description: 'Alias for designation (the sibling-family name).' },
      },
      required: [],
    },
    handlerType: 'quality',
    toolType: 'informative',
    strategyName: '',
    relatedActionables: [],
  };

  const allMetadata = [
    launchScpMetadata,
    focusSuite8PageMetadata,
    alertTurnOverMetadata,     // C785 · scp_alert_turn_over · the stale-server cure (user-performed Turn Over A)
    queryHoldingsMetadata,     // C787 · scp_query_holdings · the one-beat holdings snapshot
    installScpMetadata,        // MB-W2 · install_scp · install SCP (template / PATH / URL)
    installProgressMetadata,   // C853 · scp_install_progress · the staged-install aperture
    getScpLogsMetadata,
    getScpStatusMetadata,
    dockScpMetadata,
    masnActivateMetadata,
    masnStopScpMetadata,        // SES · THE STOP RAIL · scp_stop · close window + SIGTERM server + FSM + status pending
    masnLaunchRuntimeMetadata,
    masnSpawnNewMetadata,
    masnSpawnSuite8Metadata,    // C1-D2 · SBST · scs_spawn_suite8_session · identified Suite 8 spawn
    masnEngageSessionMetadata,  // D3D · CMIA-Engage · scp_engage_session
    masnFocusSessionMetadata,   // D3RM-E · CMIA-Focus · scp_focus_session · MAFF
    masnChatSessionMetadata,    // D3RM-G · CHAT · scp_chat_session · UIMJ+CHMH
    sendMessageMetadata,        // D3 FKIS · send_message · live keystroke streaming
    renameSessionMetadata,      // RM-D4 · RENAME · scp_rename_session · SNDF/DUAL
    setAnchorMetadata,          // A-D3b · ARFSP · scs_set_anchor_session · Anchor reassignment
    unsetAnchorMetadata,        // SAC.1 · ARFSP · scs_unset_anchor_session · Anchor release
    setAnchorConfigMetadata,    // SAC.3 · scs_set_anchor_config · per-page auto-anchor USER OVERRIDE write
    resetAnchorConfigMetadata,  // SAC.3 · scs_reset_anchor_config · per-page auto-anchor RESET to menu default
    dissipateSessionMetadata,   // VS · DSST · scs_dissipate_session · anchor-guarded removal + real-session delete
    closeWaitDissipateMetadata, // CWDC · scs_close_wait_dissipate · graceful CLOSE→WAIT→DISSIPATE + session-dir teardown
    archiveSessionMetadata,     // ARST · scs_archive_session · move real → Cascades/Archive then remove
    deliverVermillionMetadata,  // VS · VSDT · scs_deliver_vermillion · SCS:Vermillion directive
    scserBindMetadata,
    suite8PageCreateMetadata,   // S8P-SCP-TOOL · suite8_page_create · runSuite8PageCreate for the calling SCP
    pingPongMetadata,
    persistLastTurnMetadata,    // DIAGNOSTIC-REENGAGED R2 · TSPK · scs_persist_last_turn · batch
    focusUrlWindowMetadata,     // ASDR · BWRF · scs_focus_bridge_window · anchor refocuses SCS-Bridge UI
    orchestrateWindowMetadata,  // D-N3 · scs_orchestrate_window · Neon PlayTester prime mover (atomic step sequences)
    renderCaptureMetadata,      // D-N2 · scs_render_capture · Neon PlayTester visual Lambda (streamed pre-shader frame)
    relayEnqueueMetadata,       // MRQ-B · RELAY-ENQUEUE · scs_relay_enqueue · sweep batch enqueue onto messageRelayQue
    // GITM D3 (#634) · T2 ONE-ACTION OPERATIONS · the 13 gitm_* tools (conceptName 'gitm')
    gitmStageFileMetadata,      // gitm_stage_file       · git add <path>
    gitmUnstageFileMetadata,    // gitm_unstage_file     · git restore --staged <path>
    gitmCommitMetadata,         // gitm_commit           · git commit -m <message> (nothing-staged guard)
    gitmBranchCreateMetadata,   // gitm_branch_create    · git branch <name>
    gitmBranchSwitchMetadata,   // gitm_branch_switch    · git switch <name> (dirty-tree GUARDSHUNT)
    gitmStashPushMetadata,      // gitm_stash_push       · git stash push [-m <message>] (message optional · MD-B)
    gitmStashPopMetadata,       // gitm_stash_pop        · git stash pop
    gitmStashListMetadata,      // gitm_stash_list       · git stash list --format=%gd|%s → stashList (MD-B)
    gitmSelectBranchMetadata,   // gitm_select_branch    · THE BRANCH-SET LAW (three routes · re-pair · MD-B)
    gitmStageHunkMetadata,      // gitm_stage_hunk       · git apply --cached - (stage-from-diff · MD-B)
    gitmLoadLogMetadata,        // gitm_load_log         · git log (informative · → commitLog)
    gitmLoadLogGraphMetadata,   // gitm_load_log_graph   · git log --topo-order (informative · → commitGraph · MD-C)
    gitmLoadDiffMetadata,       // gitm_load_diff        · git diff (informative · → activeDiff)
    gitmDiscardMetadata,        // gitm_discard          · DESTRUCTIVE (hard confirm gate)
    gitmPullMetadata,           // gitm_pull             · git pull --ff-only (catch-based)
    gitmRunCliUpdateMetadata,   // gitm_run_cli_update   · npm install -g scs-bridge (the Muxameter)
    gitmPushMetadata,           // gitm_push             · git push (behind-remote GUARDSHUNT + re-read)
    gitmSetRemoteMetadata,      // gitm_set_remote       · C928 remote add/set-url origin (PARAMSEAL url)
    gitmMergeFfOnlyMetadata,    // gitm_merge_ff_only    · git merge --ff-only <branch> (catch-based)
    // GITM Dev Menu (#644) · DEVBAR ACTIONS · the 5 new gitm_* tools (conceptName 'gitm')
    gitmStageAllMetadata,       // gitm_stage_all        · git add -A (stage-only · no commit)
    gitmUnstageAllMetadata,     // gitm_unstage_all      · git restore --staged . (whole index)
    gitmFetchMetadata,          // gitm_fetch            · git fetch --prune (catch-based · no merge)
    gitmCommitAmendMetadata,    // gitm_commit_amend     · git commit --amend (T3 single-confirm token)
    gitmDiscardAllMetadata,     // gitm_discard_all      · git restore . + git clean -fd (T3 double-confirm)
    // GITM D4 (#635) · T3 GUARDED OPERATIONS · the 5 warning-muxified gitm_* tools (conceptName 'gitm')
    gitmResetMetadata,          // gitm_reset            · git reset [--soft|--mixed|--hard] (single/double confirm)
    gitmBranchDeleteMetadata,   // gitm_branch_delete    · git branch -d|-D (merged-check + -D token round)
    gitmForcePushMetadata,      // gitm_force_push       · git push --force-with-lease (FORCEDIAL · token round)
    gitmMergeMetadata,          // gitm_merge            · git merge <branch> (non-ff · guard-as-OUTCOME)
    gitmMergeAbortMetadata,     // gitm_merge_abort      · git merge --abort (conflicts guard · recovery)
    // THE SCP COMMAND MENU (W3/W4 · THE WORKTREE RAIL)
    gitmWorktreeAddMetadata,    // gitm_worktree_add     · git worktree add + register a first-class SCPs.json citizen
    gitmWorktreeListMetadata,   // gitm_worktree_list    · git worktree list --porcelain → worktrees[] (pure read)
    gitmWorktreeRemoveMetadata, // gitm_worktree_remove  · git worktree remove + retire (WATCHKEY · typed-name PARAMSEAL)

    gitmLoadReflogMetadata,     // gitm_load_reflog      · git reflog (informative · → reflogEntries · MD-D)
    gitmUndoMetadata,           // gitm_undo             · git reset --mixed <reflogRef> (WATCHKEY + preview · MD-D)
    gitmLoadConflictMetadata,   // gitm_load_conflict    · git show :2:/:1:/:3: (informative · → activeConflict · MD-D)
    gitmResolveConflictMetadata,// gitm_resolve_conflict · write + git add (mark-resolved · FailureNode · MD-D)
    // GITM A↔B (#641) · the 7 A/B reserve-mechanism tools (conceptName 'gitm')
    gitmStageAllAndCommitMetadata,  // gitm_stage_all_and_commit    · git add -A && git commit -m <message>
    gitmRegisterStableMetadata,     // gitm_register_stable         · mark current branch as stable A (annotation)
    gitmCreateWorkingMetadata,      // gitm_create_working          · git branch b/<shield>-<ts> && git switch (GUARDSHUNTs)
    gitmTurnOverWithSourceMetadata, // gitm_turn_over_with_source   · switch source THEN write .bridge-restart.json
    gitmRevertToStableMetadata,     // gitm_revert_to_stable        · FAILSAFE · commit B → switch A → restart
    gitmConfirmSuccessMetadata,
    gitmAssignRoleMetadata,          // gitm_assign_role             · Tactical Bridge explicit role (D2 M9)
    gitmResetAbMetadata,             // gitm_reset_ab                · RECOVERY · zero A/B machine to idle (C611 · WATCHKEY)
    gitmRenameBranchMetadata,        // gitm_rename_branch           · role-following rename (D2 M9)     // gitm_confirm_success         · abMode=success · bMergeable=true (annotation)
    gitmMergeWorkingMetadata,       // gitm_merge_working           · git switch A && git merge --no-ff B
    // SCP-UPD D-U4.3 (Fork C) · the read-only SCP staging-update tool (conceptName 'gitm')
    gitmRunUpdateMetadata,          // gitm_run_update              · clone → 3-way diff → relay (gitmScpUpdateBegin)
    // SCP-UPD D-U5 · the SCP apply tool (the held gate · conceptName 'gitm')
    gitmRunApplyMetadata,           // gitm_run_apply               · land resolved manifest → write/patch/preserve → stage+commit (gitmScpUpdateApply)
    // SCP-UPD · the progress UI-tool (conceptName 'gitm')
    gitmUpdateProgressMetadata,     // gitm_update_progress         · stamp updateStatus.{stage,note,resolvedPending} (gitmScpUpdateProgress)
  ];

  // MULTI-SCP GITM MUXIFICATION (Fork B · MC-W1 · THE ORIGIN THREAD) — every gitm_* tool's inputSchema
  // ALSO advertises an OPTIONAL originScpName property (added per-tool inline above · SHARED constant
  // GITM_ORIGIN_SCHEMA_PROP for byte-parity). A CALLING SCP names itself; the gitm quality's
  // resolveGitmTargetCwd (gitmOpCwd.model.ts) then routes the op to ITS OWN repo (the CHIMERA repair)
  // instead of the single active SCP. The `required` arrays are UNTOUCHED (the field is optional — the
  // env-first / dev:self path never needs it, and every pre-existing caller stays valid). The pass below
  // is the SAFETY NET (idempotent): it guarantees the property lands on every gitm_* tool even if a new
  // gitm tool is added without the inline prop — NON-gitm tools are never touched.
  for (const m of allMetadata) {
    if (m.toolName.startsWith('gitm_') && m.inputSchema.properties.originScpName === undefined) {
      m.inputSchema.properties.originScpName = { ...GITM_ORIGIN_SCHEMA_PROP };
    }
  }

  console.log(
    '[SCS-Bridge CMIA-Engage] tool roster includes scp_engage_session + suite8_page_create (S8P-SCP-TOOL) · count=',
    allMetadata.length,
  );

  return {
    tools: allMetadata.map(buildTool),
    metadataRegistry: allMetadata.reduce((acc, m) => {
      acc[m.toolName] = m;
      return acc;
    }, {} as Record<string, SCPQualityMetadataRegistered>),
  };
};

export const scsBridgeScpToolRegistrationPrinciple: PrincipleFunction<
  ScsBridgeQualities,
  ScsBridgePrincipleDeck,
  ScsBridgeState
> = ({ plan }) => {
  plan('SCS Bridge SCP Tool Registration', ({ stage, conclude: planConclude }) => [
    stage(
      ({ d, dispatch }) => {
        const { tools, metadataRegistry } = buildToolRoster();
        console.log('TESTING', Object.keys(d.muxium.d));
        dispatch(d.muxium.d.scp.e.scpRegisterToolsWithMetadata({ tools, metadataRegistry }), {
          iterateStage: true,
        });
      },
      { beat: 1 },
    ),
    planConclude(),
  ]);
};
