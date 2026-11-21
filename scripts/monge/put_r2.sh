#!/bin/bash
# put.sh <file> <key>
f="$1"; k="$2"
case "$k" in *.step) t=model/step;; *.stl) t=model/stl;; *.3mf) t=model/3mf;; *.glb) t=model/gltf-binary;; *) t=application/octet-stream;; esac
for i in 1 2 3; do
  if npx wrangler r2 object put "monge-files/$k" --file "$f" --content-type "$t" --remote >/dev/null 2>&1; then echo "ok $k"; exit 0; fi
  sleep 2
done
echo "FAIL $k"
