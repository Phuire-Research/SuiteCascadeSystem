/**
 * Install SCP Canonical Prompt Set (RM-D1)
 *
 * Pure prompt-spec module — single source of truth for the SCP install wizard.
 * Both surfaces import from here:
 *   - TUI wizard (src/lib/bridge/menu.ts + animatedTui.ts modal state machine)
 *   - ClaudeCode SessionStart hook (AskUserQuestion sequence via Agent priming)
 *
 * IAPMCT invariant (Installation-Agent-Prompt-Mirror-for-CLI-TUI): both
 * surfaces produce IDENTICAL installed state for the same designation+mode
 * inputs. Validation rules must match exactly between surfaces.
 *
 * Cross-Project Boundary Resolution (CPPFIB / Option α):
 * The 3 validator functions below are INLINE-PORTED from
 *   Cascades/scps/template/SCP/src/model/designationValidator.model.ts
 * (M2-A1-D2). Changes to template originals must be manually mirrored here.
 *
 * Citation: DIAMOND-TIER-REFINE-MACRO-SCP-INSTALL.md RM-D1
 * Citation: SUITE-2-ORANGE-CLI-INSTALL-MANIFOLD.md SITPSDF + SDIVAK + IAPMCT
 * Citation: SUITE-6-PURPLE-INSTALL-PIPELINE-ORCHESTRATION.md RM-D1
 */

// ============================================
// VALIDATION RESULT TYPES (Inline-ported from template designationValidator.model.ts)
// ============================================

export interface DesignationValidation {
  valid: boolean;
  reason?: string;
}

export interface NameDerivation {
  designation: string; // PascalCase user-facing name e.g. "MyResearchSCP"
  conceptName: string; // camelCase Stratimux ident e.g. "myResearchSCP"
}

// ============================================
// RESERVED NAMES (mirrors template SCP_RESERVED_NAMES)
// ============================================

export const SCP_RESERVED_NAMES: readonly string[] = [
  'template',
  'SCP',
  'huirth',
  'client',
  'scsBridge',
  'scpRegistry',
  'scpLog',
  'webSocketClient',
  'webSocketServer',
  'serverConcept',
  'vueConcept',
  'notification',
  'notificationHuirth',
];

// ============================================
// VALIDATION (Inline-ported from template)
// ============================================

export function validateDesignationForWizard(designation: string): DesignationValidation {
  if (typeof designation !== 'string') {
    return { valid: false, reason: 'Designation must be a string' };
  }
  if (designation.length === 0) {
    return { valid: false, reason: 'Enter a name for your SCP' };
  }
  if (designation.length < 2) {
    return { valid: false, reason: 'Designation must be at least 2 characters' };
  }
  if (designation.length > 32) {
    return { valid: false, reason: 'Designation cannot exceed 32 characters' };
  }
  if (!/^[A-Z]/.test(designation)) {
    return { valid: false, reason: 'Designation must start with an uppercase letter (PascalCase)' };
  }
  if (!/^[A-Za-z0-9]+$/.test(designation)) {
    return {
      valid: false,
      reason:
        'Designation may contain only letters and numbers (no spaces · hyphens · underscores · periods)',
    };
  }
  const lowerInput = designation.toLowerCase();
  for (const reserved of SCP_RESERVED_NAMES) {
    if (lowerInput === reserved.toLowerCase()) {
      return { valid: false, reason: `"${designation}" is a reserved name` };
    }
  }
  return { valid: true };
}

export function deriveNamesFromDesignation(designation: string): NameDerivation {
  return {
    designation,
    conceptName: designation.charAt(0).toLowerCase() + designation.slice(1),
  };
}

export type WizardNameResult =
  | { ok: true; derivation: NameDerivation }
  | { ok: false; reason: string };

export function validateAndDerive(designation: string): WizardNameResult {
  const validation = validateDesignationForWizard(designation);
  if (!validation.valid) {
    return { ok: false, reason: validation.reason ?? 'Invalid designation' };
  }
  return { ok: true, derivation: deriveNamesFromDesignation(designation) };
}

// ============================================
// WIZARD STATE
// ============================================

export type ScpInstallMode = 'Personal' | 'Organizational' | 'Project';

export interface ScpWizardState {
  designation: string; // user input · live buffer
  derivation: NameDerivation | null; // populated when designation valid
  validationError: string; // current validation error · empty when valid
  mode: ScpInstallMode; // default Personal
  step: ScpWizardStep;
  confirmed: boolean; // user pressed y on final confirm
  // Issue #643 Half B · Refinement 3+4 (SCBN · SCP-Confirm-Button-Nav): the
  // active button on the confirm-* + boot-recommend steps. UI layer OVER the
  // applyWizardInput y/n/r reducer — 'affirm' feeds the affirmative char
  // (y / Boot), 'deny' feeds the negative char (n · or r on confirm-concept-name
  // where "No" means re-enter the designation). Default per step = the
  // safe/affirmative button (see DEFAULT_BUTTON_SELECTION). The reducer's y/n/r
  // semantics are unchanged; this only drives which char Enter submits.
  buttonSelection?: 'affirm' | 'deny';
}

// Issue #643 Half B · Refinement 3+4 (SCBN): per-step default active button.
// The affirmative/safe choice is the default on every button-bearing step so
// Enter alone = proceed (preserves the prior y/Enter direct-confirm behavior).
export const DEFAULT_BUTTON_SELECTION: Record<string, 'affirm' | 'deny'> = {
  'confirm-concept-name': 'affirm',
  'confirm-path': 'affirm',
  'confirm-launch': 'affirm',
  'boot-recommend': 'affirm',
};

export type ScpWizardStep =
  | 'agent-install-note'   // SCPGATE FBSN: first-run consent note (precedes designation)
  | 'designation'
  | 'confirm-concept-name'
  | 'confirm-path'
  | 'confirm-launch'
  | 'running'
  | 'boot-recommend'
  | 'done'
  | 'error';

export function createInitialWizardState(): ScpWizardState {
  return {
    designation: '',
    derivation: null,
    validationError: '',
    mode: 'Personal',
    step: 'designation',
    confirmed: false,
    buttonSelection: 'affirm',
  };
}

// ============================================
// CANONICAL PROMPT SET (4 steps · TUI + Agent shared)
// ============================================

export interface PromptStep {
  id: ScpWizardStep;
  /**
   * Question rendered to user. When function, receives current state to allow
   * dynamic substitution (e.g., showing derived conceptName).
   */
  question: string | ((state: ScpWizardState) => string);
  /** Hint shown below question (one line · UX guidance). */
  hint: string;
  /** Validator for input at this step. Empty string on first render. */
  validate: (input: string, state: ScpWizardState) => DesignationValidation;
}

export const SCP_INSTALL_PROMPTS: PromptStep[] = [
  {
    id: 'designation',
    question: 'What would you like to name your SCP? (PascalCase · e.g. MyResearchSCP)',
    hint: 'Letters and numbers only · must start with uppercase · 2-32 chars',
    validate: (input) => validateDesignationForWizard(input),
  },
  {
    id: 'confirm-concept-name',
    // Issue #643 Half B · Refinement 3+4: question is button-driven now — the
    // [ Yes ] [ Re-enter ] pair is the affordance · no [y]es/[r] hotkey text.
    question: (state) =>
      `Concept name will be "${state.derivation?.conceptName ?? '???'}". Confirm?`,
    hint: 'The concept name is the camelCase Stratimux identifier for your SCP',
    validate: (input) => {
      if (input === 'y' || input === 'r') return { valid: true };
      return { valid: false, reason: 'Press y to confirm or r to re-enter the designation' };
    },
  },
  {
    id: 'confirm-path',
    // Issue #643 Half B · Refinement 3+4: [ Yes ] [ No ] button pair drives this.
    question: (state) =>
      `Install to: Cascades/scps/${state.derivation?.designation ?? '???'}/SCP/ — confirm?`,
    hint: 'This creates the SCP runtime tree at the specified path',
    validate: (input) => {
      if (input === 'y' || input === 'n') return { valid: true };
      return { valid: false, reason: 'Press y to proceed or n to cancel' };
    },
  },
  {
    id: 'confirm-launch',
    // Issue #643 Half B · Refinement 5 (SCP-window truth · no "browser", no raw
    // localhost URL) + Refinement 3+4 ([ Yes ] [ No ] button pair).
    question: 'Clone template and install dependencies?',
    hint: 'The SCP opens in its own SCS window after install.',
    validate: (input) => {
      if (input === 'y' || input === 'n') return { valid: true };
      return { valid: false, reason: 'Press y to launch or n to skip launch' };
    },
  },
];

// ============================================
// WIZARD REDUCER (pure state transition)
// ============================================

/**
 * Applies user input to the wizard state at the current step. Returns the
 * next state. Pure function — caller (TUI or Agent mirror) re-renders based
 * on returned state.
 *
 * Step transitions:
 *   designation              + valid input         → confirm-concept-name (derivation populated)
 *   designation              + invalid             → designation (error set)
 *   confirm-concept-name + y → confirm-path
 *   confirm-concept-name + r → designation (buffer cleared)
 *   confirm-path         + y → confirm-launch
 *   confirm-path         + n → error (user cancelled)
 *   confirm-launch       + y → running (pipeline begins)
 *   confirm-launch       + n → done (skip launch · install complete sans spawn)
 *
 * Empty input on any step = no transition (re-renders current prompt).
 */
export function applyWizardInput(state: ScpWizardState, input: string): ScpWizardState {
  if (input.length === 0) return state;
  const prompt = SCP_INSTALL_PROMPTS.find((p) => p.id === state.step);
  if (!prompt) return state;

  const validation = prompt.validate(input, state);
  if (!validation.valid) {
    return { ...state, validationError: validation.reason ?? 'Invalid input' };
  }

  switch (state.step) {
    case 'designation': {
      const derivation = deriveNamesFromDesignation(input);
      return {
        ...state,
        designation: input,
        derivation,
        validationError: '',
        step: 'confirm-concept-name',
        // Issue #643 Half B · Refinement 3+4: seed the safe/affirmative button.
        buttonSelection: DEFAULT_BUTTON_SELECTION['confirm-concept-name'],
      };
    }
    case 'confirm-concept-name': {
      if (input === 'r') {
        return {
          ...state,
          designation: '',
          derivation: null,
          validationError: '',
          step: 'designation',
        };
      }
      return {
        ...state,
        validationError: '',
        step: 'confirm-path',
        buttonSelection: DEFAULT_BUTTON_SELECTION['confirm-path'],
      };
    }
    case 'confirm-path': {
      if (input === 'n') {
        return { ...state, validationError: 'Install cancelled', step: 'error' };
      }
      return {
        ...state,
        validationError: '',
        step: 'confirm-launch',
        buttonSelection: DEFAULT_BUTTON_SELECTION['confirm-launch'],
      };
    }
    case 'confirm-launch': {
      return {
        ...state,
        validationError: '',
        confirmed: input === 'y',
        step: input === 'y' ? 'running' : 'done',
      };
    }
    default:
      return state;
  }
}
