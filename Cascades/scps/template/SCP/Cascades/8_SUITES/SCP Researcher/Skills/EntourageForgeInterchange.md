# SCP-S22 · The Entourage Forge Interchange (the Suite-8-Specific Load)

*Skill added: 1.157.0 · C1166 — the Diametric Skill to the Entourage Forge, the Suite 8 that creates, updates, and syncs Suite 8 pages on this SCP.*

**What this Skill carries**: the protocol by which the SCP Researcher answers a question that is *Suite-8-specific* — how a page is minted, how an existing page is raised to the current Suite 8 Page System, how a page's locality record (the Sync Library) is accounted — by loading the Entourage Forge's own documentation inline and adapting it freely into the session. The Forge holds no `Skills/` stratum: its documentation IS its operating procedure (each door is an executable Strategy), which is why that documentation bears the strength of using the system. The Researcher does not paraphrase the Forge; it runs the Forge's own reading in its own frame and reports what the running SCP shows.

---

## Curation
The SCP paradigm enables two Suite 8s designed to interact on Suite 8 matters — this Researcher (the SCP's live documentation) and the Entourage Forge (the conductor of Suite 8 creation) — so that a Suite-8-specific ask is answered from the Forge's conduction as it stands on THIS SCP: the Forge's `Instance.md` (its Five Skill Signatures F1-F5 and its Router of three Strategies), its `Conductor.md` (the Band assignments), and the Strategy the ask names — `Strategy/EF-S1-Creation-Conduction.md` (mint → domain-bearing Suite 8), `Strategy/EF-S1-S8-Page-Update.md` (an existing page raised to the current standard), `Strategy/EF-S2-Sync-Library.md` (the per-designation locality record). What the Forge's documents describe is what the Forge's anchor will DO, so reading them is reading the mechanism.

## Research
The read is of DOCUMENTS first, then of the surfaces those documents name — all under the ASSOCIATED SCP's root (`<SCP>` = the directory `scp.config.json` sits in):

1. Presence anor freshness of the Forge's seat: `test -f "<SCP>/Cascades/8_SUITES/Entourage Forge/Instance.md"` · `Conductor.md` · `Strategy/EF-S1-Creation-Conduction.md` · `Strategy/EF-S1-S8-Page-Update.md` · `Strategy/EF-S2-Sync-Library.md`. Freshness Concluder: `cmp` each against the template's copy under `Cascades/scps/template/SCP/Cascades/8_SUITES/Entourage Forge/` when the template is present — a differing Strategy means this SCP's Forge has moved (or lagged); report which, never assume the template's text.
2. THE LOAD: read the Forge's `Instance.md` and the ask's Strategy whole into the frame (the inline `routing="interchange"` variant of CLAUDE.md §3). Hold them beside this Researcher's own Terminal-Perimeter Muxonomy; the Forge's F4 Architecture Grounding names the same inline pair-read from its side — the two Suite 8s meet in the middle.
3. The live surfaces the Strategies name, read on THIS SCP: the Suite 8 Page System version `grep -n 'S8_PAGE_COUNTER' <SCP>/src/concepts/suite8/suite8.type.ts` against the installed bridge's `scsMuxameter.s8` (the S8 Page Update fires when the installed counter exceeds a page's own); a page's own stratum `ls <SCP>/Cascades/Extended/<designation>/` (`S8.json` · `Cascade.json` · `menu.json` · `SyncLibrary.json` when the Sync Library governs it) and its identity seat `ls <SCP>/Cascades/8_SUITES/<designation>/`; the minted concept `ls <SCP>/src/concepts/<designationCamel>/`; the registry `grep -n '<designation>' <SCP>/Cascades/SUITE8-REGISTRY.md` where the SCP carries one.
4. TRUNCATE the loaded Forge frame after the answer forms — the Forge's documents are adapted into the session for the ask, never annexed into the Researcher's identity.

## Return
- Sentence: the Suite-8 fact the ask needed (a page's current S8 version · whether an update is owed · where its locality record sits), cited to the Forge document section AND the live read.
- Section: the Sentence + the Strategy that governs the motion + the live state of the surfaces it names + the freshness verdict on the Forge's seat.
- Vermillion: the Forge's Strategy re-cast as Bands for THIS page — "mint X", "raise page Y to the current standard", "account Z's locality" — each Band citing the Strategy step it runs and the read that verifies it; the Forge's anchor (or the user) executes it.
- Diamond: a change to the Forge's conduction itself or to this interchange — returned INLINE with the founding offer (`Instance.md` §B); never written into an unfounded seat.

---

## The depth discriminant (when this fires — NOT SCP-S21, NOT SCP-S12)

| Question class | Depth | Routes to |
|---|---|---|
| "Is the bridge running? What SCPs are live?" | reads the bridge's **output** (`bridge.json`) | **SCP-S12 · Communication** |
| "How does the bridge compose sessions and lifecycles?" | reasons INSIDE the Bridge's **composition** | **SCP-S21 · Bridge-Architecture Interchange** |
| "How is a Suite 8 page minted · updated to the current page system · synced across SCPs? What version is this page? Where is its locality record?" | reasons INSIDE the Forge's **conduction** — a Suite-8-specific motion on this SCP | **SCP-S22 · this protocol** |

The discriminant: *is the ask about a Suite 8 page's creation, update, or locality?* If so, the Forge's documentation is the mechanism, and this Skill loads it.

---

## Why the Forge's documentation bears the strength of using the system

The Forge's three doors are Strategies, not descriptions: `EF-S1-Creation-Conduction.md` is the executable Banded Vermillion the Forge anchor runs from mint to hand-off; `EF-S1-S8-Page-Update.md` is the doctrine an update anchor follows to raise a page; `EF-S2-Sync-Library.md` is the doctrine every locality motion obeys. A Researcher that loads them is loading the procedure the system actually performs — so its answer about a Suite 8 page is the same answer the Forge would enact. That is the Diameter: the Researcher's documentation of the SCP and the Forge's conduction of its Suite 8s are one knowledge seen from two sides, and this Skill is the door between them.
