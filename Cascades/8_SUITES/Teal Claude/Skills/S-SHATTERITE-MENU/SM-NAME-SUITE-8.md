# SM-NAME-SUITE-8 — Shatterite Menu Reference Design (Diamond B-25-UX)

**Origin Strategy**: SCS Bridge Strategy S8-StratidianWelcome (Band 2)
**Pewter HiFi Tokens**: D5 closed-box border · D7 active-button inversion · D1 color tokens (Cobalt title · Viridian highlight · Pewter neutral)
**Frontier Pattern**: CD-98 SDSWN — Shatterite-Driven-Suite-8-Naming-Welcome

---

## Engagement Criteria

User has just had their CLAUDE.md content muxified into a Suite 8 (Strategy S7). The S7 auto-name is the seed; this menu lets the user pick a better one from algorithmic suggestions OR enter custom OR keep the auto-name.

The menu replaces unilateral agent naming with user agency at install time.

---

## Menu Data Sources

Per `src/lib/bridge/projectNameSuggest.ts` `generateNameSuggestions(opts)`:

- **Slot A**: package.json `name` → sanitize → "+ Project Context" (e.g., `awesome-lib` → "Awesome Lib Project Context")
- **Slot B**: type-qualified — package.json + detected project type (e.g., "Awesome Lib TypeScript Library")
- **Slot C**: first meaningful H2 from CLAUDE.md (skipping generic "Conventions" / "Workflow" / "Testing")
- **Slot D**: second meaningful H2 from CLAUDE.md (omit if <2 meaningful H2s)
- **Slot E**: bare sanitized name (no suffix · only if non-generic)
- **Slot F**: `[Custom name…]` free-text input row
- **Slot G**: `[Keep S7 auto-name]` row (always rendered as fallback)
- **Slot H**: `[Cancel]` row

Generates 4-6 algorithmic suggestions + Custom + Keep + Cancel = 6-8 total rows.

---

## Pewter HiFi Rendering (paste-ready ANSI text prototype)

```
┌─────────────────────────────────────────────────────────────┐
│  Suite 8 Naming                                             │
│                                                             │
│  Your project content was muxified into a Suite 8.          │
│  Pick a name (or keep the suggested default).               │
│                                                             │
│  ▶ 1. My App Project Context              ← suggested       │
│    2. My App TypeScript Library           ← type-qualified  │
│    3. Auth Service Context                ← from CLAUDE.md  │
│    4. My App                              ← bare name       │
│                                                             │
│    [C] Custom name…                                         │
│    [K] Keep auto-name (User Project Context)                │
│    [Q] Cancel install                                       │
│                                                             │
│  ↑/↓ select · Enter activate · Esc cancel                   │
└─────────────────────────────────────────────────────────────┘
```

D5 border construction: top/right DARK · bottom/left LIGHT · corners join consistently.

---

## D1-D8 Token Application Table

| Element | Token | Color/Style |
|---|---|---|
| Border | D5 closed-box | Pewter neutral · DARK top-right + LIGHT bottom-left |
| Title "Suite 8 Naming" | D6 typography H1 | Cobalt + BOLD |
| Body intro text | D6 typography paragraph | Pewter neutral |
| Active row prefix `▶ ` | D7 button variant active | REVERSE + BOLD + Cobalt |
| Inactive row prefix `  ` | D7 button variant inactive | Pewter dim |
| Active row text | D1 color | Cobalt |
| Inactive suggestion text | D1 color | Pewter normal |
| Source annotation `← suggested` | D4 text shadow complement | Pewter DIM (unobtrusive) |
| `[C] Custom name…` | D7 button variant secondary | Ochre |
| `[K] Keep auto-name` | D7 button variant secondary | Pewter dim |
| `[Q] Cancel install` | D7 button variant warn | Rose-tint |
| Footer hint | D6 typography small | Pewter DIM |

---

## Conference Pattern (AskUserQuestion integration)

Shatterite Menu Skill receives:
```typescript
{
  menuId: 'SM-NAME-SUITE-8',
  header: 'Suite 8 Naming',
  intro: 'Your project content was muxified into a Suite 8.\nPick a name (or keep the suggested default).',
  rows: [
    { key: '1', label: 'My App Project Context', annotation: 'suggested', returns: { kind: 'pick', value: 'My App Project Context' } },
    { key: '2', label: 'My App TypeScript Library', annotation: 'type-qualified', returns: { kind: 'pick', value: 'My App TypeScript Library' } },
    { key: '3', label: 'Auth Service Context', annotation: 'from CLAUDE.md', returns: { kind: 'pick', value: 'Auth Service Context' } },
    { key: '4', label: 'My App', annotation: 'bare name', returns: { kind: 'pick', value: 'My App' } },
    { key: 'C', label: 'Custom name…', returns: { kind: 'custom' } },
    { key: 'K', label: 'Keep auto-name (User Project Context)', returns: { kind: 'keep' } },
    { key: 'Q', label: 'Cancel install', returns: { kind: 'cancel' } },
  ],
  footer: '↑/↓ select · Enter activate · Esc cancel',
}
```

Returns one of:
- `{ kind: 'pick', value: string }` — user picked an algorithmic suggestion
- `{ kind: 'custom' }` — agent re-prompts for free-text input
- `{ kind: 'keep' }` — agent keeps S7 auto-name (no rename)
- `{ kind: 'cancel' }` — agent halts install · cleanup partial state

---

## Cross-Surface Coherence

This menu shares Pewter visual identity with:
- B-22 trust-confer pane (D5 border + D7 active inversion)
- B-17/18 install animation `buildPewterPane` (D5 border)
- SM-MULTI-SUITE-BRANCH (sibling — same border + token discipline)
- SM-WELCOME-RI-ENGAGE (sibling — final menu in S8 sequence)

---

## Pearl

Naming the Suite 8 is the user's first agentive act within the Manifold. Auto-naming is acceptable as fallback but never as default — the menu shows the suggested name, lets the user accept it with a keystroke, and offers genuine alternatives. The user's first interaction is a YES, not a passive accept.
