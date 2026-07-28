import { mkdir } from 'node:fs/promises';
import { consumeMessage as consumeEnvelope } from './message';
import { archiveDir } from './paths';
import type { BridgeMessageEnvelope } from './types';
import type { QueuedEntry } from './queue';

export async function consumeMessage(entry: QueuedEntry): Promise<BridgeMessageEnvelope> {
  const archive = archiveDir(entry.envelope.sessionId);
  await mkdir(archive, { recursive: true });
  return consumeEnvelope(entry.envelope, entry.filepath);
}
