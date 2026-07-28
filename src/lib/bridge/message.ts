import { readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ulid } from 'ulid';
import { archiveDir, priorityDir, priorityFolderName } from './paths';
import type { BridgeMessageEnvelope, Priority, Sender } from './types';

type CreateEnvelopeArgs = {
  sessionId: string;
  priority: Priority;
  content: string;
  sender: Sender;
};

export function createEnvelope(args: CreateEnvelopeArgs): BridgeMessageEnvelope {
  return {
    id: ulid(),
    sessionId: args.sessionId,
    priority: args.priority,
    content: args.content,
    createdAt: Date.now(),
    sender: args.sender,
  };
}

export async function enqueueMessage(env: BridgeMessageEnvelope): Promise<void> {
  const folder = priorityFolderName(env.priority);
  const dir = priorityDir(env.sessionId, folder);
  const filename = `${env.id}.json`;
  const filepath = join(dir, filename);
  await writeFile(filepath, JSON.stringify(env, null, 2), 'utf8');
}

export async function readMessage(filepath: string): Promise<BridgeMessageEnvelope> {
  const raw = await readFile(filepath, 'utf8');
  return JSON.parse(raw) as BridgeMessageEnvelope;
}

export async function consumeMessage(
  env: BridgeMessageEnvelope,
  sourcePath: string,
): Promise<BridgeMessageEnvelope> {
  const consumed: BridgeMessageEnvelope = {
    ...env,
    consumedAt: Date.now(),
  };
  const archivePath = join(archiveDir(env.sessionId), `${env.id}.json`);
  await writeFile(sourcePath, JSON.stringify(consumed, null, 2), 'utf8');
  await rename(sourcePath, archivePath);
  return consumed;
}
