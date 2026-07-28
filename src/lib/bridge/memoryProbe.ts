// Diamond B-25-UX (CD-100 MSEPD · Memory-Surfaced-Existing-Project-Detection):
// Probe `~/.claude/projects/{encoded-cwd}/` for prior session JSONLs to classify
// install as fresh-slate vs existing-project.
//
// Pattern 4 boundary (Suite 4 Green Angle 3 resolution):
//   ALLOWED at install agent level — agent IS Claude, operates within Claude's
//   own awareness; metadata read (file count · timestamps) is legitimate.
//   BLOCKED: reading JSONL content. This module reads ONLY metadata.
//
// Encoded-cwd format (verified on filesystem 2026-05-09):
//   `/` → `-` · leading slash becomes leading dash
//   `/Users/x/Work/proj` → `-Users-x-Work-proj`

import { existsSync, readdirSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import * as path from 'node:path';

export type MemoryProbeResult = {
  encodedCwd: string; // e.g., '-Users-x-Work-proj'
  projectsDir: string; // absolute path: ~/.claude/projects/{encoded-cwd}/
  exists: boolean; // dir present?
  sessionCount: number; // count of *.jsonl files (NEVER content read)
  latestMtime: number | null; // ms epoch of latest jsonl mtime · null if no sessions
  classification: 'existing-project' | 'fresh-slate';
};

// Diamond B-25-UX: encode user cwd to Claude Code projects dir naming.
export function encodeCwdForMemory(userCwd: string): string {
  return userCwd.replace(/\//g, '-');
}

// Diamond B-25-UX (CD-100 MSEPD · Pattern 4 metadata-only probe):
// Returns memory presence classification for a given user cwd.
// Reads ONLY filesystem metadata (count · mtime) — NEVER opens JSONL contents.
// `homeDirOverride` exists for tests; production calls use os.homedir().
export function probeProjectMemory(userCwd: string, homeDirOverride?: string): MemoryProbeResult {
  const encodedCwd = encodeCwdForMemory(userCwd);
  const home = homeDirOverride ?? homedir();
  const projectsDir = path.join(home, '.claude', 'projects', encodedCwd);

  if (!existsSync(projectsDir)) {
    return {
      encodedCwd,
      projectsDir,
      exists: false,
      sessionCount: 0,
      latestMtime: null,
      classification: 'fresh-slate',
    };
  }

  let sessionCount = 0;
  let latestMtime: number | null = null;

  try {
    const entries = readdirSync(projectsDir);
    for (const entry of entries) {
      if (!entry.endsWith('.jsonl')) continue;
      const fullPath = path.join(projectsDir, entry);
      try {
        const st = statSync(fullPath);
        if (st.isFile()) {
          sessionCount += 1;
          const m = st.mtimeMs;
          if (latestMtime === null || m > latestMtime) latestMtime = m;
        }
      } catch {
        // skip stat failures
      }
    }
  } catch {
    // Permission denied or read error → treat as fresh-slate
    return {
      encodedCwd,
      projectsDir,
      exists: true,
      sessionCount: 0,
      latestMtime: null,
      classification: 'fresh-slate',
    };
  }

  return {
    encodedCwd,
    projectsDir,
    exists: true,
    sessionCount,
    latestMtime,
    classification: sessionCount > 0 ? 'existing-project' : 'fresh-slate',
  };
}

// Diamond B-25-UX: human-readable summary for SM-WELCOME-RI-ENGAGE menu header.
// Returns ms-since-latest-session formatted as "3 days ago" / "2 hours ago" / "just now".
export function formatLatestSessionAge(latestMtime: number | null, nowMs = Date.now()): string {
  if (latestMtime === null) return 'no prior sessions';
  const diff = Math.max(0, nowMs - latestMtime);
  const sec = Math.floor(diff / 1000);
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  if (day >= 1) return `${day} day${day === 1 ? '' : 's'} ago`;
  if (hr >= 1) return `${hr} hour${hr === 1 ? '' : 's'} ago`;
  if (min >= 1) return `${min} minute${min === 1 ? '' : 's'} ago`;
  return 'just now';
}
