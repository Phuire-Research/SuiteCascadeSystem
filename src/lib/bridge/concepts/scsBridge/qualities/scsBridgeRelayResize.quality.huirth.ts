/**
 * scsBridgeRelayResize · SBMRQ Resize Relay Quality · MVP-RC3 D3 (RRRRQ)
 *
 * The queued window-resize relay. NEW logic — wraps the NEW resizeElectronSessionForUlid
 * CSSP helper (D2 substrate · scales the session's BrowserWindow bounds by scalePct via
 * the `resize` verb → cli-handler case 'resize' → BrowserWindow.setBounds). Byte-
 * structurally identical to scsBridgeRelayFocus — only the INNER relay logic (the resize
 * call) + the type-strings differ. Used by RRRRQ (Resume-Resize Render-Reset): an expand
 * (scalePct 1.10) then contract-back (0.909) pair forces a terminal redraw post-spawn.
 *
 * ── Reducer (D1 · block + dequeue in ONE synchronous atomic return) ──
 *   { relayBlocked: true, messageRelayQue: state.messageRelayQue.slice(1) }
 * Both keys commit atomically (one partial return) — no interleaving window. Shortest
 * Path · partial return · no spread. Next drain beat sees head gone + relayBlocked=true
 * → guard false → no double-fire (H3).
 *
 * ── Method (Conductor Resolution · watchdog INSIDE the Method) ──
 *   try { await Promise.race([ relaySequence(), deadline(RELAY_BLOCK_MAX_MS) ]); }
 *   catch {}  finally { relayUnblock(concepts_, deck, 0); }
 * - relaySequence() = resizeElectronSessionForUlid(sessionId, scalePct) (fire-and-forget
 *   CSSP relay · the cli-handler guards win && !win.isDestroyed() so a null/destroyed
 *   window no-ops safely — H1-aligned), plus RESIZE_SETTLE_FLOOR_MS render-settle (NORMAL
 *   intra-relay pacing · NOT the watchdog). The relay fires AFTER focus (queue ordering)
 *   so the window exists by resize time.
 * - deadline() = bounded backstop so a hung await can NEVER permanently stall (Halting-
 *   Complete). relayUnblock fires from `finally` on ALL THREE exits.
 *
 * createAsyncMethodWithConcepts supplies controller + concepts_ + deck together (GAP-2).
 * The UnBlock side-effect goes through relayUnblock (muxiumTimeOut · OUTSIDE the controller
 * scope · GAP-3), leaving the ONE controller.fire for strategySuccess.
 *
 * TQNI 4-site byte-match for 'Scs Bridge Relay Resize':
 *   (a) ScsBridgeRelayResizePayload (scsBridge.types.ts)
 *   (b) Quality alias ScsBridgeRelayResize (scsBridge.types.ts)
 *   (c) this `type:` literal
 *   (d) registration key scsBridgeRelayResize (scsBridge.concept.ts)
 *
 * MF-4 consts: RESIZE_SETTLE_FLOOR_MS (~300 · env-overridable) + RELAY_BLOCK_MAX_MS
 * (4000 · MF-5).
 *
 * Citation: scsBridgeRelayFocus.quality.huirth.ts (the relay template) ·
 * electronSessionSpawn.ts resizeElectronSessionForUlid (D2 CSSP resize substrate) ·
 * MRQ-DIAMOND-WGB.md §2.5 + §2.5a (Resize verb · BrowserWindow.setBounds)
 */

import {
  createQualityCardWithPayload,
  createAsyncMethodWithConcepts,
  selectPayload,
  strategySuccess,
} from 'stratimux';
import type {
  ScsBridgeState,
  ScsBridgeRelayResizePayload,
  ScsBridgeRelayResize,
} from '../scsBridge.types';
import { resizeElectronSessionForUlid } from '../../../electronSessionSpawn';
import { log } from '../../../debugLog';
import { relayUnblock } from '../model/messageRelayQueBridge.model';

export type { ScsBridgeRelayResize };

// MF-4 · resize-settle FLOOR (covers the setBounds→render micro-gap before the NEXT
// relay can fire · NORMAL intra-relay pacing, NOT the watchdog). Env-overridable so a
// headless drain Concluder runs sub-second (SCS_RELAY_SETTLE_FLOOR_MS=1).
const RESIZE_SETTLE_FLOOR_MS = Number(
  process.env.SCS_RELAY_SETTLE_FLOOR_MS ?? 300,
);

// MF-4/MF-5 · bounded deadlock backstop. Set < 5000 so a refreshAction'd queued head
// never out-waits its expiry behind this relay. The deadline() race resolves after this.
const RELAY_BLOCK_MAX_MS = 4000;

/** Bounded backstop: resolves after ms so Promise.race can never hang forever. */
const deadline = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const scsBridgeRelayResize = createQualityCardWithPayload<
  ScsBridgeState,
  ScsBridgeRelayResizePayload
>({
  type: 'Scs Bridge Relay Resize',
  // D1: block + dequeue head synchronously, in ONE atomic partial return.
  reducer: (state) => ({
    relayBlocked: true,
    messageRelayQue: state.messageRelayQue.slice(1),
  }),
  methodCreator: () =>
    createAsyncMethodWithConcepts(({ controller, action, concepts_, deck }) => {
      const { sessionId, scalePct } = selectPayload<ScsBridgeRelayResizePayload>(action);

      // relaySequence() = the NEW resize CSSP relay + the render-settle floor. NORMAL
      // intra-relay pacing; the deadline() race is the bounded backstop.
      const relaySequence = async (): Promise<void> => {
        // C382 L3 ENTRY LOG: the dark relay becomes observable. A future silent skip names
        // itself by this log's ABSENCE against a received toolcall (the C381 fingerprint).
        log('fkis.method.entered', { sessionId, kind: 'relayResize' });
        resizeElectronSessionForUlid(sessionId, scalePct, {
          onError: (err) =>
            log('scsbridge.relayResize.spawn-error', {
              sessionId,
              scalePct,
              error: err.message,
            }),
        });
        log('scsbridge.relayResize.completed', { sessionId, scalePct });
        await new Promise((resolve) => setTimeout(resolve, RESIZE_SETTLE_FLOOR_MS));
      };

      void (async (): Promise<void> => {
        try {
          await Promise.race([relaySequence(), deadline(RELAY_BLOCK_MAX_MS)]);
        } catch (err) {
          log('scsbridge.relayResize.error', { sessionId, message: String(err) });
        } finally {
          // H1: UnBlock on EVERY exit path (success | caught error | deadline).
          relayUnblock(concepts_, deck as never, 0);
        }
      })();

      // Strategy continuation LAST (GAP-3). In D1 heads dispatch bare → guard dormant.
      if (action.strategy) {
        controller.fire(strategySuccess(action.strategy));
      }
    }),
});
