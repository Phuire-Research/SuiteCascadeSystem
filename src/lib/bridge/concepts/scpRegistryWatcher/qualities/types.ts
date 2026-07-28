/**
 * scpRegistryWatcher Quality Type Definitions · Phase B.1 · Cycle 129
 *
 * Template: ADMIN_ICP/src/concepts/icp/qualities/types.ts
 * Pattern: Explicit Quality<State, Payload> type mapping (NEVER typeof)
 *
 * Citation: M63 Copy-Paste-Plus · STRATIMUX-REFERENCE.md Quality Creation Patterns
 * Citation: SUITE-2-ORANGE-B1-SCPREGWATCHER-NAMING.md §Per-Quality Payload Shape
 * Citation: SUITE-3-YELLOW-B1-SCPREGWATCHER-BLUEPRINT.md §3.1
 */

import type { Quality } from 'stratimux';
import type { ScpRegistryWatcherState } from '../scpRegistryWatcher.type';

// ────────────────────────────────────────────────
// PAYLOAD TYPES
// ────────────────────────────────────────────────

export type ScpRegistryFsScpAddedPayload = {
  scpPath: string;
  // C624 · CANONICAL CARRY: the rescan (Path B) carries SCPs.json `.name` so the
  // consumer CARRIES the canonical identity rather than re-deriving it from the
  // path basename. OPTIONAL — the chokidar (Path A) dispatch passes no name, so
  // the reducer/method fall back to the C622 path-basename normalization.
  scpName?: string;
};

export type ScpRegistryFsScpChangedPayload = {
  scpPath: string;
};

export type ScpRegistryFsScpRemovedPayload = {
  scpPath: string;
};

export type ScpRegistryDirectoryWatcherArmPayload = Record<string, never>;
export type ScpRegistryDirectoryWatcherDisarmPayload = Record<string, never>;
export type ScpRegistryStartupRescanPayload = Record<string, never>;

// ────────────────────────────────────────────────
// QUALITY TYPES
// ────────────────────────────────────────────────

export type ScpRegistryFsScpAdded = Quality<ScpRegistryWatcherState, ScpRegistryFsScpAddedPayload>;
export type ScpRegistryFsScpChanged = Quality<ScpRegistryWatcherState, ScpRegistryFsScpChangedPayload>;
export type ScpRegistryFsScpRemoved = Quality<ScpRegistryWatcherState, ScpRegistryFsScpRemovedPayload>;
export type ScpRegistryDirectoryWatcherArm = Quality<ScpRegistryWatcherState, ScpRegistryDirectoryWatcherArmPayload>;
export type ScpRegistryDirectoryWatcherDisarm = Quality<ScpRegistryWatcherState, ScpRegistryDirectoryWatcherDisarmPayload>;
export type ScpRegistryStartupRescan = Quality<ScpRegistryWatcherState, ScpRegistryStartupRescanPayload>;
