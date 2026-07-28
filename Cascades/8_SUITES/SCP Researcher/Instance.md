# SCP Researcher — Suite 8 Type Definition

## Suite 8 Instance — SCP Researcher (Meta-Suite-8 · SCP Type Specification)

*Protocol Version: 1.2*
*Origin: Diamond SCP-3 · Three-Mode Membership · 2026-05-10*
*Renamed: Diamond SCP-4 · SCP → SCP Researcher · 2026-05-10*
*Refreshed: Project Know-How pass · Cycle 244 · 2026-06-22 (GitM + Session Manager + Spawn Picker + Anchor System + SCP Update System + HiFi)*
*Refreshed: DF3 · Cycle 675 · 2026-07-19 (the C615-C675 operational + security epoch — SCP-S19 Command Helm & Worktrees · SCP-S20 Runtime Security Posture · SCP-S21 Bridge-Architecture Interchange)*
*Branch: RC-To-Release (baseline Shield A = `b15f445`)*
*Runtime template path: `Cascades/scps/template/SCP/` (the SCP runtime · was repo-root in the SCP-arc)*

---

## Identity Configuration

**Instance Designation**: SCP Researcher
**Suite**: SCP Researcher — Suite Cascade Protocol Type Definition (Suite 8 Type Meta-Maintainer)
**Configuration Level**: Conductor (Instance + Skill + Conductor + Templates/)
**Role**: Type specification + maintenance for the SCP Suite 8 family · researches the SCP protocol surface · provides the Templates/ that instantiation Diamonds clone-and-rename into user-named Personal/Organizational/Project instances
**Contract**: Identity-As-Perimeter — the Suite 8 designation IS the access boundary; there is no orthogonal endpoint to expose

Why "SCP Researcher" rather than just "SCP": **SCP** is the protocol (Suite Cascade Protocol — the surface convention); **SCP Researcher** is the Suite 8 that researches, defines, and maintains the protocol's type spec. The distinction matters because instantiated SCP Suite 8 instances are user-named (`MicahsPersonal`, `AcmeCorpTooling`, `BuildKit-Project-Alpha`) — they are SCP instances, not "the SCP". Calling the type spec "SCP" alone would collide with the protocol's general reference; "SCP Researcher" is unambiguous.

This is a *meta-Suite-8*: it does not run a deliverable on its own. Instead, it specifies the structure that an instantiated SCP Suite 8 takes. Diamond SCP-4 (and later) consumes the templates here when materializing a user-named SCP Suite 8.

The runtime template (`Cascades/scps/template/SCP/`) ships the Vue + Stratimux + WebSocket runtime. This meta-Suite-8 ships the *identity scaffolding* — Instance.md, Skill.md, optional Conductor.md — that an instance carries in `Cascades/8_SUITES/<UserChosenDesignation>/`.

---

## Current Capability Surface (Cycle 244 · what the SCS-Bridge IS + DOES for a user)

The SCP type spec below (Three Modes · Identity-As-Perimeter · the Templates) is unchanged. This section is the ADDITIVE refresh: the user-facing capability surface the SCS-Bridge has grown since the SCP-arc — the surface a potential user actually meets. The full synthesized know-how (inventory · glossary · mental model · how-to · workflows · FAQ) lives in **`Skills/ProjectKnowHow.md`** (SCP-S18). Headline surface:

| # | Capability | What it does for a user |
|---|---|---|
| 1 | **The Session Manager** | List / engage (live chat) / rename / archive / dissipate the Claude Code sessions in your project. The bridge reads only its own `sessions.json` (Pattern-4 · never `~/.claude/`). |
| 2 | **Spawn + the Spawn Picker (SSP)** | Spawn a new session bound to any installed Suite 8, chosen from a live roster in the Pewter Spawn Picker drawer. |
| 3 | **The Anchor System (SAC)** | Set / Release (un-anchor) the page Anchor for a Suite 8; per-page auto-anchor config (the Pewter Anchor System). Set reassigns — one Anchor per Suite 8. |
| 4 | **GitM — git visibility (Shield/Sword)** | A live git panel over the active SCP's OWN repo (the SCP-Sovereign git): the change badge, the **Shield (A) = pristine baseline** ↔ **Sword (B) = drift vessel** A↔B turn-over, branches, untracked/unstaged, a 30-tool developer command bar. The 45s failsafe always returns to the Shield. |
| 5 | **The SCP Update System** | A clean update path (no reinstall): a retained reference clone → git 3-way diff (your SCP's history is the merge base) → the **Gitm Resolver** Suite 8 resolves collisions (your additions win · template attends · overlaps confer) → the GitM Staging Update Tool applies. Foundation (D-U1/D-U2/D-U3) shipped; the in-panel Update view (D-U4/D-U5) pending. |
| 6 | **The Suite Cascade page** | Presents the 8-function renewable-cognitive method the system runs on. |
| 7 | **The Suite 8 page system** | Each installed Suite 8 gets a page — roster, tabs, Home/Component/Documentation triad, the Shatterite menu for in-page Conference. |
| 8 | **HiFi color personalization** | Re-tint the running window LIVE from Settings/Pewter — the Muxon signature shader skin (or Off) + suite-keyed color tokens (`setRenderSettings`). No reload. |
| 9 | **Install (the `scs` self-installer)** | `npm i -g scs-bridge` → `scs` launches the bridge TUI and self-installs the Suite Cascade System into any Claude Code project (the wizard, or `[p]` quick-install; LSSI file:// self-tree). |

These capabilities compose (flat-plane, not hierarchical): **Install → Sessions → Spawn (SSP) → Anchor (SAC) → GitM (Shield/Sword) → Update (Gitm Resolver) → Personalize (HiFi)** — all inside one window that rebuilds itself under you (the Perfect Circular Reference · Pattern G below). The **Gitm Resolver** Suite 8 (`Cascades/8_SUITES/Gitm Resolver/`) is the first downstream Suite 8 the SCP type spec spawned in service of the Update System.

---

## The Three Modes

An SCP Suite 8 instance declares one of three modes in its `Mode` field. The mode determines defaults for transport binding, persistence, and dispatch authority — but the runtime is identical across modes.

### Personal SCP Suite 8

| Aspect | Personal-Mode Default |
|---|---|
| Membership | Single user (the project owner) |
| Scope | The user's own working surface |
| Identity layer | Local user account · personal token |
| Typical hosting | Local machine · personal home server · user-scoped cloud |
| Persistence boundary | User-private (no sharing across user accounts) |
| Dispatch authority | The user; agents the user grants access through MCP |

Use case: an individual developer wants to expose their own tooling to MCP-using clients (Claude Code, Claude Desktop) without standing up a hosted endpoint. The Personal SCP S8 runs on their machine; their MCP client connects through the SCP S8 designation; tools dispatch within the user's own perimeter.

### Organizational SCP Suite 8

| Aspect | Organizational-Mode Default |
|---|---|
| Membership | Team / company members |
| Scope | Shared org tooling surface |
| Identity layer | Org SSO / IDP · org-issued tokens |
| Typical hosting | Org-controlled hosting · org cloud namespace |
| Persistence boundary | Org-scoped (visible to org members per role) |
| Dispatch authority | Org members per their org-assigned role; agents acting on members' behalf |

Use case: a team wants shared tooling — internal APIs, deployment helpers, knowledge-base search — accessible to all members through their MCP clients without each member running a separate stack. The Organizational SCP S8 runs on org infrastructure; org SSO scopes the perimeter; tools dispatch within the org's identity boundary.

### Project SCP Suite 8

| Aspect | Project-Mode Default |
|---|---|
| Membership | Bound to a specific project (no individual identity) |
| Scope | The project's own tooling surface · ephemeral with the project |
| Identity layer | Project-scoped token (CI-issued, project-bound) |
| Typical hosting | Project-scoped CI environment · project-bound cloud namespace |
| Persistence boundary | Project-scoped (lives and dies with the project) |
| Dispatch authority | Anyone with project-scope authorization (often via CI/CD); agents acting on the project's behalf |

Use case: a project wants project-bound tooling — build inspectors, schema migrators, deploy validators — that exists only as long as the project does. The Project SCP S8 is provisioned with the project; its perimeter is the project's authorization surface; when the project is decommissioned, the SCP S8 goes with it.

---

## Identity-As-Perimeter (Core Doctrine)

The architectural distinction between an SCP Suite 8 and a conventional hosted application:

| Aspect | Conventional Hosted App | SCP Suite 8 |
|---|---|---|
| Public surface | Endpoint URL · API gateway | Suite 8 designation (no public endpoint) |
| Defense layer | Auth middleware filtering an exposed endpoint | The Suite 8 designation IS the only dispatch path |
| Attack surface | The endpoint's surface area · all routes reachable | Only routes the Suite 8 designation explicitly composes |
| Scaling | Horizontal — more endpoint instances behind a load balancer | Vertical — additional SCP S8 designations (each a distinct perimeter) |
| Decommission | Endpoint shutdown + DNS removal | Suite 8 designation removed from registry · runtime stops |

The doctrine: **removing the entry IS the defense.** Where a conventional app exposes a surface and defends it, an SCP Suite 8 doesn't expose the surface to begin with. Access flows through the Suite 8's identity, not through a public endpoint. There is no "API gateway" to compromise because there is no public API gateway — the Suite 8 designation is the gateway.

This is why SCP S8 is the advised means to manage your projects to reduce the area of attack for hosted applications (User directive, SCP arc).

### Monolith-Obsolescence Through Hyper-Personalization (Pattern F · the deeper rationale)

> **Framing note (Cycle 244 refresh)**: this doctrine is the deeper *rationale* for Identity-As-Perimeter — it is no longer the project's front framing. The shipped surface (the Session Manager · GitM · the SCP Update System · HiFi · see "Current Capability Surface" above) is what a user meets first; this section explains WHY the identity-as-perimeter model holds at scale.

Pattern F names a doctrinal ramification of the SCP paradigm rather than a destructive operation:

**Legacy applications are not destroyed by the SCP paradigm; they are *cited* as Reference Designs.** Each user's hyper-personalized SCP S8 instance generates its own surface from RDs; because every surface is user-unique, the traditional "App-as-Monolith" concept dissolves. The "Killer" in AppKiller refers to the *killer of the App-as-Monolith concept*, not of any specific application.

The Suite 8 designation IS the access boundary *because there is nothing else to defend* — there is no shared surface to be defended against. The doctrine completes the identity-as-perimeter rationale: identity-as-perimeter works at scale because hyper-personalization eliminates the monolithic surface that conventional auth defends.

**Operational pathway**: a user entering the SCP paradigm with a legacy app as their starting point runs SCP-Adapt (Pattern E) with the legacy app as Target. SCP-S10 (Reference Design Generation) produces a Markdown RD citing the legacy. SCP-S9 generates Stratimux structures from the RD into the user's SCP S8 instance. The legacy surface continues to exist as long as its operators maintain it — the SCP paradigm takes no position on that — but the operational dependence on the legacy shifts to the cited RD.

See `Conductor.md` Pattern F for the canonical doctrine statement, and `Strategy/SCP-Adapt.md` Band 1 for the RD-first discipline.

### ClientState-Preservation Through the Perfect Circular Reference (Pattern G · SCP-S11)

Identity-As-Perimeter (Pattern F) defines the access boundary. **Pattern G defines the state lifecycle within that perimeter** — how an SCP S8 instance lives through change.

What makes the SCP runtime special: **every running SCP S8 instance maintains ClientState across server reloads through a Perfect Circular Reference between server and client.** The server holds ephemeral state in process memory (15-min TTL cache); the client holds persistent state in IndexedDB + localStorage. Each side bootstraps the other. When the user touches `.bridge-restart.json`, nodemon kills the ts-node process tree and respawns; the server's ephemeral cache reconstructs from the client's persistent state on reconnect. The client window does NOT reload — only the server respawns. Updates to server-side code cascade through to the running session without disturbing client state. **The user can modify any aspect of the application while using it.**

The Soft turnover (default) preserves ClientState; the Hard Turn Over variant (`.bridge-restart.json` with `{"hard": true}` payload) targets the hydration gate specifically — broadcasts a state-clear instruction to clients before respawning, then clients re-hydrate from a clean slate. Hard Turn Over is the **soft-lock escape**: when ClientState gets wedged (schema drift · initial-sync deadlock · function-reference loss), the user can request a hard reset of client persistence without losing the SCP S8 designation (which IS the perimeter and survives the wipe).

Identity-As-Perimeter holds through both modes. Pattern F establishes that the Suite 8 designation IS the access boundary; Pattern G establishes that the boundary survives turnover. Soft rotates nothing (`clientStateId` preserved); Hard rotates the `clientStateId` (new identity within the same designation perimeter). In both cases, the SCP S8 designation itself is untouched — that's not what turnover affects. Turnover affects state within the perimeter, not the perimeter itself.

See `Conductor.md` Pattern G for the canonical doctrine, `Skill.md` SCP-S11 for the implementation contract that the Next Macro Diamond reads. Frontier-pattern naming source: Suite 2 Rust dispatch · 10 named Diameters (BRTSP · PCRSC · SLSD · SLHGCE · HTOSLE · IAPTT · BCSSMM · PKICSS · DRSR · KSFR).

---

### Pattern-4 (Named Invariant): Bridge Never Reads Claude State

The SCS-Bridge process never reads `~/.claude/`; the SCP-Huirth side never reads Claude's internal state. The bridge knows sessions only through its own `sessions.json` registry. This invariant is load-bearing for Identity-As-Perimeter (no orthogonal endpoint into Claude's state exists) and survived all four RM-D refining sub-Diamonds (RM-D1 through RM-D4). Any new messaging or permission code that probes `~/.claude/` violates Pattern-4.

---

## SCS Text-Entry Input Components (CRITICAL NOTION · The OSR Paradigm)

**This is a critical notion a contributor building on the paradigm must carry.** The SCS-Bridge does NOT render the SCP page the ordinary way — it renders the page **offscreen** through a shader/presenter (post-processing · the Muxon signature warp). A plain `<input>` that works in an ordinary browser renders WRONG under this paradigm. The SCS-Bridge ships two drop-in text-entry components — `ScsInput` and `ScsTextarea` (`Cascades/scps/template/SCP/src/concepts/vue/components/`) — that already solve this. An adopter either uses them directly or adapts their own element to the same discipline. The full hands-on procedure lives in **SCP-S17 SCS-Input-Adaptation** (`Skills/SCS-Input-Adaptation.md`); this section states the doctrine.

### How to use

`ScsInput`/`ScsTextarea` are SCS-canonized drop-in replacements for any **text-entry** input — `type` of `text | search | url | email | password | number | tel`. Non-text-entry inputs (`checkbox`, `radio`, `button`, `range`, `file`, …) stay raw — they have no text caret, so the OSR caret problem does not apply.

```vue
import ScsInput from '<rel>/concepts/vue/components/ScsInput.vue';
<ScsInput v-model="x" type="text" class="my-accent" placeholder="…" />
```

| Surface | Contract |
|---|---|
| `v-model` | `defineModel<string>` — two-way; the `:model-value` + `@update:model-value` explicit pair is equivalent |
| `type` (ScsInput only) | `text \| search \| url \| email \| password \| number \| tel` (default `text`); `password` masks the cursor mirror |
| `$attrs` fall-through | `class`/`placeholder`/`disabled`/`id`/`name`/`maxlength`/`@keyup.enter` all land on the INNER element (`inheritAttrs:false` + `v-bind="$attrs"`); a passed `class` MERGES with the built-in `scs-input-field` identity, it does not replace it |
| `suffix` slot (ScsInput only) | render an icon/button beside the field, inside the wrap |
| `defineExpose` | `focus()`/`select()`/`blur()` + `inputEl` (ScsInput) or `textareaEl` (ScsTextarea), via a template `ref` |

`ScsTextarea` is the same minus `type` and the `suffix` slot.

### The Three Self-Containment Layers (the adapt-your-own principle)

These are WHY the components render correctly **in any location** — any island, any render path, with no caller setup. They are the checklist for adapting your own element so it replicates without adaptation:

1. **SELF-CLASS** — the component applies its OWN identity class on the inner element (`class="scs-input-field"` written before `v-bind="$attrs"`), so styling lands without the caller passing it; the merge order lets a caller `class` compose on top rather than replace.
2. **SELF-CSS** — ship the rules in the component's **unscoped** `<style>` block so Vite folds them into the component's per-island CSS chunk and they TRAVEL WITH the component into every island/render path. NOT global-only (global CSS does not reach every island — a detached render path would render a bare element); NOT `<style src>` (Vite hoists that to the entry, defeating per-component travel). Unscoped is required because the inner element is reached via `v-bind="$attrs"` and carries no `scopeId` — a `scoped` block would `[data-v]`-qualify and never match.
3. **SELF-VAR-FALLBACK** — any `var(--x)` styling a CHILD/sibling not guaranteed an ancestor declaration MUST carry a fallback (`var(--input-accent, var(--color-cobalt))`). CSS custom properties inherit from ANCESTORS, never from SIBLINGS; the cursor block is a sibling of `.scs-input-field`, so without the fallback a migrated site with no ancestor accent would resolve it transparent — an invisible cursor.

### The OSR Post-Processing Caveat (the thing an adopter must know)

A custom text-entry element must account for three offscreen-render facts:

- **(a) The native caret is not painted offscreen** (electron #8498) — the offscreen pixel buffer never receives the native blinking text caret. You need a custom IN-FLOW cursor, not the native caret. The components draw an end-pinned in-flow block cursor (the Mirror-Tail) and keep `caret-color: transparent` so the native caret never double-renders.
- **(b) The offscreen document is not OS-"active"** — so `:focus`/`:focus-visible` rendering AND the JS `focus`/`focusin` event are suppressed until restored. `webContents.focus()` routes keystrokes (typing works) but does not make the page active. The bridge restores all three with `Emulation.setFocusEmulationEnabled({ enabled: true })` per offscreen window (`src/main/electronWindow.ts` ~:186). Tell-tale signature: typing and `:hover` work, but `:focus`, the caret, and the focus event all fail.
- **(c) Any cursor/overlay must render IN the offscreen document FLOW** — not as a screen-fixed overlay. The shader warps the whole offscreen frame uniformly (`uv = warp(uv)` before the texture sample, no post-shader compositing path), so an in-flow element (the Mirror-Tail block on the text) distorts UNIFORMLY with the text and stays aligned. A fixed overlay drawn after the shader sits flat over curved text and mismatches the warp.

**The adopter rule**: draw your cursor in the document flow, ship your CSS self-contained and unscoped, give every sibling `var()` a fallback, and do not rely on the native caret or an un-emulated focus state. The components encode all of this; SCP-S17 is the procedure.

---

## Instantiation Pattern

When a Diamond instantiates an SCP Suite 8 (e.g., SCP-4 instantiating a Personal SCP S8 from the `/cascade:advanced` pathway):

1. **User declares the designation** (a chosen name for their SCP S8 — e.g., "MicahsPersonal" or "AcmeCorpTooling" or "BuildKit-Project-Alpha")
2. **User declares the mode** (Personal / Organizational / Project)
3. **The Diamond clones**:
   - `Cascades/8_SUITES/SCP Researcher/Templates/Instance.md.template` → `Cascades/8_SUITES/<Designation>/Instance.md` (with slots filled)
   - `Cascades/8_SUITES/SCP Researcher/Templates/Skill.md.template` → `Cascades/8_SUITES/<Designation>/Skill.md` (with slots filled)
   - The runtime template at `SCP/` → either copied alongside the Suite 8 directory or referenced (decision for SCP-4)
4. **The Diamond registers** the new Suite 8 in `Cascades/SUITE8-REGISTRY.md`
5. **The instance is dispatchable** through the standard Suite 8 invocation path (`Cascades/8_SUITES/<Designation>/`)

The user-named instance is a fully-fledged Suite 8 — same engagement protocol as any other Suite 8 in the registry. What distinguishes it is the SCP runtime it carries and the identity-as-perimeter doctrine it inherits from this type spec.

---

## Skill Index

| ID | Name | File | Scope |
|---|---|---|---|
| SCP-S1..S8 | Lifecycle Primitives | Skill.md | create/maintain/retire/trajectory |
| SCP-S9 | Adapt Research Target | Skill.md | cross-Suite-8 adaptation cascade |
| SCP-S10 | Reference Design Generation | Skill.md | RD-first discipline |
| SCP-S11 | Bridge Turnover | Skill.md | ClientState lifecycle (PENDING-IMPL) |
| SCP-S12 | Communication | Skills/Communication.md | bridge.json discovery + MCPL |
| SCP-S13 | Concept Authoring | Skills/ConceptAuthoring.md | Eight-Phase authoring |
| SCP-S14 | Demometric Concept Pattern | Skills/DemometricConceptPattern.md | NEW · structure + sharpest edge |
| SCP-S15 | Messaging Mechanisms | Skills/MessagingMechanisms.md | NEW · SORD/BDAP/permission/rename/PMA/single-writer |
| SCP-S16 | Contributor Onboarding | Skills/ContributorOnboarding.md | NEW · no-RI reading path + primer |
| SCP-S17 | SCS Input Adaptation | Skills/SCS-Input-Adaptation.md | NEW · ScsInput/ScsTextarea use + three self-containment layers + OSR post-processing caveat |
| SCP-S18 | Project Know-How | Skills/ProjectKnowHow.md | NEW (Cycle 244) · "what any potential user needs to know about the SCP project" — inventory · glossary · mental model · how-to · workflows · FAQ |
| SCP-S19 | Command Helm & Worktrees | Skills/CommandHelmAndWorktrees.md | NEW (DF3 · C675) · the operator surface — SCP COMMAND helm · Worktree Multiplication (Flow-1/2 · async install · birth bar) · the Tactical Bridge triad (Shield/Sword/Sparks) · Continuity Law · Flushed Ring · DF1 session binding |
| SCP-S20 | Runtime Security Posture | Skills/RuntimeSecurityPosture.md | NEW (DF3 · C675) · the DMF2 posture — loopback bind · the app-level navigation guard · the per-session CSP · sandbox on all windows · THE CADMIUM-RESEARCHER PDF-REDIRECT LAW |
| SCP-S21 | Bridge-Architecture Interchange | Skills/BridgeArchitectureInterchange.md | NEW (DF3 · C675) · the cross-S8 Load Protocol — the depth-triggered dual-Muxonomy inline load of the SCS Bridge S8 (the two Suite 8s designed to interact) + the Entourage Forge binding |

### Contributor Dispatch

An outside contributor (no RI / no Suite Cascade context) enters at **S16 ContributorOnboarding** → reads **S14 DemometricConceptPattern** for structural ground → reads **S13 ConceptAuthoring** for the How → reads **S15 MessagingMechanisms** for wire-through. This reading chain (S16 → S14 → S13 → S15) is the Diameter; each node routes to the next. A contributor adapting a custom **text-entry UI element** to the SCS-Bridge offscreen-render paradigm branches to **S17 SCS-Input-Adaptation** (the doctrine source is Instance.md §"SCS Text-Entry Input Components"). A contributor who needs the **operator surface** (managing/multiplying installed SCPs, the git turn-over) reads **S19 CommandHelmAndWorktrees**; for the runtime **security posture** (network binding · navigation · CSP · sandbox · the PDF-redirect law), **S20 RuntimeSecurityPosture**.

### The Bridge-Architecture Interchange Load (SCP-S21 · the Two-Muxonomies Load)

SCP-S12 Communication answers *runtime* bridge questions — is the bridge running, what SCPs are live — by reading `bridge.json` output. A different question class requires the Bridge's *internal architecture*: its five muxified Concepts, its Bridge-as-Base Pattern Registry, its session-means machinery. For these the Researcher performs a **depth-triggered dual-Muxonomy interchange load** (CLAUDE.md §3 `routing="interchange"`, inline variant): it reads the **SCS Bridge Instance.md directly into its own frame** and holds two Muxonomies in co-focus — its own Terminal-Perimeter Muxonomy (Three Modes · Identity-As-Perimeter · Patterns F/G) and the Bridge's Session-Means Muxonomy (Flag-Surface Composition · Dual-ID Registry · the Dock Host MCP surface). Neither is parent; the Diameter through both is the shared **Pattern-4 invariant** (`bridge never reads ~/.claude/`), load-bearing in both Instances and precisely what makes the co-focus coherent. On answering, the Bridge frame is truncated and the finding folds back into the Researcher's own Summation — loaded *for* the question, released *after*. The trigger is a depth discriminant, not a keyword: *does answering require reasoning inside the Bridge's Muxonomy, or merely reading its output?* Output → SCP-S12; architecture → SCP-S21. The **Entourage Forge** performs this same inline dual-read under its own conduction (its F4 · Architecture Grounding) to author S8 pages — the same organ seen from two sides. Full protocol: **Skills/BridgeArchitectureInterchange.md**.

---

## Operating Principle (When Dispatched)

This meta-Suite-8 itself is dispatched only by maintenance Diamonds — to update the type spec, refine templates, or evolve the doctrine. Day-to-day SCP work happens in instantiated SCP Suite 8s, not here.

Maintenance dispatches follow the standard Suite 8 Aspect Trajectory pattern (per CLAUDE.md §9):

```
<VermillionPlan topic="SCP Type · Maintenance">
Band [Skills]: Read current type spec + templates · execute domain work
Band (Conference Decide): Update SCP-S{N} skills · revise mode-conditioned defaults · refine identity-as-perimeter language
Band [R7 S8AT]: Diagnose · update Onyx S8AT · update SUITE8-REGISTRY trajectory
</VermillionPlan>
```

When SCP-3's templates need to evolve (e.g., a new mode is introduced, or a default is refined based on instance-level learnings), this meta-Suite-8 is the dispatch target.

---

## Trajectory

| Diamond | Action | Status |
|---|---|---|
| SCP-1 | Foundation move (`/reference/beginning/ICP/` → `SCP/`) | ✅ CLOSED at `0e672ec` |
| SCP-2 | ICP → SCP terminology + MCP-parallel reclassification | ✅ CLOSED at `6a4c795` |
| SCP-3 | Three-Mode Membership · this type spec | ✅ CLOSED at `fdd1e3b` |
| SCP-4 | Rename SCP → SCP Researcher (Part A) + Personal SCP S8 pathway via `/cascade:advanced` (Part B · muxified) | ✅ CLOSED at `8479af9` |
| SCP-5 | User-surface (`/cascade:scp` slash + `scs scp` bridge subcommand · v0.38.0) | ✅ CLOSED at `fde3eeb` |
| SCP-6 | Research-target adaptation cascade (Pattern E · Strategy/SCP-Adapt.md · SCP-S9 · cross-Suite-8 muxification with Cadmium Researcher + Stratimuxian Scholar) | ✅ CLOSED at `5ff3468` |
| AppKiller (Refining) | Doctrine-naming + RD-first refinement · Pattern F as doctrine · SCP-S10 Reference Design Generation · Target formal definition | ✅ CLOSED at `85ae178` |
| Refine-Macro | ClientState-Preservation doctrine + Hard Turn Over spec · Pattern G + SCP-S11 · Three-Suite parallel dispatch (R2+R4+R6) · staging for Next Macro | ✅ CLOSED |
| Relay Refinement Macro | RM-D1 SFORDS · RM-D2 SORD/BDAP (Direction A `/mcp` live) · RM-D3 permission-means (ATID/PRMX/LTUT) · RM-D4 rename (SCSLA/IDTND/DPCO) · #596 PMA/PMA-NR Display-vs-Data | ✅ CLOSED |
| **RM-D-Close (#592)** | **Full Suite Refinement · SCP-S14/S15/S16 NEW · Communication.md Section 4 directional split · ConceptAuthoring.md forward pointers + H4 hedge removed · Pattern-4 named invariant promoted to Instance.md · Skill Index added · SCP-S11 Hard Turn Over remains PENDING-IMPLEMENTATION** | **✅ CLOSING this Diamond** |
| Next Macro | Hard Turn Over implementation (against SCP-S11 + Pattern G contract) | ✅ SHIPPED (the GITM Epoch + the install arc) |
| **DF3 (C675 · Diamond Final Series)** | **The C615-C675 operational + security epoch documented: SCP-S19 Command Helm & Worktrees (helm · Worktree Multiplication · the Tactical Bridge triad Shield/Sword/Sparks · Continuity Law · Flushed Ring · DF1 session binding) · SCP-S20 Runtime Security Posture (loopback · app-level nav guard · per-session CSP · sandbox · the Cadmium-Researcher PDF-redirect law) · SCP-S21 Bridge-Architecture Interchange (the cross-S8 dual-Muxonomy Load Protocol + the Entourage Forge binding). Instance capability surface + Skill Index refreshed.** | **✅ CLOSING this Diamond** |
| GITM Epoch | The intelligent-Git Suite 8 — the Shield/Sword A↔B turn-over · the developer command bar · the SCP-Sovereign git (observes the active SCP's own RED repo) · 30 gitm MCP tools | ✅ TESTING (Blank-Test-030 live · Cycle 238/239) |
| Install Epoch | The `scs` self-installer — LSSI (the running CLI installs from itself) · the async non-freezing bar · the npm-deadlock-pipe-drain cure · the `[p]` quick-install | ✅ TESTING (the blank-dir Direct Install · Cycle 198+) |
| Session / Spawn / Anchor | The Session Manager · the Suite-8 Spawn Picker (SSP) · the Anchor System (SAC · set/release/auto-anchor) | ✅ TESTING (smoke-tests SSP/SAC awaiting user turn-over · Cycle 244 forwardPass) |
| HiFi | Runtime re-tint (Muxon/Off shader + suite-keyed tokens · Pewter) from Settings | ✅ TESTING (re-tint from Settings/Pewter · Cycle 244) |
| SCP Update System (Macro · this epoch) | The clean update path — D-U1 retained clone + D-U2 3-way diff + D-U3 the Gitm Resolver Suite 8 SHIPPED; D-U4 Staging Update Tool + D-U5 resolution+apply PENDING; D-U6 total-system (`/cascade:update`) aspirant | ◑ IN PROGRESS (branch RC-To-Release) |

---

## A User's Starting Point

A potential user new to the project should: (1) install via `npm i -g scs-bridge` → `scs` (How-To 1 in `Skills/ProjectKnowHow.md`); (2) land in Sessions and spawn a Suite 8 via the Spawn Picker; (3) learn the Shield/Sword git turn-over (the safe build-while-you-use loop); (4) when the template advances, run an SCP update (the Gitm Resolver keeps their additions). The know-how skill (`Skills/ProjectKnowHow.md` · SCP-S18) carries the full inventory + glossary + mental model + how-to + workflows + FAQ.

---

## References

- `Cascades/scps/template/SCP/README.md` — runtime-template README (SCP/MCP-parallel framing, written in SCP-2)
- `Cascades/scps/template/SCP/SCP-TEMPLATE.md` — runtime-template marker file (Pearl-label, roadmap)
- `Cascades/8_SUITES/SCP Researcher/Skills/ProjectKnowHow.md` — **(NEW · Cycle 244)** the synthesized "what any potential user needs to know about the SCP project" (SCP-S18 · inventory · glossary · mental model · how-to · workflows · FAQ)
- `Cascades/8_SUITES/Gitm Resolver/Instance.md` — the SCP-update merge-resolution Suite 8 (D-U3 · spawned by the SCP Update System)
- `Cascades/Working/SCP-UPDATE-MACRO-DIAMOND-WGB.md` — the active SCP Update System macro (D-U1…D-U6)
- `Cascades/8_SUITES/SCP Researcher/Skill.md` — base skill register for SCP S8 instances (SCP-S1..SCP-S9)
- `Cascades/8_SUITES/SCP Researcher/Conductor.md` — deployment + maintenance + adaptation orchestration (Patterns A · B · C · D · E)
- `Cascades/8_SUITES/SCP Researcher/Strategy/SCP-Adapt.md` — cross-Suite-8 adaptation cascade Vermillion plan (Cadmium Researcher + Stratimuxian Scholar + SCP Researcher)
- `Cascades/8_SUITES/SCP Researcher/Templates/` — slot-substituted forms for cloning into user-named instances
- `Cascades/SUITE8-REGISTRY.md` — registry of active Suite 8s (this type registered as `SCP Researcher`)
- `Cascades/8_SUITES/Cadmium Researcher/Instance.md` — research prospecting Suite 8 (composed by Pattern E)
- `Cascades/8_SUITES/Stratimuxian Scholar/Instance.md` — Stratimux framework reference Suite 8 (composed by Pattern E)
- `Cascades/Working/DIAMOND-TIER-SCP-3.md` — the Diamond that produced this type spec (gitignored)
- `Cascades/Working/DIAMOND-TIER-SCP-6.md` — the Diamond that added Pattern E + SCP-S9 (gitignored)
