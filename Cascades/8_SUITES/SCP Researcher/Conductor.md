# SCP Researcher — Conductor (Suite 8 Type Meta-Maintainer)

**Suite 8**: SCP Researcher — Suite Cascade Protocol Type Definition
**Configuration**: Conductor
**Conductor Version**: 1.0
**Last Diamond**: SCP-4 (renamed SCP → SCP Researcher)
**Created**: SCP-3

---

## Conductor Role

The SCP Conductor orchestrates two distinct workflows:

1. **Type-level maintenance** — when a Diamond updates the SCP type spec itself (refining defaults, evolving the doctrine, adding modes). The Conductor here operates against `Cascades/8_SUITES/SCP Researcher/` (this directory).
2. **Instance lifecycle orchestration** — when a Diamond instantiates, evolves, or retires an SCP Suite 8 instance. The Conductor here operates against `Cascades/8_SUITES/<designation>/` (some user-named instance).

Both workflows compose the SCP Skills (SCP-S1..SCP-S8) into Vermillion Banded Plans dispatched by the Diamond.

---

## Type-Level Maintenance Pattern

When a maintenance Diamond targets the SCP type itself (e.g., refining mode-conditioned defaults, adding a new mode, updating identity-as-perimeter language):

```
<VermillionPlan topic="SCP Type · Maintenance · {motivation}">

Band 1 [R1 Red] (Tier 0): Curate current type spec — Instance.md + Skill.md + Templates state · enumerate proposed changes
Band 2 [R2 Orange] (Tier 0): Pearl-name the change · audit terminology consistency
Band 3 [R3 Yellow] (Tier 0): Plan edits — which file(s) · which sections · slot syntax considerations for templates
Band 5 [R5 Blue] (Tier 0): Execute edits · update Templates if needed · update Skill.md trajectory row
Band 6 [SCP-S5 Conference Decide]: Are there gaps in the skill register? Add new SCP-S{N} skill(s) if needed
Band 7 [R7 Fuchsia + SCP-S8]: Diagnose · update Onyx S8AT · update SUITE8-REGISTRY trajectory · checkpoint commit

</VermillionPlan>
```

Type-level maintenance does NOT alter existing instances retroactively. New defaults apply to instances created *after* the maintenance Diamond. Existing instances continue with their declared configuration unless explicitly migrated by a separate Diamond.

---

## Instance Lifecycle Patterns

### Pattern A · Instance Creation (Personal/Organizational/Project)

When a Diamond creates a new SCP S8 instance:

```
<VermillionPlan topic="SCP Instance Create · {designation} · {mode}">

Band 1 [R1 Red] (Tier 0): Validate inputs — designation availability · mode validity · transport binding pre-check
Band 2 [R2 Orange] (Tier 0): Pearl-name the instance — verify designation is verbose enough for its scope
Band 3 [R3 Yellow] (Tier 0): Plan the materialization — copy or reference for runtime · transport configuration · initial skill surface
Band 5 [R5 Blue + SCP-S1 + SCP-S2 + SCP-S3 + SCP-S4]:
  - SCP-S1 Designation Bind: clone Templates/{Instance,Skill}.md.template with slots filled
  - SCP-S2 Runtime Bind: copy or reference SCP/ runtime
  - SCP-S3 Transport Deploy: configure transport per mode default (or override)
  - SCP-S4 Skill Surface: declare initial muxonomyRegistry tool set
Band 6 [SCP-S5 Conference Decide]: Are mode-conditioned skill overrides needed for this instance?
Band 7 [R7 Fuchsia + SCP-S8]: Register in SUITE8-REGISTRY · update Onyx · checkpoint commit

</VermillionPlan>
```

**Concluders for instance creation**:
- `Cascades/8_SUITES/<designation>/Instance.md` exists with `Mode: <mode>` and slots filled
- `Cascades/8_SUITES/<designation>/Skill.md` exists with mode-default skill register
- Either `Cascades/8_SUITES/<designation>/SCP/` exists (copy mode) or `Runtime: <reference path>` declared (reference mode)
- Registry row in `Cascades/SUITE8-REGISTRY.md`
- (Deploy gate) Transport binds successfully in mode environment

### Pattern B · Instance Maintenance

When a Diamond updates an existing instance (skill surface change, transport reconfiguration, mode-conditioned override):

```
<VermillionPlan topic="SCP Instance Maintain · {designation}">

Band 1 [R1 Red] (Tier 0): Read current Instance.md + Skill.md + runtime state
Band 2 [R2 Orange] (Tier 0): Pearl-name the update
Band 3 [R3 Yellow] (Tier 0): Plan edits in scope of the instance only (no type-level changes)
Band 5 [R5 Blue]: Execute edits · respect SCP-S{N} composition order if multiple skills touched
Band 6 [SCP-S5 Conference Decide]: Skill currency review
Band 7 [R7 Fuchsia + SCP-S8]: Onyx update · registry trajectory update · checkpoint commit

</VermillionPlan>
```

### Pattern C · Instance Retirement (SCP-S7)

When an SCP S8 instance reaches end-of-life:

```
<VermillionPlan topic="SCP Instance Retire · {designation}">

Band 1 [R1 Red] (Tier 0): Audit dependencies — what is dispatched against this designation? Pre-retirement notice if Personal/Organizational; auto for Project
Band 2 [R2 Orange] (Tier 0): Pearl-name the retirement
Band 3 [R3 Yellow] (Tier 0): Plan retirement order — drain in-flight dispatches · release transport binding · archive runtime state (Personal/Organizational) or discard (Project)
Band 5 [R5 Blue + SCP-S7]:
  - Release transport binding
  - Inverse of SCP-S4 (deregister tools)
  - Inverse of SCP-S2 (remove runtime tree if copy mode; sever reference if reference mode)
  - Inverse of SCP-S1 (remove instance directory; remove registry row)
Band 7 [R7 Fuchsia + SCP-S8]: Onyx retirement entry · SUITE8-REGISTRY row removal · checkpoint commit

</VermillionPlan>
```

### Pattern E · Research-Target Adaptation (SCP-S9)

When a Diamond adapts an external research target into an existing SCP S8 instance — adding new Stratimux structures (Concept · Qualities · Principles · Strategies) into the instance's runtime tree:

This is the **canonical cross-Suite-8 muxification cascade**. The full Vermillion Banded Plan is extracted to a reusable Strategy file (the only Strategy file under SCP Researcher as of Diamond SCP-6):

> **Strategy**: `Cascades/8_SUITES/SCP Researcher/Strategy/SCP-Adapt.md`

The cascade composes three Suite 8s across Bands 0-7:

| Band | Role | Suite 8 |
|---|---|---|
| 0 | Base Absorb (target instance state) | SCP Researcher (in-context) |
| 1 | Curate target shape | SCP Researcher Band 1 (R1 Red) |
| 2 | Prospect research target verbosely | **Cadmium Researcher** dispatch |
| 3 | Architect Stratimux structures | **Stratimuxian Scholar** dispatch (S1+S2+S4+S10+S13) |
| 4 | Validate Stratimux discipline + SCP composition | SCP Researcher Band 4 (R4 Green) |
| 5 | Implement — write Stratimux files into runtime tree | SCP Researcher Band 5 (R5 Blue + SCP-S4 + SCP-S9 + SCP-S13 when addition_scope = new_concept) |
| 6 | Orchestrate + verify (typecheck gate) | SCP Researcher Band 6 (R6 Purple) |
| 7 | Diagnose + commit | SCP Researcher Band 7 (R7 Fuchsia + SCP-S8) |

**Reference Design**: `Cascades/8_SUITES/Teal Claude/Skills/S-SHATTERITE-MENU/SM-SCP-Adapt.md` renders the menu surface — Stages A1 (Target Intake) · A2 (Target Instance Selection) · A3 (Addition Scope) · A4 (Cascade Dispatch confirmation) · A5 (Adaptation Confirmation).

**Concluders for an adaptation**:
- Band 5: new Stratimux files exist at expected paths in target instance's `{{runtime_path}}/src/concepts/{{conceptName}}/`
- Band 6: `npm run typecheck` in runtime path returns exit 0
- Band 6: muxonomyRegistry includes new registrations (grep verifies)
- Band 7: Onyx G/L/M entry + git commit landed

**Anomaly routing** (per the Strategy file):
- Band 3 Stratimux-discipline failure → Stratimuxian Scholar refinement back into Band 3
- Band 4 SCP-composition failure → Validation rework
- Band 6 typecheck failure → Stratimuxian Scholar hot-fix or Band 5 implementation review

This pattern is the **backwards-compatibility bridge** between any pre-SCP research workflow and SCP S8 production — pre-SCP research methodology composes forward into operational SCP runtime extensions.

### Pattern F · AppKiller Doctrine — Monolith-Obsolescence Through Hyper-Personalization

**Pattern F is a doctrine, not a destructive cascade.** It names the architectural ramification of the SCP paradigm: when every user can have their own hyper-personalized SCP Suite 8 instance, the traditional "App-as-Monolith" concept becomes obsolete. There's no shared deployment to defend, no central endpoint to attack, no single surface to decommission — *because there is no single surface at all*. Each user's SCP S8 is unique to them, and the Suite 8 designation IS the access boundary.

The "Killer" in AppKiller is the *killer of the App-as-Monolith concept*, not of any specific application. Legacy applications are not destroyed by AppKiller; they are *cited* as Reference Designs and *adapted* into the SCP paradigm via Pattern E (SCP-Adapt). The legacy surface continues to exist as long as its operators choose to maintain it — but its role shifts from "the App" to "a Reference Design from which user-personalized SCP S8 instances generate their surfaces."

**Doctrinal points**:

1. **Legacy Apps ARE Reference Designs**. Adaptation is citation, not destruction. The Target persists; SCP-S10 produces a Markdown RD capturing the cite-able understanding; SCP-S9 generates Stratimux structures from the RD.

2. **The Monolith dissolves because each surface is unique**. Hyper-personalization through SCP S8 instances means every user materializes their own surface. The traditional architectural concern of "the App" — a shared deployment serving many users — has no analog. The Suite 8 designation IS the user-identity-bound perimeter.

3. **Identity-as-Perimeter is enabled by SCP-S8-as-singleton-per-user**. Conventional auth defends a shared surface against many users. The SCP S8 is not shared; there's nothing to authenticate against because there's nothing to access except the user's own Suite 8.

4. **AppKiller is not a destructive operation**. There is no separate cascade, slash command, or Strategy file for "killing an app." The operational pathway is Pattern E (SCP-Adapt) with the legacy app as Target. The user's hyper-personalized SCP S8 instance receives the adapted surface; the legacy app's operators decide independently when (or whether) to stop serving the legacy surface — that decision lives outside SCP's scope.

**Operational pathway** (for users who want to enter the SCP paradigm with a legacy app as their starting point):

```
Legacy app/repo/spec → Target for SCP-Adapt (Pattern E)
                    → RD-first: SCP-S10 produces Markdown RD citing the legacy
                    → SCP-S9 Bands 2-7: generate Stratimux structures from RD
                    → User's SCP S8 instance gains adapted surface
                    → Legacy surface continues to exist (operator decides its fate
                      independently; AppKiller doctrine takes no position on it)
```

**What Pattern F is NOT**:
- NOT a destructive cascade (no Strategy file at `Strategy/AppKiller-Decommission.md`; that file was created in the wrong-Diameter framing and removed during the AppKiller-Refining Diamond)
- NOT a separate menu (no `SM-AppKiller.md`; the SCP Menu's `[A]` Adapt option is the operational entry)
- NOT a separate slash command (no `/cascade:appkiller`; `/cascade:scp` → `[A]` is the canonical path)
- NOT in tension with maintaining a Reference Design (RDs are durable; never deleted at adaptation cycle close)

**What Pattern F IS**:
- A *doctrinal naming* of the SCP arc's ramification
- A cross-reference point: this section documents WHY the SCP paradigm enables identity-as-perimeter at scale
- A historical record of the SCP arc's closure (AppKiller Diamond = the arc's terminus; the doctrine is the arc's contribution)

**Cross-references**:
- Operational path: Pattern E (above) + `Strategy/SCP-Adapt.md`
- Identity-as-Perimeter foundation: `Instance.md` (the SCP S8 type spec's doctrine section)
- RD-first discipline: SCP-S10 in `Skill.md`
- Hyper-personalization: SCP-3 Three-Mode Membership (Personal mode is the canonical hyper-personalization form)

### Pattern G · ClientState Preservation Through the Perfect Circular Reference + Hard Turn Over Escape (SCP-S11)

**Pattern G governs the bridge-turnover lifecycle.** Every running SCP S8 instance supports two turnover modes:

#### G.1 · Soft Turnover (Default) — The Perfect Circular Reference

A touch to `.bridge-restart.json` (the file watched by `nodemon.json`) triggers the canonical restart sequence:

1. **Trigger**: `.bridge-restart.json` modified (timestamp · content payload · or empty write)
2. **Detect**: `nodemon` (watching `.bridge-restart.json`) detects change
3. **Kill**: `nodemon` `events.restart` hook runs `pkill -9 -f 'ts-node.*src/index'` — SIGKILL of the ts-node process tree
4. **Spawn**: nodemon spawns fresh `npx ts-node ./src/index.ts`
5. **Resume**: New server boots · `[Bridge Restart] Fresh process spawned` event · `Bridge Restart Manifold: READY` Concluder

**What survives** (the Perfect Circular Reference · Suite 2 **PCRSC**):

| Side | Persistence | Survives Soft? |
|---|---|---|
| Server (Huirth) `clientStates` cache (15-min TTL · in-process closure) | Ephemeral | NO — destroyed by SIGKILL |
| Server `stateBroadcast` `knownClientStates` closure | Ephemeral | NO — destroyed by SIGKILL |
| Client window (Vue · in-memory muxified concept state) | Ephemeral | YES (no reload) |
| Client IndexedDB (full `localStorage/` concept's `mappedStorage`) | Persistent | YES (independent of server) |
| Client `localStorage` (clientStateId · per `localStorageRegistration.principle.ts:52-58`) | Persistent | YES (the perimeter token) |

**The Circular Reference**: Server's ephemeral cache reconstructs from the client's persistent state on reconnect. Client's persistent state reconstructs from the server's reply on initial sync if the client's IndexedDB is empty (cold-start case). Each side bootstraps the other.

#### G.2 · Hard Turn Over — Soft-Lock Escape

Soft-locks occur when ClientState gets into a shape that turnover alone can't fix (schema drift · initial-sync guard deadlock · KSFR symptoms · `knownClientStates` desync). Hard Turn Over is the **targeted escape** — Suite 2 **SLHGCE** (Soft-Lock-Hydration-Gate-Clear-Escape) and **HTOSLE** (Hard-Turn-Over-As-Targeted-Soft-Lock-Escape-At-Hydration-Gate).

**Trigger** (Suite 2 recommended Option A — single-file convention preserved):

```json
// .bridge-restart.json
{"hard": true}
```

**Sequence** (planned · Next Macro Diamond implements):

1. nodemon detects file change · triggers restart as Soft (existing pathway)
2. **Pre-kill broadcast** (NEW · Suite 4 Severity-High fix): nodemon `events.restart` hook calls `curl http://localhost:7637/hardTurnOver` BEFORE SIGKILL · server-side handler reads `.bridge-restart.json` payload · if `{"hard": true}`, broadcasts `Web Socket Client Clear Persistent State` action to all connected clients via `appendActionQue` routing · `setTimeout(500ms, process.exit(0))` self-terminates after broadcast lands
3. Clients receive broadcast · invoke `localStorageHardClear` quality (NEW) · IndexedDB transaction-boundary wipe · client clears `clientStateId` (regenerates fresh on reconnect)
4. nodemon spawns fresh ts-node · server boots without client-state cache (clients have cleared theirs)
5. Clients reconnect with NEW `clientStateId` (Suite 2 **IAPTT** · perimeter rotated through turnover) · re-hydrate from empty · clean slate

**What gets cleared** (Hard mode only):
- Client IndexedDB (full `mappedStorage` wipe via transaction boundary)
- Client `localStorage` clientStateId (regenerated fresh)
- Server's old `clientStates` references (mooted by client regeneration)

**What's preserved across both modes**:
- The SCP S8 designation (the access perimeter · not touched by turnover)
- The runtime concept registry (`muxonomyRegistry.generated.ts` · server-side derived from code)
- Suite 2 **IAPTT**: Identity-As-Perimeter is maintained through both Soft and Hard — only the `clientStateId` rotates in Hard; the Suite 8 designation IS the access boundary and that doesn't turn over.

#### G.3 · Known Soft-Lock Failure Modes (Hard fixes; Soft does not)

| Mode | Source | Cite |
|---|---|---|
| Post-restart initial-sync deadlock — `isReconnecting && !hasReceivedServerState` guard at `webSocketClient.principle.ts:129-134` blocks initial sync when server has no stored state (every Soft turnover) | Suite 4 Edge | High severity · needs 2-second timeout fallback |
| Server quality removed; client cached actionQue references the missing quality | Suite 2 **SLSD** | Schema drift |
| Client IndexedDB schema bumped; old persisted state can't dehydrate cleanly | Suite 2 **SLSD** | Schema drift |
| `knownClientStates` closure desync in `stateBroadcast.principle.ts:19` after Soft restart | Suite 4 Edge K | Multi-window broadcast incorrect |
| KSFR — KeyedSelector function-reference loss at `localStorage.principle.ts:252-290` · root cause unresolved · Hard clears symptom but not cause | Suite 2 **KSFR** | Strategic deferral; documented anomaly |

#### G.4 · Implementation Refinements Required (Suite 4 REFINE Verdict)

Next Macro Diamond must address before code lands:

1. **Initial-sync timeout fallback** (Severity: High) — `webSocketClient.principle.ts:129-134` add 2-second timeout: if no `atomicStateUpdate` arrives, set `hasReceivedServerState=true` and proceed
2. **SIGKILL races Hard broadcast** (Severity: High) — replace nodemon-only restart with HTTP endpoint `/hardTurnOver` triggered by nodemon `events.restart` hook
3. **IndexedDB transaction boundary on clear** (Severity: Moderate) — `localStorageHardClear` quality must be an IndexedDB transaction; in-flight writes either complete or roll back

#### G.5 · Composition With Existing Concepts (Suite 4 Audit)

- `webSocketServer/qualities/deleteStaleClientState.quality.ts` — reused server-side for Hard mode broadcast
- `webSocketServer/qualities/unregisterClient.quality.ts` — reused for server cleanup
- `localStorage/qualities/cleanup.quality.ts` — needs `clearAll` parameter addition (current only removes expired)
- `webSocketClient/qualities/appendActionQue.ts` — standard routing channel for the broadcast
- `client/initialization.principle.ts` — fresh client init post-Hard-Turn-Over (same path as cold-start)
- `nodemon.json` — needs `events.restart` hook extension for the HTTP-curl broadcast trigger

#### G.6+ · Reserved Slots for Future Edge Findings

(Future Diamonds adding edge-case-driven refinements append here. The pattern is open-ended in this section; G.1-G.5 are the canonical scaffold.)

**Doctrine**: This is the cascade that completes the ClientState-as-perimeter story. The Identity-as-Perimeter doctrine (Pattern F · AppKiller) covers the access boundary; Pattern G covers the **state lifecycle** within that perimeter. Together they define how an SCP S8 instance lives through change — modify any aspect of the application while using it (Soft Turnover) · escape soft-locks when needed (Hard Turn Over) · the Suite 8 designation IS the perimeter throughout.

**Cross-references**:
- Skill: SCP-S11 in `Skill.md`
- User surface (placeholder · Next Macro implements): SM-SCP.md `[T]` Turnover option
- Runtime files: `SCP/nodemon.json` · `webSocketServer/` · `webSocketClient/` · `localStorage/`
- Naming source: Suite 2 Rust frontier-pattern document (`Cascades/Working/SUITE-2-RUST-CLIENTSTATE-PRESERVATION-NAMING.md`)
- Edge audit: Suite 4 Viridian (`Cascades/Working/SUITE-4-VIRIDIAN-CLIENTSTATE-BIDIRECTIONAL-EXAMINE.md`)
- Orchestration plan: Suite 6 Amethyst (`Cascades/Working/SUITE-6-AMETHYST-CLIENTSTATE-ORCHESTRATION.md`)

### Pattern D · Mode Migration (SCP-S6)

When an instance changes its mode (Personal → Organizational, Organizational → Project, etc.):

```
<VermillionPlan topic="SCP Instance Migrate · {designation} · {old_mode} → {new_mode}">

Band 1 [R1 Red] (Tier 0): Audit current state — what's bound to old_mode defaults that will need re-derivation
Band 2 [R2 Orange] (Tier 0): Pearl-name the migration · cite the motivation
Band 3 [R3 Yellow] (Tier 0): Plan migration — Instance.md Mode field · transport rebind · skill surface re-declare per new mode defaults · identity layer change
Band 4 [R4 Green] (Tier 0): Validate migration plan against the new mode's environment availability (e.g., Org SSO reachable for Personal→Organizational)
Band 5 [R5 Blue + SCP-S6]: Execute migration
Band 7 [R7 Fuchsia + SCP-S8]: Onyx migration entry · registry update · checkpoint commit

</VermillionPlan>
```

---

## Skills Registry

The SCP Researcher Skill register grew beyond the original `SCP-S1..SCP-S11` register in `Skill.md` with the addition of a `Skills/` subdirectory containing per-skill specifications. Skills carried by `Skills/` are dispatchable by Teal Claude Conductor on bridge-aware tasks and by any Diamond that needs the named capability.

### SCP-S12 · Bridge Communication (MCPL)

**File**: `Cascades/8_SUITES/SCP Researcher/Skills/Communication.md`
**Aspect**: Bridge discovery via `./Cascades/Bridge/bridge.json` (project-local · BJDP per SB-S30) · MCPL envelope format
**Dispatch trigger**: ClaudeCode session inside (or alongside) an installed SCP querying Bridge state — e.g., "What's the Bridge status?", "What SCPs are connected?", "Is `<scpName>` running?"
**Phase 1**: File-read only (`./Cascades/Bridge/bridge.json` project-local direct read · no HTTP · DO NOT probe `~/.scs-bridge/` — training-bias artifact). For fire-and-forget writes, BridgeMessageEnvelope file queue is the substrate.
**Phase 2 (future)**: HTTP POST to `endpoint` field when CRCEP (ClaudeCode-Request-Communication-Endpoint) is implemented.
**Cross-Suite invocation**: Teal Claude Conductor can dispatch this Skill via standard Suite 8 Maintenance Dispatch pattern when a Band requires bridge awareness.

**Origin**: Refinement Macro · REF-D2 · BJLM+SRSKD+MCPL · Cycle 113

### SCP-S13 · Concept Authoring on the Template SCP

**File**: `Cascades/8_SUITES/SCP Researcher/Skills/ConceptAuthoring.md`
**Aspect**: Hands-on Eight-Phase procedural walk-through for authoring a new Muxonomy-aware Concept in the Template SCP runtime, using the Notification Concept as the Hello World template (Copy-Paste-Plus · M63). Curriculum-grade: each Phase ends with a Concluder gate that must pass before proceeding (Pre-Authoring Study → Name/Scope → 7FG Skeleton → Principles → Bridge Model → Vue → Registry → Verification Gate).
**Dispatch trigger**: Any Diamond or Band that needs to add a new Concept to the Template SCP runtime — whether as standalone new feature or as part of an SCP-S9 adaptation cascade. Specifically: when `addition_scope = new_concept` in a Pattern E (SCP-Adapt) cascade.
**Cross-Suite dispatch**: Pattern E (Research-Target Adaptation) Band 5 invokes SCP-S13 when `addition_scope = new_concept`. The Stratimuxian Scholar (dispatched at Band 3 as S15 Muxonomy Concept Authoring Patterns) architects the types; SCP-S13 grounds the authoring into the Template SCP's specific runtime structure.
**Concluders**: TypeScript gate (`npm run typecheck` exit 0) · file structure grep (≥9 files including FNES-suffixed Diameter quality) · muxonomyRegistry grep (≥2 entries) · CISV variable suffix check · AESR type-string consistency across 3 declaration sites · optional bridge runtime routing test (Muxistration Proof).
**Pattern vocabulary**: 17 Rust pattern abbreviations preserved (FNES · CISV · DQWDS · DCQF · MSDT · AESR · ZKHP · GCRM · TOBM · DTEC · UPCT · RWCP · SCST · MCUC · VCIP · PACP · FKSD). 5 Viridian Hazards (H1-H5) surface as Anti-Patterns table with severity tags.

**Forward Diameter**: SCS-Bridge Mirror Concept (SBM Macro 2 Aspirant per Macro Diamond §13). The scsBridgeMirror Concept will be authored on the Template SCP side using this Skill as the authoring guide, applying M63 Copy-Paste-Plus from the Notification Concept. SAWSR substrate (BMTI/MASN/MTAM/SCSER/DCQI/CSEP/SSBM · M138-M143) provides the Bridge-side Diameter half — Mirror Concept's strategies are consumers, not re-implementations.

**Origin**: Notification-Manifold Formalization Macro · Phase 2 Ochre-C Final Draft · Phase 3 Cobalt-B build · Cycle 154

### SCP-S14 · Demometric Concept Pattern

**File**: `Cascades/8_SUITES/SCP Researcher/Skills/DemometricConceptPattern.md`
**Aspect**: Structural ground truth for the SCP runtime — DCFM dual/tri-face · WSDM · ClientToServer+CISV sharpest edge · dual-state · PCIP/TBAA/CIMB · FNES table · ECK ceiling · relay pattern · add-a-concept checklist
**Dispatch trigger**: Any Band needing the structural Why/What before authoring a Concept (SCP-S13 is the How; SCP-S14 is the What/Why — read S14 FIRST)
**Cross-Suite**: precedes SCP-S13 in the reading chain; cited by SCP-S15 (messaging qualities ARE Diameter qualities) and SCP-S16 (reading path Step 1)
**Origin**: SCP Researcher Full Suite Refinement · Cycle 172 · #592 (RM-D-Close)

### SCP-S15 · Messaging Mechanisms

**File**: `Cascades/8_SUITES/SCP Researcher/Skills/MessagingMechanisms.md`
**Aspect**: How a message moves from agent/client input through the running Claude process and back — SORD `《send_message》`/SMFT · BDAP/SSGH + 4 guardrails · permission means (RM-D3 ATID/PRMX/LTUT) · session rename (RM-D4 SCSLA/IDTND/DPCO) · PMA/PMA-NR (#596) · relay + MCP-Mediated-Single-Writer
**Dispatch trigger**: Any Band wiring message routing (SORD/BDAP/permission/rename) into a Concept; the write-path complement to SCP-S12's read-path
**Cross-Suite**: complements SCP-S12 (Direction A `/mcp` live status); cited by SCP-S16 (reading path Step 3)
**Origin**: SCP Researcher Full Suite Refinement · Cycle 172 · #592 (folds RM-D2 SORD/BDAP · RM-D3 permission · RM-D4 rename · #596 PMA)

### SCP-S16 · Contributor Onboarding

**File**: `Cascades/8_SUITES/SCP Researcher/Skills/ContributorOnboarding.md`
**Aspect**: No-RI outside contributor entry path — self-contained Architecture Primer (Huirth/Client split, Demometer/Diameter, Island-vs-Persistent, ECK 2-tier, single-writer, Verbose Split Naming) + linearized reading path (S16 → S14 → S13 → S15) + first-contribution walk-through
**Dispatch trigger**: A no-RI contributor arriving at the SCP runtime for the first time; OR an agent's Informative read phase before Pattern E/H authoring (skips Step 0, runs Steps 1-3 as Informative reads, Step 4 as Lambda)
**Cross-Suite**: routes to SCP-S14 (Step 1) and SCP-S15 (Step 3); the front door of the S16→S14→S13→S15 reading chain
**Origin**: SCP Researcher Full Suite Refinement · Cycle 172 · #592

### Pattern H · Messaging Wire-Through (RM-D2 SORD/BDAP)

**Pattern H is a doctrine pattern naming the SORD/BDAP messaging substrate as the write-path complement to Pattern E (Research-Target Adaptation).** Where Pattern E adapts external research targets into the SCP runtime's Concept tree, Pattern H names the canonical mechanism by which a running Claude session sends messages through the bridge to the SCP runtime and back.

**Substrate**: The `《send_message》` SORD envelope + SMFT (`sordEnvelope.model.ts`) + BDAP appended system prompt (Pattern H is enabled by the system-prompt directive) + Direction A HTTP POST to `deriveMcpEndpoint(endpoint)`. Lambda-proven in RM-D2 (Cycle 168): a session with the BDAP directive successfully POSTed to `endpoint + '/mcp'`.

**Doctrinal points**:
1. The SORD envelope IS the transport for Claude-session → Bridge messaging (Direction A). Never hand-form; always use `buildSordEnvelope()`.
2. The BDAP directive is collapse-resistant — it survives context compaction because it is in the system prompt, not a user turn. Edit the skeleton (`scs-bridge-base.skeleton.md`), never the generated file.
3. Pattern-4 invariant holds through Pattern H: the bridge never reads `~/.claude/`.

**Cross-reference**: SCP-S15 §1-§2 (SORD/BDAP detail) · SCP-S12 §4 Direction A (live status)

**Origin**: RM-D2 SORD/BDAP relay · Cycle 168

### Pattern I · Session Surface Means (RM-D3/D4)

**Pattern I is a doctrine pattern naming the permission-means + session-rename subsystem as the session-surface layer.** These subsystems complete the session-facing surface: permission-means controls how tool authorization reaches the user; rename controls how sessions acquire semantic identity.

**Substrate**: HTTP-hooks subsystem (`spawnSettings.ts` writing `spawn-settings.json` · `scpExpressTransport.principle.huirth.ts` hosting `/hooks/permission-request` + `/session/:id/permission-decision`) for permission means; `scsBridgeRenameSession.quality.huirth.ts` + `scsLabel` field (`types.ts:124-125`) for rename.

**Doctrinal points**:
1. Permission state is RELAYED FREE inside `scsBridgeSetSessionsListRelay` (field-agnostic) — no new relay quality is needed when adding a permission state field to `ScsBridgeSessionEntry`.
2. Rename writes `displayName`/`scsLabel` ONLY; the ULID is the routing key, never derived from a name (IDTND invariant).
3. Display-priority chain: `scsLabel?.trim() || displayName?.trim() || shortId(id)` (DPCO).
4. Pattern-4 invariant holds through Pattern I: permission decisions route through the bridge's own endpoints, never through `~/.claude/`.

**Cross-reference**: SCP-S15 §3-§4 (permission means + rename detail)

**Origin**: RM-D3 permission-means · RM-D4 session rename

---

## Strategy Reuse

`Strategy/` subdirectory contains the extracted Vermillion plan as of Diamond AppKiller (Refining):

- `Strategy/SCP-Adapt.md` — the cross-Suite-8 adaptation cascade (Pattern E · Diamond SCP-6 · refined for RD-first discipline at Diamond AppKiller-Refining) · composes Cadmium Researcher + Stratimuxian Scholar + SCP Researcher

Pattern F (AppKiller Doctrine) does NOT have a Strategy file — it is a doctrine, not a cascade. The operational pathway for legacy-app adaptation is Pattern E with the legacy app as Target.

Future Diamonds may extract additional patterns into Strategy files (Pattern A Instance Create remains inline; could be extracted if multiple Diamonds invoke it identically). The Strategy/ subdirectory follows the SCS Bridge precedent.

---

## Trajectory

| Date | Diamond | Pattern Touched | Note |
|---|---|---|---|
| 2026-05-10 | SCP-3 | (created) | All four patterns documented · no strategy files yet |
| 2026-05-10 | SCP-4 | (none — rename pass) | Suite 8 renamed SCP → SCP Researcher · path references updated · patterns unchanged |
| 2026-05-10 | SCP-5 | Pattern A (Instance Create) — operational primitive landed | `scs scp init` bridge subcommand wires Pattern A · `src/commands/scp/init.ts` implements the clone-and-rename · slot substitution + designation/mode validation · 42 new tests · doctrine and code now muxified |
| 2026-05-10 | SCP-6 | Pattern E (Research-Target Adaptation) NEW · Strategy/SCP-Adapt.md extracted | First cross-Suite-8 muxification cascade · composes Cadmium Researcher (Band 2) + Stratimuxian Scholar (Band 3) + SCP Researcher (Bands 0, 1, 4-7) · Reference Design SM-SCP-Adapt.md · `[A]` Adapt option added to SM-SCP top-level menu · doctrine-only · v0.38.1 patch |
| 2026-05-10 | AppKiller (Refining) | Pattern F refined: from cascade to DOCTRINE · Pattern E refined for RD-first | User-interrupt corrected wrong-Diameter framing. AppKiller is the *naming* of the SCP-paradigm ramification (Monolith-Obsolescence Through Hyper-Personalization · Legacy Apps ARE Reference Designs · the Suite 8 designation IS the perimeter because each surface is user-unique). Pruned: Strategy/AppKiller-Decommission.md · SM-AppKiller.md · /cascade:appkiller slash · prior SCP-S10/S11 destructive skills · `[K]` Kill option in SM-SCP. Refined: Pattern E SCP-Adapt with RD-first discipline at Band 1 (SCP-S10 Reference Design Generation · NEW · supersedes prior destructive S10/S11) · Target formal definition (URL · Screenshot · Repo · File · Text · Diamond Reference · anor-to combinations). v0.38.1 → v0.38.2 patch. |
| 2026-05-10 | Refine-Macro | Pattern G (ClientState Preservation + Hard Turn Over Escape) NEW · SCP-S11 NEW | Refining Diamond staging the Next Macro. Three-Suite parallel dispatch (R2 Rust + R4 Viridian + R6 Amethyst) at Tier 1 produced naming (10 patterns) + bidirectional examine (12 edges · REFINE verdict) + 13-step orchestration. Pattern G structured as G.1 Soft Turnover · G.2 Hard Turn Over · G.3 known failure modes · G.4 implementation refinements · G.5 existing-concept composition · G.6+ reserved edge slots. Hard Turn Over parameter: Option A (.bridge-restart.json `{"hard": true}`). Identity-As-Perimeter holds through turnover via Suite 2 **IAPTT**. Next Macro implements Pattern G's contract. v0.38.2 → v0.38.3 patch. |
| 2026-05-14 | REF-D2 (Bridge↔ClaudeCode Refinement) | SCP-S12 (Communication · MCPL · BJLM-aware) NEW · `Skills/` subdirectory introduced | Refinement Macro · Cycle 113 · Sub-Diamond 2 of 3. R3 Yellow Hybrid Decision (file-discovery PRIMARY · HTTP DEFERRED) landed `src/lib/bridge/bridgeMetadata.ts` (pure helper · writes `~/.scs-bridge/bridge.json`) · SCP-S12 Communication Skill defines MCPL envelope shape + 7-section bridge-read protocol · template `.claude/CLAUDE.md` references SCP-S12 so any ClaudeCode session opened from inside an installed SCP is bridge-aware. `Skills/` subdirectory established as Skill-spec home (Skill.md retains base register SCP-S1..SCP-S11 · Skills/ adds bridge-aware capabilities). Conductor SCP-S12 registry entry added above. Phase 2 (HTTP CRCEP) deferred — `endpoint` field forward-compat. |
| 2026-05-19 | Notification-Manifold-Formalization (Cycle 154) | Pattern E Band 5 annotated · SCP-S13 (Concept Authoring on the Template SCP · NEW) registry entry added | Phase 3 Cobalt-B build. SCP-S13 Skill landed at `Skills/ConceptAuthoring.md` (1160 lines · Eight-Phase procedural walk-through using Notification Concept as Hello World template per M63 Copy-Paste-Plus). Pattern E Band 5 updated: `R5 Blue + SCP-S4 + SCP-S9 + SCP-S13 when addition_scope = new_concept` — makes the implementation-guide routing explicit. 17 Rust pattern abbreviations carry the vocabulary (FNES · CISV · DQWDS · DCQF · MSDT · AESR · ZKHP · GCRM · TOBM · DTEC · UPCT · RWCP · SCST · MCUC · VCIP · PACP · FKSD); 5 Viridian Hazards (H1-H5) surface as Anti-Patterns. Bridge Model Phase 5 promoted from conditional to REQUIRED for Diameter Junction Qualities in Strategy context (per H2 non-negotiable). Forward Diameter to scsBridgeMirror Concept (SBM Macro 2 Aspirant) embedded as the SBM-D1 authoring substrate; SAWSR M138-M143 substrate catalog (BMTI/MASN/MTAM/SCSER/DCQI/CSEP/SSBM) referenced. Skill.md.template extended with light-touch pointer comment. Companion Scholar Skills S15 (architecture) + S16 (exemplar trace) compose with SCP-S13 (implementation) — bidirectional circular structural Diameter. |
