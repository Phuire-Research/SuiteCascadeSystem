/**
 * scsBridgeRelaySpawn Quality · C407 · SQRK — the Serialized-Queue Relay Kind (spawn).
 *
 * THE ASTO COLLAPSE (Atomic Spawn-Topic-Operation · S2 naming, S3 ruling): ONE spec =
 * ONE primed worker. The relay body composes the ENTIRE per-topic sequence inside a
 * single relay block — create → LINCHPIN → spawn → the launched gate (SSCL Stage 2) →
 * the priming delivery awaited to CLI-exit (the ensure-sent mechanism: the detached
 * `scs sendMessage` child exits only AFTER the Electron singleton's executeFkis returns,
 * which is AFTER the CR submit + reconcile + focus-return) — so the queue's next head
 * NEVER opens mid-typing. This seals the full-sweep interleave (C406): spawns previously
 * pre-fired OUTSIDE the queue and stole focus mid-stream.
 *
 * ULFK dissolves here: the ULID is born and consumed inside this body — no downstream
 * spec ever needs it. DSCF is self-contained: a failed/timed-out leg skips its own
 * remaining legs, logs the named guard, and unblocks — the next topic proceeds.
 *
 * MISO (the Epoch deliverable): N of these specs — N DIFFERENT suite8Names — drained
 * serially through the one OS-focus channel = many Suite 8 instances operated at once.
 *
 * PKDM · SPAWN_RELAY_BLOCK_MAX_MS = 60s (a cold Electron + CC boot is 5-15s, the 6.6KB
 * stream + CR + reconcile rides on top). LEGAL only because the RQPOAD drain now
 * refreshActions the head at dispatch (the Action-Validity Doctrine — without the
 * drain-refresh, every queued head behind this relay would expire at 5000ms).
 *
 * WORKER-ONLY by default (asWorker defaults TRUE): anchors keep the full liveness
 * three-branch of scsBridgeSpawnSuite8Session (C385/C386) — this kind mirrors ONLY the
 * proven worker path (createSession → setSessionSuite8Name → setSessionModel →
 * setSessionWorker → spawnElectronSessionForUlid · the LINCHPIN ordering, citation
 * scsBridgeSpawnSuite8Session.quality.huirth.ts:203-247).
 *
 * TQNI 4-site byte-match for 'Scs Bridge Relay Spawn':
 *   (a) ScsBridgeRelaySpawnPayload (scsBridge.types.ts)
 *   (b) Quality alias ScsBridgeRelaySpawn (scsBridge.types.ts)
 *   (c) this `type:` literal
 *   (d) registration key scsBridgeRelaySpawn (scsBridge.concept.ts)
 *
 * Citation: scsBridgeRelaySendMessage.quality.huirth.ts (the relay template · block +
 * async body + Promise.race + finally→relayUnblock) · S1-RELAY-QUEUE-CURATION.md ·
 * S2-SPAWN-RELAY-NAMING.md.
 */

import {
  createQualityCardWithPayload,
  createAsyncMethodWithConcepts,
  selectPayload,
  strategySuccess,
} from 'stratimux';
import type {
  ScsBridgeState,
  ScsBridgeRelaySpawnPayload,
  ScsBridgeRelaySpawn,
} from '../scsBridge.types';
import { createSession } from '../../../manager';
import {
  setSessionSuite8Name,
  setSessionModel,
  setSessionWorker,
  setSessionSuppressOnboard,
  listSessions,
} from '../../../registry';
import { spawnElectronSessionForUlid } from '../../../electronSessionSpawn';
import { dispatchFkisMessage } from '../../../electronMessageDispatch';
import { log } from '../../../debugLog';
import { relayUnblock } from '../model/messageRelayQueBridge.model';

export type { ScsBridgeRelaySpawn };

// PKDM · the spawn kind's own deadline (see the header — legal via the drain-refresh).
const SPAWN_RELAY_BLOCK_MAX_MS = Number(
  process.env.SCS_RELAY_SPAWN_BLOCK_MAX_MS ?? 60_000,
);
// SSCL Stage-2 gate bounds: the registry entry flips status='launched' on the first
// PTY boot byte (session.ts PDFL). Cold boots observed 3-15s.
const LAUNCHED_POLL_INTERVAL_MS = 300;
const LAUNCHED_POLL_BUDGET_MS = 20_000;
// The prime leg's own ceiling INSIDE the outer deadline (CLI-exit normally < 15s).
const PRIME_EXIT_BUDGET_MS = 30_000;

/** Bounded backstop: resolves after ms so Promise.race can never hang forever. */
const deadline = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const scsBridgeRelaySpawn = createQualityCardWithPayload<
  ScsBridgeState,
  ScsBridgeRelaySpawnPayload
>({
  type: 'Scs Bridge Relay Spawn',
  // D1: block + dequeue head synchronously, in ONE atomic partial return.
  reducer: (state) => ({
    relayBlocked: true,
    messageRelayQue: state.messageRelayQue.slice(1),
  }),
  methodCreator: () =>
    createAsyncMethodWithConcepts(({ controller, action, concepts_, deck }) => {
      const { suite8Name, text, originScpName, scpName, asWorker, model } =
        selectPayload<ScsBridgeRelaySpawnPayload>(action);

      const relaySequence = async (): Promise<void> => {
        log('fkis.method.entered', { suite8Name, kind: 'relaySpawn' });
        if (typeof suite8Name !== 'string' || suite8Name.length === 0) {
          log('scsbridge.relaySpawn.skipped', { reason: 'missing-suite8Name' });
          return;
        }
        // ── LEG 1 · THE SPAWN (the proven worker path · LINCHPIN ordering) ──
        let sessionId: string;
        try {
          const created = await createSession({
            scpName: scpName ?? undefined,
            suite8Name,
          });
          sessionId = created.sessionId;
          await setSessionSuite8Name(sessionId, suite8Name);
          await setSessionModel(sessionId, model);
          if (asWorker !== false) {
            await setSessionWorker(sessionId);
          }
          // THE BARE-WORKER LAW (the FrontierTest5 catch · the Tool's Means): a relay-spawned
          // researcher is NEVER seeded — its Vermillion prime (Leg 2/3) IS its directive. The
          // citizen stamp above already scopes the Onboard predicate; this is the explicit
          // belt so a stamp-less edge can never seed a worker. Best-effort (never blocks).
          try {
            await setSessionSuppressOnboard(sessionId, true);
          } catch (suppressErr) {
            log('scsbridge.relaySpawn.suppress-onboard-failed', {
              sessionId,
              error: suppressErr instanceof Error ? suppressErr.message.slice(0, 200) : String(suppressErr),
            });
          }
          spawnElectronSessionForUlid(sessionId);
          log('scsbridge.relaySpawn.spawned', { suite8Name, sessionId });
        } catch (err) {
          log('scsbridge.relaySpawn.spawn-failed', {
            suite8Name,
            error: err instanceof Error ? err.message : String(err),
          });
          return; // DSCF self-contained: no prime for a failed spawn; unblock via finally.
        }
        // ── LEG 2 · THE LAUNCHED GATE (SSCL Stage 2 · registry status poll) ──
        let launched = false;
        {
          const gateDeadline = Date.now() + LAUNCHED_POLL_BUDGET_MS;
          while (Date.now() < gateDeadline) {
            try {
              const sessions = await listSessions();
              const entry = sessions.find((s) => s.id === sessionId);
              if (entry?.status === 'launched') {
                launched = true;
                break;
              }
            } catch {
              /* transient registry read — keep polling */
            }
            await sleep(LAUNCHED_POLL_INTERVAL_MS);
          }
          log('scsbridge.relaySpawn.launched-gate', {
            suite8Name,
            sessionId,
            launched,
            budgetMs: LAUNCHED_POLL_BUDGET_MS,
          });
          if (!launched) {
            // DSCF: never stream into a session that never booted; the next topic proceeds.
            return;
          }
        }
        // ── LEG 3 · THE PRIME (awaited to CLI-exit — the ensure-sent mechanism).
        // Stage-3 terminal-readiness rides executeFkis's OWN gates (the ping readiness
        // poll + the C402 textarea-focus Concluder) inside the singleton; the detached
        // child's exit is the receipt that the CR submitted and focus returned.
        if (typeof text === 'string' && text.length > 0) {
          // ULFK at the CONTENT level: the priming may embed the worker's OWN ULID
          // (the self-dissipate leg of the research Vermillion). The caller cannot know
          // it at enqueue — the placeholder is substituted HERE, where the ULID is born.
          const primeText = text.split('{{SCS_WORKER_ULID}}').join(sessionId);
          await new Promise<void>((resolve) => {
            let settled = false;
            const settle = (mode: string, code: number | null): void => {
              if (settled) return;
              settled = true;
              log('scsbridge.relaySpawn.primed', {
                suite8Name,
                sessionId,
                textLength: text.length,
                mode,
                exitCode: code,
              });
              resolve();
            };
            try {
              const child = dispatchFkisMessage(
                { targetUlid: sessionId, text: primeText, originScpName: originScpName ?? '' },
                {
                  onError: (err) => {
                    log('scsbridge.relaySpawn.prime-error', {
                      suite8Name,
                      sessionId,
                      error: err.message,
                    });
                    settle('spawn-error', null);
                  },
                },
              );
              child.on('exit', (code) => settle('cli-exit', code));
              child.on('error', () => settle('cli-error', null));
              // The prime leg's own ceiling — a wedged CLI never holds the queue to the
              // outer deadline alone.
              setTimeout(() => settle('prime-exit-budget', null), PRIME_EXIT_BUDGET_MS);
            } catch (err) {
              log('scsbridge.relaySpawn.prime-error', {
                suite8Name,
                sessionId,
                error: err instanceof Error ? err.message : String(err),
              });
              settle('dispatch-throw', null);
            }
          });
        } else {
          log('scsbridge.relaySpawn.no-prime-text', { suite8Name, sessionId });
        }
      };

      void (async (): Promise<void> => {
        try {
          await Promise.race([relaySequence(), deadline(SPAWN_RELAY_BLOCK_MAX_MS)]);
        } catch (err) {
          log('scsbridge.relaySpawn.error', {
            suite8Name,
            message: String(err),
          });
        } finally {
          // H1: UnBlock on EVERY exit path (success | caught error | deadline).
          relayUnblock(concepts_, deck as never, 0);
        }
      })();

      // Strategy continuation LAST (GAP-3 · the relaySendMessage precedent).
      if (action.strategy) {
        controller.fire(strategySuccess(action.strategy));
      }
    }),
});
