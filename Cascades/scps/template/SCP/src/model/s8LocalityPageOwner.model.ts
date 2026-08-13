/**
 * s8LocalityPageOwner.model.ts — V-4g · THE PAGE-OWNED LOCALITY (the user's ruling)
 *
 * The MUXIUM is the PAGE's — so the page owns the ONE locality subscription. The landing
 * arms this owner right after creating+binding its muxium (no ARM-ON-BIND race exists at
 * that seat), and the owner PUBLISHES the locality face into the shared controller ref.
 * Every surface (the Shatterite chip · the toolbar S8 face · the drawer panel) READS the
 * shared face; the panel merely writes (POST) and triggers the owner's refresh — its mount
 * state no longer carries any truth (the drawer-close revert dies here).
 *
 * TOKEN-FREE (held · never copied): concept access rides the C820 shape discovery.
 */
import type { Muxium } from 'stratimux';
import {
  syncLocalityEndpoint,
  readClientSyncLocalities,
  clientSyncLocalitiesSelector,
  dispatchClientSyncLocalitySnapshot,
  debugS8LocalityDeckKeys,
} from './scpLocalityClientAccess.model';
import { getGlobalScsBridgeController, type S8LocalityFace } from '../concepts/scsBridge/scsBridgeController';

type AnySnapshot = {
  localScp?: unknown; specified?: unknown; targetScp?: unknown;
  targetLive?: unknown; localLive?: unknown; targetHifiStamp?: unknown; targetPatternLibraryStamp?: unknown; ring?: unknown;
};

const toFace = (snap: AnySnapshot): S8LocalityFace => ({
  localScp: typeof snap.localScp === 'string' ? snap.localScp : null,
  specified: typeof snap.specified === 'string' ? snap.specified : null,
  targetScp: typeof snap.targetScp === 'string' ? snap.targetScp : null,
  targetLive: snap.targetLive === true,
  targetHifiStamp: typeof snap.targetHifiStamp === 'number' ? snap.targetHifiStamp : null,
  targetPatternLibraryStamp: typeof snap.targetPatternLibraryStamp === 'number' ? snap.targetPatternLibraryStamp : null,
  ring: Array.isArray(snap.ring)
    ? (snap.ring as { scpName?: unknown; status?: unknown }[])
      .filter((e) => typeof e.scpName === 'string')
      .map((e) => ({ scpName: e.scpName as string, status: typeof e.status === 'string' ? e.status : 'offline' }))
    : [],
});

export const armS8LocalityPageOwner = (
  muxium: Muxium<any>,
  designation: string,
): { conclude: () => void } => {
  const push = (face: S8LocalityFace) => {
    getGlobalScsBridgeController()?.setCurrentS8Locality(face);
  };
  const hydrate = (): void => {
    void fetch(syncLocalityEndpoint(designation))
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data || typeof data !== 'object') return;
        const face = toFace(data as AnySnapshot);
        console.log('[S8-LOC] owner HYDRATE ·', designation, '· specified=', face.specified, '· targetLive=', face.targetLive);
        push(face);
        dispatchClientSyncLocalitySnapshot(muxium as { dispatch: (a: any) => void; deck: any }, designation, {
          localScp: face.localScp, specified: face.specified, targetScp: face.targetScp,
          targetRoot: null, targetLive: face.targetLive, localLive: (data as AnySnapshot).localLive === true,
          targetHifiStamp: face.targetHifiStamp ?? null,
          targetPatternLibraryStamp: face.targetPatternLibraryStamp ?? null,
          ring: face.ring,
        });
      })
      .catch((err) => console.warn('[S8-LOC] owner hydrate FAILED ·', designation, err));
  };
  console.log('[S8-LOC] owner ARM ·', designation, '· deck=', JSON.stringify(debugS8LocalityDeckKeys(muxium as { deck: any })));
  const planner = (muxium as Muxium<any>).plan<any>(
    's8LocalityPageOwner',
    ({ staging, stage, d__ }: any) =>
      staging(() => [
        stage(
          ({ d }: any) => {
            const record = readClientSyncLocalities(d) as Record<string, AnySnapshot>;
            const snap = record[designation];
            console.log('[S8-LOC] owner STAGE fire · recordKeys=', JSON.stringify(Object.keys(record)), '· mine=', snap ? `specified=${snap.specified}` : 'ABSENT');
            if (snap) push(toFace(snap));
          },
          { selectors: [clientSyncLocalitiesSelector(d__)] },
        ),
      ]),
  );
  getGlobalScsBridgeController()?.registerS8LocalityRefresh(hydrate);
  hydrate();
  return {
    conclude: () => {
      planner.conclude();
      getGlobalScsBridgeController()?.registerS8LocalityRefresh(null);
      getGlobalScsBridgeController()?.setCurrentS8Locality(null);
    },
  };
};
