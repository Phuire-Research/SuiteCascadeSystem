/**
 * scpMessageRouterBridgeJsonReceived · Phase B.2 · Cycle 130
 *
 * Reducer-only Quality. Dispatched by scpMessageRouter.principle.ts when the
 * bridge.json watcher's 'change' (or 'add') handler fires. Principle handler
 * does the readFile + JSON.parse work and dispatches the full content in payload.
 *
 * Reducer commits content to state.bridgeJsonContent. Downstream concepts
 * interrogate bridgeJsonContent with their own schemas (B.6 scsBridgeCore Start
 * defines bridge.json schema · B.3 scpLifecycle reads SCP roster from it).
 *
 * Template: B.1 scpRegistryFsScpAdded.quality.ts (Reducer-only · selectPayload pattern)
 *
 * Citation: M62 Sequential ActionStream Core (handler-dispatch outside Action transaction)
 * Citation: SUITE-2-ORANGE-B2-MSGROUTER-NAMING.md §3 Quality 1
 * Citation: SUITE-3-YELLOW-B2-MSGROUTER-BLUEPRINT.md §3.2
 */

import { createQualityCardWithPayload, selectPayload } from 'stratimux';
import type { ScpMessageRouterState } from '../scpMessageRouter.type';
import type {
  ScpMessageRouterBridgeJsonReceivedPayload,
  ScpMessageRouterBridgeJsonReceived,
} from './types';

export type { ScpMessageRouterBridgeJsonReceived };

export const scpMessageRouterBridgeJsonReceived = createQualityCardWithPayload<
  ScpMessageRouterState,
  ScpMessageRouterBridgeJsonReceivedPayload
>({
  type: 'Scp Message Router Bridge Json Received',
  reducer: (state, action) => {
    const { content } = selectPayload<ScpMessageRouterBridgeJsonReceivedPayload>(action);
    console.log('[Scp Message Router] bridge.json content updated');
    return { bridgeJsonContent: content };
  },
});
