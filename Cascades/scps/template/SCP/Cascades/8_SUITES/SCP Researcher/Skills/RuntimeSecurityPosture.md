# SCP-S20 · The SCP Runtime Security Posture

*Skill added: DF3 · Cycle 675 (2026-07-19) — the DMF2 hardening epoch (C664-C675), the release-grade security posture.*

**What this Skill carries**: the security posture of the SCP runtime — what an SCP page can and cannot reach, and why. Every guard here is **additive edge-hardening, never a topology change**: the signature means (the OSR shader pipe) is untouchable, and the Shell-Spawn hardening RD's topology (WebContentsView Spawns, an origin Registry, the Shell/Spawn inversion) was **REJECTED** because it emits no `paint` frame and would delete the shader presentation. Only the doc-grounded Electron-security edge guards were adopted.

**The honest field model**: an SCP loads the user's OWN localhost code (their app, their machine) — zero remote top-level content. So the threat model is not arbitrary-web XSS; it is (a) an on-subnet host reaching an over-bound port, and (b) the SCP document pulling remote *subresources* (fonts/CDN) or a stray link turning the trusted-localhost window into un-hardened remote content. The guards below target exactly those.

---

## Curation
The SCP paradigm enables a runtime that loads only the user's own localhost code and is edge-hardened at the Electron layer without touching the rendering topology: loopback-only bind, an app-level navigation guard that redirects off-origin (Cadmium's PDF citations open in the user's browser), a per-session CSP, and sandbox on every window. What is enabled is a stated, additive posture — never a topology change.

## Research
No live read today; this Skill states doctrine. The surface is BRIDGE-side, outside the SCP's own tree: `src/main/navigationGuard.ts` (`grep -n "installAppNavigationGuard\|web-contents-created"`), `src/main/index.ts` (`grep -n "installScpContentSecurityPolicy"` — the CSP installer is wired there, not in `electronWindow.ts`), `src/main/electronWindow.ts` (`grep -n "sandbox: true"`), and the bridge's `/mcp` bind — read them when the scs-bridge source is reachable (on Stratithon at `Cascades/Projects/SuiteCascadeSystem/`), else name them unreachable. The one SCP-side measurement: the host the SCP's own citizen reports — `node -e "const d=JSON.parse(require('fs').readFileSync('<SCP>/Cascades/Bridge/bridge.json','utf8')); console.log(d.boundScps['<scpName>']?.browserUrl)"` (a `127.0.0.1` / `localhost` host = loopback holds for this citizen). The Researcher reports the posture; it never audits the bridge daemon's health or changes a bind (`Instance.md` §"Not the Shipwright").

## Return
- Sentence: "`<scpName>` binds loopback (`browserUrl` host `<host>`); the posture is the four additive edges (§1-§4)."
- Section: the Sentence + the edge the ask touched + its rejected alternative (topology change · partitions) and why.
- Vermillion: rare — a hardening review as Bands, each a bridge-side read; the change itself is the Shipwright's.
- Diamond: a fifth edge or a new threat class — returned INLINE with the founding offer (`Instance.md` §B · the Diamond rung's law).
---

## 1. Loopback bind (the one live vulnerability, closed)

The `/mcp` HTTP tool transport AND all SCP-citizen servers were bound to `0.0.0.0` (every network interface) — meaning the whole tool roster (`send_message` · spawn · `gitm_*` · `scp_stop`) was reachable **unauthenticated from any device on the LAN**. Flipped to **`127.0.0.1`** across all seams (the bridge `/mcp` transport + its free-port probe, and each SCP citizen's Express transport + primary server + the reported bind).

**What a developer needs to know**: the bridge and every SCP server are loopback-only. Every caller already resolves `127.0.0.1`/`localhost` from `bridge.json`; no `os.networkInterfaces` LAN IP is ever constructed. The SCP's `index.ts` keeps an `IP` env escape hatch for deliberate LAN-dev, defaulting to loopback.

---

## 2. The app-level navigation guard (the exposed-window backstop)

`src/main/navigationGuard.ts` → `installAppNavigationGuard()` registers at **`app.on('web-contents-created')`** — the official Electron pattern, firing for **EVERY** webContents (every window, every subframe, the offscreen content window, present + future). This replaced a leaky per-window guard that missed both subframes and the presenter window entirely.

Per contents it binds:
- `setWindowOpenHandler` → deny the in-app popup + `shell.openExternal` (http/https) — `window.open`/`target=_blank`/shift-click.
- `will-navigate` (main frame) + **`will-frame-navigate`** (subframes — the field gap that let an embedded PDF through) + `will-redirect` (server 3xx).
- `will-attach-webview` → deny.

**The predicate**: allow navigation only within the same origin the contents currently shows (`new URL(navUrl).origin === new URL(contents.getURL()).origin`). The SCP's own path nav / reload / turn-over recovery pass; the presenter + terminal windows sit on `file://` so any http nav is cross-origin and is denied; a true off-origin nav is `preventDefault` + `shell.openExternal`. Fail-open on an unparseable self-origin — a guard must never brick a window.

> **Why app-level**: nav events belong to the webContents **object**, not the window **type** — so the offscreen content window is guarded identically to a visible one, and a per-window binding structurally can't cover the presenter.

### THE CADMIUM-RESEARCHER PDF-REDIRECT LAW (load-bearing)
Cadmium Researcher writes Reference Designs that link **directly to external PDFs** (arxiv citations). The correct, mindful handling — and the current behavior — is **redirect-out, never block**: a direct top-level PDF link is a navigation → the guard `preventDefault` + `shell.openExternal` → **opens in the user's default browser**. The CSP `object-src 'none'`/`frame-src 'self'` blocks ONLY the *embedded* case (`<iframe>`/`<embed>` PDF), NOT a top-level link. **Invariant**: an external PDF link opens in the user's browser (redirect) — never trapped in-app, never hard-blocked.

---

## 3. The per-session Content-Security-Policy

`installScpContentSecurityPolicy()` → `onHeadersReceived` stamps a CSP **only** on the SCP's own top-level document (`resourceType === 'mainFrame'` + localhost host); it drops any SSR-sent CSP first so Electron's is authoritative (browsers enforce the intersection of multiple CSP headers — over-blocking).

The directive whitelists the SCP's real resource needs: `style-src`/`font-src` the fonts.googleapis + fonts.gstatic + cdnjs CDNs; `connect-src` ws/http localhost; `img-src 'self' data: https:`. **Two field relaxations** from the strict ideal:
- `script-src 'self' 'unsafe-inline'` — the SSR inlines a `window.__APP_STATE__` hydration script; a bare `'self'` would kill hydration, and a per-request nonce can't cross the Electron-main ↔ SSR-process boundary. `'unsafe-inline'` still blocks external script *sources* (the field's real vector). *Follow-on carded*: move the CSP to the SSR server with a nonce to drop `'unsafe-inline'`.
- `object-src 'none'` + `frame-src 'self'` — structurally block an embedded external PDF while allowing same-origin frames. This composes with the nav guard (§2) so the embed-PDF vector is covered at two layers.

Confirmed live via the Neon PlayTester (fonts / Font Awesome / WebSocket / hydration all PASS).

---

## 4. Sandbox + explicit webPreferences on all windows

`sandbox: true` plus the explicit flags (`webSecurity` / `allowRunningInsecureContent: false` / `experimentalFeatures: false` / `webviewTag: false`) on all four windows (content · presenter · terminal · terminal-presenter). The shared preload is **sandbox-safe** — it imports only `contextBridge`/`ipcRenderer`/`webUtils` + DOM (all survive `sandbox: true`), and node-pty runs in MAIN not the renderer, so the drop-path (`getPathForFile`) and the OSR/input legs are unaffected.

**Partitions REJECTED**: a per-origin session partition would orphan the `localStorage` the SCP client-state rides across a turn-over; the per-session CSP (§3) uses `win.webContents.session` directly, so no partition is needed.

---

## The developer's one-paragraph mental model

The SCP runs its own localhost servers (loopback-only), renders offscreen through a shader (that pipe is the signature means and is never traded away), and is edge-hardened at the Electron layer: an app-level guard redirects any off-origin navigation to your OS browser (so Cadmium's PDF citations open in your real browser), a per-session CSP whitelists exactly the fonts/CDN/WebSocket the page needs while blocking embedded external content, and every window is sandboxed. Nothing here changed the rendering topology — the hardening is all additive edges.
