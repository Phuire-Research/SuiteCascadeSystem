Engage your Diamond WorkGameBoard.

Read `Cascades/Cascade.json` for current state.

If `activeDiamond` is set:
  - Read the active Diamond file
  - Present the Diamond Menu (C6 format):
    ```
    Diamond Menu:
    - DIAMOND-TIER-N.md [ACTIVE] — Cycle X, Rotation Y of Z
    - DIAMOND-TIER-(N-1).md [PRIOR] — Cycles 1-(X-1)
    ```
  - Show PENDING tasks and current gate position
  - Offer: [C] Continue at current gate, [N] Next gate, [P] Show full plan

If `activeDiamond` is null:
  - Report: "No active Diamond. Would you like to Engage your Diamond?"
  - Offer: enter Diamond Planning Mode via EnterPlanMode
  - Suggest `/cascade:hello` for first-time users

Context: the Diamond IS the Ego document — plans, propositions, prunable at tier. Show what is aspiring to be done.
