/**
 * scpLifecycle Type Definitions · Phase B.3 · Cycle 131 (was Phase A · Cycle 127)
 *
 * Template: ADMIN_ICP/src/concepts/icp/icp.types.ts (state-shape pattern)
 * SCP-specific: 5-state FSM internal · 4-state surface for badge consumer.
 *
 * CRITICAL CONSUMER CONTRACTS:
 *   - src/lib/bridge/menu.ts:11 imports ScpLifecycleStateValue
 *   - src/lib/bridge/scpLifecycleBadge.ts:17 imports ScpLifecycleStateValue
 *   - src/lib/tui/animatedTui.ts:59 imports ScpLifecycleStateValue + uses
 *       `lifecycleByScp: Map<string, ScpLifecycleStateValue>` field via DECK K
 *
 * 4-state surface (Interactive COLLAPSED · scpLifecycleBadge.ts SB-Final precedent):
 *   pending · idle · booting · live
 *
 * 5-state FSM (Phase B principle surfaces these as transitions):
 *   registered · booting · ready · degraded · torn-down
 *
 * Phase B 5↔4 mapping (R4 §4 R-5):
 *   registered → pending · booting → booting · ready → live · degraded → live
 *   torn-down → entry REMOVED from lifecycleByScp Map
 *
 * Phase B.3 (Cycle 131) ADDS:
 *   - lastTransitionAt: Map<string, number> — per-SCP last FSM transition timestamp.
 *     Required by scpLifecycleBadge.ts:53 bootingElapsedMs calculation (consumer
 *     wiring deferred per R4 §6.1 — data available; consumer opts in later).
 *
 * Qualities/Concept types MOVED to scpLifecycle.concept.ts per B.1+B.2 inheritance
 * (explicit Quality type mapping · NEVER typeof per CLAUDE.md non-negotiable).
 *
 * Citation: M63 Copy-Paste-Plus · scpLifecycleBadge.ts SB-Final consumer signature
 * Citation: SUITE-3-YELLOW-B3-LIFECYCLE-BLUEPRINT.md §3.7
 */

export const scpLifecycleName = 'scpLifecycle';

// 4-state surface · matches scpLifecycleBadge.ts consumer signature
export type ScpLifecycleStateValue = 'pending' | 'idle' | 'booting' | 'live';

// 5-state FSM · Phase B principle surface · internal
export type ScpLifecycleFsmState = 'registered' | 'booting' | 'ready' | 'degraded' | 'torn-down';

export type ScpLifecycleEntry = {
  scpName: string;
  state: ScpLifecycleStateValue;
  fsmState: ScpLifecycleFsmState;
  updatedAt: number;
};

export type ScpLifecycleState = {
  // Map<scpName, badge-surface-state> · consumer signature at animatedTui.ts:353
  lifecycleByScp: Map<string, ScpLifecycleStateValue>;
  // Auxiliary: 5-state FSM tracking per SCP
  fsmByScp: Map<string, ScpLifecycleFsmState>;
  // Phase B.3 addition · per-SCP timestamp of most recent FSM transition.
  // Drives scpLifecycleBadge.ts:53 bootingElapsedMs calculation (consumer opt-in).
  lastTransitionAt: Map<string, number>;
};

export const createScpLifecycleState = (): ScpLifecycleState => ({
  lifecycleByScp: new Map<string, ScpLifecycleStateValue>(),
  fsmByScp: new Map<string, ScpLifecycleFsmState>(),
  lastTransitionAt: new Map<string, number>(),
});
