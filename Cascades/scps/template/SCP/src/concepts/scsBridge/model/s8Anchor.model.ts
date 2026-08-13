/**
 * s8Anchor.model · BO-1 · THE RENAME-PROOF ANCHOR CONTRACT (the C373 `s8` law).
 *
 * THE PROBLEM THIS SOLVES: `scs suite8:page` copy-move-renames a Suite 8 concept and
 * token-rewrites `suite8`/`Suite8` in file CONTENT. Any copied code that touches a
 * SHARED contract through those tokens breaks silently on every mint:
 *   - the bridge session-entry field `suite8Name` (rewritten accessor `s.codeEditorName`
 *     is undefined on every session → the anchor lookup never matches — the BO-1 kill),
 *   - the shared server route `/suite8-anchor-spawn/...` (rewritten fetch 404s).
 *
 * THE LAW: shared-contract touchpoints live HERE — a scsBridge model that is NEVER
 * copied, exported under names carrying only the `s8` compact (no `suite8`/`Suite8`
 * token → the mint rewrite cannot touch the import specifiers or call sites). The
 * proven precedent: `triggerSpawnS8Session` (C373) survives every mint.
 *
 * EVERY Suite-8-page component (source AND its mint copies) resolves anchors and the
 * anchor-spawn route THROUGH these helpers — never through inline `.suite8Name`
 * comparisons or route literals.
 */

// FM-2 · the conduction-target read is the SAME shared-stratum law: the registry field
// (targetSuite8Name) is read ONLY through the held model — a twin's token-rename can never
// touch it. No import cycle: scpLocalityClientAccess.model imports nothing.
import { readConductionTarget } from '../../../model/scpLocalityClientAccess.model';

// Structural session shape — the fields the anchor contract reads. Kept structural so
// copies compile against whatever session type their rewrite produced.
export type S8SessionLike = {
  id: string;
  status?: string;
  suite8Name?: string;
  isAnchor?: boolean;
  scpName?: string;
};

/** The page's Anchor: the session bound to this designation with isAnchor (authoritative).
 *  D-AFS · THE ANCHOR SCOPE — optional scpName narrows to ONE citizen's anchor (the Anchor
 *  Scope Law client half: anchor identity = (suite8Name, scpName)). Omitted = legacy
 *  designation-wide first-match (transitional callers only — scope where possible). */
export function resolveS8Anchor<T extends S8SessionLike>(
  sessions: T[] | null | undefined,
  designation: string,
  scpName?: string,
): T | undefined {
  if (!sessions || !designation) return undefined;
  return sessions.find(
    (s) =>
      s.suite8Name === designation &&
      (scpName === undefined || (s.scpName ?? null) === scpName) &&
      s.isAnchor === true,
  );
}

/** D-AFS · the per-citizen anchor roster for a designation — the Local tab strip's ground.
 *  Every isAnchor row for the designation (one per citizen under the Anchor Scope Law);
 *  tab labels render from each row's scpName. */
export function listS8AnchorsByScp<T extends S8SessionLike>(
  sessions: T[] | null | undefined,
  designation: string,
): T[] {
  if (!sessions || !designation) return [];
  return sessions.filter((s) => s.suite8Name === designation && s.isAnchor === true);
}

/** A LIVE session for this designation (status launched · optional scpName narrowing). */
export function findLiveS8Session<T extends S8SessionLike>(
  sessions: T[] | null | undefined,
  designation: string,
  scpName?: string,
): T | undefined {
  if (!sessions || !designation) return undefined;
  return sessions.find(
    (s) =>
      s.suite8Name === designation &&
      (scpName === undefined || s.scpName === scpName) &&
      s.status === 'launched',
  );
}

/** FM-2 · 2A · A LIVE conduction COMMISSIONED to the given PAGE — the target-aware ONE MOTION
 *  find. Sits BESIDE the stable `findLiveS8Session` (whose signature stays byte-unchanged —
 *  its existing callers key SCP-scoped liveness); this keys the registry's `targetSuite8Name`
 *  via the HELD `readConductionTarget`, so a page-scoped pool never collides an update-Forge
 *  with another page's build-Forge (the Suite8Control ONE MOTION verdict, cured). A target-less
 *  (legacy) session can NEVER match — the page widget's legacy exclusion falls out here. */
export function findLiveS8ConductionForTarget<T extends S8SessionLike>(
  sessions: T[] | null | undefined,
  designation: string,
  scpName: string | undefined,
  targetSuite8Name: string,
): T | undefined {
  if (!sessions || !designation || !targetSuite8Name) return undefined;
  return sessions.find(
    (s) =>
      s.suite8Name === designation &&
      (scpName === undefined || s.scpName === scpName) &&
      s.status === 'launched' &&
      readConductionTarget(s) === targetSuite8Name,
  );
}

/** ALL sessions for this designation — callers chain their own status/scp filters. */
export function filterS8Sessions<T extends S8SessionLike>(
  sessions: T[] | null | undefined,
  designation: string,
): T[] {
  if (!sessions || !designation) return [];
  return sessions.filter((s) => s.suite8Name === designation);
}

/** The shared anchor-spawn route (registered in vue.principle — one literal, held here). */
export function s8AnchorSpawnPath(designation: string): string {
  return `/suite8-anchor-spawn/${encodeURIComponent(designation)}`;
}
