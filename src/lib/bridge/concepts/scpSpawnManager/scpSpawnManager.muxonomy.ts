/**
 * scpSpawnManager Muxonomy Configuration · Phase B.0 · Cycle 128
 *
 * Template: ADMIN_ICP/src/concepts/icp/icp.muxonomy.ts (MuxonomicConfig pattern · multi-field exclusion)
 * SCP-specific: consumer-facing Maps (animatedTui.ts:358,361-363) + serializable metadata
 *
 * State audit (R4 §1 Angle 2 + consumer signature):
 *   - userCwd: string                                                   → serializable · no exclusion
 *   - spawnsByScp: Map<string, ScpSpawnEntry>                           → NON-SERIALIZABLE · EXCLUDED
 *   - interactiveSessionsByScp: Map<string, Map<string, number>>        → NON-SERIALIZABLE · EXCLUDED
 *   - processMetadataByScp: Record<string, ProcessMetadata>             → serializable · no exclusion
 *   - pendingByScp: Record<string, PendingByScpEntry>                   → serializable · no exclusion
 *   - allocatedPorts: number[]                                          → serializable · no exclusion
 *
 * filterKeys: ['spawnsByScp', 'interactiveSessionsByScp']
 *
 * Rationale:
 *   - spawnsByScp: JS Map · consumer signature at animatedTui.ts:358 reads via DECK K
 *     direct access (no serialization path). Phase B.4 principle populates via spawn
 *     Quality; muxonomy registry MUST exclude from sync.
 *   - interactiveSessionsByScp: nested JS Map (Map of Maps) · same rationale.
 *     animatedTui.ts:361-363 consumer reads via DECK K · serialization would silently
 *     drop both outer + inner Map entries.
 *
 * R4 NOTE on Maps vs Records: R3 blueprint converted `Set<number>` → `number[]` for
 * allocatedPorts (R4 Angle 2 row 49 confirms "R3 made the right call"). The Maps
 * at spawnsByScp/interactiveSessionsByScp remained because consumer signatures at
 * animatedTui.ts:358,361-363 require Map semantics (size, .get, .set, .delete).
 *
 * MMUI Pearl Reference: Phase B.4 principle holds the actual ChildProcess instances
 * in a MODULE-LEVEL Map (NOT in concept state) per MMUI doctrine — state holds
 * serializable metadata only. The Maps excluded here (spawnsByScp,
 * interactiveSessionsByScp) hold serializable VALUES (ScpSpawnEntry / number) but
 * their CONTAINER is Map; the filterKeys exclusion addresses the container's
 * serialization gap, not the values.
 *
 * Phase B.0 scope: muxonomy declaration only · empty demometer rosters.
 * Phase B.4 will populate qualities + principles for child_process.spawn wiring
 * (spawn + processStarted + processExited + kill + teardown).
 *
 * Citation: M60 State-or-Payload Anor (state-resident with filterKeys exclusion)
 * Citation: M61 Project-Totality Authoritative Scope · M63 Copy-Paste-Plus Canonical
 * Citation: R4 SUITE-4-GREEN-COPY-PASTE-PLUS-BIDIRECTIONAL.md §1 Angle 2
 * Citation: scpSpawnManager.type.ts:60-67 (Map<K,V> state declarations + consumer sigs)
 * Citation: MMUI Pearl term (Master Diamond) — module-level ChildProcess Map
 */

import {
  type MuxonomicConfig,
  ChangeDetectionMode,
  DeploymentTarget,
} from '../muxonomy/muxonomy.model';

import { scpSpawnManagerName } from './scpSpawnManager.type';

export const scpSpawnManagerMuxonomy: MuxonomicConfig<'scpSpawnManager'> = {
  conceptName: scpSpawnManagerName,

  filterKeys: [
    'spawnsByScp',
    'interactiveSessionsByScp',
  ],

  novelChange: {
    mode: ChangeDetectionMode.KeyedSelector,
  },

  sync: {
    direction: 'toClient',
    filterKeys: [
      'spawnsByScp',
      'interactiveSessionsByScp',
    ],
    novelChange: {
      mode: ChangeDetectionMode.KeyedSelector,
    },
  },

  demometers: {
    qualities: [
      {
        name: 'scpSpawnManagerSpawnRequested',
        type: 'Scp Spawn Manager Spawn Requested',
        filePath: 'qualities/scpSpawnManagerSpawnRequested.quality.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
      {
        name: 'scpSpawnManagerSpawnSucceeded',
        type: 'Scp Spawn Manager Spawn Succeeded',
        filePath: 'qualities/scpSpawnManagerSpawnSucceeded.quality.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
      {
        name: 'scpSpawnManagerSpawnExited',
        type: 'Scp Spawn Manager Spawn Exited',
        filePath: 'qualities/scpSpawnManagerSpawnExited.quality.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
      {
        name: 'scpSpawnManagerSpawnErrored',
        type: 'Scp Spawn Manager Spawn Errored',
        filePath: 'qualities/scpSpawnManagerSpawnErrored.quality.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
      {
        name: 'scpSpawnManagerHeartbeatReceived',
        type: 'Scp Spawn Manager Heartbeat Received',
        filePath: 'qualities/scpSpawnManagerHeartbeatReceived.quality.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
      {
        name: 'scpSpawnManagerKillRequested',
        type: 'Scp Spawn Manager Kill Requested',
        filePath: 'qualities/scpSpawnManagerKillRequested.quality.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
    ],
    strategies: [],
    principles: [],
  },

  decks: {
    huirth: 'ScpSpawnManagerDeck',
    client: '',
  },
};
