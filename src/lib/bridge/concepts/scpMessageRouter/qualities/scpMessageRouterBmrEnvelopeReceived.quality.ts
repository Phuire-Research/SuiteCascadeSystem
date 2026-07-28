/**
 * scpMessageRouterBmrEnvelopeReceived · Phase B.2 · Cycle 130 (B.3 Cycle 131 KDDDB amendment)
 *
 * Method+Reducer+Bucket Quality. Dispatched by scpMessageRouter.principle.ts when
 * the sessionsDir watcher's 'add' handler matches an envelope file (regex:
 * /sessions\/heads\/.+\.json$/).
 *
 * Method: dedupe gate via consumedUlids selector. If ulid already consumed,
 *   pushes null to bucket (Reducer no-op). Otherwise pushes BmrBucketItem with
 *   trace fields + receivedAt timestamp.
 *
 * Reducer: pops bucket; if non-null, commits ulid to consumedUlids AND updates
 *   lastEnvelopeByKind[kind] with the trace. New-Set return ensures KeyedSelector
 *   change detection (R1 Card 9 · R4 Angle 4 verified).
 *
 * Phase B.3 KDDDB (Kind-Discriminated Downstream Dispatch Branch · Cycle 131):
 *   When envelope.kind === 'boot-request': strategyDetermine scpLifecycle
 *     .scpLifecycleIdleToSpawning to transition the FSM registered → booting.
 *   When envelope.kind === 'heartbeat':    strategyDetermine scpLifecycle
 *     .scpLifecycleSpawningToActive to transition the FSM booting → ready.
 *   Other kinds: fall through to muxiumConclude.
 *
 * Form-α (LOCKED in R3 §1.1): Method-upstream / Reducer-downstream. Upstream
 * Method dispatches via strategyDetermine; downstream Reducer transforms.
 * M62 Sequential ActionStream Core preserved (upstream Reducer commits first;
 * downstream action enters stream after).
 *
 * Deck widening: `ScpMessageRouterDownstreamDeck` (DADTE per R3 §3.12) — type-
 * honest cross-Concept access. tsc enforces e-surface payload contract.
 *
 * Template: B.1 scpRegistryDirectoryWatcherArm.quality.ts (Method+Reducer+Bucket)
 *           B.1 scpRegistryFsScpAdded.quality.ts (selectPayload Reducer pattern)
 *           ADMIN_ICP icpExecuteTool.quality.huirth.ts (strategyDetermine in Method)
 *
 * Citation: M59 ActionQue Inductive Reservation · M60 State-or-Payload Anor ·
 *           M62 Sequential ActionStream Core · M63 Copy-Paste-Plus
 * Citation: SUITE-1-RED-B2-MSGROUTER-CURATION.md §2 Card 9 (MEFRI dedup)
 * Citation: SUITE-2-ORANGE-B2-MSGROUTER-NAMING.md §3 Quality 2
 * Citation: SUITE-3-YELLOW-B2-MSGROUTER-BLUEPRINT.md §3.3
 * Citation: SUITE-3-YELLOW-B3-LIFECYCLE-BLUEPRINT.md §3.11 (KDDDB + DADTE)
 * Citation: SUITE-4-GREEN-B3-LIFECYCLE-BIDIRECTIONAL.md §3-§4 (M62 verified)
 */

import {
  createQualityCardWithPayload,
  createMethodWithConcepts,
  selectPayload,
  muxiumConclude,
  strategySuccess,
  strategyDetermine,
} from 'stratimux';
import type { ScpMessageRouterState } from '../scpMessageRouter.type';
import type {
  ScpMessageRouterBmrEnvelopeReceivedPayload,
  ScpMessageRouterBmrEnvelopeReceived,
  ScpMessageRouterDownstreamDeck,
} from './types';
import { log } from '../../../debugLog';

export type { ScpMessageRouterBmrEnvelopeReceived };

// Module-scoped Method→Reducer communication bucket
interface BmrBucketItem {
  ulid: string;
  kind: string;
  scpName: string;
  payload: unknown;
  receivedAt: number;
}

const bmrBucket: (BmrBucketItem | null)[] = [];

export const scpMessageRouterBmrEnvelopeReceived = createQualityCardWithPayload<
  ScpMessageRouterState,
  ScpMessageRouterBmrEnvelopeReceivedPayload,
  ScpMessageRouterDownstreamDeck
>({
  type: 'Scp Message Router Bmr Envelope Received',
  reducer: (state) => {
    const item = bmrBucket.pop();
    if (!item) {
      return {};
    }
    const newConsumed = new Set(state.consumedUlids);
    newConsumed.add(item.ulid);
    return {
      consumedUlids: newConsumed,
      lastEnvelopeByKind: {
        ...state.lastEnvelopeByKind,
        [item.kind]: {
          ulid: item.ulid,
          scpName: item.scpName,
          payload: item.payload,
          receivedAt: item.receivedAt,
        },
      },
    };
  },
  methodCreator: () =>
    createMethodWithConcepts(({ action, deck }) => {
      const { envelopePath, ulid, kind, scpName, payload } =
        selectPayload<ScpMessageRouterBmrEnvelopeReceivedPayload>(action);
      const consumed = deck.scpMessageRouter.k.consumedUlids.select();

      if (consumed.has(ulid)) {
        console.log('[Scp Message Router] ulid already consumed, skipping:', ulid, envelopePath);
        bmrBucket.push(null);
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }

      console.log('[Scp Message Router] routing envelope:', kind, 'from', scpName, 'ulid:', ulid);
      log('msgrouter.envelope.routing', { kind, scpName, ulid });
      bmrBucket.push({
        ulid,
        kind,
        scpName,
        payload,
        receivedAt: Date.now(),
      });

      // ─── B.3 KDDDB: form-α cross-Concept dispatch on recognized kinds ───
      const now = Date.now();
      if (kind === 'boot-request') {
        log('msgrouter.kdddb.boot-request', { scpName, ulid });
        const transitionAction = deck.scpLifecycle.e.scpLifecycleIdleToSpawning({
          scpName,
          bootRequestUlid: ulid,
          receivedAt: now,
        });
        log('msgrouter.strategy.idle-to-spawning', { scpName, ulid });
        return strategyDetermine(transitionAction);
      }
      if (kind === 'heartbeat') {
        const transitionAction = deck.scpLifecycle.e.scpLifecycleSpawningToActive({
          scpName,
          heartbeatUlid: ulid,
          // port undefined until B.5 dockHost surfaces it
          becameActiveAt: now,
        });
        return strategyDetermine(transitionAction);
      }
      if (kind === 'log') {
        const logAction = deck.scsBridge.e.scsBridgePublishLogs({
          scpName,
          logEntry: (payload as { logEntry?: string })?.logEntry ?? '',
          timestamp: (payload as { timestamp?: number })?.timestamp ?? now,
        });
        return strategyDetermine(logAction);
      }
      // Other kinds (unknown / future) fall through to muxiumConclude.
      return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
    }),
});
