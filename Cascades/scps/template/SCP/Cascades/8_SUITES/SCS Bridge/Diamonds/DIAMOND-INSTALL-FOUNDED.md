# DIAMOND · INSTALL — FOUNDED (the Filled pathing)

**YOU — the Installation Agent — OWN THIS BOARD.** It was copied into `Cascades/Working/` at
install. **THE BOARD OUTRANKS ANY COMMENT INSIDE A MINTED FILE** — in-artifact notes such as
`ADAPT (S10)` are RETIRED doctrine; skip them. Record your own Lambda ledger in
`Cascades/Working/ONYX-INSTALL.md`: one line per task — the Concluder result + any deviation.

## CHOOSE (before anything)
- Genuine prior user content (a real CLAUDE.md that is NOT the SCS Manifold · non-scs agents
  anor commands · a defined project): **THIS board.** Announce: `Following
  DIAMOND-INSTALL-FOUNDED`. The USER owns every designation choice — confer, never auto-name.
- Blank ground: switch to `DIAMOND-INSTALL-UNFOUNDED.md` (beside this file).

## CERULEAN TASKS (in order · one Concluder each · mark [x] as each lands)
- [ ] **T1 · Steps 1-3 verified pre-completed** — scaffold + manifest + the Manifold
      conversion WITH the user's prior CLAUDE.md preserved (PreInstallSnapshot in Iced/ —
      the uninstall reserve, NOT a content oracle). Concluder: the snapshot file exists.
- [ ] **T2 · Query the holdings** — `scp_query_holdings`. Concluder: one-beat return
      (template-only = ZERO installed SCPs).
- [ ] **T3 · Step 4 — install the first SCP** — ONE AskUserQuestion: the designation, drawn
      from the project's own name unless the user says otherwise. Firing `install_scp` returns
      `{}` IMMEDIATELY — that ACK means the install is RUNNING, not done. Then poll
      `scp_query_holdings` with PLAIN SINGLE READS roughly 15s apart until the roster row's
      `status` reads `installed` (that is the Concluder). NEVER hand-roll a parsing loop — a
      broken poll is YOUR bug, and one clean read beats forty dirty ones. Concluder: the
      holdings query shows it installed.
- [ ] **T4 · Step 5 — boot + focus** — Concluder: the `scp_query_holdings` roster row
      shows `live: true` + host + port (the socket probe — ONE read; never wait on
      lifecycle anor browserUrl projections). NEVER curl-guess ports.
- [ ] **T5 · Step 6 — THE DOMAIN CONVERSION conference** — ONE AskUserQuestion: the domain
      Suite 8 name for the EXISTING project (this is the emergence — the project BECOMES a
      Suite 8 IN the SCP). The user may defer → skip to T9.
- [ ] **T6 · The SCP-local mint (TWO LEGS IN ORDER) + the content landing** — IN THE INSTALLED
      SCP (`<scpRoot>/Cascades/8_SUITES/<name>/` — NEVER the workspace root). LEG 1: `POST
      /s8/create { name }` on the LIVE SCP server FIRST — the 5-file Extended seed births the
      SCP-local `Cascades/8_SUITES/<name>/` body (incl. `Instance.md`); without it the Anchor
      cannot spawn and the focus owner-probe has nothing to find. LEG 2: the page build
      (`suite8_page_create`). Then the muxified project content lands in the SCP-local
      Instance/Extended ground. Concluder: BOTH the SCP-local body dir exists AND the page gates
      report green AND the workspace-root 8_SUITES gained NOTHING.
- [ ] **T7 · THE TURN OVER INTRODUCTION** — `scp_alert_turn_over { scpName, purpose }` →
      INFORM the user (their first contact with the build-while-you-use loop) → the INLINE
      stand-by menu (reply-by-code · NEVER AskUserQuestion for it) → POLL the holdings until
      `gitm.turnOver.at > gitm.turnOverAlert.requestedAt`. Concluder: the new page serves.
- [ ] **T8 · Focus + the Forge** — `scp_focus_suite8_page { scpName, suite8Name }` (pass BOTH
      names) → READ the returned `{ focus: { ok, reason } }`: `ok:false` is a REAL answer, act on
      the `reason` (never treat an ACK as success) → the Entourage Forge assumption → the model
      offer → Step 7 build-out seeded from the converted domain.
- [ ] **T9 · Step 8 — the welcome** — the ONLY final gate. Close ONYX-INSTALL.md.

## THE DEVIATION COVERAGE (identical law to UnFounded)
| You observe | The covered move | NEVER |
|---|---|---|
| New page 200s but serves the old title | T7 is the cure. | build/kill/restart by hand — the bridge owns the lifecycle |
| "Is the SCP live? What port?" | `scp_query_holdings` — the roster's `live` is a REAL socket probe. | curl-guessing · idle-watching · waiting on projections |
| Any tool call hangs >30s | Stop it · holdings query · note in ONYX-INSTALL. | waiting it out |
| A minted file says `ADAPT (S10)` | STALE ARTIFACT DOCTRINE. Skip. | hand-wiring isMainLanding |
| The install ACKs {} instantly | The install is running — plain holdings reads ~15s apart until roster status = installed. | custom parser loops · long foreground timeouts |
| Prior-content ambiguity (SCS's own vs the user's) | The SCS-Signature Discriminant judges CONTENT, never existence. | halting on SCS's own artifacts |

## THE LAWS
The bridge owns the SCP lifecycle · the USER performs Turn Over A · Filled S8s land SCP-LOCAL
(the C724 whole-local ground) · the board outranks artifacts · one AskUserQuestion per
decision · announce every checkpoint · ONYX-INSTALL.md stays current.
