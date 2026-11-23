import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHero } from '@/components/sections';
import { getDict, isLocale, localPath } from '@/lib/i18n';
import { pageMetadata } from '@/lib/seo';
import { fileUrl, fmtBytes, textures } from '@/lib/textures';

/* The texture library: Monge's own procedural surfaces, each in 1K, 2K and 4K. */
export const revalidate = 600;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDict(locale);
  return pageMetadata(locale, '/library/textures', t.texturesPage.title, t.texturesPage.lead);
}

export default async function TexturesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDict(locale);
  const p = t.texturesPage;

  return (
    <>
      <PageHero eyebrow={p.eyebrow} title={p.title} lead={p.lead} />
      <section className="content-frame">
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {textures.map((tx) => (
            <li key={tx.slug}>
              <Link
                href={localPath(locale, `/library/textures/${tx.slug}`)}
                className="group block overflow-hidden rounded-xl border border-hairline-ink-strong bg-ink-2/60 transition-colors hover:border-signal"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={fileUrl(tx.assets.tile)} alt="" width={960} height={622} loading="lazy" className="aspect-[3/2] w-full object-cover" />
                <span className="block p-5">
                  <span className="block font-display text-[20px] font-semibold text-on-ink group-hover:text-signal">{tx.name}</span>
                  <span className="mt-1 block font-mono text-[12px] text-on-ink-muted">
                    {tx.slug} · {tx.files.map((f) => f.res.toUpperCase()).join(' / ')} · {fmtBytes(tx.files[0].bytes)}–{fmtBytes(tx.files[tx.files.length - 1].bytes)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-8 max-w-3xl text-[14px] text-on-ink-muted">{p.soon}</p>
      </section>
    </>
  );
}
