/**
 * Suite8 Concept Type Definitions
 *
 * Universal Designation Carrier. Each Suite 8 designation (Conductor · domain
 * Suite 8 · spawned ClaudeCode instance) maintains its OWN Renewable
 * Intelligence Pairing — Diamond + Onyx + BoundCascade.json. The suite8
 * Concept holds these as STATE for the active designation being viewed/managed.
 *
 * The Page surface (Suite8Page.vue) renders three tabs:
 *   - Info Sheet (default) — FS Read of the Suite 8 directory
 *   - D-O Viewer — Diamond + Onyx markdown render
 *   - Settings (default when muxified elsewhere) — per-muxification config
 *
 * Citation: DIAMOND-TIER-M1-A1-D3.md
 * Citation: STRATIMUX-REFERENCE.md "🧩 Quality Creation Patterns"
 * Citation: CLAUDE.md C5 Renewable Intelligence (D-O Muxified Read)
 */
import type { Concept, Quality, PrincipleFunction, MuxiumDeck, AnyAction } from 'stratimux';
import type { S8Entry, S8SubPage } from '../../model/s8Shared.model';
// A-1 SCBM · Tier-2 muxified member types — Suite8 muxifies SuiteCascade, so the
// Deck carries `d.suiteCascade` (the ONE shared instance · Scholar §1/§2). Type-only
// import — the runtime muxification lives in suite8.concept.client.ts.
import type { SuiteCascadeState, SuiteCascadeQualities } from '../suiteCascade/suiteCascade.type';
// GTMS8C · the shared Shatterite Menu stage contract (W1 · model/shatteriteMenu.model.ts).
import type { MenuStage, MenuDocument } from '../../model/shatteriteMenu.model';
// EF-5 · THE INSTALL CIRCUIT · the gate-file content shape (held · token-free · client-safe).
// Imported from the never-copied install-circuit model so the Suite 8 Control (the mint copy
// surface) and this concept share ONE contract that survives every twin's token-rename.
import type { InstallRequirementsShape } from '../../model/scpS8InstallCircuit.model';

// ============================================================
// GTMS8C · THE CASCADING CONSTANT (TQNI-RT single edit site)
// ============================================================
// The ONE rename target. The install Opus edits this string + mv's the dir/files + the
// non-derivable surfaces (muxonomy registration key, islandRegistry key, imports, componentPath).
// Every Verbose Split Naming type string derives from it via VERBOSE() below — so a rename of the
// constant REGENERATES all quality type strings (no missed-string silent dead receptor · S4 verdict).
export const SUITE8_CONCEPT_NAME = 'suite8';

// Backward-compat alias — the existing 30+ importers reference `suite8Name`. Keep it pointing at
// the constant so nothing breaks; the rename edits SUITE8_CONCEPT_NAME and the alias follows.
export const suite8Name = SUITE8_CONCEPT_NAME;

// VERBOSE · Verbose Split Naming derivation. 'suite8' + 'SetMenuStage' → 'Suite8 Set Menu Stage'.
// Title-cases the concept token, space-splits the PascalCase verb. The Stratimux action dispatch
// matches by THIS string — derive it, never hand-type it, so the rename can never drift (TQNI).
const titleCase = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
const splitPascal = (s: string): string => s.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
export const VERBOSE = (verb: string): string =>
  `${titleCase(SUITE8_CONCEPT_NAME)} ${splitPascal(verb)}`;
// e.g. VERBOSE('SetMenuStage') === 'Suite8 Set Menu Stage'
//      VERBOSE('SetMenuStageHuirthBase') === 'Suite8 Set Menu Stage Huirth Base'
// NOTE (VERBOSE resolution · Blue W2): the 2 menu qualities + the muxonomy use the LITERAL form
// of these derived strings (cadmium precedent · createQualityCardWithPayload `type` is always a
// literal in this codebase). VERBOSE() is the canonical reference + the rename anchor; the literals
// carry a `// = VERBOSE('...')` comment so the cascading-constant edit + the TQNI-RT zero-grep
// Concluder cover the relay-critical surface.

// ============================================
// DESIGNATION + TAB TYPES
// ============================================

export type Suite8Designation = {
  name: string;
  diamondPath: string;
  onyxPath: string;
  cascadeJsonPath: string;
  directoryPath: string;
  description?: string;
  color?: string;
};

// ============================================
// A-1 SPSR · Shared-Plurality-Suite8-Record ENTRY
// ============================================
// One entry per Suite 8, keyed in the `suite8s` Record by its NDEP Name (the literal
// `Cascades/8_SUITES/<Name>/` directory entry). NO optional props — KeyedSelector
// requirement (S13 §4). The minimal identity+routing surface; A-2 MPRF registers
// entries from the directory substrate, A-6 HCD renders the roster.
// V-1 · THE LENT SHAPE — the truth lives in the held s8Shared.model (token-free); this
// ALIAS keeps every concept-local (and twin-renamed) import resolving unchanged.
export type Suite8Entry = S8Entry;

export type Suite8Tab = 'info' | 'doviewer' | 'settings';

// ============================================
// A-6 HCD SUBPAGE TRIAD — Home · Component · Documentation
// ============================================
//
// The Suite8 Landing renders a SubPage triad (HCD), mirroring the SuiteCascade
// (B-6) + scsBridge SubPage precedent. `activeSubPage` is a pure-UI, local-only
// selector (never synced — NOT in `sync.filterKeys`): a single v-if/v-else-if
// chain in the Landing keys off it. 'home' is the default (the Suite 8 roster).
//
// Citation: suiteCascade.type.ts SuiteCascadeSubPage union (DIRECT bearing · B-6).
// Citation: MASTER-DIAMOND-SUITE8-CONCEPT-ASPIRANT.md §3 (HCD SubPage triad).
export type Suite8SubPage = S8SubPage;

// ============================================
// STATE DEFINITION (Client-Side · InductionState included)
// ============================================

// V-2 · THE PAGE VERSION (the hard-set at actualization) — this constant lives IN the copy
// surface DELIBERATELY: every minted page freezes the template's then-current value at its
// creation (the enclosing concept's actualization), massed into the page's Muxium via the
// state seed. The TEMPLATE advances this on each standardization update; a page's frozen
// value vs the current template value IS the update detection (V-5). Pre-version pages
// (no constant · no registration) read as the assumed default '0.0.0'. The `S8_` prefix is
// the rename-proof token (C373) — the name survives every twin identically.
export const S8_PAGE_VERSION = '1.0.0';

// MD-S8PM · PM-3 · THE PAGE COUNTER (the stamp joins the s8 axis). The human-readable
// version string above is RETAINED unchanged (the S8Card label + the wild-page '0.0.0'
// stamps keep it). This SIBLING is the s8-AXIS value — the counter the template carries
// NOW, matching the DEBUT npm s8:1 (the system ships first at 1 — increments count from the released baseline) (package.json scsMuxameter.s8 · PM-1). The mint
// pass-through stamps this automatically: cloneRenameEngine recursively copies the suite8
// concept files verbatim and renames ONLY the npm-package tokens (huirth-scp-template + the
// long title) — `suite8`/`Suite8`/`SUITE8` are NOT rename targets, so `S8_PAGE_COUNTER`
// (bearing none of the three tokens) survives the twin identically (the C373 S8_ law).
// The compare `pageS8Counter < installedS8Counter` = out-of-sync (PM-4 colors the S8 toggle).
export const S8_PAGE_COUNTER = 1;

export type Suite8ClientState = {
  // V-2 · the frozen template version this page was actualized from (S8_PAGE_VERSION at
  // the concept's creation — the Muxium carries it from birth).
  pageVersion: string;
  // InductionState (for future Diametric routing in D4)
  actionQue: AnyAction[];
  filterKeys: string[];

  // A-1 SPSR · the new sole-aspiration property — one Record keyed by NDEP Name.
  // Shared without overload (Scholar §1). A-2 MPRF populates from `Cascades/8_SUITES/`.
  // Coexists with the legacy `designations` array (see reconciliation note below); the
  // future migration folds `designations` consumers (3 qualities + Vue) onto this Record.
  suite8s: Record<string, Suite8Entry>;

  // LEGACY (A-1 reconciliation) · Designation registry — the existing array surface the
  // 8 qualities + Suite8Page/Suite8Landing still read. Retained to keep the live concept
  // compiling in one Band; A-2/A-6 migrate consumers to `suite8s`.
  designations: Suite8Designation[];

  // Active designation being viewed/managed
  activeDesignationName: string;

  // Active tab on the Suite 8 Page
  activeTab: Suite8Tab;

  // A-6 HCD — the active SubPage of the Suite8 Landing triad (Home · Component ·
  // Documentation). Pure-UI, local-only (never synced); DEFAULT = 'home'.
  activeSubPage: Suite8SubPage;

  // Loaded content for the active designation (populated by D4 Diametric file reads)
  loadedDiamondContent: string;
  loadedOnyxContent: string;
  loadedBoundCascade: Record<string, unknown> | null;
  loadedFileSystemSheet: string;

  // GTMS8C · the current agent-authored Shatterite Menu stage (FKIS · IAJW relay drives it).
  // KeyedSelector discipline · NON-OPTIONAL · seeded to EMPTY_MENU_STAGE in createSuite8ClientState.
  // LEGACY (scalar · the single-designation pipe). Retained alongside the keyed Record during the
  // PRE-EPOCH refinement; the keyed `shatteriteMenus` is the N-designation surface (BSSM).
  menuStage: MenuStage;

  // PRE-EPOCH · BSSM keyed Record — one MenuStage per Suite 8 designation (keyed by NDEP Name).
  // The N-watcher principle (WPS) writes a per-designation stage via the keyed Base quality; the
  // SMRP relay broadcasts the keyed relay; this page reads shatteriteMenus[suite8Name]. Always {}
  // at boot — never optional (KeyedSelector · BSSM-Type non-optional discipline).
  shatteriteMenus: Record<string, MenuDocument>;

  // EF-5 · THE INSTALL REQUIREMENTS RECORD (client · relay-fed) — one gate-file snapshot per
  // designation (keyed by NDEP Name). The install watcher (WPS) writes a per-designation payload via
  // the keyed Base quality; the STCP SMRP relay broadcasts suite8SetInstallRequirements; the Suite8
  // Control reads installRequirementsMap[suite8Name]. Always {} at boot (KeyedSelector · never optional).
  installRequirementsMap: Record<string, InstallRequirementsPayload>;

  // B-RLM-2 · THE LOCALITIES RECORD (client · relay-fed) — one locality snapshot per designation.
  // The suite8LocalityStcpRelay SMRP broadcasts suite8SetSyncLocalityClient; this page reads
  // localities[suite8Name] into its syncLocality ref (the poll retirement). Always {} at boot
  // (KeyedSelector). B3b — an empty snapshot (Local sentinel) is first-class, dispatched not guarded.
  localities: Record<string, Suite8SyncLocalitySnapshot>;

  // B-RLM-2/B-RLM-3 · THE CLOSURE GRACES RECORD (client · relay-fed · Scholar AMENDMENT 2) — the
  // relay carries the grace slice TOO so the UI can render the revert countdown (B-RLM-3 renders it;
  // this band relays it). Always {} at boot (KeyedSelector).
  closureGraces: Record<string, Suite8ClosureGrace>;
};

// ============================================
// QUALITY PAYLOAD TYPES
// ============================================

// A-2 MPRF · SPSR Record registration payload (keyed by NDEP Name).
export type Suite8RegisterSuite8Payload = {
  name: string;
  entry: Suite8Entry;
};

export type Suite8RegisterDesignationPayload = {
  designation: Suite8Designation;
};

export type Suite8SetActiveDesignationPayload = {
  designationName: string;
};

export type Suite8SetActiveTabPayload = {
  tab: Suite8Tab;
};

// A-6 HCD — set the active SubPage (Home · Component · Documentation). Local-only UI.
export type Suite8SetActiveSubPagePayload = {
  activeSubPage: Suite8SubPage;
};

export type Suite8SetDiamondContentPayload = {
  diamondContent: string;
};

export type Suite8SetOnyxContentPayload = {
  onyxContent: string;
};

export type Suite8SetBoundCascadePayload = {
  boundCascade: Record<string, unknown> | null;
};

export type Suite8SetFileSystemSheetPayload = {
  fileSystemSheet: string;
};

// GTMS8C · MenuStage relay-reception payload (FKIS · the Anchor-authored Shatterite stage).
export type Suite8SetMenuStagePayload = {
  menuStage: MenuStage;
};
// GTMS8C · Huirth-side Base payload (DISTINCT type string · VERBOSE('SetMenuStageHuirthBase') ·
// Huirth-only · NOT in actionExchange · TQNI byte-match discipline).
export type Suite8SetMenuStageHuirthBasePayload = {
  menuStage: MenuStage;
};

// PRE-EPOCH · BSSM keyed relay-reception payload (designation + stage · keyed merge on client state).
export type Suite8SetDesignationMenuStagePayload = {
  designation: string;
  // C766 · the staged conversion: the keyed circuit carries the WHOLE MenuDocument (all stages +
  // currentStageIndex) under the historical field name — the wire/action shape is unchanged.
  menuStage: MenuDocument;
};
// PRE-EPOCH · BSSM keyed Huirth-side Base payload (DISTINCT type · VERBOSE('SetDesignationMenuStageHuirthBase')
// · Huirth-only · NOT in actionExchange · TQNI byte-match discipline).
export type Suite8SetDesignationMenuStageHuirthBasePayload = {
  designation: string;
  menuStage: MenuDocument;
};

// EF-5 · THE INSTALL REQUIREMENTS RELAY LANE (RD-C class · the install-circuit gate-file feed).
// THE WRAPPER — present carries the existence bit (absence-is-a-state · JDIS Idle = {present:false}).
// The Suite8 Control reads installRequirementsMap[suite8Name].present ? .requirements : null. The
// STCP helper's emptyPayload (the Idle sentinel dispatched on unlink) is { present:false, requirements:null }.
export type InstallRequirementsPayload = {
  present: boolean;
  requirements: InstallRequirementsShape | null;
};
// EF-5 · the keyed relay/Base action payload (ONE shared shape for BOTH qualities · client relay-reception
// + Huirth Base-maintenance). The install watcher's SBIS dispatches this with { designation, payload }.
export type Suite8SetInstallRequirementsPayload = {
  designation: string;
  payload: InstallRequirementsPayload;
};

// B-RLM-2 · THE CLIENT LOCALITY RELAY PAYLOAD — the suite8LocalityStcpRelay broadcasts the FULL
// localities Record AND the FULL closureGraces Record (Scholar AMENDMENT 2 · the grace relay). The
// client reducer REPLACES both slices (the relay carries the authoritative snapshot · the server is
// the single writer of both). Registered in actionExchange (the relay crosses the WebSocket seam).
// B3b — empty Records ({}) are first-class: the relay broadcasts them, the reducer writes them.
export type Suite8SetSyncLocalityClientPayload = {
  localities: Record<string, Suite8SyncLocalitySnapshot>;
  closureGraces: Record<string, Suite8ClosureGrace>;
};

// ============================================
// QUALITY TYPE DEFINITIONS
// ============================================

export type Suite8ClientQualities = {
  suite8RegisterSuite8: Quality<Suite8ClientState, Suite8RegisterSuite8Payload>;
  suite8RegisterDesignation: Quality<Suite8ClientState, Suite8RegisterDesignationPayload>;
  suite8RegisterSampleDesignations: Quality<Suite8ClientState, void>;
  suite8SetActiveDesignation: Quality<Suite8ClientState, Suite8SetActiveDesignationPayload>;
  suite8SetActiveTab: Quality<Suite8ClientState, Suite8SetActiveTabPayload>;
  // A-6 HCD · local SubPage selector — Home · Component · Documentation triad.
  suite8SetActiveSubPage: Quality<Suite8ClientState, Suite8SetActiveSubPagePayload>;
  suite8SetDiamondContent: Quality<Suite8ClientState, Suite8SetDiamondContentPayload>;
  suite8SetOnyxContent: Quality<Suite8ClientState, Suite8SetOnyxContentPayload>;
  suite8SetBoundCascade: Quality<Suite8ClientState, Suite8SetBoundCascadePayload>;
  suite8SetFileSystemSheet: Quality<Suite8ClientState, Suite8SetFileSystemSheetPayload>;
  // GTMS8C · MenuStage relay-reception quality (type-matched to the menu-watch broadcast).
  suite8SetMenuStage: Quality<Suite8ClientState, Suite8SetMenuStagePayload>;
  // PRE-EPOCH · BSSM keyed relay-reception quality (the N-watcher SMRP broadcasts this type).
  suite8SetDesignationMenuStage: Quality<Suite8ClientState, Suite8SetDesignationMenuStagePayload>;
  // EF-5 · the install-requirements relay-reception quality (the install-watcher SMRP broadcasts this).
  suite8SetInstallRequirements: Quality<Suite8ClientState, Suite8SetInstallRequirementsPayload>;
  // B-RLM-2 · the locality relay-reception quality (the suite8LocalityStcpRelay SMRP broadcasts this).
  // Replaces both the localities + closureGraces client slices (the server is the single writer).
  suite8SetSyncLocalityClient: Quality<Suite8ClientState, Suite8SetSyncLocalityClientPayload>;
};

// ============================================
// CONCEPT + DECK TYPES
// ============================================

export type Suite8ClientConcept = Concept<Suite8ClientState, Suite8ClientQualities>;

// ============================================================
// GTMS8C · HUIRTH FACE (thin server-Base home for menuStage + the STCP relay)
// ============================================================
// B-RLM-1′ · THE GRACE AS STATE (the Grace-as-State Fold · the Agreement form). One standing
// closure grace per designation — its EXISTENCE + character become state so the state gates the
// Case-4 relaunch break (never restart anor escalate a standing grace) and the fire-time re-check
// reads it. The temporal fuse itself rides muxiumTimeOut (the Tail Whip · not state). NO optional
// props — KeyedSelector discipline; startedAtIso is Informative record only, NEVER beat-compared.
// Citation: D-RLM-SCHOLAR-STATE-SIGNALS-MEANS.md §2 · DIAMOND-DIAMETRIC-SUITE8-PATTERN.md C750 ADDENDUM.
export type Suite8ClosureGrace = {
  specified: string; // what the grace protects — the specified target key.
  leg: 'watcher' | 'boot'; // which dispatcher opened it (Informative · telemetry).
  graceMs: number; // 8_000 (targeted · kept-me-lost-target) anor 30_000 (systemic · turn-over/boot).
  startedAtIso: string; // Informative only — the grace's birth stamp; never a clock comparand.
};

// B-RLM-2 · THE LOCALITY SNAPSHOT (the Reactive Locality Manifold · relay-fed) — the per-designation
// locality Demometer as state. Mirrors the /suite8-sync-locality GET response shape (localScp ·
// specified · targetScp · ring) so the two poll consumers (Suite8Control · ShatteriteMenu) slot in
// without new mapping logic. Scholar AMENDMENT (D-RLM-SCHOLAR-STATE-SIGNALS-MEANS.md §1): the snapshot
// ALSO carries the discriminator's Informative face in STATE — targetRoot (retires the
// targetRootByDesignation closure Map · the machine's TARGET transition reads this), targetLive +
// localLive (kept-me/lost-me classification the Grace Sentinel reads FROM STATE). NO optional props —
// KeyedSelector discipline; always seeded as {} at boot.
export type Suite8SyncLocalitySnapshot = {
  localScp: string | null;
  specified: string | null;
  targetScp: string | null;
  targetRoot: string | null; // AMENDS r3 — the resolved TARGET root (retires targetRootByDesignation).
  targetLive: boolean; // AMENDS r3 — is the specified target live in the ring (the discriminator's Informative face).
  localLive: boolean; // AMENDS r3 — is the local SCP present + live in the ring (kept-me classification).
  // D-PFR · THE CHANGE-STAMP (Conference 1A) — the TARGET hifiConfig.json's mtimeMs (null =
  // Local anor absent · Honest-Absence · NON-OPTIONAL per the KeyedSelector discipline). The
  // widget refetches the actual colors via the existing loadTargetHifiConfig lane on stamp
  // advance — the colors never ride the snapshot.
  targetHifiStamp: number | null;
  // D-EF-PAGE-PING · origin = the target's browser origin (the client HEAD-probe target).
  ring: { scpName: string; status: string; origin?: string | null }[];
};

export type Suite8HuirthState = {
  menuStage: MenuStage;
  // PRE-EPOCH · BSSM keyed Record mirror on the Huirth (Base) side. The N-watcher dir-watch writes
  // a per-designation stage here via the keyed Base quality (Base-maintenance · Seam 2); the SMRP
  // relay reads this Record selector + broadcasts the keyed relay. Always {} at boot (KeyedSelector).
  shatteriteMenus: Record<string, MenuDocument>;
  // EF-5 · THE INSTALL REQUIREMENTS RECORD (Base mirror). The install watcher's dir-watch writes a
  // per-designation payload here via suite8SetInstallRequirementsHuirthBase (Base-maintenance · Seam 2);
  // the STCP SMRP relay reads this Record selector + broadcasts the keyed relay. Always {} at boot
  // (KeyedSelector · never optional).
  installRequirementsMap: Record<string, InstallRequirementsPayload>;
  // U2 · THE USHER MODE RECORD (the Usher Reframe · DIAMOND-SYNC-LIBRARY.md) — per-designation
  // Sync Library mode, hydrated from SyncLibrary.json by the Usher principle's library watcher.
  // The setStage mode machine's stages selector-gate on this Record. Always {} (KeyedSelector).
  syncModes: Record<string, 'local' | 'target'>;
  // B-RLM-1′ · THE CLOSURE GRACES RECORD — per-designation standing revert grace. Always {} at
  // boot (KeyedSelector). The bridge-json dispatcher writes an entry via suite8BeginClosureGrace
  // (which registers the muxiumTimeOut revert strategy); the fired strategy anor a returned target
  // clears it via suite8CancelClosureGrace. The `!closureGraces[designation]` presence IS the
  // Case-4 has-guard, now as state.
  closureGraces: Record<string, Suite8ClosureGrace>;
  // B-RLM-2 · THE LOCALITIES RECORD — per-designation locality snapshot (relay-fed ground). Always
  // {} at boot (KeyedSelector). The Usher principle's TWO boundary dispatchers (the library watcher's
  // dispatchModeAndLocalityFromDisk + the bridge-json watcher's handleLifecycle + the boot leg)
  // compose a snapshot (pure reads via the model) and dispatch suite8SetLocalityHuirthBase; the
  // suite8LocalityStcpRelay SMRP stage selector-gates on this Record + broadcasts to all clients.
  localities: Record<string, Suite8SyncLocalitySnapshot>;
};
// U2 · the Usher mode Base payload (Huirth-only · NOT in actionExchange · TQNI discipline).
export type Suite8SetSyncModeHuirthBasePayload = {
  designation: string;
  mode: 'local' | 'target';
};

// B-RLM-1′ · THE GRACE-AS-STATE PAYLOADS (Huirth-only · NOT in actionExchange · TQNI discipline).
// suite8BeginClosureGrace — writes the grace entry (reducer · state gate) + registers the
// muxiumTimeOut revert strategy (method · the Agreement form: strategy built ONCE with
// agreement: graceMs + margin, the callback refreshes + fires).
export type Suite8BeginClosureGraceHuirthBasePayload = {
  designation: string;
  specified: string;
  leg: 'watcher' | 'boot';
  graceMs: number;
};
// suite8CancelClosureGrace — clears the grace entry (reducer). The revert strategy's success +
// failure nodes both route here so the clear is state-signaled; the bridge dispatcher also fires
// it when a target returns live.
export type Suite8CancelClosureGraceHuirthBasePayload = {
  designation: string;
  reason: string;
};
// suite8GraceRevertCheck — the revert strategy's CHECK+ACT initial node. The method re-reads
// closureGraces (state) + isSpecifiedTargetLive (boundary Concluder) at FIRE time: grace absent
// anor target returned → strategyFailed (the failure node cancels); target not live → the pure-model
// revert write → strategySuccess (the success node cancels).
export type Suite8GraceRevertCheckHuirthBasePayload = {
  designation: string;
};

// B-RLM-2 · THE LOCALITY BASE PAYLOAD (Huirth-only · NOT in actionExchange · TQNI discipline).
// suite8SetLocalityHuirthBase — writes one designation's locality snapshot into the localities
// Record (keyed write · shortest-path reducer · no-op on identical JSON). The Usher's two boundary
// dispatchers + the boot leg dispatch it.
export type Suite8SetLocalityHuirthBasePayload = {
  designation: string;
  snapshot: Suite8SyncLocalitySnapshot;
};

// C909 · THE ACCOUNTED SETTLE PAYLOAD (Huirth-only · NOT in actionExchange · TQNI discipline).
// suite8AccountedChangeDebounce — the debounce node PRIOR to the SET on the accounted-change
// path (null reducer · createMethodDebounce 400ms settle · only the LAST strategy of a burst
// passes to its SET successNode). The designation rides for telemetry/identity; the SET node
// carries the real snapshot payload.
export type Suite8AccountedChangeDebouncePayload = {
  designation: string;
};

export type Suite8HuirthQualities = {
  suite8SetMenuStageHuirthBase: Quality<Suite8HuirthState, Suite8SetMenuStageHuirthBasePayload>;
  // PRE-EPOCH · BSSM keyed Huirth Base quality (the N-watcher dispatches this FIRST · Base-maintenance).
  suite8SetDesignationMenuStageHuirthBase: Quality<
    Suite8HuirthState,
    Suite8SetDesignationMenuStageHuirthBasePayload
  >;
  // EF-5 · the install-requirements keyed Huirth Base quality (the install-watcher dispatches this
  // FIRST · Base-maintenance · Huirth-only · NOT in actionExchange · TQNI). ONE shared payload type.
  suite8SetInstallRequirementsHuirthBase: Quality<
    Suite8HuirthState,
    Suite8SetInstallRequirementsPayload
  >;
  // U2 · the Usher mode Base quality (the library watcher dispatches; the machine gates).
  suite8SetSyncModeHuirthBase: Quality<Suite8HuirthState, Suite8SetSyncModeHuirthBasePayload>;
  // B-RLM-1′ · THE GRACE-AS-STATE TRIAD (all Huirth-only · local · NOT in actionExchange).
  suite8BeginClosureGraceHuirthBase: Quality<
    Suite8HuirthState,
    Suite8BeginClosureGraceHuirthBasePayload
  >;
  suite8CancelClosureGraceHuirthBase: Quality<
    Suite8HuirthState,
    Suite8CancelClosureGraceHuirthBasePayload
  >;
  suite8GraceRevertCheckHuirthBase: Quality<
    Suite8HuirthState,
    Suite8GraceRevertCheckHuirthBasePayload
  >;
  // B-RLM-2 · THE LOCALITY BASE (Huirth-only · local reducer · NOT in actionExchange · the two
  // Usher boundary dispatchers + boot leg dispatch it; the locality relay reads localities + broadcasts).
  suite8SetLocalityHuirthBase: Quality<
    Suite8HuirthState,
    Suite8SetLocalityHuirthBasePayload
  >;
  // C909 · THE ACCOUNTED SETTLE (Huirth-only · null reducer · NOT in actionExchange · the
  // debounce node prior — the accounted lane dispatches the two-node strategy through it).
  suite8AccountedChangeDebounce: Quality<
    Suite8HuirthState,
    Suite8AccountedChangeDebouncePayload
  >;
};
export type Suite8HuirthConcept = Concept<Suite8HuirthState, Suite8HuirthQualities>;

// A-1 SCBM · Suite8 muxifies SuiteCascade → the Deck carries `suiteCascade` at Tier 2
// (flat, ONE shared instance · Scholar §2). DECK K reach:
//   d.suite8.k.suite8s.select()                    — Tier 1 (own Record)
//   d.suiteCascade.k.cascades.select()    — Tier 2 (shared Record)
// NEVER Tier 3 — SuiteCascade muxifies nothing further (ECK ceiling satisfied by design).
export type Suite8Deck = {
  suite8: Suite8ClientConcept & {
    d: {
      suiteCascade: Concept<SuiteCascadeState, SuiteCascadeQualities>;
    };
  };
};

export type Suite8ClientDeck = MuxiumDeck & Suite8Deck;

// ============================================
// PRINCIPLE TYPE
// ============================================

export type Suite8Principle = PrincipleFunction<
  Suite8ClientQualities,
  MuxiumDeck & Suite8Deck,
  Suite8ClientState
>;

// ============================================
// CONSTANTS
// ============================================

export const DEFAULT_SUITE8_ACTIVE_TAB: Suite8Tab = 'info';

// A-6 HCD — the default SubPage the Landing opens on (the Suite 8 roster).
export const DEFAULT_SUITE8_SUB_PAGE: Suite8SubPage = 'home';
export const SUITE8_TABS: { value: Suite8Tab; label: string }[] = [
  { value: 'info', label: 'Info Sheet' },
  { value: 'doviewer', label: 'D-O Viewer' },
  { value: 'settings', label: 'Settings' },
];

// GTMS8C · the Suite 8 designation display name — the RI dir basename under Cascades/Extended/
// AND the suite8Name the menu-watch principle + PAOLRP match in sessionsList. The install Opus
// sets this to the user's domain (one of the non-derivable surfaces · see W5 rename list).
export const DEFAULT_SUITE8_DESIGNATION_NAME = 'Template Suite 8';
// GTMS8C · the menu.json basename the Anchor writes + the menu-watch dir-watch monitors.
export const SUITE8_MENU_JSON_BASENAME = 'menu.json';
