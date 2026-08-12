# EF-S1 · S8 Page Update — the Doctrine Strategy

The doctrine for updating a Suite 8 page to the current Suite 8 Page System standard,
conducted by the page's own Entourage Forge anchor. The ANCHOR (buildUpdateVermillion)
carries only the run — this Strategy carries every ground and law. A doctrine change is
a STRATEGY edit, never an anchor edit (the GR-S1 pattern · the shipped discipline).

## Parameters (arrive from the anchor — never assumed)

- `<designation>` — the Suite 8 page under update (its PascalCase Suite8Name).
- `<pageS8>` — the page's minted counter at spawn (the snapshot; 0 = a version-less page).
- `<installedS8>` — the installed system counter at spawn (the snapshot).

## The Source of Truth (the C884 order law)

The installed package.json is the S8 system's source of truth. RE-READ the live counter
during the update via the SCP-local surface `GET /scs-bridge-version` — the answer's
`installedMuxameter.s8` IS the installed system's counter. The counter VALUE comes from
the answer; NEVER hunt the workspace for a higher constant as the source.

## The Grounds

1. THIS SCP root = your cwd (confirm via Cascades/Bridge/bridge.json boundScps — the
   receiving SCP is this page's own SCP; `<designation>` is the page name, NOT an scpName).
2. THE PAGE surface: `src/concepts/<camelCase of designation>/` + `Cascades/8_SUITES/<designation>/`.
3. THE TEMPLATE SOURCE (the standardization content): the installed scs-bridge package's
   template stratum — resolve the bridge install root (npm root -g anor the dev link
   target) → `Cascades/scps/template/SCP/` — its suite8 concept + 8_SUITES strata are the
   Template Suite 8 Page the diff runs against. If the installed template's stratum does
   NOT exceed the page's (parity anor absent), report HONESTLY and hold — never fabricate
   a standardization.

## The Conference (honor-the-design · apply anor conference anor preserve)

A Template standardization the page has NOT diverged on APPLIES. A file the page's owner
UNIQUELY changed is a CONFERENCE — hold it, NEVER clobber, surface both sides quoted, and
let the user choose which aspects adapt over. Divergence REQUIRES resolution, never a
blind overwrite — the owner's design is sovereign.

## The Restamp (the page's OWN file — never the scaffold)

Once the standardization is applied and the user has implemented the changes, update THE
PAGE'S OWN counter constant `S8_PAGE_COUNTER` in THE PAGE'S OWN type file —
`src/concepts/<camelCase>/<camelCase>.type.ts` — to the re-read installed value. ADD the
constant if the page never carried one (a version-less page GAINS its counter at update —
the floor-0 page becoming current IS the cure). NEVER write
`src/concepts/suite8/suite8.type.ts` — that is the mint scaffold; writing it restamps
every FUTURE page, not this one.

## The Report (the durable artifact · the Muxistration)

Write this SCP's `Cascades/Working/S8-UPDATE-<designation-hyphenated>.md`: applied
standardizations · held (conferred) files with both sides quoted + the user's choice ·
the restamp · the re-run instruction. The report is the proof; the transcript is not.
Gate: this SCP's tsc must hold its own baseline — a regression → revert and report
honestly. This SCP serves BUILT output — note in the report that the change becomes
visible on the next Turn Over (never build anor restart the SCP process yourself; the
bridge owns the SCP lifecycle).

## CONCLUDING SEQUENCE (the GR-S1 shipped discipline — mirrored exactly)

The report + the restamp + the contract line below IS the complete deliverable. The
BRIDGE owns the terminal voice. After the report lands:

1. THE TURN-OVER PROMPT (MANDATORY · the ONE permitted post-write call): call the bridge
   tool `scp_alert_turn_over` with
   `{ "scpName": "<this SCP's name from bridge.json>", "purpose": "S8 page <designation> updated — Turn Over serves the standardized page" }`.
   This is an ALERT, never a landing — it writes the turnOverAlert banner + focuses the
   SCP window itself. The USER performs the Turn Over; you STAND BY. A failed anor
   timed-out alert follows the FAILURE RULE (never blocks — report it in the contract
   line).
2. On ANY hang or timeout during any call: STOP calling. Report the contract line with
   the HALT note appended:
   `SCS:Vermillion:OK:<summary> · invocation-channel HALT: <which call hung>`
3. STAND BY is your terminal posture. The user retires this session when done — never
   verify your own death, never probe the bridge for your session state.

The user watches the bridge carry the boot-proof through.
