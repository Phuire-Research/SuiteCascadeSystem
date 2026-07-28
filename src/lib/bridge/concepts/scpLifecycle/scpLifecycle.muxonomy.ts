/**
 * scpLifecycle Muxonomy Configuration · Phase B.3 · Cycle 131 (was Phase B.0 · Cycle 128)
 *
 * Template: ADMIN_ICP/src/concepts/icp/icp.muxonomy.ts (MuxonomicConfig pattern · filterKeys exclusion)
 * SCP-specific: badge-surface Map + FSM Map + lastTransitionAt Map · all NON-SERIALIZABLE
 *
 * State audit (R4 §1 Angle 2 + consumer signature at animatedTui.ts:353):
 *   - lifecycleByScp:   Map<string, ScpLifecycleStateValue>  → NON-SERIALIZABLE (Map) · EXCLUDED
 *   - fsmByScp:         Map<string, ScpLifecycleFsmState>    → NON-SERIALIZABLE (Map) · EXCLUDED
 *   - lastTransitionAt: Map<string, number>                  → NON-SERIALIZABLE (Map) · EXCLUDED (B.3 addition)
 *
 * filterKeys: ['lifecycleByScp', 'fsmByScp', 'lastTransitionAt'] — all are JS Maps.
 * JSON.stringify(new Map()) yields `{}` (empty object), silently lossy. Consumer
 * signature at animatedTui.ts:353 reads `lifecycleByScp` via DECK K direct access
 * (no serialization path); Phase B.3 Qualities transition via Reducer.
 *
 * Phase B.3 (Cycle 131) populates qualities: 5 demometer objects · 0 principles
 * (form-α LOCK · R3 §1.1 + §3.9 · R4 §11 Card 7 inheritance).
 *
 * Citation: M60 State-or-Payload Anor (state-resident with filterKeys exclusion)
 * Citation: M61 Project-Totality Authoritative Scope · M63 Copy-Paste-Plus Canonical
 * Citation: SUITE-3-YELLOW-B3-LIFECYCLE-BLUEPRINT.md §3.9
 * Citation: SUITE-4-GREEN-B3-LIFECYCLE-BIDIRECTIONAL.md §7 (Card 7 inheritance verified)
 */

import {
  type MuxonomicConfig,
  ChangeDetectionMode,
  DeploymentTarget,
} from '../muxonomy/muxonomy.model';

import { scpLifecycleName } from './scpLifecycle.type';

export const scpLifecycleMuxonomy: MuxonomicConfig<'scpLifecycle'> = {
  conceptName: scpLifecycleName,

  filterKeys: [
    'lifecycleByScp',
    'fsmByScp',
    'lastTransitionAt',
  ],

  novelChange: {
    mode: ChangeDetectionMode.KeyedSelector,
  },

  sync: {
    direction: 'toClient',
    filterKeys: [
      'lifecycleByScp',
      'fsmByScp',
      'lastTransitionAt',
    ],
    novelChange: {
      mode: ChangeDetectionMode.KeyedSelector,
    },
  },

  demometers: {
    qualities: [
      {
        name: 'scpLifecycleRegister',
        type: 'Scp Lifecycle Register',
        filePath: 'qualities/scpLifecycleRegister.quality.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
      {
        name: 'scpLifecycleIdleToSpawning',
        type: 'Scp Lifecycle Idle To Spawning',
        filePath: 'qualities/scpLifecycleIdleToSpawning.quality.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
      {
        name: 'scpLifecycleSpawningToActive',
        type: 'Scp Lifecycle Spawning To Active',
        filePath: 'qualities/scpLifecycleSpawningToActive.quality.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
      {
        name: 'scpLifecycleActiveToDying',
        type: 'Scp Lifecycle Active To Dying',
        filePath: 'qualities/scpLifecycleActiveToDying.quality.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
      {
        name: 'scpLifecycleDyingToGone',
        type: 'Scp Lifecycle Dying To Gone',
        filePath: 'qualities/scpLifecycleDyingToGone.quality.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
      {
        name: 'scpLifecycleWindowClosed',
        type: 'Scp Lifecycle Window Closed',
        filePath: 'qualities/scpLifecycleWindowClosed.quality.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
    ],
    strategies: [],
    principles: [],
  },

  decks: {
    huirth: 'ScpLifecycleDeck',
    client: '',
  },
};
