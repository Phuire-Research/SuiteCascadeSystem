/**
 * cascadeMemoryQuery.model.ts — CMLS-R · THE CASCADE MEMORY QUERY SURFACE (fetch on demand)
 *
 * THE NAME LAW: held · token-free · never copied by the mint.
 *
 * THE REFINEMENT'S FIRST ARM (the user's frame): the reactive chain (signal watch → edge →
 * sweep → re-point → reload → relay) is honest but MULTI-HOP — the switch feels delayed.
 * These routes give the switch its IMMEDIATE arm: (1) query INTO an SCP's Suite 8s (the
 * roster of its Extended tree), (2) by NAME query a specific Suite 8's Cascade Memory —
 * so the client fetches the target's memory the moment the switch lands, while the
 * re-point places the change detection in parallel (the reactive updating retained).
 *
 * RESOLUTION: scpName → root rides the SL-2 bridge key ring (readSyncRingFromBridgeJson —
 * {scpName, root, status}); the OWN SCP resolves to process.cwd() (ring-independent).
 * Reads are traversal-guarded; absence is HONEST (404 anor empty — never a local
 * masquerade; the Honest-Absence Law extends to the query surface).
 */
import fs from 'node:fs';
import path from 'node:path';
import { readSyncRingFromBridgeJson, readLocalScpName } from './scpSyncLibrary.model';

type MinimalExpressApp = {
  get: (routePath: string, handler: (req: any, res: any) => void) => void;
};

// scpName → the SCP's package root. The own SCP answers from cwd; others from the ring.
export const resolveScpRootByName = (scpName: string): string | null => {
  if (!scpName) return null;
  // C847 · THE RESERVED LOCAL NAME — the release's target is KNOWN (the own ground); a
  // 'Local' query resolves own-cwd directly and NEVER consults the seat (the release-race
  // cure: the on-demand fetch raced the server's ~1.3s release and floored the stale seat).
  if (scpName === 'Local') return process.cwd();
  const local = readLocalScpName();
  if (local && local === scpName) return process.cwd();
  const ring = readSyncRingFromBridgeJson();
  const entry = ring.find((e) => e.scpName === scpName);
  return entry && typeof entry.root === 'string' && entry.root.length > 0 ? entry.root : null;
};

const designationIsSane = (designation: string): boolean =>
  !!designation
  && !designation.includes('/')
  && !designation.includes('\\')
  && !designation.includes('..');

export const registerCascadeMemoryQueryRoutes = (expressApp: MinimalExpressApp): void => {
  // (1) THE ROSTER QUERY — the target SCP's Suite 8s (its Extended tree's designations).
  expressApp.get('/scp-suite8s/:scpName', (req, res) => {
    const scpName = String(req.params.scpName ?? '');
    const root = resolveScpRootByName(scpName);
    if (!root) {
      res.status(404).json({ ok: false, error: `unknown SCP: ${scpName}` });
      return;
    }
    const extendedBase = path.resolve(root, 'Cascades', 'Extended');
    let suite8s: string[] = [];
    try {
      suite8s = fs.readdirSync(extendedBase, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
        .sort();
    } catch {
      /* the tree is absent — an honest empty roster */
    }
    res.json({ ok: true, scpName, suite8s });
  });

  // (2) THE BY-NAME MEMORY QUERY — a specific Suite 8's Cascade Memory at the named SCP.
  // The response shape mirrors the floor route (name · cascadeJson · activeCascadeFiles ·
  // serving · resolvedDir) so the client's floor consumes either interchangeably.
  expressApp.get('/scp-cascade-memory/:scpName/:designation', (req, res) => {
    const scpName = String(req.params.scpName ?? '');
    const designation = String(req.params.designation ?? '');
    if (!designationIsSane(designation)) {
      res.status(400).json({ ok: false, error: 'bad designation' });
      return;
    }
    const root = resolveScpRootByName(scpName);
    if (!root) {
      res.status(404).json({ ok: false, error: `unknown SCP: ${scpName}` });
      return;
    }
    const extendedBase = path.resolve(root, 'Cascades', 'Extended');
    const dir = path.resolve(extendedBase, designation);
    // Traversal guard — the resolved dir must stay inside the target's Extended base.
    if (dir === extendedBase || !dir.startsWith(extendedBase + path.sep)) {
      res.status(400).json({ ok: false, error: 'bad designation' });
      return;
    }
    let cascadeJson: Record<string, unknown> | null = null;
    try {
      cascadeJson = JSON.parse(fs.readFileSync(path.resolve(dir, 'Cascade.json'), 'utf-8')) as Record<string, unknown>;
    } catch {
      /* absent manifest — an honest empty memory (the C835 surface renders it plainly) */
    }
    const activeCascadeFiles: { filePath: string; content: string }[] = [];
    if (cascadeJson) {
      const seen = new Set<string>();
      for (const key of ['activeDiamond', 'activeOnyx']) {
        const value = cascadeJson[key];
        if (typeof value !== 'string' || value.length === 0 || seen.has(value)) continue;
        seen.add(value);
        // designation-relative first · the TARGET root as the cross-aware fallback
        // (never the local cwd — the C837 fix-1 discipline).
        for (const candidate of [path.resolve(dir, value), path.resolve(root, value)]) {
          try {
            activeCascadeFiles.push({ filePath: value, content: fs.readFileSync(candidate, 'utf-8') });
            break;
          } catch {
            /* try the next candidate */
          }
        }
      }
    }
    res.json({
      name: designation,
      cascadeJson,
      activeCascadeFiles,
      serving: scpName,
      resolvedDir: dir,
    });
  });

  // (3) THE BY-NAME HIFI-CONFIG QUERY — the target SCP's shipped HiFi design (colors + patterns).
  // MD-USP · US-3 · Pewter's color-locality adaptation: a Specified locality on Pewter previews the
  // TARGET citizen's SCS COLORS (the hifiConfig.json relay — NOT its documents). This is the cross-SCP
  // twin of the LOCAL /hifi-config route (vue.principle.ts) — SAME filename, SAME read shape, the ONLY
  // difference being the by-name resolved root in place of the own cwd. The local route reads
  // path.resolve(process.cwd(), 'Cascades', 'hifiConfig.json'); this reads the target root's identical
  // Cascades/hifiConfig.json. hifiConfig.json is a fixed filename with no user-controlled path segment —
  // no traversal guard needed (the scpName resolution is already ring-guarded by resolveScpRootByName).
  // Absent / unreadable / malformed → {} (the Honest-Absence Law — never a local masquerade; the client
  // treats a non-HifiConfig {} as null and shows the honest "no color design" state).
  expressApp.get('/scp-hifi-config/:scpName', (req, res) => {
    const scpName = String(req.params.scpName ?? '');
    const root = resolveScpRootByName(scpName);
    if (!root) {
      res.status(404).json({ ok: false, error: `unknown SCP: ${scpName}` });
      return;
    }
    try {
      const raw = fs.readFileSync(path.resolve(root, 'Cascades', 'hifiConfig.json'), 'utf-8');
      res.json(JSON.parse(raw));
    } catch {
      res.json({});
    }
  });
};
