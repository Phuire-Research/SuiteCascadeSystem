/**
 * gitmSetActiveScpDir Quality · GITM SCP-SOVEREIGN · the FIRST setter for activeScpDir
 *
 * activeScpDir had ZERO setters until this quality (gitm.types.ts:131 default '' · never set).
 * Dispatched at the SCP bind seam (scsBridgeLaunchScp / scsBridgeLaunchScpRuntime /
 * scsBridgeActivateScpSession) the moment an SCP becomes the active one — passing the SCP
 * PACKAGE dir (entry.path = Cascades/scps/<name>/SCP/). This is the linchpin of the pivot:
 * without it the SCP (RED) watcher never arms, the SCP recount stays dormant, changesPrimedOnB
 * never updates, and selectGitmOpCwd falls back to userCwd.
 *
 * Pure state annotation (form-α). The Reducer lands ONLY { activeScpDir } (partial-return law).
 * The SCP watcher re-arm is dispatched SEPARATELY by the bind seam (the seam is imperative code,
 * not single-dispatch-constrained — it fires gitmSetActiveScpDir THEN gitmScpWatcherArm({}); the
 * path-aware arm reads activeScpDir from state and re-arms on the new path, or tears down on '').
 * Keeping the re-arm at the seam (not chained inside this Method) honors the single-action method
 * rule (MethodWithConceptsParams exposes no nextA — gitmDiscard.quality.ts:13-18 precedent).
 *
 * Template: gitmRegisterStable.quality.ts (pure state annotation · bucket · partial return).
 * Citation: GITM-SOV-S1-RED.md ADD-2 + REPOINT-5 (the bind seam) · S3-YELLOW W3.
 */

import {
  createQualityCardWithPayload,
  createMethodWithConcepts,
  selectPayload,
  muxiumConclude,
  strategySuccess,
  type Concept,
} from 'stratimux';
import { isAbsolute, resolve } from 'node:path';
import type { GitmState } from '../gitm.types';
import type { GitmSetActiveScpDirPayload, GitmSetActiveScpDir } from './types';
// MULTI-SCP GITM MUXIFICATION (MC-W3 step 11) — ensure a slice entry exists for the new active dir so
// GITEP's active-rail fan-out never lags an empty store (the materialized-view seed).
// C565 M1 · THE ACTIVE-VIEW RE-MATERIALIZATION — the pointer switch now LOADS the flat view
// FROM the target's slice (createEmptyGitmRepoSlice when fresh — honest empties: a fresh SCP's
// stableBranch '' lets the C237 fresh-install badge rule fire). Without this, the view kept the
// PREVIOUS SCP's roles and GITEP's active-slice refresh copied the stale composite INTO the new
// SCP's slice — the chimera's re-entry door.
import {
  createEmptyGitmRepoSlice,
  getSlice,
  upsertSliceFields,
  type GitmRepoSlice,
} from '../model/gitmSliceStore.model';

export type { GitmSetActiveScpDir };

interface SetActiveScpDirBucketItem {
  activeScpDir: string;
  // C565 M1 · the target's slice fields — the reducer loads them into the flat view.
  materialize: GitmRepoSlice;
}

const bucket: SetActiveScpDirBucketItem[] = [];

type GitmSelfDeck = {
  gitm: Concept<GitmState, Record<string, unknown>>;
};

export const gitmSetActiveScpDir = createQualityCardWithPayload<
  GitmState,
  GitmSetActiveScpDirPayload,
  GitmSelfDeck
>({
  type: 'Gitm Set Active Scp Dir',
  reducer: (state) => {
    const item = bucket.pop();
    if (item === undefined) {
      return {};
    }
    // C565 M1 · THE ACTIVE-VIEW RE-MATERIALIZATION — the flat view IS the active SCP's
    // materialized view: a pointer switch loads the target's per-repo truth wholesale.
    return { activeScpDir: item.activeScpDir, ...item.materialize };
  },
  methodCreator: () =>
    createMethodWithConcepts(({ action, deck }) => {
      const { activeScpDir: rawDir } = selectPayload<GitmSetActiveScpDirPayload>(action);

      // ABSOLUTE-RESOLVE (the bind-seam bug fix): the SCP registry path (entry.path =
      // 'Cascades/scps/<name>/SCP') is RELATIVE, but the SCP watcher's existsSync + chokidar
      // and the recount's readGitStatus need an ABSOLUTE path (they resolve against the bridge
      // process.cwd, not userCwd). A relative activeScpDir silently fails existsSync → the RED
      // watcher never arms → the SCP location stays dormant. Resolve against userCwd (absolute).
      const userCwd = deck.gitm.k.userCwd.select();
      const activeScpDir =
        rawDir === '' ? '' : isAbsolute(rawDir) ? rawDir : resolve(userCwd, rawDir);

      const current = deck.gitm.k.activeScpDir.select();
      // Idempotency: same dir → no state churn.
      if (current === activeScpDir) {
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }

      // MULTI-SCP GITM MUXIFICATION (MC-W3 step 11) — seed an empty-shape slice for the new active dir
      // if absent, so GITEP's active-rail fan-out (buildSnapshotFromSlice) never reads an empty store
      // on the first write. Idempotent (upsertSliceFields seeds via createEmptyGitmRepoSlice when
      // absent · a re-bind on an existing slice is a no-op merge). Slice DELETION rides the disarm
      // (MC-W2 step 8), NOT the pointer move — a switch AWAY does not retire the prior SCP's rail.
      if (activeScpDir !== '' && getSlice(activeScpDir) === undefined) {
        upsertSliceFields(activeScpDir, {});
      }

      // C565 M1 · THE ACTIVE-VIEW RE-MATERIALIZATION — carry the target's slice into the reducer
      // so the flat view loads the NEW SCP's truth (never the previous SCP's stale composite).
      // '' (cleared) anor a fresh slice → honest empties (the C237 fresh-install rule fires).
      const materialize: GitmRepoSlice =
        (activeScpDir !== '' ? getSlice(activeScpDir) : undefined) ??
        createEmptyGitmRepoSlice(activeScpDir);
      bucket.push({ activeScpDir, materialize });
      console.log('[Gitm] Set active SCP dir:', activeScpDir === '' ? '(cleared)' : activeScpDir);

      return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
    }),
});
