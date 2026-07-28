/**
 * scpMessageRouter Muxonomy Configuration · Phase B.0 · Cycle 128
 *
 * Template: ADMIN_ICP/src/concepts/icp/icp.muxonomy.ts (MuxonomicConfig pattern · multi-field exclusion)
 * SCP-specific: dual FSWatcher + MEFRI consumedUlids Set · all non-serializable
 *
 * State audit (R4 §1 Angle 2):
 *   - userCwd: string                       → serializable · no exclusion
 *   - bridgeJsonWatcher: FSWatcher | null   → NON-SERIALIZABLE · EXCLUDED
 *   - sessionsDirWatcher: FSWatcher | null  → NON-SERIALIZABLE · EXCLUDED
 *   - consumedUlids: Set<string>            → NON-SERIALIZABLE (Set) · EXCLUDED
 *
 * filterKeys: ['bridgeJsonWatcher', 'sessionsDirWatcher', 'consumedUlids']
 *
 * Rationale per field:
 *   - bridgeJsonWatcher/sessionsDirWatcher: chokidar FSWatcher · native fd handles
 *   - consumedUlids: JS Set · JSON.stringify(new Set()) → `{}` silently lossy.
 *     MEFRI (Module-Edged Frame Routing Index) ledger semantics demand the Set
 *     for O(1) dedup; serializing would lose the ledger. Phase B.2 envelope routing
 *     reads/writes via principle observer.next; muxonomy registry MUST exclude.
 *
 * M59 ActionQue Reservation: this concept's state has NO actionQue field.
 * Per-watcher subscription stays internal to the principle (not cross-Concept).
 *
 * Phase B.0 scope: muxonomy declaration only · empty demometer rosters.
 * Phase B.2 will populate qualities + principles for two chokidar watchers
 * (bridgeJsonChanged + envelopeReceived + envelopeConsumed + teardown).
 *
 * Citation: M60 State-or-Payload Anor (state-resident with filterKeys exclusion)
 * Citation: M59 ActionQue Inductive Reservation (no actionQue cross-observation)
 * Citation: M61 Project-Totality Authoritative Scope · M63 Copy-Paste-Plus Canonical
 * Citation: R4 SUITE-4-GREEN-COPY-PASTE-PLUS-BIDIRECTIONAL.md §1 Angle 2
 * Citation: ADMIN_ICP/src/concepts/icp/icp.muxonomy.ts:39-58 (multi-key filter pattern)
 */

import {
  type MuxonomicConfig,
  ChangeDetectionMode,
  DeploymentTarget,
} from '../muxonomy/muxonomy.model';

import { scpMessageRouterName } from './scpMessageRouter.type';

export const scpMessageRouterMuxonomy: MuxonomicConfig<'scpMessageRouter'> = {
  conceptName: scpMessageRouterName,

  filterKeys: [
    'bridgeJsonWatcher',
    'sessionsDirWatcher',
    'bridgeSessionsDirWatcher',
    'consumedUlids',
  ],

  novelChange: {
    mode: ChangeDetectionMode.KeyedSelector,
  },

  sync: {
    direction: 'toClient',
    filterKeys: [
      'bridgeJsonWatcher',
      'sessionsDirWatcher',
      'bridgeSessionsDirWatcher',
      'consumedUlids',
    ],
    novelChange: {
      mode: ChangeDetectionMode.KeyedSelector,
    },
  },

  demometers: {
    qualities: [
      {
        name: 'scpMessageRouterBridgeJsonReceived',
        type: 'Scp Message Router Bridge Json Received',
        filePath: 'qualities/scpMessageRouterBridgeJsonReceived.quality.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
      {
        name: 'scpMessageRouterBmrEnvelopeReceived',
        type: 'Scp Message Router Bmr Envelope Received',
        filePath: 'qualities/scpMessageRouterBmrEnvelopeReceived.quality.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
      {
        name: 'scpMessageRouterWatcherArm',
        type: 'Scp Message Router Watcher Arm',
        filePath: 'qualities/scpMessageRouterWatcherArm.quality.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
      {
        name: 'scpMessageRouterWatcherDisarm',
        type: 'Scp Message Router Watcher Disarm',
        filePath: 'qualities/scpMessageRouterWatcherDisarm.quality.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
    ],
    strategies: [],
    principles: [
      {
        name: 'scpMessageRouterPrinciple',
        filePath: 'principles/scpMessageRouter.principle.ts',
        location: DeploymentTarget.Huirth,
      },
    ],
  },

  decks: {
    huirth: 'ScpMessageRouterDeck',
    client: '',
  },
};
