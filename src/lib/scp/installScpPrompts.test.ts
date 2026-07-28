/**
 * installScpPrompts.ts tests — RM-D1
 *
 * Verifies inline-port correctness + wizard reducer state transitions.
 */
import {
  validateDesignationForWizard,
  deriveNamesFromDesignation,
  validateAndDerive,
  applyWizardInput,
  createInitialWizardState,
  SCP_INSTALL_PROMPTS,
  SCP_RESERVED_NAMES,
} from './installScpPrompts';

describe('installScpPrompts', () => {
  describe('validateDesignationForWizard (inline-ported)', () => {
    it('accepts valid PascalCase', () => {
      expect(validateDesignationForWizard('MyResearchSCP').valid).toBe(true);
    });
    it('rejects empty', () => {
      expect(validateDesignationForWizard('').valid).toBe(false);
    });
    it('rejects single-char', () => {
      expect(validateDesignationForWizard('A').valid).toBe(false);
    });
    it('rejects 33-char overflow', () => {
      expect(validateDesignationForWizard('A' + 'b'.repeat(32)).valid).toBe(false);
    });
    it('rejects lowercase start', () => {
      expect(validateDesignationForWizard('myResearch').valid).toBe(false);
    });
    it('rejects special chars', () => {
      expect(validateDesignationForWizard('My-Research').valid).toBe(false);
      expect(validateDesignationForWizard('My Research').valid).toBe(false);
      expect(validateDesignationForWizard('My_Research').valid).toBe(false);
    });
    it('rejects reserved names case-insensitively', () => {
      for (const reserved of SCP_RESERVED_NAMES) {
        const cap = reserved.charAt(0).toUpperCase() + reserved.slice(1);
        if (cap.length >= 2 && cap.length <= 32 && /^[A-Z]/.test(cap) && /^[A-Za-z0-9]+$/.test(cap)) {
          expect(validateDesignationForWizard(cap).valid).toBe(false);
        }
      }
    });
  });

  describe('deriveNamesFromDesignation', () => {
    it('lowercases first char only', () => {
      expect(deriveNamesFromDesignation('MyResearch')).toEqual({
        designation: 'MyResearch',
        conceptName: 'myResearch',
      });
    });
  });

  describe('validateAndDerive', () => {
    it('ok=true for valid', () => {
      const r = validateAndDerive('MyResearch');
      expect(r.ok).toBe(true);
    });
    it('ok=false for invalid', () => {
      expect(validateAndDerive('').ok).toBe(false);
    });
  });

  describe('SCP_INSTALL_PROMPTS', () => {
    it('has 4 steps in canonical order', () => {
      expect(SCP_INSTALL_PROMPTS.map((p) => p.id)).toEqual([
        'designation',
        'confirm-concept-name',
        'confirm-path',
        'confirm-launch',
      ]);
    });
    it('every step has question + hint + validate', () => {
      for (const p of SCP_INSTALL_PROMPTS) {
        expect(p.question).toBeDefined();
        expect(p.hint).toBeTruthy();
        expect(typeof p.validate).toBe('function');
      }
    });
  });

  describe('applyWizardInput reducer', () => {
    it('designation → confirm-concept-name on valid input', () => {
      const s0 = createInitialWizardState();
      const s1 = applyWizardInput(s0, 'MyResearch');
      expect(s1.step).toBe('confirm-concept-name');
      expect(s1.derivation?.conceptName).toBe('myResearch');
      expect(s1.validationError).toBe('');
    });

    it('designation stays on invalid + sets error', () => {
      const s0 = createInitialWizardState();
      const s1 = applyWizardInput(s0, '');
      // empty input is no-op → state unchanged
      expect(s1).toBe(s0);
    });

    it('designation stays + error on lowercase-start', () => {
      const s0 = createInitialWizardState();
      const s1 = applyWizardInput(s0, 'lowercase');
      expect(s1.step).toBe('designation');
      expect(s1.validationError).not.toBe('');
    });

    it('confirm-concept-name + y → confirm-path', () => {
      let s = createInitialWizardState();
      s = applyWizardInput(s, 'MyResearch');
      s = applyWizardInput(s, 'y');
      expect(s.step).toBe('confirm-path');
    });

    it('confirm-concept-name + r → designation (resets)', () => {
      let s = createInitialWizardState();
      s = applyWizardInput(s, 'MyResearch');
      s = applyWizardInput(s, 'r');
      expect(s.step).toBe('designation');
      expect(s.designation).toBe('');
      expect(s.derivation).toBeNull();
    });

    it('confirm-path + n → error step (cancelled)', () => {
      let s = createInitialWizardState();
      s = applyWizardInput(s, 'MyResearch');
      s = applyWizardInput(s, 'y');
      s = applyWizardInput(s, 'n');
      expect(s.step).toBe('error');
    });

    it('confirm-launch + y → running', () => {
      let s = createInitialWizardState();
      s = applyWizardInput(s, 'MyResearch');
      s = applyWizardInput(s, 'y');
      s = applyWizardInput(s, 'y');
      s = applyWizardInput(s, 'y');
      expect(s.step).toBe('running');
      expect(s.confirmed).toBe(true);
    });

    it('confirm-launch + n → done (skip launch · install-only)', () => {
      let s = createInitialWizardState();
      s = applyWizardInput(s, 'MyResearch');
      s = applyWizardInput(s, 'y');
      s = applyWizardInput(s, 'y');
      s = applyWizardInput(s, 'n');
      expect(s.step).toBe('done');
      expect(s.confirmed).toBe(false);
    });
  });
});
