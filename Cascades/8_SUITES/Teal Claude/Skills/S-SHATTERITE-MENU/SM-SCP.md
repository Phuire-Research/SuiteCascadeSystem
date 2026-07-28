# SM-SCP — SCP Menu Reference Design

**Reference Design ID**: SM-SCP
**Suite 8**: Teal Claude (Shatterite Menu Skill)
**Surface**: `/cascade:scp` slash command direct entry · also reachable from SM-Main via `[R]`
**Pewter HiFi**: D5 closed-box · D7 active-button inversion · destructive ops default-N (CD-125 SDDA inherited)
**Origin**: Diamond SCP-5 · The User Surface · 2026-05-10

---

## Top-Level SCP Menu

When the user invokes `/cascade:scp` (or selects `[R]` from SM-Main), render:

```
<AskUserQuestion>
╔══════════════════════════════════════════════════════════╗
║  SCP MENU — Suite Cascade Protocol Operations            ║
║  ─ · ─                                                   ║
║  Personal / Organizational / Project SCP S8 lifecycle    ║
║                                                          ║
║  [L] List SCP S8 Instances                  [Blue]       ║
║      Show all SCP S8 instances currently registered      ║
║      in this project — designation · mode · runtime ref. ║
║                                                          ║
║  [I] Initialize New SCP S8                  [Orange]     ║
║      Clone the SCP runtime template + SCP Researcher     ║
║      Templates into a user-named instance. Personal      ║
║      mode default; Organizational / Project selectable.  ║
║                                                          ║
║  [M] Migrate SCP S8 Mode                    [Purple]     ║
║      Evolve an instance's mode (Personal →               ║
║      Organizational, etc.). Rare; rederive defaults.     ║
║                                                          ║
║  [D] Deploy SCP S8 Runtime                  [Green]      ║
║      Start the SCP runtime for an instance. Transport    ║
║      binds per mode default (or instance override).      ║
║                                                          ║
║  [X] Retire SCP S8                          [Fuchsia]    ║
║      Decommission an instance — destructive. Drains      ║
║      in-flight, releases transport, removes registry.    ║
║                                                          ║
║  [A] Adapt Research Target                  [Yellow]     ║
║      Run the Full-Suite (1-7) adaptation cascade —       ║
║      Cadmium Researcher prospects · Stratimuxian Scholar ║
║      architects · SCP Researcher implements. RD-first    ║
║      discipline: Markdown citing target → generate.      ║
║      Legacy apps, repos, URLs, screenshots, anor-to.     ║
║                                                          ║
║  [E] Engage Installed SCP                   [Cobalt]     ║
║      Launch · Status · Logs · Dock · Browser · Manage    ║
║      installed SCP runtimes via Bridge MCP tools.        ║
║      → renders SM-SCP-MANAGE.md                          ║
║      (CSPMSR-conditional: only shown when SCPs are       ║
║       registered in SCPs.json)                           ║
║                                                          ║
║  [T] Turnover — Bridge Restart Lifecycle    [Cyan]       ║
║      Soft (default · preserves ClientState) or Hard      ║
║      (clears client persistence · soft-lock escape).     ║
║      Pattern G · placeholder; Next Macro implements.     ║
║                                                          ║
║  · · ·                                                   ║
║                                                          ║
║  [T] Type Spec — Open SCP Researcher Instance.md         ║
║  [?] About SCP — Identity-as-Perimeter doctrine          ║
║  [M] Main Menu    [Q] Exit                               ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
</AskUserQuestion>
```

(Note: `[M] Migrate` and `[M] Main Menu` both use M — distinguish in routing by context. The submenu Migrate path is renumbered to `[G]` when ambiguity is detected, OR menu may be revised to split these conflicts. For initial issue, treat `[M]` at top level as "Main Menu" return; deep operations use unique letters.)

---

## Operation Routing

| Selection | Action |
|---|---|
| `[L]` List | Invoke `scs scp list` bridge subcommand · render results as Pewter HiFi table |
| `[I]` Initialize | → Stage I1: Designation Gate · Stage I2: Mode Gate · Stage I3: Execute (invoke `scs scp init <designation> --mode <mode>` OR follow Pattern A doctrine inline) · Stage I4: Confirmation |
| `[G]` Migrate (was M, renumbered to avoid Main-Menu collision) | → Stage M1: Instance Selection · Stage M2: Target Mode · Stage M3: Migration Plan · Stage M4: Execute (Pattern D from SCP Researcher Conductor) |
| `[D]` Deploy | → Stage D1: Instance Selection · Stage D2: Pre-deploy Check (transport availability) · Stage D3: Launch runtime · Stage D4: Confirmation |
| `[X]` Retire | → Stage X1: Instance Selection · Stage X2: Pewter HiFi Confirmation Modal (default-N · destructive-ops asymmetry per CD-125 SDDA) · Stage X3: Execute (Pattern C from SCP Researcher Conductor) · Stage X4: Archive option (Personal/Org modes) |
| `[A]` Adapt | → Render `SM-SCP-Adapt.md` Reference Design · Stages A1-A5 · executes Vermillion plan from `Cascades/8_SUITES/SCP Researcher/Strategy/SCP-Adapt.md` (Pattern E from SCP Researcher Conductor) · RD-first discipline (Markdown citing target before generation) · target = URL · Screenshot · Repo · anor-to · Cross-Suite-8 muxification (Cadmium Researcher + Stratimuxian Scholar + SCP Researcher) |
| `[E]` Engage Installed SCP | → Render `SM-SCP-MANAGE.md` Reference Design · Launch / Status / Logs / Dock / Browser / Unregister via Bridge MCP tools · CSPMSR-conditional (only shown when SCPs registered in SCPs.json) · Cycle 140 MSCM Gap-1 closure |
| `[T]` Turnover | (Placeholder · Next Macro Diamond implements) → Bridge restart lifecycle · Soft mode preserves ClientState through the Perfect Circular Reference (default) · Hard mode targets the hydration gate to escape soft-locks · Pattern G in SCP Researcher Conductor.md · SCP-S11 skill spec |
| `[T]` Type Spec | Read `Cascades/8_SUITES/SCP Researcher/Instance.md` and render |
| `[?]` About | Render summary of Identity-as-Perimeter doctrine + Pearl chain SCP-1..SCP-4 |
| `[M]` Main Menu | Return to SM-Main.md |
| `[Q]` Exit | End engagement |

---

## Stage Specifications

### Stage I — Initialize New SCP S8

#### Stage I1: Designation Gate

```
<AskUserQuestion>
╔══════════════════════════════════════════════════════════╗
║  DESIGNATION                                [Orange]     ║
║  ─ · ─                                                   ║
║  What will you call this SCP Suite 8?                    ║
║                                                          ║
║  The designation becomes the Suite 8's name AND its      ║
║  access perimeter. Choose something verbose enough       ║
║  to convey scope — "MicahsPersonal" not just "SCP".      ║
║                                                          ║
║  Constraints:                                            ║
║   · Alphanumeric · hyphens · spaces allowed              ║
║   · 64-char maximum                                      ║
║   · Must not collide with existing Suite 8 designation   ║
║                                                          ║
║  [Free text] · [B] Back to SCP Menu                      ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
</AskUserQuestion>
```

Validate via `scs scp list` to ensure the chosen designation is not already in use.

#### Stage I2: Mode Gate

```
<AskUserQuestion>
╔══════════════════════════════════════════════════════════╗
║  MODE                                       [Orange]     ║
║  ─ · ─                                                   ║
║  Which membership scope?                                 ║
║                                                          ║
║  [P] Personal           [DEFAULT] — single user          ║
║      Local-machine bridge into MCP-using clients.        ║
║      Transport: WebSocket+HTTP on localhost:7111         ║
║                                                          ║
║  [O] Organizational     — team / company scope           ║
║      Org SSO as identity layer · org-network transport   ║
║                                                          ║
║  [J] Project            — project-bound scope            ║
║      Project-scoped token · stdio transport (CI use)     ║
║                                                          ║
║  [B] Back · [Esc] Cancel                                 ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
</AskUserQuestion>
```

#### Stage I3: Execute · AISIS (Agent-Invoked-Same-as-CLI Sequence · Diamond η)

The Shatterite agent invokes the EXACT SAME pipeline as `scs scp install` from the CLI — programmatic mirror (per IAPMCT / SMMIP invariant). Single source of truth · three surfaces (CLI direct · TUI wizard · Shatterite agent) all share the M2-Refinement substrate.

**Primary path · materialize runtime SCP** (this is the path the Shatterite agent SHOULD invoke for SCP install via Cascade Menu):

```bash
scs scp install "<Designation>"
```

Where `<Designation>` is the validated PascalCase name from Stage I1 (passes `validateDesignationForWizard` per `src/lib/scp/installScpPrompts.ts`).

This pipeline (per `src/lib/scp/scpInstall.ts` `runInstallScpPipeline`) executes 8 ordered steps:

1. **Validate designation** (RM-D1 · `validateAndDerive`) — PascalCase · 2-32 chars · not reserved name
2. **Generate bare-minimum concept bundle** (RM-D3 · in-memory · 4-file pure template):
   - `{conceptName}.type.ts` (concept type definition)
   - `{conceptName}.state.ts` (concept state factory)
   - `{conceptName}.concept.ts` (concept registration)
   - `vue/{Designation}Landing.vue` (**Home Page surface** · auto-rendered as Vue Island)
3. **Materialize template tree** (RM-D3 · `cloneWithRename` to `Cascades/scps/.staging/{Designation}-{ulid}/SCP/`)
   - Template source resolves via `resolveBundledTemplatePath()` (Diamond γ-4a):
     - `SCS_TEMPLATE_PATH` env override (Local-Dev-Path-Override · LDPOE pattern)
     - Falls back to `{pkgRoot}/Cascades/scps/template/SCP` (bundled in npm package)
     - Final fallback to `{cwd}/Cascades/scps/template/SCP` (dev repo)
4. **npm install in staging** (RM-D3 · synchronous · validates dependency tree)
5. **SPVI validation** (RM-Asp-1 · 4 Concluders: `package.json` parses · `src/index.ts` exists · concept tree present · `src/main.ts` exists)
6. **Atomic commit-move** (`renameSync` staging → `Cascades/scps/{Designation}/SCP/` final)
7. **Update `Cascades/SCPs.json`** (RM-D4 · `appendScpEntry` · port allocated from 7700-7799 range · status='installed')
8. **Build spawn descriptor** (RM-D5 · SABO pattern · returned for caller to spawn)

After step 7, the SCP is **registered** (SCPs.json entry) and the user's named concept is **set as Home Page** (the auto-generated `vue/{Designation}Landing.vue` rendered as the default Vue Island via muxonomy registration · per HPCFPIR pattern · M1-A2-D6 `homePagePath` slot).

**Path B · Doctrine inline (fallback when bridge subcommand unavailable)**:

Follow `Cascades/8_SUITES/SCP Researcher/Conductor.md` Pattern A — read `Templates/{Instance,Skill}.md.template`, substitute slots, write to `Cascades/8_SUITES/<Designation>/`. This creates the Suite 8 metadata only · not the runtime tree. For full install (with runtime + Home Page Vue Landing), Path A is required.

**Note on Suite 8 metadata vs runtime SCP**:

- `scs scp init` (SCP-5) writes Suite 8 metadata at `Cascades/8_SUITES/{Designation}/Instance.md` (Suite 8 type spec)
- `scs scp install` (M2 Refinement Macro) materializes runtime at `Cascades/scps/{Designation}/SCP/` (runnable SCP)

The AISIS Shatterite flow invokes `scs scp install` as primary. If the user also wants Suite 8 metadata (for SCP Researcher meta-Suite-8 tracking), they can subsequently run `scs scp init`. Most installs only need the runtime path.

#### Stage I4: Confirmation + Engage via SCS-Bridge

### Stage I4 · Post-Install SM-Conclude · MANDATORY Option Order

When rendering SM-Conclude after a successful SCP install, the agent MUST surface these options in this EXACT order — NO substitutions, NO additions of AJMI Tutorial / Macro 3 hand-off / other engagement paths from outside post-install scope.

**Option 1 (RECOMMENDED · MASN Activate via SB-S131 · SAWSR-D2.A Cycle 150)**:
Label: "Activate {{designation}} Session Management via SCS-Bridge MCP [Recommended]"
Description: "Agent invokes SB-S131 (Post-Install MASN Activate Invocation) via Bash tool · project-local bridge.json discovery → POST /mcp tools/call scp_launch_session_management · ALHOC double-bind composes (boot overlay + spawn + browser) · backward Arc registers calling session to SCP scope (D2.B SCSER · once landed)"
Action on selection: Execute SB-S131 protocol via Bash tool (NOT instruction-mode):

```bash
PORT=$(jq -r .port ./Cascades/Bridge/bridge.json 2>/dev/null)
[[ -z "$PORT" || "$PORT" == "null" ]] && { echo "SCS-Bridge not running · open another terminal · run scs · then retry"; exit 1; }
# callerSessionUlid resolved via Bridge registry cwd-match (Cycle 153 R3).
# Agent's claude process $PWD matches its sessions.json entry's .cwd field.
# SCS_BRIDGE_ULID is NOT in claude runtime env (only in hook command-prefix).
SESSION_ID=$(jq -r --arg cwd "$PWD" '.sessions | map(select(.cwd == $cwd and (.status == "launched" or .status == "allocated"))) | sort_by(.spawnedAt) | reverse | .[0].id' ./Cascades/Bridge/sessions.json 2>/dev/null)
[[ -z "$SESSION_ID" || "$SESSION_ID" == "null" ]] && SESSION_ID="${SCS_BRIDGE_ULID:-$(uuidgen 2>/dev/null || date +%s)}"
curl -X POST "http://127.0.0.1:$PORT/mcp" \
  -H 'Content-Type: application/json' \
  -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/call\",\"params\":{\"name\":\"scp_launch_session_management\",\"arguments\":{\"scpName\":\"{{designation}}\",\"callerSessionUlid\":\"$SESSION_ID\"}}}"
```

**Option 2 (TUI Self-Direction)**:
Label: "Engage {{designation}} via TUI"
Description: "User runs `scs` in another terminal · navigates to {{designation}} · presses Enter (AAL auto-launches via DSBL) or L"
Action on selection: Display TUI engagement instructions (not auto-invoke)

**Option 3 (Suite Color Selection)**:
Label: "Suite Color Selection"
Description: "Run /cascade:colors questionnaire · personalize Suite Cascade colors · enables [S] Suite 8 Registry slot"
Action on selection: Defer to /cascade:colors

**Option 4 (Return to Main Menu)**:
Label: "Return to Shatterite Main Menu"
Description: "Re-render /cascade · [M] return-to-base routing"

### Out-of-Scope for Post-Install SM-Conclude

The following MUST NOT appear in post-install SM-Conclude (they belong to different routing contexts):
- AJMI Cadmium Tutorial (Macro 3 concern · separate routing)
- "Exit · work directly" / "Type something" / "Chat about this" (these are SM-Main concerns)
- Any "Run `cd ... && npm run bridge`" manual shell text (PRUNED · pre-DSBL artifact)

### Doctrinal Strength Note

This Stage I4 order is a DIRECTIVE not a SUGGESTION. The post-install context's intent is "engage what was just installed" — MCP via SCS-Bridge is the Muxameter-completing path. TUI is the manual self-direction fallback. The order MCP→TUI→Colors→Return reflects engagement-priority, not historical default.

---

After execute, the SCP is registered in `Cascades/SCPs.json` with `boundBridgePort`. Render confirmation:

```
╔══════════════════════════════════════════════════════════╗
║  ✓ SCP Suite 8 Created                      [Green]      ║
║  ─ · ─                                                   ║
║  Designation: {{designation}}                            ║
║  Mode:        {{mode}}                                   ║
║  Location:    Cascades/scps/{{designation}}/SCP/         ║
║  Bound Port:  {{boundBridgePort}}                        ║
║  Browser URL: http://localhost:{{boundBridgePort}}/      ║
║                                                          ║
║  Your SCP Suite 8 is registered and ready to engage.     ║
║                                                          ║
║  [L] Launch via SCS-Bridge MCP   [RECOMMENDED]           ║
║  [T] Launch via SCS-Bridge TUI                           ║
║  [S] Skip — finish without launching                     ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
```

**Option L · SCS-Bridge MCP Dispatch (Cascade-Primitive · RECOMMENDED)**

The Shatterite agent INVOKES **SB-S127 Bridge Discovery + MCP Launch Invocation** — NOT instruction-mode. The user does NOT shell out manually; the agent executes the two-step doctrine directly via the Bash tool. The Skill IS the action.

**Step 1 · Discover** the live SCS-Bridge dockServerPort (Bash tool · BJDP project-local):

```bash
PORT=$(jq -r .port ./Cascades/Bridge/bridge.json 2>/dev/null)
WRITTEN_AT=$(jq -r .writtenAt ./Cascades/Bridge/bridge.json 2>/dev/null)
# If PORT is empty/null OR (now - WRITTEN_AT) > 3600000, advise user to run `scs` first.
```

**Step 2 · Invoke** the MASN Activate MCP tool (Bash tool · only if Step 1 succeeded · PRIMARY per SAWSR-D2.A Cycle 150):

```bash
curl -s -X POST "http://127.0.0.1:$PORT/mcp" \
  -H 'Content-Type: application/json' \
  -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/call\",\"params\":{\"name\":\"scp_launch_session_management\",\"arguments\":{\"scpName\":\"{{designation}}\",\"callerSessionUlid\":\"{{sessionId}}\"}}}"
```

**This is not a recipe to print to the user — this is the action the agent takes.** The dockServerPort is discovered from `./Cascades/Bridge/bridge.json` (project-local canonical · written on `scs` startup per Manifold Completion Diamond Wave 2 · BJDP per SB-S30). The endpoint is `/mcp` (no dash · final form post-rename). MASN `scp_launch_session_management` composes ALHOC double-bind (Boot Overlay + spawn) · legacy `launch_scp` retained as fallback only.

The MCP endpoint dispatches the SAME `scpSpawnManagerSpawnRequested` Quality as the TUI `[L]`/`[Enter]` keypress and the TUI wizard's PIBR card (Surface 5) — LOCK 2 idempotency guard at `scpSpawnManagerSpawnRequested.quality.ts:137` serializes the race. Browser tab opens automatically at `http://localhost:{{boundBridgePort}}/` via the HPRD probe → `scpDockHostOpenBrowserTab` chain.

**If discovery fails** (`bridge.json` missing OR `writtenAt` stale): advise the user "Open a new terminal · run `scs` · then re-run `/cascade:scp-install` or directly press Enter on `{{designation}}` in the TUI menu." SCS-Bridge must be live for MCP dispatch to succeed.

Expected MCP response envelope:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "_meta": {
      "status": "spawning",
      "scpName": "{{designation}}",
      "sessionId": "{{sessionId}}",
      "port": {{boundBridgePort}},
      "url": "http://localhost:{{boundBridgePort}}/"
    }
  }
}
```

**Failure Modes** (SB-S127 cross-reference):
- `bridge.json` missing → SCS-Bridge not running · instruct user to run `scs` in another terminal
- `bridge.json` stale (`writtenAt` > 1 hour ago) → likely stale port · re-check after user starts `scs`
- curl HTTP error (connection refused / ECONNREFUSED) → port mismatch · re-discover after `scs` restart
- MCP `-32602` invalid params → `scpName` not in `Cascades/SCPs.json` registry

**Option T · SCS-Bridge TUI Launch**

If the SCS-Bridge is not running, the user can start the TUI:
- Run `scs` (no subcommand) from the project root
- Navigate to `{{designation}}` in the SCP list
- Press `Enter` (AAL auto-launch) or `L` (explicit launch)

The TUI wizard install path also wires the PIBR (Post-Install Boot-Recommend) card automatically — Surface 5 of the 6-surface manifold. Either path dispatches the same `scpSpawnManagerSpawnRequested` Quality (TMTR · TUI-MCP-Trigger-Reciprocal).

**Option S · Skip**

The SCP remains registered. The user may engage later via either Option L or Option T. The SABO spawn descriptor returned by `runInstallScpPipeline` (`result.descriptor`) carries the readiness data for any future invocation.

**Doctrinal Note**: do NOT instruct manual `cd <path> && npm run bridge` — that is the pruned lossy abstraction (Surface 6 of the manifold, now corrected). The Cascade-primitive surfaces are MCP dispatch (Option L) and TUI dispatch (Option T). Both reuse the SAME Quality, satisfying the Stratimuxian Scholar "Quality dispatch target-agnostic" principle: the dispatch site varies but the Quality is one.

---

### Stage L — List SCP S8 Instances

Invoke `scs scp list`. Render results in Pewter HiFi table:

```
╔══════════════════════════════════════════════════════════╗
║  SCP S8 INSTANCES                                        ║
║  ─ · ─                                                   ║
║  Designation         · Mode         · Runtime           ║
║  ─────────────────── · ──────────── · ───────────────── ║
║  MicahsPersonal · Personal · ../../scps/template/SCP/   ║
║  ─────────────────── · ──────────── · ───────────────── ║
║                                                          ║
║  1 instance found · 0 deployed                           ║
║                                                          ║
║  [I] Initialize another · [B] Back · [Q] Exit            ║
╚══════════════════════════════════════════════════════════╝
```

If no instances exist, surface the `[I] Initialize` option as the primary call-to-action.

---

### Stage G — Mode Migrate

Follow Pattern D from SCP Researcher Conductor.md. Implementation is doctrine-only in SCP-5; TypeScript subcommand `scs scp migrate` is deferred (warrants its own cycle due to atomicity concerns + identity-layer rebinding).

### Stage D — Deploy SCP S8 Runtime

Spec'd in doctrine; implementation deferred — `scs scp deploy` requires runtime composition (copy vs reference resolution) + transport binding (port availability check) + process lifecycle management. Warrants its own cycle when deployment semantics are pinned down.

### Stage X — Retire SCP S8

Pewter HiFi confirmation modal (default-N · D5+D7 styling matching B-26-PEWTER precedent). Follow Pattern C from SCP Researcher Conductor.md. Implementation deferred — `scs scp retire` is destructive and warrants careful design (drain semantics, archive option, post-retire registry cleanup).

---

## Identity-as-Perimeter Note

Every operation in this menu reinforces the same architectural doctrine: the Suite 8 designation IS the access boundary. When you initialize an SCP S8, you create a perimeter. When you list them, you're auditing the perimeters in your project. When you deploy, you bind a transport to the perimeter — but the transport is the channel, not the access layer. When you retire, the perimeter dissolves.

There is no orthogonal authentication or authorization layer. The Suite 8's identity (designation + mode) IS the access layer. This is why SCP Suite 8s reduce attack surface compared to conventional hosted apps — there is no public endpoint to defend, because there is no public endpoint at all.

---

## Cross-References

- Type spec: `Cascades/8_SUITES/SCP Researcher/Instance.md`
- Lifecycle skills: `Cascades/8_SUITES/SCP Researcher/Skill.md` (SCP-S1..SCP-S8)
- Operation patterns: `Cascades/8_SUITES/SCP Researcher/Conductor.md` (Patterns A/B/C/D)
- Slot-substituted templates: `Cascades/8_SUITES/SCP Researcher/Templates/`
- Runtime template: `SCP/` at repo root
- Bridge subcommand impl: `src/commands/scp/` and `src/lib/scp/`
- Diamond of origin: `Cascades/Working/DIAMOND-TIER-SCP-5.md` (gitignored, local Lambda evidence)

---

## Trajectory

| Date | Diamond | Change |
|---|---|---|
| 2026-05-10 | SCP-5 | Reference Design created · top-level menu + I1-I4 stage spec + L stage spec · M/D/X stages doctrine-only (implementations deferred to subsequent cycles) |
