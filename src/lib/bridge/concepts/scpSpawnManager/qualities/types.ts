/**
 * scpSpawnManager Quality Type Definitions · Phase B.4 · Cycle 132
 *
 * Template: src/lib/bridge/concepts/scpMessageRouter/qualities/types.ts (B.2 inherited)
 *           src/lib/bridge/concepts/scpLifecycle/qualities/types.ts (B.3 inherited)
 * Pattern: Explicit Quality<State, Payload> type mapping (NEVER typeof per CLAUDE.md)
 *
 * 5-Quality split (R3 LOCK 1 ratified):
 *   1. SpawnRequested      (Method+Reducer · spawn + bind handlers + strategyDetermine Q2)
 *   2. SpawnSucceeded      (Reducer-only · commits SerializableSpawnEntry · lastHeartbeatAt: 0)
 *   3. SpawnExited         (Reducer-only · permissive-guard delete · exitCode+exitSignal)
 *   4. SpawnErrored        (Reducer-only · permissive-guard delete · errorMessage+errorCode)
 *   5. HeartbeatReceived   (Reducer-only · lastHeartbeatAt refresh)
 *
 * ScpSpawnManagerDownstreamDeck (Card 18 inheritance): exported for documentation
 * + forward use. Currently unused by Q1-Q5 because cross-Concept dispatches go
 * through dispatchFromHandler (runtime deck path, bypasses compile-time generic).
 * Self-Concept access in Q1 Method uses NO 3rd generic on createQualityCardWithPayload.
 *
 * Citation: M63 Copy-Paste-Plus · STRATIMUX-REFERENCE.md Quality Creation Patterns
 * Citation: SUITE-3-YELLOW-B4-SPAWNMGR-BLUEPRINT.md §2.2 · LOCK 1
 * Citation: SUITE-4-GREEN-B4-SPAWNMGR-BIDIRECTIONAL.md §3 LOCK 1 CONFIRMED
 */

import type { Quality, Concept } from 'stratimux';
import type { ScpSpawnManagerState } from '../scpSpawnManager.type';
import type { ScpLifecycleConcept } from '../../scpLifecycle/scpLifecycle.concept';

// ─── PAYLOAD TYPES ───────────────────────────────────────────

export type ScpSpawnManagerSpawnRequestedPayload = {
  scpName: string;
  scpPath: string;
  command: string;
  args: readonly string[];
  port: number;
  sessionId: string;
  bootRequestUlid: string;
  requestedAt: number;
  // CSEP · Caller-Session-Env-Propagation · SAWSR-D2.B Cycle 153 R2 fix
  // Optional · when present, scpSpawnManagerSpawnRequested injects into spawn() env
  // so SCP-side scsRegisterSession.ts can HTTP-POST back to Bridge MCP intake.
  // Without these, SCP child sees undefined env vars and SCSER callback skips.
  callerSessionUlid?: string;
  mcpEndpoint?: string;
  // C905 · THE CLEAR RESTART PATH — a crash-to-desktop leaves the (detached) SCP server
  // child ALIVE while the window world is gone; LOCK 2 then refuses every re-boot and the
  // SCP is unrecoverable without a bridge relaunch. forceRestart makes the boot a COMPLETE
  // RESTART: SIGTERM the surviving child, clear the slot, spawn fresh. The TUI passes it on
  // any boot whose lifecycle surface is not 'live' (any closed anor crashed window).
  forceRestart?: boolean;
};

export type ScpSpawnManagerSpawnSucceededPayload = {
  scpName: string;
  scpPath: string;
  port: number;
  pid: number;
  sessionId: string;
  bootRequestUlid: string;
  startedAt: number;
  browserUrl: string;
};

export type ScpSpawnManagerSpawnExitedPayload = {
  scpName: string;
  exitCode: number | null;
  exitSignal: NodeJS.Signals | null;
  exitedAt: number;
};

export type ScpSpawnManagerSpawnErroredPayload = {
  scpName: string;
  errorMessage: string;
  errorCode?: string;
  erroredAt: number;
};

export type ScpSpawnManagerHeartbeatReceivedPayload = {
  scpName: string;
  heartbeatUlid: string;
  receivedAt: number;
};

// Server-Close Cure · a DELIBERATE user window-close requests the death of the
// SCP's dedicated child process. The Method marks voluntaryCloseByScp then
// SIGTERMs the (detached+unref'd) child DIRECTLY — NOT the -pid group kill
// (that is bridge-wide teardown, B.6). No-handle → FailureNode-honest skip.
export type ScpSpawnManagerKillRequestedPayload = {
  scpName: string;
};

// ─── QUALITY TYPES ───────────────────────────────────────────

export type ScpSpawnManagerSpawnRequested =
  Quality<ScpSpawnManagerState, ScpSpawnManagerSpawnRequestedPayload>;

export type ScpSpawnManagerSpawnSucceeded =
  Quality<ScpSpawnManagerState, ScpSpawnManagerSpawnSucceededPayload>;

export type ScpSpawnManagerSpawnExited =
  Quality<ScpSpawnManagerState, ScpSpawnManagerSpawnExitedPayload>;

export type ScpSpawnManagerSpawnErrored =
  Quality<ScpSpawnManagerState, ScpSpawnManagerSpawnErroredPayload>;

export type ScpSpawnManagerHeartbeatReceived =
  Quality<ScpSpawnManagerState, ScpSpawnManagerHeartbeatReceivedPayload>;

export type ScpSpawnManagerKillRequested =
  Quality<ScpSpawnManagerState, ScpSpawnManagerKillRequestedPayload>;

// ─── DOWNSTREAM DECK (Card 18 · B.3 inheritance) ─────────────
//
// Exported for documentation / forward use. Currently unused by Q1-Q5: Q1's
// Method dispatches Q2 via self-Concept access (no 3rd generic); cross-Concept
// dispatches use dispatchFromHandler (runtime deck path). If R4 Green or later
// audit identifies a case where this generic IS needed at Method signature
// level, the Quality file can adopt it as its 3rd generic.

export type ScpSpawnManagerDownstreamDeck = {
  scpSpawnManager: Concept<ScpSpawnManagerState, Record<string, unknown>>;
  scpLifecycle: ScpLifecycleConcept;
};
