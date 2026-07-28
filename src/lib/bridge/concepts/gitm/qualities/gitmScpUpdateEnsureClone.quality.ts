/**
 * gitmScpUpdateEnsureClone Quality · SCP-UPD D-U4.3 (Fork C) · NODE 1 (async)
 *
 * The first strategy node. Clones/pulls the retained SCS template clone (D-U1's
 * `ensureRetainedClone`, OUTSIDE every project — never touches the SCP working tree)
 * then advances the strategy carrying `templatePath` + `cloneMode` forward in the
 * strategy data for NODE 2 to consume.
 *
 * The ASYNC advance is the novel bit (no prior gitm async-node precedent). The
 * Method is a `createAsyncMethod` — it kicks `ensureRetainedClone(repoUrl)` (a Promise)
 * and, inside the `.then()`, calls `controller.fire(strategySuccess(strategy, ...))`
 * to advance once the clone resolves. On `.catch()` it routes to the error channel
 * (stage='error' + errorCode) and `strategyFailed` terminates the chain.
 *
 * The SCS repo URL is the SAME constant the install path uses — `SCS_INSTALL_REPO_URL`
 * (installConstants.ts) — reused, NOT re-hardcoded. The reducer stamps `cloneMode`
 * (read from the bucket the async callback fills).
 *
 * Template: bridgePingPong.quality.huirth.ts:47-118 (createAsyncMethod + controller.fire
 *   in .then()/.catch()) · gitmPull.quality.ts (bucket + partial reducer) · the GND
 *   §4 "async op pattern (ensureRetainedClone)".
 * Citation: SCP-UPD-D-U4-GND-ACTIONSTRATEGY.md §4 (async advance) + §10 Risk
 *   "Async clone blocks UI" (controller.fire — Method returns immediately).
 */

import {
  createQualityCardWithPayload,
  createAsyncMethod,
  muxiumConclude,
  strategySuccess,
  strategyFailed,
  strategyData_muxifyData,
  refreshAction,
  type Action,
} from 'stratimux';
import type { GitmState, UpdateStatusShape } from '../gitm.types';
import { ensureRetainedClone } from '../../../updateCloneManager';
import { SCS_INSTALL_REPO_URL } from '../../../installConstants';
import type {
  GitmScpUpdateEnsureClonePayload,
  GitmScpUpdateEnsureClone,
  GitmScpUpdateCloneStrategyData,
} from './types';

export type { GitmScpUpdateEnsureClone };

// Module-level bucket the async callback fills; the reducer pops it on the next beat
// (gitmPull discipline). Carries the obtain-mode for the relay stamp + any error.
type CloneBucketItem =
  | { ok: true; cloneMode: string }
  | { ok: false; error: string };
const bucket: CloneBucketItem[] = [];

export const gitmScpUpdateEnsureClone = createQualityCardWithPayload<
  GitmState,
  GitmScpUpdateEnsureClonePayload
>({
  type: 'Gitm Scp Update Ensure Clone',
  reducer: (state) => {
    const item = bucket.pop();
    if (!item) {
      return {};
    }
    if (!item.ok) {
      const updateStatus: UpdateStatusShape = {
        ...state.updateStatus,
        stage: 'error',
        stageError: item.error,
      };
      return {
        updateStatus,
        errorCode: 'update-clone-failed',
        errorMessage: item.error,
      };
    }
    const updateStatus: UpdateStatusShape = {
      ...state.updateStatus,
      cloneMode: item.cloneMode,
    };
    return { updateStatus };
  },
  methodCreator: () =>
    createAsyncMethod(({ action, controller }) => {
      ensureRetainedClone(SCS_INSTALL_REPO_URL)
        .then((result) => {
          bucket.push({ ok: true, cloneMode: result.mode });
          const data: GitmScpUpdateCloneStrategyData = {
            templatePath: result.templatePath,
            cloneMode: result.mode,
          };
          // refreshAction (C282 · the action-validity doctrine): the WTSR copy runs longer
          // than the default 5000ms lifetime; re-arm expiration AT RESOLVE TIME honoring
          // the node agreement (120s) so the fire below is always within validity.
          const live = refreshAction(action as unknown as Action);
          controller.fire(
            live.strategy
              ? strategySuccess(live.strategy, strategyData_muxifyData(live.strategy, data))
              : muxiumConclude(),
          );
        })
        .catch((err: unknown) => {
          const message = err instanceof Error ? err.message : String(err);
          bucket.push({ ok: false, error: message });
          const live = refreshAction(action as unknown as Action);
          controller.fire(
            live.strategy ? strategyFailed(live.strategy) : muxiumConclude(),
          );
        });
    }),
});
