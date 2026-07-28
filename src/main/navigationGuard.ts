/**
 * navigationGuard · DMF2 S3-REV · APP-LEVEL navigation + window-open control.
 *
 * THE FIELD FAILURE (C670): a PER-WINDOW will-navigate guard on the SCP content window missed
 * (1) SUBFRAME/embedded navigations — `will-navigate` fires for the MAIN frame ONLY, so an
 * <iframe>/<embed> external PDF slipped through — and (2) the PRESENTER + terminal windows
 * entirely (they carried no guard at all). The content window's navigated page then showed the
 * external arxiv PDF via its OSR texture inside the "SCS Bridge · Presenter" window.
 *
 * THE DOC-GROUNDED FIX (electronjs.org Security tutorial items 13/14): attach the guard at
 * `app.on('web-contents-created')` — it fires for EVERY webContents (every window, every
 * subframe, present + future), which a per-window binding structurally cannot cover.
 *
 * OFFSCREEN NOTE (user flag): navigation events are a property of the webContents OBJECT, not
 * the window TYPE — an `offscreen: true` window owns a normal webContents and emits the identical
 * event set, so the OSR content window is guarded exactly like a visible one.
 *
 * THE PREDICATE: allow navigation ONLY within the same origin the contents currently shows
 * (`new URL(navUrl).origin === new URL(contents.getURL()).origin`). The content window's
 * same-origin path nav / reload / HPRD recovery PASS; the presenter + terminal windows sit on
 * `file://` so ANY http(s) nav is cross-origin and DENIED (they must never navigate away);
 * a true off-origin nav is denied + handed to the OS browser (http/https only). FAIL-OPEN when
 * the self-origin is unparseable (e.g. an initial-load `will-redirect` before a URL commits) —
 * a guard must never brick a window.
 */
import { app, session, shell } from 'electron';
import { sdia } from './diagnostics';

// C672 · DMF2 S4 · THE PER-SESSION CONTENT-SECURITY-POLICY for the SCP document.
// PRIMARY win: `object-src 'none'` + `frame-src 'self'` STRUCTURALLY block the embedded/framed
// external PDF (arxiv ≠ 'self') — CSP composes with S3-REV so the nav guard no longer stands
// alone (MDN object-src/frame-src). Resource whitelist keeps the SCP's Google Fonts + Font
// Awesome CDN + its localhost WebSocket alive. `script-src 'self' 'unsafe-inline'`: the SSR
// emits an inline `window.__APP_STATE__` hydration script (vue.principle.ts:728) that a bare
// 'self' would block → hydration dies; a per-request nonce cannot be coordinated because the
// CSP header is set here (Electron main) while the HTML is generated in the separate SCP SSR
// process. 'unsafe-inline' still blocks external script SOURCES (the field's real vector — the
// SCP loads only the user's own localhost code · r7 census). FOLLOW-ON (out of band): move CSP
// to the SSR server with a nonce to drop 'unsafe-inline' entirely.
const SCP_CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
  "font-src 'self' data: https://fonts.gstatic.com https://cdnjs.cloudflare.com",
  "connect-src 'self' ws://localhost:* wss://localhost:* ws://127.0.0.1:* http://localhost:* http://127.0.0.1:*",
  "img-src 'self' data: https:",
  "object-src 'none'",
  "frame-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

function isLocalhostUrl(u: string): boolean {
  try {
    const h = new URL(u).hostname;
    return h === 'localhost' || h === '127.0.0.1';
  } catch {
    return false;
  }
}

export function installScpContentSecurityPolicy(): void {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    // Stamp the CSP ONLY on the SCP's own top-level document (localhost mainFrame). Every other
    // response — sub-resources, the fonts/FA CDN, file:// presenter/terminal windows, data/xhr —
    // is passed through untouched; the CSP on the main document governs the whole page.
    if (details.resourceType === 'mainFrame' && isLocalhostUrl(details.url)) {
      const headers = { ...details.responseHeaders };
      // Drop any CSP the SSR server may already send (case-insensitive) so ours is authoritative —
      // two CSP headers make the browser enforce the INTERSECTION, which can silently over-block.
      for (const key of Object.keys(headers)) {
        if (key.toLowerCase() === 'content-security-policy') delete headers[key];
      }
      headers['Content-Security-Policy'] = [SCP_CSP];
      callback({ responseHeaders: headers });
      return;
    }
    callback({ responseHeaders: details.responseHeaders });
  });
}

export function installAppNavigationGuard(): void {
  app.on('web-contents-created', (_event, contents) => {
    // window.open / target=_blank / shift-click = a NEW-WINDOW request (NOT will-navigate) —
    // deny the in-app window; hand http/https to the OS browser.
    contents.setWindowOpenHandler(({ url: openUrl }) => {
      try {
        const scheme = new URL(openUrl).protocol;
        if (scheme === 'http:' || scheme === 'https:') void shell.openExternal(openUrl);
      } catch {
        /* malformed URL — deny silently */
      }
      return { action: 'deny' };
    });

    const guardNavigation = (event: Electron.Event, navUrl: string): void => {
      let selfOrigin: string | null = null;
      try {
        selfOrigin = new URL(contents.getURL()).origin;
      } catch {
        selfOrigin = null;
      }
      if (selfOrigin === null) return; // pre-commit / unparseable self → fail-open
      let sameOrigin = false;
      try {
        sameOrigin = new URL(navUrl).origin === selfOrigin;
      } catch {
        sameOrigin = false;
      }
      if (sameOrigin) return; // same-origin path nav / reload / HPRD recovery — allow
      event.preventDefault();
      try {
        const scheme = new URL(navUrl).protocol;
        if (scheme === 'http:' || scheme === 'https:') void shell.openExternal(navUrl);
      } catch {
        /* malformed — deny silently */
      }
      sdia('nav.guard.denied', { self: selfOrigin, navUrl });
    };

    contents.on('will-navigate', guardNavigation); // main-frame in-place nav
    // will-frame-navigate = the SUBFRAME event (the C670 field gap — an <iframe>/<embed> PDF).
    // Its listener receives a single details object carrying `.url`; adapt to guardNavigation.
    contents.on('will-frame-navigate', (details) =>
      guardNavigation(details as Electron.Event, String((details as { url?: string }).url ?? '')),
    );
    contents.on('will-redirect', guardNavigation); // server 3xx → external

    contents.on('will-attach-webview', (event) => {
      event.preventDefault();
      sdia('nav.guard.webview-denied', {});
    });
  });
}
