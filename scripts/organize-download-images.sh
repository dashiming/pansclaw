#!/usr/bin/env bash
set -euo pipefail

TARGET="$HOME/Downloads/Images"
mkdir -p "$TARGET"

count=0

while IFS= read -r file; do
  [[ -f "$file" ]] || continue

  base="$(basename "$file")"
  dest="$TARGET/$base"

  if [[ -e "$dest" ]]; then
    stem="${base%.*}"
    ext="${base##*.}"
    index=1
    while [[ -e "$TARGET/${stem}_$index.$ext" ]]; do
      index=$((index + 1))
    done
    dest="$TARGET/${stem}_$index.$ext"
  fi

  mv "$file" "$dest"
  count=$((count + 1))
done < <(find "$HOME/Downloads" -maxdepth 1 -type f | grep -Ei '\.(jpg|jpeg|png|gif|webp|bmp|tiff|heic|svg|avif)$' || true)

echo "moved=$count"
