/**
 * applyHifiConfig Quality — Huirth Real (Diametric counterpart of the client Induction)
 *
 * D-PCL · THE ROUND-TRIP COLOR CIRCUIT (PCL-1 (b) THE SHIP-TRUTH WRITE + PCL-2 THE BROADCAST LEG).
 *
 * The Client Induction (applyHifiConfig.quality.client.diameter.ts) routes a color click's sparse
 * per-spectrum hex map to actionQue; the webSocketClient principle sends it; this Real receives it by
 * type-string lookup ('Scs Bridge Apply Hifi Config' · actionExchange.clientToServer) and:
 *
 *   1. THE SHIP-TRUTH WRITE — merge-writes the color map into <cwd>/Cascades/hifiConfig.json
 *      (merge-NOT-clobber: reads the existing JSON, overlays only the incoming `colors`, preserves
 *      `patterns` + `schemaVersion` + every unknown key). Atomic RMW (read → merge → write tmp →
 *      rename · the applyTerminalRenderMode idiom). The JSON is the durable truth every turn-over reads.
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

// THE SHIP-TRUTH WRITE · atomic read-modify-write of hifiConfig.json.colors (mirrors
// applyTerminalRenderMode's RMW). MERGE-NOT-CLOBBER: overlay only the incoming spectrum hexes onto the
// existing `colors`, preserve `patterns` + `schemaVersion` + every other key. Returns the MERGED config
// so the broadcast carries the ship-truth verbatim. On read failure (ENOENT / malformed) start from an
// empty-colors config so a first write still lands.
async function mergeWriteHifiColors(
  colors: Record<string, string>,
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

  // Merge-not-clobber: existing.colors first, incoming overlaid on top; every other key preserved.
  const merged: HifiConfig = {
    ...existing,
    schemaVersion: existing.schemaVersion ?? DEFAULT_SCHEMA_VERSION,
    colors: {
      ...(existing.colors ?? {}),
      ...cleanColors,
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
        { scsBridgeHifiColors: {} }) as ScsBridgeApplyHifiConfigPayload;
      const colors = payload.scsBridgeHifiColors ?? {};

      // 1. THE SHIP-TRUTH WRITE → 2. THE BROADCAST LEG (Zero-Knowledge Handoff · broadcast → halt).
      // mergeWriteHifiColors returns the FRESH merged config; the broadcast carries it verbatim so
      // every client applies the identical post-merge truth. muxiumTimeOut (NOT controller.fire) keeps
      // the ActionController open for strategySuccess; the dispatch re-enters the Muxium 30ms later.
      // No routing key on webSocketServerAppendToActionQue = BROADCAST to ALL connected clients.
      mergeWriteHifiColors(colors)
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
