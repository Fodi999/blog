'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSyncExternalStore } from 'react';
import { siteButtonVariants } from '@/components/site/Button';

type Text = { title: string; text: string; cta: string };

/** The not-found page in the language of the address: /ru/… in Russian, /en/… in English, anything else in Polish
    (not-found.tsx gets no params, so the language is read from the path in the browser). */
export function NotFoundText({ texts, fallback }: { texts: Record<string, Text>; fallback: string }) {
  // (the router gives no path to a not-found page rendered for a missing item — the browser's own address does;
  // on the server there is none, and the page is written in the fallback language until it is in the browser)
  const routed = usePathname() ?? '';
  const address = useSyncExternalStore(
    () => () => {},
    () => window.location.pathname,
    () => '',
  );
  const first = (address || routed).split('/')[1] ?? '';
  const locale = first in texts ? first : fallback;
  const t = texts[locale];
  return (
    <>
      <h1 className="relative mt-5 max-w-[16ch] font-display text-[clamp(40px,7vw,88px)] leading-[1.02] font-semibold tracking-[-.03em] text-on-ink">{t.title}</h1>
      <p className="relative mt-5 text-[18px] text-on-ink-muted">{t.text}</p>
      <Link className={`${siteButtonVariants({ variant: 'primary' })} relative mt-9 w-max`} href={`/${locale}`}>
        {t.cta}
      </Link>
    </>
  );
}
