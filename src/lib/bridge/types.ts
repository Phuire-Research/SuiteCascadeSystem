export type Priority = 'head' | 'body' | 'tail';

export type Sender = 'user' | 'agent' | 'router';

// ============================================
// SB-A1-D1 · KINDED ENVELOPE EXTENSION (NON-BREAKING)
//
// R6 Purple reconciliation: extend the existing BridgeMessageEnvelope with
// OPTIONAL kind + kindPayload fields rather than introducing a discriminated
// union variant (R3) or leaving the type untouched (R2 strict reading).
//
// The 10 frozen envelope tests (queue.test.ts · message.test.ts) construct
// envelopes WITHOUT these fields; optional `?` markers preserve backward
// compatibility. R2's BMEKW insight (kind-in-content-JSON) is honored as
// defense-in-depth in messageEnvelope.model.ts's validateEnvelope: when both
// `kind` and a parsable `content` JSON are present, the validator cross-checks
// consistency.
// ============================================

/** BSBRE: Session → Bridge · request to boot a named SCP */
export type BootRequestPayload = {
  scpName: string;
  requestedAt: number;
};

/** SLAC: Bridge → Session · acknowledgment that SCP port is bound and live */
export type LiveAckPayload = {
  scpName: string;
  port: number;
  boundAt: number;
  browserUrl?: string;
};

/**
 * SS-A1-D2 · PPHB Presence-Ping-Heartbeat-Beacon · Session → Bridge.
 *
 * Periodic detection signal for the Interactive 6th-state derivation. Sessions
 * emit `'presence-ping'` envelopes every 30s after receiving SLAC; the bridge
 * populates scpSpawnManager.interactiveSessionsByScp Map and the render layer
 * derives Interactive state at paint time via filterRecentHeartbeats (90s
 * threshold). `sentAt` is the session-side wall clock at write time and is
 * retained for diagnostics only — bridge processing uses Date.now() receivedAt
 * for staleness filtering to avoid clock-skew sensitivity.
 *
 * Citation: SUITE-4-GREEN-SS-A1-D2-BIDIRECTIONAL.md (D1 · PPHB authoritative)
 * Citation: SUITE-6-PURPLE-SS-A1-D2-SEQUENCE.md M19 Step 2 (HeartbeatPayload)
 */
export type HeartbeatPayload = {
  sessionId: string;
  scpName: string;
  sentAt: number;
};

/** Discriminator for typed envelope kinds (extends additively with future kinds) */
export type EnvelopeKind = 'boot-request' | 'live-ack' | 'presence-ping';

export type BridgeMessageEnvelope = {
  id: string;
  sessionId: string;
  priority: Priority;
  content: string;
  createdAt: number;
  sender: Sender;
  consumedAt?: number;
  // SB-A1-D1 additions (OPTIONAL · backward-compatible with 10 frozen tests):
  kind?: EnvelopeKind;
  kindPayload?: BootRequestPayload | LiveAckPayload | HeartbeatPayload;
};

/**
 * Session lifecycle states observable by Bridge.
 *
 * - `'allocated'`: ULID + UUID minted, meta.json written, no spawn issued.
 * - `'launched'`: last observed at launch — Bridge does NOT poll running state.
 *   A session marked `'launched'` may have already exited; Bridge does not know.
 *   To know running state, Diamond D-territory work would be required (PID polling
 *   or sentinel files), which violates Pattern 6 (Base-Persistent Startup
 *   Composition) fire-and-forget. The opacity is deliberate.
 * - `'archived'`: explicitly retired by user via `scs bridge archive <id>`.
 */
export type SessionStatus = 'allocated' | 'launched' | 'archived' | 'offline';

export type SessionMeta = {
  id: string;
  claudeSessionId?: string;
  claudePid?: number;
  status: SessionStatus;
  spawnedAt: number;
  lastSeen?: number;
  claudeBinary: string;
  cwd: string;
  terminalCommand?: string;
  launchedAt?: number;
  // D3RM-E · WIPS (Window-Identity-Per-Session) · macOS Terminal.app window-id captured
  // immediately post-spawn via second osascript -e call (Method C). Targets the FOCUS
  // primitive (focusTerminalWindow) without conflating with claudePid (distinct concept).
  // Optional · additive · undefined on Linux/Windows/WSL + pre-D3RM-E sessions.
  terminalWindowId?: number;
  // SS-P1 · SDCS Diameter: SessionMeta carries scpName parallel to RegistryEntry.scpName
  // for meta.json persistence. Populated by sessionStartHook when SAID resolution
  // succeeds (env var override anor CWD-match).
  scpName?: string;
  // SS-Final · SPMEM Diameter: Session-Preferred-SCP-Memory persists across bridge
  // reboots. Written by animatedTui ADSC Live-detection closure when SLAC confirms
  // Live state for a TUI-originated boot. Read by sessionStartHook as the second
  // fallback (env var > preferredScpName > CWD-match). Optional · additive ·
  // backward-compatible with all prior SessionMeta writes.
  preferredScpName?: string;
  // A-D1 · ARF (Anchor Registry Field) · meta.json mirror of RegistryEntry.isAnchor.
  // Optional · additive · undefined for non-anchor + pre-Anchor-Pattern sessions.
  isAnchor?: boolean;
};

export type RegistryEntry = {
  id: string;
  claudeSessionId?: string;
  claudePid?: number;
  spawnedAt: number;
  status: SessionStatus;
  cwd: string;
  synthesizedAt?: number;
  displayName?: string;
  // RM-D4 · SCSLA · SCS-Label-Assured-Field. SCS-Bridge-only optional rename
  // label, structurally isolated from ClaudeCode's displayName (ADSO remedy).
  // Written ONLY by setSessionScsLabel (rename Quality + TUI rename-confirm);
  // no discovery/install/ClaudeCode writer populates it. DPCO display priority:
  // scsLabel > displayName > shortId. IDTND: display-only, never routing.
  scsLabel?: string;
  // SB-A1-D1 · IMDT closure: scpName Diameter binding RegistryEntry ↔
  // BootRequestPayload.scpName ↔ scpLifecycle.lifecycleByScp Map key.
  // Optional · backward-compatible · populated when session is bound to a SCP.
  scpName?: string;
  // A-3 SAPR · Suite8-Assignment-Prompt-Routing: the NDEP name of the Suite 8
  // assigned to this session. Resolves to Cascades/8_SUITES/<suite8Name>/Instance.md
  // via instanceMdResolver.model.ts and is appended to the base system prompt at
  // spawn time (COMPOSED with BDAP base prompt, not replacing it). Parallel to
  // scpName — the two assignments are independent lanes.
  suite8Name?: string;
  // MD-9 · D-MC-1 · Per-Instance Model Control: the model ID pinned to THIS session
  // at spawn time (a full AVAILABLE_MODELS id · src/shared/modelCatalog.model.ts).
  // Recorded by setSessionModel when the spawn payload carried a valid model; resume
  // injects it OVER the global default (resolved.model ?? getActiveDefaultModel() in
  // cli-handler modelClause). Absent ⇒ the session rides the bridge global default.
  // Optional · additive · undefined = no per-instance pin (the default, global-riding).
  model?: string;
  // A-D1 · ARF (Anchor Registry Field) · Anchor Pattern. true iff THIS session is
  // the page-bound continuous "Anchor" for its suite8Name (the auto-spawned PPOL
  // session, or one set via the reassignment tool). Invariant: ≤1 isAnchor=true per
  // suite8Name (writers clear siblings). Scopes to the whole Suite 8 / its page —
  // many non-anchor instances may share the same suite8Name + RI. Survives
  // markAllSessionsOffline (binding persists across bridge restart). Optional ·
  // additive · undefined = not the anchor.
  isAnchor?: boolean;
  // MRQ-RC3 · WAPM (Worker-Auto-Permission-Marker) · the inverse-class sibling of
  // isAnchor. true iff THIS session is an asWorker research spawn (the SBST
  // asWorker:true path · CadmiumLanding runResearchSweep). Persisted at spawn time
  // alongside suite8Name so the detached `open-session` process (which re-derives
  // ALL spawn state from the registry by ULID) can scope the auto-accept permission
  // mode to workers ONLY. When true the spawn-settings builder emits
  // permissions.defaultMode='acceptEdits' so the worker boots in Claude Code's
  // auto-accept mode (retires the Shift+Tab AutoMode relay for the sweep). Anchors,
  // plain SCP sessions, and the install path NEVER set this → approval gate intact.
  // Optional · additive · undefined = not a worker (the default, gate-preserving).
  isWorker?: boolean;
  // D-UP · THE STAND-BY MARKER · true iff this session was spawned manualMode (a
  // primed worker awaiting a directive delivery — the Gitm Resolver class). The
  // detached open-session reads it by ULID and paints the presenter's Stand By
  // overlay ("STAND BY · Claude Code is initializing") so the user is never left
  // watching an idle boot. Cleared (false) by cli-handler's sendMessage leg the
  // moment the FKIS delivery lands — a re-engage never re-shows a stale overlay.
  // Optional · additive · undefined = no overlay (the default).
  standBy?: boolean;
  // RS.2b · THE COMBINED INITIAL ENTRY · the per-run directive (an SCS:Vermillion
  // anchor) persisted at spawn time so the detached open-session composes it INTO
  // the initial positional prompt (appended after the Onboard seed — one entry,
  // no post-boot typed delivery racing a mid-turn input; the C285 interleave
  // class retired for spawn-time directives). Only the 'new'-mode initial-prompt
  // compose reads it; a resume never re-fires it.
  // Optional · additive · undefined = no directive (the default).
  initialDirective?: string;
  // THE ONBOARD OPTION · true iff the spawn asked to SUPPRESS the Onboard seed
  // (payload.onboard === false). cli-handler's open-session skips the Onboard
  // compose when set; the initialDirective (if present) rides alone.
  // Optional · additive · undefined = Onboard rides per the anchor predicate (default).
  suppressOnboard?: boolean;
  // D3RM-E · WIPS · RegistryEntry parallel to SessionMeta.terminalWindowId.
  // macOS Terminal.app window-id captured at spawn time; targeted by the FOCUS
  // primitive (focusTerminalWindow) for per-session window-front activation.
  // Optional · additive · undefined on non-macOS + pre-D3RM-E sessions.
  //
  // D2 Recurse-3 · RWID (Repurposed-WindowId) closure: this field also carries
  // the Electron BrowserWindow.id for PMPH-launched sessions. Populated by the
  // PDFL guard in src/main/session.ts on first pty.data.posted event via
  // updateSessionLaunchMeta. Name retained for backward-compat with focusTerminal
  // primitive; semantic widened to "any window-identity targetable for focus".
  terminalWindowId?: number;
  // D2 Recurse-3 · ULMR (Update-Launch-Meta-Registry) closure · parallel to
  // SessionMeta.launchedAt + SessionMeta.terminalCommand. Populated atomically
  // with status='launched' by the PDFL trigger in src/main/session.ts when the
  // first PTY data chunk traverses the MessagePort pipeline (SLOM semantic ·
  // Session-Launched-On-MessagePort). Optional · additive · backward-compatible.
  launchedAt?: number;
  terminalCommand?: string;
  // D3C · JSONL Turn Count Hook (JTCH) · populated by Stop hook on each turn end
  finalTurnIndex?: number;        // turn count · increments per assistant response
  finalTurnTimestamp?: string;    // ISO timestamp of last turn end
  finalTurnSummary?: string;      // truncated 200-char text snippet of last assistant message
  lastActivityAt?: number;        // ms timestamp · monotonically advances per turn (SLAT closure)
  // D3D · TPCT flip-flop · UPSH writes true; JTCH writes false; absent = pre-D3D session
  // HAZARD-Z: three-value (undefined | true | false). Vue templates MUST use === discrimination. NEVER truthy coercion.
  isProcessing?: boolean;          // undefined = pre-D3D · false = OPEN · true = WORKING
  lastUserSubmitAt?: number;       // ms timestamp of user's last prompt submission (LSUB feed)
  // D3F Diamond B · SSTE mirror (optional · future consistency with ScsBridgeSessionEntry)
  transcriptSnippet?: string;
  transcriptLastUserInput?: string;
  transcriptLastModelOutput?: string;
  transcriptLastReadAt?: number;
  transcriptPath?: string;
  // RM-D3 · ATID + PRMX state. Written by the CLI Bridge hook routes
  // (scpExpressTransport CLI copy) via updateSessionToolState. Cleared on
  // restart by markAllSessionsOffline. Kept MINIMAL per the transmission-size
  // constraint (brief §97-99): activeToolInput + pendingPermissionInput are
  // <=120-char summaries; permissionSuggestions is a compact JSON string.
  activeTool?: string;                  // ATID · tool_name from PreToolUse · absent = no active tool
  activeToolInput?: string;             // ATID · <=120-char summary of tool_input
  permissionPending?: boolean;          // PRMX · true = a held PermissionRequest awaits the user
  pendingPermissionTool?: string;       // PRMX · tool_name of the gated tool
  pendingPermissionInput?: string;      // PRMX · <=120-char summary of the gated tool_input
  pendingPermissionRequestId?: string;  // PRMX · display-only · NOT the held-res Map key (key = ulid alone · canary: tool_use_id absent on PermissionRequest)
  permissionSuggestions?: string;       // DPOB · compact JSON string [{label,behavior}] · parsed client-side
  // PSTK · Permission Stack · the FIFO landing-order queue of held PermissionRequests
  // for this session. The HEAD (index 0) mirrors the legacy PRMX scalars above (they
  // stay live so every existing consumer keeps working untouched); items 1..N-1 render
  // as the queued strip beneath the head pane. Written by updateSessionToolState on
  // every queue change (push · resolve · drain). Empty queue → permissionPending:false
  // + PRMX scalars cleared. requestId = the Bridge-minted perm-<ulid-suffix>-<counter>
  // (no tool_use_id exists on PermissionRequest · canary-confirmed) · the queue item's
  // identity end-to-end. suggestions = compact JSON string (DPOB shape · per-item).
  pendingPermissions?: Array<{
    requestId: string;                  // PSTK · Bridge-minted perm-<ulid-suffix>-<counter> · the queue item identity
    tool: string;                       // PSTK · tool_name of the gated tool
    input: string;                      // PSTK · <=120-char summary of the gated tool_input
    suggestions?: string;               // PSTK · DPOB compact JSON string [{label,behavior}] · per-item
    landedAt: number;                   // PSTK · Date.now() ms epoch when this request landed (FIFO order key)
  }>;
  askUserQuestionPending?: boolean;     // FSSF · AskUserQuestion or unknown tool → Focus-card
  lastTool?: string;                    // LTUT · tool_name of most recent PreToolUse · persists across PostToolUse + restart
  lastToolAt?: number;                  // LTUT · Date.now() ms epoch when lastTool was recorded · server-side arrival
};

export type SpawnOptions = {
  cwd?: string;
};

export type QueueSummary = {
  heads: number;
  body: number;
  tails: number;
  archive: number;
};
