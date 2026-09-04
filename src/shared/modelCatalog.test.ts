import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  AVAILABLE_MODELS,
  DEFAULT_MODEL,
  ModelCatalogEntry,
  highestOpusId,
  isAvailableModel,
  modelLabel,
} from './modelCatalog.model';

/**
 * THE PINNING CONCLUDER (C1104 · Lane 7 guards 6 + 7). The default is DERIVED
 * ("we Default to the Highest Version of Opus"), so a Concluder must pin today's value —
 * a malformed catalog edit has to fail LOUDLY rather than silently move the default.
 */
function makeRow(id: string): ModelCatalogEntry {
  return { id, label: id, tier: 'flagship', blurb: '' };
}

const TEMPLATE_CATALOG = path.resolve(
  __dirname,
  '../../Cascades/scps/template/SCP/src/concepts/scsBridge/model/scsModelCatalog.model.ts',
);

/** the template twin is a MIRROR file, not an importable module (the SYNC-NOTE forbids a
 *  path alias into the bridge lib and tsconfig rootDir is ./src) — parse its ids as text. */
function templateCatalogIds(): string[] {
  const src = fs.readFileSync(TEMPLATE_CATALOG, 'utf-8');
  const body = src.slice(src.indexOf('SCS_AVAILABLE_MODELS'));
  const ids: string[] = [];
  const re = /id:\s*'([^']+)'/g;
  let m: RegExpExecArray | null = re.exec(body);
  while (m) {
    ids.push(m[1]);
    m = re.exec(body);
  }
  return ids;
}

describe('modelCatalog · the highest-Opus derivation', () => {
  test('T6 · pins today\'s derived default to claude-opus-5', () => {
    expect(highestOpusId(AVAILABLE_MODELS)).toBe('claude-opus-5');
    expect(DEFAULT_MODEL).toBe('claude-opus-5');
  });

  test('T6 · the double-digit regression fixture (Lane 7 guard 6): 5-10 beats 5-8', () => {
    expect(highestOpusId([makeRow('claude-opus-5-8'), makeRow('claude-opus-5-10')])).toBe(
      'claude-opus-5-10',
    );
    // the naive string compare this replaces gets it backwards:
    expect('claude-opus-5-8' > 'claude-opus-5-10').toBe(true);
  });

  test('a bare major sorts BELOW a pinned snapshot of the same major', () => {
    expect(highestOpusId([makeRow('claude-opus-5'), makeRow('claude-opus-5-20260901')])).toBe(
      'claude-opus-5-20260901',
    );
  });

  test('never throws with no Opus row — falls to the first catalog row', () => {
    expect(highestOpusId([makeRow('claude-fable-5-1')])).toBe('claude-fable-5-1');
    expect(highestOpusId([])).toBe('');
  });

  test('non-Opus rows never win the derivation', () => {
    expect(highestOpusId(AVAILABLE_MODELS).startsWith('claude-opus-')).toBe(true);
  });
});

describe('modelCatalog · Fable 5.1 and the two-catalog parity law', () => {
  test('T7 · claude-fable-5-1 is in the bridge catalog exactly once', () => {
    expect(AVAILABLE_MODELS.filter((m) => m.id === 'claude-fable-5-1')).toHaveLength(1);
    expect(isAvailableModel('claude-fable-5-1')).toBe(true);
    expect(modelLabel('claude-fable-5-1')).toBe('Fable 5.1');
  });

  test('T7 · claude-fable-5-1 is in the template catalog exactly once', () => {
    expect(templateCatalogIds().filter((id) => id === 'claude-fable-5-1')).toHaveLength(1);
  });

  test('T7 · guard 7 · the two catalogs carry the SAME id set in the SAME order', () => {
    expect(templateCatalogIds()).toEqual(AVAILABLE_MODELS.map((m) => m.id));
  });

  test('claude-fable-5 survives as a distinct row (the 2 real choices)', () => {
    expect(isAvailableModel('claude-fable-5')).toBe(true);
    expect(modelLabel('claude-fable-5')).toBe('Fable 5');
  });
});
