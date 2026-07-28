/**
 * scpRegistryWatcher Type Definitions · Phase A · Cycle 127 Copy-Paste-Plus
 *
 * Template: ADMIN_ICP/src/concepts/fileSystem/principles/fileSystemWatcher.principle.ts
 *           (FSWatcher in state · chokidar pattern)
 * SCP-specific: single watched directory (Cascades/scps/) · FSM-driving event types
 *
 * Phase A scope: state shape + factory.
 * Phase B adds: scpRegistryWatcher.principle.ts (chokidar wiring) + 6 Qualities.
 *
 * Citation: M63 Copy-Paste-Plus · M60 State-or-Payload Anor (FSWatcher in state)
 * Citation: ADMIN_ICP/src/concepts/fileSystem/principles/fileSystemWatcher.principle.ts:1-98
 */

import type { FSWatcher } from 'chokidar';

export const scpRegistryWatcherName = 'scpRegistryWatcher';

export type ScpRegistryEntry = {
  scpName: string;
  scpPath: string;
  discoveredAt: number;
};

export type ScpRegistryWatcherState = {
  userCwd: string;
  observedPath: string;
  directoryWatcher: FSWatcher | null;
  installedScps: ScpRegistryEntry[];
};

export const createScpRegistryWatcherState = (userCwd: string): ScpRegistryWatcherState => ({
  userCwd,
  observedPath: `${userCwd}/Cascades/scps`,
  directoryWatcher: null,
  installedScps: [],
});

// ScpRegistryWatcherQualities and ScpRegistryWatcherConcept are now defined in
// scpRegistryWatcher.concept.ts (Phase B.1 explicit Quality type mapping per
// ADMIN_ICP icp.concept.ts precedent).
