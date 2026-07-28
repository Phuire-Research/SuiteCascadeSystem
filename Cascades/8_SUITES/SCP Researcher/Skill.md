# SCP Researcher — Skills (Suite 8 Type · Base Register)

**Suite 8**: SCP Researcher — Suite Cascade Protocol Type Definition
**Configuration**: Conductor
**Skills**: SCP-S1 through SCP-S8 (initial register · grows per maintenance cycle · skill identifiers retain the `SCP-S{N}` prefix since they describe SCP protocol operations, not the meta-Suite-8 itself)
**Version**: 1.0
**Last Diamond**: SCP-4 (renamed SCP → SCP Researcher)
**Created**: SCP-3

---

## Skill Register

The base skills below are inherited by every instantiated SCP Suite 8 (Personal / Organizational / Project). An instance may override specific skills with mode-conditioned variants by editing its own `Skill.md` after clone-init; defaults are these.

### SCP-S1 · Designation Bind

**Aspect**: Identity establishment
**Function**: Bind a user-chosen designation + mode to a fresh SCP Suite 8 directory. The designation becomes the Suite 8 name; the mode (Personal / Organizational / Project) configures defaults.

**Inputs**:
- `designation` — user-chosen name (alphanumeric + hyphen, valid as a directory name)
- `mode` — one of `Personal` / `Organizational` / `Project`
- `transport` — optional; defaults per mode (Personal → local socket, Organizational → org-network, Project → CI-bound)

**Outputs**:
- `Cascades/8_SUITES/<designation>/Instance.md` (cloned from `Cascades/8_SUITES/SCP Researcher/Templates/Instance.md.template` with slots filled)
- `Cascades/8_SUITES/<designation>/Skill.md` (cloned from skill template with slots filled)
- Registry row added to `Cascades/SUITE8-REGISTRY.md`

**Concluder**: `test -f Cascades/8_SUITES/<designation>/Instance.md` returns true; `grep <designation> Cascades/SUITE8-REGISTRY.md` returns the new row.

### SCP-S2 · Runtime Bind

**Aspect**: Runtime composition
**Function**: Compose the SCP runtime template (`SCP/` at repo root) into the Suite 8 instance's deployable artifact. Two modes — copy (instance owns its runtime) or reference (instance points at the shared template; deploy script materializes a copy at deploy time).

**Decision (default)**: Reference mode for first-instance templates (saves disk; the runtime is identical across modes anyway). Copy mode is opted-in when an instance needs runtime divergence.

**Concluder**: Either `Cascades/8_SUITES/<designation>/SCP/` exists with the runtime tree (copy mode), OR `Cascades/8_SUITES/<designation>/Instance.md` declares `Runtime: ../../scps/template/SCP/` reference (reference mode).

### SCP-S3 · Transport Deploy

**Aspect**: Transport selection + binding
**Function**: Configure the SCP S8's transport — Express HTTP, WebSocket, stdio (for MCP-direct binding), or hybrid. Default per mode:

| Mode | Default Transport | Default Binding |
|---|---|---|
| Personal | WebSocket + Express HTTP | localhost:7111 |
| Organizational | WebSocket + Express HTTP behind org reverse proxy | org-internal hostname |
| Project | stdio (CI invocation pattern) | spawned per CI run |

**Concluder**: Transport configuration declared in instance `Instance.md` Identity Configuration section.

### SCP-S4 · Skill Surface

**Aspect**: Tool registration
**Function**: Declare which Stratimux qualities (from the runtime's `scp` concept and any user-added concepts) become MCP tools for this SCP S8 instance. Uses `muxonomyRegistry.generated.ts` and `scpToolMetadata` per quality (per the runtime's existing pattern).

**Concluder**: Instance's `muxonomyRegistry.generated.ts` lists the intended tools; `scpRegisterToolsWithMetadata.quality.huirth.ts` execution registers them at runtime.

### SCP-S5 · Conference Maintenance

**Aspect**: Self-maintenance per dispatch
**Function**: Every dispatch to an SCP S8 instance includes a Conference Decide block evaluating Skill currency. Stale skills updated; gaps become new skills. (Per CLAUDE.md §9 Suite 8 Maintenance Dispatch standard.)

**Concluder**: Onyx S8AT entry per dispatch confirms Conference fired.

### SCP-S6 · Mode Migration

**Aspect**: Cross-mode evolution
**Function**: Change an SCP S8's mode (Personal → Organizational, etc.). Rare but supported — for example, a Personal SCP S8 graduating to Organizational when a team adopts the user's tooling.

**Pattern**: Update Instance.md `Mode` field · re-derive defaults · update transport binding · update registry row · run integration test in target mode environment.

**Concluder**: Mode field declares the new mode; transport reachable in target mode environment.

### SCP-S7 · Designation Retire

**Aspect**: Decommission
**Function**: Retire an SCP S8 designation. Removes the Suite 8 directory, removes the registry row, releases the transport binding. Inverse of SCP-S1 + SCP-S3.

**Mode-specific**:
- Personal: user-initiated; archive option for the runtime state
- Organizational: org-admin-initiated; data-export gate before removal
- Project: automatic on project decommission; data-discard is the default

**Concluder**: `Cascades/8_SUITES/<designation>/` removed; registry row removed; transport binding released.

### SCP-S8 · S8AT (Suite 8 Aspect Trajectory)

**Aspect**: Onyx authoritative trajectory tracking
**Function**: Per CLAUDE.md §9 Fuchsia S8AT pattern — Onyx authoritative, Memory derived. Every maintenance Diamond on the SCP type or on an instance updates the trajectory entry in `Cascades/SUITE8-REGISTRY.md` and (for instance Diamonds) in the instance's own Onyx-Tier-N.

**Concluder**: SUITE8-REGISTRY trajectory column reflects most recent diamond; Onyx S8AT entry exists.

### SCP-S11 · Bridge Turnover · ClientState Lifecycle

**Aspect**: Bridge-restart lifecycle with ClientState preservation invariant (default Soft) + Hard escape for soft-locks
**Function**: Govern the SCP runtime's bridge-turnover semantics. The runtime supports two turnover modes:

- **Soft Turnover (default)**: Touching `.bridge-restart.json` triggers nodemon → SIGKILL of ts-node process tree → fresh ts-node spawn. The **Perfect Circular Reference** between server and client preserves ClientState: server's in-process `clientStates` cache (15-min TTL · ephemeral) is reconstructed from the client's persistent IndexedDB on reconnect; client's persistent state survives the server kill entirely. The client window does NOT reload — only the server respawns. Pattern named: **BRTSP** (Bridge-Restart-Triggered-Client-State-Preservation · Suite 2 Rust).

- **Hard Turn Over**: Same trigger augmented with `{"hard": true}` payload in `.bridge-restart.json` (Suite 2's recommended Option A). Server reads the flag on startup → broadcasts `Web Socket Client Clear Persistent State` to all reconnecting clients via the standard `appendActionQue` routing → clients invoke their `localStorageHardClear` quality (NEW · planned by Next Macro) before re-hydrating. Targets the hydration gate specifically (per Suite 2's **SLHGCE** · Soft-Lock-Hydration-Gate-Clear-Escape) — not a generic storage wipe.

**Inputs**:
- `mode` — `Soft` (default) or `Hard`
- `trigger` — file touch to `.bridge-restart.json` (Soft) or payload `{"hard": true}` (Hard)
- `target_instance` — implicit (the running SCP S8 instance)

**Outputs**:
- Soft mode: server respawned · client reconnects · ClientState preserved · `[Bridge Restart] Fresh process spawned` Lambda-event logged · `Bridge Restart Manifold: READY` Concluder
- Hard mode: server respawned · clients clear IndexedDB before re-hydrating · ClientState reset to clean slate · soft-lock cleared

**Concluder**:
- Soft: nodemon log shows restart cycle · client receives `webSocketClientAtomicStateUpdate` with stored state from server cache (if cache window still open) · `hasReceivedServerState=true` on client · no manual page reload required
- Hard: clients confirm clear via ack message · re-hydration begins from clean state · subsequent initial sync proceeds without soft-lock symptom

**Known Soft-Lock Failure Modes** (per Suite 4 Viridian + Suite 2 Rust audit · drives the Hard Turn Over need):

| Failure Mode | Source | Symptom | Soft fixes? | Hard fixes? |
|---|---|---|---|---|
| Post-restart initial-sync deadlock (`isReconnecting && !hasReceivedServerState` guard at `webSocketClient.principle.ts:129-134` blocks initial sync when server has no stored state) | Suite 4 Edge | Client appears connected but state never reconciles · multi-window sync broken | NO | YES |
| Schema drift — server quality removed; client cached actionQue references it (Suite 2 **SLSD**) | Schema mismatch | Client dispatch fails silently or routes to nowhere | NO | YES |
| Client IndexedDB schema bumped; old persisted state can't dehydrate into new shape | Suite 2 **SLSD** | Hydration fails; client never reaches operational state | NO | YES |
| `knownClientStates` closure desync in `stateBroadcast.principle.ts:19` after restart | Suite 4 Edge K | Multi-window state-broadcast deltas incorrect | NO | YES |

**Implementation Refinements Required** (Suite 4 Viridian REFINE verdict · Next Macro must address):

1. **Initial-sync timeout fallback** (Severity: High) — `webSocketClient.principle.ts:129-134` add 2-second timeout: if no `atomicStateUpdate` arrives, set `hasReceivedServerState=true` and proceed. Prevents Soft turnover soft-lock.
2. **SIGKILL races Hard broadcast** (Severity: High) — `nodemon.json` SIGKILL gives no window for the server to broadcast hard-clear before death. Solution: HTTP endpoint `/hardTurnOver` triggered by nodemon `events.restart` hook → broadcast → `setTimeout(500ms, process.exit(0))`. Server self-terminates after broadcast lands.
3. **IndexedDB write race at clear time** (Severity: Moderate) — Hard clear must be a transaction boundary; in-flight writes either complete or get rolled back, never land after clear.

**Composition Notes**:
- SCP-S11 is the **first skill that touches runtime behavior** in the SCP runtime (vs. SCP-S1..SCP-S10 which are doctrinal/metadata primitives). Composing requires reading `webSocketServer/` + `webSocketClient/` + `localStorage/` concept layers.
- Composes with existing primitives: `deleteStaleClientState.quality.ts` (server-side · Hard mode invokes for all clients) · `unregisterClient.quality.ts` (server cleanup) · `cleanup.quality.ts` (client localStorage cleanup — needs `clearAll` parameter addition per Suite 4 finding #4) · `appendActionQue` (standard routing channel for the broadcast)
- Two NEW qualities required (Next Macro implements): `webSocketServerHardTurnOverBroadcast` (iterates `clientStates`, dispatches clear to each) + `webSocketClientHardTurnOverClear` (client receives broadcast) + `localStorageHardClear` (client unconditional wipe with transaction boundary)
- `clientStateId` IS the perimeter token that survives Soft and resets in Hard (Suite 2 **IAPTT** · Identity-As-Perimeter-Maintained-Through-Turnover)

**Cross-references**:
- Doctrine: Pattern G in `Conductor.md` · "ClientState-Preservation Through the Perfect Circular Reference" section in `Instance.md`
- Naming source: Suite 2 Rust frontier-pattern document (10 patterns named · CD-5 clean)
- Bidirectional examine: Suite 4 Viridian (12 edges · REFINE verdict)
- Orchestration plan: Suite 6 Amethyst 13-step sequence map
- Runtime surfaces touched: `SCP/src/concepts/webSocketServer/` · `webSocketClient/` · `localStorage/` · `nodemon.json`
- User surface (after Next Macro implements): `SM-SCP.md` `[T]` Turnover option

### SCP-S10 · Reference Design Generation

**Aspect**: RD-first discipline for adaptation cascades
**Function**: Before any Stratimux generation begins (SCP-S9 Band 3 onward), produce a Markdown Reference Design that cites the Target with full provenance. The RD is the cite-able, archivable, durable artifact; subsequent Bands generate from the RD while still able to reference the Target. Targets are multi-modal — URL · Screenshot · Repo · File · Text · Diamond Reference · `anor-to` combinations. The RD captures the cite-able understanding at adaptation time and persists if the Target later changes.

**Inputs**:
- `target` — multi-modal · anor-to combination (URL · Screenshot · Repo · File · Text · Diamond Reference)
- `designation` — target SCP S8 instance (RDs land under that instance's `References/` directory) OR project scope (`Cascades/Documentation/References/`)
- `rd_name` — kebab-case descriptive RD identifier (e.g., `slack-notifications-api-rd`)

**Outputs**:
- `Cascades/8_SUITES/{{designation}}/References/{{rd_name}}.md` (instance-scoped) OR `Cascades/Documentation/References/{{rd_name}}.md` (project-scoped)
- RD MUST contain: (a) Target citation with full provenance · (b) Target shape inventory · (c) Proposed SCP runtime addition · (d) Pruning notes for lossy elements
- RD becomes input to SCP-S9 Band 2 (Cadmium augmentation) and Band 3 (Stratimuxian Scholar generation)

**Concluder**:
- `test -f {{rd_path}}` returns ok
- RD contains explicit citation block (URL + retrieved-at · file + hash · commit SHA · screenshot link · etc., per modality present)
- RD's "Proposed SCP runtime addition" section maps cleanly to one or more SCP-S9-implementable concepts/qualities/principles/strategies

**Doctrine note (AppKiller)**: SCP-S10 is the *operational primitive* that makes the AppKiller doctrine workable. Legacy hosted apps become Reference Designs — they don't get destroyed, they get cited. Each user's hyper-personalized SCP S8 generates its own surface from RDs; the monolith dissolves because each surface is unique. See `Conductor.md` Pattern F (AppKiller Doctrine) and `Instance.md` Identity-as-Perimeter section.

**Cross-references**:
- Invoked by SCP-S9 Band 1
- Strategy: `Strategy/SCP-Adapt.md` Band 1 detailed spec
- Doctrine: `Conductor.md` Pattern F · `Instance.md` Identity-as-Perimeter

### SCP-S13 · Concept Authoring on the Template SCP

**Aspect**: Agent-actionable curriculum for authoring a new Muxonomy-aware Concept in the Template SCP runtime, using the Notification Concept as the Hello World template (Copy-Paste-Plus · M63)
**File**: `Cascades/8_SUITES/SCP Researcher/Skills/ConceptAuthoring.md`

### SCP-S14 · Demometric Concept Pattern

**Aspect**: Structural ground truth for what a Concept IS in the SCP runtime before you author one — DCFM dual/tri-face · WSDM · ClientToServer+CISV sharpest edge · dual-state · PCIP/TBAA/CIMB · FNES table · ECK ceiling · relay pattern · add-a-concept checklist
**File**: `Cascades/8_SUITES/SCP Researcher/Skills/DemometricConceptPattern.md`
**Function**: The What/Why counterpart to SCP-S13's How. A contributor who reads S14 before S13 understands the structural model; a contributor who skips S14 will place a ClientToServer Induction in the wrong file and get silent routing failure. Read S14 FIRST.
**Cross-references**: bidirectional Diameter with SCP-S13 (S14 = What/Why ↔ S13 = How); cited by SCP-S15 (messaging qualities ARE Diameter qualities); cited by SCP-S16 (reading path Step 1)

### SCP-S15 · Messaging Mechanisms

**Aspect**: How a message moves from agent/client input through the running Claude process and back — write-path complement to SCP-S12's read-path
**File**: `Cascades/8_SUITES/SCP Researcher/Skills/MessagingMechanisms.md`
**Function**: SORD `《send_message》` envelope + SMFT model · BDAP/SSGH static-skeleton + generated-instance + 4 guardrails · permission means RM-D3 (ATID/PRMX/LTUT) · session rename RM-D4 (SCSLA/IDTND/DPCO) · PMA/PMA-NR Display-vs-Data (#596) · relay + MCP-Mediated-Single-Writer. Folds all RM-D2/D3/D4 and #596 substrate into one contributor-facing reference.
**Cross-references**: complements SCP-S12 (Direction A `/mcp` live status); cites SCP-S14 (messaging qualities ARE Diameter qualities); cited by SCP-S16 (reading path Step 3); Pattern H (Conductor.md) is the doctrinal home

### SCP-S16 · Contributor Onboarding

**Aspect**: No-RI outside contributor entry path — linearized reading path + self-contained Architecture Primer for a contributor who arrives with ZERO Suite Cascade / RI context
**File**: `Cascades/8_SUITES/SCP Researcher/Skills/ContributorOnboarding.md`
**Function**: Self-contained Architecture Primer (Huirth/Client split, Demometer/Diameter/Muxameter, Island-vs-Persistent, ECK 2-tier ceiling, single-writer rule, Verbose Split Naming, actionExchange) + 5-step reading path with gates (S16 → S14 → S13 → S15) + first-contribution walk-throughs ("toolbar button" + "ClientToServer message"). The front door for any no-RI contributor or Informative-phase agent read.
**Cross-references**: routes to SCP-S14 (Step 1) and SCP-S15 (Step 3); all of S16→S14→S13→S15 resolves bidirectionally
**Function**: Eight-Phase procedural walk-through (Pre-Authoring Study → Name/Scope → 7FG Skeleton → Principles → Bridge Model → Vue → Registry → Verification Gate) with a Concluder gate at each Phase boundary. Frames the Notification Concept at `Cascades/scps/template/SCP/src/concepts/notification/` as the authoritative Copy-Paste-Plus source — every structural problem the new Concept faces is already solved there. The 17 Rust pattern abbreviations (FNES, CISV, DQWDS, DCQF, MSDT, AESR, ZKHP, GCRM, TOBM, DTEC, UPCT, RWCP, SCST, MCUC, VCIP, PACP, FKSD) constitute its vocabulary; the 5 Viridian Hazards (H1-H5) surface as the Anti-Patterns table.

**Inputs**:
- `conceptName` — camelCase Concept identifier (becomes directory name + Muxonomy key)
- `qualities[]` — Quality declarations with FNES classification (All / Huirth / Client; diameter:true/false)
- `principles[]` — Display (client · ZKHP) and/or Broadcast (huirth) principle declarations
- `vueLevel` — Controller (ZKHP) / Direct reactive ref / No Vue
- `filterKeys[]` — State properties excluded from server-sync (FKSD dual declaration in state.ts + muxonomy.ts)

**Outputs**:
- New Concept directory at `Cascades/scps/template/SCP/src/concepts/<conceptName>/` with 7FG file structure
- `<conceptName>.muxonomy.ts` with complete MSDT self-documentation (demometers + actionExchange + filterKeys)
- Both `createMuxonomic<ConceptName>()` and `createMuxonomic<ConceptName>Huirth()` registered in `muxonomyRegistry.generated.ts`
- TypeScript typecheck exit 0
- Optional: Vue Landing component using Pewter Tessera tokens

**Concluder**:
- `npm run typecheck` in runtime path returns exit 0
- `find src/concepts/<conceptName>/ -type f` lists >= 9 files including the FNES-suffixed Diameter quality
- `grep -c "<conceptName>" src/concepts/muxonomyRegistry.generated.ts` >= 2
- CISV check: `grep "createDiametricQuality" <concept>.concept.ts` shows variable name ending in `Induction`
- AESR consistency: type string identical across Real quality file · muxonomy demometer entry · actionExchange entry

**Cross-Suite invocation**: Pattern E (Research-Target Adaptation · Conductor.md) Band 5 invokes SCP-S13 when `addition_scope = new_concept`. The Stratimuxian Scholar (dispatched at Band 3 as S15 Muxonomy Concept Authoring Patterns) architects the types; SCP-S13 grounds the authoring in the Template SCP's specific runtime structure.

**Cross-references**:
- Skill body: `Skills/ConceptAuthoring.md` (the full walk-through)
- Conductor pattern: Pattern E in `Conductor.md`
- Companion Scholar Skills: S15 Muxonomy Concept Authoring Patterns (architecture · Why/What) · S16 Notification Muxameter Exemplar (citation-grounded trace)
- Forward Diameter: scsBridgeMirror Concept (SBM Macro 2 Aspirant per Macro Diamond §13) — applies M63 Copy-Paste-Plus from Notification to scsBridgeMirror; BMTI/MASN/MTAM/SCSER/DCQI/CSEP/SSBM substrate available

### SCP-S9 · Adapt Research Target

**Aspect**: Cross-Suite-8 composition for backwards-compatible adaptation
**Function**: Take an external research target (URL · file · prior-Diamond output · free-text concept) and transform it into a Stratimux-compliant SCP S8 deliverable composed into a target user-named instance's runtime tree. The skill is a *cascade orchestrator* — it does not perform the adaptation itself; it dispatches the Full-Suite (1-7) Vermillion plan defined at `Cascades/8_SUITES/SCP Researcher/Strategy/SCP-Adapt.md`, which composes three Suite 8s:

- **Cadmium Researcher** (Band 2) — verbose target prospecting with citation rigor
- **Stratimuxian Scholar** (Band 3) — Stratimux pattern architecture (Concept/Quality/Principle/State/Strategy/muxonomyRegistry shape)
- **SCP Researcher** (Bands 0, 1, 4-7) — target instance selection, validation, implementation, orchestration, diagnosis

**Inputs**:
- `target_name` — research target reference (URL, file path, concept description, or prior Diamond ID)
- `designation` — target SCP S8 instance name (must exist · verify via SCP-S1's `listScpInstances` first)
- `addition_scope` — one of `new_concept` | `new_qualities` | `new_principle` | `new_strategy` | `composite`

**Outputs**:
- New Stratimux files in the target instance's `{{runtime_path}}/src/concepts/` tree (per addition_scope)
- Updated `{{runtime_path}}/src/concepts/muxonomyRegistry.generated.ts` (new registrations + scpToolMetadata)
- Onyx G/L/M append (project Onyx + target-instance-Onyx if present)
- Git commit landing the adaptation

**Concluder**: 
- `npm run typecheck` in runtime path returns exit 0
- New concept's files exist at expected paths (`find` verifies)
- muxonomyRegistry includes the new registrations (`grep` verifies)
- Onyx entry exists for the cycle that ran this skill
- Git commit landed with appropriate scope message

**Cross-references**: 
- Strategy: `Cascades/8_SUITES/SCP Researcher/Strategy/SCP-Adapt.md` (the executable Vermillion plan)
- Conductor pattern: Pattern E in `Conductor.md`
- Reference Design: `SM-SCP-Adapt.md` (user-surface menu)

---

## Skill Composition Notes

- **SCP-S1 + SCP-S2 are clone-init pair**: SCP-4 (Personal SCP S8 first-instance) executes both. Future instantiation Diamonds (SCP-5+) compose the same pair.
- **SCP-S3 + SCP-S4 are surface-config pair**: declare what the instance exposes and how. Order: SCP-S3 first (transport must exist before tools register).
- **SCP-S5 is per-dispatch**: not per-creation. Every Diamond touching an SCP S8 runs Conference at close.
- **SCP-S6 + SCP-S7 are lifecycle endpoints**: SCP-S6 is rare; SCP-S7 is the clean termination path (SCP-S7 inverts SCP-S1 + SCP-S2 + SCP-S3 + SCP-S4 in reverse order).
- **SCP-S9 is post-creation extension**: an SCP S8 instance is created with SCP-S1+SCP-S2+SCP-S3+SCP-S4; SCP-S9 extends an existing instance by composing external research into new Stratimux structures within it. SCP-S9 implicitly invokes SCP-S4 (Skill Surface) at Band 5 to register the new tool surface. SCP-S9 dispatches SCP-S10 (Reference Design Generation) at its Band 1 — the RD is the cite-able intermediate produced before generation begins.
- **SCP-S10 is RD-first discipline**: every adaptation produces a Markdown Reference Design citing the target BEFORE Stratimux generation begins. The RD persists as the durable, archivable artifact; subsequent Bands generate from the RD while still able to reference the target. This replaces the prior wrong-Diameter framing of SCP-S10/S11 as destructive operations.
- **SCP-S11 is runtime-behavior · governs the bridge-turnover lifecycle**: every running SCP S8 instance has a turnover semantic — Soft preserves ClientState through the Perfect Circular Reference (server cache reconstructed from client persistence on reconnect); Hard targets the hydration gate to escape soft-locks (schema drift · initial-sync deadlock · KSFR symptoms). The Next Macro Diamond implements the Hard variant; this skill spec is the implementation contract.

## Trajectory

| Date | Diamond | Skills Touched | Note |
|---|---|---|---|
| 2026-05-10 | SCP-3 | SCP-S1..SCP-S8 (created) | Initial register · Three-Mode Membership |
| 2026-05-10 | SCP-4 | (none — rename only) | Suite 8 renamed SCP → SCP Researcher · skill identifiers unchanged |
| 2026-05-10 | SCP-5 | SCP-S1 + SCP-S4 (operational primitives) | `scs scp init` and `scs scp list` bridge subcommands wired · SCP-S1 Designation Bind has TypeScript implementation at `src/lib/scp/scpInstance.ts:createScpInstance` · SCP-S4 Skill Surface read by `listScpInstances` · 42 new tests · v0.38.0 |
| 2026-05-10 | SCP-6 | SCP-S9 (Adapt Research Target · NEW) | Cross-Suite-8 muxification cascade landed · composes Cadmium Researcher + Stratimuxian Scholar + SCP Researcher · doctrine-only this cycle (no source code) · Strategy/SCP-Adapt.md + SM-SCP-Adapt.md Reference Design · v0.38.0 → v0.38.1 patch |
| 2026-05-10 | AppKiller (Refining) | SCP-S10 (Reference Design Generation · NEW · supersedes prior destructive SCP-S10/S11 framing) | SCP-arc closure via DOCTRINE not destruction. Legacy Apps ARE Reference Designs; the SCP paradigm makes the App-as-Monolith concept obsolete through hyper-personalization. Pattern F becomes the AppKiller Doctrine (paradigm naming · not destructive cascade). Pruned: Strategy/AppKiller-Decommission.md · SM-AppKiller.md · /cascade:appkiller slash · prior SCP-S10/S11 destructive skills · SM-SCP `[K]` option. Refined: SCP-Adapt Strategy with RD-first discipline + Target formal definition (URL · Screenshot · Repo · anor-to). v0.38.1 → v0.38.2 patch. |
| 2026-05-10 | Refine-Macro | SCP-S11 (Bridge Turnover · ClientState Lifecycle · NEW) | Refining Diamond staging the Next Macro. Project-wide auto-format via canonical .prettierrc applied · `.bridge-restart.json` restored (wrongly pruned in SCP-1) · bridge turnover Lambda-event verified (npm run bridge in SCP/ · ts-node killed + respawned · `Bridge Restart Manifold: READY` Concluder). Three-Suite parallel dispatch (R2 + R4 + R6) produced naming + bidirectional examine + orchestration. Captures Perfect Circular Reference doctrine (BRTSP · PCRSC) + Hard Turn Over escape spec (HTOSLE) + 5 known soft-lock failure modes + 3 implementation refinements required (Suite 4 REFINE verdict). Pattern G added to Conductor; doctrine subsection added to Instance.md; `[T]` Turnover entry added to SM-SCP (placeholder for Next Macro). v0.38.2 → v0.38.3 patch. |
| 2026-05-19 | Notification-Manifold-Formalization (Cycle 154) | SCP-S13 (Concept Authoring on the Template SCP · NEW) | Phase 3 Cobalt-B Lambda landing. Eight-Phase procedural walk-through at `Skills/ConceptAuthoring.md` (1160 lines). 17 Rust pattern abbreviations (FNES, CISV, DQWDS, DCQF, MSDT, AESR, ZKHP, GCRM, TOBM, DTEC, UPCT, RWCP, SCST, MCUC, VCIP, PACP, FKSD) constitute the authoritative vocabulary. All 5 Viridian Hazards (H1 CISV · H2 TOBM controller.fire · H3 FNDR+AESR drift · H4 raw ws.send · H5 SSR module-counter) appear in Anti-Patterns table as CRITICAL/HIGH/MEDIUM severity. Bridge Model Phase 5 promoted from conditional to REQUIRED for Diameter Junction Qualities in Strategy context (per Viridian H2 non-negotiable). Forward Diameter section sources SCS-Bridge substrate (BMTI/MASN/MTAM/SCSER/DCQI/CSEP/SSBM) for SBM Macro 2 Aspirant (scsBridgeMirror Concept authoring). Conductor.md Pattern E Band 5 annotated with `(+ SCP-S13 when addition_scope = new_concept)` routing. Skill.md.template extended with light-touch pointer comment. Cross-Suite Diameter: invokes Stratimuxian Scholar S15+S16 for framework theory; precedes scsBridgeMirror Foundation Suite dispatch. |
| 2026-05-30 | RM-D-Close (Cycle 172 · #592) | SCP-S14/S15/S16 (NEW) · Communication.md Section 4 split · ConceptAuthoring.md forward pointers + H4 hedge removed · Instance Pattern-4 invariant + Skill Index + trajectory close | SCP Researcher Full Suite Refinement. SCP-S14 DemometricConceptPattern (DCFM/WSDM/CISV/AESR/FNES/ECK/dual-state/relay) · SCP-S15 MessagingMechanisms (SORD/BDAP/permission-means RM-D3/rename RM-D4/PMA #596/single-writer) · SCP-S16 ContributorOnboarding (no-RI Architecture Primer + 5-step reading path S16→S14→S13→S15). Communication.md Section 4 directional split (Direction A `/mcp` NOW LIVE via RM-D2 · Direction B CRCEP STILL DEFERRED). ConceptAuthoring.md Phase 1 item 0 → S14 forward pointer · Phase 4.2 H4 "when available" hedge removed (canonical broadcast path stated) · Phase 3 ClientToServer+dual-state note. Instance.md Skill Index table + Contributor Dispatch + Relay Refinement Macro trajectory rows + Pattern-4 named invariant block. Conductor.md SCP-S14/S15/S16 registry + Pattern H (Messaging Wire-Through RM-D2) + Pattern I (Session Surface Means RM-D3/D4). |
