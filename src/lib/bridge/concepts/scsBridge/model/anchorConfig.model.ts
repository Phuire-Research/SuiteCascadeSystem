/**
 * anchorConfig.model · SAC.3 · Per-page Anchor Config Resolver (CONFIG-STORAGE Option A)
 *
 * The pure, zero-dispatch resolver that the bridge reuses everywhere it needs to know
 * whether a Suite 8 page auto-anchors its spawned session. Two on-disk legs, one
 * resolved value:
 *
 *   - DEFAULT (the menu-creator default) rides the EXISTING per-Suite-8 menu.json at
 *     Cascades/Extended/<suite8Name>/menu.json — an OPTIONAL `anchorConfig: { autoAnchor }`
 *     field the Anchor/creator writes. READ-ONLY here (only the Anchor writes menu.json).
 *   - OVERRIDE (the user toggle) rides a sibling Cascades/Extended/<suite8Name>/anchor.override.json
 *     = { autoAnchor: boolean }, written/deleted by the bridge on user toggle.
 *
 * RESOLVED = override.autoAnchor ?? menuDefault.autoAnchor ?? true.
 *   default = menuDefault.autoAnchor ?? true (the menu-creator default the Pewter panel reads).
 *
 * AFPR (Always-Forgiving Path Read): a missing / malformed / partial-write file falls
 * THROUGH to the next leg and ultimately to the system default (autoAnchor:true — today's
 * behavior). This module NEVER throws — a parse error is swallowed + logged, never surfaced.
 *
 * SCS root = process.cwd() (the SAME convention registry.ts / instanceMdResolver.model.ts /
 * paths.ts bridgeRoot() use; suite8MenuRelay.config.ts resolves the SAME menu.json under
 * SCS_BRIDGE_ROOT_OVERRIDE ?? process.cwd()). Honors SCS_BRIDGE_ROOT_OVERRIDE for parity.
 *
 * Citation: SAC-WGB.md § ◆ SAC.3 + the CONFIG-STORAGE ADOPTED block (Option A)
 * Citation: suite8MenuRelay.config.ts (the Cascades/Extended/<name>/menu.json path convention)
 * Citation: suite8PickerEndpoint.principle.huirth.ts (the AFPR pure-read precedent)
 */

import { existsSync, readFileSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { log } from '../../../debugLog';

// The system default — absent/malformed config everywhere → today's behavior (auto-anchor on).
export const ANCHOR_CONFIG_SYSTEM_DEFAULT = true;

// The sibling override basename the bridge writes/deletes (the menu.json convention's sibling).
export const ANCHOR_OVERRIDE_JSON_BASENAME = 'anchor.override.json';
const MENU_JSON_BASENAME = 'menu.json';

/**
 * RESOLVED anchor config for a Suite 8 page.
 *   autoAnchor = override ?? menuDefault ?? system default  (the effective value the spawn reads)
 *   default    = menuDefault ?? system default              (the menu-creator default the panel reads)
 */
export interface ResolvedAnchorConfig {
  autoAnchor: boolean;
  default: boolean;
}

// SCS root — same discipline as suite8MenuRelay.config.ts (override env ?? process.cwd()).
// MD-1 · D-SB-2 · scsRootOverride: when a SCP-local root is supplied (boundScps[scpName].dir),
// it takes PRECEDENCE over the env leg — the anchor config resolves under the SCP's OWN
// Cascades/Extended/ (Sovereignty Boundary). Absent ⇒ SCS_BRIDGE_ROOT_OVERRIDE ?? cwd
// (the existing env pattern, unchanged).
function scsRoot(scsRootOverride?: string): string {
  if (scsRootOverride) return resolve(scsRootOverride);
  return process.env.SCS_BRIDGE_ROOT_OVERRIDE
    ? resolve(process.env.SCS_BRIDGE_ROOT_OVERRIDE)
    : resolve(process.cwd());
}

// C465 · THE EXTENDED RELOCATION — Extended/ is SCP-LOCAL now (moved into each SCP package's
// own Cascades/; the workspace Cascades/Extended no longer exists). When no explicit
// scsRootOverride is supplied, resolve the OWNING SCP deterministically: the installed SCP
// whose Cascades/8_SUITES/<suite8Name>/ exists owns that designation's Extended substrate.
// installedScps paths come from the workspace bridge.json (bridgeRoot rendezvous). Fallback:
// the legacy scsRoot() (env ?? cwd) — a standalone/unregistered boot keeps the old behavior.
export function resolveOwningScpRoot(suite8Name: string): string | undefined {
  try {
    const root = scsRoot();
    const scpsJsonPath = resolve(root, 'Cascades', 'SCPs.json');
    if (!existsSync(scpsJsonPath)) return undefined;
    const parsed = JSON.parse(readFileSync(scpsJsonPath, 'utf-8')) as unknown;
    const entries: Array<{ path?: string }> = Array.isArray(parsed)
      ? (parsed as Array<{ path?: string }>)
      : Object.values((parsed as { scps?: Record<string, { path?: string }> }).scps ?? {});
    // C857 · THE DESIGNATION-COLLISION TELEMETRY: collect EVERY owning citizen before
    // answering. First-found stays the answer (zero-regression) but a collision is now
    // LOUD — the Run-Through-007 wound was two citizens carrying the same Suite 8 and
    // this probe silently binding the first (the template), poisoning the Dock §4 stamp.
    const owners: string[] = [];
    for (const entry of entries) {
      if (typeof entry?.path !== 'string' || entry.path.length === 0) continue;
      const scpDir = resolve(root, entry.path);
      if (existsSync(resolve(scpDir, 'Cascades', '8_SUITES', suite8Name))) {
        owners.push(scpDir);
      }
    }
    if (owners.length > 1) {
      console.warn(
        '[anchorConfig] C857 · DESIGNATION COLLISION ·',
        suite8Name,
        '· owned by',
        owners.length,
        'citizens · first-found chosen:',
        owners[0],
        '· all:',
        owners.join(' | '),
        '· pass scpName at spawn to bind the intended citizen',
      );
    }
    if (owners.length > 0) return owners[0];
  } catch {
    /* malformed SCPs.json — fall through to the legacy root */
  }
  return undefined;
}

// C880 · THE BY-NAME RESOLVER — the origin-threading twin of resolveOwningScpRoot: when the
// SESSION knows its citizen (entry.scpName · the FKIS thread), resolve THAT SCP's root directly
// by name from SCPs.json — no designation probe, collision-immune.
export function resolveScpRootByName(scpName: string): string | undefined {
  if (typeof scpName !== 'string' || scpName.trim() === '') return undefined;
  try {
    const root = scsRoot();
    const scpsJsonPath = resolve(root, 'Cascades', 'SCPs.json');
    if (!existsSync(scpsJsonPath)) return undefined;
    const parsed = JSON.parse(readFileSync(scpsJsonPath, 'utf-8')) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const rec = (parsed as { scps?: Record<string, { path?: string }> }).scps;
      const hit = rec?.[scpName]?.path;
      if (typeof hit === 'string' && hit.length > 0) return resolve(root, hit);
    }
    if (Array.isArray(parsed)) {
      for (const entry of parsed as Array<{ name?: string; path?: string }>) {
        if (entry?.name === scpName && typeof entry.path === 'string' && entry.path.length > 0) {
          return resolve(root, entry.path);
        }
      }
    }
  } catch {
    /* malformed SCPs.json → undefined (the caller falls to the probe) */
  }
  return undefined;
}

// The per-Suite-8 Extended dir: Cascades/Extended/<suite8Name>/. The literal dir Name (NDEP) —
// the SAME key suite8MenuRelay.config.ts uses for menu.json.
function extendedDir(suite8Name: string, scsRootOverride?: string): string {
  const base = scsRootOverride
    ? resolve(scsRootOverride)
    : (resolveOwningScpRoot(suite8Name) ?? scsRoot());
  return resolve(base, 'Cascades', 'Extended', suite8Name);
}

export function resolveAnchorOverridePath(suite8Name: string, scsRootOverride?: string): string {
  return resolve(extendedDir(suite8Name, scsRootOverride), ANCHOR_OVERRIDE_JSON_BASENAME);
}

function resolveMenuJsonPath(suite8Name: string, scsRootOverride?: string): string {
  return resolve(extendedDir(suite8Name, scsRootOverride), MENU_JSON_BASENAME);
}

/**
 * AFPR read of a JSON file's `autoAnchor` boolean. Returns undefined on absent / unreadable /
 * non-JSON / non-object / missing-or-non-boolean field (the caller falls through to the next
 * leg). NEVER throws — a parse failure is swallowed + logged (partial-write resilient, exactly
 * as suite8MenuRelay.config.ts parseMenuStage handles a half-written menu.json).
 *
 * fieldPath: the menu.json default lives nested under `anchorConfig.autoAnchor`; the override
 * lives at the top level `autoAnchor`. nested=true reads parsed.anchorConfig.autoAnchor.
 */
function readAutoAnchorField(filePath: string, nested: boolean): boolean | undefined {
  if (!existsSync(filePath)) {
    return undefined;
  }
  let raw: string;
  try {
    raw = readFileSync(filePath, 'utf8');
  } catch (err) {
    log('anchorConfig.read.unreadable', {
      filePath,
      error: err instanceof Error ? err.message : String(err),
    });
    return undefined;
  }
  if (!raw.trim()) {
    return undefined; // empty / partial write
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    log('anchorConfig.read.parseFail', { filePath });
    return undefined; // malformed → fall through (AFPR)
  }
  if (!parsed || typeof parsed !== 'object') {
    return undefined;
  }
  const root = parsed as Record<string, unknown>;
  let host: Record<string, unknown> | undefined = root;
  if (nested) {
    const ac = root.anchorConfig;
    host = ac && typeof ac === 'object' ? (ac as Record<string, unknown>) : undefined;
  }
  if (!host) {
    return undefined;
  }
  return typeof host.autoAnchor === 'boolean' ? host.autoAnchor : undefined;
}

/**
 * resolveAnchorConfig — the single resolver every bridge leg reuses (gate, read-endpoint).
 *
 * RESOLVED = override.autoAnchor ?? menu.anchorConfig.autoAnchor ?? system default.
 *   default = menu.anchorConfig.autoAnchor ?? system default.
 *
 * AFPR: with NO config files present, returns { autoAnchor: true, default: true } (the
 * system default — today's auto-anchor behavior). NEVER throws.
 */
export function resolveAnchorConfig(suite8Name: string, scsRootOverride?: string): ResolvedAnchorConfig {
  // Defensive: a blank suite8Name has no page scope → system default (no scope to read).
  if (typeof suite8Name !== 'string' || suite8Name.trim() === '') {
    return { autoAnchor: ANCHOR_CONFIG_SYSTEM_DEFAULT, default: ANCHOR_CONFIG_SYSTEM_DEFAULT };
  }
  const menuDefault = readAutoAnchorField(resolveMenuJsonPath(suite8Name, scsRootOverride), true);
  const override = readAutoAnchorField(resolveAnchorOverridePath(suite8Name, scsRootOverride), false);

  const defaultValue = menuDefault ?? ANCHOR_CONFIG_SYSTEM_DEFAULT;
  const autoAnchor = override ?? defaultValue;

  return { autoAnchor, default: defaultValue };
}

/**
 * writeAnchorOverride — the USER OVERRIDE write leg (the scs_set_anchor_config Lambda).
 *
 * Writes Cascades/Extended/<suite8Name>/anchor.override.json = { autoAnchor } (creating the
 * Extended/<name>/ dir if absent). Throws on a genuine FS failure (the caller's Method swallows
 * + logs per the ACK-OD pattern). NEVER touches menu.json (READ-ONLY — only the Anchor writes it).
 */
export function writeAnchorOverride(suite8Name: string, autoAnchor: boolean): void {
  if (typeof suite8Name !== 'string' || suite8Name.trim() === '') {
    throw new Error('writeAnchorOverride: blank suite8Name (no page scope)');
  }
  const dir = extendedDir(suite8Name);
  mkdirSync(dir, { recursive: true });
  const filePath = resolveAnchorOverridePath(suite8Name);
  writeFileSync(filePath, JSON.stringify({ autoAnchor }, null, 2) + '\n', 'utf8');
  log('anchorConfig.override.write', { suite8Name, autoAnchor, filePath });
}

/**
 * deleteAnchorOverride — the RESET-to-default write leg (the scs_reset_anchor_config Lambda).
 *
 * Removes Cascades/Extended/<suite8Name>/anchor.override.json so the page reverts to the
 * menu-creator default (resolveAnchorConfig falls through to menu.anchorConfig.autoAnchor ??
 * system default). AFPR: a missing override file is a graceful no-op (rmSync force:true). NEVER
 * touches menu.json.
 */
export function deleteAnchorOverride(suite8Name: string): void {
  if (typeof suite8Name !== 'string' || suite8Name.trim() === '') {
    throw new Error('deleteAnchorOverride: blank suite8Name (no page scope)');
  }
  const filePath = resolveAnchorOverridePath(suite8Name);
  rmSync(filePath, { force: true });
  log('anchorConfig.override.delete', { suite8Name, filePath });
}
