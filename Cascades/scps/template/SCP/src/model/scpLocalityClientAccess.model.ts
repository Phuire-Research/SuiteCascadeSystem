/**
 * scpLocalityClientAccess.model.ts — D-MINT-SURFACE · THE HELD LOCALITY ACCESS
 * V-4e · THE SHAPE DISCOVERY (the C820 correction)
 *
 * THE NAME LAW: this file's name (and every export name) is TOKEN-FREE — no 'suite8'
 * in any casing — because it is imported FROM the mint copy surface. The mint engine
 * token-renames the copied Suite 8 components; a token-free import specifier + token-free
 * export names survive that rename untouched.
 *
 * THE CORRECTED GROUND (the prior header's claim is falsified by the twin islands): the
 * sync-locality state lives on the PAGE'S OWN Suite 8 client concept — `d.client.d.suite8`
 * on the template/Cadmium islands, `d.client.d.<twinName>` on a minted twin's island (the
 * mint renames the concept NAME, so the deck key renames with it; the twin island does NOT
 * compose a 'suite8' concept at all). A literal `d.client.d.suite8` path is therefore a
 * DEAD read exactly where the rename happens. This module now DISCOVERS the composed S8
 * concept BY SHAPE — the deck entry carrying the `localities` Register, and its SET action
 * by the `SetSyncLocalityClient` suffix — token-free structurally, correct on EVERY island.
 * (Muxified Concept Access: 2nd-tier `d.client.d.<s8>` — found, never named.)
 *
 * The designation KEY stays the component's own prop (renames fine in twins — each
 * page reads its own key); the ENDPOINT stays pinned (registered once in vue.principle,
 * outside the copy surface — it answers for every designation).
 */

export const syncLocalityEndpoint = (designation: string): string =>
  `/suite8-sync-locality/${encodeURIComponent(designation)}`;

// THE SHAPE DISCOVERY — the composed S8 concept is the client sub-deck carrying the
// `localities` Register. suite8 checked first for determinism where it composes; otherwise
// the first (and only) shape match — a page island composes exactly one S8 concept.
const findS8LocalityDeckEntry = (clientDeck: any): any => {
  const sub = clientDeck?.d;
  if (!sub) return undefined;
  if (sub.suite8?.k?.localities) return sub.suite8;
  for (const key of Object.keys(sub)) {
    if (sub[key]?.k?.localities) return sub[key];
  }
  return undefined;
};

export const readClientSyncLocalities = (d: any): Record<string, unknown> =>
  (findS8LocalityDeckEntry(d.client)?.k.localities.select() ?? {}) as Record<string, unknown>;

export const clientSyncLocalitiesSelector = (d__: any): any =>
  findS8LocalityDeckEntry(d__.client)?.k.localities;

// EF-3′c · THE CONDUCTION TARGET READ — the registry FIELD name (targetSuite8Name) is a
// shared-stratum key on every relayed session entry; a copied component's token-rename
// would convert a direct `entry.targetSuite8Name` access into a nonexistent property
// (the C786 field find: every twin chip read 'unlabeled' while the registry held the
// target). The access lives HERE (held · never renamed) so twins read the ONE true field.
export const readConductionTarget = (entry: unknown): string | undefined => {
  const t = (entry as Record<string, unknown>)['targetSuite8Name'];
  return typeof t === 'string' && t.length > 0 ? t : undefined;
};

export const dispatchClientSyncLocalitySnapshot = (
  muxium: { dispatch: (action: any) => void; deck: any },
  designation: string,
  snapshot: unknown,
): void => {
  const entry = findS8LocalityDeckEntry(muxium.deck?.d?.client);
  if (!entry?.e) return;
  // The SET action discovered by suffix — 'suite8SetSyncLocalityClient' on the template,
  // '<twinName>SetSyncLocalityClient' on a minted twin (the rename moves the prefix only).
  const setKey = Object.keys(entry.e).find((k) => k.endsWith('SetSyncLocalityClient'));
  if (!setKey) return;
  muxium.dispatch(
    entry.e[setKey]({
      localities: { [designation]: snapshot },
      closureGraces: {},
    }),
  );
};
