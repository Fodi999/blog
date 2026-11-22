#!/usr/bin/env bash
# Builds the Claude plugin archive monge-cad.zip from monge-plugin-publication/claude-plugin/monge-cad:
# checks the JSON, the server URL and the version, validates with `claude plugin validate` (when the Claude Code CLI
# is installed), zips the plugin folder as the archive's single top-level entry and puts a copy on the Desktop.
#   npm run plugin:claude          the archive for the production server (https://dima-fomin.pl/mcp)
#   npm run plugin:claude -- test  allows the test server address in .mcp.json (for a private test archive)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIR="$ROOT/monge-plugin-publication/claude-plugin"
PLUGIN="$DIR/monge-cad"
MODE="${1:-production}"

python3 - "$PLUGIN" "$MODE" <<'EOF'
import json, re, sys
plugin, mode = sys.argv[1], sys.argv[2]
manifest = json.load(open(f"{plugin}/.claude-plugin/plugin.json"))
servers = json.load(open(f"{plugin}/.mcp.json"))["mcpServers"]
url = servers["monge-cad"]["url"]
skill = open(f"{plugin}/skills/monge-cad/SKILL.md").read()
front = skill.split("---")[1]
desc = re.search(r"^description: (.*)$", front, re.M).group(1)
assert re.search(r"^name: monge-cad$", front, re.M), "SKILL.md: name must be monge-cad (the folder's name)"
assert len(desc) <= 1024, f"SKILL.md: description {len(desc)} > 1024 characters"
assert servers["monge-cad"]["type"] == "http", ".mcp.json: type must be http"
if mode != "test" and url != "https://dima-fomin.pl/mcp":
    sys.exit(f".mcp.json points at {url}, not https://dima-fomin.pl/mcp — for a test archive run: npm run plugin:claude -- test")
print(f"monge-cad {manifest['version']} → {url} · skill description {len(desc)} chars")
EOF

if command -v claude >/dev/null 2>&1; then
  claude plugin validate "$PLUGIN"
else
  echo "warning: the claude CLI is not installed — skipped 'claude plugin validate'"
fi

cd "$DIR"
rm -f monge-cad.zip
zip -qr -X monge-cad.zip monge-cad -x '*.DS_Store'
cp monge-cad.zip "$HOME/Desktop/monge-cad.zip"
echo "built $DIR/monge-cad.zip ($(du -k monge-cad.zip | cut -f1) KB) — copy: ~/Desktop/monge-cad.zip"
