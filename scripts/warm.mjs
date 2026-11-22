#!/usr/bin/env node
/* Opens every page of the sitemap once after a deploy, so that no visitor waits for a page to be rendered for the
   first time. OpenNext keys its page cache by the build — a new deploy starts with an empty cache, and a page never
   opened costs its first visitor ~1–2 s; a warmed one is read from R2 (~0.2 s).

   node scripts/warm.mjs [site] [parallel]      default https://dima-fomin.pl, 2 at a time */

const site = (process.argv[2] ?? 'https://dima-fomin.pl').replace(/\/$/, '');
const parallel = Number(process.argv[3] ?? 2);
const UA = 'monge-warm/1.0';

const xml = await (await fetch(`${site}/sitemap.xml`, { headers: { 'user-agent': UA } })).text();
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(/^https?:\/\/[^/]+/, site));
console.log(`${urls.length} pages, ${parallel} at a time`);

const t0 = Date.now();
let next = 0;
let done = 0;
const bad = [];
const slow = [];
async function worker() {
  while (next < urls.length) {
    const url = urls[next++];
    const t = Date.now();
    try {
      const r = await fetch(url, { headers: { 'user-agent': UA } });
      await r.arrayBuffer();
      if (!r.ok) bad.push(`${r.status} ${url}`);
      slow.push(Date.now() - t);
    } catch (e) {
      bad.push(`ERR ${url} ${e.message}`);
    }
    if (++done % 200 === 0) console.log(`${done}/${urls.length}  ${Math.round((Date.now() - t0) / 1000)} s`);
  }
}
await Promise.all(Array.from({ length: parallel }, worker));
slow.sort((a, b) => a - b);
const q = (p) => slow[Math.min(slow.length - 1, Math.floor(p * slow.length))];
console.log(`done in ${Math.round((Date.now() - t0) / 1000)} s; median ${q(0.5)} ms, p95 ${q(0.95)} ms; failed ${bad.length}`);
for (const b of bad.slice(0, 20)) console.log('  ' + b);
process.exit(bad.length ? 1 : 0);
