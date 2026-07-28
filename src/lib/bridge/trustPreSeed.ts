import { existsSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import { homedir } from 'node:os';
import * as path from 'node:path';

/**
 * Diamond B-13 Fix 1 (CD-38 · Haiku-Trust-Dialog-Accepted-JSON-Pre-Seed):
 *
 * Pre-seed Claude Code's workspace-trust acceptance for `userCwd` in `~/.claude.json`
 * BEFORE spawn. Bypasses the first-time directory-trust dialog that otherwise blocks
 * the install instance's UserPromptSubmit hook + auto-priming flow.
 *
 * Mechanism Lambda-confirmed by Diamond B-12 Orange B2 deeper probe:
 * - `~/.claude.json` (root file at $HOME, NOT `~/.claude/` directory) contains
 *   `projects["<absolutePath>"].hasTrustDialogAccepted: boolean`.
 * - test-005 had `true` (user accepted in earlier test); test-006 had `false`
 *   (dialog still firing). Distinct-Demometer-By-Diameter evidence sufficient.
 * - Anthropic docs confirm: "`~/.claude.json` contains... per-project state
 *   (allowed tools, trust settings)."
 *
 * Green Fix 5: atomic write via `<path>.tmp` + `renameSync` for crash-safety
 * (matches registry.ts saveRegistry pattern).
 *
 * Pattern 4.1 sanctioning: bridge writes user-state file under user authority
 * (trust-confer-confirm KeyAction → handleInstall → preSeedTrust).
 *
 * Non-fatal on any failure — caller logs and falls back to user-click on dialog.
 */
export function preSeedTrust(userCwd: string): {
  fileExisted: boolean;
  entryExisted: boolean;
  alreadyTrusted: boolean;
} {
  const claudeJsonPath = path.join(homedir(), '.claude.json');
  const tmpPath = claudeJsonPath + '.tmp';

  const fileExisted = existsSync(claudeJsonPath);
  let data: { projects?: Record<string, Record<string, unknown>> } & Record<string, unknown> = {};

  if (fileExisted) {
    try {
      const raw = readFileSync(claudeJsonPath, 'utf8');
      data = JSON.parse(raw);
    } catch {
      // Corrupt or unparseable; treat as fresh and proceed
      data = {};
    }
  }

  if (!data.projects) {
    data.projects = {};
  }

  const entryExisted = userCwd in data.projects;
  const existing = data.projects[userCwd] ?? {};
  const alreadyTrusted = existing.hasTrustDialogAccepted === true;

  data.projects[userCwd] = {
    ...existing,
    hasTrustDialogAccepted: true,
  };

  // Atomic write (Green Fix 5)
  writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf8');
  renameSync(tmpPath, claudeJsonPath);

  return { fileExisted, entryExisted, alreadyTrusted };
}
