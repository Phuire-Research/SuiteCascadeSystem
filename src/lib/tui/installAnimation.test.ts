import {
  renderInstallAnimation,
  advancePhase,
  type InstallAnimationState,
} from './installAnimation';
import type { TerminalCaps } from './terminalCaps';

const CAPS: TerminalCaps = {
  truecolor: true,
  unicode: true,
  altBuffer: true,
  cols: 80,
  rows: 30,
};

function freshState(overrides: Partial<InstallAnimationState> = {}): InstallAnimationState {
  return {
    startedAt: 1_000_000,
    ulid: '01ABCDE',
    phase: 'pre-spawn',
    ...overrides,
  };
}

describe('installAnimation — Diamond B-17 (CD-48 FSIAO + CD-51 IPSOT)', () => {
  it('renders pre-spawn phase with INITIALIZING title + Cobalt accent', () => {
    const out = renderInstallAnimation(freshState({ phase: 'pre-spawn' }), 80, 30, CAPS, 1_000_500);
    expect(out).toContain('SCS BRIDGE INITIALIZATION');
    expect(out).toContain('INITIALIZING');
    // Cobalt RGB(0, 71, 171) truecolor sequence
    expect(out).toContain('\x1b[38;2;0;71;171m');
  });

  it('renders awaiting-alive phase with proper label', () => {
    const out = renderInstallAnimation(
      freshState({ phase: 'awaiting-alive' }),
      80,
      30,
      CAPS,
      1_002_000,
    );
    expect(out).toContain('AWAITING FIRST RESPONSE');
    expect(out).toContain('SessionStart hook firing');
  });

  it('renders ready phase with READY label + ALIVE substatus', () => {
    const out = renderInstallAnimation(freshState({ phase: 'ready' }), 80, 30, CAPS, 1_005_000);
    expect(out).toContain('READY');
    expect(out).toContain('ALIVE');
  });

  it('time-bucket sub-status advances during pre-spawn', () => {
    const cloning = renderInstallAnimation(
      freshState({ phase: 'pre-spawn' }),
      80,
      30,
      CAPS,
      1_000_500,
    );
    expect(cloning).toContain('Cloning bridge');

    const scaffolding = renderInstallAnimation(
      freshState({ phase: 'pre-spawn' }),
      80,
      30,
      CAPS,
      1_003_000,
    );
    expect(scaffolding).toContain('Scaffolding cwd');

    const spawning = renderInstallAnimation(
      freshState({ phase: 'pre-spawn' }),
      80,
      30,
      CAPS,
      1_004_500,
    );
    expect(spawning).toContain('Spawning Terminal');
  });

  it('progress bar fill increases with elapsed time', () => {
    const early = renderInstallAnimation(
      freshState({ phase: 'pre-spawn' }),
      80,
      30,
      CAPS,
      1_000_100,
    );
    const late = renderInstallAnimation(
      freshState({ phase: 'awaiting-alive' }),
      80,
      30,
      CAPS,
      1_006_000,
    );
    const earlyFilled = (early.match(/▓/g) ?? []).length;
    const lateFilled = (late.match(/▓/g) ?? []).length;
    expect(lateFilled).toBeGreaterThan(earlyFilled);
  });

  it('Pewter D5 Embossed Border — top-right uses dark Cobalt, bottom-left uses light Cobalt', () => {
    const out = renderInstallAnimation(freshState({ phase: 'pre-spawn' }), 80, 30, CAPS, 1_001_000);
    // Cobalt RGB(0, 71, 171); darken(_, 0.45) = (0, 32, 77); lighten(_, 0.55) = (140, 172, 217)
    expect(out).toContain('\x1b[38;2;0;32;77m'); // dark Cobalt (top + right edges)
    expect(out).toContain('\x1b[38;2;140;172;217m'); // light Cobalt (bottom + left edges)
  });

  it('omits Ctrl-C abort hint on narrow terminals (cols < 60)', () => {
    const wide = renderInstallAnimation(freshState(), 80, 30, CAPS, 1_001_000);
    expect(wide).toContain('Ctrl-C to abort');
    const narrow = renderInstallAnimation(freshState(), 50, 30, CAPS, 1_001_000);
    expect(narrow).not.toContain('Ctrl-C to abort');
  });

  it('mode footer indicates MANIFOLD rendering surface (Diamond B-18 CD-53 SMPSA)', () => {
    // Pewter Tessera v2 swap: STRATIDIAN_MODES rotation backdrop replaced by
    // SCS Manifold particle sphere; footer collapses to single MANIFOLD designation
    const preSpawn = renderInstallAnimation(
      freshState({ phase: 'pre-spawn' }),
      80,
      30,
      CAPS,
      1_001_000,
    );
    expect(preSpawn).toContain('mode: MANIFOLD');
    const awaiting = renderInstallAnimation(
      freshState({ phase: 'awaiting-alive' }),
      80,
      30,
      CAPS,
      1_001_000,
    );
    expect(awaiting).toContain('mode: MANIFOLD');
    const ready = renderInstallAnimation(freshState({ phase: 'ready' }), 80, 30, CAPS, 1_001_000);
    expect(ready).toContain('mode: MANIFOLD');
  });

  it('Box-drawing glyphs present (Pewter pane structure)', () => {
    const out = renderInstallAnimation(freshState(), 80, 30, CAPS, 1_001_000);
    expect(out).toContain('┌');
    expect(out).toContain('┐');
    expect(out).toContain('└');
    expect(out).toContain('┘');
    expect(out).toContain('│');
  });

  it('advancePhase produces NEW state object (immutable)', () => {
    const initial = freshState({ phase: 'pre-spawn' });
    const next = advancePhase(initial, 'awaiting-alive');
    expect(next).not.toBe(initial);
    expect(next.phase).toBe('awaiting-alive');
    expect(next.startedAt).toBe(initial.startedAt);
    expect(next.ulid).toBe(initial.ulid);
    // initial unchanged
    expect(initial.phase).toBe('pre-spawn');
  });
});
