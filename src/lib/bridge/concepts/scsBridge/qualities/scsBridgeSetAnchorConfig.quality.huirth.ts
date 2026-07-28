/**
 * scsBridgeSetAnchorConfig · SAC.3 · scs_set_anchor_config MCP tool
 *
 * The "Set Auto-Anchor" USER OVERRIDE write leg for the per-page Anchor System. Keyed by
 * suite8Name (NDEP · the literal Cascades/Extended/<name>/ dir Name · NOT a session ULID).
 * The Method calls writeAnchorOverride(suite8Name, autoAnchor) — writes
 * Cascades/Extended/<suite8Name>/anchor.override.json = { autoAnchor }. menu.json is READ-ONLY
 * here (only the Anchor writes the menu-creator default); the bridge writes ONLY the override.
 *
 * Form-α (Method+Reducer). Reducer returns {} · no own-state mutation. Set-anchor-config is a
 * side-effect-only operation (ACK-OD pattern) — the writeAnchorOverride FS write IS the Lambda;
 * resolveAnchorConfig reads it on the NEXT claimAnchorIfUnclaimed (a page set autoAnchor:false
 * does NOT auto-stamp its spawn). The Method no-ops gracefully on a blank suite8Name / a write
 * failure (swallowed + logged).
 *
 * Template: scsBridgeUnsetSessionAnchor.quality.huirth.ts (form-α + FS side-effect · ACK-OD)
 * Citation: anchorConfig.model.ts writeAnchorOverride (SAC.3) · SAC-WGB.md § ◆ SAC.3
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
  ScsBridgeSetAnchorConfigPayload,
  ScsBridgeSetAnchorConfig,
} from '../scsBridge.types';
import { writeAnchorOverride } from '../model/anchorConfig.model';
import { log } from '../../../debugLog';

export type { ScsBridgeSetAnchorConfig };

export const scsBridgeSetAnchorConfig = createQualityCardWithPayload<
  ScsBridgeState,
  ScsBridgeSetAnchorConfigPayload
>({
  type: 'Scs Bridge Set Anchor Config',
  reducer: () => ({}),
  methodCreator: () =>
    createMethodWithConcepts(({ action }) => {
      const payload = selectPayload<ScsBridgeSetAnchorConfigPayload>(action);
      const { suite8Name, autoAnchor } = payload;

      // Guard: suite8Name is the page key. Bail on blank — never synthesize a fallback key.
      if (typeof suite8Name !== 'string' || suite8Name.trim().length === 0) {
        console.error('[Scs Bridge] SetAnchorConfig invalid suite8Name · skipping');
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }
      if (typeof autoAnchor !== 'boolean') {
        console.error('[Scs Bridge] SetAnchorConfig non-boolean autoAnchor · skipping');
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }

      log('scsbridge.setAnchorConfig.dispatched', { suite8Name, autoAnchor });
      console.log('[SCS-Bridge SET-ANCHOR-CONFIG] dispatched · suite8Name=', suite8Name, '· autoAnchor=', autoAnchor);

      // Side-effect-only · fire-and-forget (ACK-OD sibling pattern). The writeAnchorOverride FS
      // write IS the Lambda; resolveAnchorConfig reads it on the next claimAnchorIfUnclaimed.
      void (async (): Promise<void> => {
        try {
          writeAnchorOverride(suite8Name, autoAnchor);
          log('scsbridge.setAnchorConfig.written', { suite8Name, autoAnchor });
          console.log('[SCS-Bridge SET-ANCHOR-CONFIG] written · suite8Name=', suite8Name, '· autoAnchor=', autoAnchor);
        } catch (err) {
          const m = err instanceof Error ? err.message : String(err);
          log('scsbridge.setAnchorConfig.error', { suite8Name, message: m });
          console.error('[SCS-Bridge SET-ANCHOR-CONFIG] error · suite8Name=', suite8Name, '· error=', m);
        }
      })();

      return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
    }),
});
