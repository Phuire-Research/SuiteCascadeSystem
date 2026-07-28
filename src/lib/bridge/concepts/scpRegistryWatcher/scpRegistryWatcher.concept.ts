/**
 * scpRegistryWatcher Concept · Phase B.1 · Cycle 129
 *
 * Template: ADMIN_ICP/src/concepts/icp/icp.concept.ts
 * Pattern: Explicit Quality type mapping (NEVER typeof per CLAUDE.md non-negotiable)
 *
 * Phase B.1 adds: 6 qualities + 1 principle (chokidar wiring on Cascades/scps/).
 *
 * Citation: M63 Copy-Paste-Plus · STRATIMUX-REFERENCE.md Quality Creation Patterns
 * Citation: SUITE-3-YELLOW-B1-SCPREGWATCHER-BLUEPRINT.md §3.9
 */

import { createConcept, type Concept } from 'stratimux';
import {
  scpRegistryWatcherName,
  createScpRegistryWatcherState,
  type ScpRegistryWatcherState,
} from './scpRegistryWatcher.type';

// Quality imports
import { scpRegistryFsScpAdded, type ScpRegistryFsScpAdded } from './qualities/scpRegistryFsScpAdded.quality';
import { scpRegistryFsScpChanged, type ScpRegistryFsScpChanged } from './qualities/scpRegistryFsScpChanged.quality';
import { scpRegistryFsScpRemoved, type ScpRegistryFsScpRemoved } from './qualities/scpRegistryFsScpRemoved.quality';
import {
  scpRegistryDirectoryWatcherArm,
  type ScpRegistryDirectoryWatcherArm,
} from './qualities/scpRegistryDirectoryWatcherArm.quality';
import {
  scpRegistryDirectoryWatcherDisarm,
  type ScpRegistryDirectoryWatcherDisarm,
} from './qualities/scpRegistryDirectoryWatcherDisarm.quality';
import { scpRegistryStartupRescan, type ScpRegistryStartupRescan } from './qualities/scpRegistryStartupRescan.quality';

// Principle imports
import { scpRegistryWatcherPrinciple } from './principles/scpRegistryWatcher.principle';

// ────────────────────────────────────────────────
// QUALITY TYPE MAPPING (Explicit — NEVER typeof per CLAUDE.md non-negotiable)
// ────────────────────────────────────────────────

export type ScpRegistryWatcherQualities = {
  scpRegistryFsScpAdded: ScpRegistryFsScpAdded;
  scpRegistryFsScpChanged: ScpRegistryFsScpChanged;
  scpRegistryFsScpRemoved: ScpRegistryFsScpRemoved;
  scpRegistryDirectoryWatcherArm: ScpRegistryDirectoryWatcherArm;
  scpRegistryDirectoryWatcherDisarm: ScpRegistryDirectoryWatcherDisarm;
  scpRegistryStartupRescan: ScpRegistryStartupRescan;
};

export type ScpRegistryWatcherConcept = Concept<ScpRegistryWatcherState, ScpRegistryWatcherQualities>;

export type ScpRegistryWatcherDeck = {
  scpRegistryWatcher: ScpRegistryWatcherConcept;
};

// ────────────────────────────────────────────────
// FACTORY
// ────────────────────────────────────────────────

export type CreateScpRegistryWatcherConceptOptions = {
  userCwd: string;
};

export const createScpRegistryWatcherConcept = (options: CreateScpRegistryWatcherConceptOptions) =>
  createConcept(
    scpRegistryWatcherName,
    createScpRegistryWatcherState(options.userCwd),
    {
      scpRegistryFsScpAdded,
      scpRegistryFsScpChanged,
      scpRegistryFsScpRemoved,
      scpRegistryDirectoryWatcherArm,
      scpRegistryDirectoryWatcherDisarm,
      scpRegistryStartupRescan,
    },
    [scpRegistryWatcherPrinciple],
  );
