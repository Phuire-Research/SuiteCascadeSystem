/**
 * scpBootLog · Per-SCP Capped Boot Log File Writer · Boot Overlay Diamond
 *
 * Capped rolling per-SCP boot.log file at scpBootLogPath(scpName).
 *
 * Pattern: CRLB Capped-Rolling-Log-Buffer (R2 Pattern 3) +
 *          PSLF Per-SCP-Log-File-Path-Convention (R2 Pattern 4).
 *
 * Reconciled HIGH-5 (R4 Synthesis):
 *   - ANSI stripped on file-write path (this module) — log file is plain text.
 *   - Ring buffer preservation of raw ANSI lives in the AppendLine Reducer (overlay
 *     coloring concern) — this module is the file-write branch only.
 *
 * Reconciled Rotation Strategy (R4 §4 Option b):
 *   - Append-with-separator across bridge restarts (line below).
 *   - On line-count > CAP_LINES (500): read+rewrite tail CAP_RETAIN_LINES (400).
 *
 * Citation: M52 Production Lambda Observability · M63 Copy-Paste-Plus
 * Citation: SUITE-2-ORANGE-BOOT-OVERLAY-FRONTIER-NAMING.md §Pattern 3 (CRLB) · §Pattern 4 (PSLF)
 * Citation: SUITE-4-GREEN-BOOT-OVERLAY-AUDIT.md HIGH-5 · §4 (Rotation Option b)
 */

import { appendFileSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { scpBootLogPath } from './paths';

const CAP_LINES = 500;
const CAP_RETAIN_LINES = 400;
const RING_BUFFER_K = 30;

const ANSI_STRIP_RE = /\x1b\[[0-9;]*[a-zA-Z]/g;

const lineCountByScp: Map<string, number> = new Map();
const sessionStartWrittenByScp: Set<string> = new Set();

function stripAnsi(s: string): string {
  return s.replace(ANSI_STRIP_RE, '');
}

function ensureLineCountInitialized(scpName: string, path: string): void {
  if (lineCountByScp.has(scpName)) return;
  try {
    if (!existsSync(path)) {
      lineCountByScp.set(scpName, 0);
      return;
    }
    const contents = readFileSync(path, 'utf-8');
    const count = contents === '' ? 0 : contents.split('\n').length - (contents.endsWith('\n') ? 1 : 0);
    lineCountByScp.set(scpName, count);
  } catch {
    lineCountByScp.set(scpName, 0);
  }
}

function writeSessionSeparator(scpName: string, path: string): void {
  if (sessionStartWrittenByScp.has(scpName)) return;
  sessionStartWrittenByScp.add(scpName);
  try {
    const stamp = new Date().toISOString();
    const separator = `\n=== Boot @ ${stamp} ===\n`;
    appendFileSync(path, separator);
    const current = lineCountByScp.get(scpName) ?? 0;
    lineCountByScp.set(scpName, current + 2);
  } catch {
    // swallow — boot log must never crash bridge
  }
}

function rotateIfOverCap(scpName: string, path: string): void {
  const count = lineCountByScp.get(scpName) ?? 0;
  if (count <= CAP_LINES) return;
  try {
    const contents = readFileSync(path, 'utf-8');
    const lines = contents.split('\n');
    const trailingNewline = contents.endsWith('\n');
    if (trailingNewline) lines.pop();
    const keep = lines.slice(lines.length - CAP_RETAIN_LINES);
    writeFileSync(path, keep.join('\n') + '\n');
    lineCountByScp.set(scpName, keep.length);
  } catch {
    // swallow — rotation failure must never crash bridge
  }
}

export function appendScpBootLogLine(scpName: string, rawLine: string): void {
  if (!scpName || typeof scpName !== 'string') return;
  const cleaned = stripAnsi(rawLine).replace(/\r$/, '');
  if (cleaned.length === 0) return;
  try {
    const path = scpBootLogPath(scpName);
    mkdirSync(dirname(path), { recursive: true });
    ensureLineCountInitialized(scpName, path);
    writeSessionSeparator(scpName, path);
    appendFileSync(path, cleaned + '\n');
    const current = lineCountByScp.get(scpName) ?? 0;
    lineCountByScp.set(scpName, current + 1);
    rotateIfOverCap(scpName, path);
  } catch {
    // swallow
  }
}

export function readScpBootLog(scpName: string, maxLines: number = CAP_LINES): string[] {
  try {
    const path = scpBootLogPath(scpName);
    if (!existsSync(path)) return [];
    const contents = readFileSync(path, 'utf-8');
    const lines = contents.split('\n');
    if (contents.endsWith('\n')) lines.pop();
    if (lines.length <= maxLines) return lines;
    return lines.slice(lines.length - maxLines);
  } catch {
    return [];
  }
}

export { RING_BUFFER_K };
