import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

const nextConfig: NextConfig = {
  reactCompiler: true,
  async redirects() {
    return [
      // 301 permanent redirect: /chef-tools/lab/combo/{slug} → /recipes/{slug}
      // Preserves SEO equity from old URLs (Google, backlinks, bookmarks).
      {
        source: '/:locale/chef-tools/lab/combo/:slug',
        destination: '/:locale/recipes/:slug',
        permanent: true,
      },

      // ─── Legacy converter URLs with ingredient slug → how-many pages ────────
      // Old pattern (indexed by Google, now 404): /chef-tools/{conversion}/{slug}
      // New pattern: /chef-tools/how-many/how-many-{unit}-in-a-{measure}-of-{slug}
      // Fixes ~701 × 4 locales = ~2800 stale 404 URLs in Google Search Console.
      {
        source: '/:locale/chef-tools/cup-to-grams/:slug',
        destination: '/:locale/chef-tools/how-many/how-many-grams-in-a-cup-of-:slug',
        permanent: true,
      },
      {
        source: '/:locale/chef-tools/tbsp-to-grams/:slug',
        destination: '/:locale/chef-tools/how-many/how-many-grams-in-a-tbsp-of-:slug',
        permanent: true,
      },
      {
        source: '/:locale/chef-tools/tsp-to-grams/:slug',
        destination: '/:locale/chef-tools/how-many/how-many-grams-in-a-tsp-of-:slug',
        permanent: true,
      },
      {
        source: '/:locale/chef-tools/oz-to-grams/:slug',
        destination: '/:locale/chef-tools/how-many/how-many-grams-in-a-oz-of-:slug',
        permanent: true,
      },
      {
        source: '/:locale/chef-tools/lb-to-grams/:slug',
        destination: '/:locale/chef-tools/how-many/how-many-grams-in-a-lb-of-:slug',
        permanent: true,
      },
      {
        source: '/:locale/chef-tools/grams-to-cups/:slug',
        destination: '/:locale/chef-tools/how-many/how-many-cups-in-a-grams-of-:slug',
        permanent: true,
      },
      {
        source: '/:locale/chef-tools/ml-to-cups/:slug',
        destination: '/:locale/chef-tools/how-many/how-many-ml-in-a-cup-of-:slug',
        permanent: true,
      },
      {
        source: '/:locale/chef-tools/ml-to-tbsp/:slug',
        destination: '/:locale/chef-tools/how-many/how-many-ml-in-a-tbsp-of-:slug',
        permanent: true,
      },
      {
        source: '/:locale/chef-tools/ml-to-tsp/:slug',
        destination: '/:locale/chef-tools/how-many/how-many-ml-in-a-tsp-of-:slug',
        permanent: true,
      },

      // ─── Legacy converter URLs WITHOUT slug → /converter/{conversion} ───────
      // Old: /chef-tools/cup-to-grams  → New: /chef-tools/converter/cup-to-grams
      {
        source: '/:locale/chef-tools/:conversion(cup-to-grams|tbsp-to-grams|tsp-to-grams|oz-to-grams|lb-to-grams|grams-to-cups|grams-to-oz|ml-to-grams|ml-to-cups|ml-to-tbsp|ml-to-tsp|kg-to-lbs|lbs-to-kg|cup-to-oz|cup-to-ml|cup-to-tbsp|cup-to-tsp|tbsp-to-oz|tbsp-to-tsp|tsp-to-tbsp)',
        destination: '/:locale/chef-tools/converter/:conversion',
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
