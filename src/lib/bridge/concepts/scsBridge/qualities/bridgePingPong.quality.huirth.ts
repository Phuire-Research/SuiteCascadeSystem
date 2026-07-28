/**
 * bridgePingPong Quality — SCS-Bridge Huirth (PP-D2 · PPLD)
 *
 * Stateless MCP Pong handler. Receives Ping payload {clientId, timestamp},
 * reads current bridge.json from disk, appends pongReceipt field (Option β),
 * writes updated bridge.json atomically, returns {ok: true} ack.
 *
 * State flows via filesystem-as-Bidirectional-Bridge:
 *   SCS-Bridge writes pongReceipt to bridge.json
 *   → SCP huirth scsBridgeJsonWatcher fs.watch fires
 *   → Cycle 155 BJDP broadcasts BridgeJsonShape (with pongReceipt) to Client
 *   → Client interprets pongReceipt via setBridgeJsonRelay
 *
 * HTTP response is ack-only (HAZARD-D dissolved · Client does not parse response
 * for state). bridgeStatus flip is Client-side (Ochre-C bridgeActive computed).
 *
 * TQNI invariant: type string 'Scs Bridge Ping Pong' matches qualityName key
 * 'scsBridgePingPong' in buildToolRoster() pingPongMetadata (R2 Rust Frontier 3 ·
 * QMTR pattern).
 *
 * Pattern: M63 Copy-Paste-Plus from triggerHardTurnOver.quality.huirth.diameter.ts
 * Citation: PPLD-DIAMOND-2-WAVE2-OCHRE-A-SCS-BRIDGE-BLUEPRINT.md §5
 */
import {
  createQualityCardWithPayload,
  createAsyncMethod,
  nullReducer,
  selectPayload,
  muxiumConclude,
  strategySuccess,
} from 'stratimux';
import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { ScsBridgeState, ScsBridgePingPongPayload } from '../scsBridge.types';
import {
  bridgeMetadataPathPerProject,
  type BridgeMetadata,
  type BridgePongReceipt,
} from '../../../bridgeMetadata';

export const scsBridgePingPong = createQualityCardWithPayload<
  ScsBridgeState,
  ScsBridgePingPongPayload
>({
  type: 'Scs Bridge Ping Pong',
  reducer: nullReducer,
  methodCreator: () =>
    createAsyncMethod(({ action, controller }) => {
      const payload = selectPayload<ScsBridgePingPongPayload>(action);
      const clientId = payload?.clientId ?? 'unknown';

      console.log('[SCS-Bridge] bridge_ping_pong · received from clientId:', clientId);

      const doWrite = async (): Promise<void> => {
        const bridgeJsonPath = bridgeMetadataPathPerProject(process.cwd());
        const tmpPath = `${bridgeJsonPath}.pong.tmp`;

        // Cobalt-FSGT · Cycle 160 R14 · log every bridge.json access site.
        // Path source: bridgeMetadataPathPerProject(process.cwd()) where
        // process.cwd() = SCS root (set by bootBridgeDaemon userCwd · RBJP).
        // Should match the junction path the SCP huirth watcher reads.
        console.log(
          '[SCS-Bridge PingPong] read · bridge.json access · path=',
          bridgeJsonPath,
        );
        let existing: BridgeMetadata | null = null;
        try {
          const raw = await readFile(bridgeJsonPath, 'utf-8');
          existing = JSON.parse(raw) as BridgeMetadata;
        } catch {
          // bridge.json absent — write pongReceipt anyway with minimal shape
        }

        const pongReceipt: BridgePongReceipt = {
          clientId,
          respondedAt: Date.now(),
          bridgeVersion: existing?.bridgeVersion ?? 'unknown',
        };

        const updated: BridgeMetadata = {
          ...(existing ?? {
            schemaVersion: 1 as const,
            bridgeVersion: 'unknown',
            writtenAt: Date.now(),
            port: 0,
            endpoint: '',
            userCwd: process.cwd(),
            boundScps: {},
            installedScps: [],
          }),
          pongReceipt,
        };

        // Cobalt-FSGT · Cycle 160 R14 · log every bridge.json write site.
        console.log(
          '[SCS-Bridge PingPong] write · bridge.json access · path=',
          bridgeJsonPath,
        );
        await mkdir(dirname(bridgeJsonPath), { recursive: true });
        await writeFile(tmpPath, JSON.stringify(updated, null, 2), 'utf-8');
        await rename(tmpPath, bridgeJsonPath);

        console.log(
          '[SCS-Bridge] bridge_ping_pong · pongReceipt written · clientId:',
          clientId,
          '· respondedAt:',
          pongReceipt.respondedAt,
        );
      };

      doWrite()
        .then(() => {
          // C291: honor action.strategy — the C287 manifold tail (scpExtractAndSendResponse)
          // rides successNode; unconditional muxiumConclude() starved the stored response.
          controller.fire(action.strategy ? strategySuccess(action.strategy) : muxiumConclude());
        })
        .catch((err: Error) => {
          console.error('[SCS-Bridge] bridge_ping_pong · write failed:', err.message);
          controller.fire(action.strategy ? strategySuccess(action.strategy) : muxiumConclude());
        });
    }),
});
