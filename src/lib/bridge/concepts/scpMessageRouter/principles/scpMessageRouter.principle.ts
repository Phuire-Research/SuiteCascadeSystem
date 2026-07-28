/**
 * scpMessageRouter Principle · Phase B.2 · Cycle 130
 *   + STCP BOCR FIX: the F2 closure-consume is a SEPARATE STANDALONE PLAN
 *     (closureConsumePlan) — NOT a tail stage of watcherPlan. A tail stage behind
 *     non-iterating bind stages never runs (the stage pointer parks at Stage 1); the
 *     proven fix mirrors scpRegistryWatcher's single-stage selector plan + the gitm
 *     standing-watcher standalone plans (gitmBootReportWatch.principle.ts).
 *
 * watcherPlan · selector-driven stages:
 *
 *   Stage 1: subscribes to k.bridgeJsonWatcher. When transitioning from null →
 *     FSWatcher, binds 'add'/'change' handlers. Handler: readFile + JSON.parse
 *     safely + dispatch scpMessageRouterBridgeJsonReceived({ content }).
 *
 *   Stage 2: subscribes to k.sessionsDirWatcher. When transitioning from null →
 *     FSWatcher, binds 'add' handler. Handler: regex-filter
 *     /sessions\/heads\/.+\.json$/ + readFile + JSON.parse safely + extract
 *     ulid/kind/scpName + dispatch scpMessageRouterBmrEnvelopeReceived(...).
 *
 * Two WGHA WeakSets (one per watcher kind) prevent duplicate handler binding
 * across plan re-fires. Separate names for clearer telemetry.
 *
 * R4 Bidirectional §3 enhancement: kind.trim() strips whitespace pollution.
 *
 * Template: B.1 scpRegistryWatcher.principle.ts (selector-driven WGHA pattern)
 *           ADMIN_ICP claudeBridgeSessionWatcher.principle.huirth.ts (chokidar bind)
 *
 * Citation: M59 (no actionQue cross-Concept) · M60 · M62 (handlers fire AFTER
 *           Reducer commit) · M63
 * Citation: SUITE-1-RED-B2-MSGROUTER-CURATION.md §2 Cards 3, 4, 5, 8
 * Citation: SUITE-2-ORANGE-B2-MSGROUTER-NAMING.md §6 (WeakSet naming)
 * Citation: SUITE-3-YELLOW-B2-MSGROUTER-BLUEPRINT.md §3.6
 * Citation: SUITE-4-GREEN-B2-MSGROUTER-BIDIRECTIONAL.md §10 Amendment 1 (kind.trim())
 */

import type { PrincipleFunction } from 'stratimux';
import type { FSWatcher } from 'chokidar';
import { readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
// RA-1 · THE RE-ADOPTION SWEEP — the /scp-config identity probe (now-liveness + identity in one
// round-trip) + the persisted-status re-align on a successful re-adopt.
import { get as httpGet } from 'node:http';
import { setScpStatus } from '../../../scpSessionRegistry';
import type { ScpMessageRouterState } from '../scpMessageRouter.type';
import type { ScpMessageRouterQualities } from '../scpMessageRouter.concept';
import { log } from '../../../debugLog';
// F1 · THE BOOT BACKFILL · registryPath() = bridgeRoot()/sessions.json — the watched
// file AND the electron-side F1 writer target (M73 Path-Diameter-Pairing-Doctrine).
import { registryPath } from '../../../paths';

// WGHA · separate WeakSets per watcher kind for clearer telemetry
const boundBridgeJsonWatchers = new WeakSet<FSWatcher>();
const boundSessionsDirWatchers = new WeakSet<FSWatcher>();
// B.7 Regression #4 Hotfix · M73 Path-Diameter-Pairing-Doctrine
const boundBridgeSessionsDirWatchers = new WeakSet<FSWatcher>();
// F2 · SCP-WINDOW-CLOSURE-CONSUME · WeakSet gating the sessionsJson watcher handler bind.
const boundSessionsJsonWatchers = new WeakSet<FSWatcher>();
// PSSM · W0/W5 · WeakSet gating the scpsJson (SCPs.json status) watcher handler bind.
const boundScpsJsonWatchers = new WeakSet<FSWatcher>();
// PSSM · W5 · last persisted status this daemon has DERIVED a row transition from, keyed by
// scpName. An edge-detector: only a status that CHANGED from the last-seen value dispatches a
// lifecycle transition, so a re-write of the same status (or an unrelated SCPs.json field edit —
// windowId, sessions) does NOT re-drive the row. The spawn path (W3 'live') and this consumer
// (W5 'pending' → WindowClosed) both reconcile against the persisted status as the single source.
const lastDerivedScpStatus = new Map<string, 'live' | 'pending'>();

// F2 · SCP-WINDOW-CLOSURE-CONSUME · module-scope watermark. The highest closedAt this
// daemon has already consumed (dispatched scpLifecycleWindowClosed for). Every sessions.json
// 'change' re-reads registry.scpWindowClosures and processes ONLY records with
// closedAt > scpWindowClosureWatermark, then advances the watermark to the max seen. This
// dedupes the F1 electron-side APPEND-and-cap array WITHOUT writing back (no write-loop —
// the writer is the sole electron process; the daemon only reads). Module-scope matches the
// host convention (bound*Watchers WeakSets, ENVELOPE_PATH_REGEX consts are module-scope);
// a fresh daemon boot starts at 0 and any pre-boot closure re-fires once (benign — the
// scpLifecycleWindowClosed reducer guard no-ops unless fsm is booting|ready|degraded).
let scpWindowClosureWatermark = 0;

// Envelope file path regex — matches Cascades/scps/{scpName}/sessions/heads/*.json
const ENVELOPE_PATH_REGEX = /sessions\/heads\/[^/]+\.json$/;

// B.7 Regression #4 Hotfix · matches Cascades/Bridge/sessions/{tuiSessionId}/heads/*.json
// Note: bridge-side envelopes carry scpName in JSON content (not in path).
// M73 Path-Diameter-Pairing-Doctrine: pairs with paths.ts `priorityDir`.
const BRIDGE_ENVELOPE_PATH_REGEX = /Cascades\/Bridge\/sessions\/[^/]+\/heads\/[^/]+\.json$/;

export const scpMessageRouterPrinciple: PrincipleFunction<
  ScpMessageRouterQualities,
  void,
  ScpMessageRouterState
> = ({ k_, d_, nextA, plan }) => {
  // Self-deck cast for action creator access in handlers.
  // B.4 R5 L.13: widened to include scpSpawnManager.HeartbeatReceived for LOCK 4
  // option β — Stage 2 'add' handler emits a SECOND nextA on kind === 'heartbeat'.
  // Manual TypeScript cast (zero runtime effect); property names MUST match the
  // Quality types verbatim (R4 F4 risk: typo silently succeeds at cast level).
  const selfDeck = d_ as unknown as {
    scpMessageRouter: {
      e: {
        scpMessageRouterBridgeJsonReceived: (payload: { content: unknown }) => unknown;
        scpMessageRouterBmrEnvelopeReceived: (payload: {
          envelopePath: string;
          ulid: string;
          kind: string;
          scpName: string;
          payload: unknown;
        }) => unknown;
      };
    };
    scpSpawnManager: {
      e: {
        scpSpawnManagerHeartbeatReceived: (payload: {
          scpName: string;
          heartbeatUlid: string;
          receivedAt: number;
        }) => unknown;
        // Server-Close Cure · Stage 4 closure-consume dispatches this AFTER
        // WindowClosed to kill the SCP's dedicated child process (SIGTERM). The
        // 'exit' handler then re-seats the row at 'pending'.
        scpSpawnManagerKillRequested: (payload: {
          scpName: string;
        }) => unknown;
      };
    };
    // F2 · SCP-WINDOW-CLOSURE-CONSUME · sibling scpLifecycle face. scpLifecycle,
    // scpSpawnManager, and scpMessageRouter are all muxified as siblings under the `scp`
    // base (scp.concept.ts muxifyConcepts) — flat Tier-2 composition, so this principle's
    // d_ reaches every sibling's `.e` action creators (the same access the existing
    // scpSpawnManager.HeartbeatReceived nextA above already exploits, and the same surface
    // BmrEnvelopeReceived.Method uses via ScpMessageRouterDownstreamDeck). The Stage 4
    // handler dispatches WindowClosed here to drive the surface to 'pending'.
    scpLifecycle: {
      e: {
        scpLifecycleWindowClosed: (payload: {
          scpName: string;
          closedAt: number;
        }) => unknown;
        // RA-1 · the re-adoption sweep's write leg (registered→ready without a spawn).
        scpLifecycleReAdopt: (payload: {
          scpName: string;
          port: number;
          reAdoptedAt: number;
        }) => unknown;
      };
    };
  };

  // RA-2b · the standing re-adoption beat's handle (armed in the status-consume plan · retired
  // with the principle teardown).
  let reAdoptionInterval: ReturnType<typeof setInterval> | null = null;

  const watcherPlan = plan('Scp Message Router Watcher Bind', ({ stage, conclude }) => [
    // ────────────────────────────────────────────
    // STAGE 1: bridgeJsonWatcher handler bind
    // ────────────────────────────────────────────
    stage(({ k }) => {
      const watcher = k.bridgeJsonWatcher.select();
      if (watcher === null) return;
      if (boundBridgeJsonWatchers.has(watcher)) return;

      console.log('[Scp Message Router Principle] Binding handlers to bridgeJsonWatcher');
      boundBridgeJsonWatchers.add(watcher);

      const handleBridgeJsonEvent = (filePath: string) => {
        let raw: string;
        try {
          raw = readFileSync(filePath, 'utf-8');
        } catch (err) {
          console.error('[Scp Message Router] readFileSync bridge.json failed:', err);
          return;
        }
        let content: unknown;
        try {
          content = JSON.parse(raw);
        } catch (err) {
          console.error('[Scp Message Router] JSON.parse bridge.json failed:', err);
          return;
        }
        console.log('[Scp Message Router] bridge.json event:', filePath);
        nextA(selfDeck.scpMessageRouter.e.scpMessageRouterBridgeJsonReceived({ content }) as never);
      };

      watcher.on('add', handleBridgeJsonEvent);
      watcher.on('change', handleBridgeJsonEvent);
    }, {
      selectors: [k_.bridgeJsonWatcher],
      beat: 5,
    }),

    // ────────────────────────────────────────────
    // STAGE 2: sessionsDirWatcher handler bind
    // ────────────────────────────────────────────
    stage(({ k }) => {
      const watcher = k.sessionsDirWatcher.select();
      if (watcher === null) return;
      if (boundSessionsDirWatchers.has(watcher)) return;

      console.log('[Scp Message Router Principle] Binding handlers to sessionsDirWatcher');
      boundSessionsDirWatchers.add(watcher);

      watcher.on('add', (filePath: string) => {
        if (!ENVELOPE_PATH_REGEX.test(filePath)) return;

        let raw: string;
        try {
          raw = readFileSync(filePath, 'utf-8');
        } catch (err) {
          console.error('[Scp Message Router] readFileSync envelope failed:', filePath, err);
          return;
        }

        let parsed: unknown;
        try {
          parsed = JSON.parse(raw);
        } catch (err) {
          console.error('[Scp Message Router] JSON.parse envelope failed:', filePath, err);
          return;
        }

        if (typeof parsed !== 'object' || parsed === null) {
          console.warn('[Scp Message Router] envelope not an object:', filePath);
          return;
        }

        const envObj = parsed as { ulid?: unknown; kind?: unknown; scpName?: unknown; payload?: unknown };
        // R4 Angle 3: trim whitespace
        const kind = typeof envObj.kind === 'string' ? envObj.kind.trim() : '';
        if (!kind) {
          console.warn('[Scp Message Router] envelope missing kind:', filePath);
          return;
        }

        // ULID: top-level field with basename fallback
        let ulid = typeof envObj.ulid === 'string' ? envObj.ulid.trim() : '';
        if (!ulid) {
          ulid = basename(filePath, '.json');
        }

        // scpName: from envelope; fallback to path segment
        let scpName = typeof envObj.scpName === 'string' ? envObj.scpName.trim() : '';
        if (!scpName) {
          // path: .../scps/{scpName}/sessions/heads/{file}.json
          const m = filePath.match(/\/scps\/([^/]+)\/sessions\/heads\//);
          scpName = m ? m[1] : 'unknown';
        }

        const payload = envObj.payload ?? null;

        console.log('[Scp Message Router] envelope add:', kind, scpName, ulid);
        nextA(selfDeck.scpMessageRouter.e.scpMessageRouterBmrEnvelopeReceived({
          envelopePath: filePath,
          ulid,
          kind,
          scpName,
          payload,
        }) as never);

        // B.4 R5 L.13 · LOCK 4 option β · COEXIST:
        // Heartbeat envelopes ALSO trigger scpSpawnManager.HeartbeatReceived
        // (lastHeartbeatAt timestamp refresh). FSM transition SpawningToActive
        // remains owned by scpMessageRouterBmrEnvelopeReceived.Method's KDDDB
        // strategyDetermine path — additive, not replacement. M62 preserves
        // queue order (BmrEnvelopeReceived enqueues before HeartbeatReceived).
        if (kind === 'heartbeat') {
          nextA(selfDeck.scpSpawnManager.e.scpSpawnManagerHeartbeatReceived({
            scpName,
            heartbeatUlid: ulid,
            receivedAt: Date.now(),
          }) as never);
        }
      });
    }, {
      selectors: [k_.sessionsDirWatcher],
      beat: 5,
    }),

    // ────────────────────────────────────────────
    // STAGE 3: bridgeSessionsDirWatcher handler bind
    // ────────────────────────────────────────────
    // B.7 Regression #4 Hotfix · R4 Option B LOCKED
    // M73 Path-Diameter-Pairing-Doctrine: pairs with src/lib/bridge/paths.ts
    // `priorityDir` (Cascades/Bridge/sessions/{TUI_SESSION_ID}/heads/{envId}.json).
    // Bridge-side envelopes do NOT carry scpName in path — scpName lives in JSON content.
    // Citation: SUITE-4-GREEN-B7-REGRESSION-4-PATH-MISMATCH.md
    stage(({ k }) => {
      const watcher = k.bridgeSessionsDirWatcher.select();
      if (watcher === null) return;
      if (boundBridgeSessionsDirWatchers.has(watcher)) return;

      console.log('[Scp Message Router Principle] Binding handlers to bridgeSessionsDirWatcher');
      boundBridgeSessionsDirWatchers.add(watcher);

      watcher.on('add', (filePath: string) => {
        if (!BRIDGE_ENVELOPE_PATH_REGEX.test(filePath)) return;

        log('msgrouter.bridge-envelope.add', { filePath });

        let raw: string;
        try {
          raw = readFileSync(filePath, 'utf-8');
        } catch (err) {
          console.error('[Scp Message Router] readFileSync bridge envelope failed:', filePath, err);
          return;
        }

        let parsed: unknown;
        try {
          parsed = JSON.parse(raw);
        } catch (err) {
          console.error('[Scp Message Router] JSON.parse bridge envelope failed:', filePath, err);
          return;
        }

        if (typeof parsed !== 'object' || parsed === null) {
          console.warn('[Scp Message Router] bridge envelope not an object:', filePath);
          return;
        }

        const envObj = parsed as {
          ulid?: unknown;
          kind?: unknown;
          envelopeKind?: unknown;
          scpName?: unknown;
          payload?: unknown;
        };

        // R4 Angle 3: trim whitespace · prefer `kind` then fall back to `envelopeKind`
        const rawKind = typeof envObj.kind === 'string'
          ? envObj.kind
          : (typeof envObj.envelopeKind === 'string' ? envObj.envelopeKind : '');
        const kind = rawKind.trim();
        if (!kind) {
          console.warn('[Scp Message Router] bridge envelope missing kind:', filePath);
          return;
        }

        // ULID: top-level field with basename fallback
        let ulid = typeof envObj.ulid === 'string' ? envObj.ulid.trim() : '';
        if (!ulid) {
          ulid = basename(filePath, '.json');
        }

        // scpName: bridge-side path has NO scpName segment · content is authoritative
        let scpName = typeof envObj.scpName === 'string' ? envObj.scpName.trim() : '';
        if (!scpName) {
          console.warn('[Scp Message Router] bridge envelope missing scpName:', filePath);
          return;
        }

        const payload = envObj.payload ?? null;

        console.log('[Scp Message Router] bridge envelope add:', kind, scpName, ulid);
        nextA(selfDeck.scpMessageRouter.e.scpMessageRouterBmrEnvelopeReceived({
          envelopePath: filePath,
          ulid,
          kind,
          scpName,
          payload,
        }) as never);

        // Heartbeat refresh parity with Stage 2 (LOCK 4 option β COEXIST)
        if (kind === 'heartbeat') {
          nextA(selfDeck.scpSpawnManager.e.scpSpawnManagerHeartbeatReceived({
            scpName,
            heartbeatUlid: ulid,
            receivedAt: Date.now(),
          }) as never);
        }
      });
    }, {
      selectors: [k_.bridgeSessionsDirWatcher],
      beat: 5,
    }),

    conclude(),
  ]);

  // ══════════════════════════════════════════════════════════════════════════════════
  // STANDALONE PLAN: sessionsJsonWatcher handler bind (F2 · SCP-WINDOW-CLOSURE-CONSUME)
  // ══════════════════════════════════════════════════════════════════════════════════
  // THE STCP BOCR FIX (SCS-Bridge backfill-on-connect precedent · gitmBootReportWatch.principle.ts).
  // This consume PREVIOUSLY sat as a TAIL STAGE (Stage 4) of watcherPlan above. That is the
  // KNOWN STCP BOCR failure class: in a multi-stage selector plan the stage pointer only advances
  // when an earlier stage calls iterateStage/stagePlanner.conclude — Stages 1-3 above merely
  // bind-and-return (no iterate), so the pointer parks at Stage 1 and a tail stage NEVER runs.
  // Live evidence: 13/13 arm dispatches landed sessionsJsonWatcher into state, yet the
  // unconditional-at-bind `.backfill-run` log (below) fired ZERO times. The PROVEN fix (mirroring
  // scpRegistryWatcher.principle.ts's working SINGLE-STAGE selector plan, and the gitm standing
  // watcher standalone plans) is a SEPARATE standalone plan(...) — a lone selector-driven stage
  // that re-fires on the sessionsJsonWatcher selector and self-concludes, so it is REACHABLE the
  // instant the arm commits the watcher, independent of watcherPlan's parked stage pointer.
  //
  // The daemon-side leg of the cross-process Diameter. When the SCP window lives in a SEPARATE
  // electron process (the proven no-handle close mode), electronWindow.ts signalScpWindowClosed
  // cannot dispatch directly — it calls registry.recordScpWindowClosure which APPENDS
  // {scpName, closedAt} to registry.scpWindowClosures via the SAME atomic chainWrite writer that
  // carries every other sessions.json mutation. That write fires the 'change' handler below. We
  // re-read the registry, process ONLY closures newer than the module-scope
  // scpWindowClosureWatermark, dispatch scpLifecycleWindowClosed per closure (driving the surface
  // live → pending), and advance the watermark to the max closedAt seen. NO write-back to
  // sessions.json (no write-loop; the watermark dedupes; the F1 cap self-limits the array). The
  // scpLifecycleWindowClosed reducer's own fsm guard (booting|ready|degraded → registered) rejects
  // any closure for an SCP not in a live surface, so a stale/replayed closure is self-rejecting.
  const closureConsumePlan = plan('Scp Message Router Closure Consume Bind', ({ stage, conclude }) => [
    stage(({ k }) => {
      const watcher = k.sessionsJsonWatcher.select();
      if (watcher === null) return;
      if (boundSessionsJsonWatchers.has(watcher)) return;

      console.log('[Scp Message Router Principle] Binding handlers to sessionsJsonWatcher');
      boundSessionsJsonWatchers.add(watcher);

      // ── THE CLOSURE-CONSUME · one code path, two triggers (initial boot + change) ──
      // The pure consume: read sessions.json, dispatch scpLifecycleWindowClosed +
      // scpSpawnManagerKillRequested for every closure newer than the module-scope
      // watermark, advance the watermark. `trigger` distinguishes the F1 BOOT BACKFILL
      // (initial read at bind time) from the live 'change'/'add' fires for telemetry.
      const consumeScpWindowClosures = (filePath: string, trigger: 'initial' | 'change') => {
        let raw: string;
        try {
          raw = readFileSync(filePath, 'utf-8');
        } catch (err) {
          // On the initial BOOT BACKFILL read, ENOENT is expected when no registry
          // exists yet (fresh install) — best-effort, the 'add'/'change' fires later.
          if (trigger === 'change') {
            console.error('[Scp Message Router] readFileSync sessions.json failed:', err);
          } else {
            log('msgrouter.scp-window-closure.backfill-noread', {
              reason: err instanceof Error ? err.message : String(err),
            });
          }
          return;
        }
        let parsed: unknown;
        try {
          parsed = JSON.parse(raw);
        } catch (err) {
          // A mid-swap read can catch a truncated file; awaitWriteFinish mitigates,
          // the next 'change' delivers the stable content. Best-effort — never throw.
          console.error('[Scp Message Router] JSON.parse sessions.json failed:', err);
          return;
        }
        if (typeof parsed !== 'object' || parsed === null) return;

        const closures = (parsed as { scpWindowClosures?: unknown }).scpWindowClosures;
        if (!Array.isArray(closures) || closures.length === 0) return;

        // Consume every closure newer than the watermark; advance to the max seen.
        let maxSeen = scpWindowClosureWatermark;
        let dispatched = 0;
        for (const c of closures) {
          if (typeof c !== 'object' || c === null) continue;
          const rec = c as { scpName?: unknown; closedAt?: unknown };
          const scpName = typeof rec.scpName === 'string' ? rec.scpName.trim() : '';
          const closedAt = typeof rec.closedAt === 'number' ? rec.closedAt : 0;
          if (!scpName || closedAt <= 0) continue;
          if (closedAt <= scpWindowClosureWatermark) continue; // already consumed
          if (closedAt > maxSeen) maxSeen = closedAt;
          // (1) the immediate SURFACE flip — its own guard self-rejects stale
          // closures (fsm not booting|ready|degraded → no-op). On a BOOT BACKFILL of
          // a closure for an SCP not in a live surface, the guard self-rejects (fine).
          nextA(selfDeck.scpLifecycle.e.scpLifecycleWindowClosed({ scpName, closedAt }) as never);
          // (2) Server-Close Cure · kill the SCP's dedicated child process. The
          // 'exit' handler consumes the voluntary-close mark → re-seats 'pending'.
          // F2 ORPHAN-AWARE: KillRequested is equally honest about a dead/absent
          // target — no live handle AND no recoverable pid → logged skip, no dispatch.
          nextA(selfDeck.scpSpawnManager.e.scpSpawnManagerKillRequested({ scpName }) as never);
          dispatched++;
        }

        if (maxSeen > scpWindowClosureWatermark) {
          scpWindowClosureWatermark = maxSeen;
        }
        if (dispatched > 0) {
          console.log('[Scp Message Router] scp-window-closures consumed:', dispatched, 'watermark=', scpWindowClosureWatermark, 'trigger=', trigger);
          log('msgrouter.scp-window-closure.consumed', { dispatched, watermark: scpWindowClosureWatermark, trigger });
        }
      };

      // F1 · THE BOOT BACKFILL · initial read at HANDLER BIND time (once). A closure
      // recorded while the daemon was DOWN (or before this restart) is written to
      // sessions.json but no 'change' fires for it after arming — chokidar's 'add' may
      // or may not surface a pre-existing file depending on ignoreInitial. This
      // explicit initial consume GUARANTEES any closedAt > watermark is consumed at
      // the next boot, via the SAME consume path. Watermark semantics unchanged (0 at
      // fresh boot → every recorded closure re-fires once; the WindowClosed fsm guard
      // and the ORPHAN-AWARE kill both self-reject a stale/absent target honestly).
      // Path source = registryPath() (paths.ts) — the SAME file the watcher watches and
      // the SAME target the electron-side F1 writer writes (M73 Path-Diameter-Pairing).
      // Not a state selector: the FSWatcher handle is in state, but the canonical path
      // is the pure paths.ts helper, so both writer and reader agree by construction.
      const initialPath = registryPath();
      log('msgrouter.scp-window-closure.backfill-run', { path: initialPath, watermark: scpWindowClosureWatermark });
      consumeScpWindowClosures(initialPath, 'initial');

      // W0 HARDENING · the watcher now targets the PARENT DIR (bridgeRoot()), so the handler
      // MUST filter by filename — only sessions.json events drive the closure consume. This is
      // the robust idiom that survives the tmp+rename inode-swap a single-file watch dies on.
      const isSessionsJson = (fp: string): boolean => basename(fp) === basename(registryPath());
      // 'change' is the F1 write path (registry file already exists — chainWrite tmp+rename
      // is an atomic REPLACE, which chokidar surfaces as 'change'); 'add' guards the edge
      // where the daemon armed the watcher before the very first registry write landed.
      watcher.on('change', (filePath: string) => {
        if (!isSessionsJson(filePath)) return;
        consumeScpWindowClosures(filePath, 'change');
      });
      watcher.on('add', (filePath: string) => {
        if (!isSessionsJson(filePath)) return;
        consumeScpWindowClosures(filePath, 'change');
      });
    }, {
      selectors: [k_.sessionsJsonWatcher],
      beat: 5,
    }),
    conclude(),
  ]);

  // ══════════════════════════════════════════════════════════════════════════════════
  // STANDALONE PLAN: scpsJsonWatcher status consume (PSSM · W5 · ROW DERIVATION)
  // ══════════════════════════════════════════════════════════════════════════════════
  // The daemon-side leg of the persisted-status Muxameter. The scpsJson watcher targets the
  // PARENT DIR of <userCwd>/Cascades/SCPs.json (W0 hardening — a single-file watch dies on the
  // setScpStatus tmp+rename swap). On every change we re-read SCPs.json, filter by filename, and
  // for each entry whose persisted `status` CHANGED from the last-derived value, drive the row:
  //   'pending' → dispatch scpLifecycleWindowClosed (the SAME quality the window-close path uses;
  //               its own fsm guard self-rejects an SCP not in a live surface) → surface → pending.
  //   'live'    → NO dispatch here: the live surface arrives via the spawn path (SpawnSucceeded +
  //               SpawningToActive) already. We only RECORD the derived status so a later flip back
  //               to 'pending' is detected. This keeps the persisted status the single source WITHOUT
  //               inventing a parallel row source (per the W5 directive).
  // Standalone (not a tail stage) for the SAME STCP BOCR reason the closure-consume is standalone.
  const scpsJsonStatusConsumePlan = plan('Scp Message Router Scps Json Status Consume Bind', ({ stage, conclude }) => [
    stage(({ k }) => {
      const watcher = k.scpsJsonWatcher.select();
      if (watcher === null) return;
      if (boundScpsJsonWatchers.has(watcher)) return;
      const userCwd = k.userCwd.select();

      console.log('[Scp Message Router Principle] Binding handlers to scpsJsonWatcher');
      boundScpsJsonWatchers.add(watcher);

      const scpsJsonPath = join(userCwd, 'Cascades', 'SCPs.json');
      const isScpsJson = (fp: string): boolean => basename(fp) === 'SCPs.json';

      // THE STATUS CONSUME · re-read SCPs.json, edge-detect status changes, drive rows.
      const consumeScpStatuses = (trigger: 'initial' | 'change'): void => {
        let raw: string;
        try {
          raw = readFileSync(scpsJsonPath, 'utf-8');
        } catch (err) {
          // Fresh install: SCPs.json may not exist yet — best-effort (the 'add'/'change' fires later).
          if (trigger === 'change') {
            console.error('[Scp Message Router] readFileSync SCPs.json failed:', err);
          }
          return;
        }
        let parsed: unknown;
        try {
          parsed = JSON.parse(raw);
        } catch (err) {
          // Mid-swap truncation — awaitWriteFinish mitigates; the next 'change' delivers stable content.
          console.error('[Scp Message Router] JSON.parse SCPs.json failed:', err);
          return;
        }
        if (typeof parsed !== 'object' || parsed === null) return;
        const scps = (parsed as { scps?: unknown }).scps;
        if (!Array.isArray(scps)) return;

        let derived = 0;
        for (const entry of scps) {
          if (typeof entry !== 'object' || entry === null) continue;
          const rec = entry as { name?: unknown; status?: unknown; statusUpdatedAt?: unknown };
          const scpName = typeof rec.name === 'string' ? rec.name.trim() : '';
          if (!scpName) continue;
          const status = rec.status === 'live' || rec.status === 'pending' ? rec.status : undefined;
          if (status === undefined) continue; // no persisted status yet — nothing to derive
          const prior = lastDerivedScpStatus.get(scpName);
          if (prior === status) continue; // unchanged — do not re-drive the row
          lastDerivedScpStatus.set(scpName, status);
          if (status === 'pending') {
            // Drive the surface live → pending via the existing quality. Its fsm guard
            // (booting|ready|degraded → registered) self-rejects an SCP not in a live surface,
            // so a boot-sweep 'pending' for an already-resting row is a benign no-op.
            const closedAt = typeof rec.statusUpdatedAt === 'number' ? rec.statusUpdatedAt : Date.now();
            nextA(selfDeck.scpLifecycle.e.scpLifecycleWindowClosed({ scpName, closedAt }) as never);
            derived++;
          }
          // status === 'live' · recorded only (surface arrives via the spawn path).
        }

        if (derived > 0) {
          console.log('[Scp Message Router] SCPs.json status derived:', derived, 'transition(s) · trigger=', trigger);
          log('msgrouter.scp-status.derived', { derived, trigger });
        }
      };

      // BOOT BACKFILL · initial read at bind time. The W4 boot sweep wrote ALL entries 'pending'
      // BEFORE this watcher armed; seed lastDerivedScpStatus from that resting state WITHOUT
      // dispatching (nothing is a live surface at boot). Record-only: mark each entry's status as
      // already-derived so only a POST-boot flip (a launch → 'live', then a close → 'pending') drives a row.
      try {
        const raw = readFileSync(scpsJsonPath, 'utf-8');
        const parsed = JSON.parse(raw) as { scps?: Array<{ name?: unknown; status?: unknown }> };
        if (Array.isArray(parsed.scps)) {
          for (const entry of parsed.scps) {
            const scpName = typeof entry?.name === 'string' ? entry.name.trim() : '';
            const status = entry?.status === 'live' || entry?.status === 'pending' ? entry.status : undefined;
            if (scpName && status !== undefined) lastDerivedScpStatus.set(scpName, status);
          }
          log('msgrouter.scp-status.backfill-seed', { count: parsed.scps.length });
        }
      } catch {
        // Fresh install / no SCPs.json — nothing to seed.
      }

      // ── RA-1 · THE RE-ADOPTION SWEEP (the RE-ADOPTION GAP close · C581) ─────────────────────
      // The W4 boot sweep forced every persisted status to 'pending' and the FSM re-registered
      // every SCP at 'registered' — but an SCP server that OUTLIVES the bridge restart is still
      // serving. Its badge stuck 'pending' forever ('live' only arrived via the own-spawn path)
      // and [L] on it would DOUBLE-SPAWN. THE PROOF: GET /scp-config on the entry's registered
      // port — an answer whose scpName MATCHES the registry entry is now-liveness + identity in
      // one round-trip (the FKIS identity file — fixed route, no user input). On proof:
      // dispatch scpLifecycleReAdopt (registered→ready · its guard self-rejects any SCP the
      // spawn path already surfaced) + re-align SCPs.json to 'live' (setScpStatus) + advance the
      // lastDerivedScpStatus baseline so the W5 edge-detect stays coherent. Silent no-answer =
      // genuinely down — the seeded 'pending' is honest. First pass ~3s (the Rescan→Register
      // chain settles); RA-2b · RECURRING every 15s thereafter (the C582 simultaneity find: a
      // one-shot sweep misses anything that boots AFTER it — mid-boot spawns, a standard user's
      // simultaneous-spawn day). Entries already derived 'live' are skipped (no probe churn).
      const runReAdoptionSweep = (): void => {
        let entries: Array<{ name: string; port: number }> = [];
        try {
          const raw = readFileSync(scpsJsonPath, 'utf-8');
          const parsed = JSON.parse(raw) as {
            scps?: Array<{ name?: unknown; boundBridgePort?: unknown }>;
          };
          if (Array.isArray(parsed.scps)) {
            entries = parsed.scps
              .map((e) => ({
                name: typeof e?.name === 'string' ? e.name.trim() : '',
                port: typeof e?.boundBridgePort === 'number' ? e.boundBridgePort : 0,
              }))
              // RA-2b — already-live rows never re-probe (the recurring sweep stays quiet).
              .filter((e) => e.name !== '' && e.port > 0 && lastDerivedScpStatus.get(e.name) !== 'live');
          }
        } catch {
          return; // no registry — nothing to re-adopt
        }
        if (entries.length === 0) return; // all adopted anor none registered — silent tick
        log('msgrouter.readopt.sweep', { candidates: entries.length });
        for (const entry of entries) {
          const req = httpGet(
            { hostname: '127.0.0.1', port: entry.port, path: '/scp-config', timeout: 1_500 },
            (res) => {
              const chunks: Buffer[] = [];
              res.on('data', (c: Buffer | string) =>
                chunks.push(typeof c === 'string' ? Buffer.from(c, 'utf-8') : c),
              );
              res.on('end', () => {
                let answeredName = '';
                try {
                  const body = JSON.parse(Buffer.concat(chunks).toString('utf-8')) as {
                    scpName?: unknown;
                  };
                  answeredName = typeof body.scpName === 'string' ? body.scpName : '';
                } catch { /* non-JSON answer — not an SCP server */ }
                if (answeredName !== entry.name) {
                  log('msgrouter.readopt.skip', {
                    scpName: entry.name,
                    port: entry.port,
                    reason: answeredName === '' ? 'no-identity' : 'identity-mismatch',
                    answeredName,
                  });
                  return;
                }
                nextA(
                  selfDeck.scpLifecycle.e.scpLifecycleReAdopt({
                    scpName: entry.name,
                    port: entry.port,
                    reAdoptedAt: Date.now(),
                  }) as never,
                );
                lastDerivedScpStatus.set(entry.name, 'live');
                void setScpStatus(entry.name, 'live').catch((err: unknown) => {
                  log('msgrouter.readopt.status-write-failed', {
                    scpName: entry.name,
                    error: err instanceof Error ? err.message.slice(0, 200) : String(err),
                  });
                });
                log('msgrouter.readopt.live', { scpName: entry.name, port: entry.port });
              });
            },
          );
          req.on('timeout', () => {
            req.destroy();
            log('msgrouter.readopt.skip', { scpName: entry.name, port: entry.port, reason: 'timeout' });
          });
          req.on('error', () => {
            log('msgrouter.readopt.skip', { scpName: entry.name, port: entry.port, reason: 'no-answer' });
          });
        }
      };
      setTimeout(runReAdoptionSweep, 3_000);
      // RA-2b — the standing beat (cleared on principle teardown).
      reAdoptionInterval = setInterval(runReAdoptionSweep, 15_000);

      watcher.on('change', (filePath: string) => {
        if (!isScpsJson(filePath)) return;
        consumeScpStatuses('change');
      });
      watcher.on('add', (filePath: string) => {
        if (!isScpsJson(filePath)) return;
        consumeScpStatuses('change');
      });
    }, {
      selectors: [k_.scpsJsonWatcher],
      beat: 5,
    }),
    conclude(),
  ]);

  return () => {
    watcherPlan.conclude();
    closureConsumePlan.conclude();
    scpsJsonStatusConsumePlan.conclude();
    // RA-2b — retire the standing re-adoption beat with the principle.
    if (reAdoptionInterval !== null) clearInterval(reAdoptionInterval);
  };
};
