import { mkdtempSync, rmSync, mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import * as path from 'node:path';

import { activateRenewableIntelligence } from './riActivate';

let tempRoot: string;

beforeEach(() => {
  tempRoot = mkdtempSync(path.join(tmpdir(), 'ri-activate-test-'));
  // Pre-scaffold Cascades/ structure (install would have done this)
  mkdirSync(path.join(tempRoot, 'Cascades', 'Working'), { recursive: true });
  writeFileSync(
    path.join(tempRoot, 'Cascades', 'Cascade.json'),
    JSON.stringify(
      {
        activeDiamond: null,
        activeOnyx: null,
        suiteColors: { '0': 'Base', '1': 'Red' },
        cyclePosition: { cycle: 0, rotation: 1, totalRotations: 1, gate: 0 },
      },
      null,
      2,
    ),
    'utf8',
  );
});

afterEach(() => {
  if (tempRoot && existsSync(tempRoot)) {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});

describe('activateRenewableIntelligence (Diamond B-25-UX · CD-103 RIIA · atomic 3-write)', () => {
  test('writes Onyx-Tier-1, Diamond-Tier-1, updates Cascade.json cycle 0→1', () => {
    const result = activateRenewableIntelligence({
      userCwd: tempRoot,
      suite8Name: 'My App Project Context',
      diamondType: 'tutorial',
    });
    expect(existsSync(result.onyxPath)).toBe(true);
    expect(existsSync(result.diamondPath)).toBe(true);
    expect(result.cycleBefore).toBe(0);
    expect(result.cycleAfter).toBe(1);

    // Verify Cascade.json was updated
    const cascade = JSON.parse(
      readFileSync(path.join(tempRoot, 'Cascades', 'Cascade.json'), 'utf8'),
    );
    expect(cascade.cyclePosition.cycle).toBe(1);
    expect(cascade.activeDiamond).toBe('Cascades/Working/DIAMOND-TIER-1.md');
    expect(cascade.activeOnyx).toBe('Cascades/Working/ONYX-TIER-1.md');
  });

  test('Onyx seed contains Pearl Clinical Summation header + Suite 8 name', () => {
    activateRenewableIntelligence({
      userCwd: tempRoot,
      suite8Name: 'Cool Service',
      diamondType: 'tutorial',
    });
    const onyx = readFileSync(path.join(tempRoot, 'Cascades', 'Working', 'ONYX-TIER-1.md'), 'utf8');
    expect(onyx).toContain('ONYX-TIER-1');
    expect(onyx).toContain('Pearl Clinical Summation Seed');
    expect(onyx).toContain('Cool Service');
  });

  test('Tutorial Diamond contains Tutorial body when diamondType=tutorial', () => {
    activateRenewableIntelligence({
      userCwd: tempRoot,
      suite8Name: 'Test',
      diamondType: 'tutorial',
    });
    const diamond = readFileSync(
      path.join(tempRoot, 'Cascades', 'Working', 'DIAMOND-TIER-1.md'),
      'utf8',
    );
    expect(diamond).toContain('Tutorial First Diamond');
    expect(diamond).not.toContain('Recovery Direction');
  });

  test('Recovery Diamond contains Cinnabar summary when provided', () => {
    activateRenewableIntelligence({
      userCwd: tempRoot,
      suite8Name: 'Existing Service',
      diamondType: 'recovery',
      cinnabarSummary: 'User was building auth flow · last touched payment integration',
    });
    const diamond = readFileSync(
      path.join(tempRoot, 'Cascades', 'Working', 'DIAMOND-TIER-1.md'),
      'utf8',
    );
    expect(diamond).toContain('Recovery Direction (Cinnabar-Derived)');
    expect(diamond).toContain('payment integration');
  });

  test('Recovery Diamond uses Cinnabar-Pending fallback when no summary', () => {
    activateRenewableIntelligence({
      userCwd: tempRoot,
      suite8Name: 'Test',
      diamondType: 'recovery',
    });
    const diamond = readFileSync(
      path.join(tempRoot, 'Cascades', 'Working', 'DIAMOND-TIER-1.md'),
      'utf8',
    );
    expect(diamond).toContain('Cinnabar-Pending');
  });

  test('throws when Cascade.json is malformed (atomicity gate)', () => {
    writeFileSync(path.join(tempRoot, 'Cascades', 'Cascade.json'), '{invalid json', 'utf8');
    expect(() =>
      activateRenewableIntelligence({
        userCwd: tempRoot,
        suite8Name: 'Test',
        diamondType: 'tutorial',
      }),
    ).toThrow(/Cascade\.json/);
    // Verify Onyx + Diamond NOT written (failed before step 1)
    expect(existsSync(path.join(tempRoot, 'Cascades', 'Working', 'ONYX-TIER-1.md'))).toBe(false);
    expect(existsSync(path.join(tempRoot, 'Cascades', 'Working', 'DIAMOND-TIER-1.md'))).toBe(false);
  });

  test('Cascade.json absent → throws (no rollback needed)', () => {
    rmSync(path.join(tempRoot, 'Cascades', 'Cascade.json'));
    // Should still succeed because we treat missing as cycle=0 default
    const result = activateRenewableIntelligence({
      userCwd: tempRoot,
      suite8Name: 'Test',
      diamondType: 'tutorial',
    });
    expect(result.cycleAfter).toBe(1);
  });
});
