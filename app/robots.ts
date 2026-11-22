import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

/* Who may read what.
   - Everyone (search engines, AI search and assistants fetching for a person — Googlebot, Bingbot, OAI-SearchBot,
     ChatGPT-User, Claude-SearchBot, Claude-User, PerplexityBot …): the pages, the catalogue API (/api/v1/) and the
     library's free files (/api/files/downloads/, /api/files/public/).
   - Not for crawlers: the forms and counters (/api/lead, /api/presence), the app's private templates
     (/api/templates), Pro files (/api/files/models/).
   - Crawlers that gather text to TRAIN models are kept out — reading the site for search is not consent to train
     on it. One switch: ALLOW_TRAINING. */
const ALLOW_TRAINING = false;
const TRAINING = ['GPTBot', 'Google-Extended', 'CCBot', 'ClaudeBot', 'Applebot-Extended', 'Meta-ExternalAgent', 'Bytespider'];

export default function robots(): MetadataRoute.Robots {
  const shared = {
    allow: ['/', '/api/v1/', '/api/files/downloads/', '/api/files/public/'],
    disallow: ['/api/lead', '/api/presence', '/api/templates', '/api/files/models/', '/api/health'],
  };
  return {
    rules: [{ userAgent: '*', ...shared }, ...(ALLOW_TRAINING ? [] : [{ userAgent: TRAINING, disallow: ['/'] }])],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
