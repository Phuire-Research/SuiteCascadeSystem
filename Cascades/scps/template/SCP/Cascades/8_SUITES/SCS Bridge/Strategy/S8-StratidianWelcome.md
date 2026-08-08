> **RETARGETED (C784 · the Install BreakOut)**: the naming conference now fires at **Step 6**
> (the Suite 8 EMERGENCE — after the SCP is installed, booted, and focused), and the named
> Suite 8 is minted **IN THE INSTALLED SCP** via `POST /s8/create` (SCP-local · C724). On a
> blank slate this step is an OFFER the user may decline in favor of exploring the SCP —
> the Rotary-Nav mint remains available at any later moment.

# S8 — Stratidian Welcome (Initiation, not Drop-Off)

**Strategy**: Stratidian Welcome — Shatterite-driven Suite 8 naming, conditional multi-Suite branching, RI activation, Cinnabar engagement, First Diamond creation, memory-surfaced welcome menu
**Phase**: S8 (post-S7 muxification — runs after S7 has created the user-derived Suite 8 with default name)
**Conductor**: SCS Bridge Install Conductor
**Input**: result of S7 muxification (Suite 8 created with auto-name) · `Cascades/Iced/PreInstallSnapshot/{ts}/` · `~/.claude/projects/{encoded-cwd}/` memory probe · `package.json` · live CLAUDE.md (now SCS Manifold drop-in) · existing `Cascades/SUITE8-REGISTRY.md`
**Output**: renamed Suite 8 (per user choice) · optional Multi-Suite split · Onyx-Tier-1.md + Diamond-Tier-1.md + Cascade.json cycle 0→1 (RI activation) · Welcome menu rendered · `/scs-cascade` engagement (terminal · only on user-pick "Continue")

---

## CRITICAL OPERATING RULE — Shatterite Menus Are MANDATORY

**The install agent MUST surface user choice via AskUserQuestion at every Conference Band**. Do NOT auto-decide naming · do NOT auto-decide single-vs-multi branching · do NOT auto-engage `/scs-cascade` without user confirmation. The user's first interaction with the SCS Manifold is a series of agentive YESes — that property is structural, not aspirational. If a Band's Actionable says "render via Shatterite Tome Skill (AskUserQuestion)" then YOU MUST INVOKE AskUserQuestion. Skipping a Conference Band is a category error: it converts the user from Manifold member to hosted-tenant.

If for some reason AskUserQuestion is unavailable in your tool surface, halt with a clear message rather than auto-deciding silently.

---

## Pre-Band Welcome (Pewter HiFi · CD-105 PHSWO)

**FIRES BEFORE BAND 1**: install agent's first user-facing turn is a Pewter HiFi welcome (5-7 lines, framed in D5 closed-box border per Pewter Tessera tokens). This replaces what previously lived in the spawn priming string (now drastically shortened — Suite 7 Fuchsia B-25-UX-fix clinical resolution).

Welcome content (paste-ready · adapt to context):

```
┌─────────────────────────────────────────────────────────────┐
│  Welcome to SCS Bridge                                      │
│                                                             │
│  Your project is now a first-class Suite 8 within           │
│  the Stratidian Manifold. Nothing was overwritten.          │
│                                                             │
│  Next: name your Suite 8.                                   │
└─────────────────────────────────────────────────────────────┘
```

D1 token application: Cobalt for "Welcome to SCS Bridge" title accent · Viridian for "first-class Suite 8" highlight · Pewter neutral for body · Ochre for "Next:" directional cue. The welcome is the user's first introduction — keep it brief, warm, factual.

After the welcome, proceed to Band 1 immediately.

---

## Engagement Criteria

S8 fires automatically AFTER S7 emits the `s7-muxification-complete` signal at its Band 5 closeout. S7 no longer engages `/scs-cascade` directly — that role is owned by S8 Band 6 (and only when user explicitly picks Continue).

S8 is the **intelligence step** that elevates the install from mechanical task-execution to **Stratidian initiation**. Bridge has done its bounded work (filesystem scaffolding, snapshot, manifest); install agent has done muxification (S7); S8 owns the user-facing welcome arc:
1. User names the Suite 8 (replaces S7's auto-name with user-chosen name)
2. User decides Single vs Multi Suite 8 if router architecture detected
3. Memory probe classifies install as fresh-slate vs existing-project
4. Cinnabar Dialectic engaged for existing-project (optional · user-driven)
5. RI activated atomically (Onyx-Tier-1 + Diamond-Tier-1 + Cascade.json cycle 0→1)
6. Welcome menu rendered via Shatterite (`SM-WELCOME-RI-ENGAGE`)

---

## Vermillion Plan

```
<VermillionPlan topic="Stratidian Welcome — Suite 8 naming + branching + RI + Welcome">

Band 1 [R1 Red — Curate Naming Sources] (Tier 0):
  Informative: read package.json, CLAUDE.md (from PreInstallSnapshot since live is now SCS Manifold),
               detect project type via signals (tsconfig, pyproject.toml, Cargo.toml, dependencies)
  Actionable: invoke `generateNameSuggestions({userCwd, preInstallSnapshotDir})` from
              src/lib/bridge/projectNameSuggest.ts → 4-5 NameSuggestion[] objects
  Concluder: assert ≥1 suggestion returned (always-true via fallback "User Project Context")

Band 2 [R4 Green — Render Naming Menu] (Tier 0 · Conference):
  Informative: prepare SM-NAME-SUITE-8 menu data (suggestions + custom row + cancel)
  Actionable: render via Shatterite Tome Skill (AskUserQuestion) → user picks a name
              OR types custom OR cancels (cancel = keep S7's auto-name)
  Concluder: capture finalSuite8Name (string) from user response

Band 3 [R3 Yellow — Detect Router & Render Branch Menu] (Tier 0 · Conditional Conference):
  Informative: invoke `detectRouterPattern(preInstallSnapshotDir/.claude/CLAUDE.md OR /CLAUDE.md)`
               from src/lib/bridge/routerDetect.ts
  Actionable: IF isRouterPattern === true:
                render SM-MULTI-SUITE-BRANCH (Single | Multi(N) | Custom)
                IF user picks Multi(N): create N-1 additional Suite 8 directories
                  (the first Suite 8 already exists from S7 + Band 2 rename)
                IF user picks Single OR Custom: continue with single Suite 8
              ELSE (no router detected): skip menu · single Suite 8 confirmed
  Concluder: assert all created Suite 8 dirs have Instance.md present

Band 4 [R5 Blue — Memory Probe + Classify] (Tier 0):
  Informative: invoke `probeProjectMemory(userCwd)` from src/lib/bridge/memoryProbe.ts
  Actionable: classify install: 'existing-project' (sessionCount > 0) vs 'fresh-slate'
              capture latestMtime for menu header (formatLatestSessionAge)
  Concluder: log classification for downstream branching

Band 5 [R5 Blue — RI Activation (Atomic)] (Tier 0):
  Informative: synthesize First Diamond direction:
                - existing-project + Cinnabar engaged: cinnabarSummary from menu interaction
                - existing-project + Cinnabar skipped: cinnabarSummary = null (Pending state)
                - fresh-slate: diamondType = 'tutorial' (no Cinnabar)
  Actionable: invoke `activateRenewableIntelligence({userCwd, suite8Name, diamondType, cinnabarSummary})`
              from src/lib/bridge/riActivate.ts
              · writes ONYX-TIER-1.md + DIAMOND-TIER-1.md atomically · updates Cascade.json cycle 0→1
              · adds 'updated' manifest entry for Cascade.json (schema v3)
              · adds 'agent-derived' manifest entries for ONYX-TIER-1.md + DIAMOND-TIER-1.md
  Concluder: read-back all three files; assert Cascade.json cyclePosition.cycle === 1

Band 6 [R7 Fuchsia — SCP Continuation (AUTOMATIC · the Continuous Motion)] (Tier 0):
  Informative: the install is NOT done — the SCP install is the ASSUMED DEFAULT (SPP
               Steps 6-7 · see Conductor.md Stepped Progress Protocol). There is NO decision
               menu here; the welcome menu fires at the END (Band 7 BELOW · Step 8) after
               the user's SCP is live. (C852: the menu is RE-HOMED here — S10 was shed from
               this envelope at C787; its final-Band pointer was dangling.)
  Actionable: close Step 5 — report `✓ Step 5 of 8 — Suite 8 '{name}' named + Renewable
                Intelligence activated (cycle 1)`.
              Announce `▶ Step 6 of 8 — Installing your first SCP` and PROCEED DIRECTLY to
                S9-DomainPageCreate (the next strategy in THIS envelope). You are equipped
                to auto-install (the TUI wizard anor MCP launch_scp). The user may interrupt
                at any time — if they do, tell them the SCP can be installed later from the
                SCS-Bridge TUI menu (the backup path), then exit gracefully.
  Concluder: the agent does NOT terminate here — it continues into S9 and terminates only
             after Band 7 (the Step 8 welcome menu · below) executes

Band 7 [R4 Green — THE STEP-8 WELCOME MENU (Conference · fires AFTER S9 completes)] (Tier 0):
  Informative: the SCP is installed, BOOTED, and its Electron WINDOW is LIVE (the boot
               spawned it — the window IS the surface; the browser route is a pre-window
               fossil, RETIRED C852). Read `Cascades/Bridge/bridge.json` for the bridge
               `port` and the installed SCP's name (the MCPL bridge-read pattern).
  Actionable: render the FIRST CHOICE via AskUserQuestion (MANDATORY · the Critical
              Operating Rule) with EXACTLY these options:
              1. **Focus your {ScpName} SCP** — "Your {ScpName} window is live — bring it
                 forward and explore the Rotary Nav (mint a Suite 8 there anytime)."
                 On pick: POST the bridge MCP focus —
                 `curl -s -X POST http://127.0.0.1:{port}/mcp -H 'Content-Type: application/json' \
                   -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"scs_focus_bridge_window","arguments":{"scpName":"{ScpName}"}}}'`
                 (the same verb the SCP page's own Focus button rides).
              2. **Start First Diamond** — begin the first Cascade cycle (Length 1-3).
              3. **Cinnabar Dialectic** — the short reflective dialectic (existing-project).
              4. **Done for now** — close out; everything is in place; re-engage via `scs`.
  Concluder: the user's pick executed · the agent terminates AFTER this menu resolves —
             this Band is the envelope's LAST act (Step 8 of 8)

</VermillionPlan>
```

---

## Conditional Branching Logic

```
[S7 done] → S8 fires
              │
              ▼
         Band 1: gather signals (package.json + CLAUDE.md + project type)
              │
              ▼
         Band 2: render SM-NAME-SUITE-8 menu
              │ (user picks name or keeps S7 auto-name)
              ▼
         Band 3: detectRouterPattern(snapshot CLAUDE.md)
              │
              ▼
         ┌────┴────┐
       isRouter? ──Yes──> SM-MULTI-SUITE-BRANCH menu
         │                  │
         No                 ┌─Single─┐  ┌─Multi(N)─┐  ┌─Custom─┐
         │                  │        │  │          │  │        │
         │                  └────────┴──┴──────────┴──┴────────┘
         ▼                                  │
         (single Suite 8 confirmed)         ▼
         │                          (N Suite 8s created)
         └──────────────┬───────────────────┘
                        ▼
               Band 4: probeProjectMemory(userCwd)
                        │
                        ▼
                   ┌────┴────┐
                 sessionCount > 0?
                   │         │
                  Yes        No
                   │         │
                   ▼         ▼
        existing-project   fresh-slate
                   │         │
                   ▼         │
              SM-WELCOME-    │
              RI-ENGAGE      │
              shows [D]      │
              Cinnabar opt   │
                   │         │
                   └─────┬───┘
                         ▼
              Band 5: activateRenewableIntelligence
              (Onyx + Diamond + Cascade.json atomic)
                         │
                         ▼
              Band 6: AUTOMATIC SCP Continuation (SPP · NO menu here)
              close Step 5 → announce Step 6 → PROCEED to S9 → return to S8 Band 7
              (the welcome menu fires LAST as Step 8 · S8's OWN final Band · C852:
               [F] Focus your SCP (MCP scs_focus_bridge_window) · [D] First Diamond ·
               [C] Cinnabar · [Q] Done — the browser route RETIRED)
```

---

## Invariants

- **User-driven naming**: Suite 8 name comes from user pick OR explicit acceptance of auto-name. NEVER auto-named without surface.
- **User-driven multi-Suite**: agent NEVER auto-splits, even when all 3 router gates fire. SM-MULTI-SUITE-BRANCH is advisory.
- **Snapshot source for content reads**: S8 reads CLAUDE.md from `Cascades/Iced/PreInstallSnapshot/{ts}/` (not live `.claude/CLAUDE.md` which is now SCS Manifold).
- **Pattern 4 boundary**: memory probe is metadata-only (file count + mtime). NEVER opens JSONL contents. Allowed at install agent level (agent IS Claude · within Claude awareness).
- **RI atomicity**: all-or-none — Onyx + Diamond + Cascade.json must succeed together or rollback prior writes.
- **Manifest tracking**: every file write records a ManifestFileEntry — `'agent-derived'` for new files, `'updated'` for Cascade.json cycle change.
- **Cinnabar engagement is optional**: user picks [D] to engage; default skips. Dialectic-only mode (2 questions, ~500-1500 tokens) NEVER full session-analysis.
- **Terminal `/scs-cascade`**: engaged only when user explicitly picks Continue. Slash-command timing race eliminated structurally.
- **Existing Suite 8 collision**: if `Cascades/8_SUITES/{name}/` already exists from prior install, naming menu shows existing names dimmed; user picks suffix `-2` or different name.
- **Three-exit-path preserved**: all new artifacts (ONYX, DIAMOND, multi-Suite-8 dirs) inside `Cascades/` → deletable as one unit via `rm -rf Cascades/`.

---

## Pearl

**Stratidian Welcome As First-Class Manifold Membership**.

S7 muxified the user's CLAUDE.md content into a Suite 8 (mechanical · the deposit). S8 makes the user a Manifold member: their Suite 8 is named with their agency, their project's structure is honored (router or single), their memory of prior work surfaces in the welcome, their first Diamond opens with Cinnabar-derived direction (if they have history) or Tutorial framing (if they don't), and their `/scs-cascade` engagement is volitional — never imposed. The install agent is not a depositor; it is a host. The user is not a hosted-tenant; they are a Manifold member with agency at every choice point.
