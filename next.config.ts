import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactCompiler: true,
  async headers() {
    return [
      {
        source: '/library/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
      },
      {
        source: '/vendor/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // Every route lives under /[locale].
      { source: '/', destination: '/pl', permanent: false },
      // The Ukrainian version of the former site → English.
      { source: '/uk', destination: '/en', permanent: true },
      { source: '/uk/:path*', destination: '/en', permanent: true },
      // Pages of the former blog / shop → the new home of each locale.
      { source: '/:locale(pl|ru|en)/:old(blog|sklep|skladniki|o-mnie|catering)/:path*', destination: '/:locale', permanent: true },
      { source: '/:locale(pl|ru|en)/:old(blog|sklep|skladniki|o-mnie|catering)', destination: '/:locale', permanent: true },
      { source: '/:locale(pl|ru|en)/:old(catering-[a-z]+)', destination: '/:locale', permanent: true },
      { source: '/:locale(pl|ru|en)/kontakt', destination: '/:locale/contact', permanent: true },
      { source: '/:locale(pl|ru|en)/polityka-prywatnosci', destination: '/:locale/privacy', permanent: true },
      { source: '/:old(blog|sklep|skladniki|o-mnie|kontakt)/:path*', destination: '/pl', permanent: true },
      { source: '/:old(blog|sklep|skladniki|o-mnie|kontakt)', destination: '/pl', permanent: true },
    ];
  },
};

export default nextConfig;

// Cloudflare bindings (D1 "DB", R2 "FILES") inside `next dev`.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
