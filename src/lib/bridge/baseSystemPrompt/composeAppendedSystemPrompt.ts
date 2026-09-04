// composeAppendedSystemPrompt.ts — THE ONE ASSEMBLER (RESUME INDUCTION · Diamond A).
//
// THE SANDWICH: base (the bridge's tool contract) → THE DOCK → the designation's
// Instance.md, joined by `\n\n---\n\n`, Instance.md LAST. THE DOCK (the user, C1088) is
// "the Most Upper First Prompt that Provides the Context for the Rest of the Suite 8s to
// be Joined To": it HEADS the Suite 8 stack, the Instance.md joins BELOW it, and the
// bridge's base contract precedes both.
//
// THE FIRE-TIME LAW (the user, C1088): "the Resume Always Calls for the Most Recent of All
// the Files we are Joining for the Dock." EVERY layer is read fresh at EVERY compose —
// the base is REGENERATED from the committed skeleton with THIS bridge's live port, the
// Dock is re-read from assets/, the Instance.md is re-read from its resolved ground.
// Nothing is cached, nothing is frozen.
//
// WHY IT LIVES IN lib/ (the sovereignty constraint): the daemon (manager.ts) CANNOT import
// src/main/*. The prior composer sat inside src/main/cli-handler.ts, so the TUI /
// `scs attach` / `scs bridge spawn` doors could never reach it — THAT unreachability IS
// the strip the user observed on a resumed anchor. One assembler, three doors.
//
// THE OUTPUT PATH LAW: `<bridgeLogDir()>/scs-bridge-suite8-<safeDesignation>.generated.md`
// — per designation, PER ENVIRONMENT SEGMENT. The prior seat was bridgeRoot() (segment-
// blind) while the base it EMBEDS is per-segment (C1076), so two bridges in one workspace
// shared ONE composed file per designation and the last composer's endpoint reached the
// other bridge's sessions. The UNNAMED seat is byte-identical (bridgeLogDir() === bridgeRoot()
// with no segment); only a NAMED environment moves.
//
// FAILURE POLICY — the session path NEVER throws. Instance absent → base only. Dock
// absent → 2 layers. Base absent → `path: undefined` ⇒ the caller OMITS the
// --append-system-prompt-file clause (a clause pointing at a missing file kills the
// spawn). Every early return NAMES itself in telemetry (the Never-Silence law).
// The install-time assembler (installSpawn.assembleJoinedSuite8) is a SEPARATE, named
// sibling — see the boundary comment at its head.

import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import * as nodePath from 'node:path';
import { log } from '../debugLog';
import { bridgeLogDir, bridgeRoot, metaPath } from '../paths';
import { listSessions } from '../registry';
import { resolveSuite8InstanceMd } from '../instanceMdResolver.model';
import { resolveOwningScpRoot } from '../concepts/scsBridge/model/anchorConfig.model';
import { resolveScpDir } from '../scpDirResolver.model';
import { environmentName } from '../workspaceSocket.model';
import { readDockLayer } from './dockContent';
import {
  renderBaseSystemPrompt,
  resolveGeneratedBasePromptPath,
} from './baseSystemPrompt';

export type ComposedLayerName = 'base' | 'dock' | 'instance';

export type ComposedLayer = {
  name: ComposedLayerName;
  /** The file this layer's bytes came FROM (the Dock View's provenance column). */
  source: string;
  bytes: number;
};

export type ComposedPrompt = {
  /** undefined ⇒ NO --append clause (the graceful no-append degrade). */
  path: string | undefined;
  layers: ComposedLayer[];
  bytes: number;
  /** null ⇒ a General session (base only · no Dock, no Instance). */
  designation: string | null;
  instanceGround: 'scp-local' | 'workspace' | 'absent';
  /** Idempotence Concluder — the identical bytes were already on disk. */
  unchanged: boolean;
  /** The bridge NAME this compose belongs to ('' ⇒ the unnamed seat — the naming axis, never a port). */
  segment: string;
};

export type ComposeEmit = (event: string, payload: Record<string, unknown>) => void;

export type ComposeOpts = {
  /** sdia (Electron · electron-debug.json) anor log (daemon · debug.json). Default log. */
  emit?: ComposeEmit;
  /** This bridge's live pair — the caller usually already knows it (no second read). */
  endpoint?: string;
  port?: number;
  /** Door-resolved values; absent ⇒ resolved here from the registry/meta rail. */
  suite8NameOverride?: string;
  scpDirOverride?: string;
};

export const LAYER_JOINER = '\n\n---\n\n';
// Lane 7 guard 7 · no hard cap exists or is proposed anywhere in this repo; this is
// VISIBILITY only, so a designation trending toward an unreadable prompt is seen.
export const COMPOSED_SIZE_WARN_BYTES = 80_000;

const GENERATED_BASE_NAME = 'scs-bridge-base.generated.md';

// One announcement per process per path — a visible, prunable trail, never a delete
// (the composed files at the legacy shared root belong to a prior writer).
const announcedLegacyTwins = new Set<string>();
let tmpCounter = 0;

/** THE FILENAME LAW · unchanged from the prior composer: `[^a-zA-Z0-9_-] → _`. */
export function safeDesignationName(designation: string): string {
  return designation.replace(/[^a-zA-Z0-9_-]/g, '_');
}

/** THE OUTPUT PATH LAW · per designation · PER SEGMENT. */
export function resolveComposedPromptPath(designation: string): string {
  return nodePath.join(
    bridgeLogDir(),
    `scs-bridge-suite8-${safeDesignationName(designation)}.generated.md`,
  );
}

// tmp + rename in the SAME dir (atomic on one filesystem) — the repo's own shared-state
// write law (trustPreSeed.ts:20 · icedManifest.ts · logCap.ts). The prior composer was
// the outlier: a bare writeFileSync a concurrent reader could catch half-written.
// Returns true when the bytes were already on disk (write skipped · idempotent).
function writeAtomicIfChanged(outPath: string, content: string): boolean {
  if (existsSync(outPath)) {
    try {
      if (readFileSync(outPath, 'utf8') === content) return true;
    } catch {
      /* unreadable → fall through and rewrite */
    }
  }
  tmpCounter += 1;
  const tmpPath = `${outPath}.tmp.${process.pid}.${tmpCounter}`;
  try {
    // The segment dir (Cascades/Bridge/<Env>/) may not exist on a named bridge's first
    // compose — the prior root-seated writer never needed this.
    mkdirSync(nodePath.dirname(outPath), { recursive: true });
    writeFileSync(tmpPath, content, 'utf8');
    renameSync(tmpPath, outPath);
  } catch (err) {
    try {
      if (existsSync(tmpPath)) unlinkSync(tmpPath);
    } catch {
      /* best-effort tmp cleanup */
    }
    throw err;
  }
  return false;
}

type MetaShape = { suite8Name?: string; scpName?: string };

function readSessionMetaSync(ulid: string): MetaShape | null {
  // Read meta.json DIRECTLY rather than through manager.loadSessionMeta — manager
  // imports this module (the daemon door), so importing it back would close a require
  // cycle in the CJS bundle.
  try {
    const raw = readFileSync(metaPath(ulid), 'utf8');
    return JSON.parse(raw) as MetaShape;
  } catch {
    return null;
  }
}

// The port rail for the fire-time base regeneration. opts.port (the caller's live pair)
// FIRST; else bridge.json — C1076 · THE NAMED ORIGIN FIRST (namedBridges[<env>] before
// the top-level port: under two bridges the top level is the OTHER bridge's). Deliberately
// NOT getActiveBridgePort(): that module defaults to 7111 in EVERY process that never set
// it (the Electron main), which would silently stamp the unnamed seat's port into a named
// bridge's base — the exact wound the segment law cures. Unresolved ⇒ no regeneration.
function resolvePortFromBridgeJson(): number | undefined {
  try {
    const raw = readFileSync(nodePath.join(bridgeRoot(), 'bridge.json'), 'utf8');
    const bj = JSON.parse(raw) as {
      port?: number;
      namedBridges?: Record<string, { port?: number }>;
    };
    const env = environmentName();
    if (env.length > 0) {
      const named = bj.namedBridges?.[env]?.port;
      if (typeof named === 'number' && named > 0) return named;
      return undefined;
    }
    return typeof bj.port === 'number' && bj.port > 0 ? bj.port : undefined;
  } catch {
    return undefined;
  }
}

export async function composeAppendedSystemPrompt(
  ulid: string,
  opts: ComposeOpts = {},
): Promise<ComposedPrompt> {
  const emit: ComposeEmit = opts.emit ?? log;
  const segment = environmentName();
  const generatedBasePath = resolveGeneratedBasePromptPath();
  let baseContent = '';

  const baseOnly = (unchanged: boolean): ComposedPrompt => {
    const bytes = Buffer.byteLength(baseContent, 'utf8');
    if (baseContent.length === 0) {
      return {
        path: undefined,
        layers: [],
        bytes: 0,
        designation: null,
        instanceGround: 'absent',
        unchanged,
        segment,
      };
    }
    return {
      path: generatedBasePath,
      layers: [{ name: 'base', source: generatedBasePath, bytes }],
      bytes,
      designation: null,
      instanceGround: 'absent',
      unchanged,
      segment,
    };
  };

  try {
    // ── LAYER 1 · THE BASE, REGENERATED AT FIRE TIME ──────────────────────────────
    let baseUnchanged = false;
    const port = opts.port ?? resolvePortFromBridgeJson();
    if (typeof port === 'number' && port > 0) {
      try {
        const endpoint = opts.endpoint ?? `http://127.0.0.1:${port}`;
        baseContent = renderBaseSystemPrompt(endpoint, port);
        baseUnchanged = writeAtomicIfChanged(generatedBasePath, baseContent);
      } catch (err) {
        baseContent = '';
        emit('prompt.base.regen-failed', {
          ulid,
          path: generatedBasePath,
          error: String(err),
        });
      }
    } else {
      emit('prompt.base.regen-skipped', { ulid, reason: 'port-unresolved' });
    }
    if (baseContent.length === 0) {
      // Degrade to whatever the bridge's own startup generation left on disk.
      if (existsSync(generatedBasePath)) {
        try {
          baseContent = readFileSync(generatedBasePath, 'utf8');
        } catch {
          baseContent = '';
        }
      }
      if (baseContent.length === 0) {
        emit('prompt.base-absent', { ulid, path: generatedBasePath });
      }
    }

    // ── THE DESIGNATION · the dual-source rail (registry FIRST, meta.json SECOND) ──
    // D3RM-H (the FrontierTest1 field wound): a registry-only read lost the row between
    // engagements and the re-engage composed BARE. meta.json is birth-stamped.
    let suite8Name = opts.suite8NameOverride;
    let scpName: string | undefined;
    if (suite8Name === undefined || suite8Name.length === 0) {
      let entry: { suite8Name?: string; scpName?: string } | undefined;
      try {
        entry = (await listSessions()).find((s) => s.id === ulid);
      } catch {
        entry = undefined;
      }
      const meta = readSessionMetaSync(ulid);
      suite8Name = entry?.suite8Name ?? meta?.suite8Name;
      scpName = entry?.scpName ?? meta?.scpName;
    }

    // G0 · GENERAL-SKIP · no designation ⇒ the BASE ONLY. A General session never
    // receives the Dock or an Instance.md.
    if (!suite8Name || suite8Name.length === 0) {
      const result = baseOnly(baseUnchanged);
      emit('prompt.assembled', {
        ulid,
        designation: null,
        layers: result.layers,
        layerCount: result.layers.length,
        dockIncluded: false,
        bytes: result.bytes,
        path: result.path ?? null,
        instanceGround: result.instanceGround,
        unchanged: result.unchanged,
        segment,
      });
      return result;
    }

    // ── THE SCP ROOT · door-resolved, else the registry name, else THE OWNING-SCP PROBE ──
    let scpRoot = opts.scpDirOverride;
    if ((!scpRoot || scpRoot.length === 0) && scpName && scpName.length > 0) {
      scpRoot = resolveScpDir(scpName, emit);
    }
    if (!scpRoot || scpRoot.length === 0) {
      // THE OWNING-SCP PROBE (the generated-page identity law): a Shatterite spawn from a
      // GENERATED Suite 8 page carries suite8Name but often NO scpName, so the SCP-LOCAL
      // Instance.md was unreachable and the compose silently degraded to base-only — the
      // bare, identity-less spawn. Probe which installed SCP OWNS the designation.
      const owningRoot = resolveOwningScpRoot(suite8Name);
      if (owningRoot) {
        scpRoot = owningRoot;
        emit('prompt.owning-scp-probe', { ulid, suite8Name, owningRoot });
      }
    }

    // ── LAYER 3 (resolved first, it decides the degrade) · THE INSTANCE.MD LADDER ──
    // C378 · SCP-LOCAL FIRST, WORKSPACE SECOND. A defined-but-absent SCP-local
    // Instance.md must FALL THROUGH to the workspace copy, never drop to base-only.
    const workspaceInstancePath = resolveSuite8InstanceMd(suite8Name);
    const scpLocalInstancePath =
      scpRoot && scpRoot.length > 0 ? resolveSuite8InstanceMd(suite8Name, scpRoot) : undefined;
    let instancePath: string;
    let instanceGround: 'scp-local' | 'workspace' | 'absent';
    if (scpLocalInstancePath && existsSync(scpLocalInstancePath)) {
      instancePath = scpLocalInstancePath;
      instanceGround = 'scp-local';
    } else if (existsSync(workspaceInstancePath)) {
      instancePath = workspaceInstancePath;
      instanceGround = 'workspace';
    } else {
      instancePath = scpLocalInstancePath ?? workspaceInstancePath;
      instanceGround = 'absent';
    }
    emit('prompt.instance.resolve', {
      ulid,
      suite8Name,
      scpRoot: scpRoot ?? null,
      ground: instanceGround,
      resolvedPath: instanceGround === 'absent' ? null : instancePath,
      scpLocalPathTried: scpLocalInstancePath ?? null,
      workspacePathTried: workspaceInstancePath,
    });
    if (instanceGround === 'absent') {
      // Both grounds absent (NDEP mismatch / Suite 8 not installed) → graceful fallback
      // to the plain base prompt. The spawn never breaks.
      emit('prompt.instance-md-missing', {
        ulid,
        suite8Name,
        instancePath,
        scpRoot: scpRoot ?? null,
        scpLocalPathTried: scpLocalInstancePath ?? null,
        workspacePathTried: workspaceInstancePath,
      });
      const degraded = baseOnly(baseUnchanged);
      emit('prompt.assembled', {
        ulid,
        designation: suite8Name,
        layers: degraded.layers,
        layerCount: degraded.layers.length,
        dockIncluded: false,
        bytes: degraded.bytes,
        path: degraded.path ?? null,
        instanceGround: 'absent',
        unchanged: degraded.unchanged,
        segment,
      });
      return { ...degraded, designation: suite8Name };
    }

    // ── LAYER 2 · THE DOCK, STAMPED (C754) ────────────────────────────────────────
    // The bridge KNOWS the designation and — via the owning-SCP probe — the SCP root at
    // compose time; stamp both into the Dock §4 placeholders so the newborn receives its
    // geography as a GIVEN. The discovery ladder in the newborn guard remains the
    // fallback for an unresolved stamp.
    const dock = readDockLayer(emit);
    const dockContent = dock.content
      .split('{{SUITE8_DESIGNATION}}')
      .join(suite8Name)
      .split('{{SCP_ROOT}}')
      .join(
        scpRoot && scpRoot.length > 0
          ? scpRoot
          : 'unresolved at spawn — use the fallback ladder in the newborn guard below',
      );
    const instanceContent = readFileSync(instancePath, 'utf8');

    // ── THE JOIN · base → Dock → Instance · empty layers filtered ─────────────────
    const layerSpecs: Array<{ name: ComposedLayerName; source: string; content: string }> = [
      { name: 'base', source: generatedBasePath, content: baseContent },
      { name: 'dock', source: dock.path ?? '(dock unresolved)', content: dockContent },
      { name: 'instance', source: instancePath, content: instanceContent },
    ];
    const present = layerSpecs.filter((l) => l.content && l.content.length > 0);
    const composed = present.map((l) => l.content).join(LAYER_JOINER);
    const layers: ComposedLayer[] = present.map((l) => ({
      name: l.name,
      source: l.source,
      bytes: Buffer.byteLength(l.content, 'utf8'),
    }));
    const bytes = Buffer.byteLength(composed, 'utf8');

    const outPath = resolveComposedPromptPath(suite8Name);
    // The legacy shared-root twin: announce it once, NEVER delete another writer's
    // artifact. Only meaningful when a segment actually moved the seat.
    const legacyTwin = nodePath.join(
      bridgeRoot(),
      `scs-bridge-suite8-${safeDesignationName(suite8Name)}.generated.md`,
    );
    if (legacyTwin !== outPath && existsSync(legacyTwin) && !announcedLegacyTwins.has(legacyTwin)) {
      announcedLegacyTwins.add(legacyTwin);
      emit('prompt.legacy-root-twin', { ulid, path: legacyTwin, current: outPath });
    }

    let unchanged = false;
    try {
      unchanged = writeAtomicIfChanged(outPath, composed);
    } catch (err) {
      emit('prompt.assemble.write-failed', { ulid, outPath, error: String(err) });
      // Last-good on disk still beats no identity at all; absent ⇒ base-only degrade.
      if (existsSync(outPath)) {
        return {
          path: outPath,
          layers,
          bytes,
          designation: suite8Name,
          instanceGround,
          unchanged: false,
          segment,
        };
      }
      const degraded = baseOnly(baseUnchanged);
      return { ...degraded, designation: suite8Name, instanceGround };
    }

    if (bytes > COMPOSED_SIZE_WARN_BYTES) {
      emit('prompt.size-warn', {
        ulid,
        designation: suite8Name,
        bytes,
        threshold: COMPOSED_SIZE_WARN_BYTES,
        path: outPath,
      });
      console.warn(
        `[composeAppendedSystemPrompt] WARN · ${suite8Name} composed prompt is ${bytes} bytes ` +
          `(> ${COMPOSED_SIZE_WARN_BYTES}) · ${outPath}`,
      );
    }

    emit('prompt.assembled', {
      ulid,
      designation: suite8Name,
      layers,
      layerCount: layers.length,
      dockIncluded: dockContent.length > 0,
      bytes,
      path: outPath,
      instanceGround,
      unchanged,
      segment,
    });

    return {
      path: outPath,
      layers,
      bytes,
      designation: suite8Name,
      instanceGround,
      unchanged,
      segment,
    };
  } catch (err) {
    // THE SESSION PATH NEVER THROWS. Whatever broke, hand back the base if it exists.
    emit('prompt.assemble.error', { ulid, error: String(err) });
    if (baseContent.length === 0 && existsSync(generatedBasePath)) {
      try {
        baseContent = readFileSync(generatedBasePath, 'utf8');
      } catch {
        baseContent = '';
      }
    }
    return baseOnly(false);
  }
}

// The generated base's basename — exported so the Dock View can name the layer's file
// without re-deriving it.
export { GENERATED_BASE_NAME };
