#!/bin/bash
# mirror-template-to-lab.sh · THE WORKING-TARGET LAW (MD-B · C558)
#
# The working target is the TEMPLATE SCP. Template-class changes mirror into the
# Lab's installed SCPs — ALL of them at once — then test SCPs are uninstalled
# after their Lambda. This script IS the mirror: it byte-copies the given
# template-relative files into every citizen, refusing any citizen file that
# carries its own divergence (those diverged for the domain registration and
# MUST be hand-paired — the vue.principle / IslandWrapper class).
#
# ── C954 AMENDMENT · THE DELIVERY CIRCUIT (N1) · Informative anor Actionable ──
#
# The C558 form did not rot because it was a script. It rotted because two
# literal CONSTANTS were baked into it:
#   (a) TEMPLATE= pointed at /Users/micahkeller/Work/Stratithon/reference/... —
#       a repo seat the C944 transfer made unreachable.
#   (b) TARGETS= listed IsomorphicExpanse + PortableExpanse — while the live lab
#       is IsomorphicExpanse · AmberlightStudio · Stratithon (PortableExpanse is
#       ARCHIVED). Doubly stale.
# The C954 fix is not a fork. It is the REMOVAL OF THE CONSTANTS: both the
# template anchor and the roster are DISCOVERED at fire time, so nothing inside
# this file can go stale between edits to the lab's actual shape.
#
# THE WOUNDS THAT TAUGHT IT (each guard below has one):
#   W1 · THE TWO-REGISTRIES HAZARD (N7) — two files named SCPs.json at different
#        depths. The lab-root one has 4 active entries; the repo-nested one has 1
#        (a gitignored stub). A relative read resolves to the WRONG registry.
#        → the registry path is pinned ABSOLUTELY below, never repo-relative.
#   W2 · THE TEMPLATE-FROM-REPO LAW — TWO physically distinct `template/SCP`
#        dirs exist. The lab-root one is THREE WEEKS STALE (vue.principle 58,300
#        bytes, 0 C953 markers) and IT IS THE ONE IN THE REGISTRY. The git-tracked
#        repo-nested one (159,353 bytes, marker present) is the true source.
#        → the TEMPLATE is resolved from THIS SCRIPT'S OWN REPO, never from the
#          registry; the registry's `template` row is a DECOY, excluded as a target.
#   W3 · THE DIRECTION PROOF (N16/N17) — byte size LIES about which side is ahead;
#        a hand-stamped citizen can be LARGER while being strictly BEHIND.
#        → marker counts are the primary Concluder, bytes are advisory only.
#   W4 · THE ZERO-ZERO TRAP — "dst marker count not less than src ⇒ REVERSED"
#        misclassifies every file outside the current marker vocabulary
#        (proven on src/style.css: 0 markers both sides, byte-identical).
#        → both-zero is INDETERMINATE, never REVERSED; it falls through to the
#          structural check.
#   W5 · THE SELF-TOKEN ABSENCE TRAP (N11) — the C558 guard grepped the citizen's
#        own conceptName. That token is ABSENT from IsomorphicExpanse's and
#        Stratithon's own vue.principle.ts, so the guard would have SILENTLY
#        OVERWRITTEN their divergence.
#        → the token grep is GONE. The guard is STRUCTURAL.
#   W6 · THE ORPHAN-LINE MISCLASSIFICATION — whole-line import matching cannot
#        tell "the template EDITED a shared import" from "the citizen ADDED its
#        own". IsomorphicExpanse's only "extra" import line exists solely because
#        the template added `resolveOriginPort` to that same statement.
#        → imports are compared by MODULE SPECIFIER + SYMBOL SET, never by line.
#
# Usage:
#   scripts/mirror-template-to-lab.sh <template-relative-path> [...more]
#     → THE INFORMATIVE HALF. Reports what WOULD mirror. Touches nothing.
#   scripts/mirror-template-to-lab.sh --apply <template-relative-path> [...more]
#     → THE ACTIONABLE HALF. Prints the same report FIRST, then acts on THAT pass.
#   scripts/mirror-template-to-lab.sh --since auto --apply --only <citizen>
#     → THE FLOATING DELTA. The candidate set is DERIVED from that citizen's baseline stamp
#       rather than hand-listed; the classifier still decides every write.
#   e.g. scripts/mirror-template-to-lab.sh \
#     src/concepts/scsBridge/vue/components/ScsBridgeSessionManagement.vue \
#     src/style.css
#
#   --apply         perform the LAG-class copies (default is report-only)
#   --marker <str>  add a direction marker (repeatable; replaces the defaults)
#   --create        W10 (C958) · allow a NEW template file to be CREATED in each citizen.
#                   MISSING-on-the-citizen-side is refused by default ON PURPOSE (no surprise
#                   creation) — but a template that ADDS a file (a new model imported by an edited
#                   component) cannot be delivered without it: the edited component lands, its
#                   import resolves to nothing, and EVERY citizen's build breaks. Found by the
#                   Skill's second use (the Status Pip's scpStatusPip.model.ts). Creation stays an
#                   EXPLICIT act — never the default, always reported in its own NEW class.
#   --no-gate       skip the tsc parity gate during --apply
#   --only <name>   W13 (C994) · SCOPE the mirror to one citizen (repeatable). This FILTERS the
#                   discovered roster — it does NOT bypass discovery, so every exclusion guard
#                   (the template decoy, ephemeral worktrees, absent paths) still runs first. A
#                   name that matches no discovered citizen is a FATAL error, never a silent
#                   no-op: the failure mode this prevents is a confident report of "0 mirrored"
#                   that reads like "nothing needed" when it actually means "you typed it wrong".
#   --since <ref>   W16 (C1082) · DERIVE the candidate set from git rather than hand-listing it:
#                   every template file touched between <ref> and HEAD joins the file set (explicit
#                   path arguments are UNIONED in, never replaced). Template-side DELETIONS are
#                   excluded and counted out loud — the mirror is additive and never removes a
#                   citizen file. An unresolvable ref is FATAL: an empty delta must never be the
#                   silent consequence of a typo.
#   --since auto    the same, per citizen, from that citizen's OWN baseline stamp at
#                   <citizen>/Cascades/mirror-baseline.json (written by a successful --since apply),
#                   unioned with that stamp's `unresolved` list so prior refusals stay in scope.
#                   A citizen with no stamp is FATAL WITH GUIDANCE — a baseline is never guessed.
#
# ONE INVOCATION, ONE DISCOVERY PASS: every run discovers the roster, resolves
# the template, and classifies exactly once. --apply can only act on THAT pass;
# there is no code path that writes from a cached or prior report.
#
# After a mirror: the RESTART is the user's Lambda (the serving chain law —
# islands build at boot, not at file-write). This script never restarts anything
# and never claims the field is fixed.
set -u

# ═══ FIRE-TIME ANCHORS (no stale constants) ═════════════════════════════════
# W8 (C954 · the parent's close) · THE LAST CONSTANT, REMOVED. This cycle's own lesson is that
# the C558 rot traced to HARDCODED CONSTANTS, not to the script form — so the lab root is now
# DERIVED, with the literal kept only as the final fallback. Order: an explicit SCS_LAB_ROOT env →
# the walk-up from this repo (the repo sits at <lab>/Cascades/scps/<citizen>/SCP/Cascades/Projects/…,
# so the lab is the nearest ancestor holding a Cascades/SCPs.json that lists MORE than the template
# decoy) → the literal. Never resolve the lab from the repo-nested stub registry (W1).
_derive_lab_root() {
  if [ -n "${SCS_LAB_ROOT:-}" ] && [ -f "$SCS_LAB_ROOT/Cascades/SCPs.json" ]; then
    printf '%s' "$SCS_LAB_ROOT"; return 0
  fi
  local probe; probe="$(cd "$(dirname "$0")/.." && pwd)"
  local hop=0
  while [ "$probe" != "/" ] && [ "$hop" -lt 12 ]; do
    if [ -f "$probe/Cascades/SCPs.json" ]; then
      # the TRUE registry lists the live citizens; the repo-nested stub lists only `template`.
      if [ "$(grep -c '"name"' "$probe/Cascades/SCPs.json" 2>/dev/null || echo 0)" -gt 1 ]; then
        printf '%s' "$probe"; return 0
      fi
    fi
    probe="$(dirname "$probe")"
    hop=$((hop + 1))
  done
  printf '%s' "/Users/micahkeller/Work/SCP-Lab"
}
LAB_ROOT="$(_derive_lab_root)"
REGISTRY="$LAB_ROOT/Cascades/SCPs.json"                    # W1 · absolute, never relative
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"              # this script lives in scripts/
TEMPLATE="$REPO_ROOT/Cascades/scps/template/SCP"           # W2 · THE TEMPLATE-FROM-REPO LAW
RULES="$REPO_ROOT/scripts/scp-update-rules.json"           # N3 · read LIVE, never duplicated
MARKERS_FILE="$REPO_ROOT/scripts/mirror-markers.json"      # optional; absent is fine

MARKERS=("bootedAt" "BAND B")                              # W3 · default direction markers
APPLY=0
CREATE=0
GATE=1
FILESET=()
CUSTOM_MARKERS=()
ONLY=()                                                    # W13 · scope to named citizens (post-discovery filter)
SINCE=""                                                   # W16 · git ref (or `auto`) the candidate set is derived from
HEAD_SHA=""                                                # W16 · resolved once, only when --since fires
BASELINE_REL="Cascades/mirror-baseline.json"               # W16 · the per-citizen baseline stamp, citizen-relative
SELFTEST=0                                                 # C1113 · exercise the Skill's own gate + stamp writer, touch no citizen
SHOWHUNKS=0                                                # C1113 · print the template-side hunks for every refused hand-pair
RUNREC_REL="Cascades/mirror-last-run.json"                 # C1113 · the machine-readable run record, citizen-relative

while [ $# -gt 0 ]; do
  case "$1" in
    --apply)   APPLY=1; shift ;;
    --create)  CREATE=1; shift ;;
    --no-gate) GATE=0; shift ;;
    --only)    shift; [ $# -gt 0 ] || { echo "--only needs a citizen conceptName" >&2; exit 2; }
               ONLY+=("$1"); shift ;;
    --since)   shift; [ $# -gt 0 ] || { echo "--since needs a git ref or the word 'auto'" >&2; exit 2; }
               SINCE="$1"; shift ;;
    --marker)  shift; [ $# -gt 0 ] || { echo "--marker needs a value" >&2; exit 2; }
               CUSTOM_MARKERS+=("$1"); shift ;;
    --self-test) SELFTEST=1; shift ;;
    --show-hunks) SHOWHUNKS=1; shift ;;
    -h|--help) sed -n '1,/^set -u$/p' "$0" | sed '$d'; exit 0 ;;
    --*)       echo "unknown flag: $1" >&2; exit 2 ;;
    *)         FILESET+=("$1"); shift ;;
  esac
done

# W16 · an EMPTY argument list is legal only when --since will derive one. Everything else is
# still the same refusal: a run with no candidate set must never proceed as a quiet success.
if [ ${#FILESET[@]} -eq 0 ] && [ -z "$SINCE" ] && [ "$SELFTEST" -eq 0 ]; then
  echo "usage: $0 [--apply] [--create] [--no-gate] [--since <ref|auto>] [--marker <str>] [--only <citizen>] <template-relative-path> [...more]" >&2
  exit 2
fi

command -v python3 >/dev/null 2>&1 || { echo "FATAL: python3 required (registry + rules parsing)" >&2; exit 3; }
[ -f "$REGISTRY" ] || { echo "FATAL: registry not found: $REGISTRY" >&2; exit 3; }

_require_ref() {   # <ref> -> halts the RUN unless it resolves. Never call this inside $( ).
  git -C "$REPO_ROOT" rev-parse --verify --quiet "$1^{commit}" >/dev/null 2>&1 && return 0
  echo "   FATAL · --since '$1' does not resolve to a commit in $REPO_ROOT" >&2
  echo "           A bad ref would otherwise derive ZERO files and report a clean pass." >&2
  exit 2
}
_resolve_ref() { git -C "$REPO_ROOT" rev-parse "$1"; }   # pure printer · _require_ref gates it

_derive_range() {  # <ref> -> template-relative paths ADDED/COPIED/MODIFIED/RENAMED/TYPE-CHANGED
  git -C "$REPO_ROOT" diff --name-only --diff-filter=ACMRT "$1" HEAD -- "$TEMPLATE_PREFIX" 2>/dev/null \
    | sed "s#^${TEMPLATE_PREFIX}##"
}

_count_deletions() {  # template-side deletions are OUT OF REACH for an additive mirror — counted, never hidden
  git -C "$REPO_ROOT" diff --name-only --diff-filter=D "$1" HEAD -- "$TEMPLATE_PREFIX" 2>/dev/null | grep -c . || true
}

_read_stamp_field() {  # <stampfile> <field> -> value, or nothing at all (absent/corrupt reads as absent)
  python3 -c "
import json,sys
try:
    d=json.load(open(sys.argv[1]))
except Exception:
    sys.exit(0)
t=d.get('template') if isinstance(d.get('template'),dict) else {}
v=t.get(sys.argv[2])
if isinstance(v,list):
    for x in v:
        if x: print(x)
elif v:
    print(v)
" "$1" "$2" 2>/dev/null || true
}

_gate_verdict() {  # <citizen> <base> <post>
  local cname="$1" base="$2" post="$3"
  # printf with the numbers as ARGUMENTS: no ${var} sits adjacent to a multibyte glyph (bash 3.2 segfaults on that
  # adjacency under LC_ALL=C — the Skill must not depend on its caller's locale for its own text).
  if [ "$post" -eq "$base" ]; then
    printf '   GATE PARITY   · %s · %s==%s — PASS\n' "$cname" "$base" "$post"
  elif [ "$post" -lt "$base" ]; then
    printf '   GATE PARITY   · %s · %s→%s — PASS (IMPROVED · the mirror cured %s)\n' "$cname" "$base" "$post" "$(( base - post ))"
  else
    printf '   GATE PARITY   · %s · %s→%s — FAIL (the mirror ADDED %s error(s))\n' "$cname" "$base" "$post" "$(( post - base ))" >&2
    return 1
  fi
}

_write_stamp() {  # <stampfile> <advance-sha|none> <files-list> <unresolved-list>
  mkdir -p "$(dirname "$1")"
  python3 - "$1" "$2" "$3" "$4" <<'PY_STAMP'
import json, os, sys, time
path, advance, fpath, upath = sys.argv[1:5]
try:
    with open(path) as fh:
        doc = json.load(fh)
    if not isinstance(doc, dict):
        doc = {}
except Exception:
    doc = {}
tpl = doc.get('template')
tpl = dict(tpl) if isinstance(tpl, dict) else {}
files = [l.strip() for l in open(fpath).read().splitlines() if l.strip()]
unres = [l.strip() for l in open(upath).read().splitlines() if l.strip()]
if advance != 'none':
    tpl['baseline'] = advance
elif 'baseline' not in tpl:
    tpl['baseline'] = None
tpl['appliedAt'] = int(time.time() * 1000)
tpl['files'] = files
tpl['unresolved'] = unres
doc.setdefault('schemaVersion', '1')
doc['template'] = tpl
tmp = path + '.tmp'
with open(tmp, 'w') as fh:
    json.dump(doc, fh, indent=2)
    fh.write('\n')
os.replace(tmp, path)
PY_STAMP
}

# C1113 · THE RUN RECORD WRITER, factored so the no-op path (0 candidates) leaves a record and a fleet line too.
_write_run_records() {
  touch "$WORK/gate.post" "$WORK/since.tsv" "$WORK/written.tsv" "$WORK/results.tsv"
  python3 - "$WORK" "$APPLY" "$SINCE" "${HEAD_SHA:-}" "$RUNREC_REL" "$BASELINE_REL" <<'PY_RUNREC'
import json, os, sys, time
work, apply, since, head, rec_rel, base_rel = sys.argv[1:7]
def tsv(name):
    p = os.path.join(work, name)
    if not os.path.exists(p): return []
    return [l.rstrip('\n').split('\t') for l in open(p) if l.strip()]
roster = tsv('roster.tsv'); results = tsv('results.tsv'); written = tsv('written.tsv')
gate = {r[0]: r[1:] for r in tsv('gate.post') if len(r) >= 4}
since_t = {r[0]: r[1] for r in tsv('since.tsv') if len(r) >= 2}
mode = 'apply' if apply == '1' else 'report'
now = int(time.time() * 1000)
for cname, cabs in roster:
    rows = [r for r in results if len(r) >= 3 and r[1] == cname]
    classes = {r[2]: r[0] for r in rows}
    counts = {}
    for r in rows: counts[r[0]] = counts.get(r[0], 0) + 1
    delivered = sorted({r[1] for r in written if len(r) >= 2 and r[0] == cname})
    unresolved = sorted(rel for rel, cls in classes.items() if cls in ('STAMPED', 'FORKED', 'REVERSED', 'MISSING'))
    stamp_path = os.path.join(cabs, base_rel); stamp = None
    try:
        stamp = json.load(open(stamp_path)).get('template', {}).get('baseline')
    except Exception: pass
    g = gate.get(cname)
    rec = {
        'schemaVersion': '1', 'at': now, 'mode': mode, 'since': since or None,
        'sinceResolved': since_t.get(cname), 'head': head or None, 'citizen': cname,
        'counts': {k: counts.get(k, 0) for k in ('LAG','SUPERSEDED','NEW','PARITY','STAMPED','FORKED','REVERSED','MISSING','PROTECTED')},
        'delivered': delivered, 'unresolved': unresolved, 'classes': classes,
        'gate': ({'base': int(g[0]), 'post': int(g[1]), 'verdict': g[2]} if g else None),
        'stampedBaseline': stamp,
    }
    path = os.path.join(cabs, rec_rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = path + '.tmp'
    with open(tmp, 'w') as fh: json.dump(rec, fh, indent=2); fh.write('\n')
    os.replace(tmp, path)
    lag = rec['counts']['LAG'] + rec['counts']['SUPERSEDED'] + rec['counts']['NEW']
    gtxt = f"{g[0]}->{g[1]} {g[2]}" if g else '-'
    behind = 'BEHIND' if (mode == 'report' and lag > 0) else ('DELIVERED' if lag > 0 else 'CURRENT')
    print(f"   FLEET  {cname:<20} stamp {str(stamp or 'none')[:7]:<8} lag {lag:<3} unresolved {len(unresolved):<3} gate {gtxt:<14} {behind}")
PY_RUNREC
}

# ═══ C1113 · --self-test · THE SKILL'S OWN CONCLUDERS (touches NO citizen) ═══════════════════
# A gate branch that has never executed has not been tested (the IE cure crashed the IMPROVED branch on its
# first firing). Every branch fires here, under this script's own set -u, before any citizen depends on it.
if [ "$SELFTEST" -eq 1 ]; then
  echo "── SELF-TEST · the gate's three branches · the stamp writer · the bad-ref refusal ──"
  st_fail=0
  _st() { if [ "$2" -eq "$3" ]; then echo "   PASS · $1"; else echo "   FAIL · $1 (got $2, expected $3)" >&2; st_fail=$(( st_fail + 1 )); fi; }
  out="$(_gate_verdict selftest 45 45 2>&1)"; rc=$?; _st "gate equal → PASS, rc 0" "$rc" 0; case "$out" in *"— PASS"*) _st "gate equal prints PASS" 0 0;; *) _st "gate equal prints PASS" 1 0;; esac
  out="$(_gate_verdict selftest 50 45 2>&1)"; rc=$?; _st "gate improved → PASS, rc 0" "$rc" 0; case "$out" in *IMPROVED*"cured 5"*) _st "gate improved prints IMPROVED · cured 5" 0 0;; *) _st "gate improved prints IMPROVED · cured 5" 1 0;; esac
  out="$(_gate_verdict selftest 45 50 2>&1)"; rc=$?; _st "gate regressed → FAIL, rc 1" "$rc" 1; case "$out" in *"ADDED 5"*) _st "gate regressed prints ADDED 5" 0 0;; *) _st "gate regressed prints ADDED 5" 1 0;; esac
  st_dir="$(mktemp -d)"; printf 'a.ts\nb.vue\n' > "$st_dir/f"; printf 'c.ts\n' > "$st_dir/u"
  _write_stamp "$st_dir/Cascades/mirror-baseline.json" deadbeefcafe "$st_dir/f" "$st_dir/u"; rc=$?; _st "stamp write rc 0" "$rc" 0
  got="$(_read_stamp_field "$st_dir/Cascades/mirror-baseline.json" baseline)"; [ "$got" = "deadbeefcafe" ] && _st "stamp read-back baseline" 0 0 || _st "stamp read-back baseline" 1 0
  _write_stamp "$st_dir/Cascades/mirror-baseline.json" none "$st_dir/f" "$st_dir/u"; got2="$(_read_stamp_field "$st_dir/Cascades/mirror-baseline.json" baseline)"; [ "$got2" = "deadbeefcafe" ] && _st "explicit-fileset pass does not advance the baseline" 0 0 || _st "explicit-fileset pass does not advance the baseline" 1 0
  ( _require_ref "no-such-ref-$$" >/dev/null 2>&1 ); rc=$?; _st "bad --since ref exits 2" "$rc" 2
  rm -rf "$st_dir"
  if [ "$st_fail" -eq 0 ]; then echo "   SELF-TEST · all checks PASS"; exit 0; else echo "   SELF-TEST · $st_fail check(s) FAILED" >&2; exit 1; fi
fi


[ -d "$TEMPLATE" ] || { echo "FATAL: template not found: $TEMPLATE" >&2; exit 3; }

if [ ${#CUSTOM_MARKERS[@]} -gt 0 ]; then
  MARKERS=("${CUSTOM_MARKERS[@]}")
elif [ -f "$MARKERS_FILE" ]; then
  OLDIFS="$IFS"; IFS=$'\n'
  MARKERS=($(python3 -c "
import json,sys
d=json.load(open(sys.argv[1]))
for m in d.get('markers',[]): print(m)
" "$MARKERS_FILE"))
  IFS="$OLDIFS"
fi

WORK="$(mktemp -d "${TMPDIR:-/tmp}/mirror-delivery.XXXXXX")"
trap 'rm -rf "$WORK"' EXIT

# ═══ THE PARSERS ════════════════════════════════════════════════════════════
# W6 · imports keyed by MODULE SPECIFIER, carrying their SYMBOL SET.
cat > "$WORK/imports.awk" <<'AWK_IMPORTS'
function emit(line,   spec, syms, n, arr, i, out) {
  spec = ""
  if (match(line, /from[ \t]*["'][^"']+["']/)) {
    spec = substr(line, RSTART, RLENGTH)
    sub(/^from[ \t]*["']/, "", spec); sub(/["']$/, "", spec)
  } else if (match(line, /import[ \t]*["'][^"']+["']/)) {
    spec = substr(line, RSTART, RLENGTH)
    sub(/^import[ \t]*["']/, "", spec); sub(/["']$/, "", spec)
  }
  if (spec == "") return
  syms = line
  sub(/[ \t]*from[ \t]*["'].*$/, "", syms)
  sub(/^[ \t]*import[ \t]*/, "", syms)
  gsub(/[{}]/, " ", syms); gsub(/,/, " ", syms); gsub(/;/, " ", syms)
  n = split(syms, arr, /[ \t]+/)
  out = ""
  for (i = 1; i <= n; i++)
    if (arr[i] != "" && arr[i] != "type" && arr[i] != "*" && arr[i] != "as") out = out arr[i] ","
  print spec "\t" out
}
/^[ \t]*import[ \t{'"*]/ {
  line = $0; guard = 0
  while (line !~ /from[ \t]*["'][^"']+["']/ && line !~ /;[ \t]*$/ && guard < 40) {
    if ((getline nxt) <= 0) break
    line = line " " nxt; guard++
  }
  emit(line)
}
AWK_IMPORTS

# W6 generalized · every citizen-only line tagged by its diff hunk type.
#   a-hunk ⇒ the citizen ADDED this line (citizen-original content)
#   c-hunk ⇒ the template EDITED this region (stale template content · LAG evidence)
cat > "$WORK/hunks.awk" <<'AWK_HUNKS'
/^[0-9]+(,[0-9]+)?[acd][0-9]+(,[0-9]+)?$/ {
  if (match($0, /[acd]/)) op = substr($0, RSTART, 1)
  next
}
/^> / { print op "|" substr($0, 3) }
AWK_HUNKS

marker_count() {   # W3 · sum of every marker's occurrences in a file
  local f="$1" m total=0 n
  for m in "${MARKERS[@]}"; do
    n="$(grep -c -- "$m" "$f" 2>/dev/null || true)"
    [ -n "$n" ] || n=0
    total=$(( total + n ))
  done
  echo "$total"
}

is_protected() {   # N3/N15 · read LIVE from scp-update-rules.json, never duplicated
  local rel="$1"
  [ -f "$RULES" ] || { echo "OPEN"; return; }
  python3 -c "
import json,sys
rules=json.load(open(sys.argv[1]))
key='SCP/'+sys.argv[2]
prot = key in rules.get('preservedJsonFields',{}) or key in rules.get('neverDeletePaths',[])
print('PROTECTED' if prot else 'OPEN')
" "$RULES" "$rel" 2>/dev/null || echo "OPEN"
}

# ═══ classify(src, dst) ═════════════════════════════════════════════════════
# Returns exactly ONE of: LAG · STAMPED · FORKED · REVERSED · PARITY · MISSING
# Side channels: CLS_EVIDENCE (human lines) · CLS_PROOF (the one-line proof)
CLS=""; CLS_PROOF=""; CLS_EVIDENCE=""
# W15 (C1018) · THE SUPERSEDED PROBE, hoisted so BOTH refusal branches (STAMPED and FORKED) can
# consult it. Returns 0 (and sets CLS) when the citizen is PROVEN to be an older revision of this
# very template file — a hash match against git history, not a judgement. Returns 1 otherwise, and
# the caller proceeds with its own refusal.
_superseded_probe() {
  if command -v git >/dev/null 2>&1; then
    _dsum="$(shasum -a 1 "$dst" 2>/dev/null | awk '{print $1}')"
    _relpath="Cascades/scps/template/SCP/$rel"
    _match=""
    for _rev in $(git -C "$REPO_ROOT" log --format=%H -n 40 -- "$_relpath" 2>/dev/null); do
      _hsum="$(git -C "$REPO_ROOT" show "$_rev:$_relpath" 2>/dev/null | shasum -a 1 | awk '{print $1}')"
      if [ -n "$_hsum" ] && [ "$_hsum" = "$_dsum" ]; then _match="$_rev"; break; fi
    done
    if [ -n "$_match" ]; then
      CLS="SUPERSEDED"
      CLS_PROOF="the citizen is byte-identical to template revision ${_match} — it holds NO divergence, only an OLDER TEMPLATE. Safe to overwrite (incl. deletions). $dirnote"
      CLS_EVIDENCE=""
      return 0
    fi
  fi
  return 1
}

classify() {
  local src="$1" dst="$2"
  CLS=""; CLS_PROOF=""; CLS_EVIDENCE=""

  # 1 · MISSING — absent one side. Reported, NEVER written.
  if [ ! -f "$src" ]; then
    CLS="MISSING"; CLS_PROOF="absent in TEMPLATE (source side)"; return
  fi
  if [ ! -f "$dst" ]; then
    if [ "${CREATE:-0}" -eq 1 ]; then
      CLS="NEW"; CLS_PROOF="absent in CITIZEN — CREATE authorized by --create (an explicit act, never a default)"; return
    fi
    CLS="MISSING"; CLS_PROOF="absent in CITIZEN (target side) — a new file is NOT auto-created (pass --create to authorize)"; return
  fi

  # 2 · PARITY — byte-identical, nothing to do.
  if cmp -s "$src" "$dst"; then
    CLS="PARITY"; CLS_PROOF="byte-identical ($(wc -c < "$src" | tr -d ' ') bytes)"; return
  fi

  local sb db sm dm
  sb="$(wc -c < "$src" | tr -d ' ')"; db="$(wc -c < "$dst" | tr -d ' ')"
  sm="$(marker_count "$src")"; dm="$(marker_count "$dst")"

  # 3 · DIRECTION PROOF by marker (W3 primary · bytes advisory only)
  #     W4 THE ZERO-ZERO FIX: REVERSED fires ONLY when the citizen strictly
  #     out-counts the template. Both-zero (and any tie) is INDETERMINATE —
  #     it falls through to the structural check below, NEVER to REVERSED.
  if [ "$dm" -gt "$sm" ]; then
    CLS="REVERSED"
    CLS_PROOF="marker-proven · citizen markers $dm > template markers $sm · bytes ${sb}→${db} (advisory)"
    CLS_EVIDENCE="the CITIZEN carries newer marked content than the template. Mirroring would DELETE it."
    return
  fi

  local dirnote="markers template=$sm citizen=$dm"
  if [ "$sm" -eq 0 ] && [ "$dm" -eq 0 ]; then
    dirnote="$dirnote (INDETERMINATE — no marker evidence either side; direction taken structurally)"
  elif [ "$sm" -eq "$dm" ]; then
    dirnote="$dirnote (TIE — no marker evidence of direction; direction taken structurally)"
  fi

  # 4 · STRUCTURAL DIFF ACCOUNTING
  diff "$src" "$dst" > "$WORK/d.txt" 2>/dev/null || true
  local srcOnly
  srcOnly="$(grep -c '^< ' "$WORK/d.txt" || true)"; [ -n "$srcOnly" ] || srcOnly=0
  awk -f "$WORK/hunks.awk" "$WORK/d.txt" > "$WORK/dstonly.txt" || true
  grep '^a|' "$WORK/dstonly.txt" 2>/dev/null | sed 's/^a|//' | grep -v '^[[:space:]]*$' > "$WORK/added.txt" || true
  : > "$WORK/added.txt.keep"; cat "$WORK/added.txt" > "$WORK/added.txt.keep" 2>/dev/null || true
  local nAdded nEdited
  nAdded="$(wc -l < "$WORK/added.txt" | tr -d ' ')"
  nEdited="$(grep -c '^c|' "$WORK/dstonly.txt" || true)"; [ -n "$nEdited" ] || nEdited=0

  # 5 · THE IMPORT GUARD (W6) — by MODULE SPECIFIER + SYMBOL SET, never by line.
  #     W7 · THE SPLIT-IMPORT TRAP: one module specifier may be imported by SEVERAL
  #     statements (`import type { A } from 'm'` beside `import { B } from 'm'`).
  #     The symbol set of a specifier is therefore the UNION over every statement
  #     naming it — comparing one statement against one statement reports a
  #     phantom citizen-only symbol and falsely STAMPS a pure-lag file.
  #     Both sides are reduced to sorted (specifier, symbol) PAIRS; set algebra
  #     over the pairs is union-correct by construction.
  awk -f "$WORK/imports.awk" "$src" | awk -F'\t' \
    '{n=split($2,a,","); for(i=1;i<=n;i++) if(a[i]!="") print $1 "\t" a[i]}' | sort -u > "$WORK/psrc.txt" || true
  awk -f "$WORK/imports.awk" "$dst" | awk -F'\t' \
    '{n=split($2,a,","); for(i=1;i<=n;i++) if(a[i]!="") print $1 "\t" a[i]}' | sort -u > "$WORK/pdst.txt" || true
  cut -f1 "$WORK/psrc.txt" | sort -u > "$WORK/ssrc.txt"
  cut -f1 "$WORK/pdst.txt" | sort -u > "$WORK/sdst.txt"

  # citizen-only module specifiers = local concept registrations (the STAMP signal)
  comm -13 "$WORK/ssrc.txt" "$WORK/sdst.txt" > "$WORK/stampspec.txt" || true
  local nStampSpec
  nStampSpec="$(wc -l < "$WORK/stampspec.txt" | tr -d ' ')"

  # citizen-only (specifier,symbol) pairs whose specifier the TEMPLATE ALSO HAS
  # ⇒ the citizen added a symbol to a shared import. A symbol only the TEMPLATE
  # has is the opposite signal (LAG) and is invisible to this set difference.
  comm -13 "$WORK/psrc.txt" "$WORK/pdst.txt" > "$WORK/pdstonly.txt" || true
  awk -F'\t' 'NR==FNR{s[$1]=1;next} ($1 in s)' "$WORK/ssrc.txt" "$WORK/pdstonly.txt" > "$WORK/sharedsym.txt" || true
  local sharedSymDelta
  sharedSymDelta="$(wc -l < "$WORK/sharedsym.txt" | tr -d ' ')"

  # every symbol the citizen alone carries — the vocabulary that must explain
  # each citizen-original line before STAMPED may be claimed
  : > "$WORK/stampsym.txt"
  awk -F'\t' 'NR==FNR{s[$1]=1;next} ($1 in s){print $2}' \
    "$WORK/stampspec.txt" "$WORK/pdst.txt" >> "$WORK/stampsym.txt" || true
  cut -f2 "$WORK/sharedsym.txt" >> "$WORK/stampsym.txt" || true
  sort -u "$WORK/stampsym.txt" -o "$WORK/stampsym.txt" 2>/dev/null || true

  local importnote="imports: citizen-only specifiers=$nStampSpec · citizen-only symbols on shared specifiers=$sharedSymDelta · template-edited citizen lines=$nEdited"

  # 6 · THE EXPLANATION ACCOUNTING — is EVERY citizen-original line explained by
  #     a citizen-only concept registration? (feeds 7, 9 and 10 alike)
  local unexplained=0
  : > "$WORK/unexplained.txt"
  if [ -s "$WORK/added.txt" ]; then
    while IFS= read -r line; do
      [ -n "$line" ] || continue
      local ok=0 sym
      if [ -s "$WORK/stampsym.txt" ]; then
        while IFS= read -r sym; do
          [ -n "$sym" ] || continue
          case "$line" in *"$sym"*) ok=1; break ;; esac
        done < "$WORK/stampsym.txt"
      fi
      if [ "$ok" -eq 0 ] && [ -s "$WORK/stampspec.txt" ]; then
        while IFS= read -r sym; do
          [ -n "$sym" ] || continue
          case "$line" in *"$sym"*) ok=1; break ;; esac
        done < "$WORK/stampspec.txt"
      fi
      if [ "$ok" -eq 0 ]; then
        unexplained=$(( unexplained + 1 ))
        echo "$line" >> "$WORK/unexplained.txt"
      fi
    done < "$WORK/added.txt"
  fi

  # 7 · REVERSED (structural) — the template holds NOTHING the citizen lacks, and
  #     the citizen holds content the template lacks ⇒ THE CITIZEN IS AHEAD.
  #     There is no delivery pending here; a copy would be pure deletion.
  #     Runs AFTER the import guard so the refusal can say WHAT the citizen holds.
  if [ "$srcOnly" -eq 0 ] && [ "$nAdded" -gt 0 ]; then
    local rnote
    if [ "$unexplained" -eq 0 ] && [ "$nStampSpec" -gt 0 ]; then
      rnote="the citizen-only content is entirely its own concept registration (a benign stamp) — but the template is NOT ahead, so there is nothing to deliver"
    else
      rnote="$unexplained of $nAdded citizen-only lines are unexplained by any registration"
    fi
    CLS="REVERSED"
    CLS_PROOF="structural · template-only lines 0 · citizen-only added lines $nAdded · $dirnote · $importnote · bytes ${sb}→${db} (advisory)"
    CLS_EVIDENCE="$( { echo "        $rnote"; head -8 "$WORK/added.txt" | sed 's/^/        citizen-only: /'; } )"
    return
  fi

  # 8 · LAG — every citizen-only line is template-edit residue; no citizen-original
  #     content, no citizen-only import. Safe to mirror.
  if [ "$nAdded" -eq 0 ] && [ "$nStampSpec" -eq 0 ] && [ "$sharedSymDelta" -eq 0 ]; then
    CLS="LAG"
    CLS_PROOF="$dirnote · template-only lines $srcOnly · citizen-added lines 0 · $importnote · bytes ${sb}→${db} (advisory)"
    return
  fi

  # 9 · STAMPED — the template IS ahead AND the citizen carries its own bounded
  #     registration. Hand-pair; never auto-write.
  if [ "$unexplained" -eq 0 ] && { [ "$nStampSpec" -gt 0 ] || [ "$sharedSymDelta" -gt 0 ]; }; then
    # ── W15 (C1018) · THE SUPERSEDED CHECK REACHES STAMPED TOO ──────────────────────────────
    # THE WOUND: C994 wired the superseded probe ahead of FORKED only. A template DELETION that
    # removes an IMPORT reads as a "citizen-only import" and lands in STAMPED — a different branch,
    # which the probe never guarded. Measured: retiring `armLaneOwnerWatch` from the template made
    # the citizen's surviving import look like its own registration, and the mirror refused a file
    # it should have delivered. **The same false positive, one branch over.**
    # The probe is a Concluder either way — a hash match against this file's OWN git history proves
    # the citizen is an older template and holds nothing of its own — so it is as safe here as
    # there. A non-match still STAMPS and is still refused.
    if _superseded_probe; then return; fi
    CLS="STAMPED"
    CLS_PROOF="$dirnote · $importnote · every citizen-original line explained by a citizen-only concept registration"
    CLS_EVIDENCE="$( { sed 's/^/        citizen-only import: /' "$WORK/stampspec.txt"; sed 's/^/        citizen-only line:   /' "$WORK/added.txt"; } | head -12 )"
    return
  fi

  # 10 · FORKED — citizen-original content no registration explains. Refuse, show
  #      the evidence, escalate to Conference.
  if _superseded_probe; then return; fi
  # ── W14 (C994) · THE SUPERSEDED CHECK · now hoisted into _superseded_probe (W15) ────────────
  # THE WOUND: a template-side DELETION is structurally indistinguishable from citizen-added
  # content. When C994 removed the signal leg from lane-teardown.sh, the two deleted lines read
  # as "unexplained citizen-original lines" and the mirror refused FORKED — correctly by its own
  # rules, and wrongly in fact. The citizen held no divergence at all; it simply held the PREVIOUS
  # TEMPLATE. Without this check the mirror can deliver additions and edits but NEVER a removal —
  # and the release must strip the old `pkill` hooks from every citizen.
  #
  # THE PROOF, NOT AN ASSUMPTION: if the citizen's bytes are IDENTICAL to some earlier revision of
  # this very file in the template's own git history, then the citizen IS an older template and
  # carries nothing of its own to lose. That is a Concluder — a hash comparison against a named
  # commit — not a judgement call. Anything that does not match stays FORKED and is still refused.
  CLS="FORKED"
  CLS_PROOF="$dirnote · $importnote · citizen-original lines $nAdded of which $unexplained are UNEXPLAINED by any citizen-only registration"
  CLS_EVIDENCE="$(head -8 "$WORK/unexplained.txt" 2>/dev/null | sed 's/^/        unexplained citizen line: /')"
}

# ═══ 1 · THE TEMPLATE (source) ══════════════════════════════════════════════
MODE_LABEL="INFORMATIVE (dry) — nothing will be written"
[ "$APPLY" -eq 1 ] && MODE_LABEL="ACTIONABLE (--apply) — LAG-class files WILL be written"
STAMP="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"

echo "════════════════════════════════════════════════════════════════════════"
echo " THE DELIVERY CIRCUIT · MIRROR REPORT"
echo " MODE: $MODE_LABEL"
echo " DISCOVERY PASS: $STAMP  (one invocation, one discovery pass)"
echo "════════════════════════════════════════════════════════════════════════"
echo
echo "── 1 · THE TEMPLATE (source · resolved by THE TEMPLATE-FROM-REPO LAW) ──"
echo "   repo root : $REPO_ROOT"
echo "   template  : $TEMPLATE"
echo "   markers   : ${MARKERS[*]}"
echo "   rules     : $RULES"
DECOY="$LAB_ROOT/Cascades/scps/template/SCP"
if [ -d "$DECOY" ]; then
  echo "   DECOY     : $DECOY"
  echo "               ^ the lab-root registry's \`template\` row points HERE. It is"
  echo "                 NOT the source. W2 · the source is resolved from the repo."
fi
echo

# ═══ 2 · THE ROSTER (discovered at fire time) ═══════════════════════════════
echo "── 2 · THE ROSTER (discovered at fire time · $REGISTRY) ──"
python3 -c "
import json,sys
d=json.load(open(sys.argv[1]))
for e in d.get('scps',[]):
    print('%s\t%s\t%s' % (e.get('conceptName',''), e.get('path',''), e.get('status','')))
" "$REGISTRY" > "$WORK/roster.raw"

: > "$WORK/roster.tsv"
while IFS=$'\t' read -r cname cpath cstatus; do
  [ -n "$cname" ] || continue
  abs="$LAB_ROOT/$cpath"
  base="$(basename "$(dirname "$cpath")")"
  if [ "$cname" = "template" ]; then
    printf '   EXCLUDED · %-20s · reason: registry template row is the STALE DECOY (W2)\n' "$cname"
    continue
  fi
  case "$base" in
    *--wt-*) printf '   EXCLUDED · %-20s · reason: ephemeral git worktree\n' "$cname"; continue ;;
  esac
  if [ ! -d "$abs" ]; then
    printf '   EXCLUDED · %-20s · reason: path absent on disk (%s)\n' "$cname" "$abs"
    continue
  fi
  printf '   INCLUDED · %-20s · %s · status=%s\n' "$cname" "$abs" "$cstatus"
  printf '%s\t%s\n' "$cname" "$abs" >> "$WORK/roster.tsv"
done < "$WORK/roster.raw"
echo "   (archivedScps[] is a separate array and is never consulted)"
echo "   NOTE · the self-hosting seat: mirroring into stratithon touches the CITIZEN"
echo "          payload only (Stratithon/SCP/src/...), never this tool's own tree."
echo

# ── W13 (C994) · THE SCOPE FILTER · applied AFTER discovery, never instead of it ──
# THE WOUND THAT TAUGHT IT: the graceful-exit build (C984-C992) shipped whole and then did NOT
# operate, because the mirror had never reached the ONE citizen being field-tested. The citizen
# still ran the pre-C987 `pkill -9`, so every turn-over SIGKILLed a server that had no
# `/graceful-exit` route to answer with — and the ledger's absence read as "SIGKILL carried it"
# when the truer reading was "the route was never delivered". A whole-lab mirror was the wrong
# instrument for a single-citizen field test; there was no way to say WHERE.
#
# WHY A FILTER AND NOT A TARGET LIST: baked constants are exactly what rotted the C558 form (W8).
# Discovery still runs in full — the decoy, worktree and absent-path guards all fire first — and
# this only narrows what discovery produced. Nothing here can go stale.
if [ ${#ONLY[@]} -gt 0 ]; then
  : > "$WORK/roster.scoped"
  for want in "${ONLY[@]}"; do
    hit="$(awk -F'\t' -v n="$want" '$1==n {print; exit}' "$WORK/roster.tsv")"
    if [ -z "$hit" ]; then
      # NEVER A SILENT NO-OP. A typo must not report a clean "0 mirrored" that reads as success.
      echo "   FATAL · --only '$want' matches no DISCOVERED citizen." >&2
      echo "           discovered: $(cut -f1 "$WORK/roster.tsv" | tr '\n' ' ')" >&2
      exit 3
    fi
    printf '%s\n' "$hit" >> "$WORK/roster.scoped"
  done
  while IFS=$'\t' read -r cname _; do
    case " ${ONLY[*]} " in
      *" $cname "*) : ;;
      *) printf '   SCOPED OUT · %-20s · reason: --only did not name it\n' "$cname" ;;
    esac
  done < "$WORK/roster.tsv"
  mv "$WORK/roster.scoped" "$WORK/roster.tsv"
  printf '   SCOPED TO  · %s\n\n' "${ONLY[*]}"
fi

NCIT="$(wc -l < "$WORK/roster.tsv" | tr -d ' ')"
if [ "$NCIT" -eq 0 ]; then
  echo "FATAL: roster discovery produced zero citizens." >&2
  exit 3
fi

# ═══ 2b · THE FLOATING DELTA (W16 · C1082) ══════════════════════════════════
# Derives the candidate set from git. It runs AFTER discovery and AFTER the --only filter for one
# reason: `--since auto` reads a baseline out of each DISCOVERED citizen, so the roster must exist
# first. It runs BEFORE classification because everything downstream is unchanged — the derived
# paths enter the same FILESET the operator would have typed, and the same classifier judges them.
TEMPLATE_PREFIX="Cascades/scps/template/SCP/"

# THE SUBSHELL TRAP, measured before it could ship: the first form of this pair FATALed from
# INSIDE `_resolve_ref`, which every caller invoked as `x="$(_resolve_ref ...)"`. `exit 2` in a
# command substitution kills the SUBSHELL only — the negative test fed it a nonexistent ref, saw
# the FATAL text printed, and read exit=0. A guard whose failure the caller never learns of is
# not a guard. The check is therefore SPLIT: _require_ref halts at top level and prints nothing
# on success; _resolve_ref is a pure printer that assumes the check already passed.

if [ -n "$SINCE" ]; then
  echo "── 2b · THE FLOATING DELTA (--since $SINCE · W16) ──"
  command -v git >/dev/null 2>&1 || { echo "   FATAL: --since requires git" >&2; exit 3; }
  git -C "$REPO_ROOT" rev-parse --git-dir >/dev/null 2>&1 || {
    echo "   FATAL: $REPO_ROOT is not a git repository — --since has nothing to derive from" >&2; exit 3; }
  HEAD_SHA="$(git -C "$REPO_ROOT" rev-parse HEAD)"
  : > "$WORK/derived.txt"
  : > "$WORK/since.tsv"     # C1113 · <citizen>\t<resolved ref> for --show-hunks and the run record

  if [ "$SINCE" = "auto" ]; then
    # Each citizen carries its OWN baseline; the union of their ranges is the candidate set. A
    # union is safe by W16's argument (the classifier, not the range, decides), and it is the only
    # honest option when citizens sit at different baselines.
    while IFS=$'\t' read -r cname cabs; do
      [ -n "$cname" ] || continue
      stamp="$cabs/$BASELINE_REL"
      if [ ! -f "$stamp" ]; then
        echo "   FATAL · no baseline stamp for '$cname' at $stamp" >&2
        echo "           --since auto NEVER guesses a baseline. Pass --since <ref> explicitly for the" >&2
        echo "           first delivery; a successful --since --apply writes the stamp for next time." >&2
        exit 2
      fi
      cref="$(_read_stamp_field "$stamp" baseline)"
      if [ -z "$cref" ]; then
        echo "   FATAL · '$cname' holds a stamp with no template.baseline ($stamp)" >&2
        echo "           An explicit-fileset delivery deliberately does not advance a baseline —" >&2
        echo "           pass --since <ref> to establish one." >&2
        exit 2
      fi
      _require_ref "$cref"
      cres="$(_resolve_ref "$cref")"
      printf '%s\t%s\n' "$cname" "$cres" >> "$WORK/since.tsv"
      _derive_range "$cres" > "$WORK/range.tmp"
      nR="$(grep -c . "$WORK/range.tmp" || true)"; [ -n "$nR" ] || nR=0
      cat "$WORK/range.tmp" >> "$WORK/derived.txt"
      _read_stamp_field "$stamp" unresolved > "$WORK/unres.tmp"
      nU="$(grep -c . "$WORK/unres.tmp" || true)"; [ -n "$nU" ] || nU=0
      cat "$WORK/unres.tmp" >> "$WORK/derived.txt"
      printf '   baseline  · %-20s · %s → HEAD %s · %s changed · %s unresolved carried forward\n' \
        "$cname" "$(printf '%.7s' "$cres")" "$(printf '%.7s' "$HEAD_SHA")" "$nR" "$nU"
    done < "$WORK/roster.tsv"
  else
    _require_ref "$SINCE"
    SINCE_SHA="$(_resolve_ref "$SINCE")"
    cut -f1 "$WORK/roster.tsv" | while IFS= read -r _c; do [ -n "$_c" ] && printf '%s\t%s\n' "$_c" "$SINCE_SHA" >> "$WORK/since.tsv"; done
    _derive_range "$SINCE_SHA" >> "$WORK/derived.txt"
    ndel="$(_count_deletions "$SINCE_SHA")"; [ -n "$ndel" ] || ndel=0
    printf '   ref       · %s → %s\n' "$SINCE" "$(printf '%.7s' "$SINCE_SHA")"
    printf '   HEAD      · %s\n' "$(printf '%.7s' "$HEAD_SHA")"
    printf '   excluded  · %s template-side DELETION(S) — an additive mirror cannot deliver a removal\n' "$ndel"
  fi

  # A DIRTY TEMPLATE IS REPORTED, NEVER SILENTLY INCLUDED: the range is HEAD-anchored because the
  # stamp it writes is HEAD-anchored. Uncommitted template edits are real but undeliverable-by-range.
  ndirty="$(git -C "$REPO_ROOT" status --porcelain -- "$TEMPLATE_PREFIX" 2>/dev/null | grep -c . || true)"
  [ -n "$ndirty" ] || ndirty=0
  if [ "$ndirty" -gt 0 ]; then
    printf '   WARNING   · %s UNCOMMITTED template path(s) are NOT in this range (commit them to deliver)\n' "$ndirty"
  fi

  : > "$WORK/fileset.raw"
  if [ ${#FILESET[@]} -gt 0 ]; then printf '%s\n' "${FILESET[@]}" >> "$WORK/fileset.raw"; fi
  grep -v '^[[:space:]]*$' "$WORK/derived.txt" >> "$WORK/fileset.raw" 2>/dev/null || true
  sort -u "$WORK/fileset.raw" > "$WORK/fileset.txt"
  FILESET=()
  while IFS= read -r _rel; do
    [ -n "$_rel" ] && FILESET+=("$_rel")
  done < "$WORK/fileset.txt"
  printf '   DERIVED   · %s candidate file(s) — explicit arguments unioned in; the CLASSIFIER decides what moves\n\n' "${#FILESET[@]}"

  if [ ${#FILESET[@]} -eq 0 ]; then
    echo "   0 candidates in range. Nothing to classify — this is ano-op, not a refusal."
    echo "════════════════════════════════════════════════════════════════════════"
    echo "── 8b · THE FLEET (per citizen · ASCII · the run record at $RUNREC_REL) ──"
    : > "$WORK/results.tsv"; : > "$WORK/written.tsv"
    _write_run_records
    exit 0
  fi
fi

# ═══ 3 · THE FILE SET ═══════════════════════════════════════════════════════
FS_ORIGIN="operator-named · N8"
[ -n "$SINCE" ] && FS_ORIGIN="DERIVED from --since $SINCE, unioned with any operator-named path · W16"
echo "── 3 · THE FILE SET ($FS_ORIGIN) ──"
for rel in "${FILESET[@]}"; do echo "   $rel"; done
echo

# ═══ 4 · CLASSIFICATION (the single pass) ═══════════════════════════════════
echo "── 4 · CLASSIFICATION (per file × per citizen) ──"
: > "$WORK/results.tsv"
: > "$WORK/refusals.txt"
attempted=0; nNEW=0; nLAG=0; nSUPERSEDED=0; nSTAMPED=0; nFORKED=0; nREVERSED=0; nPARITY=0; nMISSING=0; nPROTECTED=0
srcMissing=0

for rel in "${FILESET[@]}"; do
  prot="$(is_protected "$rel")"
  if [ "$prot" = "PROTECTED" ]; then
    echo "   PROTECTED · (all citizens) · $rel"
    echo "               identity-preserved by scp-update-rules.json — never a mirror candidate"
    nPROTECTED=$(( nPROTECTED + 1 ))
    printf 'PROTECTED\t-\t%s\t-\t-\n' "$rel" >> "$WORK/results.tsv"
    echo "   PROTECTED · $rel · identity-preserved by rule (N3/N15)" >> "$WORK/refusals.txt"
    continue
  fi
  src="$TEMPLATE/$rel"
  if [ ! -f "$src" ]; then
    echo "   MISSING   · (all citizens) · $rel · absent in TEMPLATE (source side)"
    srcMissing=$(( srcMissing + 1 ))
    printf 'MISSING\t-\t%s\t-\t-\n' "$rel" >> "$WORK/results.tsv"
    echo "   MISSING   · $rel · the operator named a path the template does not hold" >> "$WORK/refusals.txt"
    continue
  fi
  while IFS=$'\t' read -r cname cabs; do
    [ -n "$cname" ] || continue
    dst="$cabs/$rel"
    attempted=$(( attempted + 1 ))
    classify "$src" "$dst"
    printf '   %-9s · %-20s · %s\n' "$CLS" "$cname" "$rel"
    printf '                 proof: %s\n' "$CLS_PROOF"
    [ -n "$CLS_EVIDENCE" ] && echo "$CLS_EVIDENCE"
    printf '%s\t%s\t%s\t%s\t%s\n' "$CLS" "$cname" "$rel" "$src" "$dst" >> "$WORK/results.tsv"
    case "$CLS" in
      NEW)      nNEW=$(( nNEW + 1 )) ;;
      LAG)      nLAG=$(( nLAG + 1 )) ;;
      SUPERSEDED) nSUPERSEDED=$(( nSUPERSEDED + 1 )) ;;
      STAMPED)  nSTAMPED=$(( nSTAMPED + 1 ))
                { printf '   STAMPED   · %s · %s — HAND-PAIR: the citizen registers its own Suite 8 concept.\n' "$cname" "$rel"
                  if [ -n "$CLS_EVIDENCE" ]; then echo "$CLS_EVIDENCE"; fi; } >> "$WORK/refusals.txt" ;;
      FORKED)   nFORKED=$(( nFORKED + 1 ))
                { printf '   FORKED    · %s · %s — REFUSED: citizen-original content with no registration to explain it.\n' "$cname" "$rel"
                  if [ -n "$CLS_EVIDENCE" ]; then echo "$CLS_EVIDENCE"; fi; } >> "$WORK/refusals.txt" ;;
      REVERSED) nREVERSED=$(( nREVERSED + 1 ))
                { printf '   REVERSED  · %s · %s — REFUSED LOUDLY: THE CITIZEN IS AHEAD.\n' "$cname" "$rel"
                  printf '               %s\n' "$CLS_PROOF"
                  if [ -n "$CLS_EVIDENCE" ]; then echo "$CLS_EVIDENCE"; fi
                  echo "               Mirroring here would DELETE citizen work. Carry it UP to the template first."; } >> "$WORK/refusals.txt" ;;
      PARITY)   nPARITY=$(( nPARITY + 1 )) ;;
      MISSING)  nMISSING=$(( nMISSING + 1 ))
                printf '   MISSING   · %s · %s — %s\n' "$cname" "$rel" "$CLS_PROOF" >> "$WORK/refusals.txt" ;;
    esac
  done < "$WORK/roster.tsv"
done
echo

# ═══ 5 · WOULD WRITE ════════════════════════════════════════════════════════
echo "── 5 · WOULD WRITE (LAG + NEW classes) ──"
if [ "$(( nLAG + nNEW + nSUPERSEDED ))" -eq 0 ]; then
  echo "   (nothing — no LAG/NEW/SUPERSEDED-class pair in this pass)"
else
  awk -F'\t' '$1=="LAG" || $1=="NEW" || $1=="SUPERSEDED" {printf "   %s %s\n       → %s\n", ($1=="NEW" ? "[CREATE]" : "        "), $4, $5}' "$WORK/results.tsv"
fi
echo

# ═══ 6 · REFUSED ════════════════════════════════════════════════════════════
echo "── 6 · REFUSED (and why) ──"
if [ -s "$WORK/refusals.txt" ]; then cat "$WORK/refusals.txt"; else echo "   (none)"; fi
echo

# ═══ W11 · THE GATE MUST SEE .vue — THE BLIND-GATE CURE (C961) ═════════════
# THE WOUND, measured in the field: the gate ran `npx tsc --noEmit`, and plain tsc CANNOT PARSE
# .vue single-file components at all. It reported `0 errors` for every citizen, every run —
# baseline 0, post 0, "PASS" — while `vue-tsc` on the same trees saw 45 / 38 / 53. The mirror's
# whole payload is .vue components, so the gate was structurally blind to exactly what it
# shipped: a rubber stamp wearing a gate's name, and a PASS that proved nothing.
#
# THE LAW IT BROKE (NEVER SILENCE THE FAILURE SIGNAL): a guard that always answers 0 is not a
# guard. This helper prefers vue-tsc — the only checker that reads the payload — and falls back
# to tsc ONLY when vue-tsc is unavailable, saying so out loud rather than degrading in silence.
# C1113 · THE GATE VERDICT, factored so --self-test can fire all three branches under set -u.
# W9: parity is a CEILING — equal or fewer errors PASS; only an increase FAILS (returns 1).

# C1113 · THE STAMP WRITER, factored (read-merge-write · tmp+rename) so --self-test can prove it on a temp dir.

_gate_errors() {
  local dir="$1" n
  if (cd "$dir" && PATH=/opt/homebrew/bin:$PATH npx --no-install vue-tsc --version >/dev/null 2>&1); then
    n="$( (cd "$dir" && PATH=/opt/homebrew/bin:$PATH npx --no-install vue-tsc --noEmit -p tsconfig.json 2>&1 | grep -c 'error TS') || true )"
  else
    echo "   GATE DEGRADED · $dir · vue-tsc unavailable — falling back to tsc, which is BLIND to .vue" >&2
    n="$( (cd "$dir" && PATH=/opt/homebrew/bin:$PATH npx tsc --noEmit 2>&1 | grep -c 'error TS') || true )"
  fi
  [ -n "$n" ] || n=0
  printf '%s' "$n"
}

# ═══ 7 · THE ACTIONABLE HALF ════════════════════════════════════════════════
mirrored=0; failed=0
: > "$WORK/restart.txt"
: > "$WORK/gate.post"     # C1113 · per-citizen base/post/verdict for the run record
: > "$WORK/written.tsv"     # W16 · what actually landed, per citizen — the stamp's `files`
if [ "$APPLY" -eq 1 ]; then
  echo "── 7 · ACTIONABLE · performing the LAG + NEW copies from THIS pass ──"

  if [ "$GATE" -eq 1 ]; then
    awk -F'\t' '$1=="LAG" || $1=="NEW" || $1=="SUPERSEDED" {print $2}' "$WORK/results.tsv" | sort -u > "$WORK/affected.txt"
    while IFS= read -r cname; do
      [ -n "$cname" ] || continue
      cabs="$(awk -F'\t' -v n="$cname" '$1==n {print $2}' "$WORK/roster.tsv" | head -1)"
      base="$(_gate_errors "$cabs")"
      echo "$cname	$base" >> "$WORK/gate.pre"
      echo "   GATE BASELINE · $cname · $base tsc errors (parity target, not zero — N18)"
    done < "$WORK/affected.txt"
  else
    echo "   GATE SKIPPED (--no-gate)"
  fi

  while IFS=$'\t' read -r cls cname rel src dst; do
    # W10 · NEW rides the same write path as LAG (its dir is created first); it is only ever
    # reachable when the operator passed --create.
    # W14 · SUPERSEDED rides the same write path: the citizen was PROVEN to be an older template
    # revision, so overwriting it (including deletions) destroys nothing of its own.
    [ "$cls" = "LAG" ] || [ "$cls" = "NEW" ] || [ "$cls" = "SUPERSEDED" ] || continue
    mkdir -p "$(dirname "$dst")"
    cp "$src" "$dst"
    if cmp -s "$src" "$dst"; then
      sm="$(marker_count "$src")"; dm="$(marker_count "$dst")"
      if [ "$sm" -eq "$dm" ]; then
        printf '   MIRRORED  · %-20s · %s (byte-exact · markers %s==%s)\n' "$cname" "$rel" "$sm" "$dm"
        mirrored=$(( mirrored + 1 ))
        echo "$cname" >> "$WORK/restart.txt"
        printf '%s\t%s\n' "$cname" "$rel" >> "$WORK/written.tsv"
      else
        printf '   MISMATCH  · %-20s · %s (marker re-check FAILED: %s vs %s)\n' "$cname" "$rel" "$sm" "$dm" >&2
        failed=$(( failed + 1 ))
      fi
    else
      printf '   MISMATCH  · %-20s · %s (copy verify FAILED)\n' "$cname" "$rel" >&2
      failed=$(( failed + 1 ))
    fi
  done < "$WORK/results.tsv"

  if [ "$GATE" -eq 1 ] && [ -f "$WORK/gate.pre" ]; then
    while IFS=$'\t' read -r cname base; do
      [ -n "$cname" ] || continue
      cabs="$(awk -F'\t' -v n="$cname" '$1==n {print $2}' "$WORK/roster.tsv" | head -1)"
      post="$(_gate_errors "$cabs")"
      # W9 (C955 · the field's first firing taught this) · PARITY IS A CEILING, NOT AN EQUALITY.
      # The gate exists to prove the mirror did not make the citizen WORSE. Its first live run
      # mirrored a missing dependency and drove IsomorphicExpanse from 1 error to 0 — a CURE — and
      # the equality test called that a FAIL. A decrease is the routine working; only an INCREASE
      # is the fault the gate was built to catch.
      if [ "$post" -eq "$base" ]; then
        echo "   GATE PARITY   · $cname · $base==$post — PASS"
      elif [ "$post" -lt "$base" ]; then
        echo "   GATE PARITY   · $cname · ${base}→${post} — PASS (IMPROVED · the mirror cured $(( base - post )))"
      else
        echo "   GATE PARITY   · $cname · ${base}→${post} — FAIL (the mirror ADDED $(( post - base )) error(s))" >&2
        failed=$(( failed + 1 ))
      fi
    done < "$WORK/gate.pre"
  fi

  # ═══ W16 (C1082) · THE BASELINE STAMP ══════════════════════════════════════════════════════
  # Written ADDITIVELY (read-merge-write, tmp+rename) so nothing else the citizen keeps in this
  # file is lost. THREE REFUSALS ARE BUILT IN, each one a way the stamp could otherwise LIE:
  #   · a faulted pass (failed > 0) never stamps — a baseline is a claim of delivery.
  #   · a report-only pass never stamps — nothing was delivered.
  #   · an EXPLICIT-fileset pass never ADVANCES `baseline`. Hand-listed files are a partial
  #     delivery by construction; stamping HEAD after one would silently retire every template
  #     change the operator did not happen to name. Only a --since pass, whose candidate set IS
  #     the range, has earned the right to move the baseline.
  # `unresolved` carries this pass's refusals forward so `--since auto` unions them back in and a
  # hand-pair can never age out of the delta.
  if [ "$failed" -eq 0 ]; then
    while IFS=$'\t' read -r cname cabs; do
      [ -n "$cname" ] || continue
      stamp="$cabs/$BASELINE_REL"
      awk -F'\t' -v n="$cname" '$1==n {print $2}' "$WORK/written.tsv" | sort -u > "$WORK/stamp.files"
      awk -F'\t' -v n="$cname" \
        '($1=="STAMPED"||$1=="FORKED"||$1=="REVERSED"||$1=="MISSING") && $2==n {print $3}' \
        "$WORK/results.tsv" | sort -u > "$WORK/stamp.unres"
      advance="none"
      [ -n "$SINCE" ] && advance="$HEAD_SHA"
      _write_stamp "$stamp" "$advance" "$WORK/stamp.files" "$WORK/stamp.unres" 2> "$WORK/stamp.err"
      prc=$?
      nF="$(grep -c . "$WORK/stamp.files" || true)"; [ -n "$nF" ] || nF=0
      nU="$(grep -c . "$WORK/stamp.unres" || true)"; [ -n "$nU" ] || nU=0
      if [ "$prc" -ne 0 ] || [ ! -f "$stamp" ]; then
        printf '   BASELINE  · %-20s · WRITE FAILED (%s) · %s\n' "$cname" "$(head -1 "$WORK/stamp.err")" "$stamp" >&2
        failed=$(( failed + 1 ))
      else
        wrote="$(_read_stamp_field "$stamp" baseline)"   # READ-BACK, not the value we meant to write
        if [ -n "$wrote" ]; then
          printf '   BASELINE  · %-20s · %s · %s delivered · %s unresolved · %s\n' \
            "$cname" "$(printf '%.7s' "$wrote")" "$nF" "$nU" "$stamp"
        else
          printf '   BASELINE  · %-20s · NOT ADVANCED (explicit fileset — a partial delivery may not claim a range) · %s delivered · %s\n' \
            "$cname" "$nF" "$stamp"
        fi
      fi
    done < "$WORK/roster.tsv"
  else
    echo "   BASELINE  · NOT STAMPED · failed=$failed — a faulted pass never advances a baseline"
  fi
  echo
else
  echo "── 7 · ACTIONABLE · NOT RUN (Informative pass only) ──"
  echo "   re-run the identical command with --apply to perform the LAG-class copies."
  echo
fi

# ═══ 8 · COUNTS + THE USER'S LAMBDA ═════════════════════════════════════════
echo "── 8 · HONEST COUNTS ──"
refused=$(( nSTAMPED + nFORKED + nREVERSED ))
echo "   attempted = $attempted   (file × citizen PAIRS classified)"
echo "   mirrored  = $mirrored   (pairs copied + byte-verified + marker-rechecked)"
echo "   refused   = $refused   pairs (STAMPED=$nSTAMPED FORKED=$nFORKED REVERSED=$nREVERSED)"
echo "   parity    = $nPARITY   pairs (byte-identical, skipped)"
echo "   created   = $nNEW   (NEW files authorized by --create · W10)"
echo "   missing   = $nMISSING   (absent one side — never written)"
echo "   lag       = $nLAG   pairs (mirrorable)"
echo "   superseded= $nSUPERSEDED   pairs (citizen PROVEN an older template revision · W14 · deletions deliverable)"
echo "   failed    = $failed   (copy/marker/gate faults — distinct from deliberate refusals)"
echo "   ── whole-FILE verdicts (never reached a citizen pair) ──"
echo "   protected = $nPROTECTED   files (identity-preserved by rule · N3/N15)"
echo "   src-missing = $srcMissing   files (operator named a path the template does not hold)"
echo
# ═══ C1113 · 8b · THE RUN RECORD anor THE FLEET (machine-readable · every run · every citizen) ═════════════
# The parent's gate is a JSON read, never a grep of decorated text; the fleet line makes an uneven roster visible
# in one glance (IE ran an epoch behind for a week because no line ever said so). Written tmp+rename, ASCII-only.
echo "── 8b · THE FLEET (per citizen · ASCII · the run record at $RUNREC_REL) ──"
touch "$WORK/gate.post" "$WORK/since.tsv" "$WORK/written.tsv"
_write_run_records
echo

if [ "$SHOWHUNKS" -eq 1 ] && [ -s "$WORK/since.tsv" ]; then
  echo "── 8c · --show-hunks · the template-side hunks behind every refused hand-pair (graft aid · read-only) ──"
  awk -F'\t' '($1=="STAMPED"||$1=="FORKED"||$1=="REVERSED") {print $2 "\t" $3}' "$WORK/results.tsv" | sort -u | while IFS=$'\t' read -r hc hrel; do
    href="$(awk -F'\t' -v n="$hc" '$1==n {print $2; exit}' "$WORK/since.tsv")"
    [ -n "$href" ] || continue
    echo "   $hc · $hrel · $(printf '%.7s' "$href")..HEAD"
    git -C "$REPO_ROOT" diff --stat "$href" HEAD -- "$TEMPLATE_PREFIX/$hrel" | sed 's/^/      /'
    git -C "$REPO_ROOT" diff "$href" HEAD -- "$TEMPLATE_PREFIX/$hrel" | sed -n '1,80p' | sed 's/^/      /'
  done
  echo
fi

echo "── 9 · THE USER'S LAMBDA (this script never performs it) ──"
if [ "$APPLY" -eq 1 ] && [ -s "$WORK/restart.txt" ]; then
  echo "   RESTART REQUIRED in: $(sort -u "$WORK/restart.txt" | tr '\n' ' ')"
  echo "   (the serving chain law — islands build at boot, not at file-write)"
  echo "   Then LOOK at the running app. This report does NOT claim the field is fixed."
else
  echo "   nothing written this pass — no restart owed."
fi
echo "════════════════════════════════════════════════════════════════════════"

rc=0
[ "$failed" -gt 0 ] && rc=1
[ "$srcMissing" -gt 0 ] && rc=1
exit $rc
