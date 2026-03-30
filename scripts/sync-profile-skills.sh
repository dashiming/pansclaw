#!/usr/bin/env bash
set -euo pipefail

PROFILE_ROOT="${1:-$HOME/.openclaw-pansclaw}"
REPO_ROOT="${2:-$(pwd)}"
PROFILE_SKILLS_DIR="$PROFILE_ROOT/skills"
REPO_SKILLS_DIR="$REPO_ROOT/skills"
SYNC_MODE="${SYNC_MODE:-higher}"

if [[ ! -d "$PROFILE_SKILLS_DIR" ]]; then
  echo "Profile skills directory not found: $PROFILE_SKILLS_DIR" >&2
  exit 1
fi

if [[ ! -d "$REPO_SKILLS_DIR" ]]; then
  echo "Repo skills directory not found: $REPO_SKILLS_DIR" >&2
  exit 1
fi

echo "Syncing profile skills -> repo skills"
echo "  profile: $PROFILE_SKILLS_DIR"
echo "  repo:    $REPO_SKILLS_DIR"
echo "  mode:    $SYNC_MODE"

if [[ "$SYNC_MODE" != "higher" && "$SYNC_MODE" != "all" ]]; then
  echo "Unsupported SYNC_MODE: $SYNC_MODE (expected: higher|all)" >&2
  exit 1
fi

extract_version() {
  local dir="$1"
  local version=""
  if [[ -f "$dir/.clawhub-meta.json" ]]; then
    version="$(jq -r '.version // empty' "$dir/.clawhub-meta.json")"
  fi
  if [[ -z "$version" && -f "$dir/_meta.json" ]]; then
    version="$(jq -r '.version // empty' "$dir/_meta.json")"
  fi
  echo "$version"
}

version_gt() {
  local a="$1"
  local b="$2"
  if [[ -z "$a" || -z "$b" || "$a" == "$b" ]]; then
    return 1
  fi
  [[ "$(printf '%s\n%s\n' "$a" "$b" | sort -V | tail -n1)" == "$a" ]]
}

while IFS= read -r skill_dir; do
  skill_name="$(basename "$skill_dir")"
  target_dir="$REPO_SKILLS_DIR/$skill_name"

  if [[ -d "$target_dir" ]]; then
    if [[ "$SYNC_MODE" == "all" ]]; then
      rsync -a "$skill_dir/" "$target_dir/"
      echo "synced: $skill_name (mode=all)"
      continue
    fi

    profile_version="$(extract_version "$skill_dir")"
    repo_version="$(extract_version "$target_dir")"

    if version_gt "$profile_version" "$repo_version"; then
      rsync -a "$skill_dir/" "$target_dir/"
      echo "synced: $skill_name ($repo_version -> $profile_version)"
    else
      if [[ -n "$profile_version" && -n "$repo_version" ]]; then
        echo "skip: $skill_name (profile=$profile_version, repo=$repo_version)"
      else
        echo "skip: $skill_name (missing comparable version metadata)"
      fi
    fi
  else
    echo "skip (missing in repo): $skill_name"
  fi
done < <(find "$PROFILE_SKILLS_DIR" -mindepth 1 -maxdepth 1 -type d | sort)

echo
echo "Done. Review changes with: git status --short && git --no-pager diff --stat"
