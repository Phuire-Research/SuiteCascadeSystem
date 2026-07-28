export type OnboardValues = Record<string, string>;

export const STVI_ABSENT_FALLBACK = '(resolved at call time)';

/**
 * STVI · hydrateOnboardTemplate
 *
 * Replace each {{VAR_NAME}} occurrence in `raw` with the corresponding value
 * from `values`. Matching is exact: the key must appear as {{KEY}} with an
 * uppercase snake-case interior (A-Z 0-9 _).
 *
 * Replace-known-only (S4 correction): if a matched key is NOT present in
 * `values`, the literal {{KEY}} is returned UNCHANGED. This guarantees a
 * literal {{VAR}} that is not a STVI value is never corrupted. STVI vars carry
 * their own value-or-fallback (see buildOnboardValues), so the anchor always
 * sees a meaningful string at the STVI positions while any genuinely-unknown
 * token is left intact.
 *
 * Pure: no I/O, no imports, no side effects.
 */
export function hydrateOnboardTemplate(
  raw: string,
  values: OnboardValues,
): string {
  return raw.replace(/\{\{([A-Z0-9_]+)\}\}/g, (match, key: string) => {
    return Object.prototype.hasOwnProperty.call(values, key)
      ? values[key]
      : match;
  });
}

/**
 * SMO · composeAnchorOnboardPrompt
 *
 * Compose the generic Shatterite Menu How (prepended) with the STVI-hydrated,
 * per-Suite-8 Onboard.md Why. The How comes FIRST so every anchor reads the menu
 * mechanics before its own routine; a clear separator delimits the two halves.
 *
 * If shatteriteMenuHow is empty (the doc was absent at spawn, or whitespace-only),
 * the helper returns the hydrated Onboard alone — the routine still onboards; only
 * the prepended How is missing (graceful-absent guard).
 *
 * Pure: no I/O, no imports, no side effects.
 */
export function composeAnchorOnboardPrompt(
  shatteriteMenuHow: string,
  hydratedOnboard: string,
): string {
  const how = shatteriteMenuHow.trim();
  if (!how) return hydratedOnboard;
  return `${how}\n\n---\n\n${hydratedOnboard}`;
}
