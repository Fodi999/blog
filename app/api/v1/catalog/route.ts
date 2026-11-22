import { json, localeOf, options, problem } from '@/lib/api';
import { modelId } from '@/lib/catalog';
import { downloadsOf, text } from '@/lib/downloads';
import { seedItems } from '@/lib/library';
import { SITE_URL } from '@/lib/seo';

/** GET /api/v1/catalog — the families and how many sizes and models each has; ?family=<id> — its sizes, each with
    its page and the ids of its models. */
export function GET(request: Request) {
  const u = new URL(request.url);
  const locale = localeOf(u.searchParams.get('locale'));
  const family = u.searchParams.get('family');
  const fams = seedItems.filter((i) => downloadsOf(i.slug));
  if (!family) {
    return json({
      families: fams.map((i) => {
        const d = downloadsOf(i.slug)!;
        return {
          id: i.slug,
          name: i.title[locale],
          category: i.category,
          standards: i.standards ?? [],
          sizes: d.pages.length,
          models: d.pages.reduce((n, p) => n + p.options.length, 0),
          url: `${SITE_URL}/${locale}/library/${i.slug}`,
          sizes_index: `${SITE_URL}/api/v1/catalog?family=${i.slug}&locale=${locale}`,
        };
      }),
    });
  }
  const item = fams.find((i) => i.slug === family);
  if (!item) return problem(404, 'not_found', `No family «${family}»: ${fams.map((i) => i.slug).join(', ')}`);
  const d = downloadsOf(item.slug)!;
  return json({
    family: { id: item.slug, name: item.title[locale], standards: item.standards ?? [] },
    monge_version: d.version,
    checked: d.checked,
    sizes: d.pages.map((p) => ({
      id: p.id,
      label: text(p.label, locale),
      group: text(p.group, locale),
      url: `${SITE_URL}/${locale}/library/${item.slug}/${p.id}`,
      models: p.options.map((o) => ({ id: modelId(item.slug, p.id, o.id), option: o.id })),
    })),
  });
}
export const OPTIONS = options;
