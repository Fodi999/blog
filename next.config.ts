import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

const nextConfig: NextConfig = {
  reactCompiler: true,
  async redirects() {
    // 301 permanent redirect: /chef-tools/lab/combo/{slug} → /recipes/{slug}
    // Preserves SEO equity from old URLs (Google, backlinks, bookmarks).
    return [
      {
        source: '/:locale/chef-tools/lab/combo/:slug',
        destination: '/:locale/recipes/:slug',
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
