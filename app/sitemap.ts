import type { MetadataRoute } from 'next';
import { locales } from '@/lib/i18n';
import { getItems } from '@/lib/library';
import { standards } from '@/lib/standards';
import { allPages, downloadsOf } from '@/lib/downloads';
import { languageAlternates, SITE_URL } from '@/lib/seo';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = ['', '/kernel', '/about', '/library', '/library/standards', '/library/print', '/download', '/contact', '/privacy', '/license', '/developers'];
  const items = await getItems();
  const paths = [...pages.map((p) => ({ p, d: undefined as string | undefined })), ...items.map((i) => ({ p: `/library/${i.slug}`, d: i.updated })), ...standards.map((s) => ({ p: `/library/standards/${s.slug}`, d: s.checked ?? undefined })),
    ...allPages().map(({ slug, page }) => ({ p: `/library/${slug}/${page.id}`, d: downloadsOf(slug)?.checked }))];
  return paths.flatMap(({ p, d }) =>
    locales.map((locale) => ({
      url: `${SITE_URL}/${locale}${p}`,
      lastModified: d ? new Date(d) : new Date(),
      changeFrequency: p === '' || p === '/library' ? ('weekly' as const) : ('monthly' as const),
      priority: p === '' ? 1 : p.startsWith('/library/') ? 0.6 : 0.8,
      alternates: { languages: languageAlternates(p) },
    })),
  );
}
