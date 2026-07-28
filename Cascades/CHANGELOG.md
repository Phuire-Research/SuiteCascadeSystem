# SCS Changelog — Rotating Capped Log

**Cap**: ≤150 lines (~24% of `.claude/CLAUDE.md` at 618 lines · scannable from `head` OR `tail`)
**Order**: Newest-first (head = most recent · tail = oldest in current window)
**Rotation**: When this file exceeds 150 lines → oldest 75 lines roll to `Cascades/CHANGELOG-ARCHIVE-{YYYY-MM}.md` (preserve year-month boundary if possible)
**Last update**: 2026-05-14 (Iced Skill Trilogy Macro 1 close — scpDockHost Concept inducted into scsBridgeMuxium · muxifyConcepts 4→5 graduation · 5 Iced Skills + 5 Skill.md siblings (Stage E) · SBOTD 7-step · M39-M43 codified · v0.42.0 minor · TESTING pre-ICSM1-Smoke)

> **Maintenance Reminder — read before editing**
> 1. Append new entries at the **top** of `## Recent` (newest-first invariant)
> 2. Run `wc -l Cascades/CHANGELOG.md` after writing — if `≥150`, rotate the oldest 75 lines to `Cascades/CHANGELOG-ARCHIVE-$(date +%Y-%m).md`
> 3. Update the **Last update** field above to today's date
> 4. Sync the **Recent Changes** date in `.github/README.md` and `Cascades/Documentation/Cascades/README.md` (single line near the top of each)
> 5. The `/cascade:changelog` command surfaces this reminder — use it before editing

---

## Recent

### 2026-05-14 (Iced Skill Trilogy Macro 1 · scpDockHost Concept Induction · v0.42.0 minor · Cycles 115-118 consolidated)

**Macro 1 of 3 in the Iced Skill Trilogy · TESTING state pending ICSM1-Smoke (Cycle 119) user-Lambda HALT-GATE.**

(1) **Reference Design `ICED-SKILL-INDUCTION.md` authored** (471 lines) — canonical doctrine
introducing "Iced Skill = a Quality on a Concept performing the Deterministic Outcome of
a Skill" · 5-stage Skill→Quality refinement path · Suite-to-Concept Diameter (Ego↔Lambda
at runtime) · Stratimuxian Scholar (S1-S13) + Cinnabar Dialectic (P1-P9) muxified
substrate. The Trilogy spans M1 (this · SCP Concept) · M2 (SCP-hosted Suite 8 +
Interactive Terminals) · M3 (per-Suite-8 RI registration).

(2) **`MACRO-DIAMOND-ASPIRANT.md` authored** — project-level Trilogy through-projection
LIVING document. Aspirant (Ego) ↔ Onyx (Lambda) Diameter at Trilogy scope. Updated per
cycle close per M43 discipline.

(3) **Cycle 116 Foundation 5-Suite Magic Shotgun** (3097 lines total · R1+R2+R4+R6+R7
parallel single dispatch). R2 named `scpDockHost` canonical · 5 Iced Skills SB-DS1-5 ·
15-term Trilogy Pearl lexicon. R4 (M19 authority per M31) 8-Diameter PASS · Option I
atomic single sub-Diamond. R7 (M37 third invocation) Iced≠FROZEN disambiguation · L_iced_skill_1
state pre-seed for M3 forward compat.

(4) **Tier-0 Conference CLOSED** at user-Lambda "Engage" 2026-05-14: Q1 muxifyConcepts
4→5 APPROVED (M39 codified) · Q2 scpDockHost canonical APPROVED · Q3 Option I atomic
selected · Q4 Stage E concurrent Skill.md siblings APPROVED (M40 codified) · Q5 Cycle
115 WGB kept for reference.

(5) **Cycle 117 ICSM1-D1 atomic actualization** — 12 NEW source files (1452 LOC) under
`src/lib/bridge/concepts/scpDockHost/` (type/state/concept/helpers/principle/6 qualities/test)
+ 5 NEW Skill.md siblings under `Cascades/8_SUITES/SCS Bridge/Skills/SB-DS{1-5}-*/`
+ 3 source MODs (scsBridgeMuxium muxifyConcepts 4→5 + SBOTD 7-step prepend · installSpawn.ts
Gap 1 routing dispatch · animatedTui M17 5th derivation refs). Tests **1099 → 1113**
(+14 · exceeds R4 +13 target). Build PASS (dist/cli.cjs 341 KB · 33ms). Triumvirate
discipline maintained (S1-S13 cited in every file header).

(6) **Cycle 118 ICSM1-Close Closure Quartet** (R1+R4+R6+R7 parallel) — R1 inventory 100%
bidirectional Diameter audit · R4 8-angle 7/8 PASS (1/8 PARTIAL · Stage E reverse cites
deferred to M2 as M40 refinement) · R6 `npm test` LIVE PASS 1113 across 59 suites · 10-step
ICSM1-Smoke protocol authored at `Cascades/Working/ICSM1-SMOKE-PROTOCOL.md` · R7 G/L/M
appended to Onyx Tier-15 (218→276 lines · well below 400-gate · no fork needed).

(7) **M-Rules M39-M43 codified**: M39 muxifyConcepts graduation canonical Trilogy growth
axis · M40 5-stage Iced Skill Refinement Path + Stage E bidirectional Diameter · M41
Companion Folder Convention `src/lib/bridge/concepts/{name}/` · M42 Stratimuxian Scholar
Citation Requirement (E6 risk averted structurally) · M43 Trilogy Aspirant Chain.

(8) **Onyx Tier-15 forked from Tier-14** (which crossed 400-line gate at 484 lines).
Tier-15 currently 276 lines + R5 closure note. Diamond Menu enumerates Tier-1 through
Tier-15 · prior tiers NEVER deleted per CLAUDE.md C5.

(9) **Parallel Macro substrate accumulated** during Cycles 115-117 (not yet engaged):
Bridge-Docks-SCPs Foundation (2893 lines · HYBR verdict SUPERSEDED by Iced Skill discipline
· substrate REUSED) · Muxonomy Refinement Tri-Mode Switcher (Teal Claude #4 · 1710 lines
Foundation · Tier-0 Conference open) · Verified-Diagnostic Round (VDR) Skill creation
(Teal Claude #5 · 7 files · 486-line canonical doc + 6 SD-* Skills + slash command +
Conductor v1.12).

(10) **Push HELD until ICSM1-Smoke** (Cycle 119) user-Lambda 10-step HALT-GATE passes.
Per CLAUDE.md C4 Testing-Gated Commit. Open items (intentional · all M2 scope per R1+R4
verdicts): bridgeMetadata.ts dissolution · installSpawn.ts real-scpName injection ·
animatedTui refreshBridgeMetadata wiring · Quality→Skill.md reverse citations (cosmetic).

### 2026-05-10 (Diamond Refine-Macro — Format + Bridge-Turnover Verify + ClientState-Preservation Spec · v0.38.3 patch · stages Next Macro)

**Refining Diamond on `RC-to-AppKiller` branch · 8th Diamond · stages the Next Macro
Diamond (1 Macro pending per user note).**

(1) **Project-wide auto-format applied.** Canonical `.prettierrc` at SCS root (singleQuote
· 2-space · semi · trailingComma:all · printWidth:100) drove prettier --write across SCS
src/**/*.ts and SCP src/**/*.{ts,vue}. SCS-Bridge typecheck PASS · build 197.16 KB · all
767/767 tests still pass · SCP/ has no own .prettierrc so SCS root config canonical.

(2) **`.bridge-restart.json` restored** (corrects SCP-1 wrong-prune; this file is the
nodemon-watched turnover trigger, NOT a transient runtime artifact).

(3) **Bridge turnover Lambda-event verified end-to-end.** `npm install` SCP/ (566
packages) · `npm run bridge` boots cleanly · Vite client built in 638ms · nodemon
watching `.bridge-restart.json` · ts-node spawned (PID 71048) · Huirth on port 7637 ·
WebSocket initialized · `[Huirth] Bridge Restart Manifold: READY`. Touch
`.bridge-restart.json` → nodemon detects → `pkill -9 -f 'ts-node.*src/index'` → fresh
spawn (PID 71855) → server resumes on 7637 → Concluder logged. Turnover mechanism
verified intact.

(4) **Three-Suite parallel Tier-1 dispatch** (R2 Rust + R4 Viridian + R6 Amethyst ·
concurrent · Context-Fork) produced specifications for the Hard Turn Over feature the
Next Macro Diamond implements:

  - **R2 Rust** named 10 frontier patterns (BCSSMM Bidirectional-Client-Server-State-
    Muxameter · PKICSS Process-Kill-Invariant-Client-State-Survival · SLHGCE Soft-Lock-
    Hydration-Gate-Clear-Escape · BRTSP Bridge-Restart-Triggered-State-Preservation ·
    PCRSC Perfect-Circular-Reference-Mutual-Session-Reconstruction · SLSD Soft-Lock-
    Through-Schema-Drift · HTOSLE Hard-Turn-Over-As-Soft-Lock-Escape · IAPTT Identity-
    As-Perimeter-Maintained-Through-Turnover · DRSR Deferred-Registration-State-
    Restoration · KSFR KeyedSelector-Function-Reference-Loss). Recommended Option A
    for Hard Turn Over parameter (`.bridge-restart.json` `{"hard": true}` payload).
    All 10 patterns CD-5 clean.

  - **R4 Viridian** examined 12 edges from both server (Huirth) and client angles.
    Verdict: **REFINE** — 3 implementation refinements required before Macro code:
    (i) Initial-sync timeout fallback at `webSocketClient.principle.ts:129-134` to
    prevent post-Soft-restart deadlock (HIGH severity); (ii) SIGKILL races Hard
    broadcast — need HTTP endpoint `/hardTurnOver` triggered by nodemon
    `events.restart` hook with 500ms broadcast window before `process.exit(0)` (HIGH);
    (iii) IndexedDB transaction boundary on Hard clear to prevent in-flight write
    races (MODERATE).

  - **R6 Amethyst** produced 13-step orchestration map for the doctrinal updates.
    Recommended Skill SCP-S11 "Bridge Turnover · ClientState Lifecycle"; Pattern G
    structured as G.1 Soft + G.2 Hard + G.3 known failure modes + G.4 implementation
    refinements + G.5 existing-concept composition + G.6+ reserved edge slots; Instance.md
    doctrine subsection positioned after AppKiller Doctrine in Identity-As-Perimeter
    section; SM-SCP `[T]` Turnover placeholder for Next Macro implementation.

(5) **Doctrinal updates applied** (Suite 6 sequence map executed):
  - `Cascades/8_SUITES/SCP Researcher/Skill.md` — SCP-S11 added (~70 lines · inputs ·
    outputs · concluder · 5-failure-mode table · 3-refinement table · composition notes)
  - `Cascades/8_SUITES/SCP Researcher/Conductor.md` — Pattern G added with G.1-G.6+
    structure · trajectory row appended
  - `Cascades/8_SUITES/SCP Researcher/Instance.md` — Identity-As-Perimeter section
    extended with "ClientState-Preservation Through the Perfect Circular Reference"
    subsection · trajectory rows updated
  - `Cascades/8_SUITES/SCP Researcher/Strategy/SCP-Adapt.md` — Band 6 gains Soft-Turnover
    follow-up note + SLSD fallback to Hard pointer · trajectory row appended
  - SM-SCP.md `[T]` Turnover entry added · SM-Index registration deferred (placeholder)
  - SCP/SCP-TEMPLATE.md row 8 ✅ CLOSED for Refine-Macro · "What This Is Not" extended
    with "Hard Turn Over not yet operational"
  - SUITE8-REGISTRY SCP Researcher row extended · state tag SCP-ARC-COMPLETE +
    REFINE-STAGED-FOR-MACRO

(6) **No source code changed.** Doctrine + spec only. Build/test gates re-run only after
prettier format to verify no regression. Patch bump v0.38.2 → v0.38.3 signals doctrine
addition without source changes.

Push HELD per ongoing user directive. CD-5 streak preserved at 47. Two CD candidates
queued for future surfacing: "Diameter-Correction Mid-Cycle Refinement" (from
AppKiller-Refining) + new Suite 2 BRTSP/PCRSC/HTOSLE composite candidate. The Next
Macro Diamond reads SCP-S11 + Pattern G + Suite 4's REFINE verdict and implements
against that contract.

### 2026-05-10 (Diamond AppKiller [Refining] — Monolith-Obsolescence Through Hyper-Personalization · SCP-arc CLOSURE · v0.38.2 patch)

**SCP arc 7/7 · CLOSURE via DOCTRINE not destruction.** AppKiller refined mid-cycle
after user-interrupt corrected wrong-Diameter framing. Initial framing had AppKiller as
a destructive cascade decommissioning legacy hosted apps; correct framing is paradigm-
naming: **"the Killer of the App-as-Monolith concept, not the killer of specific
applications."** Legacy Apps ARE Reference Designs to be cited, not objects to be
destroyed. The SCP paradigm makes the traditional monolith obsolete because
hyper-personalization means every user has their own unique SCP Suite 8 surface — no
shared deployment to defend, no central endpoint to attack. Identity-as-perimeter works
at scale BECAUSE hyper-personalization eliminates the monolithic surface conventional
auth defends.

PRUNED (wrong-Diameter destructive artifacts):
 - Strategy/AppKiller-Decommission.md (destructive cascade) — DELETED
 - SM-AppKiller.md (destructive menu with type-to-confirm modal) — DELETED
 - .claude/commands/cascade/appkiller.md (separate slash) — DELETED
 - Prior SCP-S10 "Decommission Hosted App" + SCP-S11 "Cutover Orchestration" — REMOVED
 - SM-SCP `[K]` Kill option — REMOVED
 - SM-Index SM-AppKiller entry — REMOVED

REFINED (Pattern E SCP-Adapt with RD-first discipline + Target formal definition):
 - SCP-Adapt Strategy Band 1: now explicitly produces a Markdown Reference Design
   citing the Target with full provenance (URL+timestamp · file+hash · commit SHA ·
   screenshot link · etc.) BEFORE Stratimux generation begins. The RD persists as
   durable archivable artifact; subsequent Bands generate from RD while still
   referencing Target.
 - SCP-Adapt Strategy: Target formal definition added — multi-modal · anor-to (anor to)
   combinations of URL · Screenshot · Repo · File · Text · Diamond Reference. Heterogeneous
   target inputs unified via single RD.
 - SCP-Adapt Bands 2-3: reframed to consume RD + Target jointly (Cadmium augments RD;
   Stratimuxian Scholar generates from RD with Target reachable for gaps).
 - New slots: `{{rd_name}}` · `{{rd_path}}` · `{{target_modalities}}`.
 - New SCP-S10 "Reference Design Generation" skill (RD-first operational primitive ·
   supersedes prior destructive SCP-S10/S11 framing).

NAMED (the doctrine):
 - Pattern F in SCP Researcher Conductor.md rewritten as doctrine section (not cascade).
   Documents Monolith-Obsolescence Through Hyper-Personalization. No Strategy file
   for Pattern F (doctrine ≠ cascade). Operational pathway for legacy adaptation is
   Pattern E (SCP-Adapt) with legacy as Target.
 - SCP Researcher Instance.md Identity-As-Perimeter section extended with "The AppKiller
   Doctrine" subsection — documents WHY identity-as-perimeter works at scale (because
   hyper-personalization eliminates the monolithic surface).
 - SCP-TEMPLATE.md row 7 ✅ CLOSED with refined scope.

SCP arc Pearl chain complete: The Template Arrives → ICP → SCP, MCP-Parallel →
Three-Mode Membership → Personal Site Becomes Personal SCP · SCP Researcher → The User
Surface → Research → Stratimux → SCP S8 → Monolith-Obsolescence Through Hyper-
Personalization.

Push HELD per ongoing user directive. 2 Macro Diamonds pending on `RC-to-AppKiller`
branch per user note. No source code changed; build/test gates not re-run.

### 2026-05-10 (Diamond SCP-6 — Research → Stratimux → SCP S8 Adaptation Cascade · v0.38.1 patch)

**SCP arc 6/7 · doctrine-only Diamond muxified from SCP-5.** The cross-Suite-8 adaptation
cascade lands on the `RC-to-AppKiller` branch. Per user directive ("to Adapt from a Target
we Need to Load the Suite 8 Stratimuxian Scholar. As the SCP is a Stratimux Based Project"),
the cascade explicitly composes three Suite 8s: **Cadmium Researcher** (Band 2 — verbose
target prospecting), **Stratimuxian Scholar** (Band 3 — Stratimux pattern architecture
via S1 Framework Foundation · S2 StratiDECK · S4 ActionStrategy · S10 Quality Creation ·
S13 State Design), and **SCP Researcher** (Bands 0/1/4-7 — orchestration). The cascade
takes any research target (URL · file · concept · prior Diamond ref) and transforms it
into proper Stratimux Concept/Quality/Principle structures composed into a user-named
SCP S8 instance's runtime tree (`SCP/src/concepts/{{conceptName}}/`). Files added:
`Cascades/8_SUITES/SCP Researcher/Strategy/SCP-Adapt.md` (first Strategy file under SCP
Researcher · Vermillion Banded Plan with slot parameterization) +
`Cascades/8_SUITES/Teal Claude/Skills/S-SHATTERITE-MENU/SM-SCP-Adapt.md` (Pewter HiFi
Reference Design with Stages A1-A5 · Target Intake → Instance Selection → Addition Scope
→ Cascade Dispatch → Confirmation). Updates: `SM-SCP.md` gains `[A]` Adapt option in
top-level menu; `SCP Researcher` Suite 8 gains SCP-S9 Adapt Research Target skill and
Pattern E in Conductor; `SM-Index.md` registers SM-SCP-Adapt; SUITE8-REGISTRY +
SCP-TEMPLATE roadmap reflect SCP-6 closure. No source code changed — doctrine-only;
build/test gates not re-run. Push HELD per ongoing user directive. AppKiller (final
SCP-arc Diamond) PENDING.

### 2026-05-10 (Diamond SCP-5 — The User Surface · `/cascade:scp` + `scs scp` bridge subcommand · v0.38.0)

**SCP arc 5/7.** SCP arrives at the user surface on the `RC-to-AppKiller` branch.
`/cascade:scp` slash command opens the new Pewter HiFi `SM-SCP.md` Reference Design
listing SCP Suite 8 lifecycle ops (List · Initialize · Migrate · Deploy · Retire).
`SM-Main.md` gains `[R]` entry for SCP menu access. Bridge subcommand `scs scp`
ships with `list` (read-only enumeration of registered SCP S8 instances) and
`init <designation> --mode <Personal|Organizational|Project>` (clone-and-rename
materialization from SCP Researcher Templates with slot substitution + designation
validation). New TypeScript module `src/lib/scp/scpInstance.ts` (helpers) +
`src/commands/scp/{index,list,init}.ts` (subcommand). 42 new tests across 3 suites
(scpInstance.test.ts + list.test.ts + init.test.ts) — 725→767 total. typecheck
clean · build 197.06 KB. Diamond identity-vs-protocol distinction (named SCP-4)
operational: SCP is the protocol; SCP Researcher is the meta-Suite-8 that defines
the type; user-named instances are *theirs*. Deploy/retire/migrate operations
spec'd in doctrine (SM-SCP.md) but bridge TypeScript implementations deferred to
future cycles. Co-Agent r0-obsidian dispatched (Context-Fork + Detached) during
this cycle to fork ONYX-TIER-6 → ONYX-TIER-7 (442 lines + 5 cycles in Tier-6 =
both thresholds fired); Tier-7 created at 156 lines, Tier-6 preserved at 442 per
the prior-tier-NEVER-deleted invariant. Push HELD per ongoing user directive.

### 2026-05-09 (Diamond B-FINAL — README + Documentation Polish · Sub-Target C · v0.37.0 · Suite 8 v8.2.0)

**B-FINAL closes the SCS-Bridge-Install branch arc.** Sub-Target B: Tier-6 Onyx
transition (ONYX-TIER-6.md forked via r0-origin · Tier-5 preserved invariant
honored · Pearl Clinical Summation seeded covers full B-cascade arc B-1..B-26-PEWTER).
Sub-Target C: README + documentation polish — `.github/README.md` and
`Cascades/Documentation/Cascades/README.md` rewritten to describe the post-B-26
install model: `npm install -g .` (or `npm install -g scs-bridge` post-publish) ·
`scs` binary launches the bridge · re-run = In-Place Update via the Iced manifest
(CD-115 RMSDE) · `scs uninstall` first-class subcommand + `u` hotkey via Pewter
HiFi modal · full Round-Trip reversibility through the Iced Record (CD-114 IPRM) ·
user-data dirs preserved by design (CD-127 RDDU). Suite 8 Examples Table grew 7→8
(SCS Bridge row added). Quick Start command table grew with `scs` / `scs uninstall` /
`scs --version` rows + `/cascade:update` clarification. Recent Changes footer
collapsed from 14-entry historical block to single B-FINAL one-liner. Header
version badge added (npm v0.37.0 · push-ready · Suite 8 v8.2). Skill.md header
SB-S112 → SB-S125. Package v0.36.3 → v0.37.0. Suite 8 v8.1.1 → v8.2.0. 725/725
tests · build green · CD-5 streak 47th consecutive. Push gate HELD per user
directive — checkpoint only.

### 2026-05-09 (Diamond B-26-PEWTER — Uninstall Hotkey `u` + Pewter HiFi Confirmation Modal · v0.36.1)

**Pewter Diamond Surface Continuity** — second Pewter Diamond after B-22 trust-confer
v3. Elevates `scs uninstall` from CLI-only (B-26 v0.36.0) to first-class bridge TUI UX
via `u` hotkey + Pewter HiFi confirmation modal. Same architectural pattern as B-22:
D5 closed-box · D7 active-button inversion · arrow-nav between Y/N · destructive-default-N.

User directive: *"Let's Place a Menu Hotkey for UnInstall with a Confirmation Prompt.
Engage a Pewter Diamond. Issue Suite 1 anor 2 for Grounding."*

**Foundation**: Tier-0 in-context muxification (`anor`) of Suite 1 Red CURATE + Suite 2
Orange NAME · Conductor performed substrate inventory (B-22 trust-confer modal pattern ·
SYNTHETIC row architecture · KeyAction system · `uninstallSCS()` engine from B-26) AND
named 4 frontier patterns CD-123..CD-126 simultaneously in-context. NO Tier-1 dispatch
needed for this Pewter UX rotation.

**Three Implementations**:

1. **`u` hotkey** (CD-123 UMHV · Uninstall-Menu-Hotkey-Visibility-Conditional):
   - `applyKeypress` matches `'u'`/`'U'` sequence
   - Effective ONLY when `cascadesPresent === true` (mirrors Reinstall row visibility logic)
   - Opens uninstall-confirm modal with default `selected: 'cancel'` (CD-125 SDDA)
   - Mirrors existing single-letter hotkey pattern (`n new` · `x remove` · `r rename` · `q quit`)
   - Footer hint shows hotkey when applicable

2. **Pewter HiFi v3 confirmation modal** (CD-124 PUCM · Pewter-Uninstall-Confirmation-Modal):
   - NEW `renderUninstallConfirmPane(state)` in `src/lib/bridge/menu.ts`
   - D5 closed-box border (DARK top-right · LIGHT bottom-left) · matches B-22 trust-confer pane
   - Rose-tint title "⚠ Uninstall SCS Bridge" (destructive signal)
   - Cobalt header "PRESERVED (re-installable from):" (positive · CD-120 PFND framing)
   - Viridian bullets for Iced sub-areas (yours-already)
   - Pewter neutral bullets for removal list
   - D7 active-button inversion: `▶ ` glyph + REVERSE + suite-tinted (Rose for Y · Cobalt for N)
   - Arrow/Tab toggles selected · Enter/Space activates · Y/N/Esc direct shortcuts

3. **Destructive-Default-N safety asymmetry** (CD-125 SDDA · Safety-Default-Destructive-Asymmetry):
   - STRUCTURAL invariant: destructive ops default cursor to Cancel · Y is the deliberate confirmation
   - Inverts the normal Cobalt-default-Y convention from trust-confer (which defaulted to Approve)
   - Carries the CLI `[y/N]` capitalization convention (B-26 SM-UNINSTALL-CONFIRM) into the TUI

4. **CLI/TUI engine sharing** (CD-126 BUCS · Bridge-Uninstall-CLI-Sharing):
   - NEW `handleUninstall()` in `animatedTui.ts` calls the SAME `uninstallSCS()` function as
     the `scs uninstall` CLI subcommand (B-26)
   - Single source of truth for reverse-muxify · UI surface diverges (CLI readline vs TUI
     Pewter modal) · semantics converge
   - Post-uninstall: `cascadesPresent` re-probed via `existsSync(cwd/Cascades/8_SUITES)` ·
     flips back to false · Install row reappears · Reinstall row hides · `u` hotkey hides

**Files Modified (3)**:
- `src/lib/bridge/menu.ts` — `MenuState.uninstallConfirm?` field · 5 NEW KeyActions
  (`uninstall-selected`/`uninstall-confirm-toggle`/`uninstall-confirm-activate`/`uninstall-confirm`/`uninstall-cancel`)
  · `renderUninstallConfirmPane` (~120 lines) · `applyKeypress` `'u'` hotkey + modal-only
  branch · `renderMenu` dispatch override
- `src/lib/tui/animatedTui.ts` — `handleUninstall()` async function · 5 keypress action
  cases · uninstallConfirm hash-memo flicker prevention (mirrors B-22 CD-74 TCPFR)
- `src/lib/bridge/menu.test.ts` — 17 NEW tests (hotkey cases · modal navigation · render
  pane · default-N safety · PRESERVED list · removal list)

**Files Modified (3 docs)**:
- `package.json` — v0.36.0 → v0.36.1
- `Cascades/8_SUITES/SCS Bridge/Instance.md` — v8.1 → v8.1.1 + B-26-PEWTER section
- `Cascades/CHANGELOG.md` — B-26-PEWTER entry (this)
- `Cascades/Cascade.json` — cycle 49 rotation 2

**Tests**: 705 → 722 (17 NEW) · all PASS · `npm run typecheck` green · `npm run build`
green (185.27 KB · +11 KB · earned)

**CDs (4 NEW)**:
- CD-123 UMHV Uninstall-Menu-Hotkey-Visibility-Conditional (IMPL)
- CD-124 PUCM Pewter-Uninstall-Confirmation-Modal (IMPL)
- CD-125 SDDA Safety-Default-Destructive-Asymmetry (STRUCTURAL · LOAD-BEARING for destructive ops)
- CD-126 BUCS Bridge-Uninstall-CLI-Sharing (IMPL · single function · diverging UI surfaces)

**CD-5 PASS 47th consecutive** (C through B-26-PEWTER).

**Suite 8**: SCS Bridge v8.1 → v8.1.1 (patch · UX surface elevation within v8.1 milestone) ·
121 → 125 skills (SB-S122..SB-S125).

**Push gate**: HELD pending v0.36.1 user-Lambda (test `u` hotkey + modal · test `[N]` default ·
test arrow-nav · test post-uninstall menu state refresh).

**Pearl** (B-26-PEWTER synthesis): **Surface Continuity Through Pewter**. B-22 was the
first Pewter Diamond (trust-confer v3). B-26-PEWTER is the second (uninstall confirmation
v3). Same architectural pattern · same Pewter HiFi tokens · same modal-state-machine
mechanics · DIFFERENT default polarity (CD-125 SDDA · destructive ops default to Cancel).
The hotkey + modal elevates `scs uninstall` from CLI-only to first-class bridge UX without
forking the engine — `uninstallSCS()` remains the single source of truth (CD-126 BUCS).

---

### 2026-05-09 (Diamond B-26 — v8.1 Milestone · Muxification Branch Round-Trip Closure · `scs uninstall` · v0.36.0)

**The Cinnabar Returns — Iced-Preserving Round-Trip**.

User-named Muxification Branch closure. v8.0 promised user-trust contract via three
exit paths (B-24 CD-90 TEPTSG); v8.1 makes ONE of those paths (`scs uninstall`)
production-grade with `Cascades/Iced/` as the persistent install record.

**Foundation phase**: r0-origin Obsidian Summation absorbed into Tier-0 awareness
before 5-agent Full Suite parallel dispatch (R1 Red curate · R2 Orange name 9 patterns
CD-114..CD-122 · R3 Yellow architect 705-line paste-ready spec · R4 Green 8-angle
audit · R6 Purple trajectory). Convergent verdict: best-effort atomicity (B) · prior
snapshot reuse on remuxify (β) · pure bridge-side (no Strategy S9) · v0.36.0 minor ·
Suite 8 v8.1 (round-trip closure milestone).

**LOAD-BEARING PRINCIPLE** (CD-120 PFND from r0 summation):
> *"uninstall and reinstall are not opposites — they traverse the same Diameter with
> Iced/ as the pivot; the implementation must embody this (preservation-first, not
> deletion-first)."*

**Implementation**:

1. **`src/lib/bridge/uninstall.ts` NEW** — `uninstallSCS()` manifest-driven reverse-muxify:
   - All 7 ManifestFileEntry.action enum branches handled (CD-119 SVRC schema v1/v2/v3
     backward-compat): `created`/`appended`/`merged`/`untouched`/`replaced`/`agent-derived`/`updated`
   - `stripDelimitedBlock()` for v1 'appended' reversal
   - `reverseSettingsMerge()` for 'merged' reversal (conservative on permissions.allow ·
     B-27 will track exact added values)
   - scs-* namespaced sweep (CD-93 ASNCPP discipline)
   - *.bak cleanup
   - Cascades/{8_SUITES,Working,Documentation,Bridge,Lab} removal
   - **Cascades/Iced/ structurally preserved** (CD-114 IPRM · CD-120 PFND)
   - Best-effort atomicity per Suite 4 Green Angle 6 (forward-only · errors[] accumulation)

2. **`src/commands/uninstall.ts` NEW** — `scs uninstall` CLI subcommand:
   - Pre-flight manifest existence check (graceful no-op if not installed)
   - Pewter HiFi confirmation menu rendered inline (D5 closed-box · Rose-tint warn)
   - readline `[y/N]` default-N for destructive-op safety asymmetry (CD-118 SCDU)
   - Post-uninstall guidance (Iced persistence + re-install instructions + nuclear
     `rm -rf Cascades/` option)
   - `--yes` flag for scripted bypass

3. **`Cascades/8_SUITES/Teal Claude/Skills/S-SHATTERITE-MENU/SM-UNINSTALL-CONFIRM.md` NEW**
   — Shatterite menu Reference Design with Pewter D5 closed-box · Rose-tint warn ·
   D7 active-button-default-N (asymmetric default for safety inversion) · cross-Diamond
   visual continuity with B-22 trust-confer + B-25-UX SM-* menus

4. **`src/cli.ts` MODIFIED** — `uninstallCommand()` registered alongside hello/bridge/__hook

5. **Re-installable from Iced (CD-115 RMSDE)**: `detectMuxState → 'remuxify'` already
   wired (B-24-FIX). After `scs uninstall` preserves Iced/, running `scs` again
   triggers Path B Muxified install · existing `runInstallMuxifiedPath` flow naturally
   handles the remuxify case · prior snapshot reused (Option β) · UserSCSConfig
   honored verbatim across reinstall cycles (CD-116 USCPPP-CR · extension of B-24
   CD-92 USCPPP).

**Tests**: 692 → 705 (13 NEW B-26 tests · target was ~20 · slight under because
manifest-driven reversal is well-factored). All PASS · `npm run typecheck` green ·
`npm run build` green (174.39 KB · +15 KB).

**Three-Exit-Path Updated (post-B-26)**:
- Path 1: Continue using SCS (Default · CD-92 USCPPP)
- Path 2 (NEW · PRIMARY): `scs uninstall` · manifest-driven · Iced preserved · re-installable
- Path 3: `rm -rf Cascades/` (Nuclear · last resort · scs-* file orphans now handled by Path 2)
- Path 4: `scs uninstall && rm -rf Cascades/Iced/` (Full clean wipe after surgical revert)

**CDs (9 NEW)**:
- CD-114 IPRM Iced-Preserving-Reverse-Muxify (IMPL)
- CD-115 RMSDE Re-Muxify-State-Detection-Entry (STRUCTURAL · existing wiring composes naturally)
- CD-116 USCPPP-CR UserSCSConfig-Persistence-Cross-Reinstall (STRUCTURAL · extends CD-92)
- CD-117 RTRA Round-Trip-Reversibility-Atomicity (IMPL · best-effort + error accumulation)
- CD-118 SCDU Shatterite-Confirmation-Destructive-Uninstall (IMPL)
- CD-119 SVRC Schema-Version-Reverse-Compatibility (IMPL · per-action enum dispatch)
- CD-120 PFND Preservation-First-Not-Deletion (PEARL · LOAD-BEARING · structural framing)
- CD-121 RCMR Re-engagement-Cinnabar-Memory-Recovery (DESIGNED · Cinnabar Suite 8 implements)
- CD-122 ICRTV Iced-Compare-Round-Trip-Verification (STRUCTURAL · B-23 compareDirectories
  with DEFAULT_SKIP_PATTERNS already excludes Iced/ · round-trip test paste-ready)

**CD-5 PASS 46th consecutive** (C through B-26).

**Suite 8**: SCS Bridge **v8.0.4 → v8.1 (MILESTONE)** · Muxification Branch round-trip
closure · 112 → 121 skills (SB-S113..SB-S121).

**Pearl synthesis**: The architectural arc — reversibility (B-23) → composition (B-24) →
authority (B-24-FIX) → membership (B-25-UX v8.0) → **return-with-continuity (B-26 v8.1)** —
closes here. SCS install is reversible · the reversal preserves enough state that the
install can return without re-meeting-from-scratch · UserSCSConfig customizations
survive across reinstall cycles. v8.1 marks the milestone of "Muxification Branch
fully reversible".

**Push gate**: HELD pending v0.36.0 user-Lambda (round-trip test: install →
`scs uninstall` → re-install from Iced).

---

### 2026-05-09 (Diamond B-25-UX-fix4 — Install Agent Pre-Spawn Registry Add + Symlink Realpath + Empty-Body Up-Promote · v0.35.4)

User confirmed test-008 verification of v0.35.4: bridge banner shows v0.35.4 (CD-110 +
CD-112 working) · install agent appeared in registry as session row (CD-108 + CD-113
paired correctly · MOZ8SS07 · 21s ago · offline). 3 fixes: addSession pre-spawn
(Issue C · primary · CD-113 IAPSP) · realpathSync for symlinks (Issue A · CD-112 SRRP) ·
empty-body up-arrow promotes to install row (Issue B · CD-111 IUNSI).
Tests 690 → 692. Suite 8 v8.0.3 → v8.0.4. (Full details in commit 075e8d0.)

---

### 2026-05-09 (Diamond B-25-UX-fix3 — Dynamic Version Sourcing · CD-110 DVSP · v0.35.3)

Banner read `vunknown` with linked binary · `scsBridgeVersion: '0.34.1'` hardcoded.
NEW `src/lib/bridge/bridgeVersion.ts` reads version from package.json at parent of
cli.cjs · cached · graceful fallback. Tests 684 → 690. Suite 8 v8.0.2 → v8.0.3.
(Full details in commit 2ad5697.)

---

### 2026-05-09 (Diamond B-25-UX-fix2 — Install Agent Self-Registration + Mandatory Shatterite Menus · v0.35.2)

**Two user-surfaced issues post-v0.35.1**:

1. **Install agent's SessionStart hook didn't register**: `runRegisterInstallHook`
   wrote `tempDir/register-state.json` but never called `updateSessionLiveIdentity`,
   so install agent never appeared in bridge registry/menu/liveness tracking.
2. **Install agent didn't render Shatterite menus**: agent treated S8 "Conference"
   Bands as optional, skipped `AskUserQuestion`, auto-decided naming/branching/welcome
   without asking user — violating B-25-UX agency contract.

**Fix 1 (CD-108 IARSR · Install-Agent-Registry-Self-Registration)**:
`src/lib/bridge/installHooks.ts` `runRegisterInstallHook` now performs DUAL registration:
- (a) `updateSessionLiveIdentity(ulid, claudeSessionId, claudePid)` — install agent
  becomes visible in bridge menu, trackable for liveness via 2s `process.kill(pid, 0)`
  tick, indistinguishable at registry level from regular sessions
- (b) Legacy `tempDir/register-state.json` preserved for install-pipeline polling
  compatibility · failure of (a) is non-fatal · (b) still fires

**Fix 2 (CD-109 MSMRD · Mandatory-Shatterite-Menu-Rendering-Discipline)**:
- `src/lib/bridge/installConstants.ts` `SCS_INSTALL_MUXIFY_AGENT_PROMPT` extended
  to mandate: *"MUST use AskUserQuestion to render Shatterite menus (naming,
  branching, welcome) so the user customizes their first Suite 8. Do not
  auto-decide."* (213 chars · well under shell-quoting threshold)
- `Cascades/8_SUITES/SCS Bridge/Strategy/S8-StratidianWelcome.md` NEW "CRITICAL
  OPERATING RULE" section at TOP: explicitly forbids auto-decision · mandates
  `AskUserQuestion` · reframes Conference Bands as STRUCTURAL NOT ASPIRATIONAL ·
  halts with clear message if `AskUserQuestion` unavailable

**Tests**: 680 → 684 (4 NEW):
- registry-update fires when session_id present
- skip when session_id missing
- registry failure non-fatal (tempDir flag still written)
- priming mandates Shatterite menus

**Version**: v0.35.1 → v0.35.2 (patch) · Suite 8 v8.0.1 → v8.0.2 (patch).

**Push gate**: HELD pending v0.35.2 user-Lambda.

**Pearl**: **Visibility + Agency Are Structural Properties**. v8.0 promised the user
as Manifold member with agency at every choice point, and the install agent as a
first-class session in the bridge. Both promises required two specific code paths
to actually fire (registry self-registration + mandatory `AskUserQuestion`). v8.0.2
closes both gaps.

---

### 2026-05-09 (Diamond B-25-UX-fix — Shell-Quoting Discipline · Suite 7 Fuchsia clinical · escape-order swap + priming shortening + S8 welcome instruction · v0.35.1)

**The Install-Agent-Never-Started Bug**. User reported v0.35.0 install on test-004 failed:
install agent never spawned · audible macOS chimes · Java Runtime errors · Terminal
landed at HOME (`~ %`) instead of test-004 cwd. Bridge-side `install.muxified.complete`
succeeded but `install.animation.timeout` 30s later (no hook fire).

**Root cause** (Suite 7 Fuchsia clinical · `Cascades/Working/SUITE-7-FUCHSIA-INSTALL-DISPATCH-CLINICAL.md`):
escape-order bug at `src/lib/bridge/osTerminal.ts:121`. Composition
`escapeForOsascript(escapeForBashSingleQuote(seedPrompt))` was wrong-order.
`escapeForBashSingleQuote` introduces `'\''` for apostrophes (bash idiom).
`escapeForOsascript` then doubled the backslash: `'\''` → `'\\''`. Bash parsed `'\\''`
as `\\` (literal backslash) inside the single-quoted string. The single-quoted string
never closed; `&&`, `cd`, the rest of the priming, and `claude` itself were all
consumed inside one broken argument. Java errors are downstream of broken cd
(Terminal tries to display error dialog → requires Java → Java missing).

B-25-UX priming string (1391 chars · contains `user's` apostrophe) was the FIRST
long apostrophe-bearing priming actually exercised through Path B `runInstallMuxifiedPath`.
Earlier installs used short slash-command priming (`/cascade` · `/scs-cascade`)
which had no apostrophes — bug latent until B-25-UX exposed it.

**Fix 1**: `src/lib/bridge/osTerminal.ts:121` escape-order SWAPPED:
`escapeForBashSingleQuote(escapeForOsascript(s))`. Apply osascript escape FIRST
on raw content (handles `\`, `"`, `$` at AppleScript boundary) · then bash-single-quote
wrap (handles `'` correctly · `'\''` idiom never mangled).

**Fix 2**: `src/lib/bridge/installConstants.ts` — `SCS_INSTALL_MUXIFY_AGENT_PROMPT`
drastically shortened from 1391 chars to 144 chars · NO apostrophes · NO em-dashes ·
NO smart-quotes (paranoid defense-in-depth · even if escape-order regresses, this
string cannot trigger the bug).

**Fix 3**: `Cascades/8_SUITES/SCS Bridge/Strategy/S8-StratidianWelcome.md` — added
"Pre-Band Welcome (Pewter HiFi)" section before Band 1 · welcome content moved
here from priming string (where it now lives at the strategy layer · install agent
reads it as part of appended system prompt).

**Tests**: regressions fixed:
- `osTerminal.test.ts:288` was VERIFYING THE BUG (`'Don'\\\\''t worry'`) — corrected to verify the FIX (`'Don'\\''t worry'`)
- `installSpawn.test.ts` 5 priming-content tests rewritten with NEW invariants:
  - priming length <200 chars
  - NO apostrophes
  - NO em-dashes
  - directs S7 then S8
- 680/680 PASS · typecheck green · build green (158.05 KB · -1 KB from B-25-UX)

**Suite 8**: v8.0 → v8.0.1 (patch · clinical fix within milestone). Major version
stays at 8 — the Stratidian Welcome arc is unchanged structurally; what changed is
the SHELL-LAYER plumbing that conveys the directive.

**Push gate**: HELD pending v0.35.1 user-Lambda on fresh test directory (test-006).

**Pearl** (B-25-UX-fix synthesis): **Shell-Quoting Discipline as Substrate**.
The Stratidian Welcome arc design was correct; the substrate (osascript→bash→shell-arg→
claude-CLI) imposed quoting constraints that the priming string violated. Fix at the
substrate (escape order) plus paranoid shortening at the source (priming length +
apostrophe-free) makes the welcome arc actually reach the install agent intact.

---

### 2026-05-09 (Diamond B-25-UX — v8.0 Milestone · Stratidian Welcome Arc · Strategy S8 · Shatterite-Driven Naming · Conditional Multi-Suite Branching · Memory-Surfaced Welcome · RI Activation · Cinnabar Engagement · v0.35.0)

**The v8.0 Milestone — Stratidian Welcome As First-Class Manifold Membership**.

Implementation of B-24-UX break-out Diamond's design (6-agent Full Suite foundation:
R1 Red curate · R2 Orange name · R3 Yellow architect · R4 Green examine · R6 Purple
trajectory · Pewter Tessera HiFi design). Elevates the install from mechanical
task-execution to Stratidian initiation arc.

**Three Architectural Layers Compose**:

1. **Bridge Layer** (Pattern 4 Modulation): scaffolds Cascades/, .claude/ drop-in,
   Iced PreInstallSnapshot, MuxificationManifest, UserSCSConfig — filesystem within
   user cwd · NEVER reads ~/.claude/projects/

2. **Install Agent Layer** (Pattern 4.1 Sanctioning): receives full SCS Bridge Suite 8
   (Instance + Conductor + Skill + S1..S8) as appended system prompt + plain-text
   Welcome priming · operates within Claude awareness · legitimately probes memory
   metadata, reads PreInstallSnapshot, renders Shatterite menus, engages Cinnabar

3. **User Sovereignty Layer** (CD-107 UTSW Pearl): every decision point surfaces
   a Shatterite menu · user is Manifold member with agency, not hosted-tenant

**Files Created (8)**:
- `src/lib/bridge/projectNameSuggest.ts` — sanitize bug fix (B-24-FIX `user-project`
  → "User Project Project Context" double-Project bug eliminated) + 4-6 slot
  suggestion mix
- `src/lib/bridge/memoryProbe.ts` — Pattern 4 metadata-only probe of
  `~/.claude/projects/{encoded-cwd}/` · classifies fresh-slate vs existing-project
- `src/lib/bridge/routerDetect.ts` — 3-signal hard gate router detection
  (H2 ≥4 AND ≥2 router-keywords AND ≥2 mutually-exclusive H2 pairs · drops
  false-positive rate ~40%→~5%)
- `src/lib/bridge/riActivate.ts` — atomic 3-write RI activation (Onyx-Tier-1 +
  Diamond-Tier-1 + Cascade.json cycle 0→1) · all-or-none with rollback
- `Cascades/8_SUITES/SCS Bridge/Strategy/S8-StratidianWelcome.md` — 6-Band Vermillion
- `Cascades/8_SUITES/Teal Claude/Skills/S-SHATTERITE-MENU/SM-NAME-SUITE-8.md`
- `Cascades/8_SUITES/Teal Claude/Skills/S-SHATTERITE-MENU/SM-MULTI-SUITE-BRANCH.md`
- `Cascades/8_SUITES/Teal Claude/Skills/S-SHATTERITE-MENU/SM-WELCOME-RI-ENGAGE.md`

**Files Modified (5)**:
- `src/lib/bridge/installConstants.ts` — `ICED_MANIFEST_SCHEMA_VERSION 2 → 3`,
  `SCS_INSTALL_MUXIFY_AGENT_PROMPT` updated to direct S7→S8 sequence with Pewter
  HiFi welcome instruction
- `src/lib/bridge/icedManifest.ts` — `ManifestFileEntry.action` adds `'updated'`
  enum (B-25-UX schema v3 · Cascade.json cycle 0→1 tracking) · `preInstallValueSnapshot`
  field
- `src/lib/bridge/installSpawn.ts` — SOURCES adds S8 (10 → 11 entries)
- `Cascades/8_SUITES/SCS Bridge/Strategy/S7-MuxifyUserClaudeMd.md` — Band 5 emits
  `s7-muxification-complete` signal (no longer engages /scs-cascade)
- `package.json` — 0.34.1 → 0.35.0

**Tests**: 627 → 680 (53 NEW B-25-UX tests across 4 utilities · target was 30) ·
all PASS · `npm run typecheck` green · `npm run build` green (159.13 KB)

**CDs (10 NEW · CD-5 PASS 45th consecutive · C through B-25-UX)**:
CD-98 SDSWN Shatterite-Driven-Suite-8-Naming-Welcome ·
CD-99 PTSNS Project-Type-Signal-Naming-Suggestion-Heuristic ·
CD-100 MSEPD Memory-Surfaced-Existing-Project-Detection ·
CD-101 CMSRD Conditional-Multi-Suite-8-Router-Detection ·
CD-102 CDWE Cinnabar-Dialectic-Welcome-Engagement (DESIGNED · Cinnabar Suite 8 implements) ·
CD-103 RIIA Renewable-Intelligence-Install-Activation ·
CD-104 FDSI First-Diamond-Stratidian-Initiation ·
CD-105 PHSWO Pewter-HiFi-Stratidian-Welcome-Override ·
CD-106 BAWHD Bridge-To-Agent-Welcome-Handoff-Discipline (STRUCTURAL) ·
CD-107 UTSW User-Trust-Through-Stratidian-Welcome (PEARL · v8.0 MILESTONE)

**Suite 8**: SCS Bridge **v7.9 → v8.0 (MILESTONE)** · 102 → 112 skills (SB-S103..SB-S112)
· trajectory: full Stratidian induction arc landed · subsequent Diamonds patch v8.x
· Uninstall (B-26) ships at v8.x patch (per Suite 6 Purple: "Uninstall is surgical
reversal, not ontological elevation")

**Trajectory (post-B-25-UX · per Suite 6 Purple updated chain)**:
- B-26 SCS Uninstall command (was B-25 · pushed) — manifest-driven reverse including
  schema v3 'updated' action for Cascade.json revert
- B-27 End-to-end round-trip test
- B-28 Adversarial (NARROWED · multi-Suite collision/conflict only · detection
  moved into B-25-UX)

**Push gate**: HELD pending v0.35.0 user-Lambda on test-005 (with
`SCS_INSTALL_REPO_URL=file:///path/to/local/repo` for local-clone testing).

**Pearl** (B-25-UX · v8.0 milestone synthesis): **Stratidian Welcome As First-Class
Manifold Membership**. The install isn't a deposit; it's an INDUCTION. The user
doesn't enter as a hosted-tenant; they enter as a Manifold member with their
project-context elevated to first-class Suite 8, their memory honored, their
work continuity preserved. Every Shatterite menu is the user's agentive YES.
v8.0 EARNED.

---

### 2026-05-09 (Diamond B-24-FIX — Path B Routing · Drop-In SCS Manifold · Strategy S7 MuxifyUserClaudeMd · Plain-Text Priming · v0.34.1)

**Path B Routing Architectural Correction** (Rotation 2 of Diamond B-24).

User-surfaced from test-001 Lambda observation: B-24 routed Muxified install through
the wrong path (Path A menu launch via `runInstallScaffoldOnly` + `launchInformative('new', '/cascade')`).
The install agent had ZERO SCS Bridge context loaded. User clarified the correct
infrastructure: Path B (`runInstallSpawnPipeline`/`runInstallMuxifiedPath` with
`assembleJoinedSuite8` + `spawnInstallInstance --append-system-prompt-file=joinedSuite8`).

Plus user corrected the drop-in semantic: the SCS Manifold honors Claude Code's
tight 40K project-memory budget — `.claude/CLAUDE.md` should be SCS content alone
(drop-in replace), NOT delimited-appended above user content. User's prior content
gets first-class Suite 8 treatment via Strategy S7.

**Three Decisive Architectural Corrections**:

**1) Path B routing for Muxified Path (CD-94 PBRMP)**:
- NEW `runInstallMuxifiedPath` in `installSpawn.ts` — combines bridge-side scaffold
  (Cascades/, .claude/ drop-in, Iced snapshot, manifest, UserSCSConfig) with Path B
  spawn (joined SCS Bridge Suite 8 as appended system prompt + plain-text S7 priming)
- Pre-spawn `fs.statSync` invariants verify `scs-cascade.md` AND joined Suite 8 file
  exist before spawn (fail-fast with clear error if missing)
- `animatedTui.handleInstall` first-time-install branch routes through this NEW
  function instead of the old Path A menu launch
- Install agent receives Instance.md + Conductor.md + Skill.md + Strategy/S1..S7 as
  appended system prompt — full Stratidian context for Authority

**2) Drop-In `.claude/CLAUDE.md` (CD-95 DICMD)**:
- REMOVED `composeClaudeMd` delimited-append (violated 40K manifold budget)
- ADDED `dropInClaudeMd` — verbatim writeFileSync · ManifestFileEntry action='replaced'
- `ICED_MANIFEST_SCHEMA_VERSION 1 → 2` (added 'replaced' + 'agent-derived' action enums)
- `ManifestFileEntry.action` union extended for B-25 surgical reverse

**3) Plain-Text Priming + Strategy S7 (CD-96 ASMS7 · CD-97 PTPMS)**:
- NEW `Cascades/8_SUITES/SCS Bridge/Strategy/S7-MuxifyUserClaudeMd.md` (5-Band Vermillion)
  - Band 1 Curate: glob PreInstallSnapshot · auto-name from package.json
  - Band 2 Examine: read content · assess single-domain vs router architecture
  - Band 3 Build: write `Cascades/8_SUITES/{name}/Instance.md` with user content
  - Band 4 Register: append SUITE8-REGISTRY.md row if file exists
  - Band 5 Closeout: engage `/scs-cascade` (terminal · post-muxification)
- SOURCES array adds 'Strategy/S7-MuxifyUserClaudeMd.md' (9 → 10 entries)
- NEW `SCS_INSTALL_MUXIFY_AGENT_PROMPT` plain-text constant — timing-race immune
  (slash command index timing eliminated structurally)
- `SCS_PATH_A_PRIMING_PROMPT '/cascade' → '/scs-cascade'` (was stale B-15 constant;
  B-24 prefix update)

**Files Created**: `Cascades/8_SUITES/SCS Bridge/Strategy/S7-MuxifyUserClaudeMd.md`

**Files Modified**: `src/lib/bridge/muxCompose.ts` (composeClaudeMd → dropInClaudeMd) ·
`src/lib/bridge/muxCompose.test.ts` (replaced 7 composeClaudeMd tests with 6 dropInClaudeMd) ·
`src/lib/bridge/installConstants.ts` (NEW SCS_INSTALL_MUXIFY_AGENT_PROMPT · schema v2 ·
Path A priming /cascade → /scs-cascade) · `src/lib/bridge/installSpawn.ts` (SOURCES adds S7 ·
NEW runInstallMuxifiedPath function · muxifyUserState calls dropInClaudeMd) ·
`src/lib/bridge/icedManifest.ts` (action enum 'replaced' + 'agent-derived') ·
`src/lib/bridge/installSpawn.test.ts` (regressions fixed: SOURCES 9→10 · priming
/cascade → /scs-cascade · 5 NEW B-24-FIX tests) · `src/lib/bridge/icedManifest.test.ts`
(schema version 1 → 2) · `src/lib/tui/animatedTui.ts` (handleInstall fresh-install branch
routes runInstallMuxifiedPath with SCS_INSTALL_MUXIFY_AGENT_PROMPT) · `package.json`
(0.34.0 → 0.34.1) · `Cascades/8_SUITES/SCS Bridge/Instance.md` (v7.8 → v7.9 + B-24-FIX
section) · `Cascades/8_SUITES/SCS Bridge/Skill.md` (SB-S99..SB-S102 · 4 NEW skills ·
98 → 102 total)

**Tests**: 623 → 627 (5 NEW B-24-FIX tests; 7 composeClaudeMd tests removed/replaced
with 6 dropInClaudeMd tests) · all PASS · `npm run typecheck` green ·
`npm run build` green (158.55 KB)

**CDs**: CD-94 PBRMP · CD-95 DICMD · CD-96 ASMS7 · CD-97 PTPMS. **CD-5 PASS 44th
consecutive** (C through B-24-FIX).

**Suite 8**: SCS Bridge v7.8 → v7.9 (NEW S7 Strategy) · 98 → 102 skills (SB-S99..SB-S102 NEW)

**Stale Binary User Note**: After this commit lands, user must `npm install -g .`
from repo root to refresh global binary. Global symlink does NOT auto-update with
repo changes. User screenshot showed `v0.24.0` global running — must relink to v0.34.1.

**Push gate**: HELD pending B-24-FIX user-Lambda on test-002 (or fresh test directory).

**Pearl** (B-24-FIX synthesis): **Strategic Authority Through Joined Context**.
The install agent must receive the FULL Stratidian context (joined Suite 8 with
all S1..S7 strategies as appended system prompt) to act with Authority on the
user's bounded state. Drop-in CLAUDE.md + agent-muxified Suite 8 + Path B spawn
= each layer holds its own discipline. Bridge does what bridge does (filesystem
scaffolding · Pattern 4 modulation); install agent does what only it can
(intelligent muxification of user content into first-class Suite 8 form within
the Stratidian Manifold).

---

### 2026-05-09 (Diamond B-24 — Muxified Path · Compose-Not-Replace · Iced Folder · Reinstall Routes Through Muxified · v0.34.0)

**The Muxified Path Consummation Diamond** — implements the actual compose-not-replace
install logic that B-23 built test infrastructure for. SCS Bridge installs WITH a
pre-existing Claude Code setup rather than replacing it. Iced folder
(`Cascades/Iced/`) introduced as new structural layer with three sub-areas:
PreInstallSnapshot · MuxificationManifest · UserSCSConfig. Reinstall path unified
to route through Muxified Path detection.

**1) Muxified Path detection (CD-84 MPAD · CD-89 RRTMU)**:
- New `src/lib/bridge/muxDetect.ts` — `detectMuxState(cwd)` returns
  `'fresh' | 'muxified' | 'remuxify'`. Probes for root CLAUDE.md · .claude/CLAUDE.md
  · .claude/agents/ · .claude/commands/ · .claude/settings.json (non-default content)
- Detection runs BEFORE any install write in BOTH install and reinstall flows
- Empty .gitkeep and `{}` settings correctly treated as "not present"

**2) Iced folder (CD-85 IFALS · CD-86 PISCD · CD-87 MMDC · CD-92 USCPPP)**:
- `Cascades/Iced/PreInstallSnapshot/{ts}/` — timestamped backup of user state
  at install moment (multi-reinstall coexistence). Replaces the EPHEMERAL B-5
  tempDir backup (Suite 4 Green B-23 audit finding closed)
- `Cascades/Iced/MuxificationManifest.json` — declarative change record · schema
  version 1 frozen at B-24 close (B-25 reverse-muxify contract)
- `Cascades/Iced/UserSCSConfig/` — user personalization layer · `.gitkeep` + README
  scaffolded · protected from SCS updates by `pathFilterCascadesScaffold` exclusion
- `pathFilterCascadesScaffold` excludes `Iced/` to prevent silent manifest erase
  on reinstall (Suite 6 Purple D-6 critical fix)

**3) Compose-Not-Replace per file type (CD-88 CNRPFT · CD-93 ASNCPP)**:
- **CLAUDE.md**: `composeClaudeMd` — version-aware delimited append
  (`<!-- BEGIN SCS-BRIDGE-MANIFOLD v{version} -->...<!-- END SCS-BRIDGE-MANIFOLD -->`).
  Idempotent re-muxify (replaces existing block). Cross-version upgrade
  (open-tag any-version match)
- **agents**: `namespaceAgents` — SCS agents land at `.claude/agents/scs-*.md`
  collision-proof sub-namespace. User's pre-existing agents (e.g., my-reviewer.md
  from B-23 fixture) NEVER touched — verified BYTE-UNCHANGED in smoke test
- **commands**: `namespaceCommands` — same `scs-*` flat prefix pattern
- **settings.json**: `mergeSettingsJson` — additive merge · user wins on collision
  · hooks[] concatenated · permissions.allow deduped · invalid JSON fail-fast
  · scsAdditions recorded for B-25 surgical reverse

**4) Three-Exit-Path Structural Guarantee (CD-90 TEPTSG)**:
- Continue using SCS — UserSCSConfig protected from updates
- `scs uninstall` (B-25) — manifest + snapshot one-command revert
- `rm -rf Cascades/ && rm .claude/agents/scs-*.md .claude/commands/scs-*.md`
  + manual delimiter strip — two-step manual exit always tractable via `scs-`
  prefix structural signal
- Suite 4 Green resolution: pure single-command `rm -rf Cascades/` cannot remove
  files outside Cascades/ (Claude Code reads them by necessity); `scs-` prefix
  discipline makes manual exit always-tractable

**Files Created**: `src/lib/bridge/muxDetect.ts` (~110 lines · 10 tests) ·
`src/lib/bridge/icedManifest.ts` (~190 lines · 10 tests) ·
`src/lib/bridge/muxCompose.ts` (~220 lines · 18 tests)

**Files Modified**: `src/lib/bridge/installConstants.ts` (Iced + delimiter +
prefix constants · ICED_MANIFEST_SCHEMA_VERSION) · `src/lib/bridge/installSpawn.ts`
(NEW `muxifyUserState` · `runInstallScaffoldOnly` mux-state-aware ·
`pathFilterCascadesScaffold` Iced exclusion) · `src/lib/bridge/muxFixture.ts`
(Cascades/Iced/ added to DEFAULT_SKIP_PATTERNS) · `src/lib/tui/animatedTui.ts`
(version threading · 2 call sites) · `package.json` (0.33.0 → 0.34.0) ·
`Cascades/8_SUITES/SCS Bridge/Instance.md` (v7.7 → v7.8 · B-24 architectural
section) · `Cascades/8_SUITES/SCS Bridge/Skill.md` (SB-S89..SB-S98 · 10 new
skills · 88 → 98 total)

**Tests**: 600 → 623 (38 NEW B-24 tests; existing 600 unchanged) · all PASS ·
`npm run typecheck` green · `npm run build` green (154.99 KB)

**End-to-End Lambda-Event Smoke Test (verified during Diamond)**:
On materialized typical-user-reference fixture clone with my-reviewer.md +
review.md + non-default settings.json:
- Detection: state=muxified · all 5 user state markers detected
- Snapshot captured to PreInstallSnapshot/{ts}/ (5 files)
- CLAUDE.md `appended` action (user content preserved at top · SCS Manifold
  between delimiters)
- SCS agent landed at .claude/agents/scs-teal-claude.md
- USER my-reviewer.md BYTE-FOR-BYTE UNCHANGED (diff clean)
- Settings.json `merged` action
- Manifest written with 3 entries · UserSCSConfig scaffolded

**CDs**: CD-84 MPAD · CD-85 IFALS · CD-86 PISCD · CD-87 MMDC · CD-88 CNRPFT ·
CD-89 RRTMU · CD-90 TEPTSG · CD-91 MALBUS (B-25 anchor) · CD-92 USCPPP ·
CD-93 ASNCPP. **CD-5 PASS 43rd consecutive** (C through B-24).

**Suite 8**: SCS Bridge v7.7 → v7.8 · 88 → 98 skills (SB-S89..SB-S98 NEW) ·
trajectory: Muxified Path implementation milestone (v8.0 deferred to B-25
uninstall close per Suite 6 Purple)

**Push gate**: HELD pending Muxified install user-Lambda

**Pearl** (Suite 6 Purple): **Composition as User-Trust Contract**. B-23 proved
reversibility possible; B-24 makes it load-bearing by establishing the property
that lets the user exit via two structural means (scs uninstall OR
rm -rf Cascades/ && rm scs-*) without depending on agent goodwill. The Iced
folder is not storage — it is the declaration that SCS maintains a bounded
footprint.

---

### 2026-05-09 (Diamond B-23 — Muxification Branch Test Fixture · Reference Design Scaffold + Reversibility Verification Infrastructure · v0.33.0)

**The First Muxification-Branch Diamond** — user-named transition Diamond opening
the Muxification Branch (post-B-cascade install-flow polish, B-1..B-22). Builds the
Reference Design fixture + snapshot/clone/compare infrastructure required to verify
muxification reversibility before B-24 muxify implementation lands. 3-agent foundation
(Suite 2 Orange + Suite 4 Green + Suite 6 Purple) returned convergent verdict.

**1) Reference Design fixture (CD-77 RDTFS · CD-81 TUSS)**:
- 8-file fixture content as `SCS_MUX_FIXTURE_*` constants in `installConstants.ts`
  (mirrors B-19 BECIS bridge-embedded discipline · bytes-stable · source-controlled)
- `scaffoldReferenceDesignFixture(destDir)` materializes fixture to any directory;
  idempotent overwrite; creates parent dirs as needed
- Inventory: `CLAUDE.md` · `.claude/CLAUDE.md` · `.claude/agents/my-reviewer.md` ·
  `.claude/commands/review.md` · `.claude/settings.json` · `README.md` ·
  `package.json` · `src/index.ts` · `.gitignore`
- `my-reviewer` agent = collision target for B-27 adversarial testing

**2) Reversibility primitives (CD-78 MRV · CD-82 SHSDV)**:
- `snapshotDirectoryHash(dir, skipPatterns?)` — content-only SHA-256 over sorted
  (relPath, contentHash) pairs · deterministic · no mtime/atime
- `compareDirectories(dirA, dirB, skipPatterns?)` — file-by-file content compare;
  returns `{relPath, kind: 'only-in-a' | 'only-in-b' | 'content-mismatch'}[]`
- `cloneFixtureToDir(srcDir, destDir)` — cpSync recursive utility for round-trip
- Skip-list (DEFAULT_SKIP_PATTERNS): `*.bak` · `Cascades/Cascade.json` ·
  `Cascades/Bridge/` · `.git/` · `node_modules/` · `.DS_Store`

**3) Trajectory naming (CD-83 MBDTC · 5-Diamond chain)**:
- B-23 (this) — fixture + reversibility infrastructure
- B-24 — Muxification implementation (CD-79 PECCC IMPL · agent sub-namespace
  `.claude/agents/scs-{name}` to prevent collision)
- B-25 — SCS Uninstall command + B-5 agents-backup persistence refactor
  (close EPHEMERAL gap; CD-80 SUBR IMPL)
- B-26 — End-to-end round-trip test (CD-78 MRV IMPL CORONATION)
- B-27 — Adversarial edge cases

**Files Created**: `src/lib/bridge/muxFixture.ts` (4 functions · ~190 lines) ·
`src/lib/bridge/muxFixture.test.ts` (15 tests · 5 describe blocks)

**Files Modified**: `src/lib/bridge/installConstants.ts` (8 new content constants
+ ordered tuple) · `package.json` (0.32.1 → 0.33.0) · `Cascades/8_SUITES/SCS Bridge/Instance.md`
(v7.6 → v7.7 · B-23 architectural section) · `Cascades/8_SUITES/SCS Bridge/Skill.md`
(SB-S82..SB-S88 · 7 new skills)

**Tests**: 585 → 600 (15 NEW B-23 tests; existing 585 unchanged) · all PASS ·
`npm run typecheck` green · `npm run build` green (140.49 KB)

**CDs**: CD-77 RDTFS · CD-78 MRV · CD-79 PECCC (deferred B-24) · CD-80 SUBR
(deferred B-25) · CD-81 TUSS · CD-82 SHSDV · CD-83 MBDTC. **CD-5 PASS 42nd consecutive**
(C through B-23).

**Suite 8**: SCS Bridge v7.6 → v7.7 · 81 → 88 skills (SB-S82..SB-S88 NEW) ·
trajectory: Muxification Branch infrastructure foundation

**Push gate**: HELD pending B-23 fixture/snapshot/compare user-Lambda

**Pearl**: Reversibility = the load-bearing structural spine of the Muxification Branch.
B-23 builds the spine before any vertebra (muxify · uninstall · round-trip · adversarial)
attaches. SCS Bridge composes WITH user's existing Claude Code setup AND can reverse
cleanly to original state — the Reference Design fixture proves the boundary in tests
before B-24 implementation can risk breaking it in production.

---

### 2026-05-09 (Diamond B-22 — Pewter Diamond · Trust-Confer HiFi v3 + Arrow-Nav + Flicker Resolution · v0.32.0)

**The First Pewter Diamond** — user-named ceremony invoking Pewter Tessera as
Suite 8 design lead. Trust-confer permission pane (B-8 SB-S42 v0 era) refined
to Pewter HiFi v3 standards. Plus arrow-key navigation, working Cancel
semantic, and flicker root-cause resolution.

User exact quote: *"Couple Aspects. First is that this is Not Up to our Pewter's
Design Standards. Likewise we Only have the Ability to Confirm. We cannot Use
the Arrow Keys to Select Either Option. Where if we Select No the Install is
Aborted. Issue Suites 2, 4, and 7 at Once to Provide the Foundation for a
Pewter Diamond. Oh! And it Flickers. Which may be the Root Cause of the Lack
of Mobility with the Cursor."*

4-agent parallel dispatch: Suite 2 Orange + Suite 4 Green + Suite 7 Fuchsia +
Pewter Tessera v3 (HiFi design spec). Suite 4 Green forensics confirmed user's
flicker hypothesis as root cause of cursor mobility loss.

**1) Pewter HiFi v3 redesign (CD-71 PTCHR)**:
- D5 closed-box border (corners + sides; DARK top-right + LIGHT bottom-left)
  matching `installAnimation.ts buildPewterPane` for cross-Diamond visual
  continuity
- D1 color tokens: Pewter neutral body · Cobalt title accent · Ochre ⚠ glyph ·
  Rose-tint Cancel REVERSE highlight
- D7 active-button inversion: REVERSE + BOLD + suite-tinted color + ▶ glyph
- Centered geometry via bodyLine + padCenter helpers

**2) Arrow-key navigation (CD-72 TCANC)**:
- `MenuState.trustConfer.selected: 'approve' | 'cancel'` field
- 2 NEW KeyActions: `trust-confer-toggle` + `trust-confer-activate`
- Arrow ↑↓←→ + Tab toggle selected · Enter/Space activate selected
- Y/N/Esc remain as direct shortcuts (B-8 backward compat)
- Default 'approve' on install-selected init preserves B-8 Y/Enter behavior

**3) Cancel semantic (CD-73 TCCAI · STRUCTURAL)**:
- N/Esc → trust-confer-decline (existing · verified)
- Arrow-Enter on Cancel → trust-confer-activate translates to decline
- Both paths: trustConfer cleared · NO handleInstall · `install.declined` log

**4) Flicker root-cause resolution (CD-74 TCPFR + CD-75 MRFD)**:
- Suite 4 Green forensics confirmed: pane emitted ANSI.HOME + CLEAR_SCREEN
  every 33ms (30/sec) → flicker AND ANSI cursor stomp ("teleports cursor to
  origin 30 times/second")
- Fix: pane content NO LONGER contains HOME+CLEAR_SCREEN
- renderFrame NEW trustConfer early-return: hash-memo (selected · paths len ·
  cascadesPresent · termWidth · termHeight); emit ANSI.HOME + CLEAR_SCREEN +
  renderMenu output ONLY on hash change
- 30/sec wasted writes → 0/sec wasted writes
- User-named hypothesis CONFIRMED: flicker WAS root cause of cursor mobility

**5) Pewter modal selected-state highlight (CD-76 PMSH)**:
- Active button: ▶ + REVERSE + suite-tinted color
- Inactive button: 2-space prefix + dim Pewter

**Tests**: 570/570 (563 → 570, +7 B-22). 1 existing test flipped semantic
(Enter now activate not direct confirm). All 4 fixtures updated. Build 135.40
KB → 140.01 KB (+4.61 KB · Pewter v3 redesign + selected-state logic + KeyAction
additions). Lint clean on B-22 files. Pattern 4 v2 grep ZERO regressions.

**Suite 8 SCS Bridge**: v7.5 → v7.6. SB-S76 PTCHR + SB-S77 TCANC + SB-S78 TCCAI
(structural) + SB-S79 TCPFR + SB-S80 MRFD (structural) + SB-S81 PMSH. 81 total
skill slots.

**CDs**: CD-71..CD-76 NEW (CD-71/72/74/76 implemented · CD-73/75 structural).
**CD-5 PASS · 41st consecutive** (C through B-22).

**Modal-Render-Frame-Decoupling generalization (CD-75 MRFD)**: hash-memo pattern
emerges as reusable across modal surfaces (trustConfer now · renameMode could
benefit · future modals plug into same discipline).

**State**: TESTING-PENDING-AGGREGATE — test-007 verifies Pewter v3 visual ·
arrow-nav between [Y]/[N] · selecting N aborts install · no flicker · cursor
state stable. Push HELD on `SCS-Bridge-Install`.

---

### 2026-05-09 (Diamond B-21 — Reflexive cascadesPresent + Reinstall Re-Scaffold-Fire · v0.31.1)

**Implementation Diamond — User-Named Responsive-Feedback Gap Closed** —
B-20 lifecycle toggle worked on cold-start (Image #14 confirmed) but NOT
in-process (Image #15 showed scaffold complete + auto-launched session
alive · menu still showed "Install" not "Reinstall"). Suite 4 Green +
Suite 7 Fuchsia pre-interrupt diagnosis identified two gaps:

1. cascadesPresent probed-once at TUI startup (animatedTui.ts:264);
   never refreshed after bridge's own scaffold action
2. Path B Reinstall routing only spawned install-instance; didn't
   actually re-scaffold cwd artifacts ("Run the Install Routine Again"
   intent unmet)

User exact quote: *"after our Install Agent is Dispatched the Menu Should
Likewise be Updated. This is a Responsive Feedback that Correlates to the
Ongoing Process where if the User Exits the Installation Agent, they Can
Engage Again without Exiting the SCS. Even Though it's the Same Path now
Traversered Differently due to the Existing Directories Existing."*

**1) `animatedTui.ts handleInstall` Path A success block (CD-68 PSCRP)**:
- Combined state mutation: cursor reassign + `cascadesPresent: true` flip
- Single spread: `menuState = { ...menuState, selectedUlid: SYNTHETIC_NEW,
  cascadesPresent: result.cascadesScaffolded ? true : menuState.cascadesPresent }`
- New log event: `install.cascades-present.refreshed`
- Bridge UI immediately reflects scaffold completion — row label flips
  Install → Reinstall on next render frame
- Future handleInstall invocations from same bridge process route Path B
  (existsSync re-fires per press · finds 8_SUITES from just-completed scaffold)

**2) `animatedTui.ts handleInstall` Path B head (CD-69 RRSF)**:
- Prepends `runInstallScaffoldOnly` call BEFORE `runInstallSpawnPipeline`
- Re-clones source · re-scaffolds non-user artifacts (8_SUITES +
  Documentation + CHANGELOG + REGISTRY)
- Re-scaffold failure non-fatal (catch + log + proceed to spawn)
- New log events: `install.reinstall.rescaffolded` ·
  `install.reinstall.rescaffold-error`

**User-State Preservation** (existing mechanisms compose):
- Cascade.json preserved (BECIS skip-if-exists B-19)
- Working/* · Lab/* · Bridge sessions+log preserved (filter B-13)
- <userCwd>/CLAUDE.md backed up timestamped (B-3 backup)
- 8_SUITES + Documentation + CHANGELOG + REGISTRY REFRESHED
  (deliberate Reinstall semantic — get fresh bridge content)

**Tests**: 563/563 (no new unit tests · orchestration layer best verified
live · existing regression coverage solid). Build 134.65 KB → 135.40 KB
(+0.75 KB · minimal). Lint clean. Pattern 4 v2 grep ZERO production
regressions.

**Suite 8 SCS Bridge**: v7.4 → v7.5. SB-S74 PSCRP + SB-S75 RRSF.
75 total skill slots.

**CDs**: CD-68 PSCRP NEW (implemented) · CD-69 RRSF NEW (implemented).
**CD-5 PASS · 40th consecutive** (C through B-21).

**The Architectural Closure**: B-20 designed the lifecycle row (Install/
Reinstall/Update labels). B-21 makes the lifecycle ACTUALLY RESPONSIVE
in-process — bridge state tracks its own filesystem actions in real time.
CD-66 SRDBR (Same-Row-Different-Behavior-Routing) was structurally correct
in B-20 but blocked at runtime by the stale cascadesPresent. PSCRP unblocks
it: same SYNTHETIC_INSTALL row · same install-selected KeyAction · BUT
existsSync(8_SUITES) per-press finds different state → routes Path A or
Path B differently after the scaffold.

**State**: TESTING-PENDING-AGGREGATE — test-007/test-009 verifies
responsive lifecycle: blank-slate → Install → row flips Reinstall in-process →
exit Claude session → press Reinstall → Path B re-scaffold + spawn.

---

### 2026-05-09 (Diamond B-20 — Install / Reinstall / (Future Update) Row Lifecycle Toggle · v0.31.0)

**Implementation Diamond — User-Named Polish · Full Suite Cascade** —
User: *"Last Polish before Moving onto the Muxified Path with the User's
Current Installation. We need to Change the Install SCS-Bridge Option after
the Initial Directories are Scaffolded. We will then Change the Label to be
a Reinstall Option. As this Option will then Become the Same Option Later
in our Diamonds Towards Release to have the User Update the SCS-Bridge."*

4-agent parallel dispatch (Suite 1 Red Curator + Suite 2 Orange Prospector +
Suite 3 Yellow Architect + Suite 4 Green Sculptor) for Bands 1-4. Conductor-
direct Bands 5-7. Convergent verdict: same `SYNTHETIC_INSTALL` sentinel + same
KeyAction · 3 phase-driven labels · routing reuses existing path-detect.

**1) `menu.ts` extended**:
- NEW exports: `INSTALL_LABEL` / `REINSTALL_LABEL` / `UPDATE_LABEL` constants
- NEW helper: `installPhaseLabel(cascadesPresent?: boolean): string`
- `formatInstall(selected, cascadesPresent?)` — second arg drives label
  discrimination; backward-compat preserved (omitting arg → INSTALL_LABEL)
- Trust-confer pane header reads `trustConferActionLabel` per cascadesPresent
- MenuState extended: `updateAvailable?: string` (Phase C slot reserved)
- 4 visibility gates flipped: `cascadesPresent === false` → `!== undefined`

**2) `menu.test.ts` extended**: 5 NEW + 1 flipped
- formatInstall lifecycle label discrimination (4 tests)
- Reinstall label rendering in renderMenu
- Cursor-up SYNTHETIC_NEW → SYNTHETIC_INSTALL when cascadesPresent === true (B-20 IRULRT)
- Backward-compat undefined invariant preserved
- Existing test flipped from "row absent" to "Reinstall label visible" semantic

**Tests**: 563/563 (558 → 563, +5 B-20). Build 134.65 KB. Lint clean on B-20
files. Pattern 4 v2 grep ZERO production regressions.

**Suite 8 SCS Bridge**: v7.3 → v7.4. SB-S69 IRULRT + SB-S70 CPCLD + SB-S71
FCUHR + SB-S72 SRDBR + SB-S73 SSMLC. 73 total skill slots.

**CDs**: CD-63..CD-67 NEW (CD-63/64 implemented · CD-65/66/67 structural).
**CD-5 PASS · 39th consecutive** (C through B-20).

**Lifecycle Phase Table**:
- Phase A — Install (cascadesPresent false/undefined) → Path A scaffold-only
- Phase B — Reinstall (cascadesPresent true) → Path B install-instance (NEW)
- Phase C — Update (future · updateAvailable defined) → mechanism TBD (slot reserved)

**Routing Semantic for Reinstall**: reuses Path B install-instance flow against
already-scaffolded cwd. Clone fresh content + re-execute Strategy S1-S6 +
scaffold updates land non-destructively (scaffoldUserDotClaude has timestamped
backup pattern).

**Forward-Compat (CD-65 FCUHR)**: same SYNTHETIC_INSTALL sentinel + same
KeyAction throughout all 3 phases. Future Update mechanism plugs into same
slot — `installPhaseLabel` extends to check `updateAvailable` field (currently
slot-reserved · no runtime cost in B-20).

**The Architectural Closure**: Diamond B-1 introduced cascadesPresent-driven
conditional Install row (Phase A only). B-20 extends to all-phase Install row
presence with label discrimination. Single MenuRow position is the Diameter
through three lifecycle Demometers — bridge owns the lifecycle authority
(CD-60 PHRSD principle from B-19).

**State**: TESTING-PENDING-AGGREGATE — test-007-bis verifies "Reinstall
SCS-Bridge" label appears post-scaffold. Push HELD on `SCS-Bridge-Install`.

---

### 2026-05-08 (Diamond B-19 — Bridge-Embedded Cascade.json · Source-Independent Initial State · v0.30.1)

**Implementation Diamond — User-Named Scaffold Gap Closed · Full Suite Cascade**
— User reported "our Initial Scaffold doesn't Provide: Cascade.json. Engage a
Full Suite." Lambda evidence (debug.log `templateRenamed: false`) revealed
the B-13 Cascade.template.json → Cascade.json rename mechanism depends on
the template existing in clone source. Push HELD throughout B-cascade →
only SCS-Bridge-Install branch has template; main does NOT.

4-agent parallel dispatch (Suite 1 Red curator + Suite 2 Orange prospector +
Suite 3 Yellow architect + Suite 4 Green sculptor). Convergent verdict:
bridge-embedded constant + skip-if-exists composition with existing rename.

**1) `installConstants.ts` extended**: NEW `SCS_FRESH_CASCADE_JSON` constant
- Canonical fresh-install JSON matching `Cascades/Cascade.template.json` exactly
- Pattern matches existing bridge-embedded-constant discipline
  (SCS_INSTALL_REPO_URL · SCS_INSTALL_PRIMING_PROMPT · SCS_PATH_A_PRIMING_PROMPT)

**2) `installSpawn.ts runInstallScaffoldOnly` extended**:
- Embedded-write step inserted AFTER rename block, BEFORE cleanup
- Skip-if-exists guard: `!existsSync(livePath) && existsSync(userCascadesPath)`
- New return field: `cascadeJsonSeeded: boolean`
- New log event: `install.scaffold.cascade-json-embedded-write { path, bytes }`

**3) `installSpawn.test.ts` extended**: 4 NEW BECIS unit tests
- Parseable JSON
- Fresh-install field shape (cycle 0, gate 0, null Diamond/Onyx)
- Full 8-color suiteColors map
- Single-source-of-truth invariant: constant === on-disk template (byte-equivalent)

**Tests**: 558/558 (554 → 558, +4 BECIS). Build 134.16 KB · 121.0 kB packed
(5 files). Lint clean on B-19 files. Pattern 4 v2 grep ZERO production
regressions.

**Suite 8 SCS Bridge**: v7.2 → v7.3. SB-S66 BECIS + SB-S67 FFHF + SB-S68 PHRSD.
68 total skill slots.

**CDs**: CD-58 BECIS NEW (implemented) · CD-59 FFHF NEW (structural) ·
CD-60 PHRSD NEW (structural). **CD-5 PASS · 38th consecutive** (C through B-19).

**Operation Order (CD-62 LWWSC last-write-wins)**:
1. Clone repo
2-4. Backup + scaffold .claude/
5. cpSync(Cascades) — filter excludes Cascade.json (B-13)
6. Rename Cascade.template.json → Cascade.json (B-13 legacy path; SCS-Bridge-Install branch only)
7. **Embedded write Cascade.json from SCS_FRESH_CASCADE_JSON (B-19 canonical authority; skip-if-exists)**
8. Cleanup tempDir

**Skip-if-exists semantic**: if step 6 succeeds (template found, renamed),
step 7 sees livePath exists → skip. If step 6 is no-op (main branch case),
step 7 fires → Cascade.json written from embedded default. Either way:
Cascade.json present.

**The Architectural Closure**: B-13's filter excludes Cascade.json from
cpSync (correct — don't copy dev's live state). B-13's rename runs only
when template is present (branch-dependent). B-19 makes the bridge itself
the source-of-truth for fresh-install state — independent of clone source,
push status, or branch divergence.

**State**: TESTING-PENDING-AGGREGATE — test-007-bis verifies Cascade.json
appears in fresh scaffold. Push HELD on `SCS-Bridge-Install`.

---

### 2026-05-08 (Diamond B-18 — SCS Manifold Particle Sphere · Pewter HiFi v2 · v0.30.0)

**Implementation Diamond — Pewter Tessera v2 Engaged · User-Lambda Confirmed
B-17 + Visual Crank-Up** — User confirmed Diamond B-17's animation sequence
("Sequence is on Point") and requested visual content represent the SCS
Manifold itself (the §§0-9 concept network) within terminal capabilities.
Pewter Tessera engaged for second pass — produced 699-line HiFi design spec
with 42-concept inventory + 18 logical Diameter connections + Fibonacci
sphere algorithm + phase-driven density modulation + 3 ASCII mockups.

**1) NEW `src/lib/tui/manifoldMode.ts`** (~370 lines):
- `renderManifoldSphere(t, grid, caps, phase)` replaces STRATIDIAN_MODES rotation backdrop
- 42-concept `MANIFOLD_CONCEPTS` array with `(thetaDeg, phiDeg)` spherical coords + Suite tag
- 18-pair `MANIFOLD_DIAMETERS` array (logical concept connections from CLAUDE.md cross-refs)
- Fibonacci sphere distribution (golden-angle spiral · uniform-as-possible · no gridding)
- 3D rotation: spin-Y(t × spinRate) → tilt-X(23° Earth-like)
- Depth-sort ascending; glyph-tier by depth (`●◉◯*•·` unicode · `Oo*.` ASCII fallback)
- Suite spectrum color cycle (`i % 8` → SUITE_COLORS); accent +20% brightness
- Visibility-gated label rendering (front-facing hemisphere only; budget capped by termWidth)
- Visibility-gated Diameter line rendering (BOTH endpoints `v.z > 0.05`)
- Local bresenham + lineChar (avoids cross-module coupling with modes.ts)

**2) NEW `src/lib/tui/manifoldMode.test.ts`** (11 unit tests):
- Concept inventory size + Diameter inventory size
- Fibonacci unit-sphere distribution
- sphericalToCart canonical points (poles + equator)
- applyManifoldRotation magnitude invariance
- particleCountFor + labelBudgetFor terminal-size scaling
- Render output non-empty
- Density modulation pre-spawn vs ready
- ASCII fallback no-unicode-glyphs
- No-orphan endpoint check (all Diameter endpoints reference valid concepts)

**3) MODIFIED `src/lib/tui/installAnimation.ts`**:
- Backdrop swap: `renderManifoldSphere(t, grid, caps, phase)` replaces
  `STRATIDIAN_MODES[modeIdx](t, topGrid, caps)` call
- Phase mode-name footer collapses: per-phase MUXAMETER/STRATIDIA/SUITE-WHEEL
  → single `mode: MANIFOLD` (single visual identity)
- PHASE_MODE_INDEX retired; PHASE_LABELS + PHASE_COLOR_NAMES preserved

**4) MODIFIED `src/lib/tui/installAnimation.test.ts`**:
- Mode-footer test updated for `MANIFOLD` designation

**Tests**: 554/554 (543 → 554, +11 manifoldMode). Build 133.23 KB · 119.6 kB
packed (5 files). Lint clean on B-18 files. Pattern 4 v2 grep ZERO production
regressions.

**Suite 8 SCS Bridge**: v7.1 → v7.2. SB-S61 SMPSA + SB-S62 MCLOC + SB-S63
DCLRD + SB-S64 SSPHC + SB-S65 MPDM. 65 total skill slots.

**CDs**: CD-53..CD-57 NEW (all 5 implemented). **CD-5 PASS · 37th consecutive**
(C through B-18). All Cycle 39 coronations from B-17 user-Lambda still valid.

**Phase Parameter Table** (per Pewter v2 spec):
- pre-spawn: 30% particles · 5 labels · 0 lines · 0.18 rad/s · Cobalt accent
- awaiting-alive: 70% · 12 · 5 · 0.30 rad/s · Ochre accent
- ready: 100% · 24 · 18 · 0.55 rad/s · Viridian accent

**The Architectural Aesthetic Closed**: Diamond B-17 made the install
animation function correctly (sequence on point per user-Lambda); Diamond
B-18 made the install animation BE the SCS Manifold itself, rendered within
terminal capabilities. As the sphere rotates, the Diameter connections
compose + decompose — **the Manifold revealing itself**, like neurons firing
across the rotating brain. Pewter's "metallic frame holding the colors"
operates at 30 FPS via the unchanged D5 Embossed Border framing the rotating
Manifold visible through its center pane.

**State**: TESTING-PENDING-AGGREGATE — test-007-bis verifies enhanced
animation visual on Install confirm. Push HELD on `SCS-Bridge-Install`.

---

### 2026-05-08 (Diamond B-17 — Full-Screen Install Animation · Pewter HiFi · ACOFSAT Cessation · v0.29.0)

**Implementation Diamond — 3-Agent Convergent Design Grounded** — Diamond B-16
closed the install-flow Lambda chain (positional argument seeds first prompt).
Diamond B-17 closes the install-flow UX chain: full-screen Pewter-Tessera-styled
HiFi initialization animation with input-lock and registry-driven cessation
fills the previously-silent 6-9 second wait window between user-Install-confirm
and primed-claude.

3 parallel design agents dispatched: Suite 1 Red Curator (existing animation
infrastructure + alive-detection mechanism), Suite 2 Orange Prospector (4
named patterns CD-5 clean: FSIAO/ACOFSAT/IPDAA/IAILT + 2 sub-patterns IPSOT/ATSC),
Pewter Tessera HiFi (visual design spec with 3 ASCII mockups + Embossed Pane
Border Pair token + Mode subset 3-4-5 phase-driven rotation).

**1) NEW `src/lib/tui/installAnimation.ts`** (~210 lines):
- `renderInstallAnimation(state, cols, rows, caps, nowMs)` composes Stratidian-mode
  background + Pewter D5 Embossed Pane Border + centered status overlay
- `buildPewterPane` renders top/right edges in DARK suite color, bottom/left in
  LIGHT (metallic frame depth)
- Phase enum: 'pre-spawn' | 'awaiting-alive' | 'ready' driving mode index +
  color + label + progress bar fill
- Time-bucket sub-status for pre-spawn ("Cloning..." → "Scaffolding..." → "Spawning...")
- `advancePhase(state, nextPhase)` immutable helper

**2) `src/lib/tui/colors.ts` extended**:
- `darken(rgb, factor=0.5)` + `lighten(rgb, factor=0.5)` helpers
- Pre-computed `SUITE_COLORS_DARK` + `SUITE_COLORS_LIGHT` records (Pewter D5 token)

**3) `src/lib/bridge/menu.ts MenuState` extended**:
- `installAnimating?: { startedAt, ulid, phase }` field

**4) `src/lib/tui/animatedTui.ts` wired**:
- renderFrame branch for FSIAO full-screen replacement
- keypressHandler guard for IAILT input-lock (Ctrl-C only)
- handleInstall sets installAnimating before first await + advances phase post-spawn
- watchFile cessation via ACOFSAT (claudeSessionId surfacing) + 250ms ✓ Ready
  settle beat (Pewter D9 effect_dust analog)
- `armAtscTimeout(ulid)` 30s safety net

**Tests**: 543/543 (533 → 543, +10 installAnimation). Build 122.86 KB · 112.0 kB
packed (5 files). Lint clean on B-17 files. Pattern 4 v2 grep ZERO production
regressions.

**Suite 8 SCS Bridge**: v7.0 → v7.1. SB-S55 IAILT + SB-S56 FSIAO + SB-S57 ACOFSAT
+ SB-S58 IPDAA + SB-S59 IPSOT + SB-S60 ATSC. 60 total skill slots.

**CDs**: CD-47..CD-52 NEW (all 6 implemented). **CD-5 PASS · 36th consecutive**
(C through B-17). All Cycle 38 coronations from B-16 user-Lambda still valid.

**The Install-Flow UX Chain Closed**: B-13 trust pre-seed → B-14 auto-launch +
typeahead (later retired) → B-15 /cascade priming + AAPD (later retired) → B-16
positional CLI argument (TCC dissolved) → B-17 visible initialization animation.
The previously-silent 6-9 second wait window now becomes a Pewter-styled HiFi
sequence with 3 ASCII-mockup-validated phases. Animation ceases on the same
registry signal (`claudeSessionId` surfacing) that drives the bridge menu's
alive indicator — single source of truth reused.

**Pewter Tessera HiFi influence applied**:
- D1 Color Token Architecture: phase-color progression (Cobalt → Ochre → Viridian)
- D5 Embossed Pane Border Pair: top-right dark + bottom-left light (metallic depth)
- D9 effect_dust analog: 250ms ✓ Ready settle beat before menu return
- Mode subset (3,4,5 of 6): muxameter → stratidia → suiteWheel for "initializing" semantics

**Input-Lock Discipline (IAILT)**: only Ctrl-C escapes during animation; all
other keys absorbed. Prevents inadvertent menu navigation, rename, close.
Lock auto-releases on phase=ready clearance OR ATSC 30s timeout OR cleanExit.

**State**: TESTING-PENDING-AGGREGATE — test-007-bis live retest verifies
animation activates on Install confirm, ceases on first-spawn-alive, stays
input-locked throughout. Push HELD on `SCS-Bridge-Install`.

---

### 2026-05-08 (Diamond B-16 — Positional [prompt] Cascade Seeding · TCC Path Retired · v0.28.0)

**Implementation Diamond — 4-Agent Convergent Verdict Grounded** — Diamond B-15's
user-test surfaced TCC -1743 still gating typeahead despite AAPD detection.
3 Suite 6 Purple Vermillion WebSearch agents + 1 Suite 1 Maroon SCP_Origin Lab
Curator dispatched in parallel. **All converged on `claude [opts] "[prompt]"`
positional CLI argument** — documented at `code.claude.com/docs/en/cli-reference`
literally as "Start interactive session with initial prompt." Bypasses TCC
entirely. ~80 lines of typeahead infrastructure dissolves to one positional arg.

**1) `osTerminal.ts`** — NEW `escapeForBashSingleQuote(s)` (wraps `'...'` with
internal `'` escaped as `'\''`). `BuildTerminalCommandInput.seedPrompt?: string |
null` threaded through `buildClaudeCommandFragment` + 4 platform builders. macOS
applies 2-layer escape (bash + AppleScript); Linux/Windows args-array branches
pass seedPrompt as separate spawn arg; bash-c branches use single-quote wrap.
`mode === 'resume'` IGNORES seed (positional reserves next-message semantics).

**2) `spawn.ts` + `manager.ts`** — `LaunchClaudeWindowOpts` + `launchInformative`
accept optional `seedPrompt`. `launchInformative('new', '/cascade')` is the
canonical Path A invocation.

**3) `installSpawn.ts`** — `spawnInstallInstance` accepts seedPrompt;
`runInstallSpawnPipeline(cwd, repoUrl, seedPrompt)` requires seedPrompt as 3rd
parameter. **DELETED**: `dispatchTypeahead`, `pollSessionReadyAndTypeahead`,
`pollRegisterReadyAndTypeahead`. AAPD branch retired with parent function.

**4) `animatedTui.ts handleInstall`** — Path A passes
`SCS_PATH_A_PRIMING_PROMPT` (`/cascade`) to `launchInformative`; Path B passes
`SCS_INSTALL_PRIMING_PROMPT` to `runInstallSpawnPipeline`. Removed
`pollSessionReadyAndTypeahead` + `pollRegisterReadyAndTypeahead` calls + imports.

**Tests**: 533/533 (537 → 533, net −4: 10 typeahead tests retired, 6 PCSP
positional tests added in osTerminal.test.ts buildTerminalCommand — macOS
describe block). Build 115.04 KB (DOWN from 117.12 KB at B-15). 104.5 kB packed
(5 files). Lint clean on B-16 files. Pattern 4 v2 grep ZERO production
regressions.

**Suite 8 SCS Bridge**: v6.10 → **v7.0** (major — TCC-free Lambda path,
retired entire typeahead infrastructure). SB-S54 PCSP NEW. SB-S46/S47/S51/S53
RETIRED (typeahead/AAPD chain superseded). 54 total skill slots, 50 active.

**CDs**: **CD-46 PCSP** NEW (implemented) · **CD-37 RETIRED** ·
**CD-41 RETIRED** · **CD-45 RETIRED** · CD-44 PASCP CARRIED. **CD-5 PASS · 35th
consecutive** (C through B-16). Bulk-coronation queue: 17 CDs (CD-23..CD-46
minus CD-34/-37/-41/-45 retired).

**The Architectural Diameter Closed (and the Diameter that retires others)**:
Diamond B-13/14/15 concentrated on detecting and working around the macOS TCC
permission gate. Diamond B-16 dissolves that whole problem space by adopting
the documented CLI mechanism that doesn't trigger TCC at all. The install flow
now produces zero AppleEvents.

**Hard Validation Sources**: code.claude.com/docs/en/cli-reference ·
code.claude.com/docs/en/headless · GitHub Issues #38495 (positional auto-submit
proof) · #6009 (stdin-pipe Closed-as-not-planned) · #10373 (SessionStart broken
for fresh sessions).

**CHANGELOG rotation FIRED**: 395 → 343 lines. 52 lines (Diamond R..H entries)
folded to `Cascades/CHANGELOG-ARCHIVE-2026-05.md` (73 → 125 lines). Active
CHANGELOG now contains B-cascade Diamonds B-1 through B-16 + this Diamond's
header.

**Open risk for live-validation (test-007-bis)**: GitHub Issue #38495's source
citation used `"ssh"` (literal text) as positional. Whether `/cascade` in
positional position routes through claude's slash-command pipeline (auto-fires)
OR is sent as literal text (displays for user-Enter) is empirically unconfirmed.
Cobalt B5 ran `claude --help` standalone confirming `[prompt]` is documented as
"Your prompt"; live-validation completes the chain.

**State**: TESTING-PENDING-AGGREGATE — test-007-bis verifies positional seed
lands in claude prompt. Push HELD on `SCS-Bridge-Install`.

---

### 2026-05-08 (Diamond B-15 — Path A `/cascade` Priming + macOS -1743 Detection · v0.27.2)

**Implementation Diamond — User-Named "Last Diameter" Closed** — Diamond B-14's user-test
of test-007 produced precise Lambda evidence in `Cascades/Bridge/debug.log`: PSRT
correctly detected the registry transition (`install.session-ready.detected`,
claudeSessionId surfaced), but `dispatchTypeahead` failed with macOS error
`-1743` ("Not authorized to send Apple events to System Events"). User-named
gap: "the Last Diameter is to be Able to Seed the Surface Menu Prompt from /cascade".
Two surgical fixes.

**1) `installConstants.ts`** — NEW export `SCS_PATH_A_PRIMING_PROMPT = '/cascade'`
(slash command, not verbose paragraph). Path B's `SCS_INSTALL_PRIMING_PROMPT`
preserved unchanged because the install-instance cwd lacks
`.claude/commands/cascade.md` until scaffold completes.

**2) `installSpawn.ts dispatchTypeahead`** — error message inspected for `-1743`
or `Not authorized to send Apple events`; if matched, logs
`install.typeahead.permission-needed` + emits `process.stderr.write` with 4-line
actionable instruction (System Settings → Privacy & Security → Automation →
Terminal app → System Events). Generic errors continue to log
`install.typeahead.error` without user-facing stderr. Resolves cleanly in both
branches (non-fatal — install + auto-launch already succeeded).

**3) `animatedTui.ts handleInstall` Path A** — `pollSessionReadyAndTypeahead`
arg switched from `SCS_INSTALL_PRIMING_PROMPT` to `SCS_PATH_A_PRIMING_PROMPT`.

**Tests**: 537/537 (530 → 537, +7 B-15: 5 dispatchTypeahead + 2 priming
constants). Build 117.12 KB · 105.5 kB packed (5 files). Lint clean on B-15
files. Pattern 4 v2 grep ZERO production regressions.

**Suite 8 SCS Bridge**: v6.9 → v6.10. SB-S52 (Path-A-Slash-Command-Priming · PASCP)
+ SB-S53 (Apple-Automation-Permission-Detection · AAPD). 53 total skills.

**CDs**: CD-44 PASCP NEW (implemented) · CD-45 AAPD NEW (implemented). **CD-5
PASS · 34th consecutive**. Bulk-coronation queue: 19 CDs (CD-23..CD-45 minus
CD-34).

**The Architectural Diameter Closed**: `/cascade` is the canonical Stratidian
first-input — slash-command equivalent of the install-completion gesture. Path A
auto-launched sessions land in a cwd already populated with
`.claude/commands/cascade.md`, so `/cascade` triggers the cascade slash command
with rich context (Stratidian Manifold + Suite 8 instances) already loaded.

**macOS Automation Permission** is a system-level boundary bridge cannot bypass.
SB-S53 emits a clear one-time instruction; user grants permission once via
System Settings; future installs auto-fire the priming prompt without further
intervention.

**Deferred**: CD-42 (osascript-stderr-capture) · CD-43 (banner version sync) ·
CHANGELOG rotation (now ~395 lines · severely over cap; next Diamond's first task) ·
permission warm-up probe at bridge startup.

**State**: TESTING-PENDING-AGGREGATE — user grants Automation permission once,
then re-runs test-007-bis to verify full Path A circuit (scaffold → trust-skip →
auto-spawn → `/cascade` typeahead). Push HELD on `SCS-Bridge-Install`.

---

### 2026-05-08 (Diamond B-14 — Path A Circuit Completion · v0.27.1)

**Implementation Diamond — Suite 4 Green ⊗ Suite 7 Fuchsia Convergent Diagnosis Grounded** —
Diamond B-13's user-test (test-007) surfaced two named broken Diameters: (1) Path A
scaffold returns to menu without auto-launching a session, (2) no priming-prompt
typeahead fires for that session. Both agents converged on Length 1-4 / Tier 0 /
~28 lines. Diamond B-14 implements both surgical fixes.

**1) `installSpawn.ts` extended** — NEW `pollSessionReadyAndTypeahead(ulid, primingText)`
(~30 lines): polls `listSessions()` every 500ms for `entry.claudeSessionId !== undefined`
(the registry transition `runSessionStartHook` writes for ANY new-session spawn).
Once detected: 1s delay + `dispatchTypeahead(primingText)`. Re-entrancy guard via
`probing` flag. Non-fatal on errors; timeout-safe (120s default). **NO tempDir
coupling** — registry-native; works for any session spawn, not just install-instance.

**2) `animatedTui.ts handleInstall` Path A** — after `selectedUlid = SYNTHETIC_NEW`
cursor reassign, calls `createSession()` + `launchInformative(sessionId, 'new')` (same
mechanism as user pressing New Session) then `void pollSessionReadyAndTypeahead(...)`
(fire-and-forget). Inner try/catch keeps auto-launch non-fatal — user falls back to
manual New Session.

**Tests**: 530/530 (525 → 530, +5 pollSessionReadyAndTypeahead). Build 116.37 KB ·
104.2 kB packed (5 files). Lint clean on B-14 files. Pattern 4 v2 grep ZERO
production regressions.

**Suite 8 SCS Bridge**: v6.8 → v6.9. SB-S50 (Path-A-Lift-After-scaffold · PALA) +
SB-S51 (Path-A-Session-Ready-Typeahead · PSRT). 51 total skills.

**CDs**: CD-40 PALA NEW (implemented) · CD-41 PSRT NEW (implemented) · **CD-38
CORONATED** (user-Lambda confirmed in B-13 test-007 — claude went direct to
interactive in test-007) · CD-39 CARRIED to B-14 close. **CD-5 PASS · 33rd
consecutive**. Bulk-coronation queue: 17 CDs (CD-23..CD-41 minus CD-34).

**The Architectural Diameter Closed**: Path A scaffold-only and Path B install-instance
now form symmetric Demometers in the install-flow Muxonomy. Both produce a fresh primed
claude session in the user's cwd. Path A: bridge-side scaffold + native createSession.
Path B: install-instance Strategy + register-state.json. Single `if` branch
(`existsSync(8_SUITES)`), two complete circuits.

**Deferred**: CD-42 (osascript-stderr-capture) for Java VM noise observability ·
CD-43 (menu.ts banner version sync — currently v0.24.0 cosmetic) · CHANGELOG rotation.

**State**: TESTING-PENDING-AGGREGATE — test-007-bis retest verifies full Path A
circuit (scaffold → auto-spawn → typeahead seed). Push HELD on `SCS-Bridge-Install`.

---

### 2026-05-08 (Diamond B-13 — Trust Pre-Seed + Two-Path Install · v0.27.0)

**Implementation Diamond — Diamond B-12 Research Grounded** — Distinct-Demometer-By-Diameter
Lambda evidence (test-005 trusted vs test-006 untrusted) sufficient per user discernment;
Green B4's BLOCKING live-test gate bypassed.

**1) `trustPreSeed.ts` (NEW · 67 lines)** — `preSeedTrust(userCwd)` writes `~/.claude.json`
`projects["<absolutePath>"].hasTrustDialogAccepted = true` via atomic `.tmp + renameSync`.
Merge-safe; corrupt-JSON tolerant; non-fatal on failure.

**2) `installSpawn.ts` extended** — `pathFilterCascadesScaffold` excludes Working/Lab non-`.gitkeep`,
Bridge sessions+log, assets/, Cascade.json, .DS_Store. `runInstallScaffoldOnly(cwd, repoUrl)` =
clone + `.claude/` scaffold + `Cascades/` filter-copy + `Cascade.template.json → Cascade.json`
rename + cleanup. NO spawn.

**3) `animatedTui.ts handleInstall`** — calls `preSeedTrust(cwd)` first (Pattern 4.1
sanctioning chain), then branches on `existsSync(cwd + '/Cascades/8_SUITES')`: Path A
(blank-slate) → `runInstallScaffoldOnly` + cursor reassign `SYNTHETIC_NEW`; Path B
(scaffolded) → existing spawn-pipeline + register-poll typeahead.

**Tests**: 525/525 (518 → 525, +7 trustPreSeed). Build 114.86 KB · 103.1 kB packed · 5 files.
Lint clean on B-13 files. Pattern 4 v2 grep ZERO production regressions.

**Suite 8 SCS Bridge**: v6.7 → v6.8. SB-S48 (Haiku-Trust-Dialog-Accepted-JSON-Pre-Seed) +
SB-S49 (Two-Path-Install-Detect-Branch) added. 49 total skills.

**CDs**: CD-38 (NEW) + CD-39 (NEW); CD-34 carried-OVERTURNED. **CD-5 PASS · 32nd consecutive**.
Bulk-coronation queue: 15 CDs (CD-23..CD-39 minus CD-34).

**Methodological learning** (Onyx Cycle 35): hyper-focus directives surface mechanisms prior
cascades miss; sibling-level config files require explicit probing beyond directory scope.

**State**: TESTING-PENDING-AGGREGATE — test-007 retest verifies Path A scaffold + trust-skip.
Push HELD on `SCS-Bridge-Install`.

---

### 2026-05-08 (Diamond B-12 — Research: CD-34 Overturned · ~/.claude.json Trust-Skip Discovered · v0.26.0)

**Research Diamond — Two-Path Install + Hyper-Focus Trust-Skip — Diamond B-12** —
**RESEARCH-ONLY · NO src/ changes.** User-conferred hyper-focus call surfaced what 3
prior Diamonds (B-9 + B-11 + initial B-12 Red probe) declared "no programmatic skip
exists." Orange B2 deeper Lambda probe + WebSearch found `~/.claude.json` (root-level
file, NOT `~/.claude/` directory) contains `projects["<absolutePath>"].hasTrustDialogAccepted: boolean`.
Lambda-confirmed: test-005 has `true` (user accepted), test-006 has `false`. Anthropic
docs cite this file for "per-project state (allowed tools, trust settings)". Bridge can
pre-seed this field BEFORE spawn → trust dialog skips. **CD-34 OVERTURNED by CD-38**.
Yellow B3 blueprint: NEW `preSeedTrust(userCwd)` in `trustPreSeed.ts` + NEW
`runInstallScaffoldOnly(userCwd, repoUrl)` for Path A (blank-slate) + two-path branch
in `handleInstall` (Path A vs Path B by `existsSync(Cascades/8_SUITES)`). Green B4 audit
APPROVE-WITH-FIXES (5 fixes for B-13): **FIX-1 BLOCKING** — CD-38 live-test gate
(pre-seed + spawn → confirm dialog skipped) MUST PASS before B-13 code; FIX-2 + FIX-3
filter rules; FIX-4 cursor reassign post-Path-A; FIX-5 atomic write. 3 patterns:
Path-A-Scaffold-Only-No-Spawn-Install + Haiku-Trust-Dialog-Accepted-JSON-Pre-Seed
(CD-38) + Two-Path-Install-Detect-Branch (CD-39 candidate). CD-5 PASS (31st consecutive).
Bulk-coronation queue grows: CD-23..CD-32 + CD-35 + CD-36 + CD-37 + **CD-38** + **CD-39**
(CD-34 → OVERTURNED). 518/518 tests · build 109 KB · v0.26.0 unchanged (research-only).
Method-level learning crystallized: hyper-focus directives surface mechanisms prior
cascades miss; sibling-level config files (`~/.claude.json`) require explicit probing
beyond directory scope. Branch: `SCS-Bridge-Install`. State: TESTING-PENDING-AGGREGATE.
Push HELD. Diamond B-13 implementation follows.

### 2026-05-08 (Diamond B-11 — Interactive-Seed Typeahead + Trust-Dialog Reaffirmed · v0.26.0)

**Interactive-Seeded-Spawn-Mechanism — Diamond B-11** — Closes test-005's auto-priming
gap. UserPromptSubmit hook semantics fundamentally cannot inject prompt without user
typing (Lambda-confirmed via `claude --help`). Resolution: **AppleScript typeahead via
System Events keystroke** (CD-37 candidate · SB-S47). New `dispatchTypeahead(text)` in
`installSpawn.ts` activates Terminal.app → keystrokes priming text → key code 36
(Return) — instance receives keypresses as if user typed. New
`pollRegisterReadyAndTypeahead(tempDir, primingText, timeoutMs=120s)` watches for
`register-state.json` (race-free signal that install instance is ready), then dispatches
typeahead with 1s post-detection delay (let Claude render input prompt). Wired into
`animatedTui handleInstall` after spawn. macOS-only; non-fatal on other platforms +
accessibility-denied (logs `install.typeahead.error` and falls back to user manual
typing). **Workspace trust dialog (Angle 2)** reaffirmed as CD-34 negative-space gate —
user-global `skipAutoPermissionPrompt: true` already suppresses tool-use prompts;
workspace trust has no programmatic skip; documented in SB-S43. **Green Fix 1 applied**:
`SCS_INSTALL_PRIMING_PROMPT` extracted to `installConstants.ts` (single source of truth;
removed 2 duplicate copies from `installSpawn.ts` + `installHooks.ts`). **Green Fix 2
applied**: Terminal activate prepended to keystroke sequence (focus race tightening).
3 patterns: Interactive-Seeded-Spawn-Mechanism + Permission-Trust-Marker-Pre-Placement
(no-op) + Register-Install-Hook-Triggers-Typeahead. CD-5 PASS (30th consecutive).
SCS Bridge v6.6→v6.7 (SB-S47 added). 518/518 tests · build 109 KB · `0.25.0 → 0.26.0`
(minor — install UX milestone: full auto-priming where platform allows). Branch:
`SCS-Bridge-Install`. State: TESTING-PENDING-AGGREGATE (test-006 with `scs --debug` +
file:// is bulk-smoke gate). Push HELD.

### 2026-05-08 (Diamond B-10 — Bridge-Side .claude/ Scaffold + Pipeline Observability · v0.25.0)

**Architectural Re-Cast + Install Pipeline Observability — Diamond B-10** — Resolves test-003
silent failure (`.claude/` scaffold never landed). Root cause: Edit-rule on non-existent files
silently fails because Write-tool semantics for new-file-creation don't match Edit-rule allow-list.
**Fix 1 (CD-36 candidate · SB-S44 · Bridge-Side-DotClaude-Pre-Scaffold)**: NEW
`scaffoldUserDotClaude(userCwd, clonePath)` in `installSpawn.ts` runs post-trust-confer (CD-32
sanctioning chain) before spawn — mkdirs `<userCwd>/.claude/`, timestamps backup of existing
`<userCwd>/CLAUDE.md` to `CLAUDE.md.YYYYMMDDTHHMMSS.bak`, places SCS prompt template at
`<userCwd>/.claude/CLAUDE.md`, copies clone's `.claude/agents/` and `.claude/commands/`.
**Fix 2 (Timestamped-User-CLAUDE-Backup)**: NEW `timestampSuffix()` helper returning ISO 8601
compact format; backup persists in user-territory not bridge-temp. **Fix 3
(Allow-Rule-Tool-Mismatch-Fix)**: dropped `Edit(.claude/*)` rules + `Read(CLAUDE.md)` from
`buildInstallSpawnSettings`; added `Read(.claude/CLAUDE.md)`, `Read(CLAUDE.md.*.bak)`,
`Bash(cp *)`. **Fix 4 (CD-35 candidate · SB-S45 · Bridge-Side-Step-Logging)**: 12 new
`install.<step>.start/complete/error` log keys + `install.poll.tick` every 30s. **Fix 5
(SB-S46 · Install-Instance-Log-Per-Band)**: Strategy/S4 Band 5 [Copy-DotClaudeFragments]
DROPPED (now bridge-side); 7→6 Band layout. SCS Bridge v6.5→v6.6 (SB-S44/S45/S46 added).
5 patterns: Bridge-Side-DotClaude-Pre-Scaffold + Timestamped-User-CLAUDE-Backup +
Allow-Rule-Tool-Mismatch-Fix + Bridge-Side-Step-Logging + Install-Instance-Log-Per-Band.
CD-5 PASS (29th consecutive). 518/518 tests · build 107 KB · `0.24.1 → 0.25.0` (minor —
architectural change to install flow). Branch: `SCS-Bridge-Install`. State:
TESTING-PENDING-AGGREGATE (test-004 with `scs --debug` is bulk-smoke gate). Push HELD.

### 2026-05-08 (Diamond B-9 — Probe Target Fix + Trust-Dialog Finding · v0.24.1)

**Probe Target Fix + Directory-Trust Finding — Diamond B-9** — Closes the two issues
Diamond B-8 left exposed at test-002 retest. **Fix 1 (CD-23 refinement · SB-S43)**: probe
target changed from `<cwd>/Cascades` to `<cwd>/Cascades/8_SUITES` in 2 sites
(animatedTui.ts:255 + menu.ts:1031). Root cause: `ensureBridgeRoot()` in `loadRegistry()`
mkdirs `Cascades/Bridge/` as side effect of session enumeration BEFORE probe could read;
Diamond B-8 Fix 1 had right ordering but wrong target. `8_SUITES/` is canonical SCS
scaffold marker (created ONLY by Strategy/S4 from cloned repo); bridge never writes it.
**Fix 2 (CD-34 candidate · negative-space)**: Lambda-confirmed via `claude --help` +
`~/.claude/` inspection + WebSearch — NO programmatic skip mechanism exists for Claude
Code first-time directory-trust dialog. `--print` bypasses but forces non-interactive
(incompatible with install-spawn). On first install, user manually clicks "Yes, I trust
this folder" once per cwd. Documented as expected user-facing single-click gate (not a
bug). Bridge-side trust-confer pane (SB-S42) remains the bridge's authority; Claude Code's
dialog is OS-level. 2 patterns: SCS-Scaffold-Marker-Probe-Target +
Directory-Trust-Dialog-As-User-Intent-Gate-Documentation. CD-5 PASS (28th consecutive).
Suite 8 SCS Bridge v6.4 → v6.5 (SB-S43 added). 518/518 tests · build 104 KB · `0.24.0 →
0.24.1` (patch — completion of B-8 fixes). Branch: `SCS-Bridge-Install`. State:
TESTING-PENDING-AGGREGATE (test-003 is the bulk-smoke gate). Push HELD.

### 2026-05-08 (Diamond B-8 — PRE-BULK-SMOKE FIX PASS · v0.24.0)

**Pre-Bulk-Smoke Fix Pass — Diamond B-8** — Three structural fixes resolved before test-002 retest
of the install flow Diamond B-7 closed. Each fix carries a named pattern; together they mark v0.24.0
as the first usable install-flow milestone. **Fix 1 (POFPFD · SB-S40)**: `cascadesPresent` `existsSync`
probe in `animatedTui.ts` reordered to fire BEFORE the empty-registry auto-spawn block; auto-spawn
gated as `if (cascadesPresent && sessions.length === 0)`. Prior bug: auto-spawn wrote `Cascades/`,
probe returned true, Install row hidden. **Fix 2 (PTS · SB-S41)**: `SpawnSettings` extended with
optional `permissions?: { allow: string[] }`; `buildInstallSpawnSettings` populates 10 install-scope
`Tool(glob)` rules (`Write(<userCwd>/Cascades/**)`, `Edit(<userCwd>/.claude/{CLAUDE.md,agents/**,commands/**})`,
`Read(<userCwd>/CLAUDE.md)`, `Bash(git clone *|cp -R *|mkdir -p *|test -d *|test -f *)`); session-mode
unaffected (backward compat). JSON key path `permissions.allow` per Conductor decision (resolves Green
USER-CONFER gate); `Tool(glob)` syntax Lambda-confirmed via `claude --help`. **Fix 3 (HWMTUC + HWMTUC-SURFACE
· SB-S42)**: `MenuState.trustConfer?: { paths; optionalPaths; ulid }` + new `KeyAction` variants
`'trust-confer-confirm'`/`'trust-confer-decline'` + `applyKeypress` early-return branch (mirrors
`renameMode` pattern) + new `renderTrustConferPane` function applying Pewter Tessera HiFi rules in
TUI (D3 bold/dim ANSI gradient layering · D4 DIM-on-Pewter text-shadow analogue · D5 embossed `═`/`─`
border + `ANSI.REVERSE` active inversion on YES button); Pewter rgb(180,185,190) inline (NOT added
to `SUITE_COLORS`); `case 'install-selected'` no longer fires `handleInstall` directly — sets
`menuState.trustConfer`; new `case 'trust-confer-confirm'` clears modal + fires pipeline; `case
'trust-confer-decline'` clears + logs `install.declined`. 3 patterns: POFPFD + PTS + HWMTUC. CD-5
PASS (**27th consecutive, C through B-8**). Suite 8 SCS Bridge v6.3 → **v6.4** (38 → 41 skills).
518/518 tests · build 104 KB · tsc 0 errors · `npm pack` 5 files · Pattern 4 v2 grep ZERO production
reads · `0.23.1 → 0.24.0` (minor — first usable install-flow milestone). State: TESTING-PENDING-AGGREGATE
preserved (test-002 retest follows).

### 2026-05-08 (Diamond B-7 — FINAL · BULK-SMOKE)

**FINAL — Cleanup + User Closeout + Bulk-Smoke — Diamond B-7** — Closes the Diamond B Cascade
arc. New `pollScaffoldCompleteAndCleanup` async function in `animatedTui.ts` wraps Diamond B-4's
`pollScaffoldComplete` (30-min timeout) + Diamond B-3's `cleanupInstallTemp` in dual try/catch
guards (BPTC pattern · CD-29 candidate). On scaffold-done.flag detection (or timeout), bridge
removes `/tmp/scs-install-<ulid>/` and clears `menuState.installRunning` via spread-reassign so
status bar pid indicator vanishes naturally (IRSCOC pattern · CD-30 candidate). Strategy/S6
refined 56→121 lines (5-Band Vermillion: Verify-Bridge-Owned-Territory · Write-Scaffold-Done-Flag ·
Inform-User-Closeout · Forward-To-Bridge · Lambda-Verify); user closeout message preserves UCNBSP
invariant (install instance does NOT auto-close — user dismisses manually + runs `scs` from
project for first-Cascade engagement). Added log keys `install.complete` · `install.timeout` ·
`install.cleaned` · `install.cleanup.error` (with `phase: 'poll' | 'rm'` payload disambiguation).
3 patterns: BPTC + IRSCOC + UCNBSP. CD-5 PASS (**26th consecutive — cascade-closing milestone**).
Suite 8 SCS Bridge v6.2 → **v6.3** (SB-S39 lifecycle FULLY LANDED). 501/501 tests · build 100 KB ·
`0.23.0 → 0.23.1` (patch — final glue). 4 stream-idle stalls this session (Cobalt opus B-6 / Fuchsia
sonnet B-6 / Orange sonnet B-7 / Green sonnet B-7); Conductor-direct fallback successful in all 4.
**State: BULK-SMOKE-AWAITING-USER** — at user-Lambda confirmation of 21-step plan (DIAMOND-TIER-B-7.md),
8 CDs coronate together: CD-23 + CD-24 + CD-25 + CD-26 + CD-27 + CD-28 + CD-29 + CD-30. B-cascade
graduates from TESTING-PENDING-AGGREGATE → Done. Push gate releases on graduation. Branch:
`SCS-Bridge-Install`.

### 2026-05-08 (Diamond B-6)

**Apex — Wired Install Spawn Pipeline — Diamond B-6** — animatedTui.ts:430 install-selected
handler wired to `runInstallSpawnPipeline` (Diamond B-3 src/ + B-4 + B-5 strategies). New
`src/lib/bridge/installConstants.ts` exports `SCS_INSTALL_REPO_URL` (hardcoded HTTPS GitHub
fallback + env override per CD-24 RUSGF). MenuState extended with optional `installRunning?:
{ulid, pid, tempDir}` field (IRPMS pattern); status bar shows `install pid N` indicator
during install (mirrors spawnSuffix in renderMenu + legacyInstallSuffix in renderMenuLegacy
per Green Fix 1). `handleInstall` async function uses void IIFE pattern (ATUHC); errors
surface via stderr + log key `install.error` (PERRS — no modal seizure; alt-screen preserved).
4 patterns named: ATUHC + IRPMS + PERRS + RUSGF. CD-5 PASS (25th consecutive). Suite 8 SCS
Bridge v6.1 → v6.2 (SB-S39 fully wired across B-1 → B-6). 501/501 tests · build 99 KB ·
`0.22.2 → 0.23.0` (minor — Apex semantic milestone). State: TESTING-PENDING-AGGREGATE
(bulk-smoke at FINAL B-7). Branch: `SCS-Bridge-Install`. Push HELD.

**Cobalt B5 dispatch note** — opus subagent stream-timed-out at 0 tool uses; Conductor
(in-context) implemented src/ directly (5 file edits + 1 new file + 1 test fix); coherence
sweep dispatched to Purple as scheduled.

### 2026-05-08 (Diamond B-5)

**Optional CLAUDE.md → Suite 8 + Revert.md — Diamond B-5** — S5 ConvertClaudeMd rewritten from 74-line skeleton to 162-line 7-Band Vermillion (B1 Read-Backup → B2 Consent-Gate → B3 Name-Gate → B4 Convert → B5 Backup-Relocate-CLAUDE → B6 Backup-Relocate-Agents → B7 Generate-Revert-Doc). New exported function `backupUserDotClaudeAgents(userCwd, tempDir)` in `installSpawn.ts` (B-5 fold-back into B-3 scope): `cpSync` from `<userCwd>/.claude/agents/` → `/tmp/<temp-uuid>/agents.bak/` unconditionally before spawn; no-op if absent. 2 new tests for `backupUserDotClaudeAgents` (happy path + absent no-op). New `Strategy/templates/` directory + `SuiteCascadeSystem-Revert.md.template` (106 lines, 7 variables: TIMESTAMP / USER_PROJECT_PATH / BACKUP_CLAUDE_MD_PATH / BACKUP_AGENTS_PATH / CONVERSION_DESTINATION / CASCADES_DIR / INSTALL_VERSION; slot-substitution via Node.js `String.replaceAll`; Band 7 unresolved-slot guard `if (rendered.includes('{{')) throw`). Conductor.md v1.1→v1.2 (S5 row refreshed). Yellow Bindings: Issue 1 = Option B Additive (project-root CLAUDE.md NEVER modified); Issue 2 = Option D (Move-to-B3). Pattern: Pre-Install-Agents-Backup-With-Consent-Gated-Relocation (PIABCGR). Fix 1: Pattern 4 unified rename adopted. Refinement 2: NO-consent BACKUP_CLAUDE_MD_PATH renders with ephemeral-window warning. Refinement 3: Band 7 unresolved-slot guard concrete. Green CD-5 PASS (24th consecutive). **~501 tests** · build tbd · `0.22.1 → 0.22.2` · Branch: `SCS-Bridge-Install`. State: TESTING-PENDING-AGGREGATE (bulk-smoke at FINAL B-7).

### 2026-05-07 (Diamond B-4)

**Inside-Instance Scaffold Copy — Diamond B-4** — S4 ScaffoldCascadesDir expanded 59→213 lines, 7-Band Vermillion (Band 1 Curate → Band 2 Conference → Band 3 Filter → Band 4 Copy Cascades → Band 5 Copy DotClaudeFragments → Band 6 Lambda-Verify → Band 7 Signal Complete). New `runScaffoldCompleteSignalHook(opts?)` exported from `installHooks.ts` (env-gated, writes `scaffold-done.flag` JSON payload). New `pollScaffoldComplete(tempDir, timeoutMs)` exported from `installSpawn.ts` (500ms setInterval, resolves `{done:true,payload}` on flag or `{done:false}` on timeout). 3 new tests (+1 installHooks.test.ts, +2 installSpawn.test.ts). `Cascades/Bridge/.gitkeep` created (Pattern 3: Working-Lab-Bridge-GitKeep-Placeholder-Preservation now deterministic). `Cascades/Cascade.template.json` created (cycle:0 / activeDiamond:null / colorSelectionComplete:false — fresh install template; S4 Band 4 copies as `Cascade.json`; live `Cascade.json` untouched). Fix 3: S4 Invariant 2 link (c) now states explicit abort-default (CD-26 doctrinal backing). Conductor.md S4 row refreshed (v1.0→v1.1). 4 patterns: UEIASEM, SSTD, WLBGPP, SCSBAH. CD-5 PASS (23rd consecutive). **~497 tests** · build tbd · `0.22.0 → 0.22.1` · Branch: `SCS-Bridge-Install`. State: TESTING-PENDING-AGGREGATE (bulk-smoke at B-7).

### 2026-05-07 (Diamond B-3)

**SCS Bridge Spawn Pipeline — Diamond B-3** — First src/ Diamond in the Bridge-Install series. New module `src/lib/bridge/installSpawn.ts` (135 lines): `cloneScsBridge` (shallow git clone, ENOENT distinction), `backupUserClaudeMd` (ONE-SHOT opaque read, no parsing), `assembleJoinedSuite8` (9-file concat → `/tmp/<temp-uuid>/joined-suite-8-scs-bridge.md`), `copyScsPromptTemplate`, `spawnInstallInstance`, `cleanupInstallTemp`, `runInstallSpawnPipeline` (try/catch cleanup on partial failure). New module `src/lib/bridge/installHooks.ts` (59 lines): `runRegisterInstallHook` + `runUserPromptSubmitInstallHook`. `src/commands/__hook.ts` extended with additive `register-install` + `user-prompt-submit-install` subcommands (existing `session-start`/`session-end` untouched — Diamond E preserved). `src/lib/bridge/spawnSettings.ts` additive `buildInstallSpawnSettings()` after line 56 (existing `buildSpawnSettings` unchanged). `src/lib/bridge/osTerminal.ts` `appendSystemPromptFile` threaded through all 4 platform builders (macOS osascript, Linux, Windows, WSL). Green 4-fix spec applied: ENOENT distinction, try/catch pipeline cleanup, debugPrefix propagation, WSL appendClause field. 4 new test files cover installSpawn + installHooks + __hook install subcommands. **494/494 tests** · build 92K · `0.21.1 → 0.22.0` · Suite 8 docs HELD at v6.1 (B-6 scope). CD-5 PASS (22nd consecutive, C-B3). CD-23/CD-24/CD-25 candidates carried. Branch: `SCS-Bridge-Install`. State: TESTING-PENDING-AGGREGATE (push HELD per Diamond B Master Plan bulk-smoke at B-7).

### 2026-05-07 (Diamond B-2)

**SCS Bridge Direct→Conductor + Strategy/ + SB-S39 REAL spec — Diamond B-2** — Suite 8 SCS Bridge upgraded from Direct config to Conductor config (additive-only; existing 38 skills unchanged). Added `Cascades/8_SUITES/SCS Bridge/Conductor.md` — install workflow orchestration document defining the six-phase Conductor Diameter (SCS Bridge × Diamond × Shatterite Tome). Added `Cascades/8_SUITES/SCS Bridge/Strategy/` directory with six passable Vermillion A-I plans: `S1-DetectCascadesPresence.md`, `S2-ConfirmInstallation.md`, `S3-CloneRepo.md`, `S4-ScaffoldCascadesDir.md`, `S5-ConvertClaudeMd.md`, `S6-CleanupTempDir.md`. SB-S39 Skill.md body promoted from STUB to REAL specification with full two-tier promotion note (spec-complete B-2 / src/-complete B-6). Instance.md + Skill.md versioned v6.0 → v6.1. **No src/ changes** — Pattern 4: Install-Phase-Decomposition-To-Bands (STRUCTURAL, Diamond B-2). CD-5 PASS (20th consecutive Diamond clean, C through B-2). `0.21.0 → 0.21.1` (patch — Suite 8 docs only). Branch: `SCS-Bridge-Install`. State: TESTING (push HELD per Diamond B Master Plan).

### 2026-05-07 (Diamond B-1)

**Cascades/ Detection + Conditional Top Menu — Diamond B-1** — First Diamond of the Bridge-Install feature arc (Diamond B series). New `SYNTHETIC_INSTALL = '__install__'` sentinel joins `SYNTHETIC_NEW` and `SYNTHETIC_CLOSE` (3 sentinels total). `animatedTui.ts` probes `existsSync(join(process.cwd(), 'Cascades'))` once at startup; result cached as `cascadesPresent: boolean` on `MenuState` (4th optional flag). When `false` (fresh project): HEAD renders Install row (Viridian color) above New Session; cursor defaults to `SYNTHETIC_INSTALL`. When `true` (existing user): behavior unchanged bit-for-bit. New `'install-selected'` KeyAction on Enter; stub dispatch handler emits `[scs] Install action — full implementation in Diamond B-6` to stderr. `formatInstall` helper mirrors `formatHead`/`formatTail` pattern. Pattern 4 preserved: `existsSync` metadata on user's own `process.cwd()` only. **SB-S39 STUB NEW**: Cascades-Presence-Driven Conditional Top Menu (stub) — 38 skills active · 457/457 tests · build 90 KB · `0.20.0 → 0.21.0` · Suite 8 docs v5.9 → v6.0. CD-5 PASS (19th consecutive Diamond clean, C through B-1). CD-23 candidate: *Conditional Bridge Bootmode Diameter* (bridge personality switches based on `Cascades/` presence at boot; future personalities compose into same Diameter; promotable post-user-Lambda smoke). Branch: `SCS-Bridge-Install`. State: TESTING (push HELD per Diamond B Master Plan).

