import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LibraryGrid } from '@/components/LibraryGrid';
import { PageHero } from '@/components/sections';
import { getDict, isLocale } from '@/lib/i18n';
import { getItems } from '@/lib/library';
import { pageMetadata } from '@/lib/seo';

export const revalidate = 600;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDict(locale);
  return pageMetadata(locale, '/library', t.library.title, t.library.lead);
}

export default async function LibraryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDict(locale);
  const items = await getItems();

  return (
    <>
      <PageHero eyebrow={t.nav.library} title={t.library.title} lead={t.library.lead} />
      <section className="content-frame">
        <LibraryGrid items={items} locale={locale} t={t.library} />

        <div className="mt-16 rounded-3xl border border-dashed border-hairline-ink-strong p-7" data-reveal>
          <h2 className="font-mono text-[12px] tracking-[.14em] text-steel uppercase">{t.library.soonTitle}</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {t.library.soon.map((s) => (
              <span key={s} className="rounded-full border border-hairline-ink px-4 py-2 text-[14px] text-on-ink-muted">
                {s}
              </span>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
