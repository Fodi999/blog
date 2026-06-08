import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  async redirects() {
    return [
      { source: '/blog/:path*', destination: '/pl/blog/:path*', permanent: true },
      { source: '/sklep/:path*', destination: '/pl/sklep/:path*', permanent: true },
      { source: '/skladniki/:path*', destination: '/pl/skladniki/:path*', permanent: true },
      { source: '/o-mnie', destination: '/pl/o-mnie', permanent: true },
      { source: '/kontakt', destination: '/pl/kontakt', permanent: true },
    ];
  },
};

export default nextConfig;
