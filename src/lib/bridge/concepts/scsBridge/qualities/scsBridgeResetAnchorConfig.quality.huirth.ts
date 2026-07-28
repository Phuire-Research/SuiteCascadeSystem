/**
 * scsBridgeResetAnchorConfig · SAC.3 · scs_reset_anchor_config MCP tool
 *
 * The "Reset to Default" write leg for the per-page Anchor System. Keyed by suite8Name (NDEP ·
 * the literal Cascades/Extended/<name>/ dir Name · NOT a session ULID). The Method calls
 * deleteAnchorOverride(suite8Name) — removes Cascades/Extended/<suite8Name>/anchor.override.json
 * so the page reverts to the menu-creator default (resolveAnchorConfig falls through to
 * menu.anchorConfig.autoAnchor ?? system default true). menu.json is NEVER touched.
 *
 * Form-α (Method+Reducer). Reducer returns {} · no own-state mutation. Reset-anchor-config is a
 * side-effect-only operation (ACK-OD pattern) — the deleteAnchorOverride unlink IS the Lambda.
 * AFPR: a missing override file is a graceful no-op (rmSync force:true). The Method no-ops
 * gracefully on a blank suite8Name / a delete failure (swallowed + logged). Faithful sibling of
 * scsBridgeSetAnchorConfig minus the autoAnchor value.
 *
 * Template: scsBridgeSetAnchorConfig.quality.huirth.ts (form-α + FS side-effect · ACK-OD)
 * Citation: anchorConfig.model.ts deleteAnchorOverride (SAC.3) · SAC-WGB.md § ◆ SAC.3
 */

import {
  createQualityCardWithPayload,
  createMethodWithConcepts,
  selectPayload,
  muxiumConclude,
  strategySuccess,
} from 'stratimux';
import type {
  ScsBridgeState,
  ScsBridgeResetAnchorConfigPayload,
  ScsBridgeResetAnchorConfig,
} from '../scsBridge.types';
import { deleteAnchorOverride } from '../model/anchorConfig.model';
import { log } from '../../../debugLog';

export type { ScsBridgeResetAnchorConfig };

export const scsBridgeResetAnchorConfig = createQualityCardWithPayload<
  ScsBridgeState,
  ScsBridgeResetAnchorConfigPayload
>({
  type: 'Scs Bridge Reset Anchor Config',
  reducer: () => ({}),
  methodCreator: () =>
    createMethodWithConcepts(({ action }) => {
      const payload = selectPayload<ScsBridgeResetAnchorConfigPayload>(action);
      const { suite8Name } = payload;

      // Guard: suite8Name is the page key. Bail on blank — never synthesize a fallback key.
      if (typeof suite8Name !== 'string' || suite8Name.trim().length === 0) {
        console.error('[Scs Bridge] ResetAnchorConfig invalid suite8Name · skipping');
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }

      log('scsbridge.resetAnchorConfig.dispatched', { suite8Name });
      console.log('[SCS-Bridge RESET-ANCHOR-CONFIG] dispatched · suite8Name=', suite8Name);

      // Side-effect-only · fire-and-forget (ACK-OD sibling pattern). The deleteAnchorOverride
      // unlink IS the Lambda; the page reverts to the menu-creator default on the next resolve.
      void (async (): Promise<void> => {
        try {
          deleteAnchorOverride(suite8Name);
          log('scsbridge.resetAnchorConfig.deleted', { suite8Name });
          console.log('[SCS-Bridge RESET-ANCHOR-CONFIG] deleted · suite8Name=', suite8Name);
        } catch (err) {
          const m = err instanceof Error ? err.message : String(err);
          log('scsbridge.resetAnchorConfig.error', { suite8Name, message: m });
          console.error('[SCS-Bridge RESET-ANCHOR-CONFIG] error · suite8Name=', suite8Name, '· error=', m);
        }
      })();

      return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
    }),
});
