#!/usr/bin/env bash
# SCP-UPD-FND D-U2 · the 3-way SCP-template diff → the update guideline JSON.
#
# Computes a READ-ONLY 3-way merge between the user's SCP RED repo and the current
# SCS template (from the retained reference clone, D-U1), partitioning every changed
# file into apply / preserve / conference buckets. The SCP working tree + index are
# NEVER mutated — the merge is computed in-memory by `git merge-tree --write-tree`
# and "theirs" is minted into a throwaway temp index (no checkout, no temp branch).
#
#   base    = the SCP RED repo's `SCS: initialize nested location repository` ROOT
#             commit (the original template snapshot at install time). HALT-guarded:
#             must EXIST and BE the root, else exit non-zero (the #1 false-collision-
#             flood mitigation).
#   ours    = the SCP repo HEAD (the user's changes since install).
#   theirs  = a synthetic commit minting the clone's template files off `base`
#             (read-tree base → overlay template → write-tree → commit-tree).
#   merge   = git merge-tree --write-tree --merge-base=<base> <ours> <theirs>.
#
# Buckets:
#   conference = the merge-tree conflict set (both sides changed the file).
#   apply      = (diff --name-status base theirs) MINUS conference.
#   preserve   = (diff --name-status base ours)   MINUS conference MINUS apply.
# Collision-zone path-globs ELEVATE a would-be apply to conference (the safety
# override: a user expand-zone NEVER silently takes theirs even on a clean merge).
#
# Usage:
#   scp-3way-diff.sh <scp-repo-root> <theirs-template-path> [<scp-name>]
#     <scp-repo-root>        Cascades/scps/<name>/ — the RED repo (holds .git + base)
#     <theirs-template-path> <clonePath>/Cascades/scps/template/SCP — the new template
#     <scp-name>             output filename key (default: basename of <scp-repo-root>)
#   Output: Cascades/Bridge/scp-update-diff.<scp-name>.json (atomic tmp+mv).

set -euo pipefail

# ── args ────────────────────────────────────────────────────────────────────
if [ "$#" -lt 2 ]; then
  echo "ERROR: usage: scp-3way-diff.sh <scp-repo-root> <theirs-template-path> [<scp-name>]" >&2
  exit 2
fi

SCP_REPO_ROOT="$1"
THEIRS_TEMPLATE="$2"
SCP_NAME="${3:-$(basename "$(cd "$SCP_REPO_ROOT" && pwd)")}"

for tool in git jq; do
  command -v "$tool" >/dev/null 2>&1 || { echo "ERROR: '$tool' is required but not found" >&2; exit 2; }
done

if [ ! -d "$SCP_REPO_ROOT/.git" ]; then
  echo "ERROR: '$SCP_REPO_ROOT' is not a git repository (no .git) — this SCP has no RED repo; update unavailable" >&2
  exit 3
fi
if [ ! -d "$THEIRS_TEMPLATE" ]; then
  echo "ERROR: theirs template path '$THEIRS_TEMPLATE' does not exist" >&2
  exit 3
fi

# The template's parent dir is the work-tree we overlay from, so `git add SCP`
# stages the files at the `SCP/...` prefix the RED repo tracks.
THEIRS_PARENT="$(cd "$THEIRS_TEMPLATE/.." && pwd)"
THEIRS_LEAF="$(basename "$THEIRS_TEMPLATE")"   # expected: SCP

GIT() { git -C "$SCP_REPO_ROOT" "$@"; }

# ── base · the HALT-guarded init root commit (#1-risk mitigation) ────────────
# Cycle 282: the installer now writes the DYNAMIC init message
# ('SCS: initialize <name> — <stamp>' · gitmNestedMaintain.ts:234); the legacy literal
# ('SCS: initialize nested location repository' · installConstants GITM_NESTED_GIT_COMMIT_MSG)
# still exists on older installs. The base assert matches the PREFIX — both forms prove
# the root is the SCS template snapshot.
INIT_MSG_PREFIX="SCS: initialize"

# The root commit (no parents). There must be exactly one for a clean RED repo.
ROOT_COMMITS="$(GIT rev-list --max-parents=0 HEAD)"
ROOT_COUNT="$(printf '%s\n' "$ROOT_COMMITS" | grep -c . || true)"
if [ "$ROOT_COUNT" -ne 1 ]; then
  echo "ERROR: expected exactly 1 root commit in the SCP RED repo, found $ROOT_COUNT — base lineage ambiguous; HALT (the false-collision-flood mitigation)" >&2
  exit 4
fi
BASE="$(printf '%s\n' "$ROOT_COMMITS" | head -1)"

# Assert the root commit carries the SCS init message — proves it is the template
# snapshot, not some other first commit.
BASE_MSG="$(GIT log -1 --format=%s "$BASE")"
case "$BASE_MSG" in
  "$INIT_MSG_PREFIX"*) ;;
  *)
    echo "ERROR: SCP root commit message is '$BASE_MSG', expected an '$INIT_MSG_PREFIX …' init — this SCP has no SCS init base; HALT" >&2
    exit 4
    ;;
esac

# Also assert the commit found by message IS the root (no later re-init confusion).
GREP_SHA="$(GIT log --grep="^$INIT_MSG_PREFIX" --format=%H | tail -1)"
if [ -n "$GREP_SHA" ] && [ "$GREP_SHA" != "$BASE" ]; then
  echo "ERROR: the '$INIT_MSG_PREFIX …' commit ($GREP_SHA) is NOT the repo root ($BASE) — base lineage mismatch; HALT" >&2
  exit 4
fi

OURS="$(GIT rev-parse HEAD)"

# ── capture the SCP read-only fingerprint (proof we never mutate it) ─────────
PRE_STATUS="$(GIT status --short || true)"

# ── theirs · mint a synthetic commit off base, no checkout, no temp branch ───
TMP_INDEX="$(mktemp -t scp3way-index.XXXXXX)"
APPLY_JSON="$(mktemp -t scp3way-apply.XXXXXX)"
PRESERVE_JSON="$(mktemp -t scp3way-preserve.XXXXXX)"
CONFERENCE_JSON="$(mktemp -t scp3way-conf.XXXXXX)"
APPLY_PATHS="$(mktemp -t scp3way-applyp.XXXXXX)"
cleanup() {
  rm -f "$TMP_INDEX" "$APPLY_JSON" "$PRESERVE_JSON" "$CONFERENCE_JSON" "$APPLY_PATHS"
}
trap cleanup EXIT

# The SCP .gitignore patterns (node_modules/dist/.bridge-*/*.tsbuildinfo) keep the
# base/ours trees source-only. The template dir on disk, however, CARRIES those
# artifacts, and `git add` from a foreign work-tree does NOT honor the SCP repo's
# ignore rules — so we EXCLUDE them explicitly so theirs stays source-scoped and the
# diff never floods with node_modules. (Mirrors ensureScpGitignore's committed set.)
THEIRS_EXCLUDES=(
  ":(exclude)$THEIRS_LEAF/node_modules"
  ":(exclude)$THEIRS_LEAF/**/node_modules"
  ":(exclude)$THEIRS_LEAF/dist"
  ":(exclude)$THEIRS_LEAF/**/dist"
  ":(exclude)$THEIRS_LEAF/**/*.tsbuildinfo"
  ":(exclude)$THEIRS_LEAF/.bridge-restart.json"
  ":(exclude)$THEIRS_LEAF/.bridge-detect.sentinel"
  ":(exclude)$THEIRS_LEAF/**/.bridge-restart.json"
  ":(exclude)$THEIRS_LEAF/**/.bridge-detect.sentinel"
)

# Start the temp index from base's tree, drop the package subtree, overlay theirs.
# git -C honors GIT_INDEX_FILE via env; we pass it inline per temp-index call so the
# SCP repo's real index ($SCP_REPO_ROOT/.git/index) is NEVER touched.
GIT_INDEX_FILE="$TMP_INDEX" git -C "$SCP_REPO_ROOT" read-tree "$BASE"
# Remove the existing package subtree entries from the temp index (so deletions in
# the new template are reflected), then re-add the whole template from its parent
# (honoring the artifact exclusions so theirs is source-only).
GIT_INDEX_FILE="$TMP_INDEX" git -C "$SCP_REPO_ROOT" --work-tree="$THEIRS_PARENT" \
  rm -r --cached "$THEIRS_LEAF" -q 2>/dev/null || true
# C284: the template now SHIPS its own committed .gitignore — git add honors it natively,
# and the explicit exclude pathspecs ERROR (exit 1 · git refuses exclude-named ignored dirs
# once an ignore file governs them). Plain add when the .gitignore is present; the exclude
# pathspecs remain the fallback for pre-C284 clones without one.
if [ -f "$THEIRS_TEMPLATE/.gitignore" ]; then
  GIT_INDEX_FILE="$TMP_INDEX" git -C "$SCP_REPO_ROOT" --work-tree="$THEIRS_PARENT" \
    add "$THEIRS_LEAF"
else
  GIT_INDEX_FILE="$TMP_INDEX" git -C "$SCP_REPO_ROOT" --work-tree="$THEIRS_PARENT" \
    add "$THEIRS_LEAF" "${THEIRS_EXCLUDES[@]}"
fi
THEIRS_TREE="$(GIT_INDEX_FILE="$TMP_INDEX" git -C "$SCP_REPO_ROOT" write-tree)"
THEIRS="$(git -C "$SCP_REPO_ROOT" commit-tree "$THEIRS_TREE" -p "$BASE" -m "scp-3way: synthetic theirs")"

# ── merge-tree · in-memory 3-way (working tree untouched) ────────────────────
set +e
MERGE_OUT="$(git -C "$SCP_REPO_ROOT" merge-tree --write-tree --merge-base="$BASE" "$OURS" "$THEIRS" 2>/dev/null)"
MERGE_EXIT=$?
set -e
# exit 0 = clean merge; exit 1 = conflicts (expected, not an error); >1 = real error.
if [ "$MERGE_EXIT" -gt 1 ]; then
  echo "ERROR: git merge-tree failed (exit $MERGE_EXIT)" >&2
  exit 5
fi

RESULT_TREE="$(printf '%s\n' "$MERGE_OUT" | head -1)"

# Conflict paths = the stage 1/2/3 lines (before the first blank line). Strip the
# `<mode> <oid> <stage>\t` prefix; unique-sort.
CONFLICT_PATHS="$(
  printf '%s\n' "$MERGE_OUT" \
    | sed -n '2,/^$/p' \
    | awk -F'\t' '/^[0-7]{6} [0-9a-f]+ [123]\t/ { print $2 }' \
    | sort -u
)"

# ── the two name-status diffs (apply / preserve candidate sets) ──────────────
DIFF_THEIRS="$(GIT diff --name-status "$BASE" "$THEIRS")"   # base → theirs
DIFF_OURS="$(GIT diff --name-status "$BASE" "$OURS")"       # base → ours

# ── collision-zone globs (per S1/S2/S4) ──────────────────────────────────────
# Glob predicate: returns the zone name (or empty). A would-be apply in a zone is
# elevated to conference. Zones live with the template they describe.
collision_zone_name() {
  local p="$1"
  case "$p" in
    SCP/src/concepts/muxonomy/*)            echo "muxonomy" ;;
    SCP/src/concepts/client/*)              echo "client-muxium" ;;
    SCP/src/concepts/muxonomyRegistry.generated.ts) echo "muxonomy-registry" ;;
    SCP/src/concepts/*/*.muxonomy.ts)       echo "navbar-muxonomy" ;;
    SCP/src/concepts/*/*.subPageRegistry.ts) echo "navbar-subpage" ;;
    *)                                      echo "" ;;
  esac
}

# Build a lookup set of conflict paths (one per line) for membership tests.
is_conflict() { printf '%s\n' "$CONFLICT_PATHS" | grep -qxF "$1"; }

# ── classify · emit JSON-array fragments to the temp files (declared above) ──
# Track which paths landed in apply (so preserve can exclude them).
: > "$APPLY_JSON"
: > "$PRESERVE_JSON"
: > "$CONFERENCE_JSON"
: > "$APPLY_PATHS"

emit_entry() {  # status path collisionZone collisionZoneName
  jq -nc --arg path "$2" --arg status "$1" \
        --argjson cz "$3" --arg czn "$4" \
        '{path:$path,status:$status,collisionZone:$cz} + (if $czn=="" then {} else {collisionZoneName:$czn} end)'
}

# MD-C · FOLD #5b · THE RESOLVER HUNK-EMBEDDING. For an APPLY-bucket entry, embed the unified
# diff hunk (ours → the merge RESULT_TREE, scoped to this path) so a conference-0 update can land
# NO-AGENT (readDiffFallback synthesizes 'patch' decisions bridge-side · zero-collision zero-round).
# The hunk is the exact patch git apply would take to move OURS to the merged result for this path.
# Emits the entry WITH a `hunk` field. Per-hunk size is bounded by the diff itself (one path).
emit_apply_entry() {  # status path
  local hunk
  hunk="$(GIT diff "$OURS" "$RESULT_TREE" -- "$2" 2>/dev/null || true)"
  jq -nc --arg path "$2" --arg status "$1" --arg hunk "$hunk" \
        '{path:$path,status:$status,collisionZone:false,hunk:$hunk}'
}

COLLISION_HITS=0

# conference first (from the merge-tree conflict set)
while IFS= read -r p; do
  [ -z "$p" ] && continue
  zone="$(collision_zone_name "$p")"
  [ -n "$zone" ] && COLLISION_HITS=$((COLLISION_HITS+1))
  czbool=$([ -n "$zone" ] && echo true || echo false)
  emit_entry "both-modified" "$p" "$czbool" "$zone" >> "$CONFERENCE_JSON"
done <<< "$CONFLICT_PATHS"

# apply = base→theirs MINUS conflicts; collision-zone elevates to conference
while IFS=$'\t' read -r status p rest; do
  [ -z "${p:-}" ] && continue
  # rename/copy lines carry an extra column; for R/C the new path is in $rest.
  case "$status" in
    R*|C*) p="$rest" ;;
  esac
  is_conflict "$p" && continue                # already conference
  zone="$(collision_zone_name "$p")"
  if [ -n "$zone" ]; then
    # ELEVATE: a theirs-only change inside a user expand-zone → conference.
    COLLISION_HITS=$((COLLISION_HITS+1))
    emit_entry "elevated-collision-zone" "$p" "true" "$zone" >> "$CONFERENCE_JSON"
    echo "$p" >> "$APPLY_PATHS"   # mark so preserve also excludes it
    continue
  fi
  # FOLD #5b — embed the ours→result hunk so a conference-0 update lands NO-AGENT.
  emit_apply_entry "$status" "$p" >> "$APPLY_JSON"
  echo "$p" >> "$APPLY_PATHS"
done <<< "$DIFF_THEIRS"

# preserve = base→ours MINUS conflicts MINUS apply(+elevated)
while IFS=$'\t' read -r status p rest; do
  [ -z "${p:-}" ] && continue
  case "$status" in
    R*|C*) p="$rest" ;;
  esac
  is_conflict "$p" && continue
  grep -qxF "$p" "$APPLY_PATHS" && continue
  zone="$(collision_zone_name "$p")"
  czbool=$([ -n "$zone" ] && echo true || echo false)
  emit_entry "$status" "$p" "$czbool" "$zone" >> "$PRESERVE_JSON"
done <<< "$DIFF_OURS"

# ── assemble the final JSON (atomic tmp+mv) ──────────────────────────────────
# The bucket arrays are read from FILES via --slurpfile (each temp file is newline-
# delimited JSON objects). This avoids the ARG_MAX "Argument list too long" failure
# that hits when a near-empty SCP makes `apply` hundreds of entries long.

CLONE_MODE="${SCP_UPD_CLONE_MODE:-unknown}"   # set by the caller (D-U1 RetainedCloneResult.mode)
GENERATED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

# Output home: Cascades/Bridge/ under the CURRENT working directory (the bridge runtime
# root). Atomic write via tmp+mv (mirrors install BECIS tmp+rename).
OUT_DIR="${SCP_UPD_OUT_DIR:-$(pwd)/Cascades/Bridge}"
mkdir -p "$OUT_DIR"
OUT_JSON="$OUT_DIR/scp-update-diff.$SCP_NAME.json"
OUT_TMP="$OUT_JSON.tmp.$$"

jq -n \
  --arg schemaVersion "1.0.0" \
  --arg scpName "$SCP_NAME" \
  --arg generatedAt "$GENERATED_AT" \
  --arg baseSha "$BASE" \
  --arg oursSha "$OURS" \
  --arg theirsSha "$THEIRS" \
  --arg resultTree "$RESULT_TREE" \
  --arg cloneMode "$CLONE_MODE" \
  --arg scpRepoRoot "$SCP_REPO_ROOT" \
  --arg theirsTemplateRoot "$THEIRS_PARENT" \
  --arg theirsTemplate "$THEIRS_TEMPLATE" \
  --arg mergeMechanism "merge-tree --write-tree" \
  --argjson collisionZones "$COLLISION_HITS" \
  --slurpfile apply "$APPLY_JSON" \
  --slurpfile preserve "$PRESERVE_JSON" \
  --slurpfile conference "$CONFERENCE_JSON" \
  '{
    schemaVersion: $schemaVersion,
    scpName: $scpName,
    generatedAt: $generatedAt,
    provenance: {
      baseSha: $baseSha,
      oursSha: $oursSha,
      theirsSha: $theirsSha,
      resultTree: $resultTree,
      theirsTemplatePath: $theirsTemplate,
      cloneMode: $cloneMode,
      scpRepoRoot: $scpRepoRoot,
      theirsTemplateRoot: $theirsTemplateRoot,
      mergeMechanism: $mergeMechanism
    },
    summary: {
      apply: ($apply | length),
      preserve: ($preserve | length),
      conference: ($conference | length),
      collisionZones: $collisionZones
    },
    buckets: {
      apply: $apply,
      preserve: $preserve,
      conference: $conference
    }
  }' > "$OUT_TMP"

mv -f "$OUT_TMP" "$OUT_JSON"

# ── read-only proof · status must be byte-identical pre/post ─────────────────
POST_STATUS="$(GIT status --short || true)"
if [ "$PRE_STATUS" != "$POST_STATUS" ]; then
  echo "ERROR: the SCP repo status CHANGED during the diff (read-only invariant broken)" >&2
  echo "--- pre ---" >&2; printf '%s\n' "$PRE_STATUS" >&2
  echo "--- post ---" >&2; printf '%s\n' "$POST_STATUS" >&2
  exit 6
fi

APPLY_N="$(jq -s 'length' "$APPLY_JSON")"
PRESERVE_N="$(jq -s 'length' "$PRESERVE_JSON")"
CONFERENCE_N="$(jq -s 'length' "$CONFERENCE_JSON")"
echo "OK: $OUT_JSON"
echo "apply=$APPLY_N preserve=$PRESERVE_N conference=$CONFERENCE_N collisionZones=$COLLISION_HITS"
