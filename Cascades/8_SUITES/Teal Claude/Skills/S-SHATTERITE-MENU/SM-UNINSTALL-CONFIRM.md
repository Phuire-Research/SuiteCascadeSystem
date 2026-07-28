# SM-UNINSTALL-CONFIRM — Shatterite Menu Reference Design (Diamond B-26)

**Origin Strategy**: SCS Bridge `scs uninstall` CLI subcommand (NEW B-26)
**Pewter HiFi Tokens**: D5 closed-box border · D7 active-button inversion · D1 color tokens (Rose-tint warn · Cobalt informational · Pewter neutral)
**Frontier Pattern**: CD-118 SCDU — Shatterite-Confirmation-Destructive-Uninstall

---

## Engagement Criteria

Renders BEFORE `uninstallSCS()` engages. The user invoked `scs uninstall` from a directory containing `Cascades/Iced/MuxificationManifest.json` (pre-flight gate verified an install exists). This menu surfaces what the destructive operation will do (Reverse + Remove + Preserve list) and gates execution behind explicit user confirmation.

**Default**: `[N] Cancel` (D7 active-button on the SAFE option · destructive-op safety inverts the normal Cobalt-default convention).

---

## Menu Data Sources

- `cwd` — current working directory where `scs uninstall` was invoked
- `Cascades/Iced/MuxificationManifest.json` — pre-flight verified to exist (otherwise no-op exit before this menu)
- Static content: what will be Reversed/Removed/Preserved (per `uninstallSCS()` contract)

---

## Pewter HiFi Rendering (paste-ready ANSI text prototype)

```
  ┌──────────────────────────────────────────────────────────────┐
  │  Uninstall SCS Bridge                                        │
  │                                                              │
  │  This will:                                                  │
  │    · Reverse install operations from MuxificationManifest    │
  │    · Restore .claude/CLAUDE.md from PreInstallSnapshot       │
  │    · Remove .claude/agents/scs-*.md + .claude/commands/scs-* │
  │    · Remove Cascades/Bridge/  (session-manager state)        │
  │                                                              │
  │  Will PRESERVE (data the user may access):                   │
  │    · Cascades/8_SUITES/  (Suite 8 templates)                 │
  │    · Cascades/Working/  (your Diamond + Onyx WGBs)           │
  │    · Cascades/Documentation/  (reference docs)               │
  │    · Cascades/Iced/  (Snapshot + Manifest + UserSCSConfig)   │
  │                                                              │
  │  cwd: /Users/.../typical-user-reference-008                  │
  └──────────────────────────────────────────────────────────────┘

  Continue? [y/N]:
```

**Diamond B-26-PEWTER hotfix v0.36.3 (CD-127 RDDU · Retained-Data-Dirs-on-Uninstall)**: User directive shrunk the destructive surface — `Cascades/{8_SUITES, Working, Documentation, Lab}` are user data, NOT removed; only `Cascades/Bridge/` (session-manager state · stale without SCS) is swept. `'agent-derived'` manifest action becomes a no-op (those files live inside retained dirs).

D5 border construction: top/right DARK · bottom/left LIGHT · matches `installAnimation.ts buildPewterPane` + B-22 trust-confer pane + B-25-UX SM-* menus for cross-Diamond visual continuity.

---

## D1-D8 Token Application Table

| Element | Token | Color/Style |
|---|---|---|
| Border | D5 closed-box | Pewter neutral · DARK top-right + LIGHT bottom-left |
| Title "Uninstall SCS Bridge" | D6 typography H1 | Rose-tint + BOLD (destructive op signal) |
| "This will:" introducer | D6 typography body | Pewter neutral |
| Will-do bullets | D6 typography list | Pewter normal |
| "Will PRESERVE:" introducer | D6 typography body | Cobalt + BOLD (preservation = primary positive) |
| Preserve bullets | D6 typography list | Viridian (yours-already · CD-92 USCPPP language) |
| `cwd:` line | D4 text shadow complement | Pewter DIM (informational metadata) |
| Confirmation prompt `Continue? [y/N]:` | D7 button variant active-default-N | Default = N (safe) · uppercase signals default |
| Y option (when typed) | D7 button variant warn | Rose-tint REVERSE (destructive activate) |
| N option / silence / cancel | D7 button variant neutral | Pewter normal |

---

## Conference Pattern (readline integration)

This menu uses standard readline (`node:readline/promises`) rather than full Shatterite `AskUserQuestion` because:
1. CLI subcommand doesn't have an interactive Claude session running
2. Confirmation is binary (Y/N) · no need for menu navigation
3. Pewter HiFi visual rendering is preserved via process.stdout.write
4. Default-to-safe ([N]) is enforced by the `[y/N]` capitalization convention

```typescript
// Render the box (process.stdout.write per src/commands/uninstall.ts)
renderUninstallConfirmMenu(userCwd);

// Prompt
const rl = readline.createInterface({ input: stdin, output: stdout });
const answer = (await rl.question('  Continue? [y/N]: ')).trim().toLowerCase();
rl.close();

// Default = cancel (any non-y answer)
if (answer !== 'y' && answer !== 'yes') {
  console.log('  Cancelled · no changes made.');
  process.exit(0);
}
```

For `--yes` flag bypass: skip the menu entirely and proceed (used in scripts/CI).

---

## Cross-Surface Coherence

This menu shares Pewter visual identity with:
- B-22 trust-confer pane (D5 border + Rose-tint warn for destructive · same token convention)
- B-17/18 install animation `buildPewterPane` (D5 border)
- B-25-UX SM-NAME-SUITE-8 + SM-MULTI-SUITE-BRANCH + SM-WELCOME-RI-ENGAGE (D5 + D7 token discipline)

**Inverted convention**: where install/welcome menus default to Cobalt-active row (primary action), THIS menu defaults to N-Cancel because the operation is DESTRUCTIVE. Safety-first.

---

## Pearl

Destructive operations require asymmetric defaults. The user typed `scs uninstall` deliberately · BUT the confirmation must default to Cancel because the operation deletes filesystem state. The menu's job is not to present neutral choice · it's to BIAS the choice toward safety while accepting that the user can confirm if they meant it. The `[y/N]` convention (uppercase = default) makes the default visible at the prompt level. CD-118 SCDU codifies this asymmetry as Shatterite discipline for destructive ops.
