/**
 * gitmSelectBranch Quality · GITM Dev Epoch (MD-B · THE BRANCH-SET LAW · r4 RE-PAIR AMENDMENT)
 *
 * THE SHIELD-GATED TURN-OVER ROUTING LAW — setting a branch ACTIVE routes through the Bridge Turn
 * Over System. THREE ROUTES (canonical · DIAMOND-GITM-DEVELOPER-EPOCH.md §THE BRANCH-SET LAW):
 *
 *   (a) THE b/-BRANCH SHIELD-GUARD — a `b/` branch can NEVER be a Shield A. If branchName starts
 *       `b/`, guardFired 'b-branch-cannot-be-shield' (the outcome handed · NOTHING moves · no
 *       registration, no turn-over).
 *   (b) THE PLAIN-GROUND TURNOVER — a Shield with NO paired Sword → re-register it as the Shield
 *       (stableBranch = branchName) and turn over onto that plain ground (source:'A' · abMode idle).
 *   (c) THE MOST-RECENT-SWORD EQUIP RULE + THE RE-PAIR — a Shield WITH Swords → re-register the
 *       Shield, equip the newest paired Sword (newestSwordFor · greatest ts), set workingBranch =
 *       that Sword + abMode 'candidate-created', and turn over onto the SWORD seat (source:'B').
 *
 * THE RE-PAIR (r4 · supersedes the block-guard draft): `workingBranch` IS the SELECTED Shield's
 * Sword signifier, never a global lock — the signifier FOLLOWS the Shield. On select the reducer
 * always writes stableBranch = branchName (re-register), then EITHER (Sword found) workingBranch =
 * Sword + 'candidate-created' OR (Plain-Ground) workingBranch = '' + 'idle'.
 *
 * THE ROUTE-2/3 DISPATCH CHOICE — **in-method staggered live-handle dispatch** (the C293 idiom ·
 * gitmScpUpdateApply.quality.ts:528-555). The quality's REDUCER lands the registration state
 * (stableBranch/workingBranch/abMode); the METHOD then fires gitmTurnOverWithSource via the
 * getActiveScsBridgeMuxiumHandle() seam on a settle timeout — source:'B' when a Sword was equipped,
 * source:'A' on the Plain-Ground. The reducer's registration lands FIRST (this dispatch), and the
 * staggered turn-over runs after the beat so the turn-over method reads the freshly-registered
 * stableBranch/workingBranch. Chosen over reducer-only-plus-client-fire so the WHOLE Law stays
 * bridge-side (single authority · the client never re-derives the route). NOTE THE CHOICE.
 *
 * All routes log gitm.selectbranch.route { route, shield, sword }.
 *
 * FailureNode Doctrine: the b/-guard hands its outcome (never silent); a branch that is not present
 * in the roster is still registrable (git validates on the turn-over switch, whose FailureNode
 * surfaces 'switch-failed').
 *
 * Template: gitmTurnOverWithSource.quality.ts (the seat dispatch · bucket · GitmActionResult) ·
 *           gitmScpUpdateApply.quality.ts:528 (the C293 staggered live-handle dispatch idiom) ·
 *           gitmRegisterStable.quality.ts (the resolveStableRoot registration).
 * Citation: DIAMOND-GITM-DEVELOPER-EPOCH.md §THE BRANCH-SET LAW + §THE RE-PAIR AMENDMENT (r4).
 */

import {
  createQualityCardWithPayload,
  createMethodWithConcepts,
  selectPayload,
  muxiumConclude,
  strategySuccess,
  strategyData_muxifyData,
  type Concept,
} from 'stratimux';
import type { GitmState, GitmABMode } from '../gitm.types';
import type { GitmSelectBranchPayload, GitmSelectBranch, GitmActionResult } from './types';
import { newestSwordForByCommit, isWorkingBranchFor } from '../model/gitmBranchRoot.model';
import { gitmExec } from '../model/gitmExec.model';
import { getActiveScsBridgeMuxiumHandle } from '../../../scsBridgeMuxium';
import { log } from '../../../debugLog';

export type { GitmSelectBranch };

// The reducer-carried registration + the source to turn over with (or null on the guard route).
interface SelectBranchBucketItem {
  result: GitmActionResult;
  register: boolean; // true → the reducer writes stableBranch/workingBranch/abMode
  stableBranch: string;
  workingBranch: string;
  abMode: GitmABMode;
  // D-BN · THE branchRoles SWEEP — the canonical A/B roles the reducer writes in LOCKSTEP with
  // stableBranch/workingBranch (a=the re-registered Shield, b=the equipped Sword or '').
  branchRoles: { a: string; b: string };
}

const bucket: SelectBranchBucketItem[] = [];

type GitmSelfDeck = {
  gitm: Concept<GitmState, Record<string, unknown>>;
};

export const gitmSelectBranch = createQualityCardWithPayload<
  GitmState,
  GitmSelectBranchPayload,
  GitmSelfDeck
>({
  type: 'Gitm Select Branch',
  reducer: (state) => {
    const item = bucket.pop();
    if (!item) {
      return {};
    }
    if (!item.register) {
      // Route (a) — the b/-guard: hand the outcome, move NOTHING.
      return { lastActionResult: item.result };
    }
    // Routes (b)/(c) — THE RE-PAIR: re-register the Shield; the signifier follows it.
    // D-BN · branchRoles LOCKSTEP — the roles ride with the pointers (a=Shield, b=Sword or '').
    return {
      stableBranch: item.stableBranch,
      workingBranch: item.workingBranch,
      branchRoles: item.branchRoles,
      abMode: item.abMode,
      lastActionResult: item.result,
    };
  },
  methodCreator: () =>
    createMethodWithConcepts(({ action, deck }) => {
      const { branchName } = selectPayload<GitmSelectBranchPayload>(action);
      const branches = deck.gitm.k.branches.select();
      // D-BN · THE branchRoles SWEEP — roles.b is the canonical working-B truth the Shield-guard
      // decides against (isWorkingBranchFor · roles equality when set, `b/`-prefix fallback for legacy).
      const knownB = deck.gitm.k.branchRoles.select().b;

      // ── ROUTE (a) · THE b/-BRANCH SHIELD-GUARD — a b/ branch can NEVER be a Shield A. ──
      if (isWorkingBranchFor(branchName, knownB)) {
        const guard: GitmActionResult = {
          action: 'gitmSelectBranch',
          ok: false,
          error: '',
          guardFired: true,
          reason: 'b-branch-cannot-be-shield',
          at: Date.now(),
        };
        log('gitm.selectbranch.route', { route: 'a', shield: branchName, sword: '' });
        bucket.push({
          result: guard,
          register: false,
          stableBranch: '',
          workingBranch: '',
          abMode: 'idle',
          branchRoles: { a: '', b: '' },
        });
        return action.strategy
          ? strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, { ...guard }))
          : muxiumConclude();
      }

      // ── THE SHIELD-SWORD PAIRING DERIVATION — find the newest Sword paired to this Shield. ──
      // C600 · THE COMMIT-DATE SWORD ORDER — uuid Swords tie at ts:0; order by committerdate
      // (the roster-order pick equipped a stale fossil in the field · the equip must be TRUE-newest).
      const equipCwd = deck.gitm.k.activeScpDir.select() || deck.gitm.k.userCwd.select();
      const sword = newestSwordForByCommit(branchName, branches, equipCwd, gitmExec);

      // THE RE-PAIR — the signifier follows the Shield. Sword found → equip it (candidate-created);
      // no Sword → Plain-Ground (workingBranch '' · idle).
      // D-BN · branchRoles LOCKSTEP — the re-registered Shield IS roles.a; the equipped Sword (or '')
      // IS roles.b. The roles ride with the pointers so the canonical truth follows the Shield.
      const register = {
        stableBranch: branchName,
        workingBranch: sword ?? '',
        abMode: (sword ? 'candidate-created' : 'idle') as GitmABMode,
        branchRoles: { a: branchName, b: sword ?? '' },
      };
      // source:'B' equips onto the Sword seat (route c); source:'A' turns over onto the plain ground (route b).
      const turnOverSource: 'A' | 'B' = sword ? 'B' : 'A';
      const route = sword ? 'c' : 'b';

      const result: GitmActionResult = {
        action: 'gitmSelectBranch',
        ok: true,
        error: '',
        guardFired: false,
        reason: '',
        at: Date.now(),
      };
      log('gitm.selectbranch.route', { route, shield: branchName, sword: sword ?? '' });

      // The REDUCER lands the registration state FIRST (this dispatch). The staggered live-handle
      // turn-over runs after the beat so gitmTurnOverWithSource reads the freshly-registered
      // stableBranch/workingBranch (the C293 idiom · outside this action's context · no HTTP).
      bucket.push({ result, register: true, ...register });

      // THE ROUTE-2/3 STAGGERED DISPATCH (C293 live-handle · gitmScpUpdateApply:528 mirror). The
      // handle may be null on a cold seam — the registration still landed (the reducer above), so a
      // null handle degrades to registration-only (the UI's turn-over control remains available).
      setTimeout(() => {
        const h = getActiveScsBridgeMuxiumHandle();
        if (h !== null) {
          h.muxium.dispatch(
            h.muxium.deck.d.gitm.e.gitmTurnOverWithSource({ source: turnOverSource }) as never,
          );
        } else {
          log('gitm.selectbranch.no-handle', { route, shield: branchName, source: turnOverSource });
        }
      }, 50);

      return action.strategy
        ? strategySuccess(
            action.strategy,
            strategyData_muxifyData(action.strategy, { ...result, route, source: turnOverSource }),
          )
        : muxiumConclude();
    }),
});
