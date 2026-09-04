import { emitKeypressEvents } from 'node:readline';
import { createFileWatcher } from './watcherSingleton.model';
import { watchFile, unwatchFile, existsSync } from 'node:fs';
import { basename } from 'node:path';
import { createSession, launchInformative } from './manager';
import { listSessions, removeSession, setSessionScsLabel, setSessionModel } from './registry';
import { registryPath } from './paths';
import { AVAILABLE_MODELS, DEFAULT_MODEL, modelLabel } from '../../shared/modelCatalog.model';
import { rgbToAnsi, SUITE_COLORS, suiteColorForScp } from '../tui/colors';
import { detectTerminalCaps } from '../tui/terminalCaps';
import { getBridgeVersion } from './bridgeVersion';
import type { RegistryEntry } from './types';
import type { ScpLifecycleStateValue } from './concepts/scpLifecycle/scpLifecycle.type';
import { renderScpLifecycleBadgeWithFallback } from './scpLifecycleBadge';
// MD-ARC+C · Wave 5a (MD-ARC-R3-BLUEPRINT §5.3) — the Archived fold's row type.
// Type-only import (zero runtime cost) · the bridge's scpSessionRegistry owns the
// authoritative ArchivedScpEntry shape (name · archivedAt · path · originalPath).
import type { ArchivedScpEntry } from './scpSessionRegistry';
import {
  filterRecentHeartbeats,
  INTERACTIVE_STALENESS_THRESHOLD_MS,
} from './concepts/scpSpawnManager/scpSpawnManager.helpers';
// Epoch Extension · Macro AV · ATMS shapes for the archiveView modal slot.
// Type-only import — zero runtime cost. ArchiveManifestEntry = list row;
// ArchiveContents = on-demand detail body (entry + lastTurn | null).
import type { ArchiveManifestEntry, ArchiveContents } from './archiveManifest.types';
// Epoch Extension · Macro AV · MANIFEST_CAP drives the truncation footer notice
// (S4 A6-1 · render the cap notice when entries.length >= MANIFEST_CAP).
import { MANIFEST_CAP } from './archiveManifest.model';
// Issue #643 Refinement · install-phase type drives the step-aware asymptotic
// progress bar. Type-only import — zero runtime cost.
import type { ScpInstallPhase } from '../scp/scpInstall';

// Synthetic row IDs (sentinel values; ULIDs are Crockford base32 and never start with '_')
export const SYNTHETIC_NEW = '__new__' as const;
export const SYNTHETIC_CLOSE = '__close__' as const;
// Diamond B-1 — Conditional Bridge Bootmode Diameter (CD-23). Top-row sentinel
// surfaced when Cascades/ is absent at startup; gates between Install-mode (onboarding)
// and Session-mode (operational). Must remain a string literal that ULIDs cannot collide with.
export const SYNTHETIC_INSTALL = '__install__' as const;

// Diamond B-20 (CD-63 IRULRT · Install-Reinstall-Update-Lifecycle-Row-Toggle):
// Three lifecycle labels for the SYNTHETIC_INSTALL row. Bridge owns the
// discriminator (cascadesPresent flag for current toggle; future updateAvailable
// flag for Phase C). Single sentinel · multi-label composition (CD-67 SSMLC).
//
// PHASE A (cascadesPresent === undefined OR false) → INSTALL_LABEL — Path A scaffold-only
// PHASE B (cascadesPresent === true · post-scaffold)  → REINSTALL_LABEL — Path B install-instance
// PHASE C (future · post-release · OUT OF SCOPE B-20) → UPDATE_LABEL — update mechanism
export const INSTALL_LABEL = '⊕ Install SCS-Bridge';
export const REINSTALL_LABEL = '⊕ Reinstall SCS-Bridge';
export const UPDATE_LABEL = '⊕ Update SCS-Bridge';

// RM-D2 (SIMRSS): SCP install row sentinel — distinct from SYNTHETIC_INSTALL.
// SYNTHETIC_INSTALL governs the SCS-Bridge install/reinstall row; this sentinel
// governs the "Install SCP" / "Install Another SCP" row that sits directly
// BELOW the SCS-Bridge install row when cascadesPresent === true.
export const SYNTHETIC_INSTALL_SCP = '__install_scp__' as const;

// Cycle 142 MEXP (Menu-Expand-Pattern): SCP engage row sentinel — distinct from
// SYNTHETIC_INSTALL_SCP. When CSPMSR-true (anyScpsInstalled === true), the menu
// EXPANDS to render BOTH rows: SYNTHETIC_ENGAGE_SCP (routes to 'open-scp-manage-menu')
// AND SYNTHETIC_INSTALL_SCP (always routes to 'install-scp-selected'). Supersedes
// MRSM single-row label multiplex on the SCP row position.
export const SYNTHETIC_ENGAGE_SCP = '__engage_scp__' as const;

// RM-D2 + β RM-Asp-2: Install SCP row label discriminator.
// Cycle 141 SIPMT (MRSM swap): label aligns with SM-SCP.md `[E] Engage Installed SCP`
// row vocabulary · CSPMSR-true Enter routes to MSCM management surface.
// Empty SCPs.json → "⊕ Install SCP" · Enter → wizard.
// 1+ SCPs.json   → "⊕ Open SCP Menu" · Enter → SM-SCP-MANAGE surface
//                  (inline scpSubMenu pane preserved via 'i' hotkey + scp-menu-activate).
// Cycle 142 user-Lambda rename: "Engage" was disjoint from menu-clarity verb;
// "Open SCP Menu" matches user mental model where Engage means launch SCP.
export const INSTALL_SCP_LABEL_FIRST = '⊕ Install SCP';
export const INSTALL_SCP_LABEL_NEXT = '⊕ Open SCP Menu';

export function installScpLabel(anyScpsInstalled: boolean): string {
  return anyScpsInstalled ? INSTALL_SCP_LABEL_NEXT : INSTALL_SCP_LABEL_FIRST;
}

// Diamond B-20 (CD-64 CPCLD): label discriminator helper. Future Phase C plugs
// in via state.updateAvailable check (slot reserved; not implemented in B-20).
export function installPhaseLabel(cascadesPresent: boolean | undefined): string {
  if (cascadesPresent === true) return REINSTALL_LABEL;
  return INSTALL_LABEL;
}

// Head/Body/Tail Pane Composition (SB-S12, Diamond H · γ shifted).
// Diamond γ: Install SCP row is now ALWAYS reserved (visible regardless of cascadesPresent).
// Base reservation: header(2) + Install SCP(1) + HEAD(1) + TAIL(1) + footer(1) = 6 lines.
// MIN_TERM_HEIGHT = base + 1 body row = 7.
export const RESERVED_LINES = 6;
// Diamond B-1 · γ adjust: when SCS-Bridge install row ALSO present (cascadesPresent !== undefined),
// body shrinks by 1 more slot. Composition rule: total fixed rows + visibleBodySlots === termHeight.
export const RESERVED_LINES_WITH_INSTALL = 7;
export const MIN_TERM_HEIGHT = 7;

export type SyntheticRowId =
  | typeof SYNTHETIC_NEW
  | typeof SYNTHETIC_CLOSE
  | typeof SYNTHETIC_INSTALL
  | typeof SYNTHETIC_INSTALL_SCP
  | typeof SYNTHETIC_ENGAGE_SCP;
export type MenuRowId = string | SyntheticRowId;

// Diamond K: 3-state derivation from registry (Pattern 4 structural law preserved).
// 'pending' = registered, hook hasn't fired yet (no claudePid)
// 'alive'   = SessionStart hook fired with process.ppid; PID-polled by liveness.ts
// 'offline' = was alive, exited (SessionEnd hook fired or PID-death backstop); row PERSISTS
// Precedence: status==='offline' checked FIRST to close hook-vs-tick race window.
export type SessionState = 'pending' | 'alive' | 'offline';

export function deriveSessionState(entry: RegistryEntry): SessionState {
  if (entry.status === 'offline') return 'offline';
  if (entry.claudePid !== undefined) return 'alive';
  return 'pending';
}

// Discriminated union of menu rows. Synthetic rows compose into the cursor-by-identity
// substrate alongside real session rows (Pattern 9: Synthetic-Row Cursor Composition).
// Diamond B-1: 'synthetic-install' is conditional — emitted only when state.cascadesPresent === false.
// buildMenuRows never produces it (Option B); render functions emit it directly.
export type MenuRow =
  | { kind: 'session'; entry: RegistryEntry; state: SessionState }
  | { kind: 'synthetic-install' }
  | { kind: 'synthetic-install-scp' }
  | { kind: 'synthetic-engage-scp' }
  | { kind: 'synthetic-new' }
  | { kind: 'synthetic-close' };

export type MenuState = {
  sessions: RegistryEntry[];
  selectedUlid: MenuRowId | null;
  termWidth: number;
  termHeight: number;
  lastRenderedAt: number;
  spawnInFlight: boolean;
  // C720 B2 · THE STALE BADGE. When the running package's dist/cli.cjs mtime is
  // NEWER than bridge.json.writtenAt, the bridge is running stale rebuilt code
  // (the singleton-relay hazard — a fresh install relays to the old process).
  // animatedTui computes this never-throw at paint time (empty string = fresh);
  // renderMenu appends it to the version header row so the operator sees the
  // restart signal. undefined/'' = no badge (backward-compat + stat-failure).
  staleMarker?: string;
  // Diamond H: page-jump pagination — currentPage replaces Diamond G's viewportTop and Diamond F's columnOffset.
  currentPage?: number;
  // Diamond Q: rename modal — when defined, all keypresses route through the rename branch
  // until Enter (commit) or Esc (cancel) exits. Buffer is capped at 32 chars at keypress level.
  renameMode?: { ulid: string; buffer: string };
  // C1104 · ruling A · the model picker modal. When defined, ALL keypresses route
  // through the modelPickMode branch until Enter (commit) or Esc (cancel) exits —
  // the renameMode discipline exactly. `index` is the cursor into AVAILABLE_MODELS.
  modelPickMode?: { ulid: string; index: number };
  // Diamond B-1: Cascades/ existence at startup. Probed once via existsSync (Pattern 4 metadata-only).
  // strict-false gate (state.cascadesPresent === false) treats undefined as session-mode for
  // backward compatibility with existing fixtures.
  cascadesPresent?: boolean;
  // Diamond α RM-Fix-2: SCPs.json freshness on launch — populated by
  // animatedTui startup via readScpRegistry · drives Install SCP row label
  // discrimination ("Install SCP" vs "Install Another SCP") and future
  // sub-menu surfacing (β RM-Asp-2).
  anyScpsInstalled?: boolean;
  // SCPGATE WSRM: SCS install RESOLVED (installed/muxified/legacy), distinct from
  // cascadesPresent (scaffold STARTED). PSRS gate — Install-SCP row withheld until
  // the substrate install completes. undefined = backward-compat (do not withhold).
  installationComplete?: boolean;
  // SCPGATE FBSN: first-run consent note flag. undefined/false = note eligible (State A);
  // true = consumed (State B). Sourced from Cascade.json.scpInstallAgentNoteShown.
  scpInstallAgentNoteShown?: boolean;
  // Diamond B-6 (APEX · IRPMS): present when an install pipeline has spawned a
  // special instance. Gates the install-running indicator in renderMenu /
  // renderMenuLegacy header. Optional — undefined means no install in flight.
  //
  // Issue #643 Half A · Wave 2: extended to ride the SCP-install "Installing"
  // screen + pseudo-progress bar. The original SCS-Bridge install usage (pid /
  // tempDir) is preserved (now optional); the SCP-install path sets `kind:'scp'`
  // + `designation` + `startedAt` (epoch ms) so the wizard `running` pane can
  // animate a time-driven bar across render ticks while npm install runs async.
  installRunning?: {
    ulid?: string;
    pid?: number;
    tempDir?: string;
    // Wave 2 SCP-install fields
    kind?: 'scs-bridge' | 'scp';
    designation?: string;
    startedAt?: number; // epoch ms — drives the pseudo-progress bar fill
    // Issue #643 Refinement · step-aware asymptotic bar. `phase` is the live
    // install-pipeline phase emitted by runInstallScpPipelineAsync's onPhase
    // callback; `phaseStartedAt` (epoch ms) is reset on every phase transition
    // so the bar's asymptotic crawl restarts from the new phase's range floor.
    // Both optional → old state (no phase) falls back to the time-based crawl.
    phase?: ScpInstallPhase;
    phaseStartedAt?: number;
  };
  // Diamond B-8 Fix 3 (HWMTUC-SURFACE): trust-confer modal state.
  // When defined: renders trust-confer pane instead of normal body.
  // Pipeline CANNOT fire until 'trust-confer-confirm' KeyAction received.
  // Cleared on confirm (fires pipeline) or decline (returns to menu).
  // Diamond B-22 (CD-72 TCANC): selected field added to track active button
  // for arrow-key navigation. Default 'approve' preserves B-8 Y/Enter behavior.
  trustConfer?: {
    paths: string[]; // paths bridge will write — rendered as numbered list
    optionalPaths: string[]; // paths written only if user opts conversion
    ulid: string; // pre-generated ULID for the forthcoming install session
    selected: 'approve' | 'cancel'; // B-22 CD-72: active button for arrow nav
  };
  // Diamond B-17 (CD-47 IAILT · Install-Animation-Input-Lock-Trance):
  // when defined, renderFrame swaps to full-screen install animation
  // (installAnimation.ts renderInstallAnimation) AND keypressHandler
  // short-circuits all keys except Ctrl-C (cleanExit). Cleared by:
  // (a) ACOFSAT — first-spawn-alive registry signal (claudeSessionId surfaces),
  // (b) ATSC — 30-second timeout safety, or
  // (c) cleanExit — bridge process exits. Path A and Path B both set this
  // before their first await; New Session (handleSpawn) does NOT (IPDAA).
  installAnimating?: {
    startedAt: number; // ms since epoch — drives phase transitions + timeout
    ulid: string; // session ULID being installed (cessation gate)
    phase: 'pre-spawn' | 'awaiting-alive' | 'ready';
  };
  // Diamond B-20 (CD-65 FCUHR · Forward-Compatible-Update-Hook-Reservation):
  // slot reserved for Phase C (Update mechanism) — set by future Diamond when
  // bridge detects an available SCS-Bridge update. Phase C label discrimination:
  // updateAvailable defined → UPDATE_LABEL beats Reinstall. NOT IMPLEMENTED in
  // B-20; field declared as documentation-as-code so callers reading MenuState
  // see the slot. Future Diamond wires the discriminator into installPhaseLabel.
  updateAvailable?: string; // semver string (e.g., '0.32.0') or undefined
  // Diamond B-26-PEWTER (CD-124 PUCM · Pewter-Uninstall-Confirmation-Modal):
  // Mirrors trustConfer modal architecture · destructive-default-N for safety
  // asymmetry (CD-125 SDDA). When defined, renderFrame swaps to uninstall confirm
  // pane; keypressHandler routes through modal-only branch (arrow toggles
  // selected, Enter activates, Y/N/Esc direct shortcuts). Activated by 'u' hotkey
  // when cascadesPresent === true. Cleared on confirm (fires uninstallSCS) or
  // cancel (returns to menu).
  uninstallConfirm?: {
    selected: 'approve' | 'cancel'; // CD-125 SDDA · default initialized to 'cancel'
  };
  // D-GTC S6 · exit-confirm modal — the Yes/No confirm shown when the user presses q/Escape
  // (or Enter on the CLOSE row). DEFAULT = 'approve' (Yes) so Enter immediately confirms exit;
  // Escape again or Right→No→Enter cancels. Cleared on confirm (fires close) or cancel.
  exitConfirm?: {
    selected: 'approve' | 'cancel';
  };
  // RM-D2 (SIWSMMS · SCP-Install-Wizard-State-Machine-in-MenuState): modal
  // wizard state — when defined, ALL keypresses route through the scpWizard
  // branch in applyKeypress (mirrors renameMode early-return pattern).
  // Step buffer + current-step + error transitions managed by RM-D1
  // applyWizardInput pure reducer. Cleared on completion (pipeline fires)
  // or Esc (cancel · returns to menu).
  scpWizard?: {
    state: import('../scp/installScpPrompts').ScpWizardState;
    inputBuffer: string; // typed input for current step (designation chars / y/n/r)
  };
  // SS-P2 · SCFC (SCP-Context-Filter-Chip): undefined = no filter · string =
  // filter to RegistryEntry.scpName match. Set at scp-menu-activate when user
  // presses Enter on a real SCP row (NOT on sub-menu open · NOT on Up/Down
  // navigation — R6 row-activate semantics calibrated over R3 filter-on-navigate).
  // Cleared at close-scp-menu (Esc back-to-main) and at scp-menu-activate Install
  // Another. In-memory only — never written to meta.json, registry, or
  // sessions.json. Distinct from SS-A1-D1 scpSubMenu.sessionCountByScp Map.
  activeScpFilter?: string;
  // Diamond β RM-Asp-2: SCP sub-menu state. When defined, sub-menu pane renders
  // instead of main menu · lists installed SCPs + "+ Install Another" entry.
  // `items` is a snapshot from SCPs.json at sub-menu open time · selectedIdx
  // ranges [0, items.length] where items.length IS the "Install Another" row.
  // Esc clears slot · Enter on items[i] is currently no-op (future: launch) ·
  // Enter on selectedIdx === items.length opens install wizard.
  scpSubMenu?: {
    items: import('../scp/scpPersistence').ScpRegistryEntry[];
    selectedIdx: number;
    // SB-Final: per-SCP lifecycle snapshot · populated by Muxium plan()
    // subscription in animatedTui.ts. Undefined before the first state tick;
    // missing entries default to 'pending' (FSM entry state) via fallback.
    lifecycleByScp?: Map<string, ScpLifecycleStateValue>;
    // SB-Final: per-SCP session count · derived from spawnsByScp.size at
    // render time. Surfaces as the `(N)` sub-marker on the Live badge
    // (Interactive COLLAPSED · R4 Angle 5 user-observable density).
    sessionCountByScp?: Map<string, number>;
    // SB-Final: per-SCP port · derived from spawnsByScp[scpName].port at
    // render time. Surfaces as `:PORT` on the Live badge.
    portByScp?: Map<string, number>;
    // SB-Final: per-SCP IdleToBooting transition timestamp (epoch ms) ·
    // used to compute "booting Xs" elapsed time at render. Captured by the
    // animatedTui subscription on transition into 'booting'.
    bootingStartedAtByScp?: Map<string, number>;
    // SS-A1-D2 · PPHB Interactive 6th-state substrate ·
    // Map<scpName, Map<sessionId, receivedAtEpochMs>>. Populated by the
    // animatedTui M17 closure (second select()). Render layer applies
    // filterRecentHeartbeats(now, 90_000) to derive the live interactive
    // count per SCP. R4 authoritative: 'interactive' is DERIVED at render
    // time · NOT a new FSM state on scpLifecycle.
    interactiveSessionsByScp?: Map<string, Map<string, number>>;
    // MD-ARC+C · Wave 5a (MD-ARC-R3-BLUEPRINT §5.3) — the Archived fold.
    // archivedItems: the vault ledger snapshot (listArchivedScps()) read at
    // menu-open time alongside reg.scps. Absent/empty → the fold header is
    // hidden. showArchived: [T] toggle — collapsed "▸ Archived (N)" by default;
    // expanded joins the archived rows to the navigable list ([R] reinstates
    // the selected archived row).
    archivedItems?: ArchivedScpEntry[];
    showArchived?: boolean;
  };
  // MD-ARC+C · Wave 5a (MD-ARC-R3-BLUEPRINT §5.2) — the SCP Archive confirm modal.
  // When defined, renderMenu renders renderScpArchiveConfirmPane INSTEAD of the
  // sub-menu (Pewter D5 closed-box · destructive default-N). worktreeInstances is
  // populated on the second pass (WAPF H1 'worktrees-present' reason) → the pane
  // re-renders in its force form ([F] force-archive · lists the instances dimmed).
  // notice carries an inline refusal string (stop-first · retire-first · etc.).
  scpArchiveConfirm?: {
    name: string;
    worktreeInstances?: string[];
    notice?: string;
  };
  // Epoch Extension · Macro AV · AVMS (Archive-View-Modal-State):
  // When defined, renderFrame and renderMenu render the archive pane INSTEAD of the
  // session menu. applyKeypress routes ALL keypresses through the archiveView early-return
  // branch — no main-switch action can fire while this slot is defined (R4 guard).
  // selectedIdx: cursor position within entries[]; range [0, entries.length - 1]
  // currentPage: archive-screen-local page (DISTINCT from state.currentPage which
  //   belongs to the session list). Reset to 0 on screen open.
  // detail: null = no detail open; 'loading' = async readArchiveContents in-flight;
  //   ArchiveContents = result (entry + lastTurn, where lastTurn may itself be null).
  archiveView?: {
    entries: ArchiveManifestEntry[];
    selectedIdx: number;
    currentPage: number;
    detail: ArchiveContents | 'loading' | null;
  };
};

export type KeyAction =
  | { type: 'cursor-up' }
  | { type: 'cursor-down' }
  | { type: 'page-left' }
  | { type: 'page-right' }
  | { type: 'cursor-home' }
  | { type: 'cursor-end' }
  | { type: 'resume-selected' }
  | { type: 'spawn-new' }
  | { type: 'close' }
  | { type: 'remove-selected' }
  // TBHK · Dissolution + Archival Diamond · bounded hotkeys on a real selected ULID row.
  // 'd' dissipate (registry removal + DELETE real ClaudeCode session) · 'a' archive
  // (MOVE real session → Cascades/Archive then registry removal). Both anchor-guarded
  // + resilient in registry.ts. Sentinel rows (NEW/CLOSE) are protected (mirror 'x').
  | { type: 'dissipate-selected' }
  | { type: 'archive-selected' }
  | { type: 'rename-selected' }
  | { type: 'rename-confirm' }
  | { type: 'rename-cancel' }
  | { type: 'rename-buffer-update'; buffer: string }
  // C1104 · ruling A · the per-session RESUME model, from the Anchor Menu itself.
  // 'm' opens the picker on a real selected row (SYNTHETIC_NEW/CLOSE protected —
  // mirrors 'r'/'x'/'d'/'a'); ↑/↓ move; Enter commits; Esc cancels. The commit leg
  // calls the SAME in-process registry setSessionModel the MCP quality calls (D3D).
  | { type: 'set-model-selected' }
  | { type: 'set-model-move'; index: number }
  | { type: 'set-model-pick'; model: string }
  | { type: 'set-model-cancel' }
  | { type: 'install-selected' }
  | { type: 'trust-confer-confirm' }
  | { type: 'trust-confer-decline' }
  // Diamond B-22 (CD-72 TCANC): arrow-key toggle between approve/cancel
  | { type: 'trust-confer-toggle' }
  // Diamond B-22 (CD-72 TCANC): Enter/Space activates the currently-selected button
  | { type: 'trust-confer-activate' }
  // Diamond B-26-PEWTER (CD-124 PUCM): uninstall confirmation modal action set,
  // mirrors trust-confer modal pattern. 'uninstall-selected' opens modal (entry).
  // 'uninstall-confirm-toggle' switches selected approve↔cancel. 'uninstall-confirm-activate'
  // executes the currently-selected button (Y direct shortcut also fires confirm).
  // 'uninstall-cancel' dismisses modal without action (N/Esc direct shortcut).
  | { type: 'uninstall-selected' }
  | { type: 'uninstall-confirm-toggle' }
  | { type: 'uninstall-confirm-activate' }
  | { type: 'uninstall-confirm' }
  | { type: 'uninstall-cancel' }
  // D-GTC S6 · exit-confirm modal actions (clone of the uninstall-confirm family).
  | { type: 'exit-confirm-open' }
  | { type: 'exit-confirm-toggle' }
  | { type: 'exit-confirm-activate' }
  | { type: 'exit-confirm' }
  | { type: 'exit-cancel' }
  // RM-D2: SCP install wizard actions (mirrors renameMode KeyAction set + trust-confer modal)
  | { type: 'install-scp-selected' }
  // GITM-PROGINSTALL: non-interactive SCP install. Derives the designation from
  // path.basename(process.cwd()), reuses validateDesignationForWizard, and calls
  // runInstallScpPipeline directly — bypassing the 4-step wizard. Falls back to
  // 'install-scp-selected' (the wizard) when the cwd basename cannot yield a valid
  // designation. Sibling of 'install-scp-selected'; emitted by the 'p' hotkey.
  | { type: 'install-scp-programmatic' }
  | { type: 'install-scp-wizard-buffer-update'; buffer: string }
  | { type: 'install-scp-wizard-submit' }
  // Issue #643 Half B · Refinement 3+4 (SCBN): ←/→/Tab toggled the confirm-* /
  // boot-recommend button pair. applyKeypress already mutated buttonSelection in
  // newState; the animatedTui handler is a no-op (renderFrame picks it up next
  // paint · mirrors trust-confer-toggle).
  | { type: 'install-scp-wizard-button-toggle' }
  | { type: 'install-scp-cancel' }
  // SCPGATE FBSN: first-run consent note actions — consume+proceed (Enter) /
  // dismiss (Esc). Both persist scpInstallAgentNoteShown → true.
  | { type: 'scp-note-consume-proceed' }
  | { type: 'scp-note-dismiss' }
  // Diamond β RM-Asp-2: SCP sub-menu actions
  | { type: 'open-scp-menu' }
  // Cycle 141 SIPMT · MRSM: CSPMSR-true Enter routes to MSCM management surface.
  // Distinct from 'open-scp-menu' (inline scpSubMenu pane) — preserves both routes
  // per Yellow §5 (existing inline path retained for 'i' hotkey + scp-menu-activate).
  | { type: 'open-scp-manage-menu' }
  | { type: 'close-scp-menu' }
  | { type: 'scp-menu-cursor-up' }
  | { type: 'scp-menu-cursor-down' }
  | { type: 'scp-menu-activate'; scpName?: string }
  // SB-Final: Launch SCP runtime — Sub-Diamond CLOSURE action. Routes through
  // the bridge Muxium via BSBRE envelope write (animatedTui handler).
  | { type: 'launch-scp-runtime'; scpName: string }
  // MD-ARC+C · Wave 5a (MD-ARC-R3-BLUEPRINT §5) — Close / Archive / Reinstate.
  // scp-menu-stop: [X] on a live-or-pending SCP row → dispatch scsBridgeStopScp.
  // scp-menu-archive-confirm: [A] on a selected row → open the confirm modal.
  // scp-menu-archive-execute: [Y]/[F] in the modal → AWAIT archiveScpEntry directly.
  //   force carries the WAPF Path-B overrule ([F] on the 'worktrees-present' pane).
  // scp-menu-archive-cancel: [N]/Esc in the modal → clear the confirm slot.
  // scp-menu-toggle-archived: [T] on the sub-menu → expand/collapse the fold.
  // scp-menu-reinstate: [R] on a selected archived row → AWAIT reinstateScpEntry.
  | { type: 'scp-menu-stop'; scpName: string }
  | { type: 'scp-menu-archive-confirm'; scpName: string }
  | { type: 'scp-menu-archive-execute'; scpName: string; force?: boolean }
  | { type: 'scp-menu-archive-cancel' }
  | { type: 'scp-menu-toggle-archived' }
  | { type: 'scp-menu-reinstate'; scpName: string }
  // SCP-3 · BSSPS · [B] Engage via SCS-Bridge post-install. Mirrors
  // launch-scp-runtime structurally (BSBRE envelope write) but dispatches
  // from the wizard done-step shortcut rather than the SCP sub-menu.
  | { type: 'engage-via-bridge'; scpName: string }
  // Cycle 142 LAAD Fix (Option 3 · TDZ-safe action dispatch): M17 lifecycle
  // closure cannot mutate menuState directly (TDZ: menuState `let` declared
  // AFTER planAny() registration · first synchronous fire is before init).
  // Instead, M17 defers via setImmediate to dispatch this action, which the
  // animatedTui switch handler applies as an immutable replace on menuState.
  // SSAR restoration: render path + Enter handler path now read same source.
  | { type: 'scp-installed-state-sync'; anyScpsInstalled: boolean }
  // Epoch Extension · Macro AV · six archive-screen actions.
  // open-archive-view: emitted from the main switch on 'w'/'W' (no modal active)
  //   AND from the archiveView early-return on 'r'/'R' (refresh). animatedTui calls
  //   buildArchiveManifest() async, then populates archiveView.entries.
  | { type: 'open-archive-view' }
  // cursor-up/down: archiveView early-return mutates selectedIdx in newState.
  | { type: 'archive-view-cursor-up' }
  | { type: 'archive-view-cursor-down' }
  // detail-load: Enter on a row. animatedTui sets detail='loading', then calls
  //   readArchiveContents(id) async, then patches detail with result or null.
  | { type: 'archive-view-detail-load'; id: string }
  // detail-clear: Esc WHEN detail non-null → newState sets detail=null; slot remains.
  | { type: 'archive-view-detail-clear' }
  // close-archive-view: Esc WHEN detail===null → animatedTui clears archiveView entirely.
  | { type: 'close-archive-view' }
  | { type: 'noop' };

export type KeypressInput = {
  name?: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  sequence?: string;
};

const ANSI = {
  ENTER_ALT: '\x1b[?1049h',
  EXIT_ALT: '\x1b[?1049l',
  HIDE_CURSOR: '\x1b[?25l',
  SHOW_CURSOR: '\x1b[?25h',
  CLEAR_SCREEN: '\x1b[2J',
  HOME: '\x1b[H',
  REVERSE: '\x1b[7m',
  RESET: '\x1b[0m',
  DIM: '\x1b[2m',
  RESET_DIM: '\x1b[22m',
  BOLD: '\x1b[1m',
} as const;

// Module-level cached terminal caps used by formatHead/formatTail color emission.
// Detection happens at module load; cheap and stable.
const TERMINAL_CAPS = detectTerminalCaps();

export function buildMenuRows(sessions: RegistryEntry[], _nowMs: number = Date.now()): MenuRow[] {
  const rows: MenuRow[] = [{ kind: 'synthetic-new' }];
  const sorted = [...sessions].sort((a, b) => b.spawnedAt - a.spawnedAt);
  for (const entry of sorted) {
    rows.push({ kind: 'session', entry, state: deriveSessionState(entry) });
  }
  rows.push({ kind: 'synthetic-close' });
  return rows;
}

export function rowId(row: MenuRow): MenuRowId {
  if (row.kind === 'synthetic-new') return SYNTHETIC_NEW;
  if (row.kind === 'synthetic-close') return SYNTHETIC_CLOSE;
  // Diamond B-1: 'synthetic-install' is never produced by buildMenuRows (Option B —
  // emitted directly in render functions instead). Branch present for exhaustiveness.
  if (row.kind === 'synthetic-install') return SYNTHETIC_INSTALL;
  // RM-D2: 'synthetic-install-scp' — same Option B pattern; emitted in render
  // functions directly (not in buildMenuRows output). Exhaustiveness branch.
  if (row.kind === 'synthetic-install-scp') return SYNTHETIC_INSTALL_SCP;
  // Cycle 142 MEXP: 'synthetic-engage-scp' — same Option B pattern (render
  // functions emit conditionally when anyScpsInstalled === true).
  if (row.kind === 'synthetic-engage-scp') return SYNTHETIC_ENGAGE_SCP;
  return row.entry.id;
}

export function findIndexByRowId(rows: MenuRow[], targetId: MenuRowId | null): number {
  if (!targetId) return -1;
  return rows.findIndex((r) => rowId(r) === targetId);
}

export function findIndexByUlid(sessions: RegistryEntry[], ulid: string | null): number {
  if (!ulid) return -1;
  return sessions.findIndex((s) => s.id === ulid);
}

export function preserveCursorAcrossUpdate(
  oldSelectedUlid: MenuRowId | null,
  newSessions: RegistryEntry[],
): MenuRowId | null {
  if (
    oldSelectedUlid === SYNTHETIC_NEW ||
    oldSelectedUlid === SYNTHETIC_CLOSE ||
    oldSelectedUlid === SYNTHETIC_INSTALL ||
    // Diamond α RM-Fix-1: preserve SCP install row across updates
    oldSelectedUlid === SYNTHETIC_INSTALL_SCP ||
    // Cycle 142 MEXP: preserve SCP engage row across updates (CSPMSR-true gated).
    oldSelectedUlid === SYNTHETIC_ENGAGE_SCP
  ) {
    return oldSelectedUlid;
  }
  if (oldSelectedUlid && newSessions.some((s) => s.id === oldSelectedUlid)) {
    return oldSelectedUlid;
  }
  return newSessions[0]?.id ?? SYNTHETIC_NEW;
}

export function relativeTime(timestampMs: number, nowMs: number = Date.now()): string {
  const diff = Math.max(0, nowMs - timestampMs);
  if (diff < 10_000) return 'just now';
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

export function truncateMiddle(s: string, max: number): string {
  if (s.length <= max) return s;
  if (max < 5) return s.slice(0, max);
  const head = Math.ceil((max - 1) / 2);
  const tail = Math.floor((max - 1) / 2);
  return `${s.slice(0, head)}…${s.slice(s.length - tail)}`;
}

// ── Diamond R Helpers (ANSI-aware line-width clip-and-pad) ───────────

const ANSI_REGEX = /\x1b\[[0-9;]*[A-Za-z]|\x1b\][^\x07]*\x07|\x1b./g;

export function stripAnsiCodes(s: string): string {
  return s.replace(ANSI_REGEX, '');
}

export function visibleLength(s: string): number {
  return stripAnsiCodes(s).length;
}

/**
 * Clip-and-pad a line to exactly `width` visible chars.
 * Clip: preserves ANSI codes within clipped portion + appends trailing ANSI resets.
 * Pad: appends spaces to reach `width`.
 * No-op when visible-length === width.
 * Diamond R OQ-3: inline in menu.ts (avoids new module dependency).
 */
export function clipAndPadToWidth(line: string, width: number): string {
  const visible = visibleLength(line);
  if (visible === width) return line;
  if (visible < width) return line + ' '.repeat(width - visible);
  let result = '';
  let visibleCount = 0;
  let i = 0;
  while (i < line.length && visibleCount < width) {
    const remainder = line.slice(i);
    const ansiMatch = remainder.match(/^(\x1b\[[0-9;]*[A-Za-z]|\x1b\][^\x07]*\x07|\x1b.)/);
    if (ansiMatch) {
      result += ansiMatch[0];
      i += ansiMatch[0].length;
    } else {
      result += line[i];
      visibleCount += 1;
      i += 1;
    }
  }
  while (i < line.length) {
    const remainder = line.slice(i);
    const ansiMatch = remainder.match(/^(\x1b\[[0-9;]*[A-Za-z])/);
    if (ansiMatch) {
      result += ansiMatch[0];
      i += ansiMatch[0].length;
    } else {
      i += 1;
    }
  }
  return result;
}

/**
 * Epoch Extension · Macro AV · word-wrap plain text to multiple lines (S4 A5-1).
 * NOT truncateMiddle — produces multiple lines for the DETAIL last-turn transcript.
 * Words longer than `width` are hard-broken. Empty input → [''] (one blank line).
 * Caller joins the returned lines with the desired indent (e.g. '\n  ').
 */
export function wrapTextToWidth(text: string, width: number): string[] {
  if (!text) return [''];
  const safeWidth = Math.max(1, width);
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if (current.length + word.length + 1 <= safeWidth) {
      current = current.length === 0 ? word : `${current} ${word}`;
    } else {
      if (current.length > 0) lines.push(current);
      // Word longer than width: hard-break into width-sized chunks.
      let w = word;
      while (w.length > safeWidth) {
        lines.push(w.slice(0, safeWidth));
        w = w.slice(safeWidth);
      }
      current = w;
    }
  }
  if (current.length > 0) lines.push(current);
  return lines.length > 0 ? lines : [''];
}

// ── Diamond H Helpers ─────────────────────────────────────────────────

/**
 * Clamp a page index to [0, totalPages-1]. Returns 0 when totalPages <= 0.
 * (SB-S12 Pattern: page-jump bound discipline.)
 */
export function clampCurrentPage(page: number, totalPages: number): number {
  if (totalPages <= 0) return 0;
  return Math.max(0, Math.min(page, totalPages - 1));
}

/**
 * Slice the body sessions for the given page. Returns empty array when
 * visibleBodySlots <= 0 or page is out of range. (SB-S12 Pattern.)
 */
export function getBodyPageSessions(
  sessions: RegistryEntry[],
  currentPage: number,
  visibleBodySlots: number,
): RegistryEntry[] {
  if (visibleBodySlots <= 0) return [];
  const start = currentPage * visibleBodySlots;
  return sessions.slice(start, start + visibleBodySlots);
}

// ── Render Helpers ─────────────────────────────────────────────────

function safeCell(s: string): string {
  return s.replace(/\n/g, ' ');
}

/**
 * Render the 7-char STATE column for a session row.
 * Diamond K: 3-state model (pending/alive/offline) derived from registry (Pattern 4 structural law).
 */
function renderState(state: SessionState): string {
  return state.padEnd(7);
}

/**
 * Format a session row with Diamond K 3-state STATE column displayed.
 */
export function formatSessionRow(
  row: { kind: 'session'; entry: RegistryEntry; state: SessionState },
  isSelected: boolean,
  termWidth: number,
): string {
  const prefix = isSelected ? `${ANSI.REVERSE}→ ` : '  ';
  const suffix = isSelected ? ANSI.RESET : '';
  const s = row.entry;
  const indicator =
    s.status === 'launched'
      ? '●'
      : s.status === 'allocated'
      ? '○'
      : s.status === 'offline'
      ? '⊘'
      : '⊘';
  // Diamond R Fix R-1: Synthesized rows store generated ULID in s.id; show
  // claudeSessionId-short for these so the column doesn't display "01DISCOVER"
  // (or any synthesized prefix). Spawned rows continue to show ULID prefix.
  const ulidShort = safeCell(
    s.synthesizedAt !== undefined ? (s.claudeSessionId ?? '').slice(0, 10) : s.id.slice(0, 10),
  );
  // Diamond Q: User-Sourced Identification Diameter — when displayName is set,
  // the column shows it (truncateMiddle for clarity); otherwise falls back to
  // claudeSessionId-short. Both branches padEnd(16) for column alignment across
  // mixed named/unnamed rows on the same page.
  // RM-D4 · DPCO · scsLabel (SCS-Bridge rename) > displayName (ClaudeCode) > id-short.
  const nameOrUuid = safeCell(
    s.scsLabel
      ? truncateMiddle(s.scsLabel, 16).padEnd(16)
      : s.displayName
      ? truncateMiddle(s.displayName, 16).padEnd(16)
      : (s.claudeSessionId ?? '').slice(0, 8).padEnd(16),
  );
  const status = safeCell(s.status.padEnd(9));
  // D2 Recurse-4 · TPCR (TUI-Phantom-Column-Removal): derived `state` column
  // collapsed into single source of truth `status`. Diamond K apparatus
  // (renderState/deriveSessionState/SessionState) retained as sideline per
  // S7 §4 SIDELINE — still typed-fed via row.state for applyKeypress
  // spawn-mode discrimination; only the render-layer interpolation is pruned.
  // Reflowed cwdMaxWidth: termWidth - 92 → termWidth - 83 (7-char state cell
  // + 2-char separator = 9 chars reclaimed for cwd headroom).
  const cwdMaxWidth = Math.max(15, termWidth - 83);
  // padEnd ensures cwd column is exactly cwdMaxWidth visible chars wide.
  const cwdShort = safeCell(truncateMiddle(basename(s.cwd ?? ''), cwdMaxWidth).padEnd(cwdMaxWidth));
  const launched = safeCell(relativeTime(s.spawnedAt));
  const rowCore = `${prefix}${indicator} ${ulidShort}  ${nameOrUuid}  ${status}  ${cwdShort}  ${launched}${suite8Tag(s)}${anchorTag(s)}`;
  // C1104 · SHOW · the model tag rides the row's LEFTOVER width, truncated to fit, so
  // the Diamond R "visible length ≤ termWidth" invariant holds at every terminal size
  // (at 80 columns cwdShort is already at its 15-char floor, so there is no budget left
  // to reclaim — the tag must measure the remainder itself rather than assume one).
  const usedWidth = rowCore.replace(/\x1b\[[0-9;]*m/g, '').length;
  return `${rowCore}${modelTag(s, termWidth - usedWidth)}${suffix}`;
}

/**
 * C1104 · SHOW (law 5) · the session's RESUME model as a tag. The TUI carried NO model
 * column at all before this. An entry with no recorded model renders the DEFAULT rather
 * than nothing — the row must always say what the session will actually resume with.
 *
 * Width-aware by construction: `budget` is the row's remaining visible columns. The full
 * form `<default (Opus 5)>` renders when it fits; the compact form `<Opus 5>` when it
 * does not; a middle-truncated label when even that overruns; nothing at all below five
 * columns. Never widens a row past termWidth.
 */
function modelTag(entry: { model?: string }, budget: number): string {
  // CHROME = two leading spaces + the angle brackets: exactly 4 visible columns.
  const CHROME = 4;
  if (budget < CHROME + 1) return '';
  const ochre = rgbToAnsi(SUITE_COLORS.Ochre, TERMINAL_CAPS);
  const bare = entry.model
    ? (modelLabel(entry.model) ?? entry.model)
    : (modelLabel(DEFAULT_MODEL) ?? DEFAULT_MODEL);
  const full = entry.model ? bare : `default (${bare})`;
  const wrap = (label: string): string => `  ${ochre}<${label}>${ANSI.RESET}`;
  if (full.length + CHROME <= budget) return wrap(full);
  if (bare.length + CHROME <= budget) return wrap(bare);
  return wrap(truncateMiddle(bare, budget - CHROME));
}

/**
 * C2 SLSA · Suite8-Labeled Session Awareness — append the session's Suite 8
 * "Calling" as an Ochre tag after `launched`, outside the cwd width budget.
 * Empty when the session carries no suite8Name (General sessions unchanged).
 */
function suite8Tag(entry: { suite8Name?: string }): string {
  if (!entry.suite8Name) return '';
  const ochre = rgbToAnsi(SUITE_COLORS.Ochre, TERMINAL_CAPS);
  return `  ${ochre}[${entry.suite8Name}]${ANSI.RESET}`;
}

/**
 * A-D2 · DACM · Anchor column (TUI surface). Append a ⚓ glyph when the session
 * is the page-bound Anchor for its Suite 8 (isAnchor). Mirrors suite8Tag — appended
 * outside the cwd width budget; empty for non-anchor sessions. isAnchor flows FREE
 * (formatSessionRow's `s` is a RegistryEntry — A-D1 added the field there).
 */
function anchorTag(entry: { isAnchor?: boolean }): string {
  if (!entry.isAnchor) return '';
  const viridian = rgbToAnsi(SUITE_COLORS.Viridian, TERMINAL_CAPS);
  return `  ${viridian}⚓${ANSI.RESET}`;
}

/**
 * FIX-2 (Viridian): use rgbToAnsi(SUITE_COLORS.Viridian, caps) for proper
 * 256-color fallback on macOS Terminal.app instead of hard-coded escape.
 */
export function formatHead(selected: boolean): string {
  const viridian = rgbToAnsi(SUITE_COLORS.Viridian, TERMINAL_CAPS);
  const prefix = selected ? `${ANSI.REVERSE}→ ` : '  ';
  const suffix = selected ? ANSI.RESET : '';
  return `${prefix}${viridian}⊕ New Session${ANSI.RESET}${suffix}`;
}

/**
 * FIX-2 (Viridian): use rgbToAnsi(SUITE_COLORS.Rose, caps).
 */
export function formatTail(selected: boolean): string {
  const rose = rgbToAnsi(SUITE_COLORS.Rose, TERMINAL_CAPS);
  const prefix = selected ? `${ANSI.REVERSE}→ ` : '  ';
  const suffix = selected ? ANSI.RESET : '';
  return `${prefix}${rose}× Close Bridge${ANSI.RESET}${suffix}`;
}

/**
 * Diamond B-1: Install-mode top sentinel row. Rendered ABOVE HEAD (New Session)
 * when state.cascadesPresent === false (CD-23 Conditional Bridge Bootmode Diameter).
 * Color: Ochre (Suite 3 Architect — install is a planning/onboarding gateway).
 * Stub Enter dispatches { type: 'install-selected' }; full implementation arrives in Diamond B-6.
 */
// Diamond B-20 (CD-64 CPCLD): formatInstall now accepts cascadesPresent to
// drive label discrimination. Backward-compatible: omitting the second arg
// produces INSTALL_LABEL (matches pre-B-20 behavior).
export function formatInstall(selected: boolean, cascadesPresent?: boolean): string {
  const ochre = rgbToAnsi(SUITE_COLORS.Ochre, TERMINAL_CAPS);
  const prefix = selected ? `${ANSI.REVERSE}→ ` : '  ';
  const suffix = selected ? ANSI.RESET : '';
  const label = installPhaseLabel(cascadesPresent);
  return `${prefix}${ochre}${label}${ANSI.RESET}${suffix}`;
}

/**
 * RM-D2: render the "Install SCP" row. Mirrors formatInstall structure but
 * uses Viridian color (Suite 4 — sculptor / new-creation gateway).
 * Cycle 142 MEXP (Green C1): the label multiplex via anyScpsInstalled is
 * REMOVED. The Install SCP row ALWAYS shows INSTALL_SCP_LABEL_FIRST
 * ("⊕ Install SCP") and always routes to 'install-scp-selected'.
 * The Engage row (SYNTHETIC_ENGAGE_SCP) is the dedicated NEXT-label surface
 * rendered by formatEngageScp when anyScpsInstalled === true.
 * Parameter retained as optional + ignored to avoid call-site churn during
 * the MEXP transition; future cleanup may drop it entirely.
 */
export function formatInstallScp(selected: boolean, _anyScpsInstalled: boolean = false): string {
  const viridian = rgbToAnsi(SUITE_COLORS.Viridian, TERMINAL_CAPS);
  const prefix = selected ? `${ANSI.REVERSE}→ ` : '  ';
  const suffix = selected ? ANSI.RESET : '';
  const label = INSTALL_SCP_LABEL_FIRST;
  return `${prefix}${viridian}${label}${ANSI.RESET}${suffix}`;
}

/**
 * Cycle 142 MEXP: render the "Engage Installed SCP" row. Mirrors formatInstallScp
 * structure (same Viridian color, same prefix/suffix conventions) but always
 * uses INSTALL_SCP_LABEL_NEXT. Rendered conditionally — appears only when
 * anyScpsInstalled === true (CSPMSR-true) BEFORE the Install row in row order.
 * Enter routes unconditionally to 'open-scp-manage-menu' (MSCM surface).
 */
export function formatEngageScp(selected: boolean): string {
  const viridian = rgbToAnsi(SUITE_COLORS.Viridian, TERMINAL_CAPS);
  const prefix = selected ? `${ANSI.REVERSE}→ ` : '  ';
  const suffix = selected ? ANSI.RESET : '';
  const label = INSTALL_SCP_LABEL_NEXT;
  return `${prefix}${viridian}${label}${ANSI.RESET}${suffix}`;
}

/**
 * Diamond B-8 Fix 3+4 (HWMTUC-SURFACE + HWMTUC): Pewter HiFi trust-confer pane.
 * D3: pane-gradient via ANSI background gradient (approximated with bold+dim layering in TUI).
 * D4: complementary-color text-shadow (warm amber 0.7a on cool-grey Pewter base; DIM ANSI layer).
 * D5: embossed double-line border (top = `═` bright = highlight; bottom = `─` dim = shadow).
 * Active-state inversion on YES button only (D5 inversion rule).
 * Pattern 4 strict: this function writes NO filesystem artifacts — bridge-side state only.
 * Pewter color rgb(180,185,190) inline (Conductor decision — NOT added to SUITE_COLORS).
 */
// Diamond B-22 (Pewter HiFi v3): refined trust-confer pane.
// Changes from B-8 SB-S42 v0:
//   1. NO ANSI.HOME + ANSI.CLEAR_SCREEN — moved to caller (animatedTui renderFrame)
//      to fix flicker root cause (CD-74 TCPFR · pane was clearing screen 30/sec).
//   2. D5 closed-box border (corners + sides) with DARK top-right + LIGHT bottom-left
//      matching installAnimation buildPewterPane (Pewter HiFi v2 standards).
//   3. Selected-state visual cursor: ▶ glyph + REVERSE highlight on active button;
//      arrow-key navigation toggles `state.trustConfer.selected` (CD-72 TCANC).
//   4. D1 color tokens: Cobalt title accent · Ochre ⚠ glyph · Rose-tint Cancel REVERSE.
/**
 * Diamond β RM-Asp-2 · renderScpSubMenuPane.
 * Lists installed SCPs from scpSubMenu.items + appended "+ Install Another" entry.
 * Cursor (Up/Down) navigates · Enter activates selected · Esc closes.
 */
export function renderScpSubMenuPane(state: MenuState): string {
  if (!state.scpSubMenu) return '';
  const sm = state.scpSubMenu;
  const viridian = rgbToAnsi(SUITE_COLORS.Viridian, TERMINAL_CAPS);
  const ochre = rgbToAnsi(SUITE_COLORS.Ochre, TERMINAL_CAPS);

  const lines: string[] = [
    '',
    `  ${viridian}╔══════════════════════════════════════════════════════════════════════╗${ANSI.RESET}`,
    `  ${viridian}║  ⊕ SCP Menu · ${`${sm.items.length} installed`.padEnd(54, ' ')}║${ANSI.RESET}`,
    `  ${viridian}╠══════════════════════════════════════════════════════════════════════╣${ANSI.RESET}`,
    '',
  ];
  // List installed SCPs
  // SB-Final: render the FSM lifecycle badge in the status column (14-char
  // padded · accommodates "booting 30s" and "live (N):PORT" formats per
  // R4 Angle 2). Falls back to 'pending' when the Muxium subscription has
  // not yet populated lifecycleByScp for this SCP (FSM entry state).
  sm.items.forEach((scp, i) => {
    const isSel = i === sm.selectedIdx;
    const prefix = isSel ? `${ANSI.REVERSE}→ ` : '  ';
    const suffix = isSel ? ANSI.RESET : '';
    const lifecycleState = sm.lifecycleByScp?.get(scp.name);
    // SS-A1-D2 · PPHB Interactive 6th-state count source. When the PPHB Map
    // is present (M17 closure has fired at least once), the badge `(N)`
    // sub-marker derives N from heartbeat-verified sessions within the 90s
    // staleness window (R4 authoritative · Option D: same badge format,
    // tighter source). When the Map is absent (cold start before first
    // M17 tick) or yields zero, fall back to the SB-Final
    // sessionCountByScp source so the existing live-badge UX is preserved.
    const interactiveCount = sm.interactiveSessionsByScp
      ? filterRecentHeartbeats(
          sm.interactiveSessionsByScp,
          scp.name,
          Date.now(),
          INTERACTIVE_STALENESS_THRESHOLD_MS,
        ).size
      : 0;
    const fallbackCount = sm.sessionCountByScp?.get(scp.name);
    const sessionCount = interactiveCount > 0 ? interactiveCount : fallbackCount;
    const livePort = sm.portByScp?.get(scp.name);
    const bootingStartedAt = sm.bootingStartedAtByScp?.get(scp.name);
    const bootingElapsedMs =
      bootingStartedAt !== undefined ? Date.now() - bootingStartedAt : undefined;
    const badge = renderScpLifecycleBadgeWithFallback(lifecycleState, {
      sessionCount,
      port: livePort,
      bootingElapsedMs,
    });
    // PPSH Parenthesized-Prefix-Slot-Hint · per-row NKOR digit affordance.
    // Indices 0-8 show (1)-(9); index ≥9 uses 4-space blank to preserve column.
    // Parens DIM, digit BOLD, name in default suite color.
    // PIIK invariant: prefix derived from current registry index, not cached.
    // Citation: SUITE-3-YELLOW-UX-REFINEMENT-BLUEPRINT.md §2 (PPSH)
    const ppshPrefix =
      i < 9
        ? `${ANSI.DIM}(${ANSI.RESET}${ANSI.BOLD}${i + 1}${ANSI.RESET}${ANSI.DIM}) ${ANSI.RESET}`
        : '    ';
    lines.push(`  ${prefix}${ppshPrefix}● ${scp.name.padEnd(16)}  ${badge}${suffix}`);
  });
  // "Install Another" entry as last index
  const installIdx = sm.items.length;
  const isInstallSel = installIdx === sm.selectedIdx;
  const installPrefix = isInstallSel ? `${ANSI.REVERSE}→ ` : '  ';
  const installSuffix = isInstallSel ? ANSI.RESET : '';
  lines.push('');
  lines.push(`  ${installPrefix}${ochre}⊕ Install Another SCP${ANSI.RESET}${installSuffix}`);
  // MD-ARC+C · Wave 5a (MD-ARC-R3-BLUEPRINT §5.3) — the Archived fold.
  // Collapsed: a single "▸ Archived (N)" line ([T] expands). Expanded: the
  // archived rows join the navigable list at index [installIdx+1 .. +N] DIMMED
  // (name + archive date) · the selected archived row shows "[R] reinstate".
  const archived = sm.archivedItems ?? [];
  if (archived.length > 0) {
    lines.push('');
    if (!sm.showArchived) {
      lines.push(`  ${ANSI.DIM}▸ Archived (${archived.length})  ·  [T] expand${ANSI.RESET}`);
    } else {
      lines.push(`  ${ANSI.DIM}▾ Archived (${archived.length})  ·  [T] collapse${ANSI.RESET}`);
      archived.forEach((a, ai) => {
        const rowIdx = installIdx + 1 + ai;
        const isSel = rowIdx === sm.selectedIdx;
        const prefix = isSel ? `${ANSI.REVERSE}→ ` : '  ';
        const suffix = isSel ? ANSI.RESET : '';
        const when =
          typeof a.archivedAt === 'number' ? new Date(a.archivedAt).toISOString().slice(0, 10) : '';
        const reinstateHint = isSel ? '  [R] reinstate' : '';
        lines.push(
          `  ${prefix}${ANSI.DIM}○ ${a.name.padEnd(16)}  ${when}${reinstateHint}${ANSI.RESET}${suffix}`,
        );
      });
    }
  }
  lines.push('');
  lines.push(`  ${viridian}╚══════════════════════════════════════════════════════════════════════╝${ANSI.RESET}`);
  lines.push('');
  // TRHC Two-Row-Hotkey-Centered · HHRB Hotkey-Hint-Row-Balance · Site A.
  // Row 1 = pointing (navigation + recall); Row 2 = acting (activate/launch/dismiss).
  // Narrow-terminal guard: Math.max(0, ...) clamps pad to 0; row renders flush-left
  // when termWidth < row length (no truncation of hint text).
  // Citation: SUITE-3-YELLOW-UX-REFINEMENT-BLUEPRINT.md §3 (TRHC + centerRow)
  const centerRow = (text: string, w: number): string => {
    const visible = text.replace(/\x1b\[[0-9;]*m/g, '').length;
    const pad = Math.max(0, Math.floor((w - visible) / 2));
    return ' '.repeat(pad) + text;
  };
  // MD-ARC+C · Wave 5a (MD-ARC-R3-BLUEPRINT §5) — hint rows gain the lifecycle
  // verbs. Row 1 pointing (navigation); Row 2 acting (activate/launch/close/archive);
  // Row 3 (only when the fold is non-empty) the Archived fold verbs.
  const subRow1 = `${ANSI.DIM}↑/↓ navigate · Home/End jump · V boot log${ANSI.RESET}`;
  const subRow2 = `${ANSI.DIM}Enter activate · L launch · X close · A archive · Esc back${ANSI.RESET}`;
  lines.push(centerRow(subRow1, state.termWidth));
  lines.push(centerRow(subRow2, state.termWidth));
  if ((sm.archivedItems?.length ?? 0) > 0) {
    const subRow3 = `${ANSI.DIM}T ${sm.showArchived ? 'collapse' : 'expand'} archived${sm.showArchived ? ' · R reinstate' : ''}${ANSI.RESET}`;
    lines.push(centerRow(subRow3, state.termWidth));
  }

  const padded = lines.map((l) => clipAndPadToWidth(l, state.termWidth));
  return padToHeight(padded, state.termHeight).join('\n');
}

/**
 * MD-ARC+C · Wave 5a (MD-ARC-R3-BLUEPRINT §5.2) · renderScpArchiveConfirmPane.
 * Pewter HiFi D5 closed-box confirm modal for the SCP Archive verb. Mirrors
 * renderUninstallConfirmPane's construction (D5 borders · destructive default-N ·
 * arrow-nav-free direct [Y]/[N]). Archive is REVERSIBLE (Reinstate recovers it),
 * so this is a single-confirmation (NOT the typed-Delete PARAMSEAL guard).
 *
 * Two forms driven by scpArchiveConfirm state:
 *   BASE     (no worktreeInstances)         → "Archive <name>? [Y] archive · [N] cancel"
 *   H1 FORCE (worktreeInstances present)    → lists the instances DIMMED +
 *                                             "[F] force-archive · [N] cancel"
 * A `notice` string (stop-first · retire-first · move-failed) renders inline
 * above the buttons when the direct call surfaced a refusal reason.
 */
export function renderScpArchiveConfirmPane(state: MenuState): string {
  const ac = state.scpArchiveConfirm!;
  const w = state.termWidth;
  const h = state.termHeight;

  const PEWTER_RGB = { r: 180, g: 185, b: 190 } as const;
  const PEWTER = rgbToAnsi(PEWTER_RGB, TERMINAL_CAPS);
  const PEWTER_DIM = `${ANSI.DIM}${PEWTER}`;
  const COBALT = rgbToAnsi(SUITE_COLORS.Cobalt, TERMINAL_CAPS); // safe-default N accent
  const ROSE = rgbToAnsi(SUITE_COLORS.Rose, TERMINAL_CAPS); // destructive title + force/Y accent
  const OCHRE = rgbToAnsi(SUITE_COLORS.Ochre, TERMINAL_CAPS); // notice glyph

  const BORDER_DARK = `${ANSI.DIM}${PEWTER}`;
  const BORDER_LIGHT = `${ANSI.BOLD}${PEWTER}`;
  const innerWidth = Math.max(40, w - 4);
  const horiz = '─'.repeat(Math.max(innerWidth - 2, 8));
  const topBorder = `${BORDER_DARK}┌${horiz}┐${ANSI.RESET}`;
  const botBorder = `${BORDER_LIGHT}└${horiz}┘${ANSI.RESET}`;
  const leftEdge = `${BORDER_LIGHT}│${ANSI.RESET}`;
  const rightEdge = `${BORDER_DARK}│${ANSI.RESET}`;

  const bodyLine = (content: string): string => `${leftEdge}${content}${rightEdge}`;
  const padCenter = (text: string, visibleLen: number): string => {
    const pad = Math.max(0, innerWidth - 2 - visibleLen);
    const left = Math.floor(pad / 2);
    const right = pad - left;
    return ' '.repeat(left) + text + ' '.repeat(right);
  };
  const padLeft = (text: string, visibleLen: number, indent = 2): string => {
    const pad = Math.max(0, innerWidth - 2 - visibleLen - indent);
    return ' '.repeat(indent) + text + ' '.repeat(pad);
  };
  const blank = (): string => bodyLine(' '.repeat(innerWidth - 2));

  const hasWorktrees = (ac.worktreeInstances?.length ?? 0) > 0;

  const out: string[] = [];

  // Header (outside box · matches uninstall/trust confirm shape)
  out.push(clipAndPadToWidth(`${ANSI.BOLD}SCS Bridge — Archive SCP${ANSI.RESET}`, w));
  out.push(
    clipAndPadToWidth(
      `${ANSI.DIM}Reversible · the SCP moves to the vault · Reinstate recovers it${ANSI.RESET}`,
      w,
    ),
  );

  out.push(clipAndPadToWidth(topBorder, w));

  // Title row · Rose-tint (destructive-shaped signal · default-N)
  const titleText = `⚠  Archive ${ac.name}`;
  const titleColored = `${ANSI.BOLD}${ROSE}⚠  Archive ${ac.name}${ANSI.RESET}`;
  out.push(clipAndPadToWidth(bodyLine(padLeft(titleColored, titleText.length, 2)), w));

  out.push(clipAndPadToWidth(blank(), w));

  if (!hasWorktrees) {
    const body = 'Moves Cascades/scps/<name>/ → the .archive vault.';
    out.push(
      clipAndPadToWidth(bodyLine(padLeft(`${PEWTER_DIM}${body}${ANSI.RESET}`, body.length, 2)), w),
    );
  } else {
    // WAPF H1 · this SCP owns worktree instances — list them DIMMED + require [F].
    const wtHeader = 'This SCP owns worktree instances:';
    out.push(
      clipAndPadToWidth(bodyLine(padLeft(`${PEWTER_DIM}${wtHeader}${ANSI.RESET}`, wtHeader.length, 2)), w),
    );
    for (const inst of ac.worktreeInstances ?? []) {
      const maxLen = Math.max(8, innerWidth - 2 - 4);
      const shown = inst.length > maxLen ? truncateMiddle(inst, maxLen) : inst;
      const text = `· ${shown}`;
      out.push(
        clipAndPadToWidth(bodyLine(padLeft(`${PEWTER_DIM}${text}${ANSI.RESET}`, text.length, 4)), w),
      );
    }
    out.push(clipAndPadToWidth(blank(), w));
    const forceNote = '[F] force-archive moves them + runs git worktree repair.';
    out.push(
      clipAndPadToWidth(
        bodyLine(padLeft(`${PEWTER_DIM}${forceNote}${ANSI.RESET}`, forceNote.length, 2)),
        w,
      ),
    );
  }

  // Inline notice (refusal reason surfaced by the direct call · Ochre glyph).
  if (ac.notice) {
    out.push(clipAndPadToWidth(blank(), w));
    const noticeText = `⚠ ${ac.notice}`;
    const noticeColored = `${ANSI.BOLD}${OCHRE}⚠${ANSI.RESET} ${PEWTER}${ac.notice}${ANSI.RESET}`;
    out.push(clipAndPadToWidth(bodyLine(padLeft(noticeColored, noticeText.length, 2)), w));
  }

  out.push(clipAndPadToWidth(blank(), w));

  // Buttons · destructive default-N. Confirm key is [Y] (base) OR [F] (H1 force).
  // No arrow-nav — the pane is direct-key only (mirrors the confirm idiom, static).
  const yesText = hasWorktrees ? '[F] Force-archive' : '[Y] Yes, archive';
  const noText = '[N] No, cancel';
  const yesBtn = `${ANSI.BOLD}${ROSE}${yesText}${ANSI.RESET}`;
  const noBtn = `${ANSI.REVERSE}${ANSI.BOLD}${COBALT}▶ ${noText}${ANSI.RESET}`;
  const buttonRow = `${yesBtn}    ${noBtn}`;
  const buttonRowVisLen = yesText.length + 4 + 2 + noText.length;
  out.push(clipAndPadToWidth(bodyLine(padCenter(buttonRow, buttonRowVisLen)), w));

  out.push(clipAndPadToWidth(blank(), w));
  out.push(clipAndPadToWidth(botBorder, w));

  const hint = hasWorktrees
    ? 'F force-archive · N/Esc cancel'
    : 'Y archive · N/Esc cancel';
  out.push(clipAndPadToWidth(`${ANSI.DIM}${hint}${ANSI.RESET}`, w));

  return padToHeight(out, h && h > 0 ? h : 24).join('\n');
}

/**
 * Epoch Extension · Macro AV · renderArchiveViewPane — Pewter HiFi archive screen.
 *
 * Shared vocabulary (S4 A7 · both surfaces must match):
 *   label      → primary identity, BOLD (entry.label ?? id.slice(-8))
 *   suite8Name → Ochre-tinted tag, optional
 *   archivedAt → relative time, DIM
 *   preview    → cached pre-archive snippet (NOT the live last turn), DIM
 *   lastTurn   → on-demand DETAIL body (transcriptLastUserInput/ModelOutput), wrapped
 *
 * Two phases on one full-frame render (full-replace · S3 OQ-2):
 *   LIST   (av.detail === null)            → manifest rows + footer hints
 *   DETAIL (av.detail === ArchiveContents) → Cobalt header + word-wrapped transcript
 *   LOADING (av.detail === 'loading')      → "Loading archive contents..." line
 *
 * Pagination: sliding window keyed off selectedIdx (S3 OQ-1 recommendation) — no
 * explicit page integers; archiveView.currentPage is left vestigial/harmless.
 */
export function renderArchiveViewPane(state: MenuState): string {
  const av = state.archiveView;
  if (!av) return '';
  const maroon = rgbToAnsi(SUITE_COLORS.Maroon, TERMINAL_CAPS);
  const ochre = rgbToAnsi(SUITE_COLORS.Ochre, TERMINAL_CAPS);
  const cobalt = rgbToAnsi(SUITE_COLORS.Cobalt, TERMINAL_CAPS);
  const viridian = rgbToAnsi(SUITE_COLORS.Viridian, TERMINAL_CAPS);

  const termWidth = state.termWidth;
  const termHeight = state.termHeight;
  // Inner border width: 2-space left indent + 2 border columns = 4 reserved.
  const innerWidth = Math.max(40, termWidth - 4);
  const horiz = '═'.repeat(Math.max(innerWidth - 2, 8));
  const centerRow = (text: string, w: number): string => {
    const visible = text.replace(/\x1b\[[0-9;]*m/g, '').length;
    const pad = Math.max(0, Math.floor((w - visible) / 2));
    return ' '.repeat(pad) + text;
  };

  const lines: string[] = [];

  // ── DETAIL phase ──────────────────────────────────────────────────────
  if (av.detail !== null) {
    lines.push('');
    lines.push(`  ${cobalt}╔═ Last Turn ${'═'.repeat(Math.max(horiz.length - 11, 8))}╗${ANSI.RESET}`);

    if (av.detail === 'loading') {
      lines.push(`  ${cobalt}║${ANSI.RESET}`);
      lines.push(`  ${ANSI.DIM}Loading archive contents...${ANSI.RESET}`);
      lines.push(`  ${cobalt}╚${'═'.repeat(Math.max(horiz.length, 8))}╝${ANSI.RESET}`);
      const paddedLoad = lines.map((l) => clipAndPadToWidth(l, termWidth));
      return padToHeight(paddedLoad, termHeight).join('\n');
    }

    const contents = av.detail;
    const entry = contents.entry;
    const detailLabel = entry.label ?? entry.id.slice(-8);
    const detailTime = relativeTime(entry.archivedAt);
    lines.push(
      `  ${cobalt}║${ANSI.RESET}  ${ANSI.BOLD}${detailLabel}${ANSI.RESET}  ·  ${ANSI.DIM}${detailTime}${ANSI.RESET}`,
    );
    lines.push(`  ${cobalt}╠${'═'.repeat(Math.max(horiz.length, 8))}╣${ANSI.RESET}`);
    lines.push('');

    // Archived preview (cached snapshot — distinct from live lastTurn · S4 A7-1).
    if (entry.preview) {
      lines.push(
        `  ${ANSI.DIM}Archived preview:${ANSI.RESET}  ${ANSI.DIM}${truncateMiddle(entry.preview, innerWidth - 20)}${ANSI.RESET}`,
      );
      lines.push('');
    }

    if (contents.lastTurn === null) {
      // Session archived without a transcript (.jsonl absent or empty).
      lines.push(`  ${ANSI.DIM}No transcript recorded for this session.${ANSI.RESET}`);
    } else {
      const lt = contents.lastTurn;
      const wrapWidth = Math.max(8, termWidth - 4);
      lines.push(`  ${ANSI.DIM}Last user input:${ANSI.RESET}`);
      for (const wl of wrapTextToWidth(lt.transcriptLastUserInput, wrapWidth)) {
        lines.push(`  ${ANSI.DIM}${wl}${ANSI.RESET}`);
      }
      lines.push('');
      lines.push(`  ${cobalt}Last model output:${ANSI.RESET}`);
      for (const wl of wrapTextToWidth(lt.transcriptLastModelOutput, wrapWidth)) {
        lines.push(`  ${wl}`);
      }
    }
    lines.push('');
    lines.push(`  ${cobalt}╚${'═'.repeat(Math.max(horiz.length, 8))}╝${ANSI.RESET}`);
    lines.push('');
    lines.push(centerRow(`${ANSI.DIM}Esc back to list${ANSI.RESET}`, termWidth));

    const paddedDetail = lines.map((l) => clipAndPadToWidth(l, termWidth));
    return padToHeight(paddedDetail, termHeight).join('\n');
  }

  // ── LIST phase ────────────────────────────────────────────────────────
  // Header (3 lines) + 2 footer hint rows + 1 cap-notice row = 6 reserved.
  const headerCount = `${av.entries.length} session${av.entries.length === 1 ? '' : 's'}`;
  lines.push('');
  lines.push(`  ${ochre}╔${horiz}╗${ANSI.RESET}`);
  lines.push(
    `  ${ochre}║${ANSI.RESET}  ${maroon}■ Archive${ANSI.RESET}  ${ANSI.DIM}· ${headerCount}${ANSI.RESET}${' '.repeat(Math.max(0, horiz.length - headerCount.length - 14))}${ochre}║${ANSI.RESET}`,
  );
  lines.push(`  ${ochre}╠${horiz}╣${ANSI.RESET}`);
  lines.push('');

  if (av.entries.length === 0) {
    lines.push(
      `  ${ANSI.DIM}No archived sessions — use [a] from the session menu to archive.${ANSI.RESET}`,
    );
  } else {
    // Sliding-window viewport: body height = termHeight - (3 header + 1 border-close
    // + 1 blank + 2 footer rows). Keep selectedIdx visible within the window.
    const bodyHeight = Math.max(1, termHeight - 8);
    const total = av.entries.length;
    const sel = Math.min(Math.max(0, av.selectedIdx), total - 1);
    let windowStart = 0;
    if (sel >= bodyHeight) {
      windowStart = Math.min(sel - bodyHeight + 1, Math.max(0, total - bodyHeight));
    }
    const windowEnd = Math.min(total, windowStart + bodyHeight);
    // Column widths for the row layout.
    const labelWidth = 18;
    for (let i = windowStart; i < windowEnd; i += 1) {
      const e = av.entries[i];
      const isSel = i === sel;
      const prefix = isSel ? `${ANSI.REVERSE}→ ${ANSI.RESET}` : '  ';
      const rawLabel = e.label ?? e.id.slice(-8);
      const label = clipAndPadToWidth(`${ANSI.BOLD}${truncateMiddle(rawLabel, labelWidth)}${ANSI.RESET}`, labelWidth);
      const tag = e.suite8Name ? `${ochre}[${e.suite8Name}]${ANSI.RESET}` : '';
      const tagWidth = e.suite8Name ? e.suite8Name.length + 2 : 0;
      const relTime = relativeTime(e.archivedAt);
      // Remaining width for the DIM preview clip.
      const previewBudget = Math.max(0, termWidth - labelWidth - tagWidth - relTime.length - 12);
      const preview = e.preview ? truncateMiddle(e.preview, previewBudget) : '';
      lines.push(
        `  ${prefix}${label}  ${tag ? `${tag}  ` : ''}${ANSI.DIM}${relTime}${ANSI.RESET}  ${ANSI.DIM}${preview}${ANSI.RESET}`,
      );
    }
  }

  lines.push('');
  lines.push(`  ${ochre}╚${horiz}╝${ANSI.RESET}`);
  lines.push('');
  lines.push(centerRow(`${ANSI.DIM}↑/↓ navigate · Enter expand · r refresh · Esc back${ANSI.RESET}`, termWidth));
  if (av.entries.length >= MANIFEST_CAP) {
    lines.push(
      centerRow(`${ANSI.DIM}Showing ${MANIFEST_CAP} most recent — older archives remain on disk${ANSI.RESET}`, termWidth),
    );
  }
  // Viridian footer accent presence (S5 Section 5 ANSI token contract).
  void viridian;

  const padded = lines.map((l) => clipAndPadToWidth(l, termWidth));
  return padToHeight(padded, termHeight).join('\n');
}

/**
 * Diamond α RM-Fix-2 · renderScpWizardPane.
 * Minimal text-based wizard pane · 4 steps from installScpPrompts SCP_INSTALL_PROMPTS.
 * Renders the current step's question + hint + input buffer + validation error.
 * Composes ahead of legacy/too-small branches so wizard is preserved across resize.
 */
export function renderScpWizardPane(state: MenuState): string {
  if (!state.scpWizard) return '';
  const w = state.scpWizard;
  const viridian = rgbToAnsi(SUITE_COLORS.Viridian, TERMINAL_CAPS);
  const ochre = rgbToAnsi(SUITE_COLORS.Ochre, TERMINAL_CAPS);

  // SCPGATE FBSN: first-run consent note. Surfaces ONCE before the user's first
  // SCP install. Consent-framing — the Installation Agent acts on the user's behalf
  // (APMD Path A). Pewter pane mirrors the PIBR boot-recommend embossed border.
  // Placed BEFORE the boot-recommend block AND the stepDefs lookup — early-returns
  // before stepDefs is ever consulted (S4 placement risk note).
  if (w.state.step === 'agent-install-note') {
    const PEWTER_RGB = { r: 180, g: 185, b: 190 } as const;
    const PEWTER = rgbToAnsi(PEWTER_RGB, TERMINAL_CAPS);
    const BORDER_DARK = `${ANSI.DIM}${PEWTER}`;
    const BORDER_LIGHT = `${ANSI.BOLD}${PEWTER}`;
    const innerWidth = Math.max(40, state.termWidth - 4);
    const horiz = '═'.repeat(Math.max(innerWidth - 2, 8));
    const horizLight = '─'.repeat(Math.max(innerWidth - 2, 8));
    const lines: string[] = [
      '',
      `  ${BORDER_DARK}╔${horiz}╗${ANSI.RESET}`,
      `  ${BORDER_DARK}║${ANSI.RESET}  ${ANSI.BOLD}${ochre}⊕ Install SCP${ANSI.RESET}`,
      `  ${BORDER_DARK}║${ANSI.RESET}`,
      `  ${BORDER_DARK}║${ANSI.RESET}  ${ANSI.DIM}The Installation Agent will install the SCP${ANSI.RESET}`,
      `  ${BORDER_DARK}║${ANSI.RESET}  ${ANSI.DIM}automatically when you continue the install flow.${ANSI.RESET}`,
      `  ${BORDER_DARK}║${ANSI.RESET}  ${ANSI.DIM}This menu is the backup path if you exit the agent.${ANSI.RESET}`,
      `  ${BORDER_DARK}║${ANSI.RESET}`,
      `  ${BORDER_DARK}║${ANSI.RESET}  ${ANSI.BOLD}${viridian}▶ [Enter] Continue to the SCP wizard${ANSI.RESET}`,
      `  ${BORDER_DARK}║${ANSI.RESET}     ${ANSI.DIM}[Esc] Dismiss · install later from this menu${ANSI.RESET}`,
      `  ${BORDER_DARK}║${ANSI.RESET}`,
      `  ${BORDER_LIGHT}╚${horizLight}╝${ANSI.RESET}`,
      '',
      `  ${ANSI.DIM}Enter continue · Esc dismiss${ANSI.RESET}`,
      '',
    ];
    const padded = lines.map((l) => clipAndPadToWidth(l, state.termWidth));
    return padToHeight(padded, state.termHeight).join('\n');
  }

  // PIBR (Post-Install-Boot-Recommendation): dedicated render block for the
  // boot-recommend step inserted between install-complete and wizard-close.
  // Pewter D5 embossed border (DARK top+right / LIGHT bottom+left) · suite-color
  // accent on the SCP name. Issue #643 Half B · Refinement 3+4 (SCBN): the SAME
  // navigable [ Launch ] [ Later ] button pair as the confirm-* steps (▶ +
  // REVERSE on the selected button · default-selected affirm = Launch).
  if (w.state.step === 'boot-recommend') {
    const scpName = w.state.derivation?.designation ?? '???';
    const scpRgb = suiteColorForScp(scpName);
    const scpColor = rgbToAnsi(scpRgb, TERMINAL_CAPS);
    const PEWTER_RGB = { r: 180, g: 185, b: 190 } as const;
    const PEWTER = rgbToAnsi(PEWTER_RGB, TERMINAL_CAPS);
    const PEWTER_DIM = `${ANSI.DIM}${PEWTER}`;
    const BORDER_DARK = `${ANSI.DIM}${PEWTER}`;
    const BORDER_LIGHT = `${ANSI.BOLD}${PEWTER}`;
    const innerWidth = Math.max(40, state.termWidth - 4);
    const horiz = '═'.repeat(Math.max(innerWidth - 2, 8));
    const horizLight = '─'.repeat(Math.max(innerWidth - 2, 8));
    const launchActive = (w.state.buttonSelection ?? 'affirm') === 'affirm';
    const launchText = '[ Launch ]';
    const laterText = '[ Later ]';
    const launchPrefix = launchActive ? '▶ ' : '  ';
    const laterPrefix = !launchActive ? '▶ ' : '  ';
    const launchBtn = launchActive
      ? `${ANSI.REVERSE}${ANSI.BOLD}${scpColor}${launchPrefix}${launchText}${ANSI.RESET}`
      : `${PEWTER_DIM}${launchPrefix}${launchText}${ANSI.RESET}`;
    const laterBtn = !launchActive
      ? `${ANSI.REVERSE}${ANSI.BOLD}${PEWTER}${laterPrefix}${laterText}${ANSI.RESET}`
      : `${PEWTER_DIM}${laterPrefix}${laterText}${ANSI.RESET}`;
    const lines: string[] = [
      '',
      `  ${BORDER_DARK}╔${horiz}╗${ANSI.RESET}`,
      `  ${BORDER_DARK}║${ANSI.RESET}  ${ANSI.BOLD}✓ ${scpColor}${scpName}${ANSI.RESET} installed`,
      `  ${BORDER_DARK}║${ANSI.RESET}`,
      `  ${BORDER_DARK}║${ANSI.RESET}  ${ANSI.DIM}Boot ${scpName} now? ${ANSI.RESET}${ANSI.DIM}(recommended)${ANSI.RESET}`,
      `  ${BORDER_DARK}║${ANSI.RESET}`,
      `  ${BORDER_DARK}║${ANSI.RESET}  ${launchBtn}    ${laterBtn}`,
      `  ${BORDER_DARK}║${ANSI.RESET}`,
      `  ${BORDER_LIGHT}╚${horizLight}╝${ANSI.RESET}`,
      '',
      // INSTALL-FIX-007 · FIX 4 · boot-recommend CLARITY. Sharpen the verbs so the
      // card reads as actionable — the user must press a key (Enter launches, Esc
      // skips). "activate/back" read as ambiguous in Blank-Test-007.
      `  ${ANSI.DIM}←/→ select · Enter to launch · Esc to skip${ANSI.RESET}`,
      '',
    ];
    const padded = lines.map((l) => clipAndPadToWidth(l, state.termWidth));
    return padToHeight(padded, state.termHeight).join('\n');
  }

  // Issue #643 Half A · Wave 2 · the Installing screen + pseudo-progress bar.
  // The `running` step is entered when the async install pipeline is in flight
  // (npm install spawned · event loop free). The bar fills toward ~90% as a
  // function of elapsed time since installRunning.startedAt, then renders 100%
  // in the brief frame before the boot-recommend transition. It advances across
  // render ticks because renderScpWizardPane is called every FRAME_INTERVAL_MS
  // and reads Date.now() fresh each paint.
  if (w.state.step === 'running') {
    const scpName = w.state.derivation?.designation ?? state.installRunning?.designation ?? '???';
    const scpRgb = suiteColorForScp(scpName);
    const scpColor = rgbToAnsi(scpRgb, TERMINAL_CAPS);
    const PEWTER_RGB = { r: 180, g: 185, b: 190 } as const;
    const PEWTER = rgbToAnsi(PEWTER_RGB, TERMINAL_CAPS);
    const BORDER_DARK = `${ANSI.DIM}${PEWTER}`;
    const BORDER_LIGHT = `${ANSI.BOLD}${PEWTER}`;
    const innerWidth = Math.max(40, state.termWidth - 4);
    const horiz = '═'.repeat(Math.max(innerWidth - 2, 8));
    const horizLight = '─'.repeat(Math.max(innerWidth - 2, 8));

    // Issue #643 Refinement · STEP-AWARE ASYMPTOTIC fill. Each phase owns a pct
    // range; within a phase the bar approaches (but never reaches) the range's
    // `end` via pct = start + (end-start)*(1 - exp(-Δt/TAU)) — so it SLOWS DOWN
    // the longer that phase runs (the user's "slows if it takes too long"). On a
    // phase TRANSITION, phaseStartedAt resets and the next range's `start` ==
    // this range's `end`, so the bar JUMPS to the checkpoint then re-crawls
    // (the user's "fills quickly after a complete install step"). Each phase's
    // TAU is tuned: staging/finalize crawl fast (short steps), npm crawls slow
    // (the long one). When phase/phaseStartedAt are absent (old state) a gentle
    // time-based crawl is used so the bar still moves and never crashes.
    const PHASE_RANGES: Record<ScpInstallPhase, { start: number; end: number; tau: number }> = {
      staging: { start: 5, end: 30, tau: 1500 },
      npm: { start: 30, end: 85, tau: 12_000 },
      finalize: { start: 85, end: 99, tau: 1500 },
    };
    const PHASE_SUBLABEL: Record<ScpInstallPhase, string> = {
      staging: 'cloning template',
      npm: 'installing dependencies',
      finalize: 'finalizing',
    };
    const phase = state.installRunning?.phase;
    const phaseStartedAt = state.installRunning?.phaseStartedAt;
    let pct: number;
    let subLabel: string;
    if (phase && typeof phaseStartedAt === 'number') {
      const { start, end, tau } = PHASE_RANGES[phase];
      const dt = Math.max(0, Date.now() - phaseStartedAt);
      pct = start + (end - start) * (1 - Math.exp(-dt / tau));
      subLabel = PHASE_SUBLABEL[phase];
    } else {
      // Fallback · gentle time-based crawl toward 90% (defensive · no phase).
      const EST_MS = 30_000;
      const startedAt = state.installRunning?.startedAt;
      const elapsed = typeof startedAt === 'number' ? Math.max(0, Date.now() - startedAt) : 0;
      pct = typeof startedAt === 'number' ? Math.min(90, (elapsed / EST_MS) * 90) : 5;
      subLabel = 'cloning template · npm install';
    }
    const BAR_WIDTH = Math.max(20, Math.min(48, innerWidth - 14));
    const filled = Math.round((pct / 100) * BAR_WIDTH);
    const empty = BAR_WIDTH - filled;
    const bar = `${scpColor}${'█'.repeat(filled)}${ANSI.RESET}${ANSI.DIM}${'░'.repeat(empty)}${ANSI.RESET}`;
    const pctLabel = `${Math.round(pct)}%`.padStart(4, ' ');

    const lines: string[] = [
      '',
      `  ${BORDER_DARK}╔${horiz}╗${ANSI.RESET}`,
      `  ${BORDER_DARK}║${ANSI.RESET}  ${ANSI.BOLD}⊕ Installing ${scpColor}${scpName}${ANSI.RESET}`,
      `  ${BORDER_DARK}║${ANSI.RESET}`,
      `  ${BORDER_DARK}║${ANSI.RESET}  ${ANSI.DIM}${subLabel} …${ANSI.RESET}`,
      `  ${BORDER_DARK}║${ANSI.RESET}`,
      `  ${BORDER_DARK}║${ANSI.RESET}  ${bar} ${ANSI.BOLD}${pctLabel}${ANSI.RESET}`,
      `  ${BORDER_DARK}║${ANSI.RESET}`,
      `  ${BORDER_LIGHT}╚${horizLight}╝${ANSI.RESET}`,
      '',
      `  ${ANSI.DIM}This can take 30-120s · the menu stays responsive${ANSI.RESET}`,
      '',
    ];
    const padded = lines.map((l) => clipAndPadToWidth(l, state.termWidth));
    return padToHeight(padded, state.termHeight).join('\n');
  }

  // Resolve question text (function or string)
  // Inline-port avoids cross-module Concept dependency at render time
  const stepDefs: Record<
    string,
    { question: string | ((s: typeof w.state) => string); hint: string }
  > = {
    designation: {
      question: 'What would you like to name your SCP? (PascalCase · e.g. MyResearchSCP)',
      hint: 'Letters and numbers only · must start with uppercase · 2-32 chars',
    },
    'confirm-concept-name': {
      // Issue #643 Half B · Refinement 3+4: button-driven — no [y]es/[r] text.
      question: (s) =>
        `Concept name will be "${s.derivation?.conceptName ?? '???'}". Confirm?`,
      hint: 'The concept name is the camelCase Stratimux identifier for your SCP',
    },
    'confirm-path': {
      // Issue #643 Half B · Refinement 3+4: [ Yes ] [ No ] button pair.
      question: (s) =>
        `Install to: Cascades/scps/${s.derivation?.designation ?? '???'}/SCP/ — confirm?`,
      hint: 'This creates the SCP runtime tree at the specified path',
    },
    'confirm-launch': {
      // Issue #643 Half B · Refinement 5 (SCP-window truth · no "browser", no raw
      // localhost URL) + Refinement 3+4 ([ Yes ] [ No ] button pair).
      question: 'Clone template and install dependencies?',
      hint: 'The SCP opens in its own SCS window after install.',
    },
    running: { question: 'Installing SCP… (clone + npm install in progress)', hint: 'Please wait' },
    done: {
      question: 'SCP install complete!',
      // SB-Final: shell `cd + npm run bridge` instruction replaced by TUI
      // `[L] launch SCP runtime` action in the SCP sub-menu pane (R1 Sweep 3
      // LOSSY abstraction prune).
      // SCP-3 · BSSPS · [B] Engage via SCS-Bridge surfaces the post-install
      // shortcut: pressing [B] at the done step fires a BSBRE boot-request
      // envelope for the just-installed SCP (reuses launch-scp-runtime path).
      hint: 'Press [B] to Engage via SCS-Bridge · or Esc → [⊕ Open SCP Menu] → [L]',
    },
    error: { question: 'SCP install failed', hint: 'Press Esc to return to menu' },
  };
  const stepKey = w.state.step;
  const def = stepDefs[stepKey] ?? stepDefs.designation;
  const question = typeof def.question === 'function' ? def.question(w.state) : def.question;
  const stepIndex =
    stepKey === 'designation' ? 1 : stepKey === 'confirm-concept-name' ? 2 : stepKey === 'confirm-path' ? 3 : stepKey === 'confirm-launch' ? 4 : 0;
  const total = 4;
  const stepLabel = stepIndex > 0 ? `Step ${stepIndex}/${total}` : stepKey.toUpperCase();

  // Issue #643 Half B · Refinement 3+4 (SCBN): the confirm-* steps present a
  // [ Yes ] [ No ] / [ Yes ] [ Re-enter ] button pair instead of a typed input.
  // The selected button is highlighted (▶ + REVERSE + BOLD + viridian · mirrors
  // renderTrustConferPane CD-72/CD-76). 'designation' keeps the typed buffer.
  const isConfirmStep =
    stepKey === 'confirm-concept-name' || stepKey === 'confirm-path' || stepKey === 'confirm-launch';

  let inputLines: string[];
  if (isConfirmStep) {
    const affirmActive = (w.state.buttonSelection ?? 'affirm') === 'affirm';
    const affirmText = '[ Yes ]';
    // confirm-concept-name's "No" re-enters the designation; the others cancel.
    const denyText = stepKey === 'confirm-concept-name' ? '[ Re-enter ]' : '[ No ]';
    const affirmPrefix = affirmActive ? '▶ ' : '  ';
    const denyPrefix = !affirmActive ? '▶ ' : '  ';
    const affirmBtn = affirmActive
      ? `${ANSI.REVERSE}${ANSI.BOLD}${viridian}${affirmPrefix}${affirmText}${ANSI.RESET}`
      : `${ANSI.DIM}${affirmPrefix}${affirmText}${ANSI.RESET}`;
    const denyBtn = !affirmActive
      ? `${ANSI.REVERSE}${ANSI.BOLD}${ochre}${denyPrefix}${denyText}${ANSI.RESET}`
      : `${ANSI.DIM}${denyPrefix}${denyText}${ANSI.RESET}`;
    inputLines = [
      `  ${affirmBtn}    ${denyBtn}`,
      '',
      `  ${ANSI.DIM}←/→ select · Enter activate · Esc cancel${ANSI.RESET}`,
    ];
  } else {
    inputLines = [`  ${ochre}> ${w.inputBuffer}_${ANSI.RESET}`];
  }

  const lines: string[] = [
    '',
    `  ${viridian}╔══════════════════════════════════════════════════════════════════════╗${ANSI.RESET}`,
    `  ${viridian}║  ⊕ Install SCP · ${stepLabel.padEnd(50, ' ')}║${ANSI.RESET}`,
    `  ${viridian}╠══════════════════════════════════════════════════════════════════════╣${ANSI.RESET}`,
    '',
    `  ${question}`,
    '',
    `  ${ANSI.DIM}${def.hint}${ANSI.RESET}`,
    '',
    ...inputLines,
    '',
  ];
  if (w.state.validationError) {
    lines.push(`  ${ANSI.DIM}⚠ ${w.state.validationError}${ANSI.RESET}`);
    lines.push('');
  }
  lines.push(`  ${viridian}╚══════════════════════════════════════════════════════════════════════╝${ANSI.RESET}`);

  const padded = lines.map((l) => clipAndPadToWidth(l, state.termWidth));
  return padToHeight(padded, state.termHeight).join('\n');
}

export function renderTrustConferPane(state: MenuState): string {
  const tc = state.trustConfer!;
  const w = state.termWidth;
  const h = state.termHeight;

  // Pewter D1 color tokens (palette imported from colors.ts)
  const PEWTER_RGB = { r: 180, g: 185, b: 190 } as const;
  const PEWTER = rgbToAnsi(PEWTER_RGB, TERMINAL_CAPS);
  const PEWTER_DIM = `${ANSI.DIM}${PEWTER}`;
  const COBALT = rgbToAnsi(SUITE_COLORS.Cobalt, TERMINAL_CAPS); // Phase A title accent
  const OCHRE = rgbToAnsi(SUITE_COLORS.Ochre, TERMINAL_CAPS); // ⚠ warn glyph
  const ROSE = rgbToAnsi(SUITE_COLORS.Rose, TERMINAL_CAPS); // Cancel-active accent

  // Diamond B-20 (CD-64 CPCLD): action label discriminates per cascadesPresent
  const isReinstall = state.cascadesPresent === true;
  const actionLabel = isReinstall ? 'Reinstall SCS-Bridge' : 'Install SCS-Bridge';
  const titleVerb = isReinstall ? 'SCS Reinstall' : 'SCS Install';

  // D5 closed-box border construction (matches installAnimation buildPewterPane).
  // Top + right edges: DARK (Pewter dim · bold); bottom + left edges: LIGHT (Pewter bright).
  const BORDER_DARK = `${ANSI.DIM}${PEWTER}`;
  const BORDER_LIGHT = `${ANSI.BOLD}${PEWTER}`;
  const innerWidth = Math.max(40, w - 4);
  const horiz = '─'.repeat(Math.max(innerWidth - 2, 8));
  const topBorder = `${BORDER_DARK}┌${horiz}┐${ANSI.RESET}`;
  const botBorder = `${BORDER_LIGHT}└${horiz}┘${ANSI.RESET}`;
  const leftEdge = `${BORDER_LIGHT}│${ANSI.RESET}`;
  const rightEdge = `${BORDER_DARK}│${ANSI.RESET}`;

  // Helper: wrap content in left+right edges, centered within innerWidth-2
  const bodyLine = (content: string): string => {
    return `${leftEdge}${content}${rightEdge}`;
  };
  const padCenter = (text: string, visibleLen: number): string => {
    const pad = Math.max(0, innerWidth - 2 - visibleLen);
    const left = Math.floor(pad / 2);
    const right = pad - left;
    return ' '.repeat(left) + text + ' '.repeat(right);
  };
  const padLeft = (text: string, visibleLen: number, indent = 2): string => {
    const pad = Math.max(0, innerWidth - 2 - visibleLen - indent);
    return ' '.repeat(indent) + text + ' '.repeat(pad);
  };

  const out: string[] = [];

  // Header (2 lines — mirrors renderMenu header shape; outside the box for context)
  out.push(clipAndPadToWidth(`${ANSI.BOLD}SCS Bridge — Permission Confirmation${ANSI.RESET}`, w));
  out.push(
    clipAndPadToWidth(`${ANSI.DIM}${actionLabel}: review paths before proceeding${ANSI.RESET}`, w),
  );

  // D5 top border
  out.push(clipAndPadToWidth(topBorder, w));

  // Title row: ⚠ Ochre + bold Cobalt
  const titleText = `⚠  Permission Confirmation: ${titleVerb}`;
  const titleColored = `${ANSI.BOLD}${OCHRE}⚠${ANSI.RESET}  ${ANSI.BOLD}${COBALT}Permission Confirmation: ${titleVerb}${ANSI.RESET}`;
  out.push(clipAndPadToWidth(bodyLine(padLeft(titleColored, titleText.length, 2)), w));

  // Sub-title
  const subText = 'The bridge will write the following paths:';
  out.push(
    clipAndPadToWidth(
      bodyLine(padLeft(`${PEWTER_DIM}${subText}${ANSI.RESET}`, subText.length, 2)),
      w,
    ),
  );
  out.push(clipAndPadToWidth(bodyLine(' '.repeat(innerWidth - 2)), w));

  // Diamond B-22 minor fix (post-user-Lambda): truncate paths that would overflow
  // pane interior. Without truncation, long paths (e.g., absolute home-relative
  // /Users/.../Work/.../Cascades/) push the right border │ off-screen via
  // clipAndPadToWidth's right-side clip. truncateMiddle preserves head + tail
  // with … in the middle so user can still see the leaf component.
  const indent = 2;
  tc.paths.forEach((p, i) => {
    const idxText = `${i + 1}.`;
    // Available chars for path content within pane: innerWidth - 2 (sides) - indent - idxText - 1 space
    const maxPathLen = Math.max(8, innerWidth - 2 - indent - idxText.length - 1);
    const truncatedPath = p.length > maxPathLen ? truncateMiddle(p, maxPathLen) : p;
    const colored = `${ANSI.BOLD}${PEWTER}${idxText}${ANSI.RESET} ${truncatedPath}`;
    const visLen = idxText.length + 1 + truncatedPath.length;
    out.push(clipAndPadToWidth(bodyLine(padLeft(colored, visLen, indent)), w));
  });

  if (tc.optionalPaths.length > 0) {
    out.push(clipAndPadToWidth(bodyLine(' '.repeat(innerWidth - 2)), w));
    const optHeader = 'Optional (if converting existing project):';
    out.push(
      clipAndPadToWidth(
        bodyLine(padLeft(`${PEWTER_DIM}${optHeader}${ANSI.RESET}`, optHeader.length, 2)),
        w,
      ),
    );
    const optIndent = 4;
    tc.optionalPaths.forEach((p, i) => {
      const optPrefix = `${i + 1}. `;
      const maxOptPathLen = Math.max(8, innerWidth - 2 - optIndent - optPrefix.length);
      const truncatedOpt = p.length > maxOptPathLen ? truncateMiddle(p, maxOptPathLen) : p;
      const optLine = `${optPrefix}${truncatedOpt}`;
      out.push(
        clipAndPadToWidth(
          bodyLine(padLeft(`${PEWTER_DIM}${optLine}${ANSI.RESET}`, optLine.length, optIndent)),
          w,
        ),
      );
    });
  }

  out.push(clipAndPadToWidth(bodyLine(' '.repeat(innerWidth - 2)), w));

  // Diamond B-22 (CD-72 TCANC + CD-76 PMSH): selected-state buttons.
  // Active button: ▶ + REVERSE + suite-tinted color
  // Inactive button: 2-space prefix + dim Pewter
  const isApproveActive = tc.selected === 'approve';
  const yesText = '[Y] Approve & Install';
  const noText = '[N] Cancel';
  const yesPrefix = isApproveActive ? '▶ ' : '  ';
  const noPrefix = !isApproveActive ? '▶ ' : '  ';
  const yesBtn = isApproveActive
    ? `${ANSI.REVERSE}${ANSI.BOLD}${COBALT}${yesPrefix}${yesText}${ANSI.RESET}`
    : `${PEWTER_DIM}${yesPrefix}${yesText}${ANSI.RESET}`;
  const noBtn = !isApproveActive
    ? `${ANSI.REVERSE}${ANSI.BOLD}${ROSE}${noPrefix}${noText}${ANSI.RESET}`
    : `${PEWTER_DIM}${noPrefix}${noText}${ANSI.RESET}`;
  // Visible char counts (for centering math)
  const yesVisLen = yesPrefix.length + yesText.length;
  const noVisLen = noPrefix.length + noText.length;
  const buttonRow = `${yesBtn}    ${noBtn}`;
  const buttonRowVisLen = yesVisLen + 4 + noVisLen;
  out.push(clipAndPadToWidth(bodyLine(padCenter(buttonRow, buttonRowVisLen)), w));

  out.push(clipAndPadToWidth(bodyLine(' '.repeat(innerWidth - 2)), w));

  // D5 bottom border
  out.push(clipAndPadToWidth(botBorder, w));

  // Footer hint — updated to reflect arrow-nav
  const hint = '↑/↓/←/→/Tab select · Enter/Space activate · Y approve · N/Esc cancel';
  out.push(clipAndPadToWidth(`${ANSI.DIM}${hint}${ANSI.RESET}`, w));

  return padToHeight(out, h && h > 0 ? h : 24).join('\n');
}

/**
 * Diamond B-26-PEWTER (CD-124 PUCM · Pewter-Uninstall-Confirmation-Modal):
 * Pewter HiFi v3 uninstall confirmation pane · mirrors renderTrustConferPane
 * architecture (D5 closed-box · D7 active-button inversion · arrow-nav).
 * KEY DIFFERENCE: destructive-default-N asymmetry (CD-125 SDDA) — initial
 * cursor lands on Cancel, not Approve. Y is the deliberate confirmation;
 * N is the safe default.
 *
 * No filesystem reads — all content static (Iced-preservation list is
 * structurally fixed per CD-114 IPRM).
 */
export function renderUninstallConfirmPane(state: MenuState): string {
  const uc = state.uninstallConfirm!;
  const w = state.termWidth;
  const h = state.termHeight;

  const PEWTER_RGB = { r: 180, g: 185, b: 190 } as const;
  const PEWTER = rgbToAnsi(PEWTER_RGB, TERMINAL_CAPS);
  const PEWTER_DIM = `${ANSI.DIM}${PEWTER}`;
  const COBALT = rgbToAnsi(SUITE_COLORS.Cobalt, TERMINAL_CAPS); // PRESERVED header
  const ROSE = rgbToAnsi(SUITE_COLORS.Rose, TERMINAL_CAPS); // destructive title + Y-active
  const VIRIDIAN = rgbToAnsi(SUITE_COLORS.Viridian, TERMINAL_CAPS); // yours-already preserve list

  const BORDER_DARK = `${ANSI.DIM}${PEWTER}`;
  const BORDER_LIGHT = `${ANSI.BOLD}${PEWTER}`;
  const innerWidth = Math.max(40, w - 4);
  const horiz = '─'.repeat(Math.max(innerWidth - 2, 8));
  const topBorder = `${BORDER_DARK}┌${horiz}┐${ANSI.RESET}`;
  const botBorder = `${BORDER_LIGHT}└${horiz}┘${ANSI.RESET}`;
  const leftEdge = `${BORDER_LIGHT}│${ANSI.RESET}`;
  const rightEdge = `${BORDER_DARK}│${ANSI.RESET}`;

  const bodyLine = (content: string): string => `${leftEdge}${content}${rightEdge}`;
  const padCenter = (text: string, visibleLen: number): string => {
    const pad = Math.max(0, innerWidth - 2 - visibleLen);
    const left = Math.floor(pad / 2);
    const right = pad - left;
    return ' '.repeat(left) + text + ' '.repeat(right);
  };
  const padLeft = (text: string, visibleLen: number, indent = 2): string => {
    const pad = Math.max(0, innerWidth - 2 - visibleLen - indent);
    return ' '.repeat(indent) + text + ' '.repeat(pad);
  };
  const blank = (): string => bodyLine(' '.repeat(innerWidth - 2));

  const out: string[] = [];

  // Header (outside box · matches trust-confer pane shape)
  out.push(clipAndPadToWidth(`${ANSI.BOLD}SCS Bridge — Uninstall Confirmation${ANSI.RESET}`, w));
  out.push(
    clipAndPadToWidth(
      `${ANSI.DIM}Destructive operation · review what will be removed and preserved${ANSI.RESET}`,
      w,
    ),
  );

  out.push(clipAndPadToWidth(topBorder, w));

  // Title row · Rose-tint (destructive signal)
  const titleText = '⚠  Uninstall SCS Bridge';
  const titleColored = `${ANSI.BOLD}${ROSE}⚠  Uninstall SCS Bridge${ANSI.RESET}`;
  out.push(clipAndPadToWidth(bodyLine(padLeft(titleColored, titleText.length, 2)), w));

  out.push(clipAndPadToWidth(blank(), w));

  // What will be removed
  const removeHeader = 'This will reverse the SCS install:';
  out.push(
    clipAndPadToWidth(
      bodyLine(padLeft(`${PEWTER_DIM}${removeHeader}${ANSI.RESET}`, removeHeader.length, 2)),
      w,
    ),
  );
  const removeBullets = [
    'Restore .claude/CLAUDE.md from PreInstallSnapshot',
    'Remove .claude/agents/scs-*.md + commands/scs-*.md',
    'Remove Cascades/Bridge/ (session-manager state)',
  ];
  for (const b of removeBullets) {
    const text = `· ${b}`;
    const colored = `${PEWTER}${text}${ANSI.RESET}`;
    out.push(clipAndPadToWidth(bodyLine(padLeft(colored, text.length, 4)), w));
  }

  out.push(clipAndPadToWidth(blank(), w));

  // What will be PRESERVED (Cobalt header · Viridian bullets · CD-120 PFND framing)
  const preserveHeader = 'PRESERVED (re-installable from):';
  const preserveColored = `${ANSI.BOLD}${COBALT}${preserveHeader}${ANSI.RESET}`;
  out.push(clipAndPadToWidth(bodyLine(padLeft(preserveColored, preserveHeader.length, 2)), w));
  const preserveBullets = [
    'Cascades/8_SUITES/  (Suite 8 templates)',
    'Cascades/Working/  (your Diamond + Onyx WGBs)',
    'Cascades/Documentation/  (reference docs)',
    'Cascades/Iced/  (PreInstallSnapshot + Manifest + UserSCSConfig)',
  ];
  for (const b of preserveBullets) {
    const text = `· ${b}`;
    const colored = `${VIRIDIAN}${text}${ANSI.RESET}`;
    out.push(clipAndPadToWidth(bodyLine(padLeft(colored, text.length, 4)), w));
  }

  out.push(clipAndPadToWidth(blank(), w));

  // Buttons · CD-125 SDDA: destructive-default-N (initial selected = 'cancel').
  // Active button: ▶ + REVERSE + suite-tinted (Rose for Y · Cobalt for N · note inverted polarity)
  // Inactive: 2-space prefix · dim Pewter
  const isApproveActive = uc.selected === 'approve';
  const yesText = '[Y] Yes, uninstall';
  const noText = '[N] No, cancel';
  const yesPrefix = isApproveActive ? '▶ ' : '  ';
  const noPrefix = !isApproveActive ? '▶ ' : '  ';
  const yesBtn = isApproveActive
    ? `${ANSI.REVERSE}${ANSI.BOLD}${ROSE}${yesPrefix}${yesText}${ANSI.RESET}`
    : `${PEWTER_DIM}${yesPrefix}${yesText}${ANSI.RESET}`;
  const noBtn = !isApproveActive
    ? `${ANSI.REVERSE}${ANSI.BOLD}${COBALT}${noPrefix}${noText}${ANSI.RESET}`
    : `${PEWTER_DIM}${noPrefix}${noText}${ANSI.RESET}`;
  const yesVisLen = yesPrefix.length + yesText.length;
  const noVisLen = noPrefix.length + noText.length;
  const buttonRow = `${yesBtn}    ${noBtn}`;
  const buttonRowVisLen = yesVisLen + 4 + noVisLen;
  out.push(clipAndPadToWidth(bodyLine(padCenter(buttonRow, buttonRowVisLen)), w));

  out.push(clipAndPadToWidth(blank(), w));
  out.push(clipAndPadToWidth(botBorder, w));

  // Footer hint
  const hint = '↑/↓/←/→/Tab select · Enter/Space activate · Y confirm · N/Esc cancel';
  out.push(clipAndPadToWidth(`${ANSI.DIM}${hint}${ANSI.RESET}`, w));

  return padToHeight(out, h && h > 0 ? h : 24).join('\n');
}

/**
 * D-GTC S6 · the exit-confirmation modal pane (compact clone of renderUninstallConfirmPane).
 * "Are you sure you want to exit?" with a Yes/No button row · default = Yes (approve). Rendered
 * full-body when state.exitConfirm is set; the graceful terminal close flushes on confirm.
 */
export function renderExitConfirmPane(state: MenuState): string {
  const ec = state.exitConfirm!;
  const w = state.termWidth;
  const h = state.termHeight;

  const PEWTER = rgbToAnsi({ r: 180, g: 185, b: 190 }, TERMINAL_CAPS);
  const PEWTER_DIM = `${ANSI.DIM}${PEWTER}`;
  const COBALT = rgbToAnsi(SUITE_COLORS.Cobalt, TERMINAL_CAPS);
  const ROSE = rgbToAnsi(SUITE_COLORS.Rose, TERMINAL_CAPS);

  const innerWidth = Math.max(40, w - 4);
  const horiz = '─'.repeat(Math.max(innerWidth - 2, 8));
  const topBorder = `${ANSI.DIM}${PEWTER}┌${horiz}┐${ANSI.RESET}`;
  const botBorder = `${ANSI.BOLD}${PEWTER}└${horiz}┘${ANSI.RESET}`;
  const leftEdge = `${ANSI.BOLD}${PEWTER}│${ANSI.RESET}`;
  const rightEdge = `${ANSI.DIM}${PEWTER}│${ANSI.RESET}`;
  const bodyLine = (content: string): string => `${leftEdge}${content}${rightEdge}`;
  const padCenter = (text: string, visibleLen: number): string => {
    const pad = Math.max(0, innerWidth - 2 - visibleLen);
    const left = Math.floor(pad / 2);
    return ' '.repeat(left) + text + ' '.repeat(pad - left);
  };
  const blank = (): string => bodyLine(' '.repeat(innerWidth - 2));

  const out: string[] = [];
  out.push(clipAndPadToWidth(`${ANSI.BOLD}SCS Bridge — Exit Confirmation${ANSI.RESET}`, w));
  out.push(
    clipAndPadToWidth(
      `${ANSI.DIM}Terminals gracefully flush their Claude Code sessions before exit${ANSI.RESET}`,
      w,
    ),
  );
  out.push(clipAndPadToWidth(topBorder, w));
  out.push(clipAndPadToWidth(blank(), w));
  const q = 'Are you sure you want to exit the SCS Bridge?';
  out.push(clipAndPadToWidth(bodyLine(padCenter(`${ANSI.BOLD}${PEWTER}${q}${ANSI.RESET}`, q.length)), w));
  out.push(clipAndPadToWidth(blank(), w));

  // ── C1020 · THE ORPHAN DISCLAIMER · HiFi Red ──────────────────────────────────────────────────
  // *"Design a Disclaimer in HiFi Red to Inform if the SCS is not Properly Exited there will be
  //   Orphaned Processes. That after Repeated Successive Forced Quits will Require a Computer
  //   Restart to Free Resources."*
  //
  // WHY IT SITS HERE, BETWEEN THE QUESTION AND THE BUTTONS: this pane is the ONLY moment the user
  // is choosing between the proper exit and every other way out. A warning anywhere else is read
  // after the decision, which is no warning at all. It tells the user what THIS button buys them.
  //
  // HiFi Red is the DESIGN SYSTEM's red (`pewter.type.ts` · `red: '#ef4444'`), deliberately NOT a
  // `SUITE_COLORS` entry — those are the internal profession aliases (Maroon, Rose …) and carry a
  // different meaning. This is a functional danger register, not a Suite identity.
  //
  // WIDTH-TIERED SO IT CANNOT CORRUPT THE BOX: `padCenter` computes its padding from `innerWidth`,
  // so a line longer than the box would push the right edge out of alignment. Each tier is sized to
  // the frame it renders in, and the narrow tier still carries BOTH facts — the orphaning and the
  // restart — because a small terminal is not a reason to withhold the consequence.
  const HIFI_RED = rgbToAnsi({ r: 239, g: 68, b: 68 }, TERMINAL_CAPS);
  const disclaimerWidth = innerWidth - 2;
  // `bold` now marks the HEADLINE for meaning, not for weight — every line renders BOLD (see below).
  const disclaimerLines: { text: string; bold: boolean }[] =
    disclaimerWidth >= 70
      ? [
          { text: 'EXITING ANY OTHER WAY LEAVES ORPHANED PROCESSES', bold: true },
          { text: 'Force Quit, or closing the terminal window, skips this teardown —', bold: false },
          { text: 'spawned SCP lanes keep running after the window is gone.', bold: false },
          { text: 'Repeated forced quits accumulate them until only a computer', bold: false },
          { text: 'restart will free the resources they hold.', bold: false },
        ]
      : disclaimerWidth >= 46
        ? [
            { text: 'EXITING ANY OTHER WAY ORPHANS PROCESSES', bold: true },
            { text: 'Force Quit skips this teardown; SCP lanes', bold: false },
            { text: 'keep running. Repeated forced quits need', bold: false },
            { text: 'a computer restart to free resources.', bold: false },
          ]
        : [
            { text: 'FORCE QUIT ORPHANS PROCESSES', bold: true },
            { text: 'Repeated quits need a restart', bold: false },
          ];
  for (const line of disclaimerLines) {
    // BOLD ON EVERY LINE — NEVER `ANSI.DIM`. Field report: the body lines rendered "near black on a
    // black background" and were effectively invisible. `ANSI.DIM` halves the luminance of an
    // already-dark red, and on a dark terminal theme that lands at the background. A danger notice
    // that cannot be read is worse than no notice, because it looks like it was delivered.
    // The colour itself was never the problem — `rgbToAnsi` emits truecolor #ef4444, or a 256-colour
    // index, neither of which is dark. The weight attribute was doing all the damage.
    const weight = ANSI.BOLD;
    out.push(
      clipAndPadToWidth(
        bodyLine(padCenter(`${weight}${HIFI_RED}${line.text}${ANSI.RESET}`, line.text.length)),
        w,
      ),
    );
  }
  out.push(clipAndPadToWidth(blank(), w));

  const isApprove = ec.selected === 'approve';
  const yesText = '[Y] Yes, exit';
  const noText = '[N] No, stay';
  const yesPrefix = isApprove ? '▶ ' : '  ';
  const noPrefix = !isApprove ? '▶ ' : '  ';
  const yesBtn = isApprove
    ? `${ANSI.REVERSE}${ANSI.BOLD}${ROSE}${yesPrefix}${yesText}${ANSI.RESET}`
    : `${PEWTER_DIM}${yesPrefix}${yesText}${ANSI.RESET}`;
  const noBtn = !isApprove
    ? `${ANSI.REVERSE}${ANSI.BOLD}${COBALT}${noPrefix}${noText}${ANSI.RESET}`
    : `${PEWTER_DIM}${noPrefix}${noText}${ANSI.RESET}`;
  const buttonRow = `${yesBtn}    ${noBtn}`;
  const buttonRowVisLen = yesPrefix.length + yesText.length + 4 + noPrefix.length + noText.length;
  out.push(clipAndPadToWidth(bodyLine(padCenter(buttonRow, buttonRowVisLen)), w));
  out.push(clipAndPadToWidth(blank(), w));
  out.push(clipAndPadToWidth(botBorder, w));
  const hint = '←/→/Tab select · Enter = act · Y exit · N/Esc cancel · ^C again = quit';
  out.push(clipAndPadToWidth(`${ANSI.DIM}${hint}${ANSI.RESET}`, w));
  return padToHeight(out, h && h > 0 ? h : 24).join('\n');
}

/**
 * Format the body page rows. Pads with empty strings to visibleBodySlots
 * (OQ-8 confirmed). Each session row computes its 2-state derivation from registry
 * (Diamond I Pattern 4 structural law).
 */
export function formatBodyPage(
  pageSessions: RegistryEntry[],
  selectedUlid: MenuRowId | null,
  termWidth: number,
  visibleBodySlots: number,
  _nowMs: number = Date.now(),
): string[] {
  const out: string[] = [];
  for (const session of pageSessions) {
    const isSelected = session.id === selectedUlid;
    out.push(
      formatSessionRow(
        { kind: 'session', entry: session, state: deriveSessionState(session) },
        isSelected,
        termWidth,
      ),
    );
  }
  // Diamond P Fix P-3: pad-to-clear. Replace empty-string pad with full-width
  // spaces so vacated body slots (after page-jump to a shorter page or after a
  // session row drops out of view) overwrite every character position from the
  // prior frame. Empty-string pad let ghost characters persist; full-width
  // spaces clear all terminal columns. Composes with CD-9 cursor reconciliation.
  const padBlank = ' '.repeat(Math.max(termWidth, 80));
  while (out.length < visibleBodySlots) out.push(padBlank);
  return out;
}

// padToHeight — final safety belt. Truncates if oversize; pads with width-aware
// blanks so the full-screen render path also clears stale characters from a
// shrinking content set (Diamond P Fix P-3 / Green Issue 4 — same ghost-character
// vector as formatBodyPage). Width unknown here — use 80-col safe lower bound.
export function padToHeight(content: string[], height: number): string[] {
  const out = content.slice(0, height);
  const padBlank = ' '.repeat(80);
  while (out.length < height) out.push(padBlank);
  return out;
}

// ── Keypress Handler (Diamond H Page-Jump + Page-Bounded) ─────────────────

/**
 * Reset cursor across page-jump per OQ-3 and OQ-7:
 *   - HEAD/TAIL stays on HEAD/TAIL
 *   - else → first body row of new page (or HEAD if new page empty)
 */
function resetCursorOnPageJump(
  oldSelectedUlid: MenuRowId | null,
  newPageSessions: RegistryEntry[],
): MenuRowId {
  if (oldSelectedUlid === SYNTHETIC_NEW || oldSelectedUlid === SYNTHETIC_CLOSE) {
    return oldSelectedUlid;
  }
  return newPageSessions[0]?.id ?? SYNTHETIC_NEW;
}

export function applyKeypress(
  state: MenuState,
  key: KeypressInput,
): { newState: MenuState; action: KeyAction } {
  if (key.ctrl && key.name === 'c') {
    // D-GTC S6b · Ctrl-C no longer hard-exits on the first press. The FIRST Ctrl-C OPENS the
    // exit-confirm popup (the same Yes/No menu as q/Escape · default Yes → Enter confirms). A
    // SECOND Ctrl-C while the popup is already open is the double-tap quick-quit escape hatch.
    if (state.exitConfirm !== undefined) {
      return { newState: state, action: { type: 'exit-confirm' } };
    }
    return {
      newState: { ...state, exitConfirm: { selected: 'approve' } },
      action: { type: 'exit-confirm-open' },
    };
  }

  // Compute pagination context (used by most cases below).
  // B7-R3-Fix (Issue 2 · M71 CSRP): align with renderMenu line 1740-1741 ·
  // installRowPresent shrinks body by one slot when cascadesPresent is defined.
  // Pre-fix used RESERVED_LINES (6) unconditionally; renderMenu uses 7 when
  // installRowPresent. Mismatch created one phantom body slot in cursor math.
  const installRowPresent = state.cascadesPresent !== undefined;
  // Cycle 144 MRSC (Menu-Row-Single-Conditional) · revert MEXP coexistence to
  // single-position mutual-exclusion. When CSPMSR-true · Engage row REPLACES
  // Install SCP row at the same slot (Install Another accessible via SCP Menu
  // sub-route). Install-area always contributes exactly 1 row · no +engage math.
  const engageRowPresent = state.anyScpsInstalled === true;
  // SCPGATE WSRM: Install-SCP row visible only when the SCS substrate install is
  // resolved (matches the renderMenu/renderMenuLegacy emission gate exactly).
  const installScpRowPresent =
    state.anyScpsInstalled !== true &&
    state.cascadesPresent === true &&
    state.installationComplete !== false;
  const reservedLinesApply =
    (installRowPresent ? RESERVED_LINES_WITH_INSTALL : RESERVED_LINES);
  const visibleBodySlots = Math.max(
    1,
    state.termHeight && state.termHeight >= MIN_TERM_HEIGHT ? state.termHeight - reservedLinesApply : 1,
  );
  // Diamond I: registry IS the source of truth (liveness.ts sweeps dead/stale).
  // SS-P2 · SCFC filter: when activeScpFilter set, restrict to sessions whose
  // scpName matches. Backward-compatible — undefined filter passes through
  // state.sessions unchanged. Filter operates on the sort source so pagination
  // + cursor reconciliation see only the filtered set (no ghost rows).
  const sessionsScoped = state.activeScpFilter
    ? state.sessions.filter((s) => s.scpName === state.activeScpFilter)
    : state.sessions;
  const sorted = [...sessionsScoped].sort((a, b) => b.spawnedAt - a.spawnedAt);
  const totalPages = Math.max(1, Math.ceil(sorted.length / visibleBodySlots));
  const currentPage = clampCurrentPage(state.currentPage ?? 0, totalPages);
  const pageSessions = getBodyPageSessions(sorted, currentPage, visibleBodySlots);

  // Diamond Q: rename mode early-return branch. When renameMode is active, ALL
  // keypresses route through this branch — Enter commits, Esc cancels, Backspace
  // trims buffer, printable chars append (capped at 32). Anything else is noop.
  // Existing switch cases (n, q, x, r, navigation) MUST NOT fire during rename.
  if (state.renameMode !== undefined) {
    if (key.name === 'return') {
      return { newState: state, action: { type: 'rename-confirm' } };
    }
    if (key.name === 'escape') {
      return { newState: state, action: { type: 'rename-cancel' } };
    }
    if (key.name === 'backspace') {
      const newBuffer = state.renameMode.buffer.slice(0, -1);
      return {
        newState: { ...state, renameMode: { ...state.renameMode, buffer: newBuffer } },
        action: { type: 'rename-buffer-update', buffer: newBuffer },
      };
    }
    if (key.sequence && /^[\x20-\x7E]$/.test(key.sequence)) {
      const newBuffer = (state.renameMode.buffer + key.sequence).slice(0, 32);
      return {
        newState: { ...state, renameMode: { ...state.renameMode, buffer: newBuffer } },
        action: { type: 'rename-buffer-update', buffer: newBuffer },
      };
    }
    return { newState: state, action: { type: 'noop' } };
  }

  // C1104 · ruling A · the model-pick modal early-return branch. Mirrors renameMode:
  // while active ALL keypresses route here — ↑/↓ move the cursor within
  // AVAILABLE_MODELS, Enter commits the row under it, Esc cancels, anything else
  // noops. The standard switch (n, q, x, r, m, navigation) MUST NOT fire meanwhile.
  if (state.modelPickMode !== undefined) {
    const count = AVAILABLE_MODELS.length;
    if (key.name === 'return') {
      const picked = AVAILABLE_MODELS[state.modelPickMode.index];
      if (!picked) return { newState: state, action: { type: 'set-model-cancel' } };
      return { newState: state, action: { type: 'set-model-pick', model: picked.id } };
    }
    if (key.name === 'escape') {
      return { newState: state, action: { type: 'set-model-cancel' } };
    }
    if (key.name === 'up' || key.name === 'down') {
      if (count === 0) return { newState: state, action: { type: 'noop' } };
      const delta = key.name === 'up' ? -1 : 1;
      const index = (state.modelPickMode.index + delta + count) % count;
      return {
        newState: { ...state, modelPickMode: { ...state.modelPickMode, index } },
        action: { type: 'set-model-move', index },
      };
    }
    return { newState: state, action: { type: 'noop' } };
  }

  // Epoch Extension · Macro AV · AVMS modal early-return.
  // R4 GUARD (CRITICAL · S4 Angle 8 / Risk R4): while archiveView is defined, EVERY
  // key is handled exclusively within this branch. The final fallthrough returns
  // { type: 'noop' } unconditionally — keys 'a' (archive-selected), 'd'
  // (dissipate-selected), 'n' (spawn-new), 'x' (remove-selected), 'r' (re-bound to
  // refresh here) and ALL others CANNOT reach the main switch and therefore CANNOT
  // fire live-session mutations. Read-only surface (S3 Design Commitment).
  if (state.archiveView !== undefined) {
    const av = state.archiveView;

    // Esc: two-level chain (S3 §Two-phase Esc).
    if (key.name === 'escape') {
      if (av.detail !== null) {
        // Level 1: close detail, return to list (archiveView slot intact).
        return {
          newState: { ...state, archiveView: { ...av, detail: null } },
          action: { type: 'archive-view-detail-clear' },
        };
      }
      // Level 2: close the archive screen entirely.
      return {
        newState: { ...state, archiveView: undefined },
        action: { type: 'close-archive-view' },
      };
    }

    // Up/'k': cursor up, clamp at 0.
    if (key.name === 'up' || key.name === 'k') {
      const next = Math.max(0, av.selectedIdx - 1);
      return {
        newState: { ...state, archiveView: { ...av, selectedIdx: next } },
        action: { type: 'archive-view-cursor-up' },
      };
    }

    // Down/'j': cursor down, clamp at entries.length - 1.
    if (key.name === 'down' || key.name === 'j') {
      const next = Math.min(Math.max(0, av.entries.length - 1), av.selectedIdx + 1);
      return {
        newState: { ...state, archiveView: { ...av, selectedIdx: next } },
        action: { type: 'archive-view-cursor-down' },
      };
    }

    // Enter: load detail for the selected row (only when a row exists and not
    // already loading — prevents double-fire while an async read is in flight).
    if (key.name === 'return') {
      const entry = av.entries[av.selectedIdx];
      if (entry !== undefined && av.detail !== 'loading') {
        return {
          newState: { ...state, archiveView: { ...av, detail: 'loading' } },
          action: { type: 'archive-view-detail-load', id: entry.id },
        };
      }
      return { newState: state, action: { type: 'noop' } };
    }

    // 'r'/'R': refresh — re-emit open-archive-view so animatedTui calls
    // buildArchiveManifest() again and replaces entries in place (S4 A3-1).
    if (key.sequence === 'r' || key.sequence === 'R') {
      return {
        newState: state,
        action: { type: 'open-archive-view' },
      };
    }

    // ALL other keys: absorb. This is the R4 noop-all-unhandled invariant.
    // 'a' (archive-selected), 'd' (dissipate-selected), 'n' (spawn-new),
    // 'x' (remove-selected), 'w' (would re-open), page keys, etc. — all silenced.
    return { newState: state, action: { type: 'noop' } };
  }

  // MD-ARC+C · Wave 5a (MD-ARC-R3-BLUEPRINT §5.2): SCP Archive confirm modal
  // early-return. Direct-key (no arrow-nav · destructive default-N). [Y] confirms
  // the base archive; [F] confirms the WAPF Path-B force-archive (only meaningful
  // when worktreeInstances is present); [N]/Esc cancels. The animatedTui handler
  // AWAITs archiveScpEntry directly (the guard reasons surface inline via notice).
  // Placed BEFORE the scpSubMenu branch — the modal sits ON TOP of the sub-menu.
  if (state.scpArchiveConfirm !== undefined) {
    const ac = state.scpArchiveConfirm;
    const hasWorktrees = (ac.worktreeInstances?.length ?? 0) > 0;
    if (key.name === 'escape' || key.sequence === 'n' || key.sequence === 'N') {
      return { newState: state, action: { type: 'scp-menu-archive-cancel' } };
    }
    if (!hasWorktrees && (key.sequence === 'y' || key.sequence === 'Y')) {
      return { newState: state, action: { type: 'scp-menu-archive-execute', scpName: ac.name } };
    }
    if (hasWorktrees && (key.sequence === 'f' || key.sequence === 'F')) {
      return {
        newState: state,
        action: { type: 'scp-menu-archive-execute', scpName: ac.name, force: true },
      };
    }
    return { newState: state, action: { type: 'noop' } };
  }

  // Diamond β RM-Asp-2: SCP sub-menu modal early-return. When scpSubMenu is
  // active, Up/Down navigate within sub-menu items (incl. "Install Another"
  // appended as last entry), Enter activates, Esc closes.
  if (state.scpSubMenu !== undefined) {
    // MD-ARC+C · Wave 5a — when the Archived fold is expanded, its rows join the
    // navigable list at [items.length+1 .. +archivedCount]; total extends so the
    // cursor can reach them ([R] reinstates the selected archived row).
    const archivedCount =
      state.scpSubMenu.showArchived === true ? (state.scpSubMenu.archivedItems?.length ?? 0) : 0;
    const total = state.scpSubMenu.items.length + 1 + archivedCount; // +1 for "Install Another"
    if (key.name === 'escape') {
      // SS-P2 · SCFC clear: Esc back-to-main also clears any active filter.
      // Pure-reducer parity with animatedTui close-scp-menu handler so tests
      // calling applyKeypress directly observe the cleared state.
      return {
        newState: { ...state, activeScpFilter: undefined },
        action: { type: 'close-scp-menu' },
      };
    }
    if (key.name === 'up' || key.name === 'k') {
      const next = Math.max(0, state.scpSubMenu.selectedIdx - 1);
      return {
        newState: { ...state, scpSubMenu: { ...state.scpSubMenu, selectedIdx: next } },
        action: { type: 'scp-menu-cursor-up' },
      };
    }
    if (key.name === 'down' || key.name === 'j') {
      const next = Math.min(total - 1, state.scpSubMenu.selectedIdx + 1);
      return {
        newState: { ...state, scpSubMenu: { ...state.scpSubMenu, selectedIdx: next } },
        action: { type: 'scp-menu-cursor-down' },
      };
    }
    if (key.name === 'return') {
      // SS-P2 · SCFC pure-reducer state update: real SCP row → set filter +
      // close sub-menu; Install Another row → clear filter + close sub-menu
      // (animatedTui scp-menu-activate handler also opens scpWizard for the
      // Install Another branch — pure reducer leaves wizard open to animatedTui).
      const sel = state.scpSubMenu.selectedIdx;
      const installIdx = state.scpSubMenu.items.length;
      if (sel < installIdx) {
        const target = state.scpSubMenu.items[sel];
        return {
          newState: {
            ...state,
            scpSubMenu: undefined,
            activeScpFilter: target?.name,
          },
          // ALHOC M130 double-bind · scpName carried on action so animatedTui
          // handler can launchScpRuntime(action.scpName) without depending on
          // the now-cleared scpSubMenu state. Cycle 148 R7 diagnosis.
          action: { type: 'scp-menu-activate', scpName: target?.name },
        };
      }
      return {
        newState: { ...state, activeScpFilter: undefined },
        action: { type: 'scp-menu-activate' },
      };
    }
    // SB-Final: [L] launch SCP runtime — emit BSBRE via animatedTui handler.
    // Only fires when cursor is on a non-Install row (an installed SCP).
    if (key.sequence === 'l' || key.sequence === 'L') {
      const sel = state.scpSubMenu.selectedIdx;
      const installIdx = state.scpSubMenu.items.length;
      if (sel < installIdx) {
        const target = state.scpSubMenu.items[sel];
        return {
          newState: state,
          action: { type: 'launch-scp-runtime', scpName: target.name },
        };
      }
    }
    // MD-ARC+C · Wave 5a (MD-ARC-R3-BLUEPRINT §5.1) — [X] close (stop) a live SCP.
    // Only on a real installed row (< installIdx). Dispatches scsBridgeStopScp.
    if (key.sequence === 'x' || key.sequence === 'X') {
      const sel = state.scpSubMenu.selectedIdx;
      const installIdx = state.scpSubMenu.items.length;
      if (sel < installIdx) {
        const target = state.scpSubMenu.items[sel];
        return { newState: state, action: { type: 'scp-menu-stop', scpName: target.name } };
      }
    }
    // MD-ARC+C · Wave 5a (§5.2) — [A] open the Archive confirm modal for the row.
    if (key.sequence === 'a' || key.sequence === 'A') {
      const sel = state.scpSubMenu.selectedIdx;
      const installIdx = state.scpSubMenu.items.length;
      if (sel < installIdx) {
        const target = state.scpSubMenu.items[sel];
        return {
          newState: { ...state, scpArchiveConfirm: { name: target.name } },
          action: { type: 'scp-menu-archive-confirm', scpName: target.name },
        };
      }
    }
    // MD-ARC+C · Wave 5a (§5.3) — [T] toggle the Archived fold (expand/collapse).
    // Only meaningful when the fold is non-empty. Collapsing snaps a cursor that
    // was parked on an archived row back to the "Install Another" row.
    if (key.sequence === 't' || key.sequence === 'T') {
      if ((state.scpSubMenu.archivedItems?.length ?? 0) > 0) {
        const nextShow = !state.scpSubMenu.showArchived;
        const installIdx = state.scpSubMenu.items.length;
        const clampedIdx = nextShow
          ? state.scpSubMenu.selectedIdx
          : Math.min(state.scpSubMenu.selectedIdx, installIdx);
        return {
          newState: {
            ...state,
            scpSubMenu: { ...state.scpSubMenu, showArchived: nextShow, selectedIdx: clampedIdx },
          },
          action: { type: 'scp-menu-toggle-archived' },
        };
      }
    }
    // MD-ARC+C · Wave 5a (§5.3) — [R] reinstate the SELECTED archived row. Only
    // when the fold is expanded AND the cursor is on an archived row
    // ([items.length+1 .. +N]). Dispatches reinstateScpEntry via animatedTui.
    if (key.sequence === 'r' || key.sequence === 'R') {
      const archivedItems = state.scpSubMenu.archivedItems ?? [];
      if (state.scpSubMenu.showArchived === true && archivedItems.length > 0) {
        const archivedBase = state.scpSubMenu.items.length + 1;
        const archivedOffset = state.scpSubMenu.selectedIdx - archivedBase;
        if (archivedOffset >= 0 && archivedOffset < archivedItems.length) {
          const target = archivedItems[archivedOffset];
          return { newState: state, action: { type: 'scp-menu-reinstate', scpName: target.name } };
        }
      }
    }
    return { newState: state, action: { type: 'noop' } };
  }

  // RM-D2 (SIWSMMS): SCP install wizard modal early-return. When scpWizard is
  // active ALL keypresses route through this branch — Enter submits the current
  // step's buffer via applyWizardInput (RM-D1 reducer), Esc cancels the wizard,
  // Backspace trims, printable chars append (32-char cap mirrors renameMode).
  // Mirrors renameMode pattern exactly · different state slot · different reducer.
  if (state.scpWizard !== undefined) {
    // SCPGATE FBSN: first-run consent note keypress. Enter → consume + proceed to
    // the SCP wizard (designation). Esc → dismiss (backup path remains via menu).
    // Placed BEFORE the generic escape/return catches so the note's keys route to
    // the note-specific consume/dismiss actions (not install-scp-cancel/submit).
    if (state.scpWizard.state.step === 'agent-install-note') {
      if (key.name === 'return') {
        return {
          newState: {
            ...state,
            scpWizard: { state: { ...state.scpWizard.state, step: 'designation' }, inputBuffer: '' },
            scpInstallAgentNoteShown: true,
          },
          action: { type: 'scp-note-consume-proceed' },
        };
      }
      if (key.name === 'escape') {
        return {
          newState: { ...state, scpWizard: undefined, scpInstallAgentNoteShown: true },
          action: { type: 'scp-note-dismiss' },
        };
      }
      return { newState: state, action: { type: 'noop' } };
    }
    if (key.name === 'escape') {
      return { newState: state, action: { type: 'install-scp-cancel' } };
    }
    // Issue #643 Half B · Refinement 3+4 (SCBN): the confirm-* steps are driven
    // by a [ Yes ] [ No ] / [ Yes ] [ Re-enter ] button pair (UI over the y/n/r
    // applyWizardInput reducer). ←/→/↑/↓/Tab toggle buttonSelection; Enter
    // activates the selected button by feeding the equivalent char to the
    // reducer (affirm→y · deny→n · deny on confirm-concept-name→r). Raw y/n/r
    // keys remain as accelerators (the printable-char branch below appends them,
    // and the existing submit path passes the typed char straight through).
    const wizStep = state.scpWizard.state.step;
    const isConfirmStep =
      wizStep === 'confirm-concept-name' ||
      wizStep === 'confirm-path' ||
      wizStep === 'confirm-launch';
    if (isConfirmStep) {
      // ←/→/↑/↓/Tab toggle the active button (mirrors trust-confer CD-72 TCANC).
      if (
        key.name === 'left' ||
        key.name === 'right' ||
        key.name === 'up' ||
        key.name === 'down' ||
        key.name === 'tab'
      ) {
        const nextSel: 'affirm' | 'deny' =
          state.scpWizard.state.buttonSelection === 'deny' ? 'affirm' : 'deny';
        return {
          newState: {
            ...state,
            scpWizard: {
              ...state.scpWizard,
              state: { ...state.scpWizard.state, buttonSelection: nextSel },
            },
          },
          action: { type: 'install-scp-wizard-button-toggle' },
        };
      }
      // Enter activates the selected button. Resolve the equivalent reducer char
      // and stage it in inputBuffer so the install-scp-wizard-submit handler
      // feeds it to applyWizardInput unchanged. 'deny' → 'r' on confirm-concept-
      // name (its "No" = re-enter), else 'n'. 'affirm' → 'y'.
      if (key.name === 'return' || key.sequence === ' ' || key.name === 'space') {
        const sel = state.scpWizard.state.buttonSelection ?? 'affirm';
        const submitChar =
          sel === 'affirm'
            ? 'y'
            : wizStep === 'confirm-concept-name'
              ? 'r'
              : 'n';
        return {
          newState: {
            ...state,
            scpWizard: { ...state.scpWizard, inputBuffer: submitChar },
          },
          action: { type: 'install-scp-wizard-submit' },
        };
      }
    }
    // Generic Enter-submit is for the 'designation' text-input step ONLY. The
    // confirm-* steps (button block above) and boot-recommend (handler below)
    // own their Enter/Space activation; gating here keeps this catch-all from
    // swallowing Enter on boot-recommend (which then fell through to a no-op
    // submit while Space reached the boot-recommend handler — Enter/Space parity
    // bug). 'done' carries its own [B] handler; no generic submit is needed.
    if (key.name === 'return' && state.scpWizard.state.step === 'designation') {
      return { newState: state, action: { type: 'install-scp-wizard-submit' } };
    }
    if (key.name === 'backspace') {
      const newBuffer = state.scpWizard.inputBuffer.slice(0, -1);
      return {
        newState: { ...state, scpWizard: { ...state.scpWizard, inputBuffer: newBuffer } },
        action: { type: 'install-scp-wizard-buffer-update', buffer: newBuffer },
      };
    }
    // SCP-3 · BSSPS · [B] Engage via SCS-Bridge shortcut at wizard done step.
    // Placed BEFORE the printable-char buffer-update branch (which would
    // otherwise consume 'b' as buffer input · see existing test
    // 'hotkeys (i, u, n, etc.) do NOT fire while wizard active'). The
    // step === 'done' guard ensures this ONLY fires when buffer typing is
    // structurally over (designation is locked in derivation.designation).
    if (
      (key.sequence === 'b' || key.sequence === 'B') &&
      state.scpWizard.state.step === 'done' &&
      state.scpWizard.state.derivation?.designation
    ) {
      const scpName = state.scpWizard.state.derivation.designation;
      return {
        newState: { ...state, scpWizard: undefined, anyScpsInstalled: true },
        action: { type: 'engage-via-bridge', scpName },
      };
    }
    // PIBR (Post-Install-Boot-Recommendation): keypress handler for the
    // boot-recommend step. Issue #643 Half B · Refinement 3+4 (SCBN): now driven
    // by the SAME [ Launch ] [ Later ] button pair as the confirm-* steps so all
    // four screens behave identically (extends the prior divergent Y/Enter/N/Esc
    // hotkey path). ←/→/↑/↓/Tab toggle buttonSelection; Enter/Space activate the
    // selected button (affirm → engage-via-bridge · deny → return to menu). Y/N/
    // Esc remain as direct accelerators. Placed BEFORE the printable-char branch.
    if (state.scpWizard.state.step === 'boot-recommend') {
      const scpName = state.scpWizard.state.derivation?.designation ?? '';
      // ←/→/↑/↓/Tab toggle the active button.
      if (
        key.name === 'left' ||
        key.name === 'right' ||
        key.name === 'up' ||
        key.name === 'down' ||
        key.name === 'tab'
      ) {
        const nextSel: 'affirm' | 'deny' =
          state.scpWizard.state.buttonSelection === 'deny' ? 'affirm' : 'deny';
        return {
          newState: {
            ...state,
            scpWizard: {
              ...state.scpWizard,
              state: { ...state.scpWizard.state, buttonSelection: nextSel },
            },
          },
          action: { type: 'install-scp-wizard-button-toggle' },
        };
      }
      // Enter/Space activate the selected button · Y is the affirm accelerator.
      if (
        key.name === 'return' ||
        key.sequence === ' ' ||
        key.name === 'space' ||
        key.sequence === 'y' ||
        key.sequence === 'Y'
      ) {
        const sel = state.scpWizard.state.buttonSelection ?? 'affirm';
        // Y/y always affirms regardless of selection (direct accelerator);
        // Enter/Space activate whichever button is currently selected.
        const affirm =
          key.sequence === 'y' || key.sequence === 'Y' ? true : sel === 'affirm';
        if (affirm) {
          return {
            newState: { ...state, scpWizard: undefined, anyScpsInstalled: true },
            action: { type: 'engage-via-bridge', scpName },
          };
        }
        return {
          newState: { ...state, scpWizard: undefined },
          action: { type: 'install-scp-cancel' },
        };
      }
      // N/Esc direct accelerators · return to menu without dispatch.
      if (key.name === 'escape' || key.sequence === 'n' || key.sequence === 'N') {
        return {
          newState: { ...state, scpWizard: undefined },
          action: { type: 'install-scp-cancel' },
        };
      }
      return { newState: state, action: { type: 'noop' } };
    }
    if (key.sequence && /^[\x20-\x7E]$/.test(key.sequence)) {
      const newBuffer = (state.scpWizard.inputBuffer + key.sequence).slice(0, 32);
      return {
        newState: { ...state, scpWizard: { ...state.scpWizard, inputBuffer: newBuffer } },
        action: { type: 'install-scp-wizard-buffer-update', buffer: newBuffer },
      };
    }
    return { newState: state, action: { type: 'noop' } };
  }

  // Diamond B-8 Fix 3 (HWMTUC-SURFACE): trust-confer modal early-return.
  // When trustConfer is active ALL keypresses route through this branch.
  // Pipeline blocked until explicit confirmation.
  // Diamond B-22 (CD-72 TCANC): arrow keys + Tab toggle selected approve/cancel;
  // Enter/Space activate the currently-selected button. Y/N/Esc remain as direct
  // shortcuts (B-8 backward compat).
  if (state.trustConfer !== undefined) {
    // Direct shortcuts (B-8 compat): Y always confirms, N/Esc always decline
    if (key.sequence === 'y' || key.sequence === 'Y') {
      return { newState: state, action: { type: 'trust-confer-confirm' } };
    }
    if (key.name === 'escape' || key.sequence === 'n' || key.sequence === 'N') {
      return { newState: state, action: { type: 'trust-confer-decline' } };
    }
    // Diamond B-22 (CD-72 TCANC): arrow/Tab toggle selected button
    if (
      key.name === 'left' ||
      key.name === 'right' ||
      key.name === 'up' ||
      key.name === 'down' ||
      key.name === 'tab'
    ) {
      const next: 'approve' | 'cancel' =
        state.trustConfer.selected === 'approve' ? 'cancel' : 'approve';
      return {
        newState: { ...state, trustConfer: { ...state.trustConfer, selected: next } },
        action: { type: 'trust-confer-toggle' },
      };
    }
    // Diamond B-22 (CD-72 TCANC): Enter/Space activate selected button
    if (key.name === 'return' || key.sequence === ' ' || key.name === 'space') {
      return { newState: state, action: { type: 'trust-confer-activate' } };
    }
    return { newState: state, action: { type: 'noop' } };
  }

  // Diamond B-26-PEWTER (CD-124 PUCM): uninstall confirmation modal early-return.
  // Mirrors trust-confer modal pattern (CD-72 TCANC). All keypresses route here
  // when uninstallConfirm active. Y/Enter confirm · N/Esc cancel · arrows toggle.
  // CD-125 SDDA: initial selected='cancel' (destructive-default-N safety).
  // D-GTC S6 · when exitConfirm active, ALL keys route here (mirrors the uninstallConfirm modal).
  // DEFAULT selected = 'approve' (Yes) so Enter immediately confirms exit. Escape/N cancels ·
  // arrows/→ toggle · Y confirms. The activate/confirm branches leave state intact so the consumer
  // reads .selected before clearing (matches uninstall-confirm-activate).
  if (state.exitConfirm !== undefined) {
    if (key.sequence === 'y' || key.sequence === 'Y') {
      return { newState: state, action: { type: 'exit-confirm' } };
    }
    if (key.name === 'escape' || key.sequence === 'n' || key.sequence === 'N') {
      return { newState: state, action: { type: 'exit-cancel' } };
    }
    if (
      key.name === 'left' ||
      key.name === 'right' ||
      key.name === 'up' ||
      key.name === 'down' ||
      key.name === 'tab'
    ) {
      const next: 'approve' | 'cancel' =
        state.exitConfirm.selected === 'approve' ? 'cancel' : 'approve';
      return {
        newState: { ...state, exitConfirm: { selected: next } },
        action: { type: 'exit-confirm-toggle' },
      };
    }
    if (key.name === 'return' || key.sequence === ' ' || key.name === 'space') {
      return { newState: state, action: { type: 'exit-confirm-activate' } };
    }
    return { newState: state, action: { type: 'noop' } };
  }

  if (state.uninstallConfirm !== undefined) {
    // Direct shortcuts: Y always confirms · N/Esc always cancels
    if (key.sequence === 'y' || key.sequence === 'Y') {
      return { newState: state, action: { type: 'uninstall-confirm' } };
    }
    if (key.name === 'escape' || key.sequence === 'n' || key.sequence === 'N') {
      return { newState: state, action: { type: 'uninstall-cancel' } };
    }
    // Arrow/Tab toggle selected button
    if (
      key.name === 'left' ||
      key.name === 'right' ||
      key.name === 'up' ||
      key.name === 'down' ||
      key.name === 'tab'
    ) {
      const next: 'approve' | 'cancel' =
        state.uninstallConfirm.selected === 'approve' ? 'cancel' : 'approve';
      return {
        newState: { ...state, uninstallConfirm: { selected: next } },
        action: { type: 'uninstall-confirm-toggle' },
      };
    }
    // Enter/Space activate selected button
    if (key.name === 'return' || key.sequence === ' ' || key.name === 'space') {
      return { newState: state, action: { type: 'uninstall-confirm-activate' } };
    }
    return { newState: state, action: { type: 'noop' } };
  }

  // Diamond B-26-PEWTER (CD-123 UMHV · 'u' hotkey · only effective when cascadesPresent === true).
  // Mirrors existing single-letter hotkey pattern (n/x/r/q). Opens uninstallConfirm
  // modal with default selected='cancel' (CD-125 SDDA safety asymmetry).
  if (key.sequence === 'u' || key.sequence === 'U') {
    if (state.cascadesPresent === true) {
      return {
        newState: { ...state, uninstallConfirm: { selected: 'cancel' } },
        action: { type: 'uninstall-selected' },
      };
    }
    // cascadesPresent !== true: 'u' is no-op (nothing installed)
    return { newState: state, action: { type: 'noop' } };
  }

  // RM-D2 · γ unconditional: 'i' hotkey ALWAYS opens Install SCP wizard.
  // Pipeline handles Cascades/ creation on fresh slate · no precondition.
  // Cycle 142 MEXP (Green C2): conditional on anyScpsInstalled REMOVED.
  // Engage is accessible via cursor + Enter on the dedicated SYNTHETIC_ENGAGE_SCP
  // row when CSPMSR-true. 'i' retains its mnemonic semantic ("install") and avoids
  // the LAAD-class read-from-stale-state-slot risk that the conditional carried.
  if (key.sequence === 'i' || key.sequence === 'I') {
    return { newState: state, action: { type: 'install-scp-selected' } };
  }

  // GITM-PROGINSTALL: 'p' hotkey — programmatic (non-interactive) SCP install.
  // Mirrors the 'i' hotkey's unconditional emission (the live install-scp-selected
  // entry carries NO installationComplete/cascadesPresent precondition; the pipeline
  // handles fresh-slate Cascades/ creation). The animatedTui handler derives the
  // designation from path.basename(process.cwd()), and falls back to the interactive
  // wizard when that basename cannot normalize to a valid designation.
  if (key.sequence === 'p' || key.sequence === 'P') {
    return { newState: state, action: { type: 'install-scp-programmatic' } };
  }

  // Epoch Extension · Macro AV · 'w'/'W' opens the archive view screen.
  // Mirrors the 'u'/'U' and 'i'/'I' pre-switch guards above. Reaches here only
  // when NO modal early-return fired ('v' is CLAIMED — boot overlay; 'w' is free
  // per S1 Card 3.4 / S4 Angle 5). animatedTui's open-archive-view handler calls
  // buildArchiveManifest() async and populates entries; here we just emit the action.
  if (key.sequence === 'w' || key.sequence === 'W') {
    return {
      newState: state,
      action: { type: 'open-archive-view' },
    };
  }

  switch (key.name) {
    // ── Page navigation (Left/Right): currentPage ± 1, cursor preserve ──
    case 'left':
    case 'h':
    case 'pageup':
    case 'b': {
      const newPage = Math.max(0, currentPage - 1);
      if (newPage === currentPage) {
        // No-op at left edge; preserve everything.
        return { newState: { ...state, currentPage }, action: { type: 'page-left' } };
      }
      const newPageSessions = getBodyPageSessions(sorted, newPage, visibleBodySlots);
      const newSelectedUlid = resetCursorOnPageJump(state.selectedUlid, newPageSessions);
      return {
        newState: { ...state, currentPage: newPage, selectedUlid: newSelectedUlid },
        action: { type: 'page-left' },
      };
    }

    case 'right':
    case 'l':
    case 'pagedown':
    case 'f': {
      const newPage = Math.min(totalPages - 1, currentPage + 1);
      if (newPage === currentPage) {
        return { newState: { ...state, currentPage }, action: { type: 'page-right' } };
      }
      const newPageSessions = getBodyPageSessions(sorted, newPage, visibleBodySlots);
      const newSelectedUlid = resetCursorOnPageJump(state.selectedUlid, newPageSessions);
      return {
        newState: { ...state, currentPage: newPage, selectedUlid: newSelectedUlid },
        action: { type: 'page-right' },
      };
    }

    // ── Cursor navigation within page (page-bounded HEAD ↔ body ↔ TAIL) ──
    case 'up':
    case 'k': {
      // Diamond B-1: SYNTHETIC_INSTALL is the top-most row when cascadesPresent === false.
      // Up at SYNTHETIC_INSTALL = no-op (silent top edge), mirroring SYNTHETIC_NEW edge behavior.
      if (state.selectedUlid === SYNTHETIC_INSTALL) {
        return { newState: { ...state, currentPage }, action: { type: 'cursor-up' } };
      }
      // Cycle 142 MEXP: SYNTHETIC_ENGAGE_SCP sits between SYNTHETIC_INSTALL and
      // SYNTHETIC_INSTALL_SCP (only rendered when anyScpsInstalled === true).
      // Up at Engage → SYNTHETIC_INSTALL when cascadesPresent defined; else no-op top edge.
      if (state.selectedUlid === SYNTHETIC_ENGAGE_SCP) {
        if (state.cascadesPresent !== undefined) {
          return {
            newState: { ...state, currentPage, selectedUlid: SYNTHETIC_INSTALL },
            action: { type: 'cursor-up' },
          };
        }
        return { newState: { ...state, currentPage }, action: { type: 'cursor-up' } };
      }

      // FIX-3 (Viridian): empty body → Up at TAIL → HEAD (skip body).
      // Diamond B-25-UX-fix4 (CD-111 IUNSI · Issue B): empty-body branch must
      // also honor SYNTHETIC_NEW → SYNTHETIC_INSTALL promotion when
      // cascadesPresent is defined. Pre-fix the empty-body guard returned
      // SYNTHETIC_NEW unconditionally, intercepting before the promotion
      // logic at line 792 — install row was unreachable from New Session via
      // up-arrow. (Suite 4 Green Issue B audit · paste-ready resolution.)
      if (pageSessions.length === 0) {
        if (state.selectedUlid === SYNTHETIC_CLOSE) {
          return {
            newState: { ...state, currentPage, selectedUlid: SYNTHETIC_NEW },
            action: { type: 'cursor-up' },
          };
        }
        // B7-R3-Fix (M71 CSRP · empty-body): Up at SYNTHETIC_NEW → SYNTHETIC_INSTALL_SCP
        // Cycle 144 RVNG: when CSPMSR-true · INSTALL_SCP is HIDDEN per MRSC ·
        // redirect to ENGAGE_SCP (the visible row in that slot).
        if (state.selectedUlid === SYNTHETIC_NEW) {
          // SCPGATE WSRM: skip the withheld Install-SCP slot — land on the next
          // present row UP (SYNTHETIC_INSTALL when cascadesPresent defined · else
          // top-edge no-op at SYNTHETIC_NEW).
          const upLanding = state.anyScpsInstalled === true
            ? SYNTHETIC_ENGAGE_SCP
            : !installScpRowPresent
              ? (state.cascadesPresent !== undefined ? SYNTHETIC_INSTALL : SYNTHETIC_NEW)
              : SYNTHETIC_INSTALL_SCP;
          return {
            newState: { ...state, currentPage, selectedUlid: upLanding },
            action: { type: 'cursor-up' },
          };
        }
        // Cycle 142 MEXP: Up at SYNTHETIC_INSTALL_SCP → SYNTHETIC_ENGAGE_SCP
        // when anyScpsInstalled (Engage row present); else fall through to
        // SYNTHETIC_INSTALL when cascadesPresent defined; else top edge no-op.
        if (state.selectedUlid === SYNTHETIC_INSTALL_SCP) {
          if (state.anyScpsInstalled === true) {
            return {
              newState: { ...state, currentPage, selectedUlid: SYNTHETIC_ENGAGE_SCP },
              action: { type: 'cursor-up' },
            };
          }
          if (state.cascadesPresent !== undefined) {
            return {
              newState: { ...state, currentPage, selectedUlid: SYNTHETIC_INSTALL },
              action: { type: 'cursor-up' },
            };
          }
        }
        // HEAD (SYNTHETIC_INSTALL_SCP with no cascadesPresent, or top-edge) → no-op
        return {
          newState: { ...state, currentPage, selectedUlid: SYNTHETIC_NEW },
          action: { type: 'cursor-up' },
        };
      }

      if (state.selectedUlid === SYNTHETIC_NEW) {
        // B7-R3-Fix (M71 CSRP): Up at SYNTHETIC_NEW → SYNTHETIC_INSTALL_SCP
        // Cycle 144 RVNG: when CSPMSR-true · redirect to SYNTHETIC_ENGAGE_SCP
        // (Install SCP is hidden per MRSC · Engage takes its slot).
        // SCPGATE WSRM: skip the withheld Install-SCP slot — land on the next
        // present row UP (SYNTHETIC_INSTALL when cascadesPresent defined · else
        // top-edge no-op at SYNTHETIC_NEW).
        const upLanding = state.anyScpsInstalled === true
          ? SYNTHETIC_ENGAGE_SCP
          : !installScpRowPresent
            ? (state.cascadesPresent !== undefined ? SYNTHETIC_INSTALL : SYNTHETIC_NEW)
            : SYNTHETIC_INSTALL_SCP;
        return {
          newState: { ...state, currentPage, selectedUlid: upLanding },
          action: { type: 'cursor-up' },
        };
      }
      // Cycle 142 MEXP: Up at SYNTHETIC_INSTALL_SCP → SYNTHETIC_ENGAGE_SCP when
      // anyScpsInstalled (Engage row above Install row); else original ladder:
      // SYNTHETIC_INSTALL when cascadesPresent defined; else no-op top edge.
      if (state.selectedUlid === SYNTHETIC_INSTALL_SCP) {
        if (state.anyScpsInstalled === true) {
          return {
            newState: { ...state, currentPage, selectedUlid: SYNTHETIC_ENGAGE_SCP },
            action: { type: 'cursor-up' },
          };
        }
        if (state.cascadesPresent !== undefined) {
          return {
            newState: { ...state, currentPage, selectedUlid: SYNTHETIC_INSTALL },
            action: { type: 'cursor-up' },
          };
        }
        // No cascadesPresent: SYNTHETIC_INSTALL_SCP IS the topmost row → no-op top edge.
        return { newState: { ...state, currentPage }, action: { type: 'cursor-up' } };
      }
      if (state.selectedUlid === SYNTHETIC_CLOSE) {
        // TAIL → last body row of current page
        const lastBody = pageSessions[pageSessions.length - 1];
        return {
          newState: { ...state, currentPage, selectedUlid: lastBody.id },
          action: { type: 'cursor-up' },
        };
      }
      const idx = pageSessions.findIndex((s) => s.id === state.selectedUlid);
      if (idx === 0) {
        // first body → HEAD
        return {
          newState: { ...state, currentPage, selectedUlid: SYNTHETIC_NEW },
          action: { type: 'cursor-up' },
        };
      }
      if (idx > 0) {
        return {
          newState: { ...state, currentPage, selectedUlid: pageSessions[idx - 1].id },
          action: { type: 'cursor-up' },
        };
      }
      // selectedUlid not in current page (e.g. just paged in) — reset to HEAD
      return {
        newState: { ...state, currentPage, selectedUlid: SYNTHETIC_NEW },
        action: { type: 'cursor-up' },
      };
    }

    case 'down':
    case 'j': {
      // Cycle 142 MEXP: Down from SYNTHETIC_INSTALL → SYNTHETIC_ENGAGE_SCP when
      // anyScpsInstalled (Engage row present); else fall through to SYNTHETIC_INSTALL_SCP.
      if (state.selectedUlid === SYNTHETIC_INSTALL) {
        if (state.anyScpsInstalled === true) {
          return {
            newState: { ...state, currentPage, selectedUlid: SYNTHETIC_ENGAGE_SCP },
            action: { type: 'cursor-down' },
          };
        }
        // SCPGATE WSRM: skip the withheld Install-SCP slot going down — land on
        // SYNTHETIC_NEW (HEAD), the next present row below the Install row.
        if (!installScpRowPresent) {
          return {
            newState: { ...state, currentPage, selectedUlid: SYNTHETIC_NEW },
            action: { type: 'cursor-down' },
          };
        }
        return {
          newState: { ...state, currentPage, selectedUlid: SYNTHETIC_INSTALL_SCP },
          action: { type: 'cursor-down' },
        };
      }
      // Cycle 144 RVNG: Down from ENGAGE_SCP skips hidden INSTALL_SCP · goes
      // directly to SYNTHETIC_NEW (HEAD). ENGAGE only renders CSPMSR-true ·
      // which means INSTALL_SCP is hidden per MRSC.
      if (state.selectedUlid === SYNTHETIC_ENGAGE_SCP) {
        return {
          newState: { ...state, currentPage, selectedUlid: SYNTHETIC_NEW },
          action: { type: 'cursor-down' },
        };
      }
      // B7-R3-Fix (M71 CSRP): Down from SYNTHETIC_INSTALL_SCP → SYNTHETIC_NEW (HEAD).
      if (state.selectedUlid === SYNTHETIC_INSTALL_SCP) {
        return {
          newState: { ...state, currentPage, selectedUlid: SYNTHETIC_NEW },
          action: { type: 'cursor-down' },
        };
      }

      // FIX-3 (Viridian): empty body → Down at HEAD → TAIL (skip body).
      if (pageSessions.length === 0) {
        if (state.selectedUlid === SYNTHETIC_NEW) {
          return {
            newState: { ...state, currentPage, selectedUlid: SYNTHETIC_CLOSE },
            action: { type: 'cursor-down' },
          };
        }
        // TAIL or anywhere else → TAIL (no-op effective)
        return {
          newState: { ...state, currentPage, selectedUlid: SYNTHETIC_CLOSE },
          action: { type: 'cursor-down' },
        };
      }

      if (state.selectedUlid === SYNTHETIC_CLOSE) {
        // No-op (silent) at bottom edge.
        return { newState: { ...state, currentPage }, action: { type: 'cursor-down' } };
      }
      if (state.selectedUlid === SYNTHETIC_NEW) {
        // HEAD → first body row of current page
        return {
          newState: { ...state, currentPage, selectedUlid: pageSessions[0].id },
          action: { type: 'cursor-down' },
        };
      }
      const idx = pageSessions.findIndex((s) => s.id === state.selectedUlid);
      if (idx === pageSessions.length - 1) {
        // last body → TAIL
        return {
          newState: { ...state, currentPage, selectedUlid: SYNTHETIC_CLOSE },
          action: { type: 'cursor-down' },
        };
      }
      if (idx >= 0) {
        return {
          newState: { ...state, currentPage, selectedUlid: pageSessions[idx + 1].id },
          action: { type: 'cursor-down' },
        };
      }
      // selectedUlid not in current page — reset to TAIL
      return {
        newState: { ...state, currentPage, selectedUlid: SYNTHETIC_CLOSE },
        action: { type: 'cursor-down' },
      };
    }

    // ── Home / End jumps ─────────────────────────────────────────────
    case 'home':
    case 'g': {
      return {
        newState: { ...state, currentPage: 0, selectedUlid: SYNTHETIC_NEW },
        action: { type: 'cursor-home' },
      };
    }

    case 'end':
    case 'G': {
      return {
        newState: { ...state, currentPage: totalPages - 1, selectedUlid: SYNTHETIC_CLOSE },
        action: { type: 'cursor-end' },
      };
    }

    // ── Activation (Enter) — Diamond I: no pre-launch probe; registry is the truth ─
    case 'return': {
      // Diamond B-1 (CD-23): Install sentinel dispatches install-selected. Stub now;
      // full implementation arrives in Diamond B-6.
      if (state.selectedUlid === SYNTHETIC_INSTALL) {
        return { newState: state, action: { type: 'install-selected' } };
      }
      // Diamond α RM-Fix-1: Enter on Install SCP row → install-scp-selected
      // (NOT resume-selected · prevents fallthrough that S4 flagged in Angle H).
      // Cycle 144 RVNG defensive: SYNTHETIC_INSTALL_SCP is HIDDEN per MRSC when
      // CSPMSR-true · cursor should never land here in that state (nav branches
      // redirect to ENGAGE_SCP per Cycle 144 fix). Defensive · if cursor IS on
      // INSTALL_SCP under CSPMSR-true (cursor-preservation edge case · race) ·
      // route to open-scp-manage-menu so user lands on the visible action.
      if (state.selectedUlid === SYNTHETIC_INSTALL_SCP) {
        if (state.anyScpsInstalled === true) {
          return { newState: state, action: { type: 'open-scp-manage-menu' } };
        }
        return { newState: state, action: { type: 'install-scp-selected' } };
      }
      // Cycle 142 MEXP: Enter on Engage row → 'open-scp-manage-menu' (MSCM surface).
      // Row only rendered when anyScpsInstalled === true so presence implies CSPMSR-true;
      // no additional guard needed. LAAD Fix A (action-dispatch sync) ensures the slot
      // is synchronized with latestAnyScpsInstalled by the time this branch is reachable.
      if (state.selectedUlid === SYNTHETIC_ENGAGE_SCP) {
        return { newState: state, action: { type: 'open-scp-manage-menu' } };
      }
      if (state.selectedUlid === SYNTHETIC_NEW) {
        return { newState: state, action: { type: 'spawn-new' } };
      }
      if (state.selectedUlid === SYNTHETIC_CLOSE) {
        // D-GTC S6 · Enter on the CLOSE row now OPENS the exit-confirm modal (default Yes).
        return {
          newState: { ...state, exitConfirm: { selected: 'approve' } },
          action: { type: 'exit-confirm-open' },
        };
      }
      return { newState: state, action: { type: 'resume-selected' } };
    }

    case 'n':
      return { newState: state, action: { type: 'spawn-new' } };
    case 'q':
    case 'escape':
      // D-GTC S6 · q/Escape now OPENS the exit-confirm modal instead of exiting outright
      // (default Yes → Enter confirms · Escape again / Right→No→Enter cancels). Ctrl-C stays
      // the hard-exit bypass (menu.ts applyKeypress head).
      return {
        newState: { ...state, exitConfirm: { selected: 'approve' } },
        action: { type: 'exit-confirm-open' },
      };
    // Diamond N Fix N-D3: user-driven forced eviction escape valve.
    // 'x' on any real ULID row (including auto-discovered synthesized rows)
    // triggers remove-selected → registry filter → JSONL untouched on disk.
    // SYNTHETIC_NEW / SYNTHETIC_CLOSE sentinels are protected.
    case 'x': {
      const ulid = state.selectedUlid;
      if (ulid && ulid !== SYNTHETIC_NEW && ulid !== SYNTHETIC_CLOSE) {
        return { newState: state, action: { type: 'remove-selected' } };
      }
      return { newState: state, action: { type: 'noop' } };
    }
    // Diamond Q: 'r' enters rename mode for the selected real-row (or synthesized
    // 01DISCOVERED-* row). SYNTHETIC_NEW/CLOSE sentinels are protected.
    case 'r': {
      const ulid = state.selectedUlid;
      if (ulid && ulid !== SYNTHETIC_NEW && ulid !== SYNTHETIC_CLOSE) {
        return { newState: state, action: { type: 'rename-selected' } };
      }
      return { newState: state, action: { type: 'noop' } };
    }
    // C1104 · ruling A · 'm' opens the RESUME-model picker for the selected real-row.
    // 'm' was verifiably unbound across the WHOLE handler (Lane 7 guard 10 — not just
    // the top-level switch; every modal family was grepped). Sentinels protected.
    case 'm': {
      const ulid = state.selectedUlid;
      if (ulid && ulid !== SYNTHETIC_NEW && ulid !== SYNTHETIC_CLOSE) {
        return { newState: state, action: { type: 'set-model-selected' } };
      }
      return { newState: state, action: { type: 'noop' } };
    }
    // TBHK · Dissolution + Archival Diamond · 'd' dissipate the selected real-row
    // (registry removal + DELETE real ClaudeCode session · anchor-guarded). Bounded
    // to a real ULID row; SYNTHETIC_NEW/CLOSE protected (mirror 'x').
    case 'd': {
      const ulid = state.selectedUlid;
      if (ulid && ulid !== SYNTHETIC_NEW && ulid !== SYNTHETIC_CLOSE) {
        return { newState: state, action: { type: 'dissipate-selected' } };
      }
      return { newState: state, action: { type: 'noop' } };
    }
    // TBHK · 'a' archive the selected real-row (MOVE real session → Cascades/Archive
    // then registry removal · anchor-guarded). Bounded to a real ULID row.
    case 'a': {
      const ulid = state.selectedUlid;
      if (ulid && ulid !== SYNTHETIC_NEW && ulid !== SYNTHETIC_CLOSE) {
        return { newState: state, action: { type: 'archive-selected' } };
      }
      return { newState: state, action: { type: 'noop' } };
    }
    default:
      return { newState: state, action: { type: 'noop' } };
  }
}

// ── Render Path ─────────────────────────────────────────────────

/**
 * renderMenuLegacy — Diamond D/E/F/G render path. Preserved verbatim under the
 * branching renderMenu when termHeight is 0 / undefined. Backward compat for
 * `scs bridge menu` static-menu invocation and pre-G test fixtures.
 */
export function renderMenuLegacy(state: MenuState): string {
  const out: string[] = [];
  out.push(ANSI.HOME + ANSI.CLEAR_SCREEN);

  out.push(
    clipAndPadToWidth(
      `${ANSI.BOLD}SCS Bridge — Persistent Session Menu (v${getBridgeVersion()})${ANSI.RESET}`,
      state.termWidth,
    ),
  );
  // Diamond B-6 (APEX · IRPMS): legacy path install-running indicator.
  const legacyInstallSuffix = state.installRunning
    ? ` · install pid ${state.installRunning.pid}`
    : '';
  out.push(
    clipAndPadToWidth(
      `${ANSI.DIM}${state.sessions.length} session(s) registered${legacyInstallSuffix}${ANSI.RESET}`,
      state.termWidth,
    ),
  );
  out.push('');

  // Diamond B-20 (CD-63 IRULRT · always-visible Install row): row visible
  // whenever cascadesPresent is DEFINED (regardless of value). Pre-B-20 fixtures
  // with `cascadesPresent: undefined` continue to hide the row (backward compat).
  // Label discriminates per cascadesPresent: false → "Install", true → "Reinstall".
  if (state.cascadesPresent !== undefined) {
    out.push(
      clipAndPadToWidth(
        formatInstall(state.selectedUlid === SYNTHETIC_INSTALL, state.cascadesPresent),
        state.termWidth,
      ),
    );
  }

  // Cycle 142 MEXP: Engage row precedes Install row when anyScpsInstalled === true.
  // Routes to 'open-scp-manage-menu' on Enter; opens SM-SCP-MANAGE-style surface.
  if (state.anyScpsInstalled === true) {
    out.push(
      clipAndPadToWidth(
        formatEngageScp(state.selectedUlid === SYNTHETIC_ENGAGE_SCP),
        state.termWidth,
      ),
    );
  }
  // Cycle 144 MRSC: Install SCP row HIDDEN when CSPMSR-true (Engage above
  // takes its slot · Install Another accessible via SCP Menu sub-route).
  // CSPMSR-false: Install SCP visible · Engage not rendered (gated above).
  // Net: install-area always 1 row · either Install SCP OR Open SCP Menu.
  // SCPGATE WSRM: PSRS gate — withhold Install-SCP row until SCS substrate install
  // resolves (verbatim mirror of the renderMenu emission gate).
  if (
    state.anyScpsInstalled !== true &&
    state.cascadesPresent === true &&
    state.installationComplete !== false
  ) {
    out.push(
      clipAndPadToWidth(
        formatInstallScp(state.selectedUlid === SYNTHETIC_INSTALL_SCP),
        state.termWidth,
      ),
    );
  }

  const rows = buildMenuRows(state.sessions);
  const selectedIdx = findIndexByRowId(rows, state.selectedUlid);
  // Diamond R Fix R-2 (legacy parallel): floor 15.
  // D2 Recurse-4 · TPCR (legacy parallel): headroom 92 → 83 (9-char state
  // cell + separator reclaimed). Matches modern formatSessionRow reflow.
  const cwdMaxWidth = Math.max(15, state.termWidth - 83);
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const isSelected = i === selectedIdx;
    const prefix = isSelected ? `${ANSI.REVERSE}→ ` : '  ';
    const suffix = isSelected ? ANSI.RESET : '';
    if (row.kind === 'synthetic-new') {
      out.push(clipAndPadToWidth(`${prefix}⊕ New Session${suffix}`, state.termWidth));
    } else if (row.kind === 'synthetic-close') {
      out.push(clipAndPadToWidth(`${prefix}× Close Bridge${suffix}`, state.termWidth));
    } else if (row.kind === 'synthetic-install') {
      // Diamond B-1: defensive branch — buildMenuRows does not emit synthetic-install
      // (Option B). Reach here only if upstream code injects it; mirror formatInstall shape.
      out.push(clipAndPadToWidth(`${prefix}⊕ Install SCS-Bridge${suffix}`, state.termWidth));
    } else if (row.kind === 'synthetic-install-scp') {
      // RM-D2: defensive branch — Option B (render functions emit directly).
      out.push(clipAndPadToWidth(`${prefix}⊕ Install SCP${suffix}`, state.termWidth));
    } else if (row.kind === 'synthetic-engage-scp') {
      // Cycle 142 MEXP: defensive branch — Option B (render functions emit directly).
      out.push(clipAndPadToWidth(`${prefix}⊕ Engage Installed SCP${suffix}`, state.termWidth));
    } else {
      const s = row.entry;
      const indicator =
        s.status === 'launched'
          ? '●'
          : s.status === 'allocated'
          ? '○'
          : s.status === 'offline'
          ? '⊘'
          : '⊘';
      // Diamond R Fix R-1 (legacy parallel): synthesized → claudeSessionId-short.
      const ulidShort =
        s.synthesizedAt !== undefined ? (s.claudeSessionId ?? '').slice(0, 10) : s.id.slice(0, 10);
      // Diamond Q: User-Sourced Identification Diameter (legacy path).
      // RM-D4 · DPCO · scsLabel > displayName > id-short.
      const nameOrUuid = s.scsLabel
        ? truncateMiddle(s.scsLabel, 16).padEnd(16)
        : s.displayName
        ? truncateMiddle(s.displayName, 16).padEnd(16)
        : (s.claudeSessionId ?? '').slice(0, 8).padEnd(16);
      const status = s.status.padEnd(9);
      // D2 Recurse-4 · TPCR (legacy parallel): derived state column collapsed
      // into single source of truth `status`. Mirror of formatSessionRow.
      // Diamond R Fix R-2 (legacy parallel): padEnd ensures column width.
      const cwdShort = truncateMiddle(basename(s.cwd ?? ''), cwdMaxWidth).padEnd(cwdMaxWidth);
      const launched = relativeTime(s.spawnedAt);
      out.push(
        clipAndPadToWidth(
          `${prefix}${indicator} ${ulidShort}  ${nameOrUuid}  ${status}  ${cwdShort}  ${launched}${suffix}`,
          state.termWidth,
        ),
      );
    }
  }
  out.push('');

  // TRHC Site B · legacy renderMenuLegacy footer · 2-row centered hint.
  // Citation: SUITE-3-YELLOW-UX-REFINEMENT-BLUEPRINT.md §3
  const centerRowLegacy = (text: string, w: number): string => {
    const visible = text.replace(/\x1b\[[0-9;]*m/g, '').length;
    const pad = Math.max(0, Math.floor((w - visible) / 2));
    return ' '.repeat(pad) + text;
  };
  const legacyRow1 = `${ANSI.DIM}↑/↓ navigate · Home/End jump${ANSI.RESET}`;
  const legacyRow2 = `${ANSI.DIM}Enter activate · r rename · q/Esc quit${ANSI.RESET}`;
  out.push(clipAndPadToWidth(centerRowLegacy(legacyRow1, state.termWidth), state.termWidth));
  out.push(clipAndPadToWidth(centerRowLegacy(legacyRow2, state.termWidth), state.termWidth));
  if (state.spawnInFlight) {
    out.push(clipAndPadToWidth(`${ANSI.DIM}Spawning new session...${ANSI.RESET}`, state.termWidth));
  }

  return out.join('\n');
}

/**
 * renderMenu — Head/Body/Tail Pane Composition (SB-S12, Diamond H). Three branches:
 *   1. termHeight 0/undefined → renderMenuLegacy (Diamond D/E/F/G backward compat)
 *   2. termHeight 1..MIN_TERM_HEIGHT-1 → "[terminal too small]" padded
 *   3. termHeight >= MIN_TERM_HEIGHT → header(2) + HEAD(1) + body(termHeight-5) + TAIL(1) + footer(1)
 *
 * Line-count invariant: viewport branch returns exactly state.termHeight lines when
 * joined by '\n' (no trailing newline). Verified by line-count invariant test.
 */
export function renderMenu(state: MenuState): string {
  // Epoch Extension · Macro AV: archive screen pane override. Checked FIRST so the
  // archive screen swallows the entire body (full-replace) ahead of every other modal.
  if (state.archiveView !== undefined) {
    return renderArchiveViewPane(state);
  }
  // Diamond B-26-PEWTER (CD-124 PUCM): uninstall-confirm modal override · same
  // architectural slot as trust-confer · mutually exclusive (only one modal active).
  if (state.uninstallConfirm !== undefined) {
    return renderUninstallConfirmPane(state);
  }
  // D-GTC S6 · exit-confirm modal override (same architectural slot · mutually exclusive).
  if (state.exitConfirm !== undefined) {
    return renderExitConfirmPane(state);
  }
  // Diamond B-8 Fix 3+4 (HWMTUC-SURFACE + HWMTUC): trust-confer pane override.
  // When trustConfer is active, replace body area with Pewter HiFi pane.
  // Composes ahead of legacy/too-small branches so confirmation modal is preserved
  // across resize and renders even on minimal viewports.
  if (state.trustConfer !== undefined) {
    return renderTrustConferPane(state);
  }
  // Diamond α RM-Fix-2: scpWizard pane override · renders 4-step wizard prompt
  // pane when state.scpWizard is active. Mirrors trustConfer override placement.
  if (state.scpWizard !== undefined) {
    return renderScpWizardPane(state);
  }
  // MD-ARC+C · Wave 5a (MD-ARC-R3-BLUEPRINT §5.2): SCP Archive confirm modal
  // override · renders ahead of the sub-menu (the confirm swallows the pane while
  // scpArchiveConfirm is set · mutually exclusive with the other modals).
  if (state.scpArchiveConfirm !== undefined) {
    return renderScpArchiveConfirmPane(state);
  }
  // Diamond β RM-Asp-2: scpSubMenu pane override · lists installed SCPs +
  // "+ Install Another" entry when state.scpSubMenu is active.
  if (state.scpSubMenu !== undefined) {
    return renderScpSubMenuPane(state);
  }
  if (!state.termHeight || state.termHeight === 0) {
    return renderMenuLegacy(state);
  }
  if (state.termHeight < MIN_TERM_HEIGHT) {
    return padToHeight(['[terminal too small for menu]'], state.termHeight).join('\n');
  }
  // Diamond B-1: when Install row is rendered the body shrinks by 1 slot.
  // Diamond B-20 (CD-63 IRULRT): Install row visible whenever cascadesPresent
  // is DEFINED (regardless of value); label discriminates Install vs Reinstall
  // per the flag's value. Pre-B-20 fixtures with `cascadesPresent: undefined`
  // continue to hide the row (backward compat).
  const installRowPresent = state.cascadesPresent !== undefined;
  // Cycle 144 MRSC · revert MEXP +engage math (see applyKeypress block above).
  const engageRowPresent = state.anyScpsInstalled === true;
  const reservedLines =
    (installRowPresent ? RESERVED_LINES_WITH_INSTALL : RESERVED_LINES);
  const visibleBodySlots = state.termHeight - reservedLines;
  // Diamond I: registry IS the source of truth (liveness.ts sweeps dead/stale).
  // SS-P2 · SCFC filter: when activeScpFilter set, restrict to sessions whose
  // scpName matches before sort + pagination. Backward-compatible — undefined
  // filter passes through state.sessions unchanged.
  const sessionsScoped = state.activeScpFilter
    ? state.sessions.filter((s) => s.scpName === state.activeScpFilter)
    : state.sessions;
  const sorted = [...sessionsScoped].sort((a, b) => b.spawnedAt - a.spawnedAt);
  const totalPages = Math.max(1, Math.ceil(sorted.length / Math.max(1, visibleBodySlots)));
  const currentPage = clampCurrentPage(state.currentPage ?? 0, totalPages);
  const pageSessions = getBodyPageSessions(sorted, currentPage, visibleBodySlots);
  const start = currentPage * visibleBodySlots;
  const end = Math.min(start + visibleBodySlots, sorted.length);

  // C720 B2 · append the stale badge (when present) inside the header's BOLD run so it
  // matches the row's existing ANSI style · short marker · empty string = no badge.
  const staleBadge = state.staleMarker ? ` ${state.staleMarker}` : '';
  const headerLine1 = `${ANSI.BOLD}SCS Bridge — Persistent Session Menu (v${getBridgeVersion()})${staleBadge}${
    ANSI.RESET
  }`;
  const spawnSuffix = state.spawnInFlight ? ' · Spawning new session...' : '';
  // Diamond B-6 (APEX · IRPMS): install-running indicator mirrors spawnSuffix shape.
  const installSuffix = state.installRunning ? ` · install pid ${state.installRunning.pid}` : '';
  // SS-P2 · SCFC chip: when activeScpFilter set, replace standard header with
  // "Sessions for SCP: <name> (N active)" where N = count of state.sessions
  // with matching scpName AND status not offline/archived. Chip uses Viridian
  // (SCP-context color) matching renderScpSubMenuPane visual identity.
  const viridian = rgbToAnsi(SUITE_COLORS.Viridian, TERMINAL_CAPS);
  const filterName = state.activeScpFilter;
  const headerLine2 = filterName
    ? `${viridian}Sessions for SCP: ${filterName} (${state.sessions.filter(
        (s) => s.scpName === filterName && s.status !== 'offline' && s.status !== 'archived',
      ).length} active)${ANSI.RESET}${ANSI.DIM} · Page ${currentPage + 1} of ${totalPages}${
        sorted.length > 0 ? ` · rows ${start + 1}-${end}` : ''
      }${spawnSuffix}${installSuffix}${ANSI.RESET}`
    : `${ANSI.DIM}${sorted.length} session(s) · Page ${
        currentPage + 1
      } of ${totalPages}${
        sorted.length > 0 ? ` · rows ${start + 1}-${end}` : ''
      }${spawnSuffix}${installSuffix}${ANSI.RESET}`;

  const headRow = formatHead(state.selectedUlid === SYNTHETIC_NEW);
  const bodyRows = formatBodyPage(
    pageSessions,
    state.selectedUlid,
    state.termWidth,
    visibleBodySlots,
  );
  // SS-P2 · SCFC empty result placeholder: when filter is active AND no
  // matching sessions exist, replace the first body slot with explanatory
  // text. Preserves visibleBodySlots padding via formatBodyPage's empty-slot
  // fill (subsequent rows remain padBlank). Hint references [N] to surface
  // the new-session affordance under the filtered context.
  if (filterName && pageSessions.length === 0 && bodyRows.length > 0) {
    bodyRows[0] = `  ${ANSI.DIM}(no sessions for ${filterName} yet · start one with [N])${ANSI.RESET}`;
  }
  const tailRow = formatTail(state.selectedUlid === SYNTHETIC_CLOSE);
  // Diamond Q: footer modal toggles between standard hints and rename input
  // when renameMode is active. Cursor indicator '_' marks buffer end.
  // Diamond B-26-PEWTER (CD-123 UMHV · u uninstall hotkey footer hint).
  // Hint visible ONLY when cascadesPresent === true (same gate as the hotkey
  // itself · matches existing single-letter hotkey advertisement convention).
  const uninstallHint = state.cascadesPresent === true ? ' · u uninstall' : '';
  // Diamond α RM-Fix-1 · γ unconditional: 'i' hotkey hint always visible.
  const installScpHint = ' · i install SCP';
  // GITM-PROGINSTALL: 'p' hotkey hint — programmatic (cwd-derived) install.
  // Unconditional, matching the always-visible 'i' hint + the unconditional hotkey.
  const installScpProgHint = ' · p quick install';
  // Diamond α RM-Fix-2: scpWizard renders its own pane via early-return at line ~1489 ·
  // by here scpWizard is narrowed to undefined. Only renameMode + standard hints remain.
  // TRHC Site C · renderMenu footer · 2-row centered hint for non-rename branch.
  // renameMode branch preserved single-line (modal-specific).
  // Citation: SUITE-3-YELLOW-UX-REFINEMENT-BLUEPRINT.md §3
  const centerRowMain = (text: string, w: number): string => {
    const visible = text.replace(/\x1b\[[0-9;]*m/g, '').length;
    const pad = Math.max(0, Math.floor((w - visible) / 2));
    return ' '.repeat(pad) + text;
  };
  const isRenameMode = state.renameMode !== undefined;
  // C1104 · the model picker's own footer line — the catalog row under the cursor,
  // its position, and the modal keys. Sibling to the rename modal's line.
  const pickedModel =
    state.modelPickMode !== undefined
      ? AVAILABLE_MODELS[state.modelPickMode.index]
      : undefined;
  const footerLine = isRenameMode
    ? `${ANSI.DIM}Rename: ${state.renameMode?.buffer ?? ''}_  · Enter confirm · Esc cancel${ANSI.RESET}`
    : state.modelPickMode !== undefined
      ? `${ANSI.DIM}Model: ${pickedModel?.label ?? '—'} (${(state.modelPickMode.index + 1)}/${AVAILABLE_MODELS.length})  · ↑/↓ choose · Enter confirm · Esc cancel${ANSI.RESET}`
      : '';
  // Diamond F · FKDF · Footer extension. 'z focus' hint added to footerRow1.
  // Unconditional (the hotkey is always present · HFGE handles graceful no-op
  // on synthetic/non-launched rows). Visible length: 39 → 49 chars; within
  // budget for 80+ col terminals · clipAndPadToWidth handles narrower.
  // Citation: D3RM-F-FOUNDATION-R7-FUCHSIA-CLINICAL.md §2 / §5 Wave 4a.
  const footerRow1 = `${ANSI.DIM}↑/↓ navigate · ←/→ page · Home/End jump · z focus${ANSI.RESET}`;
  const footerRow2 = `${ANSI.DIM}Enter activate · n new · x remove · d dissipate · a archive · r rename · m model${installScpHint}${installScpProgHint}${uninstallHint} · q quit${ANSI.RESET}`;

  // Diamond R Fix R-2: clip-and-pad each line to termWidth before padToHeight.
  // Composes with formatBodyPage's existing termWidth-pre-padded slots (Diamond P).
  // Diamond B-1: Install row inserted between header(2) and HEAD when installRowPresent.
  // RESERVED_LINES_WITH_INSTALL=6 accounts for the extra fixed line (visibleBodySlots already shrunk).
  const allLines: string[] = [
    clipAndPadToWidth(headerLine1, state.termWidth),
    clipAndPadToWidth(headerLine2, state.termWidth),
  ];
  if (installRowPresent) {
    allLines.push(
      clipAndPadToWidth(
        formatInstall(state.selectedUlid === SYNTHETIC_INSTALL, state.cascadesPresent),
        state.termWidth,
      ),
    );
  }
  // Cycle 142 MEXP: Engage row precedes Install row when anyScpsInstalled === true.
  // Routes to 'open-scp-manage-menu' on Enter.
  if (state.anyScpsInstalled === true) {
    allLines.push(
      clipAndPadToWidth(
        formatEngageScp(state.selectedUlid === SYNTHETIC_ENGAGE_SCP),
        state.termWidth,
      ),
    );
  }
  // Cycle 144 MRSC: Install SCP row HIDDEN when CSPMSR-true (Engage above
  // takes its slot · Install Another via SCP Menu sub-route).
  // SCPGATE WSRM: PSRS gate — withhold Install-SCP row until SCS substrate install
  // resolves (cascadesPresent === scaffold present · installationComplete !== false ===
  // not mid-install · undefined/legacy treated as complete · fail-open).
  if (
    state.anyScpsInstalled !== true &&
    state.cascadesPresent === true &&
    state.installationComplete !== false
  ) {
    allLines.push(
      clipAndPadToWidth(
        formatInstallScp(state.selectedUlid === SYNTHETIC_INSTALL_SCP),
        state.termWidth,
      ),
    );
  }
  allLines.push(
    clipAndPadToWidth(headRow, state.termWidth),
    ...bodyRows.map((r) => clipAndPadToWidth(r, state.termWidth)),
    clipAndPadToWidth(tailRow, state.termWidth),
  );
  if (isRenameMode) {
    allLines.push(clipAndPadToWidth(footerLine, state.termWidth));
  } else {
    allLines.push(
      clipAndPadToWidth(centerRowMain(footerRow1, state.termWidth), state.termWidth),
      clipAndPadToWidth(centerRowMain(footerRow2, state.termWidth), state.termWidth),
    );
  }
  return padToHeight(allLines, state.termHeight).join('\n');
}

export async function startMenu(): Promise<void> {
  if (!process.stdout.isTTY) {
    console.error('scs bridge menu requires an interactive TTY.');
    process.exit(1);
  }

  let sessions = await listSessions();
  if (sessions.length === 0) {
    console.log('No sessions registered. Auto-spawning first session...');
    const { sessionId } = await createSession();
    await launchInformative(sessionId, 'new');
    sessions = await listSessions();
  }

  const mostRecent =
    sessions.length > 0 ? [...sessions].sort((a, b) => b.spawnedAt - a.spawnedAt)[0] : null;

  // Diamond B-9 Fix 1 (CD-23 refinement · SCS-Scaffold-Marker-Probe-Target):
  // probe SCS scaffold marker (8_SUITES/), not bridge-state location (Cascades/).
  // ensureBridgeRoot() in loadRegistry() above creates Cascades/Bridge/ as a side
  // effect; 8_SUITES/ is created ONLY by Strategy/S4 scaffold copy. Pattern 4
  // metadata-only (existsSync; no content read).
  const cascadesPresent = existsSync(process.cwd() + '/Cascades/8_SUITES');

  let state: MenuState = {
    sessions,
    selectedUlid: cascadesPresent ? mostRecent?.id ?? SYNTHETIC_NEW : SYNTHETIC_INSTALL,
    termWidth: process.stdout.columns ?? 100,
    termHeight: process.stdout.rows ?? 30,
    lastRenderedAt: Date.now(),
    spawnInFlight: false,
    cascadesPresent,
  };

  process.stdout.write(ANSI.ENTER_ALT + ANSI.HIDE_CURSOR);

  const render = (): void => {
    state = { ...state, lastRenderedAt: Date.now() };
    process.stdout.write(renderMenu(state));
  };

  render();

  createFileWatcher('menu.registry', registryPath(), { interval: 500 }, async () => {
    const newSessions = await listSessions();
    state = {
      ...state,
      sessions: newSessions,
      selectedUlid: preserveCursorAcrossUpdate(state.selectedUlid, newSessions),
    };
    render();
  });

  const resizeHandler = (): void => {
    state = {
      ...state,
      termWidth: process.stdout.columns ?? 100,
      termHeight: process.stdout.rows ?? 30,
    };
    render();
  };
  process.stdout.on('resize', resizeHandler);

  emitKeypressEvents(process.stdin);
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }
  process.stdin.resume();

  const cleanExit = (): never => {
    unwatchFile(registryPath());
    process.stdin.removeListener('keypress', keypressHandler);
    process.stdout.removeListener('resize', resizeHandler);
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
    }
    process.stdin.pause();
    process.stdout.write(ANSI.SHOW_CURSOR + ANSI.EXIT_ALT);
    process.exit(0);
  };

  const keypressHandler = async (_str: string | undefined, key: KeypressInput): Promise<void> => {
    const { newState, action } = applyKeypress(state, key);
    state = newState;
    switch (action.type) {
      case 'cursor-up':
      case 'cursor-down':
      case 'page-left':
      case 'page-right':
      case 'cursor-home':
      case 'cursor-end':
      case 'noop':
        render();
        break;
      case 'resume-selected': {
        const ulid = state.selectedUlid;
        if (ulid && ulid !== SYNTHETIC_NEW && ulid !== SYNTHETIC_CLOSE) {
          const entry = state.sessions.find((s) => s.id === ulid);
          if (entry) {
            const sessionState = deriveSessionState(entry);
            if (sessionState === 'alive') {
              process.stderr.write(
                `[scs-bridge] session ${ulid} is already running (claudePid alive)\n`,
              );
            } else if (!state.spawnInFlight) {
              const mode = sessionState === 'pending' ? 'new' : 'resume';
              state = { ...state, spawnInFlight: true };
              render();
              try {
                await launchInformative(ulid, mode);
              } catch (err) {
                process.stderr.write(`[scs-bridge] resume error: ${(err as Error).message}\n`);
              } finally {
                state = { ...state, spawnInFlight: false };
              }
            }
          }
        }
        render();
        break;
      }
      case 'spawn-new':
        if (state.spawnInFlight) return;
        state = { ...state, spawnInFlight: true };
        render();
        try {
          const { sessionId } = await createSession();
          await launchInformative(sessionId, 'new');
        } catch {
          // ignore
        } finally {
          state = { ...state, spawnInFlight: false };
          render();
        }
        break;
      case 'remove-selected': {
        // Diamond N Fix N-D3: user-forced eviction. removeSession is idempotent
        // (filter on absent id = no-op); JSONL on disk is NOT touched. The
        // registry watchFile callback re-renders automatically.
        const ulid = state.selectedUlid;
        if (ulid && ulid !== SYNTHETIC_NEW && ulid !== SYNTHETIC_CLOSE) {
          await removeSession(ulid);
        }
        render();
        break;
      }
      // Diamond Q: User-Sourced Identification Diameter — rename modal lifecycle.
      case 'rename-selected': {
        const ulid = state.selectedUlid;
        if (ulid && ulid !== SYNTHETIC_NEW && ulid !== SYNTHETIC_CLOSE) {
          const entry = state.sessions.find((s) => s.id === ulid);
          // RM-D4 · DPCO seed · scsLabel first, then displayName, then empty.
          state = {
            ...state,
            renameMode: { ulid, buffer: entry?.scsLabel ?? entry?.displayName ?? '' },
          };
        }
        render();
        break;
      }
      case 'rename-confirm': {
        if (state.renameMode) {
          const { ulid, buffer } = state.renameMode;
          const trimmed = buffer.trim();
          // RM-D4 · DUAL · TUI rename leg writes scsLabel (matches the Vue Quality).
          await setSessionScsLabel(ulid, trimmed === '' ? undefined : trimmed);
          state = { ...state, renameMode: undefined };
        }
        render();
        break;
      }
      case 'rename-cancel': {
        state = { ...state, renameMode: undefined };
        render();
        break;
      }
      // C1104 · ruling A · the model-pick modal lifecycle (legacy startMenu path).
      // The commit leg calls the SAME registry setSessionModel the MCP quality calls.
      case 'set-model-selected': {
        const ulid = state.selectedUlid;
        if (ulid && ulid !== SYNTHETIC_NEW && ulid !== SYNTHETIC_CLOSE) {
          const entry = state.sessions.find((s) => s.id === ulid);
          const seeded = entry?.model
            ? AVAILABLE_MODELS.findIndex((m) => m.id === entry.model)
            : -1;
          state = { ...state, modelPickMode: { ulid, index: seeded >= 0 ? seeded : 0 } };
        }
        render();
        break;
      }
      case 'set-model-pick': {
        if (state.modelPickMode) {
          await setSessionModel(state.modelPickMode.ulid, action.model, 'set');
          state = { ...state, modelPickMode: undefined };
        }
        render();
        break;
      }
      case 'set-model-cancel': {
        state = { ...state, modelPickMode: undefined };
        render();
        break;
      }
      case 'set-model-move':
        // applyKeypress already moved state.modelPickMode.index; just re-render.
        render();
        break;
      case 'rename-buffer-update':
        // applyKeypress already updated state.renameMode.buffer; just re-render.
        render();
        break;
      // Diamond B-1 (CD-23): Install sentinel stub. Full install ceremony arrives
      // in Diamond B-6; for now emit a single stderr breadcrumb so the user sees
      // the action registered without altering bridge state or exiting alt-screen.
      case 'install-selected':
        process.stderr.write(
          '[scs] Install SCS-Bridge: implementation arrives in Diamond B-6 (currently stubbed)\n',
        );
        render();
        break;
      // Diamond B-8 Fix 3 (HWMTUC-SURFACE): trust-confer modal lifecycle in legacy
      // startMenu path. Bridge install ceremony lives in animatedTui (Diamond B-6);
      // legacy path simply clears the modal state so the menu re-renders.
      case 'trust-confer-confirm':
      case 'trust-confer-decline':
        state = { ...state, trustConfer: undefined };
        render();
        break;
      case 'close':
        cleanExit();
        break;
    }
  };

  process.stdin.on('keypress', keypressHandler);

  process.on('SIGINT', cleanExit);
  process.on('SIGTERM', cleanExit);
  process.on('SIGHUP', cleanExit);

  return new Promise<void>(() => {
    /* never resolves; cleanExit calls process.exit(0) */
  });
}
