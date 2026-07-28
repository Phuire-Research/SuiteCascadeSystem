import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderMenu, SYNTHETIC_NEW, type MenuState } from '../bridge/menu';
import type { RegistryEntry } from '../bridge/types';

describe('animatedTui module surface', () => {
  test('exports startAnimatedTui', async () => {
    const mod = await import('./animatedTui');
    expect(typeof mod.startAnimatedTui).toBe('function');
  });
});

describe('animatedTui Diamond H Layer-1 invariant — HBT line count', () => {
  test('renderMenu(menuView) with 30 sessions + termHeight=14 emits exactly 14 lines (HBT)', () => {
    // Mock the menuView shape that animatedTui.ts constructs.
    // Diamond H HBT math: visibleBodySlots = bottomRows - 5 = 14 - 5 = 9.
    const sessions: RegistryEntry[] = Array.from({ length: 30 }, (_, i) => ({
      id: `01${String(i).padStart(3, '0')}`,
      claudeSessionId: `uuid-${i}`,
      status: 'launched' as const,
      spawnedAt: 1714834000000 + i * 1000,
      cwd: '/test/cwd',
    }));
    const menuView: MenuState = {
      sessions,
      selectedUlid: SYNTHETIC_NEW,
      termWidth: 120,
      termHeight: 14,
      lastRenderedAt: Date.now(),
      spawnInFlight: false,
      currentPage: 0,
    };
    const out = renderMenu(menuView);
    expect(out.split('\n').length).toBe(14);
  });

  test('Diamond H: registry watchFile callback swaps sessions (no updateViewport)', () => {
    const src = readFileSync(join(__dirname, 'animatedTui.ts'), 'utf-8');
    expect(src).not.toMatch(/updateViewport/);
    expect(src).toMatch(/sessions:\s*newSessions/);
  });

  test('watchFile handler reconciles selectedUlid via preserveCursorAcrossUpdate', () => {
    const src = readFileSync(join(__dirname, 'animatedTui.ts'), 'utf-8');
    expect(src).toMatch(/preserveCursorAcrossUpdate\(menuState\.selectedUlid,\s*newSessions\)/);
    expect(src).toMatch(/preserveCursorAcrossUpdate,/);
  });
});

describe('animatedTui frame body — zero-await invariant (OQ-3)', () => {
  test('renderFrame body has no await statements (synchronous frame)', () => {
    const src = readFileSync(join(__dirname, 'animatedTui.ts'), 'utf-8');
    const renderFrameStart = src.indexOf('const renderFrame =');
    expect(renderFrameStart).toBeGreaterThan(-1);
    // Find the matching closing brace of the const renderFrame = (): void => { ... };
    let depth = 0;
    let started = false;
    let endIdx = -1;
    for (let i = renderFrameStart; i < src.length; i++) {
      const ch = src.charAt(i);
      if (ch === '{') {
        depth++;
        started = true;
      } else if (ch === '}') {
        depth--;
        if (started && depth === 0) {
          endIdx = i;
          break;
        }
      }
    }
    expect(endIdx).toBeGreaterThan(renderFrameStart);
    const renderFrameBody = src.slice(renderFrameStart, endIdx + 1);
    // No `await` token at any nesting level inside renderFrame
    expect(renderFrameBody).not.toMatch(/\bawait\b/);
    // Boolean lock guard present
    expect(renderFrameBody).toContain('frameRunning');
    // Finally clears the guard
    expect(renderFrameBody).toMatch(/finally\s*\{[\s\S]*frameRunning\s*=\s*false[\s\S]*\}/);
  });

  test('FIX-2 verified: divider row subtracted before pane split', () => {
    const src = readFileSync(join(__dirname, 'animatedTui.ts'), 'utf-8');
    expect(src).toMatch(/availableRows\s*=\s*Math\.max\(2,\s*rows\s*-\s*1\)/);
  });

  test('alt-buffer enter + cursor hide on start', () => {
    const src = readFileSync(join(__dirname, 'animatedTui.ts'), 'utf-8');
    expect(src).toContain('\\x1b[?1049h');
    expect(src).toContain('\\x1b[?25l');
  });

  test('cleanExit emits show-cursor + exit-alt-buffer', () => {
    const src = readFileSync(join(__dirname, 'animatedTui.ts'), 'utf-8');
    expect(src).toContain('\\x1b[?25h');
    expect(src).toContain('\\x1b[?1049l');
  });

  test('SIGINT/SIGTERM/SIGHUP all wired to cleanExit', () => {
    const src = readFileSync(join(__dirname, 'animatedTui.ts'), 'utf-8');
    expect(src).toMatch(/process\.on\(['"]SIGINT['"],\s*cleanExit\)/);
    expect(src).toMatch(/process\.on\(['"]SIGTERM['"],\s*cleanExit\)/);
    expect(src).toMatch(/process\.on\(['"]SIGHUP['"],\s*cleanExit\)/);
  });
});

describe('animatedTui Diamond K — liveness tick (Layer-1 invariant)', () => {
  test('liveness setInterval registered with LIVENESS_TICK_MS (2000ms)', () => {
    const src = readFileSync(join(__dirname, 'animatedTui.ts'), 'utf-8');
    expect(src).toMatch(/LIVENESS_TICK_MS\s*=\s*2000/);
    expect(src).toMatch(/livenessInterval\s*=\s*setInterval\(/);
    expect(src).toMatch(/probeLivenessTick\(/);
  });

  test('Diamond K/N liveness tick destructures aliveIds + offlineIds + staleIds (semantic flip + orphan-detection)', () => {
    const src = readFileSync(join(__dirname, 'animatedTui.ts'), 'utf-8');
    expect(src).toMatch(
      /const\s*\{\s*aliveIds,\s*offlineIds,\s*staleIds\s*\}\s*=\s*probeLivenessTick/,
    );
  });

  test('Diamond K liveness tick uses markSessionOffline for offlineIds (preserve row)', () => {
    const src = readFileSync(join(__dirname, 'animatedTui.ts'), 'utf-8');
    expect(src).toMatch(/for\s*\(const id of offlineIds\)/);
    expect(src).toMatch(/await markSessionOffline\(id\)/);
  });

  test('Diamond K liveness tick still removes staleIds via removeSession (ghost purge)', () => {
    const src = readFileSync(join(__dirname, 'animatedTui.ts'), 'utf-8');
    expect(src).toMatch(/for\s*\(const id of staleIds\)/);
    expect(src).toMatch(/await removeSession\(id\)/);
  });

  test('Diamond K liveness.tick log payload carries offlineCount alongside staleCount', () => {
    const src = readFileSync(join(__dirname, 'animatedTui.ts'), 'utf-8');
    expect(src).toMatch(/offlineCount:\s*offlineIds\.length/);
    expect(src).toMatch(/staleCount:\s*staleIds\.length/);
  });

  test('cleanExit clears livenessInterval BEFORE unwatchFile', () => {
    const src = readFileSync(join(__dirname, 'animatedTui.ts'), 'utf-8');
    const cleanExitStart = src.indexOf('const cleanExit =');
    expect(cleanExitStart).toBeGreaterThan(-1);
    const cleanExitBody = src.slice(cleanExitStart, cleanExitStart + 2000);
    const clearLivenessIdx = cleanExitBody.indexOf('clearInterval(livenessInterval)');
    const unwatchIdx = cleanExitBody.indexOf('unwatchFile');
    expect(clearLivenessIdx).toBeGreaterThan(-1);
    expect(unwatchIdx).toBeGreaterThan(-1);
    expect(clearLivenessIdx).toBeLessThan(unwatchIdx);
  });

  test('first-tick transparency log fires when total >= FIRST_TICK_LOG_THRESHOLD (5)', () => {
    const src = readFileSync(join(__dirname, 'animatedTui.ts'), 'utf-8');
    expect(src).toMatch(/FIRST_TICK_LOG_THRESHOLD\s*=\s*5/);
    expect(src).toMatch(/pre-Diamond-K orphan entries/);
  });
});

describe('animatedTui Diamond L — blank-session filter (Layer-1 invariant)', () => {
  test('imports hasPersistedSession from sessionPersistence', () => {
    const src = readFileSync(join(__dirname, 'animatedTui.ts'), 'utf-8');
    // Diamond M extended this import to also pull discoverPersistedSessions +
    // synthesizeDiscoveredUlid; the multi-import block still names hasPersistedSession.
    expect(src).toMatch(
      /import\s*\{[^}]*\bhasPersistedSession\b[^}]*\}\s*from\s*['"]\.\.\/bridge\/sessionPersistence['"]/,
    );
  });

  test('BLANK_GRACE_WINDOW_MS = 60_000 (60s grace from spawnedAt)', () => {
    const src = readFileSync(join(__dirname, 'animatedTui.ts'), 'utf-8');
    expect(src).toMatch(/BLANK_GRACE_WINDOW_MS\s*=\s*60_000/);
  });

  test('liveness tick computes blankIds via grace + persisted check', () => {
    const src = readFileSync(join(__dirname, 'animatedTui.ts'), 'utf-8');
    expect(src).toMatch(/const\s+blankIds:\s*string\[\]\s*=\s*\[\]/);
    expect(src).toMatch(/hasPersistedSession\(s\.cwd,\s*s\.claudeSessionId\)/);
    expect(src).toMatch(/BLANK_GRACE_WINDOW_MS/);
  });

  test('blank filter dedupes against offlineIds + staleIds (single-pass invariant)', () => {
    const src = readFileSync(join(__dirname, 'animatedTui.ts'), 'utf-8');
    expect(src).toMatch(/offlineIds\.includes\(s\.id\)\s*\|\|\s*staleIds\.includes\(s\.id\)/);
  });

  test('blank-filter emits persistence.check + registry.remove debug log events', () => {
    const src = readFileSync(join(__dirname, 'animatedTui.ts'), 'utf-8');
    expect(src).toMatch(/log\(['"]persistence\.check['"]/);
    expect(src).toMatch(/log\(['"]registry\.remove['"][^)]*reason:\s*['"]unpersisted['"]/);
  });

  test('liveness.tick log payload carries blankCount', () => {
    const src = readFileSync(join(__dirname, 'animatedTui.ts'), 'utf-8');
    expect(src).toMatch(/blankCount:\s*blankIds\.length/);
  });

  test('blank-filter loop processes claudeSessionId-bearing entries only (skip pre-hook)', () => {
    const src = readFileSync(join(__dirname, 'animatedTui.ts'), 'utf-8');
    expect(src).toMatch(/if\s*\(s\.claudeSessionId\s*===\s*undefined\)\s*continue/);
  });
});

describe('animatedTui Diamond M — Auto-Discovery Pass (Layer-1 invariant)', () => {
  test('imports discoverPersistedSessions + synthesizeDiscoveredUlid + addSession', () => {
    const src = readFileSync(join(__dirname, 'animatedTui.ts'), 'utf-8');
    expect(src).toMatch(/discoverPersistedSessions/);
    expect(src).toMatch(/synthesizeDiscoveredUlid/);
    expect(src).toMatch(
      /import\s*\{[^}]*addSession[^}]*\}\s*from\s*['"]\.\.\/bridge\/registry['"]/,
    );
  });

  test('Auto-Discovery Pass runs after Startup Validation, before empty-spawn branch', () => {
    const src = readFileSync(join(__dirname, 'animatedTui.ts'), 'utf-8');
    const startupBlankIdx = src.indexOf('startupBlankIds.length > 0');
    const discoveryIdx = src.indexOf('discoverPersistedSessions(');
    const emptyBranchIdx = src.indexOf('sessions.length === 0');
    expect(startupBlankIdx).toBeGreaterThan(-1);
    expect(discoveryIdx).toBeGreaterThan(-1);
    expect(emptyBranchIdx).toBeGreaterThan(-1);
    expect(startupBlankIdx).toBeLessThan(discoveryIdx);
    expect(discoveryIdx).toBeLessThan(emptyBranchIdx);
  });

  test('discovery filters by knownIds (no double-add against existing sessions)', () => {
    const src = readFileSync(join(__dirname, 'animatedTui.ts'), 'utf-8');
    expect(src).toMatch(/knownIds\s*=\s*new Set/);
    expect(src).toMatch(/knownIds\.has\(d\.claudeSessionId\)/);
  });

  test('discovery emits discovery.scan debug log event', () => {
    const src = readFileSync(join(__dirname, 'animatedTui.ts'), 'utf-8');
    expect(src).toMatch(/log\(['"]discovery\.scan['"]/);
  });

  test('discovered session registered with status=offline + synthesizedAt set', () => {
    const src = readFileSync(join(__dirname, 'animatedTui.ts'), 'utf-8');
    expect(src).toMatch(/status:\s*['"]offline['"]/);
    expect(src).toMatch(/synthesizedAt:\s*d\.mtimeMs/);
  });
});

// Diamond P Fix P-2b: scaffold-BEFORE-addSession ordering invariant (Green HIGH Issue 3).
// Race prevention — entry must NOT appear in registry/menu before its
// session-dir capsule (meta.json + spawn-settings.json + 4 subdirs) is written.
describe('animatedTui Diamond P Fix P-2b — scaffold-before-addSession ordering', () => {
  const src = readFileSync(join(__dirname, 'animatedTui.ts'), 'utf-8');

  test('imports scaffoldDiscoveredSession from bridge/manager', () => {
    expect(src).toMatch(
      /import\s*\{[^}]*scaffoldDiscoveredSession[^}]*\}\s*from\s*['"]\.\.\/bridge\/manager['"]/,
    );
  });

  test('discovery loop calls scaffoldDiscoveredSession BEFORE addSession', () => {
    // Scope to the discovery for-loop body.
    const loopMatch = src.match(
      /for\s*\(\s*const\s+d\s+of\s+discovered\s*\)\s*\{[\s\S]*?\n\s{4}\}/,
    );
    expect(loopMatch).not.toBeNull();
    const body = loopMatch![0];
    const scaffoldIdx = body.indexOf('scaffoldDiscoveredSession(');
    const addIdx = body.indexOf('addSession(');
    expect(scaffoldIdx).toBeGreaterThan(-1);
    expect(addIdx).toBeGreaterThan(-1);
    expect(scaffoldIdx).toBeLessThan(addIdx);
  });

  test('synthesized ULID extracted to local before addSession + scaffold', () => {
    // Both calls must reference the same local synthesizedUlid (not inline call).
    expect(src).toMatch(/const\s+synthesizedUlid\s*=\s*synthesizeDiscoveredUlid\(/);
    expect(src).toMatch(/scaffoldDiscoveredSession\(\s*synthesizedUlid/);
  });
});

describe('animatedTui non-TTY guard', () => {
  test('exits early with stderr message when stdout.isTTY is false', async () => {
    const original = Object.getOwnPropertyDescriptor(process.stdout, 'isTTY');
    Object.defineProperty(process.stdout, 'isTTY', { value: false, configurable: true });
    let capturedExitCode: number | null = null;
    const stderrChunks: string[] = [];
    const origStderr = process.stderr.write.bind(process.stderr);
    (process.stderr as unknown as { write: (s: string) => boolean }).write = (s: string) => {
      stderrChunks.push(s);
      return true;
    };
    try {
      const { startAnimatedTui } = await import('./animatedTui');
      await startAnimatedTui({
        exitOverride: (code: number) => {
          capturedExitCode = code;
        },
      });
      expect(capturedExitCode).toBe(1);
      expect(stderrChunks.join('')).toMatch(/TTY required/);
    } finally {
      (process.stderr as unknown as { write: (s: string) => boolean }).write = origStderr as (
        s: string,
      ) => boolean;
      if (original) Object.defineProperty(process.stdout, 'isTTY', original);
      else Object.defineProperty(process.stdout, 'isTTY', { value: undefined, configurable: true });
    }
  });
});

// Diamond N Fix N-A1: blank-filter skips synthesizedAt entries (Layer-1 source-scan)
// Diamond N Fix N-D2: mtime-tracker + ORPHAN_DETECTION_MS exists at module level
describe('animatedTui Diamond N — auto-discovery survival + orphan detection (Layer-1 invariants)', () => {
  test('blank-filter skips entries with synthesizedAt set (Fix N-A1)', () => {
    const src = readFileSync(join(__dirname, 'animatedTui.ts'), 'utf-8');
    // Source must contain the synthesizedAt guard inside the blank-filter loop.
    expect(src).toMatch(/synthesizedAt\s*!==\s*undefined.*continue/s);
  });

  test('mtime-tracker Map declared at module level (Fix N-D2)', () => {
    const src = readFileSync(join(__dirname, 'animatedTui.ts'), 'utf-8');
    expect(src).toMatch(
      /const\s+mtimeTracker\s*=\s*new\s+Map<string,\s*\{\s*mtimeMs:\s*number;\s*firstSeenMs:\s*number\s*\}>/,
    );
  });

  test('ORPHAN_DETECTION_MS = 300_000 (Diamond 3H Bug A — raised from 90_000 to 5min)', () => {
    const src = readFileSync(join(__dirname, 'animatedTui.ts'), 'utf-8');
    expect(src).toMatch(/ORPHAN_DETECTION_MS\s*=\s*300_000/);
  });

  test('orphan loop dispatches markSessionOffline + cleans tracker (Fix N-D2 OQ-3)', () => {
    const src = readFileSync(join(__dirname, 'animatedTui.ts'), 'utf-8');
    expect(src).toMatch(/for\s*\(const id of orphanIds\)/);
    expect(src).toMatch(/await markSessionOffline\(id\)/);
    expect(src).toMatch(/mtimeTracker\.delete\(id\)/);
  });

  test('imports getJsonlMtime from sessionPersistence (merged destructure — Green Issue 2)', () => {
    const src = readFileSync(join(__dirname, 'animatedTui.ts'), 'utf-8');
    // Must NOT have a separate getJsonlMtime import line; must be in the existing destructure.
    expect(src).toMatch(
      /import\s*\{[^}]*\bgetJsonlMtime\b[^}]*\}\s*from\s*['"]\.\.\/bridge\/sessionPersistence['"]/s,
    );
    // Verify it's the SAME import as hasPersistedSession (single destructure block).
    const persistImports = src.match(
      /import\s*\{[^}]*\}\s*from\s*['"]\.\.\/bridge\/sessionPersistence['"]/g,
    );
    expect(persistImports).not.toBeNull();
    expect(persistImports!.length).toBe(1);
  });
});

describe('Diamond Q — animatedTui dispatch parity (rename + remove-selected)', () => {
  test('imports setSessionDisplayName from bridge/registry', () => {
    const src = readFileSync(join(__dirname, 'animatedTui.ts'), 'utf-8');
    expect(src).toMatch(
      /import\s*\{[^}]*\bsetSessionDisplayName\b[^}]*\}\s*from\s*['"]\.\.\/bridge\/registry['"]/s,
    );
  });

  test('source contains rename-selected dispatch case', () => {
    const src = readFileSync(join(__dirname, 'animatedTui.ts'), 'utf-8');
    expect(src).toMatch(/case\s+['"]rename-selected['"]/);
  });

  test('source contains rename-confirm dispatch case', () => {
    const src = readFileSync(join(__dirname, 'animatedTui.ts'), 'utf-8');
    expect(src).toMatch(/case\s+['"]rename-confirm['"]/);
  });

  test('source contains rename-cancel dispatch case', () => {
    const src = readFileSync(join(__dirname, 'animatedTui.ts'), 'utf-8');
    expect(src).toMatch(/case\s+['"]rename-cancel['"]/);
  });

  test('source contains rename-buffer-update dispatch case', () => {
    const src = readFileSync(join(__dirname, 'animatedTui.ts'), 'utf-8');
    expect(src).toMatch(/case\s+['"]rename-buffer-update['"]/);
  });

  test('source contains remove-selected dispatch case (Issue 3 fix)', () => {
    const src = readFileSync(join(__dirname, 'animatedTui.ts'), 'utf-8');
    expect(src).toMatch(/case\s+['"]remove-selected['"]/);
    // remove-selected case must invoke removeSession with the selectedUlid
    expect(src).toMatch(/void\s+removeSession\(ulid\)/);
  });
});

describe('Diamond B-1 — animatedTui Cascades/ probe + install-selected dispatch', () => {
  test('source imports existsSync from node:fs and SYNTHETIC_INSTALL from menu', () => {
    const src = readFileSync(join(__dirname, 'animatedTui.ts'), 'utf-8');
    expect(src).toMatch(/existsSync.*'node:fs'|'node:fs'.*existsSync/);
    expect(src).toMatch(/SYNTHETIC_INSTALL/);
  });
  test('source contains cascadesPresent probe and install-selected dispatch case', () => {
    const src = readFileSync(join(__dirname, 'animatedTui.ts'), 'utf-8');
    expect(src).toMatch(/cascadesPresent\s*=\s*existsSync/);
    expect(src).toMatch(/case\s+['"]install-selected['"]/);
  });
});

// ── Diamond B-8 Fix 1+3: probe-before-auto-spawn + trust-confer dispatch ─────

describe('Diamond B-8 Fix 1 — POFPFD probe ordering', () => {
  test('cascadesPresent probe is declared BEFORE the auto-spawn block', () => {
    const src = readFileSync(join(__dirname, 'animatedTui.ts'), 'utf-8');
    const probeIdx = src.indexOf('cascadesPresent = existsSync');
    const autoSpawnIdx = src.indexOf('cascadesPresent && sessions.length === 0');
    expect(probeIdx).toBeGreaterThan(0);
    expect(autoSpawnIdx).toBeGreaterThan(probeIdx);
  });

  test('auto-spawn condition gates on cascadesPresent (Install-mode skips auto-spawn)', () => {
    const src = readFileSync(join(__dirname, 'animatedTui.ts'), 'utf-8');
    expect(src).toMatch(/if\s*\(\s*cascadesPresent\s*&&\s*sessions\.length\s*===\s*0\s*\)/);
  });
});

describe('Diamond B-8 Fix 3 — trust-confer dispatch flow', () => {
  test('source contains trust-confer-confirm and trust-confer-decline dispatch cases', () => {
    const src = readFileSync(join(__dirname, 'animatedTui.ts'), 'utf-8');
    expect(src).toMatch(/case\s+['"]trust-confer-confirm['"]/);
    expect(src).toMatch(/case\s+['"]trust-confer-decline['"]/);
  });

  test('install-selected case sets menuState.trustConfer (does NOT call handleInstall directly)', () => {
    const src = readFileSync(join(__dirname, 'animatedTui.ts'), 'utf-8');
    const installCaseIdx = src.indexOf("case 'install-selected':");
    expect(installCaseIdx).toBeGreaterThan(0);
    const trustConferConfirmIdx = src.indexOf("case 'trust-confer-confirm':");
    const sliceBetween = src.slice(installCaseIdx, trustConferConfirmIdx);
    expect(sliceBetween).toMatch(/trustConfer:\s*\{/);
    expect(sliceBetween).toMatch(/buildProposedInstallPaths/);
  });

  test('trust-confer-confirm dispatches handleInstall after clearing trustConfer', () => {
    const src = readFileSync(join(__dirname, 'animatedTui.ts'), 'utf-8');
    const confirmIdx = src.indexOf("case 'trust-confer-confirm':");
    const declineIdx = src.indexOf("case 'trust-confer-decline':");
    const sliceConfirm = src.slice(confirmIdx, declineIdx);
    expect(sliceConfirm).toMatch(/trustConfer:\s*undefined/);
    expect(sliceConfirm).toMatch(/handleInstall\(/);
  });
});

// ── SS-A1-D1 · M17 subscription injection invariants (ASSP) ───────────────────
//
// Source-read invariant tests for the SB-Final M17 plan() subscription wiring
// the sessionCountByScp pipeline (commit 04d65a0 · already implemented). The
// subscription is read-only (iterateStage: false) and writes module-scoped
// refs that renderFrame injects into MenuState.scpSubMenu on every paint tick.
// Test-only sub-Diamond per R6 calibration · zero source changes.

describe('SS-A1-D1 · M17 subscription injection invariants (ASSP)', () => {
  test('latestSessionCountSnapshot module-scoped ref declared (ASSP slot exists)', () => {
    const src = readFileSync(join(__dirname, 'animatedTui.ts'), 'utf-8');
    expect(src).toMatch(/latestSessionCountSnapshot/);
    expect(src).toMatch(/let\s+latestSessionCountSnapshot/);
  });

  test('sessionCountByScp injected into scpSubMenuWithSnapshots in renderFrame', () => {
    const src = readFileSync(join(__dirname, 'animatedTui.ts'), 'utf-8');
    expect(src).toContain('sessionCountByScp: latestSessionCountSnapshot ?? new Map()');
  });

  test('spawnsByScp derivation in subscription stage closure (SQAR ground-truth)', () => {
    const src = readFileSync(join(__dirname, 'animatedTui.ts'), 'utf-8');
    expect(src).toMatch(/spawnsByScp/);
    expect(src).toMatch(/nextSessionCount/);
    expect(src).toContain('d.scp.d.scpSpawnManager.k.spawnsByScp.select()');
  });

  test('iterateStage: false present in lifecycle subscription plan (M17 read-only invariant)', () => {
    const src = readFileSync(join(__dirname, 'animatedTui.ts'), 'utf-8');
    expect(src).toMatch(/iterateStage:\s*false/);
    // Confirm the iterateStage:false sits inside the lifecycle subscription region.
    // Window widened to 6000 in REF-D2 (Cycle 113) when BJLM bridge.json refresh
    // added ~12 LOC inside the closure body. Invariant preserved · brittle
    // char-count widened additively.
    const subscriptionIdx = src.indexOf("'SB-Final · TUI lifecycle badge subscription'");
    expect(subscriptionIdx).toBeGreaterThan(-1);
    const subscriptionTail = src.slice(subscriptionIdx, subscriptionIdx + 6000);
    expect(subscriptionTail).toMatch(/iterateStage:\s*false/);
  });
});

// ── REF-D2 · BJLM bridge.json refresh invariants (Cycle 113) ───────────────
//
// Source-read invariant tests verifying the bridge.json wire-in lives inside
// animatedTui (startup + M17 closure refresh). These are source-shape checks
// (not runtime tests); bridgeMetadata.test.ts covers the helper itself.
describe('REF-D2 · BJLM bridge.json refresh invariants', () => {
  test('writeBridgeMetadata imported from bridgeMetadata helper', () => {
    const src = readFileSync(join(__dirname, 'animatedTui.ts'), 'utf-8');
    expect(src).toMatch(/import\s*\{[^}]*writeBridgeMetadata[^}]*\}\s*from\s*['"]\.\.\/bridge\/bridgeMetadata['"]/);
  });

  test('refreshBridgeMetadata helper defined inside startAnimatedTui scope', () => {
    const src = readFileSync(join(__dirname, 'animatedTui.ts'), 'utf-8');
    expect(src).toMatch(/const\s+refreshBridgeMetadata\s*=/);
  });

  test('initial bridge.json write fires at startup with cold-start SCPs.json read', () => {
    const src = readFileSync(join(__dirname, 'animatedTui.ts'), 'utf-8');
    expect(src).toMatch(/initialScpRegistry\s*=\s*readScpRegistry/);
    expect(src).toMatch(/initialInstalledScps/);
    expect(src).toMatch(/refreshBridgeMetadata\(new Map\(\), initialInstalledScps\)/);
  });

  test('M17 closure refresh derives boundScps and installedScps from current state', () => {
    const src = readFileSync(join(__dirname, 'animatedTui.ts'), 'utf-8');
    const subscriptionIdx = src.indexOf("'SB-Final · TUI lifecycle badge subscription'");
    expect(subscriptionIdx).toBeGreaterThan(-1);
    const subscriptionBody = src.slice(subscriptionIdx, subscriptionIdx + 6000);
    expect(subscriptionBody).toMatch(/refreshBridgeMetadata\(/);
  });
});

// ── SS-A1-D2 · M17 PPHB second select() + ADSC heartbeat send invariants ──────
//
// Source-read invariants for the extended M17 subscription:
//   - latestInteractiveSnapshot module-scoped ref declared inside startAnimatedTui
//   - SECOND select() on interactiveSessionsByScp inside the same plan closure
//   - renderFrame injects interactiveSessionsByScp into scpSubMenuWithSnapshots
//   - sendPresencePing helper present + cleanExit clears intervals
//
// Verbose source grep — no runtime Muxium booted in these tests.

describe('SS-A1-D2 · M17 second select() + ADSC source-read invariants', () => {
  test('latestInteractiveSnapshot module-scoped ref declared inside startAnimatedTui', () => {
    const src = readFileSync(join(__dirname, 'animatedTui.ts'), 'utf-8');
    expect(src).toMatch(/let\s+latestInteractiveSnapshot/);
  });

  test('SECOND select() on interactiveSessionsByScp inside subscription closure', () => {
    const src = readFileSync(join(__dirname, 'animatedTui.ts'), 'utf-8');
    expect(src).toContain(
      'd.scp.d.scpSpawnManager.k.interactiveSessionsByScp.select()',
    );
  });

  test('interactiveSessionsByScp injected into scpSubMenuWithSnapshots', () => {
    const src = readFileSync(join(__dirname, 'animatedTui.ts'), 'utf-8');
    expect(src).toContain(
      'interactiveSessionsByScp: latestInteractiveSnapshot ?? new Map()',
    );
  });

  test('sendPresencePing helper present + ADSC trigger fires on Live transition', () => {
    const src = readFileSync(join(__dirname, 'animatedTui.ts'), 'utf-8');
    expect(src).toMatch(/sendPresencePing/);
    expect(src).toMatch(/presence-ping/);
    expect(src).toMatch(/PRESENCE_PING_INTERVAL_MS\s*=\s*30_000/);
  });

  test('cleanExit clears all presence-ping intervals (M5 zombie-interval guard)', () => {
    const src = readFileSync(join(__dirname, 'animatedTui.ts'), 'utf-8');
    const cleanExitIdx = src.indexOf('const cleanExit');
    expect(cleanExitIdx).toBeGreaterThan(-1);
    const cleanExitBody = src.slice(cleanExitIdx, cleanExitIdx + 2500);
    expect(cleanExitBody).toMatch(/presencePingIntervalsByScp/);
    expect(cleanExitBody).toMatch(/clearInterval/);
  });

  test('setInterval handle.unref() applied to presence-ping interval (Jest test-safety)', () => {
    const src = readFileSync(join(__dirname, 'animatedTui.ts'), 'utf-8');
    // ADSC trigger block lives in the M17 closure · scope by sendPresencePing
    // call site (the closure that arms the interval) rather than by comment.
    // SS-Final widened window 600 → 1200 to accommodate SPMEM write block
    // (setSessionPreferredScp fire-and-forget) co-incident with PPHB timer setup.
    const triggerIdx = src.indexOf('firstPresencePingSentByScp.add');
    expect(triggerIdx).toBeGreaterThan(-1);
    const triggerBody = src.slice(triggerIdx, triggerIdx + 1200);
    expect(triggerBody).toMatch(/setInterval/);
    expect(triggerBody).toMatch(/handle\.unref\(\)/);
  });
});
