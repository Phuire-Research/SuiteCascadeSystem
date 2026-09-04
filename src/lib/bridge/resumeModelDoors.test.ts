import * as fs from 'node:fs';
import * as path from 'node:path';
import { DEFAULT_MODEL } from '../../shared/modelCatalog.model';

/**
 * C1104 · RULING A · THE DOOR INVARIANTS.
 *
 * Both resume doors (the Electron cli-handler and the daemon manager) and the birth-stamp
 * origins are structural, not unit-reachable — cli-handler.ts pulls Electron in at import
 * time. These are source-level Concluders in the animatedTui.test.ts idiom: they fail
 * loudly if a future edit restores the unconditional `--model` injection or re-seeds the
 * spawn picker's default into state.
 */
const SRC = path.resolve(__dirname, '../..');
const TEMPLATE = path.resolve(
  SRC,
  '../Cascades/scps/template/SCP/src/concepts/scsBridge',
);
const read = (p: string): string => fs.readFileSync(p, 'utf-8');

describe('C1104 · the Electron door (cli-handler)', () => {
  const src = read(path.join(SRC, 'main/cli-handler.ts'));

  test('THE WOUND is gone — no unconditional `resolved.model ?? getActiveDefaultModel()` clause', () => {
    expect(src).not.toContain('` --model ${shellQuote(resolved.model ?? getActiveDefaultModel())}`');
  });

  test('the clause is the three-way: choice → inject · resume+none → OMIT · new+none → default', () => {
    expect(src).toMatch(/const modelClause = resolved\.model\s*\n\s*\? ` --model \$\{shellQuote\(resolved\.model\)\}`/);
    expect(src).toMatch(/: resolved\.mode === 'resume'\s*\n\s*\? ''/);
    expect(src).toMatch(/: ` --model \$\{shellQuote\(getActiveDefaultModel\(\)\)\}`/);
  });
});

describe('C1104 · the daemon door (manager.launchInformative)', () => {
  const src = read(path.join(SRC, 'lib/bridge/manager.ts'));

  test('resolves entry.model through normalizeModelId', () => {
    expect(src).toContain("const entryModel = entry?.model ? normalizeModelId(entry.model) : undefined;");
  });

  test('the same three-way: resume keeps null, new falls to the derived default', () => {
    expect(src).toContain(
      "const launchModel = mode === 'resume' ? (entryModel ?? null) : (entryModel ?? DEFAULT_MODEL);",
    );
  });

  test('threads the model into launchClaudeWindow (the door that carried none before)', () => {
    expect(src).toContain('model: launchModel,');
  });
});

describe('C1104 · ALL SEVEN osTerminal branches carry the clause', () => {
  const src = read(path.join(SRC, 'lib/bridge/osTerminal.ts'));

  test('the input type has a model slot', () => {
    expect(src).toMatch(/model\?: string \| null;/);
  });

  test('every branch is marked and accounted for (1..7)', () => {
    for (let n = 1; n <= 7; n += 1) {
      expect(src).toContain(`BRANCH ${n}/7`);
    }
  });

  test('the shared fragment appends modelClause to BOTH returns', () => {
    expect(src).toContain('${settingsClause}${appendClause}${modelClause}');
    expect(src).toContain('${settingsClause}${appendClause}${modelClause}${seedClause}');
  });

  test('the three hand-assembled branches spread modelArgs', () => {
    // gnome-terminal resume + new, konsole resume + new, wt resume + new = 6 spreads
    expect((src.match(/\.\.\.modelArgs/g) ?? []).length).toBeGreaterThanOrEqual(6);
  });
});

describe('C1104 · the birth stamp has no origin left', () => {
  test('T5 · the spawn-model client state seeds UNDEFINED, not the default', () => {
    const state = read(path.join(TEMPLATE, 'scsBridge.state.ts'));
    expect(state).toContain('pendingSpawnModel: undefined,');
    expect(state).not.toContain('pendingSpawnModel: SCS_DEFAULT_MODEL,');
  });

  test('T5 · no page seeds the picker default into state on mount', () => {
    const pages = [
      path.join(TEMPLATE, 'vue/components/ScsBridgeSessionManagement.vue'),
      path.resolve(TEMPLATE, '../suite8/vue/components/Suite8Biplane.vue'),
      path.resolve(TEMPLATE, '../graphiteScribe/vue/GraphiteScribeHomeLanding.vue'),
      path.resolve(TEMPLATE, '../graphiteScribe/vue/components/GraphiteScribeBiplane.vue'),
    ];
    for (const p of pages) {
      const src = read(p);
      const onMountedBlocks = src.split('onMounted(').slice(1);
      for (const block of onMountedBlocks) {
        const body = block.slice(0, block.indexOf('});') + 1);
        expect(body).not.toMatch(/setSpawnModel\(selectedModel\.value\)/);
      }
    }
  });

  test('T5 · the new-spawn default is the DERIVED highest Opus', () => {
    expect(DEFAULT_MODEL).toBe('claude-opus-5');
  });
});

describe('C1104 · the precedence law is durable', () => {
  test('RegistryEntry carries modelSetAt', () => {
    expect(read(path.join(SRC, 'lib/bridge/types.ts'))).toContain('modelSetAt?: number;');
  });

  test('setSessionModel takes a source and refuses a stale observation', () => {
    const src = read(path.join(SRC, 'lib/bridge/registry.ts'));
    expect(src).toContain("source: 'set' | 'observed' = 'set',");
    expect(src).toContain("registry.model.observed-stale");
    expect(src).toContain("registry.model.ulid-not-found");
  });

  test('the sweep WRITE branch cannot mint a stamp on an unstamped entry', () => {
    const src = read(path.join(SRC, 'lib/bridge/registry.ts'));
    expect(src).toContain(
      "if (typeof stamp === 'string' && normalizedSeen !== null && normalizedSeen !== stamp) {",
    );
  });
});
