#!/bin/sh
# lane-teardown.sh · THE CLEAN EXIT · step 3 (C987)
#
# Runs as nodemon's `events.restart` hook, in ITS OWN PROCESS — which is the whole point. It cannot
# block nodemon, but it does not need to: it can SEQUENCE what nodemon cannot.
#
#   read .bridge-lane.json  →  graceful-exit by PORT  →  done. WE SIGNAL NOTHING.
#
# ── C994 AMENDMENT · THE SIGNAL LEG IS DELETED · THE WOUND THAT TAUGHT IT ────────────────────
# The C987 form ended with `kill -9 $PID` on a start-time-verified pid. THE VERIFICATION WAS
# SOUND AND THE TARGET WAS WRONG. Measured on the live IE lane:
#
#     scs-dev (89110)  →  npm run bridge (90983)  →  nodemon  →  ts-node index.ts (17844, :7700)
#                          ^^^^^^^^^^^^^^^^^^^^^                  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
#                          THE LANE FILE'S PID                    the process that actually serves
#
# The lane file records the CLI's DIRECT CHILD — the npm wrapper — because that is what the spawn
# method holds. But the server is a GRANDCHILD, and the npm wrapper is an ANCESTOR OF NODEMON
# ITSELF. So this hook, running from nodemon's own restart event, would have `kill -9`'d nodemon's
# own ancestor: tearing down the lane, or orphaning nodemon to `ppid 1` — MANUFACTURING THE EXACT
# ORPHAN THIS DIAMOND EXISTS TO ELIMINATE. The start-time check could never catch it, because the
# pid was genuinely ours; it was simply never the right one to kill.
#
# IT NEVER FIRED: the citizens still ran the pre-C987 hook, and nodemon does not re-read its config
# while running, so the defect was found in the mirror pass rather than in the field.
#
# WHY DELETION AND NOT A CORRECTED TARGET: nodemon ALREADY kills its own child, and C981 ruled that
# path is nodemon's internals — not ours to replace, only to make unnecessary by having the process
# already gone. The graceful ask by PORT does exactly that. So the correct number of processes for
# this hook to signal is ZERO, which also settles the user's founding worry completely: we cannot
# kill a user's other process if we never signal one.
#
# THE LANE FILE KEEPS `pid` anor `startedAt`. They are correct data about the lane's npm wrapper and
# a future parent-watch supervisor (card 2) may want them. What is deleted is the SIGNAL, not the
# record.
#
# WHAT THIS REPLACES: `pkill -9 -f "scp-tag=$PWD"`. That matched the FULL COMMAND LINE of EVERY
# process on the machine. A dry run matched 2 legitimate processes — but the mechanism is unbounded:
# a user's grep, tail, editor or script merely MENTIONING that path would have been killed with -9,
# by our restart hook, on their machine. A pattern cannot be made safe; it can only be deleted.
#
# THE VERIFICATION LAW — RETIRED WITH THE SIGNAL IT GUARDED (C994). It held that a pid alone is not
# an identity (pids recycle) and that pid + start-time is durable, so any mismatch DECLINES. The
# reasoning was correct and is preserved in the Onyx; it is simply moot here now, because a hook
# that signals nothing needs no target identity. Stale doctrine outliving its mechanism is its own
# hazard — so it is retired in place rather than left reading as live law.
#
# EVERY EXIT PATH IS SUCCESS. This hook must never fail a restart: the restart-trigger write that
# summoned it is UNCONDITIONAL by design (C980), so nothing here may gate it.
set -u

# C996 · THE BRIDGE LOG PASSAGE · TWO RUNGS, NEW SEAT FIRST.
# The lane moved into the SCP's own `Cascades/Bridge/` (gitignored BY RULE), which is why it no
# longer dirties the citizen's tree. The retired seat is still read because a lane written by an
# older CLI sits there — a script that knew only the new path would find nothing and SILENTLY SKIP
# the graceful ask, degrading us to the SIGKILL backstop without saying so.
# ABSENCE AT BOTH IS ORDINARY: `Bridge/` is gitignored, so a fresh citizen has no lane at all. The
# absent-lane branch below already defers cleanly — this hook must never fail a restart.
LANE="$PWD/Cascades/Bridge/lane.json"
if [ ! -f "$LANE" ]; then
  LANE="$PWD/.bridge-lane.json"
fi

say() { echo "[LaneTeardown] $*"; }

# ── absent lane file: an older SCP, or one that never spawned through the CLI ────────────────
if [ ! -f "$LANE" ]; then
  say "no lane file · nothing to address · deferring entirely to nodemon's own signal"
  exit 0
fi

read_field() {
  # deliberately dependency-free: no jq on a user's machine is a certainty we cannot make
  sed -n "s/.*\"$1\"[[:space:]]*:[[:space:]]*\"\{0,1\}\([^,\"}]*\)\"\{0,1\}.*/\1/p" "$LANE" | head -1
}

# ── C995 · CARD 13 · THE CONFIG IS SOURCED, NOT HARDCODED ───────────────────────────────────
# The lane file is written at EVERY launch, so whatever it carries is by definition current for
# THIS process. `nodemon.json` is consumed once at launch and can never be refreshed in a running
# lane — so nothing that can change may live there. It lives here instead.
#
# EVERY VALUE FALLS BACK. A lane file written by an older CLI has no `config` block at all, and
# this script must still work for it — a missing value is an OLD LANE, never an error.
#
# `pid` anor `startedAt` remain IN the lane file (correct data a future parent-watch supervisor —
# card 2 — may want) but nothing here consumes them any more (C994).
PORT="$(read_field port)"
EXIT_PATH="$(read_field gracefulExitPath)"; [ -n "$EXIT_PATH" ] || EXIT_PATH="/graceful-exit"
ASK_TIMEOUT="$(read_field askTimeoutSeconds)"; [ -n "$ASK_TIMEOUT" ] || ASK_TIMEOUT="2"
DELAY="$(read_field graceSeconds)"; [ -n "$DELAY" ] || DELAY="0.4"
# The env override still wins — an operator debugging a lane must not have to respawn it.
DELAY="${SCS_LANE_GRACE_SECONDS:-$DELAY}"
say "config · path=$EXIT_PATH askTimeout=${ASK_TIMEOUT}s grace=${DELAY}s"

# ── 1 · THE GRACEFUL ASK — best-effort, bounded, never a gate ────────────────────────────────
if [ -n "$PORT" ]; then
  if curl -s -m "$ASK_TIMEOUT" -X POST "http://127.0.0.1:$PORT$EXIT_PATH" >/dev/null 2>&1; then
    say "graceful-exit accepted on :$PORT$EXIT_PATH"
  else
    # 404 from an older build · refused from a dead server · timeout from a hung one. All three are
    # ORDINARY, not errors: the server may already be gone, which is the outcome we wanted anyway.
    say "graceful-exit unavailable on :$PORT$EXIT_PATH (older build, already down, or busy) · continuing"
  fi
  # A grace for the RELEASE, not a wind-up for a signal: the route answers immediately and releases
  # afterwards, so this is the window in which watchers actually get let go before nodemon's own
  # kill lands. Short by design — it is charged to every turn-over's 7-second budget.
  sleep "$DELAY"
fi

# ── 2 · NO SIGNAL — DELIBERATELY ────────────────────────────────────────────────────────────
# See the C994 amendment above. nodemon's own kill is the backstop; the graceful ask above is the
# path. This hook signals nothing, ever.
say "graceful ask complete · signalling nothing (nodemon's own kill is the backstop)"
exit 0
