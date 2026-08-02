/**
 * gitmScpUpdateStageRelay Quality · SCP-UPD D-U4.3 (Fork C) · NODE 3 (Concluder)
 *
 * The terminal strategy node (no successNode → the Halting-Complete Concluder). Reads
 * the diff JSON NODE 2 wrote (Cascades/Bridge/scp-update-diff.<name>.json) and stamps
 * the relay to the FINAL determined outcome the client reacts to:
 *   stage='reviewing' · diffPresent=true · summary{apply,preserve,conference,collisionZones}
 *   · generatedAt.
 *
 * The Concluder test (CLAUDE.md §C4): the diff JSON exists on disk. Its summary counts
 * + generatedAt ride gitm.json (the α relay, D-U4.1) → the SCP gitmJson.updateStatus →
 * the Vue stage rail flips to 'reviewing'. No client plan — the relay IS the surface.
 *
 * Read-only: this node only READS the JSON the script already wrote; it never touches
 * the SCP working tree. On a missing/unparseable JSON it stamps stage='error'.
 *
 * Template: gitmPull.quality.ts (bucket + partial reducer + muxiumConclude tail).
 * Citation: SCP-UPD-D-U4-GND-ACTIONSTRATEGY.md §3 (NODE 3) + §7 (Concluder) + §6
 *   (the relay stamps the FINAL outcome the client reacts to · no client plan).
 */

import { readFileSync } from 'node:fs';
import { log } from '../../../debugLog';
import { join, basename } from 'node:path';
import {
  createQualityCardWithPayload,
  createMethodWithConcepts,
  muxiumConclude,
  strategySuccess,
  strategyData_select,
  selectPayload,
  type Concept,
} from 'stratimux';
import type { GitmState, UpdateStatusShape } from '../gitm.types';
import { stampSliceUpdateStatus } from '../model/gitmSliceStore.model';
import type {
  GitmScpUpdateStageRelayPayload,
  GitmScpUpdateStageRelay,
  GitmScpUpdateDiffStrategyData,
} from './types';

export type { GitmScpUpdateStageRelay };

type GitmSelfDeck = {
  gitm: Concept<GitmState, Record<string, unknown>>;
};

// The summary slice the relay stamps (the script's diff JSON `summary` shape).
type DiffSummary = {
  apply: number;
  preserve: number;
  conference: number;
  collisionZones: string[];
};
type RelayBucketItem =
  | { ok: true; summary: DiffSummary; generatedAt: string; targetDir: string }
  | { ok: false; error: string; targetDir: string };
const bucket: RelayBucketItem[] = [];

export const gitmScpUpdateStageRelay = createQualityCardWithPayload<
  GitmState,
  GitmScpUpdateStageRelayPayload,
  GitmSelfDeck
>({
  type: 'Gitm Scp Update Stage Relay',
  reducer: (state) => {
    const item = bucket.pop();
    if (!item) {
      return {};
    }
    // RS.4 · THE PER-SCP RAIL — stamp the TARGET's slice; flat is the ACTIVE projection.
    const stamp = item.ok
      ? {
          stage: 'reviewing' as const,
          stageError: '',
          diffPresent: true,
          summary: item.summary,
          generatedAt: item.generatedAt,
        }
      : { stage: 'error' as const, stageError: item.error };
    stampSliceUpdateStatus(item.targetDir, stamp);
    if (item.targetDir !== '' && item.targetDir !== state.activeScpDir) {
      return { updateRailTick: state.updateRailTick + 1 };
    }
    if (!item.ok) {
      const updateStatus: UpdateStatusShape = {
        ...state.updateStatus,
        stage: 'error',
        stageError: item.error,
      };
      return { updateStatus, errorCode: 'update-relay-failed', errorMessage: item.error };
    }
    const updateStatus: UpdateStatusShape = {
      ...state.updateStatus,
      ...stamp,
    };
    return { updateStatus };
  },
  methodCreator: () =>
    createMethodWithConcepts(({ action, deck }) => {
      const activeScpDir = deck.gitm.k.activeScpDir.select();
      const userCwd = deck.gitm.k.userCwd.select();
      // RS.4 — identity rides the node payload (Begin resolved once); the strategyData +
      // state fallbacks remain for a payload-less legacy dispatch only.
      const payload = selectPayload<GitmScpUpdateStageRelayPayload>(action);
      const targetDir =
        payload?.targetScpDir && payload.targetScpDir !== ''
          ? payload.targetScpDir
          : activeScpDir;
      const diffData = action.strategy
        ? strategyData_select<GitmScpUpdateDiffStrategyData>(action.strategy)
        : undefined;
      const stateScpName = deck.gitm.k.updateStatus.select().scpName;
      const scpName =
        payload?.scpName && payload.scpName !== ''
          ? payload.scpName
          : diffData?.scpName && diffData.scpName !== ''
            ? diffData.scpName
            : stateScpName !== ''
              ? stateScpName
              : basename(activeScpDir !== '' ? activeScpDir : userCwd);

      log('gitm.update.stage-relay.entry', { scpName });
      const diffPath = join(userCwd, 'Cascades', 'Bridge', `scp-update-diff.${scpName}.json`);
      try {
        const raw = readFileSync(diffPath, 'utf8');
        const parsed = JSON.parse(raw) as {
          summary?: Partial<DiffSummary>;
          generatedAt?: string;
        };
        const s = parsed.summary ?? {};
        const summary: DiffSummary = {
          apply: typeof s.apply === 'number' ? s.apply : 0,
          preserve: typeof s.preserve === 'number' ? s.preserve : 0,
          conference: typeof s.conference === 'number' ? s.conference : 0,
          collisionZones: Array.isArray(s.collisionZones) ? s.collisionZones : [],
        };
        const generatedAt = typeof parsed.generatedAt === 'string' ? parsed.generatedAt : '';
        bucket.push({ ok: true, summary, generatedAt, targetDir });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        bucket.push({ ok: false, error: `update relay: ${message}`, targetDir });
      }
      // Concluder: no successNode follows; the strategy is exhausted after this fire.
      return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
    }),
});
