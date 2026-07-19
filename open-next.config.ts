import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";

export default {
  ...defineCloudflareConfig({
    incrementalCache: r2IncrementalCache,
  }),
  // `npm run build` calls `opennextjs-cloudflare build`, so the inner
  // Next.js build must not go through `npm run build` again.
  buildCommand: "npx next build",
};
