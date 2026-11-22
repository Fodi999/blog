import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHero } from '@/components/sections';
import { isLocale, localPath } from '@/lib/i18n';
import { MCP_CURL, MCP_DOCS, MCP_INSPECTOR, MCP_STDIO, MCP_URL } from '@/lib/mcp-docs';
import { pageMetadata, SITE_URL } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = MCP_DOCS[locale];
  return pageMetadata(locale, '/mcp', d.title, d.lead);
}

const code = 'block overflow-x-auto rounded-lg border border-hairline-ink-strong bg-ink-2 px-4 py-3 font-mono text-[12.5px] leading-relaxed whitespace-pre text-on-ink';
const section = 'content-frame mt-12 grid gap-4 border-t border-hairline-ink-strong pt-8 lg:grid-cols-[1fr_2fr] lg:gap-12';
const h2 = 'font-display text-[24px] leading-tight font-semibold text-on-ink';
const p = 'max-w-[72ch] text-[16px] leading-relaxed text-on-ink-muted';
const link = 'text-on-ink underline underline-offset-2 hover:text-signal';

export default async function McpPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const d = MCP_DOCS[locale];
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'WebAPI',
    name: 'Monge MCP',
    description: d.lead,
    documentation: `${SITE_URL}/${locale}/mcp`,
    url: MCP_URL,
    provider: { '@type': 'Organization', name: 'Monge', url: SITE_URL },
    termsOfService: `${SITE_URL}/${locale}/license`,
    isAccessibleForFree: true,
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <PageHero eyebrow="Monge MCP · Model Context Protocol" title={d.title} lead={d.lead} />

      <section className="content-frame">
        <h2 className="text-[13.5px] text-on-ink-muted">{d.endpoint}</h2>
        <code className="mt-2 inline-block rounded-lg border border-signal/45 bg-ink-2 px-4 py-2.5 font-mono text-[18px] text-signal select-all">{MCP_URL}</code>
        <dl className="mt-6 grid max-w-5xl grid-cols-1 gap-px overflow-hidden rounded-xl border border-hairline-ink-strong bg-hairline-ink-strong sm:grid-cols-2">
          {d.facts.map(([k, v]) => (
            <div key={k} className="bg-ink/90 px-5 py-3.5">
              <dt className="text-[12.5px] text-on-ink-muted">{k}</dt>
              <dd className="mt-1 text-[15px] text-on-ink">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={section}>
        <h2 className={h2}>{d.toolsTitle}</h2>
        <ul className="grid gap-5">
          {d.tools.map(([name, text]) => (
            <li key={name}>
              <code className="font-mono text-[15px] text-steel">{name}</code>
              <p className={`${p} mt-1.5`}>{text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className={section}>
        <h2 className={h2}>{d.tryTitle}</h2>
        <div>
          <p className={p}>{d.tryLead}</p>
          <ul className="mt-3 grid gap-2">
            {d.asks.map((a) => (
              <li key={a} className="rounded-lg border border-hairline-ink px-4 py-2.5 text-[15px] text-on-ink">
                «{a}»
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={section}>
        <h2 className={h2}>{d.connectTitle}</h2>
        <div className="grid gap-6">
          {d.connect.map(([client, how, cfg]) => (
            <div key={client} className="grid gap-2">
              <h3 className="text-[17px] font-semibold text-on-ink">{client}</h3>
              <p className={p}>{how}</p>
              <pre className={code}>{cfg}</pre>
            </div>
          ))}
          <div className="grid gap-2">
            <p className={p}>{d.stdioNote}</p>
            <pre className={code}>{MCP_STDIO}</pre>
          </div>
        </div>
      </section>

      <section className={section}>
        <h2 className={h2}>{d.checkTitle}</h2>
        <div className="grid gap-3">
          <p className={p}>{d.checkLead}</p>
          <pre className={code}>{MCP_INSPECTOR}</pre>
          <pre className={code}>{MCP_CURL}</pre>
        </div>
      </section>

      <section className={section}>
        <h2 className={h2}>{d.rulesTitle}</h2>
        <ul className="grid list-disc gap-2 pl-5 marker:text-on-ink-muted">
          {d.rules.map((r) => (
            <li key={r} className={p}>
              {r}
            </li>
          ))}
          <li className={p}>
            <Link href={localPath(locale, '/license')} className={link}>
              {localPath(locale, '/license')}
            </Link>{' '}
            ·{' '}
            <Link href={localPath(locale, '/terms')} className={link}>
              {localPath(locale, '/terms')}
            </Link>{' '}
            ·{' '}
            <Link href={localPath(locale, '/contact')} className={link}>
              {localPath(locale, '/contact')}
            </Link>
          </li>
        </ul>
      </section>

      <section className={section}>
        <h2 className={h2}>{d.registryTitle}</h2>
        <div className="grid gap-3">
          <p className={p}>{d.registry}</p>
          <p className={p}>
            <Link href={localPath(locale, '/developers')} className={link}>
              {d.apiLink} →
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
