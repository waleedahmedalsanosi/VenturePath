#!/bin/bash
set -euo pipefail

# Only run in remote (Claude Code on the web) — local installs persist on disk.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

GSTACK_DIR="$HOME/.claude/skills/gstack"
SKILLS_DIR="$HOME/.claude/skills"

mkdir -p "$SKILLS_DIR"

# Clone gstack if missing (ephemeral container).
if [ ! -d "$GSTACK_DIR" ]; then
  git clone --single-branch --depth 1 \
    https://github.com/garrytan/gstack.git "$GSTACK_DIR" >&2
fi

# Run setup if compiled binaries are missing (e.g. fresh clone).
if [ ! -x "$GSTACK_DIR/bin/gstack-config" ] || [ ! -x "$GSTACK_DIR/browse/dist/browse" ]; then
  (cd "$GSTACK_DIR" && ./setup >&2 2>&1) || true
fi

# Surface each gstack sub-skill at the top level so Claude Code discovers it.
for d in "$GSTACK_DIR"/*/; do
  name=$(basename "$d")
  if [ -f "$d/SKILL.md" ] && [ ! -e "$SKILLS_DIR/$name" ]; then
    ln -s "$d" "$SKILLS_DIR/$name"
  fi
done
