/**
 * watcherFence.model · BO-2-H (C448) · THE WORKSPACE FENCE — the locale law, enforced
 * structurally at every daemon watcher arm.
 *
 * THE DEFECT CLASS (the C447 Diagnostic Shotgun): under the npm-link (pre-release,
 * deliberate), BOTH workspaces' bridge daemons execute the dev tree's dist — and the Lab's
 * daemon was lsof-PROVEN to hold live recursive watches on the DEV repo tree. Whichever
 * derivation leaks (module-relative · env drift · registry cross-read), a daemon watcher
 * armed OUTSIDE its own workspace reacts to a FOREIGN workspace's changes and restarts its
 * OWN active SCP — the both-SCPs turn-over.
 *
 * THE LAW: a bridge daemon may only watch paths INSIDE its own workspace (userCwd). Every
 * arm site passes its targets through fenceWatchTargets(); outside-paths are DROPPED with
 * `watcher.fence.skip` telemetry naming the site, the dropped path, and the userCwd — the
 * next cross-workspace arm attempt REPORTS ITSELF instead of silently crossing.
 *
 * No allow-list exists by default. If a legitimate outside-workspace watch ever emerges,
 * it must be added here EXPLICITLY with its reason — never at the arm site.
 */

import { realpathSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { log } from './debugLog';

function realOrResolved(p: string): string {
  try {
    return realpathSync(p);
  } catch {
    // The target may not exist yet (watchers often arm on future files) — fence on the
    // resolved lexical path instead.
    return resolve(p);
  }
}

/**
 * Returns only the targets INSIDE userCwd; drops (and telemeters) the rest.
 * An empty return means the site should not arm (chokidar on [] is inert either way).
 */
export function fenceWatchTargets(
  site: string,
  targets: string | string[],
  userCwd: string,
): string[] {
  const list = Array.isArray(targets) ? targets : [targets];
  const root = realOrResolved(userCwd);
  const kept: string[] = [];
  for (const t of list) {
    const real = realOrResolved(t);
    if (real === root || real.startsWith(root + sep)) {
      kept.push(t);
    } else {
      log('watcher.fence.skip', { site, dropped: t, resolved: real, userCwd: root });
      console.log('[WatcherFence] SKIP ·', site, '· outside workspace ·', real, '· userCwd=', root);
    }
  }
  return kept;
}
