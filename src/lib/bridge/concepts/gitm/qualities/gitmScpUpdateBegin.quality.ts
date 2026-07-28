/**
 * gitmScpUpdateBegin Quality · SCP-UPD D-U4.3 (Fork C) · the ENTRY node
 *
 * The Quality registered as the `gitm_run_update` MCP tool. Its Method BUILDS the
 * 3-node SCP-update ActionStrategy (ensureClone → runDiff → stageRelay) and FIRES it
 * via `strategyBegin(strategy)` — returned directly (NOT dispatched), per the
 * strategy-initiator discipline.
 *
 * The Reducer stamps `updateStatus.stage='cloning'` + `updateStatus.scpName` BEFORE
 * the chain advances, so the user sees forward motion from the first invocation (no
 * stale `'reviewing'` from a prior run). The strategy nodes then walk the stage
 * forward (diffing → reviewing). Read-only on the SCP (the diff script self-polices).
 *
 * Template: scpRegistryStartupRescan.quality.ts:153-160 (createStrategy + strategyBegin
 *   from a strategy-INITIATING Method, not a node within one).
 * Citation: SCP-UPD-D-U4-GND-ACTIONSTRATEGY.md §3 (entry Quality) + §10 Risk row
 *   "User sees stale 'clone' stage on retry" (reset stage in OWN reducer first).
 */

import {
  createQualityCardWithPayload,
  createMethodWithConcepts,
  selectPayload,
  strategyBegin,
  type Action,
  type Concept,
} from 'stratimux';
import type { GitmState, UpdateStatusShape } from '../gitm.types';
import { resolveGitmTargetCwd } from '../model/gitmOpCwd.model';
import { createGitmScpUpdateStrategy } from '../strategies/gitmScpUpdate.strategy';
import { basename, dirname } from 'node:path';
import type { GitmScpUpdateBeginPayload, GitmScpUpdateBegin } from './types';

export type { GitmScpUpdateBegin };

type GitmSelfDeck = {
  gitm: Concept<GitmState, Record<string, unknown>>;
};

// Resolve the SCP name the relay stamps: the explicit payload override, else the
// basename of the active SCP dir (the SCP-Sovereign cwd), else '' (no-SCP fallback).
const bucket: { scpName: string }[] = [];

export const gitmScpUpdateBegin = createQualityCardWithPayload<
  GitmState,
  GitmScpUpdateBeginPayload,
  GitmSelfDeck
>({
  type: 'Gitm Scp Update Begin',
  reducer: (state) => {
    const item = bucket.pop();
    const scpName = item ? item.scpName : state.updateStatus.scpName;
    // Reset the stage rail to 'cloning' from the first press (Risk: stale 'reviewing'
    // on retry). Carry the resolved scpName + clear the prior stageError/diffPresent.
    const updateStatus: UpdateStatusShape = {
      ...state.updateStatus,
      stage: 'cloning',
      stageError: '',
      scpName,
      diffPresent: false,
    };
    return { updateStatus, errorCode: '', errorMessage: '' };
  },
  methodCreator: () =>
    createMethodWithConcepts(({ action, deck }) => {
      const payload = selectPayload<GitmScpUpdateBeginPayload>(action);
      // MULTI-SCP GITM MUXIFICATION (MC-W1) — CALLING SCP's repo (origin-aware) · SCP-Sovereign fallback.
      const opCwd = resolveGitmTargetCwd(deck, payload.originScpName);
      const payloadName = payload?.scpName;
      // scpName resolution (Cycle 282): opCwd is the SCP SUBDIR (…/scps/<name>/SCP) —
      // basename yields 'SCP', not the designation the SCP watcher keys on
      // (scp-update-diff.<name>.json · SCP_NAME env). The designation is the PARENT dir.
      const derivedName = basename(opCwd) === 'SCP' ? basename(dirname(opCwd)) : basename(opCwd);
      const scpName = payloadName && payloadName !== '' ? payloadName : derivedName;
      bucket.push({ scpName });
      // strategyBegin returns the Action that initiates the chain; the Muxium walks
      // ensureClone → runDiff → stageRelay. Returned directly — NOT dispatched.
      const strategy = createGitmScpUpdateStrategy();
      return strategyBegin(strategy) as unknown as Action<GitmScpUpdateBeginPayload>;
    }),
});
