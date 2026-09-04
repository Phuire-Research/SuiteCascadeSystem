/**
 * instructionSetViewerRender — the Update sub-page's PURE render helpers (C1124 · Salvo FTU)
 *
 * Presentation-layer passes over `marked` output. No fetch, no Vue, no new data flow — the three
 * means (LAUNCH · VIEWER · DIFF) are untouched; these functions only stamp ATTRIBUTES that the
 * component's stylesheet reads. Every color stays in that stylesheet as a `--color-<spectrum>`
 * variable (Pewter Tessera D1 · D9 Law 2) — this module never emits a color.
 *
 * THE SOURCE-LINE WALK (synthesis U4 · the Graphite Scribe's line-number gutter adapted to rendered
 * markdown): `marked.lexer()` consumes the source exactly — its top-level tokens' `raw` strings re-join
 * to the source byte-for-byte — so accumulating the newlines in each `raw` gives every block the
 * 1-indexed SOURCE line it starts on. Each block renders on its own (`marked.parser([token])`) and its
 * first element is stamped `data-line`; the gutter is CSS (`::before { content: attr(data-line) }`) on
 * the block's FIRST visual row, so wrapped paragraphs and tables cannot drift it, and the numbers
 * speak the same coordinates as the diff pane's `@@` hunk headers.
 *
 * THE CONTENT-KEYED TAGGER (U1 · U2 · U3 · U6) — over a parsed DOM (an inert <template>), never a regex,
 * never a DOM position:
 *   · `## 📜 SECTION N`  → h2[data-section="N"] — an anchor only; SECTION headers keep the HiFi heading
 *     register (U6). Keyed on the parsed N, so the constitution's absent SECTION 8 misaligns nothing.
 *   · `### C{n} …`        → h3[data-crystraline="<spectrum>"], rotating FROM RED on the parsed n
 *     (C1 red · C2 orange · C3 yellow · C4 green · C5 blue · C6 purple · C7 fuchsia · C8 red · C9 orange).
 *     Reads textContent — the nested <strong> in the C5 header and the 📜 surrogate pair survive intact.
 *   · Suite rows `| 0 | Base |` … `| 7 | Fuchsia |` → tr[data-suite="<spectrum>"] by the parsed NAME in
 *     the second cell (the first cell a single digit). The stylesheet gives rows 1-7 their own variable
 *     and leaves Base in the neutral register.
 *
 * ABSENCE IS A STATE: no DOM (the SSR pass) → the plain `marked.parse` HTML returns untagged; absent
 * `hifiConfig.json` → the shipped `:root` defaults stand (U10) — nothing here writes a color.
 */
import { marked, type Token } from 'marked';
import { SPECTRUM_NAMES, type SpectrumName } from '../../../model/suiteColorOverride.model';

// THE CRYSTRALINE ROTATION · FROM RED (U1): the seven colored suites in cascade order — base BACKS,
// it does not rotate (near-black on the near-black board is not coloring).
const CRYSTRALINE_ROTATION: readonly SpectrumName[] = SPECTRUM_NAMES.filter((n) => n !== 'base');

export function crystralineSpectrum(crystralineNumber: number): SpectrumName | null {
  if (!Number.isInteger(crystralineNumber) || crystralineNumber < 1) return null;
  return CRYSTRALINE_ROTATION[(crystralineNumber - 1) % CRYSTRALINE_ROTATION.length];
}

export function suiteSpectrumFromName(cellText: string): SpectrumName | null {
  const key = cellText.trim().toLowerCase();
  return (SPECTRUM_NAMES as readonly string[]).includes(key) ? (key as SpectrumName) : null;
}

const SECTION_LABEL = /\bSECTION\s+(\d+)\b/;
const CRYSTRALINE_LABEL = /^C(\d+)\b/;
const HUNK_HEADER = /^@@\s+-\d+(?:,\d+)?\s+\+(\d+)(?:,\d+)?\s+@@/;

/** The `+start` of a unified-diff hunk header (`@@ -a,b +c,d @@`) — null for any other line (U5). */
export function hunkHeaderNewStart(line: string): number | null {
  const m = HUNK_HEADER.exec(line);
  return m ? Number(m[1]) : null;
}

export function countNewlines(text: string): number {
  let n = 0;
  for (let i = text.indexOf('\n'); i !== -1; i = text.indexOf('\n', i + 1)) n += 1;
  return n;
}

function hasDom(): boolean {
  return typeof document !== 'undefined' && typeof document.createElement === 'function';
}

/** Render markdown with every top-level block's first element stamped `data-line` (its 1-indexed source line). */
export function renderWithSourceLines(markdown: string): string {
  if (!markdown) return '';
  if (!hasDom()) return marked.parse(markdown, { async: false }) as string;
  const tokens: Token[] = marked.lexer(markdown);
  const out = document.createElement('template');
  let line = 1;
  for (let i = 0; i < tokens.length; i += 1) {
    const startLine = line;
    // Consecutive top-level `text` tokens are ONE paragraph to the parser — keep them one block.
    const group: Token[] = [tokens[i]];
    while (tokens[i].type === 'text' && i + 1 < tokens.length && tokens[i + 1].type === 'text') {
      i += 1;
      group.push(tokens[i]);
    }
    for (const t of group) line += countNewlines(t.raw);
    const html = marked.parser(group);
    if (!html) continue;
    const block = document.createElement('template');
    block.innerHTML = html;
    block.content.firstElementChild?.setAttribute('data-line', String(startLine));
    out.content.appendChild(block.content);
  }
  return out.innerHTML;
}

/** Tag SECTION headers (anchor), Crystraline headers (rotation), and Suite rows (own name) — content-keyed. */
export function tagConstitutionHeaders(html: string): string {
  if (!html || !hasDom()) return html;
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  const root = tpl.content;

  root.querySelectorAll('h2').forEach((h2) => {
    const m = SECTION_LABEL.exec(h2.textContent ?? '');
    if (!m) return;
    h2.setAttribute('data-section', m[1]);
    if (!h2.id) h2.id = `section-${m[1]}`;
  });

  root.querySelectorAll('h3').forEach((h3) => {
    const m = CRYSTRALINE_LABEL.exec((h3.textContent ?? '').trim());
    if (!m) return;
    const n = Number(m[1]);
    const spectrum = crystralineSpectrum(n);
    if (!spectrum) return;
    h3.setAttribute('data-crystraline', spectrum);
    h3.setAttribute('data-crystraline-index', String(n));
    if (!h3.id) h3.id = `crystraline-${n}`;
  });

  root.querySelectorAll('tr').forEach((tr) => {
    const cells = Array.from(tr.children).filter((c) => c.tagName === 'TD');
    if (cells.length < 2) return;
    if (!/^\d$/.test((cells[0].textContent ?? '').trim())) return;
    const spectrum = suiteSpectrumFromName(cells[1].textContent ?? '');
    if (spectrum) tr.setAttribute('data-suite', spectrum);
  });

  return tpl.innerHTML;
}

/** The VIEWER's render — source-line stamps, then the content-keyed tags. One call from `renderedLocal`. */
export function renderInstructionSet(markdown: string): string {
  return tagConstitutionHeaders(renderWithSourceLines(markdown));
}
