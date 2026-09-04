/**
 * SCP Identity Storage Model (TOH-12 · THE SOVEREIGN-IDENTITY SYNCHRONOUS STORAGE SCOPE)
 *
 * The SINGLE synchronous localStorage keying helper. The browser scopes localStorage by
 * scheme+host+PORT — so the port IS the SCP's browser identity, and a recycled port hands
 * the next SCP the prior SCP's entire store (the PortableExpanse→Stratithon recorded event).
 * Port Sovereignty (the CLI-side mend) removes the cause; THIS helper is the defense in
 * depth: keys carrying SCP-owned state are scoped by the SCP's OWN NAME, so even an
 * inherited origin never reads a prior tenant's carriers.
 *
 * WHY NOT THE localStorage CONCEPT: the turn-over carrier (gitmTurnover.model.ts) is
 * written SYNCHRONOUSLY at click and read SYNCHRONOUSLY in the WS-close handler, ACROSS A
 * SERVER DEATH. The localStorage Concept is async and encrypted — it structurally cannot
 * serve that seam. This helper is bare, synchronous, and unencrypted BY DESIGN; ordinary
 * UI-preference sites belong in the Concept, not here.
 *
 * THE IDENTITY SOURCE: scpName comes from GET /scp-config — which is DARK during a
 * turn-over outage. So the last CONFIRMED identity is itself persisted (synchronously,
 * under a deliberately UN-scoped bootstrap key — it IS the scope root) every time
 * loadScpConfig succeeds. Structural safety: a page can only load while its own server is
 * alive, so the identity is confirmed before any outage can matter; a recycled port's new
 * tenant re-confirms its OWN name at first load, orphaning (never reading) the prior
 * tenant's scoped keys.
 *
 * Citation: gitmTurnover.model.ts (the SSR-guarded single-source idiom this follows).
 * Citation: TOH12-MEND-REPORT.md · Band 2 (the naming) — CLI repo Cascades/Working/.
 */

// The bootstrap key — deliberately NOT scoped (it is the scope root). Holds the last
// scpName /scp-config ever confirmed on this origin, surviving the server's death.
export const SCP_IDENTITY_LAST_CONFIRMED_KEY = 'scp_identity_last_confirmed';

// Persist the confirmed identity. Fired from loadScpConfig's single success path — the
// one seam every page's identity resolution already flows through.
export const confirmScpIdentity = (scpName: string): void => {
  if (typeof localStorage === 'undefined') return;
  if (typeof scpName !== 'string' || scpName.length === 0) return;
  try {
    localStorage.setItem(SCP_IDENTITY_LAST_CONFIRMED_KEY, scpName);
  } catch {
    /* localStorage unavailable/full — scoping degrades to the bare legacy keys */
  }
};

// The synchronous identity read the keying uses (null when never confirmed).
export const readLastConfirmedScpIdentity = (): string | null => {
  if (typeof localStorage === 'undefined') return null;
  try {
    const v = localStorage.getItem(SCP_IDENTITY_LAST_CONFIRMED_KEY);
    return typeof v === 'string' && v.length > 0 ? v : null;
  } catch {
    return null;
  }
};

// The ONE keying function — no call site ever concatenates its own scope string.
// `${identity}::${baseKey}` when an identity is confirmed; the bare baseKey when none is
// (a pre-first-confirm page degrades to today's exact behavior).
export const scpScopedStorageKey = (baseKey: string): string => {
  const identity = readLastConfirmedScpIdentity();
  return identity === null ? baseKey : `${identity}::${baseKey}`;
};

// Migration read discipline: the SCOPED key first, then the bare legacy key (a carrier
// written before this scope existed, or before the first identity confirm, stays readable).
export const readScopedWithLegacyFallback = (baseKey: string): string | null => {
  if (typeof localStorage === 'undefined') return null;
  try {
    return localStorage.getItem(scpScopedStorageKey(baseKey)) ?? localStorage.getItem(baseKey);
  } catch {
    return null;
  }
};

// Clear discipline: remove BOTH the scoped and the bare legacy key — a consumed carrier
// must never survive under either name.
export const removeScopedAndLegacy = (baseKey: string): void => {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(scpScopedStorageKey(baseKey));
    localStorage.removeItem(baseKey);
  } catch {
    /* best-effort — a failed remove only re-reads a stale-guarded carrier */
  }
};
