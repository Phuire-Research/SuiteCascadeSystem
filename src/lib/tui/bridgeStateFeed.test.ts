import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createBridgeStateFeed, BRIDGE_STATE_BUFFER_CAP } from './bridgeStateFeed';

describe('createBridgeStateFeed', () => {
  let tmpDir: string;
  let cascadePath: string;
  let sessionsPath: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'cascades-bridge-feed-'));
    cascadePath = join(tmpDir, 'Cascade.json');
    sessionsPath = join(tmpDir, 'sessions.json');
  });

  afterEach(() => {
    try {
      rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  test('latest() returns a copy (mutation-safe)', () => {
    writeFileSync(cascadePath, JSON.stringify({ cycle: 1, activeDiamond: 'F' }));
    writeFileSync(sessionsPath, JSON.stringify([{ id: 'a' }]));
    const feed = createBridgeStateFeed({
      cascadeJsonPath: cascadePath,
      sessionsJsonPath: sessionsPath,
      watchInterval: 50,
    });
    const snap1 = feed.latest();
    snap1.recentEvents.push({ type: 'registry-refresh', sessionCount: 99 });
    const snap2 = feed.latest();
    expect(snap2.recentEvents.length).not.toBe(snap1.recentEvents.length);
    feed.dispose();
  });

  test('initial read populates currentCycle and activeDiamond', () => {
    writeFileSync(cascadePath, JSON.stringify({ cycle: 7, activeDiamond: 'LXXX' }));
    writeFileSync(sessionsPath, JSON.stringify([]));
    const feed = createBridgeStateFeed({
      cascadeJsonPath: cascadePath,
      sessionsJsonPath: sessionsPath,
      watchInterval: 50,
    });
    const snap = feed.latest();
    expect(snap.currentCycle).toBe(7);
    expect(snap.activeDiamond).toBe('LXXX');
    feed.dispose();
  });

  test('initial read populates sessionCount', () => {
    writeFileSync(cascadePath, JSON.stringify({}));
    writeFileSync(sessionsPath, JSON.stringify([{ id: 'a' }, { id: 'b' }, { id: 'c' }]));
    const feed = createBridgeStateFeed({
      cascadeJsonPath: cascadePath,
      sessionsJsonPath: sessionsPath,
      watchInterval: 50,
    });
    expect(feed.latest().sessionCount).toBe(3);
    feed.dispose();
  });

  test('absent files: latest() returns null cycle, 0 count, empty events', () => {
    const feed = createBridgeStateFeed({
      cascadeJsonPath: cascadePath,
      sessionsJsonPath: sessionsPath,
      watchInterval: 50,
    });
    const snap = feed.latest();
    expect(snap.currentCycle).toBeNull();
    expect(snap.activeDiamond).toBeNull();
    expect(snap.sessionCount).toBe(0);
    expect(snap.recentEvents).toEqual([]);
    feed.dispose();
  });

  test('subscribe returns working unsubscribe fn', () => {
    writeFileSync(cascadePath, JSON.stringify({ cycle: 0 }));
    writeFileSync(sessionsPath, JSON.stringify([]));
    const feed = createBridgeStateFeed({
      cascadeJsonPath: cascadePath,
      sessionsJsonPath: sessionsPath,
      watchInterval: 50,
    });
    let calls = 0;
    const unsub = feed.subscribe(() => {
      calls++;
    });
    unsub();
    expect(typeof unsub).toBe('function');
    expect(calls).toBe(0);
    feed.dispose();
  });

  test('dispose() is idempotent and clears listeners', () => {
    const feed = createBridgeStateFeed({
      cascadeJsonPath: cascadePath,
      sessionsJsonPath: sessionsPath,
      watchInterval: 50,
    });
    feed.subscribe(() => undefined);
    expect(() => feed.dispose()).not.toThrow();
    expect(() => feed.dispose()).not.toThrow();
  });

  test('BRIDGE_STATE_BUFFER_CAP is 5', () => {
    expect(BRIDGE_STATE_BUFFER_CAP).toBe(5);
  });

  test('malformed JSON: feed survives without throwing', () => {
    writeFileSync(cascadePath, 'not-json{{');
    writeFileSync(sessionsPath, 'still-not-json');
    expect(() => {
      const feed = createBridgeStateFeed({
        cascadeJsonPath: cascadePath,
        sessionsJsonPath: sessionsPath,
        watchInterval: 50,
      });
      feed.dispose();
    }).not.toThrow();
  });
});
