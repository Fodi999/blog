import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PartConfigurator } from '@/components/PartConfigurator';
import { Eyebrow } from '@/components/sections';
import { downloadsOf, fileKey, FORMATS, pageOf, text, type DlPage } from '@/lib/downloads';
import { fill, getDict, isLocale, localPath, type Locale } from '@/lib/i18n';
import { getItem } from '@/lib/library';
import { pageMetadata, SITE_URL } from '@/lib/seo';
import { columnLabel, formatCell, standardById, standardTitle, unitOf, type StandardTable } from '@/lib/standards';

/* One size of a library part — its own address, e.g. /ru/library/bolt-iso-4017/m12-x-60: the size's row of each
   standard, the 3D view, the four files of each option, the other sizes. Rendered on first visit and cached. */
export const revalidate = 86400;
export const dynamicParams = true;

export function generateStaticParams() {
  return [];
}

type Params = { locale: string; slug: string; size: string };

/** The row of a standard for this size: by its size, name or diameter. */
function rowOf(s: StandardTable, key: string | null | undefined) {
  if (!key) return undefined;
  return s.rows.find((r) => r.size === key || r.name === key || (typeof r.d === 'number' && String(r.d) === key));
}

function dimsLine(locale: Locale, page: DlPage): string {
  const s = page.std ? standardById(page.std) : undefined;
  const r = s && rowOf(s, page.row);
  if (!s || !r) return '';
  const cols = s.columns.filter((c) => !['size', 'name', 'metric', 'preferred', 'fabric_only', 'source', 'lengths', 'l_min', 'l_max'].includes(c) && typeof r[c] === 'number').slice(0, 4);
  if (!cols.length) return '';
  const units = cols.map((c) => unitOf(s, c));
  const same = units.every((u) => u === units[0]);
  const one = (c: string, i: number) => `${columnLabel(c) || c} ${formatCell(locale, r[c], c)}${same || !units[i] ? '' : ` ${units[i]}`}`;
  return `${cols.map(one).join(', ')}${same && units[0] ? ` ${units[0]}` : ''}; `;
}

function massText(locale: Locale, kg: number): string {
  const nf = (n: number, d: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: d }).format(n);
  return kg >= 1 ? `${nf(kg, 2)} kg` : `${nf(kg * 1000, kg < 0.01 ? 2 : 1)} g`;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale, slug, size } = await params;
  if (!isLocale(locale)) return {};
  const item = await getItem(slug);
  const page = pageOf(slug, size);
  if (!item || !page) return {};
  const t = getDict(locale);
  const name = item.short?.[locale] ?? item.title[locale];
  const label = text(page.label, locale);
  const opt = page.options[page.options.length - 1];
  const title = fill(t.item.dl.pageTitle, { name, size: label });
  const desc = fill(t.item.dl.pageDesc, { name, size: label, dims: dimsLine(locale, page), mass: massText(locale, opt.massKg), thread: page.options.some((o) => o.id === 'exact') ? t.item.dl.threadNote : '' });
  return pageMetadata(locale, `/library/${slug}/${size}`, title, desc, item.image);
}

export default async function SizePage({ params }: { params: Promise<Params> }) {
  const { locale, slug, size } = await params;
  if (!isLocale(locale)) notFound();
  const item = await getItem(slug);
  const dl = downloadsOf(slug);
  const page = pageOf(slug, size);
  if (!item || !dl || !page) notFound();
  const t = getDict(locale);
  const name = item.short?.[locale] ?? item.title[locale];
  const label = text(page.label, locale);
  const group = text(page.group, locale);
  const siblings = dl.pages.filter((p) => text(p.group, locale) === group && p.id !== page.id);
  const groups = Array.from(new Set(dl.pages.map((p) => text(p.group, locale)))).filter((g) => g !== group);
  const tables = (item.standards ?? [])
    .map((id) => standardById(id))
    .filter((s) => s !== undefined)
    .map((s) => ({ s, r: rowOf(s, page.row) }))
    .filter((x) => x.r);
  const opt = page.options[page.options.length - 1];
  const url = `${SITE_URL}/${locale}/library/${slug}/${page.id}`;
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': '3DModel',
        name: `${name} ${label}`,
        description: fill(t.item.dl.pageDesc, { name, size: label, dims: dimsLine(locale, page), mass: massText(locale, opt.massKg), thread: '' }),
        image: `${SITE_URL}${item.image}`,
        url,
        isAccessibleForFree: true,
        license: `${SITE_URL}/${locale}/license`,
        creator: { '@type': 'Organization', name: 'Monge' },
        encoding: FORMATS.map((f) => ({ '@type': 'MediaObject', contentUrl: `${SITE_URL}/api/files/${fileKey(slug, page.id, opt.id, f)}`, encodingFormat: { step: 'model/step', stl: 'model/stl', '3mf': 'model/3mf', glb: 'model/gltf-binary' }[f] })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: t.nav.library, item: `${SITE_URL}/${locale}/library` },
          { '@type': 'ListItem', position: 2, name: item.title[locale], item: `${SITE_URL}/${locale}/library/${slug}` },
          { '@type': 'ListItem', position: 3, name: label, item: url },
        ],
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <section className="content-frame pt-28 md:pt-32">
        <nav aria-label="Breadcrumbs" className="flex flex-wrap items-center gap-2 text-[14px] text-on-ink-muted">
          <Link href={localPath(locale, '/library')} className="hover:text-on-ink">
            {t.nav.library}
          </Link>
          <span aria-hidden="true">/</span>
          <Link href={localPath(locale, `/library/${slug}`)} className="hover:text-on-ink">
            {item.title[locale]}
          </Link>
        </nav>
        <PartConfigurator
          locale={locale}
          slug={slug}
          pages={dl.pages}
          pageId={page.id}
          navigate
          title={item.title[locale]}
          poster={item.image}
          finish={item.finish}
          view={item.view}
          rotate={item.rotate}
          t={t.item}
          viewer={t.item.viewer}
          licence={{ href: localPath(locale, '/license'), label: t.license.title, note: t.license.note }}
        >
          <Eyebrow>{t.library.categories[item.category]}</Eyebrow>
          <h1 className="mt-4 font-display text-[clamp(30px,3.8vw,46px)] leading-[1.05] font-semibold tracking-[-.02em] text-balance text-on-ink">
            {name} <span className="text-steel">{label}</span>
          </h1>
          <p className="mt-4 text-[15.5px] leading-relaxed text-on-ink-muted">{item.summary[locale]}</p>
          {tables.length ? (
            <div className="mt-6">
              <h2 className="text-[13px] font-medium text-on-ink-muted">{t.item.dl.dims}</h2>
              <div className="mt-2 grid gap-3">
                {tables.map(({ s, r }) => {
                  const cols = s.columns.filter((c) => !['size', 'name', 'lengths'].includes(c));
                  return (
                    <div key={s.id} className="overflow-x-auto rounded-lg border border-hairline-ink">
                      <Link href={localPath(locale, `/library/standards/${s.slug}`)} className="block border-b border-hairline-ink bg-ink-2 px-3 py-1.5 text-[12.5px] text-on-ink-muted hover:text-on-ink">
                        <span className="font-mono text-steel">{s.id}</span> {standardTitle(s, locale)}
                      </Link>
                      <table className="w-full border-collapse font-mono text-[12.5px] tabular-nums">
                        <thead>
                          <tr>
                            {cols.map((c) => (
                              <th key={c} scope="col" className="px-2.5 py-1.5 text-left font-normal whitespace-nowrap text-on-ink-muted">
                                {columnLabel(c) || c}
                                {unitOf(s, c) ? <span className="ml-1 opacity-60">{unitOf(s, c)}</span> : null}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            {cols.map((c) => (
                              <td key={c} className="px-2.5 py-1.5 whitespace-nowrap text-on-ink">
                                {formatCell(locale, r![c], c)}
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </PartConfigurator>
      </section>

      <section aria-labelledby="other-title" className="content-frame mt-16">
        <h2 id="other-title" className="font-display text-[22px] font-semibold text-on-ink">
          {t.item.dl.other}
        </h2>
        {siblings.length ? (
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {siblings.map((p) => (
              <li key={p.id}>
                <Link href={localPath(locale, `/library/${slug}/${p.id}`)} className="inline-block rounded-md border border-hairline-ink px-2 py-0.5 font-mono text-[12.5px] text-on-ink-muted hover:border-signal hover:text-signal">
                  {text(p.label, locale)}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
        {groups.length ? (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {groups.map((g) => {
              const first = dl.pages.find((p) => text(p.group, locale) === g)!;
              return (
                <li key={g}>
                  <Link href={localPath(locale, `/library/${slug}/${first.id}`)} className="inline-block rounded-full border border-hairline-ink-strong px-3 py-0.5 font-mono text-[12.5px] text-steel hover:border-steel">
                    {g || text(first.label, locale)}
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : null}
        <Link href={localPath(locale, `/library/${slug}`)} className="mt-6 inline-flex text-[14px] text-on-ink underline underline-offset-2 hover:text-signal">
          ← {item.title[locale]}
        </Link>
      </section>
    </>
  );
}
