import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Eyebrow } from '@/components/sections';
import { siteButtonVariants } from '@/components/site/Button';
import { TexturePreview } from '@/components/TexturePreview';
import { getDict, isLocale, locales, localPath } from '@/lib/i18n';
import { pageMetadata, SITE_URL } from '@/lib/seo';
import { fileUrl, fmtBytes, textureOf, textures } from '@/lib/textures';

/* One texture: a live 3D view of the downloaded maps, the renders it was checked by, the archives per resolution with
   their SHA-256 and the numbers measured when it was generated — and what the files do not claim. */
export const revalidate = 600;

export function generateStaticParams() {
  return locales.flatMap((locale) => textures.map((tx) => ({ locale, slug: tx.slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const tx = textureOf(slug);
  if (!isLocale(locale) || !tx) return {};
  const p = getDict(locale).texturesPage;
  return pageMetadata(locale, `/library/textures/${slug}`, tx.name, `${tx.name} — ${p.cardLead}`, `${SITE_URL}${fileUrl(tx.assets.tile)}`);
}

export default async function TexturePage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const tx = textureOf(slug);
  if (!isLocale(locale) || !tx) notFound();
  const t = getDict(locale);
  const p = t.texturesPage;
  const num = (v: number, d = 2) => v.toLocaleString(locale, { minimumFractionDigits: d, maximumFractionDigits: d });
  const facts: [string, string][] = [
    [p.facts.tile, `${num(tx.tile_mm, 0)} × ${num(tx.tile_mm, 0)} mm`],
    [tx.colour ? p.facts.baseAvg : p.facts.base, tx.base.map((c) => num(c)).join(' · ')],
    [p.facts.metal, num(tx.metal, 1)],
    [p.facts.rough, num(tx.rough_avg)],
    [p.facts.normal, num(tx.normal_rms)],
    [p.facts.made, p.facts.madeValue],
  ];

  return (
    <>
      <section className="relative overflow-hidden pt-32 pb-10 md:pt-36">
        <div className="hero-glow pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="content-frame relative">
          <Link href={localPath(locale, '/library/textures')} className="text-[14px] text-on-ink-muted hover:text-signal">
            ← {p.title}
          </Link>
          <div className="mt-6">
            <Eyebrow>{tx.slug}</Eyebrow>
          </div>
          <h1 className="mt-3 font-display text-[clamp(36px,5vw,64px)] leading-[1.02] font-semibold text-on-ink">{tx.name}</h1>
          {tx.finish ? <p className="mt-4 max-w-[70ch] text-[17px] leading-relaxed text-on-ink-muted">{tx.finish[locale]}</p> : null}
        </div>
      </section>

      <section className="content-frame grid gap-10 lg:grid-cols-[1.25fr_1fr]">
        <div>
          <TexturePreview
            normal={fileUrl(tx.assets.normal_gl)}
            roughness={fileUrl(tx.assets.roughness)}
            colour={tx.assets.color ? fileUrl(tx.assets.color) : undefined}
            base={tx.base}
            metal={tx.metal}
            tileMm={tx.tile_mm}
            alt={tx.name}
            poster={fileUrl(tx.assets.render_three)}
            labels={p.preview}
          />
          <p className="mt-3 text-[13px] text-on-ink-muted">{p.previewNote}</p>
        </div>

        <div>
          <h2 className="font-display text-[24px] font-semibold text-on-ink">{p.download}</h2>
          <p className="mt-1 text-[13.5px] text-on-ink-muted">{tx.colour ? p.filesColour : p.files}</p>
          <ul className="mt-5 grid gap-3">
            {tx.files.map((f) => (
              <li key={f.res} className="rounded-xl border border-hairline-ink-strong bg-ink-2/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span>
                    <span className="font-mono text-[18px] font-medium text-on-ink">{f.res.toUpperCase()}</span>
                    <span className="ml-2 font-mono text-[12.5px] text-on-ink-muted">
                      {f.px} × {f.px} px · {fmtBytes(f.bytes)}
                    </span>
                  </span>
                  <a href={fileUrl(f.key, true)} download className={siteButtonVariants({ variant: 'primary' })}>
                    {p.download} ZIP
                  </a>
                </div>
                <p className="mt-2 font-mono text-[11px] break-all text-on-ink-muted">
                  {p.sha} {f.sha256}
                </p>
              </li>
            ))}
          </ul>
          <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-hairline-ink-strong bg-hairline-ink-strong">
            {facts.map(([k, v]) => (
              <div key={k} className="bg-ink/90 px-4 py-3">
                <dt className="text-[12.5px] text-on-ink-muted">{k}</dt>
                <dd className="mt-1 font-mono text-[14px] text-on-ink">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-5 text-[13.5px] text-on-ink-muted">
            {p.licence}{' '}
            <Link href={localPath(locale, '/license')} className="text-on-ink underline-offset-4 hover:text-signal hover:underline">
              {p.licenceLink} →
            </Link>
          </p>
        </div>
      </section>

      <section className="content-frame mt-16 grid gap-6 md:grid-cols-3">
        {(
          [
            [tx.assets.render_monge, p.renders.monge],
            [tx.assets.render_three, p.renders.three],
            [tx.assets.tile, p.renders.tile],
          ] as const
        ).map(([src, cap]) => (
          <figure key={src} className="overflow-hidden rounded-xl border border-hairline-ink-strong bg-ink-2/60">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fileUrl(src)} alt={`${tx.name} — ${cap}`} width={960} height={746} loading="lazy" className="aspect-[4/3] w-full object-cover" />
            <figcaption className="px-4 py-3 text-[13px] text-on-ink-muted">{cap}</figcaption>
          </figure>
        ))}
      </section>

      <section className="content-frame mt-16 grid gap-10 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-[24px] font-semibold text-on-ink">{p.measured}</h2>
          <div className="mt-5 overflow-x-auto rounded-xl border border-hairline-ink-strong">
            <table className="w-full text-left text-[13.5px]">
              <thead className="bg-ink-2/80 text-on-ink-muted">
                <tr>
                  {[p.table.res, p.table.octaves, p.table.time, p.table.relief, p.table.size].map((h) => (
                    <th key={h} scope="col" className="px-4 py-2.5 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="font-mono text-on-ink">
                {tx.files.map((f) => (
                  <tr key={f.res} className="border-t border-hairline-ink">
                    <td className="px-4 py-2.5">{f.res.toUpperCase()}</td>
                    <td className="px-4 py-2.5">{f.octaves}</td>
                    <td className="px-4 py-2.5">{f.generate_ms} ms</td>
                    <td className="px-4 py-2.5">{num(f.relief_um, 1)} µm</td>
                    <td className="px-4 py-2.5">{fmtBytes(f.bytes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <h2 className="font-display text-[24px] font-semibold text-on-ink">{p.honestTitle}</h2>
          <ul className="mt-5 grid gap-3">
            {p.honest.map((line) => (
              <li key={line} className="flex gap-3 text-[14.5px] leading-relaxed text-on-ink-muted">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-signal" aria-hidden="true" />
                {line}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
