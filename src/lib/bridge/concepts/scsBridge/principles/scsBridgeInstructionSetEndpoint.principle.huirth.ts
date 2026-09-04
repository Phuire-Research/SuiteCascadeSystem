/**
 * scsBridgeInstructionSetEndpoint · SEAP · Server-Extension Instruction-Set Principle (C1046)
 *
 * THE COMMISSION (the user's word): *"the Specific InstructionSet can be Pulled Directly from the
 * SCS Bridge CLI… Two Queries, 1 for the Majority, and 1 for the Project Specific Aspect of the
 * Muxameter."*
 *
 * THE SECOND QUERY. The badge's first query (`/scs-bridge-version`, served by the SCP's own server)
 * answers what the ARTIFACT is — installed version, npm latest, the cli/scp counters. **This one
 * answers what the BASE PROJECT carries** — the instruction set its `Cascades/Cascade.json` was
 * stamped with, and whether the published revision has moved past it.
 *
 * WHY THE CLI SERVES IT AND NOT THE SCP: **the CLI is the Base; the SCPs are the Informatives.** The
 * base project's `Cascade.json` is the ground, and the CLI is the process rooted in it — it does not
 * infer that path, it IS there. An SCP-side read would add a reader per SCP to a file that already
 * has exactly one watcher in this process (`bridgeStateFeed.ts`). One ground, one reader, N informed.
 *
 * THE FACT IS ALREADY DERIVED — this route SERVES, it does not COMPUTE. `bridgeMetadata`'s
 * `deriveInstructionSetDrift` reads the project stamp at every bridge.json write and compares it to
 * the published counter; this endpoint hands that verdict out. **A route that re-derived would be a
 * second opinion, and two opinions on one fact is how surfaces come to disagree.**
 *
 * ABSENCE IS A STATE, AND IT IS NOT "BEHIND": a workspace installed before the iterator existed has
 * no stamp through no fault of its own, and a bridge whose registry check has not landed has no
 * remote. Both serve `installed: null` anor `updateAvailable: false`. **NEVER a 0 floor — 0 reads as
 * infinitely behind and would nag every legacy install forever.**
 *
 * One route (the SEAP idiom verbatim · mirrors /scp-status/:scpName · /gitm-status):
 * C1057 · THE TWO-LAYER PUBLISHED SOURCE. `published` rides the SAME manifest source as the content
 * routes (`resolveManifestSource(SCS_INSTALL_REPO_URL)` · LSSI): a `file://` self-tree reads the local
 * repo's package.json counter; a remote reads the npm registry doc. Before this the content half read
 * the dev repo while the counter half read npm — `published` was null on every dev machine, so the
 * badge's reveal could never fire. `publishedSource` names which layer answered.
 *
 *   GET /instruction-set → { installed, published, publishedSource, updateAvailable, checkedAt }
 */
import type { Deck, MuxiumDeck, PrincipleFunction } from 'stratimux';
import type { Request, Response } from 'express';
import type { ServerDeck } from '../../server/server.concept';
import type { ScsBridgeState, ScsBridgeQualities } from '../scsBridge.types';
import { getNpmVersionCheck } from '../../../npmVersionCheck';
import { readProjectInstructionSet, resolvePublishedInstructionSet } from '../../../bridgeMetadata';
import { log } from '../../../debugLog';

type ScsBridgeInstructionSetDeck = Deck<MuxiumDeck & ServerDeck>;

export const scsBridgeInstructionSetEndpointPrinciple: PrincipleFunction<
  ScsBridgeQualities,
  ScsBridgeInstructionSetDeck,
  ScsBridgeState
> = ({ d_ }) => {
  const expressApp = d_.muxium.d.server.k.server.select();
  if (!expressApp) {
    console.error('[SCS-Bridge SEAP] No Express server in state · /instruction-set NOT registered');
    return;
  }

  expressApp.get('/instruction-set', (_req: Request, res: Response) => {
    try {
      // Read FRESH on every request — the project's stamp moves when the user runs the update
      // command, and a cached answer would keep the badge lit after they had already fixed it.
      const installed = readProjectInstructionSet(process.cwd());
      const check = getNpmVersionCheck();
      const { published, source: publishedSource } = resolvePublishedInstructionSet();
      const bothKnown = typeof installed === 'number' && typeof published === 'number';
      res.json({
        installed,
        published,
        publishedSource,
        // Mirrors deriveInstructionSetDrift EXACTLY (different, not merely behind; unknown → false).
        updateAvailable: bothKnown && installed !== published,
        checkedAt: check.versionCheckedAt ?? null,
      });
    } catch (err) {
      // A read failure is NOT drift. Report the honest unknown so no surface can speak "behind"
      // from an error path — the same discipline /scp-status holds for "crashed".
      log('seap.instructionset.error', { error: err instanceof Error ? err.message : String(err) });
      res.json({ installed: null, published: null, publishedSource: null, updateAvailable: false, checkedAt: null });
    }
  });
};
