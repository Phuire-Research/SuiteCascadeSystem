// Diamond SCP-5 · The User Surface — SCP Suite 8 instance helpers
// Shared primitives for scs scp subcommands (list, init).

import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import * as path from 'node:path';

/** The directory under cwd that contains Suite 8 instances. */
export const SUITE_8_DIR = path.join('Cascades', '8_SUITES');

/** Name of the canonical SCP Researcher meta-Suite-8 (the type spec). */
export const SCP_RESEARCHER_DIR = 'SCP Researcher';

/** Modes supported by an SCP Suite 8 instance. */
export type ScpMode = 'Personal' | 'Organizational' | 'Project';

/** A scanned SCP Suite 8 instance. */
export interface ScpInstance {
  designation: string;
  mode: ScpMode | 'Unknown';
  runtimePath: string | null;
  instancePath: string;
}

/** Designation validation result. */
export interface DesignationValidation {
  valid: boolean;
  reason?: string;
}

/**
 * Validate a user-supplied designation.
 *
 * Rules:
 *  - 1-64 characters
 *  - alphanumeric · hyphens · spaces · underscores · periods allowed
 *  - must not start or end with a separator (space, hyphen, dot, underscore)
 *  - must not equal the reserved SCP Researcher meta-Suite-8 name
 */
export function validateDesignation(designation: string): DesignationValidation {
  if (typeof designation !== 'string') {
    return { valid: false, reason: 'Designation must be a string' };
  }
  if (designation.length === 0) {
    return { valid: false, reason: 'Designation cannot be empty' };
  }
  if (designation.length > 64) {
    return { valid: false, reason: 'Designation cannot exceed 64 characters' };
  }
  if (!/^[A-Za-z0-9]/.test(designation)) {
    return { valid: false, reason: 'Designation must start with alphanumeric' };
  }
  if (!/[A-Za-z0-9]$/.test(designation)) {
    return { valid: false, reason: 'Designation must end with alphanumeric' };
  }
  if (!/^[A-Za-z0-9 \-_.]+$/.test(designation)) {
    return {
      valid: false,
      reason: 'Designation may contain only alphanumerics, spaces, hyphens, underscores, periods',
    };
  }
  if (designation === SCP_RESEARCHER_DIR) {
    return {
      valid: false,
      reason: `"${SCP_RESEARCHER_DIR}" is reserved for the meta-Suite-8 type spec`,
    };
  }
  return { valid: true };
}

/** Validate a mode string. */
export function validateMode(value: string): value is ScpMode {
  return value === 'Personal' || value === 'Organizational' || value === 'Project';
}

/**
 * Read a Suite 8 directory's Instance.md and extract whether it declares an
 * SCP mode + runtime reference. Returns `null` if the directory is not an
 * SCP S8 instance (e.g., it's an Advanced-config Suite 8 like Fresh Slate
 * or it's the SCP Researcher meta-spec).
 */
export function readScpInstance(cwd: string, designation: string): ScpInstance | null {
  if (designation === SCP_RESEARCHER_DIR) {
    return null; // meta-spec, not an instance
  }
  const instancePath = path.join(cwd, SUITE_8_DIR, designation);
  const instanceMd = path.join(instancePath, 'Instance.md');
  if (!existsSync(instanceMd)) return null;
  const content = readFileSync(instanceMd, 'utf8');
  const modeMatch = content.match(/\*\*Mode\*\*:\s*(Personal|Organizational|Project)\b/);
  const runtimeMatch = content.match(/\*\*Path\*\*:\s*\|\s*(.+?)\s*\|/);
  // Only count as an SCP instance if Mode field is present
  if (!modeMatch) return null;
  return {
    designation,
    mode: modeMatch[1] as ScpMode,
    runtimePath: runtimeMatch ? runtimeMatch[1] : null,
    instancePath,
  };
}

/**
 * List all SCP Suite 8 instances under cwd's Cascades/8_SUITES/ directory.
 * The SCP Researcher meta-spec is excluded.
 */
export function listScpInstances(cwd: string): ScpInstance[] {
  const suite8Root = path.join(cwd, SUITE_8_DIR);
  if (!existsSync(suite8Root)) return [];
  const entries = readdirSync(suite8Root);
  const instances: ScpInstance[] = [];
  for (const name of entries) {
    const entryPath = path.join(suite8Root, name);
    if (!statSync(entryPath).isDirectory()) continue;
    const instance = readScpInstance(cwd, name);
    if (instance) instances.push(instance);
  }
  return instances;
}

/** Per-mode defaults applied when init does not override. */
export interface ModeDefaults {
  description: string;
  membershipLine: string;
  identityLayer: string;
  transportMode: string;
  transportBinding: string;
  persistenceBoundary: string;
}

export const MODE_DEFAULTS: Record<ScpMode, ModeDefaults> = {
  Personal: {
    description:
      'A Personal SCP Suite 8 runs as a single-user bridge into MCP-using clients (Claude Code, Claude Desktop). Its perimeter is the user; its persistence is private to the user account.',
    membershipLine: 'Single user (the project owner).',
    identityLayer: 'Local user account · personal token.',
    transportMode: 'WebSocket + Express HTTP',
    transportBinding: 'localhost:7111',
    persistenceBoundary: 'User-private (no sharing across user accounts).',
  },
  Organizational: {
    description:
      'An Organizational SCP Suite 8 exposes shared org tooling. Its perimeter is org membership (via SSO/IDP); its persistence is org-scoped.',
    membershipLine: 'Team / company members per org-assigned role.',
    identityLayer: 'Org SSO / IDP · org-issued tokens.',
    transportMode: 'WebSocket + Express HTTP behind org reverse proxy',
    transportBinding: 'org-internal hostname',
    persistenceBoundary: 'Org-scoped (visible to org members per role).',
  },
  Project: {
    description:
      "A Project SCP Suite 8 binds to a specific project (no individual identity). Its perimeter is the project's authorization surface; its persistence lives and dies with the project.",
    membershipLine: 'Bound to a specific project (no individual identity).',
    identityLayer: 'Project-scoped token (CI-issued, project-bound).',
    transportMode: 'stdio (CI invocation pattern)',
    transportBinding: 'spawned per CI run',
    persistenceBoundary: 'Project-scoped (lives and dies with the project).',
  },
};

/** Slot values passed to the template substitution engine. */
export interface SlotValues {
  designation: string;
  mode: ScpMode;
  role: string;
  originDiamond: string;
  originDate: string;
  modeDescription: string;
  membershipLine: string;
  identityLayer: string;
  transportMode: string;
  transportBinding: string;
  persistenceBoundary: string;
  runtimeComposition: 'copy' | 'reference';
  runtimePath: string;
  designationRationale: string;
}

/** Substitute `{{SLOT_NAME}}` placeholders. Repeated slots are all replaced. */
export function substituteSlots(template: string, slots: SlotValues): string {
  const map: Record<string, string> = {
    DESIGNATION: slots.designation,
    MODE: slots.mode,
    ROLE: slots.role,
    ORIGIN_DIAMOND: slots.originDiamond,
    ORIGIN_DATE: slots.originDate,
    MODE_DESCRIPTION: slots.modeDescription,
    MEMBERSHIP_LINE: slots.membershipLine,
    IDENTITY_LAYER: slots.identityLayer,
    TRANSPORT_MODE: slots.transportMode,
    TRANSPORT_BINDING: slots.transportBinding,
    PERSISTENCE_BOUNDARY: slots.persistenceBoundary,
    RUNTIME_COMPOSITION: slots.runtimeComposition,
    RUNTIME_PATH: slots.runtimePath,
    DESIGNATION_RATIONALE: slots.designationRationale,
  };
  let out = template;
  for (const [name, value] of Object.entries(map)) {
    out = out.split(`{{${name}}}`).join(value);
  }
  return out;
}

/** Inputs to {@link createScpInstance}. */
export interface CreateScpInstanceInput {
  cwd: string;
  designation: string;
  mode: ScpMode;
  originDiamond: string;
  originDate: string;
  role?: string;
  designationRationale?: string;
}

/** Result of {@link createScpInstance}. */
export interface CreateScpInstanceResult {
  ok: boolean;
  instancePath: string;
  filesWritten: string[];
  errors: string[];
}

/**
 * Materialize a new SCP Suite 8 instance from the SCP Researcher templates.
 *
 * Reads:
 *   - Cascades/8_SUITES/SCP Researcher/Templates/Instance.md.template
 *   - Cascades/8_SUITES/SCP Researcher/Templates/Skill.md.template
 *
 * Writes:
 *   - Cascades/8_SUITES/<designation>/Instance.md
 *   - Cascades/8_SUITES/<designation>/Skill.md
 *
 * Reference-mode runtime (default). The runtime tree is NOT copied; the
 * instance's Instance.md declares Runtime: ../../scps/template/SCP/ referring to the
 * shared template at repo root.
 */
export function createScpInstance(input: CreateScpInstanceInput): CreateScpInstanceResult {
  const errors: string[] = [];
  const filesWritten: string[] = [];

  const validation = validateDesignation(input.designation);
  if (!validation.valid) {
    errors.push(validation.reason ?? 'Invalid designation');
    return { ok: false, instancePath: '', filesWritten, errors };
  }

  const instancePath = path.join(input.cwd, SUITE_8_DIR, input.designation);
  if (existsSync(instancePath)) {
    errors.push(`A Suite 8 named "${input.designation}" already exists at ${instancePath}`);
    return { ok: false, instancePath, filesWritten, errors };
  }

  const templatesDir = path.join(input.cwd, SUITE_8_DIR, SCP_RESEARCHER_DIR, 'Templates');
  const instanceTpl = path.join(templatesDir, 'Instance.md.template');
  const skillTpl = path.join(templatesDir, 'Skill.md.template');
  if (!existsSync(instanceTpl) || !existsSync(skillTpl)) {
    errors.push(
      `SCP Researcher templates not found at ${templatesDir}. Ensure Diamond SCP-3 has landed and templates are present.`,
    );
    return { ok: false, instancePath, filesWritten, errors };
  }

  const defaults = MODE_DEFAULTS[input.mode];
  const slots: SlotValues = {
    designation: input.designation,
    mode: input.mode,
    role: input.role ?? `${input.mode} SCP Suite 8`,
    originDiamond: input.originDiamond,
    originDate: input.originDate,
    modeDescription: defaults.description,
    membershipLine: defaults.membershipLine,
    identityLayer: defaults.identityLayer,
    transportMode: defaults.transportMode,
    transportBinding: defaults.transportBinding,
    persistenceBoundary: defaults.persistenceBoundary,
    runtimeComposition: 'reference',
    runtimePath: '../../scps/template/SCP/',
    designationRationale:
      input.designationRationale ??
      `The designation "${input.designation}" was chosen at instance creation. It carries the access perimeter for this ${input.mode}-mode SCP S8.`,
  };

  mkdirSync(instancePath, { recursive: true });

  const instanceOut = substituteSlots(readFileSync(instanceTpl, 'utf8'), slots);
  const instanceFile = path.join(instancePath, 'Instance.md');
  writeFileSync(instanceFile, instanceOut, 'utf8');
  filesWritten.push(instanceFile);

  const skillOut = substituteSlots(readFileSync(skillTpl, 'utf8'), slots);
  const skillFile = path.join(instancePath, 'Skill.md');
  writeFileSync(skillFile, skillOut, 'utf8');
  filesWritten.push(skillFile);

  return { ok: true, instancePath, filesWritten, errors };
}
