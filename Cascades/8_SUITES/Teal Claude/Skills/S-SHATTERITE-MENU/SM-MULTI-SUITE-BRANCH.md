# SM-MULTI-SUITE-BRANCH — Shatterite Menu Reference Design (Diamond B-25-UX)

**Origin Strategy**: SCS Bridge Strategy S8-StratidianWelcome (Band 3)
**Pewter HiFi Tokens**: D5 closed-box border · D7 active-button inversion · D1 color tokens (Ochre branching · Viridian preview · Pewter neutral)
**Frontier Pattern**: CD-101 CMSRD — Conditional-Multi-Suite-8-Router-Detection

---

## Engagement Criteria

Renders ONLY when `detectRouterPattern(...)` from `src/lib/bridge/routerDetect.ts` returns `isRouterPattern === true` (all 3 hard gates fire: H2 ≥4 AND ≥2 router-keywords AND ≥2 mutually-exclusive H2 pairs).

This menu is **advisory** — agent never auto-splits regardless of signal strength. User confirmation is the structural invariant.

---

## Menu Data Sources

- `RouterDetectionResult.h2Labels` (count + labels) — for "N sections found" header
- `RouterDetectionResult.routerKeywordsFound` — for evidence display (e.g., "found: router, dispatch, orchestrate")
- Suggested sub-Suite-8 names: each H2 label → `sanitizeProjectName(label)` + " Context" (e.g., "Auth Service" → "Auth Service Context")

---

## Pewter HiFi Rendering (paste-ready ANSI text prototype)

```
┌─────────────────────────────────────────────────────────────┐
│  Multi-Suite Architecture Detected                          │
│                                                             │
│  Your CLAUDE.md describes 4 distinct subsystems:            │
│    · Auth Service                                           │
│    · Payment Service                                        │
│    · Notification Service                                   │
│    · Admin Console                                          │
│                                                             │
│  Router signals: router, dispatch, orchestrate              │
│                                                             │
│  How would you like to organize?                            │
│                                                             │
│  ▶ 1. Single Suite 8                       ← keep current   │
│      "{user-chosen-name}" only                              │
│                                                             │
│    2. Multi: 4 separate Suite 8s           ← split          │
│      Auth Service Context                                   │
│      Payment Service Context                                │
│      Notification Service Context                           │
│      Admin Console Context                                  │
│                                                             │
│    3. Custom split                          ← name each     │
│                                                             │
│  ↑/↓ select · Enter activate · Esc keep single              │
└─────────────────────────────────────────────────────────────┘
```

---

## D1-D8 Token Application Table

| Element | Token | Color/Style |
|---|---|---|
| Border | D5 closed-box | Pewter neutral · DARK top-right + LIGHT bottom-left |
| Title "Multi-Suite Architecture Detected" | D6 typography H1 | Ochre + BOLD (branching choice signal) |
| Section bullet list `· Auth Service` | D6 typography list | Viridian DIM (preview content) |
| "Router signals:" line | D4 text shadow complement | Pewter DIM (evidence · unobtrusive) |
| Active row prefix `▶ ` | D7 button variant active | REVERSE + BOLD + suite-tinted |
| Option 1 active text | D1 color | Cobalt (Single = primary path) |
| Option 2 active text | D1 color | Ochre (Multi = branching) |
| Option 3 active text | D1 color | Pewter (Custom = open-ended) |
| Sub-name preview list (Option 2) | D4 text shadow complement | Viridian DIM (preview only) |
| Source annotation `← keep current` | D4 text shadow complement | Pewter DIM |
| Footer hint | D6 typography small | Pewter DIM |

---

## Conference Pattern (AskUserQuestion integration)

```typescript
{
  menuId: 'SM-MULTI-SUITE-BRANCH',
  header: 'Multi-Suite Architecture Detected',
  intro: `Your CLAUDE.md describes ${h2Count} distinct subsystems:\n${h2Labels.map(l => '    · ' + l).join('\n')}\n\nRouter signals: ${routerKeywordsFound.join(', ')}\n\nHow would you like to organize?`,
  rows: [
    {
      key: '1',
      label: 'Single Suite 8',
      annotation: 'keep current',
      detail: `"${currentSuite8Name}" only`,
      returns: { kind: 'single' },
    },
    {
      key: '2',
      label: `Multi: ${h2Count} separate Suite 8s`,
      annotation: 'split',
      detail: h2Labels.map(l => sanitizeProjectName(l) + ' Context').join('\n'),
      returns: { kind: 'multi', names: h2Labels.map(l => sanitizeProjectName(l) + ' Context') },
    },
    {
      key: '3',
      label: 'Custom split',
      annotation: 'name each',
      returns: { kind: 'custom' },
    },
  ],
  footer: '↑/↓ select · Enter activate · Esc keep single',
}
```

Returns one of:
- `{ kind: 'single' }` — keep one Suite 8 (router heuristic was false positive · user disagrees)
- `{ kind: 'multi', names: string[] }` — agent creates N additional Suite 8 directories with given names
- `{ kind: 'custom' }` — agent prompts for each sub-Suite-8 name in turn

---

## Cross-Surface Coherence

Pewter D5 border + D7 inversion shared with SM-NAME-SUITE-8 + SM-WELCOME-RI-ENGAGE. Branching signaling (Ochre title) distinguishes this menu's character from the primary-Cobalt naming menu.

---

## Pearl

Detection without confirmation is a lie. The 3-signal hard gate has a ~5% false-positive rate — small but not zero. The user-confirmation invariant turns false positives harmless: even if all gates fire incorrectly, the user picks Single and continues. The detection earns its place by being right ~95% of the time AND being structurally incapable of forcing a wrong split when wrong.
