import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Disable strict mode in dev — it double-mounts every component, which
  // creates two WebGL canvases for `<VisualSceneRenderer>` and the first
  // one loses its context without any chance of recovery (browser limit).
  reactStrictMode: false,
  async redirects() {
    return [
      // 301 permanent redirect: /chef-tools/lab/combo/{slug} → /recipes/{slug}
      {
        source: '/:locale/chef-tools/lab/combo/:slug',
        destination: '/:locale/recipes/:slug',
        permanent: true,
      },

      // ─── Deleted calculator pages → ingredients database ─────────────────
      // how-many, converter slugs and bare converter paths all redirect to the
      // ingredients search page which provides the same lookup functionality.
      {
        source: '/:locale/chef-tools/how-many/:slug*',
        destination: '/:locale/chef-tools/ingredients',
        permanent: true,
      },
      {
        source: '/:locale/chef-tools/cup-to-grams/:slug',
        destination: '/:locale/chef-tools/ingredients',
        permanent: true,
      },
      {
        source: '/:locale/chef-tools/tbsp-to-grams/:slug',
        destination: '/:locale/chef-tools/ingredients',
        permanent: true,
      },
      {
        source: '/:locale/chef-tools/tsp-to-grams/:slug',
        destination: '/:locale/chef-tools/ingredients',
        permanent: true,
      },
      {
        source: '/:locale/chef-tools/oz-to-grams/:slug',
        destination: '/:locale/chef-tools/ingredients',
        permanent: true,
      },
      {
        source: '/:locale/chef-tools/lb-to-grams/:slug',
        destination: '/:locale/chef-tools/ingredients',
        permanent: true,
      },
      {
        source: '/:locale/chef-tools/grams-to-cups/:slug',
        destination: '/:locale/chef-tools/ingredients',
        permanent: true,
      },
      {
        source: '/:locale/chef-tools/ml-to-cups/:slug',
        destination: '/:locale/chef-tools/ingredients',
        permanent: true,
      },
      {
        source: '/:locale/chef-tools/ml-to-tbsp/:slug',
        destination: '/:locale/chef-tools/ingredients',
        permanent: true,
      },
      {
        source: '/:locale/chef-tools/ml-to-tsp/:slug',
        destination: '/:locale/chef-tools/ingredients',
        permanent: true,
      },
      // Bare converter paths (no slug)
      {
        source: '/:locale/chef-tools/:conversion(cup-to-grams|tbsp-to-grams|tsp-to-grams|oz-to-grams|lb-to-grams|grams-to-cups|grams-to-oz|ml-to-grams|ml-to-cups|ml-to-tbsp|ml-to-tsp|kg-to-lbs|lbs-to-kg|cup-to-oz|cup-to-ml|cup-to-tbsp|cup-to-tsp|tbsp-to-oz|tbsp-to-tsp|tsp-to-tbsp)',
        destination: '/:locale/chef-tools/ingredients',
        permanent: true,
      },
      // Deleted converter/recipe-analyzer/fish-season/flavor-pairing/ranking/diet pages
      {
        source: '/:locale/chef-tools/converter/:slug*',
        destination: '/:locale/chef-tools/ingredients',
        permanent: true,
      },
      {
        source: '/:locale/chef-tools/recipe-analyzer/:slug*',
        destination: '/:locale/chef-tools/dashboard',
        permanent: true,
      },
      {
        source: '/:locale/chef-tools/fish-season/:slug*',
        destination: '/:locale/chef-tools/dashboard',
        permanent: true,
      },
      {
        source: '/:locale/chef-tools/flavor-pairing/:slug*',
        destination: '/:locale/chef-tools/lab',
        permanent: true,
      },
      {
        source: '/:locale/chef-tools/ranking/:slug*',
        destination: '/:locale/chef-tools/ingredients',
        permanent: true,
      },
      {
        source: '/:locale/chef-tools/diet/:slug*',
        destination: '/:locale/chef-tools/ingredients',
        permanent: true,
      },
      {
        source: '/:locale/chef-tools/ingredient-analyzer/:slug*',
        destination: '/:locale/chef-tools/ingredients',
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.postimg.cc',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'pub-aca11a32217e46129dd78b17f017d0a1.r2.dev',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.dima-fomin.pl',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default withNextIntl(nextConfig);
