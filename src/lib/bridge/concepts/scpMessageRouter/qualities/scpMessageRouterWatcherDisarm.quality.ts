/**
 * scpMessageRouterWatcherDisarm · Phase B.2 · Cycle 130
 *
 * Method+Reducer Quality (no bucket — Method needs no Reducer-side value).
 * Method calls watcher.close() on the kind-selected watcher (best-effort).
 * Reducer nulls the corresponding state field with zero-churn idempotency.
 *
 * Pattern variance from B.1 Disarm: Reducer READS payload (watcherKind) to
 * decide which field to null. B.1's Disarm had payload-less Reducer
 * (single watcher concept). B.2's kind-discriminated Disarm needs the field.
 * R4 Bidirectional §1 verified M60 compliance.
 *
 * Template: B.1 scpRegistryDirectoryWatcherDisarm.quality.ts
 *
 * Citation: M60 · M62 · M63
 * Citation: SUITE-1-RED-B2-MSGROUTER-CURATION.md §2 Card 11
 * Citation: SUITE-2-ORANGE-B2-MSGROUTER-NAMING.md §3 Quality 4
 * Citation: SUITE-3-YELLOW-B2-MSGROUTER-BLUEPRINT.md §3.5
 * Citation: SUITE-4-GREEN-B2-MSGROUTER-BIDIRECTIONAL.md §10 Amendment 3 (exhaustive comment)
 */

import {
  createQualityCardWithPayload,
  createMethodWithConcepts,
  selectPayload,
  muxiumConclude,
  strategySuccess,
  type Concept,
} from 'stratimux';
import type { ScpMessageRouterState } from '../scpMessageRouter.type';
import type {
  ScpMessageRouterWatcherDisarmPayload,
  ScpMessageRouterWatcherDisarm,
} from './types';

export type { ScpMessageRouterWatcherDisarm };

type ScpMessageRouterSelfDeck = {
  scpMessageRouter: Concept<ScpMessageRouterState, Record<string, unknown>>;
};

export const scpMessageRouterWatcherDisarm = createQualityCardWithPayload<
  ScpMessageRouterState,
  ScpMessageRouterWatcherDisarmPayload,
  ScpMessageRouterSelfDeck
>({
  type: 'Scp Message Router Watcher Disarm',
  reducer: (state, action) => {
    const { watcherKind } = selectPayload<ScpMessageRouterWatcherDisarmPayload>(action);
    if (watcherKind === 'bridgeJson') {
      if (state.bridgeJsonWatcher === null) return {};
      return { bridgeJsonWatcher: null };
    }
    if (watcherKind === 'sessionsDir') {
      if (state.sessionsDirWatcher === null) return {};
      return { sessionsDirWatcher: null };
    }
    // F2 · SCP-WINDOW-CLOSURE-CONSUME · null the registry-file watcher on teardown.
    if (watcherKind === 'sessionsJson') {
      if (state.sessionsJsonWatcher === null) return {};
      return { sessionsJsonWatcher: null };
    }
    // PSSM · W0/W5 · null the SCPs.json status watcher on teardown.
    if (watcherKind === 'scpsJson') {
      if (state.scpsJsonWatcher === null) return {};
      return { scpsJsonWatcher: null };
    }
    // watcherKind === 'bridgeSessionsDir' (exhaustive — union tail)
    // B.7 Regression #4 Hotfix · M73 Path-Diameter-Pairing-Doctrine
    // If WatcherKind ever extends to a 4th value, convert to switch+never.
    if (state.bridgeSessionsDirWatcher === null) return {};
    return { bridgeSessionsDirWatcher: null };
  },
  methodCreator: () =>
    createMethodWithConcepts(({ action, deck }) => {
      const { watcherKind } = selectPayload<ScpMessageRouterWatcherDisarmPayload>(action);
      if (watcherKind === 'bridgeJson') {
        const watcher = deck.scpMessageRouter.k.bridgeJsonWatcher.select();
        if (watcher !== null) {
          console.log('[Scp Message Router] Disarming bridgeJsonWatcher');
          try {
            watcher.close();
          } catch (err) {
            console.error('[Scp Message Router] bridgeJson disarm close error:', err);
          }
        }
      } else if (watcherKind === 'sessionsDir') {
        const watcher = deck.scpMessageRouter.k.sessionsDirWatcher.select();
        if (watcher !== null) {
          console.log('[Scp Message Router] Disarming sessionsDirWatcher');
          try {
            watcher.close();
          } catch (err) {
            console.error('[Scp Message Router] sessionsDir disarm close error:', err);
          }
        }
      } else if (watcherKind === 'sessionsJson') {
        // F2 · SCP-WINDOW-CLOSURE-CONSUME · close the registry-file watcher (best-effort).
        const watcher = deck.scpMessageRouter.k.sessionsJsonWatcher.select();
        if (watcher !== null) {
          console.log('[Scp Message Router] Disarming sessionsJsonWatcher');
          try {
            watcher.close();
          } catch (err) {
            console.error('[Scp Message Router] sessionsJson disarm close error:', err);
          }
        }
      } else if (watcherKind === 'scpsJson') {
        // PSSM · W0/W5 · close the SCPs.json status watcher (best-effort).
        const watcher = deck.scpMessageRouter.k.scpsJsonWatcher.select();
        if (watcher !== null) {
          console.log('[Scp Message Router] Disarming scpsJsonWatcher');
          try {
            watcher.close();
          } catch (err) {
            console.error('[Scp Message Router] scpsJson disarm close error:', err);
          }
        }
      } else {
        // watcherKind === 'bridgeSessionsDir' (exhaustive — union tail)
        // B.7 Regression #4 Hotfix · M73 Path-Diameter-Pairing-Doctrine
        const watcher = deck.scpMessageRouter.k.bridgeSessionsDirWatcher.select();
        if (watcher !== null) {
          console.log('[Scp Message Router] Disarming bridgeSessionsDirWatcher');
          try {
            watcher.close();
          } catch (err) {
            console.error('[Scp Message Router] bridgeSessionsDir disarm close error:', err);
          }
        }
      }
      return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
    }),
});
