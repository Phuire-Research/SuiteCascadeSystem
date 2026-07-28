// Diamond B-25-UX (CD-103 RIIA · Renewable-Intelligence-Install-Activation):
// Atomic write of Onyx-Tier-1 + Diamond-Tier-1 + Cascade.json cycle 0→1.
// All-or-none contract — partial state is the failure mode to prevent
// (Suite 6 Purple D-6 high-severity risk).
//
// Write order (Suite 4 Green Angle 6): Onyx FIRST (immutable Pearl seed),
// Diamond SECOND (mutable plan), Cascade.json LAST (live state · atomic via temp+rename).
// On any step failure: rollback prior writes via deletion.

import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import * as path from 'node:path';
import { log } from './debugLog';

export type FirstDiamondType = 'tutorial' | 'recovery';

export type RiActivationOpts = {
  userCwd: string; // user's cwd · Cascades/ already scaffolded
  suite8Name: string; // Suite 8 name selected via SM-NAME-SUITE-8
  diamondType: FirstDiamondType; // 'tutorial' (fresh-slate) or 'recovery' (existing-project)
  cinnabarSummary?: string | null; // Cinnabar dialectic output (recovery direction) · null for tutorial
};

export type RiActivationResult = {
  onyxPath: string;
  diamondPath: string;
  cascadeJsonPath: string;
  cycleBefore: number;
  cycleAfter: number;
};

// Diamond B-25-UX (CD-103 RIIA): atomic RI activation.
// Throws on any failure · attempts rollback of prior writes.
export function activateRenewableIntelligence(opts: RiActivationOpts): RiActivationResult {
  const { userCwd, suite8Name, diamondType, cinnabarSummary } = opts;
  const workingDir = path.join(userCwd, 'Cascades', 'Working');
  const onyxPath = path.join(workingDir, 'ONYX-TIER-1.md');
  const diamondPath = path.join(workingDir, 'DIAMOND-TIER-1.md');
  const cascadeJsonPath = path.join(userCwd, 'Cascades', 'Cascade.json');

  if (!existsSync(workingDir)) {
    mkdirSync(workingDir, { recursive: true });
  }

  // Step 0: read current Cascade.json (capture cycle for revert)
  let cascade: Record<string, unknown> = {};
  let cycleBefore = 0;
  if (existsSync(cascadeJsonPath)) {
    try {
      cascade = JSON.parse(readFileSync(cascadeJsonPath, 'utf8')) as Record<string, unknown>;
      const cyclePos = cascade.cyclePosition as { cycle?: number } | undefined;
      cycleBefore = cyclePos?.cycle ?? 0;
    } catch (err) {
      throw new Error(
        `RI activation: Cascade.json read/parse failed at ${cascadeJsonPath} — ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }

  // Step 1: write Onyx-Tier-1.md (Pearl Clinical Summation seed · IMMUTABLE)
  let onyxWritten = false;
  try {
    writeFileSync(onyxPath, buildOnyxSeed({ suite8Name, diamondType }), 'utf8');
    onyxWritten = true;
    log('ri.activate.onyx.written', { onyxPath });
  } catch (err) {
    throw new Error(
      `RI activation: Onyx write failed at ${onyxPath} — ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }

  // Step 2: write Diamond-Tier-1.md (First Diamond · mutable plan)
  let diamondWritten = false;
  try {
    writeFileSync(
      diamondPath,
      buildFirstDiamond({ suite8Name, diamondType, cinnabarSummary }),
      'utf8',
    );
    diamondWritten = true;
    log('ri.activate.diamond.written', { diamondPath, diamondType });
  } catch (err) {
    // Rollback Onyx
    if (onyxWritten) {
      try {
        unlinkSync(onyxPath);
      } catch {
        /* noop */
      }
    }
    throw new Error(
      `RI activation: Diamond write failed at ${diamondPath} — ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }

  // Step 3: update Cascade.json atomically (.tmp → rename) · cycle 0 → 1
  try {
    const cyclePos = (cascade.cyclePosition as Record<string, unknown> | undefined) ?? {};
    cascade.activeDiamond = 'Cascades/Working/DIAMOND-TIER-1.md';
    cascade.activeOnyx = 'Cascades/Working/ONYX-TIER-1.md';
    cascade.cyclePosition = {
      ...cyclePos,
      cycle: 1,
      rotation: 1,
      totalRotations: 1,
      gate: 0,
    };
    const tmpPath = cascadeJsonPath + '.tmp';
    writeFileSync(tmpPath, JSON.stringify(cascade, null, 2) + '\n', 'utf8');
    renameSync(tmpPath, cascadeJsonPath);
    log('ri.activate.cascade-json.updated', {
      cascadeJsonPath,
      cycleBefore,
      cycleAfter: 1,
    });
  } catch (err) {
    // Rollback Onyx + Diamond
    if (onyxWritten) {
      try {
        unlinkSync(onyxPath);
      } catch {
        /* noop */
      }
    }
    if (diamondWritten) {
      try {
        unlinkSync(diamondPath);
      } catch {
        /* noop */
      }
    }
    throw new Error(
      `RI activation: Cascade.json update failed at ${cascadeJsonPath} — ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }

  return {
    onyxPath,
    diamondPath,
    cascadeJsonPath,
    cycleBefore,
    cycleAfter: 1,
  };
}

function buildOnyxSeed(opts: { suite8Name: string; diamondType: FirstDiamondType }): string {
  const ts = new Date().toISOString();
  return `# ONYX-TIER-1 — Stratidian Lambda Substrate (Tier 1)

**Tier**: 1 (opened at install via Diamond B-25-UX RI activation)
**Opened**: ${ts}
**Source**: SCS Bridge install · Strategy S8 StratidianWelcome
**First Diamond Type**: ${opts.diamondType}
**Initial Suite 8**: ${opts.suite8Name}

---

## Pearl Clinical Summation Seed

This is the user's first Onyx tier. Subsequent Rose (Suite 7 Fuchsia) Clinical Notes
append below as cycles complete. The Diameter between sessions begins here:
RI reads this file at session-start to absorb prior diagnoses; Rose writes G/L/M
to it at cycle-end.

The user's prior project context has been elevated to first-class Suite 8
${opts.suite8Name}. The ${opts.diamondType === 'recovery' ? 'recovery-direction' : 'tutorial'}
Diamond at Cascades/Working/DIAMOND-TIER-1.md is the user's first Cascade engagement.

---

## Cycle 1 — Awaiting first Rose firing

(No diagnoses yet — first cycle in progress.)
`;
}

function buildFirstDiamond(opts: {
  suite8Name: string;
  diamondType: FirstDiamondType;
  cinnabarSummary?: string | null;
}): string {
  const ts = new Date().toISOString();
  const recoveryBody = opts.cinnabarSummary
    ? `## Recovery Direction (Cinnabar-Derived)

${opts.cinnabarSummary}

---

## First Cascade Cycle

The user's prior work direction is captured above. This Diamond frames the
first SCS Cascade cycle as a continuation rather than a fresh start. Suite 0
Obsidian Absorb will read the Onyx-Tier-1 seed and the Cinnabar summary above;
Bands fire per the user's chosen Cascade Length.
`
    : `## Recovery Direction (Cinnabar-Pending)

The Cinnabar Dialectic was not engaged at install · or did not return a summary.
The user can engage Cinnabar via the Welcome menu to refine their direction
before the first Cascade cycle proper.

---

## First Cascade Cycle

Awaiting Cinnabar engagement OR user override of recovery direction.
`;

  const tutorialBody = `## Tutorial First Diamond

This is your first Diamond in the SCS Cascade. The Stratidian Manifold provides
a structured way to plan, build, examine, and diagnose work via 7 cognitive
functions (Suites 1-7). Suite 0 backs all; Suite 8 is your project's domain
maintainer (currently: ${opts.suite8Name}).

The Cascade unfolds in cycles. Each cycle traverses 8 gates: Absorb → Curate →
Name → Plan → Test → Build → Compose+Verify → Diagnose. Suite 7 Fuchsia closes
the cycle by writing Rose Clinical Notes (G/L/M) to ONYX-TIER-1.md.

---

## First Cascade Cycle Suggestion

Begin with a small concrete task — change something visible in your project,
even a tiny refactor. Cycle through Length 1-3 (Curate · Name · Architect) as
a draft. Then expand to longer Cascades as your familiarity grows.

The /cascade slash command engages cycle gates conversationally.
`;

  return `# DIAMOND-TIER-1 — First Diamond (Stratidian Welcome via S8)

**Tier**: 1 (created at install via Diamond B-25-UX RI activation)
**Type**: ${
    opts.diamondType === 'recovery'
      ? 'Recovery (existing-project drop-in)'
      : 'Tutorial (fresh-slate)'
  }
**Opened**: ${ts}
**Suite 8**: ${opts.suite8Name}

---

${opts.diamondType === 'recovery' ? recoveryBody : tutorialBody}
`;
}
