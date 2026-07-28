> **RETIRED (C780 · user directive)**: the Home-Page adaptation is NO LONGER performed. The
> converted domain Suite 8 is NOT set as the SCP home page — the default Home keeps the
> landing. This strategy remains for historical reference only; S9 (rewritten C780) carries
> the current flow: the PROVEN mint scaffolding → load the SCP → focus the new page
> (scp_focus_suite8_page) → assume the Entourage Forge persona → offer the model change.

# S10 — Home Page Adapt (SAMLS Swap + Rebuild + DHHSB Seeding)

**Strategy**: Home Page Adapt — flip the adapted Template Suite 8 Page to the SCP's main landing, rebuild, verify the route swap, and seed the adapt how-to into the user's first Diamond
**Phase**: S10 (post-S9 — runs after S9 adapts Suite8HomeLanding.vue with the user's domain)
**Conductor**: SCS Bridge Install Conductor
**Input**: result of S9 (`{scpRoot}/src/concepts/suite8/vue/Suite8HomeLanding.vue` adapted · SSMC bound) · `{scpRoot}/src/concepts/suite8/suite8.muxonomy.ts` (the SAMLS edit target) · `Cascades/Working/DIAMOND-TIER-1.md` (the DHHSB seed target · S8 RI activation wrote it)
**Output**: `suite8HomeNavigation.isMainLanding: true` (the user's domain page claims `/`) · `{scpRoot}` rebuilt (`npm run build:client`) · getLandingPage() resolves to the domain page · DIAMOND-TIER-1.md carries a `## Home Page Adapt` how-to block (the durable fallback)

---

## Engagement Criteria

S10 fires AFTER S9 emits the `s9-domain-page-adapted` signal. S9 filled the Template Suite 8 Page with the user's domain; S10 performs the **SAMLS swap** — the smallest meaningful act of personalization: one boolean flip makes the user arrive in their domain rather than in SCS infrastructure.

S10 also seeds the **DHHSB** (Domain Suite-8 How-To Seeding Block): the three muxonomy edits, the DSSLS three-zone shape, and the SSMC import pattern are written into the user's `DIAMOND-TIER-1.md` so the adapt knowledge survives as the project's durable fallback — any future agent or the user can re-perform the swap from their own planning artifact without re-deriving it.

The route-swap mechanism (`vueRegistry.getLandingPage()`) requires no route-table rewrite — it resolves the lowest-order `isMainLanding: true` concept at serve time, and its cache invalidates when the new muxonomy registers. S10's only mechanical job is the muxonomy edit + the rebuild.

---

## Vermillion Plan

```
<VermillionPlan topic="Home Page Adapt — SAMLS swap + rebuild + DHHSB seeding">

Band 1 [R1 Red — Curate the Swap Target] (Tier 0):
  Informative: Read `{scpRoot}/src/concepts/{domainLower}/{domainLower}.muxonomy.ts` (the RENAMED
               concept · S9 Band 3.5 copy-move-renamed it). Locate the navigation config — the
               renamed `{domain}HomeNavigation` (or the primary `{domain}Navigation`) · default
               isMainLanding: false. Read `{scpRoot}/src/concepts/cadmium/cadmium.muxonomy.ts` to
               confirm the incumbent landing (cadmiumNavigation · isMainLanding: true · order: 4).
  Actionable: Capture the current landing (cadmium · order 4) and the swap target (the RENAMED
              concept's home navigation · currently isMainLanding: false · order 2). Confirm the
              componentPath is '{domainLower}/vue/{Domain}HomeLanding' (the renamed adapted page).
  Concluder: `grep -ci "HomeNavigation" {scpRoot}/src/concepts/{domainLower}/{domainLower}.muxonomy.ts` ≥ 1
  HALT RULE (FT-004 amendment B3): if {domainLower}.muxonomy.ts does NOT exist, the S9 Band 3.5
  copy-move-rename was NOT performed (the cloneRenameEngine scaffold is NOT a substitute). Do NOT
  silently adapt suite8.muxonomy.ts instead — report ✗ Step 7 of 8, RETURN to S9 Band 3.5, and
  re-execute the rename before any swap

Band 2 [R4 Green — Verify the Home Route Was Claimed (VERIFY-ONLY · FT-008)] (Tier 0):
  Informative: The home claim is ALREADY MADE — S9 Band 3.5 invoked `scs suite8:page --name "{name}"
               --display-name "{name}" --home` in ONE motion (FT-008). S10 does NOT re-invoke the
               command. The SAMLS swap (the navigation swap + DEFAULT disable + cadmium flip +
               build:client) ran inside `runHomeClaimPhase` during S9. Band 2's job is to VERIFY the
               `✓ Home route claimed` line was emitted, not to claim again.
  Actionable: READ the console output captured in S9 Band 3.5 (or re-read the muxonomy source) and
              confirm `✓ Home route claimed (isMainLanding: true · build:client OK)` was present.
              Do NOT re-run `scs suite8:page`. If the line is ABSENT (a `⚠ Home route NOT claimed`
              appeared instead, or the create itself failed), proceed to Band 5.5 recovery.
              CONTEXT-B RECOVERY PATH (documented · not the default): if for any reason the page
              exists from a bare `--name` create but the home route was NOT claimed, the recovery
              invocation `scs suite8:page --name "{name}" --home` runs the Context-B branch (the
              SAMLS-only re-claim on the existing dir). This is the FALLBACK, not the primary flow —
              the primary flow is S9's ONE-MOTION `--home`.
  Concluder: Presence of `✓ Home route claimed (isMainLanding: true · build:client OK)` in the
    S9 Band 3.5 console output = SAMLS landed + build:client OK. On gate-iv failure the line is:
      ⚠ Home route NOT claimed — base page preserved · {homeClaimRevertReason}
    The ⚠ line (or its absence) triggers Band 5.5 recovery. The command's own SAMLS-only revert
    fires on gate-iv failure; the base page is preserved.
              (page.ts:57-62 — home result conditional · page.ts:48-63 — success branch)

Band 3 [R5 Blue — LAUNCH THE SCP (the Concluder · FT-007 amendment — the smoke RETIRED)] (Tier 0):
  Informative: The SERVER BOOT SMOKE is RETIRED (it cost ~7 minutes per install; its crash classes
               are now structurally closed: the Concluding Stage Pattern conformance + the MD-4
               write-race funnel + the scripted creation). The LAUNCH replaces it — the install
               does not end with a claim, it ends with the user LOOKING AT their page. The launch
               IS the Concluder: a live SCP proves boot + route + render in one observable event.
  Actionable: LAUNCH the SCP via the equipped path — the SCS-Bridge MCP `launch_scp` tool anor the
              TUI launch (the SCP is launchable from the TUI).
              STALE-SERVER GUARD (FT-009): the SCP server may already be RUNNING from the Stage A
              install — its in-memory modules predate the home claim (the client rebuilt, but the
              SSR landing resolution reads boot-time state — FT-009 landed on the default this
              way). KILL the running holder first (`lsof -ti :{port} | xargs kill`), THEN launch —
              the fresh boot reads the claimed muxonomy. Run this AFTER the command exits
              with `✓ Home route claimed`, AFTER the DHHSB seeding — the LAST act before the
              Step 8 welcome. Report `✓ Step 8 of 8 — your SCP is opening` as it launches.
              A launch failure triggers Band 5.5 recovery (trigger B).
  Concluder: the SCP window OPENS with the user.s Suite 8 page live as the Home Page — the
             user.s eyes are the Lambda (URCA). No curl, no background process, no kill.

Band 4 [R4 Green — Verify the Route Swap] (Tier 0):
  Informative: Confirm getLandingPage() now resolves to the domain page. The resolver
               (vueRegistry.ts:162 getLandingPage) sorts `isMainLanding: true` concepts ascending by
               `order`; the domain page wins at order: 0. Cadmium may RETAIN isMainLanding: true at
               order: 4 — the command does NOT flip cadmium. The route wins by order resolution, not
               by exclusivity of the boolean.
  Actionable: Verify via the muxonomy source (the rebuilt bundle reflects it): confirm the domain
              concept's home navigation carries isMainLanding: true at order: 0 and points to
              '{domainLower}/vue/{Domain}HomeLanding'. If the SCP is running, hard-refresh `/` and
              confirm the domain page renders (the Domain Header shows {name}, the SSMC shows the
              domain's sessions, the Base Cascade Menu renders the Anchor-authored menu.json).
  Concluder: the RENAMED domain concept claims isMainLanding: true at order: 0 — lowest-order wins
             in getLandingPage's sort. Cadmium may RETAIN isMainLanding: true (the command does NOT
             flip it); the domain page at order: 0 outranks cadmium at order: 4. Verify:
             (a) `grep "isMainLanding: true" {scpRoot}/src/concepts/{domainLower}/{domainLower}.muxonomy.ts` — present
             (b) `grep "order: 0" {scpRoot}/src/concepts/{domainLower}/{domainLower}.muxonomy.ts` — present
             (c) The console output from Band 2 carries `✓ Home route claimed (isMainLanding: true · build:client OK)`

Band 5 [R5 Blue — DHHSB Seeding] (Tier 0):
  Informative: Read `Cascades/Working/DIAMOND-TIER-1.md` (the first Diamond · S8 RI activation wrote it).
               The DHHSB makes the adapt re-performable by any future agent or the user from their own
               planning artifact — the how-to survives as the project's durable fallback.
  Actionable: Append (Edit · do not overwrite) a `## Home Page Adapt` section to DIAMOND-TIER-1.md
              documenting the SAMLS swap so the user can re-perform it on any future cycle:
              ```
              ## Home Page Adapt (DHHSB · seeded by install S10)

              Your domain Suite 8 '{name}' is the SCP home page. To re-perform or change the swap:

              1. The renamed Domain Page (DSSLS · three zones + the Base Cascade Menu):
                 {scpRoot}/src/concepts/{domainLower}/vue/{Domain}HomeLanding.vue
                 - Zone 1 Domain Header · Zone 2 SSMC (mode=specific) · Zone 2.5 Base Cascade Menu
                   (ShatteriteMenu · GTMS8C · ALREADY wired) · Zone 3 Domain Work Surface
                 - Fill the `ADAPT:` markers: domainName, domainTagline, suite8Name (byte-match the
                   Cascades/8_SUITES/{name}/ directory name).

              2. The SAMLS swap — invoke `scs suite8:page --name "{name}" --home`
                 The command sets in {scpRoot}/src/concepts/{domainLower}/{domainLower}.muxonomy.ts:
                 - isMainLanding: true  (claim the `/` route)
                 - order: 0  (win any multi-concept tie · getLandingPage sorts lowest-order-first)
                 - componentPath: '{domainLower}/vue/{Domain}HomeLanding'  (the renamed adapted page)
                 The command DISABLES the competitors at claim time (USER DECISION · FT-008): the
                 DEFAULT landing isMainLanding → false AND cadmium isMainLanding → false — the
                 domain page is the ONE home, not merely the order winner.
                 To unclaim: set isMainLanding back to false on the domain page + rebuild.

              3. Rebuild: included in the command (`build:client` is gate iv of `--home`).
                 Verify: `✓ Home route claimed (isMainLanding: true · build:client OK)` in console output.
                 Then LAUNCH the SCP (launch_scp anor the TUI) — the live page is the proof.

              4. The SSMC import (binds the Session Manager to your domain):
                 import ScsBridgeSessionManagement from '.../scsBridge/vue/components/ScsBridgeSessionManagement.vue';
                 <ScsBridgeSessionManagement :mode="'specific'" :suite8-name="'{name}'" ... />
              ```
  Concluder: `grep -c "## Home Page Adapt" Cascades/Working/DIAMOND-TIER-1.md` ≥ 1

Band 5.5 [R7 Fuchsia — RECOVERY (fires on Band 2 ⚠ line OR Band 3 LAUNCH failure · FT-004 amendment B5)] (Tier 0):
  Informative: Two triggers: (A) the command exits with `⚠ Home route NOT claimed` — the command.s
               own SAMLS-only revert already fired; the base page is preserved. (B) the Band 3
               LAUNCH fails — the SAMLS edits landed and the client rebuilt, but the SCP does not
               open live; the agent must revert manually. Trigger (A) is the command.s revert;
               trigger (B) is the one agent-side gate requiring agent recovery.
  Actionable: (1) Report `✗ Step 7 of 8 — {the exact first error}` (never a silent exit).
                  For trigger (A): read `homeClaimRevertReason` from the ⚠ console line — the command
                  already reverted; no further filesystem work needed; the SCP is in WORKING state.
                  For trigger (B): REVERT the swap manually: isMainLanding true→false on the domain
                  navigation + rebuild (`npm run build:client`) — the SCP serves the prior landing
                  again (the unclaim path: flip the domain page back to false AND restore cadmium +
                  the DEFAULT to true — the command.s Phase-2 revert does exactly this on failure).
              (2) Surface the choice via AskUserQuestion: [R] Retry the adapt (return to Band 2) ·
                  [S] Skip the Home Page adapt for now (the DHHSB how-to in the Diamond lets the
                  user perform it later) · [Q] Conclude the install.
  Concluder: after recovery the SCP builds + boots clean — the install NEVER concludes with a broken SCP

Band 6 [R7 Fuchsia — Closeout + the Step 8 Welcome (Terminal)] (Tier 0 · Conference):
  Informative: Confirm the swap holds: the domain page carries isMainLanding: true at order: 0 ·
               the client rebuilt clean · DIAMOND-TIER-1.md carries the DHHSB block. Report
               `✓ Step 7 of 8 — your Suite 8 page is the Home Page`.
  Actionable: Emit `s10-home-page-adapted` signal. Surface clearly: "Your SCP now opens in your
              domain. Suite 8 '{name}' is the home page — your sessions, your work surface, your name.
              The how-to is seeded in your first Diamond (## Home Page Adapt) if you ever want to change
              it."
              Announce `▶ Step 8 of 8 — Welcome — your first choice` and render the DEFERRED
              welcome menu (SM-WELCOME-RI-ENGAGE data · AskUserQuestion):
                · [F] Begin First Diamond (Tutorial) — engage /scs-cascade
                · [D] Cinnabar Dialectic — engage inline → re-render
                · [B] Suite 8 Browser — /scs-cascade:registry
                · [Q] Done — graceful close: "Everything is saved. Open your SCP anytime from
                  the SCS-Bridge; run /cascade in any session to begin."
              This is the install's ONLY decision gate — everything before it was the
              continuous motion (SPP · Conductor.md).
  Concluder: install agent terminates after the Step 8 choice executes (the typical-user arc is
             complete: own CLAUDE.md → Suite 8 → first SCP → domain home page → welcome)

</VermillionPlan>
```

---

## Invariants

- **One-home landing (USER DECISION · FT-008 · supersedes order-resolution)**: at claim time the command performs THREE ops atomically — the domain HomeNavigation claims (isMainLanding: true · order: 0), the DEFAULT landing in vue.principle.ts is DISABLED (isMainLanding → false), and the cadmium incumbent is flipped (isMainLanding → false). After the swap exactly ONE concept claims the home. All three are snapshot-covered by the SAMLS-only revert.
- **order: 0 for the domain page**: the user's home page wins any future multi-concept tie. getLandingPage() sorts lowest-order-first among isMainLanding: true concepts.
- **Rebuild is mandatory**: the muxonomy is a build-time source. `npm run build:client` from `{scpRoot}` is the Lambda-event that makes the swap real — without it the bundle still serves the old landing.
- **DHHSB into DIAMOND-TIER-1.md only**: the how-to lands in the user's first Diamond (the project's own planning artifact) — NOT a separate doc. The adapt knowledge travels with the project and is available on the first cycle.
- **Minimal-diff edits**: the SAMLS swap is Edit per field (isMainLanding · order · color/label) — never rewrite the muxonomy file. The DHHSB is an append (Edit), never an overwrite of DIAMOND-TIER-1.md.
- **Reversible**: the claim is three booleans, all snapshot-covered — the command.s Phase-2 revert (anor a manual unclaim: domain page → false · cadmium → true · the DEFAULT → true · rebuild) restores the prior landing exactly. Never a deletion.
- **Manifest tracking**: write `'updated'` manifest entries for {domainLower}.muxonomy.ts and DIAMOND-TIER-1.md so a reverse-muxify can restore the prior state precisely (cadmium.muxonomy.ts is NOT mutated by the command — no entry needed for it).

---

## Pearl

S10 = the **swap that makes the arrival default**. S9 filled the Template Suite 8 Page with the user's domain; S10 flips one boolean (isMainLanding) and rebuilds — and now the user's SCP opens in their domain, by name, with their sessions in view, instead of in generic SCS infrastructure. The swap is the smallest meaningful act of personalization (SAMLS) and it is fully reversible (a boolean, not a deletion). The how-to is seeded into the user's first Diamond (DHHSB) so the knowledge survives as the project's durable fallback — the user owns the adapt, not just its result. This closes the typical-user arc: own CLAUDE.md → Suite 8 → Stratidian welcome → first SCP → their domain as the home page.
