/**
 * scsBridgeSuite8PageCreate · S8P-SCP-TOOL · suite8_page_create MCP tool
 *
 * Binds the `scs suite8:page` functionality (runSuite8PageCreate · SVLF model) as an
 * SCP-side MCP tool on the SCS-Bridge. An SCP-side caller (the Forge anchor session)
 * supplies the args via the bridge /mcp endpoint; the bridge runs the copy-move-rename
 * concept creation + foreign-file AIME wiring + gate chain (positive-presence · zero-grep
 * · tsc) FOR that SCP. FKIS origin pattern: the calling SCP's name rides the payload as
 * `designation` (payload-supplied, registry-guarded) — the SCP knows its own name.
 *
 * ── projectRoot resolution (the bridge daemon's workspace root) ──
 * getActiveScsBridgeMuxiumHandle() → handle.muxium.deck.d.scsBridge.k.userCwd.select()
 * ?? process.cwd(). userCwd is the workspace root where Cascades/SCPs.json lives (set by
 * bootBridgeDaemon · createScsBridgeState(userCwd)). This IS the projectRoot readScpRegistry
 * + runSuite8PageCreate both expect. Mirrors scsBridgeActivateScpSession.quality.huirth.ts:85.
 *
 * ── DESIGNATION GUARD (the honest FailureNode) ──
 * Before the heavy run, readScpRegistry(userCwd) is consulted: an unknown `designation`
 * (not in SCPs.json · template held back) returns a structured { ok:false, reason } — the
 * FailureNode Doctrine (a failed run returns the reason, never throws the tool). The model
 * itself also resolves+validates designation (belt-and-suspenders); this pre-guard yields a
 * clearer message than the model's most-recent fallback when the caller mis-names its SCP.
 *
 * ── SYNC RULING (the MCP response window) ──
 * runSuite8PageCreate runs `npx tsc --noEmit` SYNCHRONOUSLY (~10-30s) via execSync inside the
 * model. There is NO async/job idiom on the bridge for a DATA-returning tool — the async
 * Qualities (orchestrate-window / render-capture) await a CSSP round-trip, not a local
 * subprocess, and cannot carry a synchronous execSync result out of a fired controller
 * cleanly. So this Quality runs the model SYNCHRONOUSLY in a createMethodWithConcepts Method
 * and carries the structured result forward via strategyData_muxifyData for the SCP manifold
 * tail (scpExtractAndSendResponse) to return. CAUTION: the /mcp handler holds the socket with a
 * 30s response-timeout guard (scpExpressTransport.principle.huirth.ts). A small SCP's tsc
 * completes under 30s; a large SCP could exceed it → the caller sees the 30s timeout error
 * (the concept files are still created on disk — the caller re-checks / re-runs). The tool
 * description states this and names the caller's `npm run build:client` completion step.
 *
 * ── Reducer () => ({}) ── no own-state mutation. The disk create IS the Lambda.
 *
 * TQNI 4-site byte-match for 'Scs Bridge Suite8 Page Create':
 *   (a) ScsBridgeSuite8PageCreatePayload (scsBridge.types.ts)
 *   (b) Quality alias ScsBridgeSuite8PageCreate (scsBridge.types.ts)
 *   (c) this `type:` literal
 *   (d) registration key scsBridgeSuite8PageCreate (scsBridge.concept.ts)
 *
 * Citation: suite8PageCreate.ts (runSuite8PageCreate SVLF model) · FailureNode Doctrine ·
 * scsBridgeActivateScpSession.quality.huirth.ts (userCwd resolution + readScpRegistry guard) ·
 * scsBridgeEnqueueRelayBatch.quality.huirth.ts (createMethodWithConcepts sync form) ·
 * scsBridgeOrchestrateWindow.quality.huirth.ts (strategyData_muxifyData data return).
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
  ScsBridgeSuite8PageCreatePayload,
  ScsBridgeSuite8PageCreate,
} from '../scsBridge.types';
import { runSuite8PageCreate } from '../../../../scp/suite8PageCreate';
import { readScpRegistry } from '../../../../scp/scpPersistence';
import { getActiveScsBridgeMuxiumHandle } from '../../../scsBridgeMuxium';
import { log } from '../../../debugLog';

export type { ScsBridgeSuite8PageCreate };

export const scsBridgeSuite8PageCreate = createQualityCardWithPayload<
  ScsBridgeState,
  ScsBridgeSuite8PageCreatePayload
>({
  type: 'Scs Bridge Suite8 Page Create',
  reducer: () => ({}),
  methodCreator: () =>
    createMethodWithConcepts(({ action }) => {
      const payload = selectPayload<ScsBridgeSuite8PageCreatePayload>(action);
      const { name, displayName, designation } = payload;
      const home = payload.home === true;
      const force = payload.force === true;

      const carry = (result: unknown) =>
        action.strategy
          ? strategySuccess(
              action.strategy,
              strategyData_muxifyData(action.strategy, { suite8PageCreate: result }),
            )
          : muxiumConclude();

      // ── Input validation (honest FailureNode · never throw the tool) ──
      if (typeof name !== 'string' || name.length === 0) {
        return carry({ ok: false, reason: 'name is required (PascalCase Suite8Name).' });
      }
      if (typeof displayName !== 'string' || displayName.length === 0) {
        return carry({ ok: false, reason: 'displayName is required.' });
      }
      if (typeof designation !== 'string' || designation.length === 0) {
        return carry({
          ok: false,
          reason: 'designation is required (the calling SCP name).',
        });
      }

      // ── projectRoot resolution (the bridge daemon workspace root · SCPs.json lives here) ──
      const handle = getActiveScsBridgeMuxiumHandle();
      const projectRoot =
        handle?.muxium.deck.d.scsBridge.k.userCwd.select() ?? process.cwd();

      // ── DESIGNATION GUARD · validate against the SCPs.json registry ──
      // readScpRegistry applies the template holdback (non-debug) — an unknown SCP is an
      // honest FailureNode, not a silent most-recent fallback.
      const registry = readScpRegistry(projectRoot);
      const known = registry.scps.some((s) => s.name === designation);
      if (!known) {
        const available = registry.scps.map((s) => s.name).join(', ') || '(none)';
        log('scsbridge.suite8PageCreate.unknown-designation', { designation, available });
        return carry({
          ok: false,
          reason: `Unknown SCP designation "${designation}" — not found in Cascades/SCPs.json. Installed SCPs: ${available}.`,
        });
      }

      log('scsbridge.suite8PageCreate.invoked', {
        name,
        displayName,
        designation,
        home,
        force,
        projectRoot,
      });

      // ── The SVLF model · SYNCHRONOUS (execSync tsc inside · ~10-30s) ──
      // runSuite8PageCreate NEVER throws for a domain failure — it returns { ok:false, reason }.
      // A truly unexpected throw is caught here so the tool ACKs a reason rather than crashing
      // the manifold (FailureNode Doctrine).
      let result;
      try {
        result = runSuite8PageCreate({
          projectRoot,
          name,
          displayName,
          designation,
          home,
          force,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        log('scsbridge.suite8PageCreate.threw', { name, designation, message });
        return carry({
          ok: false,
          reason: `suite8_page_create unexpected failure: ${message}`,
        });
      }

      log('scsbridge.suite8PageCreate.result', {
        ok: result.ok,
        reason: result.reason ?? null,
        conceptName: result.conceptName ?? null,
        gatesPassed: result.gatesPassed ?? [],
      });

      return carry(result);
    }),
});
