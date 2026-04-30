Review the Onyx Trajectory — Lambda document.

Read `Cascades/Cascade.json` for current state.

If `activeOnyx` is set:
  - Read the active Onyx file
  - Present the Onyx summary: latest Fuchsia Diagnosis (G/L/M), Semantic Index, Cascade Position
  - Show the Clinical Note history — one-line per Fuchsia firing
  - Offer: [D] Cross-reference with Diamond (Ego↔Lambda), [L] Show Learnings section

If `activeOnyx` is null:
  - Report: "No active Onyx. Onyx is created after the first Fuchsia diagnosis."
  - Explain: "The Onyx IS the Lambda document — recorded found reality that persists through compaction."

Context: Onyx = I-Steh-doer substrate. What was actually done, not what was planned. Fuchsia writes it; RI reads it at session start.
