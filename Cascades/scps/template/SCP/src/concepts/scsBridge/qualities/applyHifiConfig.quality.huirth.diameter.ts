/**
 * applyHifiConfig Quality — Huirth Real (Diametric counterpart of the client Induction)
 *
 * D-PCL · THE ROUND-TRIP COLOR CIRCUIT (PCL-1 (b) THE SHIP-TRUTH WRITE + PCL-2 THE BROADCAST LEG).
 *
 * The Client Induction (applyHifiConfig.quality.client.diameter.ts) routes a color click's sparse
 * per-spectrum hex map to actionQue; the webSocketClient principle sends it; this Real receives it by
 * type-string lookup ('Scs Bridge Apply Hifi Config' · actionExchange.clientToServer) and:
 *
 *   1. THE SHIP-TRUTH WRITE — merge-writes the color map AND the pattern-id map (D-PSVG · PSVG-2 ·
 *      the patterns leg) into <cwd>/Cascades/hifiConfig.json (merge-NOT-clobber: reads the existing
 *      JSON, overlays only the incoming `colors` + `patterns`, preserves `schemaVersion` + every
 *      unknown key). Atomic RMW (read → merge → write tmp → rename · the applyTerminalRenderMode
 *      idiom). The JSON is the durable truth every turn-over reads. Pattern VALIDATION: key ∈
 *      SPECTRUM_KEYS + id RESOLVABLE on THIS server (the in-code factory floor ∪ the JSON library ·
 *      readPatternLibrary(process.cwd())) — an id in neither SKIPS with a named telemetry reason,
 *      never a throw. Ids ONLY ride this payload (never css) — the css injection gate
 *      (isValidPatternCss) fires at the LIBRARY boundaries (seed + registerRuntimePatterns), so an
 *      id resolving here already names a gated css value. An EMPTY payload (neither leg present)
 *      no-ops with a named skip — no write, no broadcast.
 *
 *   2. THE BROADCAST LEG (Zero-Knowledge Handoff) — broadcasts the FRESH merged config to ALL
 *      connected clients via the return SET quality (scsBridgeSetHifiConfigRelay), carried IN the
 *      broadcast payload (one fewer round · no client re-GET of /hifi-config). muxiumTimeOut schedules
 *      the broadcast OUTSIDE the ActionController scope (controller.fire would close it prematurely) —
 *      the notificationBridge.model notifyAllClients pattern. Then the Real HALTS (returns · holds no
 *      state · the halting conclusion). Each client's setHifiConfigRelay re-runs the boot precedence
 *      and re-tints. The clicking window paints NO EARLIER than the rest — the round-trip law.
 *
 * The color is not render-state → nullReducer (shortest-path per Scholar S12). The work lives in the
 * method (createMethodWithConcepts · gains concepts_/deck for the cross-concept muxiumTimeOut dispatch).
 *
 * Type-string source of truth: 'Scs Bridge Apply Hifi Config' (Verbose Split · exact match to the
 *   Client Induction + the actionExchange.clientToServer entry · AESR pattern).
 *
 * Citation: sendBridgeMessage.quality.huirth.diameter.ts (scs:highlight branch · the broadcast idiom
 *   this mirrors verbatim · muxiumTimeOut → webSocketServerAppendToActionQue · no routing key = broadcast)
 * Citation: notification/qualities/helloWorld.quality.huirth.diameter.ts (canonical Diameter Real exemplar)
 * Citation: notification/model/notificationBridge.model.ts (muxiumTimeOut cross-concept dispatch · notifyAllClients)
 * Citation: S4-PCL-GROUND.md §3 (merge-not-clobber · preserve patterns + schemaVersion)
 */
import { resolveScpCascadesHifiConfigPath } from '../bridgeRoot.model';
// D-PSVG · PSVG-2 · the patterns leg's id-resolution pair — the in-code factory floor + the JSON
// library read (both SSR/server-safe: the pattern models guard their browser touches; the vue
// principle already imports this chain for the boot seed, so the server bundle carries it today).
import { readPatternLibrary } from '../../../model/patternLibrary.model';
import { PATTERN_LIBRARY } from '../../../model/suitePatternOverride.model';
import {
  createQualityCardWithPayload,
  createMethodWithConcepts,
  muxiumTimeOut,
  nullReducer,
  selectPayload,
  strategySuccess,
  type Concepts,
  type Action,
  type AnyAction,
} from 'stratimux';
import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import path from 'node:path';
import type { HifiConfig } from '../../../model/hifiConfig.model';
import type {
  ScsBridgeHuirthState,
  ScsBridgeApplyHifiConfigPayload,
  ScsBridgeSetHifiConfigRelayPayload,
} from '../scsBridge.type';

// The 8 SPECTRUM tokens (mirror of suiteColorOverride.model SPECTRUM_NAMES — the SCP cannot import a
// browser-guarded model into the Huirth quality without the documentElement side effects riding along;
// this is the pure validation set). Guards the disk write against junk keys.
const SPECTRUM_KEYS = new Set<string>([
  'base', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'fuchsia',
]);

// `#rrggbb` (with-or-without leading #) shape guard — mirrors suiteColorOverride.model parseHex.
const HEX_RE = /^#?[0-9a-fA-F]{6}$/;

// The own-SCP shipped-HiFi JSON — <cwd>/Cascades/hifiConfig.json (the /hifi-config GET's own path ·
// vue.principle.ts:2431 · the C465/C872 rule: cwd IS the package · the SCP's OWN Cascades, never the
// workspace ancestor). resolveScpCascadesHifiConfigPath centralizes this so the write and the GET agree.
const HIFI_CONFIG_PATH = resolveScpCascadesHifiConfigPath();
const DEFAULT_SCHEMA_VERSION = '1.0.0';

// Deck view for the muxiumTimeOut cross-concept broadcast — mirrors the sendBridgeMessage Huirth deck
// (scsBridge relay emitter + webSocketServer append-que emitter · both loaded in the Huirth Muxium).
type ScsBridgeApplyHifiConfigHuirthDeck = {
  scsBridge: {
    e: {
      scsBridgeSetHifiConfigRelay: (payload: ScsBridgeSetHifiConfigRelayPayload) => Action;
    };
  };
  webSocketServer: {
    e: {
      webSocketServerAppendToActionQue: (payload: {
        actionQue: AnyAction[];
        targetClientStateKey?: string;
        targetConnectionId?: string;
      }) => Action;
    };
  };
};

// D-PSVG · PSVG-2 · THE PATTERN-ID RESOLUTION SET — the ids THIS server can honestly write: the
// in-code factory floor (PATTERN_LIBRARY) ∪ the SCP's JSON library (Cascades/patternLibrary.json ·
// read FRESH per write so a just-dropped JSON entry is honored without a restart). An id in neither
// SKIPS with a named reason — the silent-skip masquerade is the carded risk this validation names.
function resolvableTargetPatternIds(): Set<string> {
  const ids = new Set<string>(PATTERN_LIBRARY.map((entry) => entry.id));
  const library = readPatternLibrary(process.cwd());
  for (const entry of library?.patterns ?? []) ids.add(entry.id);
  return ids;
}

// THE SHIP-TRUTH WRITE · atomic read-modify-write of hifiConfig.json.colors + .patterns (mirrors
// applyTerminalRenderMode's RMW). MERGE-NOT-CLOBBER: overlay only the incoming spectrum hexes onto
// the existing `colors` and the incoming pattern ids onto the existing `patterns`; preserve
// `schemaVersion` + every other key. Returns the MERGED config so the broadcast carries the
// ship-truth verbatim. On read failure (ENOENT / malformed) start from an empty config so a first
// write still lands. (D-PSVG · PSVG-2 · renamed from mergeWriteHifiColors — the file-local honest
// name for a function now carrying BOTH legs; zero external ripple, the function was never exported.)
async function mergeWriteHifiConfig(
  colors: Record<string, string>,
  patterns: Record<string, string>,
): Promise<HifiConfig> {
  let existing: HifiConfig = { schemaVersion: DEFAULT_SCHEMA_VERSION };
  try {
    const raw = await readFile(HIFI_CONFIG_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      existing = parsed as HifiConfig;
    }
  } catch {
    // absent / unreadable / malformed → start fresh (a first color write still lands)
  }

  // Validate + collect the incoming spectrum hexes (drop junk keys / malformed hex — never write junk).
  const cleanColors: Record<string, string> = {};
  for (const [k, v] of Object.entries(colors ?? {})) {
    if (SPECTRUM_KEYS.has(k) && typeof v === 'string' && HEX_RE.test(v.trim())) {
      cleanColors[k] = v.trim();
    }
  }

  // D-PSVG · PSVG-2 · validate + collect the incoming pattern ids — key ∈ SPECTRUM_KEYS + id
  // resolvable on THIS server (in-code ∪ JSON library). A failing entry SKIPS with a NAMED reason
  // (never a throw · never a silent drop). css never rides this payload — ids only.
  const cleanPatterns: Record<string, string> = {};
  const resolvableIds = resolvableTargetPatternIds();
  for (const [k, v] of Object.entries(patterns ?? {})) {
    const id = typeof v === 'string' ? v.trim() : '';
    if (!SPECTRUM_KEYS.has(k)) {
      console.warn('[SCS-Bridge applyHifiConfig] pattern.skip', { key: k, id, reason: 'unknown-spectrum-key' });
      continue;
    }
    if (id.length === 0) {
      console.warn('[SCS-Bridge applyHifiConfig] pattern.skip', { key: k, id, reason: 'empty-id' });
      continue;
    }
    if (!resolvableIds.has(id)) {
      console.warn('[SCS-Bridge applyHifiConfig] pattern.skip', { key: k, id, reason: 'id-unresolvable-on-this-server' });
      continue;
    }
    cleanPatterns[k] = id;
  }

  // Merge-not-clobber: existing.colors/.patterns first, incoming overlaid on top; every other key
  // preserved (the patterns leg mirrors the colors leg shape-for-shape).
  const merged: HifiConfig = {
    ...existing,
    schemaVersion: existing.schemaVersion ?? DEFAULT_SCHEMA_VERSION,
    colors: {
      ...(existing.colors ?? {}),
      ...cleanColors,
    },
    patterns: {
      ...(existing.patterns ?? {}),
      ...cleanPatterns,
    },
  };

  const tmpPath = `${HIFI_CONFIG_PATH}.hificolor.tmp`;
  try {
    await mkdir(path.dirname(HIFI_CONFIG_PATH), { recursive: true });
    await writeFile(tmpPath, JSON.stringify(merged, null, 2), 'utf-8');
    await rename(tmpPath, HIFI_CONFIG_PATH);
    console.log(
      '[SCS-Bridge applyHifiConfig] hifiConfig.json merge-written · spectra=',
      Object.keys(cleanColors).length,
      '· patterns=',
      Object.keys(cleanPatterns).length,
      '· path=',
      HIFI_CONFIG_PATH,
    );
  } catch (err) {
    console.error('[SCS-Bridge applyHifiConfig] hifiConfig.json write failed:', err);
  }
  return merged;
}

export const scsBridgeApplyHifiConfig = createQualityCardWithPayload<
  ScsBridgeHuirthState,
  ScsBridgeApplyHifiConfigPayload
>({
  type: 'Scs Bridge Apply Hifi Config',
  reducer: nullReducer,
  methodCreator: () =>
    createMethodWithConcepts(({ action, concepts_, deck }) => {
      const huirthDeck = deck as unknown as ScsBridgeApplyHifiConfigHuirthDeck;
      const payload = (selectPayload<ScsBridgeApplyHifiConfigPayload>(action) ??
        {}) as ScsBridgeApplyHifiConfigPayload;
      const colors = payload.scsBridgeHifiColors ?? {};
      const patterns = payload.scsBridgeHifiPatterns ?? {};

      // D-PSVG · PSVG-2 · THE EMPTY-PAYLOAD NO-OP (both legs optional → the honest guard): neither
      // colors nor patterns present → NAMED skip, no write, no broadcast (a junk arrival must not
      // clobber-touch the ship truth anor wake every client for nothing).
      if (Object.keys(colors).length === 0 && Object.keys(patterns).length === 0) {
        console.warn(
          '[SCS-Bridge applyHifiConfig] empty-payload.skip · neither colors nor patterns present · no write, no broadcast',
        );
        if (action.strategy) {
          return strategySuccess(action.strategy);
        }
        return action as unknown as Action;
      }

      // 1. THE SHIP-TRUTH WRITE → 2. THE BROADCAST LEG (Zero-Knowledge Handoff · broadcast → halt).
      // mergeWriteHifiConfig returns the FRESH merged config; the broadcast carries it verbatim so
      // every client applies the identical post-merge truth. muxiumTimeOut (NOT controller.fire) keeps
      // the ActionController open for strategySuccess; the dispatch re-enters the Muxium 30ms later.
      // No routing key on webSocketServerAppendToActionQue = BROADCAST to ALL connected clients.
      mergeWriteHifiConfig(colors, patterns)
        .then((merged) => {
          const relayAction = huirthDeck.scsBridge.e.scsBridgeSetHifiConfigRelay({
            scsBridgeHifiConfig: merged,
          });
          muxiumTimeOut(
            concepts_ as Concepts,
            () =>
              huirthDeck.webSocketServer.e.webSocketServerAppendToActionQue({
                actionQue: [relayAction],
              }),
            30,
          );
          console.log(
            '[SCS-Bridge applyHifiConfig] broadcast queued (round-trip return) · colors=',
            Object.keys(merged.colors ?? {}).length,
          );
        })
        .catch((err: Error) => {
          console.error('[SCS-Bridge applyHifiConfig] merge-write → broadcast chain failed:', err.message);
        });

      // Strategy continuation preserved (plain-action arrivals pass through unchanged).
      if (action.strategy) {
        return strategySuccess(action.strategy);
      }
      return action as unknown as Action;
    }),
});
