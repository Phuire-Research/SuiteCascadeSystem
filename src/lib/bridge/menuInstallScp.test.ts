/**
 * menu.ts Install SCP additions — RM-D2 tests
 *
 * Covers the new scpWizard modal early-return + 'i' hotkey + formatInstallScp
 * + SYNTHETIC_INSTALL_SCP integration.
 */
import {
  applyKeypress,
  formatInstallScp,
  installScpLabel,
  renderMenu,
  renderMenuLegacy,
  renderScpWizardPane,
  rowId,
  SYNTHETIC_INSTALL_SCP,
  SYNTHETIC_INSTALL,
  SYNTHETIC_NEW,
  INSTALL_SCP_LABEL_FIRST,
  INSTALL_SCP_LABEL_NEXT,
  type MenuState,
  type MenuRow,
} from './menu';
import { createInitialWizardState, deriveNamesFromDesignation } from '../scp/installScpPrompts';

function makeState(overrides: Partial<MenuState> = {}): MenuState {
  return {
    sessions: [],
    selectedUlid: null,
    termWidth: 80,
    termHeight: 24,
    lastRenderedAt: 0,
    spawnInFlight: false,
    cascadesPresent: true,
    ...overrides,
  };
}

describe('menu.ts RM-D2 Install SCP additions', () => {
  describe('installScpLabel', () => {
    it('returns first label when no SCPs installed', () => {
      expect(installScpLabel(false)).toBe(INSTALL_SCP_LABEL_FIRST);
    });
    it('returns next label when SCPs already installed', () => {
      expect(installScpLabel(true)).toBe(INSTALL_SCP_LABEL_NEXT);
    });
  });

  describe('formatInstallScp', () => {
    it('renders non-selected row', () => {
      const out = formatInstallScp(false, false);
      expect(out).toContain(INSTALL_SCP_LABEL_FIRST);
    });
    it('renders selected row with prefix arrow', () => {
      const out = formatInstallScp(true, false);
      expect(out).toContain('→');
    });
    it('switches label based on anyScpsInstalled flag', () => {
      const first = formatInstallScp(false, false);
      const next = formatInstallScp(false, true);
      expect(first).toContain(INSTALL_SCP_LABEL_FIRST);
      expect(next).toContain(INSTALL_SCP_LABEL_NEXT);
    });
  });

  describe('rowId · synthetic-install-scp', () => {
    it('returns SYNTHETIC_INSTALL_SCP for the new variant', () => {
      const row: MenuRow = { kind: 'synthetic-install-scp' };
      expect(rowId(row)).toBe(SYNTHETIC_INSTALL_SCP);
    });
  });

  describe("'i' hotkey", () => {
    it('emits install-scp-selected when cascadesPresent === true', () => {
      const state = makeState({ cascadesPresent: true });
      const { action } = applyKeypress(state, { sequence: 'i' });
      expect(action.type).toBe('install-scp-selected');
    });
    it('uppercase I also triggers', () => {
      const state = makeState({ cascadesPresent: true });
      const { action } = applyKeypress(state, { sequence: 'I' });
      expect(action.type).toBe('install-scp-selected');
    });
    // Diamond γ: 'i' hotkey ALWAYS opens wizard regardless of cascadesPresent.
    // Install pipeline creates Cascades/ via mkdirSync recursive · no precondition.
    it('fires install-scp-selected regardless of cascadesPresent (γ unconditional)', () => {
      const state = makeState({ cascadesPresent: false });
      const { action } = applyKeypress(state, { sequence: 'i' });
      expect(action.type).toBe('install-scp-selected');
    });
  });

  describe('scpWizard modal early-return', () => {
    const wizardState = (): MenuState =>
      makeState({
        scpWizard: { state: createInitialWizardState(), inputBuffer: '' },
      });

    it('Esc emits install-scp-cancel', () => {
      const { action } = applyKeypress(wizardState(), { name: 'escape' });
      expect(action.type).toBe('install-scp-cancel');
    });

    it('Enter emits install-scp-wizard-submit', () => {
      const { action } = applyKeypress(wizardState(), { name: 'return' });
      expect(action.type).toBe('install-scp-wizard-submit');
    });

    it('printable char appends to inputBuffer', () => {
      const start = wizardState();
      const { newState, action } = applyKeypress(start, { sequence: 'M' });
      if (action.type !== 'install-scp-wizard-buffer-update') throw new Error('wrong action');
      expect(action.buffer).toBe('M');
      expect(newState.scpWizard?.inputBuffer).toBe('M');
    });

    it('backspace trims inputBuffer', () => {
      let state = wizardState();
      ['M', 'y'].forEach((c) => {
        state = applyKeypress(state, { sequence: c }).newState;
      });
      expect(state.scpWizard?.inputBuffer).toBe('My');
      const { newState } = applyKeypress(state, { name: 'backspace' });
      expect(newState.scpWizard?.inputBuffer).toBe('M');
    });

    it('buffer caps at 32 chars', () => {
      let state = wizardState();
      for (let i = 0; i < 40; i++) {
        state = applyKeypress(state, { sequence: 'a' }).newState;
      }
      expect(state.scpWizard?.inputBuffer.length).toBe(32);
    });

    it('non-printable keys are noop within wizard', () => {
      const { action } = applyKeypress(wizardState(), { name: 'tab' });
      expect(action.type).toBe('noop');
    });

    it('hotkeys (i, u, n, etc.) do NOT fire while wizard active', () => {
      // Wizard branch catches printable chars BEFORE the hotkey switch
      const { action } = applyKeypress(wizardState(), { sequence: 'i' });
      expect(action.type).toBe('install-scp-wizard-buffer-update');
    });

    it('Ctrl+C still triggers close (highest-priority hotkey)', () => {
      const { action } = applyKeypress(wizardState(), { ctrl: true, name: 'c' });
      expect(action.type).toBe('close');
    });
  });

  // SCP-3 · Defect A CSPMSR · post-install 'i' hotkey routes through anyScpsInstalled
  describe('SCP-3 Defect A · post-install routing', () => {
    it("post-install 'i' hotkey routes to open-scp-menu when anyScpsInstalled=true", () => {
      const state = makeState({ anyScpsInstalled: true });
      const { action } = applyKeypress(state, { sequence: 'i' });
      expect(action.type).toBe('open-scp-menu');
    });

    it("pre-install 'i' hotkey still routes to install-scp-selected when anyScpsInstalled=false", () => {
      const state = makeState({ anyScpsInstalled: false });
      const { action } = applyKeypress(state, { sequence: 'i' });
      expect(action.type).toBe('install-scp-selected');
    });

    it("uppercase 'I' post-install also routes to open-scp-menu", () => {
      const state = makeState({ anyScpsInstalled: true });
      const { action } = applyKeypress(state, { sequence: 'I' });
      expect(action.type).toBe('open-scp-menu');
    });
  });

  // SCP-3 · BSSPS · [B] Engage via SCS-Bridge at wizard done step
  describe('SCP-3 BSSPS · [B] Engage via SCS-Bridge', () => {
    const doneWizardState = (designation: string = 'TestNine'): MenuState =>
      makeState({
        scpWizard: {
          state: {
            ...createInitialWizardState(),
            step: 'done',
            designation,
            derivation: deriveNamesFromDesignation(designation),
          },
          inputBuffer: '',
        },
      });

    it("[B] at done step returns engage-via-bridge action with scpName", () => {
      const { action } = applyKeypress(doneWizardState('TestNine'), { sequence: 'b' });
      expect(action.type).toBe('engage-via-bridge');
      if (action.type !== 'engage-via-bridge') throw new Error('wrong action');
      expect(action.scpName).toBe('TestNine');
    });

    it("uppercase [B] at done step also fires engage-via-bridge", () => {
      const { action } = applyKeypress(doneWizardState('TestNine'), { sequence: 'B' });
      expect(action.type).toBe('engage-via-bridge');
    });

    it("[B] at done step clears scpWizard and sets anyScpsInstalled=true in new state", () => {
      const { newState } = applyKeypress(doneWizardState('TestNine'), { sequence: 'b' });
      expect(newState.scpWizard).toBeUndefined();
      expect(newState.anyScpsInstalled).toBe(true);
    });

    it("[B] at running step does NOT fire engage-via-bridge (buffer-update instead)", () => {
      const runningState: MenuState = makeState({
        scpWizard: {
          state: {
            ...createInitialWizardState(),
            step: 'running',
            designation: 'TestNine',
            derivation: deriveNamesFromDesignation('TestNine'),
          },
          inputBuffer: '',
        },
      });
      const { action } = applyKeypress(runningState, { sequence: 'b' });
      expect(action.type).not.toBe('engage-via-bridge');
      expect(action.type).toBe('install-scp-wizard-buffer-update');
    });

    it("[B] at done step with null derivation is no-op (falls through to buffer-update)", () => {
      const noDerivState: MenuState = makeState({
        scpWizard: {
          state: {
            ...createInitialWizardState(),
            step: 'done',
            designation: '',
            derivation: null,
          },
          inputBuffer: '',
        },
      });
      const { action } = applyKeypress(noDerivState, { sequence: 'b' });
      expect(action.type).not.toBe('engage-via-bridge');
    });

    it('renderScpWizardPane done step includes [B] Engage hint text', () => {
      const out = renderScpWizardPane(doneWizardState('TestNine'));
      expect(out).toContain('[B]');
      expect(out).toContain('Engage via SCS-Bridge');
    });
  });
});

// SCPGATE — Install-SCP row gate (WSRM) + first-run consent note (FBSN)
// Build-verifiable T1/T2/T3-render gates per the S3 Yellow blueprint §6 TSCS.
describe('SCPGATE WSRM Install-SCP row gate', () => {
  // T1 — Hidden pre/mid-SCS: row ABSENT when installationComplete === false
  describe('T1 · row hidden when installationComplete === false', () => {
    it('renderMenu omits the Install SCP row mid-install (cascadesPresent true · installationComplete false)', () => {
      const out = renderMenu(
        makeState({ cascadesPresent: true, installationComplete: false, anyScpsInstalled: false }),
      );
      expect(out).not.toContain(INSTALL_SCP_LABEL_FIRST);
    });

    it('renderMenuLegacy omits the Install SCP row mid-install', () => {
      const out = renderMenuLegacy(
        makeState({ cascadesPresent: true, installationComplete: false, anyScpsInstalled: false }),
      );
      expect(out).not.toContain(INSTALL_SCP_LABEL_FIRST);
    });

    it('renderMenu omits the Install SCP row pre-scaffold (cascadesPresent false)', () => {
      const out = renderMenu(
        makeState({ cascadesPresent: false, installationComplete: true, anyScpsInstalled: false }),
      );
      expect(out).not.toContain(INSTALL_SCP_LABEL_FIRST);
    });

    it('Up@SYNTHETIC_NEW does NOT land on SYNTHETIC_INSTALL_SCP when the row is withheld', () => {
      const state = makeState({
        cascadesPresent: true,
        installationComplete: false,
        anyScpsInstalled: false,
        selectedUlid: SYNTHETIC_NEW,
      });
      const { newState } = applyKeypress(state, { name: 'up' });
      expect(newState.selectedUlid).not.toBe(SYNTHETIC_INSTALL_SCP);
      expect(newState.selectedUlid).toBe(SYNTHETIC_INSTALL);
    });

    it('Down@SYNTHETIC_INSTALL does NOT land on SYNTHETIC_INSTALL_SCP when the row is withheld', () => {
      const state = makeState({
        cascadesPresent: true,
        installationComplete: false,
        anyScpsInstalled: false,
        selectedUlid: SYNTHETIC_INSTALL,
      });
      const { newState } = applyKeypress(state, { name: 'down' });
      expect(newState.selectedUlid).not.toBe(SYNTHETIC_INSTALL_SCP);
      expect(newState.selectedUlid).toBe(SYNTHETIC_NEW);
    });
  });

  // T2 — Appears post-SCS: row PRESENT when installationComplete true / undefined (legacy)
  describe('T2 · row present when installationComplete resolved or legacy', () => {
    it('renderMenu emits the Install SCP row when installationComplete === true', () => {
      const out = renderMenu(
        makeState({ cascadesPresent: true, installationComplete: true, anyScpsInstalled: false }),
      );
      expect(out).toContain(INSTALL_SCP_LABEL_FIRST);
    });

    it('renderMenu emits the Install SCP row when installationComplete === undefined (legacy fail-open)', () => {
      const out = renderMenu(
        makeState({ cascadesPresent: true, anyScpsInstalled: false }),
      );
      expect(out).toContain(INSTALL_SCP_LABEL_FIRST);
    });

    it('renderMenuLegacy emits the Install SCP row when installationComplete === true', () => {
      const out = renderMenuLegacy(
        makeState({ cascadesPresent: true, installationComplete: true, anyScpsInstalled: false }),
      );
      expect(out).toContain(INSTALL_SCP_LABEL_FIRST);
    });

    it('renderMenuLegacy emits the Install SCP row when installationComplete === undefined (legacy)', () => {
      const out = renderMenuLegacy(
        makeState({ cascadesPresent: true, anyScpsInstalled: false }),
      );
      expect(out).toContain(INSTALL_SCP_LABEL_FIRST);
    });

    it('Up@SYNTHETIC_NEW lands on SYNTHETIC_INSTALL_SCP when the row IS present', () => {
      const state = makeState({
        cascadesPresent: true,
        installationComplete: true,
        anyScpsInstalled: false,
        selectedUlid: SYNTHETIC_NEW,
      });
      const { newState } = applyKeypress(state, { name: 'up' });
      expect(newState.selectedUlid).toBe(SYNTHETIC_INSTALL_SCP);
    });
  });
});

describe('SCPGATE FBSN first-run consent note', () => {
  const noteWizardState = (): MenuState =>
    makeState({
      scpWizard: {
        state: { ...createInitialWizardState(), step: 'agent-install-note' },
        inputBuffer: '',
      },
    });

  // T3-render — the consent note pane renders with the expected copy
  it('renderScpWizardPane renders the consent note copy at step agent-install-note', () => {
    const out = renderScpWizardPane(noteWizardState());
    expect(out).toContain('Installation Agent');
    expect(out).toContain('backup path');
    expect(out).toContain('[Enter]');
    expect(out).toContain('[Esc]');
  });

  it('Enter on the note consumes + proceeds to the designation step and flips the flag', () => {
    const { newState, action } = applyKeypress(noteWizardState(), { name: 'return' });
    expect(action.type).toBe('scp-note-consume-proceed');
    expect(newState.scpWizard?.state.step).toBe('designation');
    expect(newState.scpInstallAgentNoteShown).toBe(true);
  });

  it('Esc on the note dismisses the wizard and flips the flag', () => {
    const { newState, action } = applyKeypress(noteWizardState(), { name: 'escape' });
    expect(action.type).toBe('scp-note-dismiss');
    expect(newState.scpWizard).toBeUndefined();
    expect(newState.scpInstallAgentNoteShown).toBe(true);
  });

  it('non Enter/Esc keys are noop on the note step', () => {
    const { action } = applyKeypress(noteWizardState(), { name: 'tab' });
    expect(action.type).toBe('noop');
  });
});
