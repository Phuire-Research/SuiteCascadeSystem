/**
 * gitm Muxonomy Configuration · GITM D2 (#633) · Gitm Epoch
 *
 * Template: scpRegistryWatcher.muxonomy.ts (MuxonomicConfig · filterKeys exclusion)
 * gitm-specific: a chokidar FSWatcher reference in state MUST be excluded from
 * serialization (JSON.stringify of an event-emitter holding native fds fails /
 * emits `{}`).
 *
 * State audit:
 *   - userCwd: string                 → serializable · no exclusion (internal)
 *   - isRepo / dirty / detachedHead   → serializable booleans
 *   - currentBranch: string           → serializable
 *   - ahead / behind / lastReadAt     → serializable numbers
 *   - branches / stagedFiles /
 *     unstagedFiles / conflicts       → serializable string[]
 *   - gitWatcher: FSWatcher | null    → NON-SERIALIZABLE · EXCLUDED via filterKeys
 *
 * filterKeys: ['gitWatcher'] — the Watchdial principle wires this field via the
 * Arm Reducer; the muxonomy registry (when consumed) MUST exclude it from sync +
 * serialization paths. GITEP serves a hand-built snapshot that already omits it.
 *
 * Citation: GITM-D2-S3-YELLOW-BLUEPRINT.md §1 · §4a · M60 (FSWatcher state-held)
 */

import {
  type MuxonomicConfig,
  ChangeDetectionMode,
} from '../muxonomy/muxonomy.model';

import { gitmName } from './gitm.types';

export const gitmMuxonomy: MuxonomicConfig<'gitm'> = {
  conceptName: gitmName,

  filterKeys: [
    'gitWatcher',
    // GITM A↔B-R (#641-R) — CHANGEDIAL FSWatcher · NON-SERIALIZABLE like gitWatcher.
    // (changesPrimedOnB + turnedOverTo are serializable → NO exclusion.)
    'projectWatcher',
    // GITM 3LOC — the two new location FSWatchers · NON-SERIALIZABLE like gitWatcher.
    // (locationBase/Cascade/Scp + mostRecentLocation + activeScpDir are serializable → NO exclusion.)
    'cascadeWatcher',
    'scpWatcher',
  ],

  novelChange: {
    mode: ChangeDetectionMode.KeyedSelector,
  },

  sync: {
    direction: 'toClient',
    filterKeys: [
      'gitWatcher',
      'projectWatcher',
      // GITM 3LOC — the two new location FSWatchers · NON-SERIALIZABLE.
      'cascadeWatcher',
      'scpWatcher',
    ],
    novelChange: {
      mode: ChangeDetectionMode.KeyedSelector,
    },
  },

  demometers: {
    qualities: [],
    strategies: [],
    principles: [],
  },

  decks: {
    huirth: 'GitmDeck',
    client: '',
  },
};
