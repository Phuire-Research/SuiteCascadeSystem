# Git, the safe way — five practices GITM keeps for you

GITM (the Git manager built into this bridge) is built around five habits that
keep your history clean and your work safe. You do not have to remember them —
the manager enforces each one for you. Here is what each habit is, why it
matters, and exactly how GITM holds the line.

---

## 1. Inspect before you switch

**What it means.** Before you move to another branch, GITM looks at your working
tree. If you have uncommitted changes, it stops and offers to stash them for you
instead of silently throwing them away.

**Why it matters.** A branch switch over a dirty tree is how people lose an
afternoon of work. Checking first turns a silent loss into a clear choice.

**How GITM enforces it.** Switching with a dirty tree returns a guard
(`reason: "dirty-tree"`, recommendation: stash) and refuses to switch. Stash
first, then switch — never a silent force-checkout.

---

## 2. Force push is force-with-lease here, and we ask twice

**What it means.** When you force-push, GITM never runs a raw `--force`. It
always runs `--force-with-lease`, which refuses to overwrite the remote if a
teammate has pushed something you have not seen yet. And it asks you to confirm
twice before it runs at all.

**Why it matters.** A raw force-push can erase a colleague's work without warning.
The lease makes that impossible, and the double-confirm makes sure the force-push
was deliberate, not a slip.

**How GITM enforces it.** The force-push command is hardwired to
`git push --force-with-lease` — there is no option for raw `--force`. The first
call returns a confirmation token; you send that token back on a second call to
actually push. Force-pushing a shared branch (main, master, develop, release/*)
adds an extra warning even on the confirmed run.

---

## 3. Hard reset and force-delete are guarded

**What it means.** The commands that genuinely destroy work — `reset --hard`,
force-deleting a branch (`branch -D`), and discarding a file's changes — always
make you confirm before they run.

**Why it matters.** These operations have no undo. A double-confirm is a small
pause that prevents a large, irreversible mistake.

**How GITM enforces it.** Each destructive command runs the double-confirm token
round: the first call warns you and hands back a token; the second call carries
that token to execute. The token is sealed to the exact target you confirmed (so
a confirmed `reset HEAD~1` cannot be swapped for `reset HEAD~5`) and expires after
two minutes, so a stale confirmation never fires by accident.

---

## 4. We warn you out of detached HEAD

**What it means.** If you check out a specific commit and land in "detached HEAD"
state, GITM notices and tells you — and reminds you to create a branch so any new
commits are not lost.

**Why it matters.** Commits made on a detached HEAD are easy to lose: move away
and they are unreachable. A timely warning keeps your work attached to a branch.

**How GITM enforces it.** Detached HEAD is a reactive warning. The moment your
repository enters that state, GITM surfaces an active warning ("Create a branch to
preserve any new commits") that stays visible until you are back on a branch. It
does not block you — it keeps you informed.

---

## 5. Commit atomically

**What it means.** GITM nudges you toward commits that capture one logical change,
with a short, imperative subject line (think "Add login guard", not "fixed stuff
and other things").

**Why it matters.** One-change commits are the history you can read, bisect, and
revert cleanly. Sprawling commits make every later debugging session harder.

**How GITM enforces it.** The commit flow guards against empty commits (nothing
staged returns a clear `nothing-staged` notice rather than a confusing error) and
encourages a focused, imperative, short subject for clean, debuggable history.

---

*GITM keeps these five for you so you can move fast without breaking your
history. You will see the guards above when they fire — they are the manager
doing its job.*
