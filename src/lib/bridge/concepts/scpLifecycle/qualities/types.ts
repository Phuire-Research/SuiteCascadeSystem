/**
 * scpLifecycle Quality Type Definitions · Phase B.3 · Cycle 131
 *
 * Template: src/lib/bridge/concepts/scpMessageRouter/qualities/types.ts (B.2 inherited)
 * Template: ADMIN_ICP/src/concepts/icp/qualities/types.ts
 * Pattern: Explicit Quality<State, Payload> type mapping (NEVER typeof per CLAUDE.md non-negotiable)
 *
 * 5-Quality split per FSM transition (R2 NAMING §2):
 *   1. Register         (Reducer-only · admission)
 *   2. IdleToSpawning   (Reducer-only · pending/idle → booting)
 *   3. SpawningToActive (Reducer-only · booting → live)
 *   4. ActiveToDying    (Reducer-only · live → live(degraded fsm))
 *   5. DyingToGone      (Reducer-only · live(degraded) → entry-removed)
 *
 * All 5 Qualities are Reducer-only — Method work is upstream-hosted per
 * form-α LOCK (R3 §1.1). Payload shapes carry trace fields for telemetry.
 *
 * Citation: M63 Copy-Paste-Plus · STRATIMUX-REFERENCE.md Quality Creation Patterns
 * Citation: SUITE-1-RED-B3-LIFECYCLE-CURATION.md §4 (Cards 13-17)
 * Citation: SUITE-2-ORANGE-B3-LIFECYCLE-NAMING.md §2-§3
 * Citation: SUITE-3-YELLOW-B3-LIFECYCLE-BLUEPRINT.md §3.1
 * Citation: SUITE-4-GREEN-B3-LIFECYCLE-BIDIRECTIONAL.md §2-§9
 */

import type { Quality } from 'stratimux';
import type { ScpLifecycleState } from '../scpLifecycle.type';

// ────────────────────────────────────────────────
// PAYLOAD TYPES
// ────────────────────────────────────────────────

export type ScpLifecycleRegisterPayload = {
  scpName: string;
  scpPath: string;
  discoveredAt: number;
};

export type ScpLifecycleIdleToSpawningPayload = {
  scpName: string;
  bootRequestUlid: string;
  receivedAt: number;
};

export type ScpLifecycleSpawningToActivePayload = {
  scpName: string;
  heartbeatUlid?: string;
  port?: number;
  becameActiveAt: number;
};

export type ScpLifecycleActiveToDyingPayload = {
  scpName: string;
  reason: 'admin-teardown' | 'health-check-failed' | 'envelope-teardown' | 'unknown';
  initiatedAt: number;
};

export type ScpLifecycleDyingToGonePayload = {
  scpName: string;
  exitCode: number | null;
  exitSignal: string | null;
  exitedAt: number;
};

// D-WC-2 · Window-Close Signal · the SCP presenter/source window is closed by the
// user. The lifecycle surface returns to 'pending' (a fresh [L] can re-open it). This
// is a SURFACE signal, NOT a process-death signal — the SCP process may still be alive
// (spawnManager owns process death via DyingToGone). Legal only from live/idle.
export type ScpLifecycleWindowClosedPayload = {
  scpName: string;
  closedAt: number;
};

// RA-1 · THE RE-ADOPTION LEG — a live server proven by the /scp-config identity probe is
// re-adopted registered→ready without a spawn (the RE-ADOPTION GAP close · C581).
export type ScpLifecycleReAdoptPayload = {
  scpName: string;
  port: number;
  reAdoptedAt: number;
};

// ────────────────────────────────────────────────
// QUALITY TYPES
// ────────────────────────────────────────────────

export type ScpLifecycleRegister =
  Quality<ScpLifecycleState, ScpLifecycleRegisterPayload>;

export type ScpLifecycleIdleToSpawning =
  Quality<ScpLifecycleState, ScpLifecycleIdleToSpawningPayload>;

export type ScpLifecycleSpawningToActive =
  Quality<ScpLifecycleState, ScpLifecycleSpawningToActivePayload>;

export type ScpLifecycleActiveToDying =
  Quality<ScpLifecycleState, ScpLifecycleActiveToDyingPayload>;

export type ScpLifecycleDyingToGone =
  Quality<ScpLifecycleState, ScpLifecycleDyingToGonePayload>;

export type ScpLifecycleWindowClosed =
  Quality<ScpLifecycleState, ScpLifecycleWindowClosedPayload>;

export type ScpLifecycleReAdopt =
  Quality<ScpLifecycleState, ScpLifecycleReAdoptPayload>;
