import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { priorityDir } from './paths';
import { readMessage } from './message';
import type { BridgeMessageEnvelope } from './types';

type QueuedEntry = {
  envelope: BridgeMessageEnvelope;
  filepath: string;
};

async function scanTier(
  sessionId: string,
  folder: 'heads' | 'body' | 'tails',
): Promise<QueuedEntry[]> {
  const dir = priorityDir(sessionId, folder);
  let filenames: string[];
  try {
    filenames = await readdir(dir);
  } catch {
    return [];
  }
  const jsonFiles = filenames.filter((f) => f.endsWith('.json')).sort();
  const entries: QueuedEntry[] = [];
  for (const filename of jsonFiles) {
    const filepath = join(dir, filename);
    const envelope = await readMessage(filepath);
    entries.push({ envelope, filepath });
  }
  return entries;
}

export async function scanQueue(sessionId: string): Promise<QueuedEntry[]> {
  const [heads, body, tails] = await Promise.all([
    scanTier(sessionId, 'heads'),
    scanTier(sessionId, 'body'),
    scanTier(sessionId, 'tails'),
  ]);
  return [...heads, ...body, ...tails];
}

export type { QueuedEntry };
