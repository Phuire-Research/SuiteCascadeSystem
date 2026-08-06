/**
 * scpLocalityClientAccess.model.ts — D-MINT-SURFACE · THE HELD LOCALITY ACCESS
 *
 * THE NAME LAW: this file's name (and every export name) is TOKEN-FREE — no 'suite8'
 * in any casing — because it is imported FROM the mint copy surface. The mint engine
 * token-renames the copied Suite 8 components; a token-free import specifier + token-free
 * export names survive that rename untouched.
 *
 * WHY THIS MODULE EXISTS: the sync-locality state lives ONLY on the suite8 client
 * concept (`d.client.d.suite8.k.localities` — the HELD relay writes there and the
 * ClientMuxiumDeck reaches it from ANY page), and the locality endpoint is registered
 * ONCE (vue.principle — outside the copy surface). A minted twin's token-renamed copies
 * of Suite8Control/ShatteriteMenu would otherwise read `d.client.d.<domain>` (a dead
 * Register) and fetch `/<domain>-sync-locality` (a 404). Every suite8-tokened access
 * those components need lives HERE — held, never copied, never renamed — so minted
 * pages keep reading the ONE true slice and the ONE true endpoint.
 *
 * The designation KEY stays the component's own prop (renames fine in twins — each
 * page reads its own key); only the CONCEPT PATH and the ENDPOINT are pinned.
 */

export const syncLocalityEndpoint = (designation: string): string =>
  `/suite8-sync-locality/${encodeURIComponent(designation)}`;

export const readClientSyncLocalities = (d: any): Record<string, unknown> =>
  d.client.d.suite8.k.localities.select() as Record<string, unknown>;

export const clientSyncLocalitiesSelector = (d__: any): any =>
  d__.client.d.suite8.k.localities;

export const dispatchClientSyncLocalitySnapshot = (
  muxium: { dispatch: (action: any) => void; deck: any },
  designation: string,
  snapshot: unknown,
): void => {
  muxium.dispatch(
    muxium.deck.d.client.d.suite8.e.suite8SetSyncLocalityClient({
      localities: { [designation]: snapshot },
      closureGraces: {},
    }),
  );
};
