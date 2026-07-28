/**
 * scpRegistryFsScpAdded · Phase B.1 · Cycle 129 (B.3 Cycle 131 ADMC amendment)
 *   · C655 THE INVENTORY ADMISSION GATE (the "Cascades" phantom · bucket carry)
 *
 * C655 THE INVENTORY ADMISSION LAW: the watcher inventory (installedScps) is
 * REGISTRY-ADMITTED — a directory is NOT an SCP. The worktree birth (`git worktree
 * add` creating `{userCwd}/Cascades/scps/<instance>/...`) fires chokidar addDir for
 * the instance's SUBDIRS — including its own `SCP/Cascades` folder. Pre-C655 the
 * METHOD carried the PSCAG-PEN/WACR registry verdict (phantoms skipped from FSM
 * admission) but the REDUCER appended to installedScps UNCONDITIONALLY (dedupe by
 * scpPath only · basename-derived name — 'Cascades' landed) → C621's
 * refreshBridgeMetadata read that inventory → bridge.json installedScps grew a
 * phantom 'Cascades' → the helm row. C655 converts this Quality to the BUCKET
 * pattern the gitm qualities prove (gitmAssignRole.quality.ts:47-100 · method runs
 * first, pushes ONE verdict item; reducer pops it): the Method's existing PSCAG-PEN
 * admission verdict + canonicalName are PUSHED; the Reducer POPS and appends ONLY
 * admitted entries under the CANONICAL name. A no-bucket fallback (`!item → {}`)
 * keeps a reducer-only edge from crashing. This also completes C624's carry
 * uniformly — the Reducer's basename fallback retires for method-backed dispatches.
 *
 * C655 EXISTING-POLLUTION NOTE: the mend prevents NEW pollution only. A running
 * bridge whose inventory already holds 'Cascades' stays polluted until relaunch —
 * a bridge relaunch rebuilds installedScps CLEAN through scpRegistryStartupRescan
 * (readScpRegistry = SCPs.json registry, never a directory listing). No migration
 * code needed; the rescan IS the migration.
 *
 * UPGRADED from Reducer-only to Method+Reducer per form-α LOCK (R3 §1.1 / R3 §3.13):
 *   - Method: reads scpLifecycle.fsmByScp via DECK K Tier-1 (sibling-flat) to
 *             dedupe; strategyDetermines scpLifecycle.e.scpLifecycleRegister on
 *             first sighting; falls back to muxiumConclude if already admitted.
 *             PUSHES the admission verdict item (C655 bucket carry).
 *   - Reducer: POPS the verdict item and appends installedScps ONLY when admitted,
 *              under the CANONICAL name (C655 · gitm bucket idiom). Dedupe-by-
 *              scpPath retained. No-bucket fallback returns {} (reducer-only edge).
 *
 * Form-α (LOCKED in R3 §1.1): admission Quality dispatch is performed from the
 * upstream Concept (scpRegistryWatcher) into the downstream FSM sink Concept
 * (scpLifecycle). The Method's Deck generic is widened to `ScpRegistryFs
 * AddedDownstreamDeck` (DADTE pattern · R3 §3.12 variant for this Quality).
 *
 * Defense-in-depth: Method's pre-dispatch dedup IS optimization (avoids
 * dispatching no-op Register action); scpLifecycleRegister Reducer's
 * `if (state.fsmByScp.has(scpName))` guard IS canonical correctness. Both
 * layers present (R4 §3.3 verified).
 *
 * C624 CANONICAL CARRY LAW: when the rescan (Path B) carries `payload.scpName`
 * (SCPs.json `.name`), BOTH legs prefer the carried canonical identity — the
 * Reducer records it in the watcher inventory and the Method uses it as
 * `canonicalName`. The C622 path-basename normalization survives ONLY as the
 * chokidar (Path A) fallback where no name is carried.
 *
 * C624 CANONICAL DEDUP LAW: the Method's early-return dedup guard checks the
 * CANONICAL name (carried or matched), NOT the raw path basename — `fsmByScp` is
 * keyed by canonical names (scpLifecycleRegister), so a raw-basename check
 * (`'SCP'` for every rescan path) is dead. The guard is live only against the
 * canonical identity.
 *
 * C624 CHAIN-CONTINUATION LAW: the admit branch MUST NOT swallow an incoming
 * rescan strategy. When `action.strategy` exists, the admit fires as the immediate
 * determined action AND the chain continues via the Strategy Temporal Expansion
 * "Tail Whip" — `muxiumTimeOut(concepts_, () => strategySuccess(action.strategy), 0)`
 * defers the successNode walk (STRATIMUX-REFERENCE.md §Strategy Temporal Expansion,
 * 1358-1373). Absent an incoming strategy (chokidar direct dispatch), the admit is
 * a standalone `strategyDetermine`. This restores all-N admission across the rescan
 * chain (the last-in-order SCP no longer drops).
 *
 * WACR doctrine holds under carry: a carried `scpName` that fails the SCPs.json
 * registry cross-check is still skipped as a phantom (PSCAG-PEN gate unchanged).
 *
 * Template: B.1 scpRegistryFsScpAdded.quality.ts (original Reducer body)
 *           ADMIN_ICP icpExecuteTool.quality.huirth.ts (strategyDetermine in Method)
 *
 * Citation: M62 Sequential ActionStream Core · M63 Copy-Paste-Plus
 * Citation: SUITE-1-RED-B3-LIFECYCLE-CURATION.md §4.6 Option A
 * Citation: SUITE-2-ORANGE-B3-LIFECYCLE-NAMING.md §8.3 (ADMC name)
 * Citation: SUITE-3-YELLOW-B3-LIFECYCLE-BLUEPRINT.md §3.13
 * Citation: SUITE-4-GREEN-B3-LIFECYCLE-BIDIRECTIONAL.md §3.3 (defense-in-depth)
 */

import {
  createQualityCardWithPayload,
  createMethodWithConcepts,
  selectPayload,
  muxiumConclude,
  muxiumTimeOut,
  strategySuccess,
  strategyDetermine,
  type Concept,
} from 'stratimux';
import { basename, dirname, isAbsolute, join } from 'node:path';
import type { ScpRegistryWatcherState } from '../scpRegistryWatcher.type';
import type { ScpLifecycleConcept } from '../../scpLifecycle/scpLifecycle.concept';
import type {
  ScpRegistryFsScpAddedPayload,
  ScpRegistryFsScpAdded,
} from './types';
import { readScpRegistry } from '../../../../scp/scpPersistence';

export type { ScpRegistryFsScpAdded };

// B.3 downstream-aware Deck for form-α admission dispatch (DADTE local variant).
// ScpLifecycleConcept used (not Concept<S, Record>) to preserve action-creator
// payload type-safety per stratimux Stratideck<Q,S,D> generic at index.d.ts:229.
type ScpRegistryFsAddedDownstreamDeck = {
  scpRegistryWatcher: Concept<ScpRegistryWatcherState, Record<string, unknown>>;
  scpLifecycle: ScpLifecycleConcept;
};

// C655 THE ADMISSION BUCKET — one item pushed per Method run, popped per Reducer
// run (gitmAssignRole.quality.ts:47-58 idiom). `admit` carries the Method's
// PSCAG-PEN/WACR verdict; `scpName` carries the CANONICAL identity. Each dispatch =
// one Method run = one push = one Reducer pop, so the strategy chain (rescan Path B)
// is safe — the Tail-Whip continuation adds no extra Reducer runs.
interface FsScpAddedBucketItem {
  admit: boolean;
  scpPath: string;
  scpName: string;
}

const bucket: FsScpAddedBucketItem[] = [];

export const scpRegistryFsScpAdded = createQualityCardWithPayload<
  ScpRegistryWatcherState,
  ScpRegistryFsScpAddedPayload,
  ScpRegistryFsAddedDownstreamDeck
>({
  type: 'Scp Registry Fs Scp Added',
  reducer: (state) => {
    // C655 THE INVENTORY ADMISSION GATE (bucket pop) — the inventory is
    // REGISTRY-ADMITTED. A directory is NOT an SCP.
    const item = bucket.pop();
    // No-bucket fallback: a reducer-only edge (no Method run pushed) must never
    // crash — state untouched. Method-backed dispatches (chokidar + rescan) always
    // push, so this branch only guards a defensive/degenerate path.
    if (!item) {
      return {};
    }
    // The Method's PSCAG-PEN/WACR verdict is authoritative: a phantom directory
    // (`Cascades`, `template`, worktree subdir) fails the registry cross-check →
    // admit=false → NEVER lands in installedScps (the 'Cascades' helm row cured).
    if (!item.admit) {
      return {};
    }
    // Dedupe-by-scpPath retained (unchanged from B.1 baseline).
    if (state.installedScps.some(entry => entry.scpPath === item.scpPath)) {
      return {};
    }
    // C655 · C624 CANONICAL CARRY (uniform): the Method already resolved the
    // CANONICAL name (rescan-carried `scp.name` anor registry-matched anor chokidar
    // basename). The Reducer's own basename fallback retires — the bucket carries
    // the single canonical identity, closing the divergence point where the raw
    // basename ('SCP' for rescan paths · 'Cascades' for the worktree subdir) once
    // leaked into the inventory.
    console.log('[Scp Registry] Detected new SCP installation:', item.scpName, item.scpPath);

    return {
      installedScps: [
        ...state.installedScps,
        { scpName: item.scpName, scpPath: item.scpPath, discoveredAt: Date.now() },
      ],
    };
  },
  methodCreator: () =>
    createMethodWithConcepts(({ action, concepts_, deck }) => {
      const { scpPath, scpName: carriedScpName } = selectPayload<ScpRegistryFsScpAddedPayload>(action);
      // C624 CANONICAL CARRY: prefer the rescan-carried canonical name; the raw
      // path basename survives ONLY as the chokidar-path fallback.
      // C655 CANONICAL BUCKET NAME: the identity that lands in installedScps. The
      // C622 · PSCAG-PEN path-basename normalization survives ONLY as the chokidar
      // (Path A) fallback where no name is carried — the standard package layout ends
      // in /SCP so the identity is the PARENT dir (worktree instances, an SCP literally
      // named "SCP" → SCP/SCP → parent 'SCP', all correct). Registry-match may refine
      // this below (WACR authoritative name).
      const rawBase = basename(scpPath);
      let canonicalName: string = carriedScpName ?? (rawBase === 'SCP' ? basename(dirname(scpPath)) : rawBase);
      const fsmByScp = deck.scpLifecycle.k.fsmByScp.select();

      // C624 CANONICAL DEDUP: fsmByScp is keyed by canonical names — check the
      // canonical name, NOT the raw basename ('SCP' for every rescan path, which
      // rendered this guard dead pre-C624).
      if (fsmByScp.has(canonicalName)) {
        // Already FSM-admitted (a real registered SCP): don't re-dispatch the
        // Register action, but PUSH admit=true so the Reducer's scpPath-dedup handles
        // inventory idempotency (a genuinely-registered SCP absent from installedScps
        // still lands under its canonical name). Thread the incoming chain forward.
        bucket.push({ admit: true, scpPath, scpName: canonicalName });
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }

      // Cycle 142 PSCAG (Phantom-SCP-Canonical-Admission-Gate) · WACR guard.
      // chokidar's addDir fires for ANY directory created under Cascades/scps/
      // including install-pipeline scaffolding (e.g., `template/`). Without a
      // canonical-registry check, every such directory gets admitted as a
      // phantom SCP, falsely flipping CSPMSR-true and surfacing the Engage
      // row in cwds where no actual SCP was installed (Test-027 reproduction).
      // SCPs.json IS the canonical SCP registry (per WACR M100). Cross-check
      // membership before admission. If scpName is absent from SCPs.json,
      // skip admission — the scs scp install pipeline will re-trigger this
      // Quality through scpRegistryStartupRescan once SCPs.json is updated
      // (rescan ALREADY WACR-filters via the same readScpRegistry call).
      // Cycle 143 PSCAG-PEN (Path-Equivalence-Normalization) · multi-variant.
      // Two dispatch paths feed this Quality with DIFFERENT scpPath forms:
      //   Path A (chokidar addDir):    top-level SCP dir  → basename = s.name ✅
      //   Path B (startup rescan):     nested config dir  → basename = "SCP" ❌
      // Three variants cover all known projection forms (V3 is defensive · low
      // false-positive risk because SCPs.json s.path values are specific full
      // relative paths · simple directory names like "template" won't match).
      const userCwd = deck.scpRegistryWatcher.k.userCwd.select();
      if (userCwd) {
        try {
          const registry = readScpRegistry(userCwd);
          const matched = registry?.scps?.find((s) => {
            if (typeof s?.name !== 'string' || typeof s?.path !== 'string') return false;
            // Variant 1 · chokidar top-level dir · basename matches s.name
            if (basename(scpPath) === s.name) return true;
            // Variant 2 · rescan nested config · resolved-absolute match
            const resolved = isAbsolute(s.path) ? s.path : join(userCwd, s.path);
            if (scpPath === resolved) return true;
            // Variant 3 · path-suffix safety (defensive · low false-positive risk)
            if (scpPath.endsWith(s.path)) return true;
            return false;
          });
          if (!matched) {
            console.log(
              '[Scp Registry] PSCAG-PEN: skipping non-registry entry (phantom):',
              canonicalName,
            );
            // C655: PUSH admit=false — the phantom directory ('Cascades', 'template',
            // worktree subdir) is BARRED from installedScps by the Reducer's pop guard.
            bucket.push({ admit: false, scpPath, scpName: canonicalName });
            return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
          }
          // WACR: the registry-matched name is authoritative; a carried name still
          // must exist in SCPs.json (a carried name that fails the match is skipped
          // as phantom above — the C624 carry does NOT bypass the phantom gate).
          canonicalName = matched.name;
        } catch {
          // SCPs.json read failure · fail-safe to NOT admit (better to skip
          // than admit a phantom; rescan will catch real SCPs on next bridge
          // boot or explicit rescan).
          // C655: PUSH admit=false — a read failure must not leak an unverified
          // entry into installedScps.
          bucket.push({ admit: false, scpPath, scpName: canonicalName });
          return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
        }
      }

      // C655: PUSH admit=true with the CANONICAL name (registry-refined above where
      // WACR matched). The Reducer pops this and appends installedScps under this
      // single identity — the divergence point (Reducer re-deriving basename) is gone.
      bucket.push({ admit: true, scpPath, scpName: canonicalName });

      const admitAction = deck.scpLifecycle.e.scpLifecycleRegister({
        scpName: canonicalName,
        scpPath,
        discoveredAt: Date.now(),
      });
      // C624 CHAIN-CONTINUATION: do NOT swallow an incoming rescan strategy. When
      // action.strategy exists, fire the admit as the immediate determined action
      // AND continue the successNode walk via the Strategy Temporal Expansion "Tail
      // Whip" (STRATIMUX-REFERENCE.md §Strategy Temporal Expansion, 1358-1373):
      // muxiumTimeOut defers strategySuccess(action.strategy) onto Stratimux's single
      // timeout so every subsequent chain entry admits. Absent a chain (chokidar
      // direct dispatch), the admit is a standalone strategyDetermine (unchanged).
      if (action.strategy) {
        muxiumTimeOut(concepts_, () => strategySuccess(action.strategy!) as never, 0);
      }
      return strategyDetermine(admitAction);
    }),
});
