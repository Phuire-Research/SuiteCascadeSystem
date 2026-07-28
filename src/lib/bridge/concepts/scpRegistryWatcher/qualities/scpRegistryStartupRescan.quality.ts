/**
 * scpRegistryStartupRescan · Phase B.1 · Cycle 129 · B.7 Regression #2 Hotfix
 *
 * Method-and-Reducer Quality. Method reads SCPs.json (canonical registry source,
 * NOT directory listing) via readScpRegistry(userCwd) and builds an ActionStrategy
 * chain that dispatches scpRegistryFsScpAdded for each registered entry. This
 * reuses the canonical admission path (FsScpAdded Method dispatches
 * scpLifecycleRegister via deck.scpLifecycle.e.scpLifecycleRegister) so
 * lifecycleByScp.size > 0 after rescan, which satisfies M17's
 * latestAnyScpsInstalled derivation and unblocks menu sub-menu accessibility.
 *
 * Reducer is a defensive no-op — FsScpAdded's Reducer is the canonical writer of
 * installedScps; we no longer write that array from Rescan to avoid double-write
 * and to preserve a single source of truth (RRSA · M68).
 *
 * Bypasses chokidar's ignoreInitial:true — picks up pre-existing SCP installs
 * at bridge startup. Subsequent FS events are caught by Arm's principle-bound
 * handlers and dispatched via FsScpAdded/Changed/Removed Qualities.
 *
 * B.7 Regression #2 Resolution:
 *   - Issue A (M68 RRSA): admission gap closed — Rescan dispatches FsScpAdded
 *     per entry via ActionStrategy chain → scpLifecycleRegister fires → FSM populated.
 *   - Issue B (M69 RRCS): canonical source corrected — readScpRegistry(userCwd)
 *     replaces readdirSync(observedPath). Hidden directories (.staging) and
 *     install pipeline artifacts (template) no longer surface as phantom entries.
 *   - M70 type mismatch acknowledged: persistence ScpRegistryEntry uses .name/.path;
 *     watcher ScpRegistryEntry uses .scpName/.scpPath. Mapped explicitly below.
 *
 * C624 CANONICAL CARRY LAW: the rescan HOLDS each registry entry's canonical
 * `scp.name` and CARRIES it into the FsScpAdded payload (`{ scpPath, scpName }`)
 * rather than DROPPING it. The consumer (FsScpAdded reducer + method) prefers the
 * carried name; the C622 path-basename normalization survives ONLY as the
 * chokidar-path (Path A) fallback where no name is carried. Carrying the canonical
 * identity eliminates the watcher-inventory basename re-derivation as a divergence
 * point and hardens every downstream worktree surface at once.
 *
 * Citation: M62 Sequential ActionStream Core · M63 Copy-Paste-Plus
 * Citation: M68 RRSA Rescan Required Scp Admission · M69 RRCS Rescan Required Canonical Source
 * Citation: SUITE-4-GREEN-B7-REGRESSION-2-BIDIRECTIONAL.md §Fix A Option 1 + §Fix B
 * Citation: SUITE-7-FUCHSIA-B7-REGRESSION-2-DIAGNOSIS.md (M68/M69/M70 codification)
 * Reference admission pattern: scpRegistryFsScpAdded.quality.ts:93-98
 * Reference canonical helper: src/lib/scp/scpPersistence.ts:123 (readScpRegistry)
 */

import {
  createQualityCardWithPayload,
  createMethodWithConcepts,
  muxiumConclude,
  strategySuccess,
  strategyBegin,
  createActionNode,
  createStrategy,
  type Action,
  type AnyAction,
  type Concept,
  type ActionStrategyParameters,
} from 'stratimux';
import { join, isAbsolute } from 'node:path';
import type { ScpRegistryWatcherState } from '../scpRegistryWatcher.type';
import type { ScpLifecycleConcept } from '../../scpLifecycle/scpLifecycle.concept';
import { readScpRegistry } from '../../../../scp/scpPersistence';
import { log } from '../../../debugLog';
import type {
  ScpRegistryStartupRescanPayload,
  ScpRegistryStartupRescan,
} from './types';

export type { ScpRegistryStartupRescan };

// B.7 R#2 downstream-aware Deck (mirrors ScpRegistryFsAddedDownstreamDeck shape).
// scpLifecycle retained for downstream type-presence (FsScpAdded's Method needs
// it at runtime; Rescan does NOT dispatch scpLifecycleRegister directly, it
// dispatches scpRegistryFsScpAdded which then dispatches Register internally).
type ScpRegistryStartupRescanDownstreamDeck = {
  scpRegistryWatcher: Concept<ScpRegistryWatcherState, Record<string, unknown>>;
  scpLifecycle: ScpLifecycleConcept;
};

// Self-concept action creator surface for fanout · sibling-flat access pattern
// per scpRegistryWatcher.principle.ts:38-46 precedent (Method context cannot
// reach own-concept action creators through the generic Deck shape; inline
// cast is the canonical workaround when self-dispatch is required).
type ScpRegistryFsScpAddedCreator = (payload: { scpPath: string; scpName?: string }) => AnyAction;

export const scpRegistryStartupRescan = createQualityCardWithPayload<
  ScpRegistryWatcherState,
  ScpRegistryStartupRescanPayload,
  ScpRegistryStartupRescanDownstreamDeck
>({
  type: 'Scp Registry Startup Rescan',
  reducer: (_state) => {
    // No-op · FsScpAdded's Reducer is the canonical writer of installedScps.
    // Keeping the Reducer shape preserves Quality contract; partial-zero return
    // signals state untouched.
    return {};
  },
  methodCreator: () =>
    createMethodWithConcepts(({ action, deck }) => {
      const userCwd = deck.scpRegistryWatcher.k.userCwd.select();
      if (!userCwd) {
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }

      let registry;
      try {
        registry = readScpRegistry(userCwd);
      } catch (err) {
        console.error('[Scp Registry] Rescan readScpRegistry error:', err);
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }

      if (!registry || !Array.isArray(registry.scps) || registry.scps.length === 0) {
        console.log('[Scp Registry] Rescan found 0 SCP installation(s) in SCPs.json');
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }

      // M70 type mismatch bridge: persistence ScpRegistryEntry uses .name/.path
      // (relative install path); watcher FsScpAdded payload expects absolute scpPath.
      // Resolve each registered path against userCwd (joining if relative, passing
      // through if already absolute).
      // C624 CANONICAL CARRY: retain each entry's canonical `scp.name` alongside the
      // resolved path so the FsScpAdded payload CARRIES the identity (no basename
      // re-derivation downstream).
      const scpEntries: { scpPath: string; scpName: string }[] = registry.scps
        .filter((scp) => typeof scp?.name === 'string' && typeof scp?.path === 'string')
        .map((scp) => ({
          scpPath: isAbsolute(scp.path) ? scp.path : join(userCwd, scp.path),
          scpName: scp.name,
        }));

      console.log(
        '[Scp Registry] Rescan found',
        scpEntries.length,
        'SCP installation(s) in SCPs.json',
      );
      log('scpregistry.startup-rescan', { count: scpEntries.length, userCwd });

      if (scpEntries.length === 0) {
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }

      // ─── Build ActionStrategy chain · one FsScpAdded dispatch per entry ───
      // Build the chain back-to-front so each prior node's successNode references
      // the next. Reuses the canonical admission path: FsScpAdded.Method then
      // strategyDetermines scpLifecycleRegister on first sighting (deduped by
      // fsmByScp.has(canonicalName) guard inside FsScpAdded.Method).
      // Inline cast accesses self-concept action creator (see principle precedent).
      const fsAdd = (deck.scpRegistryWatcher as unknown as {
        e: { scpRegistryFsScpAdded: ScpRegistryFsScpAddedCreator };
      }).e.scpRegistryFsScpAdded;

      let nextNode: ReturnType<typeof createActionNode> | null = null;
      for (let i = scpEntries.length - 1; i >= 0; i--) {
        const { scpPath, scpName } = scpEntries[i];
        const addAction = fsAdd({ scpPath, scpName });
        const node = createActionNode(addAction, {
          successNode: nextNode,
          successNotes: {
            preposition: i === 0 ? 'First' : 'Then',
          },
        });
        nextNode = node;
      }

      console.log('[Scp Registry] Rescan dispatched', scpEntries.length, 'admission(s)');

      const params: ActionStrategyParameters = {
        topic: 'Scp Registry Startup Rescan Admission Chain',
        initialNode: nextNode!,
      };
      const strategy = createStrategy(params);
      // strategyBegin returns the Action that initiates the chain; the Muxium
      // walks successNode→successNode firing FsScpAdded for each entry.
      return strategyBegin(strategy) as unknown as Action<ScpRegistryStartupRescanPayload>;
    }),
});
