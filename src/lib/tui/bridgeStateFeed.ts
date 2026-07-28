import { readFileSync, watchFile, unwatchFile } from 'node:fs';
import { resolve } from 'node:path';
import { registryPath } from '../bridge/paths';

export type BridgeStateEvent =
  | { type: 'cycle-updated'; cycle: number | null; activeDiamond: string | null }
  | { type: 'session-launched'; ulid: string; claudeSessionId: string }
  | { type: 'session-allocated'; ulid: string }
  | { type: 'registry-refresh'; sessionCount: number };

export type BridgeStateSnapshot = {
  currentCycle: number | null;
  activeDiamond: string | null;
  sessionCount: number;
  recentEvents: BridgeStateEvent[];
};

export type BridgeStateFeed = {
  latest(): BridgeStateSnapshot;
  subscribe(listener: (snap: BridgeStateSnapshot) => void): () => void;
  dispose(): void;
};

export const BRIDGE_STATE_BUFFER_CAP = 5;

export type BridgeStateFeedOptions = {
  cascadeJsonPath?: string;
  sessionsJsonPath?: string;
  watchInterval?: number;
};

export function createBridgeStateFeed(opts: BridgeStateFeedOptions = {}): BridgeStateFeed {
  const cascadeJsonPath =
    opts.cascadeJsonPath ?? resolve(process.cwd(), 'Cascades', 'Cascade.json');
  const sessionsJsonPath = opts.sessionsJsonPath ?? registryPath();
  const watchInterval = opts.watchInterval ?? 500;

  let disposed = false;
  const snapshot: BridgeStateSnapshot = {
    currentCycle: null,
    activeDiamond: null,
    sessionCount: 0,
    recentEvents: [],
  };
  const listeners = new Set<(snap: BridgeStateSnapshot) => void>();

  function appendEvent(evt: BridgeStateEvent): void {
    snapshot.recentEvents = [...snapshot.recentEvents, evt].slice(-BRIDGE_STATE_BUFFER_CAP);
  }

  function readCascadeJson(): boolean {
    try {
      const raw = readFileSync(cascadeJsonPath, 'utf-8');
      const data = JSON.parse(raw) as {
        cycle?: number | null;
        activeDiamond?: string | null;
      };
      const cycle = data.cycle ?? null;
      const activeDiamond = data.activeDiamond ?? null;
      if (cycle !== snapshot.currentCycle || activeDiamond !== snapshot.activeDiamond) {
        snapshot.currentCycle = cycle;
        snapshot.activeDiamond = activeDiamond;
        appendEvent({ type: 'cycle-updated', cycle, activeDiamond });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  function readSessionsJson(): boolean {
    try {
      const raw = readFileSync(sessionsJsonPath, 'utf-8');
      const data = JSON.parse(raw) as unknown;
      let count = 0;
      if (Array.isArray(data)) count = data.length;
      else if (data && typeof data === 'object') count = Object.keys(data as object).length;
      if (count !== snapshot.sessionCount) {
        snapshot.sessionCount = count;
        appendEvent({ type: 'registry-refresh', sessionCount: count });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  function snapshotCopy(): BridgeStateSnapshot {
    return {
      currentCycle: snapshot.currentCycle,
      activeDiamond: snapshot.activeDiamond,
      sessionCount: snapshot.sessionCount,
      recentEvents: [...snapshot.recentEvents],
    };
  }

  function notify(): void {
    if (disposed) return;
    const snap = snapshotCopy();
    for (const listener of listeners) {
      try {
        listener(snap);
      } catch {
        // ignore listener errors
      }
    }
  }

  // Initial reads (silent — no notify since no listeners yet)
  readCascadeJson();
  readSessionsJson();

  watchFile(cascadeJsonPath, { interval: watchInterval }, () => {
    // FIX-4 race guard: skip late callbacks after dispose
    if (disposed) return;
    if (readCascadeJson()) notify();
  });
  watchFile(sessionsJsonPath, { interval: watchInterval }, () => {
    if (disposed) return;
    if (readSessionsJson()) notify();
  });

  return {
    latest(): BridgeStateSnapshot {
      return snapshotCopy();
    },
    subscribe(listener): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    dispose(): void {
      // FIX-4: set disposed FIRST so any in-flight watch callbacks early-exit
      disposed = true;
      try {
        unwatchFile(cascadeJsonPath);
      } catch {
        // ignore
      }
      try {
        unwatchFile(sessionsJsonPath);
      } catch {
        // ignore
      }
      listeners.clear();
    },
  };
}
