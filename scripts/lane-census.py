#!/usr/bin/env python3
"""lane-census · C1020 · THE BEFORE/AFTER CONCLUDER for the spawned-lane teardown.

A before/after comparison is only worth the measurement if BOTH sides are measured the same way.
This exists so they are: run it, boot/exit, run it again — the two numbers are comparable by
construction rather than by anyone's memory of what was counted last time.

READ-ONLY. It signals nothing, ever.

── WHY THIS IS PYTHON AND NOT THE SHELL SCRIPT IT STARTED AS ──────────────────────────────────────
The shell version failed three separate ways in one sitting, each silently:
  1. `for x in $LIST` relied on IFS containing a newline; it did not, so the whole list arrived as
     ONE value and awk died with "newline in string".
  2. `while read` runs its body in a SUBSHELL, so counters incremented inside it were discarded.
  3. `mktemp` is unavailable in the sandbox and failed with no message, aborting the run mid-way.
Each was a property of the shell, not of the measurement. **An instrument that keeps needing
workarounds is telling you it is the wrong instrument** — so it was rewritten once, natively.

── AND THE TWO BLIND SPOTS THE FIELD FOUND IN v1 ──────────────────────────────────────────────────
  1. **IT SAW ONLY ONE VARIANT.** It matched the PRODUCTION daemon and missed the DEVELOPMENT one
     entirely, reporting "1 daemon live" while two were running.
  2. **IT COUNTED ORPHANED ROOTS, NOT ORPHANED TREES.** It looked for a lane root at ppid 1. When the
     ROOT has already died and nodemon survives and reparents, no root remains to match — so it
     printed ORPHANED: 0 while an orphaned pair sat in plain sight. **An instrument that can see only
     one shape of a failure reports every other shape as absent.**
"""
import os, subprocess, sys, time
from collections import defaultdict

SCP_MARK = "Cascades/scps/"

# ── THE INSTRUMENT MUST NOT MEASURE ITSELF ─────────────────────────────────────────────────────
# Found the hard way: this census reported a phantom DEV daemon and a phantom tracked lane, both
# with a start time equal to the second it ran. The cause was that a shell command line CONTAINS
# the text of the script being written or run — so the census matched its own invocation on the
# strings it was searching for. Anything in this process's own group is excluded from every count.
try:
    SELF_PGID = os.getpgid(0)
except OSError:
    SELF_PGID = -1

def is_runtime(cmd: str) -> bool:
    """A real lane process, not a shell command line that merely MENTIONS one.

    The distinction that matters: `node /path/.bin/nodemon` IS a lane process; `bash -c "... grep
    Cascades/scps/ ..."` merely contains the same characters. Matching on the path alone cannot
    tell them apart, so the command must actually be a runtime invocation."""
    return cmd.startswith(("npm ", "node ", "npx ", "sh -c npm ")) or "/.bin/nodemon" in cmd

def ps(fmt):
    out = subprocess.run(["ps", "-Ao", fmt], capture_output=True, text=True).stdout
    return [l for l in out.splitlines() if l.strip()]

rows = []
for line in ps("pid=,ppid=,pgid=,command="):
    parts = line.split(None, 3)
    if len(parts) < 4:
        continue
    try:
        rows.append((int(parts[0]), int(parts[1]), int(parts[2]), parts[3]))
    except ValueError:
        continue

by_pid = {p: (pp, pg, c) for p, pp, pg, c in rows}
groups = defaultdict(list)
for p, pp, pg, c in rows:
    groups[pg].append((p, pp, c))

print("── LANE CENSUS ─────────────────────────────────────────────────────────")
print(f"  at: {time.strftime('%Y-%m-%d %H:%M:%S')}")

# ── DAEMONS · both variants ────────────────────────────────────────────────────────────────────
print("  SCS daemons live:")
daemons = []
for p, pp, pg, c in rows:
    if pg == SELF_PGID:
        continue  # never count the census's own tree
    if not c.startswith("node "):
        continue
    # The EXECUTABLE, not a mention of it anywhere in the command line. `parts[1]` is argv[0].
    parts = c.split()
    exe = parts[1] if len(parts) > 1 else ""
    if exe.endswith("/bin/scs-dev") or exe.endswith("/scs-dev"):
        daemons.append((p, "DEV", c))
    elif exe.endswith("/bin/scs"):
        daemons.append((p, "PRODUCTION", c))
for p, kind, c in daemons:
    lstart = subprocess.run(["ps", "-o", "lstart=", "-p", str(p)], capture_output=True, text=True).stdout.strip()
    print(f"      [{kind:<10}] pid={p}  started {lstart}")
if not daemons:
    print("      (none)")
print(f"      total: {len(daemons)}")
daemon_pids = {p for p, _, _ in daemons}

# ── LANES · every process GROUP containing an SCP-path process ─────────────────────────────────
# Group-first, not root-first: this is what makes a rootless orphan tree visible.
tracked = orphaned = tracked_procs = orphaned_procs = 0
lane_groups = sorted(
    g for g, members in groups.items()
    if g != SELF_PGID and any(SCP_MARK in c and is_runtime(c) for _, _, c in members)
)

for g in lane_groups:
    members = groups[g]
    n = len(members)
    scp = "?"
    for _, _, c in members:
        if SCP_MARK in c:
            scp = c.split(SCP_MARK, 1)[1].split("/")[0]
            break
    leader = by_pid.get(g)
    if leader is None:
        orphaned += 1; orphaned_procs += n
        print(f"      ORPHAN  pgid={g:<7} {n} procs  {scp}  (ROOT ALREADY DEAD — rootless tree)")
    elif leader[0] == 1:
        orphaned += 1; orphaned_procs += n
        print(f"      ORPHAN  pgid={g:<7} {n} procs  {scp}  (reparented to ppid 1)")
    else:
        owner = leader[0]
        tag = "  <- owner is a live SCS daemon" if owner in daemon_pids else ""
        tracked += 1; tracked_procs += n
        print(f"      tracked pgid={g:<7} {n} procs  {scp}  (owner pid {owner}){tag}")
if not lane_groups:
    print("      (no lane groups)")

print("  ------------------------------------------------------------------")
print(f"  TRACKED lanes ............... {tracked}   ({tracked_procs} processes)")
print(f"  ORPHANED lanes .............. {orphaned}   ({orphaned_procs} processes)")
print("  ------------------------------------------------------------------")
print("  VERDICT: CLEAN — nothing orphaned." if orphaned == 0
      else f"  VERDICT: LEAKING — {orphaned_procs} processes orphaned across {orphaned} groups.")
print("────────────────────────────────────────────────────────────────────────")
sys.exit(0)
