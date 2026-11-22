// The catalogue's version, from its content: SHA-256 of data/downloads.json, its size, the Monge version and the
// day it was checked. Writes lib/catalog-version.ts (bundled — a few bytes) and prints the R2 key the worker will
// read: catalog/downloads-<sha12>.json, immutable — a deploy reads exactly the catalogue it was built with, and an
// older deploy (a rollback) still finds its own.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

const buf = readFileSync(new URL('../data/downloads.json', import.meta.url));
const sha256 = createHash('sha256').update(buf).digest('hex');
const data = JSON.parse(buf.toString('utf8'));
const fam = Object.values(data);
const monge = fam.map((f) => f.version).sort().pop();
const checked = fam.map((f) => f.checked).sort().pop();
const models = fam.reduce((n, f) => n + f.pages.reduce((m, p) => m + p.options.length, 0), 0);
const sizes = fam.reduce((n, f) => n + f.pages.length, 0);
const v = { version: `${checked}.${sha256.slice(0, 8)}`, sha256, bytes: buf.length, key: `catalog/downloads-${sha256.slice(0, 12)}.json`, monge, checked, models, sizes };
writeFileSync(
  new URL('../lib/catalog-version.ts', import.meta.url),
  `// Written by scripts/catalog-version.mjs from data/downloads.json — do not edit by hand.\nexport const CATALOG = ${JSON.stringify(v, null, 2)} as const;\n`,
);
console.log(v.key);
