import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/_next/',
          // Block crawling of URLs with query parameters.
          // Canonical tags already point to clean URLs, but Googlebot still
          // discovers ?from=, ?ingredient=, ?region= variants via internal
          // links and marks them as "alternate page with canonical tag".
          // Blocking them here prevents wasteful crawl budget and duplicate
          // indexing signals.
          '/*?ingredient=',
          '/*?from=',
          '/*?to=',
          '/*?region=',
          '/*?q=',
          '/*?goal=',
          '/*?meal=',
          '/*?product=',
          '/*?type=',
          '/*?category=',
        ],
      },
    ],
    host: 'https://dima-fomin.pl',
    sitemap: 'https://dima-fomin.pl/sitemap.xml',
  };
}
