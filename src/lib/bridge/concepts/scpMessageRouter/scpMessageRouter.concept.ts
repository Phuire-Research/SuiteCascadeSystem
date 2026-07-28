/**
 * scpMessageRouter Concept · Phase B.2 · Cycle 130
 *
 * Template: src/lib/bridge/concepts/scpRegistryWatcher/scpRegistryWatcher.concept.ts (B.1 inherited)
 * Pattern: Explicit Quality type mapping (NEVER typeof per CLAUDE.md non-negotiable)
 *
 * Phase B.2 adds: 4 qualities + 1 principle (chokidar wiring on bridge.json + sessions/heads/).
 *
 * Citation: M63 Copy-Paste-Plus · STRATIMUX-REFERENCE.md Quality Creation Patterns
 * Citation: SUITE-3-YELLOW-B2-MSGROUTER-BLUEPRINT.md §3.8
 */

import { createConcept, type Concept } from 'stratimux';
import {
  scpMessageRouterName,
  createScpMessageRouterState,
  type ScpMessageRouterState,
} from './scpMessageRouter.type';

// Quality imports
import {
  scpMessageRouterBridgeJsonReceived,
  type ScpMessageRouterBridgeJsonReceived,
} from './qualities/scpMessageRouterBridgeJsonReceived.quality';
import {
  scpMessageRouterBmrEnvelopeReceived,
  type ScpMessageRouterBmrEnvelopeReceived,
} from './qualities/scpMessageRouterBmrEnvelopeReceived.quality';
import {
  scpMessageRouterWatcherArm,
  type ScpMessageRouterWatcherArm,
} from './qualities/scpMessageRouterWatcherArm.quality';
import {
  scpMessageRouterWatcherDisarm,
  type ScpMessageRouterWatcherDisarm,
} from './qualities/scpMessageRouterWatcherDisarm.quality';

// Principle imports
import { scpMessageRouterPrinciple } from './principles/scpMessageRouter.principle';

// ────────────────────────────────────────────────
// QUALITY TYPE MAPPING (Explicit — NEVER typeof per CLAUDE.md non-negotiable)
// ────────────────────────────────────────────────

export type ScpMessageRouterQualities = {
  scpMessageRouterBridgeJsonReceived: ScpMessageRouterBridgeJsonReceived;
  scpMessageRouterBmrEnvelopeReceived: ScpMessageRouterBmrEnvelopeReceived;
  scpMessageRouterWatcherArm: ScpMessageRouterWatcherArm;
  scpMessageRouterWatcherDisarm: ScpMessageRouterWatcherDisarm;
};

export type ScpMessageRouterConcept = Concept<ScpMessageRouterState, ScpMessageRouterQualities>;

export type ScpMessageRouterDeck = {
  scpMessageRouter: ScpMessageRouterConcept;
};

// ────────────────────────────────────────────────
// FACTORY
// ────────────────────────────────────────────────

export type CreateScpMessageRouterConceptOptions = {
  userCwd: string;
};

export const createScpMessageRouterConcept = (options: CreateScpMessageRouterConceptOptions) =>
  createConcept(
    scpMessageRouterName,
    createScpMessageRouterState(options.userCwd),
    {
      scpMessageRouterBridgeJsonReceived,
      scpMessageRouterBmrEnvelopeReceived,
      scpMessageRouterWatcherArm,
      scpMessageRouterWatcherDisarm,
    },
    [scpMessageRouterPrinciple],
  );
