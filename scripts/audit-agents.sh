#!/usr/bin/env bash
# Audit the machine-readable layer of a running build: /llms.txt, the .md page
# twins, the sitemap and the head links that announce them.
#
# The contract being checked is the one that keeps this layer honest — a twin
# exists for exactly the pages /llms.txt lists, the sitemap declares exactly the
# same HTML URLs and never a twin, and every page advertises its own twin.
#
# Plain POSIX-ish bash: it has to run on the macOS bash 3.2 as well as in CI.
#
# Usage: scripts/audit-agents.sh [BASE_URL]     (default http://localhost:8099)
set -uo pipefail

BASE="${1:-http://localhost:8099}"
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
fail=0
bad() { printf '  ✗ %s\n' "$*"; fail=$((fail + 1)); }

curl -sf "$BASE/llms.txt" -o "$TMP/llms.txt" || { echo "cannot read $BASE/llms.txt"; exit 1; }
host=$(grep -oE 'https?://[^/ ]+/llms\.txt' "$TMP/llms.txt" | head -1 | sed -E 's#/llms\.txt$##')
[ -n "$host" ] || { echo "llms.txt does not cite its own URL"; exit 1; }

# Site paths llms.txt links to, as paths — the file prints canonical-host URLs,
# so only the path is taken and every fetch goes against BASE.
grep -oE "\]\($host[^)]*\)" "$TMP/llms.txt" \
  | sed -E "s#^\]\($host##; s#\)\$##" | sort -u > "$TMP/pages"
echo "== $(wc -l < "$TMP/pages" | tr -d ' ') pages listed in /llms.txt"

echo "== A/B/C: twins exist in both URL forms, carry no markup, no relative links"
while read -r p; do
  if [ "$p" = "/" ]; then
    forms="/index.md"
  else
    forms="${p%/}.md ${p}index.md"
  fi
  for md in $forms; do
    code=$(curl -s -o "$TMP/twin" -w '%{http_code}' "$BASE$md")
    [ "$code" = "200" ] || { bad "no twin ($code) $md"; continue; }
    grep -qE '<[a-zA-Z/][^>]*>' "$TMP/twin" && bad "markup leaked into $md"
    grep -qE '\]\(/' "$TMP/twin" && bad "site-relative link in $md"
    grep -q '{BASE}' "$TMP/twin" && bad "unexpanded {BASE} token in $md"
    grep -q '^# ' "$TMP/twin" || bad "no heading in $md"
  done
done < "$TMP/pages"

echo "== D: every page advertises its twin, the map and its structured data"
while read -r p; do
  curl -s "$BASE$p" -o "$TMP/page.html"
  grep -q 'type="text/markdown"' "$TMP/page.html" || bad "no twin link in head of $p"
  grep -q 'rel="describedby"' "$TMP/page.html" || bad "no describedby link in head of $p"
  grep -q 'application/ld+json' "$TMP/page.html" || bad "no JSON-LD on $p"
done < "$TMP/pages"

echo "== E: the sitemap and llms.txt list the same pages, and no twin"
curl -s "$BASE/sitemap.xml" \
  | sed -n 's#.*<loc>\(.*\)</loc>.*#\1#p' \
  | sed -E "s#^https?://[^/]+##" | sort -u > "$TMP/sitemap"
grep -qE '\.md$' "$TMP/sitemap" && bad "the sitemap lists a .md twin"
if ! diff "$TMP/pages" "$TMP/sitemap" > "$TMP/diff"; then
  bad "sitemap and llms.txt disagree:"
  sed 's/^/      /' "$TMP/diff"
fi
echo "  sitemap: $(wc -l < "$TMP/sitemap" | tr -d ' ') URLs"

echo "== F: every link inside /llms.txt resolves"
grep -oE "$host[^ )\`]*" "$TMP/llms.txt" | sed -E 's/[.,:;]+$//' | sort -u > "$TMP/links"
while read -r url; do
  path="${url#"$host"}"
  code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE$path")
  [ "$code" = "200" ] || bad "dead link in llms.txt ($code) $path"
done < "$TMP/links"

echo "== G: an unknown twin 404s in kind"
code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/nope-xyz.md")
type=$(curl -s -o /dev/null -w '%{content_type}' "$BASE/nope-xyz.md")
[ "$code" = "404" ] || bad "unknown .md answered $code"
case "$type" in text/plain*) ;; *) bad "unknown .md answered as $type" ;; esac

[ "$fail" -eq 0 ] && echo "== clean" || echo "== $fail problem(s)"
exit $((fail > 0))
