#!/usr/bin/env bash
set -euo pipefail

PROFILE_ROOT="${1:-$HOME/.openclaw-pansclaw}"
REPO_ROOT="${2:-$(pwd)}"
PROFILE_SKILLS_DIR="$PROFILE_ROOT/skills"
REPO_SKILLS_DIR="$REPO_ROOT/skills"

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

while IFS= read -r skill_dir; do
  skill_name="$(basename "$skill_dir")"
  target_dir="$REPO_SKILLS_DIR/$skill_name"

  if [[ -d "$target_dir" ]]; then
    rsync -a "$skill_dir/" "$target_dir/"
    echo "synced: $skill_name"
  else
    echo "skip (missing in repo): $skill_name"
  fi
done < <(find "$PROFILE_SKILLS_DIR" -mindepth 1 -maxdepth 1 -type d | sort)

echo
echo "Done. Review changes with: git status --short && git --no-pager diff --stat"
