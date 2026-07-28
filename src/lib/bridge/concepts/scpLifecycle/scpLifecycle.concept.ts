/**
 * scpLifecycle Concept · Phase B.3 · Cycle 131
 *
 * Template: src/lib/bridge/concepts/scpMessageRouter/scpMessageRouter.concept.ts (B.2 inherited)
 * Pattern: Explicit Quality type mapping (NEVER typeof per CLAUDE.md non-negotiable)
 *
 * Phase B.3 adds: 5 FSM transition Qualities · 0 principles (form-α LOCK · transitions
 * arrive via cross-Concept strategyDetermine dispatch from upstream Methods).
 *
 * The 5 Qualities are all Reducer-only — Method work happens UPSTREAM in:
 *   - scpRegistryWatcher.FsScpAdded.Method → dispatches Register
 *   - scpMessageRouter.BmrEnvelopeReceived.Method → dispatches IdleToSpawning + SpawningToActive
 *   - (B.4 forward) scpSpawnManager → dispatches SpawningToActive + DyingToGone
 *   - (B.5 forward) scpDockHost → dispatches ActiveToDying
 *
 * Citation: M63 Copy-Paste-Plus · STRATIMUX-REFERENCE.md Quality Creation Patterns
 * Citation: SUITE-3-YELLOW-B3-LIFECYCLE-BLUEPRINT.md §3.8
 * Citation: SUITE-4-GREEN-B3-LIFECYCLE-BIDIRECTIONAL.md §11
 */

import { createConcept, type Concept } from 'stratimux';
import {
  scpLifecycleName,
  createScpLifecycleState,
  type ScpLifecycleState,
} from './scpLifecycle.type';

// Quality imports
import {
  scpLifecycleRegister,
  type ScpLifecycleRegister,
} from './qualities/scpLifecycleRegister.quality';
import {
  scpLifecycleIdleToSpawning,
  type ScpLifecycleIdleToSpawning,
} from './qualities/scpLifecycleIdleToSpawning.quality';
import {
  scpLifecycleSpawningToActive,
  type ScpLifecycleSpawningToActive,
} from './qualities/scpLifecycleSpawningToActive.quality';
import {
  scpLifecycleActiveToDying,
  type ScpLifecycleActiveToDying,
} from './qualities/scpLifecycleActiveToDying.quality';
import {
  scpLifecycleDyingToGone,
  type ScpLifecycleDyingToGone,
} from './qualities/scpLifecycleDyingToGone.quality';
import {
  scpLifecycleWindowClosed,
  type ScpLifecycleWindowClosed,
} from './qualities/scpLifecycleWindowClosed.quality';
import {
  scpLifecycleReAdopt,
  type ScpLifecycleReAdopt,
} from './qualities/scpLifecycleReAdopt.quality';

// ────────────────────────────────────────────────
// QUALITY TYPE MAPPING (Explicit — NEVER typeof per CLAUDE.md non-negotiable)
// ────────────────────────────────────────────────

export type ScpLifecycleQualities = {
  scpLifecycleRegister: ScpLifecycleRegister;
  scpLifecycleIdleToSpawning: ScpLifecycleIdleToSpawning;
  scpLifecycleSpawningToActive: ScpLifecycleSpawningToActive;
  scpLifecycleActiveToDying: ScpLifecycleActiveToDying;
  scpLifecycleDyingToGone: ScpLifecycleDyingToGone;
  scpLifecycleWindowClosed: ScpLifecycleWindowClosed;
  // RA-1 · THE RE-ADOPTION LEG (registered→ready without a spawn · the RE-ADOPTION GAP close).
  scpLifecycleReAdopt: ScpLifecycleReAdopt;
};

export type ScpLifecycleConcept = Concept<ScpLifecycleState, ScpLifecycleQualities>;

export type ScpLifecycleDeck = {
  scpLifecycle: ScpLifecycleConcept;
};

// ────────────────────────────────────────────────
// FACTORY
// ────────────────────────────────────────────────

export type CreateScpLifecycleConceptOptions = {
  userCwd: string;
};

export const createScpLifecycleConcept = (_options: CreateScpLifecycleConceptOptions) =>
  createConcept(
    scpLifecycleName,
    createScpLifecycleState(),
    {
      scpLifecycleRegister,
      scpLifecycleIdleToSpawning,
      scpLifecycleSpawningToActive,
      scpLifecycleActiveToDying,
      scpLifecycleDyingToGone,
      scpLifecycleWindowClosed,
      scpLifecycleReAdopt,
    },
    [],
  );
