/**
 * gitmScpUpdate Strategy · SCP-UPD D-U4.3 (Fork C) · the 3-node chain
 *
 * The fixed, sequential SCP-update ActionStrategy: ensureClone → runDiff → stageRelay.
 * A FIXED workflow with success/failure branching and a terminal Concluder (the diff
 * JSON written) — the ActionStrategy primitive, NOT a muxium.plan (the client reacts
 * to the relayed `updateStatus.stage`, not a plan stage selector).
 *
 * Node chain (createActionNode `successNode` wiring):
 *   ensureClone (async · clone/pull · carries templatePath+cloneMode)
 *     └ runDiff (execFileSync scp-3way-diff.sh · stamps 'diffing')
 *         └ stageRelay (Concluder · reads diff JSON · stamps 'reviewing'+summary)
 *
 * Each node Quality carries data forward via strategyData; on failure the node returns
 * strategyFailed and the chain terminates (the error relay already stamped). The empty
 * `{}` payloads are intentional — the nodes read activeScpDir/scpName from gitm state
 * and templatePath from the carried strategy data, not from per-node payloads.
 *
 * The chain is built fresh per invocation (a factory) so each `gitm_run_update` press
 * gets a clean strategy instance (no shared mutable node graph across runs).
 *
 * Template: scpToolManifold.strategy.ts:52-119 (createStrategy + createActionNode +
 *   successNode wiring) · scpRegistryStartupRescan.quality.ts:138-157 (node chain
 *   from local quality action creators).
 * Citation: SCP-UPD-D-U4-GND-ACTIONSTRATEGY.md §2-3 (createStrategy chain) + §1
 *   (ActionStrategy NOT plan) + §7 (Concluder = the diff JSON written).
 */

import { type ActionStrategy, createActionNode, createStrategy } from 'stratimux';
import { gitmScpUpdateEnsureClone } from '../qualities/gitmScpUpdateEnsureClone.quality';
import { gitmScpUpdateRunDiff } from '../qualities/gitmScpUpdateRunDiff.quality';
import { gitmScpUpdateStageRelay } from '../qualities/gitmScpUpdateStageRelay.quality';
import { gitmScpUpdateProgress } from '../qualities/gitmScpUpdateProgress.quality';

// RS.4 · THE PER-SCP RAIL — the carriage Begin resolves ONCE and the factory bakes into every
// node payload. No node re-reads shared state for identity; two concurrent chains on two SCPs
// never cross. originScpName rides the failure Progress nodes so an error stamp lands on the
// TARGET's rail (scpName fallback — the target IS the calling SCP in the update flow).
export type GitmScpUpdateCarriage = {
  scpName: string;
  targetScpDir: string;
  originScpName: string;
};

// Build a fresh 3-node SCP-update strategy. Chained back-to-front: stageRelay is the
// Concluder (no successNode → the strategy completes after it fires).
export function createGitmScpUpdateStrategy(carriage: GitmScpUpdateCarriage): ActionStrategy {
  const nodePayload = { scpName: carriage.scpName, targetScpDir: carriage.targetScpDir };
  const failureOrigin =
    carriage.originScpName !== '' ? carriage.originScpName : carriage.scpName;
  // NODE 3 (Concluder) · reads the diff JSON · stamps stage='reviewing'+summary.
  const stageRelayNode = createActionNode(gitmScpUpdateStageRelay.actionCreator(nodePayload), {
    // C285 (the 078 diffing-stall): the relay node was the LAST without an agreement —
    // the runDiff→stageRelay strategySuccess dropped unseen. Lifetime + instrumentation.
    agreement: 60_000,
    successNotes: {
      preposition: 'Finally',
      denoter: 'SCP update diff relayed; stage=reviewing.',
    },
  });

  // NODE 2 FAILURE (terminal · no successNode) · flips the TARGET's rail to stage='error'.
  const runDiffFailureNode = createActionNode(
    gitmScpUpdateProgress.actionCreator({
      stage: 'error',
      note: 'diff failed; see stageError',
      originScpName: failureOrigin,
    }),
    {},
  );

  // NODE 2 · runs the read-only 3-way diff script · stamps stage='diffing'.
  const runDiffNode = createActionNode(gitmScpUpdateRunDiff.actionCreator(nodePayload), {
    successNode: stageRelayNode,
    failureNode: runDiffFailureNode,
    successNotes: {
      preposition: 'Then',
      denoter: 'SCP 3-way diff computed;',
    },
    // The diff script walks two full SCP trees — allow well past the default lifetime.
    agreement: 60_000,
  });

  // NODE 1 FAILURE (terminal · no successNode) · flips the TARGET's rail to stage='error'.
  const ensureCloneFailureNode = createActionNode(
    gitmScpUpdateProgress.actionCreator({
      stage: 'error',
      note: 'clone failed; see stageError',
      originScpName: failureOrigin,
    }),
    {},
  );

  // NODE 1 (initial · async) · clone/pull the retained SCS template · stage='cloning'.
  const ensureCloneNode = createActionNode(gitmScpUpdateEnsureClone.actionCreator(nodePayload), {
    successNode: runDiffNode,
    failureNode: ensureCloneFailureNode,
    successNotes: {
      preposition: 'First',
      denoter: 'SCS template clone ensured;',
    },
    // THE C282 STALL ROOT (layer 6): the WTSR file:// refresh (rm + full repo copy) runs
    // ~10-15s — past the default action lifetime. The async .then() then fired
    // strategySuccess on an EXPIRED action and the Muxium dropped it: stage stuck at
    // 'cloning', cloneMode never stamped, runDiff never entered. The agreement extends
    // the action's intended lifetime to cover the copy.
    agreement: 120_000,
  });

  return createStrategy({
    topic: 'Gitm SCP Update · clone → diff → relay',
    initialNode: ensureCloneNode,
  });
}
