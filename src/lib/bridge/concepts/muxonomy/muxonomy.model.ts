/**
 * SCS Bridge Muxonomy Model · Minimum-Viable Shim · Cycle 128 Phase B.0
 *
 * Template: ADMIN_ICP/src/concepts/muxonomy/muxonomy.model.ts (25,931 bytes · full surface)
 * SCP-specific: minimum-viable surface for SCS-Bridge concepts · 6 muxonomy.ts consumers
 *
 * Phase B.0 scope (this file): MuxonomicConfig + ChangeDetectionMode + DeploymentTarget
 *   + supporting types (NovelChangeConfig · SyncConfig · ConceptDemometers · DeckReferences).
 *   NO navigation · NO icpToolMetadata · NO concept-creator/muxium-creator helpers
 *   (those belong to a future runtime registry · NOT consumed by Phase B.0).
 *
 * Phase B.0 precondition: enables the 6 SCS-Bridge concept muxonomy.ts files to
 * declare filterKeys exclusions for non-serializable state fields (R4 §1 Angle 2
 * catalogue: FSWatcher × 3 · Set<string> × 1 · Application × 1 · plus consumer-facing
 * Maps where the .helpers.ts pattern is not used).
 *
 * Future Phase B+ extensions: as SCS gains client/sync runtime, this shim can grow
 * the optional fields (navigation, icpToolMetadata) and the omitted helpers
 * (MuxonomicConcept union, IndividualizedMuxonomic, MuxiumCreatorWithMuxonomy, etc.)
 * via verbatim Copy-Paste-Plus from ADMIN_ICP.
 *
 * Citation: M61 Project-Totality Authoritative Scope · M63 Copy-Paste-Plus Canonical
 * Citation: ADMIN_ICP/src/concepts/muxonomy/muxonomy.model.ts:70-405 (verbatim shape)
 * Citation: R4 SUITE-4-GREEN-COPY-PASTE-PLUS-BIDIRECTIONAL.md §1 Angle 2 (filterKeys mandate)
 */

// ============================================
// DEPLOYMENT TARGET (Quality/Principle Targeting)
// ============================================

/**
 * DeploymentTarget: Where a Quality or Principle runs.
 *
 * SCS-Bridge runs Huirth-only (Node.js process · no client bundle in Phase B.0).
 * The All / Client variants remain enumerated for ADMIN_ICP precedent compatibility
 * and future SCS multi-target expansion.
 */
export enum DeploymentTarget {
  All = 'all',
  Huirth = 'huirth',
  Client = 'client',
}

// ============================================
// NOVEL CHANGE DETECTION
// ============================================

export enum ChangeDetectionMode {
  Deep = 'deep',
  Shallow = 'shallow',
  KeyedSelector = 'keyedSelector',
}

export type NovelChangeConfig = {
  mode: ChangeDetectionMode;
  ignoreProperties?: string[];
};

// ============================================
// SYNCHRONIZATION CONFIGURATION
// ============================================

export type SyncDirection = 'toServer' | 'toClient' | 'bidirectional';

export type SyncConfig = {
  direction: SyncDirection;
  filterKeys: string[];
  novelChange: NovelChangeConfig;
  syncVersion?: number;
  syncManaged?: boolean;
};

// ============================================
// CONCEPT DEMOMETER TYPES
// ============================================

export type QualityDemometer = {
  name: string;
  type: string;
  filePath: string;
  location: DeploymentTarget;
  diameter: boolean;
};

export type StrategyDemometer = {
  name: string;
  filePath: string;
};

export type PrincipleDemometer = {
  name: string;
  filePath: string;
  location: DeploymentTarget;
};

export type ConceptDemometers = {
  qualities: QualityDemometer[];
  strategies: StrategyDemometer[];
  principles: PrincipleDemometer[];
};

// ============================================
// DECK REFERENCES
// ============================================

export type DeckReferences = {
  huirth: string;
  client: string;
};

// ============================================
// MUXONOMIC CONFIG (Phase B.0 Surface)
// ============================================

/**
 * MuxonomicConfig: Per-concept muxonomy declaration.
 *
 * Phase B.0 consumers: 6 SCS-Bridge concept muxonomy.ts files declaring
 * filterKeys exclusions for non-serializable state fields.
 *
 * Optional fields (navigation, icpToolMetadata) are omitted from the shim —
 * they remain available for future Copy-Paste-Plus from ADMIN_ICP when SCS
 * gains the corresponding runtime consumers.
 */
export type MuxonomicConfig<
  ConceptName extends string = string,
> = {
  conceptName: ConceptName;
  filterKeys: string[];
  novelChange: NovelChangeConfig;
  sync: SyncConfig;
  demometers: ConceptDemometers;
  decks: DeckReferences;
  // Cycle 139 CPPP · scp.muxonomy.ts + scp.principles reference scpToolMetadata.
  // Optional structural array of SCP tool metadata records. Kept as the
  // concrete SCPQualityMetadata-compatible structure but typed as `unknown[]`
  // here to avoid a circular dependency between muxonomy.model.ts and
  // concepts/scp/scp.types.ts. Downstream consumers cast to the concrete
  // SCPQualityMetadata type at consumption sites.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  scpToolMetadata?: any[];
};
