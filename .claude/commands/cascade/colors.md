Launch the Suite Color Selection Questionnaire.

Read `Cascades/Cascade.json` for current state.

If `colorSelectionComplete` is true:
  - Display current color assignments from `suiteColors`
  - Offer: [R] Retake questionnaire, [S] Swap two colors, [D] Reset to defaults, [B] Back

If `colorSelectionComplete` is false:
  - Read `Cascades/8_SUITES/Teal Claude/Skills/S-SHATTERITE-MENU/SM-ColorSelect.md` for the full questionnaire Reference Design
  - Begin the 8-gate personality questionnaire (Suite 0-7 in succession)
  - Each gate asks about cognitive approach; system assigns a color based on character alignment
  - Manage the color pool — each color assigned once, affinity fallback for conflicts
  - On completion, write `suiteColors` and `colorSelectionComplete: true` to Cascade.json
