import { defineCloudflareConfig, getCloudflareContext } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import { withRegionalCache } from "@opennextjs/cloudflare/overrides/incremental-cache/regional-cache";
import memoryQueue from "@opennextjs/cloudflare/overrides/queue/memory-queue";
import type { IncrementalCache } from "@opennextjs/aws/types/overrides.js";

// Rendered pages live in R2; each Cloudflare location keeps the ones it served in its own cache (long-lived:
// until revalidated, ISR pages up to 30 min) — a repeat visit is not an R2 round trip.
const regional = withRegionalCache(r2IncrementalCache, { mode: "long-lived" });

/* A page rendered for the first time is answered at once and stored in the background: OpenNext awaits the R2 write
   before replying, and a write from a Worker takes 1–3 s — the whole wait of a first visit (rendering takes ~0.1 s).
   If the write fails, the next visit renders the page again. */
const incrementalCache: IncrementalCache = {
  name: `${regional.name}-bg-write`,
  get: (key, cacheType) => regional.get(key, cacheType),
  set: async (key, value, cacheType) => {
    const t0 = Date.now();
    const write = regional
      .set(key, value, cacheType)
      .then(() => console.log(`[timing] cache write ${Date.now() - t0} ms`))
      .catch((e) => console.error("cache write failed", e));
    try {
      getCloudflareContext().ctx.waitUntil(write);
    } catch {
      await write; // outside a request (the build): just write
    }
  },
  delete: (key) => regional.delete(key),
};

export default {
  ...defineCloudflareConfig({
    incrementalCache,
    // a page past its revalidate time is served and rebuilt in the background through WORKER_SELF_REFERENCE. Was:
    // no queue (OpenNext's "dummy") — once such a page fell out of the regional cache, every request to it failed
    // with «FatalError: Dummy queue is not implemented» (500 on /en, /pl, /ru and the library, 2026-11-23)
    queue: memoryQueue,
    // a cached page is answered before Next's routing runs
    enableCacheInterception: true,
  }),
  // `npm run build` calls `opennextjs-cloudflare build`, so the inner
  // Next.js build must not go through `npm run build` again.
  buildCommand: "npx next build",
};
