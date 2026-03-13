'use client';

import { useState, useEffect, useRef } from 'react';
import { Link } from '@/i18n/routing';
import { Shield, FileText, Cookie } from 'lucide-react';

const ICON_MAP = {
  shield: Shield,
  fileText: FileText,
  cookie: Cookie,
} as const;

type IconName = keyof typeof ICON_MAP;

interface Section {
  id: string;
  title: string;
  text: string;
  items?: string[];
  extra?: string;
}

interface RelatedLink {
  href: string;
  label: string;
}

interface LegalPageLayoutProps {
  iconName: IconName;
  title: string;
  lastUpdated: string;
  intro: string;
  sections: Section[];
  relatedLabel: string;
  relatedLinks: RelatedLink[];
}

export function LegalPageLayout({
  iconName,
  title,
  lastUpdated,
  intro,
  sections,
  relatedLabel,
  relatedLinks,
}: LegalPageLayoutProps) {
  const Icon = ICON_MAP[iconName];
  const [activeId, setActiveId] = useState<string>('');
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Scroll spy with IntersectionObserver
  useEffect(() => {
    const sectionEls = sections
      .map((s) => document.getElementById(s.id))
      .filter(Boolean) as HTMLElement[];

    if (!sectionEls.length) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Find the first visible section from top
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: '-80px 0px -60% 0px',
        threshold: 0,
      }
    );

    sectionEls.forEach((el) => observerRef.current?.observe(el));

    return () => observerRef.current?.disconnect();
  }, [sections]);

  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-6 py-8 sm:py-16">
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8 lg:gap-12">
        {/* ── Sidebar navigation ── */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Icon className="h-4 w-4 text-primary" strokeWidth={1.5} />
              </div>
              <span className="text-sm font-semibold tracking-tight">{title}</span>
            </div>
            <nav className="space-y-0.5">
              {sections.map((s, i) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={[
                    'group flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[13px] transition-all duration-200',
                    activeId === s.id
                      ? 'bg-primary/8 text-foreground font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'font-mono text-[11px] tabular-nums transition-colors',
                      activeId === s.id ? 'text-primary' : 'text-muted-foreground/50 group-hover:text-muted-foreground',
                    ].join(' ')}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="truncate">{s.title}</span>
                </a>
              ))}
            </nav>

            {/* Related links in sidebar */}
            <div className="mt-6 pt-4 border-t border-border">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground/60 mb-2 px-2.5">
                {relatedLabel}
              </p>
              {relatedLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block px-2.5 py-1.5 text-[13px] text-muted-foreground hover:text-primary transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </aside>

        {/* ── Main content ── */}
        <article className="min-w-0">
          {/* Header */}
          <header className="mb-10">
            <div className="flex items-center gap-3 mb-4 lg:hidden">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Icon className="h-6 w-6 text-primary" strokeWidth={1.5} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                {title}
              </h1>
            </div>
            <h1 className="hidden lg:block text-2xl sm:text-3xl font-semibold tracking-tight mb-2">
              {title}
            </h1>
            <p className="text-sm text-muted-foreground">{lastUpdated}</p>
            <p className="text-muted-foreground leading-relaxed mt-4">{intro}</p>
          </header>

          {/* Sections */}
          <div className="space-y-12">
            {sections.map((section, i) => (
              <section key={section.id} id={section.id} className="scroll-mt-24">
                <h2 className="text-lg sm:text-xl font-semibold mb-3 flex items-baseline gap-2.5">
                  <span className="text-primary/50 text-sm font-mono tabular-nums">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {section.title}
                </h2>
                <div className="text-muted-foreground leading-relaxed mb-4 space-y-2">
                  {section.text.split('\n').map((line, k) => (
                    <p key={k}>{line}</p>
                  ))}
                </div>
                {section.items && section.items.length > 0 && (
                  <ul className="space-y-2 ml-0.5">
                    {section.items.map((item, j) => (
                      <li
                        key={j}
                        className="flex items-start gap-2.5 text-muted-foreground text-sm leading-relaxed"
                      >
                        <span className="shrink-0 mt-2 h-1.5 w-1.5 rounded-full bg-primary/30" />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
                {section.extra && (
                  <div className="mt-4 p-4 rounded-lg bg-muted/40 border border-border text-sm text-muted-foreground leading-relaxed space-y-1">
                    {section.extra.split('\n').map((line, k) => (
                      <p key={k}>
                        {line.startsWith('http') ? (
                          <a
                            href={line}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline underline-offset-2"
                          >
                            {line}
                          </a>
                        ) : (
                          line
                        )}
                      </p>
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>

          {/* Mobile-only related links */}
          <div className="mt-14 pt-8 border-t border-border lg:hidden">
            <p className="text-sm text-muted-foreground mb-3">{relatedLabel}</p>
            <div className="flex flex-wrap gap-3">
              {relatedLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-primary hover:underline underline-offset-2"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
