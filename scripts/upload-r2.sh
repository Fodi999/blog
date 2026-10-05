#!/usr/bin/env bash
# Uploads production files (STEP …) from r2/ to the R2 bucket "monge-files", keeping paths:
#   r2/models/wheel-9evo-7x17-et43/wheel-9evo-7x17-et43.step → models/wheel-9evo-7x17-et43/…
set -euo pipefail
cd "$(dirname "$0")/.."
find r2 -type f ! -name '.DS_Store' | while read -r f; do
  key="${f#r2/}"
  echo "→ $key"
  npx wrangler r2 object put "monge-files/$key" --file "$f" --remote
done
