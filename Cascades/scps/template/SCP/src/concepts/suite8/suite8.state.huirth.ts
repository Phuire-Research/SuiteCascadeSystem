/**
 * Suite8 Concept State Factory (Huirth Deployment) · GTMS8C Base
 *
 * The server-side (Base) state for the suite8 Demometer — holds menuStage as the Huirth
 * source of truth so the STCP SBIS+SMRP+BOCR stack can keep it authoritative. Seeds to
 * EMPTY_MENU_STAGE (stageIndex -1) so the KeyedSelector slot is ALWAYS present (never
 * optional · KeyedSelector discipline) and BOCR reads a valid value on a connect before any
 * menu.json exists. The thin menu-watch dir-watch (suite8MenuWatch) writes real stages via the
 * Base quality (suite8SetMenuStageHuirthBase); JDIS unlink resets it back to EMPTY_MENU_STAGE.
 *
 * Citation: cadmium.state.huirth.ts (createCadmiumHuirthState · Base/Informative split).
 * Citation: TU-S8C-S3-YELLOW-BLUEPRINT.md W2.3.
 * Citation: STRATIMUX-REFERENCE.md "🧠 Strategic State Management" (no optional state).
 */
import type { Suite8HuirthState } from './suite8.type';
import { EMPTY_MENU_STAGE } from '../../model/shatteriteMenu.model';

export function createSuite8HuirthState(): Suite8HuirthState {
  return {
    // KeyedSelector discipline · NON-OPTIONAL · the menu-watch dir-watch writes real stages via
    // the Base quality (suite8SetMenuStageHuirthBase); an unlink resets it to EMPTY_MENU_STAGE.
    menuStage: EMPTY_MENU_STAGE,

    // PRE-EPOCH · BSSM keyed Record (Base mirror). Always {} at boot (KeyedSelector). The N-watcher
    // dir-watch writes per-designation stages via suite8SetDesignationMenuStageHuirthBase; the SMRP
    // relay reads this Record + broadcasts the keyed relay.
    shatteriteMenus: {},

    // EF-5 · THE INSTALL REQUIREMENTS RECORD (Base mirror). Always {} at boot (KeyedSelector). The
    // install-watcher dir-watch writes per-designation payloads via suite8SetInstallRequirementsHuirthBase;
    // the STCP SMRP relay reads this Record + broadcasts the keyed relay ('Suite8 Set Install Requirements').
    installRequirementsMap: {},

    // U2 · THE USHER MODE RECORD — always {} at boot (KeyedSelector); the Usher principle's
    // library watcher hydrates per-designation modes via suite8SetSyncModeHuirthBase.
    syncModes: {},

    // B-RLM-1′ · THE CLOSURE GRACES RECORD — always {} at boot (KeyedSelector). The bridge-json
    // dispatcher opens entries via suite8BeginClosureGrace (which registers the muxiumTimeOut
    // revert strategy); the fired strategy anor a returned target clears them via
    // suite8CancelClosureGrace. The presence of an entry IS the Case-4 has-guard (state gate).
    closureGraces: {},

    // B-RLM-2 · THE LOCALITIES RECORD — always {} at boot (KeyedSelector). The Usher's two boundary
    // dispatchers (library watcher + bridge-json watcher) + the boot leg compose per-designation
    // snapshots via suite8SetLocalityHuirthBase; the suite8LocalityStcpRelay broadcasts them.
    localities: {},
  };
}
