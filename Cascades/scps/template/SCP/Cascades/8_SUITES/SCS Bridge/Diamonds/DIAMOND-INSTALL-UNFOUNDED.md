# DIAMOND · INSTALL — UNFOUNDED (the Blank pathing)

**YOU — the Installation Agent — OWN THIS BOARD.** It was copied into `Cascades/Working/` at
install. **THE BOARD OUTRANKS ANY COMMENT INSIDE A MINTED FILE** — in-artifact notes such as
`ADAPT (S10)` are RETIRED doctrine; skip them. Record your own Lambda ledger in
`Cascades/Working/ONYX-INSTALL.md` as you go: one line per task — the Concluder result + any
deviation you diagnosed.

## CHOOSE (before anything)
- Blank ground (no genuine prior user content — the SCS-Signature Discriminant): **THIS
  board.** Announce: `Following DIAMOND-INSTALL-UNFOUNDED`.
- Genuine prior user content found: switch to `DIAMOND-INSTALL-FOUNDED.md` (beside this file).

## CERULEAN TASKS (in order · one Concluder each · mark [x] as each lands)
- [ ] **T1 · Steps 1-3 verified pre-completed** — scaffold + manifest + Manifold CLAUDE.md.
      Concluder: `test -f Cascades/Cascade.json && test -f .claude/CLAUDE.md`.
- [ ] **T2 · Query the holdings** — `scp_query_holdings`. Concluder: port + roster return in
      one beat (template-only = ZERO installed SCPs — the Template-SCP Law).
- [ ] **T3 · Step 4 — install the first SCP** — ONE AskUserQuestion for the designation
      (PascalCase), then install. Firing `install_scp` returns `{}` IMMEDIATELY — that ACK means
      the install is RUNNING, not done. Then poll `scp_query_holdings` with PLAIN SINGLE READS
      roughly 15s apart until the roster row's `status` reads `installed` (that is the Concluder).
      NEVER hand-roll a parsing loop — a broken poll is YOUR bug, and one clean read beats forty
      dirty ones. Concluder: the holdings query shows the SCP installed.
- [ ] **T4 · Step 5 — boot + focus** — the session-management launch. Concluder: the
      `scp_query_holdings` roster row shows `live: true` + host + port (the socket probe —
      ONE read suffices; lifecycle anor browserUrl are lag-prone projections, do NOT wait on
      them). NEVER curl-guess ports.
- [ ] **T5 · Step 6 — the Suite 8 OFFER** — ONE AskUserQuestion; declinable ("explore first"
      is a full answer → skip to T9). NO home flag exists anymore — never offer a home claim.
- [ ] **T6 · The SCP-local mint — TWO LEGS IN ORDER** (accepted only). LEG 1: `POST /s8/create
      { name }` on the LIVE SCP server FIRST — the 5-file Extended seed births the SCP-local
      `Cascades/8_SUITES/<name>/` body (incl. `Instance.md`); without it the Anchor cannot spawn
      and the focus owner-probe has nothing to find. LEG 2: the page build (`suite8_page_create`).
      The mint's OWN gates decide collisions — no pre-grep spelunking. Concluder: BOTH the body
      dir exists SCP-local (`<scpRoot>/Cascades/8_SUITES/<name>/`) AND the page gates report green.
- [ ] **T7 · THE TURN OVER INTRODUCTION** — `scp_alert_turn_over { scpName, purpose }` →
      INFORM the user: this Turn Over A is their first contact with the build-while-you-use
      loop → present the INLINE stand-by menu (markdown · numbered + lettered · reply-by-code
      · NEVER AskUserQuestion for this menu) → POLL the holdings query until
      `gitm.turnOver.at > gitm.turnOverAlert.requestedAt`. Concluder: the new page's title
      anor island chunk actually serves.
- [ ] **T8 · Focus + the Forge** — `scp_focus_suite8_page { scpName, suite8Name }` (pass BOTH
      names) → READ the returned `{ focus: { ok, reason } }`: `ok:false` is a REAL answer, act on
      the `reason` (never treat an ACK as success) → assume the Entourage Forge → offer the model
      change → Step 7 build-out.
- [ ] **T9 · Step 8 — the welcome** — the ONLY final decision gate. Close ONYX-INSTALL.md
      with the run's summary line.

## THE DEVIATION COVERAGE (pre-answered forks — when something looks wrong, look HERE first)
| You observe | The covered move | NEVER |
|---|---|---|
| New page 200s but serves the old title | The SPA catch-all lies. T7 is the cure. | `build:client` · killing the port · restarting by hand — the bridge owns the SCP lifecycle |
| "Is the SCP live? What port?" | `scp_query_holdings` — the roster's `live` is a REAL socket probe; one read answers. | curl-guessing hosts/ports · idle-watching · waiting on lifecycle/browserUrl |
| Any tool call hangs >30s | Stop it · `scp_query_holdings` for ground truth · note it in ONYX-INSTALL. | waiting it out · leaving it running in background |
| A minted file says `ADAPT (S10)` / flip `isMainLanding` | STALE ARTIFACT DOCTRINE (S10 retired). Skip it. | hand-wiring `isMainLanding` anor route claims |
| The install ACKs {} instantly | The install is running — plain holdings reads ~15s apart until roster status = installed. | custom parser loops · long foreground timeouts |
| Turn Over A disabled / no stable A | Relay the button's Shield guidance to the user; stand by. | agent-side git surgery |

## THE LAWS
The bridge owns the SCP lifecycle · the USER performs Turn Over A · the board outranks
artifacts · inline menus reply-by-code · one AskUserQuestion per decision · announce every
checkpoint (`Step N of 8`) · ONYX-INSTALL.md is your Lambda ledger, keep it current.
