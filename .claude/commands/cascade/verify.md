Verify the output of any build — Suite 4 Sculptor examines the Ego (input specification) against the Lambda (what was actually produced), then Suite 6 Orchestrator routes resolution.

Read `Cascades/Cascade.json` for current state.
Read the active Diamond (`activeDiamond`) for the input specification — what was aspiring to be done.

---

## Verification Protocol

### Step 1: Identify the Ego (Input)

Read the active Diamond WorkGameBoard. Extract:
- The Banded Plan that was committed
- The sub-goals or task list
- The expected outputs per Band (from the Lambda-Event Invariant Checklist if present)

If no active Diamond exists, ask the user: "What was the input specification? Describe what you asked to be built."

### Step 2: Suite 4 Sculptor — Bidirectional Examination

Examine the output against the input from BOTH angles:

**Builder Angle**: For each expected output in the Diamond:
- Does the file exist? (`test -f`)
- Does it have content? (`wc -c`)
- Does it contain the expected patterns? (`grep -c` key identifiers)

**User Angle**: For each expected output:
- Does it serve the user's original intent?
- Would the user recognize this as what they asked for?
- Is it complete or partial?

### Step 3: Lambda Report

Present results per-item:

```
╔══════════════════════════════════════════════════════════╗
║  VERIFICATION REPORT                        [Green]      ║
║  ─ · ─                                                   ║
║  Diamond: {activeDiamond}                                ║
║                                                          ║
║  Lambda Results                                          ║
║  ─ · ─                                                   ║
{for each expected output:}
║  [✓] {item} — PASS (file exists, {N} bytes, pattern match)║
║  [✗] {item} — BLOCKED ({reason})                         ║
║  [~] {item} — PARTIAL ({what exists}, {what's missing})  ║
║                                                          ║
║  Summary: {pass_count} Pass · {block_count} Blocked ·    ║
║           {partial_count} Partial                        ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
```

### Step 4: Suite 6 Orchestrator — Resolution Routing

If any items are BLOCKED or PARTIAL, present a resolution menu:

```
<AskUserQuestion>
╔══════════════════════════════════════════════════════════╗
║  RESOLUTION                                 [Purple]     ║
║  ─ · ─                                                   ║
║  {block_count + partial_count} items need attention.     ║
║                                                          ║
║  [F] Fix All — re-engage Bands for blocked items [Blue]  ║
║      Create a Banded Plan targeting only the gaps.       ║
║                                                          ║
║  [S] Select — choose which items to address   [Green]    ║
║      Pick specific items to fix, defer the rest.         ║
║                                                          ║
║  [R] Re-run — re-execute the full Diamond     [Orange]   ║
║      Start the cycle fresh from Gate 0.                  ║
║                                                          ║
║  [D] Defer — mark as PENDING for next cycle   [Yellow]   ║
║      Items carry forward to the next Diamond.            ║
║                                                          ║
║  [A] Accept — mark as complete despite gaps   [Red]      ║
║      User accepts the current state.                     ║
║                                                          ║
║  [M] Main Menu    [Q] Exit                               ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
</AskUserQuestion>
```

**Routing**:
- [F] — Compose a targeted Banded Plan (Suite 6) addressing only the blocked/partial items. Engage via the active Diamond (append, not replace).
- [S] — Present each blocked/partial item individually with [Y]es fix / [N]o defer.
- [R] — Reset `cyclePosition.gate: 0` in Cascade.json. Re-engage from Obsidian Absorb.
- [D] — Mark items as PENDING in the Diamond. They carry to the next cycle.
- [A] — Write verification results to Onyx as a Clinical Note. Mark Diamond tasks complete despite gaps. User Lambda accepted.
