import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageHero } from '@/components/sections';
import { getDict, isLocale } from '@/lib/i18n';
import { pageMetadata, SITE_URL } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDict(locale);
  return pageMetadata(locale, '/developers', t.developers.title, t.developers.lead);
}

const code = 'block overflow-x-auto rounded-lg border border-hairline-ink-strong bg-ink-2 px-4 py-3 font-mono text-[12.5px] leading-relaxed text-on-ink';

export default async function DevelopersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDict(locale);
  const d = t.developers;
  const api = `${SITE_URL}/api/v1`;
  const endpoints: [string, string, string][] = [
    ['GET /api/v1', 'index', `${api}`],
    ['GET /api/v1/models?q=…', 'search', `${api}/models?q=ISO%204017%20M12x60%20real%20thread%20STEP&locale=${locale}`],
    ['GET /api/v1/models?size=&length=&thread=&format=&standard=&category=&locale=&limit=&cursor=', 'filters', `${api}/models?standard=ISO%204017&size=M12&length=60&thread=exact&format=step`],
    ['GET /api/v1/models/{id}', 'model', `${api}/models/bolt-iso-4017--m12-x-60--exact?locale=${locale}`],
    ['GET /api/v1/catalog', 'families', `${api}/catalog?locale=${locale}`],
    ['GET /api/v1/catalog?family={id}', 'sizes', `${api}/catalog?family=bearing-iso-15&locale=${locale}`],
  ];
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'WebAPI',
    name: 'Monge Catalog API',
    description: d.lead,
    documentation: `${SITE_URL}/${locale}/developers`,
    url: api,
    provider: { '@type': 'Organization', name: 'Monge', url: SITE_URL },
    termsOfService: `${SITE_URL}/${locale}/license`,
    isAccessibleForFree: true,
  };
  const section = 'content-frame mt-12 grid gap-4 border-t border-hairline-ink-strong pt-8 lg:grid-cols-[1fr_2fr] lg:gap-12';
  const h2 = 'font-display text-[24px] leading-tight font-semibold text-on-ink';
  const p = 'max-w-[72ch] text-[16px] leading-relaxed text-on-ink-muted';
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <PageHero eyebrow="Monge Catalog API · v1" title={d.title} lead={d.lead} />
      <section className="content-frame">
        <h2 className={h2}>{d.endpoints}</h2>
        <ul className="mt-5 grid gap-3">
          {endpoints.map(([sig, , href]) => (
            <li key={sig} className="grid gap-1.5">
              <code className="font-mono text-[13.5px] text-steel">{sig}</code>
              <a href={href} className={`${code} hover:border-signal`}>
                {href}
              </a>
            </li>
          ))}
        </ul>
      </section>
      <section className={section}>
        <h2 className={h2}>{d.query}</h2>
        <p className={p}>{d.queryText}</p>
      </section>
      <section className={section}>
        <h2 className={h2}>{d.match}</h2>
        <div className="grid gap-3">
          <p className={p}>{d.matchText}</p>
          <pre className={code}>{`GET /api/v1/models?q=ISO 4017 M12x60 real thread STEP
{
  "match": "exact",
  "total": 1,
  "results": [{
    "id": "bolt-iso-4017--m12-x-60--exact",
    "name": "Bolt ISO 4017 M12 × 60 — real thread",
    "url": "${SITE_URL}/en/library/bolt-iso-4017/m12-x-60?option=exact",
    "standard": { "id": "ISO 4017", "edition": "2026-11-14", … },
    "dimensions": { "nominal_diameter_mm": 12, "thread_pitch_mm": 1.75, "length_mm": 60, "overall_mm": [67.5, 20.8, 18] },
    "thread": { "type": "exact" },
    "verification": { "geometry": { "kernel_body_report": true, "step_read_back": true, … }, … },
    "image": { "url": "…/m12-x-60.webp" },
    "glb": "…/bolt-iso-4017-m12-x-60-exact.glb",
    "files": [{ "format": "step", "url": "…", "bytes": …, "sha256": "…" }, …],
    "license": { "url": "${SITE_URL}/en/license" }
  }]
}`}</pre>
        </div>
      </section>
      <section className={section}>
        <h2 className={h2}>{d.record}</h2>
        <p className={p}>{d.recordText}</p>
      </section>
      <section className={section}>
        <h2 className={h2}>{d.checks}</h2>
        <p className={p}>{d.checksText}</p>
      </section>
      <section className={section}>
        <h2 className={h2}>{d.files}</h2>
        <div className="grid gap-3">
          <p className={p}>{d.filesText}</p>
          <pre className={code}>{`curl -I  ${SITE_URL}/api/files/downloads/bolt-iso-4017/m12-x-60/exact/bolt-iso-4017-m12-x-60-exact.step
curl -OJ "${SITE_URL}/api/files/downloads/bolt-iso-4017/m12-x-60/exact/bolt-iso-4017-m12-x-60-exact.step?download=1"`}</pre>
        </div>
      </section>
      <section className={section}>
        <h2 className={h2}>{d.limits}</h2>
        <p className={p}>{d.limitsText}</p>
      </section>
      <section className={section}>
        <h2 className={h2}>{d.ai}</h2>
        <p className={p}>
          {d.aiText}{' '}
          <a href="/llms.txt" className="text-on-ink underline underline-offset-2 hover:text-signal">
            /llms.txt
          </a>
          {' · '}
          <a href={`/${locale}/mcp`} className="text-on-ink underline underline-offset-2 hover:text-signal">
            Monge MCP ({SITE_URL}/mcp)
          </a>
        </p>
      </section>
    </>
  );
}
