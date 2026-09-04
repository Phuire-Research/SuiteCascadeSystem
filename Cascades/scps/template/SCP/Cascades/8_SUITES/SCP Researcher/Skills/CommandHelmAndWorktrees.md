# SCP-S19 · The Command Helm, Worktree Multiplication & the Tactical Bridge

*Skill added: DF3 · Cycle 675 (2026-07-19) — the C615-C657 operational epoch, previously undocumented (the Researcher's knowledge froze at Cycle 244).*

**What this Skill carries**: the operator surface a developer meets AFTER install — how to manage installed SCPs from the Session Manager (the Command Helm), how to run the same SCP as many spawnable instances (Worktree Multiplication), and the three-class git turn-over (the Tactical Bridge: Shield · Sword · Sparks) with its Continuity Law and Flushed Ring.

---

## Curation
The SCP paradigm enables the operator to manage every installed SCP from the Session Manager itself — spawn, focus, multiply into worktree instances, exit — and to build while using through a three-class git turn-over (Shield · Sword · Sparks) that always resumes the last chosen ground. What is enabled is an OPERATOR surface over the same machinery the bridge's tools expose.

## Research
No live read today; this Skill describes the operator surface. The surface is: `<SCP>/Cascades/Bridge/bridge.json` — `scpStatuses` (the roster the helm renders · poll-authoritative) · `boundScps` · `installedScps` (via SCP-S12's read, with its age); `<SCP>/Cascades/Extended/<designation>/S8.json` — `grep -n "boundSessionId" … || echo "no binding"` (DF1); `test -f <SCP>/Cascades/Bridge/gitm.json` (the Tactical Bridge's own state). Worktree instances are sibling directories `<name>--wt-<slug>` beside the SCP root (`ls -d <SCP>/../*--wt-* 2>/dev/null || echo none`). Operating the helm — spawn · exit · turn over · multiply — is the user's act through the page or the Shipwright's tools; the Researcher reads the roster, it does not drive it (`Instance.md` §"Not the Shipwright").

## Return
- Sentence: "`<scpName>`: `<N>` SCPs online, `<M>` offline per `scpStatuses`; `<K>` worktree instances beside it."
- Section: the Sentence + the per-row controls the ask touched (§1) + the Flow-1 / Flow-2 law if worktrees were asked + the S8 binding state.
- Vermillion: a multiply / merge sequence as Bands (create → register → install → ready → Flow-1 merge) — a plan the user executes on the helm.
- Diamond: a fourth turn-over class or a roster law change — returned INLINE with the founding offer (`Instance.md` §B · the Diamond rung's law).
---

## 1. The Command Helm (the Session Manager IS the SCP helm)

The Session Manager's left-detail column now converts into direct SCP management. The old three metric cards collapse into ONE compact footer strip (Last Update · Bridge version · Connected); the freed space becomes **SCP COMMAND** — every installed SCP as a row.

- **Grouping**: rows group **ONLINE · N** then **OFFLINE · N** (online-first; the same section-label pattern the sessions list uses). The roster is driven by the registry truth (`scpStatuses` on `bridge.json`) — **the registry is the list**: a memoized `SCPs.json` name set supersedes any watcher/FSM union so a stale projection can't surface a phantom row (e.g. a worktree-birth subdir's `Cascades/` is *not* an SCP).
- **Freshness**: the roster is **poll-authoritative** (a 5s poll), not optimistic — a row's live/offline badge reflects the last poll, never a hopeful local flip.

### Per-row controls
| Control | Icon | What it does |
|---|---|---|
| **SPAWN** | — | Boot the SCP (the `/bridge-boot` rail); the badge flips live on the next poll. |
| **FOCUS** | — | Raise an already-spawned SCP's window (`/bridge-focus` with the freshly-bound `browserUrl`; composes with active-SCP = last-user-spawned). |
| **MULTIPLY** | `fa-copy` (HiFi Yellow) | Spawn another **instance** of this SCP from a worktree (§2) — NOT close. (The icon was redesigned after users read a former × as "close".) |
| **EXIT** | `fa-xmark` (base → red hover) | `scp_stop` — window close-by-id + branch kill + status → `pending`. Recoverable, so no typed confirm. |

---

## 2. Worktree Multiplication (run one SCP as N spawnable instances)

**The mechanism**: `gitmWorktreeAdd/List/Remove` qualities + the `gitm_worktree_{add,list,remove}` MCP family. A worktree is just another absolute directory the gitm M-chain already keys on — only *registration* was new. MULTIPLY mints a sibling instance dir `{name}--wt-{slug}` with its **own port** and its own `scp.config.json {scpName}` re-stamp (the FKIS origin guard resolves the origin from that file). Both instances of the same SCP then run + focus-switch simultaneously; the original's A seat is untouched.

**The birth bar** (the MULTIPLY panel): a Pewter staged bar — **create → register → install → ready** (four ticks), driven by the roster status projection, not a timer.

**The async install stage** (a real gotcha): `git worktree add` carries only TRACKED files → `node_modules` is ABSENT → `vite: command not found`. So a new **non-blocking** `npm install` leg runs: status `installing` → `pending` (never stuck). SPAWN is disabled "Installing…" while it runs; a failure flips to `pending` and surfaces the boot error (stdio ignored → no install log; the boot error is the only signal).

**"A directory is not an SCP"**: the FS-added reducer admits ONLY registry-gated canonical names — a worktree-birth subdir (e.g. the instance's `SCP/Cascades/`) fires `addDir` but is NOT admitted as an SCP.

### The two worktree flows (the git law that makes them work)
- **Flow-1 · merge-without-hop**: an instance's branch is checked out in its own tree, so the Base can't check it out (git law: a branch lives in one worktree). But `git merge` needs only the TARGET checked out — so the Base sets B = the instance's branch and **merges B → A directly** (shared object store, no checkout hop). *Gap carded (W7b)*: the assign-B foreign-sword guard must relax for registered-instance branches.
- **Flow-2 · delete-frees-the-hop** (field-proven): the typed-name DELETE retires the **tree** but the **branch SURVIVES** (KEEP BRANCH is the default; `git worktree prune` runs on delete). Freed of its worktree, the branch becomes normally hoppable/mergeable in the Base.

### Delete (the typed-name arm)
On an instance row, DELETE opens a confirm panel: type the word **`Delete`** (case-insensitive) to arm the red FIRE. FIRE runs a two-call token round (mint → confirm); the worktree is removed, the registry entry + slice + watcher retire, the row leaves the roster.

---

## 3. The Tactical Bridge (the three-class turn-over)

"Tactical Bridge" is the user concept for the fixed-bottom dock + Branches panel (the internal component is `TaskBar`). The A/B git turn-over now carries **three classes**, one StratiPUNK composition — only the functional color register + class name differ:

| Class | Role | Register | Glyph |
|---|---|---|---|
| **Shield (A)** | the ground / tactical fall-back | retains the current scheme | `fa-shield-halved` |
| **Sword (B)** | the experiment | Yellow ⊗ Blue | `fa-khanda` |
| **Sparks** | the **Hard Turn Over** — the clean-slate compromise | Red | `fa-bolt` |

**Sparks IS the Hard Turn Over** (was just "Hard" in the earlier glossary). The **hero/logo badge** is the class glyph centered at the head of the overlay title stack — the Bridge's own iconography, colored per register (accents + shadows only, per the OSR root-paint law).

**The sticky-expression precedence (implementation law)**: the declared class is STICKY. A marker carries `turnClass` (stamped by all the sword-b writers); an EXPLICIT class on a re-show RE-TINTS the mounted overlay in place; a derived default NEVER downgrades a declared expression. *If you add a new turn-over trigger, stamp `turnClass` on the marker* or the overlay wears the wrong expression.

### The Continuity Law (restart resumes your last A)
A restart **RESUMES the last selected Shield-A registration** — the persisted decision set IS the boot state (persisted-first; auto-induction fires ONLY for the genuinely un-inducted). After a full restart your Shield A is what you last picked, not a re-derived guess. Derived A-registrations are existence-gated (`git rev-parse --verify`); a phantom root leaves A EMPTY for an explicit Set A — never a phantom write.

### The Flushed Ring (an empty A directs its own recovery)
When A is empty (a reset, or the phantom gate), the Shield button wears a rotating conic **reset-directing ring** (`.stable-a-btn.flushed`) with the copy: *"Shield A — UNSET · The branches were flushed — press here and pick your stable branch to reset the Tactical Bridge."* Release law: **every error-flushed state carries its own recovery direction** — an empty-A is never a silent zero.

---

## 4. DF1 · The Suite 8 Session Binding (an anchored S8 remembers its session)

`S8.json` (`Cascades/Extended/<designation>/S8.json`) gains **`boundSessionId`** — the durable mirror of the S8's anchored session, surviving even registry loss. Behavior:
- Spawning an **anchored-ALIVE** S8 → focuses its existing window.
- Spawning an **anchored-OFFLINE** S8 → re-engages the existing ULID.
- Spawning with **no operational anchor** (fresh install / wiped registry) → consults `boundSessionId`; resumable → re-claim + engage the bound session.
- **UnAnchor CLEARS** the binding.

Written ONLY at the anchor seams (`setSessionAnchor` / `claimAnchorIfUnclaimed` / the UnAnchor clear) — single-writer discipline keeps it in lockstep with the operational `isAnchor`. The bound session is the S8's own session memory.

*Placement flag*: `resolveOwningScpRoot` first-matches the TEMPLATE SCP (every SCP ships the shared 8_SUITES dir), so the binding may land in the template's Extended — an open question (template-default vs workspace-Extended vs active-SCP).

---

## The developer's one-paragraph mental model

The Session Manager is your SCP helm: installed SCPs list grouped online/offline, each spawnable/focusable/multipliable/exitable in place. MULTIPLY runs the same SCP as many worktree instances (each its own port + install stage). The Tactical Bridge is your safe build-while-you-use loop: **Shield A** is your stable ground, **Sword B** your experiment, **Sparks** the hard clean-slate turn-over — and a restart always lands you back on the A you last chose. An anchored Suite 8 remembers its own session across restarts (DF1). See **SCP-S20** for the runtime security posture and **SCP-S21** for how deep bridge-architecture questions load the SCS-Bridge Suite 8.

> **Diameter to the SCS-Bridge S8**: this Skill is the OPERATOR surface (what you DO). The same worktree + turn-over machinery has a callable-tools angle in the SCS-Bridge Suite 8 — **SB-DS8** (the `gitm_worktree_*` trio + the A↔B turn-over qualities + Flow-1/2) and **SB-DS7** (how another session invokes them through the `/mcp` channel). Two Suite 8s, one machinery, two angles: read here to operate, read SB-DS7/SB-DS8 to invoke.
