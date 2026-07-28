/**
 * childProcessRegistry · MMUI Module-Level ChildProcess Registry · Cycle 132 · Phase B.4
 *
 * Module-private Map of ChildProcess handles keyed by scpName. NEVER enters
 * Stratimux state · MMUI escape hatch (M60 State-or-Payload Anor). Co-keyed
 * with state.spawnsByScp but topologically separate: module-Map holds
 * NON-SERIALIZABLE ChildProcess handles; state Map holds SERIALIZABLE
 * ScpSpawnEntry metadata.
 *
 * Invariant: every live scpName key appears in BOTH (module-Map AND state).
 *   - Q1 Method: setChildProcess synchronously, then strategyDetermine(Q2);
 *     Q2 Reducer commits state.spawnsByScp on next action.
 *   - 'exit'/'error' handlers: deleteChildProcess synchronously, then
 *     dispatchFromHandler(Q3/Q4); Q3/Q4 Reducer deletes state.spawnsByScp.
 *   - Node event-loop guarantee: synchronous Method completes before any
 *     event handler tick → M62 ordering preserved.
 *
 * Exported surface (LOCK 2 ratified · R4 AMENDMENT adds clearChildProcessRegistry):
 *   getChildProcess · setChildProcess · deleteChildProcess · snapshotChildProcesses
 *   dispatchFromHandler · clearChildProcessRegistry (test-teardown only)
 *
 * NOT re-exported from barrel index.ts — internal MMUI module only.
 *
 * Citation: M60 State-or-Payload Anor (MMUI escape hatch) · M63 Copy-Paste-Plus
 * Citation: SUITE-3-YELLOW-B4-SPAWNMGR-BLUEPRINT.md §1.2 LOCK 2 + §2.4
 * Citation: SUITE-4-GREEN-B4-SPAWNMGR-BIDIRECTIONAL.md §3 LOCK 2 AMENDMENT
 *           (Angle 7 · clearChildProcessRegistry for Jest test teardown)
 */

import type { ChildProcess } from 'node:child_process';
import {
  getActiveScsBridgeMuxiumHandle,
  type ScsBridgeMuxiumHandle,
} from '../../../scsBridgeMuxium';

// ─── MODULE-LEVEL REGISTRY ──────────────────────────────────

const childProcessByScp = new Map<string, ChildProcess>();

export function getChildProcess(scpName: string): ChildProcess | undefined {
  return childProcessByScp.get(scpName);
}

// Overwrites on duplicate. Caller MUST guard with getChildProcess check first.
export function setChildProcess(scpName: string, child: ChildProcess): void {
  childProcessByScp.set(scpName, child);
}

// Returns true if removed, false if no entry. Caller handles kill before calling.
export function deleteChildProcess(scpName: string): boolean {
  return childProcessByScp.delete(scpName);
}

// Shallow snapshot for diagnostics/teardown. Mutations to returned Map do NOT
// affect the registry. Used by B.6 teardown to enumerate SIGTERM targets.
export function snapshotChildProcesses(): Map<string, ChildProcess> {
  return new Map(childProcessByScp);
}

// Test-teardown only (R4 LOCK 2 AMENDMENT). Production code never calls this;
// production teardown enumerates snapshotChildProcesses() + SIGTERM individually.
// NOT re-exported from barrel index.ts. Test files import directly.
export function clearChildProcessRegistry(): void {
  childProcessByScp.clear();
}

// ─── VOLUNTARY-CLOSE MARK (Server-Close Cure) ───────────────
//
// Module-level Set of scpNames whose ChildProcess was killed by a DELIBERATE
// user window-close (scpSpawnManagerKillRequested), NOT a crash. The 'exit'
// handler reads this mark to decide the post-death path:
//   - marked   → after DyingToGone, RE-SEAT the installed SCP at 'pending' /
//                'registered' (the row rests, does not vanish); then clear.
//   - unmarked → crash/teardown death; keep today's behavior EXACTLY
//                (DyingToGone removes the entry — the row disappears).
//
// Co-keyed with childProcessByScp topologically but topically distinct: this
// carries INTENT (why the process died), not the handle. Never enters Stratimux
// state (MMUI escape hatch · M60 State-or-Payload Anor).

const voluntaryCloseByScp = new Set<string>();

// Mark an scpName as a deliberate close. Called by the KillRequested Method
// BEFORE child.kill() so the mark is present when the 'exit' handler ticks.
export function markVoluntaryClose(scpName: string): void {
  voluntaryCloseByScp.add(scpName);
}

// Consume the mark: returns true if the scpName was marked (and removes it),
// false otherwise. Called by the 'exit' handler — the read-and-clear is atomic
// within the single-threaded event loop, so re-spawn cannot re-inherit a mark.
export function consumeVoluntaryClose(scpName: string): boolean {
  return voluntaryCloseByScp.delete(scpName);
}

// Test-teardown only. Clears the voluntary-close Set alongside the handle Map.
// NOT re-exported from barrel index.ts. Test files import directly.
export function clearVoluntaryCloseRegistry(): void {
  voluntaryCloseByScp.clear();
}

// ─── ASYNC DISPATCH FROM EVENT HANDLERS ─────────────────────
//
// Pattern A (R2 §6 · Card 23): module-level muxium handle lookup. Called from
// ChildProcess 'exit'/'error' handlers where the Method's closure scope has
// expired (next event-loop tick). Handles null-handle gracefully (bridge not
// yet open or already closed) — silent-drop is the correct closed-muxium
// behavior (R4 Angle 5 · ACCEPTABLE).

export function dispatchFromHandler(
  actionFactory: (handle: ScsBridgeMuxiumHandle) => unknown,
): void {
  const handle = getActiveScsBridgeMuxiumHandle();
  if (handle === null) {
    console.error('[Scp Spawn Manager] dispatchFromHandler: muxium handle null — action dropped');
    return;
  }
  try {
    const action = actionFactory(handle);
    handle.muxium.dispatch(action as never);
  } catch (err) {
    console.error('[Scp Spawn Manager] dispatchFromHandler: dispatch failed:', err);
  }
}
