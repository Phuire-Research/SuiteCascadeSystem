import { Command } from 'commander';
import { readdir } from 'node:fs/promises';
import { listSessions } from '../../lib/bridge/registry';
import { priorityDir, archiveDir } from '../../lib/bridge/paths';

async function countFiles(dir: string): Promise<number> {
  try {
    const files = await readdir(dir);
    return files.filter((f) => f.endsWith('.json')).length;
  } catch {
    return 0;
  }
}

export function bridgeListCommand(): Command {
  const cmd = new Command('list');

  cmd.description('List all bridge sessions').action(async () => {
    const sessions = await listSessions();
    if (sessions.length === 0) {
      console.log('No sessions registered.');
      return;
    }

    console.log(
      ['ID', 'STATUS', 'SPAWNED', 'HEADS', 'BODY', 'TAILS', 'ARCHIVE', 'CLAUDE-UUID']
        .map((h, i) => (i === 2 ? h.padEnd(17) : h.padEnd(12)))
        .join(' '),
    );
    console.log('-'.repeat(108));

    for (const session of sessions) {
      const [heads, body, tails, archive] = await Promise.all([
        countFiles(priorityDir(session.id, 'heads')),
        countFiles(priorityDir(session.id, 'body')),
        countFiles(priorityDir(session.id, 'tails')),
        countFiles(archiveDir(session.id)),
      ]);
      const spawnedStr = new Date(session.spawnedAt).toISOString().slice(0, 16);
      const shortUuid = session.claudeSessionId ? session.claudeSessionId.slice(0, 8) : '—';
      const row = [
        session.id.slice(0, 10),
        session.status,
        spawnedStr,
        String(heads),
        String(body),
        String(tails),
        String(archive),
        shortUuid,
      ]
        .map((v, i) => (i === 2 ? v.padEnd(17) : v.padEnd(12)))
        .join(' ');
      console.log(row);
    }
  });

  return cmd;
}
