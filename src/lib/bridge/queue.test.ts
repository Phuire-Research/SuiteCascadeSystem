import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { ulid } from 'ulid';
import { scanQueue } from './queue';

jest.mock('./paths', () => ({
  priorityDir: (sessionId: string, folder: string) => join(tmpdir(), 'scs-test', sessionId, folder),
  archiveDir: (sessionId: string) => join(tmpdir(), 'scs-test', sessionId, 'archive'),
}));

async function makeTestEnvelope(
  sessionId: string,
  folder: 'heads' | 'body' | 'tails',
  priority: 'head' | 'body' | 'tail',
  content: string,
) {
  const dir = join(tmpdir(), 'scs-test', sessionId, folder);
  await mkdir(dir, { recursive: true });
  const id = ulid();
  const env = {
    id,
    sessionId,
    priority,
    content,
    createdAt: Date.now(),
    sender: 'user' as const,
  };
  await writeFile(join(dir, `${id}.json`), JSON.stringify(env), 'utf8');
  return env;
}

describe('scanQueue', () => {
  let sessionId: string;

  beforeEach(async () => {
    sessionId = ulid();
    const base = join(tmpdir(), 'scs-test', sessionId);
    await mkdir(base, { recursive: true });
  });

  afterEach(async () => {
    await rm(join(tmpdir(), 'scs-test', sessionId), { recursive: true, force: true });
  });

  it('returns empty array when all tiers are empty', async () => {
    const result = await scanQueue(sessionId);
    expect(result).toHaveLength(0);
  });

  it('returns only head messages when only heads/ has content', async () => {
    await makeTestEnvelope(sessionId, 'heads', 'head', 'h1');
    const result = await scanQueue(sessionId);
    expect(result).toHaveLength(1);
    expect(result[0].envelope.priority).toBe('head');
  });

  it('returns only body messages when only body/ has content', async () => {
    await makeTestEnvelope(sessionId, 'body', 'body', 'b1');
    const result = await scanQueue(sessionId);
    expect(result).toHaveLength(1);
    expect(result[0].envelope.priority).toBe('body');
  });

  it('returns only tail messages when only tails/ has content', async () => {
    await makeTestEnvelope(sessionId, 'tails', 'tail', 't1');
    const result = await scanQueue(sessionId);
    expect(result).toHaveLength(1);
    expect(result[0].envelope.priority).toBe('tail');
  });

  it('merges heads before body before tails', async () => {
    const t = await makeTestEnvelope(sessionId, 'tails', 'tail', 'tail-msg');
    const b = await makeTestEnvelope(sessionId, 'body', 'body', 'body-msg');
    const h = await makeTestEnvelope(sessionId, 'heads', 'head', 'head-msg');
    const result = await scanQueue(sessionId);
    expect(result).toHaveLength(3);
    expect(result[0].envelope.id).toBe(h.id);
    expect(result[1].envelope.id).toBe(b.id);
    expect(result[2].envelope.id).toBe(t.id);
  });

  it('sorts within tier by ULID (creation order)', async () => {
    const h1 = await makeTestEnvelope(sessionId, 'heads', 'head', 'first');
    await new Promise((r) => setTimeout(r, 5));
    const h2 = await makeTestEnvelope(sessionId, 'heads', 'head', 'second');
    const result = await scanQueue(sessionId);
    expect(result).toHaveLength(2);
    expect(result[0].envelope.id).toBe(h1.id);
    expect(result[1].envelope.id).toBe(h2.id);
  });
});
