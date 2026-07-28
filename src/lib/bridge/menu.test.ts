import {
  applyKeypress,
  renderMenu,
  renderMenuLegacy,
  renderScpSubMenuPane,
  findIndexByUlid,
  findIndexByRowId,
  buildMenuRows,
  preserveCursorAcrossUpdate,
  relativeTime,
  truncateMiddle,
  clampCurrentPage,
  getBodyPageSessions,
  deriveSessionState,
  formatHead,
  formatTail,
  formatInstall,
  formatBodyPage,
  formatSessionRow,
  stripAnsiCodes,
  visibleLength,
  clipAndPadToWidth,
  MIN_TERM_HEIGHT,
  RESERVED_LINES,
  RESERVED_LINES_WITH_INSTALL,
  SYNTHETIC_NEW,
  SYNTHETIC_CLOSE,
  SYNTHETIC_INSTALL,
  type MenuState,
} from './menu';
import type { RegistryEntry } from './types';

const mkSession = (
  id: string,
  claudeSessionId: string,
  status: 'allocated' | 'launched' | 'archived' | 'offline' = 'launched',
  spawnedAt = 1714834000000,
  cwd = '/test/cwd',
): RegistryEntry => ({
  id,
  claudeSessionId,
  status,
  spawnedAt,
  cwd,
});

const baseState: MenuState = {
  sessions: [mkSession('01A', 'uuid-A'), mkSession('01B', 'uuid-B'), mkSession('01C', 'uuid-C')],
  selectedUlid: '01B',
  termWidth: 120,
  termHeight: 30,
  lastRenderedAt: 1714834000000,
  spawnInFlight: false,
};

// Helper: build N sessions with monotonic spawnedAt for deterministic sort.
const mkPagedSessions = (n: number): RegistryEntry[] =>
  Array.from({ length: n }, (_, i) =>
    mkSession(`01${String(i).padStart(3, '0')}`, `uuid-${i}`, 'launched', 1714834000000 + i * 1000),
  );

// ── Pure helpers ─────────────────────────────────────────────────

describe('clampCurrentPage', () => {
  test('clamps negative to 0', () => {
    expect(clampCurrentPage(-1, 5)).toBe(0);
    expect(clampCurrentPage(-100, 5)).toBe(0);
  });
  test('clamps overflow to totalPages-1', () => {
    expect(clampCurrentPage(10, 5)).toBe(4);
    expect(clampCurrentPage(99, 5)).toBe(4);
  });
  test('returns 0 when totalPages === 0', () => {
    expect(clampCurrentPage(0, 0)).toBe(0);
    expect(clampCurrentPage(5, 0)).toBe(0);
  });
  test('returns 0 when totalPages === 1', () => {
    expect(clampCurrentPage(0, 1)).toBe(0);
    expect(clampCurrentPage(5, 1)).toBe(0);
  });
  test('returns page in middle of range unchanged', () => {
    expect(clampCurrentPage(2, 5)).toBe(2);
  });
});

describe('getBodyPageSessions', () => {
  const sessions = mkPagedSessions(10);

  test('returns first 5 on page 0', () => {
    const got = getBodyPageSessions(sessions, 0, 5);
    expect(got).toHaveLength(5);
    expect(got[0].id).toBe('01000');
    expect(got[4].id).toBe('01004');
  });
  test('returns last 5 on page 1', () => {
    const got = getBodyPageSessions(sessions, 1, 5);
    expect(got).toHaveLength(5);
    expect(got[0].id).toBe('01005');
    expect(got[4].id).toBe('01009');
  });
  test('returns empty array when page is out of range', () => {
    expect(getBodyPageSessions(sessions, 2, 5)).toEqual([]);
    expect(getBodyPageSessions(sessions, 99, 5)).toEqual([]);
  });
  test('returns empty array when visibleBodySlots <= 0', () => {
    expect(getBodyPageSessions(sessions, 0, 0)).toEqual([]);
    expect(getBodyPageSessions(sessions, 0, -1)).toEqual([]);
  });
  test('returns partial last page', () => {
    const got = getBodyPageSessions(sessions, 1, 7);
    expect(got).toHaveLength(3);
    expect(got[0].id).toBe('01007');
  });
});

describe('deriveSessionState (Diamond K 3-state)', () => {
  test('claudePid undefined → pending', () => {
    const entry: RegistryEntry = {
      id: '01X',
      claudeSessionId: 'uuid-X',
      spawnedAt: 1714834000000,
      status: 'allocated',
      cwd: '/test',
    };
    expect(deriveSessionState(entry)).toBe('pending');
  });

  test('claudePid defined → alive', () => {
    const entry: RegistryEntry = {
      id: '01Y',
      claudeSessionId: 'uuid-Y',
      claudePid: 12345,
      spawnedAt: 1714834000000,
      status: 'launched',
      cwd: '/test',
    };
    expect(deriveSessionState(entry)).toBe('alive');
  });

  test('claudePid 0 still derives as alive (presence check, not value)', () => {
    const entry: RegistryEntry = {
      id: '01Z',
      claudeSessionId: 'uuid-Z',
      claudePid: 0,
      spawnedAt: 1714834000000,
      status: 'launched',
      cwd: '/test',
    };
    expect(deriveSessionState(entry)).toBe('alive');
  });

  test("status==='offline' with no claudePid → offline", () => {
    const entry: RegistryEntry = {
      id: '01O',
      claudeSessionId: 'uuid-O',
      spawnedAt: 1714834000000,
      status: 'offline',
      cwd: '/test',
    };
    expect(deriveSessionState(entry)).toBe('offline');
  });

  test("status==='offline' precedence wins over claudePid still set (race window)", () => {
    const entry: RegistryEntry = {
      id: '01P',
      claudeSessionId: 'uuid-P',
      claudePid: 12345,
      spawnedAt: 1714834000000,
      status: 'offline',
      cwd: '/test',
    };
    expect(deriveSessionState(entry)).toBe('offline');
  });
});

// ── applyKeypress: Page navigation (Diamond H) ─────────────────────

describe('applyKeypress page navigation (Diamond H)', () => {
  // 30 sessions, termHeight=11 (γ shift: RESERVED_LINES bumped 5→6) →
  // visibleBodySlots = 11-6 = 5; totalPages = ceil(30/5) = 6
  const sessions = mkPagedSessions(30);
  const stateAt = (page: number, selected: string): MenuState => ({
    ...baseState,
    sessions,
    selectedUlid: selected,
    termHeight: 11,
    currentPage: page,
  });

  test('Left/h decrements currentPage', () => {
    const state = stateAt(2, '01015');
    const { newState, action } = applyKeypress(state, { name: 'left' });
    expect(newState.currentPage).toBe(1);
    expect(action).toEqual({ type: 'page-left' });
  });

  test('Right/l increments currentPage', () => {
    const state = stateAt(1, '01015');
    const { newState, action } = applyKeypress(state, { name: 'right' });
    expect(newState.currentPage).toBe(2);
    expect(action).toEqual({ type: 'page-right' });
  });

  test('Left at page 0 stays at 0 (no-op)', () => {
    const state = stateAt(0, '01029');
    const { newState } = applyKeypress(state, { name: 'left' });
    expect(newState.currentPage).toBe(0);
  });

  test('Right at last page stays at maxPage (no-op)', () => {
    const state = stateAt(5, '01000');
    const { newState } = applyKeypress(state, { name: 'right' });
    expect(newState.currentPage).toBe(5);
  });

  test('Right preserves cursor at HEAD across page change', () => {
    const state = stateAt(0, SYNTHETIC_NEW);
    const { newState } = applyKeypress(state, { name: 'right' });
    expect(newState.currentPage).toBe(1);
    expect(newState.selectedUlid).toBe(SYNTHETIC_NEW);
  });

  test('Right preserves cursor at TAIL across page change', () => {
    const state = stateAt(0, SYNTHETIC_CLOSE);
    const { newState } = applyKeypress(state, { name: 'right' });
    expect(newState.currentPage).toBe(1);
    expect(newState.selectedUlid).toBe(SYNTHETIC_CLOSE);
  });

  test('Right resets cursor to first body row of new page (when not HEAD/TAIL)', () => {
    const state = stateAt(0, '01029');
    const { newState } = applyKeypress(state, { name: 'right' });
    expect(newState.currentPage).toBe(1);
    // page 1 first session = sorted[5] (DESC by spawnedAt; sorted = '01029' first)
    // sorted = 01029, 01028, ..., 01000 → page 0 = [01029..01025]; page 1 = [01024..01020]
    expect(newState.selectedUlid).toBe('01024');
  });

  test('PgUp aliases Left', () => {
    const state = stateAt(2, '01015');
    const { action } = applyKeypress(state, { name: 'pageup' });
    expect(action).toEqual({ type: 'page-left' });
  });

  test('PgDn aliases Right', () => {
    const state = stateAt(1, '01015');
    const { action } = applyKeypress(state, { name: 'pagedown' });
    expect(action).toEqual({ type: 'page-right' });
  });

  test('b aliases Left', () => {
    const state = stateAt(2, '01015');
    const { action } = applyKeypress(state, { name: 'b' });
    expect(action).toEqual({ type: 'page-left' });
  });

  test('f aliases Right', () => {
    const state = stateAt(1, '01015');
    const { action } = applyKeypress(state, { name: 'f' });
    expect(action).toEqual({ type: 'page-right' });
  });
});

// ── applyKeypress: Up/Down page-bounded (Diamond H) ────────────────

describe('applyKeypress Up/Down page-bounded (Diamond H)', () => {
  const sessions = mkPagedSessions(30);
  // termHeight=10 → visibleBodySlots = 5; sorted sessions DESC by spawnedAt:
  //   page 0 = ['01029', '01028', '01027', '01026', '01025']

  test('Up at HEAD is no-op (silent)', () => {
    const state: MenuState = {
      ...baseState,
      sessions,
      selectedUlid: SYNTHETIC_NEW,
      termHeight: 11,
      currentPage: 0,
    };
    const { newState, action } = applyKeypress(state, { name: 'up' });
    expect(newState.selectedUlid).toBe(SYNTHETIC_NEW);
    expect(action).toEqual({ type: 'cursor-up' });
  });

  test('Up at first body row → HEAD', () => {
    const state: MenuState = {
      ...baseState,
      sessions,
      selectedUlid: '01029',
      termHeight: 11,
      currentPage: 0,
    };
    const { newState } = applyKeypress(state, { name: 'up' });
    expect(newState.selectedUlid).toBe(SYNTHETIC_NEW);
  });

  test('Up at TAIL → last body row', () => {
    const state: MenuState = {
      ...baseState,
      sessions,
      selectedUlid: SYNTHETIC_CLOSE,
      termHeight: 11,
      currentPage: 0,
    };
    const { newState } = applyKeypress(state, { name: 'up' });
    expect(newState.selectedUlid).toBe('01025');
  });

  test('Up mid-body → previous row', () => {
    const state: MenuState = {
      ...baseState,
      sessions,
      selectedUlid: '01027',
      termHeight: 11,
      currentPage: 0,
    };
    const { newState } = applyKeypress(state, { name: 'up' });
    expect(newState.selectedUlid).toBe('01028');
  });

  test('Down at HEAD → first body row', () => {
    const state: MenuState = {
      ...baseState,
      sessions,
      selectedUlid: SYNTHETIC_NEW,
      termHeight: 11,
      currentPage: 0,
    };
    const { newState } = applyKeypress(state, { name: 'down' });
    expect(newState.selectedUlid).toBe('01029');
  });

  test('Down at last body row → TAIL', () => {
    const state: MenuState = {
      ...baseState,
      sessions,
      selectedUlid: '01025',
      termHeight: 11,
      currentPage: 0,
    };
    const { newState } = applyKeypress(state, { name: 'down' });
    expect(newState.selectedUlid).toBe(SYNTHETIC_CLOSE);
  });

  test('Down at TAIL is no-op (silent)', () => {
    const state: MenuState = {
      ...baseState,
      sessions,
      selectedUlid: SYNTHETIC_CLOSE,
      termHeight: 11,
      currentPage: 0,
    };
    const { newState, action } = applyKeypress(state, { name: 'down' });
    expect(newState.selectedUlid).toBe(SYNTHETIC_CLOSE);
    expect(action).toEqual({ type: 'cursor-down' });
  });

  test('Down mid-body → next row', () => {
    const state: MenuState = {
      ...baseState,
      sessions,
      selectedUlid: '01028',
      termHeight: 11,
      currentPage: 0,
    };
    const { newState } = applyKeypress(state, { name: 'down' });
    expect(newState.selectedUlid).toBe('01027');
  });

  // ── FIX-3 (Viridian): Empty body — HEAD ↔ TAIL skip body ─────────
  test('FIX-3: Up at TAIL with empty body → HEAD', () => {
    const state: MenuState = {
      ...baseState,
      sessions: [],
      selectedUlid: SYNTHETIC_CLOSE,
      termHeight: 11,
      currentPage: 0,
    };
    const { newState } = applyKeypress(state, { name: 'up' });
    expect(newState.selectedUlid).toBe(SYNTHETIC_NEW);
  });

  test('FIX-3: Down at HEAD with empty body → TAIL', () => {
    const state: MenuState = {
      ...baseState,
      sessions: [],
      selectedUlid: SYNTHETIC_NEW,
      termHeight: 11,
      currentPage: 0,
    };
    const { newState } = applyKeypress(state, { name: 'down' });
    expect(newState.selectedUlid).toBe(SYNTHETIC_CLOSE);
  });
});

// ── applyKeypress: Home/End (Diamond H) ────────────────────────────

describe('applyKeypress Home/End (Diamond H)', () => {
  const sessions = mkPagedSessions(30);

  test('Home → page 0 + cursor HEAD', () => {
    const state: MenuState = {
      ...baseState,
      sessions,
      selectedUlid: '01015',
      termHeight: 11,
      currentPage: 3,
    };
    const { newState, action } = applyKeypress(state, { name: 'home' });
    expect(newState.currentPage).toBe(0);
    expect(newState.selectedUlid).toBe(SYNTHETIC_NEW);
    expect(action).toEqual({ type: 'cursor-home' });
  });

  test('End → maxPage + cursor TAIL', () => {
    const state: MenuState = {
      ...baseState,
      sessions,
      selectedUlid: SYNTHETIC_NEW,
      termHeight: 11,
      currentPage: 0,
    };
    const { newState, action } = applyKeypress(state, { name: 'end' });
    // sessions=30, visibleBodySlots=5 → totalPages=6 → maxPage=5
    expect(newState.currentPage).toBe(5);
    expect(newState.selectedUlid).toBe(SYNTHETIC_CLOSE);
    expect(action).toEqual({ type: 'cursor-end' });
  });

  test('g aliases Home', () => {
    const state: MenuState = {
      ...baseState,
      sessions,
      selectedUlid: '01015',
      termHeight: 11,
      currentPage: 3,
    };
    const { action } = applyKeypress(state, { name: 'g' });
    expect(action).toEqual({ type: 'cursor-home' });
  });

  test('G aliases End', () => {
    const state: MenuState = {
      ...baseState,
      sessions,
      selectedUlid: SYNTHETIC_NEW,
      termHeight: 11,
      currentPage: 0,
    };
    const { action } = applyKeypress(state, { name: 'G' });
    expect(action).toEqual({ type: 'cursor-end' });
  });
});

// ── applyKeypress: Return action (Diamond I — registry IS the truth, no probe) ───

describe('applyKeypress Return action (Diamond I)', () => {
  test('Return on session entry dispatches resume-selected', () => {
    const state: MenuState = {
      ...baseState,
      selectedUlid: '01A',
      termHeight: 11,
    };
    const { action } = applyKeypress(state, { name: 'return' });
    expect(action).toEqual({ type: 'resume-selected' });
  });

  test('Return on SYNTHETIC_NEW dispatches spawn-new', () => {
    const state: MenuState = {
      ...baseState,
      selectedUlid: SYNTHETIC_NEW,
    };
    const { action } = applyKeypress(state, { name: 'return' });
    expect(action).toEqual({ type: 'spawn-new' });
  });

  test('Return on SYNTHETIC_CLOSE dispatches close', () => {
    const state: MenuState = {
      ...baseState,
      selectedUlid: SYNTHETIC_CLOSE,
    };
    const { action } = applyKeypress(state, { name: 'return' });
    expect(action).toEqual({ type: 'close' });
  });
});

// ── applyKeypress: control keys ─────────────────────────────────

describe('applyKeypress control keys', () => {
  test('n dispatches spawn-new', () => {
    const { action } = applyKeypress(baseState, { name: 'n' });
    expect(action).toEqual({ type: 'spawn-new' });
  });
  test('q dispatches close', () => {
    const { action } = applyKeypress(baseState, { name: 'q' });
    expect(action).toEqual({ type: 'close' });
  });
  test('escape dispatches close', () => {
    const { action } = applyKeypress(baseState, { name: 'escape' });
    expect(action).toEqual({ type: 'close' });
  });
  test('Ctrl+C dispatches close', () => {
    const { action } = applyKeypress(baseState, { name: 'c', ctrl: true });
    expect(action).toEqual({ type: 'close' });
  });
  test('unrecognized key dispatches noop', () => {
    const { action } = applyKeypress(baseState, { name: 'z' });
    expect(action).toEqual({ type: 'noop' });
  });
});

// ── Diamond N Fix N-D3: x-key forced eviction ─────────────────────

describe('Diamond N Fix N-D3 x-key remove-selected', () => {
  test('x on real ulid → remove-selected action', () => {
    const { action } = applyKeypress(baseState, { name: 'x' });
    expect(action).toEqual({ type: 'remove-selected' });
  });
  test('x on SYNTHETIC_NEW → noop (sentinel protected)', () => {
    const state: MenuState = { ...baseState, selectedUlid: SYNTHETIC_NEW };
    const { action } = applyKeypress(state, { name: 'x' });
    expect(action).toEqual({ type: 'noop' });
  });
  test('x on SYNTHETIC_CLOSE → noop (sentinel protected)', () => {
    const state: MenuState = { ...baseState, selectedUlid: SYNTHETIC_CLOSE };
    const { action } = applyKeypress(state, { name: 'x' });
    expect(action).toEqual({ type: 'noop' });
  });
  test('x on null selection → noop', () => {
    const state: MenuState = { ...baseState, selectedUlid: null };
    const { action } = applyKeypress(state, { name: 'x' });
    expect(action).toEqual({ type: 'noop' });
  });
});

// ── findIndexBy ─────────────────────────────────────────────────

describe('findIndexByUlid', () => {
  test('finds existing ULID', () => {
    expect(findIndexByUlid(baseState.sessions, '01B')).toBe(1);
  });
  test('returns -1 for missing ULID', () => {
    expect(findIndexByUlid(baseState.sessions, '01Z')).toBe(-1);
  });
  test('returns -1 for null', () => {
    expect(findIndexByUlid(baseState.sessions, null)).toBe(-1);
  });
});

describe('findIndexByRowId', () => {
  test('finds session row by ULID', () => {
    const rows = buildMenuRows(baseState.sessions);
    expect(findIndexByRowId(rows, '01B')).toBe(2);
  });
  test('finds SYNTHETIC_NEW at index 0', () => {
    const rows = buildMenuRows(baseState.sessions);
    expect(findIndexByRowId(rows, SYNTHETIC_NEW)).toBe(0);
  });
  test('finds SYNTHETIC_CLOSE at last index', () => {
    const rows = buildMenuRows(baseState.sessions);
    expect(findIndexByRowId(rows, SYNTHETIC_CLOSE)).toBe(rows.length - 1);
  });
  test('returns -1 for unknown id', () => {
    const rows = buildMenuRows(baseState.sessions);
    expect(findIndexByRowId(rows, '01Z')).toBe(-1);
  });
  test('returns -1 for null', () => {
    expect(findIndexByRowId([], null)).toBe(-1);
  });
});

describe('buildMenuRows', () => {
  test('empty sessions yields [synthetic-new, synthetic-close]', () => {
    const rows = buildMenuRows([]);
    expect(rows).toHaveLength(2);
    expect(rows[0].kind).toBe('synthetic-new');
    expect(rows[1].kind).toBe('synthetic-close');
  });
  test('two sessions yields 4 rows: [new, S1, S2, close]', () => {
    const rows = buildMenuRows([mkSession('01A', 'uuid-A'), mkSession('01B', 'uuid-B')]);
    expect(rows).toHaveLength(4);
    expect(rows[0].kind).toBe('synthetic-new');
    expect(rows[1].kind).toBe('session');
    expect(rows[2].kind).toBe('session');
    expect(rows[3].kind).toBe('synthetic-close');
  });
  test('session row carries entry + Diamond I 2-state derivation', () => {
    const rows = buildMenuRows([mkSession('01A', 'uuid-A')]);
    const sessionRow = rows[1];
    if (sessionRow.kind !== 'session') {
      throw new Error(`Expected session kind, got ${sessionRow.kind}`);
    }
    expect(sessionRow.entry.id).toBe('01A');
    // mkSession() omits claudePid → derives 'pending'
    expect(['pending', 'alive']).toContain(sessionRow.state);
    expect(sessionRow.state).toBe('pending');
  });
});

describe('preserveCursorAcrossUpdate', () => {
  test('preserves selectedUlid when still present', () => {
    const newSessions = [
      mkSession('01A', 'uuid-A'),
      mkSession('01B', 'uuid-B'),
      mkSession('01D', 'uuid-D'),
    ];
    expect(preserveCursorAcrossUpdate('01B', newSessions)).toBe('01B');
  });
  test('defaults to first when selectedUlid removed', () => {
    const newSessions = [mkSession('01A', 'uuid-A'), mkSession('01D', 'uuid-D')];
    expect(preserveCursorAcrossUpdate('01B', newSessions)).toBe('01A');
  });
  test('defaults to SYNTHETIC_NEW when newSessions empty', () => {
    expect(preserveCursorAcrossUpdate('01B', [])).toBe(SYNTHETIC_NEW);
  });
  test('null cursor with non-empty sessions defaults to first', () => {
    const newSessions = [mkSession('01A', 'uuid-A')];
    expect(preserveCursorAcrossUpdate(null, newSessions)).toBe('01A');
  });
  test('SYNTHETIC_NEW preserved across registry update', () => {
    const newSessions = [mkSession('01A', 'uuid-A'), mkSession('01B', 'uuid-B')];
    expect(preserveCursorAcrossUpdate(SYNTHETIC_NEW, newSessions)).toBe(SYNTHETIC_NEW);
  });
  test('SYNTHETIC_CLOSE preserved across registry update', () => {
    const newSessions = [mkSession('01A', 'uuid-A')];
    expect(preserveCursorAcrossUpdate(SYNTHETIC_CLOSE, newSessions)).toBe(SYNTHETIC_CLOSE);
  });
  test('SYNTHETIC_NEW preserved when newSessions empty', () => {
    expect(preserveCursorAcrossUpdate(SYNTHETIC_NEW, [])).toBe(SYNTHETIC_NEW);
  });
});

describe('relativeTime', () => {
  test('just now (<10s)', () => {
    expect(relativeTime(Date.now() - 5_000, Date.now())).toBe('just now');
  });
  test('seconds (<60s)', () => {
    expect(relativeTime(0, 30_000)).toBe('30s ago');
  });
  test('minutes (<60m)', () => {
    expect(relativeTime(0, 5 * 60_000)).toBe('5m ago');
  });
  test('hours (<24h)', () => {
    expect(relativeTime(0, 2 * 3_600_000)).toBe('2h ago');
  });
  test('days', () => {
    expect(relativeTime(0, 3 * 86_400_000)).toBe('3d ago');
  });
});

describe('truncateMiddle', () => {
  test('short string returned as-is', () => {
    expect(truncateMiddle('hello', 10)).toBe('hello');
  });
  test('long string truncated with middle marker', () => {
    expect(truncateMiddle('abcdefghijklmnop', 10)).toMatch(/…/);
    expect(truncateMiddle('abcdefghijklmnop', 10).length).toBeLessThanOrEqual(10);
  });
});

// ── renderMenu (Diamond H) ─────────────────────────────────────

describe('renderMenu HBT (Diamond H)', () => {
  test('selected synthetic row has reverse ANSI prefix', () => {
    const out = renderMenu({ ...baseState, selectedUlid: SYNTHETIC_NEW });
    expect(out).toContain('\x1b[7m');
    expect(out).toContain('→ ');
  });

  test('footer shows updated keybindings', () => {
    const out = renderMenu(baseState);
    expect(out).toContain('↑/↓ navigate');
    expect(out).toContain('←/→ page');
    expect(out).toContain('Enter activate');
  });

  test('spawnInFlight shows hint', () => {
    const out = renderMenu({ ...baseState, spawnInFlight: true });
    expect(out).toContain('Spawning new session');
  });

  test('⊕ New Session row present (HEAD)', () => {
    const out = renderMenu(baseState);
    expect(out).toContain('⊕ New Session');
  });

  test('× Close Bridge row present (TAIL)', () => {
    const out = renderMenu(baseState);
    expect(out).toContain('× Close Bridge');
  });

  test('⊕ New Session row present in empty-sessions state', () => {
    const out = renderMenu({ ...baseState, sessions: [], selectedUlid: SYNTHETIC_NEW });
    expect(out).toContain('⊕ New Session');
  });

  test('× Close Bridge row present in empty-sessions state', () => {
    const out = renderMenu({ ...baseState, sessions: [], selectedUlid: SYNTHETIC_NEW });
    expect(out).toContain('× Close Bridge');
  });

  // FIX-2: Viridian + Rose ANSI escapes (truecolor or 256-color via rgbToAnsi).
  test('FIX-2: HEAD emits Viridian color escape', () => {
    const out = renderMenu({ ...baseState, selectedUlid: SYNTHETIC_NEW });
    // truecolor: \x1b[38;2;64;130;109m  · 256-color fallback: \x1b[38;5;NNNm
    // eslint-disable-next-line no-control-regex
    expect(out).toMatch(/\x1b\[38;(2;64;130;109|5;\d+)m/);
  });

  test('FIX-2: TAIL emits Rose color escape', () => {
    const out = renderMenu({ ...baseState, selectedUlid: SYNTHETIC_CLOSE });
    // eslint-disable-next-line no-control-regex
    expect(out).toMatch(/\x1b\[38;(2;255;102;178|5;\d+)m/);
  });

  test('Header line 2 shows Page X of Y', () => {
    const out = renderMenu({ ...baseState, termHeight: 10 });
    expect(out).toMatch(/Page 1 of 1/);
  });

  test('Header line 2 shows row range when sessions present', () => {
    const out = renderMenu({ ...baseState, termHeight: 10 });
    expect(out).toMatch(/rows 1-3/);
  });

  test('Diamond I: STATE column rendered for session row (2-state derivation from registry)', () => {
    const out = renderMenu({ ...baseState, termHeight: 10 });
    expect(out).toMatch(/pending|alive/);
  });

  test('Diamond K: STATE column renders offline for status==="offline" rows', () => {
    const offlineSessions: RegistryEntry[] = [mkSession('01OFF', 'uuid-OFF', 'offline')];
    const out = renderMenu({
      ...baseState,
      sessions: offlineSessions,
      selectedUlid: '01OFF',
      termHeight: 11,
    });
    expect(out).toMatch(/offline/);
  });
});

describe('renderMenu line-count invariant (Diamond H HBT)', () => {
  test('line-count invariant: any session count + termHeight ≥ MIN ⇒ output lines === termHeight', () => {
    for (const n of [0, 1, 5, 30, 100]) {
      for (const h of [MIN_TERM_HEIGHT, 10, 20, 50, 200]) {
        const state: MenuState = {
          ...baseState,
          sessions: mkPagedSessions(n),
          selectedUlid: SYNTHETIC_NEW,
          termHeight: h,
          currentPage: 0,
        };
        const out = renderMenu(state);
        expect(out.split('\n').length).toBe(h);
      }
    }
  });

  test('renderMenu termHeight=14 + sessions=30 + currentPage=0 → exactly 14 lines (HEAD + 9 body + TAIL + framing)', () => {
    const state: MenuState = {
      ...baseState,
      sessions: mkPagedSessions(30),
      selectedUlid: SYNTHETIC_NEW,
      termHeight: 14,
      currentPage: 0,
    };
    const out = renderMenu(state);
    const lines = out.split('\n');
    expect(lines.length).toBe(14);
  });

  test('renderMenu termHeight=10 + sessions=0 → exactly 10 lines (HEAD + empty body + TAIL + framing)', () => {
    const state: MenuState = {
      ...baseState,
      sessions: [],
      selectedUlid: SYNTHETIC_NEW,
      termHeight: 10,
      currentPage: 0,
    };
    const out = renderMenu(state);
    expect(out.split('\n').length).toBe(10);
  });

  test('renderMenu currentPage out-of-range → clamped to maxPage', () => {
    const state: MenuState = {
      ...baseState,
      sessions: mkPagedSessions(10),
      selectedUlid: SYNTHETIC_NEW,
      termHeight: 11,
      currentPage: 99,
    };
    const out = renderMenu(state);
    // visibleBodySlots = 5; totalPages = 2; maxPage = 1 → header should reflect clamp.
    expect(out).toMatch(/Page 2 of 2/);
  });
});

// ── renderMenu legacy backward-compat (Diamond H preserves) ────────

describe('renderMenu termHeight=0 legacy backward-compat', () => {
  test('renderMenu termHeight=0 → legacy path preserved', () => {
    const state: MenuState = {
      ...baseState,
      termHeight: 0,
    };
    const out = renderMenu(state);
    expect(out).toContain('\x1b[H');
    // Diamond B-25-UX-fix3 (CD-110 DVSP): banner version is now dynamic from
    // package.json. In test env, getBridgeVersion may return 'unknown' (no
    // package.json adjacent to a phantom cli.cjs). Verify the banner shape
    // rather than the literal version.
    expect(out).toContain('SCS Bridge — Persistent Session Menu');
  });
});

describe('renderMenu termHeight too-small branch', () => {
  test('termHeight=4 → "[terminal too small]" padded to 4 lines', () => {
    const state: MenuState = {
      ...baseState,
      termHeight: 4,
    };
    const out = renderMenu(state);
    expect(out.split('\n').length).toBe(4);
    expect(out).toContain('[terminal too small for menu]');
  });
});

// ── Format helpers exposed (Diamond H) ────────────────────────────

describe('formatHead / formatTail / formatBodyPage', () => {
  test('formatHead non-selected returns string with ⊕', () => {
    const out = formatHead(false);
    expect(out).toContain('⊕ New Session');
    expect(out).not.toContain('\x1b[7m');
  });
  test('formatHead selected adds REVERSE prefix', () => {
    const out = formatHead(true);
    expect(out).toContain('\x1b[7m');
    expect(out).toContain('→ ');
  });
  test('formatTail non-selected returns string with ×', () => {
    const out = formatTail(false);
    expect(out).toContain('× Close Bridge');
  });
  test('formatTail selected adds REVERSE prefix', () => {
    const out = formatTail(true);
    expect(out).toContain('\x1b[7m');
  });
  // Diamond P Fix P-3: pad-to-clear (Green Issue 4 — full-width spaces, not empty strings).
  test('formatBodyPage pads short pages with full-width blank rows (pad-to-clear)', () => {
    const sessions = mkPagedSessions(3);
    const out = formatBodyPage(sessions, null, 120, 7);
    expect(out).toHaveLength(7);
    // Pad rows are full-width spaces (Math.max(termWidth, 80)) — no empty strings.
    expect(out[3]).toBe(' '.repeat(120));
    expect(out[6]).toBe(' '.repeat(120));
  });
  test('formatBodyPage empty sessions returns visibleBodySlots full-width blank rows', () => {
    const out = formatBodyPage([], null, 120, 5);
    expect(out).toHaveLength(5);
    expect(out.every((r) => r === ' '.repeat(120))).toBe(true);
  });
  test('formatBodyPage pad uses 80-col floor when termWidth < 80', () => {
    const out = formatBodyPage([], null, 40, 3);
    expect(out).toHaveLength(3);
    expect(out.every((r) => r === ' '.repeat(80))).toBe(true);
  });
});

// ── Constants ─────────────────────────────────────────────────────

describe('Diamond H constants', () => {
  // Diamond γ: bumped 5 → 6 · Install SCP row now ALWAYS reserved (γ unconditional gate)
  test('RESERVED_LINES is 6 (header(2) + Install SCP(1) + HEAD(1) + TAIL(1) + footer(1))', () => {
    expect(RESERVED_LINES).toBe(6);
  });
  // Diamond α RM-Fix-1: bumped 6 → 7 to account for Install SCP row
  test('MIN_TERM_HEIGHT is 7', () => {
    expect(MIN_TERM_HEIGHT).toBe(7);
  });
});

// ── deriveSessionState dispatch-mode signal (Diamond K fix) ────────

describe('deriveSessionState dispatch-mode signal', () => {
  test('pending entry (no claudePid, status=allocated) → deriveSessionState returns pending → mode new', () => {
    const entry = mkSession('01D', 'uuid-D', 'allocated');
    const sessionState = deriveSessionState(entry);
    expect(sessionState).toBe('pending');
    // Blue maps 'pending' → launchInformative(ulid, 'new')
  });

  test('offline entry (status=offline) → deriveSessionState returns offline → mode resume', () => {
    const entry: RegistryEntry = { ...mkSession('01E', 'uuid-E', 'offline'), claudePid: undefined };
    const sessionState = deriveSessionState(entry);
    expect(sessionState).toBe('offline');
    // Blue maps 'offline' → launchInformative(ulid, 'resume')
  });

  test('alive entry (claudePid set, status=launched) → deriveSessionState returns alive → no spawn', () => {
    const entry: RegistryEntry = { ...mkSession('01F', 'uuid-F', 'launched'), claudePid: 12345 };
    const sessionState = deriveSessionState(entry);
    expect(sessionState).toBe('alive');
    // Blue maps 'alive' → stderr write, no launchInformative call
  });
});

describe('Diamond Q — rename mode keypress dispatch', () => {
  test('"r" on real ulid returns rename-selected action', () => {
    const state: MenuState = { ...baseState, selectedUlid: '01B' };
    const { action } = applyKeypress(state, { name: 'r', sequence: 'r' });
    expect(action.type).toBe('rename-selected');
  });

  test('"r" on SYNTHETIC_NEW returns noop', () => {
    const state: MenuState = { ...baseState, selectedUlid: SYNTHETIC_NEW };
    const { action } = applyKeypress(state, { name: 'r', sequence: 'r' });
    expect(action.type).toBe('noop');
  });

  test('"r" on SYNTHETIC_CLOSE returns noop', () => {
    const state: MenuState = { ...baseState, selectedUlid: SYNTHETIC_CLOSE };
    const { action } = applyKeypress(state, { name: 'r', sequence: 'r' });
    expect(action.type).toBe('noop');
  });

  test('rename mode active: Enter → rename-confirm', () => {
    const state: MenuState = {
      ...baseState,
      renameMode: { ulid: '01B', buffer: 'NewName' },
    };
    const { action } = applyKeypress(state, { name: 'return' });
    expect(action.type).toBe('rename-confirm');
  });

  test('rename mode active: Esc → rename-cancel', () => {
    const state: MenuState = {
      ...baseState,
      renameMode: { ulid: '01B', buffer: 'NewName' },
    };
    const { action } = applyKeypress(state, { name: 'escape' });
    expect(action.type).toBe('rename-cancel');
  });

  test('rename mode active: printable char appends to buffer', () => {
    const state: MenuState = {
      ...baseState,
      renameMode: { ulid: '01B', buffer: 'Hel' },
    };
    const { newState, action } = applyKeypress(state, { sequence: 'l' });
    expect(action.type).toBe('rename-buffer-update');
    expect(newState.renameMode?.buffer).toBe('Hell');
  });

  test('rename mode active: backspace trims buffer', () => {
    const state: MenuState = {
      ...baseState,
      renameMode: { ulid: '01B', buffer: 'Hello' },
    };
    const { newState, action } = applyKeypress(state, { name: 'backspace' });
    expect(action.type).toBe('rename-buffer-update');
    expect(newState.renameMode?.buffer).toBe('Hell');
  });

  test('rename mode active: buffer caps at 32 chars', () => {
    const longBuffer = 'a'.repeat(32);
    const state: MenuState = {
      ...baseState,
      renameMode: { ulid: '01B', buffer: longBuffer },
    };
    const { newState } = applyKeypress(state, { sequence: 'b' });
    expect(newState.renameMode?.buffer.length).toBe(32);
    expect(newState.renameMode?.buffer).toBe(longBuffer);
  });

  test('rename mode active: existing switch cases (n, q, x) do NOT fire', () => {
    const state: MenuState = {
      ...baseState,
      renameMode: { ulid: '01B', buffer: 'Test' },
    };
    const nResult = applyKeypress(state, { name: 'n', sequence: 'n' });
    expect(nResult.action.type).toBe('rename-buffer-update');
    expect(nResult.newState.renameMode?.buffer).toBe('Testn');

    const xResult = applyKeypress(state, { name: 'x', sequence: 'x' });
    expect(xResult.action.type).toBe('rename-buffer-update');
  });

  test('rename mode active: non-printable, non-special keys are noop', () => {
    const state: MenuState = {
      ...baseState,
      renameMode: { ulid: '01B', buffer: 'Test' },
    };
    const { action } = applyKeypress(state, { name: 'up' });
    expect(action.type).toBe('noop');
  });
});

describe('Diamond Q — formatSessionRow displayName substitution', () => {
  test('with displayName set → renders displayName padded to 16', () => {
    const entry: RegistryEntry = mkSession('01TEST', 'uuid-XYZ');
    entry.displayName = 'MySession';
    const row = formatSessionRow(
      { kind: 'session', entry, state: deriveSessionState(entry) },
      false,
      120,
    );
    expect(row).toContain('MySession');
    expect(row).not.toContain('uuid-XYZ');
  });

  test('without displayName → falls back to claudeSessionId-short', () => {
    const entry = mkSession('01TEST', 'uuid-ABCDEFG');
    const row = formatSessionRow(
      { kind: 'session', entry, state: deriveSessionState(entry) },
      false,
      120,
    );
    expect(row).toContain('uuid-ABC');
  });

  test('long displayName truncated via truncateMiddle to 16 chars', () => {
    const entry = mkSession('01TEST', 'uuid-XYZ');
    entry.displayName = 'A'.repeat(30);
    const row = formatSessionRow(
      { kind: 'session', entry, state: deriveSessionState(entry) },
      false,
      120,
    );
    expect(row).toContain('…');
  });
});

describe('Diamond Q — renderMenu footer modal', () => {
  test('with renameMode → footer shows modal text with buffer', () => {
    const state: MenuState = {
      ...baseState,
      termHeight: 30,
      renameMode: { ulid: '01B', buffer: 'TypingHere' },
    };
    const out = renderMenu(state);
    expect(out).toContain('Rename: TypingHere_');
    expect(out).toContain('Enter confirm');
    expect(out).toContain('Esc cancel');
  });

  test('without renameMode → footer shows standard hints with r rename', () => {
    const state: MenuState = { ...baseState, termHeight: 30 };
    const out = renderMenu(state);
    expect(out).toContain('r rename');
    expect(out).not.toContain('Rename: ');
  });
});

// ── Diamond R: ANSI-aware line-width discipline + synthesized ULID ───

describe('Diamond R — stripAnsiCodes', () => {
  test('strips standard SGR codes', () => {
    expect(stripAnsiCodes('\x1b[1mhello\x1b[0m')).toBe('hello');
  });
});

describe('Diamond R — visibleLength', () => {
  test('counts only visible characters, ignoring ANSI codes', () => {
    expect(visibleLength('\x1b[1mhi\x1b[0m')).toBe(2);
  });
});

describe('Diamond R — clipAndPadToWidth', () => {
  test('pads short string with spaces to width', () => {
    expect(clipAndPadToWidth('hi', 5)).toBe('hi   ');
  });

  test('clips long string to width (visible chars only)', () => {
    expect(clipAndPadToWidth('hello', 3)).toBe('hel');
  });

  test('clips ANSI-bearing string to 3 visible chars while preserving ANSI', () => {
    const out = clipAndPadToWidth('\x1b[1mhello\x1b[0m', 3);
    expect(visibleLength(out)).toBe(3);
    expect(out).toContain('\x1b[1m');
  });
});

describe('Diamond R — synthesized ULID column displays claudeSessionId', () => {
  test('synthesized row shows claudeSessionId-short, not synthesized id prefix', () => {
    const entry: RegistryEntry = {
      id: '01DISCOVERED-XXXXXXXX',
      claudeSessionId: 'f81ef5c1-3abc-4def-9876-aabbccddeeff',
      status: 'allocated',
      spawnedAt: 1714834000000,
      cwd: '/test/cwd',
      synthesizedAt: 1714834000000,
    };
    const row = formatSessionRow(
      { kind: 'session', entry, state: deriveSessionState(entry) },
      false,
      120,
    );
    expect(row).toContain('f81ef5c1-3');
    expect(row).not.toContain('01DISCOVER');
  });
});

describe('Diamond R — formatSessionRow line-width invariant at termWidth=80', () => {
  test('row visible length ≤ 80 (no wrap risk)', () => {
    const entry: RegistryEntry = {
      id: '01ABCDEFGH',
      claudeSessionId: 'uuid-XYZ',
      status: 'launched',
      spawnedAt: 1714834000000,
      cwd: '/some/long/path/SuiteCascadeSystem',
    };
    const row = formatSessionRow(
      { kind: 'session', entry, state: deriveSessionState(entry) },
      false,
      80,
    );
    expect(visibleLength(row)).toBeLessThanOrEqual(80);
  });
});

describe('Diamond R — renderMenu line-width invariant', () => {
  test('every line is exactly termWidth visible chars at termWidth=80', () => {
    const state: MenuState = { ...baseState, termWidth: 80, termHeight: 30 };
    const out = renderMenu(state);
    const lines = out.split('\n');
    for (const line of lines) {
      expect(visibleLength(line)).toBe(80);
    }
  });
});

describe('Diamond R — renderMenuLegacy line-width parity', () => {
  test('every emitted content line clipped/padded to termWidth=80', () => {
    const state: MenuState = { ...baseState, termWidth: 80, termHeight: 0 };
    const out = renderMenuLegacy(state);
    // visibleLength strips ANSI codes (incl. leading HOME+CLEAR on first line);
    // blank separator lines ('') are exempt.
    const lines = out.split('\n');
    for (const line of lines) {
      if (line === '') continue;
      expect(visibleLength(line)).toBeLessThanOrEqual(80);
    }
  });
});

// ── Diamond B-1: Cascades/ Detection + Conditional Top Menu (CD-23) ─────────

describe('Diamond B-1 — SYNTHETIC_INSTALL constant', () => {
  test('exports SYNTHETIC_INSTALL equal to "__install__"', () => {
    expect(SYNTHETIC_INSTALL).toBe('__install__');
  });
  test('SYNTHETIC_INSTALL is distinct from SYNTHETIC_NEW and SYNTHETIC_CLOSE', () => {
    expect(SYNTHETIC_INSTALL).not.toBe(SYNTHETIC_NEW);
    expect(SYNTHETIC_INSTALL).not.toBe(SYNTHETIC_CLOSE);
  });
});

describe('Diamond B-1 + α RM-Fix-1 — RESERVED_LINES_WITH_INSTALL', () => {
  // Diamond α RM-Fix-1: bumped 6 → 7 to account for the Install SCP row
  // sitting directly below Reinstall SCS-Bridge when cascadesPresent === true.
  // Diamond γ: Install SCP row always counted in RESERVED_LINES (base 6) · this constant
  // now adds 1 for the SCS-Bridge Install row when cascadesPresent !== undefined.
  test('exports RESERVED_LINES_WITH_INSTALL = RESERVED_LINES + 1 (extra Install SCS-Bridge row)', () => {
    expect(RESERVED_LINES_WITH_INSTALL).toBe(RESERVED_LINES + 1);
    expect(RESERVED_LINES_WITH_INSTALL).toBe(7);
  });
});

describe('Diamond B-1 — formatInstall helper', () => {
  test('unselected install row contains "⊕ Install SCS-Bridge" label and lacks REVERSE prefix', () => {
    const out = formatInstall(false);
    expect(out).toContain('⊕ Install SCS-Bridge');
    expect(out.startsWith('\x1b[7m')).toBe(false);
  });
  test('selected install row begins with ANSI.REVERSE prefix', () => {
    const out = formatInstall(true);
    expect(out.startsWith('\x1b[7m')).toBe(true);
    expect(out).toContain('⊕ Install SCS-Bridge');
  });
});

// Diamond B-20 (CD-63 IRULRT · Install-Reinstall-Update-Lifecycle-Row-Toggle):
// formatInstall accepts cascadesPresent to drive label discrimination.
describe('Diamond B-20 — formatInstall lifecycle label discrimination', () => {
  test('formatInstall(false) — undefined cascadesPresent → INSTALL_LABEL (backward compat)', () => {
    const out = formatInstall(false);
    expect(out).toContain('⊕ Install SCS-Bridge');
    expect(out).not.toContain('⊕ Reinstall SCS-Bridge');
  });
  test('formatInstall(false, false) — cascadesPresent === false → INSTALL_LABEL (Phase A)', () => {
    const out = formatInstall(false, false);
    expect(out).toContain('⊕ Install SCS-Bridge');
    expect(out).not.toContain('⊕ Reinstall SCS-Bridge');
  });
  test('formatInstall(false, true) — cascadesPresent === true → REINSTALL_LABEL (Phase B)', () => {
    const out = formatInstall(false, true);
    expect(out).toContain('⊕ Reinstall SCS-Bridge');
    expect(out).not.toContain('⊕ Install SCS-Bridge');
  });
  test('formatInstall(true, true) — selected Reinstall row preserves REVERSE prefix + REINSTALL_LABEL', () => {
    const out = formatInstall(true, true);
    expect(out.startsWith('\x1b[7m')).toBe(true);
    expect(out).toContain('⊕ Reinstall SCS-Bridge');
  });
});

describe('Diamond B-1 — renderMenu Install row emission', () => {
  test('cascadesPresent === false → renderMenu output contains "⊕ Install SCS-Bridge"', () => {
    const state: MenuState = {
      ...baseState,
      termHeight: 12,
      cascadesPresent: false,
      selectedUlid: SYNTHETIC_INSTALL,
    };
    const out = renderMenu(state);
    expect(out).toContain('⊕ Install SCS-Bridge');
  });
  // Diamond B-20 (CD-63 IRULRT): when cascadesPresent === true the Install row
  // remains visible but uses the REINSTALL_LABEL ('⊕ Reinstall SCS-Bridge')
  // rather than the INSTALL_LABEL — Phase B of Install/Reinstall/Update lifecycle.
  test('cascadesPresent === true → renderMenu output contains "⊕ Reinstall SCS-Bridge" (B-20 IRULRT)', () => {
    const state: MenuState = { ...baseState, termHeight: 12, cascadesPresent: true };
    const out = renderMenu(state);
    expect(out).toContain('⊕ Reinstall SCS-Bridge');
    expect(out).not.toContain('⊕ Install SCS-Bridge'); // Install label hidden in Phase B
  });
  test('cascadesPresent === undefined → strict-undefined gate keeps Install row hidden (backward compat)', () => {
    // baseState has no cascadesPresent field → undefined → row hidden.
    // Existing test fixtures throughout the suite rely on this backward-compat default.
    const out = renderMenu({ ...baseState, termHeight: 12 });
    expect(out).not.toContain('⊕ Install SCS-Bridge');
    expect(out).not.toContain('⊕ Reinstall SCS-Bridge');
  });
  test('Install present + termHeight=12 still emits exactly termHeight lines (line-count invariant)', () => {
    const state: MenuState = {
      ...baseState,
      termHeight: 12,
      cascadesPresent: false,
      selectedUlid: SYNTHETIC_INSTALL,
    };
    const out = renderMenu(state);
    expect(out.split('\n').length).toBe(12);
  });
});

describe('Diamond B-1 — renderMenuLegacy Install row parity', () => {
  test('cascadesPresent === false → renderMenuLegacy output contains Install row', () => {
    const state: MenuState = {
      ...baseState,
      termWidth: 100,
      termHeight: 0,
      cascadesPresent: false,
      selectedUlid: SYNTHETIC_INSTALL,
    };
    const out = renderMenuLegacy(state);
    expect(out).toContain('⊕ Install SCS-Bridge');
  });
  test('cascadesPresent omitted → legacy renders without Install row (fixture compat)', () => {
    const state: MenuState = { ...baseState, termWidth: 100, termHeight: 0 };
    const out = renderMenuLegacy(state);
    expect(out).not.toContain('⊕ Install SCS-Bridge');
  });
});

describe('Diamond B-1 — applyKeypress install-selected dispatch', () => {
  test('Enter on SYNTHETIC_INSTALL produces { type: "install-selected" }', () => {
    const state: MenuState = {
      ...baseState,
      cascadesPresent: false,
      selectedUlid: SYNTHETIC_INSTALL,
    };
    const { action } = applyKeypress(state, { name: 'return' });
    expect(action.type).toBe('install-selected');
  });
});

describe('Diamond B-1 — applyKeypress cursor wiring around SYNTHETIC_INSTALL', () => {
  test('cursor up from SYNTHETIC_INSTALL is a no-op (top edge silent)', () => {
    const state: MenuState = {
      ...baseState,
      cascadesPresent: false,
      selectedUlid: SYNTHETIC_INSTALL,
    };
    const { newState, action } = applyKeypress(state, { name: 'up' });
    expect(action.type).toBe('cursor-up');
    expect(newState.selectedUlid).toBe(SYNTHETIC_INSTALL);
  });
  test('cursor up from SYNTHETIC_NEW with cascadesPresent === false → SYNTHETIC_INSTALL', () => {
    const state: MenuState = {
      ...baseState,
      cascadesPresent: false,
      selectedUlid: SYNTHETIC_NEW,
    };
    const { newState, action } = applyKeypress(state, { name: 'up' });
    expect(action.type).toBe('cursor-up');
    expect(newState.selectedUlid).toBe(SYNTHETIC_INSTALL);
  });
  // Diamond B-20 (CD-63 IRULRT): with always-visible Install row, cursor up
  // from SYNTHETIC_NEW promotes to SYNTHETIC_INSTALL whenever cascadesPresent
  // is DEFINED (regardless of value). Pre-B-20 fixtures with `undefined`
  // continue to no-op (backward compat).
  test('cursor up from SYNTHETIC_NEW with cascadesPresent === true → SYNTHETIC_INSTALL (B-20 IRULRT)', () => {
    const state: MenuState = {
      ...baseState,
      cascadesPresent: true,
      selectedUlid: SYNTHETIC_NEW,
    };
    const { newState, action } = applyKeypress(state, { name: 'up' });
    expect(action.type).toBe('cursor-up');
    expect(newState.selectedUlid).toBe(SYNTHETIC_INSTALL);
  });

  // Diamond B-25-UX-fix4 (CD-111 IUNSI · empty-body up promotes to install row)
  test('B-25-UX-fix4 (CD-111 IUNSI): cursor up from SYNTHETIC_NEW with EMPTY BODY + cascadesPresent defined → SYNTHETIC_INSTALL', () => {
    const state: MenuState = {
      ...baseState,
      sessions: [], // EMPTY body — fresh-install scenario where install agent not yet visible
      cascadesPresent: false,
      selectedUlid: SYNTHETIC_NEW,
    };
    const { newState, action } = applyKeypress(state, { name: 'up' });
    expect(action.type).toBe('cursor-up');
    expect(newState.selectedUlid).toBe(SYNTHETIC_INSTALL);
  });

  test('B-25-UX-fix4 (CD-111): empty body + cascadesPresent === true → up at New Session promotes to Reinstall row', () => {
    const state: MenuState = {
      ...baseState,
      sessions: [],
      cascadesPresent: true,
      selectedUlid: SYNTHETIC_NEW,
    };
    const { newState, action } = applyKeypress(state, { name: 'up' });
    expect(action.type).toBe('cursor-up');
    expect(newState.selectedUlid).toBe(SYNTHETIC_INSTALL);
  });
  test('cursor up from SYNTHETIC_NEW with cascadesPresent === undefined → no-op (backward compat)', () => {
    const state: MenuState = {
      ...baseState,
      // cascadesPresent intentionally omitted (undefined) → pre-B-20 session-mode
      selectedUlid: SYNTHETIC_NEW,
    };
    const { newState, action } = applyKeypress(state, { name: 'up' });
    expect(action.type).toBe('cursor-up');
    expect(newState.selectedUlid).toBe(SYNTHETIC_NEW);
  });
  test('cursor down from SYNTHETIC_INSTALL → SYNTHETIC_NEW', () => {
    const state: MenuState = {
      ...baseState,
      cascadesPresent: false,
      selectedUlid: SYNTHETIC_INSTALL,
    };
    const { newState, action } = applyKeypress(state, { name: 'down' });
    expect(action.type).toBe('cursor-down');
    expect(newState.selectedUlid).toBe(SYNTHETIC_NEW);
  });
});

describe('Diamond B-1 — preserveCursorAcrossUpdate guards SYNTHETIC_INSTALL', () => {
  test('SYNTHETIC_INSTALL passes through unchanged', () => {
    const result = preserveCursorAcrossUpdate(SYNTHETIC_INSTALL, [mkSession('01A', 'uuid-A')]);
    expect(result).toBe(SYNTHETIC_INSTALL);
  });
});

// ── Diamond B-8 Fix 3+4: trust-confer modal (HWMTUC-SURFACE + HWMTUC) ─────────

describe('Diamond B-8 — applyKeypress trustConfer modal', () => {
  const trustState: MenuState = {
    ...baseState,
    trustConfer: {
      paths: ['/cwd/Cascades/  (directory + scaffold content)', '/cwd/.claude/CLAUDE.md'],
      optionalPaths: [],
      ulid: 'pending',
      selected: 'approve' as const,
    },
  };

  test('Y key produces trust-confer-confirm action', () => {
    const { action } = applyKeypress(trustState, { sequence: 'y' });
    expect(action.type).toBe('trust-confer-confirm');
  });

  // Diamond B-22 (CD-72 TCANC): Enter now activates selected button (not direct confirm).
  // For backward-compat semantic: Enter on default 'approve' selection still confirms.
  test('Enter key produces trust-confer-activate action (B-22 TCANC)', () => {
    const { action } = applyKeypress(trustState, { name: 'return' });
    expect(action.type).toBe('trust-confer-activate');
  });

  test('N key produces trust-confer-decline action', () => {
    const { action } = applyKeypress(trustState, { sequence: 'n' });
    expect(action.type).toBe('trust-confer-decline');
  });

  test('Esc key produces trust-confer-decline action', () => {
    const { action } = applyKeypress(trustState, { name: 'escape' });
    expect(action.type).toBe('trust-confer-decline');
  });

  // Diamond B-22 (CD-72 TCANC): arrow / Tab keys produce trust-confer-toggle
  // and flip MenuState.trustConfer.selected between approve ↔ cancel.
  test('Down arrow produces trust-confer-toggle (B-22 TCANC)', () => {
    const { newState, action } = applyKeypress(trustState, { name: 'down' });
    expect(action.type).toBe('trust-confer-toggle');
    expect(newState.trustConfer?.selected).toBe('cancel');
  });

  test('Up arrow toggles back to approve from cancel (B-22 TCANC)', () => {
    const cancelState: MenuState = {
      ...trustState,
      trustConfer: { ...trustState.trustConfer!, selected: 'cancel' },
    };
    const { newState, action } = applyKeypress(cancelState, { name: 'up' });
    expect(action.type).toBe('trust-confer-toggle');
    expect(newState.trustConfer?.selected).toBe('approve');
  });

  test('Tab key toggles selected (B-22 TCANC)', () => {
    const { newState, action } = applyKeypress(trustState, { name: 'tab' });
    expect(action.type).toBe('trust-confer-toggle');
    expect(newState.trustConfer?.selected).toBe('cancel');
  });

  test('Space key produces trust-confer-activate (B-22 TCANC)', () => {
    const { action } = applyKeypress(trustState, { sequence: ' ' });
    expect(action.type).toBe('trust-confer-activate');
  });
});

// Diamond B-22 (CD-71 PTCHR + CD-76 PMSH): renderTrustConferPane selected-state
// visualization. Active button gets ▶ + REVERSE; inactive gets dim Pewter.
describe('Diamond B-22 — renderTrustConferPane selected-state highlighting', () => {
  const baseTrustState: MenuState = {
    ...baseState,
    termHeight: 30,
    trustConfer: {
      paths: ['/cwd/Cascades/  (directory + scaffold content)', '/cwd/.claude/CLAUDE.md'],
      optionalPaths: [],
      ulid: 'pending',
      selected: 'approve' as const,
    },
  };

  test('approve selected → ▶ on [Y] · dim [N]', () => {
    const out = renderMenu(baseTrustState);
    expect(out).toContain('[Y] Approve & Install');
    expect(out).toContain('[N] Cancel');
    // ▶ glyph appears once (on the active Approve button)
    expect((out.match(/▶/g) || []).length).toBe(1);
  });

  test('cancel selected → ▶ on [N] · dim [Y]', () => {
    const cancelState: MenuState = {
      ...baseTrustState,
      trustConfer: { ...baseTrustState.trustConfer!, selected: 'cancel' },
    };
    const out = renderMenu(cancelState);
    expect(out).toContain('[Y] Approve & Install');
    expect(out).toContain('[N] Cancel');
    expect((out.match(/▶/g) || []).length).toBe(1);
  });

  test('Reinstall context (cascadesPresent === true) updates verb in title and header', () => {
    const reinstallState: MenuState = {
      ...baseTrustState,
      cascadesPresent: true,
    };
    const out = renderMenu(reinstallState);
    expect(out).toContain('Reinstall SCS-Bridge');
    expect(out).toContain('SCS Reinstall'); // title verb
  });

  test('footer hint advertises arrow-key navigation (B-22 CD-72)', () => {
    const out = renderMenu(baseTrustState);
    expect(out).toContain('select');
    expect(out).toContain('activate');
  });
});

describe('Diamond B-8 — renderMenu trust-confer override', () => {
  test('trustConfer defined → output contains "Permission Confirmation" header', () => {
    const state: MenuState = {
      ...baseState,
      termHeight: 24,
      trustConfer: {
        paths: ['/cwd/Cascades/  (directory + scaffold content)'],
        optionalPaths: [],
        ulid: 'pending',
        selected: 'approve' as const,
      },
    };
    const out = renderMenu(state);
    expect(out).toContain('Permission Confirmation');
  });

  test('trustConfer defined → output contains numbered path list', () => {
    const state: MenuState = {
      ...baseState,
      termHeight: 24,
      trustConfer: {
        paths: ['/cwd/Cascades/', '/cwd/.claude/CLAUDE.md'],
        optionalPaths: [],
        ulid: 'pending',
        selected: 'approve' as const,
      },
    };
    const out = renderMenu(state);
    expect(out).toContain('1.');
    expect(out).toContain('2.');
    expect(out).toContain('/Cascades/');
    expect(out).toContain('CLAUDE.md');
  });

  test('trustConfer defined → output contains [Y] Approve and [N] Cancel buttons', () => {
    const state: MenuState = {
      ...baseState,
      termHeight: 24,
      trustConfer: {
        paths: ['/cwd/Cascades/'],
        optionalPaths: [],
        ulid: 'pending',
        selected: 'approve' as const,
      },
    };
    const out = renderMenu(state);
    expect(out).toContain('[Y] Approve');
    expect(out).toContain('[N] Cancel');
  });

  test('trustConfer undefined → renderMenu falls through to standard render (regression)', () => {
    const state: MenuState = { ...baseState, termHeight: 30 };
    const out = renderMenu(state);
    expect(out).not.toContain('Permission Confirmation');
    expect(out).toContain('Page');
  });
});

// =============================================================================
// Diamond B-26-PEWTER (CD-123 UMHV · CD-124 PUCM · CD-125 SDDA · CD-126 BUCS):
// Uninstall hotkey 'u' + Pewter HiFi confirmation modal · destructive-default-N
// =============================================================================

describe("B-26-PEWTER (CD-123 UMHV · 'u' hotkey)", () => {
  test("'u' key with cascadesPresent=true opens uninstall-confirm modal", () => {
    const state: MenuState = { ...baseState, cascadesPresent: true };
    const { newState, action } = applyKeypress(state, { sequence: 'u' });
    expect(action.type).toBe('uninstall-selected');
    expect(newState.uninstallConfirm).toBeDefined();
    // CD-125 SDDA: destructive-default-N · initial selected MUST be 'cancel'
    expect(newState.uninstallConfirm?.selected).toBe('cancel');
  });

  test("'U' (uppercase) key also opens modal (case-insensitive)", () => {
    const state: MenuState = { ...baseState, cascadesPresent: true };
    const { newState } = applyKeypress(state, { sequence: 'U' });
    expect(newState.uninstallConfirm).toBeDefined();
  });

  test("'u' key with cascadesPresent=false is no-op (nothing to uninstall)", () => {
    const state: MenuState = { ...baseState, cascadesPresent: false };
    const { newState, action } = applyKeypress(state, { sequence: 'u' });
    expect(action.type).toBe('noop');
    expect(newState.uninstallConfirm).toBeUndefined();
  });

  test("'u' key with cascadesPresent=undefined is no-op", () => {
    const state: MenuState = { ...baseState, cascadesPresent: undefined };
    const { newState, action } = applyKeypress(state, { sequence: 'u' });
    expect(action.type).toBe('noop');
    expect(newState.uninstallConfirm).toBeUndefined();
  });
});

describe('B-26-PEWTER (CD-124 PUCM · uninstall-confirm modal navigation)', () => {
  const uninstallState: MenuState = {
    ...baseState,
    cascadesPresent: true,
    uninstallConfirm: { selected: 'cancel' as const },
  };

  test('Y key produces uninstall-confirm action', () => {
    const { action } = applyKeypress(uninstallState, { sequence: 'y' });
    expect(action.type).toBe('uninstall-confirm');
  });

  test("'Y' (uppercase) also produces uninstall-confirm", () => {
    const { action } = applyKeypress(uninstallState, { sequence: 'Y' });
    expect(action.type).toBe('uninstall-confirm');
  });

  test('N key produces uninstall-cancel action', () => {
    const { action } = applyKeypress(uninstallState, { sequence: 'n' });
    expect(action.type).toBe('uninstall-cancel');
  });

  test('Esc produces uninstall-cancel', () => {
    const { action } = applyKeypress(uninstallState, { name: 'escape' });
    expect(action.type).toBe('uninstall-cancel');
  });

  test('Down arrow toggles selected cancel → approve', () => {
    const { newState, action } = applyKeypress(uninstallState, { name: 'down' });
    expect(action.type).toBe('uninstall-confirm-toggle');
    expect(newState.uninstallConfirm?.selected).toBe('approve');
  });

  test('Up arrow toggles selected approve → cancel', () => {
    const approveState: MenuState = {
      ...uninstallState,
      uninstallConfirm: { selected: 'approve' as const },
    };
    const { newState, action } = applyKeypress(approveState, { name: 'up' });
    expect(action.type).toBe('uninstall-confirm-toggle');
    expect(newState.uninstallConfirm?.selected).toBe('cancel');
  });

  test('Tab toggles selected', () => {
    const { newState } = applyKeypress(uninstallState, { name: 'tab' });
    expect(newState.uninstallConfirm?.selected).toBe('approve');
  });

  test('Enter on default selected=cancel produces uninstall-confirm-activate (default-N safety)', () => {
    const { action } = applyKeypress(uninstallState, { name: 'return' });
    expect(action.type).toBe('uninstall-confirm-activate');
  });

  test('Space produces uninstall-confirm-activate', () => {
    const { action } = applyKeypress(uninstallState, { sequence: ' ' });
    expect(action.type).toBe('uninstall-confirm-activate');
  });
});

describe('B-26-PEWTER (renderUninstallConfirmPane Pewter HiFi v3)', () => {
  test('renderMenu dispatches to uninstall pane when uninstallConfirm defined', () => {
    const state: MenuState = {
      ...baseState,
      termHeight: 24,
      cascadesPresent: true,
      uninstallConfirm: { selected: 'cancel' as const },
    };
    const out = renderMenu(state);
    expect(out).toContain('Uninstall SCS Bridge');
    expect(out).toContain('[Y] Yes, uninstall');
    expect(out).toContain('[N] No, cancel');
    // Should NOT contain trust-confer-specific content
    expect(out).not.toContain('Permission Confirmation');
  });

  test('default cursor (selected=cancel · CD-125 SDDA) shows ▶ on [N] button', () => {
    const state: MenuState = {
      ...baseState,
      termHeight: 24,
      cascadesPresent: true,
      uninstallConfirm: { selected: 'cancel' as const },
    };
    const out = renderMenu(state);
    // Exactly ONE ▶ glyph on the active row
    expect((out.match(/▶/g) || []).length).toBe(1);
    // Verify the ▶ is associated with the [N] button (cursor on cancel)
    // by checking it appears before [N] in the body somewhere
    const nIdx = out.indexOf('[N] No, cancel');
    const upToN = out.slice(0, nIdx);
    expect(upToN.lastIndexOf('▶')).toBeGreaterThan(-1);
  });

  test('renders PRESERVED list (CD-127 RDDU + CD-120 PFND · user-data dirs + Iced)', () => {
    const state: MenuState = {
      ...baseState,
      termHeight: 24,
      cascadesPresent: true,
      uninstallConfirm: { selected: 'cancel' as const },
    };
    const out = renderMenu(state);
    expect(out).toContain('PRESERVED');
    // CD-127 RDDU · user-data dirs retained
    expect(out).toContain('Cascades/8_SUITES/');
    expect(out).toContain('Cascades/Working/');
    expect(out).toContain('Cascades/Documentation/');
    // CD-114 IPRM · Iced preserved
    expect(out).toContain('Cascades/Iced/');
  });

  test('renders removal list (CD-127 RDDU · only Bridge/ removed)', () => {
    const state: MenuState = {
      ...baseState,
      termHeight: 24,
      cascadesPresent: true,
      uninstallConfirm: { selected: 'cancel' as const },
    };
    const out = renderMenu(state);
    expect(out).toContain('Restore .claude/CLAUDE.md');
    expect(out).toContain('Remove .claude/agents/scs-*.md');
    expect(out).toContain('Remove Cascades/Bridge/');
    // CD-127 RDDU: user-data dirs NO LONGER in removal list
    expect(out).not.toContain('Remove Cascades/{8_SUITES');
  });
});

describe('B-26-PEWTER (footer hint · u uninstall conditional advertisement)', () => {
  test('cascadesPresent=true → footer includes "u uninstall"', () => {
    const state: MenuState = { ...baseState, termHeight: 30, cascadesPresent: true };
    const out = renderMenu(state);
    expect(out).toContain('u uninstall');
  });

  test('cascadesPresent=false → footer does NOT include "u uninstall"', () => {
    const state: MenuState = { ...baseState, termHeight: 30, cascadesPresent: false };
    const out = renderMenu(state);
    expect(out).not.toContain('u uninstall');
  });

  test('cascadesPresent=undefined → footer does NOT include "u uninstall"', () => {
    const state: MenuState = { ...baseState, termHeight: 30, cascadesPresent: undefined };
    const out = renderMenu(state);
    expect(out).not.toContain('u uninstall');
  });
});

// ── SS-P2 · SCFC (SCP-Context-Filter-Chip) ─────────────────────────────────
//
// R6 calibration: filter SET only at scp-menu-activate on a real SCP row
// (Enter-press) · filter CLEAR on close-scp-menu (Esc) and scp-menu-activate
// Install Another. R3 filter-on-navigate model REJECTED.

const mkScpEntry = (
  name: string,
): import('../scp/scpPersistence').ScpRegistryEntry => ({
  name,
  conceptName: name.charAt(0).toLowerCase() + name.slice(1),
  path: `/test/scps/${name}/SCP`,
  templateVersion: '0.1.0',
  installedAt: '2026-05-13T00:00:00.000Z',
  status: 'installed',
  managingInstancePid: null,
  boundBridgePort: null,
  sessions: [],
});

const mkSessionWithScp = (
  id: string,
  claudeSessionId: string,
  scpName: string | undefined,
  status: 'allocated' | 'launched' | 'archived' | 'offline' = 'launched',
  spawnedAt = 1714834000000,
): RegistryEntry => ({
  id,
  claudeSessionId,
  status,
  spawnedAt,
  cwd: '/test/cwd',
  ...(scpName !== undefined ? { scpName } : {}),
});

describe('SS-P2 · SCFC chip + activeScpFilter', () => {
  test('SCFC chip renders when activeScpFilter set with matching sessions', () => {
    const state: MenuState = {
      ...baseState,
      sessions: [
        mkSessionWithScp('01A', 'uuid-A', 'MyProj'),
        mkSessionWithScp('01B', 'uuid-B', 'MyProj'),
        mkSessionWithScp('01C', 'uuid-C', 'Other'),
      ],
      selectedUlid: '01A',
      activeScpFilter: 'MyProj',
    };
    const out = renderMenu(state);
    expect(out).toContain('Sessions for SCP: MyProj');
    expect(out).toContain('(2 active)');
  });

  test('SCFC chip absent when activeScpFilter undefined', () => {
    const state: MenuState = {
      ...baseState,
      sessions: [mkSessionWithScp('01A', 'uuid-A', 'MyProj')],
      selectedUlid: '01A',
    };
    const out = renderMenu(state);
    expect(out).not.toContain('Sessions for SCP:');
  });

  test('SCFC chip count excludes offline + archived sessions', () => {
    const state: MenuState = {
      ...baseState,
      sessions: [
        mkSessionWithScp('01A', 'uuid-A', 'MyProj', 'launched'),
        mkSessionWithScp('01B', 'uuid-B', 'MyProj', 'offline'),
        mkSessionWithScp('01C', 'uuid-C', 'MyProj', 'archived'),
      ],
      selectedUlid: '01A',
      activeScpFilter: 'MyProj',
    };
    const out = renderMenu(state);
    expect(out).toContain('Sessions for SCP: MyProj');
    expect(out).toContain('(1 active)');
  });

  test('session rows filtered when activeScpFilter set — only matching scpName rendered', () => {
    const state: MenuState = {
      ...baseState,
      sessions: [
        mkSessionWithScp('01A', 'uuid-alpha', 'MyProj'),
        mkSessionWithScp('01B', 'uuid-beta', 'Other'),
        mkSessionWithScp('01C', 'uuid-gamma', 'MyProj'),
      ],
      selectedUlid: '01A',
      activeScpFilter: 'MyProj',
    };
    const out = renderMenu(state);
    expect(out).toContain('uuid-alpha'.slice(0, 8));
    expect(out).toContain('uuid-gamma'.slice(0, 8));
    expect(out).not.toContain('uuid-beta'.slice(0, 8));
  });

  test('empty result placeholder renders when filter active + zero matches', () => {
    const state: MenuState = {
      ...baseState,
      sessions: [
        mkSessionWithScp('01A', 'uuid-A', 'Other'),
        mkSessionWithScp('01B', 'uuid-B', undefined),
      ],
      selectedUlid: SYNTHETIC_NEW,
      activeScpFilter: 'GhostScp',
    };
    const out = renderMenu(state);
    expect(out).toContain('no sessions for GhostScp');
    expect(out).toContain('start one with [N]');
    expect(out).toContain('(0 active)');
  });

  test('applyKeypress scp-menu-activate on real SCP row sets activeScpFilter + closes sub-menu', () => {
    const state: MenuState = {
      ...baseState,
      scpSubMenu: {
        items: [mkScpEntry('Alpha'), mkScpEntry('Beta')],
        selectedIdx: 1,
      },
    };
    const { newState, action } = applyKeypress(state, { name: 'return' });
    expect(action).toEqual({ type: 'scp-menu-activate' });
    expect(newState.activeScpFilter).toBe('Beta');
    expect(newState.scpSubMenu).toBeUndefined();
  });

  test('applyKeypress scp-menu-activate on Install Another row clears activeScpFilter', () => {
    const state: MenuState = {
      ...baseState,
      activeScpFilter: 'StaleFromPrior',
      scpSubMenu: {
        items: [mkScpEntry('Alpha')],
        selectedIdx: 1, // items.length === Install Another sentinel
      },
    };
    const { newState, action } = applyKeypress(state, { name: 'return' });
    expect(action).toEqual({ type: 'scp-menu-activate' });
    expect(newState.activeScpFilter).toBeUndefined();
  });

  test('applyKeypress close-scp-menu (Esc) clears activeScpFilter', () => {
    const state: MenuState = {
      ...baseState,
      activeScpFilter: 'MyProj',
      scpSubMenu: {
        items: [mkScpEntry('MyProj')],
        selectedIdx: 0,
      },
    };
    const { newState, action } = applyKeypress(state, { name: 'escape' });
    expect(action).toEqual({ type: 'close-scp-menu' });
    expect(newState.activeScpFilter).toBeUndefined();
  });
});

// ── SS-A1-D1 · sessionCountByScp pipeline integration (SQAR + ASSP) ──────────
//
// Muxistration-proof test coverage for the SB-Final M17 plan() subscription
// pipeline (already wired in commit 04d65a0): spawnsByScp →
// latestSessionCountSnapshot → MenuState.scpSubMenu.sessionCountByScp →
// renderScpSubMenuPane row → renderScpLifecycleBadge `live (N):PORT` format.
// Test-only sub-Diamond per R6 calibration · zero source changes.
//
// Asserts use `.includes(...)` against rendered output (NOT exact equality)
// to absorb badge padEnd(14) padding variations · references existing pattern
// in scpLifecycleBadge.test.ts:51 ("renders live state with session-count
// sub-marker when sessionCount>0").

type ScpLifecycleStateValue = import('./concepts/scpLifecycle/scpLifecycle.type').ScpLifecycleStateValue;

const mkLifecycleMap = (
  ...entries: Array<[string, ScpLifecycleStateValue]>
): Map<string, ScpLifecycleStateValue> => new Map<string, ScpLifecycleStateValue>(entries);

describe('SS-A1-D1 · sessionCountByScp pipeline integration (SQAR + ASSP)', () => {
  test('row badge surfaces (N) sub-marker when sessionCount > 0 (SQAR Muxistration-proof)', () => {
    const state: MenuState = {
      ...baseState,
      scpSubMenu: {
        items: [mkScpEntry('Alpha')],
        selectedIdx: 0,
        lifecycleByScp: mkLifecycleMap(['Alpha', 'live']),
        sessionCountByScp: new Map([['Alpha', 2]]),
        portByScp: new Map([['Alpha', 7111]]),
      },
    };
    const out = renderScpSubMenuPane(state);
    expect(out).toContain('Alpha');
    expect(out).toContain('live (2)');
    expect(out).toContain(':7111');
  });

  test('row badge omits (N) sub-marker when sessionCountByScp Map is empty', () => {
    const state: MenuState = {
      ...baseState,
      scpSubMenu: {
        items: [mkScpEntry('Alpha')],
        selectedIdx: 0,
        lifecycleByScp: mkLifecycleMap(['Alpha', 'live']),
        sessionCountByScp: new Map(),
        portByScp: new Map([['Alpha', 7111]]),
      },
    };
    const out = renderScpSubMenuPane(state);
    expect(out).toContain('Alpha');
    expect(out).toContain('live:7111');
    expect(out).not.toMatch(/live\s+\(\d+\)/);
  });

  test('row badge omits (N) sub-marker when sessionCountByScp slot is undefined (pre-tick graceful)', () => {
    const state: MenuState = {
      ...baseState,
      scpSubMenu: {
        items: [mkScpEntry('Alpha')],
        selectedIdx: 0,
        lifecycleByScp: mkLifecycleMap(['Alpha', 'live']),
        portByScp: new Map([['Alpha', 7111]]),
      },
    };
    const out = renderScpSubMenuPane(state);
    expect(out).toContain('Alpha');
    expect(out).toContain('live:7111');
    expect(out).not.toMatch(/live\s+\(\d+\)/);
  });

  test('multi-row independence: each SCP row reflects its own sessionCount (no cross-talk)', () => {
    const state: MenuState = {
      ...baseState,
      scpSubMenu: {
        items: [mkScpEntry('Alpha'), mkScpEntry('Beta'), mkScpEntry('Gamma')],
        selectedIdx: 0,
        lifecycleByScp: mkLifecycleMap(
          ['Alpha', 'live'],
          ['Beta', 'live'],
          ['Gamma', 'live'],
        ),
        sessionCountByScp: new Map([
          ['Alpha', 1],
          ['Beta', 3],
          ['Gamma', 7],
        ]),
        portByScp: new Map([
          ['Alpha', 7111],
          ['Beta', 7222],
          ['Gamma', 7333],
        ]),
      },
    };
    const out = renderScpSubMenuPane(state);
    expect(out).toContain('Alpha');
    expect(out).toContain('Beta');
    expect(out).toContain('Gamma');
    expect(out).toContain('live (1)');
    expect(out).toContain('live (3)');
    expect(out).toContain('live (7)');
  });

  test('multi-digit sessionCount (10+) renders gracefully via padEnd(14)', () => {
    const state: MenuState = {
      ...baseState,
      scpSubMenu: {
        items: [mkScpEntry('Alpha')],
        selectedIdx: 0,
        lifecycleByScp: mkLifecycleMap(['Alpha', 'live']),
        sessionCountByScp: new Map([['Alpha', 12]]),
        portByScp: new Map([['Alpha', 7111]]),
      },
    };
    const out = renderScpSubMenuPane(state);
    expect(out).toContain('Alpha');
    expect(out).toContain('live (12)');
  });

  test('sessionCountByScp present but scpName key missing renders without (N) (graceful .get() fallback)', () => {
    const state: MenuState = {
      ...baseState,
      scpSubMenu: {
        items: [mkScpEntry('Alpha')],
        selectedIdx: 0,
        lifecycleByScp: mkLifecycleMap(['Alpha', 'live']),
        sessionCountByScp: new Map([['Beta', 5]]),
        portByScp: new Map([['Alpha', 7111]]),
      },
    };
    const out = renderScpSubMenuPane(state);
    expect(out).toContain('Alpha');
    expect(out).toContain('live:7111');
    expect(out).not.toMatch(/live\s+\(\d+\)/);
  });

  test('Install Another row is unaffected by sessionCountByScp content', () => {
    const state: MenuState = {
      ...baseState,
      scpSubMenu: {
        items: [mkScpEntry('Alpha')],
        selectedIdx: 1, // Install Another sentinel selected
        lifecycleByScp: mkLifecycleMap(['Alpha', 'live']),
        sessionCountByScp: new Map([['Alpha', 5]]),
        portByScp: new Map([['Alpha', 7111]]),
      },
    };
    const out = renderScpSubMenuPane(state);
    expect(out).toContain('Install Another SCP');
    expect(out).toContain('live (5)');
    // The (5) marker MUST belong to the Alpha row, not the Install row.
    // Verified structurally: Install Another text appears AFTER the Alpha row
    // which carries the (5) marker.
    const installIdx = out.indexOf('Install Another SCP');
    const fiveMarkerIdx = out.indexOf('(5)');
    expect(installIdx).toBeGreaterThan(fiveMarkerIdx);
  });
});

// ── SS-A1-D2 · interactiveSessionsByScp PPHB count integration ────────────────
//
// Per R4 authoritative · Option D: badge format `live (N):PORT` UNCHANGED ·
// the source of N switches from spawnsByScp-derived sessionCountByScp to the
// heartbeat-verified interactiveSessionsByScp filtered through the 90s
// staleness window. When the PPHB Map is absent or yields zero, falls back to
// the SB-Final sessionCountByScp source so existing UX is preserved.

describe('SS-A1-D2 · interactiveSessionsByScp PPHB render integration', () => {
  test('PPHB count > 0 supersedes sessionCountByScp · badge uses interactive count', () => {
    const now = Date.now();
    const state: MenuState = {
      ...baseState,
      scpSubMenu: {
        items: [mkScpEntry('Alpha')],
        selectedIdx: 0,
        lifecycleByScp: mkLifecycleMap(['Alpha', 'live']),
        sessionCountByScp: new Map([['Alpha', 5]]),
        portByScp: new Map([['Alpha', 7111]]),
        interactiveSessionsByScp: new Map([
          ['Alpha', new Map([
            ['sessionA', now - 1_000],
            ['sessionB', now - 5_000],
          ])],
        ]),
      },
    };
    const out = renderScpSubMenuPane(state);
    expect(out).toContain('Alpha');
    expect(out).toContain('live (2)'); // PPHB count (2 fresh) supersedes fallback (5)
  });

  test('PPHB Map absent · falls back to sessionCountByScp', () => {
    const state: MenuState = {
      ...baseState,
      scpSubMenu: {
        items: [mkScpEntry('Alpha')],
        selectedIdx: 0,
        lifecycleByScp: mkLifecycleMap(['Alpha', 'live']),
        sessionCountByScp: new Map([['Alpha', 3]]),
        portByScp: new Map([['Alpha', 7111]]),
        // interactiveSessionsByScp intentionally undefined (pre-tick cold start)
      },
    };
    const out = renderScpSubMenuPane(state);
    expect(out).toContain('live (3)');
  });

  test('All PPHB entries stale (>90s) · filter returns 0 · falls back to sessionCountByScp', () => {
    const now = Date.now();
    const state: MenuState = {
      ...baseState,
      scpSubMenu: {
        items: [mkScpEntry('Alpha')],
        selectedIdx: 0,
        lifecycleByScp: mkLifecycleMap(['Alpha', 'live']),
        sessionCountByScp: new Map([['Alpha', 4]]),
        portByScp: new Map([['Alpha', 7111]]),
        interactiveSessionsByScp: new Map([
          ['Alpha', new Map([
            ['sessionA', now - 95_000], // stale
            ['sessionB', now - 120_000], // stale
          ])],
        ]),
      },
    };
    const out = renderScpSubMenuPane(state);
    // PPHB filter yields 0 · fallback to sessionCountByScp (4)
    expect(out).toContain('live (4)');
  });

  test('Multi-SCP row independence · each row uses its own PPHB count', () => {
    const now = Date.now();
    const state: MenuState = {
      ...baseState,
      scpSubMenu: {
        items: [mkScpEntry('Alpha'), mkScpEntry('Beta')],
        selectedIdx: 0,
        lifecycleByScp: mkLifecycleMap(['Alpha', 'live'], ['Beta', 'live']),
        sessionCountByScp: new Map([
          ['Alpha', 99],
          ['Beta', 99],
        ]),
        portByScp: new Map([
          ['Alpha', 7111],
          ['Beta', 7222],
        ]),
        interactiveSessionsByScp: new Map<string, Map<string, number>>([
          ['Alpha', new Map([['sA', now - 2_000]])],
          ['Beta', new Map([
            ['sB1', now - 3_000],
            ['sB2', now - 4_000],
            ['sB3', now - 5_000],
          ])],
        ]),
      },
    };
    const out = renderScpSubMenuPane(state);
    expect(out).toContain('live (1)'); // Alpha PPHB count
    expect(out).toContain('live (3)'); // Beta PPHB count
    expect(out).not.toContain('(99)'); // sessionCountByScp fallback overridden
  });
});
