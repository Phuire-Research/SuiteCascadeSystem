/**
 * scsBridgeSpawnSuite8Session · C1-D2 · SBST · Cadmium Researcher Epoch Macro C1
 *
 * SBST (SCS-Bridge Spawn Tool) · MASN tool 'scs_spawn_suite8_session'. Spawns a
 * NEW persistent IDENTIFIED Suite 8 ClaudeCode session. Mirrors the CMIA-Spawn
 * pattern of scsBridgeSpawnNewScpSession but sets the registry suite8Name (NDEP)
 * BEFORE the spawn so cli-handler `case 'open-session'` reads a POPULATED
 * entry.suite8Name and composes the 3-layer Base→Dock→Instance prompt.
 *
 * ⚠ LINCHPIN ordering (A-3 SAPR): setSessionSuite8Name MUST execute BEFORE
 * spawnElectronSessionForUlid. createSession writes the registry entry;
 * setSessionSuite8Name writes suite8Name onto that entry; spawnElectronSessionForUlid
 * then calls `open-session <ulid>` which triggers cli-handler `case 'open-session'`
 * where entry.suite8Name is read and fed into resolveComposedAppendPath. A swap
 * silently spawns a mis-identified General Agent (the S4 HIGH risk).
 *
 * Form-α (Method+Reducer). Reducer returns {} · no own-state mutation.
 * Async createSession/setSessionSuite8Name/spawnElectronSessionForUlid
 * fire-and-forget via void async promise.
 *
 * Template: scsBridgeSpawnNewScpSession.quality.huirth.ts (form-α pattern)
 * Citation: Stratimuxian Scholar S10 Quality Creation Pattern 5 (advanced Method)
 * Citation: CADMIUM-C1-OCHRE-BLUEPRINT.md §C1-D2 (LINCHPIN ordering)
 * Citation: registry.ts:341 setSessionSuite8Name (A-3 SAPR write helper)
 */

import {
  createQualityCardWithPayload,
  createMethodWithConcepts,
  selectPayload,
  muxiumConclude,
  strategySuccess,
} from 'stratimux';
import type {
  ScsBridgeState,
  ScsBridgeSpawnSuite8SessionPayload,
  ScsBridgeSpawnSuite8Session,
} from '../scsBridge.types';
import { createSession, hasResumableIdentity } from '../../../manager';
import { spawnElectronSessionForUlid } from '../../../electronSessionSpawn';
import { setSessionSuite8Name, claimAnchorIfUnclaimed, setSessionAnchor, listSessions, setSessionWorker, setSessionStandBy, setSessionModel, setSessionInitialDirective, setSessionSuppressOnboard, setSessionTargetSuite8Name } from '../../../registry';
// DF1 · THE S8 SESSION BINDING · the durable-mirror READ leg. THE DF1 BINDING LAW: S8.json =
// the S8's durable session memory. The ABSENT-anchor spawn path consults readSuite8BoundSession
// to RESUME a page's prior session (a fresh SCP install / wiped registry lost the operational
// isAnchor, but the SCP-LOCAL S8.json still holds boundSessionId).
import { readSuite8BoundSession } from '../model/suite8Binding.model';
import { deriveSessionState } from '../../../menu';
import { isAvailableModel } from '../../../../../shared/modelCatalog.model';
import { log } from '../../../debugLog';

export type { ScsBridgeSpawnSuite8Session };

export const scsBridgeSpawnSuite8Session = createQualityCardWithPayload<
  ScsBridgeState,
  ScsBridgeSpawnSuite8SessionPayload
>({
  type: 'Scs Bridge Spawn Suite8 Session',
  reducer: () => ({}),
  methodCreator: () =>
    createMethodWithConcepts(({ action }) => {
      const payload = selectPayload<ScsBridgeSpawnSuite8SessionPayload>(action);
      const { suite8Name, scpName, callerSessionUlid } = payload;
      // MD-9 · D-MC-1 · Per-Instance Model Control · read the optional spawn-time model.
      // Validate against the maintained catalog HERE (warn + fall to the global default on a
      // bad value) so the spawn NEVER breaks; setSessionModel below re-guards defensively.
      const requestedModel = payload.model;
      const modelToRecord =
        typeof requestedModel === 'string' && isAvailableModel(requestedModel)
          ? requestedModel
          : undefined;
      if (requestedModel !== undefined && modelToRecord === undefined) {
        console.warn(
          '[SCS-Bridge SpawnSuite8Quality] invalid model · falling back to global default · model=',
          requestedModel,
        );
      }
      // SBST asWorker · true = NON-anchor research worker (CadmiumLanding runResearchSweep). When
      // true the existingAnchor anti-flood guard AND claimAnchorIfUnclaimed are SKIPPED so a fresh
      // worker always spawns even though PPOL already created the suite8Name anchor (the cause of
      // the silent "0 dispatched · 1 skipped (no worker)" — the guard returned early on the worker
      // spawn). When false/omitted the anchor path keeps BOTH (duplicate-anchor relay race blocked +
      // auto-anchor on a page with no anchor). Default false.
      const asWorker = payload.asWorker === true;
      // C386 · THE FRESH FLAG · Per-Actualization Forge. true = a NEW conduction that never
      // resumes a prior one — the OFFLINE anchor branch below CREATES a new session + re-claims
      // the anchor onto it instead of re-engaging the dead anchor. Omit/false = the C385 behavior.
      const fresh = payload.fresh === true;
      // D-UP · THE MANUAL-MODE SEVER · true = fresh-worker spawn WITHOUT the WAPM
      // auto-permission marker (approval gate INTACT — the update stays user-controlled)
      // + the registry standBy marker (the presenter's Stand By overlay while the
      // directive delivery is pending). The Gitm Resolver's flag.
      const manualMode = payload.manualMode === true;

      // NDEP · suite8Name is REQUIRED · reject empty/non-string (would otherwise
      // spawn a General Agent with no identity — the exact corruption SBST kills).
      if (typeof suite8Name !== 'string' || suite8Name.trim().length === 0) {
        console.warn('[SCS-Bridge SpawnSuite8Quality] Rejected · invalid suite8Name=', suite8Name);
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }
      console.log(
        '[SCS-Bridge SpawnSuite8Quality] Invoked · suite8Name=',
        suite8Name,
        '· scpName=',
        scpName ?? null,
        '· (null scpName=Template-SCP-default)',
      );

      log('scsbridge.spawn-suite8.dispatched', {
        suite8Name,
        scpName: scpName ?? null,
        callerSessionUlid: callerSessionUlid ?? null,
      });

      // Imperative async — fire-and-forget per scsBridgeSpawnNewScpSession pattern.
      // ⚠ LINCHPIN ordering: createSession → setSessionSuite8Name → spawn.
      //   1. createSession writes registry entry + spawn-settings.json.
      //   2. setSessionSuite8Name writes suite8Name onto that entry (A-3 SAPR).
      //   3. spawnElectronSessionForUlid fires `open-session <ulid>` — cli-handler
      //      reads the NOW-POPULATED entry.suite8Name → Base→Dock→Instance compose.
      // C386 · THE RECLAIM CARRIER · when the fresh-spawn path fires against an OFFLINE anchor,
      // this holds the DEAD prior anchor's id so — after the new session has its suite8Name — the
      // reclaim leg re-claims the page anchor onto the NEW session (setSessionAnchor · the dead
      // prior keeps its history, loses the claim). Null on every other path (absent / worker /
      // fresh-vs-alive) → claimAnchorIfUnclaimed handles the ordinary auto-anchor.
      let reclaimFromPriorAnchorId: string | null = null;

      void (async (): Promise<void> => {
        try {
          // ANCHOR PATH ONLY (!asWorker) · CDV Break D · LIVENESS-AWARE ANCHOR GUARD.
          //
          // The prior guard early-exited on anchor EXISTENCE regardless of LIVENESS — a dead
          // (status:offline) anchor from a prior dead-window session blocked EVERY subsequent
          // spawn forever (the PROVEN KILL: skipped-anchor-exists on an offline entry, no session
          // ever reaches the page). The user's ruling: the bound ID must EXIST TO BE SPAWNED.
          // Three branches on the SAME liveness read the PAOLRP three-branch uses — deriveSessionState
          // (menu.ts:108): status==='offline' → 'offline' FIRST (precedence closes the hook-vs-tick
          // race), else claudePid present → 'alive', else 'pending'.
          //
          //   ALIVE (state !== 'offline', i.e. alive/pending) → SKIP + skipped-anchor-exists.
          //     The original anti-flood purpose preserved: a LIVE anchor absorbs double-click storms
          //     and the page-loads-then-relay-races window. The client PAOLR routes to focus/engage it.
          //   OFFLINE (state === 'offline') → RE-ENGAGE the existing anchor rather than spawn a
          //     duplicate: fire spawnElectronSessionForUlid(anchor.id) — the SAME `open-session <ulid>`
          //     CSSP verb scsBridgeEngageSession + the boot anchor-resume ride (Q2=Option A idempotent
          //     focus/resume-existing). The recorded per-instance model rides via the registry entry
          //     (MD-9 · resume injects entry.model over the global default in cli-handler). Then return
          //     — the anchor is re-alive on its EXISTING ULID; no new registry row, no duplicate anchor.
          //   ABSENT (no matching anchor entry) → fall through to the fresh-spawn leg below (create +
          //     claim), logging anchor-absent-fresh-spawn so the three outcomes are distinguishable.
          //
          // PARAMETERIZED: a research WORKER spawn (asWorker:true) MUST skip this whole block — PPOL
          // already created the suite8Name anchor, so the guard would silently return early on every
          // worker spawn → "0 dispatched · 1 skipped (no worker)".
          // THE PLAIN-SPAWN LANE · anchor === false = a plain instance: skip the WHOLE
          // anchor machinery (guard + claim + re-engage + durable binding) — the Session
          // Manager's default Suite 8 spawn. Anchoring belongs to the page/Shatterite
          // Menu lane first (anchor omitted/true).
          const plain = payload.anchor === false;
          if (!asWorker && !plain) {
            const existingSessions = await listSessions();
            // THE ANCHOR SCOPE LAW (the LambdaOfTheFrontier field catch): anchor identity is
            // the (suite8Name, scpName) PAIR — the prior designation-only find grabbed the
            // FIRST anchor off the session iteration regardless of citizen, so a new SCP's
            // page surfaced/re-engaged ANOTHER SCP's onboarded anchor. Null-scpName matches
            // null-scpName only (the workspace-default lane stays its own scope). The
            // Sovereign Spawn Binding is the prerequisite: every page spawn carries scpName.
            const anchorScope = scpName ?? null;
            const existingAnchor = existingSessions.find(
              (s) =>
                s.suite8Name === suite8Name &&
                (s.scpName ?? null) === anchorScope &&
                s.isAnchor === true,
            );
            if (existingAnchor) {
              const anchorState = deriveSessionState(existingAnchor);
              if (anchorState === 'offline') {
                // C386 · FRESH vs OFFLINE · the Per-Actualization Forge fork. A conduction never
                // resumes a prior conduction's session, so fresh:true does NOT re-engage the dead
                // anchor — it CREATES a new session (the fall-through leg below) and RE-CLAIMS the
                // page anchor onto it. The dead prior keeps its history; it loses the claim. Only the
                // ordinary-anchor path (fresh omitted/false) keeps the C385 offline→re-engage.
                if (fresh) {
                  reclaimFromPriorAnchorId = existingAnchor.id;
                  log('scsbridge.spawn-suite8.fresh-spawn-reclaimed', {
                    suite8Name,
                    priorAnchorId: existingAnchor.id,
                  });
                  console.warn(
                    '[SCS-Bridge SpawnSuite8Quality] anchor OFFLINE + fresh · creating NEW conduction + reclaiming anchor · priorAnchorId=',
                    existingAnchor.id,
                  );
                  // Fall through (do NOT return) to the create + reclaim leg below.
                } else {
                  // OFFLINE → RE-ENGAGE (resume the dead-window anchor on its existing ULID).
                  spawnElectronSessionForUlid(existingAnchor.id);
                  log('scsbridge.spawn-suite8.anchor-offline-reengaged', {
                    suite8Name,
                    anchorId: existingAnchor.id,
                  });
                  console.warn(
                    '[SCS-Bridge SpawnSuite8Quality] anchor OFFLINE · re-engaging existing anchor · anchorId=',
                    existingAnchor.id,
                  );
                  return;
                }
              } else {
              // ALIVE (alive/pending) → SURFACE the bound session then SKIP the duplicate spawn.
              // DF1 · THE ALIVE-BRANCH SURFACE (r4's one-liner) · spawnElectronSessionForUlid is
              // the idempotent `open-session` focus verb (Q2=Option A: focuses the existing window
              // if the ULID is already in SRMP, never creates a duplicate). So spawning an
              // anchored-ALIVE S8 SURFACES its bound session (brings the window forward) rather
              // than the prior silent no-op. The anti-flood invariant holds — no NEW session, no
              // duplicate anchor; the focus is idempotent under the double-click storm.
              spawnElectronSessionForUlid(existingAnchor.id);
              log('scsbridge.spawn-suite8.skipped-anchor-exists', {
                suite8Name,
                anchorId: existingAnchor.id,
                surfaced: true,
              });
              console.warn(
                '[SCS-Bridge SpawnSuite8Quality] anchor exists (alive) · surfacing bound session · skipping duplicate spawn · anchorId=',
                existingAnchor.id,
              );
              return;
              }
            }
            // ABSENT → distinct telemetry, then consult the DURABLE BINDING before minting fresh.
            log('scsbridge.spawn-suite8.anchor-absent-fresh-spawn', { suite8Name });

            // DF1 · THE SPAWN FALLBACK · no OPERATIONAL anchor exists (fresh SCP install / wiped
            // registry), but the SCP-LOCAL S8.json may still hold this page's DURABLE boundSessionId.
            // Consult it: a non-null ULID whose registry entry is RESUMABLE (mirror the engage rail's
            // hasResumableIdentity gate — a claudeSessionId present means `claude --resume` can revive
            // it) → RE-CLAIM the page anchor onto that existing ULID (setSessionAnchor) + surface it
            // (spawnElectronSessionForUlid · idempotent focus/resume) + return. NO new registry row.
            // Skipped for a fresh:true conduction (the Per-Actualization Forge never resumes a prior
            // conduction — mint a new one instead) and for workers (already !asWorker-scoped here).
            // Not-resumable / absent binding → fall through to the mint leg (which writes the fresh
            // binding via claimAnchorIfUnclaimed's DF1 seam write).
            if (!fresh) {
              const boundSessionId = readSuite8BoundSession(suite8Name, scpName ?? undefined);
              if (boundSessionId) {
                // THE ADOPTION LAW (the FrontierTest4 disjoint · the Shatterite contract):
                // a binding may re-engage a session ONLY when (a) its registry entry still
                // EXISTS (a meta-only ghost is not adoptable — setSessionAnchor would no-op
                // and the page would gain a bare, unanchored zombie), (b) the entry belongs
                // to THIS citizen, AND (c) it is resumable. ANY failure → fall THROUGH to
                // the mint leg: a NEW session as anchor, Onboard riding, primed into motion
                // — the remote-stable ground restored. A non-anchor session is NEVER
                // adopted by the menu; it is invisible to this leg by construction (only
                // the anchor seams write the binding).
                const boundEntry = existingSessions.find((s) => s.id === boundSessionId);
                const citizenMatch =
                  boundEntry !== undefined && (boundEntry.scpName ?? null) === (scpName ?? null);
                const resumableIdentity =
                  boundEntry !== undefined && citizenMatch
                    ? await hasResumableIdentity(boundSessionId)
                    : undefined;
                if (boundEntry !== undefined && citizenMatch && resumableIdentity) {
                  await setSessionAnchor(boundSessionId); // re-claim the page anchor onto the durable ULID
                  spawnElectronSessionForUlid(boundSessionId);
                  log('scsbridge.spawn-suite8.resumed-from-binding', {
                    suite8Name,
                    boundSessionId,
                  });
                  console.warn(
                    '[SCS-Bridge SpawnSuite8Quality] no live anchor · resuming from durable S8.json binding · boundSessionId=',
                    boundSessionId,
                  );
                  return;
                }
                log('scsbridge.spawn-suite8.binding-rejected-mint-fresh', {
                  suite8Name,
                  boundSessionId,
                  entryExists: boundEntry !== undefined,
                  citizenMatch,
                  resumable: resumableIdentity !== undefined && resumableIdentity !== null,
                });
                console.warn(
                  '[SCS-Bridge SpawnSuite8Quality] binding REJECTED (exists=',
                  boundEntry !== undefined,
                  '· citizenMatch=',
                  citizenMatch,
                  ') · falling through to MINT · suite8Name=',
                  suite8Name,
                );
              }
            }
          }
          // createSession + setSessionSuite8Name + spawn run for BOTH paths. The worker still gets
          // suite8Name so awaitNewLaunchedWorker (s.suite8Name === suite8Name && status==='launched')
          // matches it.
          // F3 · thread suite8Name into createSession so the INITIAL writeSpawnSettings is
          // never bare (defense-in-depth · the settings carry the name before the explicit
          // setSessionSuite8Name persists it to the registry entry below).
          const { sessionId } = await createSession({ scpName: scpName ?? undefined, suite8Name });
          await setSessionSuite8Name(sessionId, suite8Name);    // A-3 SAPR: set BEFORE spawn
          // MD-9 · D-MC-1 · record the per-instance model on the now-existing entry (BEFORE spawn
          // so the detached open-session resolver reads entry.model). No-op on undefined/invalid
          // (setSessionModel re-guards) → the session rides the bridge global default.
          await setSessionModel(sessionId, modelToRecord);
          // ANCHOR PATH ONLY (!asWorker) · A-D1 ARF: auto-anchor if the page has none. A worker
          // (asWorker:true) is NON-anchor by definition (DSST-ephemeral) — skip the claim so it
          // never mis-anchors itself over the PPOL anchor.
          //
          // C386 · THE RECLAIM · when the fresh-spawn path fired against an OFFLINE anchor,
          // claimAnchorIfUnclaimed is a NO-OP (the dead prior still holds isAnchor) — so instead
          // RE-CLAIM the page anchor onto this NEW session via setSessionAnchor (the reassign-one-
          // per-suite8Name writer: sets isAnchor on this entry + clears it on every OTHER entry of
          // this suite8Name → the dead prior keeps its history, loses the claim). Ordinary fresh /
          // absent / non-fresh paths keep the claimAnchorIfUnclaimed auto-anchor.
          if (!asWorker && !plain) {
            if (reclaimFromPriorAnchorId !== null) {
              await setSessionAnchor(sessionId);
              log('scsbridge.spawn-suite8.anchor-reclaimed', {
                suite8Name,
                sessionId,
                priorAnchorId: reclaimFromPriorAnchorId,
              });
            } else {
              await claimAnchorIfUnclaimed(sessionId);
            }
          }
          // MRQ-RC3 · WAPM · WORKER PATH ONLY (asWorker) · persist the auto-permission marker
          // BEFORE spawn so the detached `open-session` process reads entry.isWorker from the
          // registry and threads autoAcceptEdits=true into writeSpawnSettings → the worker's
          // spawn-settings.json gains permissions.defaultMode='acceptEdits' (boots in Claude
          // Code auto-accept, retiring the Shift+Tab relay for the sweep). Anchors / plain SCP
          // sessions never reach this branch → isWorker stays unset → approval gate intact.
          //
          // D-UP · THE MANUAL-MODE SEVER · manualMode:true keeps the worker spawn shape
          // (anti-flood skipped above) but SEVERS the auto-permission marker — the session
          // boots with Claude Code's approval gate INTACT (the update is user-controlled).
          // It gains the standBy marker instead: the detached open-session reads it and
          // paints the presenter's Stand By overlay until the directive delivery lands.
          if (asWorker && !manualMode) {
            await setSessionWorker(sessionId);
          }
          // RS.2b · THE COMBINED INITIAL ENTRY · persist the caller-built directive BEFORE
          // spawn so the detached open-session (registry-derived by ULID) appends it to the
          // Onboard seed as ONE initial positional prompt. Failure = fall back to the
          // delivery-era behavior honestly (no directive on the entry → the caller's own
          // fallback delivery leg still functions); NEVER block the spawn.
          const initialDirective =
            typeof payload.initialDirective === 'string' && payload.initialDirective.trim().length > 0
              ? payload.initialDirective
              : undefined;
          if (initialDirective !== undefined) {
            try {
              await setSessionInitialDirective(sessionId, initialDirective);
            } catch (directiveErr) {
              log('scsbridge.spawn-suite8.initial-directive-failed', {
                sessionId,
                error: directiveErr instanceof Error ? directiveErr.message.slice(0, 200) : String(directiveErr),
              });
            }
          }
          // EF-3′ · THE TARGET S8 THREAD · persist the commissioned page (the initialDirective
          // rail exactly) — the field-agnostic relay carries it FREE to every client; the
          // Previous Conductions row filters per page. NEVER block the spawn on a hiccup.
          const targetSuite8Name =
            typeof payload.targetSuite8Name === 'string' && payload.targetSuite8Name.trim().length > 0
              ? payload.targetSuite8Name
              : undefined;
          if (targetSuite8Name !== undefined) {
            try {
              await setSessionTargetSuite8Name(sessionId, targetSuite8Name);
            } catch (targetErr) {
              log('scsbridge.spawn-suite8.target-suite8-failed', {
                sessionId,
                error: targetErr instanceof Error ? targetErr.message.slice(0, 200) : String(targetErr),
              });
            }
          }
          // THE ONBOARD OPTION · onboard is TRUE BY DEFAULT (omit = the Onboard seed rides
          // per the anchor predicate, unchanged). Only an explicit false persists the
          // suppression marker; a registry hiccup degrades to the default honestly.
          if (payload.onboard === false) {
            try {
              await setSessionSuppressOnboard(sessionId, true);
            } catch (suppressErr) {
              log('scsbridge.spawn-suite8.suppress-onboard-failed', {
                sessionId,
                error: suppressErr instanceof Error ? suppressErr.message.slice(0, 200) : String(suppressErr),
              });
            }
          }
          // D-UP4 · SPAWN-PATH HARDENING: the standBy marker is COSMETIC (it only drives the
          // presenter overlay) — a registry hiccup here must NEVER block the spawn itself.
          // The prior unguarded await sat directly on the spawn path; now a failure logs and
          // the spawn proceeds without the overlay (degraded honestly, never dead).
          // RS.2b: when the directive rides the spawn there is NO pending delivery — the
          // overlay would wait on a clear that never comes; skip the arm.
          if (manualMode && initialDirective === undefined) {
            try {
              await setSessionStandBy(sessionId, true);
            } catch (standByErr) {
              log('scsbridge.spawn-suite8.standby-marker-failed', {
                sessionId,
                error: standByErr instanceof Error ? standByErr.message.slice(0, 200) : String(standByErr),
              });
            }
          }
          spawnElectronSessionForUlid(sessionId);               // cli-handler reads suite8Name
          log('scsbridge.spawn-suite8.launched', {
            suite8Name,
            scpName: scpName ?? null,
            sessionId,
            asWorker,
            manualMode,
            transport: 'electron',
          });
          console.log(
            '[SCS-Bridge SpawnSuite8Quality] Spawn dispatched · sessionId=',
            sessionId,
            '· suite8Name=',
            suite8Name,
          );
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          log('scsbridge.spawn-suite8.error', { suite8Name, scpName: scpName ?? null, message });
          console.error('[Scs Bridge] SpawnSuite8Session error:', suite8Name, message);
        }
      })();

      console.log(
        '[Scs Bridge] SpawnSuite8Session dispatched createSession+setSessionSuite8Name+spawn:',
        suite8Name,
      );

      return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
    }),
});
