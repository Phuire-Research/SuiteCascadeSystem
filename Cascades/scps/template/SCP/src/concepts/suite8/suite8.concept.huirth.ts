/**
 * Suite8 Concept Factory (Huirth Deployment) · GTMS8C · the thin server-Base home for menuStage
 *
 * suite8 is client-only today; the GTMS8C retrofit introduces THIS thin Huirth concept so the
 * suite8 Demometer keeps its OWN server-Base `menuStage` state. It registers exactly ONE Base
 * quality (suite8SetMenuStageHuirthBase · Huirth-only · TQNI 'Suite8 Set Menu Stage Huirth Base')
 * and the two relay principles: the thin menu-watch dir-watch + the STCP SMRP+BOCR relay.
 *
 * Co-muxified FLAT alongside cadmium + suiteCascade in huirth.concept.ts (Tier-1 Huirth muxium ·
 * NO ECK violation · structurally identical to the cadmium Huirth addition). Because all concepts
 * land flat in the Huirth muxium, d.suite8.k.menuStage, d.suite8.e.suite8SetMenuStageHuirthBase,
 * and d.webSocketServer.e.* are all live (the same cross-concept co-muxified access cadmium proves).
 *
 * The Huirth `suite8` concept names itself 'suite8' (SUITE8_CONCEPT_NAME); the CLIENT `suite8`
 * concept also names itself 'suite8' — they live in SEPARATE muxiums (client vs huirth) · NO
 * collision (mirrors cadmium: cadmiumName names both, in their respective muxiums).
 *
 * Citation: cadmium.concept.huirth.ts (Huirth face + quality mapping + principle registration).
 * Citation: TU-S8C-S3-YELLOW-BLUEPRINT.md W2.9.
 */
import { createConcept } from 'stratimux';
import { SUITE8_CONCEPT_NAME, type Suite8HuirthQualities } from './suite8.type';
import { createSuite8HuirthState } from './suite8.state.huirth';
import { suite8SetMenuStageHuirthBase } from './qualities/suite8SetMenuStageHuirthBase.quality.huirth';
// PRE-EPOCH · BSSM keyed Huirth Base quality (the N-watcher dispatches this FIRST · Base-maintenance).
import { suite8SetDesignationMenuStageHuirthBase } from './qualities/suite8SetDesignationMenuStageHuirthBase.quality.huirth';
import { suite8MenuStcpRelayPrinciple } from './principles/suite8MenuStcpRelay.principle.huirth';
import { suite8MenuWatchPrinciple } from './principles/suite8MenuWatch.principle.huirth';
// EF-5 · THE INSTALL CIRCUIT · the install-requirements keyed Huirth Base quality (the install-watcher
// dispatches this FIRST · Base-maintenance) + the install-watcher dir-watch + the SMRP+BOCR relay.
import { suite8SetInstallRequirementsHuirthBase } from './qualities/suite8SetInstallRequirementsHuirthBase.quality.huirth';
import { suite8InstallRequirementsWatchPrinciple } from './principles/suite8InstallRequirementsWatch.principle.huirth';
import { suite8InstallRequirementsStcpRelayPrinciple } from './principles/suite8InstallRequirementsStcpRelay.principle.huirth';
// SL-1 · THE SYNC LIBRARY BOOT REGISTRATION — the Demometeric means' further plurality
// (Cascades/Extended/<name>/SyncLibrary.json · localScp registered · Local = the source of truth).
import { suite8SyncLibrarySeedPrinciple } from './principles/suite8SyncLibrarySeed.principle.huirth';
// U2 · THE USHER STAGE PLANNER (the Usher Reframe · the setStage mode machine) + its mode quality.
import { suite8SyncUsherPrinciple } from './principles/suite8SyncUsher.principle.huirth';
import { suite8SetSyncModeHuirthBase } from './qualities/suite8SetSyncModeHuirthBase.quality.huirth';
// B-RLM-1′ · THE GRACE-AS-STATE TRIAD (the Grace-as-State Fold · the Agreement form) — the
// bridge-json dispatcher opens/cancels graces; the revert strategy fires on the muxiumTimeOut
// Tail Whip; all three Huirth-only, absent from actionExchange (TQNI).
import { suite8BeginClosureGraceHuirthBase } from './qualities/suite8BeginClosureGraceHuirthBase.quality.huirth';
import { suite8CancelClosureGraceHuirthBase } from './qualities/suite8CancelClosureGraceHuirthBase.quality.huirth';
import { suite8GraceRevertCheckHuirthBase } from './qualities/suite8GraceRevertCheckHuirthBase.quality.huirth';
// B-RLM-2 · THE LOCALITY BASE + THE LOCALITY RELAY — the keyed Base quality the Usher's two boundary
// dispatchers write, and the SMRP+BOCR relay that broadcasts the localities + closureGraces slices.
import { suite8SetLocalityHuirthBase } from './qualities/suite8SetLocalityHuirthBase.quality.huirth';
// C909 · THE ACCOUNTED SETTLE — the debounce node prior to the SET on the accounted-change path
// (null reducer · 400ms settle · Huirth-only · absent from actionExchange · TQNI).
import { suite8AccountedChangeDebounce } from './qualities/suite8AccountedChangeDebounce.quality.huirth';
import { suite8LocalityStcpRelayPrinciple } from './principles/suite8LocalityStcpRelay.principle.huirth';

// Explicit quality mapping — NEVER typeof. The scalar Base + the PRE-EPOCH keyed Base + the
// B-RLM-1′ grace-as-state triad (all Huirth-only · local reducers · none in actionExchange).
const suite8HuirthQualities: Suite8HuirthQualities = {
  suite8SetMenuStageHuirthBase,
  suite8SetDesignationMenuStageHuirthBase,
  // EF-5 · the install-requirements keyed Base (the install-watcher dispatches it FIRST · Huirth-only).
  suite8SetInstallRequirementsHuirthBase,
  suite8SetSyncModeHuirthBase,
  suite8BeginClosureGraceHuirthBase,
  suite8CancelClosureGraceHuirthBase,
  suite8GraceRevertCheckHuirthBase,
  // B-RLM-2 · the locality Base (the Usher's boundary dispatchers write it · the relay reads it).
  suite8SetLocalityHuirthBase,
  // C909 · the accounted settle (the debounce node prior — only the burst's LAST strategy passes).
  suite8AccountedChangeDebounce,
};

export const createSuite8HuirthConcept = () =>
  createConcept(
    SUITE8_CONCEPT_NAME,
    createSuite8HuirthState(),
    suite8HuirthQualities,
    // The thin menu-watch dir-watch (arms the menu.json relay) + the SMRP+BOCR relay principle
    // (reads suite8.k.menuStage · broadcasts suite8SetMenuStage).
    [
      suite8MenuWatchPrinciple,
      suite8MenuStcpRelayPrinciple,
      // EF-5 · the install-requirements dir-watch (arms the gate-file relay) BEFORE the SMRP+BOCR relay
      // (reads suite8.k.installRequirementsMap · broadcasts suite8SetInstallRequirements) — same order
      // class as the menu pair (watch before relay).
      suite8InstallRequirementsWatchPrinciple,
      suite8InstallRequirementsStcpRelayPrinciple,
      suite8SyncLibrarySeedPrinciple,
      suite8SyncUsherPrinciple,
      // B-RLM-2 · the locality relay (SMRP on d.suite8.k.localities + closureGraces · BOCR on the
      // WebSocket pool) — registered the way the usher principle is (a flat member of the array).
      suite8LocalityStcpRelayPrinciple,
    ],
  );
