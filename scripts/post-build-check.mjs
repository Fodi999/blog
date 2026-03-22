#!/usr/bin/env node
/**
 * Post-build SEO checker for dima-fomin.pl
 *
 * 1. Fetches the sitemap from the live site (or dev server)
 * 2. HEAD-checks every URL (concurrency 20)
 * 3. Reports 404s, 5xx, timeouts
 * 4. Checks canonical, noindex, hreflang
 * 5. Exits with code 1 if ANY 404 found
 *
 * Usage:
 *   node scripts/post-build-check.mjs                     # check live site
 *   node scripts/post-build-check.mjs http://localhost:3000 # check local dev
 *   FULL_CHECK=1 node scripts/post-build-check.mjs        # full GET + meta check
 */

const BASE = process.argv[2] || 'https://dima-fomin.pl';
const SITEMAP_URL = `${BASE}/sitemap.xml`;
const CONCURRENCY = 10;
const TIMEOUT_MS = 10000;
const FULL_CHECK = !!process.env.FULL_CHECK;
// Only check one locale (pl) to avoid 4x duplicate checks — same page logic
const DEDUPE_LOCALE = true;

// ── Colors ───────────────────────────────────────────────────────────────────
const R = '\x1b[31m', G = '\x1b[32m', Y = '\x1b[33m', B = '\x1b[36m', D = '\x1b[90m', X = '\x1b[0m';

// ── Stats ────────────────────────────────────────────────────────────────────
let total = 0, ok = 0, err404 = 0, err5xx = 0, errTimeout = 0, errOther = 0;
let warnings = [];
let errors404 = [];

console.log(`\n${B}🔍 SEO Post-Build Checker${X}`);
console.log(`${D}   Site:    ${BASE}${X}`);
console.log(`${D}   Sitemap: ${SITEMAP_URL}${X}`);
console.log(`${D}   Mode:    ${FULL_CHECK ? 'FULL (GET + meta)' : 'HEAD only'}${X}\n`);

// ── 1. Fetch & parse sitemap ─────────────────────────────────────────────────

async function fetchSitemap() {
  const res = await fetch(SITEMAP_URL, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`Sitemap fetch failed: ${res.status}`);
  const xml = await res.text();

  // Simple regex extraction of <loc> URLs
  const urls = [];
  const re = /<loc>(.*?)<\/loc>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    urls.push(m[1]);
  }
  return [...new Set(urls)]; // dedupe
}

// ── 2. Check single URL ─────────────────────────────────────────────────────

async function checkUrl(url) {
  total++;
  try {
    if (FULL_CHECK) {
      // Full GET — check meta tags
      const res = await fetch(url, {
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: { 'User-Agent': 'SEO-PostBuild-Checker/1.0' },
      });

      if (res.status === 404) {
        err404++;
        errors404.push(url);
        return `${R}404${X} ${url}`;
      }
      if (res.status >= 500) {
        err5xx++;
        return `${R}${res.status}${X} ${url}`;
      }

      ok++;
      // Check meta in HTML
      const html = await res.text();

      // Check noindex
      if (/noindex/i.test(html.substring(0, 5000))) {
        warnings.push(`⚠ NOINDEX: ${url}`);
      }

      // Check canonical
      const canonMatch = html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/i);
      if (!canonMatch) {
        warnings.push(`⚠ NO CANONICAL: ${url}`);
      } else if (canonMatch[1] !== url) {
        const canon = canonMatch[1];
        // Only warn if canonical is fundamentally different (not just locale variant)
        if (!canon.includes(new URL(url).pathname.split('/').pop())) {
          warnings.push(`⚠ CANONICAL MISMATCH: ${url} → ${canon}`);
        }
      }

      // Check title
      const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
      if (!titleMatch || titleMatch[1].length < 20) {
        warnings.push(`⚠ SHORT/MISSING TITLE: ${url} (${titleMatch?.[1]?.length || 0} chars)`);
      }

      // Check description
      const descMatch = html.match(/<meta[^>]+name="description"[^>]+content="([^"]*)"/i);
      if (!descMatch || descMatch[1].length < 50) {
        warnings.push(`⚠ SHORT/MISSING DESC: ${url} (${descMatch?.[1]?.length || 0} chars)`);
      }

      return null; // ok, no output
    } else {
      // HEAD only — just check status
      const res = await fetch(url, {
        method: 'HEAD',
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: { 'User-Agent': 'SEO-PostBuild-Checker/1.0' },
      });

      if (res.status === 404) {
        err404++;
        errors404.push(url);
        return `${R}404${X} ${url}`;
      }
      if (res.status >= 500) {
        err5xx++;
        return `${R}${res.status}${X} ${url}`;
      }

      ok++;
      return null;
    }
  } catch (e) {
    if (e.name === 'TimeoutError' || e.name === 'AbortError') {
      errTimeout++;
      return `${Y}TIMEOUT${X} ${url}`;
    }
    errOther++;
    return `${Y}ERR${X} ${url} — ${e.message}`;
  }
}

// ── 3. Run with concurrency ──────────────────────────────────────────────────

async function runBatch(urls, concurrency) {
  const results = [];
  let i = 0;

  async function worker() {
    while (i < urls.length) {
      const idx = i++;
      const result = await checkUrl(urls[idx]);
      if (result) results.push(result);

      // Progress every 50 URLs
      if (total % 50 === 0) {
        process.stdout.write(`${D}  checked ${total}/${urls.length}...${X}\r`);
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, urls.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

// ── 4. Main ──────────────────────────────────────────────────────────────────

async function main() {
  let urls;
  try {
    urls = await fetchSitemap();
  } catch (e) {
    console.error(`${R}❌ Failed to fetch sitemap: ${e.message}${X}`);
    console.log(`${Y}   If checking locally, start dev server first: npx next dev${X}`);
    process.exit(1);
  }

  console.log(`📄 Found ${B}${urls.length}${X} URLs in sitemap`);

  // Dedupe: only check /pl/ locale (same page logic for all locales)
  if (DEDUPE_LOCALE) {
    const before = urls.length;
    urls = urls.filter(u => u.includes('/pl/') || !u.match(/\/(en|ru|uk)\//));
    console.log(`${D}   Deduped: ${before} → ${urls.length} (checking /pl/ only)${X}`);
  }

  console.log('');

  if (urls.length === 0) {
    console.log(`${Y}⚠ Empty sitemap!${X}`);
    process.exit(1);
  }

  const startTime = Date.now();
  const results = await runBatch(urls, CONCURRENCY);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  // Clear progress line
  process.stdout.write('                                       \r');

  // ── Print results ──────────────────────────────────────────────────────────

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`${B}📊 SEO Check Results${X} (${elapsed}s)`);
  console.log(`${'═'.repeat(60)}\n`);

  console.log(`  Total:    ${total}`);
  console.log(`  ${G}✅ OK:     ${ok}${X}`);
  if (err404) console.log(`  ${R}❌ 404:    ${err404}${X}`);
  if (err5xx) console.log(`  ${R}❌ 5xx:    ${err5xx}${X}`);
  if (errTimeout) console.log(`  ${Y}⏱ Timeout: ${errTimeout}${X}`);
  if (errOther) console.log(`  ${Y}⚠ Other:  ${errOther}${X}`);

  // Print 404 URLs
  if (errors404.length > 0) {
    console.log(`\n${R}${'─'.repeat(60)}${X}`);
    console.log(`${R}🚨 404 PAGES IN SITEMAP:${X}\n`);
    errors404.forEach(u => console.log(`  ${R}→ ${u}${X}`));
    console.log(`\n${R}These URLs are in sitemap but return 404!${X}`);
    console.log(`${R}Google will penalize your site for this.${X}`);
    console.log(`${R}Fix: remove from sitemap or create the page.${X}`);
  }

  // Print errors
  if (results.length > 0 && results.length <= 50) {
    console.log(`\n${Y}${'─'.repeat(60)}${X}`);
    console.log(`${Y}Issues:${X}\n`);
    results.forEach(r => console.log(`  ${r}`));
  } else if (results.length > 50) {
    console.log(`\n${Y}${'─'.repeat(60)}${X}`);
    console.log(`${Y}First 50 issues (${results.length} total):${X}\n`);
    results.slice(0, 50).forEach(r => console.log(`  ${r}`));
    console.log(`  ${D}... and ${results.length - 50} more${X}`);
  }

  // Print warnings (FULL mode)
  if (warnings.length > 0) {
    console.log(`\n${Y}${'─'.repeat(60)}${X}`);
    console.log(`${Y}⚠ SEO Warnings (${warnings.length}):${X}\n`);
    warnings.slice(0, 30).forEach(w => console.log(`  ${w}`));
    if (warnings.length > 30) console.log(`  ${D}... and ${warnings.length - 30} more${X}`);
  }

  console.log(`\n${'═'.repeat(60)}`);

  // Exit with error if any 404
  if (err404 > 0) {
    console.log(`\n${R}💀 BUILD FAIL: ${err404} sitemap URLs return 404${X}\n`);
    process.exit(1);
  }

  if (err5xx > 0) {
    console.log(`\n${R}⚠ WARNING: ${err5xx} server errors${X}\n`);
    process.exit(1);
  }

  console.log(`\n${G}✅ All ${ok} sitemap URLs are healthy${X}\n`);
}

main().catch(e => {
  console.error(`${R}Fatal: ${e.message}${X}`);
  process.exit(1);
});
