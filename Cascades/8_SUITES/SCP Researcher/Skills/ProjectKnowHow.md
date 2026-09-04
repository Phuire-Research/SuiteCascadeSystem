# SCP-S18 · Project Know-How — What Any Potential User Needs to Know

**Skill**: SCP-S18 · Project Know-How
**Owner**: SCP Researcher (meta-Suite-8)
**Synthesized**: Cycle 244 · 2026-06-22 · from a Full Suite Magic Shotgun (the 7 R-Suite cognitive functions applied to "what a user needs to know")
**Branch**: RC-To-Release · **Sources**: ONYX-TIER-20 · Cascade.json (Cycle 244) · the SCP codebase · the SCP-UPDATE-MACRO WGB

> This skill is the user-facing companion to the SCP type spec in `Instance.md`. The type spec (Three Modes · Identity-As-Perimeter · the Templates) is unchanged; this skill carries the SHIPPED capability know-how. It is read whenever the SCP Researcher is asked "what does the SCS-Bridge do / how do I use it."

---

## Curation
The SCP paradigm enables a user to hold the whole shipped system in one mental model — one window, a bar, a handful of pages — and to Install → Spawn → Anchor → GitM → Update → Personalize without ever meeting a public endpoint. What is enabled is orientation: the inventory, the glossary, the how-to and the FAQ, in accessible names (the public-copy firewall).

## Research
No live read today; this Skill is user-facing synthesis (Cycle 244), not a technical trace. The surface behind its claims is `<SCP>/Cascades/Bridge/bridge.json` (via SCP-S12 — what is live, what is installed, how fresh) and `<SCP>/Cascades/Bridge/` itself (`ls` — `sessions.json` · `gitm.json` · the menu / watch relays this SCP's Suite 8s have registered). A Researcher asked "what does this do" answers from this inventory but FIRST runs SCP-S12's identity + freshness reads, so the answer names the SCP and states whether the bridge is presently writing. The §8 FAQ rows are symptom → check → fix; the "check" column names a runtime surface, and that check IS the read.

## Return
- Sentence: the one-line identity (§1) with `<scpName>` attached.
- Section: the capability the ask touched (§2 row) + the how-to (§5) + the FAQ row if a symptom was named, with SCP-S12's freshness finding.
- Vermillion: a workflow (§6 W1-W5) as Bands when the ask is "walk me through".
- Diamond: a tenth capability, or a glossary term the shipped surface has outgrown — Mode A maintenance, or returned INLINE with the founding offer (`Instance.md` §B).
---

## 1 · The One-Line Identity

**The SCS-Bridge is the self-installing renewable-cognitive operating layer — the first public Stratimux product.** It installs the Suite Cascade System into any Claude Code project, manages the sessions you run there, lets you spawn project-domain working surfaces, gives you git visibility plus a clean update path over the installed template, and personalizes its own look at runtime — all while you keep using it (the running app rebuilds itself without losing your place).

**The SCP** (Suite Cascade Protocol) is the named runtime an install carries: a local Vue + Stratimux + WebSocket app, fronted by a Suite 8 identity rather than a public endpoint.

---

## 2 · The Capability Inventory (what it IS + DOES)

| # | Capability | What it does for you |
|---|---|---|
| 1 | **The Session Manager** | See, engage (live chat), rename, archive, and clean up the Claude Code sessions in your project. The bridge reads only its own `sessions.json` — never `~/.claude/` (Pattern-4). |
| 2 | **Spawn + the Spawn Picker (SSP)** | Start a new session bound to any installed Suite 8, picked from a live roster in a Pewter drawer. |
| 3 | **The Anchor System (SAC)** | Pin a session as the page Anchor for a Suite 8 (Set), clear it (Release / un-anchor), or let a page auto-anchor a fresh one. Set reassigns — one Anchor per Suite 8. |
| 4 | **GitM — git visibility** | A live git panel over your project's own repo: the change-count badge, the Shield (A) ↔ Sword (B) turn-over, branches, untracked/unstaged, a 30-tool developer command bar. |
| 5 | **The SCP Update System** | A clean update path with no reinstall — pull the latest template improvements while keeping your own additions. |
| 6 | **The Suite Cascade page** | The 8-function method (curate → name → plan → test → build → compose → diagnose → cycle) the system runs on. |
| 7 | **The Suite 8 page system** | Each installed Suite 8 gets a page — roster, tabs, a Home/Component/Documentation triad, and in-page Conference menus (Shatterite). |
| 8 | **HiFi personalization** | Re-tint the running window live from Settings — the signature shader skin (Muxon) or plain (Off), and the color theme. |
| 9 | **Install** | `npm i -g scs-bridge` → `scs` self-installs the Suite Cascade System into any project (the wizard, or a one-key quick-install). |

---

## 3 · The Glossary (terms you meet, first → deeper)

**Day one**: **SCS-Bridge** (what you install · the `scs` command) · **SCP** (the app it runs) · **Session** (one Claude Code conversation, controllable) · **The Session Manager** (the page for sessions) · **Suite 8** (a named working surface for one domain) · **Spawn** (start a Suite-8-bound session) · **The Spawn Picker** (the drawer to choose which Suite 8).

**As you work**: **Anchor** (pin a session as a page's session) · **The Anchor System** (per-page auto-anchor rules) · **The Suite Cascade** (the 8-step method + its page) · **Turn-Over** (restart the app to adopt code changes without losing your place — Soft keeps state, Hard resets a wedged state) · **HiFi** (the live-tintable look — Muxon skin on/off + theme).

**Deeper (git + update)**: **GitM** (the git panel) · **Shield (A)** (your clean baseline you always return to) · **Sword (B)** (the working copy where changes live) · **The SCP Update System** (pull template improvements, keep your additions) · **The Gitm Resolver** (sorts out update conflicts — your additions win) · **The Staging Update Tool** (the panel view for an update) · **Shatterite** (the in-app choice menus) · **Install** (the wizard / `[p]` quick-install).

**Key Diameters** (similarities between unlike terms): Spawn CREATES a session ↔ Anchor DESIGNATES one as the page's. Shield is held still ↔ Sword is where motion happens (the Turn-Over rotates between them; the failsafe always returns to the Shield). GitM gives visibility over YOUR git ↔ the Update System reuses that same git machinery to merge the TEMPLATE in. Soft Turn-Over preserves your place ↔ Hard clears a wedged state — the perimeter survives both.

---

## 4 · The Mental Model (the shape to hold)

One window with a bar/dock and a small set of pages you switch between. The bar moves you between **Sessions · Suite 8 · Suite Cascade · Git · Settings**. The HiFi shader skin wraps the whole window.

| Page | What's on it |
|---|---|
| **Sessions** (default landing) | The session roster — engage/chat/rename/archive; the **Spawn Picker** drawer (SSP); the **Anchor** controls (Set/Release). |
| **Suite 8** | The roster of installed Suite 8 designations + the docked-cascade context; per-Suite-8 Home/Component/Documentation triad; Shatterite menus. |
| **Suite Cascade** | The 8-function method presented; a Home/Component/Documentation triad. |
| **Git** | The GitM panel — the change badge, Shield/Sword turn-over, branches, untracked/unstaged, the developer bar; the SCP Update view (pending). |
| **Settings** | The HiFi controls — render mode (Muxon/Off), theme, SCP-vs-Terminal target; the Pewter surface. |
| **Archive / Components** | Archived sessions · a showcase of the SCS-Input components. |

**Navigation flow**: launch `scs` → (install wizard if no SCP) → land in Sessions → the bar is the spine for every move → Sessions is home base (spawn/engage/anchor) → Git is the safety + update space → Settings is personalization. Turn-Over is orthogonal: it restarts the server under you; the window does NOT reload.

**Two frames to hold alongside the pages**: the **Suite Cascade** is the FIXED 8-function method (the engine); a **Suite 8** is a TRANSPARENT named domain you add that uses the Cascade internally. The bridge ships some (Teal Claude, Stratimuxian Scholar, Cadmium Researcher, the Gitm Resolver, the SCP Researcher); more emerge per project.

---

## 5 · How-To (step-by-step)

**Install + launch**: `npm i -g scs-bridge` → run `scs` in your project → the install menu (wizard, or `[p]` for a quick direct install in a blank dir) → it self-installs (LSSI), runs npm install, spawns the agent → you land in Sessions.

**Spawn a Suite 8**: Sessions → open the Spawn Picker → pick a Suite 8 from the live roster → spawn → the new session appears (it may auto-anchor per the page config).

**Set / Drop / Un-anchor**: in the session's Anchor cell → "Set as Anchor" (reassigns — clears other anchors of the same Suite 8) · "Release Anchor" to un-anchor · toggle a page's auto-anchor (override) or reset to the default.

**Run an SCP update**: the retained reference clone clones/pulls (`~/.scs-bridge/update-clone`) → the 3-way diff (`scripts/scp-3way-diff.sh`: base = your `SCS: initialize` commit · ours = your HEAD · theirs = the new template) emits a diff JSON (apply / preserve / conference) → the **Gitm Resolver** resolves collisions (your additions win) → *(pending: the Staging Update Tool shows stages + change list + collision diff, then applies)* → turn over to boot the updated SCP.

**Re-tint HiFi**: Settings → pick render mode (Muxon/Off) + theme → applies LIVE (no reload).

**Manage sessions**: Sessions auto-lists → engage a session (live chat loads) → chat (the send pipes to the Claude CLI) → focus / rename / archive / dissipate.

---

## 6 · The Workflows (end-to-end)

- **W1 First-Run**: install → launch → land in Sessions.
- **W2 Spawn-and-Work**: open the Picker → choose a Suite 8 → spawn → engage → chat → anchor.
- **W3 The Git Turn-Over Loop**: Set A (Shield baseline) → drift on B (the badge climbs) → Turn Over B → HAPPY: confirm → Merge B→A · FAIL: ~45s failsafe → checkout A → boot → checkout B. *(Git IS the ready-return-to-the-clean-room.)*
- **W4 The Update Journey**: new template → retained clone → 3-way diff → Gitm Resolver → *(Staging Tool · pending)* → apply → turn over. Your additions survive.
- **W5 Personalize**: Settings → re-tint HiFi live.

These chain into one loop inside a window that never closes: Install → Spawn-and-Work → drift + Turn-Over → Update when the template advances → Personalize anytime. The Shield/Sword turn-over is the safety substrate the Update journey rides; the Spawn Picker is how the Gitm Resolver gets summoned.

---

## 7 · The Seamless-Experience Insight (why it stays smooth)

**The Perfect Circular Reference**: the server holds ephemeral state in process memory; the client holds persistent state in IndexedDB + localStorage; each bootstraps the other. On a Soft Turn-Over the server respawns and reconstructs its cache from the client's persistent state — **the window does NOT reload, your place survives.** So you can modify any aspect of the application WHILE using it, turn over, and keep your place. The Suite 8 designation (the perimeter) survives both Soft and Hard turn-over — turnover affects state within the perimeter, never the perimeter itself.

---

## 8 · Gotchas / FAQ (Symptom → Check → Fix)

1. **"I changed code but it didn't take effect"** → did you Turn Over? Soft Turn-Over respawns the server (preserves your state). A bad boot (TS error) → the ~45s failsafe reverts you to the clean Shield A.
2. **"The app is wedged / state is stuck"** → Soft won't clear a wedged state. Use **Hard Turn-Over** (the soft-lock escape) — clears client state, re-hydrates clean; the perimeter survives.
3. **"The git change count reads 0"** → on a fresh install the count clamps until a baseline exists (the Fresh-Install-Unregistered Gap). **Set the Shield A first** → the badge ticks.
4. **"The window won't open / hangs on install"** → handled in shipped code (npm output drains to a log; the watcher excludes `Cascades/Bridge/`). On a custom build, give any unconsumed child process `{ stdio: 'ignore' }`.
5. **"The bridge shows disconnected / a page won't populate"** → check `Cascades/Bridge/bridge.json` (absent = not running; `writtenAt` > 2 min = may have exited). Relaunch `scs`. Pages hydrate via their on-mount fetch (the MOCH-partner law) — re-navigate to fire it.
6. **"An anchor isn't sticking / how do I un-anchor?"** → Set REASSIGNS (one Anchor per Suite 8). Release Anchor to clear, then Set the one you want.
7. **"My text input renders wrong / no cursor"** → the bridge renders offscreen through a shader; the native caret isn't painted (electron #8498) and `:focus` is suppressed until restored. Use `ScsInput`/`ScsTextarea` (the `|` end-marker + focus emulation). Adopters: replicate the three self-containment layers (SCP-S17).
8. **"An SCP update has conflicts"** → most updates auto-merge; your-only changes are preserved; only true overlaps surface. The **Gitm Resolver** applies the priority doctrine — your additions win, template attends, real overlaps confer. The Muxonomy/Navbar + Client Muxium are the protected zones.
9. **"How do I get back to a clean state?"** → the Shield A is your pristine baseline (held committed-clean); FREEHOP / Turn-Over A returns to it, or the failsafe reverts (checkout A → boot → checkout B).

**Diagnostic stance**: many of these are visual/runtime tells a build-green gate can't catch — when in doubt, check the runtime surface (`gitm.json`, `bridge.json`, the manifold debug log), not just the build.

---

## 9 · Public-Copy Firewall (when this seeds user-facing copy)

- Use accessible / spectrum names (Shield/Sword, the Spawn Picker, the Anchor System, HiFi); keep internal cascade vocabulary (SSP/SAC/SWRM/STARC/profession-color names) internal.
- No scare-quotes — Capitalize a term to mark it.
- Never write "Consumers" — refer to the audience indirectly.
- "categories" not "taxonomy".
- No license / enclosure mechanics in user-facing copy.
