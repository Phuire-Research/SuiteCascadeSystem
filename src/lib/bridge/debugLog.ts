import { appendFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { bridgeLogDir } from './paths';
import { capLogFile } from './logCap';

let debugEnabled = false;

export function setDebugEnabled(enabled: boolean): void {
  debugEnabled = enabled;
}

export function isDebugEnabled(): boolean {
  return debugEnabled;
}

export function debugLogPath(): string {
  return join(bridgeLogDir(), 'debug.json');
}

export function log(event: string, payload?: Record<string, unknown>): void {
  if (!debugEnabled) return;
  try {
    const path = debugLogPath();
    mkdirSync(dirname(path), { recursive: true });
    const entry = { ...(payload ?? {}), ts: new Date().toISOString(), event };
    appendFileSync(path, JSON.stringify(entry) + '\n');
    capLogFile(path); // D-LHT · drop-oldest cap
  } catch {
    // swallow — debug log must never crash the bridge
  }
}

export function closeDebugLog(): void {
  // no-op: appendFileSync per-call, no stream to close
}
