/**
 * scpSpawnManager Concept · Phase B.4 · Cycle 132 (rewrite from Phase A empty roster)
 *
 * Template: src/lib/bridge/concepts/scpLifecycle/scpLifecycle.concept.ts (B.3 inherited)
 * Pattern: Explicit Quality type mapping (NEVER typeof per CLAUDE.md non-negotiable)
 *
 * Phase B.4 adds: 5 Qualities · 0 principles (form-α LOCK · LOCK 3 Method-inline
 * binding · no Principle needed because ChildProcess event handlers dispatch
 * via dispatchFromHandler module-level helper).
 *
 * The 5 Qualities:
 *   1. SpawnRequested      (Method+Reducer · spawn + bind + strategyDetermine Q2)
 *   2. SpawnSucceeded      (Reducer-only · commits ScpSpawnEntry on success)
 *   3. SpawnExited         (Reducer-only · cleanup on ChildProcess 'exit')
 *   4. SpawnErrored        (Reducer-only · cleanup on ChildProcess 'error')
 *   5. HeartbeatReceived   (Reducer-only · lastHeartbeatAt refresh)
 *
 * Concept + Qualities types live HERE (atomic L.9/L.10 cleanup · R4 F3+F7):
 *   - ScpSpawnManagerQualities (real 5-Quality map)
 *   - ScpSpawnManagerConcept   (Concept<State, Qualities>)
 *   - ScpSpawnManagerDeck      (forward use)
 *
 * Citation: M63 Copy-Paste-Plus · STRATIMUX-REFERENCE.md Quality Creation Patterns
 * Citation: SUITE-3-YELLOW-B4-SPAWNMGR-BLUEPRINT.md §2.10 · LOCK 1
 * Citation: SUITE-4-GREEN-B4-SPAWNMGR-BIDIRECTIONAL.md §3 LOCK 1 CONFIRMED + §4 F3/F7
 */

import { createConcept, type Concept } from 'stratimux';
import {
  scpSpawnManagerName,
  createScpSpawnManagerState,
  type ScpSpawnManagerState,
} from './scpSpawnManager.type';

// Quality imports
import {
  scpSpawnManagerSpawnRequested,
  type ScpSpawnManagerSpawnRequested,
} from './qualities/scpSpawnManagerSpawnRequested.quality';
import {
  scpSpawnManagerSpawnSucceeded,
  type ScpSpawnManagerSpawnSucceeded,
} from './qualities/scpSpawnManagerSpawnSucceeded.quality';
import {
  scpSpawnManagerSpawnExited,
  type ScpSpawnManagerSpawnExited,
} from './qualities/scpSpawnManagerSpawnExited.quality';
import {
  scpSpawnManagerSpawnErrored,
  type ScpSpawnManagerSpawnErrored,
} from './qualities/scpSpawnManagerSpawnErrored.quality';
import {
  scpSpawnManagerHeartbeatReceived,
  type ScpSpawnManagerHeartbeatReceived,
} from './qualities/scpSpawnManagerHeartbeatReceived.quality';
import {
  scpSpawnManagerKillRequested,
  type ScpSpawnManagerKillRequested,
} from './qualities/scpSpawnManagerKillRequested.quality';

// ────────────────────────────────────────────────
// QUALITY TYPE MAPPING (Explicit — NEVER typeof per CLAUDE.md non-negotiable)
// ────────────────────────────────────────────────

export type ScpSpawnManagerQualities = {
  scpSpawnManagerSpawnRequested: ScpSpawnManagerSpawnRequested;
  scpSpawnManagerSpawnSucceeded: ScpSpawnManagerSpawnSucceeded;
  scpSpawnManagerSpawnExited: ScpSpawnManagerSpawnExited;
  scpSpawnManagerSpawnErrored: ScpSpawnManagerSpawnErrored;
  scpSpawnManagerHeartbeatReceived: ScpSpawnManagerHeartbeatReceived;
  scpSpawnManagerKillRequested: ScpSpawnManagerKillRequested;
};

export type ScpSpawnManagerConcept = Concept<ScpSpawnManagerState, ScpSpawnManagerQualities>;

export type ScpSpawnManagerDeck = {
  scpSpawnManager: ScpSpawnManagerConcept;
};

// ────────────────────────────────────────────────
// FACTORY
// ────────────────────────────────────────────────

export type CreateScpSpawnManagerConceptOptions = {
  userCwd: string;
};

export const createScpSpawnManagerConcept = (options: CreateScpSpawnManagerConceptOptions) =>
  createConcept(
    scpSpawnManagerName,
    createScpSpawnManagerState(options.userCwd),
    {
      scpSpawnManagerSpawnRequested,
      scpSpawnManagerSpawnSucceeded,
      scpSpawnManagerSpawnExited,
      scpSpawnManagerSpawnErrored,
      scpSpawnManagerHeartbeatReceived,
      scpSpawnManagerKillRequested,
    },
    [],  // 0 principles · form-α LOCK · LOCK 3 Method-inline binding
  );
