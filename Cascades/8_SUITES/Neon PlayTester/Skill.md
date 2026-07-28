# Neon PlayTester — Skill (S-PLAYTEST + S-TURNOVER-RUNBOOK)

Operational how-to. Every shape below ran live in the Lambda-of-2 (Cycles 253-256) — copy, don't invent.

---

## S-PLAYTEST · the core loop

### 0 · Preflight
```bash
curl -s -m 5 -X POST http://127.0.0.1:7111/mcp -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
# expect: scs_orchestrate_window + scs_render_capture in the tool list
```
Pick a `runId` (one per PlayTest — all captures group under `Cascades/Bridge/playtests/<runId>/`).

### 1 · SEE (visual Lambda)
```json
{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"scs_render_capture",
 "arguments":{"label":"initial","runId":"<runId>"}}}
```
→ `{renderCapture:{data:{path, mode}}}` → **Read the PNG**. `mode:'stream'` = the pre-shader frame. Omitted target = the ACTIVE SCP; `target:{sessionId}` = a terminal.

### 2 · ORIENT (assert the DOM, never guess)
One `js` step returning a filtered element dump:
```js
(() => { const els=[...document.querySelectorAll('a,button')].filter(e=>/TEXT/i.test((e.textContent||'').trim()));
  return els.slice(0,8).map(e=>({tag:e.tagName,cls:String(e.className||'').slice(0,80),text:(e.textContent||'').trim().slice(0,40)})); })()
```

### 3 · ACT (one sequence · timing beats INSIDE it)
```json
{"name":"scs_orchestrate_window","arguments":{"runId":"<runId>","steps":[
  {"kind":"capture","label":"before"},
  {"kind":"click","selector":"button.the-real-selector"},
  {"kind":"wait","ms":800},
  {"kind":"capture","label":"after"},
  {"kind":"js","code":"(() => ({ assert: !!document.querySelector('.expected') }))()"}
]}}
```
- Text-match click (no unique selector): a `js` step finding the element + dispatching `['pointerdown','mousedown','pointerup','mouseup','click']` MouseEvents (`bubbles:true,cancelable:true,view:window`).
- Vue input typing: native setter + input event —
  `const el=document.querySelector(SEL); el.focus(); Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set.call(el, MSG); el.dispatchEvent(new Event('input',{bubbles:true}));`
- Scroll: `{"kind":"scroll","selector":".panel","to":"bottom"}` (DOM) anor `{"kind":"scroll","deltaY":480}` (mouseWheel · terminals · deltaY>0 = up).

### 4 · THE CHURN LAW
Any step that reloads/spawns/turns-over can DROP the HTTP response (the sequence still completes). After churn:
```bash
grep -a "orchestrate.sequence" Cascades/Bridge/electron-debug.json | tail -1   # did it run + ok?
ls -t Cascades/Bridge/playtests/<runId>/ | head                                 # the artifacts
```
Then re-assert with a fresh single-`js` sequence (cheap, response-safe).

### 5 · VERIFY (compose the witnesses)
| Claim | Witness |
|---|---|
| the click/dispatch fired | the per-step array + `<scpName>-client-logs.json` (`[SORD-TRACE]` etc.) |
| a tool landed at the bridge | `debug.json` `mcp.toolcall.received` |
| the sequence ran | `electron-debug.json` `orchestrate.sequence` |
| the UI is right | Read the labeled PNGs |
| a session spawned/replied | `sessions.json` count + the terminal capture by `sessionId` |

### 6 · VERDICT
Only with the bundle complete: `playtests/<runId>/` + step arrays + file witnesses → write the Fuchsia Clinical Note (Gainy/Lossy/Maintain). Agent PASS = TESTING, never Done (the user Lambda is the commit gate).

---

## S-TURNOVER-SYSTEM · the Bridge Turn Over System (the knowledge under the fixture)

Read this BEFORE any turn-over verdict — half of what looks like failure is the system's
guards doing their job.

### The machine

The SCP serves ONE of a GitM branch PAIR: **A the Shield** (`stableBranch` — the proven
launch ground, held pristine) anor **B the Sword** (`workingBranch`, `b/`-prefixed — the
drift vessel, the unproven candidate). ALL src edits + rebuilds land on B; A is never
worked directly. The pair is derived from git itself (`deriveAbPointers` off the STARC
branch list — self-healing: a workingBranch naming a dead branch clears + resets to idle).

**`abMode` (gitm.json · the state the UI keys on)**:
| abMode | Meaning | What the dock shows |
|---|---|---|
| `idle` | no working B — A alone is the ground | Sword available · Turn Over B disabled |
| `candidate-created` | a `b/` exists, unproven | TURN OVER B armed-able (amber) |
| `turned-over` | the SCP is RUNNING on B | the same button becomes CONFIRM B SUCCESS |

**The turn-over itself** (`gitm_turn_over_with_source{source}`): order-critical single
synchronous method — resolve target (B→workingBranch · A→stableBranch) → GUARDSHUNT on
empty → `git switch` (a FAILED switch NEVER writes the restart file — else nodemon rebuilds
the wrong branch) → synchronous write of `<userCwd>/.bridge-restart.json` → nodemon kills +
rebuilds the SCP on the target branch's code. **The window rides it**: did-fail-load →
HPRD readiness probe → fresh loadURL (the Electron Turn-Over Recovery).

**The dirty-carry (the safety no one loses work to)**: uncommitted changes travel WITH the
switch. A Turn-Over-A with working changes opens THE C302 MODAL (the sole confirmation
surface) asking how to carry them into B — the canonical carry rides the BRIDGE's
`git switch -c b/<stable>-<ts>` through the confirmToken (WATCHKEY call-1 preview →
call-2 execute). An "it wiped my changes" report is almost always a turn-over to A with
the carry having landed on a `b/` branch — CHECK `gitm.json` branches before believing it.

**The seat law + the failsafe**: the working seat belongs to B — an A turn-over is a
RETURN TO GROUND (transient when a B exists; the machine stays `candidate-created`, never
lights Confirm-B off an A-prove). A B turn-over arms the **bridge-owned 45s deadline**
(armed ALONGSIDE the seat-return arm; the UI wrote `GITM_TURNOVER_KEY` to localStorage
BEFORE dispatch so the ws-close handler arms it): B never comes up → the OUTER bridge
reverts to A and the standby flips **"B FAILED · REVERTING TO A"** — that screen is the
FAILSAFE WORKING, not a crash.

### THE VISUAL REFERENCE · the A/B dock (bottom TaskBar strip · every page · left→right)

This is what to LOOK FOR in captures. StratiPUNK face note: the always-visible amber chip
under the Sword reads **"Spin to B"** — the glyph renders like "Spin to 8". Badges on
Shield + Sword are CHANGEDIAL (`changesPrimedOnB` · always-on · 0 = clean tree).

| # | Look | Component (aria-label) | Engage | States + why |
|---|---|---|---|---|
| 1 | TEAL shield · badge | Shield A (`Register Stable Branch (A)`) | click → panel: branch dropdown + commit message → Register (dirty: commit then register) anor Mark (clean) | the A-setter — badge counts primed changes; 0 = pristine ground |
| 2 | TEAL `(→` · badge | Turn Over A (`Turn Over A`) | click → THE C302 MODAL (center-vision) — NO direct fire | returns the SCP to the guarded stable A; badge = commits B carries that A does not; dirty tree → the keep-or-revert carry conference; disabled until an A is registered |
| 3 | AMBER sword · badge · "Spin to B" chip | Sword B (`Sword (B setter)`) | click → panel | DUAL-MODE: A dirty → Drift Crystallizer ("Spin Drift onto B": branch_create+checkout → commit → register A) · A clean → PRISMATIC free-hop (iridescent border = "A is safe, hop anywhere" · branch selector) |
| 4 | AMBER `→]` | Turn Over B / Confirm B (`buttonLabel` by state) | `candidate-created`: CGDA 2-click (ARMED → FIRE) · `turned-over`: SINGLE click = CONFIRM B SUCCESS | the FIRE writes the failsafe key then dispatches source:'B' → the SCP restarts on B; after riding the restart the SAME button is the B-proving gesture (→ `bMergeable=true`) |
| 5 | PURPLE fork · `?` badge · often DIM | Merge B→A (`GitmMergeBAButton`) | CGDA 2-click when lit | MERGEGATE: `bMergeable && changesPrimedOnB===0 && lastTurnOverResult==='success'` — dim = gate holding (expected!); passing = breathing purple neon; pure git op, NO restart; the `?` badge opens the Bridge Turn Over explainer (SCS-Bridge Documentation) |
| 6 | FUCHSIA spin circle | Hard Turn Over (`ScsBridgeTurnOverButton`) | CGDA: IDLE → ARMED (orange · 4s auto-disarm) → FIRE | NOT an A/B move — the hard SCP restart on the CURRENT branch; badge = pending actionQue (hides at 0) |

**PlayTest assertion targets**: `abMode`/`turnedOverTo`/`pendingConfirm` in `gitm.json` ·
`.bridge-restart.json` existence+content at the SCP cwd · `gitm_turn_over_with_source` in
`debug.json` · `autoinduct-fire` (once per SCP dir) in `electron-debug.json` · the
prismatic-vs-amber Sword border and the dim-vs-breathing Merge in the PNGs (state IS
visible — capture it).

---

## S-TURNOVER-RUNBOOK · the canonical fixture (the difficulty that birthed the system)

Precondition: a fresh install anor dev:self, the GitM page reachable, `<scpName>-client-logs.json` live.

1. **Arrival guard (Q2)**: navigate to GitM (orient → js-click the nav) → capture → assert NO auto-created `b/` + A shows master → `grep autoinduct Cascades/Bridge/electron-debug.json` (expect `autoinduct-fire` once per SCP dir, `autoinduct-skip` on page-view).
2. **The arm→confirm (the timing the sequence exists for)**:
```json
{"steps":[
  {"kind":"capture","label":"before-arm"},
  {"kind":"click","selector":"<TurnOverA selector — orient first>"},
  {"kind":"wait","ms":500},
  {"kind":"capture","label":"armed"},
  {"kind":"click","selector":"<same>"},
  {"kind":"capture","label":"confirm-fired"},
  {"kind":"probe"}
]}
```
3. **Ride the restart (churn law applies)**: poll `{"steps":[{"kind":"probe"}]}` until `alive:true` + `loading:false` + `bridgeJsonAgeMs` fresh; a `window-destroyed` PARTIAL mid-sequence is EXPECTED, not failure.
4. **Verify**: `grep SORD-TRACE <cwd>/Cascades/Bridge/<scpName>-client-logs.json` (handleClick → fireTurnOverA → ENTRY → FETCHING → ACK) + `grep gitm_turn_over_with_source debug.json` + capture `after-restart` + `js`-read the branch off the GitM page.
5. **Bundle + Note.** If `b/`→A mis-assignment appears in sight → the Q2 Bug-2 bucket race is CONFIRMED (apply the action-correlated bucket); absent across runs → REFUTED.

---

## S-SPAWN-AND-CHAT · the session lifecycle part (Conference-closed · proven in lambda-of-2c)

Spawning a session THROUGH the SCP UI and conversing with it — the part that proves the Session Management page end-to-end.

1. **Arrive**: navigate to the SCS-Bridge page (S-PLAYTEST §2 orient → js-click the `a.nav-item` by text). Session Management is the MAIN page (`button.spawn-session-btn` visible on arrival — assert it).
2. **Baseline**: `python3 -c` count of `Cascades/Bridge/sessions.json` entries.
3. **Spawn** (churn — the response may drop; file witnesses hold):
```json
{"steps":[{"kind":"click","selector":"button.spawn-session-btn"},{"kind":"wait","ms":5000},{"kind":"capture","label":"spawned"}]}
```
4. **Identify**: re-read `sessions.json` → the newest `launched` entry's `id` is the ULID. Assert count+1. The fresh terminal must show NO trust error (the universal pre-seed).
5. **Chat through the UI srex panel** (NOT the `send_message` MCP tool — the `targetUlid` scar): open the session's panel (scroll + expand as needed), then one sequence — native-setter type into `input.srex-chat-input` + `dispatchEvent(new Event('input',{bubbles:true}))` → capture → `{"kind":"click","selector":"button.srex-chat-send-btn"}` → capture. **P-2 caveat**: the send may not press Enter when the terminal focuses — verify submission in the terminal capture; if the text sits unsubmitted, a `{"kind":"key","key":"Enter"}` step against the terminal target (by `sessionId`) completes it.
6. **Read the reply**: wait ~30s → `scs_orchestrate_window` with `target:{sessionId:"<ULID>"}` → `[{probe},{capture,label:'terminal-reply'},{scroll,deltaY:480},{capture,label:'terminal-scrolled'}]` → Read the PNGs (the reply text IS the Lambda).

---

## GitM Surfaces (MD-D · the developer-loop test Means)
- **Presenter = the visual truth**: `scs_render_capture` (the streamed pre-shader frame) is the developer's-eye Lambda for GitM UI — the conflict chrome (`.gitm-conflict-mode` red pulse), the conflicted-files list, the four-pane editor (`.gitm-cedit-*`), the take chips. Read the PNG to SEE the state.
- **DOM steps need the OFFSCREEN windowId**: the GitM island is a sub-page inside the SCP window; the scpName→presenter trap means a DOM `{kind:"js"}`/`{kind:"click"}` assertion resolves to the offscreen render context — pass the explicit `target:{windowId}` for the SCP window (the presenter is a SEPARATE window; a `js` step against the presenter sees no DOM).
- **The bridge-window DOM needs its own windowId** for dataset Concluders (e.g. asserting `.gitm-conflict-panel` exists or `activeConflict.path` is loaded) — resolve the bridge/SCP window's windowId first (probe → URL match), then run the `js` assertion against IT.
- **gitm.json fields = the file witnesses** (offscreen truth · under the SCP's `Cascades/Bridge/gitm.json`): `conflicts[]` (drives the red mode + files list) · `activeConflict{path,ours,base,theirs,merged}` (the editor's four sides) · `reflogEntries[]` (the undo picker) · `pendingConfirm{action,token}` (the WATCHKEY armed chip) · `commandLog[]` (every git op) · `abMode`. A destructive preview rides `lastActionResult.preview` in the MCP tool response (call-1) — NOT gitm.json (bridge-local).
- **Two-call destructive tools** (gitm_reset --hard · gitm_force_push · gitm_discard_all · gitm_discard · gitm_undo): call-1 (no token) returns `{guardFired, confirmToken, preview}` — assert the `preview` is present; call-2 carries `confirmToken` to execute. The conflict tools (gitm_load_conflict → gitm_resolve_conflict) are load-then-write; gitm_merge_abort is the always-visible recovery.

---

## Known scars (check before blaming the SCP)
- `send_message` MCP: passes `sessionId`, quality wants `targetUlid` → silent bail (`fkis.mcp.bail`) with a 200 ACK. Chat through the UI srex panel (`input.srex-chat-input` + `button.srex-chat-send-btn`) until fixed.
- Send-on-focus Enter (P-2 · punted): the UI send types but may not submit when the terminal focuses — a human smoothed it in the proving; account for it in verdicts.
- The sub-page nav highlight can be unlit at boot (content renders via v-else regardless).
- Dev-serve staleness: dev:self can serve an old client bundle after template edits — the Bridge Turn-Over (the Muxametric Diamond) is the real mechanism; meanwhile `touch src/index.ts` + reload and RE-VERIFY the bundle actually changed before concluding a fix failed.
