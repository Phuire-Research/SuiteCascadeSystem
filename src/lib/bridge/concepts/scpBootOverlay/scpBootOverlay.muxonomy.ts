/**
 * scpBootOverlay Muxonomy Configuration · Boot Overlay Diamond
 *
 * Template: scpLifecycle.muxonomy.ts (B.3 inherited)
 *
 * State audit:
 *   - overlays:              Map<string, ScpOverlayEntry>  → NON-SERIALIZABLE (Map) · EXCLUDED
 *   - activeOverlayScpName:  string | null                 → server-side only · EXCLUDED
 *
 * Both fields are server-side render state. animatedTui.ts reads via DECK K direct
 * access (no serialization path); client sync deliberately excludes them.
 *
 * Citation: M60 State-or-Payload Anor (state-resident with filterKeys exclusion)
 * Citation: SUITE-3-YELLOW-BOOT-OVERLAY-BLUEPRINT.md §2 Muxonomy
 */

import {
  type MuxonomicConfig,
  ChangeDetectionMode,
  DeploymentTarget,
} from '../muxonomy/muxonomy.model';

import { scpBootOverlayName } from './scpBootOverlay.type';

export const scpBootOverlayMuxonomy: MuxonomicConfig<'scpBootOverlay'> = {
  conceptName: scpBootOverlayName,

  filterKeys: [
    'overlays',
    'activeOverlayScpName',
  ],

  novelChange: {
    mode: ChangeDetectionMode.KeyedSelector,
  },

  sync: {
    direction: 'toClient',
    filterKeys: [
      'overlays',
      'activeOverlayScpName',
    ],
    novelChange: {
      mode: ChangeDetectionMode.KeyedSelector,
    },
  },

  demometers: {
    qualities: [
      {
        name: 'scpBootOverlayAppendLine',
        type: 'Scp Boot Overlay Append Line',
        filePath: 'qualities/scpBootOverlayAppendLine.quality.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
      {
        name: 'scpBootOverlayShow',
        type: 'Scp Boot Overlay Show',
        filePath: 'qualities/scpBootOverlayShow.quality.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
      {
        name: 'scpBootOverlayDismiss',
        type: 'Scp Boot Overlay Dismiss',
        filePath: 'qualities/scpBootOverlayDismiss.quality.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
      {
        name: 'scpBootOverlayRestPeriodElapsed',
        type: 'Scp Boot Overlay Rest Period Elapsed',
        filePath: 'qualities/scpBootOverlayRestPeriodElapsed.quality.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
    ],
    strategies: [],
    principles: [],
  },

  decks: {
    huirth: 'ScpBootOverlayDeck',
    client: '',
  },
};
