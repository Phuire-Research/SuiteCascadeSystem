/**
 * scsBridgeSuite8PageTransfer · EF-5 · suite8_page_transfer MCP tool
 *
 * THE EXACT-MEANS TRANSFER — the sibling of suite8_page_create. Installs an EXISTING Suite 8
 * page from a SOURCE SCP onto a TARGET SCP. Where suite8_page_create scaffolds a fresh page
 * from the template, this REUSES the create engine to lay the scaffold + AIME wirings + gates
 * on the TARGET, then OVERLAYS the source SCP's REAL concept body over that scaffold so the
 * target receives the source's actual, evolved page (not a template blank).
 *
 * ── The six-step motion ──
 *   (1) Resolve BOTH SCP roots (the SAME registry resolution create uses · readScpRegistry).
 *       Source AND target must both be installed — an absent one is an honest { ok:false, error }.
 *   (2) Run the SAME runSuite8PageCreate engine (untouched) against the TARGET root with the
 *       designation-as-name. The engine scaffolds src/concepts/<dir>, token-renames, wires the
 *       3 AIMEs (IslandWrapper / huirth / vue.principle registry), and runs its own gate chain.
 *       The engine's result carries conceptName + newConceptDir — the dir we overlay.
 *   (3) THE OVERLAY: move the target's freshly-minted src/concepts/<dir> aside to a temp sibling
 *       (the revert seat), then recursively copy the SOURCE's src/concepts/<dir> into the target.
 *   (4) Copy the SOURCE's Cascades/8_SUITES/<designation>/ → target (recursive · create parents ·
 *       EXACT designation spelling only — variant reconciliation is the CALLER's judgment).
 *   (5) THE GATE: run `npx tsc --noEmit` in the TARGET root (the same execSync idiom the engine
 *       uses for its own gates — this is RUNTIME code the bridge executes, not the agent). On
 *       nonzero exit: restore the scaffold from the temp seat, remove the copied 8_SUITES dir,
 *       return { ok:false, reverted:true, tscErrors }. On zero: remove the temp seat.
 *   (6) Return { ok:true, engine, overlaidFiles, suitePackageCopied, tscExit:0, changed }.
 *
 * npm installs, concern judgment, the install report and the closing motion remain the
 * CALLER's (the Entourage's) — this tool lands the files + proves the target compiles.
 *
 * ── projectRoot resolution (mirrors the create sibling) ──
 * getActiveScsBridgeMuxiumHandle() → userCwd ?? process.cwd(). userCwd is the workspace root
 * where Cascades/SCPs.json lives; readScpRegistry(projectRoot) + runSuite8PageCreate both expect it.
 *
 * ── Reducer () => ({}) ── no own-state mutation. The disk transfer IS the Lambda. The
 * structured result rides strategyData_muxifyData ({ suite8PageTransfer }) out through the SCP
 * manifold tail (scpExtractAndSendResponse). All fs work is synchronous with try/catch → honest
 * { ok:false, error } (never throws through the tool lane).
 *
 * TQNI 4-site byte-match for 'Scs Bridge Suite8 Page Transfer':
 *   (a) ScsBridgeSuite8PageTransferPayload (scsBridge.types.ts)
 *   (b) Quality alias ScsBridgeSuite8PageTransfer (scsBridge.types.ts)
 *   (c) this `type:` literal
 *   (d) registration key scsBridgeSuite8PageTransfer (scsBridge.concept.ts)
 *
 * Citation: scsBridgeSuite8PageCreate.quality.huirth.ts (the carry(result) + engine-invocation
 * + readScpRegistry-guard mirror) · suite8PageCreate.ts (runSuite8PageCreate · Suite8PageCreateResult
 * conceptName/newConceptDir) · scpPersistence.ts readScpRegistry (entry.path resolution).
 */

import {
  createQualityCardWithPayload,
  createMethodWithConcepts,
  selectPayload,
  muxiumConclude,
  strategySuccess,
  strategyData_muxifyData,
} from 'stratimux';
import type {
  ScsBridgeState,
  ScsBridgeSuite8PageTransferPayload,
  ScsBridgeSuite8PageTransfer,
} from '../scsBridge.types';
import { runSuite8PageCreate } from '../../../../scp/suite8PageCreate';
import { readScpRegistry } from '../../../../scp/scpPersistence';
import { getActiveScsBridgeMuxiumHandle } from '../../../scsBridgeMuxium';
import { log } from '../../../debugLog';
import {
  existsSync,
  rmSync,
  renameSync,
  cpSync,
  readdirSync,
  statSync,
} from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

export type { ScsBridgeSuite8PageTransfer };

// Count every file under a directory tree (the overlaidFiles Concluder · a real number, not a claim).
function countFilesRecursive(dir: string): number {
  let count = 0;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      count += countFilesRecursive(full);
    } else {
      count += 1;
    }
  }
  return count;
}

export const scsBridgeSuite8PageTransfer = createQualityCardWithPayload<
  ScsBridgeState,
  ScsBridgeSuite8PageTransferPayload
>({
  type: 'Scs Bridge Suite8 Page Transfer',
  reducer: () => ({}),
  methodCreator: () =>
    createMethodWithConcepts(({ action }) => {
      const payload = selectPayload<ScsBridgeSuite8PageTransferPayload>(action);
      const { designation, sourceScpName, targetScpName } = payload;

      const carry = (result: unknown) =>
        action.strategy
          ? strategySuccess(
              action.strategy,
              strategyData_muxifyData(action.strategy, { suite8PageTransfer: result }),
            )
          : muxiumConclude();

      // ── Input validation (honest FailureNode · never throw the tool) ──
      if (typeof designation !== 'string' || designation.length === 0) {
        return carry({ ok: false, error: 'designation is required (the Suite 8 page name).' });
      }
      if (typeof sourceScpName !== 'string' || sourceScpName.length === 0) {
        return carry({ ok: false, error: 'sourceScpName is required.' });
      }
      if (typeof targetScpName !== 'string' || targetScpName.length === 0) {
        return carry({ ok: false, error: 'targetScpName is required.' });
      }

      // ── (1) projectRoot + BOTH SCP roots (the SAME registry resolution create uses) ──
      const handle = getActiveScsBridgeMuxiumHandle();
      const projectRoot =
        handle?.muxium.deck.d.scsBridge.k.userCwd.select() ?? process.cwd();

      const registry = readScpRegistry(projectRoot);
      const sourceEntry = registry.scps.find((s) => s.name === sourceScpName);
      const targetEntry = registry.scps.find((s) => s.name === targetScpName);
      if (!sourceEntry) {
        const available = registry.scps.map((s) => s.name).join(', ') || '(none)';
        return carry({
          ok: false,
          error: `Source SCP "${sourceScpName}" not found in Cascades/SCPs.json. Installed: ${available}.`,
        });
      }
      if (!targetEntry) {
        const available = registry.scps.map((s) => s.name).join(', ') || '(none)';
        return carry({
          ok: false,
          error: `Target SCP "${targetScpName}" not found in Cascades/SCPs.json. Installed: ${available}.`,
        });
      }
      // entry.path = 'Cascades/scps/{Designation}/SCP' (the S0 scpRoot join the engine performs).
      const sourceScpRoot = join(projectRoot, sourceEntry.path);
      const targetScpRoot = join(projectRoot, targetEntry.path);

      log('scsbridge.suite8PageTransfer.invoked', {
        designation,
        sourceScpName,
        targetScpName,
        projectRoot,
        sourceScpRoot,
        targetScpRoot,
      });

      // ── (2) Run the SAME engine against the TARGET (designation-as-name · engine UNTOUCHED) ──
      // The engine resolves scpRoot from readScpRegistry(projectRoot) keyed by its `designation`
      // arg — which is the TARGET SCP name here. `name` is the Suite 8 page's PascalCase name (the
      // transfer's `designation`). displayName falls to the engine's PascalCase→spaced derivation.
      let engineResult;
      try {
        engineResult = runSuite8PageCreate({
          projectRoot,
          name: designation,          // the Suite 8 page's PascalCase Suite8Name
          designation: targetScpName, // the TARGET SCP (create's `designation` = the SCP name)
          force: true,                // overwrite any prior scaffold — the overlay replaces it wholesale
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        log('scsbridge.suite8PageTransfer.engine-threw', { designation, targetScpName, message });
        return carry({ ok: false, error: `engine unexpected failure: ${message}` });
      }
      if (!engineResult.ok) {
        log('scsbridge.suite8PageTransfer.engine-failed', {
          designation,
          reason: engineResult.reason ?? null,
        });
        return carry({
          ok: false,
          error: `target scaffold engine failed: ${engineResult.reason ?? 'unknown'}`,
          engine: engineResult,
        });
      }

      // The engine tells us the concept dir it minted (conceptName = camelCase · the domain→dir
      // helper's output). newConceptDir is the absolute path under the TARGET scpRoot.
      const conceptName = engineResult.conceptName;
      const targetConceptDir =
        engineResult.newConceptDir ??
        (conceptName ? join(targetScpRoot, 'src/concepts', conceptName) : null);
      if (!conceptName || !targetConceptDir || !existsSync(targetConceptDir)) {
        return carry({
          ok: false,
          error: `engine ok but the minted concept dir is absent (conceptName=${conceptName ?? 'null'}).`,
          engine: engineResult,
        });
      }

      // The SOURCE concept dir mirrors the SAME derivation (same conceptName under the source root).
      const sourceConceptDir = join(sourceScpRoot, 'src/concepts', conceptName);
      if (!existsSync(sourceConceptDir)) {
        // The source has no such page — the scaffold we just minted is a bare create, not a
        // transfer. Revert the scaffold so we do not leave a template-blank claiming a transfer.
        rmSync(targetConceptDir, { recursive: true, force: true });
        return carry({
          ok: false,
          error: `Source concept body not found at ${sourceConceptDir} — "${designation}" is not installed on "${sourceScpName}".`,
          engine: engineResult,
        });
      }

      // ── (3) THE OVERLAY · scaffold aside to a temp revert seat, then copy the SOURCE body in ──
      const tempSeat = `${targetConceptDir}.transfer-scaffold-bak`;
      let overlaidFiles = 0;
      let suitePackageCopied = false;
      const targetSuiteDir = join(targetScpRoot, 'Cascades', '8_SUITES', designation);
      try {
        if (existsSync(tempSeat)) rmSync(tempSeat, { recursive: true, force: true });
        renameSync(targetConceptDir, tempSeat);
        cpSync(sourceConceptDir, targetConceptDir, { recursive: true });
        overlaidFiles = countFilesRecursive(targetConceptDir);

        // ── (4) Copy the SOURCE's Cascades/8_SUITES/<designation>/ → target (EXACT spelling) ──
        const sourceSuiteDir = join(sourceScpRoot, 'Cascades', '8_SUITES', designation);
        if (existsSync(sourceSuiteDir)) {
          cpSync(sourceSuiteDir, targetSuiteDir, { recursive: true });
          suitePackageCopied = true;
        } else {
          log('scsbridge.suite8PageTransfer.no-suite-package', { sourceSuiteDir });
        }
      } catch (err) {
        // Overlay/copy failure BEFORE the gate → restore the scaffold, remove any partial suite copy.
        const message = err instanceof Error ? err.message : String(err);
        try {
          if (existsSync(tempSeat)) {
            rmSync(targetConceptDir, { recursive: true, force: true });
            renameSync(tempSeat, targetConceptDir);
          }
          if (suitePackageCopied && existsSync(targetSuiteDir)) {
            rmSync(targetSuiteDir, { recursive: true, force: true });
          }
        } catch {
          /* best-effort revert · report the original error below */
        }
        log('scsbridge.suite8PageTransfer.overlay-failed', { designation, message });
        return carry({ ok: false, reverted: true, error: `overlay failed: ${message}`, engine: engineResult });
      }

      // ── (5) THE GATE · npx tsc --noEmit in the TARGET root (the engine's own gate idiom) ──
      try {
        execSync('npx tsc --noEmit', { cwd: targetScpRoot, stdio: 'pipe' });
      } catch (e) {
        // Nonzero tsc exit → restore the scaffold from the temp seat, remove the copied 8_SUITES.
        const raw = (e as { stdout?: { toString(): string }; message?: string }).stdout
          ? (e as { stdout: { toString(): string } }).stdout.toString()
          : (e as Error).message;
        const tscErrors = raw.split('\n').slice(0, 40).join('\n');
        try {
          rmSync(targetConceptDir, { recursive: true, force: true });
          if (existsSync(tempSeat)) renameSync(tempSeat, targetConceptDir);
          if (suitePackageCopied && existsSync(targetSuiteDir)) {
            rmSync(targetSuiteDir, { recursive: true, force: true });
          }
        } catch (revErr) {
          log('scsbridge.suite8PageTransfer.revert-failed', {
            designation,
            error: revErr instanceof Error ? revErr.message : String(revErr),
          });
        }
        log('scsbridge.suite8PageTransfer.tsc-failed', { designation, targetScpName });
        return carry({
          ok: false,
          reverted: true,
          tscErrors,
          engine: engineResult,
        });
      }

      // ── zero exit · remove the temp seat (the transfer stands) ──
      try {
        if (existsSync(tempSeat)) rmSync(tempSeat, { recursive: true, force: true });
      } catch {
        /* the seat is cosmetic once tsc passed · non-fatal */
      }

      const changed = [
        `${targetEntry.path}/src/concepts/${conceptName}/ (overlaid · ${overlaidFiles} files)`,
        suitePackageCopied
          ? `${targetEntry.path}/Cascades/8_SUITES/${designation}/`
          : '(no 8_SUITES package on source)',
        'the 3 AIME wirings (IslandWrapper / huirth / vue.principle registry) via the engine',
      ];

      log('scsbridge.suite8PageTransfer.done', {
        designation,
        targetScpName,
        overlaidFiles,
        suitePackageCopied,
      });

      return carry({
        ok: true,
        engine: engineResult,
        overlaidFiles,
        suitePackageCopied,
        tscExit: 0,
        changed,
      });
    }),
});
