# S9 — Domain Page Create (the PROVEN Mint + the Forge Assumption)

**Strategy**: Domain Page Create — install the user's first SCP, mint the user's domain Suite 8
through THE PROVEN SCAFFOLDING MEANS, load the SCP for the user to view, focus the new page,
then ASSUME THE ENTOURAGE FORGE PERSONA to continue the build-out.
**Phase**: S9 (post-S8 · AUTOMATIC continuation — SPP continuous motion).
**Conductor**: SCS Bridge Install Conductor (the Installation Agent — the SCS-Bridge Suite 8).
**Input**: result of S8 (named Suite 8 · `Cascades/8_SUITES/{name}/Instance.md`) ·
`Cascades/SCPs.json` · the Template SCP.
**Output**: the user's first SCP installed · the domain Suite 8 MINTED by the proven means
(the SCP server's `POST /s8/create` — the Rotary-Nav Create-S8 seed: the staged In-Focus
menu.json + the Summon row + Instance/Maintainer/Cascade.json/S8.json + Working/) · the SCP
loaded and the NEW PAGE focused · the agent operating AS the Entourage Forge.

---

## Engagement Criteria (REWRITTEN C780)

S9 fires automatically after S8 Band 6. THE CHANGES (user directive):
1. **NO HOME-PAGE CLAIM** — the converted domain Suite 8 is NOT set as the SCP home page. The
   default Home keeps the landing. (`scs suite8:page --home` is inert; S10 is RETIRED.)
2. **THE PROVEN MEANS ONLY** — the page/S8 creation uses the SAME scaffolding confirmed fully
   operational (the Frontier program · C763): the SCP server's mint (`POST /s8/create
   { name }` once the SCP is up — the identical seed the Rotary Nav uses), followed by the
   Forge page build. NO divergent adapt-markers path.
3. **THE POST-SCAFFOLD SEQUENCE** (strictly ordered):
   a. Complete the initial scaffolding (the mint + the page build) — Concluders green.
   b. LOAD the SCP for the user to view (boot/focus the SCP window — the existing flow).
   b2. **THE STALE-SERVER LAW + THE STAND-BY (C785)** — under the C784 ladder the SCP boots
      BEFORE the mint, so the served bundle ALWAYS predates the new page (routes 200 via the
      SPA catch-all but serve the old landing — the 200s lie). NEVER build, kill, anor restart
      the SCP process yourself: the bridge owns the SCP lifecycle (an external kill strands the
      session registry at status live and the relaunch silently no-ops — the Blank-Test-004
      tangle). Instead call **`scp_alert_turn_over { scpName, purpose }`**: the SCP window
      focuses and a banner directs the user to press TURN OVER A in the TaskBar — the sovereign
      GitM rebuild+restart. INFORM the user of the purpose: this is their FIRST CONTACT with
      the build-while-you-use loop; the introduction IS the point — a very clean introduction
      to the system. THEN STAND BY: present an INLINE markdown menu of the next options
      (numbered questions · lettered options · reply-by-code · NEVER AskUserQuestion for this
      menu), and POLL `<scpDir>/Cascades/Bridge/gitm.json` until `turnOver.at` EXCEEDS
      `turnOverAlert.requestedAt` (the outcome signal — the alert self-retires), then Concluder
      the served page (the island chunk anor the title) before (c).
   c. **`scp_focus_suite8_page { suite8Name }`** — the SCP tool (part of THIS Vermillion):
      focuses the SCP window AND navigates it to the NEW Suite 8 page, so the user is LOOKING
      AT the page before the build-out begins.
   d. **ASSUME THE ENTOURAGE FORGE PERSONA**: read the SCP-local
      `Cascades/8_SUITES/Entourage Forge/{Instance.md · Conductor.md · Onboard.md}` and
      OPERATE AS the Forge from this point — the in-context Conference law applies
      (AskUserQuestion renders the decisions; one decision per stage).
   e. **OFFER THE MODEL CHANGE** — the FIRST Forge conference: offer the user the model for
      the page's Anchor/work sessions (the per-instance model control), then continue the
      page build-out as the Forge.

---

## Vermillion Plan

```
<VermillionPlan topic="Domain Page Create — first SCP + Template Suite 8 Page adapt">

Band 1 [R1 Red — Curate Domain Identity] (Tier 0):
  Informative: Read `Cascades/8_SUITES/{name}/Instance.md` (the Suite 8 S7 created · S8 renamed).
               Extract the Designation (the domain name) and the Identity / one-line tagline
               (the first descriptive sentence under `## Identity` or `## Original Content`).
               Read `Cascades/SCPs.json` (if present) to determine whether an SCP is already installed.
               THE TEMPLATE-SCP LAW (C782): the shipped Template SCP is a DEFAULT, not the user's
               SCP — EXCLUDE any entry whose name is `template` (anor whose path is the shipped
               `Cascades/scps/template/SCP`) from this count. An inventory holding ONLY the
               template counts as ZERO installed SCPs.
  Actionable: Capture domainName (= {name}, byte-for-byte the Suite 8 directory name),
              domainTagline (one-line · sanitize to a single sentence ≤ 120 chars · fallback:
              "Your project, now a first-class Suite 8 within the Stratidian Manifold."),
              and scpAlreadyInstalled (boolean · true if SCPs.json lists ≥1 installed SCP
              AFTER excluding the Template SCP per the law above).
  Concluder: `test -f Cascades/8_SUITES/{name}/Instance.md && echo ok`

Band 2 [R4 Green — Examine SCP State] (Tier 0):
  Informative: If scpAlreadyInstalled === false: the user has no SCP yet — they need their first.
               If true: identify the target SCP (the most-recently-installed entry in SCPs.json)
               whose home page will host the domain Suite 8.
  Actionable: Determine the install action:
                - scpAlreadyInstalled === false → flag installFirstScp = true (Band 3 installs it)
                - scpAlreadyInstalled === true  → flag installFirstScp = false; capture scpRoot from
                  the SCPs.json entry's `scpPath` (the target for the page adapt)
  Concluder: log installFirstScp + targetScpRoot (if known)

Band 3 [R5 Blue — Install First SCP] (Tier 0 · Conditional):
  Informative: IF installFirstScp === true: the canonical SCP install is the TUI Install SCP wizard
               (animatedTui.ts · runInstallScpPipeline in src/lib/scp/scpInstall.ts) anor the MCP
               `launch_scp` path (scsBridgeLaunchScp.quality.huirth.ts reads SCPs.json for
               scpPath/port). The install agent does NOT re-implement the cloner — it DIRECTS the
               user to the existing path. Surface: "You have no SCP yet. Run the TUI Install SCP
               wizard (the [⊕ Install SCP] row in the SCS Bridge TUI) to create your first SCP from
               the template, then return here." OR, if the install can be driven programmatically in
               this context, invoke runInstallScpPipeline against the template SCP.
  Actionable: IF installFirstScp === false: skip silently (the SCP already exists · proceed to adapt).
              IF installFirstScp === true and the install completed: re-read SCPs.json, capture
              scpRoot from the new entry's `scpPath`.
  Concluder: IF an SCP is expected → `test -d {scpRoot}/src/concepts/suite8/vue && echo ok`
             (the SCP scaffold exists with the suite8 concept · the adapt target is present)

Band 3.5 [R5 Blue — Create the Domain Concept + Claim Home (TQNI-RT · ONE MOTION)] (Tier 0):
  Informative: The copy-move-rename pipeline (TQNI-RT · AIME inserts · IslandWrapper + vue.principle
               REGISTERED_MUXONOMICS registration · tsc gate) AND the SAMLS home claim (the navigation
               swap + DEFAULT disable + cadmium flip + build:client) are BOTH scripted inside
               `runSuite8PageCreate`. Invoke the command in ONE motion and read its console output as
               the Concluder.
  Actionable: Invoke: `scs suite8:page --name "{NamePascal}" --display-name "{name}" --home`
              ({NamePascal} = the no-space PascalCase form the validator requires · {name} = the
              EXACT Cascades/8_SUITES/{name}/ dir name with spaces — the command fills the page
              header + the SSMC session-filter binding with it; FT-007 amendment: without it the
              PascalCase form landed in the page and the agent had to hand-fix both refs)
              (FT-008 amendment: the agent SETS HOME IN THIS PASS — the two-invocation prohibition is
              REVOKED. The prior `(NO --home here — S10 owns it)` note created a doctrinal seam an
              agent could misread as "S10 is optional." S9 now both CREATES the page and CLAIMS the
              home route. S10 Band 2 becomes VERIFY-ONLY — it reads the `✓ Home route claimed` line
              this command already emitted; it does NOT re-invoke.)
              Read the console output and verify the success block:
  Concluder: On success with --home the command prints:
    ✓ Suite 8 page created
      Domain:        {Domain}
      Concept:       {domainLower}
      SCP root:      {absolute-path}
      Files renamed: {N}
      AIME inserts:  island=inserted · huirth=inserted · registry=inserted
      Gates passed:  positive-presence → zero-grep → tsc
    ✓ Home route claimed (isMainLanding: true · build:client OK)
    Presence of `✓ Suite 8 page created` = all three create gates passed (positive-presence +
    zero-grep + tsc EXIT 0). Presence of `✓ Home route claimed` = the SAMLS swap + the three home
    ops (navigation swap · DEFAULT disable · cadmium flip) landed + build:client EXIT 0.
    On create failure the command prints:
    ✗ suite8:page failed: {result.reason}
      Reverted: filesystem restored to pre-run state   ← present when result.reverted===true
    On gate-iv (build:client) failure AFTER the create gates passed:
    ⚠ Home route NOT claimed — base page preserved · {homeClaimRevertReason}
    A `✗` line halts Band 3.5; a `⚠` line means the page exists but the home claim reverted (the
    SAMLS-only revert restored all three home-op files) — surface it and proceed to S10 Band 5.5.
              (page.ts:40-45 — failure branch · page.ts:48-63 — success branch)

Band 4 [R5 Blue — Adapt the Domain Page] (Tier 0):
  Informative: Read `{scpRoot}/src/concepts/{domainLower}/vue/{Domain}HomeLanding.vue` — the RENAMED
               page (DSSLS scaffold). The ShatteriteMenu + PAOLRP are ALREADY wired (GTMS8C W3) —
               this adapt fills domain CONTENT only, NOT the pipe. Locate the three `ADAPT:` zones:
                 (1) DOMAIN IDENTITY refs: domainName, domainTagline, suite8Name
                 (2) DOMAIN HEADER pane class (hifi-pane-base → optional suite-tier swap)
                 (3) DOMAIN WORK SURFACE placeholder section
  Actionable: Edit {Domain}HomeLanding.vue (minimal-diff · Edit per marker · NEVER rewrite the file):
                - replace `ref<string>('Your Domain')` for domainName with `ref<string>('{name}')`
                - replace the domainTagline ref default with the user's one-line identity
                - replace the suite8Name ref default 'Your Domain' with '{name}'
                  (CRITICAL · byte-match the Cascades/8_SUITES/{name}/ directory name so the SSMC
                   mode=specific filter, the PAOLRP spawn, AND the ShatteriteMenu anchor lookup all
                   bind to ONE designation · the single integration invariant W3-A)
                - OPTIONAL: swap the DOMAIN HEADER `hifi-pane-base` for the user's suite-tier pane
                  (hifi-pane-cobalt / hifi-pane-viridian / hifi-pane-orange · matches the muxonomy color)
                - OPTIONAL: fill the DOMAIN WORK SURFACE — replace the placeholder paragraph + hints
                  with the domain's primary surface (a form, a launcher, a dashboard). If the domain
                  has no surface yet, leave the scaffold placeholder (it reads as an intentional stub).
                  NOTE: the Base Cascade Menu (ShatteriteMenu) is ALREADY in ZONE 2.5 — do not remove it.
  Concluder: `grep -c "{name}" {scpRoot}/src/concepts/{domainLower}/vue/{Domain}HomeLanding.vue` ≥ 2
             (domainName + suite8Name both bound to the user's domain)

Band 5 [R7 Fuchsia — Closeout] (Tier 0):
  Informative: Confirm {Domain}HomeLanding.vue is adapted; read its line count via `wc -l`.
               Confirm the suite8Name is bound (the W3-A integration invariant binding).
               Confirm `Cascades/8_SUITES/{name}/Onboard.md` carries the SCS:Init Base Cascade Menu
               teaching (copied+renamed from the Template Onboard · GTMS8C W4).
  Actionable: Emit `s9-domain-page-adapted` signal. The home claim was ALREADY made in Band 3.5
              (the `--home` ONE MOTION · FT-008) — S10 VERIFIES it (reads `✓ Home route claimed`)
              and seeds the DHHSB; S10 does NOT re-invoke the command.
              Confirm the Onboard seeding: the user's Suite 8 dir has the Base Cascade Menu teaching
              so the spawned Anchor authors menu.json on SCS:Init.
              Report `✓ Step 6 of 8 — your first SCP is installed + your Suite 8 fills the domain
              page` (SPP · Conductor.md).
              Announce `▶ Step 7 of 8 — Making your Suite 8 page the Home Page` and PROCEED
              DIRECTLY to Strategy S10 — Home Page Adapt (the continuous motion · no pause).
  Concluder: `grep -c "SCS:Init" "Cascades/8_SUITES/{name}/Onboard.md"` ≥ 1 (the menu teaching seeded)

</VermillionPlan>
```

---

## Invariants

- **Instance.md source of truth**: the domain name + tagline come from `Cascades/8_SUITES/{name}/Instance.md` (the S7+S8 product) — NEVER re-surveyed. The Context Bridge means the identity is already known.
- **SCP install is delegated, not re-implemented**: S9 directs the user to the existing TUI Install SCP wizard (anor the MCP `launch_scp` path) — the install agent does not clone the template itself unless the install can be driven programmatically in-context.
- **suite8Name byte-match**: the SSMC `suite8Name` prop MUST equal the `Cascades/8_SUITES/{name}/` directory name exactly — the mode=specific session filter depends on it.
- **Minimal-diff adapt**: edit the `ADAPT:` markers with Edit (per marker) — never rewrite Suite8HomeLanding.vue. The scaffold's structure (three zones · SSMC import · muxium lifecycle) is correct as shipped.
- **Home claim is ONE MOTION in S9 (FT-008)**: Band 3.5 invokes `--home` so the page is created AND the home route claimed in a single pass. The two-invocation seam (S9 bare-create → S10 re-invoke) is RETIRED — it was a skip risk (an agent could read "S10 owns it" as "S10 is optional"). The command's two-phase internal architecture (Phase 1 create + full-revert · Phase 2 SAMLS + SAMLS-only-revert) is UNCHANGED; only the Vermillion passes both flags at once. The claim stays reversible — the Phase-2 SAMLS-only revert preserves the base page on a build:client failure.
- **Copy-Move-Rename is scripted (OPTION B · GTMS8C)**: Band 3.5 invokes `scs suite8:page --name "{name}" --display-name "{name}" --home` which runs the full TQNI-RT pipeline — cp, rename, AIME inserts (island + huirth + vue.principle REGISTERED_MUXONOMICS · the THIRD SURFACE · FT-008), tsc gate — then the SAMLS home claim. The original `suite8` concept stays registered + operable (general-name shipping). The command's internal create gates (positive-presence → zero-grep → tsc) are surfaced in the console output; `✓ Suite 8 page created` means all three passed; `✓ Home route claimed` means the home ops + build:client passed.
- **The single cascading constant**: `SUITE8_CONCEPT_NAME` in suite8.type.ts is the ONE edit inside the command that regenerates all VERBOSE-derived type strings. The command handles the 2 menu qualities + the muxonomy LITERAL form (cadmium precedent) via its internal find-replace and zero-grep Concluder.
- **Manifest tracking**: write an `'agent-derived'` manifest entry for the renamed {domainLower}/ dir + any new SCP files and an `'updated'` entry for the edited huirth.concept.ts / IslandWrapper.vue so a reverse-muxify can locate them precisely.

---

## Pearl

S9 = the **actualization of the user's domain into a home**. S7 deposited the user's context as a Suite 8; S8 named it with the user's agency; S9 gives that Suite 8 a place to live — the user's first SCP, with the Template Suite 8 Page (the pared-down Cadmium scaffold) adapted to their domain. The install agent reads the domain identity it already holds (the Context Bridge · CACB), fills the ADAPT markers (DSSLS), and binds the Session Manager to the domain (SSMC). The user does not arrive in generic SCS infrastructure — they arrive in their domain, by name, with their sessions in view. S10 then makes that arrival the default.
