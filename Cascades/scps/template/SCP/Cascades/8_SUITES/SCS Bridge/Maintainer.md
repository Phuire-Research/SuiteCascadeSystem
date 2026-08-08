# SCS Bridge — Aspect Transplant Manifest (Maintainer.md)

## Preamble — the Boundary Law

Designation, Home SCP, and Dependencies are **identity-bearing** at any future update
seam. The part-renewal doctrine that guards the SCP self-update circuit (C293: identity-bearing
files take disposition WRITE — full theirs; NEVER patch) applies one level up to Suite-8 identity:
a partial update MUST NOT revert this Suite 8's Designation, re-home it, or silently drop a
declared Dependency. The Sovereignty Boundary below names what is portable and what is fixed —
the boundary makes transfer meaningful; this manifest makes the boundary crossable.

## Sovereignty Boundary

- **Home SCP**: bridge (operating set — NOT migrated to the template)
- **Installed-in**: bridge root only. SCS Bridge maintains the bridge session manager + install
  orchestrator; it does NOT ride the SCP install clone (it IS the installer).
- **Fixed**: Designation (`SCS Bridge`).

## Skills Registry

| Skill | File | Currency Gate (one-liner) | Last Executed |
|-------|------|---------------------------|---------------|
| SB-DS1 Dock Host Start | `Skills/SB-DS1-Dock-Host-Start/` | scpDockHost start Quality still binds the dock server | UNKNOWN |
| SB-DS2 Register Scp | `Skills/SB-DS2-Register-Scp/` | scpDockHostRegisterScp still appends to the registry | UNKNOWN |
| SB-DS3 Unregister Scp | `Skills/SB-DS3-Unregister-Scp/` | scpDockHostUnregisterScp still evicts cleanly | UNKNOWN |
| SB-DS4 Publish Logs | `Skills/SB-DS4-Publish-Logs/` | scpDockHostPublishLogs still streams | UNKNOWN |
| SB-DS5 Dock Host Teardown | `Skills/SB-DS5-Dock-Host-Teardown/` | scpDockHostTeardown still closes the server | UNKNOWN |
| SB-DS6 Offscreen UI Doctrine | `Skills/SB-DS6-Offscreen-UI-Doctrine/` | SCP surface still renders offscreen (electronWindow offscreen:true) → OS chrome still cannot anchor → in-DOM controls still required | UNKNOWN |

*Registry lists ~126+ SB-S* skills in Instance.md prose across Diamonds; the `Skills/` dir carries
the 5 canonical Dock Server (SB-DS*) skill dirs — enumerate `Skills/` for the live file set.*

## Muxonomy Registration

- **Designation**: SCS Bridge
- **Configuration**: Conductor
- **Domain**: Hands-Off Session Manager + Install Orchestrator — animated TUI surface (default
  `scs`), registry-as-source-of-truth liveness, SCP spawn/anchor, install pipeline, MCP
  `launch_scp` tool, GitM self-update circuit.
- **Dependencies**: the `scpDockHost` Stratimux Concept (5th Tier-2 sibling · 6 Qualities);
  `Cascades/SCPs.json` registry; the install clone engine (`scpInstall.ts`); the Gitm Resolver
  (SCP update merge). Cross-Suite-8: Gitm Resolver (update circuit).

## Cascade Position Marker

- **Gate**: UNKNOWN
- **PENDING**: MCP-Skill Diamond TESTING (awaiting user-Lambda curl smoke per Testing-Gated Commit)
