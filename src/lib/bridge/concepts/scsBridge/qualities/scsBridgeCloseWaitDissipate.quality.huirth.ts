/**
 * scsBridgeCloseWaitDissipate · CWDC · scs_close_wait_dissipate MCP tool
 *
 * The Close-Wait-Dissipate-Closure tool. Sibling to DISSIPATE
 * (scsBridgeDissipateSession) — but where DISSIPATE only reaps the registry +
 * .jsonl, CWDC performs the FULL GRACEFUL teardown the spawned research worker's
 * Vermillion Step 5 needs: it CLOSES the live pty, WAITS for the close to land,
 * DISSIPATES the registry entry (+ real .jsonl) and finally completes the deferred
 * SDTC (Session-Dir-Teardown-Closure) by removing the worker's session directory
 * under Cascades/Bridge/sessions/<ulid>/.
 *
 * Invoked by the SPAWNED RESEARCHER ITSELF as the final step of its handed
 * Vermillion: once the timestamped Markdown (+ paired JSON) is written, the worker
 * emits a 《scs_close_wait_dissipate》 SORD envelope naming its OWN session ULID.
 * Research spawns are non-anchor by the Epoch's architectural distinction — the
 * page's durable Setup/Chat Anchor is NEVER a research worker, and (S4 H2) MUST
 * NEVER be closed/dissipated. The anchor guard lives INSIDE dissipateSession's
 * chainWrite body (registry.ts): load → `if (entry?.isAnchor) return;` → filter →
 * save. The composed CLOSE leg adds a PRE-CHECK guard here so a (defensive)
 * anchor ULID is rejected BEFORE we ever dispatch the pty kill.
 *
 * COMPOSITION (the three legs + SDTC):
 *   - CLOSE (graceful · crosses the Electron boundary): dispatch the existing `kill`
 *     verb through killElectronSessionForUlid — the SAME bin/scs.js CSSP channel
 *     spawnElectronSessionForUlid uses for `open-session`. bin/scs.js relays `kill
 *     <ulid>` to the running Electron main → cli-handler `case 'kill'` →
 *     session.dispose() (ptyProcess.kill()) → sessionRegistry.remove(ulid).
 *     FALLBACK: if the CSSP channel is unreachable (Electron main not running /
 *     socket absent), the kill dispatch is a benign no-op — the worker's turn ends
 *     so its pty self-exits, and the durable artifacts (Markdown + JSON) are already
 *     on disk, so proceeding to dissipate + rmdir is data-safe. The kill dispatch is
 *     fire-and-forget (detached); a spawn-level error is logged, not thrown.
 *   - WAIT (bounded): a short fixed delay before the reap so the pty close has a
 *     window to land. We do NOT block indefinitely waiting on an exit signal (the
 *     CLOSE leg is detached); the bounded delay is sufficient and never hangs.
 *   - DISSIPATE: call the existing dissipateSession(sessionId) (registry.ts ·
 *     anchor-guarded · deletes the real .jsonl · removes the sessions.json entry ·
 *     atomic save). Reuses — does NOT duplicate — the reap logic.
 *   - SDTC: await fsp.rm(sessionDir(sessionId), { recursive:true, force:true }) to
 *     remove Cascades/Bridge/sessions/<ulid>/. This COMPLETES the deferred SDTC
 *     (DSST left the bridge-session dir benign-persistent). Wrapped in try/catch —
 *     benign if the dir is already gone.
 *
 * Form-α (Method+Reducer). Reducer returns {} · no own-state mutation. CWDC is a
 * side-effect-only operation (ACK-OD pattern) — the composed CLOSE→WAIT→DISSIPATE→
 * SDTC chain IS the Lambda; saveRegistry (inside dissipateSession) triggers the
 * sessions.json json-watcher relay → the SCP grid drops the entry. IDTND: sessionId
 * is the ULID lookup key, never mutated, never routed.
 *
 * Template: scsBridgeDissipateSession.quality.huirth.ts (form-α + registry side-effect)
 * Citation: registry.ts dissipateSession (anchor-guard · .jsonl delete · atomic save) ·
 *   electronSessionSpawn.ts killElectronSessionForUlid (CLOSE leg) · paths.ts sessionDir (SDTC)
 */

import {
  createQualityCardWithPayload,
  createMethodWithConcepts,
  selectPayload,
  muxiumConclude,
  strategySuccess,
} from 'stratimux';
import { promises as fsp } from 'node:fs';
import type {
  ScsBridgeState,
  ScsBridgeCloseWaitDissipatePayload,
  ScsBridgeCloseWaitDissipate,
} from '../scsBridge.types';
import { dissipateSession, loadRegistry } from '../../../registry';
import { killElectronSessionForUlid } from '../../../electronSessionSpawn';
import { sessionDir } from '../../../paths';
import { log } from '../../../debugLog';

export type { ScsBridgeCloseWaitDissipate };

// WAIT leg · bounded fixed delay (ms) between the CLOSE dispatch and the registry
// reap. Short enough to keep the worker's terminal step snappy, long enough for the
// detached `kill` CSSP relay to land. Never blocks indefinitely.
const CWDC_CLOSE_WAIT_MS = 600;

export const scsBridgeCloseWaitDissipate = createQualityCardWithPayload<
  ScsBridgeState,
  ScsBridgeCloseWaitDissipatePayload
>({
  type: 'Scs Bridge Close Wait Dissipate',
  reducer: () => ({}),
  methodCreator: () =>
    createMethodWithConcepts(({ action }) => {
      console.log('[SCS-Bridge CWDC] method fired');
      const payload = selectPayload<ScsBridgeCloseWaitDissipatePayload>(action);
      const { sessionId } = payload;

      // IDTND guard: sessionId is the ULID lookup key. Bail on empty — never
      // synthesize or fall back to any other field as a key.
      if (typeof sessionId !== 'string' || sessionId.length === 0) {
        console.error('[Scs Bridge] CloseWaitDissipate invalid sessionId · skipping');
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }

      log('scsbridge.cwdc.dispatched', { sessionId });
      console.log('[SCS-Bridge CWDC] dispatched · sessionId=', sessionId);

      // Side-effect-only · fire-and-forget per the DISSIPATE ACK-OD sibling pattern.
      // The composed CLOSE→WAIT→DISSIPATE→SDTC chain IS the Lambda. No own-state mutation.
      void (async (): Promise<void> => {
        try {
          // PRE-CHECK ANCHOR GUARD · S4 H2. dissipateSession's chainWrite body already
          // guards the anchor, but CLOSE (pty kill) happens BEFORE dissipate — so we
          // reject an anchor ULID here too, before we ever dispatch the kill. A research
          // worker passing its own non-anchor ULID always passes this guard.
          const registry = await loadRegistry();
          const entry = registry.sessions.find((s) => s.id === sessionId);
          if (entry?.isAnchor) {
            log('scsbridge.cwdc.rejected.is-anchor', { sessionId });
            console.log('[SCS-Bridge CWDC] rejected · is-anchor · sessionId=', sessionId);
            return;
          }

          // CLOSE (graceful · crosses the Electron boundary). Dispatch the `kill` verb
          // over the same bin/scs.js CSSP channel as open-session. Detached fire-and-forget;
          // a spawn-level error is logged (FALLBACK: pty self-exits at turn end · data-safe).
          killElectronSessionForUlid(sessionId, {
            onError: (err) => {
              log('scsbridge.cwdc.close.spawn-error', { sessionId, message: err.message });
              console.error('[SCS-Bridge CWDC] CLOSE spawn-error (fallback to self-exit) · sessionId=', sessionId, '· error=', err.message);
            },
          });
          log('scsbridge.cwdc.close.dispatched', { sessionId });
          console.log('[SCS-Bridge CWDC] CLOSE dispatched · sessionId=', sessionId);

          // WAIT (bounded) · give the detached kill a window to land before the reap.
          await new Promise<void>((resolve) => setTimeout(resolve, CWDC_CLOSE_WAIT_MS));

          // DISSIPATE · reuse the existing reap (anchor-guarded inside · .jsonl delete ·
          // sessions.json entry removal · atomic save · json-watcher relay).
          await dissipateSession(sessionId);
          log('scsbridge.cwdc.dissipated', { sessionId });
          console.log('[SCS-Bridge CWDC] DISSIPATED · sessionId=', sessionId);

          // SDTC · complete the deferred session-dir teardown. Benign if already gone.
          const dir = sessionDir(sessionId);
          try {
            await fsp.rm(dir, { recursive: true, force: true });
            log('scsbridge.cwdc.sdtc.removed', { sessionId, dir });
            console.log('[SCS-Bridge CWDC] SDTC removed session dir · sessionId=', sessionId, '· dir=', dir);
          } catch (rmErr) {
            const rm = rmErr instanceof Error ? rmErr.message : String(rmErr);
            log('scsbridge.cwdc.sdtc.error', { sessionId, dir, message: rm });
            console.error('[SCS-Bridge CWDC] SDTC rmdir error (benign) · sessionId=', sessionId, '· error=', rm);
          }
        } catch (err) {
          const m = err instanceof Error ? err.message : String(err);
          log('scsbridge.cwdc.error', { sessionId, message: m });
          console.error('[SCS-Bridge CWDC] error · sessionId=', sessionId, '· error=', m);
        }
      })();

      return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
    }),
});
