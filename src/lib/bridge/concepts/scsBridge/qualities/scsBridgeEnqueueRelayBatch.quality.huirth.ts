/**
 * scsBridgeEnqueueRelayBatch · SBMRQ Enqueue-Batch Builder Quality · MVP-RC3 Build B
 *
 * The MCP-facing server-side Action builder. The Cadmium research sweep ENQUEUES a
 * per-topic batch of relay operations onto messageRelayQue so "Research All" can fire
 * workers in rapid succession while the bridge serializes the focus/keystroke relays
 * (no OS-focus collision when many workers exist).
 *
 * ── THE LOAD-BEARING FINDING (why this Quality exists) ──
 * The MCP dispatch path is byte-for-byte (scpToolManifold.strategy.ts:92-96):
 *   const qualityEmitter = conceptDeck.e; const qualityAction = qualityEmitter[meta.qualityName](params);
 * The JSON-RPC `arguments` object IS the Quality payload, passed verbatim. A runtime
 * Stratimux Action carries a strategy, expiration, and emitter closures — it is NOT
 * JSON-serializable as an MCP argument. So scsBridgeRelayEnqueue ({ actions: Action[] })
 * CANNOT be the MCP-facing Quality. Instead this Quality takes JSON-SAFE relay specs
 * [{ kind, sessionId, text?, scalePct? }], BUILDS the real relay Actions inside its
 * Method via deck.scsBridge.e.scsBridgeRelay<Kind>({...}), then dispatches
 * scsBridgeRelayEnqueue({ actions }) on the same muxium. ONE new Quality; the rest is wiring.
 *
 * ── Reducer () => ({}) ── no own-state mutation. The dispatched scsBridgeRelayEnqueue
 * mutates messageRelayQue. Mirrors scsBridgeSpawnSuite8Session.quality.huirth.ts:51.
 *
 * ── Method (createMethodWithConcepts · gets action + concepts_ + deck) ──
 * Builds the Action[] from specs, then DECK-DEFERS the enqueue dispatch via
 * muxiumTimeOut (mirrors relayUnblock · messageRelayQueBridge.model.ts:43-47).
 * WHY deck-deferral, not inline: this Method runs inside the SCP Quality Manifold —
 * its own Action carries a strategy whose Return node sends the MCP response.
 * Dispatching scsBridgeRelayEnqueue synchronously would re-enter the muxium mid-wind-up
 * (same RangeError class PPOL-WUD guards). muxiumTimeOut schedules the enqueue on the
 * Tail-Whip timer AFTER this builder settles; the MCP `ok` ACK returns immediately; the
 * enqueue lands a macrotask later; the RQPOAD drain Principle serializes the relays.
 *
 * TQNI 4-site byte-match for 'Scs Bridge Enqueue Relay Batch':
 *   (a) ScsBridgeEnqueueRelayBatchPayload (scsBridge.types.ts)
 *   (b) Quality alias ScsBridgeEnqueueRelayBatch (scsBridge.types.ts)
 *   (c) this `type:` literal
 *   (d) registration key scsBridgeEnqueueRelayBatch (scsBridge.concept.ts)
 *
 * Citation: MRQ-BUILD-B-WGB.md §1.1 · scsBridgeRelayEnqueue.quality (enqueue target) ·
 * scsBridgeFocusUrlWindow.quality.huirth.ts (createMethodWithConcepts form) ·
 * messageRelayQueBridge.model.ts (muxiumTimeOut deck-deferral pattern).
 */

import {
  createQualityCardWithPayload,
  createMethodWithConcepts,
  selectPayload,
  muxiumTimeOut,
  muxiumConclude,
  strategySuccess,
  strategyData_muxifyData,
  type AnyAction,
} from 'stratimux';
import type {
  ScsBridgeState,
  ScsBridgeEnqueueRelayBatchPayload,
  ScsBridgeEnqueueRelayBatch,
} from '../scsBridge.types';
import { log } from '../../../debugLog';

export type { ScsBridgeEnqueueRelayBatch };

export const scsBridgeEnqueueRelayBatch = createQualityCardWithPayload<
  ScsBridgeState,
  ScsBridgeEnqueueRelayBatchPayload
>({
  type: 'Scs Bridge Enqueue Relay Batch',
  reducer: () => ({}),
  methodCreator: () =>
    createMethodWithConcepts(({ action, concepts_, deck }) => {
      const { specs, originScpName } = selectPayload<ScsBridgeEnqueueRelayBatchPayload>(action);
      // Cast through unknown (Deck<C> does not structurally overlap the narrow emitter
      // shape we reach) — same loose-deck discipline the relay Methods use (deck as never).
      const d = deck as unknown as {
        scsBridge: {
          e: {
            scsBridgeRelayFocus: (p: { sessionId: string }) => AnyAction;
            scsBridgeRelaySendMessage: (p: { sessionId: string; text: string; originScpName?: string }) => AnyAction;
            scsBridgeRelayResize: (p: { sessionId: string; scalePct: number }) => AnyAction;
            scsBridgeRelaySpawn: (p: { suite8Name: string; text?: string; originScpName?: string; scpName?: string; asWorker?: boolean; model?: string }) => AnyAction;
            scsBridgeRelayEnqueue: (p: { actions: AnyAction[] }) => AnyAction;
          };
        };
      };
      const actions: AnyAction[] = [];
      // C408 · THE SILENT SWITCH cured (guard-telemetry law): every spec that builds NO
      // action names itself — a zero-built batch can never again masquerade as dispatched.
      const misses: Array<{ index: number; kind: string; reason: string }> = [];
      (specs ?? []).forEach((spec, index) => {
        if (!spec || typeof spec.kind !== 'string') {
          misses.push({ index, kind: String(spec?.kind ?? 'undefined'), reason: 'malformed-spec' });
          return;
        }
        // C408 · THE KIND-AWARE IDENTITY GUARD (the C407 root): the 'spawn' kind CREATES
        // its session — sessionId '' is its designed shape (ULFK · the ULID is born inside
        // the relay body). The prior unconditional empty-sessionId guard dropped EVERY
        // spawn spec before the switch saw its kind — silently ({specCount:4, actionCount:0}).
        if (spec.kind !== 'spawn' && (typeof spec.sessionId !== 'string' || spec.sessionId.length === 0)) {
          misses.push({ index, kind: spec.kind, reason: 'missing-sessionId' });
          return;
        }
        const builtBefore = actions.length;
        switch (spec.kind) {
          case 'focus':
            actions.push(d.scsBridge.e.scsBridgeRelayFocus({ sessionId: spec.sessionId }));
            break;
          case 'send':
            if (typeof spec.text === 'string' && spec.text.length > 0) {
              // C403 · the batch origin rides every send relay (the focus-return lane).
              actions.push(
                d.scsBridge.e.scsBridgeRelaySendMessage({
                  sessionId: spec.sessionId,
                  text: spec.text,
                  originScpName: typeof originScpName === 'string' && originScpName.length > 0 ? originScpName : undefined,
                }),
              );
            }
            break;
          case 'resize':
            if (typeof spec.scalePct === 'number') {
              actions.push(
                d.scsBridge.e.scsBridgeRelayResize({ sessionId: spec.sessionId, scalePct: spec.scalePct }),
              );
            }
            break;
          case 'spawn':
            // C407 · SQRK — the ASTO spec: suite8Name addresses the worker-to-be (the
            // ULID is born inside the relay body); the batch origin rides for the
            // focus-return; text is the priming delivered after the launched gate.
            if (typeof spec.suite8Name === 'string' && spec.suite8Name.length > 0) {
              actions.push(
                d.scsBridge.e.scsBridgeRelaySpawn({
                  suite8Name: spec.suite8Name,
                  text: typeof spec.text === 'string' && spec.text.length > 0 ? spec.text : undefined,
                  originScpName: typeof originScpName === 'string' && originScpName.length > 0 ? originScpName : undefined,
                  // THE WORKER CITIZEN STAMP (the FrontierTest5 catch): the worker's citizen —
                  // threaded as scpName so createSession stamps the entry and the citizen-scoped
                  // Onboard predicate SEES the own anchor (a stamp-less worker read as a new
                  // citizen and received the anchor's seed).
                  // D-SLE · THE EFFECTIVE LOCALITY STAMP takes precedence: the client stamps the
                  // spec's own scpName from the Effective Locality Law (specified-live target ??
                  // own citizen). Prefer the spec's per-spec stamp; fall back to the batch origin
                  // (the FrontierTest5 own-citizen default) when the spec carries none. The prior
                  // seat hard-coded originScpName and DISCARDED the spec's scpName — that stripping
                  // is why a specified-live locality's worker still spawned against the own citizen.
                  scpName:
                    typeof spec.scpName === 'string' && spec.scpName.length > 0
                      ? spec.scpName
                      : typeof originScpName === 'string' && originScpName.length > 0
                        ? originScpName
                        : undefined,
                  asWorker: spec.asWorker,
                  model: spec.model,
                }),
              );
            }
            break;
        }
        if (actions.length === builtBefore) {
          const reason =
            spec.kind === 'send' ? 'guard-failed-missing-text'
            : spec.kind === 'resize' ? 'guard-failed-missing-scalePct'
            : spec.kind === 'spawn' ? 'guard-failed-missing-suite8Name'
            : 'unknown-kind';
          misses.push({ index, kind: spec.kind, reason });
        }
      });

      log('scsbridge.enqueueRelayBatch.built', {
        specCount: specs?.length ?? 0,
        actionCount: actions.length,
        missCount: misses.length,
      });
      for (const miss of misses) {
        log('scsbridge.enqueueRelayBatch.spec-miss', miss);
      }

      if (actions.length > 0) {
        // Deck-deferral (muxiumTimeOut · OUTSIDE the single-use controller scope · GAP-3) —
        // mirrors relayUnblock's pattern. ONE enqueue dispatch carrying all built Actions.
        muxiumTimeOut(
          concepts_,
          () => d.scsBridge.e.scsBridgeRelayEnqueue({ actions }) as never,
          0,
        );
      }

      // C408 · THE HONEST ACK — the counts ride the strategy data into the MCP response
      // so a caller can distinguish RECEIVED from BUILT ("N dispatched" ended as a lie
      // when 4 specs built 0 actions and the ACK still said ok).
      return action.strategy
        ? strategySuccess(
            action.strategy,
            strategyData_muxifyData(action.strategy, {
              specCount: specs?.length ?? 0,
              actionCount: actions.length,
              missCount: misses.length,
            }),
          )
        : muxiumConclude();
    }),
});
