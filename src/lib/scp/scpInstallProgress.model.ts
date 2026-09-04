/**
 * scpInstallProgress.model · C839 · THE STAGED INSTALL RELAY (Clone → Install → Ready)
 *
 * The manifest-install pipeline writes per-designation stage transitions into a
 * bridge-owned sidecar file — `Cascades/Bridge/scp-install-progress.<Designation>.json`
 * — at each leg. The SCP page polls it through a thin MOCH proxy route (the
 * /gitm-update-diff idiom VERBATIM: read the bridge-owned file on demand · AFPR —
 * absent/unreadable/malformed → 200 null) and renders the staged rail. The remuxification
 * of the SCP WorkTree scaffolding's proven shape: progress the whole way, registration
 * IS the reactive availability, and a failure carries its HONEST REASON to the page
 * (the C839 field wound: "accepted" → silence → debug-only clone failure).
 *
 * Best-effort ALWAYS: a progress write must never fail the install itself.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import * as path from 'node:path';
import { workspaceBridgeDir } from '../bridge/paths';

export type ScpInstallStage = 'cloning' | 'installing' | 'ready' | 'failed';

export type ScpInstallProgress = {
  designation: string;
  stage: ScpInstallStage;
  /** The human line for the current leg (e.g. 'cloning at anchor be27116e'). */
  detail: string;
  /** The honest failure reason — '' unless stage === 'failed'. */
  reason: string;
  /** The pinned commit hash ('' when the install is un-anchored). */
  anchor: string;
  at: number;
};

export function installProgressPath(projectRoot: string, designation: string): string {
  return path.join(workspaceBridgeDir(projectRoot), `scp-install-progress.${designation}.json`);
}

export function writeInstallProgress(projectRoot: string, p: ScpInstallProgress): void {
  try {
    const target = installProgressPath(projectRoot, p.designation);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, JSON.stringify(p, null, 2), 'utf-8');
  } catch {
    /* best-effort — the stage relay never fails the install */
  }
}
