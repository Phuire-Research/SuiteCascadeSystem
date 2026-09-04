/**
 * scsBridgeInstructionSetContentEndpoint · SEAP · the Instruction Set's CONTENT (C1053)
 *
 * THE COMMISSION (the user's word): the SuiteCascade Update Sub Page must offer *"a Viewer for the
 * SCS Contents from the CLAUDE.md"* and *"a Diff of the User's Current CLAUDE.md versus the Most
 * Recently Updated"* — BEFORE the user consents to the update.
 *
 * WHY THE CLI SERVES ALL THREE: the CLI is the Base; the SCPs are Informatives. The local
 * instruction set is the BASE PROJECT's ground (`<userCwd>/.claude/CLAUDE.md`), and the remote one
 * resolves through the SAME designation the install/update clone already honours —
 * `SCS_INSTALL_REPO_URL` → `resolveManifestSource` → a `file://` local read in the dev lane, a
 * raw.githubusercontent fetch in production. **The page never resolves a path; it asks the Base.**
 *
 * THE JUNCTION THIS DISSOLVES: the user named the difficulty as *"the Diff would have to be After the
 * Fact or Take into Account a Path Variable that is Set via an Environment Variable."* It is the
 * second, and the resolver already exists — so the preview is BEFORE the fact, in both lanes.
 *
 * THE DIFF IS WORD-LEVEL, BY MEASUREMENT: the instruction set is 500 lines / ~40 KB with a longest
 * line of 1,119 characters. Pearl-dense single-line paragraphs make a LINE diff render a one-word
 * edit as a whole-paragraph swap — correct and useless. `--word-diff` is still git; no dependency.
 * `--no-index` lets git compare two loose files without a repo; it exits 1 when they differ, which
 * gitmExec surfaces as ok:false WITH stdout intact — differences are the result, not an error.
 *
 * THE REF IS CARRIED HONESTLY: in the remote lane the text comes from `main`, which may be AHEAD of
 * the published revision the badge measured (npm-publish and git-push are not atomic — THE
 * MUXAMETER/MANIFEST DIAMETER). Until the published SHA rides the registry document (Card P4), the
 * response NAMES its ref so the surface can say "compared against latest source" rather than imply
 * "compared against what you will receive". **A diff that silently compares the wrong pair is worse
 * than no diff.**
 *
 * Three routes (the SEAP idiom · siblings of /instruction-set):
 *   GET /instruction-set/local   → { path, text, lines }
 *   GET /instruction-set/remote  → { source: 'local'|'remote', ref, text, lines } | { unavailable, reason }
 *   GET /instruction-set/diff    → { source, ref, differs, diff, localLines, remoteLines } | { unavailable, reason }
 */
import type { Deck, MuxiumDeck, PrincipleFunction } from 'stratimux';
import type { Request, Response } from 'express';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import type { ServerDeck } from '../../server/server.concept';
import type { ScsBridgeState, ScsBridgeQualities } from '../scsBridge.types';
import { SCS_INSTALL_REPO_URL } from '../../../installConstants';
import { resolveManifestSource, fetchText } from '../../../updateManifest.model';
import { gitmExec } from '../../gitm/model/gitmExec.model';
import { log } from '../../../debugLog';

type ScsBridgeInstructionSetContentDeck = Deck<MuxiumDeck & ServerDeck>;

const INSTRUCTION_SET_RELPATH = '.claude/CLAUDE.md';
// Until Card P4 publishes the release SHA into the registry document, the remote lane reads `main`.
const REMOTE_REF = 'main';

const countLines = (text: string): number => (text.length === 0 ? 0 : text.split('\n').length);

function readLocal(userCwd: string): { path: string; text: string } | null {
  const path = resolve(userCwd, INSTRUCTION_SET_RELPATH);
  try {
    return { path, text: readFileSync(path, 'utf8') };
  } catch {
    return null;
  }
}

type RemoteRead =
  | { ok: true; source: 'local' | 'remote'; ref: string; text: string }
  | { ok: false; reason: string };

// THE TWO-LAYER SOURCE — the same resolver the manifest fetch and the install clone already ride.
async function readRemote(): Promise<RemoteRead> {
  const source = resolveManifestSource(SCS_INSTALL_REPO_URL);
  if (source.kind === 'local') {
    // DEV LANE · SCS_INSTALL_REPO_URL is file:// → the working tree IS the truth; no ref to pin.
    try {
      const text = readFileSync(resolve(source.root, INSTRUCTION_SET_RELPATH), 'utf8');
      return { ok: true, source: 'local', ref: 'working-tree', text };
    } catch (err) {
      return { ok: false, reason: `local read failed: ${err instanceof Error ? err.message : String(err)}` };
    }
  }
  const outcome = await fetchText(source.owner, source.repo, REMOTE_REF, INSTRUCTION_SET_RELPATH);
  if (outcome.status !== 'ok') return { ok: false, reason: outcome.reason };
  return { ok: true, source: 'remote', ref: REMOTE_REF, text: outcome.text };
}

export const scsBridgeInstructionSetContentEndpointPrinciple: PrincipleFunction<
  ScsBridgeQualities,
  ScsBridgeInstructionSetContentDeck,
  ScsBridgeState
> = ({ d_ }) => {
  const expressApp = d_.muxium.d.server.k.server.select();
  if (!expressApp) {
    console.error('[SCS-Bridge SEAP] No Express server in state · /instruction-set/* content routes NOT registered');
    return;
  }

  expressApp.get('/instruction-set/local', (_req: Request, res: Response) => {
    const local = readLocal(process.cwd());
    if (!local) {
      res.json({ unavailable: true, reason: `no ${INSTRUCTION_SET_RELPATH} at the workspace root` });
      return;
    }
    res.json({ path: local.path, text: local.text, lines: countLines(local.text) });
  });

  expressApp.get('/instruction-set/remote', async (_req: Request, res: Response) => {
    const remote = await readRemote();
    if (!remote.ok) {
      log('seap.instructionset.remote.unavailable', { reason: remote.reason });
      res.json({ unavailable: true, reason: remote.reason });
      return;
    }
    res.json({ source: remote.source, ref: remote.ref, text: remote.text, lines: countLines(remote.text) });
  });

  expressApp.get('/instruction-set/diff', async (_req: Request, res: Response) => {
    const local = readLocal(process.cwd());
    if (!local) {
      res.json({ unavailable: true, reason: `no ${INSTRUCTION_SET_RELPATH} at the workspace root` });
      return;
    }
    const remote = await readRemote();
    if (!remote.ok) {
      log('seap.instructionset.diff.unavailable', { reason: remote.reason });
      res.json({ unavailable: true, reason: remote.reason });
      return;
    }
    // Two loose files → git compares them without a repo. Temp dir, always cleaned.
    let dir: string | null = null;
    try {
      dir = mkdtempSync(join(tmpdir(), 'scs-isdiff-'));
      const a = join(dir, 'current.md');
      const b = join(dir, 'published.md');
      writeFileSync(a, local.text, 'utf8');
      writeFileSync(b, remote.text, 'utf8');
      // exit 1 = differences (gitmExec surfaces as ok:false with stdout intact) · exit 0 = identical.
      const r = gitmExec(['diff', '--no-index', '--word-diff=plain', '--', a, b], dir);
      const differs = r.stdout.trim().length > 0;
      res.json({
        source: remote.source,
        ref: remote.ref,
        differs,
        diff: r.stdout,
        localLines: countLines(local.text),
        remoteLines: countLines(remote.text),
      });
    } catch (err) {
      log('seap.instructionset.diff.error', { error: err instanceof Error ? err.message : String(err) });
      res.json({ unavailable: true, reason: err instanceof Error ? err.message : String(err) });
    } finally {
      if (dir) {
        try { rmSync(dir, { recursive: true, force: true }); } catch { /* best-effort cleanup */ }
      }
    }
  });
};
