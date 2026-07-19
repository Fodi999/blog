import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  async redirects() {
    return [
      // The app has no root page: every route lives under /[locale].
      { source: '/', destination: '/pl', permanent: false },
      {
        source: '/:locale/skladniki/-avocado-k-c-b6-avocado-is-a-creamy-fruit-native-to-central-america-prized-for-its-healthy-monounsaturated-fats-rich-in-potassium-more-than-bananas-folate-and-vitamins-k-c-and-b6',
        destination: '/:locale/skladniki/avocado',
        permanent: true
      },
      { source: '/blog/:path*', destination: '/pl/blog/:path*', permanent: true },
      { source: '/sklep/:path*', destination: '/pl/sklep/:path*', permanent: true },
      { source: '/skladniki/:path*', destination: '/pl/skladniki/:path*', permanent: true },
      { source: '/o-mnie', destination: '/pl/o-mnie', permanent: true },
      { source: '/kontakt', destination: '/pl/kontakt', permanent: true },
    ];
  },
};

export default nextConfig;

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
