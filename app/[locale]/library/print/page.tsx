import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHero } from '@/components/sections';
import { downloadsOf, text } from '@/lib/downloads';
import { getDict, isLocale, localPath } from '@/lib/i18n';
import { getItems } from '@/lib/library';
import { pageMetadata } from '@/lib/seo';
import { fmtNum } from '@/lib/status';

/* The library for 3D printing: the threaded parts with the print option — the real thread with an allowance, laid on
   the bed the best way, Monge's FDM print check on each size. */
export const revalidate = 600;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDict(locale);
  return pageMetadata(locale, '/library/print', t.printPage.title, t.printPage.lead);
}

type Mark = 'clean' | 'support' | 'thin';
const dot: Record<Mark, string> = { clean: 'bg-signal', support: 'bg-[#ffb648]', thin: 'bg-[#ff6b5b]' };

export default async function PrintPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDict(locale);
  const p = t.printPage;
  const items = (await getItems()).filter((i) => downloadsOf(i.slug)?.pages.some((pg) => pg.options.some((o) => o.print)));
  const parts = items.map((item) => {
    const pages = downloadsOf(item.slug)!.pages.flatMap((pg) => {
      const o = pg.options.find((x) => x.print);
      if (!o?.print) return [];
      const mark: Mark = o.print.wall < 0.8 ? 'thin' : o.print.ok ? 'clean' : 'support';
      return [{ pg, mark }];
    });
    return { item, pages };
  });
  const all = parts.flatMap((x) => x.pages);
  const count = (m: Mark) => all.filter((x) => x.mark === m).length;
  const stats: [string, string][] = [
    [fmtNum(locale, all.length), p.stats.sizes],
    [fmtNum(locale, count('clean')), p.stats.clean],
    [fmtNum(locale, count('support')), p.stats.support],
    [fmtNum(locale, count('thin')), p.stats.thin],
  ];

  return (
    <>
      <PageHero eyebrow={t.nav.library} title={p.title} lead={p.lead} />
      <section className="content-frame">
        <dl className="grid max-w-4xl grid-cols-2 gap-px overflow-hidden rounded-xl border border-hairline-ink-strong bg-hairline-ink-strong md:grid-cols-4">
          {stats.map(([n, label]) => (
            <div key={label} className="bg-ink/90 px-5 py-4">
              <dt className="sr-only">{label}</dt>
              <dd>
                <span className="block font-mono text-[30px] leading-none font-medium text-on-ink tabular-nums">{n}</span>
                <span className="mt-2 block text-[13.5px] leading-snug text-on-ink-muted">{label}</span>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="how-title" className="content-frame mt-16">
        <h2 id="how-title" className="font-display text-[clamp(28px,3.4vw,40px)] font-semibold text-on-ink">
          {p.howTitle}
        </h2>
        <ol className="mt-6 grid gap-5 md:grid-cols-3">
          {p.how.map(([title, body], i) => (
            <li key={title} className="rounded-xl border border-hairline-ink-strong bg-ink-2/70 p-5">
              <span className="font-mono text-[12px] text-steel">0{i + 1}</span>
              <h3 className="mt-2 font-display text-[20px] font-semibold text-on-ink">{title}</h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-on-ink-muted">{body}</p>
            </li>
          ))}
        </ol>
        <p className="mt-5 max-w-3xl text-[13.5px] text-on-ink-muted">{p.note}</p>
      </section>

      <section aria-labelledby="list-title" className="content-frame mt-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="list-title" className="font-display text-[clamp(26px,3vw,36px)] font-semibold text-on-ink">
            {p.listTitle}
          </h2>
          <ul className="flex flex-wrap gap-4 text-[13px] text-on-ink-muted">
            {(['clean', 'support', 'thin'] as Mark[]).map((m) => (
              <li key={m} className="flex items-center gap-2">
                <span className={`size-2 rounded-full ${dot[m]}`} aria-hidden="true" />
                {p.legend[m]}
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-6 grid gap-6">
          {parts.map(({ item, pages }) => (
            <section key={item.slug} aria-label={item.title[locale]} className="rounded-xl border border-hairline-ink-strong bg-ink-2/60 p-5">
              <div className="flex flex-wrap items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image} alt="" width={96} height={72} loading="lazy" className="h-[54px] w-[72px] object-contain" />
                <Link href={localPath(locale, `/library/${item.slug}`)} className="font-display text-[20px] font-semibold text-on-ink hover:text-signal">
                  {item.title[locale]}
                </Link>
                <span className="font-mono text-[12px] text-on-ink-muted">{pages.length}</span>
              </div>
              <ul className="mt-4 flex flex-wrap gap-1.5">
                {pages.map(({ pg, mark }) => (
                  <li key={pg.id}>
                    <Link
                      href={localPath(locale, `/library/${item.slug}/${pg.id}`)}
                      title={p.legend[mark]}
                      className="inline-flex items-center gap-1.5 rounded-md border border-hairline-ink px-2 py-0.5 font-mono text-[12px] text-on-ink-muted transition-colors hover:border-signal hover:text-on-ink"
                    >
                      <span className={`size-1.5 rounded-full ${dot[mark]}`} aria-hidden="true" />
                      {text(pg.label, locale)}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </section>
    </>
  );
}
