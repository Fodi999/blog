import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".open-next/**",
    "open-next.config.ts",
    // build output of wrangler and the vendored three.js (not our code: 41 errors and 1 500 warnings drowned ours)
    ".wrangler/**",
    "public/vendor/**",
  ]),
]);

export default eslintConfig;
