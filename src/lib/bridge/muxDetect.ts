// Diamond B-24 (CD-84 MPAD · Muxified-Path-Activation-Discrimination):
// Detection module that probes user's cwd before any install write to determine
// whether to route to Muxified Path (compose-not-replace) or fresh scaffold.
//
// Pattern 4 Modulation: filesystem-only probe at user cwd; never reads
// ~/.claude/projects/ or any Claude-owned state. Detection runs in BOTH
// install and reinstall flows (CD-89 RRTMU unification).

import { existsSync, readdirSync, statSync, readFileSync } from 'node:fs';
import * as path from 'node:path';
import { ICED_DIR_NAME, ICED_MANIFEST_FILENAME } from './installConstants';

// User's pre-existing Claude Code state at install moment.
// Each field reflects whether the corresponding file/dir exists with non-trivial content.
export type UserStatePresence = {
  hasRootClaudeMd: boolean;
  hasDotClaudeClaudeMd: boolean;
  hasUserAgents: boolean;
  hasUserCommands: boolean;
  hasUserSettings: boolean;
  detected: boolean;
  // C782 · THE SCS-SIGNATURE DISCRIMINANT: true when the probed state carried SCS's OWN
  // artifacts (the Manifold CLAUDE.md · scs--prefixed agents/commands) — a prior/partial
  // install's residue, NOT user content. `detected` EXCLUDES such state (the Blank-Test-001
  // false flag: existence-only detection re-detected our own conversion as "user state").
  priorScsDetected: boolean;
};

// Mux state determines install routing:
//   'fresh'    — no user state, no Iced; standard Path A scaffold
//   'muxified' — user state present, no Iced; first-time Muxified install
//   'remuxify' — Iced manifest present; previous Muxified install detected
export type MuxState = 'fresh' | 'muxified' | 'remuxify';

// Diamond B-24 (CD-84 MPAD): inspect user's cwd for pre-existing Claude Code state.
// C782 · content-signature helpers — presence is judged by CONTENT, not existence.
const isScsManifoldContent = (filePath: string): boolean => {
  try {
    const text = readFileSync(filePath, 'utf8');
    return text.includes('SECTION 0: EMBODIMENT') && text.includes('STRATIDIA MUXONOMY');
  } catch {
    return false;
  }
};
const isAllScsPrefixed = (dir: string): boolean => {
  try {
    const entries = readdirSync(dir).filter((f) => !f.startsWith('.'));
    return entries.length > 0 && entries.every((f) => f.startsWith('scs-'));
  } catch {
    return false;
  }
};

export function detectUserState(userCwd: string): UserStatePresence {
  const rootClaudeMd = path.join(userCwd, 'CLAUDE.md');
  const dotClaude = path.join(userCwd, '.claude');
  const dotClaudeClaudeMd = path.join(dotClaude, 'CLAUDE.md');
  const dotClaudeAgents = path.join(dotClaude, 'agents');
  const dotClaudeCommands = path.join(dotClaude, 'commands');
  const dotClaudeSettings = path.join(dotClaude, 'settings.json');

  // C782 · each presence gate excludes SCS's own artifacts (the signature discriminant).
  const rootExists = existsSync(rootClaudeMd) && statSync(rootClaudeMd).size > 0;
  const dotExists = existsSync(dotClaudeClaudeMd) && statSync(dotClaudeClaudeMd).size > 0;
  const rootIsScs = rootExists && isScsManifoldContent(rootClaudeMd);
  const dotIsScs = dotExists && isScsManifoldContent(dotClaudeClaudeMd);
  const agentsExist = hasNonEmptyDir(dotClaudeAgents);
  const commandsExist = hasNonEmptyDir(dotClaudeCommands);
  const agentsAreScs = agentsExist && isAllScsPrefixed(dotClaudeAgents);
  const commandsAreScs = commandsExist && isAllScsPrefixed(dotClaudeCommands);

  const hasRootClaudeMd = rootExists && !rootIsScs;
  const hasDotClaudeClaudeMd = dotExists && !dotIsScs;
  const hasUserAgents = agentsExist && !agentsAreScs;
  const hasUserCommands = commandsExist && !commandsAreScs;
  const hasUserSettings = existsSync(dotClaudeSettings) && hasNonEmptySettings(dotClaudeSettings);

  const priorScsDetected = rootIsScs || dotIsScs || agentsAreScs || commandsAreScs;
  const detected =
    hasRootClaudeMd || hasDotClaudeClaudeMd || hasUserAgents || hasUserCommands || hasUserSettings;

  return {
    hasRootClaudeMd,
    hasDotClaudeClaudeMd,
    hasUserAgents,
    hasUserCommands,
    hasUserSettings,
    detected,
    priorScsDetected,
  };
}

// Diamond B-24 (CD-84 MPAD + CD-89 RRTMU): unified mux state for install/reinstall routing.
export function detectMuxState(userCwd: string): {
  state: MuxState;
  userState: UserStatePresence;
  icedManifestPath: string;
  hasIcedManifest: boolean;
} {
  const icedManifestPath = path.join(userCwd, 'Cascades', ICED_DIR_NAME, ICED_MANIFEST_FILENAME);
  const hasIcedManifest = existsSync(icedManifestPath);
  const userState = detectUserState(userCwd);

  let state: MuxState;
  if (hasIcedManifest) {
    state = 'remuxify';
  } else if (userState.detected) {
    state = 'muxified';
  } else {
    state = 'fresh';
  }

  return { state, userState, icedManifestPath, hasIcedManifest };
}

function hasNonEmptyDir(p: string): boolean {
  if (!existsSync(p)) return false;
  try {
    const entries = readdirSync(p);
    return entries.some((name) => {
      if (name === '.gitkeep' || name === '.DS_Store') return false;
      return true;
    });
  } catch {
    return false;
  }
}

function hasNonEmptySettings(p: string): boolean {
  try {
    const raw = readFileSync(p, 'utf8').trim();
    if (raw === '' || raw === '{}') return false;
    const parsed = JSON.parse(raw);
    return Object.keys(parsed).length > 0;
  } catch {
    return false;
  }
}
