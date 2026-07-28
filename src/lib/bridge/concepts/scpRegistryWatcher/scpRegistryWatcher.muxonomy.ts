/**
 * scpRegistryWatcher Muxonomy Configuration · Phase B.0 · Cycle 128
 *
 * Template: ADMIN_ICP/src/concepts/icp/icp.muxonomy.ts (MuxonomicConfig pattern · filterKeys exclusion)
 * SCP-specific: chokidar FSWatcher reference in state · MUST be excluded from serialization
 *
 * State audit (R4 §1 Angle 2):
 *   - userCwd: string                    → serializable · no exclusion
 *   - observedPath: string               → serializable · no exclusion
 *   - directoryWatcher: FSWatcher | null → NON-SERIALIZABLE · EXCLUDED via filterKeys
 *   - installedScps: ScpRegistryEntry[]  → serializable (plain object array) · no exclusion
 *
 * filterKeys: ['directoryWatcher'] — chokidar FSWatcher is a NodeJS event-emitter
 * holding native file-descriptor handles; JSON.stringify would either fail or emit
 * `{}`. Phase B.1 principle wires this field via observer.next; muxonomy registry
 * (when consumed) MUST exclude it from sync + serialization paths.
 *
 * Phase B.0 scope: muxonomy declaration only · empty demometer rosters.
 * Phase B.1 will populate qualities + principles for chokidar wiring.
 *
 * Citation: M60 State-or-Payload Anor (state-resident with filterKeys exclusion)
 * Citation: M61 Project-Totality Authoritative Scope · M63 Copy-Paste-Plus Canonical
 * Citation: R4 SUITE-4-GREEN-COPY-PASTE-PLUS-BIDIRECTIONAL.md §1 Angle 2 (filterKeys mandate)
 * Citation: ADMIN_ICP/src/concepts/icp/icp.muxonomy.ts:36-58 (filterKeys exclusion pattern)
 */

import {
  type MuxonomicConfig,
  ChangeDetectionMode,
} from '../muxonomy/muxonomy.model';

import { scpRegistryWatcherName } from './scpRegistryWatcher.type';

export const scpRegistryWatcherMuxonomy: MuxonomicConfig<'scpRegistryWatcher'> = {
  conceptName: scpRegistryWatcherName,

  filterKeys: [
    'directoryWatcher',
  ],

  novelChange: {
    mode: ChangeDetectionMode.KeyedSelector,
  },

  sync: {
    direction: 'toClient',
    filterKeys: [
      'directoryWatcher',
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
    huirth: 'ScpRegistryWatcherDeck',
    client: '',
  },
};
