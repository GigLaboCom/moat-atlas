#!/usr/bin/env bash
#
# Install the /moats skill from skills/moats/ into Claude Code.
#
# Usage:
#   ./scripts/install-skill.sh              (or: npm run skill)
#   ./scripts/install-skill.sh --link       symlink the checkout instead of
#                                           copying, so the skill tracks the repo
#   ./scripts/install-skill.sh --to DIR     install into DIR instead of the
#                                           user-level skills directory — e.g.
#                                           another project's .claude/skills
#
# Without a clone there is also the plugin route:
#   /plugin marketplace add GigLaboCom/moat-atlas
#   /plugin install moats@moat-atlas
#

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$REPO_ROOT/skills/moats"
TARGET_BASE="${CLAUDE_CONFIG_DIR:-$HOME/.claude}/skills"
LINK=0

while [ $# -gt 0 ]; do
  case "$1" in
    --link) LINK=1 ;;
    --to) TARGET_BASE="${2:?--to needs a directory}"; shift ;;
    *) echo "unknown option: $1" >&2; exit 2 ;;
  esac
  shift
done

DEST="$TARGET_BASE/moats"

if [ -e "$DEST" ] || [ -L "$DEST" ]; then
  # Replace only something that is recognisably a skill — never an arbitrary dir.
  if [ -L "$DEST" ] || [ -f "$DEST/SKILL.md" ]; then
    echo "Replacing existing $DEST"
    rm -rf "$DEST"
  else
    echo "Refusing to overwrite $DEST — it exists and is not a skill." >&2
    exit 1
  fi
fi

mkdir -p "$TARGET_BASE"

if [ "$LINK" = 1 ]; then
  ln -s "$SRC" "$DEST"
  echo "Linked $DEST → $SRC"
else
  cp -R "$SRC" "$DEST"
  find "$DEST" -name '.DS_Store' -delete
  echo "Copied the skill to $DEST"
fi

echo "Done. In a new Claude Code session, /moats scans the current project."
echo "Verify the copy against this repo any time:"
echo "  node \"$DEST/scripts/check.mjs\" \"$REPO_ROOT\""
